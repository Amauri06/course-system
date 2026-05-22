import React, { useState } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  User,
  Printer,
  FileDown,
  Coins,
  ShieldCheck,
  Wallet,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingDown,
  Receipt,
  Hash,
  ArrowRight
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { formatCurrency } from '../utils/formatters';
import type { Student, Payment } from '../types';

// ==========================================
// Helper functions for quincena tracking
// ==========================================
const getNextDueDate = (): Date => {
  const now = new Date();
  if (now.getDate() <= 15) return new Date(now.getFullYear(), now.getMonth(), 15);
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

const getNextDueDateLabel = (): string => {
  const d = getNextDueDate();
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const getQuincenaFromDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const day = d.getDate();
  const period = day <= 15 ? '1ra' : '2da';
  return `${period} quincena ${months[d.getMonth()]}`;
};

const getExpectedQuincenas = (enrollmentISO: string): number => {
  const start = new Date(enrollmentISO);
  const now = new Date();
  let count = 0;
  const startM = start.getFullYear() * 12 + start.getMonth();
  const endM = now.getFullYear() * 12 + now.getMonth();
  for (let t = startM; t <= endM; t++) {
    const y = Math.floor(t / 12);
    const m = t % 12;
    const d15 = new Date(y, m, 15);
    if (d15 > start && d15 <= now) count++;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const dLast = new Date(y, m, lastDay);
    if (dLast > start && dLast <= now) count++;
  }
  return count;
};

const getStudentStatus = (
  student: Student,
  payments: Payment[]
): { label: string; variant: 'success' | 'danger' | 'info' } => {
  if (student.balancePendiente === 0) {
    return { label: 'Pagado', variant: 'success' };
  }
  const expected = getExpectedQuincenas(student.fechaInscripcion);
  if (expected === 0) {
    return { label: 'Recién inscrito', variant: 'info' };
  }
  const totalPaid = payments
    .filter(p => p.estudianteId === student.id)
    .reduce((sum, p) => sum + p.montoPagado, 0);
  const expectedMin = expected * 250;
  if (totalPaid >= expectedMin) {
    return { label: 'Al día', variant: 'success' };
  }
  const deficit = expectedMin - totalPaid;
  const cuotas = Math.ceil(deficit / 250);
  return { label: `Atrasado (${cuotas} cuota${cuotas > 1 ? 's' : ''})`, variant: 'danger' };
};

export const Payments: React.FC = () => {
  const { students, courses, payments, registerPayment } = useAcademyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [montoPagado, setMontoPagado] = useState(0);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [referenciaTransferencia, setReferenciaTransferencia] = useState('');

  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'ticket' | 'fullpage'>('fullpage');
  const [error, setError] = useState('');

  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nombreCompleto.toLowerCase().includes(term) ||
      s.matricula.toLowerCase().includes(term) ||
      (s.cedula && s.cedula.includes(term))
    );
  });

  const selectedCourse = selectedStudent
    ? courses.find((c) => c.id === selectedStudent.cursoId)
    : null;

  const studentPayments = selectedStudent
    ? payments
        .filter((p) => p.estudianteId === selectedStudent.id)
        .sort((a, b) => new Date(b.fecha + ' ' + b.hora).getTime() - new Date(a.fecha + ' ' + a.hora).getTime())
    : [];

  const totalPaid = studentPayments.reduce((sum, p) => sum + p.montoPagado, 0);
  const courseCost = selectedCourse?.costo ?? 0;
  const progressPct = courseCost > 0 ? Math.min(100, Math.round((totalPaid / courseCost) * 100)) : 0;

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchTerm(student.nombreCompleto);
    setIsDropdownOpen(false);
    setMontoPagado(250);
    setMontoRecibido(250);
    setMetodoPago('efectivo');
    setReferenciaTransferencia('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedStudent) {
      setError('Debe seleccionar un estudiante.');
      return;
    }

    if (montoPagado <= 0) {
      setError('El monto a cobrar debe ser mayor a cero.');
      return;
    }

    if (montoPagado > selectedStudent.balancePendiente) {
      setError(`El monto no puede exceder el balance pendiente (${formatCurrency(selectedStudent.balancePendiente)}).`);
      return;
    }

    if (metodoPago === 'transferencia' && !referenciaTransferencia.trim()) {
      setError('Debe especificar la referencia de transferencia.');
      return;
    }

    if (montoRecibido < montoPagado) {
      setError(`El monto recibido (${formatCurrency(montoRecibido)}) no puede ser menor al monto a cobrar (${formatCurrency(montoPagado)}).`);
      return;
    }

    try {
      const invoice = registerPayment(
        selectedStudent.id,
        montoPagado,
        metodoPago,
        referenciaTransferencia || undefined
      );

      setGeneratedInvoice({ ...invoice, montoRecibido, vuelta: montoRecibido - montoPagado });
      setIsInvoiceModalOpen(true);
      setTimeout(() => window.print(), 500);
      setSearchTerm('');
      setMontoPagado(250);
      setMontoRecibido(250);
      setMetodoPago('efectivo');
      setReferenciaTransferencia('');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al registrar el pago.');
    }
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1.5 no-prit">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-sm border border-emerald-200">
            <Wallet className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
              Cobros
            </h1>
            <p className="text-sm font-semibold text-slate-400 mt-0.5">
              Busca un estudiante y registra sus pagos quincenales
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="no-print">
        <div className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
              <ShieldCheck className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Buscar Estudiante
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4.5 h-4.5" />
              </div>
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  if (!e.target.value) setSelectedStudent(null);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder="Buscar por nombre, matrícula (MAT-2026-0001) o cédula..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:ring-emerald-100 focus:border-emerald-500 rounded-xl text-slate-800 text-sm transition-all duration-200 focus:outline-hidden focus:ring-4"
              />
            </div>

            {isDropdownOpen && searchTerm && (
              <div className="absolute top-[104px] left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1.5">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const course = courses.find((c) => c.id === s.cursoId);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                        onMouseDown={() => handleSelectStudent(s)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 flex items-center justify-center text-xs font-black shrink-0 border border-brand-200">
                          {s.nombreCompleto.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 truncate">{s.nombreCompleto}</div>
                          <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-2">
                            <span>{s.matricula}</span>
                            <span>•</span>
                            <span>{course?.nombre || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-slate-400">Balance</div>
                          <div className={`text-sm font-black ${s.balancePendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatCurrency(s.balancePendiente)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-500 font-semibold">
                    No se encontraron estudiantes con ese criterio.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Next Due Banner */}
      <Card className="no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-sm border border-brand-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-700">Próximo vencimiento: {getNextDueDateLabel()}</span>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                {students.filter(s => s.balancePendiente > 0).length} estudiantes con balance pendiente
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              Total pendiente: {formatCurrency(students.reduce((sum, s) => sum + s.balancePendiente, 0))}
            </span>
          </div>
        </div>
      </Card>

      {/* Pending students list when no student selected */}
      {!selectedStudent && (
        <Card className="no-print" title="Estudiantes con Balance Pendiente" subtitle={`${students.filter(s => s.balancePendiente > 0).length} estudiante(s)`}>
          <div className="divide-y divide-slate-50">
            {students
              .filter(s => s.balancePendiente > 0)
              .sort((a, b) => b.balancePendiente - a.balancePendiente)
              .length > 0 ? (
              students
                .filter(s => s.balancePendiente > 0)
                .sort((a, b) => b.balancePendiente - a.balancePendiente)
                .slice(0, 10)
                .map((s) => {
                  const course = courses.find((c) => c.id === s.cursoId);
                  const status = getStudentStatus(s, payments);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left px-2 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center text-sm font-black shrink-0 border border-slate-200">
                        {s.nombreCompleto.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate">{s.nombreCompleto}</div>
                        <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-2">
                          <span>{s.matricula}</span>
                          <span>•</span>
                          <span>{course?.nombre || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="text-sm font-black text-rose-600">{formatCurrency(s.balancePendiente)}</div>
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  );
                })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mb-2" />
                <span className="text-xs font-bold text-emerald-600">¡Todos al día!</span>
                <p className="text-[10px] text-slate-300 mt-1">No hay estudiantes con balance pendiente.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Student Dashboard */}
      {selectedStudent && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 no-print">
          {/* Left: Student Info + History */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-7 py-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-black border border-white/20 shadow-lg shrink-0">
                    {selectedStudent.nombreCompleto.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-white font-black text-lg tracking-tight">{selectedStudent.nombreCompleto}</span>
                      <Badge variant={getStudentStatus(selectedStudent, payments).variant} size="sm">
                        {getStudentStatus(selectedStudent, payments).label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-300 font-semibold">
                      <span>{selectedStudent.matricula}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-500" />
                      <span>{selectedCourse?.nombre || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Inscrito: {new Date(selectedStudent.fechaInscripcion).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedStudent.horario}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-50">
                <div className="p-5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo Curso</span>
                  <div className="text-lg font-black text-slate-800 mt-1">{formatCurrency(courseCost)}</div>
                </div>
                <div className="p-5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pagado</span>
                  <div className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</div>
                </div>
                <div className="p-5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</span>
                  <div className={`text-lg font-black mt-1 ${selectedStudent.balancePendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(selectedStudent.balancePendiente)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-7 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progreso de pago</span>
                  <span className="text-sm font-black text-slate-700">{progressPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      progressPct === 100 ? 'bg-emerald-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {progressPct === 100 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Curso pagado completamente</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <Card title="Historial de Pagos" subtitle={`${studentPayments.length} registro(s)`}>
              {studentPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <Receipt className="w-8 h-8 text-slate-200 mb-2" />
                  <span className="text-xs font-bold">No hay pagos registrados aún</span>
                  <p className="text-[10px] text-slate-300 mt-1">
                    Utiliza el formulario de la derecha para registrar el primer pago.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100">
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 pr-4"># Recibo</th>
                        <th className="pb-3 pr-4">Fecha</th>
                        <th className="pb-3 pr-4">Método</th>
                        <th className="pb-3 pr-4">Referencia</th>
                        <th className="pb-3 pr-4 text-right">Monto</th>
                        <th className="pb-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {studentPayments.map((p) => (
                        <tr key={p.id} className="text-xs text-slate-600 font-semibold hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 pr-4">
                            <span className="font-mono font-bold text-slate-800">{p.id}</span>
                          </td>
                          <td className="py-3 pr-4 text-slate-500">
                            {p.fecha} <span className="text-slate-400">{p.hora}</span>
                            <span className="block text-[10px] font-medium text-brand-500">{getQuincenaFromDate(p.fecha)}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={p.metodoPago === 'efectivo' ? 'success' : 'info'} size="sm">
                              {p.metodoPago}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 font-mono text-slate-400">
                            {p.referenciaTransferencia || '—'}
                          </td>
                          <td className="py-3 pr-4 text-right font-extrabold text-emerald-600">
                            +{formatCurrency(p.montoPagado)}
                          </td>
                          <td className="py-3 text-right font-extrabold text-slate-800">
                            {formatCurrency(p.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Payment Form */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white border border-white/20">
                    <Coins className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-sm">Registrar Pago</span>
                    <p className="text-emerald-100 text-[10px] font-semibold">Pago quincenal</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                {selectedStudent.balancePendiente === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-300 mb-3" />
                    <span className="text-sm font-bold text-emerald-700">¡Curso pagado!</span>
                    <p className="text-xs text-slate-500 mt-1">Este estudiante no tiene balance pendiente.</p>
                  </div>
                ) : (
                  <>
                    {/* Current balance reminder */}
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700">Balance pendiente</span>
                      <span className="text-base font-black text-rose-600">{formatCurrency(selectedStudent.balancePendiente)}</span>
                    </div>

                    <Select
                      label="Método de Pago"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value as 'efectivo' | 'transferencia')}
                      options={[
                        { value: 'efectivo', label: 'Efectivo' },
                        { value: 'transferencia', label: 'Transferencia Bancaria' }
                      ]}
                    />

                    <Input
                      label="Monto a Cobrar ($)"
                      type="number"
                      value={montoPagado}
                      onChange={(e) => setMontoPagado(Number(e.target.value))}
                      placeholder="250"
                      icon={<Coins className="w-4.5 h-4.5 text-slate-400" />}
                      required
                    />

                    <Input
                      label="Monto Recibido ($)"
                      type="number"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(Number(e.target.value))}
                      placeholder="250"
                      icon={<Coins className="w-4.5 h-4.5 text-slate-400" />}
                      required
                    />

                    {montoRecibido >= montoPagado && montoRecibido > 0 && (
                      <div className={`p-3 rounded-xl flex items-center justify-between ${montoRecibido > montoPagado ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${montoRecibido > montoPagado ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {montoRecibido > montoPagado ? 'Vuelta' : 'Pago exacto'}
                          </span>
                        </div>
                        <span className={`text-base font-black ${montoRecibido > montoPagado ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {montoRecibido > montoPagado ? formatCurrency(montoRecibido - montoPagado) : '$0'}
                        </span>
                      </div>
                    )}

                    {metodoPago === 'transferencia' && (
                      <Input
                        label="Referencia de Transferencia"
                        value={referenciaTransferencia}
                        onChange={(e) => setReferenciaTransferencia(e.target.value)}
                        placeholder="Nro. Aprobación / Código"
                        icon={<Hash className="w-4.5 h-4.5 text-slate-400" />}
                        required
                      />
                    )}

                    {/* Preview new balance */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Nuevo balance</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Reduce la deuda</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-slate-800">
                          {formatCurrency(Math.max(0, selectedStudent.balancePendiente - montoPagado))}
                        </span>
                        {montoPagado > 0 && (
                          <span className="text-xs font-bold text-slate-400">
                            {progressPct}% → {courseCost > 0 ? Math.min(100, Math.round(((totalPaid + montoPagado) / courseCost) * 100)) : 0}%
                          </span>
                        )}
                      </div>
                    </div>

                    <Button variant="success" type="submit" size="lg" fullWidth icon={<Wallet className="w-4.5 h-4.5" />}>
                      Registrar Pago e Imprimir
                    </Button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {generatedInvoice && (
        <Modal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          title="Recibo de Pago Generado"
          size="md"
        >
          <div className="flex flex-col gap-6 w-full" id="invoice-printable-container">
            <div id="invoice-printable">
              <div className={printMode === 'ticket' ? 'ticket-print relative overflow-hidden bg-white p-7 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col font-sans' : 'fullpage-print'}>
                {printMode === 'ticket' && (
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-50 rounded-full opacity-60" data-html2canvas-ignore="true"></div>
                )}

                <div className="flex flex-col items-center justify-center text-center gap-2 pb-6 border-b border-slate-100">
                  <div className={printMode === 'ticket' ? 'p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-inner' : 'p-3 rounded-xl bg-emerald-50 text-emerald-600'}>
                    <Wallet className={printMode === 'ticket' ? 'w-7 h-7' : 'w-8 h-8'} />
                  </div>
                  <span className={printMode === 'ticket' ? 'font-black text-xl text-slate-800 tracking-tight mt-2' : 'font-black text-2xl text-slate-800 tracking-tight mt-3'}>Colegio de Estrellas La Excelencia</span>
                  <span className={printMode === 'ticket' ? 'text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none' : 'text-xs font-bold text-slate-500 uppercase tracking-widest'}>Recibo de Pago</span>
                </div>

                <div className={printMode === 'ticket' ? 'grid grid-cols-2 gap-y-4 py-5 border-b border-slate-100 text-xs font-semibold text-slate-600' : 'grid grid-cols-2 gap-y-5 py-6 border-b border-slate-200 text-sm font-semibold text-slate-600'}>
                  <div className="flex flex-col">
                    <span className={printMode === 'ticket' ? 'text-[10px] font-black text-slate-400 uppercase tracking-wider' : 'text-xs font-bold text-slate-400 uppercase tracking-wider'}>Recibo No.</span>
                    <span className="text-slate-800 font-mono font-bold mt-1 bg-slate-50 self-start px-2 py-0.5 rounded-md border border-slate-100">{generatedInvoice.id}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={printMode === 'ticket' ? 'text-[10px] font-black text-slate-400 uppercase tracking-wider' : 'text-xs font-bold text-slate-400 uppercase tracking-wider'}>Matrícula</span>
                    <span className="text-brand-700 font-mono font-bold mt-1 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">{generatedInvoice.matricula}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={printMode === 'ticket' ? 'text-[10px] font-black text-slate-400 uppercase tracking-wider' : 'text-xs font-bold text-slate-400 uppercase tracking-wider'}>Fecha / Hora</span>
                    <span className="text-slate-800 mt-1 font-bold">{generatedInvoice.fecha} a las {generatedInvoice.hora}</span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className={printMode === 'ticket' ? 'text-[10px] font-black text-slate-400 uppercase tracking-wider' : 'text-xs font-bold text-slate-400 uppercase tracking-wider'}>Método Pago</span>
                    <div className="mt-1">
                      <Badge variant={generatedInvoice.metodoPago === 'efectivo' ? 'success' : 'info'}>
                        {generatedInvoice.metodoPago}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className={printMode === 'ticket' ? 'flex flex-col gap-3 py-5 border-b border-slate-100 text-xs text-slate-600 font-semibold' : 'flex flex-col gap-4 py-6 border-b border-slate-200 text-sm text-slate-600 font-semibold'}>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col">
                      <span className={printMode === 'ticket' ? 'text-[10px] text-slate-400 font-black uppercase' : 'text-xs text-slate-500 font-bold uppercase'}>Estudiante</span>
                      <span className="text-slate-800 font-black text-sm mt-0.5">{generatedInvoice.estudianteNombre}</span>
                    </div>
                    <User className={printMode === 'ticket' ? 'w-5 h-5 text-slate-300' : 'w-6 h-6 text-slate-300'} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Curso:</span>
                    <span className="text-slate-800 font-bold text-right">{generatedInvoice.cursoNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Horario:</span>
                    <span className="text-brand-600 font-black text-right">{generatedInvoice.horario || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Concepto:</span>
                    <span className="text-slate-800 font-bold text-right">Pago quincenal</span>
                  </div>
                  {generatedInvoice.referenciaTransferencia && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Referencia Transf:</span>
                      <span className="text-slate-800 font-bold font-mono">{generatedInvoice.referenciaTransferencia}</span>
                    </div>
                  )}
                </div>

                <div className={printMode === 'ticket' ? 'flex flex-col py-5 text-xs text-slate-600 font-semibold gap-3' : 'flex flex-col py-6 text-sm text-slate-600 font-semibold gap-4'}>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Monto Pagado</span>
                    <span className="text-emerald-600 font-extrabold">{formatCurrency(generatedInvoice.montoPagado)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Monto Recibido</span>
                    <span className="text-slate-800 font-extrabold">{formatCurrency(generatedInvoice.montoRecibido ?? generatedInvoice.montoPagado)}</span>
                  </div>

                  {(generatedInvoice.vuelta ?? 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold">Vuelta</span>
                      <span className="text-amber-600 font-extrabold">{formatCurrency(generatedInvoice.vuelta)}</span>
                    </div>
                  )}

                  <div className={printMode === 'ticket' ? 'flex justify-between items-center mt-2 p-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl shadow-md' : 'flex justify-between items-center mt-3 p-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl shadow-md'}>
                    <span className="uppercase text-[10px] font-black tracking-widest text-slate-300">Total Recibido Hoy</span>
                    <span className={printMode === 'ticket' ? 'text-lg font-black text-white' : 'text-xl font-black text-white'}>{formatCurrency(generatedInvoice.montoRecibido ?? generatedInvoice.montoPagado)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500 font-bold">Nuevo Balance Pendiente</span>
                    <span className={printMode === 'ticket' ? 'text-sm font-extrabold text-rose-600' : 'text-base font-extrabold text-rose-600'}>{formatCurrency(generatedInvoice.balance)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-bold">Próximo Pago</span>
                    <span className={`font-extrabold ${generatedInvoice.balance === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {generatedInvoice.balance === 0 ? 'Curso pagado' : getNextDueDateLabel()}
                    </span>
                  </div>
                </div>

                <div className={printMode === 'ticket' ? 'flex flex-col items-center justify-center text-center mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed' : 'flex flex-col items-center justify-center text-center mt-6 pt-6 border-t border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed'}>
                  <span>RNC 1-01-20304-2 • www.colegioestrellasexcelencia.edu.do</span>
                  <span className="mt-1">¡Gracias por tu pago!</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 no-print pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Modo:</span>
              <button
                onClick={() => setPrintMode('ticket')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  printMode === 'ticket'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Ticket 80mm
              </button>
              <button
                onClick={() => setPrintMode('fullpage')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  printMode === 'fullpage'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Hoja Completa
              </button>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 no-print">
              <Button variant="outline" className="flex-1" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
                {printMode === 'ticket' ? 'Imprimir Ticket' : 'Imprimir Hoja Completa'}
              </Button>
              <Button variant="primary" className="flex-1" icon={<FileDown className="w-4 h-4" />}
                onClick={() => {
                  const originalElement = document.getElementById('invoice-printable');
                  if (!originalElement) return;
                  const originalOverflow = document.body.style.overflow;
                  document.body.style.overflow = 'unset';
                  const isFullpage = printMode === 'fullpage';
                  const clone = originalElement.cloneNode(true) as HTMLElement;
                  clone.style.position = 'fixed';
                  clone.style.left = '0';
                  clone.style.top = '0';
                  clone.style.width = isFullpage ? '720px' : '302px';
                  clone.style.opacity = '0.01';
                  clone.style.pointerEvents = 'none';
                  clone.style.zIndex = '0';
                  document.body.appendChild(clone);
                  setTimeout(() => {
                    const opt = {
                      margin: isFullpage ? 0.5 : 0.3,
                      filename: `Pago_${generatedInvoice.id}${isFullpage ? '' : '_ticket'}.pdf`,
                      image: { type: 'jpeg' as const, quality: 0.98 },
                      html2canvas: { scale: 1.5, useCORS: true, logging: false },
                      jsPDF: {
                        unit: 'in' as const,
                        format: isFullpage ? 'letter' as const : [3.15, 11.69] as [number, number],
                        orientation: 'portrait' as const
                      }
                    };
                    html2pdf().set(opt).from(clone).save().then(() => {
                      clone.remove();
                      document.body.style.overflow = originalOverflow;
                    }).catch(() => {
                      clone.remove();
                      document.body.style.overflow = originalOverflow;
                    });
                  }, 300);
                }}
              >
                Exportar PDF
              </Button>
            </div>
            <div className="no-print pt-2 flex justify-center">
              <Button variant="secondary" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>
                Cerrar Ventana
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Payments;

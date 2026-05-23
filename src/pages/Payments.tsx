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
  ArrowRight,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { formatCurrency, inputValue } from '../utils/formatters';
import type { Student, Payment } from '../types';

// ==========================================
// Helper functions for payment tracking
// ==========================================
const getIntervalDays = (frecuencia: string): number => {
  switch (frecuencia) {
    case 'semanal': return 7;
    case 'quincenal': return 15;
    case 'mensual': return 30;
    default: return 15;
  }
};

const getFrecuenciaLabel = (f: string) => {
  if (f === 'semanal') return 'Semanal';
  if (f === 'quincenal') return 'Quincenal';
  if (f === 'mensual') return 'Mensual';
  return 'Único';
};

const getDefaultPaymentAmount = (course: any): number => {
  if (!course) return 250;
  return course.costo;
};

const getTotalCourseCost = (course: any): number => {
  if (!course) return 0;
  if (course.frecuenciaPago === 'unico') return course.costo;
  const intervalDays = getIntervalDays(course.frecuenciaPago);
  const monthsPerModule = course.duracionModuloMeses || 1;
  const totalMonths = monthsPerModule * course.modulos;
  const totalPeriods = (totalMonths * 30) / intervalDays;
  return course.costo * totalPeriods;
};

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

const getPeriodLabel = (dateStr: string, frecuencia: string = 'quincenal'): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  if (frecuencia === 'mensual') return `${months[d.getMonth()]} ${d.getFullYear()}`;
  if (frecuencia === 'quincenal') {
    const period = d.getDate() <= 15 ? '1ra' : '2da';
    return `${period} quincena ${months[d.getMonth()]}`;
  }
  if (frecuencia === 'semanal') return `Sem ${Math.ceil(d.getDate() / 7)} ${months[d.getMonth()]}`;
  return 'Pago único';
};

const getExpectedPayments = (enrollmentISO: string, frecuencia: string): number => {
  if (frecuencia === 'unico') return 1;

  const start = new Date(enrollmentISO);
  const now = new Date();
  let count = 0;

  if (frecuencia === 'semanal') {
    let current = new Date(start);
    const daysToMonday = (8 - current.getDay()) % 7 || 7;
    current.setDate(current.getDate() + daysToMonday);
    while (current <= now) { count++; current.setDate(current.getDate() + 7); }
  } else if (frecuencia === 'quincenal') {
    const startM = start.getFullYear() * 12 + start.getMonth();
    const endM = now.getFullYear() * 12 + now.getMonth();
    for (let t = startM; t <= endM; t++) {
      const y = Math.floor(t / 12), m = t % 12;
      const d15 = new Date(y, m, 15);
      if (d15 > start && d15 <= now) count++;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const dLast = new Date(y, m, lastDay);
      if (dLast > start && dLast <= now) count++;
    }
  } else if (frecuencia === 'mensual') {
    let current = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    while (current <= now) { count++; current.setMonth(current.getMonth() + 1); }
  }
  return count;
};

const getStudentStatus = (
  student: Student,
  payments: Payment[],
  course: any
): { label: string; variant: 'success' | 'danger' | 'info' } => {
  if (student.balancePendiente === 0) return { label: 'Pagado', variant: 'success' };
  if (!course) return { label: 'Sin curso', variant: 'info' };
  const expected = getExpectedPayments(student.fechaInscripcion, course.frecuenciaPago);
  if (expected === 0) return { label: 'Recién inscrito', variant: 'info' };
  const totalPaid = payments
    .filter(p => p.estudianteId === student.id)
    .reduce((sum, p) => sum + (p.esAnulacion ? -p.montoPagado : p.montoPagado), 0);
  const amountPerPeriod = getDefaultPaymentAmount(course);
  const expectedMin = expected * amountPerPeriod;
  if (totalPaid >= expectedMin) return { label: 'Al día', variant: 'success' };
  const deficit = expectedMin - totalPaid;
  const cuotas = Math.ceil(deficit / amountPerPeriod);
  return { label: `Atrasado (${cuotas} cuota${cuotas > 1 ? 's' : ''})`, variant: 'danger' };
};

export const Payments: React.FC = () => {
  const { students, courses, payments, registerPayment, anularPago } = useAcademyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'review'>('form');

  const [montoPagado, setMontoPagado] = useState(0);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [referenciaTransferencia, setReferenciaTransferencia] = useState('');

  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'ticket' | 'fullpage'>('fullpage');
  const [error, setError] = useState('');

  // Estado para anulación de pagos
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetPayment, setCancelTargetPayment] = useState<Payment | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelError, setCancelError] = useState('');

  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nombreCompleto.toLowerCase().includes(term) ||
      s.matricula.toLowerCase().includes(term) ||
      (s.cedula && s.cedula.includes(term))
    );
  });

  // Lee el estudiante más reciente del store (balance se actualiza tras pagar)
  const currentStudent = selectedStudent
    ? students.find((s) => s.id === selectedStudent.id) ?? selectedStudent
    : null;

  const selectedCourse = currentStudent
    ? (currentStudent.cursoSnapshot ?? courses.find((c) => c.id === currentStudent.cursoId))
    : null;

  const studentPayments = selectedStudent
    ? payments
        .filter((p) => p.estudianteId === selectedStudent.id)
        .sort((a, b) => new Date(b.fecha + ' ' + b.hora).getTime() - new Date(a.fecha + ' ' + a.hora).getTime())
    : [];

  const totalPaid = studentPayments.reduce((sum, p) => sum + (p.esAnulacion ? -p.montoPagado : p.montoPagado), 0);
  const totalCourseCost = getTotalCourseCost(selectedCourse);
  const progressPct = totalCourseCost > 0 ? Math.min(100, Math.round((totalPaid / totalCourseCost) * 100)) : 0;

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchTerm(student.nombreCompleto);
    setIsDropdownOpen(false);
    const defaultAmount = getDefaultPaymentAmount(student.cursoSnapshot ?? courses.find((c) => c.id === student.cursoId));
    setMontoPagado(defaultAmount);
    setMontoRecibido(defaultAmount);
    setMetodoPago('efectivo');
    setReferenciaTransferencia('');
    setStep('form');
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

    if (montoPagado > currentStudent!.balancePendiente) {
      setError(`El monto no puede exceder el balance pendiente (${formatCurrency(currentStudent!.balancePendiente)}).`);
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

    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmPayment = () => {
    setError('');

    if (!selectedStudent) return;

    try {
      const invoice = registerPayment(
        selectedStudent.id,
        montoPagado,
        metodoPago,
        referenciaTransferencia || undefined,
        montoRecibido,
        montoRecibido - montoPagado
      );

      setGeneratedInvoice(invoice);
      setIsInvoiceModalOpen(true);
      setTimeout(() => window.print(), 500);
      setSearchTerm('');
      setStep('form');
      const defaultAmount = getDefaultPaymentAmount(selectedCourse || undefined);
      setMontoPagado(defaultAmount);
      setMontoRecibido(defaultAmount);
      setMetodoPago('efectivo');
      setReferenciaTransferencia('');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al registrar el pago.');
    }
  };

  const openCancelModal = (payment: Payment) => {
    setCancelTargetPayment(payment);
    setCancelMotivo('');
    setCancelError('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!cancelTargetPayment) return;
    if (!cancelMotivo.trim()) {
      setCancelError('Debe indicar el motivo de la anulación');
      return;
    }
    try {
      const anulacion = anularPago(cancelTargetPayment.id, cancelMotivo.trim());
      setGeneratedInvoice(anulacion);
      setCancelError('');
      setIsCancelModalOpen(false);
      setCancelTargetPayment(null);
      setCancelMotivo('');
      setIsInvoiceModalOpen(true);
    } catch (err: any) {
      setCancelError(err.message || 'Error al anular el pago.');
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
                    const courseName = s.cursoSnapshot?.nombre ?? courses.find((c) => c.id === s.cursoId)?.nombre;
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
                            <span>{courseName || 'N/A'}</span>
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
                  const courseData = s.cursoSnapshot ?? courses.find((c) => c.id === s.cursoId);
                  const status = getStudentStatus(s, payments, courseData);
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
                          <span>{(courseData as any)?.nombre || 'N/A'}</span>
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
                      <Badge variant={getStudentStatus(selectedStudent, payments, selectedCourse || undefined).variant} size="sm">
                        {getStudentStatus(selectedStudent, payments, selectedCourse || undefined).label}
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total del Curso</span>
                  <div className="text-lg font-black text-slate-800 mt-1">{formatCurrency(totalCourseCost)}</div>
                </div>
                <div className="p-5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pagado</span>
                  <div className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</div>
                </div>
                <div className="p-5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</span>
                  <div className={`text-lg font-black mt-1 ${currentStudent!.balancePendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(currentStudent!.balancePendiente)}
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
                        <th className="pb-3 pr-4 text-right">Balance</th>
                        <th className="pb-3 text-right">Imprimir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {studentPayments.map((p) => (
                        <tr
                          key={p.id}
                          className={`text-xs font-semibold transition-colors ${
                            p.esAnulacion
                              ? 'text-red-400 bg-red-50/40'
                              : 'text-slate-600 hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${p.esAnulacion ? 'text-red-400 line-through' : 'text-slate-800'}`}>
                                {p.id}
                              </span>
                              {p.esAnulacion && (
                                <Badge variant="danger" size="sm">ANULADO</Badge>
                              )}
                              {p.pagoOriginalId && (
                                <span className="text-[9px] text-red-300 font-medium">
                                  → {p.pagoOriginalId}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`py-3 pr-4 ${p.esAnulacion ? 'text-red-300' : 'text-slate-500'}`}>
                            {p.fecha} <span className="text-slate-400">{p.hora}</span>
                            {!p.esAnulacion && (
                              <span className="block text-[10px] font-medium text-brand-500">
                                {getPeriodLabel(p.fecha, selectedCourse?.frecuenciaPago)}
                              </span>
                            )}
                            {p.esAnulacion && p.motivoAnulacion && (
                              <span className="block text-[10px] font-medium text-red-400 italic mt-0.5">
                                {p.motivoAnulacion}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={p.esAnulacion ? 'danger' : p.metodoPago === 'efectivo' ? 'success' : 'info'}
                              size="sm"
                            >
                              {p.metodoPago}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 font-mono text-slate-400">
                            {p.referenciaTransferencia || '—'}
                          </td>
                          <td className={`py-3 pr-4 text-right font-extrabold ${p.esAnulacion ? 'text-red-400 line-through' : 'text-emerald-600'}`}>
                            {p.esAnulacion ? '-' : '+'}{formatCurrency(p.montoPagado)}
                          </td>
                          <td className={`py-3 pr-4 text-right font-extrabold ${p.esAnulacion ? 'text-red-300' : 'text-slate-800'}`}>
                            {formatCurrency(p.balance)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setGeneratedInvoice(p);
                                  setIsInvoiceModalOpen(true);
                                  setTimeout(() => window.print(), 500);
                                }}
                                className="p-1.5 rounded-lg text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
                                title="Reimprimir recibo"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              {!p.esAnulacion && (
                                <button
                                  onClick={() => openCancelModal(p)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                  title="Anular pago"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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
                    <span className="text-white font-bold text-sm">
                      {step === 'review' ? 'Confirmar Pago' : 'Registrar Pago'}
                    </span>
                    <p className="text-emerald-100 text-[10px] font-semibold">
                      {selectedCourse ? `Pago ${getFrecuenciaLabel(selectedCourse.frecuenciaPago)}` : 'Seleccione un estudiante'}
                    </p>
                  </div>
                </div>
              </div>

              {step === 'review' ? (
                /* Review Step */
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 flex items-center justify-center text-sm font-black shrink-0 border border-brand-200">
                      {selectedStudent.nombreCompleto.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{selectedStudent.nombreCompleto}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{selectedStudent.matricula}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 text-sm font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Curso</span>
                      <span className="text-slate-800 font-bold text-right">{selectedCourse?.nombre || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frecuencia</span>
                      <span className="text-slate-800 font-bold capitalize">{selectedCourse?.frecuenciaPago || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monto</span>
                      <span className="text-emerald-600 font-extrabold">{formatCurrency(montoPagado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monto Recibido</span>
                      <span className="text-slate-800 font-extrabold">{formatCurrency(montoRecibido)}</span>
                    </div>
                    {montoRecibido > montoPagado && (
                      <div className="flex justify-between">
                        <span>Vuelta</span>
                        <span className="text-amber-600 font-extrabold">{formatCurrency(montoRecibido - montoPagado)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Método</span>
                      <span className="text-slate-800 font-bold uppercase">{metodoPago}</span>
                    </div>
                    {metodoPago === 'transferencia' && referenciaTransferencia && (
                      <div className="flex justify-between">
                        <span>Referencia</span>
                        <span className="text-slate-800 font-bold font-mono">{referenciaTransferencia}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Nuevo Balance</span>
                      <span className="text-lg font-black text-slate-800">
                        {formatCurrency(Math.max(0, currentStudent!.balancePendiente - montoPagado))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button variant="outline" type="button" icon={<ShieldCheck className="w-4 h-4" />} onClick={() => setStep('form')}>
                      Editar
                    </Button>
                    <Button variant="success" size="lg" fullWidth icon={<Wallet className="w-4.5 h-4.5" />} onClick={handleConfirmPayment}>
                      Confirmar Pago
                    </Button>
                  </div>
                </div>
              ) : (
                /* Payment Form */
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                  {currentStudent!.balancePendiente === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-300 mb-3" />
                      <span className="text-sm font-bold text-emerald-700">¡Curso pagado!</span>
                      <p className="text-xs text-slate-500 mt-1">Este estudiante no tiene balance pendiente.</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-700">Balance pendiente</span>
                        <span className="text-base font-black text-rose-600">{formatCurrency(currentStudent!.balancePendiente)}</span>
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

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monto a Cobrar ($)</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => { setMontoPagado(currentStudent!.balancePendiente); setMontoRecibido(currentStudent!.balancePendiente); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${montoPagado === currentStudent!.balancePendiente ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            Saldo Pendiente ({formatCurrency(currentStudent!.balancePendiente)})
                          </button>
                        </div>
                        <input
                          type="number"
                          value={inputValue(montoPagado)}
                          onChange={(e) => setMontoPagado(Number(e.target.value))}
                          placeholder={getDefaultPaymentAmount(selectedCourse || undefined).toString()}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-emerald-100 focus:border-emerald-500 rounded-xl text-slate-800 text-sm transition-all duration-200 focus:outline-hidden focus:ring-4 mt-1.5"
                        />
                      </div>

                      <Input
                        label="Monto Recibido ($)"
                        type="number"
                        value={inputValue(montoRecibido)}
                        onChange={(e) => setMontoRecibido(Number(e.target.value))}
                        placeholder={montoPagado.toString()}
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
                            {formatCurrency(Math.max(0, currentStudent!.balancePendiente - montoPagado))}
                          </span>
                          {montoPagado > 0 && (
                            <span className="text-xs font-bold text-slate-400">
                              {progressPct}% → {totalCourseCost > 0 ? Math.min(100, Math.round(((totalPaid + montoPagado) / totalCourseCost) * 100)) : 0}%
                            </span>
                          )}
                        </div>
                      </div>

                      <Button variant="success" type="submit" size="lg" fullWidth icon={<CheckCircle2 className="w-4.5 h-4.5" />}>
                        Revisar Pago
                      </Button>
                    </>
                  )}
                </form>
              )}
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

      {/* Modal de Anulación de Pago */}
      <Modal isOpen={isCancelModalOpen} onClose={() => { setIsCancelModalOpen(false); setCancelError(''); }} title="Anular Pago" size="md">
        <div className="p-1">
          {/* Header */}
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-200">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-400">
                Esta acción generará un contra-recibo y restaurará el balance del estudiante
              </p>
            </div>
          </div>

          {/* Payment Info */}
          {cancelTargetPayment && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recibo</span>
                <span className="text-sm font-black font-mono text-slate-800">{cancelTargetPayment.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</span>
                <span className="text-sm font-bold text-slate-700">{cancelTargetPayment.estudianteNombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monto</span>
                <span className="text-sm font-extrabold text-emerald-600">+{formatCurrency(cancelTargetPayment.montoPagado)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Método</span>
                <Badge variant={cancelTargetPayment.metodoPago === 'efectivo' ? 'success' : 'info'} size="sm">
                  {cancelTargetPayment.metodoPago}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha</span>
                <span className="text-sm font-semibold text-slate-600">{cancelTargetPayment.fecha} {cancelTargetPayment.hora}</span>
              </div>
            </div>
          )}

          {/* Motivo */}
          <div className="mt-5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Motivo de Anulación <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={cancelMotivo}
              onChange={(e) => { setCancelMotivo(e.target.value); setCancelError(''); }}
              placeholder="Ej: El cliente decidió no realizar el pago, error en el monto, duplicidad..."
              className={`w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-300 border-2 transition-all duration-200 outline-none resize-none h-24 ${
                cancelError
                  ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400'
                  : 'border-slate-200 bg-white focus:border-brand-400'
              }`}
            />
            {cancelError && (
              <p className="mt-1.5 text-xs font-bold text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {cancelError}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-100/80 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-[11px] leading-relaxed">
              <span className="font-black text-amber-800">IMPORTANTE</span>
              <p className="text-amber-700 font-semibold mt-0.5">
                Se generará un contra-recibo (<span className="font-mono">CON-XXXX</span>) como respaldo. 
                El balance del estudiante será restaurado y el monto se descontará del cierre de caja del día de hoy.
                Esta operación no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setIsCancelModalOpen(false); setCancelError(''); }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              icon={<XCircle className="w-4 h-4" />}
              onClick={handleConfirmCancel}
            >
              Anular Pago
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Payments;

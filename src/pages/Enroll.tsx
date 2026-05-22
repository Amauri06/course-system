import React, { useState, useEffect } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  CreditCard,
  User,
  GraduationCap,
  ShieldCheck,
  Printer,
  FileDown,
  Coins
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const Enroll: React.FC = () => {
  const { courses, students, enrollStudent } = useAcademyStore();

  // Mode: nuevo estudiante o existente
  const [isNewStudent, setIsNewStudent] = useState(true);
  const [existingStudentId, setExistingStudentId] = useState('');

  // New Student Details
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');

  // Course & Payment Details
  const [cursoId, setCursoId] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [referenciaTransferencia, setReferenciaTransferencia] = useState('');
  const [montoPagado, setMontoPagado] = useState(0);

  // Financial values
  const [selectedCourseCosto, setSelectedCourseCosto] = useState(0);
  const [balancePendiente, setBalancePendiente] = useState(0);

  // Invoice & Modal states
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Cargar costo del curso seleccionado
  useEffect(() => {
    if (cursoId) {
      const course = courses.find((c) => c.id === cursoId);
      if (course) {
        setSelectedCourseCosto(course.costo);
        setMontoPagado(course.costo); // Autocompleta con el pago completo por defecto
      }
    } else {
      setSelectedCourseCosto(0);
      setMontoPagado(0);
    }
  }, [cursoId, courses]);

  // Recalcular balance pendiente
  useEffect(() => {
    const balance = Math.max(0, selectedCourseCosto - montoPagado);
    setBalancePendiente(balance);
  }, [selectedCourseCosto, montoPagado]);

  // Sincronizar datos si es estudiante existente
  useEffect(() => {
    if (!isNewStudent && existingStudentId) {
      const stud = students.find((s) => s.id === existingStudentId);
      if (stud) {
        setNombreCompleto(stud.nombreCompleto);
        setTelefono(stud.telefono);
        setCedula(stud.cedula);
        setDireccion(stud.direccion);
      }
    }
  }, [isNewStudent, existingStudentId, students]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cursoId) {
      setError('Por favor, seleccione un curso válido.');
      return;
    }

    if (isNewStudent) {
      if (!nombreCompleto.trim() || !telefono.trim() || !cedula.trim() || !direccion.trim()) {
        setError('Complete toda la información personal del estudiante.');
        return;
      }
    } else {
      if (!existingStudentId) {
        setError('Por favor, seleccione un estudiante registrado.');
        return;
      }
    }

    if (montoPagado <= 0) {
      setError('El monto pagado debe ser mayor a cero.');
      return;
    }

    if (metodoPago === 'transferencia' && !referenciaTransferencia.trim()) {
      setError('Escriba el número de referencia para la transferencia bancaria.');
      return;
    }

    try {
      const invoice = enrollStudent(
        {
          nombreCompleto,
          telefono,
          cedula,
          direccion,
          cursoId
        },
        montoPagado,
        metodoPago,
        referenciaTransferencia || undefined
      );

      // Abrir modal de factura
      setGeneratedInvoice(invoice);
      setIsInvoiceModalOpen(true);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al inscribir.');
    }
  };

  const resetForm = () => {
    setIsNewStudent(true);
    setExistingStudentId('');
    setNombreCompleto('');
    setTelefono('');
    setCedula('');
    setDireccion('');
    setCursoId('');
    setMetodoPago('efectivo');
    setReferenciaTransferencia('');
    setMontoPagado(0);
    setSelectedCourseCosto(0);
    setBalancePendiente(0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1.5 no-print">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
          Inscribir y Facturar Alumno
        </h1>
        <p className="text-sm font-semibold text-slate-400">
          Registra matrículas académicas, recibe pagos y genera facturas automáticas al instante.
        </p>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 no-print">
        {/* Left Column: Form (2 Cols) */}
        <div className="xl:col-span-2">
          <Card title="Punto de Venta e Inscripciones (POS)">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                  <ShieldCheck className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Toggles del Estudiante */}
              <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Button
                  variant={isNewStudent ? 'primary' : 'outline'}
                  size="sm"
                  type="button"
                  onClick={() => {
                    setIsNewStudent(true);
                    setNombreCompleto('');
                    setTelefono('');
                    setCedula('');
                    setDireccion('');
                  }}
                >
                  Nuevo Estudiante
                </Button>
                <Button
                  variant={!isNewStudent ? 'primary' : 'outline'}
                  size="sm"
                  type="button"
                  onClick={() => setIsNewStudent(false)}
                >
                  Estudiante Registrado
                </Button>
              </div>

              {/* Formulario Dinámico según Tipo de Estudiante */}
              {isNewStudent ? (
                <div className="flex flex-col gap-4">
                  <Input
                    label="Nombre Completo *"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej: Laura Mercedes Pérez"
                    icon={<User className="w-4.5 h-4.5" />}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Cédula *"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="001-1234567-8"
                      required
                    />
                    <Input
                      label="Teléfono de Contacto *"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="809-555-0123"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Dirección de Residencia *
                    </label>
                    <textarea
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Dirección física completa..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-brand-100 focus:border-brand-500 rounded-xl text-slate-800 text-sm transition-all duration-200 focus:outline-hidden focus:ring-4 h-16"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Select
                    label="Seleccionar Estudiante Existente *"
                    value={existingStudentId}
                    onChange={(e) => setExistingStudentId(e.target.value)}
                    options={[
                      { value: '', label: 'Seleccione un alumno...' },
                      ...students.map((s) => ({ value: s.id, label: `${s.nombreCompleto} (${s.matricula})` }))
                    ]}
                  />
                  {existingStudentId && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-2.5 text-xs text-slate-600 font-semibold">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Información Sincronizada</span>
                      <span>Nombre: {nombreCompleto}</span>
                      <span>Cédula: {cedula}</span>
                      <span>Teléfono: {telefono}</span>
                      <span>Dirección: {direccion}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sección Académica y de Cobro */}
              <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
                <Select
                  label="Curso a Inscribir *"
                  value={cursoId}
                  onChange={(e) => setCursoId(e.target.value)}
                  options={[
                    { value: '', label: 'Seleccionar curso...' },
                    ...courses
                      .filter((c) => c.estado === 'activo')
                      .map((c) => ({ value: c.id, label: `${c.nombre} (${formatCurrency(c.costo)})` }))
                  ]}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Método de Pago *"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as 'efectivo' | 'transferencia')}
                    options={[
                      { value: 'efectivo', label: 'Efectivo' },
                      { value: 'transferencia', label: 'Transferencia Bancaria' }
                    ]}
                  />
                  <Input
                    label="Monto a Cobrar / Abonar ($) *"
                    type="number"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(Number(e.target.value))}
                    placeholder="150"
                    icon={<Coins className="w-4.5 h-4.5 text-slate-400" />}
                    required
                  />
                </div>

                {metodoPago === 'transferencia' && (
                  <Input
                    label="Referencia de Transferencia *"
                    value={referenciaTransferencia}
                    onChange={(e) => setReferenciaTransferencia(e.target.value)}
                    placeholder="Nro. Aprobación / Código de banco"
                    required
                  />
                )}
              </div>

              {/* Botón de Enviar */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button variant="success" type="submit" size="lg" fullWidth icon={<CreditCard className="w-4.5 h-4.5" />}>
                  Completar Inscripción e Imprimir
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Live Calculations Summary Card */}
        <div className="xl:col-span-1">
          <Card title="Desglose Financiero" subtitle="Detalle de cobros en tiempo real">
            <div className="flex flex-col gap-5 text-sm font-semibold text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-xs">Costo Programa</span>
                <span className="text-slate-800 font-extrabold">{formatCurrency(selectedCourseCosto)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-400 font-bold uppercase text-xs">Duración</span>
                <span className="text-slate-800 font-extrabold">3 meses</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-xs">Monto Abonado</span>
                <span className="text-emerald-600 font-extrabold">{formatCurrency(montoPagado)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 pb-1">
                <span className="text-slate-400 font-bold uppercase text-xs">Balance Pendiente</span>
                <span className={`text-base font-extrabold ${balancePendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(balancePendiente)}
                </span>
              </div>

              {/* Checklist visual para dar look premium */}
              <div className="flex flex-col gap-3 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl mt-2 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Matrícula generada automáticamente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Inscripción registrada en cierre de caja diario</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Impresión directa de ticket disponible</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INVOICE MODAL OVERLAY (Visible en Impresión también) */}
      {/* ========================================================================= */}
      {generatedInvoice && (
        <Modal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          title="Factura de Inscripción Generada"
          size="md"
        >
          {/* Vista Factura Estilo Ticket */}
          <div className="flex flex-col gap-6" id="invoice-printable">
            <div className="ticket-print bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col font-sans">
              {/* Header Factura */}
              <div className="flex flex-col items-center justify-center text-center gap-1 pb-4.5 border-b border-dashed border-slate-200">
                <div className="p-2.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="font-extrabold text-base text-slate-800 tracking-tight mt-1">ACADEMIA DE CURSOS</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">RNC 1-01-20304-2 • Santo Domingo, R.D.</span>
              </div>

              {/* Meta Factura */}
              <div className="grid grid-cols-2 gap-y-2 py-4 border-b border-dashed border-slate-200 text-xs font-semibold text-slate-600">
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Factura No.</span>
                  <span className="text-slate-800 font-mono font-bold mt-0.5">{generatedInvoice.id}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Matrícula</span>
                  <span className="text-slate-800 font-mono font-bold mt-0.5">{generatedInvoice.matricula}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Fecha Pago</span>
                  <span className="text-slate-800 mt-0.5">{generatedInvoice.fecha}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase">Hora Pago</span>
                  <span className="text-slate-800 mt-0.5">{generatedInvoice.hora}</span>
                </div>
              </div>

              {/* Detalles Estudiante & Curso */}
              <div className="flex flex-col gap-2.5 py-4 border-b border-dashed border-slate-200 text-xs text-slate-600 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estudiante:</span>
                  <span className="text-slate-800 font-bold text-right">{generatedInvoice.estudianteNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Curso Inscrito:</span>
                  <span className="text-slate-800 font-bold text-right">{generatedInvoice.cursoNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Método Pago:</span>
                  <Badge variant={generatedInvoice.metodoPago === 'efectivo' ? 'success' : 'info'}>
                    {generatedInvoice.metodoPago}
                  </Badge>
                </div>
                {generatedInvoice.referenciaTransferencia && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Referencia Transf:</span>
                    <span className="text-slate-800 font-bold font-mono">{generatedInvoice.referenciaTransferencia}</span>
                  </div>
                )}
              </div>

              {/* Total Financiero */}
              <div className="flex flex-col gap-2 py-4.5 text-xs text-slate-600 font-semibold bg-slate-50/50 -mx-6 px-6 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Total Cursado</span>
                  <span className="text-slate-800 font-extrabold">{formatCurrency(selectedCourseCosto || generatedInvoice.montoPagado + generatedInvoice.balance)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-bold">
                  <span className="uppercase text-[10px]">Monto Pagado</span>
                  <span className="text-sm font-extrabold">{formatCurrency(generatedInvoice.montoPagado)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/50 pt-2 text-rose-600 font-bold">
                  <span className="uppercase text-[10px]">Balance Restante</span>
                  <span className="text-sm font-extrabold">{formatCurrency(generatedInvoice.balance)}</span>
                </div>
              </div>

              {/* Pie de Página Factura */}
              <div className="flex flex-col items-center justify-center text-center mt-5 text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
                <span>¡Gracias por inscribirte con nosotros!</span>
                <span className="mt-1">Conservar comprobante para sus cuadres</span>
              </div>
            </div>

            {/* Acciones de la factura (No-print) */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 no-print">
              <Button
                variant="outline"
                className="flex-1"
                icon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
              >
                Imprimir Ticket
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                icon={<FileDown className="w-4 h-4" />}
                onClick={() => {
                  alert('¡Simulando Exportación a PDF de Factura exitosamente!');
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

export default Enroll;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  User,
  GraduationCap,
  ShieldCheck,
  Printer,
  Search,
  CheckCircle2,
  Wallet,
  Coins,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, inputValue, getIntervalDays, getTotalCourseCost, formatCedula, formatPhone } from '../utils/formatters';
import { toast } from 'sonner';
import type { Student, Payment } from '../types';
import { getEnrollSchema } from '../validations/enrollment.validation';

export const Enroll: React.FC = () => {
  const navigate = useNavigate();
  const { courses, students, enrollStudent, config } = useAcademyStore();

  const [step, setStep] = useState<'form' | 'review'>('form');
  const [isNewStudent, setIsNewStudent] = useState(true);
  const [existingStudentId, setExistingStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [horario, setHorario] = useState('');
  const [inscripcionGratis, setInscripcionGratis] = useState(false);

  const filteredExistingStudents = students.filter(s => {
    if (!studentSearchTerm) return true;
    const term = studentSearchTerm.toLowerCase();
    return s.nombreCompleto.toLowerCase().includes(term) || (s.cedula && s.cedula.includes(term));
  });

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [cursoId, setCursoId] = useState('');

  const [montoInscripcion, setMontoInscripcion] = useState(0);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [inscripcionMetodoPago, setInscripcionMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');

  const [enrolledStudent, setEnrolledStudent] = useState<Student | null>(null);
  const [enrolledPayment, setEnrolledPayment] = useState<Payment | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'ticket' | 'fullpage'>('fullpage');
  const [error, setError] = useState('');

  const selectedCourse = cursoId ? courses.find((c) => c.id === cursoId) : null;
  const enrolledCount = selectedCourse ? students.filter((s) => s.cursoId === selectedCourse.id).length : 0;
  const isCourseFull = selectedCourse ? enrolledCount >= (selectedCourse.capacidad || 25) : false;
  const vuelta = Math.max(0, montoRecibido - montoInscripcion);

  useEffect(() => {
    if (!isNewStudent && existingStudentId) {
      const stud = students.find((s) => s.id === existingStudentId);
      if (stud) {
        setNombreCompleto(stud.nombreCompleto);
        setTelefono(stud.telefono);
        setCedula(stud.cedula || '');
        setDireccion(stud.direccion || '');
      }
    }
  }, [isNewStudent, existingStudentId, students]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (step === 'review') return;

    const validationResult = getEnrollSchema(courses, config.edadMinimaNormal, config.edadMinimaIngles).safeParse({
      isNewStudent,
      nombreCompleto,
      telefono,
      fechaNacimiento,
      direccion,
      cedula,
      existingStudentId,
      cursoId,
      horario,
    });

    if (!validationResult.success) {
      const fieldMap: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldMap[path]) {
          fieldMap[path] = issue.message;
        }
      }
      setFieldErrors(fieldMap);
      setError(validationResult.error.issues[0].message);
      return;
    }

    if (!inscripcionGratis && montoInscripcion <= 0) {
      setError('Debe ingresar un monto de inscripción o marcar como Gratis.');
      return;
    }

    if (isCourseFull) {
      setError(`El curso "${selectedCourse?.nombre}" ha alcanzado su capacidad máxima (${enrolledCount}/${selectedCourse?.capacidad}). No es posible inscribir más estudiantes.`);
      return;
    }

    if (!inscripcionGratis && montoInscripcion > 0 && montoRecibido < montoInscripcion) {
      setError(`El monto recibido (${formatCurrency(montoRecibido)}) no puede ser menor al costo de inscripción (${formatCurrency(montoInscripcion)}).`);
      return;
    }

    setStep('review');
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmEnrollment = () => {
    setError('');

    try {
      const result = enrollStudent(
        {
          nombreCompleto,
          telefono,
          cedula,
          direccion,
          fechaNacimiento,
          cursoId,
          horario,
          inscripcionGratis,
          costoInscripcion: montoInscripcion,
        },
        montoInscripcion > 0
          ? {
              montoRecibido,
              metodoPago: inscripcionMetodoPago,
            }
          : undefined
      );

      setEnrolledStudent(result.student);
      setEnrolledPayment(
        result.payment
          ? { ...result.payment, montoRecibido, vuelta: montoRecibido - montoInscripcion }
          : null
      );
      setStep('form');
      setIsConfirmModalOpen(true);
      toast.success('Estudiante inscrito correctamente');
      setTimeout(() => window.print(), 500);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error al inscribir.';
      setError(msg);
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setIsNewStudent(true);
    setExistingStudentId('');
    setStudentSearchTerm('');
    setIsDropdownOpen(false);
    setNombreCompleto('');
    setTelefono('');
    setFechaNacimiento('');
    setCedula('');
    setDireccion('');
    setCursoId('');
    setHorario('');
    setInscripcionGratis(false);
    setMontoInscripcion(0);
    setMontoRecibido(0);
    setInscripcionMetodoPago('efectivo');
    setFieldErrors({});
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1.5 no-print">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
          Inscribir Alumno
        </h1>
        <p className="text-sm font-semibold text-slate-400">
          Registra un nuevo alumno en el curso seleccionado. La deuda se genera automáticamente.
        </p>
      </div>

      {step === 'form' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 no-print">
          <div className="xl:col-span-2">
            <Card title="Formulario de Inscripción">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                    <ShieldCheck className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Button
                    variant={isNewStudent ? 'primary' : 'outline'}
                    size="sm"
                    type="button"
                    onClick={() => {
                      setIsNewStudent(true);
                      setNombreCompleto('');
                      setTelefono('');
                      setFechaNacimiento('');
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

                {isNewStudent ? (
                  <div className="flex flex-col gap-4">
                    <Input
                      label="Nombre Completo *"
                      value={nombreCompleto}
                      onChange={(e) => { setNombreCompleto(e.target.value); setFieldErrors(prev => ({ ...prev, nombreCompleto: '' })); }}
                      placeholder="Ej: Laura Mercedes Pérez"
                      icon={<User className="w-4.5 h-4.5" />}
                      error={fieldErrors.nombreCompleto}
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Teléfono *"
                        value={telefono}
                        onChange={(e) => { setTelefono(formatPhone(e.target.value)); setFieldErrors(prev => ({ ...prev, telefono: '' })); }}
                        placeholder="(809) 555-0123"
                        error={fieldErrors.telefono}
                      />
                      <Input
                        label="Cédula"
                        value={cedula}
                        onChange={(e) => { setCedula(formatCedula(e.target.value)); setFieldErrors(prev => ({ ...prev, cedula: '' })); }}
                        placeholder="001-1234567-8"
                        error={fieldErrors.cedula}
                      />
                      <Input
                        label="Fecha de Nacimiento *"
                        type="date"
                        value={fechaNacimiento}
                        onChange={(e) => { setFechaNacimiento(e.target.value); setFieldErrors(prev => ({ ...prev, fechaNacimiento: '' })); }}
                        error={fieldErrors.fechaNacimiento}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Dirección de Residencia
                      </label>
                      <textarea
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Dirección física completa (Opcional)..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-brand-100 focus:border-brand-500 rounded-xl text-slate-800 text-sm transition-all duration-200 focus:outline-hidden focus:ring-4 h-16"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="relative flex flex-col gap-1.5">
                      <Input
                        label="Buscar Estudiante (Nombre o Cédula) *"
                        value={studentSearchTerm}
                        onChange={(e) => {
                          setStudentSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                          if (!e.target.value) setExistingStudentId('');
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                        placeholder="Ej: Laura o 001..."
                        icon={<Search className="w-4.5 h-4.5 text-slate-400" />}
                      />

                      {isDropdownOpen && studentSearchTerm && (
                        <div className="absolute top-[64px] left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1">
                          {filteredExistingStudents.length > 0 ? (
                            filteredExistingStudents.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 rounded-lg transition-colors flex flex-col"
                                onMouseDown={() => {
                                  setExistingStudentId(s.id);
                                  setStudentSearchTerm(s.nombreCompleto);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                <span className="font-bold text-slate-800">{s.nombreCompleto}</span>
                                <span className="text-[10px] font-semibold text-slate-400">Cédula: {s.cedula || 'N/A'} - Matrícula: {s.matricula}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-sm text-slate-500 font-semibold">
                              No se encontraron estudiantes.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

                <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Curso a Inscribir *"
                      value={cursoId}
                      onChange={(e) => setCursoId(e.target.value)}
                      options={[
                        { value: '', label: 'Seleccionar curso...' },
                        ...courses
                          .filter((c) => c.estado === 'activo')
                          .map((c) => ({ value: c.id, label: `${c.nombre} (${formatCurrency(c.costo)}/mod)` }))
                      ]}
                    />
                    <Select
                      label="Horario Asignado *"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      options={[
                        { value: '', label: 'Elegir tanda...' },
                        ...config.horarios.map(h => ({
                          value: h.value,
                          label: h.label,
                        })),
                      ]}
                    />
                  </div>

                  {selectedCourse && (
                    <>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deuda Total del Curso</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-lg font-black text-slate-800">
                            {formatCurrency(getTotalCourseCost(selectedCourse))}
                          </span>
                          {selectedCourse.frecuenciaPago === 'unico' ? (
                            <span className="text-[10px] font-semibold text-slate-400">
                              (pago único)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">
                              ({formatCurrency(selectedCourse.costo)}/{selectedCourse.frecuenciaPago === 'semanal' ? 'sem' : 'mes'} × {Math.round(((selectedCourse.duracionTotalMeses ?? (selectedCourse.duracionModuloMeses || 1) * selectedCourse.modulos) * 30) / getIntervalDays(selectedCourse.frecuenciaPago))} períodos)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-amber-600 mt-1">Esta deuda se cobrará en la sección Cobros</p>
                      </div>

                      {isCourseFull && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                          <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                          <span>Este curso ha alcanzado su capacidad máxima ({enrolledCount}/{selectedCourse.capacidad}). No se pueden inscribir más estudiantes.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Costo de Inscripción */}
                  <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo de Inscripción</h3>

                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Input
                          label="Monto de Inscripción ($)"
                          type="number"
                          value={inputValue(montoInscripcion)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMontoInscripcion(val);
                            if (val > 0) setInscripcionGratis(false);
                          }}
                          placeholder="0"
                          icon={<Wallet className="w-4.5 h-4.5" />}
                          disabled={inscripcionGratis}
                        />
                      </div>
                      <div className="pb-0.5 flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={inscripcionGratis}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setInscripcionGratis(checked);
                              if (checked) {
                                setMontoInscripcion(0);
                                setMontoRecibido(0);
                              }
                            }}
                          />
                          <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-[18px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                          <span className="ms-2.5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Gratis</span>
                        </label>
                      </div>
                    </div>

                    {!inscripcionGratis && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Monto Recibido ($)"
                            type="number"
                            value={inputValue(montoRecibido)}
                            onChange={(e) => setMontoRecibido(Number(e.target.value))}
                            placeholder={montoInscripcion.toString()}
                            icon={<Coins className="w-4.5 h-4.5" />}
                          />
                          <Select
                            label="Método de Pago"
                            value={inscripcionMetodoPago}
                            onChange={(e) => setInscripcionMetodoPago(e.target.value as 'efectivo' | 'transferencia')}
                            options={[
                              { value: 'efectivo', label: 'Efectivo' },
                              { value: 'transferencia', label: 'Transferencia Bancaria' }
                            ]}
                          />
                        </div>

                        {montoRecibido >= montoInscripcion && montoRecibido > 0 && (
                      <div className={`p-3 rounded-xl flex items-center justify-between ${vuelta > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                        <span className={`text-xs font-bold ${vuelta > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {vuelta > 0 ? 'Vuelta' : 'Pago exacto'}
                        </span>
                        <span className={`text-base font-black ${vuelta > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {vuelta > 0 ? formatCurrency(vuelta) : '$0'}
                        </span>
                      </div>
                    )}

                    {montoInscripcion > 0 && (
                      <div className="p-4 bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-black text-brand-700 uppercase tracking-wider">Total a cobrar ahora</span>
                        <span className="text-lg font-black text-brand-700">{formatCurrency(montoInscripcion)}</span>
                      </div>
                    )}
                  </>
                )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button variant="success" type="submit" size="lg" fullWidth icon={<CheckCircle2 className="w-4.5 h-4.5" />}>
                    Revisar Inscripción
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="xl:col-span-1">
            <Card title="Resumen de Inscripción" subtitle="Detalle del curso seleccionado">
              <div className="flex flex-col gap-5 text-sm font-semibold text-slate-700">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-slate-400 font-bold uppercase text-xs">Duración</span>
                  <span className="text-slate-800 font-extrabold">{selectedCourse ? (selectedCourse.duracionTotalMeses ?? (selectedCourse.duracionModuloMeses || 1) * (selectedCourse.modulos || 0)) + ' meses' : 'N/A'}</span>
                </div>

                {selectedCourse && (
                  <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
                    <span className="text-slate-400 font-bold uppercase text-xs">Cupos</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{enrolledCount} / {selectedCourse.capacidad || 25} ocupados</span>
                      <span className={`font-black ${isCourseFull ? 'text-rose-600' : enrolledCount / (selectedCourse.capacidad || 25) >= 0.8 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {isCourseFull ? 'Lleno' : `${selectedCourse.capacidad || 25 - enrolledCount} libres`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCourseFull
                            ? 'bg-rose-500'
                            : enrolledCount / (selectedCourse.capacidad || 25) >= 0.8
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((enrolledCount / (selectedCourse.capacidad || 25)) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <span className="text-slate-400 font-bold uppercase text-xs">Total del Curso</span>
                  {selectedCourse && (
                    <>
                      <div className="flex items-center justify-between">
                        {selectedCourse.frecuenciaPago === 'unico' ? (
                          <>
                            <span className="text-slate-600">Pago único</span>
                            <span className="text-rose-600 font-black">{formatCurrency(selectedCourse.costo)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-600">{formatCurrency(selectedCourse.costo)}/{selectedCourse.frecuenciaPago === 'semanal' ? 'sem' : selectedCourse.frecuenciaPago === 'quincenal' ? 'quinc' : 'mes'} × {Math.round(((selectedCourse.duracionTotalMeses ?? (selectedCourse.duracionModuloMeses || 1) * selectedCourse.modulos) * 30) / getIntervalDays(selectedCourse.frecuenciaPago))} períodos</span>
                            <span className="text-rose-600 font-black">{formatCurrency(getTotalCourseCost(selectedCourse))}</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {(selectedCourse.tipoPeriodoAcademico || 'mensual')} · {selectedCourse.duracionModuloMeses || 1} {((selectedCourse.duracionModuloMeses || 1) === 1) ? 'mes' : 'meses'} / módulo · Pago {selectedCourse.frecuenciaPago === 'semanal' ? 'semanal' : selectedCourse.frecuenciaPago === 'quincenal' ? 'quincenal' : selectedCourse.frecuenciaPago === 'mensual' ? 'mensual' : 'único'}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                  <span className="text-slate-400 font-bold uppercase text-xs">Inscripción</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{inscripcionGratis ? 'Gratis' : formatCurrency(montoInscripcion)}</span>
                    <span className={`font-black ${inscripcionGratis ? 'text-emerald-600' : 'text-brand-600'}`}>
                      {inscripcionGratis ? '$0' : formatCurrency(montoInscripcion)}
                    </span>
                  </div>
                  {!inscripcionGratis && montoInscripcion > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-600">Se cobrará ahora</span>
                  )}
                </div>

                <div className="flex flex-col gap-3 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl mt-2 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <span>Matrícula generada automáticamente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <span>Inscripción se cobra ahora; mensualidades en <strong>Cobros</strong></span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="no-print animate-fade-in">
          <Card title="Revisar datos de inscripción">
            <div className="flex flex-col gap-6">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                  <ShieldCheck className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del Estudiante</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 text-sm font-black shrink-0">
                        {nombreCompleto.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{nombreCompleto}</span>
                        <span className="text-[10px] font-semibold text-slate-400">{cedula ? `Cédula: ${cedula}` : 'Sin cédula'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                      <span>Tel: {telefono}</span>
                      {direccion && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span>{direccion}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Curso y Horario</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Curso:</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCourse?.nombre || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Horario:</span>
                      <Badge variant="info" size="sm">{horario || 'N/A'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Duración:</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCourse?.duracion || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Pago / módulo:</span>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedCourse?.costo ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Módulos totales:</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCourse?.modulos ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Costo de Inscripción */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Inscripción</span>
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                      {inscripcionGratis
                        ? 'Gratis'
                        : `Costo: ${formatCurrency(montoInscripcion)} — Pagado ahora`}
                    </p>
                  </div>
                </div>
                {!inscripcionGratis && (
                  <span className="text-lg font-black text-emerald-700">{formatCurrency(montoInscripcion)}</span>
                )}
              </div>

              {/* Deuda de Mensualidades */}
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Deuda Total del Curso</span>
                    {selectedCourse?.frecuenciaPago === 'unico' ? (
                      <p className="text-xs font-semibold text-rose-600 mt-0.5">
                        Pago único: {formatCurrency(selectedCourse.costo)}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-rose-600 mt-0.5">
                        {formatCurrency(selectedCourse?.costo ?? 0)}/{selectedCourse?.frecuenciaPago === 'semanal' ? 'sem' : 'mes'} × {selectedCourse ? Math.round(((selectedCourse.duracionTotalMeses ?? (selectedCourse.duracionModuloMeses || 1) * selectedCourse.modulos) * 30) / getIntervalDays(selectedCourse.frecuenciaPago)) : 0} períodos
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-lg font-black text-rose-600">
                  {formatCurrency(getTotalCourseCost(selectedCourse))}
                </span>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold text-amber-800">
                  <p className="font-bold">Resumen del proceso</p>
                  <p className="mt-1">
                    <strong>{inscripcionGratis ? 'Inscripción gratis' : `${formatCurrency(montoInscripcion)} cobrados por inscripción`}</strong>
                    {selectedCourse && ` — La deuda de ${formatCurrency(getTotalCourseCost(selectedCourse))} por el curso completo quedará registrada para cobrarse en la sección Cobros.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" icon={<ShieldCheck className="w-4 h-4" />} onClick={() => setStep('form')}>
                  Editar Datos
                </Button>
                <Button variant="success" type="button" size="lg" fullWidth icon={<CheckCircle2 className="w-4.5 h-4.5" />} onClick={handleConfirmEnrollment}>
                  Confirmar Inscripción
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Confirmación de Inscripción */}
      {enrolledStudent && (() => {
        const courseData = enrolledStudent.cursoSnapshot ?? courses.find((c) => c.id === enrolledStudent.cursoId);
        return (
          <Modal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            title="Inscripción Confirmada"
            size="md"
          >
            <div className="flex flex-col gap-6 w-full" id="invoice-printable-container">
              <div id="invoice-printable">
                <div className={printMode === 'ticket' ? 'ticket-print relative overflow-hidden bg-white p-7 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col font-sans' : 'fullpage-print bg-white border border-slate-100 rounded-2xl shadow-sm'}>
                  {printMode === 'ticket' && (
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-50 rounded-full opacity-60" data-html2canvas-ignore="true"></div>
                  )}

                  <div className={printMode === 'ticket' ? 'flex flex-col items-center justify-center text-center gap-2 pb-6 border-b border-slate-100' : 'flex flex-col items-center justify-center text-center gap-2 pb-6 border-b border-slate-200'}>
                    <div className={printMode === 'ticket' ? 'p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-inner' : 'p-3 rounded-xl bg-emerald-50 text-emerald-600'}>
                      <GraduationCap className={printMode === 'ticket' ? 'w-7 h-7' : 'w-8 h-8'} />
                    </div>
                    <span className={printMode === 'ticket' ? 'font-black text-xl text-slate-800 tracking-tight mt-2' : 'font-black text-2xl text-slate-800 tracking-tight mt-3'}>Colegio de Estrellas La Excelencia</span>
                    <span className={printMode === 'ticket' ? 'text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none' : 'text-xs font-bold text-slate-500 uppercase tracking-widest'}>Comprobante de Inscripción</span>
                    {enrolledStudent.inscripcionGratis && (
                      <span className={printMode === 'ticket' ? 'mt-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest' : 'mt-1.5 text-xs font-black text-emerald-600 uppercase tracking-widest'}>Inscripción Gratis</span>
                    )}
                  </div>

                  <div className={printMode === 'ticket' ? 'grid grid-cols-2 gap-y-4 py-5 border-b border-slate-100 text-xs font-semibold text-slate-600' : 'grid grid-cols-2 gap-y-5 py-6 border-b border-slate-200 text-sm font-semibold text-slate-600'}>
                    <div className="flex flex-col">
                      <span className={printMode === 'ticket' ? 'text-[10px] font-black text-slate-400 uppercase tracking-wider' : 'text-xs font-bold text-slate-400 uppercase tracking-wider'}>Matrícula</span>
                      <span className="text-brand-700 font-mono font-bold mt-1 bg-brand-50 self-start px-2 py-0.5 rounded-md border border-brand-100">{enrolledStudent.matricula}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={printMode === 'ticket' ? 'text-[10px] font-black text-slate-400 uppercase tracking-wider' : 'text-xs font-bold text-slate-400 uppercase tracking-wider'}>Fecha</span>
                      <span className="text-slate-800 mt-1 font-bold">{new Date(enrolledStudent.fechaInscripcion).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className={printMode === 'ticket' ? 'flex flex-col gap-3 py-5 border-b border-slate-100 text-xs text-slate-600 font-semibold' : 'flex flex-col gap-4 py-6 border-b border-slate-200 text-sm text-slate-600 font-semibold'}>
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex flex-col">
                        <span className={printMode === 'ticket' ? 'text-[10px] text-slate-400 font-black uppercase' : 'text-xs text-slate-500 font-bold uppercase'}>Estudiante</span>
                        <span className="text-slate-800 font-black text-sm mt-0.5">{enrolledStudent.nombreCompleto}</span>
                      </div>
                      <User className="w-5 h-5 text-slate-300" />
                    </div>

                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Curso Inscrito:</span>
                      <span className="text-slate-800 font-bold text-right">{courseData?.nombre || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Horario Asignado:</span>
                      <span className="text-brand-600 font-black text-right">{enrolledStudent.horario || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Inscripción pagada */}
                  <div className={printMode === 'ticket' ? 'flex flex-col py-5 text-xs text-slate-600 font-semibold gap-3 border-b border-slate-100' : 'flex flex-col py-6 text-sm text-slate-600 font-semibold gap-4 border-b border-slate-200'}>
                    <div className="flex flex-col gap-1 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Inscripción</span>
                        <span className="text-lg font-black text-emerald-700">{formatCurrency(enrolledStudent.costoInscripcion)}</span>
                      </div>
                      {enrolledStudent.inscripcionGratis ? (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Gratis</span>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-slate-500 font-bold">Monto Recibido</span>
                            <span className="text-slate-800 font-extrabold">{formatCurrency(enrolledPayment?.montoRecibido ?? enrolledStudent.costoInscripcion)}</span>
                          </div>
                          {(enrolledPayment?.vuelta ?? 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold">Vuelta</span>
                              <span className="text-amber-600 font-extrabold">{formatCurrency(enrolledPayment?.vuelta ?? 0)}</span>
                            </div>
                          )}
                          {enrolledPayment && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold">Método</span>
                              <span className="text-slate-800 font-bold uppercase">{enrolledPayment.metodoPago}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Deuda de Mensualidades (pendiente) */}
                  <div className={printMode === 'ticket' ? 'flex flex-col py-5 text-xs text-slate-600 font-semibold gap-3' : 'flex flex-col py-6 text-sm text-slate-600 font-semibold gap-4'}>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl shadow-md">
                      <div className="flex flex-col">
                        <span className="uppercase text-[10px] font-black tracking-widest text-slate-300">Mensualidades (pendiente en Cobros)</span>
                        {courseData && (() => {
                          const frec = courseData.frecuenciaPago;
                          if (frec === 'unico') {
                            return <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{formatCurrency(courseData.costo)} (pago único)</span>;
                          }
                          const totalMonths = 'duracionTotalMeses' in courseData && courseData.duracionTotalMeses
                            ? courseData.duracionTotalMeses
                            : (courseData.duracionModuloMeses || 1) * (courseData.modulos || 0);
                          const totalPeriods = Math.round((totalMonths * 30) / getIntervalDays(frec));
                          return <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{formatCurrency(courseData.costo)} × {totalPeriods} períodos</span>;
                        })()}
                      </div>
                      <span className={printMode === 'ticket' ? 'text-lg font-black text-white' : 'text-xl font-black text-white'}>{formatCurrency(enrolledStudent.balancePendiente)}</span>
                    </div>
                  </div>

                  <div className={printMode === 'ticket' ? 'flex flex-col items-center justify-center text-center mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed' : 'flex flex-col items-center justify-center text-center mt-6 pt-6 border-t border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed'}>
                    <span>RNC 1-01-20304-2 • www.colegioestrellasexcelencia.edu.do</span>
                    <span className="mt-1">¡Bienvenido!</span>
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
                <Button variant="primary" icon={<Wallet className="w-4 h-4" />} onClick={() => { setIsConfirmModalOpen(false); navigate('/payments'); }}>
                  Ir a Cobros
                </Button>
                <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};

export default Enroll;

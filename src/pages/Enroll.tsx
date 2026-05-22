import React, { useState, useEffect } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import {
  CreditCard,
  User,
  GraduationCap,
  ShieldCheck,
  Printer,
  Search
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { z } from 'zod';
import { differenceInYears } from 'date-fns';
import type { Course, Student } from '../types';

const getEnrollSchema = (courses: Course[]) => {
  return z.object({
    isNewStudent: z.boolean(),
    nombreCompleto: z.string().optional(),
    telefono: z.string().optional(),
    fechaNacimiento: z.string().optional(),
    direccion: z.string().optional(),
    cedula: z.string().optional(),
    existingStudentId: z.string().optional(),
    cursoId: z.string().min(1, 'El curso es obligatorio.'),
    horario: z.string().min(1, 'El horario es obligatorio.'),
  }).superRefine((data, ctx) => {
    if (!data.isNewStudent) {
      if (!data.existingStudentId) {
        ctx.addIssue({
          path: ['existingStudentId'],
          code: z.ZodIssueCode.custom,
          message: 'Debe seleccionar un estudiante registrado.'
        });
      }
      return;
    }

    if (!data.nombreCompleto || data.nombreCompleto.trim().length === 0) {
      ctx.addIssue({
        path: ['nombreCompleto'],
        code: z.ZodIssueCode.custom,
        message: 'El nombre completo es obligatorio.'
      });
    }

    if (!data.telefono || data.telefono.trim().length === 0) {
      ctx.addIssue({
        path: ['telefono'],
        code: z.ZodIssueCode.custom,
        message: 'El teléfono es obligatorio.'
      });
    }

    if (!data.fechaNacimiento || data.fechaNacimiento.trim().length === 0) {
      ctx.addIssue({
        path: ['fechaNacimiento'],
        code: z.ZodIssueCode.custom,
        message: 'La fecha de nacimiento es obligatoria.'
      });
      return;
    }

    const birthDate = new Date(data.fechaNacimiento);
    if (isNaN(birthDate.getTime())) {
      ctx.addIssue({
        path: ['fechaNacimiento'],
        code: z.ZodIssueCode.custom,
        message: 'La fecha de nacimiento no es válida.'
      });
      return;
    }

    const age = differenceInYears(new Date(), birthDate);
    const selectedCourse = courses.find(c => c.id === data.cursoId);

    if (selectedCourse) {
      const isIngles = selectedCourse.nombre.toLowerCase().includes('ingl');
      const minAge = isIngles ? 10 : 13;
      if (age < minAge) {
        ctx.addIssue({
          path: ['fechaNacimiento'],
          code: z.ZodIssueCode.custom,
          message: `El estudiante debe tener al menos ${minAge} años para inscribirse en el curso de ${selectedCourse.nombre} (edad actual: ${age} años).`
        });
      }
    }

    if (age >= 18) {
      if (!data.cedula || data.cedula.trim().length === 0) {
        ctx.addIssue({
          path: ['cedula'],
          code: z.ZodIssueCode.custom,
          message: 'La cédula es obligatoria para estudiantes mayores de edad (18 años o más).'
        });
      }
    }
  });
};

export const Enroll: React.FC = () => {
  const { courses, students, enrollStudent } = useAcademyStore();

  const [isNewStudent, setIsNewStudent] = useState(true);
  const [existingStudentId, setExistingStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [horario, setHorario] = useState('');

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

  const [cursoId, setCursoId] = useState('');

  const [enrolledStudent, setEnrolledStudent] = useState<Student | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [error, setError] = useState('');

  const selectedCourseCost = cursoId
    ? courses.find((c) => c.id === cursoId)?.costo ?? 0
    : 0;

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

    const validationResult = getEnrollSchema(courses).safeParse({
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
      setError(validationResult.error.issues[0].message);
      return;
    }

    try {
      const student = enrollStudent({
        nombreCompleto,
        telefono,
        cedula,
        direccion,
        fechaNacimiento,
        cursoId,
        horario,
      });

      setEnrolledStudent(student);
      setIsConfirmModalOpen(true);
      setTimeout(() => window.print(), 500);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al inscribir.');
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 no-print">
        <div className="xl:col-span-2">
          <Card title="Formulario de Inscripción">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej: Laura Mercedes Pérez"
                    icon={<User className="w-4.5 h-4.5" />}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Fecha Nacimiento *"
                      type="date"
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                    />
                    <Input
                      label="Teléfono *"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="809-555-0123"
                    />
                    <Input
                      label="Cédula"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="Opcional < 18 años"
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
                        .map((c) => ({ value: c.id, label: `${c.nombre} (${formatCurrency(c.costo)})` }))
                    ]}
                  />
                  <Select
                    label="Horario Asignado *"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    options={[
                      { value: '', label: 'Elegir tanda...' },
                      { value: '9:00 am - 12:00 pm', label: 'Mañana (9:00 am - 12:00 pm)' },
                      { value: '2:00 pm - 5:00 pm', label: 'Tarde (2:00 pm - 5:00 pm)' }
                    ]}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button variant="success" type="submit" size="lg" fullWidth icon={<CreditCard className="w-4.5 h-4.5" />}>
                  Completar Inscripción
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="xl:col-span-1">
          <Card title="Resumen de Inscripción" subtitle="Detalle del curso seleccionado">
            <div className="flex flex-col gap-5 text-sm font-semibold text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-xs">Costo del Programa</span>
                <span className="text-slate-800 font-extrabold">{formatCurrency(selectedCourseCost)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-400 font-bold uppercase text-xs">Duración</span>
                <span className="text-slate-800 font-extrabold">3 meses</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-rose-600 font-black uppercase text-xs">Total a Pagar (Deuda)</span>
                <span className="text-rose-600 font-black text-lg">{formatCurrency(selectedCourseCost)}</span>
              </div>

              <div className="flex flex-col gap-3 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl mt-2 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Matrícula generada automáticamente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Deuda registrada por el costo total del curso</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Los pagos se realizan en <strong>Registrar Abono</strong></span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmación de Inscripción */}
      {enrolledStudent && (() => {
        const course = courses.find((c) => c.id === enrolledStudent.cursoId);
        return (
          <Modal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            title="Inscripción Confirmada"
            size="md"
          >
            <div className="flex flex-col gap-6 w-full" id="invoice-printable-container">
              <div id="invoice-printable">
                <div className="ticket-print relative overflow-hidden bg-white p-7 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col font-sans">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-50 rounded-full opacity-60" data-html2canvas-ignore="true"></div>

                  <div className="relative flex flex-col items-center justify-center text-center gap-2 pb-6 border-b border-slate-100">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-inner">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <span className="font-black text-xl text-slate-800 tracking-tight mt-2">ACADEMIA DE CURSOS</span>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Comprobante de Inscripción</span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 py-5 border-b border-slate-100 text-xs font-semibold text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Matrícula</span>
                      <span className="text-brand-700 font-mono font-bold mt-1 bg-brand-50 self-start px-2 py-0.5 rounded-md border border-brand-100">{enrolledStudent.matricula}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha</span>
                      <span className="text-slate-800 mt-1 font-bold">{new Date(enrolledStudent.fechaInscripcion).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 py-5 border-b border-slate-100 text-xs text-slate-600 font-semibold">
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase">Estudiante</span>
                        <span className="text-slate-800 font-black text-sm mt-0.5">{enrolledStudent.nombreCompleto}</span>
                      </div>
                      <User className="w-5 h-5 text-slate-300" />
                    </div>

                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Curso Inscrito:</span>
                      <span className="text-slate-800 font-bold text-right">{course?.nombre || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Horario Asignado:</span>
                      <span className="text-brand-600 font-black text-right">{enrolledStudent.horario || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col py-5 text-xs text-slate-600 font-semibold gap-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl shadow-md">
                      <span className="uppercase text-[10px] font-black tracking-widest text-slate-300">Deuda Total del Curso</span>
                      <span className="text-lg font-black text-white">{formatCurrency(enrolledStudent.balancePendiente)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    <span>RNC 1-01-20304-2 • www.academiadecursos.edu.do</span>
                    <span className="mt-1">¡Bienvenido!</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 no-print">
                <Button variant="outline" className="flex-1" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
                  Imprimir Comprobante
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setIsConfirmModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
              <div className="no-print pt-2 flex justify-center">
                <p className="text-xs font-semibold text-slate-400 text-center">
                  Para realizar pagos, vaya a la sección <strong>Registrar Abono</strong> en el menú lateral.
                </p>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};

export default Enroll;

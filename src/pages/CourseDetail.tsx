import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SummaryCard } from '../components/ui/SummaryCard';
import {
  ArrowLeft,
  Printer,
  User,
  GraduationCap,
  DollarSign,
  Briefcase,
  Calendar,
  Phone,
  BookOpen,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { formatCurrency, formatDateStr } from '../utils/formatters';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { courses, teachers, students, payments } = useAcademyStore();

  const course = courses.find((c) => c.id === id);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Curso no encontrado</h2>
        <p className="text-sm font-semibold text-slate-400">El curso solicitado no existe en la base de datos.</p>
        <Link to="/courses">
          <Button variant="primary">Volver a cursos</Button>
        </Link>
      </div>
    );
  }

  // Obtener profesor asignado
  const teacher = teachers.find((t) => t.id === course.profesorId);

  // Obtener estudiantes inscritos en este curso
  const courseStudents = students.filter((s) => s.cursoId === course.id);

  // Obtener cobros realizados para este curso
  const coursePayments = payments.filter((p) => p.cursoId === course.id);
  const totalGenerado = coursePayments.reduce((acc, curr) => acc + curr.montoPagado, 0);

  // Calcular balance pendiente agregado de este curso
  const totalPendiente = courseStudents.reduce((acc, curr) => acc + curr.balancePendiente, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header section (No-print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Cursos
        </Link>
        <Button variant="outline" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
          Imprimir Listado
        </Button>
      </div>

      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
              {course.nombre}
            </h1>
            <Badge variant={course.estado === 'activo' ? 'success' : 'secondary'}>
              {course.estado}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-400 max-w-2xl leading-relaxed">
            {course.descripcion}
          </p>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{course.duracion}</span>
            <span>•</span>
            <span>{course.modulos} módulos ({course.tipoPeriodoAcademico || 'mensual'})</span>
            <span>•</span>
            <span>{course.duracionModuloMeses || 1} {((course.duracionModuloMeses || 1) === 1) ? 'mes' : 'meses'} / módulo</span>
            <span>•</span>
            <span>Pago: {course.frecuenciaPago === 'semanal' ? 'Semanal' : course.frecuenciaPago === 'quincenal' ? 'Quincenal' : course.frecuenciaPago === 'mensual' ? 'Mensual' : 'Único'}</span>
            <span>•</span>
            <span>Capacidad: {course.capacidad} alumnos</span>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end text-slate-600">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Costo Mensual</span>
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
            {formatCurrency(course.costo)}
          </span>
        </div>
      </div>

      {/* KPI Cards (No-print) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <SummaryCard
          title="Alumnos Inscritos"
          value={`${courseStudents.length} / ${course.capacidad}`}
          icon={<GraduationCap className="w-5 h-5" />}
          variant="brand"
        />
        <SummaryCard
          title="Duración Total"
          value={course.duracion}
          icon={<Calendar className="w-5 h-5" />}
          variant="slate"
        />
        <SummaryCard
          title="Ingresos Recaudados"
          value={formatCurrency(totalGenerado)}
          icon={<DollarSign className="w-5 h-5" />}
          variant="success"
        />
        <SummaryCard
          title="Cartera Pendiente"
          value={formatCurrency(totalPendiente)}
          icon={<Briefcase className="w-5 h-5" />}
          variant="danger"
        />
      </div>

      {/* Main Grid: Detalles de Profesor & Alumnos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Profesor Asignado (No-print) */}
        <div className="xl:col-span-1 no-print">
          <Card
            title="Profesor Asignado"
            subtitle="Información de contacto y especialidad"
          >
            {teacher ? (
              <div className="flex flex-col gap-6">
                {/* Profile Pic Circle Mock */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{teacher.nombreCompleto}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{teacher.especialidad}</span>
                  </div>
                </div>

                {/* Details list */}
                <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-5 text-xs text-slate-600 font-semibold">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Teléfono: {teacher.telefono}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Cédula: {teacher.cedula}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Dirección: {teacher.direccion}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                <User className="w-8 h-8 text-slate-200 mb-2" />
                <span className="text-xs font-semibold">Ningún profesor asignado a este curso</span>
              </div>
            )}
          </Card>
        </div>

        {/* Listado de Alumnos (Visible en Impresión) */}
        <div className="xl:col-span-2">
          {/* Printable Ticket Header */}
          <div className="hidden print-only text-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wide">Academia de Cursos</h2>
            <p className="text-xs font-semibold">Listado Oficial de Estudiantes Registrados</p>
            <div className="border-b border-slate-400 my-4" />
            <div className="grid grid-cols-2 text-left text-xs gap-1.5 font-bold mb-4">
              <span>Curso: {course.nombre}</span>
              <span>Profesor: {teacher ? teacher.nombreCompleto : 'Sin asignar'}</span>
              <span>Duración: {course.duracion}</span>
              <span>Fecha Impresión: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="border-b border-slate-400 mb-4" />
          </div>

          <div className="print-area">
            <Card
              title={`Estudiantes Inscritos (${courseStudents.length})`}
              subtitle="Roster oficial de alumnos cursando actualmente"
              noPadding
            >
              {courseStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 p-6">
                  <ClipboardList className="w-10 h-10 text-slate-300 mb-3" />
                  <span className="text-xs font-bold text-slate-400 mb-1">No hay alumnos inscritos</span>
                  <p className="text-[10px] max-w-xs text-slate-400">
                    Registra un estudiante en el módulo de inscripción y asócialo a este curso.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 print:bg-transparent border-b border-slate-100 print:border-slate-400 font-bold uppercase text-[10px] tracking-wider text-slate-400 print:text-black">
                      <tr>
                        <th className="px-6 py-4.5">Matrícula</th>
                        <th className="px-6 py-4.5">Nombre Completo</th>
                        <th className="px-6 py-4.5">Teléfono</th>
                        <th className="px-6 py-4.5">Inscripción</th>
                        <th className="px-6 py-4.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {courseStudents.map((student) => (
                        <tr key={student.id} className="text-slate-700 font-medium hover:bg-slate-50/50 print:hover:bg-transparent transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-400 print:text-black">{student.matricula}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 print:text-black">{student.nombreCompleto}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 print:text-black">{student.telefono}</td>
                          <td className="px-6 py-4 text-xs text-slate-400 print:text-black">
                            {formatDateStr(student.fechaInscripcion)}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-800 print:text-black">
                            {formatCurrency(student.balancePendiente)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

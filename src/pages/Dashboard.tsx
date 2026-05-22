import React from 'react';
import { useAcademyStore } from '../store/academyStore';
import { SummaryCard } from '../components/ui/SummaryCard';
import { format } from 'date-fns';
import {
  Users,
  DollarSign,
  PiggyBank,
  CheckSquare,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const Dashboard: React.FC = () => {
  const { students, courses, payments } = useAcademyStore();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filtrar transacciones de hoy
  const todayPayments = payments.filter((p) => p.fecha === todayStr);

  // 1. Cálculos de Estadísticas
  const estudiantesInscritos = students.length;
  
  const ingresosDia = todayPayments.reduce((acc, curr) => acc + curr.montoPagado, 0);
  
  const pagosEfectivo = todayPayments
    .filter((p) => p.metodoPago === 'efectivo')
    .reduce((acc, curr) => acc + curr.montoPagado, 0);

  const pagosTransferencia = todayPayments
    .filter((p) => p.metodoPago === 'transferencia')
    .reduce((acc, curr) => acc + curr.montoPagado, 0);

  const cursosActivos = courses.filter((c) => c.estado === 'activo').length;

  const estudiantesPendientesBalance = students.filter((s) => s.balancePendiente > 0).length;

  // 2. Calcular curso con más estudiantes
  const courseCounts = students.reduce((acc, curr) => {
    acc[curr.cursoId] = (acc[curr.cursoId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let masEstudiantesId = '';
  let masEstudiantesCount = 0;
  Object.entries(courseCounts).forEach(([courseId, count]) => {
    if (count > masEstudiantesCount) {
      masEstudiantesCount = count;
      masEstudiantesId = courseId;
    }
  });

  const cursoMasEstudiantes = courses.find((c) => c.id === masEstudiantesId);

  // 3. Distribución de alumnos en cursos con barra de progreso
  const coursesWithStats = courses.map((course) => {
    const enrolled = students.filter((s) => s.cursoId === course.id).length;
    const capacity = 25; // Cupo máximo teórico por curso
    const percent = Math.min(100, Math.round((enrolled / capacity) * 100));
    return {
      ...course,
      enrolled,
      percent
    };
  });

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
          Resumen de la Academia
        </h1>
        <p className="text-sm font-semibold text-slate-400">
          Revisa el rendimiento del día, cobros realizados y matriculados.
        </p>
      </div>

      {/* Grid de Tarjetas Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Inscritos"
          value={estudiantesInscritos}
          icon={<Users className="w-5 h-5" />}
          variant="brand"
        />
        <SummaryCard
          title="Ingresos del Día"
          value={formatCurrency(ingresosDia)}
          icon={<DollarSign className="w-5 h-5" />}
          variant="success"
        />
        <SummaryCard
          title="Caja Efectivo"
          value={formatCurrency(pagosEfectivo)}
          icon={<PiggyBank className="w-5 h-5" />}
          variant="info"
        />
        <SummaryCard
          title="Caja Transferencia"
          value={formatCurrency(pagosTransferencia)}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Cursos Activos"
          value={cursosActivos}
          icon={<BookOpen className="w-5 h-5" />}
          variant="slate"
        />
        <SummaryCard
          title="Demanda de Curso"
          value={cursoMasEstudiantes ? cursoMasEstudiantes.nombre : 'Ninguno'}
          icon={<CheckSquare className="w-5 h-5" />}
          variant="brand"
          trend={
            cursoMasEstudiantes
              ? { label: `${masEstudiantesCount} alumnos`, isPositive: true }
              : undefined
          }
        />
        <SummaryCard
          title="Alumnos Pendientes de Pago"
          value={estudiantesPendientesBalance}
          icon={<AlertCircle className="w-5 h-5" />}
          variant="danger"
        />
        <SummaryCard
          title="Ingreso Total Hoy"
          value={formatCurrency(ingresosDia)}
          icon={<DollarSign className="w-5 h-5" />}
          variant="success"
        />
      </div>

      {/* Grid de Paneles Detallados */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Panel Izquierdo: Últimas Transacciones del Día */}
        <div className="xl:col-span-2">
          <Card
            title="Ingresos y Matriculados Recientes"
            subtitle="Listado de cobros efectuados el día de hoy"
            headerAction={
              <Link to="/enroll">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-wider cursor-pointer">
                  Inscribir nuevo
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Link>
            }
          >
            {todayPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-14">
                <Clock className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
                <span className="text-sm font-bold text-slate-400">No hay cobros registrados hoy</span>
                <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Utiliza el módulo de "Inscribir Alumno" para empezar a registrar ingresos a caja.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Factura</th>
                      <th className="pb-3">Estudiante</th>
                      <th className="pb-3">Curso</th>
                      <th className="pb-3">Hora</th>
                      <th className="pb-3 text-center">Método</th>
                      <th className="pb-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {todayPayments.map((payment) => (
                      <tr key={payment.id} className="text-slate-700 font-medium hover:bg-slate-50/50 transition-colors">
                        <td className="py-4.5 font-mono text-xs text-slate-400">{payment.id}</td>
                        <td className="py-4.5 font-bold text-slate-800">{payment.estudianteNombre}</td>
                        <td className="py-4.5 text-xs text-slate-500">{payment.cursoNombre}</td>
                        <td className="py-4.5 text-xs text-slate-400">{payment.hora}</td>
                        <td className="py-4.5 text-center">
                          <Badge variant={payment.metodoPago === 'efectivo' ? 'success' : 'info'}>
                            {payment.metodoPago}
                          </Badge>
                        </td>
                        <td className="py-4.5 text-right font-extrabold text-slate-800">
                          {formatCurrency(payment.montoPagado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Panel Derecho: Progreso de Cursos (Cupos / Inscritos) */}
        <div>
          <Card
            title="Capacidad y Progreso"
            subtitle="Cupos ocupados por curso (Capacidad: 25)"
          >
            <div className="flex flex-col gap-5">
              {coursesWithStats.map((course) => (
                <div key={course.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <Link to={`/courses/${course.id}`} className="hover:text-brand-600 transition-colors flex items-center gap-1.5">
                      {course.nombre}
                    </Link>
                    <span className="text-slate-400 font-extrabold text-right">
                      {course.enrolled} / 25
                    </span>
                  </div>
                  {/* Progress Bar Container */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-linear-to-r ${
                        course.percent < 30
                          ? 'from-indigo-400 to-indigo-500'
                          : course.percent < 70
                          ? 'from-brand-500 to-brand-600'
                          : 'from-emerald-400 to-emerald-500'
                      }`}
                      style={{ width: `${course.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

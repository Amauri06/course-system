import React, { useState } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Edit, Trash2, ShieldAlert, GraduationCap, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import type { Course } from '../types';

export const Courses: React.FC = () => {
  const { courses, teachers, students, addCourse, updateCourse, deleteCourse, toggleCourseState } = useAcademyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [costo, setCosto] = useState(150);
  const [modulos, setModulos] = useState(6);
  const [descripcion, setDescripcion] = useState('');
  const [profesorId, setProfesorId] = useState('');
  const [estado, setEstado] = useState<'activo' | 'inactivo'>('activo');
  const [frecuenciaPago, setFrecuenciaPago] = useState<'semanal' | 'quincenal' | 'mensual' | 'unico'>('quincenal');
  const [tipoPeriodoAcademico, setTipoPeriodoAcademico] = useState<'mensual' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'personalizado'>('mensual');
  const [capacidad, setCapacidad] = useState(25);
  const [duracionModuloMeses, setDuracionModuloMeses] = useState(1);
  const [duracionTotalMeses, setDuracionTotalMeses] = useState(6);
  const [duracionTotalPreset, setDuracionTotalPreset] = useState('6');
  const [error, setError] = useState('');

  const getDefaultMonthsForType = (tipo: string) => {
    switch (tipo) {
      case 'mensual': return 1;
      case 'trimestral': return 3;
      case 'cuatrimestral': return 4;
      case 'semestral': return 6;
      default: return 1;
    }
  };

  const computedModulos = tipoPeriodoAcademico === 'personalizado'
    ? modulos
    : Math.round(duracionTotalMeses / duracionModuloMeses) || 1;

  const openCreateModal = () => {
    setEditingCourse(null);
    setNombre('');
    setCosto(150);
    setModulos(6);
    setDescripcion('');
    setProfesorId(teachers[0]?.id || '');
    setEstado('activo');
    setFrecuenciaPago('quincenal');
    setTipoPeriodoAcademico('mensual');
    setDuracionModuloMeses(1);
    setDuracionTotalMeses(6);
    setDuracionTotalPreset('6');
    setCapacidad(25);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    const durTotal = course.duracionTotalMeses ?? (course.duracionModuloMeses || 1) * course.modulos;
    const preset = [3, 6, 9, 12].includes(durTotal) ? String(durTotal) : 'personalizado';

    setEditingCourse(course);
    setNombre(course.nombre);
    setCosto(course.costo);
    setModulos(course.modulos);
    setDescripcion(course.descripcion);
    setProfesorId(course.profesorId || '');
    setEstado(course.estado);
    setFrecuenciaPago(course.frecuenciaPago || 'quincenal');
    setTipoPeriodoAcademico(course.tipoPeriodoAcademico || 'mensual');
    setDuracionModuloMeses(course.duracionModuloMeses || 1);
    setDuracionTotalMeses(durTotal);
    setDuracionTotalPreset(preset);
    setCapacidad(course.capacidad || 25);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !descripcion.trim()) {
      setError('Por favor, rellene todos los campos requeridos.');
      return;
    }

    const actualModulos = tipoPeriodoAcademico === 'personalizado'
      ? Number(modulos)
      : computedModulos;

    const coursePayload = {
      nombre,
      duracion: `${duracionTotalMeses} meses`,
      modulos: actualModulos,
      costo: Number(costo),
      descripcion,
      profesorId: profesorId || null,
      estado,
      frecuenciaPago,
      tipoPeriodoAcademico,
      duracionModuloMeses: Number(duracionModuloMeses),
      duracionTotalMeses: Number(duracionTotalMeses),
      capacidad: Number(capacidad),
    };

    if (editingCourse) {
      updateCourse({
        ...coursePayload,
        id: editingCourse.id
      });
      toast.success('Curso actualizado correctamente');
    } else {
      addCourse(coursePayload);
      toast.success('Curso creado correctamente');
    }
    setIsModalOpen(false);
  };

  // Obtener nombre del profesor
  const getTeacherName = (id: string | null) => {
    if (!id) return 'Sin asignar';
    const teacher = teachers.find((t) => t.id === id);
    return teacher ? teacher.nombreCompleto : 'Sin asignar';
  };

  // Obtener cantidad de inscritos
  const getStudentCount = (courseId: string) => {
    return students.filter((s) => s.cursoId === courseId).length;
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
            Cursos Disponibles
          </h1>
          <p className="text-sm font-semibold text-slate-400">
            Administra los programas académicos, sus costos y profesores asociados.
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          Crear Curso
        </Button>
      </div>

      {/* Grid de Cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const studentCount = getStudentCount(course.id);
          const teacherName = getTeacherName(course.profesorId);

          return (
            <Card
              key={course.id}
              className="hover-card flex flex-col justify-between"
              noPadding
              footer={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        toggleCourseState(course.id);
                        toast.success(course.estado === 'activo' ? 'Curso desactivado' : 'Curso activado');
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={course.estado === 'activo' ? 'Desactivar curso' : 'Activar curso'}
                    >
                      {course.estado === 'activo' ? (
                        <ToggleRight className="w-5 h-5 text-brand-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(course)}
                      className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar curso"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar el curso "${course.nombre}"?`)) {
                          deleteCourse(course.id);
                          toast.success('Curso eliminado correctamente');
                        }
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar curso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 tracking-wider uppercase"
                  >
                    Detalle
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              }
            >
              <div className="p-6 flex-1 flex flex-col gap-4">
                {/* Header card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                      {course.nombre}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {course.duracion} • {course.modulos} módulos ({course.tipoPeriodoAcademico || 'mensual'})
                    </span>
                  </div>
                  <Badge variant={course.estado === 'activo' ? 'success' : 'secondary'}>
                    {course.estado}
                  </Badge>
                </div>

                {/* Descripcion */}
                <p className="text-xs font-medium text-slate-400 leading-relaxed line-clamp-3">
                  {course.descripcion}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-3 border-y border-slate-100 my-1 text-slate-600">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Costo/mod</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5">
                      {formatCurrency(course.costo)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Pago</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5">
                      {course.frecuenciaPago === 'semanal' ? 'Semanal' : course.frecuenciaPago === 'quincenal' ? 'Quincenal' : course.frecuenciaPago === 'mensual' ? 'Mensual' : 'Único'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Inscritos</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                      <GraduationCap className="w-4 h-4 text-brand-600 shrink-0" />
                      {studentCount}
                    </span>
                  </div>
                </div>

                {/* Profesor */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Profesor Asignado</span>
                  <span className="text-xs font-bold text-slate-700 mt-0.5 truncate">
                    {teacherName}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal para Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Nombre del Curso *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Cajera Bancaria"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Costo del Curso ($) *"
              type="number"
              value={costo}
              onChange={(e) => setCosto(Number(e.target.value))}
              placeholder="150"
              required
            />
            <Input
              label="Capacidad Máx. Estudiantes *"
              type="number"
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
              placeholder="25"
              required
            />
          </div>

          <Select
            label="Frecuencia de Pago *"
            value={frecuenciaPago}
            onChange={(e) => setFrecuenciaPago(e.target.value as 'semanal' | 'quincenal' | 'mensual' | 'unico')}
            options={[
              { value: 'quincenal', label: 'Quincenal (cada 15 días)' },
              { value: 'mensual', label: 'Mensual' },
              { value: 'semanal', label: 'Semanal (cada 7 días)' },
              { value: 'unico', label: 'Pago Único' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Período Académico *"
              value={tipoPeriodoAcademico}
              onChange={(e) => {
                const tipo = e.target.value as 'mensual' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'personalizado';
                setTipoPeriodoAcademico(tipo);
                if (tipo !== 'personalizado') {
                  setDuracionModuloMeses(getDefaultMonthsForType(tipo));
                }
              }}
              options={[
                { value: 'mensual', label: 'Mensual (1 mes por módulo)' },
                { value: 'trimestral', label: 'Trimestral (3 meses por módulo)' },
                { value: 'cuatrimestral', label: 'Cuatrimestral (4 meses por módulo)' },
                { value: 'semestral', label: 'Semestral (6 meses por módulo)' },
                { value: 'personalizado', label: 'Personalizado' }
              ]}
            />
            {tipoPeriodoAcademico === 'personalizado' ? (
              <Input
                label="Duración por Módulo (meses) *"
                type="number"
                value={duracionModuloMeses}
                onChange={(e) => setDuracionModuloMeses(Number(e.target.value))}
                placeholder="Ej: 2"
                required
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duración por Módulo</label>
                <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold flex items-center h-[42px]">
                  {duracionModuloMeses} {duracionModuloMeses === 1 ? 'mes' : 'meses'}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duración Total del Curso *</label>
              <Select
                value={duracionTotalPreset}
                onChange={(e) => {
                  const val = e.target.value;
                  setDuracionTotalPreset(val);
                  if (val !== 'personalizado') {
                    setDuracionTotalMeses(Number(val));
                  }
                }}
                options={[
                  { value: '3', label: '3 meses' },
                  { value: '6', label: '6 meses' },
                  { value: '9', label: '9 meses' },
                  { value: '12', label: '12 meses' },
                  { value: 'personalizado', label: 'Personalizado' }
                ]}
              />
              {duracionTotalPreset === 'personalizado' && (
                <Input
                  type="number"
                  value={duracionTotalMeses}
                  onChange={(e) => setDuracionTotalMeses(Number(e.target.value))}
                  placeholder="Ej: 5"
                  required
                />
              )}
            </div>
            {tipoPeriodoAcademico === 'personalizado' ? (
              <Input
                label="Cantidad de Módulos *"
                type="number"
                value={modulos}
                onChange={(e) => setModulos(Number(e.target.value))}
                placeholder="6"
                required
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cantidad de Módulos</label>
                <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold flex items-center h-[42px]">
                  {computedModulos} módulo{computedModulos !== 1 ? 's' : ''} de {duracionModuloMeses} {duracionModuloMeses === 1 ? 'mes' : 'meses'}
                </div>
              </div>
            )}
          </div>

          <Select
            label="Profesor Asignado *"
            value={profesorId}
            onChange={(e) => setProfesorId(e.target.value)}
            options={[
              { value: '', label: 'Seleccionar profesor...' },
              ...teachers.map((t) => ({ value: t.id, label: `${t.nombreCompleto} (${t.especialidad})` }))
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Descripción del Curso *
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Escriba una descripción corta sobre el programa académico..."
              className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-brand-100 focus:border-brand-500 rounded-xl text-slate-800 text-sm placeholder-slate-400 transition-all duration-200 focus:outline-hidden focus:ring-4 h-24"
              required
            />
          </div>

          <Select
            label="Estado *"
            value={estado}
            onChange={(e) => setEstado(e.target.value as 'activo' | 'inactivo')}
            options={[
              { value: 'activo', label: 'Activo' },
              { value: 'inactivo', label: 'Inactivo' }
            ]}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingCourse ? 'Guardar Cambios' : 'Crear Curso'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Courses;

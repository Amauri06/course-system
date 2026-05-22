import React, { useState } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Edit, Trash2, ShieldAlert, Phone, BookOpen, MapPin, User, Award } from 'lucide-react';

export const Teachers: React.FC = () => {
  const { teachers, courses, addTeacher, updateTeacher, deleteTeacher } = useAcademyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

  // Form states
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [estado, setEstado] = useState<'activo' | 'inactivo'>('activo');
  const [error, setError] = useState('');

  const openCreateModal = () => {
    setEditingTeacher(null);
    setNombreCompleto('');
    setTelefono('');
    setCedula('');
    setDireccion('');
    setEspecialidad('');
    setEstado('activo');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: any) => {
    setEditingTeacher(teacher);
    setNombreCompleto(teacher.nombreCompleto);
    setTelefono(teacher.telefono);
    setCedula(teacher.cedula);
    setDireccion(teacher.direccion);
    setEspecialidad(teacher.especialidad);
    setEstado(teacher.estado);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim() || !telefono.trim() || !cedula.trim() || !direccion.trim() || !especialidad.trim()) {
      setError('Por favor, rellene todos los campos requeridos.');
      return;
    }

    const teacherPayload = {
      nombreCompleto,
      telefono,
      cedula,
      direccion,
      especialidad,
      estado
    };

    if (editingTeacher) {
      updateTeacher({
        ...teacherPayload,
        id: editingTeacher.id
      });
    } else {
      addTeacher(teacherPayload);
    }
    setIsModalOpen(false);
  };

  // Obtener cursos enseñados por el profesor
  const getTeacherCourses = (teacherId: string) => {
    return courses.filter((c) => c.profesorId === teacherId);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
            Profesores
          </h1>
          <p className="text-sm font-semibold text-slate-400">
            Administra el personal docente de la academia y visualiza sus cursos asignados.
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          Agregar Profesor
        </Button>
      </div>

      {/* Grid de Profesores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => {
          const assignedCourses = getTeacherCourses(teacher.id);

          return (
            <Card
              key={teacher.id}
              className="hover-card flex flex-col justify-between"
              noPadding
              footer={
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEditModal(teacher)}
                    className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Editar profesor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar al profesor "${teacher.nombreCompleto}"? Se desasignará automáticamente de todos sus cursos.`)) {
                        deleteTeacher(teacher.id);
                      }
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar profesor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              }
            >
              <div className="p-6 flex flex-col gap-5 flex-grow">
                {/* Header card */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-tight truncate">
                      {teacher.nombreCompleto}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Award className="text-brand-500 w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                        {teacher.especialidad}
                      </span>
                    </div>
                  </div>
                  <Badge variant={teacher.estado === 'activo' ? 'success' : 'secondary'}>
                    {teacher.estado}
                  </Badge>
                </div>

                {/* Contact list */}
                <div className="flex flex-col gap-2.5 border-t border-slate-100/70 pt-4 text-xs font-semibold text-slate-600">
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
                    <span className="truncate">Dirección: {teacher.direccion}</span>
                  </div>
                </div>

                {/* Cursos Asignados */}
                <div className="flex flex-col gap-2 border-t border-slate-100/70 pt-4">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Cursos Asignados</span>
                  {assignedCourses.length === 0 ? (
                    <span className="text-xs font-semibold text-slate-400 italic">Ningún curso asignado</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedCourses.map((c) => (
                        <span key={c.id} className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-lg border border-brand-100/30">
                          {c.nombre}
                        </span>
                      ))}
                    </div>
                  )}
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
        title={editingTeacher ? 'Editar Profesor' : 'Agregar Profesor'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Nombre Completo *"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Ej: Patricia Mendoza Ruíz"
            required
          />

          <div className="grid grid-cols-2 gap-4">
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
              placeholder="809-555-0192"
              required
            />
          </div>

          <Input
            label="Especialidad / Título *"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Ej: Cajera Bancaria & Finanzas"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dirección de Residencia *
            </label>
            <textarea
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Escriba la dirección física completa..."
              className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-brand-100 focus:border-brand-500 rounded-xl text-slate-800 text-sm placeholder-slate-400 transition-all duration-200 focus:outline-hidden focus:ring-4 h-20"
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
              {editingTeacher ? 'Guardar Cambios' : 'Agregar Profesor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teachers;

import React, { useState } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Edit, Trash2, ShieldAlert, Search } from 'lucide-react';
import { formatCurrency, formatDateStr } from '../utils/formatters';

export const Students: React.FC = () => {
  const { students, courses, updateStudent, deleteStudent } = useAcademyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');

  // Modal editing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // Form states
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [balancePendiente, setBalancePendiente] = useState(0);
  const [error, setError] = useState('');

  // Filtrar estudiantes
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cedula.includes(searchTerm) ||
      student.matricula.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = selectedCourseFilter === '' || student.cursoId === selectedCourseFilter;

    return matchesSearch && matchesCourse;
  });

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setNombreCompleto(student.nombreCompleto);
    setTelefono(student.telefono);
    setCedula(student.cedula);
    setDireccion(student.direccion);
    setCursoId(student.cursoId);
    setBalancePendiente(student.balancePendiente);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim() || !telefono.trim() || !cedula.trim() || !direccion.trim()) {
      setError('Por favor, rellene todos los campos requeridos.');
      return;
    }

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        nombreCompleto,
        telefono,
        cedula,
        direccion,
        cursoId,
        balancePendiente: Number(balancePendiente)
      });
    }
    setIsModalOpen(false);
  };

  const getCourseName = (id: string) => {
    const c = courses.find((course) => course.id === id);
    return c ? c.nombre : 'Desconocido';
  };

  const columns = [
    {
      key: 'matricula',
      header: 'Matrícula',
      render: (row: any) => <span className="font-mono text-xs font-bold text-slate-400">{row.matricula}</span>
    },
    {
      key: 'nombreCompleto',
      header: 'Nombre Completo',
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{row.nombreCompleto}</span>
          <span className="text-[10px] text-slate-400 font-bold">{row.cedula}</span>
        </div>
      )
    },
    {
      key: 'cursoId',
      header: 'Curso',
      render: (row: any) => (
        <span className="text-xs font-bold bg-slate-50 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-150">
          {getCourseName(row.cursoId)}
        </span>
      )
    },
    {
      key: 'telefono',
      header: 'Contacto',
      render: (row: any) => <span className="text-xs text-slate-500 font-bold">{row.telefono}</span>
    },
    {
      key: 'fechaInscripcion',
      header: 'Inscripción',
      render: (row: any) => <span className="text-xs text-slate-400">{formatDateStr(row.fechaInscripcion)}</span>
    },
    {
      key: 'balancePendiente',
      header: 'Balance',
      align: 'right' as const,
      render: (row: any) => (
        <span className={`font-extrabold text-sm ${row.balancePendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(row.balancePendiente)}
        </span>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center' as const,
      render: (row: any) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Editar estudiante"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Estás seguro de eliminar al estudiante "${row.nombreCompleto}"?`)) {
                deleteStudent(row.id);
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Eliminar estudiante"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
          Estudiantes Inscritos
        </h1>
        <p className="text-sm font-semibold text-slate-400">
          Visualiza los expedientes de alumnos, realiza búsquedas y gestiona cobros pendientes.
        </p>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Buscar por Nombre, Matrícula o Cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4.5 h-4.5 text-slate-400" />}
          />
        </div>
        <div>
          <Select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            options={[
              { value: '', label: 'Filtrar por curso (Todos)' },
              ...courses.map((c) => ({ value: c.id, label: c.nombre }))
            ]}
          />
        </div>
      </div>

      {/* Tabla de Alumnos */}
      <Table
        columns={columns}
        data={filteredStudents}
        keyExtractor={(row) => row.id}
      />

      {/* Modal para Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Expediente de Estudiante"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Matrícula</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5">{editingStudent?.matricula}</span>
            </div>
          </div>

          <Input
            label="Nombre Completo del Estudiante *"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Ej: Ana Gómez Pérez"
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
              placeholder="809-555-0101"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Programa Inscrito *"
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              options={courses.map((c) => ({ value: c.id, label: c.nombre }))}
            />
            <Input
              label="Balance Pendiente ($) *"
              type="number"
              value={balancePendiente}
              onChange={(e) => setBalancePendiente(Number(e.target.value))}
              placeholder="0"
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
              className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-brand-100 focus:border-brand-500 rounded-xl text-slate-800 text-sm placeholder-slate-400 transition-all duration-200 focus:outline-hidden focus:ring-4 h-20"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Students;

import React, { useState } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Edit, Trash2, ShieldAlert, Search, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDateStr } from '../utils/formatters';
import type { Student } from '../types';
import { getStudentUpdateSchema } from '../validations/student.validation';


export const Students: React.FC = () => {
  const { students, courses, updateStudent, deleteStudent } = useAcademyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');

  // Modal editing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [horario, setHorario] = useState('');
  const [error, setError] = useState('');

  // Filtrar estudiantes
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.cedula || '').includes(searchTerm) ||
      student.matricula.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = selectedCourseFilter === '' || student.cursoId === selectedCourseFilter;

    return matchesSearch && matchesCourse;
  });

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setNombreCompleto(student.nombreCompleto);
    setTelefono(student.telefono);
    setCedula(student.cedula || '');
    setDireccion(student.direccion || '');
    setFechaNacimiento(student.fechaNacimiento || '');
    setCursoId(student.cursoId);
    setHorario(student.horario || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = getStudentUpdateSchema(courses).safeParse({
      nombreCompleto,
      telefono,
      fechaNacimiento,
      direccion,
      cedula,
      cursoId,
      horario
    });

    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message);
      return;
    }

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        nombreCompleto,
        telefono,
        fechaNacimiento,
        cedula,
        direccion,
        cursoId,
        horario
      });
      toast.success('Estudiante actualizado correctamente');
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
      render: (row: Student) => <span className="font-mono text-xs font-bold text-slate-400">{row.matricula}</span>
    },
    {
      key: 'nombreCompleto',
      header: 'Nombre Completo',
      render: (row: Student) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{row.nombreCompleto}</span>
          <span className="text-[10px] text-slate-400 font-bold">{row.cedula}</span>
        </div>
      )
    },
    {
      key: 'cursoId',
      header: 'Curso',
      render: (row: Student) => (
        <span className="text-xs font-bold bg-slate-50 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-150">
          {getCourseName(row.cursoId)}
        </span>
      )
    },
    {
      key: 'telefono',
      header: 'Contacto',
      render: (row: Student) => <span className="text-xs text-slate-500 font-bold">{row.telefono}</span>
    },
    {
      key: 'horario',
      header: 'Horario',
      render: (row: Student) => <span className="text-[10px] font-black tracking-wide text-brand-600 bg-brand-50 px-2 py-1 rounded-md">{row.horario || 'N/A'}</span>
    },
    {
      key: 'fechaInscripcion',
      header: 'Inscripción',
      render: (row: Student) => <span className="text-xs text-slate-400">{formatDateStr(row.fechaInscripcion)}</span>
    },
    {
      key: 'balancePendiente',
      header: 'Balance',
      align: 'right' as const,
      render: (row: Student) => (
        <span className={`font-extrabold text-sm ${row.balancePendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(row.balancePendiente)}
        </span>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center' as const,
      render: (row: Student) => (
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
                toast.success('Estudiante eliminado correctamente');
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
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
        <div className="flex items-end">
          <Button
            variant="outline"
            fullWidth
            icon={<Printer className="w-4 h-4" />}
            onClick={() => setTimeout(() => window.print(), 100)}
          >
            Imprimir Listado
          </Button>
        </div>
      </div>

      {/* Print header - only visible during print */}
      <div className="hidden print-only text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wide">Academia de Cursos</h2>
        <p className="text-xs font-semibold">Listado General de Estudiantes</p>
        <div className="border-b border-slate-400 my-4" />
        <div className="grid grid-cols-2 text-left text-xs gap-1.5 font-bold mb-4">
          <span>Curso: {selectedCourseFilter ? courses.find(c => c.id === selectedCourseFilter)?.nombre || 'Filtrado' : 'Todos los cursos'}</span>
          <span>Total: {filteredStudents.length} estudiante(s)</span>
          <span>Fecha Impresión: {new Date().toLocaleDateString()}</span>
        </div>
        <div className="border-b border-slate-400 mb-4" />
      </div>

      {/* Tabla de Alumnos */}
      <div className="print-area">
        <Table
          columns={columns}
          data={filteredStudents}
          keyExtractor={(row) => row.id}
        />
      </div>

      {/* Modal para Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Expediente de Estudiante"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Fecha Nac. *"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
            <Input
              label="Teléfono *"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="809-555-0101"
            />
            <Input
              label="Cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Opcional < 18 años"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Programa *"
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              options={courses.map((c) => ({ value: c.id, label: c.nombre }))}
            />
            <Select
              label="Horario *"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar...' },
                { value: '9:00 am - 12:00 pm', label: 'Mañana (9:00am-12:00pm)' },
                { value: '2:00 pm - 5:00 pm', label: 'Tarde (2:00pm-5:00pm)' }
              ]}
            />
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest">Balance Pendiente</span>
              <span className="text-xs font-semibold text-amber-600 mt-0.5">Este valor se gestiona desde Cobros</span>
            </div>
            <span className={`text-xl font-black ${(editingStudent?.balancePendiente ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(editingStudent?.balancePendiente ?? 0)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dirección de Residencia
            </label>
            <textarea
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección física completa (Opcional)..."
              className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-brand-100 focus:border-brand-500 rounded-xl text-slate-800 text-sm placeholder-slate-400 transition-all duration-200 focus:outline-hidden focus:ring-4 h-20"
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

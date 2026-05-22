import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Course, Teacher, Student, Payment, CashClosure } from '../types';
import { INITIAL_COURSES, INITIAL_TEACHERS } from '../utils/initialData';
import { dbService } from '../services/db.service';
import { format } from 'date-fns';

interface AcademyState {
  courses: Course[];
  teachers: Teacher[];
  students: Student[];
  payments: Payment[];
  closures: CashClosure[];
  activeAdapter: 'localStorage' | 'supabase';

  // Cursos Actions
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  toggleCourseState: (id: string) => void;

  // Profesores Actions
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;

  // Estudiantes Actions
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;

  // Sistema de Inscripción & Facturación
  enrollStudent: (
    studentData: Omit<Student, 'id' | 'matricula' | 'fechaInscripcion' | 'balancePendiente'>,
    montoPagado: number,
    metodoPago: 'efectivo' | 'transferencia',
    referenciaTransferencia?: string
  ) => Payment; // Devuelve la factura generada

  // Cierre de Caja Actions
  checkOrCreateDailyClosure: () => void;
  closeActiveClosure: () => void;
  
  // Configuración del Adaptador
  changePersistenceAdapter: (type: 'localStorage' | 'supabase') => void;
}

// Helpers para fechas en huso horario local
const getTodayDateStr = () => format(new Date(), 'yyyy-MM-dd');
const getCurrentTimeStr = () => format(new Date(), 'HH:mm');

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set, get) => ({
      courses: INITIAL_COURSES,
      teachers: INITIAL_TEACHERS,
      students: [],
      payments: [],
      closures: [],
      activeAdapter: 'localStorage',

      // ==========================================
      // ADAPTER CONFIGURATION
      // ==========================================
      changePersistenceAdapter: (type) => {
        dbService.setAdapter(type);
        set({ activeAdapter: type });
      },

      // ==========================================
      // CURSOS ACTIONS
      // ==========================================
      addCourse: (courseData) => {
        const newCourse: Course = {
          ...courseData,
          id: `cur-${Date.now()}`
        };
        set((state) => ({
          courses: [...state.courses, newCourse]
        }));
      },

      updateCourse: (updatedCourse) => {
        set((state) => ({
          courses: state.courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
        }));
      },

      deleteCourse: (id) => {
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id)
        }));
      },

      toggleCourseState: (id) => {
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === id ? { ...c, estado: c.estado === 'activo' ? 'inactivo' : 'activo' } : c
          )
        }));
      },

      // ==========================================
      // PROFESORES ACTIONS
      // ==========================================
      addTeacher: (teacherData) => {
        const newTeacher: Teacher = {
          ...teacherData,
          id: `prof-${Date.now()}`
        };
        set((state) => ({
          teachers: [...state.teachers, newTeacher]
        }));
      },

      updateTeacher: (updatedTeacher) => {
        set((state) => ({
          teachers: state.teachers.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
        }));
      },

      deleteTeacher: (id) => {
        set((state) => ({
          teachers: state.teachers.filter((t) => t.id !== id),
          // Desasignar profesor de los cursos donde esté asignado
          courses: state.courses.map((c) => (c.profesorId === id ? { ...c, profesorId: null } : c))
        }));
      },

      // ==========================================
      // ESTUDIANTES ACTIONS
      // ==========================================
      updateStudent: (updatedStudent) => {
        set((state) => ({
          students: state.students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
        }));
      },

      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          // También se pueden filtrar o dejar los pagos del estudiante para historial contable
        }));
      },

      // ==========================================
      // SISTEMA DE INSCRIPCIÓN Y PAGOS (POS)
      // ==========================================
      enrollStudent: (studentData, montoPagado, metodoPago, referenciaTransferencia) => {
        // Aseguramos primero que exista un cierre de caja del día de hoy abierto
        get().checkOrCreateDailyClosure();

        const state = get();
        const course = state.courses.find((c) => c.id === studentData.cursoId);
        if (!course) {
          throw new Error('El curso seleccionado no existe');
        }

        // 1. Generar Código de Matrícula y ID
        const studentId = `est-${Date.now()}`;
        const currentYear = new Date().getFullYear();
        const matriculaCount = state.students.length + 1;
        const matricula = `MAT-${currentYear}-${String(matriculaCount).padStart(4, '0')}`;

        // 2. Calcular saldos financieros
        const costoCurso = course.costo;
        const balancePendiente = Math.max(0, costoCurso - montoPagado);

        // 3. Crear Registro de Estudiante
        const nuevoEstudiante: Student = {
          id: studentId,
          nombreCompleto: studentData.nombreCompleto,
          telefono: studentData.telefono,
          cedula: studentData.cedula,
          direccion: studentData.direccion,
          matricula,
          fechaInscripcion: new Date().toISOString(),
          balancePendiente,
          cursoId: studentData.cursoId
        };

        // 4. Crear Registro de Factura / Pago
        const invoiceCount = state.payments.length + 1;
        const invoiceId = `FAC-${1000 + invoiceCount}`;
        const nuevoPago: Payment = {
          id: invoiceId,
          matricula,
          estudianteId: studentId,
          estudianteNombre: studentData.nombreCompleto,
          cursoId: studentData.cursoId,
          cursoNombre: course.nombre,
          montoPagado,
          balance: balancePendiente,
          metodoPago,
          referenciaTransferencia,
          fecha: getTodayDateStr(),
          hora: getCurrentTimeStr()
        };

        // 5. Actualizar el Cierre de Caja Diario Activo
        const todayDate = getTodayDateStr();
        const updatedClosures = state.closures.map((closure) => {
          if (closure.fecha === todayDate && !closure.cerrado) {
            const isEfectivo = metodoPago === 'efectivo';
            return {
              ...closure,
              totalEfectivo: closure.totalEfectivo + (isEfectivo ? montoPagado : 0),
              totalTransferencia: closure.totalTransferencia + (!isEfectivo ? montoPagado : 0),
              totalGeneral: closure.totalGeneral + montoPagado,
              cantidadPagos: closure.cantidadPagos + 1,
              cantidadEstudiantesInscritos: closure.cantidadEstudiantesInscritos + 1,
              pagos: [...closure.pagos, nuevoPago]
            };
          }
          return closure;
        });

        // 6. Actualizar Estado Global
        set({
          students: [...state.students, nuevoEstudiante],
          payments: [...state.payments, nuevoPago],
          closures: updatedClosures
        });

        return nuevoPago;
      },

      // ==========================================
      // CIERRE DE CAJA DIARIO (CASH CLOSURE)
      // ==========================================
      checkOrCreateDailyClosure: () => {
        const state = get();
        const todayDate = getTodayDateStr();

        // Buscar si ya existe una caja para hoy
        const existingClosure = state.closures.find((c) => c.fecha === todayDate);

        if (!existingClosure) {
          // Si es un nuevo día, creamos el cierre de caja diario inicializado en ceros.
          // Nota: Esto cumple con la regla de reiniciarse automáticamente cada nuevo día.
          const newClosure: CashClosure = {
            id: `closure-${todayDate}`,
            fecha: todayDate,
            totalEfectivo: 0,
            totalTransferencia: 0,
            totalGeneral: 0,
            cantidadPagos: 0,
            cantidadEstudiantesInscritos: 0,
            pagos: [],
            cerrado: false
          };

          set({
            closures: [newClosure, ...state.closures]
          });
        }
      },

      closeActiveClosure: () => {
        const todayDate = getTodayDateStr();
        set((state) => ({
          closures: state.closures.map((closure) => {
            if (closure.fecha === todayDate && !closure.cerrado) {
              return {
                ...closure,
                cerrado: true,
                fechaCierre: new Date().toISOString()
              };
            }
            return closure;
          })
        }));
      }
    }),
    {
      name: 'academy-billing-system-state',
      storage: createJSONStorage(() => dbService.getZustandStorage()),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Cada vez que se recarga la app y se recuperan los datos, verificamos/creamos la caja diaria.
          state.checkOrCreateDailyClosure();
          
          // Sincronizar el adaptador en dbService con el estado recuperado
          dbService.setAdapter(state.activeAdapter);
        }
      }
    }
  )
);

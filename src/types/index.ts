export interface Course {
  id: string;
  nombre: string;
  duracion: string; // Siempre "3 meses"
  modulos: number;
  costo: number;
  descripcion: string;
  profesorId: string | null; // ID del profesor asignado
  estado: 'activo' | 'inactivo';
}

export interface Teacher {
  id: string;
  nombreCompleto: string;
  telefono: string;
  cedula: string;
  direccion: string;
  especialidad: string;
  estado: 'activo' | 'inactivo';
}

export interface Student {
  id: string;
  nombreCompleto: string;
  telefono: string;
  cedula?: string;
  direccion?: string;
  fechaNacimiento: string; // YYYY-MM-DD
  matricula: string; // MAT-YYYY-XXXX (generado automáticamente)
  fechaInscripcion: string; // ISO string
  balancePendiente: number;
  cursoId: string; // Curso en el que está inscrito
  horario: string;
  inscripcionGratis: boolean;
}

export interface Payment {
  id: string; // Número de factura (e.g. FAC-1001)
  matricula: string;
  estudianteId: string;
  estudianteNombre: string;
  cursoId: string;
  cursoNombre: string;
  montoPagado: number;
  balance: number; // Balance pendiente después de este pago
  metodoPago: 'efectivo' | 'transferencia';
  referenciaTransferencia?: string; // Para transferencias bancarias
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  horario?: string;
  costoInscripcion?: number;
}

export interface CashClosure {
  id: string; // ID único (generalmente fecha YYYY-MM-DD o timestamp)
  fecha: string; // YYYY-MM-DD
  totalEfectivo: number;
  totalTransferencia: number;
  totalGeneral: number;
  cantidadPagos: number;
  cantidadEstudiantesInscritos: number;
  pagos: Payment[];
  cerrado: boolean;
  fechaCierre?: string; // ISO string de cuándo se realizó el cierre
}

export interface DashboardStats {
  estudiantesInscritos: number;
  ingresosDia: number;
  pagosEfectivo: number;
  pagosTransferencia: number;
  cursosActivos: number;
  cursoMasEstudiantes: {
    nombre: string;
    cantidad: number;
  } | null;
  estudiantesPendientesBalance: number;
  totalGeneralDia: number;
}

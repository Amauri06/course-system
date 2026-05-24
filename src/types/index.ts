export interface Course {
  id: string;
  nombre: string;
  duracion: string; // Solo para display, ej: "3 meses"
  modulos: number;
  costo: number; // Costo por módulo
  descripcion: string;
  profesorId: string | null;
  estado: 'activo' | 'inactivo';
  frecuenciaPago: 'semanal' | 'quincenal' | 'mensual' | 'unico';
  tipoPeriodoAcademico: 'mensual' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'personalizado';
  duracionModuloMeses: number; // Meses que dura cada módulo
  capacidad: number;
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
  balancePendiente: number; // Deuda de mensualidades (quincenal)
  cursoId: string; // Curso en el que está inscrito
  horario: string;
  inscripcionGratis: boolean;
  costoInscripcion: number; // Monto pagado por la inscripción (0 si gratis)
  cursoSnapshot?: {
    costo: number;
    frecuenciaPago: string;
    duracionModuloMeses: number;
    modulos: number;
    nombre: string;
    tipoPeriodoAcademico?: string;
  };
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
  montoRecibido?: number;
  vuelta?: number;
  esAnulacion?: boolean;
  pagoOriginalId?: string;
  motivoAnulacion?: string;
}

export interface CashClosure {
  id: string;
  fecha: string;
  saldoInicial: number;
  totalEfectivo: number;
  totalTransferencia: number;
  totalGeneral: number;
  cantidadPagos: number;
  cantidadEstudiantesInscritos: number;
  pagos: Payment[];
  cerrado: boolean;
  fechaCierre?: string; // ISO string de cuándo se realizó el cierre
}

export interface Cuota {
  id: string;
  estudianteId: string;
  numero: number; // 1-based
  fechaVencimiento: string; // YYYY-MM-DD
  monto: number;
  estado: 'pendiente' | 'pagada';
  pagoId?: string; // FAC-XXXX si está pagada
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

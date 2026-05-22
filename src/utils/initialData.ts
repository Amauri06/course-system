import type { Course, Teacher } from '../types';

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'prof-1',
    nombreCompleto: 'Patricia Mendoza Ruíz',
    telefono: '809-555-0192',
    cedula: '001-1234567-8',
    direccion: 'Av. Winston Churchill #45, D.N.',
    especialidad: 'Cajera Bancaria & Finanzas',
    estado: 'activo',
  },
  {
    id: 'prof-2',
    nombreCompleto: 'Laura Sofía Rodríguez',
    telefono: '809-555-0283',
    cedula: '002-8765432-1',
    direccion: 'Calle El Sol #12, Santiago',
    especialidad: 'Cosmetología & Uñas Acrílicas',
    estado: 'activo',
  },
  {
    id: 'prof-3',
    nombreCompleto: 'Marcos Antonio Santana',
    telefono: '829-555-0374',
    cedula: '031-9876543-2',
    direccion: 'C/ Duarte #88, Santo Domingo Este',
    especialidad: 'Idiomas & Lingüística aplicada (Inglés)',
    estado: 'activo',
  },
  {
    id: 'prof-4',
    nombreCompleto: 'Diana Valeria Guerrero',
    telefono: '809-555-0465',
    cedula: '001-4567890-3',
    direccion: 'Av. Núñez de Cáceres #301, D.N.',
    especialidad: 'Artes Escénicas & Ballet',
    estado: 'activo',
  },
  {
    id: 'prof-5',
    nombreCompleto: 'José Manuel Jiménez',
    telefono: '849-555-0556',
    cedula: '002-6543210-9',
    direccion: 'C/ Respaldo 20 #15, Santo Domingo Oeste',
    especialidad: 'Música instrumental & Teoría musical',
    estado: 'activo',
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'cur-1',
    nombre: 'Cajera Bancaria',
    duracion: '3 meses',
    modulos: 6,
    costo: 150,
    descripcion: 'Formación especializada en operaciones de caja, cuadre diario, prevención de lavado de activos e informática bancaria.',
    profesorId: 'prof-1',
    estado: 'activo',
  },
  {
    id: 'cur-2',
    nombre: 'Uñas Acrílicas',
    duracion: '3 meses',
    modulos: 4,
    costo: 150,
    descripcion: 'Aprende técnicas modernas de esculpido, encapsulado, diseño a mano alzada, mantenimiento y bioseguridad en el cuidado de uñas.',
    profesorId: 'prof-2',
    estado: 'activo',
  },
  {
    id: 'cur-3',
    nombre: 'Secretariado Ejecutivo',
    duracion: '3 meses',
    modulos: 6,
    costo: 150,
    descripcion: 'Domina la redacción comercial, etiqueta protocolar, gestión de archivos, relaciones humanas y herramientas ofimáticas clave.',
    profesorId: 'prof-1',
    estado: 'activo',
  },
  {
    id: 'cur-4',
    nombre: 'Ballet',
    duracion: '3 meses',
    modulos: 3,
    costo: 150,
    descripcion: 'Curso introductorio y de nivel medio que enseña posturas, elasticidad, técnicas clásicas de barra, centro y coreografías elementales.',
    profesorId: 'prof-4',
    estado: 'activo',
  },
  {
    id: 'cur-5',
    nombre: 'Instrumentos Musicales',
    duracion: '3 meses',
    modulos: 5,
    costo: 150,
    descripcion: 'Iniciación al piano, guitarra o violín. Aprende solfeo básico, lectura de partituras y ejecución práctica desde cero.',
    profesorId: 'prof-5',
    estado: 'activo',
  },
  {
    id: 'cur-6',
    nombre: 'Inglés',
    duracion: '3 meses',
    modulos: 9, // Regla: Inglés tendrá 9 módulos
    costo: 150, // Regla: Todos inician con el mismo costo
    descripcion: 'Programa intensivo de inglés conversacional enfocado en vocabulario cotidiano, gramática interactiva y fluidez auditiva.',
    profesorId: 'prof-3',
    estado: 'activo',
  }
];

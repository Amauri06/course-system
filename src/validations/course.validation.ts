import { z } from 'zod';

export const getCourseSchema = () => {
  return z.object({
    nombre: z.string().min(1, 'El nombre del curso es obligatorio.'),
    descripcion: z.string().min(1, 'La descripción del curso es obligatoria.'),
    costo: z.number().positive('El costo debe ser mayor que 0.'),
    capacidad: z.number().int().positive('La capacidad debe ser mayor que 0.'),
    frecuenciaPago: z.enum(['semanal', 'quincenal', 'mensual', 'unico']),
    tipoPeriodoAcademico: z.enum(['mensual', 'trimestral', 'cuatrimestral', 'semestral', 'personalizado']),
    duracionModuloMeses: z.number().int().positive('La duración por módulo debe ser mayor que 0.'),
    duracionTotalMeses: z.number().int().positive('La duración total debe ser mayor que 0.'),
    profesorId: z.string().min(1, 'Debe seleccionar un profesor.'),
    modulos: z.number().int().positive('La cantidad de módulos debe ser mayor que 0.'),
    estado: z.enum(['activo', 'inactivo']),
  });
};

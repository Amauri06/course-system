import { z } from 'zod';
import { differenceInYears } from 'date-fns';
import type { Course } from '../types';

export const getEnrollSchema = (courses: Course[], edadMinimaNormal = 13, edadMinimaIngles = 10) => {
  return z.object({
    isNewStudent: z.boolean(),
    nombreCompleto: z.string().optional(),
    telefono: z.string().optional(),
    fechaNacimiento: z.string().optional(),
    direccion: z.string().optional(),
    cedula: z.string().optional(),
    existingStudentId: z.string().optional(),
    cursoId: z.string().min(1, 'El curso es obligatorio.'),
    horario: z.string().min(1, 'El horario es obligatorio.'),
  }).superRefine((data, ctx) => {
    if (!data.isNewStudent) {
      if (!data.existingStudentId) {
        ctx.addIssue({
          path: ['existingStudentId'],
          code: z.ZodIssueCode.custom,
          message: 'Debe seleccionar un estudiante registrado.'
        });
      }
      return;
    }

    if (!data.nombreCompleto || data.nombreCompleto.trim().length === 0) {
      ctx.addIssue({
        path: ['nombreCompleto'],
        code: z.ZodIssueCode.custom,
        message: 'El nombre completo es obligatorio.'
      });
    }

    if (!data.telefono || data.telefono.trim().length === 0) {
      ctx.addIssue({
        path: ['telefono'],
        code: z.ZodIssueCode.custom,
        message: 'El teléfono es obligatorio.'
      });
    } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(data.telefono)) {
      ctx.addIssue({
        path: ['telefono'],
        code: z.ZodIssueCode.custom,
        message: 'El teléfono debe tener el formato (809) 555-0123.'
      });
    }

    if (!data.fechaNacimiento || data.fechaNacimiento.trim().length === 0) {
      ctx.addIssue({
        path: ['fechaNacimiento'],
        code: z.ZodIssueCode.custom,
        message: 'La fecha de nacimiento es obligatoria.'
      });
      return;
    }

    const birthDate = new Date(data.fechaNacimiento);
    if (isNaN(birthDate.getTime())) {
      ctx.addIssue({
        path: ['fechaNacimiento'],
        code: z.ZodIssueCode.custom,
        message: 'La fecha de nacimiento no es válida.'
      });
      return;
    }

    const age = differenceInYears(new Date(), birthDate);
    const selectedCourse = courses.find(c => c.id === data.cursoId);

    if (selectedCourse) {
      const isIngles = selectedCourse.nombre.toLowerCase().includes('ingl');
      const minAge = isIngles ? edadMinimaIngles : edadMinimaNormal;
      if (age < minAge) {
        ctx.addIssue({
          path: ['fechaNacimiento'],
          code: z.ZodIssueCode.custom,
          message: `El estudiante debe tener al menos ${minAge} años para inscribirse en el curso de ${selectedCourse.nombre} (edad actual: ${age} años).`
        });
      }
    }

    if (age >= 18) {
      if (!data.cedula || data.cedula.trim().length === 0) {
        ctx.addIssue({
          path: ['cedula'],
          code: z.ZodIssueCode.custom,
          message: 'La cédula es obligatoria para estudiantes mayores de edad (18 años o más).'
        });
      } else if (!/^\d{3}-\d{7}-\d{1}$/.test(data.cedula)) {
        ctx.addIssue({
          path: ['cedula'],
          code: z.ZodIssueCode.custom,
          message: 'La cédula debe tener el formato 001-1234567-8.'
        });
      }
    }
  });
};

import { z } from 'zod';
import { differenceInYears } from 'date-fns';
import type { Course } from '../types';

export const getStudentUpdateSchema = (courses: Course[]) => {
  return z.object({
    nombreCompleto: z.string().min(1, 'El nombre completo es obligatorio.'),
    telefono: z.string().min(1, 'El teléfono es obligatorio.'),
    fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria.'),
    direccion: z.string().optional(),
    cedula: z.string().optional(),
    cursoId: z.string().min(1, 'El curso es obligatorio.'),
    horario: z.string().min(1, 'El horario es obligatorio.')
  }).superRefine((data, ctx) => {
    const birthDate = new Date(data.fechaNacimiento);
    if (isNaN(birthDate.getTime())) {
      ctx.addIssue({ path: ['fechaNacimiento'], code: z.ZodIssueCode.custom, message: 'La fecha de nacimiento no es válida.' });
      return;
    }

    const age = differenceInYears(new Date(), birthDate);
    const selectedCourse = courses.find(c => c.id === data.cursoId);

    if (selectedCourse) {
      const isIngles = selectedCourse.nombre.toLowerCase().includes('ingl');
      const minAge = isIngles ? 10 : 13;
      if (age < minAge) {
        ctx.addIssue({ path: ['fechaNacimiento'], code: z.ZodIssueCode.custom, message: `El estudiante debe tener al menos ${minAge} años para el curso de ${selectedCourse.nombre} (edad actual: ${age} años).` });
      }
    }

    if (age >= 18) {
      if (!data.cedula || data.cedula.trim().length === 0) {
        ctx.addIssue({ path: ['cedula'], code: z.ZodIssueCode.custom, message: 'La cédula es obligatoria para estudiantes mayores de edad (18 años o más).' });
      }
    }
  });
};

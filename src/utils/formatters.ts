/**
 * Formatea un número como moneda local (e.g. RD$ 150.00 o USD$ 150.00)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(value).replace('DOP', '$');
};

/**
 * Formatea una fecha ISO a un formato legible
 */
export const formatDateStr = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    return isoString;
  }
};

/**
 * Retorna la hora formateada a partir de fecha ISO
 */
export const formatTimeStr = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return isoString;
  }
};

export const getIntervalDays = (frecuencia: string): number => {
  switch (frecuencia) {
    case 'semanal': return 7;
    case 'quincenal': return 15;
    case 'mensual': return 30;
    default: return 15;
  }
};

interface CourseLike {
  costo: number;
  frecuenciaPago: string;
  duracionModuloMeses?: number;
  modulos?: number;
  duracionTotalMeses?: number;
}

export const getTotalCourseCost = (course: CourseLike | null | undefined): number => {
  if (!course) return 0;
  if (course.frecuenciaPago === 'unico') return course.costo;
  const intervalDays = getIntervalDays(course.frecuenciaPago);
  const totalMonths = course.duracionTotalMeses ?? (course.duracionModuloMeses || 1) * (course.modulos || 0);
  const totalPeriods = (totalMonths * 30) / intervalDays;
  return course.costo * totalPeriods;
};

export const getModuleTotalCost = (course: CourseLike | null | undefined): number => {
  if (!course) return 0;
  if (course.frecuenciaPago === 'unico') return course.costo;
  const intervalDays = getIntervalDays(course.frecuenciaPago);
  const monthsPerModule = course.duracionModuloMeses || 1;
  const periodsPerModule = (monthsPerModule * 30) / intervalDays;
  return course.costo * periodsPerModule;
};

/**
 * Retorna el valor del input como string, vacío si es 0
 * Útil para inputs numéricos donde mostrar placeholder <input> en lugar de "0"
 */
export const inputValue = (val: number | undefined | null): string => {
  return val ? val.toString() : '';
};

export const formatHora = (hora: string): string => {
  const [h, m] = hora.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const stripNonDigits = (v: string) => v.replace(/\D/g, '');

export const formatCedula = (value: string): string => {
  const digits = stripNonDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
};

export const formatPhone = (value: string): string => {
  const digits = stripNonDigits(value).slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

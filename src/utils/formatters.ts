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
    return new Intl.DateTimeFormat('es-ES', {
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
    return new Intl.DateTimeFormat('es-ES', {
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

export const getTotalCourseCost = (course: any): number => {
  if (!course) return 0;
  if (course.frecuenciaPago === 'unico') return course.costo;
  const intervalDays = getIntervalDays(course.frecuenciaPago);
  const monthsPerModule = course.duracionModuloMeses || 1;
  const totalMonths = monthsPerModule * course.modulos;
  const totalPeriods = (totalMonths * 30) / intervalDays;
  return course.costo * totalPeriods;
};

export const getModuleTotalCost = (course: any): number => {
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

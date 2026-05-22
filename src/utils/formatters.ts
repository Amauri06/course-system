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

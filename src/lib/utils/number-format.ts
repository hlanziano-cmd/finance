// src/lib/utils/number-format.ts

/**
 * Formatea un número según el formato colombiano
 * Ejemplo: 1234567.89 => "1.234.567,89"
 */
export function formatColombianNumber(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';

  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Parsea un número en formato colombiano a number
 * Ejemplo: "1.234.567,89" => 1234567.89
 */
export function parseColombianNumber(value: string): number {
  if (!value) return 0;

  // Remover puntos (separadores de miles) y reemplazar coma por punto (decimales)
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formatea un valor de input mientras el usuario escribe
 * Mantiene el cursor en la posición correcta
 */
export function formatInputValue(value: string): string {
  // Remover todo excepto números, puntos y comas
  let cleaned = value.replace(/[^\d.,]/g, '');

  // Separar parte entera y decimal
  const parts = cleaned.split(',');
  let integerPart = parts[0].replace(/\./g, ''); // Remover puntos existentes
  const decimalPart = parts[1];

  // Formatear parte entera con puntos cada 3 dígitos
  if (integerPart) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Reconstruir el número
  if (decimalPart !== undefined) {
    return `${integerPart},${decimalPart.slice(0, 2)}`; // Máximo 2 decimales
  }

  return integerPart;
}

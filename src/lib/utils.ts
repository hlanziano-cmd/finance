// src/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind CSS de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(
  amount: number,
  currency: string = 'COP',
  locale: string = 'es-CO'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formatea una fecha
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const formats = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' } as const,
    long: { year: 'numeric', month: 'long', day: 'numeric' } as const,
    full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' } as const,
  };

  return new Intl.DateTimeFormat('es-CO', formats[format]).format(d);
}

/**
 * Trunca texto con ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Determina el color basado en el nivel de riesgo
 */
export function getRiskColor(risk: 'bajo' | 'medio' | 'alto' | 'critico'): string {
  const colors = {
    bajo: 'text-green-600 bg-green-50',
    medio: 'text-yellow-600 bg-yellow-50',
    alto: 'text-orange-600 bg-orange-50',
    critico: 'text-red-600 bg-red-50',
  };
  return colors[risk] || colors.medio;
}

/**
 * Determina el color basado en el health score
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// src/types/dtos.ts

import { z } from 'zod';

// Balance Sheet DTOs
export const createBalanceSheetSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  fiscalYear: z.number().int().min(2000).max(2100),
  notes: z.string().optional(),
}).refine(
  (data) => data.periodEnd > data.periodStart,
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['periodEnd']
  }
);

export type CreateBalanceSheetDTO = z.infer<typeof createBalanceSheetSchema>;

export const updateBalanceSheetSchema = createBalanceSheetSchema.partial();
export type UpdateBalanceSheetDTO = z.infer<typeof updateBalanceSheetSchema>;

export const balanceSheetItemSchema = z.object({
  category: z.enum(['activo', 'pasivo', 'patrimonio']),
  subcategory: z.string().min(1),
  accountName: z.string().min(1, 'Nombre de cuenta requerido'),
  accountCode: z.string().optional(),
  amount: z.number().min(0, 'El monto no puede ser negativo'),
  notes: z.string().optional(),
  orderIndex: z.number().int().min(0).default(0),
});

export type BalanceSheetItemDTO = z.infer<typeof balanceSheetItemSchema>;

export const createBalanceSheetWithItemsSchema = z.object({
  balanceSheet: createBalanceSheetSchema,
  items: z.array(balanceSheetItemSchema).min(1, 'Debe agregar al menos una cuenta'),
});

export type CreateBalanceSheetWithItemsDTO = z.infer<typeof createBalanceSheetWithItemsSchema>;

// Organization DTOs
export const createOrganizationSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  legalName: z.string().optional(),
  taxId: z.string().min(5, 'NIT inválido'),
  country: z.string().length(2).default('CO'),
  currency: z.string().length(3).default('COP'),
  industry: z.string().optional(),
  size: z.enum(['startup', 'pyme', 'grande']).optional(),
});

export type CreateOrganizationDTO = z.infer<typeof createOrganizationSchema>;

// Query Filters
export interface BalanceSheetFilters {
  status?: 'draft' | 'final' | 'archived';
  fiscalYear?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  orderBy?: 'period_end' | 'created_at' | 'name';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
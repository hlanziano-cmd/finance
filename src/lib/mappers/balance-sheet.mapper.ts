// src/lib/mappers/balance-sheet.mapper.ts

import type { Database } from '@/src/types/database.types';
import type { BalanceSheet, BalanceSheetItem } from '@/src/types/models';

type BalanceSheetDB = Database['public']['Tables']['balance_sheets']['Row'] & {
  items?: Database['public']['Tables']['balance_sheet_items']['Row'][];
};

type BalanceSheetInsert = Database['public']['Tables']['balance_sheets']['Insert'];

/**
 * Mapea un balance desde la base de datos al modelo de dominio
 */
export function mapBalanceSheetFromDB(data: BalanceSheetDB): BalanceSheet {
  if (!data.created_by) {
    throw new Error('created_by is required');
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    periodStart: new Date(data.period_start),
    periodEnd: new Date(data.period_end),
    fiscalYear: data.fiscal_year,
    status: data.status as 'draft' | 'final',
    notes: data.notes || undefined,
    items: data.items?.map(mapBalanceSheetItemFromDB) || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by,
    updatedBy: data.updated_by || undefined,
  };
}

/**
 * Mapea un item de balance desde la base de datos al modelo de dominio
 */
export function mapBalanceSheetItemFromDB(
  data: Database['public']['Tables']['balance_sheet_items']['Row']
): BalanceSheetItem {
  return {
    id: data.id,
    balanceSheetId: data.balance_sheet_id,
    organizationId: data.organization_id,
    category: data.category as any,
    subcategory: data.subcategory,
    accountName: data.account_name,
    accountCode: data.account_code || undefined,
    amount: data.amount,
    notes: data.notes || undefined,
    orderIndex: data.order_index,
  };
}

/**
 * Mapea un balance del modelo de dominio a la base de datos
 */
export function mapBalanceSheetToDB(data: Partial<BalanceSheet>): Partial<BalanceSheetInsert> {
  const result: Partial<BalanceSheetInsert> = {};

  if (data.organizationId !== undefined) result.organization_id = data.organizationId;
  if (data.name !== undefined) result.name = data.name;
  if (data.periodStart !== undefined) result.period_start = data.periodStart.toISOString();
  if (data.periodEnd !== undefined) result.period_end = data.periodEnd.toISOString();
  if (data.fiscalYear !== undefined) result.fiscal_year = data.fiscalYear;
  if (data.status !== undefined) result.status = data.status;
  if (data.notes !== undefined) result.notes = data.notes;
  if (data.createdBy !== undefined) result.created_by = data.createdBy;
  if (data.updatedBy !== undefined) result.updated_by = data.updatedBy;

  return result;
}

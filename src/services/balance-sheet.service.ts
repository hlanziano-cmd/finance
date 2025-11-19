// src/services/balance-sheet.service.ts
// @ts-nocheck

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database.types';
import type {
  BalanceSheet,
  BalanceSheetItem,
  BalanceTotals,
} from '@/src/types/models';
import type {
  CreateBalanceSheetDTO,
  UpdateBalanceSheetDTO,
  BalanceSheetFilters,
  PaginatedResponse,
  PaginationParams,
} from '@/src/types/dtos';
import {
  createBalanceSheetSchema,
  updateBalanceSheetSchema,
} from '@/src/types/dtos';
import { DatabaseError, ValidationError, NotFoundError } from '@/src/lib/errors';
import { mapBalanceSheetFromDB, mapBalanceSheetToDB } from '@/src/lib/mappers/balance-sheet.mapper';

export class BalanceSheetService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Obtener un balance general por ID
   */
  async getById(id: string): Promise<BalanceSheet> {
    const { data, error } = await this.supabase
      .from('balance_sheets')
      .select(`
        *,
        items:balance_sheet_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Balance general no encontrado');
      }
      throw new DatabaseError(error.message);
    }

    return mapBalanceSheetFromDB(data);
  }

  /**
   * Listar balances de una organización con filtros
   */
  async list(
    organizationId: string,
    filters?: BalanceSheetFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<BalanceSheet>> {
    let query = this.supabase
      .from('balance_sheets')
      .select('*, items:balance_sheet_items(*)', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Aplicar filtros
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.fiscalYear) {
      query = query.eq('fiscal_year', filters.fiscalYear);
    }

    if (filters?.dateFrom) {
      query = query.gte('period_end', filters.dateFrom.toISOString());
    }

    if (filters?.dateTo) {
      query = query.lte('period_end', filters.dateTo.toISOString());
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Ordenamiento
    const orderBy = filters?.orderBy || 'period_end';
    const orderDirection = filters?.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Paginación
    if (pagination) {
      const { page, pageSize } = pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new DatabaseError(error.message);
    }

    const totalItems = count || 0;
    const pageSize = pagination?.pageSize || totalItems;
    const currentPage = pagination?.page || 1;
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: data.map(mapBalanceSheetFromDB),
      pagination: {
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  /**
   * Crear un balance general
   */
  async create(
    organizationId: string,
    dto: CreateBalanceSheetDTO
  ): Promise<BalanceSheet> {
    // Validar DTO
    const validation = createBalanceSheetSchema.safeParse(dto);
    if (!validation.success) {
      throw new ValidationError(validation.error.issues.map(issue => ({
        message: issue.message,
        path: issue.path.map(String),
      })));
    }

    // Obtener el usuario actual
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Insertar balance
    // @ts-ignore
    const { data, error } = await this.supabase
      .from('balance_sheets')
      .insert({
        organization_id: organizationId,
        name: dto.name,
        period_start: dto.periodStart.toISOString(),
        period_end: dto.periodEnd.toISOString(),
        fiscal_year: dto.fiscalYear,
        notes: dto.notes,
        created_by: user.id,
      })
      .select('*, items:balance_sheet_items(*)')
      .single();

    if (error || !data) {
      throw new DatabaseError(error?.message || 'Error al crear balance');
    }

    const balanceData = data as any;

    // Registrar en audit log
    await this.createAuditLog(organizationId, 'create', 'balance_sheet', balanceData.id);

    return mapBalanceSheetFromDB(balanceData);
  }

  /**
   * Actualizar un balance general
   */
  async update(
    id: string,
    dto: UpdateBalanceSheetDTO
  ): Promise<BalanceSheet> {
    // Validar DTO
    const validation = updateBalanceSheetSchema.safeParse(dto);
    if (!validation.success) {
      throw new ValidationError(validation.error.issues.map(issue => ({
        message: issue.message,
        path: issue.path.map(String),
      })));
    }

    // Obtener el usuario actual
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Actualizar
    const updateData: any = {
      updated_by: user.id,
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.periodStart !== undefined) updateData.period_start = dto.periodStart.toISOString();
    if (dto.periodEnd !== undefined) updateData.period_end = dto.periodEnd.toISOString();
    if (dto.fiscalYear !== undefined) updateData.fiscal_year = dto.fiscalYear;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // @ts-ignore
    const { data, error } = await this.supabase
      .from('balance_sheets')
      .update(updateData)
      .eq('id', id)
      .select('*, items:balance_sheet_items(*)')
      .single();

    if (error || !data) {
      throw new DatabaseError(error?.message || 'Error al actualizar balance');
    }

    const balanceData = data as any;

    // Registrar en audit log
    const organizationId = balanceData.organization_id;
    await this.createAuditLog(organizationId, 'update', 'balance_sheet', id, updateData);

    return mapBalanceSheetFromDB(balanceData);
  }

  /**
   * Eliminar un balance general
   */
  async delete(id: string): Promise<void> {
    // Primero obtener el balance para el audit log
    const balanceSheet = await this.getById(id);

    const { error } = await this.supabase
      .from('balance_sheets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(error.message);
    }

    // Registrar en audit log
    await this.createAuditLog(
      balanceSheet.organizationId,
      'delete',
      'balance_sheet',
      id
    );
  }

  /**
   * Agregar un ítem al balance
   */
  async addItem(
    balanceSheetId: string,
    item: Omit<BalanceSheetItem, 'id' | 'balanceSheetId'>
  ): Promise<BalanceSheetItem> {
    // @ts-ignore
    const { data, error } = await this.supabase
      .from('balance_sheet_items')
      .insert({
        balance_sheet_id: balanceSheetId,
        organization_id: item.organizationId,
        category: item.category,
        subcategory: item.subcategory,
        account_name: item.accountName,
        account_code: item.accountCode,
        amount: item.amount,
        notes: item.notes,
        order_index: item.orderIndex,
      })
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseError(error?.message || 'Error al agregar ítem');
    }

    const item_data = data as any;
    return {
      id: item_data.id,
      balanceSheetId: item_data.balance_sheet_id,
      organizationId: item_data.organization_id,
      category: item_data.category as any,
      subcategory: item_data.subcategory,
      accountName: item_data.account_name,
      accountCode: item_data.account_code || undefined,
      amount: item_data.amount,
      notes: item_data.notes || undefined,
      orderIndex: item_data.order_index,
    };
  }

  /**
   * Actualizar un ítem del balance
   */
  async updateItem(
    itemId: string,
    updates: Partial<Pick<BalanceSheetItem, 'accountName' | 'amount' | 'notes'>>
  ): Promise<BalanceSheetItem> {
    const updateData: any = {};
    if (updates.accountName !== undefined) updateData.account_name = updates.accountName;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await this.supabase
      .from('balance_sheet_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseError(error?.message || 'Error al actualizar ítem');
    }

    const item_data = data as any;
    return {
      id: item_data.id,
      balanceSheetId: item_data.balance_sheet_id,
      organizationId: item_data.organization_id,
      category: item_data.category as any,
      subcategory: item_data.subcategory,
      accountName: item_data.account_name,
      accountCode: item_data.account_code || undefined,
      amount: item_data.amount,
      notes: item_data.notes || undefined,
      orderIndex: item_data.order_index,
    };
  }

  /**
   * Eliminar un ítem del balance
   */
  async deleteItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('balance_sheet_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new DatabaseError(error.message);
    }
  }

  /**
   * Calcular totales del balance
   */
  async calculateTotals(balanceSheetId: string): Promise<BalanceTotals> {
    const { data, error } = await this.supabase
      .rpc('calculate_balance_totals', {
        p_balance_sheet_id: balanceSheetId,
      });

    if (error) {
      throw new DatabaseError(error.message);
    }

    if (!data || data.length === 0) {
      throw new NotFoundError('No se pudieron calcular los totales');
    }

    const totals = data[0];
    const difference = Math.abs(
      totals.total_activo - (totals.total_pasivo + totals.total_patrimonio)
    );

    return {
      totalActivo: totals.total_activo,
      totalActivoCorriente: totals.total_activo_corriente,
      totalActivoNoCorriente: totals.total_activo_no_corriente,
      totalPasivo: totals.total_pasivo,
      totalPasivoCorriente: totals.total_pasivo_corriente,
      totalPasivoNoCorriente: totals.total_pasivo_no_corriente,
      totalPatrimonio: totals.total_patrimonio,
      isBalanced: difference < 0.01, // Tolerancia de 1 centavo
      difference: difference > 0 ? difference : undefined,
    };
  }

  /**
   * Finalizar balance (cambiar estado a 'final')
   */
  async finalize(balanceSheetId: string): Promise<BalanceSheet> {
    // Verificar que el balance esté cuadrado
    const totals = await this.calculateTotals(balanceSheetId);
    if (!totals.isBalanced) {
      throw new ValidationError([{
        message: `El balance no está cuadrado. Diferencia: $${totals.difference?.toFixed(2)}`,
        path: ['totals']
      }]);
    }

    // Cambiar estado
    // @ts-ignore
    const { data, error } = await this.supabase
      .from('balance_sheets')
      .update({ status: 'final' })
      .eq('id', balanceSheetId)
      .select('*, items:balance_sheet_items(*)')
      .single();

    if (error || !data) {
      throw new DatabaseError(error?.message || 'Error al finalizar balance');
    }

    // Registrar en audit log
    await this.createAuditLog(
      (data as any).organization_id,
      'finalize',
      'balance_sheet',
      balanceSheetId
    );

    return mapBalanceSheetFromDB(data as any);
  }

  /**
   * Duplicar un balance
   */
  async duplicate(
    balanceSheetId: string,
    newName: string,
    newPeriodStart: Date,
    newPeriodEnd: Date
  ): Promise<BalanceSheet> {
    // Obtener balance original
    const original = await this.getById(balanceSheetId);

    // Crear nuevo balance
    const newBalanceSheet = await this.create(original.organizationId, {
      name: newName,
      periodStart: newPeriodStart,
      periodEnd: newPeriodEnd,
      fiscalYear: newPeriodEnd.getFullYear(),
      notes: `Duplicado de: ${original.name}`,
    });

    // Copiar ítems
    for (const item of original.items) {
      await this.addItem(newBalanceSheet.id, {
        organizationId: original.organizationId,
        category: item.category,
        subcategory: item.subcategory,
        accountName: item.accountName,
        accountCode: item.accountCode,
        amount: item.amount,
        notes: item.notes,
        orderIndex: item.orderIndex,
      });
    }

    // Retornar balance completo
    return this.getById(newBalanceSheet.id);
  }

  /**
   * Crear registro de auditoría
   */
  private async createAuditLog(
    organizationId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: any
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();

    await this.supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: user?.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      new_data: changes,
    });
  }
}
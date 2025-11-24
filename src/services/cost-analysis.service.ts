// src/services/cost-analysis.service.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database.types';
import type { CostAnalysis, CostAnalysisCalculations, CostBreakdownItem } from '@/src/types/models';

type CostAnalysisDB = Database['public']['Tables']['cost_analysis']['Row'];
type CostAnalysisInsert = Database['public']['Tables']['cost_analysis']['Insert'];
type CostAnalysisUpdate = Database['public']['Tables']['cost_analysis']['Update'];

export interface CreateCostAnalysisInput {
  productName: string;
  productDescription?: string;
  unitPrice: number;
  variableCostPerUnit: number;
  variableCostBreakdown?: CostBreakdownItem[];
  monthlyFixedCosts: number;
  fixedCostBreakdown?: CostBreakdownItem[];
  currentMonthlyUnits?: number;
  productionCapacity?: number;
  fiscalYear: number;
  periodStart: Date;
  periodEnd: Date;
  status?: 'draft' | 'final';
  notes?: string;
}

export interface CostAnalysisFilters {
  organizationId?: string;
  fiscalYear?: number;
  status?: 'draft' | 'final';
}

export class CostAnalysisService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Mapea un registro de base de datos al modelo de dominio
   */
  private mapFromDB(data: CostAnalysisDB): CostAnalysis {
    return {
      id: data.id,
      organizationId: data.organization_id,
      productName: data.product_name,
      productDescription: data.product_description || undefined,
      unitPrice: Number(data.unit_price),
      variableCostPerUnit: Number(data.variable_cost_per_unit),
      variableCostBreakdown: (data.variable_cost_breakdown as CostBreakdownItem[]) || [],
      monthlyFixedCosts: Number(data.monthly_fixed_costs),
      fixedCostBreakdown: (data.fixed_cost_breakdown as CostBreakdownItem[]) || [],
      currentMonthlyUnits: data.current_monthly_units || 0,
      productionCapacity: data.production_capacity || undefined,
      fiscalYear: data.fiscal_year,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      status: data.status as 'draft' | 'final',
      notes: data.notes || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      updatedBy: data.updated_by || undefined,
    };
  }

  /**
   * Calcula todos los análisis de costos para un producto
   */
  calculateAnalysis(costAnalysis: CostAnalysis): CostAnalysisCalculations {
    const {
      unitPrice,
      variableCostPerUnit,
      monthlyFixedCosts,
      currentMonthlyUnits,
      productionCapacity,
    } = costAnalysis;

    // Margen de contribución
    const contributionMarginPerUnit = unitPrice - variableCostPerUnit;
    const contributionMarginRatio = unitPrice > 0 ? contributionMarginPerUnit / unitPrice : 0;
    const totalContributionMargin = contributionMarginPerUnit * currentMonthlyUnits;

    // Punto de equilibrio
    const breakEvenUnits = contributionMarginPerUnit > 0
      ? Math.ceil(monthlyFixedCosts / contributionMarginPerUnit)
      : 0;
    const breakEvenRevenue = breakEvenUnits * unitPrice;

    // Margen de seguridad
    const marginOfSafety = currentMonthlyUnits - breakEvenUnits;
    const marginOfSafetyPercentage = currentMonthlyUnits > 0
      ? (marginOfSafety / currentMonthlyUnits) * 100
      : 0;

    // Rentabilidad
    const currentMonthlyRevenue = unitPrice * currentMonthlyUnits;
    const currentMonthlyVariableCosts = variableCostPerUnit * currentMonthlyUnits;
    const currentMonthlyTotalCosts = currentMonthlyVariableCosts + monthlyFixedCosts;
    const currentMonthlyProfit = currentMonthlyRevenue - currentMonthlyTotalCosts;

    // Apalancamiento operativo
    const operatingLeverage = currentMonthlyProfit !== 0
      ? totalContributionMargin / currentMonthlyProfit
      : 0;

    // Análisis de capacidad
    const capacityUtilization = productionCapacity
      ? (currentMonthlyUnits / productionCapacity) * 100
      : undefined;

    const maxPotentialProfit = productionCapacity
      ? (contributionMarginPerUnit * productionCapacity) - monthlyFixedCosts
      : undefined;

    return {
      contributionMarginPerUnit,
      contributionMarginRatio,
      totalContributionMargin,
      breakEvenUnits,
      breakEvenRevenue,
      marginOfSafety,
      marginOfSafetyPercentage,
      currentMonthlyProfit,
      currentMonthlyRevenue,
      currentMonthlyTotalCosts,
      operatingLeverage,
      capacityUtilization,
      maxPotentialProfit,
    };
  }

  /**
   * Obtiene el ID de la organización del usuario actual (si existe)
   */
  private async getCurrentOrganizationId(): Promise<string | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: orgUser, error } = await this.supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (error || !orgUser) {
      // Retornar null si no hay organización en lugar de lanzar error
      return null;
    }

    return orgUser.organization_id;
  }

  /**
   * Lista todos los análisis de costos con filtros opcionales
   */
  async list(filters?: CostAnalysisFilters): Promise<CostAnalysis[]> {
    let query = this.supabase
      .from('cost_analysis')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }

    if (filters?.fiscalYear) {
      query = query.eq('fiscal_year', filters.fiscalYear);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al listar análisis de costos: ${error.message}`);
    }

    return (data || []).map(item => this.mapFromDB(item));
  }

  /**
   * Obtiene un análisis de costos por ID
   */
  async getById(id: string): Promise<CostAnalysis> {
    const { data, error } = await this.supabase
      .from('cost_analysis')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener análisis de costos: ${error.message}`);
    }

    if (!data) {
      throw new Error('Análisis de costos no encontrado');
    }

    return this.mapFromDB(data);
  }

  /**
   * Crea un nuevo análisis de costos
   */
  async create(input: CreateCostAnalysisInput): Promise<CostAnalysis> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const organizationId = await this.getCurrentOrganizationId();

    const insertData: CostAnalysisInsert = {
      organization_id: organizationId,
      product_name: input.productName,
      product_description: input.productDescription,
      unit_price: input.unitPrice,
      variable_cost_per_unit: input.variableCostPerUnit,
      variable_cost_breakdown: (input.variableCostBreakdown || []) as any,
      monthly_fixed_costs: input.monthlyFixedCosts,
      fixed_cost_breakdown: (input.fixedCostBreakdown || []) as any,
      current_monthly_units: input.currentMonthlyUnits || 0,
      production_capacity: input.productionCapacity,
      fiscal_year: input.fiscalYear,
      period_start: input.periodStart.toISOString(),
      period_end: input.periodEnd.toISOString(),
      status: input.status || 'draft',
      notes: input.notes,
      created_by: user.id,
    };

    const { data, error } = await this.supabase
      .from('cost_analysis')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear análisis de costos: ${error.message}`);
    }

    return this.mapFromDB(data);
  }

  /**
   * Actualiza un análisis de costos existente
   */
  async update(id: string, input: Partial<CreateCostAnalysisInput>): Promise<CostAnalysis> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const updateData: CostAnalysisUpdate = {};

    if (input.productName !== undefined) updateData.product_name = input.productName;
    if (input.productDescription !== undefined) updateData.product_description = input.productDescription;
    if (input.unitPrice !== undefined) updateData.unit_price = input.unitPrice;
    if (input.variableCostPerUnit !== undefined) updateData.variable_cost_per_unit = input.variableCostPerUnit;
    if (input.variableCostBreakdown !== undefined) updateData.variable_cost_breakdown = input.variableCostBreakdown as any;
    if (input.monthlyFixedCosts !== undefined) updateData.monthly_fixed_costs = input.monthlyFixedCosts;
    if (input.fixedCostBreakdown !== undefined) updateData.fixed_cost_breakdown = input.fixedCostBreakdown as any;
    if (input.currentMonthlyUnits !== undefined) updateData.current_monthly_units = input.currentMonthlyUnits;
    if (input.productionCapacity !== undefined) updateData.production_capacity = input.productionCapacity;
    if (input.fiscalYear !== undefined) updateData.fiscal_year = input.fiscalYear;
    if (input.periodStart !== undefined) updateData.period_start = input.periodStart.toISOString();
    if (input.periodEnd !== undefined) updateData.period_end = input.periodEnd.toISOString();
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;

    updateData.updated_by = user.id;

    const { data, error } = await this.supabase
      .from('cost_analysis')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar análisis de costos: ${error.message}`);
    }

    return this.mapFromDB(data);
  }

  /**
   * Elimina un análisis de costos
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('cost_analysis')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar análisis de costos: ${error.message}`);
    }
  }

  /**
   * Finaliza un análisis de costos (cambia estado a 'final')
   */
  async finalize(id: string): Promise<CostAnalysis> {
    return this.update(id, { status: 'final' });
  }
}

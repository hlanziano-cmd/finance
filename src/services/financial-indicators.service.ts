// src/services/financial-indicators.service.ts
// @ts-nocheck

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database.types';
import type { FinancialIndicators } from '@/src/types/models';
import { DatabaseError, NotFoundError } from '@/src/lib/errors';

export class FinancialIndicatorsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Calcular indicadores financieros
   */
  async calculate(
    organizationId: string,
    balanceSheetId: string,
    incomeStatementId: string
  ): Promise<FinancialIndicators> {
    const { data, error } = await this.supabase.rpc('calculate_financial_indicators', {
      p_organization_id: organizationId,
      p_balance_sheet_id: balanceSheetId,
      p_income_statement_id: incomeStatementId,
    });

    if (error) {
      throw new DatabaseError(error.message);
    }

    if (!data) {
      throw new DatabaseError('No se pudieron calcular los indicadores');
    }

    // Obtener el registro recién creado
    return this.getById(data);
  }

  /**
   * Obtener indicadores por ID
   */
  async getById(id: string): Promise<FinancialIndicators> {
    const { data, error } = await this.supabase
      .from('financial_indicators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Indicadores no encontrados');
      }
      throw new DatabaseError(error.message);
    }

    return this.mapIndicatorsFromDB(data);
  }

  /**
   * Obtener indicadores más recientes de una organización
   */
  async getLatest(organizationId: string): Promise<FinancialIndicators | null> {
    const { data, error } = await this.supabase
      .from('financial_indicators')
      .select('*')
      .eq('organization_id', organizationId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No hay indicadores aún
      }
      throw new DatabaseError(error.message);
    }

    return this.mapIndicatorsFromDB(data);
  }

  /**
   * Listar indicadores por período
   */
  async listByPeriod(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialIndicators[]> {
    const { data, error } = await this.supabase
      .from('financial_indicators')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_end', startDate.toISOString())
      .lte('period_end', endDate.toISOString())
      .order('period_end', { ascending: true });

    if (error) {
      throw new DatabaseError(error.message);
    }

    return data.map(this.mapIndicatorsFromDB);
  }

  /**
   * Obtener resumen financiero de la organización
   */
  async getOrganizationSummary(organizationId: string) {
    const { data, error } = await this.supabase
      .from('v_organization_financial_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(error.message);
    }

    return {
      organizationId: data.organization_id,
      organizationName: data.organization_name,
      subscriptionPlan: data.subscription_plan,
      subscriptionStatus: data.subscription_status,
      lastBalanceDate: data.last_balance_date ? new Date(data.last_balance_date) : null,
      lastIncomeDate: data.last_income_date ? new Date(data.last_income_date) : null,
      healthScore: data.health_score,
      riskLevel: data.risk_level,
      currentRatio: data.current_ratio,
      netMargin: data.net_margin,
      roe: data.roe,
      balanceSheetsCount: data.balance_sheets_count,
      incomeStatementsCount: data.income_statements_count,
      activeMembersCount: data.active_members_count,
    };
  }

  /**
   * Comparar indicadores entre períodos
   */
  async comparePeroids(
    organizationId: string,
    periodIds: string[]
  ): Promise<{
    periods: FinancialIndicators[];
    comparisons: Record<string, any>;
  }> {
    const { data, error } = await this.supabase
      .from('financial_indicators')
      .select('*')
      .eq('organization_id', organizationId)
      .in('id', periodIds)
      .order('period_end', { ascending: true });

    if (error) {
      throw new DatabaseError(error.message);
    }

    const indicators = data.map(this.mapIndicatorsFromDB);

    // Calcular comparaciones
    const comparisons = this.calculateComparisons(indicators);

    return {
      periods: indicators,
      comparisons,
    };
  }

  /**
   * Eliminar indicadores
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('financial_indicators')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(error.message);
    }
  }

  /**
   * Calcular variaciones entre períodos
   */
  private calculateComparisons(indicators: FinancialIndicators[]) {
    if (indicators.length < 2) {
      return {};
    }

    const latest = indicators[indicators.length - 1];
    const previous = indicators[indicators.length - 2];

    const calculateChange = (current: number | null, prev: number | null) => {
      if (!current || !prev || prev === 0) return null;
      return ((current - prev) / prev) * 100;
    };

    return {
      workingCapitalChange: calculateChange(latest.workingCapital, previous.workingCapital),
      currentRatioChange: calculateChange(latest.currentRatio, previous.currentRatio),
      netMarginChange: calculateChange(latest.netMargin, previous.netMargin),
      roeChange: calculateChange(latest.roe, previous.roe),
      roaChange: calculateChange(latest.roa, previous.roa),
      debtRatioChange: calculateChange(latest.debtRatio, previous.debtRatio),
      healthScoreChange: latest.healthScore - previous.healthScore,
      trend: this.determineTrend(indicators),
    };
  }

  /**
   * Determinar tendencia general
   */
  private determineTrend(indicators: FinancialIndicators[]): 'improving' | 'stable' | 'declining' {
    if (indicators.length < 3) return 'stable';

    const scores = indicators.slice(-3).map(i => i.healthScore);
    const avgChange = (scores[scores.length - 1] - scores[0]) / scores.length;

    if (avgChange > 5) return 'improving';
    if (avgChange < -5) return 'declining';
    return 'stable';
  }

  /**
   * Mapper
   */
  private mapIndicatorsFromDB(data: any): FinancialIndicators {
    return {
      id: data.id,
      organizationId: data.organization_id,
      balanceSheetId: data.balance_sheet_id,
      incomeStatementId: data.income_statement_id,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),

      // Liquidez
      workingCapital: data.working_capital,
      currentRatio: data.current_ratio,
      acidTest: data.acid_test,

      // Rentabilidad
      grossMargin: data.gross_margin,
      operatingMargin: data.operating_margin,
      netMargin: data.net_margin,
      roe: data.roe,
      roa: data.roa,

      // Endeudamiento
      debtRatio: data.debt_ratio,
      debtToEquity: data.debt_to_equity,
      financialLeverage: data.financial_leverage,

      // Eficiencia
      assetTurnover: data.asset_turnover,
      inventoryTurnover: data.inventory_turnover,
      receivablesDays: data.receivables_days,
      payablesDays: data.payables_days,

      // Otros
      ebitda: data.ebitda,
      breakEvenPoint: data.break_even_point,

      // Análisis
      healthScore: data.health_score,
      riskLevel: data.risk_level,

      calculatedAt: new Date(data.calculated_at),
    };
  }
}

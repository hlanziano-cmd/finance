// src/services/cash-flow.service.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface AdditionalItem {
  id: string;
  name: string;
  amounts: Record<number, number>; // month (1-12) -> amount
}

export interface AdditionalItems {
  incomes: AdditionalItem[];
  expenses: AdditionalItem[];
  customLabels?: Record<string, string>;
}

export interface CashFlowPeriodDTO {
  month: number; // 1-12
  year: number;
  salesCollections: number;
  otherIncome: number;
  supplierPayments: number;
  payroll: number;
  rent: number;
  utilities: number;
  taxes: number;
  otherExpenses: number;
}

export interface CashFlowDTO {
  name: string;
  fiscalYear: number;
  periods: CashFlowPeriodDTO[];
  additionalItems?: AdditionalItems;
}

export interface CashFlowPeriod {
  id: string;
  cash_flow_id: string;
  month: number;
  year: number;
  sales_collections: number;
  other_income: number;
  total_inflows: number;
  supplier_payments: number;
  payroll: number;
  rent: number;
  utilities: number;
  taxes: number;
  other_expenses: number;
  total_outflows: number;
  net_cash_flow: number;
  cumulative_cash_flow: number;
  created_at: string;
  updated_at: string;
}

export interface CashFlow {
  id: string;
  name: string;
  fiscal_year: number;
  additional_items?: AdditionalItems;
  created_by: string;
  created_at: string;
  updated_at: string;
  periods?: CashFlowPeriod[];
}

export class CashFlowService {
  constructor(private supabase: SupabaseClient) {}

  async create(dto: CashFlowDTO): Promise<CashFlow> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Crear el flujo de caja
    const { data: cashFlow, error: cashFlowError } = await this.supabase
      .from('cash_flows')
      .insert({
        name: dto.name,
        fiscal_year: dto.fiscalYear,
        additional_items: dto.additionalItems || { incomes: [], expenses: [] },
        created_by: user.id,
      })
      .select()
      .single();

    if (cashFlowError) throw cashFlowError;

    // Crear los períodos
    if (dto.periods && dto.periods.length > 0) {
      await this.createPeriods(cashFlow.id, dto.periods, dto.additionalItems);
    }

    return cashFlow;
  }

  async list(): Promise<CashFlow[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('cash_flows')
      .select('*, periods:cash_flow_periods(*)')
      .eq('created_by', user.id)
      .order('fiscal_year', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<CashFlow> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('cash_flows')
      .select('*, periods:cash_flow_periods(*)')
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (error) throw error;

    // Ordenar períodos por año y mes
    if (data.periods) {
      data.periods.sort((a: CashFlowPeriod, b: CashFlowPeriod) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    }

    return data;
  }

  async update(id: string, dto: CashFlowDTO): Promise<CashFlow> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Actualizar el flujo de caja
    const { data, error } = await this.supabase
      .from('cash_flows')
      .update({
        name: dto.name,
        fiscal_year: dto.fiscalYear,
        additional_items: dto.additionalItems || { incomes: [], expenses: [] },
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) throw error;

    // Eliminar períodos antiguos y crear nuevos
    await this.deletePeriods(id);
    if (dto.periods && dto.periods.length > 0) {
      await this.createPeriods(id, dto.periods, dto.additionalItems);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await this.supabase
      .from('cash_flows')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
  }

  private async createPeriods(
    cashFlowId: string,
    periods: CashFlowPeriodDTO[],
    additionalItems?: AdditionalItems
  ): Promise<void> {
    // Ordenar períodos por año y mes para calcular acumulados
    const sortedPeriods = [...periods].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    let cumulativeCashFlow = 0;
    const periodsToInsert = sortedPeriods.map(period => {
      // Calculate additional income for this month
      const additionalIncome = (additionalItems?.incomes || []).reduce(
        (sum, item) => sum + (item.amounts[period.month] || 0), 0
      );
      // Calculate additional expenses for this month
      const additionalExpense = (additionalItems?.expenses || []).reduce(
        (sum, item) => sum + (item.amounts[period.month] || 0), 0
      );

      const totalInflows = period.salesCollections + period.otherIncome + additionalIncome;
      const totalOutflows =
        period.supplierPayments +
        period.payroll +
        period.rent +
        period.utilities +
        period.taxes +
        period.otherExpenses +
        additionalExpense;

      const netCashFlow = totalInflows - totalOutflows;
      cumulativeCashFlow += netCashFlow;

      return {
        cash_flow_id: cashFlowId,
        month: period.month,
        year: period.year,
        sales_collections: period.salesCollections,
        other_income: period.otherIncome,
        total_inflows: totalInflows,
        supplier_payments: period.supplierPayments,
        payroll: period.payroll,
        rent: period.rent,
        utilities: period.utilities,
        taxes: period.taxes,
        other_expenses: period.otherExpenses,
        total_outflows: totalOutflows,
        net_cash_flow: netCashFlow,
        cumulative_cash_flow: cumulativeCashFlow,
      };
    });

    const { error } = await this.supabase
      .from('cash_flow_periods')
      .insert(periodsToInsert);

    if (error) throw error;
  }

  private async deletePeriods(cashFlowId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cash_flow_periods')
      .delete()
      .eq('cash_flow_id', cashFlowId);

    if (error) throw error;
  }

  // Método para obtener análisis de salud financiera
  async getHealthAnalysis(id: string): Promise<{
    averageNetFlow: number;
    positiveMonths: number;
    negativeMonths: number;
    healthScore: number;
    recommendations: string[];
  }> {
    const cashFlow = await this.getById(id);

    if (!cashFlow.periods || cashFlow.periods.length === 0) {
      return {
        averageNetFlow: 0,
        positiveMonths: 0,
        negativeMonths: 0,
        healthScore: 0,
        recommendations: ['Agrega períodos para obtener análisis'],
      };
    }

    const periods = cashFlow.periods;
    const totalNetFlow = periods.reduce((sum, p) => sum + p.net_cash_flow, 0);
    const averageNetFlow = totalNetFlow / periods.length;
    const positiveMonths = periods.filter(p => p.net_cash_flow > 0).length;
    const negativeMonths = periods.filter(p => p.net_cash_flow < 0).length;

    // Calcular score de salud (0-100)
    let healthScore = 50; // Base

    // +30 si la mayoría de meses son positivos
    if (positiveMonths > negativeMonths) {
      healthScore += 30 * (positiveMonths / periods.length);
    }

    // +20 si el flujo acumulado es positivo
    const finalCumulative = periods[periods.length - 1].cumulative_cash_flow;
    if (finalCumulative > 0) {
      healthScore += 20;
    }

    // Recomendaciones
    const recommendations: string[] = [];

    if (negativeMonths > positiveMonths) {
      recommendations.push('Preocupante: Tienes más meses negativos que positivos. Revisa tus gastos urgentemente.');
    }

    if (finalCumulative < 0) {
      recommendations.push('El flujo acumulado es negativo. Tu negocio está consumiendo más efectivo del que genera.');
    }

    if (averageNetFlow < 0) {
      recommendations.push('El flujo neto promedio es negativo. Busca formas de aumentar ingresos o reducir gastos.');
    }

    if (positiveMonths === periods.length) {
      recommendations.push('¡Excelente! Todos los meses tienen flujo positivo. Tu negocio genera efectivo consistentemente.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Tu flujo de caja está equilibrado. Continúa monitoreando mensualmente.');
    }

    return {
      averageNetFlow,
      positiveMonths,
      negativeMonths,
      healthScore: Math.min(100, Math.max(0, healthScore)),
      recommendations,
    };
  }
}

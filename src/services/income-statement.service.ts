// src/services/income-statement.service.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface IncomeStatementDTO {
  name: string;
  periodStart: Date;
  periodEnd: Date;
  fiscalYear: number;
  taxRate: number; // Tasa de impuestos (ej: 35 para 35%)
  depreciationAmortization?: number; // Depreciación y amortización
  accounts: Record<string, number>; // { code: amount }
}

export interface IncomeStatement {
  id: string;
  name: string;
  period_start: string;
  period_end: string;
  fiscal_year: number;
  tax_rate: number;
  revenue: number;
  cost_of_sales: number;
  gross_profit: number;
  gross_margin: number;
  operating_expenses: number;
  depreciation_amortization: number;
  ebitda: number;
  operating_profit: number; // Este es el EBIT (Utilidad Operacional)
  operating_margin: number;
  non_operating_income: number;
  non_operating_expenses: number;
  profit_before_tax: number;
  tax_expense: number;
  net_profit: number;
  net_margin: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class IncomeStatementService {
  constructor(private supabase: SupabaseClient) {}

  async create(dto: IncomeStatementDTO): Promise<IncomeStatement> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Calcular totales desde las cuentas
    const revenue = this.sumAccountsByPrefix(dto.accounts, '4'); // Ingresos
    const costOfSales = this.sumAccountsByPrefix(dto.accounts, '6'); // Costos
    const operatingExpenses = this.sumAccountsByPrefix(dto.accounts, '5'); // Gastos

    // Separar ingresos/gastos no operacionales (estos están mezclados en 4 y 5)
    // Por simplicidad, los calculamos por código específico
    const nonOperatingIncome = dto.accounts['4295'] || 0;
    const nonOperatingExpenses = dto.accounts['5305'] || 0;

    // Calcular utilidades
    const grossProfit = revenue - costOfSales;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Utilidad Operacional (también conocida como EBIT - Earnings Before Interest and Taxes)
    const operatingProfit = grossProfit - operatingExpenses;
    const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;

    // EBITDA = Utilidad Operacional + Depreciación y Amortización
    // Representa el flujo de caja operativo real
    const depreciationAmortization = dto.depreciationAmortization || 0;
    const ebitda = operatingProfit + depreciationAmortization;

    const profitBeforeTax = operatingProfit + nonOperatingIncome - nonOperatingExpenses;
    const taxExpense = profitBeforeTax > 0 ? (profitBeforeTax * dto.taxRate) / 100 : 0;
    const netProfit = profitBeforeTax - taxExpense;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Insertar en base de datos
    const { data, error } = await this.supabase
      .from('income_statements')
      .insert({
        organization_id: null,
        name: dto.name,
        period_start: dto.periodStart.toISOString(),
        period_end: dto.periodEnd.toISOString(),
        fiscal_year: dto.fiscalYear,
        tax_rate: dto.taxRate,
        revenue,
        cost_of_sales: costOfSales,
        gross_profit: grossProfit,
        gross_margin: grossMargin,
        operating_expenses: operatingExpenses,
        depreciation_amortization: depreciationAmortization,
        ebitda,
        operating_profit: operatingProfit, // EBIT y Utilidad Operacional son lo mismo
        operating_margin: operatingMargin,
        non_operating_income: nonOperatingIncome,
        non_operating_expenses: nonOperatingExpenses,
        profit_before_tax: profitBeforeTax,
        tax_expense: taxExpense,
        net_profit: netProfit,
        net_margin: netMargin,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Guardar items individuales
    await this.saveItems(data.id, dto.accounts);

    return data;
  }

  async list(): Promise<IncomeStatement[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('income_statements')
      .select('*')
      .eq('created_by', user.id)
      .order('period_end', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<IncomeStatement> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('income_statements')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async getItems(incomeStatementId: string): Promise<Record<string, number>> {
    const { error, data } = await this.supabase
      .from('income_statement_items')
      .select('account_code, amount')
      .eq('income_statement_id', incomeStatementId);

    if (error) throw error;

    // Convertir array a objeto { code: amount }
    const accounts: Record<string, number> = {};
    data?.forEach(item => {
      accounts[item.account_code] = item.amount;
    });

    return accounts;
  }

  async update(id: string, dto: IncomeStatementDTO): Promise<IncomeStatement> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Calcular totales desde las cuentas
    const revenue = this.sumAccountsByPrefix(dto.accounts, '4'); // Ingresos
    const costOfSales = this.sumAccountsByPrefix(dto.accounts, '6'); // Costos
    const operatingExpenses = this.sumAccountsByPrefix(dto.accounts, '5'); // Gastos

    // Separar ingresos/gastos no operacionales
    const nonOperatingIncome = dto.accounts['4295'] || 0;
    const nonOperatingExpenses = dto.accounts['5305'] || 0;

    // Calcular utilidades
    const grossProfit = revenue - costOfSales;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Utilidad Operacional (también conocida como EBIT)
    const operatingProfit = grossProfit - operatingExpenses;
    const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;

    // EBITDA = Utilidad Operacional + Depreciación y Amortización
    const depreciationAmortization = dto.depreciationAmortization || 0;
    const ebitda = operatingProfit + depreciationAmortization;

    const profitBeforeTax = operatingProfit + nonOperatingIncome - nonOperatingExpenses;
    const taxExpense = profitBeforeTax > 0 ? (profitBeforeTax * dto.taxRate) / 100 : 0;
    const netProfit = profitBeforeTax - taxExpense;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Actualizar en base de datos
    const { data, error } = await this.supabase
      .from('income_statements')
      .update({
        name: dto.name,
        period_start: dto.periodStart.toISOString(),
        period_end: dto.periodEnd.toISOString(),
        fiscal_year: dto.fiscalYear,
        tax_rate: dto.taxRate,
        revenue,
        cost_of_sales: costOfSales,
        gross_profit: grossProfit,
        gross_margin: grossMargin,
        operating_expenses: operatingExpenses,
        depreciation_amortization: depreciationAmortization,
        ebitda,
        operating_profit: operatingProfit,
        operating_margin: operatingMargin,
        non_operating_income: nonOperatingIncome,
        non_operating_expenses: nonOperatingExpenses,
        profit_before_tax: profitBeforeTax,
        tax_expense: taxExpense,
        net_profit: netProfit,
        net_margin: netMargin,
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) throw error;

    // Eliminar items antiguos y guardar nuevos
    await this.deleteItems(id);
    await this.saveItems(data.id, dto.accounts);

    return data;
  }

  async delete(id: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await this.supabase
      .from('income_statements')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
  }

  private async deleteItems(incomeStatementId: string): Promise<void> {
    const { error } = await this.supabase
      .from('income_statement_items')
      .delete()
      .eq('income_statement_id', incomeStatementId);

    if (error) throw error;
  }

  private async saveItems(incomeStatementId: string, accounts: Record<string, number>): Promise<void> {
    const items = Object.entries(accounts)
      .filter(([_, amount]) => amount > 0)
      .map(([code, amount]) => ({
        income_statement_id: incomeStatementId,
        organization_id: null,
        account_code: code,
        account_name: this.getAccountName(code),
        category: this.getCategoryByCode(code),
        subcategory: this.getSubcategoryByCode(code),
        amount,
      }));

    if (items.length === 0) return;

    const { error } = await this.supabase
      .from('income_statement_items')
      .insert(items);

    if (error) throw error;
  }

  private sumAccountsByPrefix(accounts: Record<string, number>, prefix: string): number {
    return Object.entries(accounts)
      .filter(([code]) => code.startsWith(prefix))
      .reduce((sum, [_, amount]) => sum + amount, 0);
  }

  private getCategoryByCode(code: string): string {
    if (code.startsWith('4')) return 'ingresos';
    if (code.startsWith('6')) return 'costos';
    if (code.startsWith('5') && !code.startsWith('53')) return 'gastos_operativos';
    if (code.startsWith('53')) return 'gastos_financieros';
    return 'otros';
  }

  private getSubcategoryByCode(code: string): string {
    const subcategories: Record<string, string> = {
      '4135': 'Ingresos Operacionales',
      '4295': 'Ingresos No Operacionales',
      '6135': 'Costos de Ventas',
      '5105': 'Gastos de Personal',
      '5120': 'Gastos de Arriendo',
      '5135': 'Servicios Públicos',
      '5195': 'Marketing y Publicidad',
      '5205': 'Otros Gastos Operacionales',
      '5305': 'Gastos Financieros',
    };
    return subcategories[code] || 'Otros';
  }

  private getAccountName(code: string): string {
    const names: Record<string, string> = {
      '4135': 'Ventas de Productos',
      '6135': 'Costo de los Productos Vendidos',
      '5105': 'Gastos de Personal',
      '5120': 'Gastos de Arriendo',
      '5135': 'Servicios Públicos',
      '5195': 'Gastos de Marketing y Publicidad',
      '5205': 'Otros Gastos Operacionales',
      '5305': 'Gastos Financieros',
      '4295': 'Otros Ingresos',
    };
    return names[code] || `Cuenta ${code}`;
  }
}

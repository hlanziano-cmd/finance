// src/services/project-evaluation.service.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface ProjectItem {
  id: string;
  name: string;
  category: string; // predefined key or 'custom'
  amounts: Record<number, number>; // period index (0-based) -> amount
}

export interface ProjectLoan {
  id: string;
  name: string;
  principal: number;
  annualRate: number; // percentage, e.g. 12 = 12%
  numInstallments: number;
  startPeriod: number; // 0-based period index
}

export interface AmortizationEntry {
  period: number;
  installment: number;
  capital: number;
  interest: number;
  balance: number;
}

export interface ProjectItems {
  incomes: ProjectItem[];
  expenses: ProjectItem[];
}

export interface ProjectEvaluationDTO {
  name: string;
  description?: string;
  periodType: 'months' | 'years';
  startMonth?: number;
  startYear: number;
  numPeriods: number;
  items: ProjectItems;
  loans: ProjectLoan[];
}

export interface ProjectEvaluation {
  id: string;
  name: string;
  description: string | null;
  period_type: 'months' | 'years';
  start_month: number | null;
  start_year: number;
  num_periods: number;
  items: ProjectItems;
  loans: ProjectLoan[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Predefined categories
export const INCOME_CATEGORIES = [
  { key: 'fondos_propios', name: 'Fondos Propios', description: 'Capital propio aportado al proyecto' },
  { key: 'ventas', name: 'Ingresos por Ventas', description: 'Ingresos operativos del proyecto' },
  { key: 'otros_ingresos', name: 'Otros Ingresos', description: 'Ingresos adicionales' },
];

export const EXPENSE_CATEGORIES = [
  { key: 'inversion_inicial', name: 'Inversión Inicial', description: 'Costo de inicio del proyecto' },
  { key: 'materia_prima', name: 'Materia Prima / Insumos', description: 'Costos de materiales' },
  { key: 'personal', name: 'Gastos de Personal', description: 'Sueldos y prestaciones' },
  { key: 'arriendo', name: 'Arriendo', description: 'Alquiler de espacio' },
  { key: 'servicios', name: 'Servicios Públicos', description: 'Luz, agua, internet' },
  { key: 'marketing', name: 'Marketing y Publicidad', description: 'Gastos de promoción' },
  { key: 'otros_gastos', name: 'Otros Gastos Operativos', description: 'Gastos varios' },
];

export function calculateAmortization(
  loan: ProjectLoan,
  periodType: 'months' | 'years'
): AmortizationEntry[] {
  if (loan.principal <= 0 || loan.annualRate <= 0 || loan.numInstallments <= 0) {
    return [];
  }

  const periodicRate = periodType === 'months'
    ? (loan.annualRate / 100) / 12
    : loan.annualRate / 100;

  const cuota = loan.principal * periodicRate /
    (1 - Math.pow(1 + periodicRate, -loan.numInstallments));

  let balance = loan.principal;
  const schedule: AmortizationEntry[] = [];

  for (let i = 0; i < loan.numInstallments; i++) {
    const interest = balance * periodicRate;
    const capital = cuota - interest;
    balance -= capital;

    schedule.push({
      period: loan.startPeriod + i,
      installment: Math.round(cuota * 100) / 100,
      capital: Math.round(capital * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  return schedule;
}

export class ProjectEvaluationService {
  constructor(private supabase: SupabaseClient) {}

  async create(dto: ProjectEvaluationDTO): Promise<ProjectEvaluation> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('project_evaluations')
      .insert({
        name: dto.name,
        description: dto.description || null,
        period_type: dto.periodType,
        start_month: dto.periodType === 'months' ? (dto.startMonth || 1) : null,
        start_year: dto.startYear,
        num_periods: dto.numPeriods,
        items: dto.items || { incomes: [], expenses: [] },
        loans: dto.loans || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async list(): Promise<ProjectEvaluation[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('project_evaluations')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<ProjectEvaluation> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('project_evaluations')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: ProjectEvaluationDTO): Promise<ProjectEvaluation> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('project_evaluations')
      .update({
        name: dto.name,
        description: dto.description || null,
        period_type: dto.periodType,
        start_month: dto.periodType === 'months' ? (dto.startMonth || 1) : null,
        start_year: dto.startYear,
        num_periods: dto.numPeriods,
        items: dto.items || { incomes: [], expenses: [] },
        loans: dto.loans || [],
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await this.supabase
      .from('project_evaluations')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
  }
}

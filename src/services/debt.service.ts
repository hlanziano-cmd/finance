// src/services/debt.service.ts

import { SupabaseClient } from '@supabase/supabase-js';
import type { AdditionalItem } from './cash-flow.service';

export type InstallmentPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface ExtraPayment {
  installment: number; // After which installment this extra payment is applied
  amount: number;
  date?: string;
}

export interface DebtDTO {
  name: string;
  creditor?: string;
  originalAmount: number;
  annualRate: number; // percentage, e.g. 12 = 12%
  totalInstallments: number;
  installmentPeriod: InstallmentPeriod;
  startDate: string; // ISO date string
  currentInstallment?: number;
  extraPayments?: ExtraPayment[];
  notes?: string;
  cashFlowId?: string | null;
}

export interface Debt {
  id: string;
  name: string;
  creditor: string | null;
  original_amount: number;
  annual_rate: number;
  total_installments: number;
  installment_period: InstallmentPeriod;
  start_date: string;
  current_installment: number;
  extra_payments: ExtraPayment[];
  notes: string | null;
  cash_flow_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AmortizationEntry {
  installment: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  extraPayment: number;
  remainingBalance: number;
  status: 'paid' | 'current' | 'future';
}

export interface DebtSummary {
  currentBalance: number;
  totalPaid: number;
  totalInterest: number;
  totalPrincipalPaid: number;
  savingsFromExtra: number;
  remainingInstallments: number;
  estimatedEndDate: string;
  monthlyPayment: number;
}

const PERIOD_MONTHS: Record<InstallmentPeriod, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function getPeriodicRate(annualRate: number, period: InstallmentPeriod): number {
  const periodsPerYear = 12 / PERIOD_MONTHS[period];
  return (annualRate / 100) / periodsPerYear;
}

export function calculateAmortization(debt: Debt): AmortizationEntry[] {
  const { original_amount, annual_rate, total_installments, installment_period, start_date, current_installment, extra_payments } = debt;

  if (original_amount <= 0 || annual_rate <= 0 || total_installments <= 0) return [];

  const periodicRate = getPeriodicRate(annual_rate, installment_period);
  const monthsPerPeriod = PERIOD_MONTHS[installment_period];

  // Build a map of extra payments by installment number
  const extraMap = new Map<number, number>();
  for (const ep of extra_payments || []) {
    extraMap.set(ep.installment, (extraMap.get(ep.installment) || 0) + ep.amount);
  }

  let balance = original_amount;
  const schedule: AmortizationEntry[] = [];

  // Calculate initial fixed payment (French system)
  let cuota = balance * periodicRate / (1 - Math.pow(1 + periodicRate, -total_installments));

  for (let i = 1; i <= total_installments && balance > 0.01; i++) {
    const interest = balance * periodicRate;
    let principal = cuota - interest;

    // Ensure we don't overpay
    if (principal > balance) {
      principal = balance;
    }

    const extra = extraMap.get(i) || 0;
    balance -= principal + extra;
    if (balance < 0) balance = 0;

    const date = addMonthsToDate(start_date, (i - 1) * monthsPerPeriod);

    let status: 'paid' | 'current' | 'future';
    if (i <= current_installment) {
      status = 'paid';
    } else if (i === current_installment + 1) {
      status = 'current';
    } else {
      status = 'future';
    }

    schedule.push({
      installment: i,
      date,
      payment: Math.round((principal + interest) * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      extraPayment: Math.round(extra * 100) / 100,
      remainingBalance: Math.round(balance * 100) / 100,
      status,
    });

    // If there was an extra payment, recalculate the fixed cuota for remaining installments
    if (extra > 0 && balance > 0) {
      const remainingPeriods = total_installments - i;
      if (remainingPeriods > 0) {
        cuota = balance * periodicRate / (1 - Math.pow(1 + periodicRate, -remainingPeriods));
      }
    }

    if (balance <= 0) break;
  }

  return schedule;
}

export function calculateAmortizationWithExtra(
  debt: Debt,
  simulatedExtra: { installment: number; amount: number }
): AmortizationEntry[] {
  const simulatedDebt: Debt = {
    ...debt,
    extra_payments: [
      ...(debt.extra_payments || []),
      simulatedExtra,
    ],
  };
  return calculateAmortization(simulatedDebt);
}

export function getDebtSummary(debt: Debt): DebtSummary {
  const schedule = calculateAmortization(debt);
  const monthsPerPeriod = PERIOD_MONTHS[debt.installment_period];

  // Calculate without extra payments for comparison
  const debtWithoutExtra: Debt = { ...debt, extra_payments: [] };
  const scheduleWithoutExtra = calculateAmortization(debtWithoutExtra);

  const totalInterestWithExtra = schedule.reduce((sum, e) => sum + e.interest, 0);
  const totalInterestWithoutExtra = scheduleWithoutExtra.reduce((sum, e) => sum + e.interest, 0);
  const savingsFromExtra = totalInterestWithoutExtra - totalInterestWithExtra;

  const paidEntries = schedule.filter(e => e.status === 'paid');
  const totalPaid = paidEntries.reduce((sum, e) => sum + e.payment + e.extraPayment, 0);
  const totalPrincipalPaid = paidEntries.reduce((sum, e) => sum + e.principal + e.extraPayment, 0);
  const totalInterest = paidEntries.reduce((sum, e) => sum + e.interest, 0);

  const currentBalance = schedule.length > 0
    ? (debt.current_installment > 0 && debt.current_installment <= schedule.length
      ? schedule[debt.current_installment - 1].remainingBalance
      : debt.original_amount)
    : debt.original_amount;

  const remainingInstallments = schedule.filter(e => e.status !== 'paid').length;
  const lastEntry = schedule[schedule.length - 1];
  const estimatedEndDate = lastEntry ? lastEntry.date : debt.start_date;

  // Monthly equivalent payment
  const currentEntry = schedule.find(e => e.status === 'current');
  const monthlyPayment = currentEntry
    ? currentEntry.payment / monthsPerPeriod
    : (schedule.length > 0 ? schedule[0].payment / monthsPerPeriod : 0);

  return {
    currentBalance: Math.round(currentBalance * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
    savingsFromExtra: Math.round(savingsFromExtra * 100) / 100,
    remainingInstallments,
    estimatedEndDate,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
  };
}

export function getDebtExpensesForCashFlow(
  debt: Debt,
  periods: { month: number; year: number }[]
): AdditionalItem | null {
  const schedule = calculateAmortization(debt);
  if (schedule.length === 0) return null;

  const amounts: Record<number, number> = {};

  for (const entry of schedule) {
    if (entry.status === 'paid') continue;

    const entryDate = new Date(entry.date);
    const entryMonth = entryDate.getMonth() + 1;
    const entryYear = entryDate.getFullYear();

    // Find matching period column (1-based)
    const colIndex = periods.findIndex(p => p.month === entryMonth && p.year === entryYear);
    if (colIndex >= 0) {
      amounts[colIndex + 1] = entry.payment + entry.extraPayment;
    }
  }

  if (Object.keys(amounts).length === 0) return null;

  return {
    id: `debt-${debt.id}`,
    name: `Deuda: ${debt.name}`,
    amounts,
  };
}

export class DebtService {
  constructor(private supabase: SupabaseClient) {}

  async create(dto: DebtDTO): Promise<Debt> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('debts')
      .insert({
        name: dto.name,
        creditor: dto.creditor || null,
        original_amount: dto.originalAmount,
        annual_rate: dto.annualRate,
        total_installments: dto.totalInstallments,
        installment_period: dto.installmentPeriod,
        start_date: dto.startDate,
        current_installment: dto.currentInstallment || 0,
        extra_payments: dto.extraPayments || [],
        notes: dto.notes || null,
        cash_flow_id: dto.cashFlowId || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async list(): Promise<Debt[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('debts')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Debt> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('debts')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: DebtDTO): Promise<Debt> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('debts')
      .update({
        name: dto.name,
        creditor: dto.creditor || null,
        original_amount: dto.originalAmount,
        annual_rate: dto.annualRate,
        total_installments: dto.totalInstallments,
        installment_period: dto.installmentPeriod,
        start_date: dto.startDate,
        current_installment: dto.currentInstallment || 0,
        extra_payments: dto.extraPayments || [],
        notes: dto.notes || null,
        cash_flow_id: dto.cashFlowId || null,
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
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
  }
}

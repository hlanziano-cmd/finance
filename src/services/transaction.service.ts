// src/services/transaction.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CashFlowPeriodDTO } from './cash-flow.service';

export type TransactionType = 'income' | 'expense';

export const INCOME_CATEGORIES = [
  'Ventas',
  'Cobros de Cartera',
  'Servicios',
  'Inversiones',
  'Otro Ingreso',
];

export const EXPENSE_CATEGORIES = [
  'Proveedores',
  'Nómina',
  'Arriendo',
  'Servicios Públicos',
  'Impuestos',
  'Mercadeo',
  'Transporte',
  'Otros Gastos',
];

export interface TransactionDTO {
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // 'YYYY-MM-DD'
  description?: string;
  reference?: string;
  recurring?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  reference: string | null;
  recurring: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  month?: number;
  year?: number;
  type?: TransactionType;
  category?: string;
}

export class TransactionService {
  constructor(private supabase: SupabaseClient) {}

  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');
    return user;
  }

  async create(dto: TransactionDTO): Promise<Transaction> {
    const user = await this.getCurrentUser();

    const { data, error } = await this.supabase
      .from('transactions')
      .insert({
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        date: dto.date,
        description: dto.description || null,
        reference: dto.reference || null,
        recurring: dto.recurring ?? false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  }

  async list(filters?: TransactionFilters): Promise<Transaction[]> {
    const user = await this.getCurrentUser();

    let query = this.supabase
      .from('transactions')
      .select('*')
      .eq('created_by', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.year) {
      const yearStart = `${filters.year}-01-01`;
      const yearEnd = `${filters.year}-12-31`;
      query = query.gte('date', yearStart).lte('date', yearEnd);
    }

    if (filters?.month && filters?.year) {
      const monthStr = String(filters.month).padStart(2, '0');
      const monthStart = `${filters.year}-${monthStr}-01`;
      const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
      const monthEnd = `${filters.year}-${monthStr}-${daysInMonth}`;
      // Include transactions in the month OR any recurring transaction
      query = query.or(`and(date.gte.${monthStart},date.lte.${monthEnd}),recurring.eq.true`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Transaction[];
  }

  async getById(id: string): Promise<Transaction> {
    const user = await this.getCurrentUser();

    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (error) throw error;
    return data as Transaction;
  }

  async update(id: string, dto: TransactionDTO): Promise<Transaction> {
    const user = await this.getCurrentUser();

    const { data, error } = await this.supabase
      .from('transactions')
      .update({
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        date: dto.date,
        description: dto.description || null,
        reference: dto.reference || null,
        recurring: dto.recurring ?? false,
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  }

  async delete(id: string): Promise<void> {
    const user = await this.getCurrentUser();

    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
  }
}

// Maps transaction categories to CashFlowPeriodDTO fields
export function getTransactionSummaryForCashFlow(
  transactions: Transaction[],
  month: number,
  year: number,
): Partial<CashFlowPeriodDTO> {
  const monthStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${monthStr}-${daysInMonth}`;

  const inPeriod = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd);

  const income = (categories: string[]) =>
    inPeriod
      .filter(t => t.type === 'income' && categories.some(c => t.category.toLowerCase().includes(c.toLowerCase())))
      .reduce((s, t) => s + t.amount, 0);

  const expense = (categories: string[]) =>
    inPeriod
      .filter(t => t.type === 'expense' && categories.some(c => t.category.toLowerCase().includes(c.toLowerCase())))
      .reduce((s, t) => s + t.amount, 0);

  const allIncomes = inPeriod.filter(t => t.type === 'income');
  const salesCollections = income(['Ventas', 'Cobros']);
  const otherIncome = allIncomes
    .filter(t => !['Ventas', 'Cobros'].some(c => t.category.toLowerCase().includes(c.toLowerCase())))
    .reduce((s, t) => s + t.amount, 0);

  const supplierPayments = expense(['Proveedores']);
  const payroll = expense(['Nómina', 'Nomina']);
  const rent = expense(['Arriendo']);
  const utilities = expense(['Servicios Públicos', 'Servicios Publicos', 'Servicios']);
  const taxes = expense(['Impuestos']);
  const otherExpenses = inPeriod
    .filter(t => t.type === 'expense')
    .filter(t => !['Proveedores', 'Nómina', 'Nomina', 'Arriendo', 'Servicios Públicos', 'Servicios Publicos', 'Servicios', 'Impuestos']
      .some(c => t.category.toLowerCase().includes(c.toLowerCase())))
    .reduce((s, t) => s + t.amount, 0);

  return {
    salesCollections,
    otherIncome,
    supplierPayments,
    payroll,
    rent,
    utilities,
    taxes,
    otherExpenses,
  };
}

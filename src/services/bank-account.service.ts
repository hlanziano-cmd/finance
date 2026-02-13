// src/services/bank-account.service.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface BankAccountDTO {
  name: string;
  bankName: string;
  accountType: 'ahorro' | 'corriente';
  accountNumber?: string;
  initialBalance?: number;
}

export interface BankAccountUpdateDTO {
  name?: string;
  bankName?: string;
  accountType?: 'ahorro' | 'corriente';
  accountNumber?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_type: 'ahorro' | 'corriente';
  account_number: string | null;
  current_balance: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  transactions?: BankTransaction[];
}

export interface TransactionDTO {
  type: 'ingreso' | 'egreso';
  amount: number;
  description?: string;
  transactionDate: string; // YYYY-MM-DD
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  description: string | null;
  transaction_date: string;
  balance_after: number;
  created_at: string;
}

export class BankAccountService {
  constructor(private supabase: SupabaseClient) {}

  async create(dto: BankAccountDTO): Promise<BankAccount> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('bank_accounts')
      .insert({
        name: dto.name,
        bank_name: dto.bankName,
        account_type: dto.accountType,
        account_number: dto.accountNumber || null,
        current_balance: dto.initialBalance || 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Si hay saldo inicial, crear transacción de apertura
    if (dto.initialBalance && dto.initialBalance > 0) {
      await this.supabase
        .from('bank_transactions')
        .insert({
          bank_account_id: data.id,
          type: 'ingreso',
          amount: dto.initialBalance,
          description: 'Saldo inicial de apertura',
          transaction_date: new Date().toISOString().split('T')[0],
          balance_after: dto.initialBalance,
        });
    }

    return data;
  }

  async list(): Promise<BankAccount[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('bank_accounts')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<BankAccount> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('bank_accounts')
      .select('*, transactions:bank_transactions(*)')
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (error) throw error;

    // Ordenar transacciones por fecha desc
    if (data.transactions) {
      data.transactions.sort((a: BankTransaction, b: BankTransaction) => {
        const dateCompare = new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return data;
  }

  async update(id: string, dto: BankAccountUpdateDTO): Promise<BankAccount> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.bankName !== undefined) updateData.bank_name = dto.bankName;
    if (dto.accountType !== undefined) updateData.account_type = dto.accountType;
    if (dto.accountNumber !== undefined) updateData.account_number = dto.accountNumber;

    const { data, error } = await this.supabase
      .from('bank_accounts')
      .update(updateData)
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
      .from('bank_accounts')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
  }

  async addTransaction(accountId: string, dto: TransactionDTO): Promise<BankTransaction> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener saldo actual
    const { data: account, error: accountError } = await this.supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', accountId)
      .eq('created_by', user.id)
      .single();

    if (accountError) throw accountError;

    const currentBalance = Number(account.current_balance);
    const newBalance = dto.type === 'ingreso'
      ? currentBalance + dto.amount
      : currentBalance - dto.amount;

    // Insertar transacción
    const { data: transaction, error: txError } = await this.supabase
      .from('bank_transactions')
      .insert({
        bank_account_id: accountId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description || null,
        transaction_date: dto.transactionDate,
        balance_after: newBalance,
      })
      .select()
      .single();

    if (txError) throw txError;

    // Actualizar saldo de la cuenta
    const { error: updateError } = await this.supabase
      .from('bank_accounts')
      .update({ current_balance: newBalance })
      .eq('id', accountId)
      .eq('created_by', user.id);

    if (updateError) throw updateError;

    return transaction;
  }

  async deleteTransaction(accountId: string, transactionId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener la transacción a eliminar
    const { data: transaction, error: txError } = await this.supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError) throw txError;

    // Obtener saldo actual
    const { data: account, error: accountError } = await this.supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', accountId)
      .eq('created_by', user.id)
      .single();

    if (accountError) throw accountError;

    // Recalcular saldo (revertir la transacción)
    const currentBalance = Number(account.current_balance);
    const revertedBalance = transaction.type === 'ingreso'
      ? currentBalance - Number(transaction.amount)
      : currentBalance + Number(transaction.amount);

    // Eliminar transacción
    const { error: deleteError } = await this.supabase
      .from('bank_transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) throw deleteError;

    // Actualizar saldo
    const { error: updateError } = await this.supabase
      .from('bank_accounts')
      .update({ current_balance: revertedBalance })
      .eq('id', accountId)
      .eq('created_by', user.id);

    if (updateError) throw updateError;
  }
}

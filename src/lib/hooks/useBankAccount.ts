// src/lib/hooks/useBankAccount.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import {
  BankAccountService,
  type BankAccountDTO,
  type BankAccountUpdateDTO,
  type TransactionDTO,
} from '@/src/services/bank-account.service';
import { toast } from 'sonner';

export function useBankAccounts() {
  const supabase = useSupabase();
  const service = new BankAccountService(supabase);

  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const result: any = await service.list();
      return Array.isArray(result) ? result : result.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useBankAccount(id?: string) {
  const supabase = useSupabase();
  const service = new BankAccountService(supabase);

  return useQuery({
    queryKey: ['bank-account', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useCreateBankAccount() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BankAccountService(supabase);

  return useMutation({
    mutationFn: (dto: BankAccountDTO) => service.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Cuenta bancaria creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear cuenta: ${error.message}`);
    },
  });
}

export function useUpdateBankAccount() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BankAccountService(supabase);

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: BankAccountUpdateDTO }) =>
      service.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account', variables.id] });
      toast.success('Cuenta actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteBankAccount() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BankAccountService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Cuenta eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

export function useAddTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BankAccountService(supabase);

  return useMutation({
    mutationFn: ({ accountId, dto }: { accountId: string; dto: TransactionDTO }) =>
      service.addTransaction(accountId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account', variables.accountId] });
      toast.success('Transacción registrada');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar transacción: ${error.message}`);
    },
  });
}

export function useDeleteTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BankAccountService(supabase);

  return useMutation({
    mutationFn: ({ accountId, transactionId }: { accountId: string; transactionId: string }) =>
      service.deleteTransaction(accountId, transactionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account', variables.accountId] });
      toast.success('Transacción eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar transacción: ${error.message}`);
    },
  });
}

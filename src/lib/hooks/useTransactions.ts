// src/lib/hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { TransactionService, type TransactionDTO, type TransactionFilters } from '@/src/services/transaction.service';
import { toast } from 'sonner';

export function useTransactions(filters?: TransactionFilters) {
  const supabase = useSupabase();
  const service = new TransactionService(supabase);

  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => service.list(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTransaction(id?: string) {
  const supabase = useSupabase();
  const service = new TransactionService(supabase);

  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new TransactionService(supabase);

  return useMutation({
    mutationFn: (dto: TransactionDTO) => service.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transacción registrada');
    },
    onError: (error: Error) => {
      console.error('Error creating transaction:', error);
      toast.error(`Error al registrar: ${error.message}`);
    },
  });
}

export function useUpdateTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new TransactionService(supabase);

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: TransactionDTO }) => service.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
      toast.success('Transacción actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new TransactionService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transacción eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

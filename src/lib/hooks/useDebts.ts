// src/lib/hooks/useDebts.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { DebtService, type DebtDTO } from '@/src/services/debt.service';
import { toast } from 'sonner';

export function useDebts() {
  const supabase = useSupabase();
  const service = new DebtService(supabase);

  return useQuery({
    queryKey: ['debts'],
    queryFn: () => service.list(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDebt(id?: string) {
  const supabase = useSupabase();
  const service = new DebtService(supabase);

  return useQuery({
    queryKey: ['debt', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDebt() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new DebtService(supabase);

  return useMutation({
    mutationFn: (dto: DebtDTO) => service.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Deuda creada exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error creating debt:', error);
      toast.error(`Error al crear: ${error.message}`);
    },
  });
}

export function useUpdateDebt() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new DebtService(supabase);

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: DebtDTO }) => service.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt', variables.id] });
      toast.success('Deuda actualizada exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error updating debt:', error);
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteDebt() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new DebtService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Deuda eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

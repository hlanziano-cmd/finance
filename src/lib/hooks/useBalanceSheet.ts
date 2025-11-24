// src/lib/hooks/useBalanceSheet.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { BalanceSheetService } from '@/src/services/balance-sheet.service';
import type {
  BalanceSheet,
  CreateBalanceSheetDTO,
  UpdateBalanceSheetDTO,
  BalanceSheetFilters,
} from '@/src/types';
import { toast } from 'sonner';

export function useBalanceSheet(id?: string) {
  const supabase = useSupabase();
  const service = new BalanceSheetService(supabase);

  return useQuery({
    queryKey: ['balance-sheet', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useBalanceSheets(filters?: BalanceSheetFilters) {
  const supabase = useSupabase();
  const service = new BalanceSheetService(supabase);

  return useQuery({
    queryKey: ['balance-sheets', filters],
    queryFn: () => service.list(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useCreateBalanceSheet() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: (dto: CreateBalanceSheetDTO) => service.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] });
      toast.success('Balance creado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error creating balance:', error);
      toast.error(`Error al crear balance: ${error.message}`);
    },
  });
}

export function useUpdateBalanceSheet(id: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: (dto: UpdateBalanceSheetDTO) => service.update(id, dto),
    onMutate: async (dto) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['balance-sheet', id] });

      // Snapshot del estado anterior
      const previousData = queryClient.getQueryData(['balance-sheet', id]);

      // Actualización optimista
      queryClient.setQueryData(['balance-sheet', id], (old: BalanceSheet) => ({
        ...old,
        ...dto,
      }));

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback en caso de error
      if (context?.previousData) {
        queryClient.setQueryData(['balance-sheet', id], context.previousData);
      }
      toast.error(`Error al actualizar: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', id] });
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] });
      toast.success('Balance actualizado');
    },
  });
}

export function useDeleteBalanceSheet() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] });
      toast.success('Balance eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

export function useFinalizeBalanceSheet() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.finalize(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', data.id] });
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] });
      toast.success('Balance finalizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al finalizar: ${error.message}`);
    },
  });
}

// Hooks para manejo de items de balance
export function useAddBalanceSheetItem(balanceSheetId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: (item: any) => service.addItem(balanceSheetId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', balanceSheetId] });
      toast.success('Cuenta agregada');
    },
    onError: (error: Error) => {
      toast.error(`Error al agregar cuenta: ${error.message}`);
    },
  });
}

export function useUpdateBalanceSheetItem(balanceSheetId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: any }) =>
      service.updateItem(itemId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', balanceSheetId] });
      toast.success('Cuenta actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar cuenta: ${error.message}`);
    },
  });
}

export function useDeleteBalanceSheetItem(balanceSheetId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: (itemId: string) => service.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', balanceSheetId] });
      toast.success('Cuenta eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar cuenta: ${error.message}`);
    },
  });
}

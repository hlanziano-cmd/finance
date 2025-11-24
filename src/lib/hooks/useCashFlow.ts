// src/lib/hooks/useCashFlow.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { CashFlowService, type CashFlowDTO } from '@/src/services/cash-flow.service';
import { toast } from 'sonner';

export function useCashFlows() {
  const supabase = useSupabase();
  const service = new CashFlowService(supabase);

  return useQuery({
    queryKey: ['cash-flows'],
    queryFn: async () => {
      const result: any = await service.list();
      return Array.isArray(result) ? result : result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useCashFlow(id?: string) {
  const supabase = useSupabase();
  const service = new CashFlowService(supabase);

  return useQuery({
    queryKey: ['cash-flow', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateCashFlow() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new CashFlowService(supabase);

  return useMutation({
    mutationFn: (dto: CashFlowDTO) => service.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
      toast.success('Flujo de caja creado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error creating cash flow:', error);
      toast.error(`Error al crear: ${error.message}`);
    },
  });
}

export function useUpdateCashFlow() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new CashFlowService(supabase);

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CashFlowDTO }) => service.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow', variables.id] });
      toast.success('Flujo de caja actualizado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error updating cash flow:', error);
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteCashFlow() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new CashFlowService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
      toast.success('Flujo de caja eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

export function useCashFlowHealthAnalysis(id?: string) {
  const supabase = useSupabase();
  const service = new CashFlowService(supabase);

  return useQuery({
    queryKey: ['cash-flow-health', id],
    queryFn: () => service.getHealthAnalysis(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// src/lib/hooks/useCostAnalysis.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import {
  CostAnalysisService,
  CreateCostAnalysisInput,
  CostAnalysisFilters
} from '@/src/services/cost-analysis.service';
import { toast } from 'sonner';

export function useCostAnalyses(filters?: CostAnalysisFilters) {
  const supabase = useSupabase();
  const service = new CostAnalysisService(supabase);

  return useQuery({
    queryKey: ['cost-analyses', filters],
    queryFn: () => service.list(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useCostAnalysis(id: string) {
  const supabase = useSupabase();
  const service = new CostAnalysisService(supabase);

  return useQuery({
    queryKey: ['cost-analysis', id],
    queryFn: () => service.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCostAnalysis() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new CostAnalysisService(supabase);

  return useMutation({
    mutationFn: (input: CreateCostAnalysisInput) => service.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-analyses'] });
      toast.success('Análisis de costos creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear análisis: ${error.message}`);
    },
  });
}

export function useUpdateCostAnalysis() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new CostAnalysisService(supabase);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateCostAnalysisInput> }) =>
      service.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cost-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['cost-analysis', data.id] });
      toast.success('Análisis de costos actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteCostAnalysis() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new CostAnalysisService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-analyses'] });
      toast.success('Análisis de costos eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

export function useFinalizeCostAnalysis() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new CostAnalysisService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.finalize(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cost-analysis', data.id] });
      queryClient.invalidateQueries({ queryKey: ['cost-analyses'] });
      toast.success('Análisis finalizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al finalizar: ${error.message}`);
    },
  });
}

// src/lib/hooks/useIndicatorAnalysis.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import {
  IndicatorAnalysisService,
  CreateIndicatorAnalysisInput,
  IndicatorAnalysisFilters
} from '@/src/services/indicator-analysis.service';

export function useIndicatorAnalyses(filters?: IndicatorAnalysisFilters) {
  const supabase = useSupabase();
  const service = new IndicatorAnalysisService(supabase);

  return useQuery({
    queryKey: ['indicator-analyses', filters],
    queryFn: async () => {
      const result = await service.list(filters);
      return result.data; // Extraer solo el array de datos
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useIndicatorAnalysis(id: string) {
  const supabase = useSupabase();
  const service = new IndicatorAnalysisService(supabase);

  return useQuery({
    queryKey: ['indicator-analysis', id],
    queryFn: () => service.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateIndicatorAnalysis() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new IndicatorAnalysisService(supabase);

  return useMutation({
    mutationFn: (input: CreateIndicatorAnalysisInput) => service.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicator-analyses'] });
    },
    onError: (error: Error) => {
      console.error('Error creating indicator analysis:', error);
      throw error;
    },
  });
}

export function useUpdateIndicatorAnalysis() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new IndicatorAnalysisService(supabase);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateIndicatorAnalysisInput> }) =>
      service.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['indicator-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['indicator-analysis', data.id] });
    },
    onError: (error: Error) => {
      console.error('Error updating indicator analysis:', error);
      throw error;
    },
  });
}

export function useDeleteIndicatorAnalysis() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new IndicatorAnalysisService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicator-analyses'] });
    },
    onError: (error: Error) => {
      console.error('Error deleting indicator analysis:', error);
      throw error;
    },
  });
}

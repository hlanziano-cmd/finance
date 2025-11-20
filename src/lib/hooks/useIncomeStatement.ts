// src/lib/hooks/useIncomeStatement.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { IncomeStatementService, type IncomeStatementDTO } from '@/src/services/income-statement.service';
import { toast } from 'sonner';

export function useIncomeStatements() {
  const supabase = useSupabase();
  const service = new IncomeStatementService(supabase);

  return useQuery({
    queryKey: ['income-statements'],
    queryFn: () => service.list(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useIncomeStatement(id?: string) {
  const supabase = useSupabase();
  const service = new IncomeStatementService(supabase);

  return useQuery({
    queryKey: ['income-statement', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateIncomeStatement() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new IncomeStatementService(supabase);

  return useMutation({
    mutationFn: (dto: IncomeStatementDTO) => service.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-statements'] });
      toast.success('Estado de resultados creado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error creating income statement:', error);
      toast.error(`Error al crear: ${error.message}`);
    },
  });
}

export function useUpdateIncomeStatement() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new IncomeStatementService(supabase);

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IncomeStatementDTO }) => service.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['income-statements'] });
      queryClient.invalidateQueries({ queryKey: ['income-statement', variables.id] });
      toast.success('Estado de resultados actualizado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error updating income statement:', error);
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteIncomeStatement() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new IncomeStatementService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-statements'] });
      toast.success('Estado de resultados eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

export function useIncomeStatementItems(id?: string) {
  const supabase = useSupabase();
  const service = new IncomeStatementService(supabase);

  return useQuery({
    queryKey: ['income-statement-items', id],
    queryFn: () => service.getItems(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

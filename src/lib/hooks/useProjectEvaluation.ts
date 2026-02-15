// src/lib/hooks/useProjectEvaluation.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import {
  ProjectEvaluationService,
  type ProjectEvaluationDTO,
} from '@/src/services/project-evaluation.service';
import { toast } from 'sonner';

export function useProjectEvaluations() {
  const supabase = useSupabase();
  const service = new ProjectEvaluationService(supabase);

  return useQuery({
    queryKey: ['project-evaluations'],
    queryFn: () => service.list(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useProjectEvaluation(id?: string) {
  const supabase = useSupabase();
  const service = new ProjectEvaluationService(supabase);

  return useQuery({
    queryKey: ['project-evaluation', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProjectEvaluation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new ProjectEvaluationService(supabase);

  return useMutation({
    mutationFn: (dto: ProjectEvaluationDTO) => service.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-evaluations'] });
      toast.success('Proyecto creado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error creating project:', error);
      toast.error(`Error al crear: ${error.message}`);
    },
  });
}

export function useUpdateProjectEvaluation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new ProjectEvaluationService(supabase);

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ProjectEvaluationDTO }) =>
      service.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['project-evaluation', variables.id] });
      toast.success('Proyecto actualizado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error updating project:', error);
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteProjectEvaluation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new ProjectEvaluationService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-evaluations'] });
      toast.success('Proyecto eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

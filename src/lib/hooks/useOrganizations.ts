// src/lib/hooks/useOrganizations.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { OrganizationService } from '@/src/services/organization.service';
import type { CreateOrganizationDTO } from '@/src/types';
import { toast } from 'sonner';

export function useOrganizations() {
  const supabase = useSupabase();
  const service = new OrganizationService(supabase);

  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => service.list(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useOrganization(id?: string) {
  const supabase = useSupabase();
  const service = new OrganizationService(supabase);

  return useQuery({
    queryKey: ['organization', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrganization() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new OrganizationService(supabase);

  return useMutation({
    mutationFn: (dto: CreateOrganizationDTO) => service.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organización creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear organización: ${error.message}`);
    },
  });
}

export function useUpdateOrganization(id: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new OrganizationService(supabase);

  return useMutation({
    mutationFn: (updates: Partial<CreateOrganizationDTO>) =>
      service.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organización actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteOrganization() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new OrganizationService(supabase);

  return useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organización eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

export function useOrganizationMembers(organizationId: string) {
  const supabase = useSupabase();
  const service = new OrganizationService(supabase);

  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: () => service.listMembers(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddMember(organizationId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new OrganizationService(supabase);

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: 'admin' | 'analyst' | 'viewer';
    }) => service.addMember(organizationId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', organizationId],
      });
      toast.success('Miembro agregado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useUpdateMemberRole(organizationId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new OrganizationService(supabase);

  return useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: 'admin' | 'analyst' | 'viewer';
    }) => service.updateMemberRole(organizationId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', organizationId],
      });
      toast.success('Rol actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useRemoveMember(organizationId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new OrganizationService(supabase);

  return useMutation({
    mutationFn: (memberId: string) => service.removeMember(organizationId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', organizationId],
      });
      toast.success('Miembro eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

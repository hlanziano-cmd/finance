// src/lib/hooks/useFinancialIndicators.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { FinancialIndicatorsService } from '@/src/services/financial-indicators.service';
import { toast } from 'sonner';

export function useFinancialIndicators(id?: string) {
  const supabase = useSupabase();
  const service = new FinancialIndicatorsService(supabase);

  return useQuery({
    queryKey: ['financial-indicators', id],
    queryFn: () => service.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLatestIndicators(organizationId: string) {
  const supabase = useSupabase();
  const service = new FinancialIndicatorsService(supabase);

  return useQuery({
    queryKey: ['latest-indicators', organizationId],
    queryFn: () => service.getLatest(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useIndicatorsByPeriod(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = useSupabase();
  const service = new FinancialIndicatorsService(supabase);

  return useQuery({
    queryKey: ['indicators-period', organizationId, startDate, endDate],
    queryFn: () => service.listByPeriod(organizationId, startDate, endDate),
    enabled: !!organizationId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrganizationSummary(organizationId: string) {
  const supabase = useSupabase();
  const service = new FinancialIndicatorsService(supabase);

  return useQuery({
    queryKey: ['organization-summary', organizationId],
    queryFn: () => service.getOrganizationSummary(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCalculateIndicators() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const service = new FinancialIndicatorsService(supabase);

  return useMutation({
    mutationFn: ({
      organizationId,
      balanceSheetId,
      incomeStatementId,
    }: {
      organizationId: string;
      balanceSheetId: string;
      incomeStatementId: string;
    }) => service.calculate(organizationId, balanceSheetId, incomeStatementId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['latest-indicators', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['organization-summary', variables.organizationId],
      });
      toast.success('Indicadores calculados exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al calcular indicadores: ${error.message}`);
    },
  });
}

export function useCompareIndicators(organizationId: string) {
  const supabase = useSupabase();
  const service = new FinancialIndicatorsService(supabase);

  return useMutation({
    mutationFn: (periodIds: string[]) =>
      service.comparePeroids(organizationId, periodIds),
    onError: (error: Error) => {
      toast.error(`Error al comparar períodos: ${error.message}`);
    },
  });
}

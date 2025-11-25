// src/lib/hooks/useInvestment.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { useOrganization } from './useOrganization';
import { InvestmentService } from '@/src/services/investment.service';
import type {
  InvestmentSimulation,
  InvestmentProduct,
  RiskProfile
} from '@/src/types/models';

const QUERY_KEYS = {
  simulations: (orgId: string) => ['investment-simulations', orgId],
  simulation: (id: string) => ['investment-simulation', id],
  products: ['investment-products'],
  topProducts: ['top-investment-products'],
  productsByRisk: (risk: RiskProfile) => ['investment-products', 'by-risk', risk],
};

// Fetch all investment simulations for the current organization
export function useInvestmentSimulations() {
  const supabase = useSupabase();
  const { currentOrganization } = useOrganization();
  const service = new InvestmentService(supabase);

  return useQuery({
    queryKey: QUERY_KEYS.simulations(currentOrganization?.id || ''),
    queryFn: async () => {
      const data = await service.list();
      return data.map(item => ({
        id: item.id,
        organizationId: item.organization_id,
        name: item.name,
        initialAmount: Number(item.initial_amount),
        sourceType: item.source_type as 'cashflow' | 'manual',
        cashFlowId: item.cash_flow_id,
        riskProfile: item.risk_profile as RiskProfile,
        selectedProducts: item.selected_products || [],
        diversificationStrategy: item.diversification_strategy as 'equal' | 'risk-weighted' | 'return-optimized' | undefined,
        projections: item.projections,
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        createdBy: item.created_by
      })) as InvestmentSimulation[];
    },
    enabled: !!currentOrganization?.id,
  });
}

// Fetch a single investment simulation by ID
export function useInvestmentSimulation(id: string) {
  const supabase = useSupabase();
  const service = new InvestmentService(supabase);

  return useQuery({
    queryKey: QUERY_KEYS.simulation(id),
    queryFn: async () => {
      const item = await service.getById(id);
      if (!item) return null;

      return {
        id: item.id,
        organizationId: item.organization_id,
        name: item.name,
        initialAmount: Number(item.initial_amount),
        sourceType: item.source_type as 'cashflow' | 'manual',
        cashFlowId: item.cash_flow_id,
        riskProfile: item.risk_profile as RiskProfile,
        selectedProducts: item.selected_products || [],
        diversificationStrategy: item.diversification_strategy as 'equal' | 'risk-weighted' | 'return-optimized' | undefined,
        projections: item.projections,
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        createdBy: item.created_by
      } as InvestmentSimulation;
    },
    enabled: !!id,
  });
}

// Get all available investment products
export function useInvestmentProducts() {
  const supabase = useSupabase();
  const service = new InvestmentService(supabase);

  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: () => {
      // Access private method through service instance
      return service.getProductsByRiskProfile('moderate', 100);
    },
    staleTime: 1000 * 60 * 60, // 1 hour - products don't change frequently
  });
}

// Get top 5 investment products
export function useTopInvestmentProducts(limit = 5) {
  const supabase = useSupabase();
  const service = new InvestmentService(supabase);

  return useQuery({
    queryKey: [...QUERY_KEYS.topProducts, limit],
    queryFn: () => service.getTopProducts(limit),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Get products filtered by risk profile
export function useProductsByRiskProfile(riskProfile: RiskProfile, limit = 5) {
  const supabase = useSupabase();
  const service = new InvestmentService(supabase);

  return useQuery({
    queryKey: [...QUERY_KEYS.productsByRisk(riskProfile), limit],
    queryFn: () => service.getProductsByRiskProfile(riskProfile, limit),
    enabled: !!riskProfile,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Calculate projections for a specific product and amount
export function useInvestmentProjections(amount: number, product: InvestmentProduct | null) {
  const supabase = useSupabase();
  const service = new InvestmentService(supabase);

  return useQuery({
    queryKey: ['investment-projections', amount, product?.id],
    queryFn: () => {
      if (!product) return null;
      return service.calculateProjections(amount, product);
    },
    enabled: !!product && amount > 0,
  });
}

// Create diversified portfolio allocation
export function useDiversifiedPortfolio(
  amount: number,
  riskProfile: RiskProfile,
  strategy: 'equal' | 'risk-weighted' | 'return-optimized' = 'risk-weighted'
) {
  const supabase = useSupabase();
  const service = new InvestmentService(supabase);

  return useQuery({
    queryKey: ['diversified-portfolio', amount, riskProfile, strategy],
    queryFn: () => service.createDiversifiedPortfolio(amount, riskProfile, strategy),
    enabled: amount > 0 && !!riskProfile,
  });
}

// Create new investment simulation
export function useCreateInvestmentSimulation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const service = new InvestmentService(supabase);

  return useMutation({
    mutationFn: async (simulation: Omit<InvestmentSimulation, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await service.create(simulation);
    },
    onSuccess: () => {
      if (currentOrganization?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.simulations(currentOrganization.id)
        });
      }
    },
  });
}

// Update existing investment simulation
export function useUpdateInvestmentSimulation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const service = new InvestmentService(supabase);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InvestmentSimulation> }) => {
      return await service.update(id, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.simulation(variables.id)
      });
      if (currentOrganization?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.simulations(currentOrganization.id)
        });
      }
    },
  });
}

// Delete investment simulation
export function useDeleteInvestmentSimulation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const service = new InvestmentService(supabase);

  return useMutation({
    mutationFn: async (id: string) => {
      await service.delete(id);
    },
    onSuccess: () => {
      if (currentOrganization?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.simulations(currentOrganization.id)
        });
      }
    },
  });
}

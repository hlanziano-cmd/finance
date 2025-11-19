// src/lib/hooks/useOrganization.ts

import { create } from 'zustand';
import type { Organization } from '@/src/types/models';

interface OrganizationState {
  currentOrganization: Organization | null;
  setCurrentOrganization: (organization: Organization | null) => void;
}

/**
 * Store de Zustand para manejar la organización actual
 */
const useOrganizationStore = create<OrganizationState>((set) => ({
  currentOrganization: null,
  setCurrentOrganization: (organization) => set({ currentOrganization: organization }),
}));

/**
 * Hook para obtener y manejar la organización actual
 */
export function useOrganization() {
  const { currentOrganization, setCurrentOrganization } = useOrganizationStore();

  return {
    currentOrganization,
    setCurrentOrganization,
  };
}

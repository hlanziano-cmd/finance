// src/lib/hooks/useOrganization.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '@/src/types/models';

interface OrganizationState {
  currentOrganization: Organization | null;
  setCurrentOrganization: (organization: Organization | null) => void;
}

/**
 * Store de Zustand para manejar la organización actual
 * Persiste en localStorage para mantener la selección entre recargas
 */
const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrganization: null,
      setCurrentOrganization: (organization) => {
        console.log('Setting current organization:', organization);
        set({ currentOrganization: organization });
      },
    }),
    {
      name: 'current-organization', // nombre de la key en localStorage
    }
  )
);

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

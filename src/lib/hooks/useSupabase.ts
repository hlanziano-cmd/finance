// src/lib/hooks/useSupabase.ts

import { createClient } from '@/src/lib/supabase/client';
import { useMemo } from 'react';

/**
 * Hook para obtener el cliente de Supabase
 */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}

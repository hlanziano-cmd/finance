// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página raíz del dashboard
 * Redirige automáticamente a la página de balances
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/balances');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

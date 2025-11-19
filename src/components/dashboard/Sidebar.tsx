// src/components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Building2,
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useOrganization } from '@/src/lib/hooks/useOrganization';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Balances', href: '/dashboard/balances', icon: FileText },
  { name: 'Indicadores', href: '/dashboard/indicators', icon: TrendingUp },
  { name: 'Organizaciones', href: '/dashboard/organizations', icon: Building2 },
  { name: 'Equipo', href: '/dashboard/team', icon: Users },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentOrganization } = useOrganization();

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Fluxi Finance</h1>
      </div>

      {/* Organization Selector */}
      <div className="px-4 py-4 border-b border-gray-800">
        {currentOrganization ? (
          <div className="flex items-center space-x-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold">
              {currentOrganization.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentOrganization.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {currentOrganization.subscriptionPlan}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-2">
            <p className="text-sm text-gray-400">Selecciona una organización</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        <button
          className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

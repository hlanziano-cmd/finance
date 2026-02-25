// src/components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  BarChart3,
  Coins,
  Landmark,
  ClipboardList,
  CreditCard,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navigation = [
  { name: 'Balance General', href: '/dashboard/balances', icon: FileText },
  { name: 'Estado de Resultados', href: '/dashboard/income-statement', icon: BarChart3 },
  { name: 'Flujo de Caja', href: '/dashboard/cash-flow', icon: Coins },
  { name: 'Cuentas Bancarias', href: '/dashboard/bank-accounts', icon: Landmark },
  { name: 'Deudas', href: '/dashboard/debts', icon: CreditCard },
  { name: 'Indicadores', href: '/dashboard/indicators', icon: TrendingUp },
  { name: 'Eval. Proyectos', href: '/dashboard/project-evaluation', icon: ClipboardList },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      'flex h-screen flex-col bg-gray-900 text-white transition-all duration-300 flex-shrink-0',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo + Toggle */}
      <div className="flex h-16 items-center border-b border-gray-800 px-3">
        {!collapsed && (
          <h1 className="flex-1 text-xl font-bold px-3 truncate">Fluxi Finance</h1>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors',
            collapsed && 'mx-auto'
          )}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2 py-2' : 'space-x-3 px-3 py-2',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-2">
        <button
          className={cn(
            'flex w-full items-center rounded-lg text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white',
            collapsed ? 'justify-center px-2 py-2' : 'space-x-3 px-3 py-2'
          )}
          title={collapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

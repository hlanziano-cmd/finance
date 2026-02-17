'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  CreditCard,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useDebts, useDeleteDebt } from '@/src/lib/hooks/useDebts';
import { calculateAmortization, getDebtSummary } from '@/src/services/debt.service';
import type { Debt } from '@/src/services/debt.service';
import { formatCurrency } from '@/src/lib/utils';

const PERIOD_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export default function DebtsPage() {
  const router = useRouter();
  const { data: debts, isLoading, error } = useDebts();
  const deleteDebt = useDeleteDebt();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const summaries = useMemo(() => {
    if (!debts) return {};
    const map: Record<string, ReturnType<typeof getDebtSummary>> = {};
    for (const d of debts) {
      map[d.id] = getDebtSummary(d);
    }
    return map;
  }, [debts]);

  const totals = useMemo(() => {
    if (!debts || debts.length === 0) return { totalBalance: 0, totalMonthly: 0, activeCount: 0 };
    let totalBalance = 0;
    let totalMonthly = 0;
    let activeCount = 0;

    for (const d of debts) {
      const s = summaries[d.id];
      if (s && s.remainingInstallments > 0) {
        totalBalance += s.currentBalance;
        totalMonthly += s.monthlyPayment;
        activeCount++;
      }
    }

    return {
      totalBalance: Math.round(totalBalance * 100) / 100,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      activeCount,
    };
  }, [debts, summaries]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la deuda "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      await deleteDebt.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Administración de Deudas</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Administración de Deudas</h1>
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error al cargar las deudas: {(error as Error).message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración de Deudas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Controla la amortización de tus créditos y libera flujo de caja
          </p>
        </div>
        <Link href="/dashboard/debts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Deuda
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      {debts && debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deuda Total Vigente</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cuota Mensual Total</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalMonthly)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deudas Activas</p>
                  <p className="text-xl font-bold text-gray-900">{totals.activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Debts List */}
      {!debts || debts.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tienes deudas registradas</h3>
              <p className="text-sm text-gray-500 mb-4">
                Registra tus créditos para controlar la amortización y optimizar tu flujo de caja.
              </p>
              <Link href="/dashboard/debts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primera Deuda
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {debts.map((debt) => {
            const summary = summaries[debt.id];
            const progress = debt.total_installments > 0
              ? (debt.current_installment / debt.total_installments) * 100
              : 0;

            return (
              <Card key={debt.id} variant="bordered" padding="none">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{debt.name}</h3>
                      {debt.creditor && (
                        <p className="text-sm text-gray-500">{debt.creditor}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {PERIOD_LABELS[debt.installment_period] || debt.installment_period}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{debt.current_installment} de {debt.total_installments} cuotas</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Saldo</p>
                      <p className="font-semibold text-gray-900">
                        {summary ? formatCurrency(summary.currentBalance) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Cuota</p>
                      <p className="font-semibold text-gray-900">
                        {summary ? formatCurrency(summary.monthlyPayment) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Tasa</p>
                      <p className="font-semibold text-gray-900">{debt.annual_rate}%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/debts/${debt.id}`)}
                      className="flex-1"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Ver Detalle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(debt.id, debt.name)}
                      disabled={deletingId === debt.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

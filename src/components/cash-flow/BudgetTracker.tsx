// src/components/cash-flow/BudgetTracker.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, Target, Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/src/lib/utils';
import { useCashFlow } from '@/src/lib/hooks/useCashFlow';
import { useTransactions } from '@/src/lib/hooks/useTransactions';
import { getTransactionSummaryForCashFlow } from '@/src/services/transaction.service';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const INCOME_FIELDS = [
  { dbKey: 'sales_collections', dtoKey: 'salesCollections', defaultLabel: 'Cobros de Ventas' },
  { dbKey: 'other_income',      dtoKey: 'otherIncome',      defaultLabel: 'Otros Ingresos' },
];

const EXPENSE_FIELDS = [
  { dbKey: 'supplier_payments', dtoKey: 'supplierPayments', defaultLabel: 'Pagos a Proveedores' },
  { dbKey: 'payroll',           dtoKey: 'payroll',          defaultLabel: 'Nómina' },
  { dbKey: 'rent',              dtoKey: 'rent',             defaultLabel: 'Arriendo' },
  { dbKey: 'utilities',         dtoKey: 'utilities',        defaultLabel: 'Servicios Públicos' },
  { dbKey: 'taxes',             dtoKey: 'taxes',            defaultLabel: 'Impuestos' },
  { dbKey: 'other_expenses',    dtoKey: 'otherExpenses',    defaultLabel: 'Otros Gastos' },
];

interface BudgetRow {
  key: string;
  label: string;
  budget: number;
  actual: number;
  type: 'income' | 'expense';
}

function ProgressBar({ budget, actual, type }: { budget: number; actual: number; type: 'income' | 'expense' }) {
  const pct = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0;
  const capped = Math.min(pct, 100);

  let color: string;
  if (type === 'income') {
    color = pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  } else {
    color = pct > 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-green-500';
  }

  return (
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${capped}%` }}
      />
      {pct > 100 && (
        <div className="absolute right-0 top-0 h-2 w-1.5 bg-red-600 rounded-r-full" />
      )}
    </div>
  );
}

function BudgetRowCard({ row }: { row: BudgetRow }) {
  const pct = row.budget > 0 ? (row.actual / row.budget) * 100 : row.actual > 0 ? 100 : 0;
  const isOverBudget = row.type === 'expense' && row.actual > row.budget && row.budget > 0;
  const isLowIncome  = row.type === 'income'  && pct < 50 && row.budget > 0;
  const isComplete   = pct >= 100 && !isOverBudget;

  // Variance: positive = good (income reached / expense under budget)
  const variance = row.type === 'income'
    ? row.actual - row.budget
    : row.budget - row.actual;

  let cardClass = 'border-gray-100 bg-white';
  if (isOverBudget) cardClass = 'border-red-200 bg-red-50';
  else if (isLowIncome) cardClass = 'border-yellow-200 bg-yellow-50';
  else if (isComplete)  cardClass = 'border-green-200 bg-green-50';

  return (
    <div className={`rounded-lg p-3 border ${cardClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate">{row.label}</span>
          {isOverBudget && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
          {isComplete    && <CheckCircle2  className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
        </div>
        <span className={`text-xs font-bold flex-shrink-0 ml-2 ${
          isOverBudget ? 'text-red-600' : isComplete ? 'text-green-600' : 'text-gray-500'
        }`}>
          {pct.toFixed(0)}%
        </span>
      </div>

      <ProgressBar budget={row.budget} actual={row.actual} type={row.type} />

      <div className="flex justify-between mt-2 text-xs">
        <span className="text-gray-500">
          Real:{' '}
          <span className={`font-semibold ${row.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(row.actual)}
          </span>
        </span>
        <span className="text-gray-500">
          Ppto:{' '}
          <span className="font-semibold text-gray-700">{formatCurrency(row.budget)}</span>
        </span>
        <span className={`font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
        </span>
      </div>
    </div>
  );
}

interface BudgetTrackerProps {
  cashFlowId: string;
  defaultMonth?: number;
  defaultYear?: number;
  onClose: () => void;
}

export function BudgetTracker({ cashFlowId, defaultMonth, defaultYear, onClose }: BudgetTrackerProps) {
  const { data: cashFlow, isLoading: cfLoading } = useCashFlow(cashFlowId);

  // Sort periods chronologically
  const periods = useMemo(() => {
    if (!cashFlow?.periods) return [];
    return [...cashFlow.periods].sort((a: any, b: any) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );
  }, [cashFlow]);

  // Initialize selected period to default or first period
  const [selectedIdx, setSelectedIdx] = useState(0);
  useEffect(() => {
    if (!periods.length) return;
    const m = defaultMonth ?? new Date().getMonth() + 1;
    const y = defaultYear  ?? new Date().getFullYear();
    const idx = periods.findIndex((p: any) => p.month === m && p.year === y);
    setSelectedIdx(idx >= 0 ? idx : 0);
  }, [periods, defaultMonth, defaultYear]);

  const selectedPeriod = periods[selectedIdx] as any;

  // Fetch transactions for this cash flow and selected period
  const { data: transactions = [] } = useTransactions({
    cashFlowId,
    month: selectedPeriod?.month,
    year: selectedPeriod?.year,
  });

  // Compute actuals via existing mapping function
  const actualSummary = useMemo(() => {
    if (!selectedPeriod || !transactions.length) return {} as Record<string, number>;
    return getTransactionSummaryForCashFlow(transactions, selectedPeriod.month, selectedPeriod.year) as Record<string, number>;
  }, [transactions, selectedPeriod]);

  const customLabels: Record<string, string> = (cashFlow as any)?.additional_items?.customLabels ?? {};
  const hiddenRows: string[] = (cashFlow as any)?.additional_items?.hiddenRows ?? [];
  const additionalItems = (cashFlow as any)?.additional_items ?? { incomes: [], expenses: [] };
  const colKey = selectedIdx + 1; // 1-based colKey for additionalItems amounts

  const getLabel = (dtoKey: string, defaultLabel: string) => customLabels[dtoKey] ?? defaultLabel;

  // Build income rows
  const incomeRows: BudgetRow[] = useMemo(() => {
    if (!selectedPeriod) return [];
    const rows: BudgetRow[] = INCOME_FIELDS.map(f => ({
      key: f.dtoKey,
      label: getLabel(f.dtoKey, f.defaultLabel),
      budget: selectedPeriod[f.dbKey] ?? 0,
      actual: actualSummary[f.dtoKey] ?? 0,
      type: 'income' as const,
    }));
    for (const item of additionalItems.incomes ?? []) {
      rows.push({
        key: item.id,
        label: item.name || 'Ingreso sin nombre',
        budget: item.amounts?.[colKey] ?? 0,
        actual: 0,
        type: 'income',
      });
    }
    return rows.filter(r => r.budget > 0 || r.actual > 0);
  }, [selectedPeriod, actualSummary, additionalItems, colKey, customLabels]);

  // Build expense rows
  const expenseRows: BudgetRow[] = useMemo(() => {
    if (!selectedPeriod) return [];
    const rows: BudgetRow[] = EXPENSE_FIELDS
      .filter(f => !hiddenRows.includes(f.dtoKey))
      .map(f => ({
        key: f.dtoKey,
        label: getLabel(f.dtoKey, f.defaultLabel),
        budget: selectedPeriod[f.dbKey] ?? 0,
        actual: actualSummary[f.dtoKey] ?? 0,
        type: 'expense' as const,
      }));
    for (const item of additionalItems.expenses ?? []) {
      rows.push({
        key: item.id,
        label: item.name || 'Gasto sin nombre',
        budget: item.amounts?.[colKey] ?? 0,
        actual: 0,
        type: 'expense',
      });
    }
    return rows.filter(r => r.budget > 0 || r.actual > 0);
  }, [selectedPeriod, actualSummary, additionalItems, hiddenRows, colKey, customLabels]);

  const totalBudgetIncome  = incomeRows.reduce((s, r) => s + r.budget, 0);
  const totalActualIncome  = incomeRows.reduce((s, r) => s + r.actual, 0);
  const totalBudgetExpense = expenseRows.reduce((s, r) => s + r.budget, 0);
  const totalActualExpense = expenseRows.reduce((s, r) => s + r.actual, 0);
  const budgetNet = totalBudgetIncome - totalBudgetExpense;
  const actualNet = totalActualIncome - totalActualExpense;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4 pt-6">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl mb-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Presupuesto vs Real</h2>
              <p className="text-xs text-gray-500">{(cashFlow as any)?.name ?? '...'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Period picker */}
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-2.5">
          <button
            onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
            disabled={selectedIdx === 0}
            className="rounded p-1.5 hover:bg-gray-200 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-900">
            {selectedPeriod
              ? `${MONTH_NAMES[selectedPeriod.month - 1]} ${selectedPeriod.year}`
              : 'Sin períodos'}
          </span>
          <button
            onClick={() => setSelectedIdx(i => Math.min(periods.length - 1, i + 1))}
            disabled={selectedIdx >= periods.length - 1}
            className="rounded p-1.5 hover:bg-gray-200 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {cfLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-green-50 border border-green-200 p-3">
                <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide mb-2">Ingresos</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ppto</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(totalBudgetIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Real</span>
                    <span className="font-semibold text-green-700">{formatCurrency(totalActualIncome)}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-200 pt-1">
                    <span className="text-gray-500">Var.</span>
                    <span className={`font-bold ${totalActualIncome >= totalBudgetIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {totalActualIncome >= totalBudgetIncome ? '+' : ''}{formatCurrency(totalActualIncome - totalBudgetIncome)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-2">Gastos</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ppto</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(totalBudgetExpense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Real</span>
                    <span className="font-semibold text-red-700">{formatCurrency(totalActualExpense)}</span>
                  </div>
                  <div className="flex justify-between border-t border-red-200 pt-1">
                    <span className="text-gray-500">Var.</span>
                    <span className={`font-bold ${totalActualExpense <= totalBudgetExpense ? 'text-green-600' : 'text-red-600'}`}>
                      {totalActualExpense <= totalBudgetExpense ? '-' : '+'}{formatCurrency(Math.abs(totalActualExpense - totalBudgetExpense))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Saldo Neto</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ppto</span>
                    <span className={`font-semibold ${budgetNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(budgetNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Real</span>
                    <span className={`font-semibold ${actualNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(actualNet)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1">
                    <span className="text-gray-500">Var.</span>
                    <span className={`font-bold ${actualNet >= budgetNet ? 'text-green-600' : 'text-red-600'}`}>
                      {actualNet >= budgetNet ? '+' : ''}{formatCurrency(actualNet - budgetNet)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income rows */}
            {incomeRows.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h3 className="text-xs font-bold text-green-800 uppercase tracking-widest">Ingresos</h3>
                </div>
                <div className="space-y-2">
                  {incomeRows.map(row => <BudgetRowCard key={row.key} row={row} />)}
                </div>
              </div>
            )}

            {/* Expense rows */}
            {expenseRows.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest">Gastos</h3>
                </div>
                <div className="space-y-2">
                  {expenseRows.map(row => <BudgetRowCard key={row.key} row={row} />)}
                </div>
              </div>
            )}

            {incomeRows.length === 0 && expenseRows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Target className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No hay datos de presupuesto para este período</p>
                <p className="text-xs text-gray-300 mt-1">Ingresa valores en el flujo de caja para este mes</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

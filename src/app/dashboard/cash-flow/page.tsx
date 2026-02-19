// src/app/dashboard/cash-flow/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Minus, TrendingUp, TrendingDown, Trash2,
  Download, AlertCircle, Info, X, Save, ChevronDown, ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { MonthYearPicker } from '@/src/components/ui/MonthYearPicker';
import { AddItemModal } from '@/src/components/cash-flow/AddItemModal';
import { CommentModal } from '@/src/components/cash-flow/CommentModal';
import { PaymentAlerts } from '@/src/components/cash-flow/PaymentAlerts';
import {
  useCashFlows, useCashFlow, useCreateCashFlow,
  useUpdateCashFlow, useDeleteCashFlow,
} from '@/src/lib/hooks/useCashFlow';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/src/lib/utils';
import { exportCashFlowToPDF } from '@/src/lib/utils/pdf-export';
import { useDebts } from '@/src/lib/hooks/useDebts';
import { getDebtExpensesForCashFlow } from '@/src/services/debt.service';
import type { Debt } from '@/src/services/debt.service';
import type { CashFlowPeriodDTO, AdditionalItem, AdditionalItems } from '@/src/services/cash-flow.service';

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

function getPeriodLabel(period: { month: number; year: number }) {
  return `${MONTH_NAMES[period.month - 1]} ${period.year}`;
}

function CommentIndicator({
  hasComment,
  onClick,
}: {
  hasComment: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`absolute top-0 right-0 p-0.5 rounded-bl transition-opacity ${
        hasComment
          ? 'text-blue-500 opacity-100'
          : 'text-gray-300 opacity-0 group-hover:opacity-100'
      }`}
      title={hasComment ? 'Ver comentario' : 'Agregar comentario'}
    >
      <MessageSquare className="h-3 w-3" />
    </button>
  );
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function createEmptyPeriod(month: number, year: number): CashFlowPeriodDTO {
  return {
    month, year,
    salesCollections: 0, otherIncome: 0,
    supplierPayments: 0, payroll: 0, rent: 0,
    utilities: 0, taxes: 0, otherExpenses: 0,
  };
}

// Sub-item handler props shared across row components
interface SubItemsHandlers {
  subItems: Record<string, AdditionalItem[]>;
  expandedRows: Record<string, boolean>;
  toggleRowExpand: (key: string) => void;
  addSubItem: (parentKey: string) => void;
  removeSubItem: (parentKey: string, subItemId: string) => void;
  updateSubItemName: (parentKey: string, subItemId: string, name: string) => void;
  updateSubItemAmount: (parentKey: string, subItemId: string, month: number, amount: number) => void;
  subItemDisplayValues: Record<string, string>;
  setSubItemDisplayValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  comments: Record<string, Record<number, string>>;
  openCommentModal: (itemKey: string, colKey: number, label: string, periodLabel: string) => void;
}

export default function CashFlowPage() {
  const router = useRouter();
  const { data: cashFlows, isLoading } = useCashFlows();
  const createMutation = useCreateCashFlow();
  const deleteMutation = useDeleteCashFlow();

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (cashFlows && cashFlows.length > 0 && !activeTabId && !isCreatingNew) {
      setActiveTabId(cashFlows[0].id);
    }
  }, [cashFlows, activeTabId, isCreatingNew]);

  const handleCreateNew = () => {
    setActiveTabId(null);
    setIsCreatingNew(true);
  };

  const handleCreated = (id: string) => {
    setIsCreatingNew(false);
    setActiveTabId(id);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el flujo de caja "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
      if (activeTabId === id) {
        setActiveTabId(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando flujos de caja...</p>
        </div>
      </div>
    );
  }

  const hasFlows = cashFlows && cashFlows.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flujo de Caja</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las entradas y salidas de efectivo por proyecto
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {(cashFlows || []).map((cf: any) => (
            <button
              key={cf.id}
              onClick={() => { setActiveTabId(cf.id); setIsCreatingNew(false); }}
              className={`
                flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors
                ${activeTabId === cf.id && !isCreatingNew
                  ? 'border-b-2 border-blue-600 bg-white text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }
              `}
            >
              <span>{cf.name}</span>
            </button>
          ))}

          {isCreatingNew && (
            <button className="flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 border-blue-600 bg-white px-4 py-2.5 text-sm font-medium text-blue-600">
              <Plus className="h-3.5 w-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
          )}

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            title="Crear nuevo flujo de caja"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isCreatingNew ? (
        <CashFlowEditor
          mode="create"
          onCreated={handleCreated}
          onCancel={() => {
            setIsCreatingNew(false);
            if (cashFlows && cashFlows.length > 0) {
              setActiveTabId(cashFlows[0].id);
            }
          }}
        />
      ) : activeTabId ? (
        <CashFlowEditor
          key={activeTabId}
          mode="edit"
          cashFlowId={activeTabId}
          onDelete={handleDelete}
        />
      ) : !hasFlows ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No hay flujos de caja registrados
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              Crea tu primer flujo de caja para monitorear tus entradas y salidas de efectivo
            </p>
            <Button className="mt-4" onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Flujo de Caja
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ==========================================
// CashFlowEditor Component
// ==========================================

function CashFlowEditor({
  mode,
  cashFlowId,
  onCreated,
  onCancel,
  onDelete,
}: {
  mode: 'create' | 'edit';
  cashFlowId?: string;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
  onDelete?: (id: string, name: string) => void;
}) {
  const { data: cashFlow, isLoading } = useCashFlow(mode === 'edit' ? cashFlowId : undefined);
  const createMutation = useCreateCashFlow();
  const updateMutation = useUpdateCashFlow();

  const [cashFlowName, setCashFlowName] = useState('');
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  // Dynamic periods array (each element is a column)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [periods, setPeriods] = useState<CashFlowPeriodDTO[]>(
    Array.from({ length: 12 }, (_, i) => createEmptyPeriod(i + 1, currentYear))
  );

  // Creation date pickers (only used in create mode)
  const [startDate, setStartDate] = useState({ month: currentMonth, year: currentYear });
  const [endDate, setEndDate] = useState({ month: 12, year: currentYear });

  // Comments state: { itemKey: { colKey: "comment text" } }
  const [comments, setComments] = useState<Record<string, Record<number, string>>>({});
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    itemKey: string;
    colKey: number;
    label: string;
    periodLabel: string;
  }>({ isOpen: false, itemKey: '', colKey: 0, label: '', periodLabel: '' });

  // Add item modal
  const [addItemModal, setAddItemModal] = useState<{
    isOpen: boolean;
    defaultType: 'incomes' | 'expenses';
  }>({ isOpen: false, defaultType: 'incomes' });

  // Import debt modal
  const { data: allDebts } = useDebts();
  const [showImportDebt, setShowImportDebt] = useState(false);

  const openCommentModal = (itemKey: string, colKey: number, label: string, periodLabel: string) => {
    setCommentModal({ isOpen: true, itemKey, colKey, label, periodLabel });
  };

  const handleSaveComment = (text: string) => {
    setComments(prev => {
      const itemComments = { ...(prev[commentModal.itemKey] || {}) };
      if (text) {
        itemComments[commentModal.colKey] = text;
      } else {
        delete itemComments[commentModal.colKey];
      }
      if (Object.keys(itemComments).length === 0) {
        const { [commentModal.itemKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [commentModal.itemKey]: itemComments };
    });
  };

  const handleAddItem = (type: 'incomes' | 'expenses', item: AdditionalItem) => {
    setAdditionalItems(prev => ({
      ...prev,
      [type]: [...prev[type], item],
    }));
  };

  const handleImportDebt = (debt: Debt) => {
    const periodsMeta = periods.map(p => ({ month: p.month, year: p.year }));
    const item = getDebtExpensesForCashFlow(debt, periodsMeta);
    if (item) {
      setAdditionalItems(prev => ({
        ...prev,
        expenses: [...prev.expenses, item],
      }));
    }
    setShowImportDebt(false);
  };

  // Generate periods from date range (for create mode)
  const generatePeriodsFromRange = (start: { month: number; year: number }, end: { month: number; year: number }) => {
    const result: CashFlowPeriodDTO[] = [];
    let m = start.month;
    let y = start.year;
    while (y < end.year || (y === end.year && m <= end.month)) {
      result.push(createEmptyPeriod(m, y));
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return result.length > 0 ? result : [createEmptyPeriod(start.month, start.year)];
  };

  // Update periods when date pickers change (create mode only)
  useEffect(() => {
    if (mode === 'create') {
      setPeriods(generatePeriodsFromRange(startDate, endDate));
    }
  }, [startDate, endDate, mode]);

  const DEFAULT_LABELS: Record<string, string> = {
    salesCollections: 'Cobros de Ventas',
    otherIncome: 'Otros Ingresos',
    supplierPayments: 'Pagos a Proveedores',
    payroll: 'Nómina',
    rent: 'Arriendo',
    utilities: 'Servicios Públicos',
    taxes: 'Impuestos',
    otherExpenses: 'Otros Gastos',
  };

  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const getLabel = (field: string) => customLabels[field] || DEFAULT_LABELS[field] || field;
  const updateLabel = (field: string, label: string) => {
    setCustomLabels(prev => ({ ...prev, [field]: label }));
  };

  const [additionalItems, setAdditionalItems] = useState<AdditionalItems>({
    incomes: [],
    expenses: [],
  });
  const [additionalDisplayValues, setAdditionalDisplayValues] = useState<Record<string, string>>({});

  // Sub-items state
  const [subItems, setSubItems] = useState<Record<string, AdditionalItem[]>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [subItemDisplayValues, setSubItemDisplayValues] = useState<Record<string, string>>({});

  // Pre-populate form when editing
  useEffect(() => {
    if (cashFlow && mode === 'edit') {
      setCashFlowName(cashFlow.name);

      if (cashFlow.periods && cashFlow.periods.length > 0) {
        // Sort periods by year/month and map to DTO format
        const sorted = [...cashFlow.periods].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
        setPeriods(sorted.map(period => ({
          month: period.month,
          year: period.year,
          salesCollections: period.sales_collections || 0,
          otherIncome: period.other_income || 0,
          supplierPayments: period.supplier_payments || 0,
          payroll: period.payroll || 0,
          rent: period.rent || 0,
          utilities: period.utilities || 0,
          taxes: period.taxes || 0,
          otherExpenses: period.other_expenses || 0,
        })));
      }

      if (cashFlow.additional_items) {
        setAdditionalItems(cashFlow.additional_items);
        if (cashFlow.additional_items.customLabels) {
          setCustomLabels(cashFlow.additional_items.customLabels);
        }
        if (cashFlow.additional_items.subItems) {
          setSubItems(cashFlow.additional_items.subItems);
        }
        if (cashFlow.additional_items.comments) {
          setComments(cashFlow.additional_items.comments);
        }
      }
    }
  }, [cashFlow, mode]);

  // Column management
  const addColumn = () => {
    const last = periods[periods.length - 1];
    let nextMonth = last ? last.month + 1 : 1;
    let nextYear = last ? last.year : currentYear;
    if (nextMonth > 12) { nextMonth = 1; nextYear++; }
    setPeriods(prev => [...prev, createEmptyPeriod(nextMonth, nextYear)]);
  };

  const removeColumn = () => {
    if (periods.length <= 1) return;
    if (!confirm('¿Eliminar la última columna? Se perderán los datos de ese periodo.')) return;
    const lastIdx = periods.length;
    setPeriods(prev => prev.slice(0, -1));
    // Clean up amounts for removed column index
    const colKey = lastIdx; // 1-based
    setAdditionalItems(prev => ({
      ...prev,
      incomes: prev.incomes.map(item => {
        const { [colKey]: _, ...rest } = item.amounts;
        return { ...item, amounts: rest };
      }),
      expenses: prev.expenses.map(item => {
        const { [colKey]: _, ...rest } = item.amounts;
        return { ...item, amounts: rest };
      }),
    }));
  };

  const updateColumnMonth = (colIdx: number, month: number) => {
    setPeriods(prev => prev.map((p, i) => i === colIdx ? { ...p, month } : p));
  };

  const updateColumnYear = (colIdx: number, year: number) => {
    setPeriods(prev => prev.map((p, i) => i === colIdx ? { ...p, year } : p));
  };

  const handleValueChange = (colIdx: number, field: keyof CashFlowPeriodDTO, value: number) => {
    setPeriods(prev => prev.map((p, i) => i === colIdx ? { ...p, [field]: value } : p));
  };

  // Additional items handlers
  const addAdditionalIncome = () => {
    setAdditionalItems(prev => ({
      ...prev,
      incomes: [...prev.incomes, { id: generateId(), name: '', amounts: {} }],
    }));
  };

  const addAdditionalExpense = () => {
    setAdditionalItems(prev => ({
      ...prev,
      expenses: [...prev.expenses, { id: generateId(), name: '', amounts: {} }],
    }));
  };

  const removeAdditionalItem = (type: 'incomes' | 'expenses', id: string) => {
    setAdditionalItems(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id),
    }));
    setSubItems(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateAdditionalItemName = (type: 'incomes' | 'expenses', id: string, name: string) => {
    setAdditionalItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => item.id === id ? { ...item, name } : item),
    }));
  };

  const updateAdditionalItemAmount = (type: 'incomes' | 'expenses', id: string, colKey: number, amount: number) => {
    setAdditionalItems(prev => ({
      ...prev,
      [type]: prev[type].map(item =>
        item.id === id ? { ...item, amounts: { ...item.amounts, [colKey]: amount } } : item
      ),
    }));
  };

  // Sub-item handlers
  const toggleRowExpand = (key: string) => {
    setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addSubItem = (parentKey: string) => {
    setSubItems(prev => ({
      ...prev,
      [parentKey]: [...(prev[parentKey] || []), { id: generateId(), name: '', amounts: {} }],
    }));
    setExpandedRows(prev => ({ ...prev, [parentKey]: true }));
  };

  const removeSubItem = (parentKey: string, subItemId: string) => {
    setSubItems(prev => {
      const updated = (prev[parentKey] || []).filter(item => item.id !== subItemId);
      if (updated.length === 0) {
        const { [parentKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [parentKey]: updated };
    });
  };

  const updateSubItemName = (parentKey: string, subItemId: string, name: string) => {
    setSubItems(prev => ({
      ...prev,
      [parentKey]: (prev[parentKey] || []).map(item =>
        item.id === subItemId ? { ...item, name } : item
      ),
    }));
  };

  const updateSubItemAmount = (parentKey: string, subItemId: string, colKey: number, amount: number) => {
    setSubItems(prev => ({
      ...prev,
      [parentKey]: (prev[parentKey] || []).map(item =>
        item.id === subItemId ? { ...item, amounts: { ...item.amounts, [colKey]: amount } } : item
      ),
    }));
  };

  const subProps: SubItemsHandlers = {
    subItems, expandedRows, toggleRowExpand, addSubItem,
    removeSubItem, updateSubItemName, updateSubItemAmount,
    subItemDisplayValues, setSubItemDisplayValues,
    comments, openCommentModal,
  };

  // Calculate totals for a column (by index)
  const calculateColumnTotals = useCallback((colIdx: number) => {
    const period = periods[colIdx];
    if (!period) return { totalInflows: 0, totalOutflows: 0, netCashFlow: 0 };

    const colKey = colIdx + 1; // 1-based key for amounts

    const getEffective = (key: string, fallback: number) => {
      const items = subItems[key];
      if (items && items.length > 0) {
        return items.reduce((s, item) => s + (item.amounts[colKey] || 0), 0);
      }
      return fallback;
    };

    const additionalIncome = additionalItems.incomes.reduce(
      (sum, item) => sum + getEffective(item.id, item.amounts[colKey] || 0), 0
    );
    const additionalExpense = additionalItems.expenses.reduce(
      (sum, item) => sum + getEffective(item.id, item.amounts[colKey] || 0), 0
    );

    const totalInflows =
      getEffective('salesCollections', period.salesCollections) +
      getEffective('otherIncome', period.otherIncome) +
      additionalIncome;

    const totalOutflows =
      getEffective('supplierPayments', period.supplierPayments) +
      getEffective('payroll', period.payroll) +
      getEffective('rent', period.rent) +
      getEffective('utilities', period.utilities) +
      getEffective('taxes', period.taxes) +
      getEffective('otherExpenses', period.otherExpenses) +
      additionalExpense;

    const netCashFlow = totalInflows - totalOutflows;
    return { totalInflows, totalOutflows, netCashFlow };
  }, [periods, additionalItems, subItems]);

  const calculateGrandTotals = useCallback(() => {
    let totalInflows = 0;
    let totalOutflows = 0;
    for (let i = 0; i < periods.length; i++) {
      const t = calculateColumnTotals(i);
      totalInflows += t.totalInflows;
      totalOutflows += t.totalOutflows;
    }
    return { totalInflows, totalOutflows, netCashFlow: totalInflows - totalOutflows };
  }, [calculateColumnTotals, periods.length]);

  const grandTotals = calculateGrandTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashFlowName) {
      alert('Por favor ingresa un nombre para el flujo de caja');
      return;
    }

    // Sync period values with sub-item sums
    const staticFields: (keyof CashFlowPeriodDTO)[] = [
      'salesCollections', 'otherIncome', 'supplierPayments',
      'payroll', 'rent', 'utilities', 'taxes', 'otherExpenses',
    ];

    const syncedPeriods = periods.map((period, colIdx) => {
      const colKey = colIdx + 1;
      const updated = { ...period };
      for (const field of staticFields) {
        const items = subItems[field];
        if (items && items.length > 0) {
          (updated as any)[field] = items.reduce((s, item) => s + (item.amounts[colKey] || 0), 0);
        }
      }
      return updated;
    });

    // Sync additional items with sub-item sums
    const syncedAdditionalItems: AdditionalItems = {
      incomes: additionalItems.incomes.map(item => {
        const items = subItems[item.id];
        if (items && items.length > 0) {
          const amounts: Record<number, number> = {};
          for (let i = 0; i < periods.length; i++) {
            amounts[i + 1] = items.reduce((s, si) => s + (si.amounts[i + 1] || 0), 0);
          }
          return { ...item, amounts };
        }
        return item;
      }),
      expenses: additionalItems.expenses.map(item => {
        const items = subItems[item.id];
        if (items && items.length > 0) {
          const amounts: Record<number, number> = {};
          for (let i = 0; i < periods.length; i++) {
            amounts[i + 1] = items.reduce((s, si) => s + (si.amounts[i + 1] || 0), 0);
          }
          return { ...item, amounts };
        }
        return item;
      }),
      customLabels,
      subItems,
      comments,
    };

    const dto = {
      name: cashFlowName,
      periods: syncedPeriods,
      additionalItems: syncedAdditionalItems,
    };

    try {
      if (mode === 'create') {
        const result = await createMutation.mutateAsync(dto);
        onCreated?.(result.id);
      } else if (cashFlowId) {
        await updateMutation.mutateAsync({ id: cashFlowId, dto });
      }
    } catch (error) {
      console.error('Error al guardar flujo de caja:', error);
    }
  };

  const handleExportPDF = () => {
    if (cashFlow) {
      exportCashFlowToPDF(cashFlow);
    }
  };

  if (mode === 'edit' && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const colCount = periods.length;

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* General Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre del Proyecto <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={cashFlowName}
                onChange={(e) => setCashFlowName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Proyecto Principal 2025"
              />
            </div>
            <div className="flex items-end gap-2">
              <MonthYearPicker
                label="Desde"
                value={mode === 'create' ? startDate : { month: periods[0]?.month || 1, year: periods[0]?.year || currentYear }}
                onChange={(month, year) => {
                  if (mode === 'create') {
                    setStartDate({ month, year });
                  } else {
                    updateColumnMonth(0, month);
                    updateColumnYear(0, year);
                  }
                }}
              />
              <span className="text-gray-400 text-sm pb-2">—</span>
              <MonthYearPicker
                label="Hasta"
                value={mode === 'create' ? endDate : { month: periods[periods.length - 1]?.month || 12, year: periods[periods.length - 1]?.year || currentYear }}
                onChange={(month, year) => {
                  if (mode === 'create') {
                    setEndDate({ month, year });
                  } else {
                    const lastIdx = periods.length - 1;
                    updateColumnMonth(lastIdx, month);
                    updateColumnYear(lastIdx, year);
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Alerts */}
      <PaymentAlerts
        items={[...additionalItems.incomes, ...additionalItems.expenses]}
        periods={periods.map(p => ({ month: p.month, year: p.year }))}
      />

      {/* Cash Flow Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Flujo de Caja Mensual</CardTitle>
              <CardDescription>Valores en pesos colombianos (COP) — {colCount} {colCount === 1 ? 'periodo' : 'periodos'}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="sm" onClick={addColumn} title="Agregar columna">
                <Plus className="h-4 w-4 mr-1" />
                Periodo
              </Button>
              {periods.length > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={removeColumn} title="Quitar última columna"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[65vh] border border-gray-200 rounded-lg scrollbar-thin">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-30">
                {/* Month/Year selector row */}
                <tr className="bg-gray-100">
                  <th className="sticky left-0 z-40 bg-gray-200 border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 min-w-[220px]">
                    Concepto
                  </th>
                  {periods.map((period, idx) => (
                    <th key={idx} className="border border-gray-300 px-1 py-1 text-center min-w-[110px] bg-gray-100">
                      <MonthYearPicker
                        compact
                        value={{ month: period.month, year: period.year }}
                        onChange={(month, year) => {
                          updateColumnMonth(idx, month);
                          updateColumnYear(idx, year);
                        }}
                      />
                    </th>
                  ))}
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-900 bg-gray-200 min-w-[120px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ENTRADAS DE EFECTIVO */}
                <tr className="bg-green-50">
                  <td colSpan={colCount + 2} className="border border-gray-300 px-3 py-2 font-bold text-green-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      ENTRADAS DE EFECTIVO
                    </div>
                  </td>
                </tr>

                <CashFlowRow
                  label={getLabel('salesCollections')} field="salesCollections"
                  periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('salesCollections', name)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues}
                  {...subProps}
                />
                <CashFlowRow
                  label={getLabel('otherIncome')} field="otherIncome"
                  periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('otherIncome', name)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues}
                  {...subProps}
                />

                {additionalItems.incomes.map((item) => (
                  <DynamicCashFlowRow
                    key={item.id} item={item} type="incomes"
                    periods={periods}
                    onNameChange={(name) => updateAdditionalItemName('incomes', item.id, name)}
                    onAmountChange={(colKey, amount) => updateAdditionalItemAmount('incomes', item.id, colKey, amount)}
                    onRemove={() => removeAdditionalItem('incomes', item.id)}
                    displayValues={additionalDisplayValues} setDisplayValues={setAdditionalDisplayValues}
                    {...subProps}
                  />
                ))}

                <tr>
                  <td colSpan={colCount + 2} className="border border-gray-300 px-3 py-1">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={addAdditionalIncome}
                        className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 transition-colors py-1">
                        <Plus className="h-3.5 w-3.5" />
                        Ingreso Rápido
                      </button>
                      <button type="button"
                        onClick={() => setAddItemModal({ isOpen: true, defaultType: 'incomes' })}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors py-1">
                        <Plus className="h-3.5 w-3.5" />
                        Ingreso Recurrente
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Total Entradas */}
                <tr className="bg-green-100 font-semibold">
                  <td className="sticky left-0 z-10 bg-green-100 border border-gray-300 px-3 py-2 text-green-800">
                    Total Entradas
                  </td>
                  {periods.map((_, idx) => (
                    <td key={idx} className="border border-gray-300 px-2 py-2 text-right text-green-800 font-semibold">
                      {formatCurrency(calculateColumnTotals(idx).totalInflows)}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-right bg-green-200 font-bold text-green-800">
                    {formatCurrency(grandTotals.totalInflows)}
                  </td>
                </tr>

                {/* SALIDAS DE EFECTIVO */}
                <tr className="bg-red-50">
                  <td colSpan={colCount + 2} className="border border-gray-300 px-3 py-2 font-bold text-red-800">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      SALIDAS DE EFECTIVO
                    </div>
                  </td>
                </tr>

                <CashFlowRow label={getLabel('supplierPayments')} field="supplierPayments" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('supplierPayments', name)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} {...subProps} />
                <CashFlowRow label={getLabel('payroll')} field="payroll" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('payroll', name)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} {...subProps} />
                <CashFlowRow label={getLabel('rent')} field="rent" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('rent', name)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} {...subProps} />
                <CashFlowRow label={getLabel('utilities')} field="utilities" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('utilities', name)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} {...subProps} />
                <CashFlowRow label={getLabel('taxes')} field="taxes" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('taxes', name)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} {...subProps} />
                <CashFlowRow label={getLabel('otherExpenses')} field="otherExpenses" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('otherExpenses', name)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} {...subProps} />

                {additionalItems.expenses.map((item) => (
                  <DynamicCashFlowRow
                    key={item.id} item={item} type="expenses"
                    periods={periods}
                    onNameChange={(name) => updateAdditionalItemName('expenses', item.id, name)}
                    onAmountChange={(colKey, amount) => updateAdditionalItemAmount('expenses', item.id, colKey, amount)}
                    onRemove={() => removeAdditionalItem('expenses', item.id)}
                    displayValues={additionalDisplayValues} setDisplayValues={setAdditionalDisplayValues}
                    {...subProps}
                  />
                ))}

                <tr>
                  <td colSpan={colCount + 2} className="border border-gray-300 px-3 py-1">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={addAdditionalExpense}
                        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors py-1">
                        <Plus className="h-3.5 w-3.5" />
                        Gasto Rápido
                      </button>
                      <button type="button"
                        onClick={() => setAddItemModal({ isOpen: true, defaultType: 'expenses' })}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors py-1">
                        <Plus className="h-3.5 w-3.5" />
                        Gasto Recurrente
                      </button>
                      {allDebts && allDebts.length > 0 && (
                        <button type="button"
                          onClick={() => setShowImportDebt(true)}
                          className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors py-1">
                          <Plus className="h-3.5 w-3.5" />
                          Importar Deuda
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Total Salidas */}
                <tr className="bg-red-100 font-semibold">
                  <td className="sticky left-0 z-10 bg-red-100 border border-gray-300 px-3 py-2 text-red-800">
                    Total Salidas
                  </td>
                  {periods.map((_, idx) => (
                    <td key={idx} className="border border-gray-300 px-2 py-2 text-right text-red-800 font-semibold">
                      {formatCurrency(calculateColumnTotals(idx).totalOutflows)}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-right bg-red-200 font-bold text-red-800">
                    {formatCurrency(grandTotals.totalOutflows)}
                  </td>
                </tr>

                {/* FLUJO NETO */}
                <tr className="bg-blue-100 font-bold">
                  <td className={`sticky left-0 z-10 bg-blue-100 border border-gray-300 px-3 py-2 ${grandTotals.netCashFlow < 0 ? 'text-red-800' : 'text-green-800'}`}>
                    FLUJO NETO
                  </td>
                  {periods.map((_, idx) => {
                    const totals = calculateColumnTotals(idx);
                    return (
                      <td key={idx} className={`border border-gray-300 px-2 py-2 text-right font-bold ${totals.netCashFlow < 0 ? 'text-red-800' : 'text-green-800'}`}>
                        {formatCurrency(totals.netCashFlow)}
                      </td>
                    );
                  })}
                  <td className={`border border-gray-300 px-3 py-2 text-right bg-blue-200 font-bold ${grandTotals.netCashFlow < 0 ? 'text-red-800' : 'text-green-800'}`}>
                    {formatCurrency(grandTotals.netCashFlow)}
                  </td>
                </tr>

              </tbody>
              <tfoot>
                {/* SALDO ACUMULADO */}
                <tr className="bg-yellow-100 font-bold">
                  <td className="sticky left-0 z-10 bg-yellow-100 border border-gray-300 px-3 py-2 text-yellow-800">
                    SALDO ACUMULADO
                  </td>
                  {periods.map((_, idx) => {
                    let accumulated = 0;
                    for (let i = 0; i <= idx; i++) {
                      accumulated += calculateColumnTotals(i).netCashFlow;
                    }
                    return (
                      <td key={idx} className={`border border-gray-300 px-2 py-2 text-right font-bold ${accumulated < 0 ? 'text-red-800' : 'text-green-800'}`}>
                        {formatCurrency(accumulated)}
                      </td>
                    );
                  })}
                  {(() => {
                    let finalAccumulated = 0;
                    for (let i = 0; i < periods.length; i++) {
                      finalAccumulated += calculateColumnTotals(i).netCashFlow;
                    }
                    return (
                      <td className={`border border-gray-300 px-3 py-2 text-right bg-yellow-200 font-bold ${finalAccumulated < 0 ? 'text-red-800' : 'text-green-800'}`}>
                        {formatCurrency(finalAccumulated)}
                      </td>
                    );
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>

          {grandTotals.totalInflows > 0 && (
            <CashFlowAnalysis grandTotals={grandTotals} calculateColumnTotals={calculateColumnTotals} columnCount={periods.length} />
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {mode === 'edit' && cashFlowId && (
            <>
              <Button type="button" variant="outline" onClick={handleExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
              <Button type="button" variant="outline"
                onClick={() => onDelete?.(cashFlowId, cashFlowName)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </>
          )}
          {mode === 'create' && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
        <Button type="submit" disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear Flujo de Caja' : 'Guardar Cambios'}
        </Button>
      </div>

    </form>

      {/* Modals — outside form to avoid nested form issues */}
      <AddItemModal
        isOpen={addItemModal.isOpen}
        onClose={() => setAddItemModal(prev => ({ ...prev, isOpen: false }))}
        onAdd={handleAddItem}
        periods={periods.map(p => ({ month: p.month, year: p.year }))}
        defaultType={addItemModal.defaultType}
      />

      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={() => setCommentModal(prev => ({ ...prev, isOpen: false }))}
        comment={comments[commentModal.itemKey]?.[commentModal.colKey] || ''}
        onSave={handleSaveComment}
        cellLabel={commentModal.label}
        periodLabel={commentModal.periodLabel}
      />

      {/* Import Debt Modal */}
      {showImportDebt && allDebts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowImportDebt(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Importar Deuda al Flujo</h3>
              <button type="button" onClick={() => setShowImportDebt(false)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-2 max-h-80 overflow-auto">
              {allDebts.filter(d => d.current_installment < d.total_installments).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay deudas activas para importar.</p>
              ) : (
                allDebts
                  .filter(d => d.current_installment < d.total_installments)
                  .map(debt => (
                    <button
                      key={debt.id}
                      type="button"
                      onClick={() => handleImportDebt(debt)}
                      className="w-full text-left rounded-lg border border-gray-200 p-3 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{debt.name}</p>
                          {debt.creditor && <p className="text-xs text-gray-500">{debt.creditor}</p>}
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                          {formatCurrency(debt.original_amount)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {debt.current_installment}/{debt.total_installments} cuotas — {debt.annual_rate}% anual
                      </p>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// CashFlowRow Component (static rows with sub-items)
// ==========================================

function CashFlowRow({
  label, field, periods, onChange, onLabelChange, displayValues, setDisplayValues,
  subItems, expandedRows, toggleRowExpand, addSubItem, removeSubItem,
  updateSubItemName, updateSubItemAmount, subItemDisplayValues, setSubItemDisplayValues,
  comments, openCommentModal,
}: {
  label: string;
  field: keyof CashFlowPeriodDTO;
  periods: CashFlowPeriodDTO[];
  onChange: (colIdx: number, field: keyof CashFlowPeriodDTO, value: number) => void;
  onLabelChange?: (name: string) => void;
  displayValues: Record<string, string>;
  setDisplayValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
} & SubItemsHandlers) {
  const mySubItems = subItems[field] || [];
  const isExpanded = expandedRows[field] || false;
  const hasChildren = mySubItems.length > 0;

  // Calculate year total
  const yearTotal = hasChildren
    ? periods.reduce((sum, _, idx) => {
        const colKey = idx + 1;
        return sum + mySubItems.reduce((s, item) => s + (item.amounts[colKey] || 0), 0);
      }, 0)
    : periods.reduce((sum, p) => sum + ((p[field] as number) || 0), 0);

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="sticky left-0 z-10 bg-gray-50 hover:bg-gray-100 border border-gray-300 px-1 py-1">
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => toggleRowExpand(field)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200" title={isExpanded ? 'Colapsar' : 'Expandir'}>
              {isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            </button>
            <input type="text" value={label} onChange={(e) => onLabelChange?.(e.target.value)}
              className={`w-full px-1 py-1 text-sm text-gray-700 border-0 focus:ring-1 focus:ring-blue-500 rounded ${hasChildren ? 'font-semibold' : 'font-medium'}`} />
            {hasChildren && (
              <span className="flex-shrink-0 text-[10px] bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5 font-medium">{mySubItems.length}</span>
            )}
            <button type="button" onClick={() => addSubItem(field)}
              className="flex-shrink-0 p-0.5 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-50" title="Agregar sub-rubro">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
        {periods.map((period, idx) => {
          const colKey = idx + 1;
          const hasComment = !!(comments[field]?.[colKey]);
          if (hasChildren) {
            const monthSum = mySubItems.reduce((s, item) => s + (item.amounts[colKey] || 0), 0);
            return (
              <td key={idx} className="border border-gray-300 px-2 py-2 text-right text-sm font-semibold text-gray-700 bg-blue-50/40 relative group">
                {monthSum > 0 ? formatCurrency(monthSum) : '$0'}
                <CommentIndicator hasComment={hasComment} onClick={() => openCommentModal(field, colKey, label, getPeriodLabel(period))} />
              </td>
            );
          }
          const inputKey = `${idx}-${field}`;
          const currentValue = (period[field] as number) || 0;
          return (
            <td key={idx} className="border border-gray-300 px-1 py-1 relative group">
              <input type="text"
                value={displayValues[inputKey] ?? (currentValue > 0 ? formatNumberInput(currentValue) : '')}
                onChange={(e) => {
                  setDisplayValues(prev => ({ ...prev, [inputKey]: e.target.value }));
                  onChange(idx, field, parseNumberInput(e.target.value));
                }}
                onBlur={(e) => {
                  const numericValue = parseNumberInput(e.target.value);
                  setDisplayValues(prev => ({ ...prev, [inputKey]: numericValue > 0 ? formatNumberInput(numericValue) : '' }));
                }}
                className="w-full text-right px-2 py-1 text-sm text-gray-900 border-0 focus:ring-1 focus:ring-blue-500 rounded"
                placeholder="0" />
              <CommentIndicator hasComment={hasComment} onClick={() => openCommentModal(field, colKey, label, getPeriodLabel(period))} />
            </td>
          );
        })}
        <td className="border border-gray-300 px-3 py-2 text-right bg-gray-100 font-semibold text-gray-900">
          {formatCurrency(yearTotal)}
        </td>
      </tr>
      {isExpanded && mySubItems.map(subItem => (
        <SubItemRow key={subItem.id} item={subItem} parentKey={field} periods={periods}
          onNameChange={(name) => updateSubItemName(field, subItem.id, name)}
          onAmountChange={(colKey, amount) => updateSubItemAmount(field, subItem.id, colKey, amount)}
          onRemove={() => removeSubItem(field, subItem.id)}
          displayValues={subItemDisplayValues} setDisplayValues={setSubItemDisplayValues}
          comments={comments} openCommentModal={openCommentModal} />
      ))}
    </>
  );
}

// ==========================================
// SubItemRow Component
// ==========================================

function SubItemRow({
  item, parentKey, periods, onNameChange, onAmountChange, onRemove, displayValues, setDisplayValues,
  comments, openCommentModal,
}: {
  item: AdditionalItem;
  parentKey: string;
  periods: CashFlowPeriodDTO[];
  onNameChange: (name: string) => void;
  onAmountChange: (colKey: number, amount: number) => void;
  onRemove: () => void;
  displayValues: Record<string, string>;
  setDisplayValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  comments: Record<string, Record<number, string>>;
  openCommentModal: (itemKey: string, colKey: number, label: string, periodLabel: string) => void;
}) {
  const yearTotal = periods.reduce((sum, _, idx) => sum + (item.amounts[idx + 1] || 0), 0);

  return (
    <tr className="hover:bg-blue-50/60 bg-blue-50/30">
      <td className="sticky left-0 z-10 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-1 py-1">
        <div className="flex items-center gap-1 pl-5">
          <span className="text-gray-300 text-xs mr-0.5">└</span>
          <button type="button" onClick={onRemove}
            className="flex-shrink-0 p-0.5 rounded text-red-300 hover:text-red-500 hover:bg-red-50" title="Eliminar sub-rubro">
            <X className="h-3 w-3" />
          </button>
          <input type="text" value={item.name} onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-1 py-0.5 text-xs font-medium text-gray-600 bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded placeholder-gray-400"
            placeholder="Nombre del sub-rubro..." />
        </div>
      </td>
      {periods.map((period, idx) => {
        const colKey = idx + 1;
        const inputKey = `sub-${item.id}-${colKey}`;
        const currentValue = item.amounts[colKey] || 0;
        const hasComment = !!(comments[item.id]?.[colKey]);
        return (
          <td key={idx} className="border border-gray-300 px-1 py-0.5 bg-blue-50/30 relative group">
            <input type="text"
              value={displayValues[inputKey] ?? (currentValue > 0 ? formatNumberInput(currentValue) : '')}
              onChange={(e) => {
                setDisplayValues(prev => ({ ...prev, [inputKey]: e.target.value }));
                onAmountChange(colKey, parseNumberInput(e.target.value));
              }}
              onBlur={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setDisplayValues(prev => ({ ...prev, [inputKey]: numericValue > 0 ? formatNumberInput(numericValue) : '' }));
              }}
              className="w-full text-right px-1 py-0.5 text-xs text-gray-700 bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded"
              placeholder="0" />
            <CommentIndicator hasComment={hasComment} onClick={() => openCommentModal(item.id, colKey, item.name || 'Sub-rubro', getPeriodLabel(period))} />
          </td>
        );
      })}
      <td className="border border-gray-300 px-2 py-1 text-right bg-blue-50/50 font-medium text-xs text-gray-600">
        {formatCurrency(yearTotal)}
      </td>
    </tr>
  );
}

// ==========================================
// DynamicCashFlowRow Component (additional items with sub-items)
// ==========================================

function DynamicCashFlowRow({
  item, type, periods, onNameChange, onAmountChange, onRemove, displayValues, setDisplayValues,
  subItems, expandedRows, toggleRowExpand, addSubItem, removeSubItem,
  updateSubItemName, updateSubItemAmount, subItemDisplayValues, setSubItemDisplayValues,
  comments, openCommentModal,
}: {
  item: AdditionalItem;
  type: 'incomes' | 'expenses';
  periods: CashFlowPeriodDTO[];
  onNameChange: (name: string) => void;
  onAmountChange: (colKey: number, amount: number) => void;
  onRemove: () => void;
  displayValues: Record<string, string>;
  setDisplayValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
} & SubItemsHandlers) {
  const mySubItems = subItems[item.id] || [];
  const isExpanded = expandedRows[item.id] || false;
  const hasChildren = mySubItems.length > 0;
  const color = type === 'incomes' ? 'green' : 'red';

  const effectiveYearTotal = hasChildren
    ? periods.reduce((sum, _, idx) => {
        const colKey = idx + 1;
        return sum + mySubItems.reduce((s, si) => s + (si.amounts[colKey] || 0), 0);
      }, 0)
    : periods.reduce((sum, _, idx) => sum + (item.amounts[idx + 1] || 0), 0);

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="sticky left-0 z-10 bg-gray-50 hover:bg-gray-100 border border-gray-300 px-1 py-1">
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => toggleRowExpand(item.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200" title={isExpanded ? 'Colapsar' : 'Expandir'}>
              {isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            </button>
            <button type="button" onClick={onRemove}
              className={`flex-shrink-0 p-0.5 rounded text-${color}-400 hover:text-${color}-600 hover:bg-${color}-50`} title="Eliminar">
              <X className="h-3.5 w-3.5" />
            </button>
            <input type="text" value={item.name} onChange={(e) => onNameChange(e.target.value)}
              className={`w-full px-1 py-1 text-sm text-gray-700 border-0 focus:ring-1 focus:ring-${color}-500 rounded placeholder-gray-400 ${hasChildren ? 'font-semibold' : 'font-medium'}`}
              placeholder={type === 'incomes' ? 'Nombre del ingreso...' : 'Nombre del gasto...'} />
            {hasChildren && (
              <span className="flex-shrink-0 text-[10px] bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5 font-medium">{mySubItems.length}</span>
            )}
            <button type="button" onClick={() => addSubItem(item.id)}
              className="flex-shrink-0 p-0.5 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-50" title="Agregar sub-rubro">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
        {periods.map((period, idx) => {
          const colKey = idx + 1;
          const hasComment = !!(comments[item.id]?.[colKey]);
          if (hasChildren) {
            const monthSum = mySubItems.reduce((s, si) => s + (si.amounts[colKey] || 0), 0);
            return (
              <td key={idx} className="border border-gray-300 px-2 py-2 text-right text-sm font-semibold text-gray-700 bg-blue-50/40 relative group">
                {monthSum > 0 ? formatCurrency(monthSum) : '$0'}
                <CommentIndicator hasComment={hasComment} onClick={() => openCommentModal(item.id, colKey, item.name || 'Rubro', getPeriodLabel(period))} />
              </td>
            );
          }
          const inputKey = `${item.id}-${colKey}`;
          const currentValue = item.amounts[colKey] || 0;
          return (
            <td key={idx} className="border border-gray-300 px-1 py-1 relative group">
              <input type="text"
                value={displayValues[inputKey] ?? (currentValue > 0 ? formatNumberInput(currentValue) : '')}
                onChange={(e) => {
                  setDisplayValues(prev => ({ ...prev, [inputKey]: e.target.value }));
                  onAmountChange(colKey, parseNumberInput(e.target.value));
                }}
                onBlur={(e) => {
                  const numericValue = parseNumberInput(e.target.value);
                  setDisplayValues(prev => ({ ...prev, [inputKey]: numericValue > 0 ? formatNumberInput(numericValue) : '' }));
                }}
                className="w-full text-right px-2 py-1 text-sm text-gray-900 border-0 focus:ring-1 focus:ring-blue-500 rounded"
                placeholder="0" />
              <CommentIndicator hasComment={hasComment} onClick={() => openCommentModal(item.id, colKey, item.name || 'Rubro', getPeriodLabel(period))} />
            </td>
          );
        })}
        <td className="border border-gray-300 px-3 py-2 text-right bg-gray-100 font-semibold text-gray-900">
          {formatCurrency(effectiveYearTotal)}
        </td>
      </tr>
      {isExpanded && mySubItems.map(subItem => (
        <SubItemRow key={subItem.id} item={subItem} parentKey={item.id} periods={periods}
          onNameChange={(name) => updateSubItemName(item.id, subItem.id, name)}
          onAmountChange={(colKey, amount) => updateSubItemAmount(item.id, subItem.id, colKey, amount)}
          onRemove={() => removeSubItem(item.id, subItem.id)}
          displayValues={subItemDisplayValues} setDisplayValues={setSubItemDisplayValues}
          comments={comments} openCommentModal={openCommentModal} />
      ))}
    </>
  );
}

// ==========================================
// CashFlowAnalysis Component
// ==========================================

function CashFlowAnalysis({
  grandTotals,
  calculateColumnTotals,
  columnCount,
}: {
  grandTotals: { totalInflows: number; totalOutflows: number; netCashFlow: number };
  calculateColumnTotals: (colIdx: number) => { totalInflows: number; totalOutflows: number; netCashFlow: number };
  columnCount: number;
}) {
  const columnAnalysis = Array.from({ length: columnCount }, (_, i) => ({
    col: i,
    ...calculateColumnTotals(i),
  }));
  const positiveColumns = columnAnalysis.filter(c => c.netCashFlow > 0).length;
  const negativeColumns = columnAnalysis.filter(c => c.netCashFlow < 0).length;
  const avgFlow = columnCount > 0 ? grandTotals.netCashFlow / columnCount : 0;

  return (
    <div className="mt-6 space-y-4">
      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-start gap-3">
          {grandTotals.netCashFlow >= 0 ? (
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-lg mb-2">Análisis del Flujo Operacional</p>
            <p className="text-sm text-gray-700">
              {grandTotals.netCashFlow >= 0 ? (
                <>Tu negocio genera un flujo de caja operacional <strong className="text-green-700">positivo</strong> de{' '}
                <strong>{formatCurrency(grandTotals.netCashFlow)}</strong> en el periodo analizado.</>
              ) : (
                <>Tu negocio presenta un flujo de caja operacional <strong className="text-red-700">negativo</strong> de{' '}
                <strong>{formatCurrency(Math.abs(grandTotals.netCashFlow))}</strong> en el periodo analizado.</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="font-semibold text-blue-900 mb-3">Indicadores Clave</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Periodos con flujo positivo:</span>
              <span className="font-semibold text-green-700">{positiveColumns} de {columnCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Periodos con flujo negativo:</span>
              <span className="font-semibold text-red-700">{negativeColumns} de {columnCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Flujo promedio por periodo:</span>
              <span className={`font-semibold ${avgFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(avgFlow)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-300">
              <span className="text-gray-700">Total entradas:</span>
              <span className="font-semibold text-green-700">{formatCurrency(grandTotals.totalInflows)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total salidas:</span>
              <span className="font-semibold text-red-700">{formatCurrency(grandTotals.totalOutflows)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="font-semibold text-amber-900 mb-3">Recomendaciones</p>
          <div className="space-y-2 text-sm text-gray-700">
            {negativeColumns > positiveColumns && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p><strong>Crítico:</strong> Tienes más periodos negativos ({negativeColumns}) que positivos ({positiveColumns}). Prioriza reducir gastos operativos o aumentar las ventas.</p>
              </div>
            )}
            {grandTotals.totalOutflows > grandTotals.totalInflows * 0.9 && grandTotals.netCashFlow >= 0 && (
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p><strong>Atención:</strong> Tus salidas representan más del 90% de tus entradas. Busca optimizar costos.</p>
              </div>
            )}
            {positiveColumns >= Math.ceil(columnCount * 0.75) && grandTotals.netCashFlow > 0 && (
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p><strong>Excelente:</strong> Tu negocio muestra consistencia con {positiveColumns} periodos positivos.</p>
              </div>
            )}
            {grandTotals.netCashFlow < 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p><strong>Urgente:</strong> Analiza los periodos con mayor déficit. Puede requerir ajuste de precios o reducción de costos.</p>
              </div>
            )}
            {positiveColumns >= Math.ceil(columnCount * 0.5) && negativeColumns >= Math.ceil(columnCount * 0.5) && (
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p>Flujos irregulares. Identifica patrones estacionales y planifica mejor los gastos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// src/app/dashboard/cash-flow/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Calendar,
  Download, AlertCircle, Info, X, Save
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  useCashFlows, useCashFlow, useCreateCashFlow,
  useUpdateCashFlow, useDeleteCashFlow,
} from '@/src/lib/hooks/useCashFlow';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/src/lib/utils';
import { exportCashFlowToPDF } from '@/src/lib/utils/pdf-export';
import type { CashFlowPeriodDTO, AdditionalItem, AdditionalItems } from '@/src/services/cash-flow.service';

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export default function CashFlowPage() {
  const router = useRouter();
  const { data: cashFlows, isLoading } = useCashFlows();
  const createMutation = useCreateCashFlow();
  const deleteMutation = useDeleteCashFlow();

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Set first tab as active when data loads
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
        // Will be reset by useEffect when cashFlows updates
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flujo de Caja</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las entradas y salidas de efectivo por proyecto
          </p>
        </div>
      </div>

      {/* Tabs */}
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
              <span className="text-xs text-gray-400">({cf.fiscal_year})</span>
            </button>
          ))}

          {isCreatingNew && (
            <button
              className="flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 border-blue-600 bg-white px-4 py-2.5 text-sm font-medium text-blue-600"
            >
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

      {/* Tab Content */}
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

  const [cashFlowName, setCashFlowName] = useState(mode === 'create' ? '' : '');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  const [periods, setPeriods] = useState<Record<number, CashFlowPeriodDTO>>(
    Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [
        i + 1,
        {
          month: i + 1,
          year: new Date().getFullYear(),
          salesCollections: 0,
          otherIncome: 0,
          supplierPayments: 0,
          payroll: 0,
          rent: 0,
          utilities: 0,
          taxes: 0,
          otherExpenses: 0,
        },
      ])
    )
  );

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

  // Pre-populate form when editing
  useEffect(() => {
    if (cashFlow && mode === 'edit') {
      setCashFlowName(cashFlow.name);
      setFiscalYear(cashFlow.fiscal_year);

      const periodsMap: Record<number, CashFlowPeriodDTO> = {};
      if (cashFlow.periods && cashFlow.periods.length > 0) {
        cashFlow.periods.forEach((period) => {
          periodsMap[period.month] = {
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
          };
        });
      }

      for (let month = 1; month <= 12; month++) {
        if (!periodsMap[month]) {
          periodsMap[month] = {
            month,
            year: cashFlow.fiscal_year,
            salesCollections: 0,
            otherIncome: 0,
            supplierPayments: 0,
            payroll: 0,
            rent: 0,
            utilities: 0,
            taxes: 0,
            otherExpenses: 0,
          };
        }
      }

      setPeriods(periodsMap);

      if (cashFlow.additional_items) {
        setAdditionalItems(cashFlow.additional_items);
        if (cashFlow.additional_items.customLabels) {
          setCustomLabels(cashFlow.additional_items.customLabels);
        }
      }
    }
  }, [cashFlow, mode]);

  const handleValueChange = (month: number, field: keyof CashFlowPeriodDTO, value: number) => {
    setPeriods(prev => ({
      ...prev,
      [month]: { ...prev[month], [field]: value },
    }));
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
  };

  const updateAdditionalItemName = (type: 'incomes' | 'expenses', id: string, name: string) => {
    setAdditionalItems(prev => ({
      ...prev,
      [type]: prev[type].map(item => item.id === id ? { ...item, name } : item),
    }));
  };

  const updateAdditionalItemAmount = (type: 'incomes' | 'expenses', id: string, month: number, amount: number) => {
    setAdditionalItems(prev => ({
      ...prev,
      [type]: prev[type].map(item =>
        item.id === id ? { ...item, amounts: { ...item.amounts, [month]: amount } } : item
      ),
    }));
  };

  const calculateMonthTotals = useCallback((month: number) => {
    const period = periods[month];
    const additionalIncome = additionalItems.incomes.reduce(
      (sum, item) => sum + (item.amounts[month] || 0), 0
    );
    const additionalExpense = additionalItems.expenses.reduce(
      (sum, item) => sum + (item.amounts[month] || 0), 0
    );

    const totalInflows = period.salesCollections + period.otherIncome + additionalIncome;
    const totalOutflows =
      period.supplierPayments + period.payroll + period.rent +
      period.utilities + period.taxes + period.otherExpenses + additionalExpense;
    const netCashFlow = totalInflows - totalOutflows;

    return { totalInflows, totalOutflows, netCashFlow };
  }, [periods, additionalItems]);

  const calculateYearTotals = useCallback(() => {
    let totalInflows = 0;
    let totalOutflows = 0;

    for (let month = 1; month <= 12; month++) {
      const monthTotals = calculateMonthTotals(month);
      totalInflows += monthTotals.totalInflows;
      totalOutflows += monthTotals.totalOutflows;
    }

    return { totalInflows, totalOutflows, netCashFlow: totalInflows - totalOutflows };
  }, [calculateMonthTotals]);

  const yearTotals = calculateYearTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashFlowName) {
      alert('Por favor ingresa un nombre para el flujo de caja');
      return;
    }

    const dto = {
      name: cashFlowName,
      fiscalYear,
      periods: Object.values(periods),
      additionalItems: { ...additionalItems, customLabels },
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* General Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
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
            <div>
              <label htmlFor="fiscalYear" className="block text-sm font-medium text-gray-700">
                Año Fiscal <span className="text-red-500">*</span>
              </label>
              <input
                id="fiscalYear"
                type="number"
                required
                min="2000"
                max="2100"
                value={fiscalYear}
                onChange={(e) => {
                  const year = parseInt(e.target.value);
                  setFiscalYear(year);
                  setPeriods(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(key => {
                      updated[parseInt(key)].year = year;
                    });
                    return updated;
                  });
                }}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Caja Mensual - {fiscalYear}</CardTitle>
          <CardDescription>Valores en pesos colombianos (COP)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="sticky left-0 bg-gray-100 border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 min-w-[200px]">
                    Concepto
                  </th>
                  {MONTHS.map((month, idx) => (
                    <th key={idx} className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-900 min-w-[100px]">
                      {month}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-900 bg-gray-200 min-w-[120px]">
                    Total Año
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ENTRADAS DE EFECTIVO */}
                <tr className="bg-green-50">
                  <td colSpan={14} className="border border-gray-300 px-3 py-2 font-bold text-green-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      ENTRADAS DE EFECTIVO
                    </div>
                  </td>
                </tr>

                <CashFlowRow
                  label={getLabel('salesCollections')}
                  field="salesCollections"
                  periods={periods}
                  onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('salesCollections', name)}
                  yearTotal={Object.values(periods).reduce((sum, p) => sum + p.salesCollections, 0)}
                  displayValues={displayValues}
                  setDisplayValues={setDisplayValues}
                />
                <CashFlowRow
                  label={getLabel('otherIncome')}
                  field="otherIncome"
                  periods={periods}
                  onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('otherIncome', name)}
                  yearTotal={Object.values(periods).reduce((sum, p) => sum + p.otherIncome, 0)}
                  displayValues={displayValues}
                  setDisplayValues={setDisplayValues}
                />

                {/* Additional Income Rows */}
                {additionalItems.incomes.map((item) => (
                  <DynamicCashFlowRow
                    key={item.id}
                    item={item}
                    type="incomes"
                    onNameChange={(name) => updateAdditionalItemName('incomes', item.id, name)}
                    onAmountChange={(month, amount) => updateAdditionalItemAmount('incomes', item.id, month, amount)}
                    onRemove={() => removeAdditionalItem('incomes', item.id)}
                    displayValues={additionalDisplayValues}
                    setDisplayValues={setAdditionalDisplayValues}
                  />
                ))}

                {/* Add Income Button Row */}
                <tr>
                  <td colSpan={14} className="border border-gray-300 px-3 py-1">
                    <button
                      type="button"
                      onClick={addAdditionalIncome}
                      className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 transition-colors py-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar Ingreso
                    </button>
                  </td>
                </tr>

                {/* Total Entradas */}
                <tr className="bg-green-100 font-semibold">
                  <td className="sticky left-0 bg-green-100 border border-gray-300 px-3 py-2 text-green-800">
                    Total Entradas
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <td key={month} className="border border-gray-300 px-2 py-2 text-right text-green-800 font-semibold">
                      {formatCurrency(calculateMonthTotals(month).totalInflows)}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-right bg-green-200 font-bold text-green-800">
                    {formatCurrency(yearTotals.totalInflows)}
                  </td>
                </tr>

                {/* SALIDAS DE EFECTIVO */}
                <tr className="bg-red-50">
                  <td colSpan={14} className="border border-gray-300 px-3 py-2 font-bold text-red-800">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      SALIDAS DE EFECTIVO
                    </div>
                  </td>
                </tr>

                <CashFlowRow label={getLabel('supplierPayments')} field="supplierPayments" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('supplierPayments', name)}
                  yearTotal={Object.values(periods).reduce((sum, p) => sum + p.supplierPayments, 0)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} />
                <CashFlowRow label={getLabel('payroll')} field="payroll" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('payroll', name)}
                  yearTotal={Object.values(periods).reduce((sum, p) => sum + p.payroll, 0)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} />
                <CashFlowRow label={getLabel('rent')} field="rent" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('rent', name)}
                  yearTotal={Object.values(periods).reduce((sum, p) => sum + p.rent, 0)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} />
                <CashFlowRow label={getLabel('utilities')} field="utilities" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('utilities', name)}
                  yearTotal={Object.values(periods).reduce((sum, p) => sum + p.utilities, 0)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} />
                <CashFlowRow label={getLabel('taxes')} field="taxes" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('taxes', name)}
                  yearTotal={Object.values(periods).reduce((sum, p) => sum + p.taxes, 0)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} />
                <CashFlowRow label={getLabel('otherExpenses')} field="otherExpenses" periods={periods} onChange={handleValueChange}
                  onLabelChange={(name) => updateLabel('otherExpenses', name)}
                  yearTotal={Object.values(periods).reduce((sum, p) => sum + p.otherExpenses, 0)}
                  displayValues={displayValues} setDisplayValues={setDisplayValues} />

                {/* Additional Expense Rows */}
                {additionalItems.expenses.map((item) => (
                  <DynamicCashFlowRow
                    key={item.id}
                    item={item}
                    type="expenses"
                    onNameChange={(name) => updateAdditionalItemName('expenses', item.id, name)}
                    onAmountChange={(month, amount) => updateAdditionalItemAmount('expenses', item.id, month, amount)}
                    onRemove={() => removeAdditionalItem('expenses', item.id)}
                    displayValues={additionalDisplayValues}
                    setDisplayValues={setAdditionalDisplayValues}
                  />
                ))}

                {/* Add Expense Button Row */}
                <tr>
                  <td colSpan={14} className="border border-gray-300 px-3 py-1">
                    <button
                      type="button"
                      onClick={addAdditionalExpense}
                      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors py-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar Gasto
                    </button>
                  </td>
                </tr>

                {/* Total Salidas */}
                <tr className="bg-red-100 font-semibold">
                  <td className="sticky left-0 bg-red-100 border border-gray-300 px-3 py-2 text-red-800">
                    Total Salidas
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <td key={month} className="border border-gray-300 px-2 py-2 text-right text-red-800 font-semibold">
                      {formatCurrency(calculateMonthTotals(month).totalOutflows)}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-right bg-red-200 font-bold text-red-800">
                    {formatCurrency(yearTotals.totalOutflows)}
                  </td>
                </tr>

                {/* FLUJO NETO */}
                <tr className="bg-blue-100 font-bold text-lg">
                  <td className={`sticky left-0 bg-blue-100 border border-gray-300 px-3 py-2 ${yearTotals.netCashFlow < 0 ? 'text-red-800' : 'text-green-800'}`}>
                    FLUJO NETO
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    const totals = calculateMonthTotals(month);
                    return (
                      <td key={month} className={`border border-gray-300 px-2 py-2 text-right font-bold ${totals.netCashFlow < 0 ? 'text-red-800' : 'text-green-800'}`}>
                        {formatCurrency(totals.netCashFlow)}
                      </td>
                    );
                  })}
                  <td className={`border border-gray-300 px-3 py-2 text-right bg-blue-200 font-bold ${yearTotals.netCashFlow < 0 ? 'text-red-800' : 'text-green-800'}`}>
                    {formatCurrency(yearTotals.netCashFlow)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Analysis */}
          {yearTotals.totalInflows > 0 && (
            <CashFlowAnalysis yearTotals={yearTotals} calculateMonthTotals={calculateMonthTotals} />
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {mode === 'edit' && cashFlowId && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPDF}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onDelete?.(cashFlowId, cashFlowName)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
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
  );
}

// ==========================================
// CashFlowRow Component (static rows)
// ==========================================

function CashFlowRow({
  label, field, periods, onChange, onLabelChange, yearTotal, displayValues, setDisplayValues,
}: {
  label: string;
  field: keyof CashFlowPeriodDTO;
  periods: Record<number, CashFlowPeriodDTO>;
  onChange: (month: number, field: keyof CashFlowPeriodDTO, value: number) => void;
  onLabelChange?: (name: string) => void;
  yearTotal: number;
  displayValues: Record<string, string>;
  setDisplayValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="sticky left-0 bg-white hover:bg-gray-50 border border-gray-300 px-1 py-1">
        <input
          type="text"
          value={label}
          onChange={(e) => onLabelChange?.(e.target.value)}
          className="w-full px-2 py-1 text-sm font-medium text-gray-700 border-0 focus:ring-1 focus:ring-blue-500 rounded"
        />
      </td>
      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
        const inputKey = `${month}-${field}`;
        const currentValue = periods[month][field] || 0;
        return (
          <td key={month} className="border border-gray-300 px-1 py-1">
            <input
              type="text"
              value={displayValues[inputKey] ?? (currentValue > 0 ? formatNumberInput(currentValue) : '')}
              onChange={(e) => {
                setDisplayValues(prev => ({ ...prev, [inputKey]: e.target.value }));
                onChange(month, field, parseNumberInput(e.target.value));
              }}
              onBlur={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setDisplayValues(prev => ({
                  ...prev,
                  [inputKey]: numericValue > 0 ? formatNumberInput(numericValue) : '',
                }));
              }}
              className="w-full text-right px-2 py-1 text-sm text-gray-900 border-0 focus:ring-1 focus:ring-blue-500 rounded"
              placeholder="0"
            />
          </td>
        );
      })}
      <td className="border border-gray-300 px-3 py-2 text-right bg-gray-100 font-semibold text-gray-900">
        {formatCurrency(yearTotal)}
      </td>
    </tr>
  );
}

// ==========================================
// DynamicCashFlowRow Component (additional items)
// ==========================================

function DynamicCashFlowRow({
  item, type, onNameChange, onAmountChange, onRemove, displayValues, setDisplayValues,
}: {
  item: AdditionalItem;
  type: 'incomes' | 'expenses';
  onNameChange: (name: string) => void;
  onAmountChange: (month: number, amount: number) => void;
  onRemove: () => void;
  displayValues: Record<string, string>;
  setDisplayValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const yearTotal = Array.from({ length: 12 }, (_, i) => i + 1).reduce(
    (sum, month) => sum + (item.amounts[month] || 0), 0
  );
  const color = type === 'incomes' ? 'green' : 'red';

  return (
    <tr className="hover:bg-gray-50">
      <td className="sticky left-0 bg-white hover:bg-gray-50 border border-gray-300 px-1 py-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRemove}
            className={`flex-shrink-0 p-0.5 rounded text-${color}-400 hover:text-${color}-600 hover:bg-${color}-50`}
            title="Eliminar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <input
            type="text"
            value={item.name}
            onChange={(e) => onNameChange(e.target.value)}
            className={`w-full px-2 py-1 text-sm font-medium text-gray-700 border-0 focus:ring-1 focus:ring-${color}-500 rounded placeholder-gray-400`}
            placeholder={type === 'incomes' ? 'Nombre del ingreso...' : 'Nombre del gasto...'}
          />
        </div>
      </td>
      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
        const inputKey = `${item.id}-${month}`;
        const currentValue = item.amounts[month] || 0;
        return (
          <td key={month} className="border border-gray-300 px-1 py-1">
            <input
              type="text"
              value={displayValues[inputKey] ?? (currentValue > 0 ? formatNumberInput(currentValue) : '')}
              onChange={(e) => {
                setDisplayValues(prev => ({ ...prev, [inputKey]: e.target.value }));
                onAmountChange(month, parseNumberInput(e.target.value));
              }}
              onBlur={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setDisplayValues(prev => ({
                  ...prev,
                  [inputKey]: numericValue > 0 ? formatNumberInput(numericValue) : '',
                }));
              }}
              className="w-full text-right px-2 py-1 text-sm text-gray-900 border-0 focus:ring-1 focus:ring-blue-500 rounded"
              placeholder="0"
            />
          </td>
        );
      })}
      <td className="border border-gray-300 px-3 py-2 text-right bg-gray-100 font-semibold text-gray-900">
        {formatCurrency(yearTotal)}
      </td>
    </tr>
  );
}

// ==========================================
// CashFlowAnalysis Component
// ==========================================

function CashFlowAnalysis({
  yearTotals,
  calculateMonthTotals,
}: {
  yearTotals: { totalInflows: number; totalOutflows: number; netCashFlow: number };
  calculateMonthTotals: (month: number) => { totalInflows: number; totalOutflows: number; netCashFlow: number };
}) {
  const monthlyAnalysis = Array.from({ length: 12 }, (_, i) => i + 1).map(month => ({
    month,
    ...calculateMonthTotals(month),
  }));
  const positiveMonths = monthlyAnalysis.filter(m => m.netCashFlow > 0).length;
  const negativeMonths = monthlyAnalysis.filter(m => m.netCashFlow < 0).length;
  const avgMonthlyFlow = yearTotals.netCashFlow / 12;

  return (
    <div className="mt-6 space-y-4">
      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-start gap-3">
          {yearTotals.netCashFlow >= 0 ? (
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-lg mb-2">Análisis del Flujo Operacional</p>
            <p className="text-sm text-gray-700">
              {yearTotals.netCashFlow >= 0 ? (
                <>Tu negocio genera un flujo de caja operacional <strong className="text-green-700">positivo</strong> de{' '}
                <strong>{formatCurrency(yearTotals.netCashFlow)}</strong> durante el año.</>
              ) : (
                <>Tu negocio presenta un flujo de caja operacional <strong className="text-red-700">negativo</strong> de{' '}
                <strong>{formatCurrency(Math.abs(yearTotals.netCashFlow))}</strong> durante el año.</>
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
              <span className="text-gray-700">Meses con flujo positivo:</span>
              <span className="font-semibold text-green-700">{positiveMonths} de 12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Meses con flujo negativo:</span>
              <span className="font-semibold text-red-700">{negativeMonths} de 12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Flujo promedio mensual:</span>
              <span className={`font-semibold ${avgMonthlyFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(avgMonthlyFlow)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-300">
              <span className="text-gray-700">Total entradas anuales:</span>
              <span className="font-semibold text-green-700">{formatCurrency(yearTotals.totalInflows)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total salidas anuales:</span>
              <span className="font-semibold text-red-700">{formatCurrency(yearTotals.totalOutflows)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="font-semibold text-amber-900 mb-3">Recomendaciones</p>
          <div className="space-y-2 text-sm text-gray-700">
            {negativeMonths > positiveMonths && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p><strong>Crítico:</strong> Tienes más meses negativos ({negativeMonths}) que positivos ({positiveMonths}). Prioriza reducir gastos operativos o aumentar las ventas.</p>
              </div>
            )}
            {yearTotals.totalOutflows > yearTotals.totalInflows * 0.9 && yearTotals.netCashFlow >= 0 && (
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p><strong>Atención:</strong> Tus salidas representan más del 90% de tus entradas. Busca optimizar costos.</p>
              </div>
            )}
            {positiveMonths >= 9 && yearTotals.netCashFlow > 0 && (
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p><strong>Excelente:</strong> Tu negocio muestra consistencia con {positiveMonths} meses positivos.</p>
              </div>
            )}
            {yearTotals.netCashFlow < 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p><strong>Urgente:</strong> Analiza los meses con mayor déficit. Puede requerir ajuste de precios o reducción de costos.</p>
              </div>
            )}
            {positiveMonths >= 6 && negativeMonths >= 6 && (
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

// src/app/dashboard/project-evaluation/[id]/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  useProjectEvaluation,
  useUpdateProjectEvaluation,
} from '@/src/lib/hooks/useProjectEvaluation';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  calculateAmortization,
  type ProjectItem,
  type ProjectLoan,
  type ProjectItems,
  type AmortizationEntry,
} from '@/src/services/project-evaluation.service';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/src/lib/utils';

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function generateId() {
  return crypto.randomUUID();
}

export default function ProjectBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: project, isLoading } = useProjectEvaluation(id);
  const updateMutation = useUpdateProjectEvaluation();

  const [items, setItems] = useState<ProjectItems>({ incomes: [], expenses: [] });
  const [loans, setLoans] = useState<ProjectLoan[]>([]);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [expandedLoans, setExpandedLoans] = useState<Record<string, boolean>>({});
  const [loanForm, setLoanForm] = useState({
    name: '',
    principal: '',
    annualRate: '',
    numInstallments: '',
    startPeriod: '0',
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load data from project
  useEffect(() => {
    if (project) {
      setItems(project.items || { incomes: [], expenses: [] });
      setLoans(project.loans || []);
    }
  }, [project]);

  // Period helpers
  const numPeriods = project?.num_periods || 12;
  const periodType = project?.period_type || 'months';
  const startYear = project?.start_year || new Date().getFullYear();
  const startMonth = project?.start_month || 1;

  const getPeriodLabel = useCallback((index: number): string => {
    if (periodType === 'years') {
      return String(startYear + index);
    }
    const totalMonth = (startMonth - 1) + index;
    const month = totalMonth % 12;
    const year = startYear + Math.floor(totalMonth / 12);
    return `${MONTH_SHORT[month]} ${year}`;
  }, [periodType, startYear, startMonth]);

  // Amortization schedules
  const loanSchedules: Record<string, AmortizationEntry[]> = {};
  loans.forEach(loan => {
    loanSchedules[loan.id] = calculateAmortization(loan, periodType);
  });

  // Loan totals per period
  const getLoanDisbursement = useCallback((periodIndex: number): number => {
    return loans.reduce((sum, loan) => {
      return sum + (loan.startPeriod === periodIndex ? loan.principal : 0);
    }, 0);
  }, [loans]);

  const getLoanInstallment = useCallback((periodIndex: number): number => {
    return loans.reduce((sum, loan) => {
      const schedule = loanSchedules[loan.id] || [];
      const entry = schedule.find(e => e.period === periodIndex);
      return sum + (entry ? entry.installment : 0);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans, loanSchedules]);

  // Item value change
  const handleItemChange = (type: 'incomes' | 'expenses', itemId: string, periodIndex: number, value: number) => {
    setItems(prev => ({
      ...prev,
      [type]: prev[type].map(item =>
        item.id === itemId
          ? { ...item, amounts: { ...item.amounts, [periodIndex]: value } }
          : item
      ),
    }));
    setHasChanges(true);
  };

  // Add custom item
  const addItem = (type: 'incomes' | 'expenses') => {
    const name = prompt(type === 'incomes' ? 'Nombre del ingreso:' : 'Nombre del gasto:');
    if (!name?.trim()) return;

    setItems(prev => ({
      ...prev,
      [type]: [...prev[type], { id: generateId(), name: name.trim(), category: 'custom', amounts: {} }],
    }));
    setHasChanges(true);
  };

  // Remove item
  const removeItem = (type: 'incomes' | 'expenses', itemId: string) => {
    setItems(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== itemId),
    }));
    setHasChanges(true);
  };

  // Add predefined item if not present
  const addPredefinedItem = (type: 'incomes' | 'expenses', categoryKey: string, categoryName: string) => {
    const existing = items[type].find(item => item.category === categoryKey);
    if (existing) return; // already exists

    setItems(prev => ({
      ...prev,
      [type]: [...prev[type], { id: generateId(), name: categoryName, category: categoryKey, amounts: {} }],
    }));
    setHasChanges(true);
  };

  // Add loan
  const handleAddLoan = () => {
    const principal = parseFloat(loanForm.principal);
    const rate = parseFloat(loanForm.annualRate);
    const installments = parseInt(loanForm.numInstallments);
    const startP = parseInt(loanForm.startPeriod);

    if (!loanForm.name.trim() || !principal || !rate || !installments) {
      alert('Completa todos los campos del préstamo');
      return;
    }

    setLoans(prev => [...prev, {
      id: generateId(),
      name: loanForm.name.trim(),
      principal,
      annualRate: rate,
      numInstallments: installments,
      startPeriod: startP || 0,
    }]);

    setLoanForm({ name: '', principal: '', annualRate: '', numInstallments: '', startPeriod: '0' });
    setShowLoanForm(false);
    setHasChanges(true);
  };

  // Remove loan
  const removeLoan = (loanId: string) => {
    if (!confirm('¿Eliminar este préstamo?')) return;
    setLoans(prev => prev.filter(l => l.id !== loanId));
    setHasChanges(true);
  };

  // Calculate totals
  const getIncomeTotal = (periodIndex: number): number => {
    const itemsTotal = items.incomes.reduce((sum, item) => sum + (item.amounts[periodIndex] || 0), 0);
    return itemsTotal + getLoanDisbursement(periodIndex);
  };

  const getExpenseTotal = (periodIndex: number): number => {
    const itemsTotal = items.expenses.reduce((sum, item) => sum + (item.amounts[periodIndex] || 0), 0);
    return itemsTotal + getLoanInstallment(periodIndex);
  };

  const getNetFlow = (periodIndex: number): number => {
    return getIncomeTotal(periodIndex) - getExpenseTotal(periodIndex);
  };

  const getGrandTotal = (getter: (i: number) => number): number => {
    let total = 0;
    for (let i = 0; i < numPeriods; i++) total += getter(i);
    return total;
  };

  const getItemTotal = (item: ProjectItem): number => {
    let total = 0;
    for (let i = 0; i < numPeriods; i++) total += item.amounts[i] || 0;
    return total;
  };

  // Save
  const handleSave = async () => {
    if (!project) return;

    await updateMutation.mutateAsync({
      id: project.id,
      dto: {
        name: project.name,
        description: project.description || undefined,
        periodType: project.period_type,
        startMonth: project.start_month || undefined,
        startYear: project.start_year,
        numPeriods: project.num_periods,
        items,
        loans,
      },
    });
    setHasChanges(false);
  };

  // Toggle loan expansion
  const toggleLoan = (loanId: string) => {
    setExpandedLoans(prev => ({ ...prev, [loanId]: !prev[loanId] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Proyecto no encontrado</p>
        <Button variant="ghost" onClick={() => router.push('/dashboard/project-evaluation')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  // Existing predefined categories
  const existingIncomeCategories = new Set(items.incomes.map(i => i.category));
  const existingExpenseCategories = new Set(items.expenses.map(i => i.category));
  const availableIncomeCategories = INCOME_CATEGORIES.filter(c => !existingIncomeCategories.has(c.key));
  const availableExpenseCategories = EXPENSE_CATEGORIES.filter(c => !existingExpenseCategories.has(c.key));

  const colCount = numPeriods;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/project-evaluation')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">
              {project.period_type === 'months' ? 'Mensual' : 'Anual'} | {numPeriods} periodos
              {project.description && ` | ${project.description}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLoanForm(!showLoanForm)}
          >
            <Calculator className="h-4 w-4 mr-1" />
            Préstamo
          </Button>
          <Button
            onClick={handleSave}
            isLoading={updateMutation.isPending}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Loan Form */}
      {showLoanForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Agregar Préstamo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={loanForm.name}
                  onChange={(e) => setLoanForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Crédito bancario"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={loanForm.principal}
                  onChange={(e) => setLoanForm(prev => ({ ...prev, principal: e.target.value }))}
                  placeholder="10,000,000"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasa anual % *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={loanForm.annualRate}
                  onChange={(e) => setLoanForm(prev => ({ ...prev, annualRate: e.target.value }))}
                  placeholder="12"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Cuotas *</label>
                <input
                  type="number"
                  min="1"
                  value={loanForm.numInstallments}
                  onChange={(e) => setLoanForm(prev => ({ ...prev, numInstallments: e.target.value }))}
                  placeholder="24"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periodo inicio</label>
                <select
                  value={loanForm.startPeriod}
                  onChange={(e) => setLoanForm(prev => ({ ...prev, startPeriod: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Array.from({ length: numPeriods }, (_, i) => (
                    <option key={i} value={i}>{getPeriodLabel(i)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" size="sm" onClick={handleAddLoan}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowLoanForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Header */}
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="sticky left-0 z-10 bg-gray-100 px-4 py-3 text-left font-semibold text-gray-700 min-w-[200px]">
                    Concepto
                  </th>
                  {Array.from({ length: colCount }, (_, i) => (
                    <th key={i} className="px-3 py-3 text-right font-medium text-gray-600 min-w-[110px]">
                      {getPeriodLabel(i)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 min-w-[120px] bg-gray-200">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ===== INGRESOS ===== */}
                <tr className="bg-green-50 border-b border-green-200">
                  <td className="sticky left-0 z-10 bg-green-50 px-4 py-2" colSpan={colCount + 2}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-800">INGRESOS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {availableIncomeCategories.length > 0 && (
                          <select
                            onChange={(e) => {
                              const cat = INCOME_CATEGORIES.find(c => c.key === e.target.value);
                              if (cat) addPredefinedItem('incomes', cat.key, cat.name);
                              e.target.value = '';
                            }}
                            className="text-xs border border-green-300 rounded px-2 py-1 bg-white"
                            defaultValue=""
                          >
                            <option value="" disabled>+ Predefinido</option>
                            {availableIncomeCategories.map(c => (
                              <option key={c.key} value={c.key}>{c.name}</option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => addItem('incomes')}
                          className="text-xs text-green-700 hover:text-green-900 font-medium px-2 py-1 rounded hover:bg-green-100"
                        >
                          + Custom
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Income items */}
                {items.incomes.map(item => (
                  <BudgetRow
                    key={item.id}
                    item={item}
                    numPeriods={colCount}
                    onChange={(periodIndex, value) => handleItemChange('incomes', item.id, periodIndex, value)}
                    onRemove={item.category === 'custom' ? () => removeItem('incomes', item.id) : undefined}
                    colorClass="text-green-700"
                  />
                ))}

                {/* Loan disbursements row */}
                {loans.length > 0 && (
                  <tr className="border-b hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2">
                      <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Desembolso Préstamos
                      </span>
                    </td>
                    {Array.from({ length: colCount }, (_, i) => {
                      const val = getLoanDisbursement(i);
                      return (
                        <td key={i} className="px-3 py-2 text-right text-sm">
                          {val > 0 ? (
                            <span className="text-green-600 font-medium">{formatCurrency(val)}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-semibold bg-gray-50 text-green-700">
                      {formatCurrency(loans.reduce((sum, l) => sum + l.principal, 0))}
                    </td>
                  </tr>
                )}

                {/* Total Ingresos */}
                <tr className="bg-green-100 border-b-2 border-green-300 font-bold">
                  <td className="sticky left-0 z-10 bg-green-100 px-4 py-2 text-green-900">
                    Total Ingresos
                  </td>
                  {Array.from({ length: colCount }, (_, i) => (
                    <td key={i} className="px-3 py-2 text-right text-green-900">
                      {formatCurrency(getIncomeTotal(i))}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right text-green-900 bg-green-200">
                    {formatCurrency(getGrandTotal(getIncomeTotal))}
                  </td>
                </tr>

                {/* ===== GASTOS ===== */}
                <tr className="bg-red-50 border-b border-red-200">
                  <td className="sticky left-0 z-10 bg-red-50 px-4 py-2" colSpan={colCount + 2}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="font-bold text-red-800">GASTOS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {availableExpenseCategories.length > 0 && (
                          <select
                            onChange={(e) => {
                              const cat = EXPENSE_CATEGORIES.find(c => c.key === e.target.value);
                              if (cat) addPredefinedItem('expenses', cat.key, cat.name);
                              e.target.value = '';
                            }}
                            className="text-xs border border-red-300 rounded px-2 py-1 bg-white"
                            defaultValue=""
                          >
                            <option value="" disabled>+ Predefinido</option>
                            {availableExpenseCategories.map(c => (
                              <option key={c.key} value={c.key}>{c.name}</option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => addItem('expenses')}
                          className="text-xs text-red-700 hover:text-red-900 font-medium px-2 py-1 rounded hover:bg-red-100"
                        >
                          + Custom
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Expense items */}
                {items.expenses.map(item => (
                  <BudgetRow
                    key={item.id}
                    item={item}
                    numPeriods={colCount}
                    onChange={(periodIndex, value) => handleItemChange('expenses', item.id, periodIndex, value)}
                    onRemove={item.category === 'custom' ? () => removeItem('expenses', item.id) : undefined}
                    colorClass="text-red-700"
                  />
                ))}

                {/* Loan installments row */}
                {loans.length > 0 && (
                  <tr className="border-b hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2">
                      <span className="text-sm text-red-700 font-medium flex items-center gap-1">
                        <Calculator className="h-3 w-3" />
                        Cuotas de Préstamos
                      </span>
                    </td>
                    {Array.from({ length: colCount }, (_, i) => {
                      const val = getLoanInstallment(i);
                      return (
                        <td key={i} className="px-3 py-2 text-right text-sm">
                          {val > 0 ? (
                            <span className="text-red-600 font-medium">{formatCurrency(val)}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-semibold bg-gray-50 text-red-700">
                      {formatCurrency(getGrandTotal(getLoanInstallment))}
                    </td>
                  </tr>
                )}

                {/* Total Gastos */}
                <tr className="bg-red-100 border-b-2 border-red-300 font-bold">
                  <td className="sticky left-0 z-10 bg-red-100 px-4 py-2 text-red-900">
                    Total Gastos
                  </td>
                  {Array.from({ length: colCount }, (_, i) => (
                    <td key={i} className="px-3 py-2 text-right text-red-900">
                      {formatCurrency(getExpenseTotal(i))}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right text-red-900 bg-red-200">
                    {formatCurrency(getGrandTotal(getExpenseTotal))}
                  </td>
                </tr>

                {/* ===== FLUJO NETO ===== */}
                <tr className="bg-blue-100 border-b font-bold">
                  <td className="sticky left-0 z-10 bg-blue-100 px-4 py-2 text-blue-900">
                    Flujo Neto
                  </td>
                  {Array.from({ length: colCount }, (_, i) => {
                    const net = getNetFlow(i);
                    return (
                      <td key={i} className={`px-3 py-2 text-right ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(net)}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-2 text-right bg-blue-200 ${getGrandTotal(getNetFlow) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {formatCurrency(getGrandTotal(getNetFlow))}
                  </td>
                </tr>

                {/* ===== ACUMULADO ===== */}
                <tr className="bg-blue-50 font-semibold">
                  <td className="sticky left-0 z-10 bg-blue-50 px-4 py-2 text-blue-800">
                    Acumulado
                  </td>
                  {(() => {
                    let cumulative = 0;
                    return Array.from({ length: colCount }, (_, i) => {
                      cumulative += getNetFlow(i);
                      return (
                        <td key={i} className={`px-3 py-2 text-right ${cumulative >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(cumulative)}
                        </td>
                      );
                    });
                  })()}
                  <td className="px-3 py-2 text-right bg-blue-100 text-blue-800">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Amortization Tables */}
      {loans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tablas de Amortización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loans.map(loan => {
              const schedule = loanSchedules[loan.id] || [];
              const isExpanded = expandedLoans[loan.id] ?? false;
              const totalInterest = schedule.reduce((sum, e) => sum + e.interest, 0);
              const totalCapital = schedule.reduce((sum, e) => sum + e.capital, 0);

              return (
                <div key={loan.id} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleLoan(loan.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div>
                        <p className="font-semibold text-gray-900">{loan.name}</p>
                        <p className="text-xs text-gray-500">
                          Monto: {formatCurrency(loan.principal)} | Tasa: {loan.annualRate}% anual | Cuotas: {loan.numInstallments} | Inicio: {getPeriodLabel(loan.startPeriod)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Cuota: <span className="font-semibold text-gray-900">{schedule.length > 0 ? formatCurrency(schedule[0].installment) : '—'}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); removeLoan(loan.id); }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && schedule.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-t bg-gray-50">
                            <th className="px-4 py-2 text-left text-gray-600">N°</th>
                            <th className="px-4 py-2 text-left text-gray-600">Periodo</th>
                            <th className="px-4 py-2 text-right text-gray-600">Cuota</th>
                            <th className="px-4 py-2 text-right text-gray-600">Capital</th>
                            <th className="px-4 py-2 text-right text-gray-600">Interés</th>
                            <th className="px-4 py-2 text-right text-gray-600">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.map((entry, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                              <td className="px-4 py-2 text-gray-700">
                                {entry.period < numPeriods ? getPeriodLabel(entry.period) : `P${entry.period}`}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">{formatCurrency(entry.installment)}</td>
                              <td className="px-4 py-2 text-right text-blue-700">{formatCurrency(entry.capital)}</td>
                              <td className="px-4 py-2 text-right text-orange-700">{formatCurrency(entry.interest)}</td>
                              <td className="px-4 py-2 text-right font-medium">{formatCurrency(entry.balance)}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 bg-gray-100 font-bold">
                            <td className="px-4 py-2" colSpan={2}>Total</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(totalCapital + totalInterest)}</td>
                            <td className="px-4 py-2 text-right text-blue-700">{formatCurrency(totalCapital)}</td>
                            <td className="px-4 py-2 text-right text-orange-700">{formatCurrency(totalInterest)}</td>
                            <td className="px-4 py-2 text-right">—</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Budget Row Component ────────────────────────────────────────
function BudgetRow({
  item,
  numPeriods,
  onChange,
  onRemove,
  colorClass,
}: {
  item: ProjectItem;
  numPeriods: number;
  onChange: (periodIndex: number, value: number) => void;
  onRemove?: () => void;
  colorClass: string;
}) {
  const total = Object.values(item.amounts).reduce((sum, v) => sum + (v || 0), 0);

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="sticky left-0 z-10 bg-white px-4 py-2">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${colorClass}`}>{item.name}</span>
          {onRemove && (
            <button onClick={onRemove} className="text-red-400 hover:text-red-600 ml-2">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>
      {Array.from({ length: numPeriods }, (_, i) => (
        <td key={i} className="px-1 py-1">
          <input
            type="text"
            value={item.amounts[i] ? formatNumberInput(item.amounts[i]) : ''}
            onChange={(e) => onChange(i, parseNumberInput(e.target.value))}
            className="w-full text-right rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="0"
          />
        </td>
      ))}
      <td className="px-3 py-2 text-right font-semibold bg-gray-50">
        {formatCurrency(total)}
      </td>
    </tr>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  CreditCard,
  Plus,
  Check,
  Calculator,
  DollarSign,
  Calendar,
  TrendingDown,
  Percent,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useDebt, useCreateDebt, useUpdateDebt } from '@/src/lib/hooks/useDebts';
import { useCashFlows } from '@/src/lib/hooks/useCashFlow';
import {
  calculateAmortization,
  calculateAmortizationWithExtra,
  getDebtSummary,
} from '@/src/services/debt.service';
import type { Debt, DebtDTO, InstallmentPeriod, ExtraPayment, AmortizationEntry } from '@/src/services/debt.service';
import { formatCurrency, formatNumberInput, parseNumberInput, formatDate } from '@/src/lib/utils';

const PERIOD_OPTIONS: { value: InstallmentPeriod; label: string }[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export default function DebtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';

  const { data: existingDebt, isLoading: isLoadingDebt } = useDebt(isNew ? undefined : id);
  const { data: cashFlows } = useCashFlows();
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();

  // Form state
  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [installmentPeriod, setInstallmentPeriod] = useState<InstallmentPeriod>('monthly');
  const [startDate, setStartDate] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('0');
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [notes, setNotes] = useState('');
  const [cashFlowId, setCashFlowId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Extra payment modal state
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraInstallment, setExtraInstallment] = useState('');
  const [extraAmountDisplay, setExtraAmountDisplay] = useState('');

  // Simulator state
  const [simAmount, setSimAmount] = useState('');

  // Load existing debt data
  useEffect(() => {
    if (existingDebt) {
      setName(existingDebt.name);
      setCreditor(existingDebt.creditor || '');
      setAmountDisplay(formatNumberInput(existingDebt.original_amount));
      setAnnualRate(String(existingDebt.annual_rate));
      setTotalInstallments(String(existingDebt.total_installments));
      setInstallmentPeriod(existingDebt.installment_period);
      setStartDate(existingDebt.start_date);
      setCurrentInstallment(String(existingDebt.current_installment));
      setExtraPayments(existingDebt.extra_payments || []);
      setNotes(existingDebt.notes || '');
      setCashFlowId(existingDebt.cash_flow_id || '');
    }
  }, [existingDebt]);

  // Preview cuota calculation
  const previewPayment = useMemo(() => {
    const amount = parseNumberInput(amountDisplay);
    const rate = parseFloat(annualRate);
    const installments = parseInt(totalInstallments);
    if (amount <= 0 || rate <= 0 || installments <= 0) return null;

    const periodsPerYear = installmentPeriod === 'monthly' ? 12
      : installmentPeriod === 'quarterly' ? 4
      : installmentPeriod === 'semiannual' ? 2
      : 1;
    const periodicRate = (rate / 100) / periodsPerYear;
    const cuota = amount * periodicRate / (1 - Math.pow(1 + periodicRate, -installments));
    return Math.round(cuota * 100) / 100;
  }, [amountDisplay, annualRate, totalInstallments, installmentPeriod]);

  // Build a virtual Debt object from form state for calculations
  const virtualDebt = useMemo((): Debt | null => {
    const amount = parseNumberInput(amountDisplay);
    const rate = parseFloat(annualRate);
    const installments = parseInt(totalInstallments);
    if (amount <= 0 || rate <= 0 || installments <= 0 || !startDate) return null;

    return {
      id: existingDebt?.id || 'preview',
      name,
      creditor: creditor || null,
      original_amount: amount,
      annual_rate: rate,
      total_installments: installments,
      installment_period: installmentPeriod,
      start_date: startDate,
      current_installment: parseInt(currentInstallment) || 0,
      extra_payments: extraPayments,
      notes: notes || null,
      cash_flow_id: cashFlowId || null,
      created_by: '',
      created_at: '',
      updated_at: '',
    };
  }, [name, creditor, amountDisplay, annualRate, totalInstallments, installmentPeriod, startDate, currentInstallment, extraPayments, notes, cashFlowId, existingDebt]);

  const amortizationSchedule = useMemo(() => {
    if (!virtualDebt) return [];
    return calculateAmortization(virtualDebt);
  }, [virtualDebt]);

  const summary = useMemo(() => {
    if (!virtualDebt) return null;
    return getDebtSummary(virtualDebt);
  }, [virtualDebt]);

  // Simulation
  const simulation = useMemo(() => {
    const simValue = parseNumberInput(simAmount);
    if (!virtualDebt || simValue <= 0) return null;

    const currentInst = parseInt(currentInstallment) || 0;
    const withExtra = calculateAmortizationWithExtra(virtualDebt, {
      installment: currentInst + 1,
      amount: simValue,
    });
    const withoutExtra = amortizationSchedule;

    const totalInterestWithout = withoutExtra.reduce((s, e) => s + e.interest, 0);
    const totalInterestWith = withExtra.reduce((s, e) => s + e.interest, 0);
    const savedInterest = totalInterestWithout - totalInterestWith;
    const savedInstallments = withoutExtra.length - withExtra.length;
    const newEndDate = withExtra.length > 0 ? withExtra[withExtra.length - 1].date : '';

    return {
      savedInterest: Math.round(savedInterest * 100) / 100,
      savedInstallments,
      newEndDate,
      originalEndDate: withoutExtra.length > 0 ? withoutExtra[withoutExtra.length - 1].date : '',
      originalInstallments: withoutExtra.length,
      newInstallments: withExtra.length,
    };
  }, [virtualDebt, simAmount, currentInstallment, amortizationSchedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const amount = parseNumberInput(amountDisplay);
    const rate = parseFloat(annualRate);
    const installments = parseInt(totalInstallments);
    if (amount <= 0 || rate <= 0 || installments <= 0 || !startDate) return;

    const dto: DebtDTO = {
      name: name.trim(),
      creditor: creditor.trim() || undefined,
      originalAmount: amount,
      annualRate: rate,
      totalInstallments: installments,
      installmentPeriod,
      startDate,
      currentInstallment: parseInt(currentInstallment) || 0,
      extraPayments,
      notes: notes.trim() || undefined,
      cashFlowId: cashFlowId || null,
    };

    setIsSaving(true);
    try {
      if (isNew) {
        await createDebt.mutateAsync(dto);
      } else {
        await updateDebt.mutateAsync({ id, dto });
      }
      router.push('/dashboard/debts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!existingDebt) return;
    const current = parseInt(currentInstallment) || 0;
    const newCurrent = current + 1;
    if (newCurrent > existingDebt.total_installments) return;

    setCurrentInstallment(String(newCurrent));

    const dto: DebtDTO = {
      name,
      creditor: creditor || undefined,
      originalAmount: parseNumberInput(amountDisplay),
      annualRate: parseFloat(annualRate),
      totalInstallments: parseInt(totalInstallments),
      installmentPeriod,
      startDate,
      currentInstallment: newCurrent,
      extraPayments,
      notes: notes || undefined,
      cashFlowId: cashFlowId || null,
    };

    try {
      await updateDebt.mutateAsync({ id, dto });
    } catch {
      setCurrentInstallment(String(current));
    }
  };

  const handleAddExtraPayment = () => {
    const inst = parseInt(extraInstallment);
    const amount = parseNumberInput(extraAmountDisplay);
    if (!inst || amount <= 0) return;

    const newExtra: ExtraPayment = {
      installment: inst,
      amount,
      date: new Date().toISOString().split('T')[0],
    };
    setExtraPayments([...extraPayments, newExtra]);
    setShowExtraModal(false);
    setExtraInstallment('');
    setExtraAmountDisplay('');
  };

  const handleRemoveExtraPayment = (index: number) => {
    setExtraPayments(extraPayments.filter((_, i) => i !== index));
  };

  if (!isNew && isLoadingDebt) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/debts')} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Nueva Deuda' : `Editar: ${existingDebt?.name || ''}`}
          </h1>
          <p className="text-sm text-gray-500">
            {isNew ? 'Registra un nuevo crédito' : 'Administra la amortización de este crédito'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Datos del Crédito</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Crédito Bancolombia"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acreedor</label>
                    <input
                      type="text"
                      value={creditor}
                      onChange={(e) => setCreditor(e.target.value)}
                      placeholder="Ej: Bancolombia"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto Original *</label>
                    <input
                      type="text"
                      value={amountDisplay}
                      onChange={(e) => setAmountDisplay(e.target.value)}
                      onBlur={(e) => {
                        const val = parseNumberInput(e.target.value);
                        setAmountDisplay(val > 0 ? formatNumberInput(val) : '');
                      }}
                      placeholder="0"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Anual (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={annualRate}
                        onChange={(e) => setAnnualRate(e.target.value)}
                        placeholder="12"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">N° Cuotas *</label>
                      <input
                        type="number"
                        min="1"
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(e.target.value)}
                        placeholder="36"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Periodo de Cuota *</label>
                    <select
                      value={installmentPeriod}
                      onChange={(e) => setInstallmentPeriod(e.target.value as InstallmentPeriod)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {PERIOD_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas Ya Pagadas</label>
                    <input
                      type="number"
                      min="0"
                      max={totalInstallments || '999'}
                      value={currentInstallment}
                      onChange={(e) => setCurrentInstallment(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Flujo de Caja</label>
                    <select
                      value={cashFlowId}
                      onChange={(e) => setCashFlowId(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">— Ninguno —</option>
                      {cashFlows?.map((cf: any) => (
                        <option key={cf.id} value={cf.id}>{cf.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Observaciones..."
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Preview cuota */}
                {previewPayment && (
                  <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm">
                    <span className="text-blue-800 font-medium">Cuota estimada: </span>
                    <span className="text-blue-900 font-bold">{formatCurrency(previewPayment)}</span>
                  </div>
                )}

                {/* Save button */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button type="submit" isLoading={isSaving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {isNew ? 'Crear Deuda' : 'Guardar Cambios'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Extra Payments */}
            {!isNew && (
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Pagos Extra a Capital</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      setExtraInstallment(String((parseInt(currentInstallment) || 0) + 1));
                      setShowExtraModal(true);
                    }}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Agregar
                    </Button>
                  </div>

                  {extraPayments.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">
                      Sin pagos extra registrados
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {extraPayments.map((ep, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm">
                          <div>
                            <span className="text-green-800 font-medium">Cuota #{ep.installment}</span>
                            <span className="text-green-700 ml-2">{formatCurrency(ep.amount)}</span>
                            {ep.date && <span className="text-green-600 text-xs ml-2">{ep.date}</span>}
                          </div>
                          <button type="button" onClick={() => handleRemoveExtraPayment(i)} className="text-red-400 hover:text-red-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Amortization & Summary Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Summary Cards */}
            {summary && !isNew && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card padding="sm">
                  <CardContent>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-gray-500">Saldo Actual</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.currentBalance)}</p>
                  </CardContent>
                </Card>
                <Card padding="sm">
                  <CardContent>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-gray-500">Total Pagado</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalPaid)}</p>
                  </CardContent>
                </Card>
                <Card padding="sm">
                  <CardContent>
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-gray-500">Intereses Pagados</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalInterest)}</p>
                  </CardContent>
                </Card>
                <Card padding="sm">
                  <CardContent>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-gray-500">Cuotas Restantes</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{summary.remainingInstallments}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {summary && !isNew && summary.savingsFromExtra > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
                <span className="text-green-800 font-medium">Ahorro por pagos extra: </span>
                <span className="text-green-900 font-bold">{formatCurrency(summary.savingsFromExtra)}</span>
                <span className="text-green-700 ml-1">en intereses</span>
              </div>
            )}

            {/* Register Payment Button */}
            {!isNew && virtualDebt && (parseInt(currentInstallment) || 0) < parseInt(totalInstallments) && (
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={handleRegisterPayment}>
                  <Check className="h-4 w-4 mr-2" />
                  Registrar Pago de Cuota #{(parseInt(currentInstallment) || 0) + 1}
                </Button>
              </div>
            )}

            {/* Amortization Table */}
            {amortizationSchedule.length > 0 && (
              <Card padding="none">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Tabla de Amortización</h3>
                </div>
                <div className="overflow-auto max-h-[50vh] scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-2">#</th>
                        <th className="px-4 py-2">Fecha</th>
                        <th className="px-4 py-2 text-right">Cuota</th>
                        <th className="px-4 py-2 text-right">Capital</th>
                        <th className="px-4 py-2 text-right">Interés</th>
                        <th className="px-4 py-2 text-right">Pago Extra</th>
                        <th className="px-4 py-2 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {amortizationSchedule.map((entry) => (
                        <tr
                          key={entry.installment}
                          className={
                            entry.status === 'paid'
                              ? 'bg-green-50'
                              : entry.status === 'current'
                                ? 'bg-blue-50 font-medium'
                                : 'bg-white'
                          }
                        >
                          <td className="px-4 py-2 text-gray-600">{entry.installment}</td>
                          <td className="px-4 py-2 text-gray-600">{entry.date}</td>
                          <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(entry.payment)}</td>
                          <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(entry.principal)}</td>
                          <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(entry.interest)}</td>
                          <td className="px-4 py-2 text-right">
                            {entry.extraPayment > 0 ? (
                              <span className="text-green-700 font-medium">{formatCurrency(entry.extraPayment)}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(entry.remainingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-gray-700">Total</td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {formatCurrency(amortizationSchedule.reduce((s, e) => s + e.payment, 0))}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {formatCurrency(amortizationSchedule.reduce((s, e) => s + e.principal, 0))}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {formatCurrency(amortizationSchedule.reduce((s, e) => s + e.interest, 0))}
                        </td>
                        <td className="px-4 py-2 text-right text-green-700">
                          {formatCurrency(amortizationSchedule.reduce((s, e) => s + e.extraPayment, 0))}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}

            {/* Extra Payment Simulator */}
            {!isNew && virtualDebt && (
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Simulador de Pago Extra</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Simula cuánto ahorrarías si realizas un pago extra a capital en la próxima cuota.
                  </p>

                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Monto del pago extra</label>
                      <input
                        type="text"
                        value={simAmount}
                        onChange={(e) => setSimAmount(e.target.value)}
                        onBlur={(e) => {
                          const val = parseNumberInput(e.target.value);
                          setSimAmount(val > 0 ? formatNumberInput(val) : '');
                        }}
                        placeholder="Ej: 1.000.000"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {simulation && (
                    <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-purple-600 text-xs">Ahorro en intereses</p>
                          <p className="text-purple-900 font-bold text-lg">{formatCurrency(simulation.savedInterest)}</p>
                        </div>
                        <div>
                          <p className="text-purple-600 text-xs">Cuotas ahorradas</p>
                          <p className="text-purple-900 font-bold text-lg">{simulation.savedInstallments}</p>
                        </div>
                        <div>
                          <p className="text-purple-600 text-xs">Finalización sin pago extra</p>
                          <p className="text-purple-800 font-medium">{simulation.originalEndDate}</p>
                          <p className="text-purple-600 text-xs">({simulation.originalInstallments} cuotas)</p>
                        </div>
                        <div>
                          <p className="text-purple-600 text-xs">Finalización con pago extra</p>
                          <p className="text-purple-800 font-medium">{simulation.newEndDate}</p>
                          <p className="text-purple-600 text-xs">({simulation.newInstallments} cuotas)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>

      {/* Extra Payment Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowExtraModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg bg-white shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Pago Extra</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aplicar después de cuota #</label>
                <input
                  type="number"
                  min="1"
                  max={totalInstallments}
                  value={extraInstallment}
                  onChange={(e) => setExtraInstallment(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="text"
                  value={extraAmountDisplay}
                  onChange={(e) => setExtraAmountDisplay(e.target.value)}
                  onBlur={(e) => {
                    const val = parseNumberInput(e.target.value);
                    setExtraAmountDisplay(val > 0 ? formatNumberInput(val) : '');
                  }}
                  placeholder="0"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <Button type="button" variant="ghost" onClick={() => setShowExtraModal(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddExtraPayment}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

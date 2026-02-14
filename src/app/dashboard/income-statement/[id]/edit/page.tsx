// src/app/dashboard/income-statement/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Lightbulb, HelpCircle, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LabelWithTooltip } from '@/src/components/ui/Tooltip';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import {
  useIncomeStatement,
  useIncomeStatementItems,
  useUpdateIncomeStatement
} from '@/src/lib/hooks/useIncomeStatement';
import { useCashFlows } from '@/src/lib/hooks/useCashFlow';
import type { CashFlow } from '@/src/services/cash-flow.service';
import {
  INGRESOS_OPERACIONALES,
  COSTOS_VENTAS,
  GASTOS_OPERACIONALES,
  GASTOS_NO_OPERACIONALES,
  INGRESOS_NO_OPERACIONALES,
  type SimplifiedAccount,
} from '@/src/lib/constants/simplified-accounts';
import { formatCurrency } from '@/src/lib/utils';

export default function EditIncomeStatementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: incomeStatement, isLoading: isLoadingStatement } = useIncomeStatement(id);
  const { data: items, isLoading: isLoadingItems } = useIncomeStatementItems(id);
  const updateMutation = useUpdateIncomeStatement();
  const { data: cashFlows = [] } = useCashFlows();
  const [showImport, setShowImport] = useState(false);

  // Datos básicos
  const [statementName, setStatementName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [taxRate, setTaxRate] = useState(35);
  const [depreciationAmortization, setDepreciationAmortization] = useState(0);

  // Valores de las cuentas
  const [accountValues, setAccountValues] = useState<Record<string, number>>({});

  // Cargar datos cuando estén disponibles
  useEffect(() => {
    if (incomeStatement) {
      setStatementName(incomeStatement.name);
      setPeriodStart(incomeStatement.period_start.split('T')[0]);
      setPeriodEnd(incomeStatement.period_end.split('T')[0]);
      setFiscalYear(incomeStatement.fiscal_year);
      setTaxRate(incomeStatement.tax_rate);
      setDepreciationAmortization(incomeStatement.depreciation_amortization);
    }
  }, [incomeStatement]);

  useEffect(() => {
    if (items) {
      setAccountValues(items);
    }
  }, [items]);

  // Calcular totales
  const ingresos = INGRESOS_OPERACIONALES.reduce((sum, acc) => sum + (accountValues[acc.code] || 0), 0);
  const costos = COSTOS_VENTAS.reduce((sum, acc) => sum + (accountValues[acc.code] || 0), 0);
  const gastosOp = GASTOS_OPERACIONALES.reduce((sum, acc) => sum + (accountValues[acc.code] || 0), 0);
  const gastosNoOp = GASTOS_NO_OPERACIONALES.reduce((sum, acc) => sum + (accountValues[acc.code] || 0), 0);
  const ingresosNoOp = INGRESOS_NO_OPERACIONALES.reduce((sum, acc) => sum + (accountValues[acc.code] || 0), 0);

  // Calcular utilidades
  const utilidadBruta = ingresos - costos;
  const margenBruto = ingresos > 0 ? (utilidadBruta / ingresos) * 100 : 0;

  const utilidadOperacional = utilidadBruta - gastosOp;
  const margenOperacional = ingresos > 0 ? (utilidadOperacional / ingresos) * 100 : 0;

  // EBITDA = Utilidad Operacional + Depreciación y Amortización
  const ebitda = utilidadOperacional + depreciationAmortization;

  const utilidadAntesImpuestos = utilidadOperacional + ingresosNoOp - gastosNoOp;

  const impuestos = utilidadAntesImpuestos > 0 ? (utilidadAntesImpuestos * taxRate) / 100 : 0;
  const utilidadNeta = utilidadAntesImpuestos - impuestos;
  const margenNeto = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0;

  const handleAccountChange = (code: string, value: number) => {
    setAccountValues(prev => ({ ...prev, [code]: value }));
  };

  const handleImportCashFlow = (cashFlow: CashFlow) => {
    const periods = cashFlow.periods || [];
    if (periods.length === 0) return;

    const additionalItems = cashFlow.additional_items;

    let salesCollections = 0;
    let otherIncome = 0;
    let supplierPayments = 0;
    let payrollTotal = 0;
    let rentTotal = 0;
    let utilitiesTotal = 0;
    let otherExpensesTotal = 0;

    periods.forEach(p => {
      salesCollections += p.sales_collections;
      otherIncome += p.other_income;
      supplierPayments += p.supplier_payments;
      payrollTotal += p.payroll;
      rentTotal += p.rent;
      utilitiesTotal += p.utilities;
      otherExpensesTotal += p.other_expenses;
    });

    let additionalIncomeTotal = 0;
    let additionalExpenseTotal = 0;

    if (additionalItems) {
      (additionalItems.incomes || []).forEach(item => {
        Object.values(item.amounts).forEach(amt => {
          additionalIncomeTotal += Number(amt) || 0;
        });
      });
      (additionalItems.expenses || []).forEach(item => {
        Object.values(item.amounts).forEach(amt => {
          additionalExpenseTotal += Number(amt) || 0;
        });
      });
    }

    setAccountValues({
      '4135': salesCollections + additionalIncomeTotal,
      '4295': otherIncome,
      '6135': supplierPayments,
      '5105': payrollTotal,
      '5120': rentTotal,
      '5135': utilitiesTotal,
      '5205': otherExpensesTotal + additionalExpenseTotal,
    });

    // Auto-set period dates based on cash flow periods
    const sortedPeriods = [...periods].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    const firstPeriod = sortedPeriods[0];
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

    setPeriodStart(`${firstPeriod.year}-${String(firstPeriod.month).padStart(2, '0')}-01`);
    const lastDay = new Date(lastPeriod.year, lastPeriod.month, 0).getDate();
    setPeriodEnd(`${lastPeriod.year}-${String(lastPeriod.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);

    setFiscalYear(firstPeriod.year);
    setStatementName(`Estado de Resultados - ${cashFlow.name}`);
    setShowImport(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!statementName || !periodStart || !periodEnd) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (ingresos === 0) {
      alert('Debes ingresar al menos un valor en Ingresos');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        dto: {
          name: statementName,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          fiscalYear,
          taxRate,
          depreciationAmortization,
          accounts: accountValues,
        },
      });

      router.push('/dashboard/income-statement');
    } catch (error) {
      console.error('Error al actualizar estado de resultados:', error);
    }
  };

  const renderAccountSection = (
    title: string,
    accounts: SimplifiedAccount[],
    total: number,
    bgColor: string = 'bg-gray-50',
    icon?: React.ReactNode
  ) => (
    <div className={`rounded-lg ${bgColor} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {accounts.map((account) => (
          <div key={account.code} className="flex items-start gap-2">
            <div className="flex-1">
              <LabelWithTooltip
                label={account.name}
                tooltip={account.description}
                examples={account.examples}
                htmlFor={`account-${account.code}`}
              />
              <div className="mt-1">
                <CurrencyInput
                  id={`account-${account.code}`}
                  value={accountValues[account.code] || 0}
                  onChange={(value) => handleAccountChange(account.code, value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-300 pt-3">
        <span className="font-semibold text-gray-900">Total:</span>
        <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>
    </div>
  );

  const getAnalysis = () => {
    if (ingresos === 0) return null;

    const analysis = [];

    // Análisis de Margen Bruto
    if (margenBruto > 50) {
      analysis.push({
        type: 'success',
        message: `✓ Excelente margen bruto de ${margenBruto.toFixed(1)}%. Tus productos tienen buena rentabilidad.`,
      });
    } else if (margenBruto > 30) {
      analysis.push({
        type: 'warning',
        message: `⚠ Margen bruto de ${margenBruto.toFixed(1)}%. Podrías mejorar negociando mejores precios con proveedores.`,
      });
    } else {
      analysis.push({
        type: 'error',
        message: `⚠ Margen bruto bajo (${margenBruto.toFixed(1)}%). Revisa tus costos de producción urgentemente.`,
      });
    }

    // Análisis de Gastos Operacionales
    const porcentajeGastos = ingresos > 0 ? (gastosOp / ingresos) * 100 : 0;
    if (porcentajeGastos > 40) {
      analysis.push({
        type: 'warning',
        message: `⚠ Tus gastos operacionales representan el ${porcentajeGastos.toFixed(1)}% de tus ingresos. Busca oportunidades para reducir gastos.`,
      });
    } else if (porcentajeGastos > 25) {
      analysis.push({
        type: 'info',
        message: `→ Gastos operacionales al ${porcentajeGastos.toFixed(1)}% de ingresos. Está dentro del rango normal.`,
      });
    } else {
      analysis.push({
        type: 'success',
        message: `✓ Excelente control de gastos (${porcentajeGastos.toFixed(1)}% de ingresos). Estás operando eficientemente.`,
      });
    }

    // Análisis de Utilidad Neta
    if (utilidadNeta > 0) {
      if (margenNeto > 15) {
        analysis.push({
          type: 'success',
          message: `✓ Muy buena rentabilidad neta del ${margenNeto.toFixed(1)}%. Tu negocio está generando utilidades sólidas.`,
        });
      } else if (margenNeto > 5) {
        analysis.push({
          type: 'info',
          message: `→ Margen neto del ${margenNeto.toFixed(1)}%. Tu negocio es rentable, pero hay espacio para mejorar.`,
        });
      } else {
        analysis.push({
          type: 'warning',
          message: `⚠ Margen neto bajo (${margenNeto.toFixed(1)}%). Aunque hay utilidad, es muy ajustada.`,
        });
      }
    } else {
      analysis.push({
        type: 'error',
        message: `⚠ Tu negocio está generando pérdidas de ${formatCurrency(Math.abs(utilidadNeta))}. Necesitas tomar acciones correctivas.`,
      });
    }

    // Recomendaciones
    if (utilidadNeta < 0 || margenNeto < 5) {
      analysis.push({
        type: 'info',
        message: `💡 Recomendaciones: 1) Aumenta precios si el mercado lo permite, 2) Reduce costos negociando con proveedores, 3) Recorta gastos no esenciales.`,
      });
    }

    return analysis;
  };

  const analysis = getAnalysis();

  if (isLoadingStatement || isLoadingItems) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estado de resultados...</p>
        </div>
      </div>
    );
  }

  if (!incomeStatement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Estado de resultados no encontrado</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/income-statement')}>
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Estado de Resultados</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modifica los valores del estado de resultados
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Información del Período</CardTitle>
                <CardDescription>
                  Datos generales del estado de resultados
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImport(!showImport)}
              >
                <Download className="h-4 w-4 mr-2" />
                Importar desde Flujo de Caja
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showImport && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Selecciona un Flujo de Caja para importar
                </h4>
                <p className="text-xs text-blue-700 mb-3">
                  Los valores del flujo de caja se sumarán y asignarán a las cuentas correspondientes
                </p>
                {(cashFlows as CashFlow[]).length === 0 ? (
                  <p className="text-sm text-gray-500">No hay flujos de caja disponibles. Crea uno primero.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(cashFlows as CashFlow[]).map((cf) => (
                      <button
                        key={cf.id}
                        type="button"
                        onClick={() => handleImportCashFlow(cf)}
                        className="w-full text-left rounded-md bg-white p-3 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{cf.name}</p>
                        <p className="text-xs text-gray-500">
                          {cf.periods?.length || 0} periodos | Año: {cf.fiscal_year}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre del Estado de Resultados <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={statementName}
                onChange={(e) => setStatementName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Estado de Resultados Enero 2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="periodStart" className="block text-sm font-medium text-gray-700">
                  Fecha Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  id="periodStart"
                  type="date"
                  required
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="periodEnd" className="block text-sm font-medium text-gray-700">
                  Fecha Fin <span className="text-red-500">*</span>
                </label>
                <input
                  id="periodEnd"
                  type="date"
                  required
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label htmlFor="taxRate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Tasa de Impuestos (%) <span className="text-red-500">*</span>
                  <div className="group relative">
                    <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg -translate-x-1/2 left-1/2">
                      En Colombia, la tasa de impuesto de renta para empresas es del 35%. Puedes ajustarla según tu caso específico.
                    </div>
                  </div>
                </label>
                <input
                  id="taxRate"
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* INGRESOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">INGRESOS OPERACIONALES</CardTitle>
            <CardDescription>
              Dinero que entra por tu actividad principal (ventas de productos/servicios)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderAccountSection('Ingresos', INGRESOS_OPERACIONALES, ingresos, 'bg-green-50', <TrendingUp className="h-5 w-5 text-green-600" />)}
          </CardContent>
        </Card>

        {/* COSTOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">COSTOS DE VENTAS</CardTitle>
            <CardDescription>
              Lo que te costó producir o comprar lo que vendiste
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderAccountSection('Costos', COSTOS_VENTAS, costos, 'bg-orange-50', <TrendingDown className="h-5 w-5 text-orange-600" />)}

            {ingresos > 0 && (
              <div className="space-y-3">
                <div className="rounded-lg bg-blue-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-blue-900">UTILIDAD BRUTA</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-900">{formatCurrency(utilidadBruta)}</span>
                      <p className="text-sm text-blue-700">Margen: {margenBruto.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">¿Qué es la Utilidad Bruta?</p>
                      <p className="text-blue-800">
                        Es lo que ganas después de restar el costo de producir o comprar lo que vendiste.
                        Si vendes una camiseta en $100.000 y te costó $40.000 producirla, tu utilidad bruta es $60.000 (60%).
                        Este margen debe ser suficiente para cubrir todos tus gastos operacionales y dejarte ganancia.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GASTOS OPERACIONALES */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">GASTOS OPERACIONALES</CardTitle>
            <CardDescription>
              Gastos necesarios para operar tu negocio día a día
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderAccountSection('Gastos Operacionales', GASTOS_OPERACIONALES, gastosOp, 'bg-red-50', <TrendingDown className="h-5 w-5 text-red-600" />)}

            {ingresos > 0 && (
              <div className="space-y-3">
                <div className="rounded-lg bg-purple-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-purple-900">UTILIDAD OPERACIONAL</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-900">{formatCurrency(utilidadOperacional)}</span>
                      <p className="text-sm text-purple-700">Margen: {margenOperacional.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-sm text-purple-900">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">¿Qué es la Utilidad Operacional (EBIT)?</p>
                      <p className="text-purple-800">
                        Es la ganancia de tu negocio después de restar todos los gastos operativos (sueldos, arriendo, servicios, etc.).
                        También se conoce como EBIT (Earnings Before Interest and Taxes - Utilidad antes de Intereses e Impuestos).
                        Muestra si tu operación principal es rentable. Si tienes utilidad bruta de $60.000 y gastos de $30.000,
                        tu utilidad operacional es $30.000 (30%). Esta es la ganancia de tu actividad principal del negocio antes de
                        considerar intereses financieros e impuestos. Es útil para comparar empresas con diferentes estructuras de deuda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campo de Depreciación y Amortización */}
                <div className="rounded-lg bg-gray-100 p-4">
                  <LabelWithTooltip
                    htmlFor="depreciationAmortization"
                    label="Depreciación y Amortización"
                    tooltip="Valor de la depreciación de activos fijos y amortización de intangibles del período. Este valor se suma a la utilidad operacional para calcular el EBITDA."
                  />
                  <div className="mt-2">
                    <CurrencyInput
                      id="depreciationAmortization"
                      value={depreciationAmortization}
                      onChange={setDepreciationAmortization}
                      placeholder="0"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    Al agregar este valor, se calculará automáticamente el EBITDA sumando la Utilidad Operacional + Depreciación y Amortización
                  </p>
                </div>

                {/* EBITDA */}
                <div className="rounded-lg bg-cyan-100 p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-cyan-900">EBITDA</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-cyan-900">{formatCurrency(ebitda)}</span>
                      <p className="text-xs text-cyan-700">Earnings Before Interest, Taxes, Depreciation & Amortization</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-900">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">¿Qué es el EBITDA?</p>
                      <p className="text-cyan-800">
                        EBITDA (Earnings Before Interest, Taxes, Depreciation and Amortization) es la utilidad antes de intereses, impuestos, depreciación y amortización.
                        Se calcula sumando la Utilidad Operacional más la depreciación y amortización del período. Muestra el flujo de caja operativo real del negocio,
                        eliminando gastos contables que no implican salida de dinero (como depreciación). Es muy usado por inversionistas para valorar empresas.
                        Por ejemplo, si tu Utilidad Operacional es $30.000 y tu depreciación es $5.000, tu EBITDA es $35.000, que es el efectivo que realmente generó la operación.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OTROS INGRESOS Y GASTOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-700">OTROS INGRESOS Y GASTOS</CardTitle>
            <CardDescription>
              Ingresos y gastos que no son parte de tu actividad principal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderAccountSection('Otros Ingresos', INGRESOS_NO_OPERACIONALES, ingresosNoOp, 'bg-green-50')}
            {renderAccountSection('Gastos Financieros', GASTOS_NO_OPERACIONALES, gastosNoOp, 'bg-red-50')}

            {ingresos > 0 && (
              <div className="space-y-3">
                <div className="rounded-lg bg-indigo-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-indigo-900">UTILIDAD ANTES DE IMPUESTOS</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-indigo-900">{formatCurrency(utilidadAntesImpuestos)}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-indigo-300 flex items-center justify-between text-sm">
                    <span className="text-indigo-800">Impuestos ({taxRate}%):</span>
                    <span className="font-semibold text-indigo-800">{formatCurrency(impuestos)}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">¿Qué es la Utilidad Antes de Impuestos?</p>
                      <p className="text-indigo-800">
                        Es tu ganancia después de incluir otros ingresos (como intereses ganados) y restar gastos financieros
                        (como intereses de préstamos). Esta es la utilidad sobre la cual se calculan los impuestos. En Colombia,
                        las empresas pagan aproximadamente 35% de impuesto de renta sobre estas utilidades.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UTILIDAD NETA Y ANÁLISIS */}
        {ingresos > 0 && (
          <Card className={utilidadNeta > 0 ? 'border-green-500' : 'border-red-500'}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Utilidad Neta */}
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">UTILIDAD NETA</h3>
                      <p className="text-sm text-gray-600">Ganancia final después de impuestos</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${utilidadNeta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(utilidadNeta)}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        Margen Neto: {margenNeto.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/50 p-3 text-sm text-gray-800">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                      <div>
                        <p className="font-semibold mb-1">¿Qué es la Utilidad Neta?</p>
                        <p>
                          Es la ganancia real que te queda después de pagar TODOS los costos, gastos e impuestos.
                          Este es el dinero que realmente ganaste en el período. Por cada $100 que vendiste,
                          te quedan ${margenNeto.toFixed(2)} de ganancia neta. Este dinero puede reinvertirse en el negocio
                          o repartirse entre los socios.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumen de Márgenes */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <p className="text-sm font-medium text-gray-600">Margen Bruto</p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">{margenBruto.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4 text-center">
                    <p className="text-sm font-medium text-gray-600">Margen Operacional</p>
                    <p className="mt-2 text-2xl font-bold text-purple-600">{margenOperacional.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-4 text-center">
                    <p className="text-sm font-medium text-gray-600">Impuestos</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-600">{taxRate}%</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <p className="text-sm font-medium text-gray-600">Margen Neto</p>
                    <p className="mt-2 text-2xl font-bold text-green-600">{margenNeto.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Análisis Automático */}
                {analysis && analysis.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-gray-900">Análisis de tu Rentabilidad</h4>
                    </div>
                    {analysis.map((item, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-3 text-sm ${
                          item.type === 'success'
                            ? 'bg-green-50 text-green-800'
                            : item.type === 'warning'
                            ? 'bg-amber-50 text-amber-800'
                            : item.type === 'error'
                            ? 'bg-red-50 text-red-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {item.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={ingresos === 0 || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Estado de Resultados'}
          </Button>
        </div>
      </form>
    </div>
  );
}

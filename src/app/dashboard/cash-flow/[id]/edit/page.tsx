// src/app/dashboard/cash-flow/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Info, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useCashFlow, useUpdateCashFlow } from '@/src/lib/hooks/useCashFlow';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/src/lib/utils';
import type { CashFlowPeriodDTO } from '@/src/services/cash-flow.service';

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function EditCashFlowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: cashFlow, isLoading } = useCashFlow(id);
  const updateMutation = useUpdateCashFlow();

  const [cashFlowName, setCashFlowName] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  // Estado para cada mes (1-12)
  const [periods, setPeriods] = useState<Record<number, CashFlowPeriodDTO>>(
    Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [
        i + 1,
        {
          month: i + 1,
          year: fiscalYear,
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

  // Estado para valores formateados (display values)
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  // Pre-poblar el formulario con los datos existentes
  useEffect(() => {
    if (cashFlow) {
      setCashFlowName(cashFlow.name);
      setFiscalYear(cashFlow.fiscal_year);

      // Mapear los períodos existentes
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

      // Llenar los meses faltantes con valores vacíos
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
    }
  }, [cashFlow]);

  const handleValueChange = (month: number, field: keyof CashFlowPeriodDTO, value: number) => {
    setPeriods(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: value,
      },
    }));
  };

  const calculateMonthTotals = (month: number) => {
    const period = periods[month];
    const totalInflows = period.salesCollections + period.otherIncome;
    const totalOutflows =
      period.supplierPayments +
      period.payroll +
      period.rent +
      period.utilities +
      period.taxes +
      period.otherExpenses;
    const netCashFlow = totalInflows - totalOutflows;

    return { totalInflows, totalOutflows, netCashFlow };
  };

  const calculateYearTotals = () => {
    let totalInflows = 0;
    let totalOutflows = 0;

    for (let month = 1; month <= 12; month++) {
      const monthTotals = calculateMonthTotals(month);
      totalInflows += monthTotals.totalInflows;
      totalOutflows += monthTotals.totalOutflows;
    }

    return {
      totalInflows,
      totalOutflows,
      netCashFlow: totalInflows - totalOutflows,
    };
  };

  const yearTotals = calculateYearTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cashFlowName) {
      alert('Por favor ingresa un nombre para el flujo de caja');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        dto: {
          name: cashFlowName,
          fiscalYear,
          periods: Object.values(periods),
        },
      });

      router.push(`/dashboard/cash-flow/${id}`);
    } catch (error) {
      console.error('Error al actualizar flujo de caja:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando flujo de caja...</p>
        </div>
      </div>
    );
  }

  if (!cashFlow) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Flujo de caja no encontrado</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/cash-flow')}>
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
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Flujo de Caja</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modifica las entradas y salidas de efectivo mensuales
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Datos del flujo de caja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre del Flujo de Caja <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={cashFlowName}
                onChange={(e) => setCashFlowName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Flujo de Caja 2025"
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
                  // Actualizar el año en todos los períodos
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
          </CardContent>
        </Card>

        {/* Info sobre el formato */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Formato horizontal del flujo de caja</p>
                <p>
                  Modifica los valores mensuales en la tabla a continuación. Los totales se calcularán automáticamente.
                  Las entradas positivas indican dinero que entra al negocio, las salidas indican dinero que sale.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla horizontal de flujo de caja */}
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Caja Mensual - {fiscalYear}</CardTitle>
            <CardDescription>
              Valores en pesos colombianos (COP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="sticky left-0 bg-gray-100 border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 min-w-[180px]">
                      Concepto
                    </th>
                    {MONTHS.map((month, idx) => (
                      <th
                        key={idx}
                        className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-900 min-w-[100px]"
                      >
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
                    <td
                      colSpan={14}
                      className="border border-gray-300 px-3 py-2 font-bold text-green-800"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        ENTRADAS DE EFECTIVO
                      </div>
                    </td>
                  </tr>

                  <CashFlowRow
                    label="Cobros de Ventas"
                    field="salesCollections"
                    periods={periods}
                    onChange={handleValueChange}
                    yearTotal={Object.values(periods).reduce((sum, p) => sum + p.salesCollections, 0)}
                    displayValues={displayValues}
                    setDisplayValues={setDisplayValues}
                  />

                  <CashFlowRow
                    label="Otros Ingresos"
                    field="otherIncome"
                    periods={periods}
                    onChange={handleValueChange}
                    yearTotal={Object.values(periods).reduce((sum, p) => sum + p.otherIncome, 0)}
                    displayValues={displayValues}
                    setDisplayValues={setDisplayValues}
                  />

                  {/* Total Entradas */}
                  <tr className="bg-green-100 font-semibold">
                    <td className="sticky left-0 bg-green-100 border border-gray-300 px-3 py-2 text-green-800">
                      Total Entradas
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const totals = calculateMonthTotals(month);
                      return (
                        <td key={month} className="border border-gray-300 px-2 py-2 text-right text-green-800 font-semibold">
                          {formatCurrency(totals.totalInflows)}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 px-3 py-2 text-right bg-green-200 font-bold text-green-800">
                      {formatCurrency(yearTotals.totalInflows)}
                    </td>
                  </tr>

                  {/* SALIDAS DE EFECTIVO */}
                  <tr className="bg-red-50">
                    <td
                      colSpan={14}
                      className="border border-gray-300 px-3 py-2 font-bold text-red-800"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        SALIDAS DE EFECTIVO
                      </div>
                    </td>
                  </tr>

                  <CashFlowRow
                    label="Pagos a Proveedores"
                    field="supplierPayments"
                    periods={periods}
                    onChange={handleValueChange}
                    yearTotal={Object.values(periods).reduce((sum, p) => sum + p.supplierPayments, 0)}
                    displayValues={displayValues}
                    setDisplayValues={setDisplayValues}
                  />

                  <CashFlowRow
                    label="Nómina"
                    field="payroll"
                    periods={periods}
                    onChange={handleValueChange}
                    yearTotal={Object.values(periods).reduce((sum, p) => sum + p.payroll, 0)}
                    displayValues={displayValues}
                    setDisplayValues={setDisplayValues}
                  />

                  <CashFlowRow
                    label="Arriendo"
                    field="rent"
                    periods={periods}
                    onChange={handleValueChange}
                    yearTotal={Object.values(periods).reduce((sum, p) => sum + p.rent, 0)}
                    displayValues={displayValues}
                    setDisplayValues={setDisplayValues}
                  />

                  <CashFlowRow
                    label="Servicios Públicos"
                    field="utilities"
                    periods={periods}
                    onChange={handleValueChange}
                    yearTotal={Object.values(periods).reduce((sum, p) => sum + p.utilities, 0)}
                    displayValues={displayValues}
                    setDisplayValues={setDisplayValues}
                  />

                  <CashFlowRow
                    label="Impuestos"
                    field="taxes"
                    periods={periods}
                    onChange={handleValueChange}
                    yearTotal={Object.values(periods).reduce((sum, p) => sum + p.taxes, 0)}
                    displayValues={displayValues}
                    setDisplayValues={setDisplayValues}
                  />

                  <CashFlowRow
                    label="Otros Gastos"
                    field="otherExpenses"
                    periods={periods}
                    onChange={handleValueChange}
                    yearTotal={Object.values(periods).reduce((sum, p) => sum + p.otherExpenses, 0)}
                    displayValues={displayValues}
                    setDisplayValues={setDisplayValues}
                  />

                  {/* Total Salidas */}
                  <tr className="bg-red-100 font-semibold">
                    <td className="sticky left-0 bg-red-100 border border-gray-300 px-3 py-2 text-red-800">
                      Total Salidas
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const totals = calculateMonthTotals(month);
                      return (
                        <td key={month} className="border border-gray-300 px-2 py-2 text-right text-red-800 font-semibold">
                          {formatCurrency(totals.totalOutflows)}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 px-3 py-2 text-right bg-red-200 font-bold text-red-800">
                      {formatCurrency(yearTotals.totalOutflows)}
                    </td>
                  </tr>

                  {/* FLUJO NETO */}
                  <tr className="bg-blue-100 font-bold text-lg">
                    <td className={`sticky left-0 bg-blue-100 border border-gray-300 px-3 py-2 ${
                      yearTotals.netCashFlow < 0 ? 'text-red-800' : 'text-green-800'
                    }`}>
                      FLUJO NETO
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const totals = calculateMonthTotals(month);
                      const isNegative = totals.netCashFlow < 0;
                      return (
                        <td
                          key={month}
                          className={`border border-gray-300 px-2 py-2 text-right font-bold ${
                            isNegative ? 'text-red-800' : 'text-green-800'
                          }`}
                        >
                          {formatCurrency(totals.netCashFlow)}
                        </td>
                      );
                    })}
                    <td
                      className={`border border-gray-300 px-3 py-2 text-right bg-blue-200 font-bold ${
                        yearTotals.netCashFlow < 0 ? 'text-red-800' : 'text-green-800'
                      }`}
                    >
                      {formatCurrency(yearTotals.netCashFlow)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Análisis detallado y recomendaciones */}
            {yearTotals.totalInflows > 0 && (
              <div className="mt-6 space-y-4">
                {/* Resumen del flujo anual */}
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
                          <>
                            Tu negocio genera un flujo de caja operacional <strong className="text-green-700">positivo</strong> de{' '}
                            <strong>{formatCurrency(yearTotals.netCashFlow)}</strong> durante el año. Esto es excelente, indica que tus operaciones
                            generan más efectivo del que consumen.
                          </>
                        ) : (
                          <>
                            Tu negocio presenta un flujo de caja operacional <strong className="text-red-700">negativo</strong> de{' '}
                            <strong>{formatCurrency(Math.abs(yearTotals.netCashFlow))}</strong> durante el año. Esto significa que tus operaciones
                            están consumiendo más efectivo del que generan.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Análisis mensual */}
                {(() => {
                  const monthlyAnalysis = Array.from({ length: 12 }, (_, i) => i + 1).map(month => ({
                    month,
                    ...calculateMonthTotals(month)
                  }));
                  const positiveMonths = monthlyAnalysis.filter(m => m.netCashFlow > 0).length;
                  const negativeMonths = monthlyAnalysis.filter(m => m.netCashFlow < 0).length;
                  const avgMonthlyFlow = yearTotals.netCashFlow / 12;

                  return (
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Indicadores clave */}
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

                      {/* Recomendaciones */}
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="font-semibold text-amber-900 mb-3">Recomendaciones</p>
                        <div className="space-y-2 text-sm text-gray-700">
                          {negativeMonths > positiveMonths && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <p>
                                <strong>Crítico:</strong> Tienes más meses negativos ({negativeMonths}) que positivos ({positiveMonths}).
                                Prioriza reducir gastos operativos o aumentar las ventas.
                              </p>
                            </div>
                          )}

                          {yearTotals.totalOutflows > yearTotals.totalInflows * 0.9 && yearTotals.netCashFlow >= 0 && (
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p>
                                <strong>Atención:</strong> Tus salidas representan más del 90% de tus entradas.
                                Aunque el flujo es positivo, el margen es ajustado. Busca optimizar costos.
                              </p>
                            </div>
                          )}

                          {positiveMonths >= 9 && yearTotals.netCashFlow > 0 && (
                            <div className="flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p>
                                <strong>Excelente:</strong> Tu negocio muestra consistencia con {positiveMonths} meses positivos.
                                Considera invertir el excedente en crecimiento o crear un fondo de reserva.
                              </p>
                            </div>
                          )}

                          {yearTotals.netCashFlow < 0 && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <p>
                                <strong>Urgente:</strong> Analiza los meses con mayor déficit y determina si los gastos son temporales
                                o estructurales. Puede requerir ajuste de precios, reducción de costos o refinanciación.
                              </p>
                            </div>
                          )}

                          {positiveMonths >= 6 && negativeMonths >= 6 && (
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p>
                                Tienes flujos irregulares entre meses. Identifica patrones estacionales y planifica mejor
                                los gastos en meses de baja generación de efectivo.
                              </p>
                            </div>
                          )}

                          {avgMonthlyFlow > 0 && avgMonthlyFlow < yearTotals.totalInflows * 0.05 && (
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p>
                                Tu flujo promedio mensual es bajo (menos del 5% de ingresos). Evalúa oportunidades para
                                mejorar márgenes o reducir gastos fijos.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Flujo de Caja'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Componente auxiliar para las filas de la tabla
function CashFlowRow({
  label,
  field,
  periods,
  onChange,
  yearTotal,
  displayValues,
  setDisplayValues,
}: {
  label: string;
  field: keyof CashFlowPeriodDTO;
  periods: Record<number, CashFlowPeriodDTO>;
  onChange: (month: number, field: keyof CashFlowPeriodDTO, value: number) => void;
  yearTotal: number;
  displayValues: Record<string, string>;
  setDisplayValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="sticky left-0 bg-white hover:bg-gray-50 border border-gray-300 px-3 py-2 font-medium text-gray-700">
        {label}
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
                const inputValue = e.target.value;
                setDisplayValues(prev => ({ ...prev, [inputKey]: inputValue }));

                const numericValue = parseNumberInput(inputValue);
                onChange(month, field, numericValue);
              }}
              onBlur={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                if (numericValue > 0) {
                  setDisplayValues(prev => ({ ...prev, [inputKey]: formatNumberInput(numericValue) }));
                } else {
                  setDisplayValues(prev => ({ ...prev, [inputKey]: '' }));
                }
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

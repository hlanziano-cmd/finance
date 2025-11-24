// src/app/dashboard/cash-flow/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useCashFlow, useCashFlowHealthAnalysis } from '@/src/lib/hooks/useCashFlow';
import { formatCurrency } from '@/src/lib/utils';
import { exportCashFlowToPDF } from '@/src/lib/utils/pdf-export';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CashFlowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: cashFlow, isLoading } = useCashFlow(id);
  const { data: healthAnalysis } = useCashFlowHealthAnalysis(id);

  const handleExportPDF = () => {
    if (cashFlow) {
      exportCashFlowToPDF(cashFlow);
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

  const periods = cashFlow.periods || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cashFlow.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Año Fiscal {cashFlow.fiscal_year}
            </p>
          </div>
        </div>
        <Button onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      {/* Health Score */}
      {healthAnalysis && (
        <Card className={`border-2 ${healthAnalysis.healthScore >= 70 ? 'border-green-500' : healthAnalysis.healthScore >= 40 ? 'border-yellow-500' : 'border-red-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  healthAnalysis.healthScore >= 70 ? 'bg-green-100' : healthAnalysis.healthScore >= 40 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      healthAnalysis.healthScore >= 70 ? 'text-green-700' : healthAnalysis.healthScore >= 40 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {Math.round(healthAnalysis.healthScore)}
                    </div>
                    <div className="text-xs text-gray-600">Salud</div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Análisis de Salud Financiera</h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Flujo Promedio</p>
                    <p className={`text-lg font-semibold ${healthAnalysis.averageNetFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(healthAnalysis.averageNetFlow)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meses Positivos</p>
                    <p className="text-lg font-semibold text-green-600">
                      {healthAnalysis.positiveMonths} de {periods.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meses Negativos</p>
                    <p className="text-lg font-semibold text-red-600">
                      {healthAnalysis.negativeMonths} de {periods.length}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {healthAnalysis.recommendations.map((rec, idx) => {
                    const isPositive = rec.includes('Excelente') || rec.includes('¡');
                    const isWarning = rec.includes('Preocupante') || rec.includes('negativo');

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-3 rounded-lg ${
                          isPositive ? 'bg-green-50 text-green-900' :
                          isWarning ? 'bg-red-50 text-red-900' :
                          'bg-blue-50 text-blue-900'
                        }`}
                      >
                        {isPositive ? (
                          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        ) : isWarning ? (
                          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        ) : (
                          <TrendingUp className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        )}
                        <p className="text-sm">{rec}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Flujo de Caja */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Caja Mensual</CardTitle>
          <CardDescription>Vista detallada de entradas y salidas por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Mes</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-green-700">Entradas</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-red-700">Salidas</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-blue-700">Flujo Neto</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-purple-700">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">
                      {MONTH_NAMES[period.month - 1]} {period.year}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-green-600">
                      {formatCurrency(period.total_inflows)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-red-600">
                      {formatCurrency(period.total_outflows)}
                    </td>
                    <td className={`border border-gray-300 px-3 py-2 text-right font-semibold ${
                      period.net_cash_flow >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(period.net_cash_flow)}
                    </td>
                    <td className={`border border-gray-300 px-3 py-2 text-right font-semibold ${
                      period.cumulative_cash_flow >= 0 ? 'text-purple-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(period.cumulative_cash_flow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desglose detallado */}
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-gray-900">Desglose Detallado</h4>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Entradas */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Entradas de Efectivo
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Cobros de Ventas:</span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.sales_collections, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Otros Ingresos:</span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.other_income, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-green-300 pt-2">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-green-800">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.total_inflows, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Salidas */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Salidas de Efectivo
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Proveedores:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.supplier_payments, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Nómina:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.payroll, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Arriendo:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.rent, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Servicios:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.utilities, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Impuestos:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.taxes, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Otros Gastos:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.other_expenses, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-red-300 pt-2">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-red-800">
                      {formatCurrency(periods.reduce((sum, p) => sum + p.total_outflows, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

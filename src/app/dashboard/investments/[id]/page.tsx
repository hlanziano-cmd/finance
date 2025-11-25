// src/app/dashboard/investments/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, PieChart, Download, DollarSign, Target, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useInvestmentSimulation } from '@/src/lib/hooks/useInvestment';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import type { RiskProfile } from '@/src/types/models';

// Risk Profile Badge Component
function RiskProfileBadge({ profile }: { profile: RiskProfile }) {
  const config = {
    conservative: { label: 'Conservador', className: 'bg-blue-500 text-white' },
    moderate: { label: 'Moderado', className: 'bg-yellow-500 text-white' },
    aggressive: { label: 'Agresivo', className: 'bg-red-500 text-white' },
  };

  const { label, className } = config[profile];
  return <Badge className={className}>{label}</Badge>;
}

export default function InvestmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: simulation, isLoading } = useInvestmentSimulation(id);

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('Exportación PDF próximamente');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando simulación...</p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Simulación no encontrada</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/investments')}>
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  const projections12M = simulation.projections.twelveMonths;
  const returnRate12M = ((projections12M.totalAmount - simulation.initialAmount) / simulation.initialAmount) * 100;

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
            <h1 className="text-3xl font-bold text-gray-900">{simulation.name}</h1>
            <div className="flex gap-2 mt-2">
              <RiskProfileBadge profile={simulation.riskProfile} />
              {simulation.sourceType === 'cashflow' && (
                <Badge className="bg-green-600 text-white">Flujo de Caja</Badge>
              )}
              {simulation.diversificationStrategy && (
                <Badge className="bg-purple-600 text-white">Diversificado</Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Capital Inicial</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(simulation.initialAmount)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total a 12M</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(projections12M.totalAmount)}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Ganancia 12M</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(projections12M.earnings)}
                </p>
              </div>
              <Target className="h-12 w-12 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Retorno Anual</p>
                <p className="text-3xl font-bold text-orange-900">
                  {returnRate12M.toFixed(1)}%
                </p>
              </div>
              <Calendar className="h-12 w-12 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projections Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Proyecciones de Inversión</CardTitle>
          <CardDescription>Rendimientos esperados en diferentes horizontes temporales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* 3 Months */}
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-900">3 Meses</h3>
                <Badge className="bg-blue-600 text-white">Corto Plazo</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-blue-700">Capital Final</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(simulation.projections.threeMonths.totalAmount)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-blue-700">Ganancia</p>
                    <p className="font-semibold text-blue-900">
                      {formatCurrency(simulation.projections.threeMonths.earnings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Retorno</p>
                    <p className="font-semibold text-blue-900">
                      {simulation.projections.threeMonths.effectiveRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Months */}
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-green-900">6 Meses</h3>
                <Badge className="bg-green-600 text-white">Mediano Plazo</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-700">Capital Final</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(simulation.projections.sixMonths.totalAmount)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-green-700">Ganancia</p>
                    <p className="font-semibold text-green-900">
                      {formatCurrency(simulation.projections.sixMonths.earnings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700">Retorno</p>
                    <p className="font-semibold text-green-900">
                      {simulation.projections.sixMonths.effectiveRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 12 Months */}
            <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-purple-900">12 Meses</h3>
                <Badge className="bg-purple-600 text-white">Largo Plazo</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-purple-700">Capital Final</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(simulation.projections.twelveMonths.totalAmount)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-purple-700">Ganancia</p>
                    <p className="font-semibold text-purple-900">
                      {formatCurrency(simulation.projections.twelveMonths.earnings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-700">Retorno</p>
                    <p className="font-semibold text-purple-900">
                      {simulation.projections.twelveMonths.effectiveRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Allocation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asignación de Portafolio</CardTitle>
              <CardDescription>
                {simulation.diversificationStrategy ? (
                  <>
                    Estrategia:{' '}
                    {simulation.diversificationStrategy === 'equal' && 'Distribución Igual'}
                    {simulation.diversificationStrategy === 'risk-weighted' && 'Ponderada por Riesgo'}
                    {simulation.diversificationStrategy === 'return-optimized' && 'Optimizada por Retorno'}
                  </>
                ) : (
                  'Selección Manual de Productos'
                )}
              </CardDescription>
            </div>
            <PieChart className="h-8 w-8 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Visual Allocation Bar */}
            <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
              {simulation.selectedProducts.map((product, idx) => {
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-purple-500',
                  'bg-yellow-500',
                  'bg-red-500',
                  'bg-indigo-500',
                  'bg-pink-500',
                  'bg-orange-500'
                ];
                return (
                  <div
                    key={product.productId}
                    className={`${colors[idx % colors.length]} flex items-center justify-center text-white text-xs font-semibold`}
                    style={{ width: `${product.percentage}%` }}
                  >
                    {product.percentage >= 10 && `${product.percentage.toFixed(0)}%`}
                  </div>
                );
              })}
            </div>

            {/* Product Details */}
            <div className="grid gap-4 md:grid-cols-2">
              {simulation.selectedProducts.map((product, idx) => {
                const colors = [
                  { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900' },
                  { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900' },
                  { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900' },
                  { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900' },
                  { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900' },
                ];
                const color = colors[idx % colors.length];

                return (
                  <div
                    key={product.productId}
                    className={`p-4 rounded-lg border-2 ${color.border} ${color.bg}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className={`font-semibold ${color.text}`}>{product.productName}</p>
                      </div>
                      <Badge className="bg-gray-700 text-white">
                        {product.expectedReturn.toFixed(1)}% anual
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">Porcentaje</p>
                        <p className={`text-lg font-bold ${color.text}`}>
                          {product.percentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Monto</p>
                        <p className={`text-lg font-bold ${color.text}`}>
                          {formatCurrency(product.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-xs text-gray-600">Ganancia Estimada (12M)</p>
                      <p className={`text-sm font-semibold ${color.text}`}>
                        {formatCurrency((product.amount * product.expectedReturn) / 100)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Investment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Inversión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Perfil de Riesgo</span>
              <RiskProfileBadge profile={simulation.riskProfile} />
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Fuente de Fondos</span>
              <span className="font-semibold">
                {simulation.sourceType === 'cashflow' ? 'Flujo de Caja' : 'Monto Manual'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Productos</span>
              <span className="font-semibold">{simulation.selectedProducts.length}</span>
            </div>
            {simulation.diversificationStrategy && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Estrategia</span>
                <span className="font-semibold">
                  {simulation.diversificationStrategy === 'equal' && 'Igual'}
                  {simulation.diversificationStrategy === 'risk-weighted' && 'Por Riesgo'}
                  {simulation.diversificationStrategy === 'return-optimized' && 'Por Retorno'}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Creada</span>
              <span className="font-semibold">{formatDate(simulation.createdAt)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Actualizada</span>
              <span className="font-semibold">{formatDate(simulation.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            {simulation.notes ? (
              <p className="text-gray-700 whitespace-pre-wrap">{simulation.notes}</p>
            ) : (
              <p className="text-gray-400 italic">No hay notas para esta simulación</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Comparativo</CardTitle>
          <CardDescription>Comparación de proyecciones en diferentes periodos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Periodo</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Capital Inicial</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-green-700">Ganancia</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-blue-700">Capital Final</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-purple-700">Retorno %</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-medium">3 Meses</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {formatCurrency(simulation.initialAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-green-600 font-semibold">
                    {formatCurrency(simulation.projections.threeMonths.earnings)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-blue-600 font-semibold">
                    {formatCurrency(simulation.projections.threeMonths.totalAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-purple-600 font-semibold">
                    {simulation.projections.threeMonths.effectiveRate.toFixed(2)}%
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-medium">6 Meses</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {formatCurrency(simulation.initialAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-green-600 font-semibold">
                    {formatCurrency(simulation.projections.sixMonths.earnings)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-blue-600 font-semibold">
                    {formatCurrency(simulation.projections.sixMonths.totalAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-purple-600 font-semibold">
                    {simulation.projections.sixMonths.effectiveRate.toFixed(2)}%
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 bg-purple-50">
                  <td className="border border-gray-300 px-3 py-2 font-bold">12 Meses</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                    {formatCurrency(simulation.initialAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-green-700 font-bold">
                    {formatCurrency(simulation.projections.twelveMonths.earnings)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-blue-700 font-bold">
                    {formatCurrency(simulation.projections.twelveMonths.totalAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-purple-700 font-bold">
                    {simulation.projections.twelveMonths.effectiveRate.toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

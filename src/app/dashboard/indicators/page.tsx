// src/app/dashboard/indicators/page.tsx
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { useOrganization } from '@/src/lib/hooks/useOrganization';
import { useLatestIndicators } from '@/src/lib/hooks/useFinancialIndicators';
import { formatCurrency, formatPercentage, getRiskColor, getHealthScoreColor } from '@/src/lib/utils';

export default function IndicatorsPage() {
  const { currentOrganization } = useOrganization();
  const { data: indicators, isLoading } = useLatestIndicators(currentOrganization?.id || '');

  if (!currentOrganization) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No hay organización seleccionada</CardTitle>
            <CardDescription>
              Selecciona una organización para ver sus indicadores.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando indicadores...</p>
        </div>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <CardTitle className="mt-4">No hay indicadores disponibles</CardTitle>
            <CardDescription>
              Crea un balance general y un estado de resultados para calcular indicadores.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Indicadores Financieros</h1>
        <p className="mt-1 text-sm text-gray-500">
          Análisis detallado del desempeño financiero de {currentOrganization.name}
        </p>
      </div>

      {/* Health Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Health Score General</p>
              <p className={`mt-2 text-5xl font-bold ${getHealthScoreColor(indicators.healthScore)}`}>
                {indicators.healthScore}/100
              </p>
              <div className="mt-4">
                <Badge className={getRiskColor(indicators.riskLevel)}>
                  Nivel de riesgo: {indicators.riskLevel}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Período</p>
              <p className="text-sm font-medium">
                {indicators.periodStart.toLocaleDateString()} - {indicators.periodEnd.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liquidez */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Indicadores de Liquidez</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Capital de Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(indicators.workingCapital)}
                </p>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Activo Corriente - Pasivo Corriente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Razón Corriente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {indicators.currentRatio.toFixed(2)}
                </p>
                <Percent className="h-8 w-8 text-green-600" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {indicators.currentRatio >= 1.5 ? 'Buena liquidez' : 'Liquidez limitada'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Prueba Ácida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {indicators.acidTest.toFixed(2)}
                </p>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {indicators.acidTest >= 1 ? 'Liquidez inmediata buena' : 'Mejorar liquidez'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rentabilidad */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Indicadores de Rentabilidad</h2>
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Margen Bruto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(indicators.grossMargin)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Margen Operativo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(indicators.operatingMargin)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Margen Neto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(indicators.netMargin)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">ROE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(indicators.roe)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Retorno sobre Patrimonio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">ROA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(indicators.roa)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Retorno sobre Activos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Endeudamiento */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Indicadores de Endeudamiento</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Ratio de Deuda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(indicators.debtRatio)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {indicators.debtRatio < 0.5 ? 'Endeudamiento bajo' : 'Endeudamiento alto'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Deuda/Patrimonio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.debtToEquity.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Veces que la deuda supera al patrimonio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Apalancamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.financialLeverage.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Apalancamiento financiero
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Eficiencia */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Indicadores de Eficiencia</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Rotación de Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.assetTurnover.toFixed(2)}x
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Rotación de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.inventoryTurnover?.toFixed(2) ?? 'N/A'}x
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Días de Cobro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.receivablesDays ?? 'N/A'} días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Días de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {indicators.payablesDays ?? 'N/A'} días
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Otros */}
      {indicators.ebitda && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Otros Indicadores</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">EBITDA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(indicators.ebitda)}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Utilidad antes de intereses, impuestos, depreciación y amortización
                </p>
              </CardContent>
            </Card>

            {indicators.breakEvenPoint && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Punto de Equilibrio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(indicators.breakEvenPoint)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Ventas necesarias para cubrir costos
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

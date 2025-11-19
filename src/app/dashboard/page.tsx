// src/app/dashboard/page.tsx
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { useOrganization } from '@/src/lib/hooks/useOrganization';
import { useOrganizationSummary } from '@/src/lib/hooks/useFinancialIndicators';
import { formatCurrency, formatPercentage, getRiskColor, getHealthScoreColor } from '@/src/lib/utils';

export default function DashboardPage() {
  const { currentOrganization } = useOrganization();
  const { data: summary, isLoading } = useOrganizationSummary(currentOrganization?.id || '');

  if (!currentOrganization) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Bienvenido a Fluxi Finance</CardTitle>
            <CardDescription>
              Selecciona una organización para comenzar o crea una nueva.
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
          <p className="mt-2 text-sm text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vista general del estado financiero de {currentOrganization.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Health Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Score</p>
                <p className={`mt-2 text-3xl font-bold ${summary?.healthScore ? getHealthScoreColor(summary.healthScore) : 'text-gray-400'}`}>
                  {summary?.healthScore ?? '--'}/100
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {summary?.riskLevel && (
              <div className="mt-4">
                <Badge className={getRiskColor(summary.riskLevel as any)}>
                  Riesgo {summary.riskLevel}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Ratio */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Razón Corriente</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {summary?.currentRatio ? summary.currentRatio.toFixed(2) : '--'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              {summary?.currentRatio && summary.currentRatio >= 1.5 ? 'Buena liquidez' : 'Mejorar liquidez'}
            </p>
          </CardContent>
        </Card>

        {/* Net Margin */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margen Neto</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {summary?.netMargin ? formatPercentage(summary.netMargin) : '--'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                {summary?.netMargin && summary.netMargin > 0 ? (
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-purple-600" />
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Rentabilidad {summary?.netMargin && summary.netMargin > 0.1 ? 'alta' : 'baja'}
            </p>
          </CardContent>
        </Card>

        {/* ROE */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ROE</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {summary?.roe ? formatPercentage(summary.roe) : '--'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Retorno sobre patrimonio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos documentos y actualizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <p className="text-sm font-medium">Balance General Q4 2024</p>
                  <p className="text-xs text-gray-500">Creado hace 2 días</p>
                </div>
                <Badge variant="success">Final</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <p className="text-sm font-medium">Estado de Resultados Q4 2024</p>
                  <p className="text-xs text-gray-500">Creado hace 3 días</p>
                </div>
                <Badge variant="warning">Draft</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Indicadores Financieros</p>
                  <p className="text-xs text-gray-500">Calculados hace 5 días</p>
                </div>
                <Badge variant="info">Calculado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Organización</CardTitle>
            <CardDescription>Detalles y estadísticas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Plan de Suscripción</span>
                <Badge variant="info">{currentOrganization.subscriptionPlan}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <Badge variant={currentOrganization.subscriptionStatus === 'active' ? 'success' : 'warning'}>
                  {currentOrganization.subscriptionStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Balances Registrados</span>
                <span className="text-sm font-medium">{summary?.balanceSheetsCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estados de Resultados</span>
                <span className="text-sm font-medium">{summary?.incomeStatementsCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Miembros del Equipo</span>
                <span className="text-sm font-medium">{summary?.activeMembersCount ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

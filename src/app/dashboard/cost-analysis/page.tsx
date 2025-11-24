// src/app/dashboard/cost-analysis/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, TrendingUp, DollarSign, Package, Info, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useCostAnalyses, useDeleteCostAnalysis } from '@/src/lib/hooks/useCostAnalysis';
import { CostAnalysisService } from '@/src/services/cost-analysis.service';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import type { CostAnalysis } from '@/src/types/models';

// Tooltip Component
interface TooltipCardProps {
  title: string;
  description: string;
  onClose: () => void;
}

function TooltipCard({ title, description, onClose }: TooltipCardProps) {
  return (
    <div className="absolute z-[9999] top-full left-0 mt-2 bg-white border-2 border-blue-300 rounded-lg shadow-xl p-4 w-96 max-w-[90vw]">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-blue-900 text-sm">{title}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2">
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}

export default function CostAnalysisPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const { data: analyses, isLoading } = useCostAnalyses();
  const deleteMutation = useDeleteCostAnalysis();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleDelete = async (id: string, productName: string) => {
    if (confirm(`¿Estás seguro de eliminar el análisis de "${productName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const calculateQuickMetrics = (analysis: CostAnalysis) => {
    const service = new CostAnalysisService(supabase);
    return service.calculateAnalysis(analysis);
  };

  const tooltips = {
    costAnalysis: {
      title: 'Análisis de Costos',
      description: 'El análisis de costos te ayuda a entender la estructura de costos de tus productos, calcular el punto de equilibrio y tomar decisiones informadas sobre precios y producción. Es fundamental para la rentabilidad de tu negocio.'
    },
    breakEven: {
      title: 'Punto de Equilibrio',
      description: 'Es la cantidad de unidades que debes vender para cubrir todos tus costos (fijos y variables). Por debajo de este punto pierdes dinero, por encima generas ganancias. Es crítico conocerlo para establecer metas de ventas realistas.'
    },
    contributionMargin: {
      title: 'Margen de Contribución',
      description: 'Es la diferencia entre el precio de venta y el costo variable unitario. Representa cuánto contribuye cada unidad vendida a cubrir los costos fijos y generar utilidad. Un margen alto indica mayor rentabilidad por unidad.'
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="relative">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">Análisis de Costos</h1>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'costAnalysis' ? null : 'costAnalysis')}
                className="text-blue-400 hover:text-blue-600"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
            {activeTooltip === 'costAnalysis' && (
              <TooltipCard
                title={tooltips.costAnalysis.title}
                description={tooltips.costAnalysis.description}
                onClose={() => setActiveTooltip(null)}
              />
            )}
            <p className="mt-1 text-sm text-gray-500">
              Gestiona y analiza los costos de tus productos
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/dashboard/cost-analysis/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Productos</p>
                <p className="text-3xl font-bold text-blue-900">{analyses?.length || 0}</p>
              </div>
              <Package className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Productos Rentables</p>
                <p className="text-3xl font-bold text-green-900">
                  {analyses?.filter(a => {
                    const calc = calculateQuickMetrics(a);
                    return calc.currentMonthlyProfit > 0;
                  }).length || 0}
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
                <p className="text-sm font-medium text-purple-700">Ingreso Mensual Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(
                    analyses?.reduce((sum, a) => {
                      const calc = calculateQuickMetrics(a);
                      return sum + calc.currentMonthlyRevenue;
                    }, 0) || 0
                  )}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      {!analyses || analyses.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay productos registrados
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Comienza creando tu primer análisis de costos para entender la rentabilidad de tus productos
              </p>
              <Button onClick={() => router.push('/dashboard/cost-analysis/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Producto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => {
            const calculations = calculateQuickMetrics(analysis);
            const isProfitable = calculations.currentMonthlyProfit > 0;
            const isAboveBreakEven = analysis.currentMonthlyUnits >= calculations.breakEvenUnits;

            return (
              <Card
                key={analysis.id}
                className={`relative transition-all hover:shadow-lg ${
                  isProfitable ? 'border-2 border-green-300' : 'border-2 border-gray-300'
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{analysis.productName}</CardTitle>
                      {analysis.productDescription && (
                        <CardDescription className="mt-1 text-xs">
                          {analysis.productDescription}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      className={`ml-2 ${
                        analysis.status === 'final'
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}
                    >
                      {analysis.status === 'final' ? 'Final' : 'Borrador'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Pricing Info */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700 font-semibold">Precio de Venta</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(analysis.unitPrice)}</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Punto Equilibrio</p>
                        <p className="text-sm font-bold text-gray-900">
                          {calculations.breakEvenUnits.toLocaleString()} un.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Margen Contrib.</p>
                        <p className="text-sm font-bold text-gray-900">
                          {(calculations.contributionMarginRatio * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Current Sales */}
                    <div className={`p-3 rounded-lg ${
                      isProfitable ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <p className={`text-xs font-bold mb-1 ${isProfitable ? 'text-green-900' : 'text-red-900'}`}>
                        Ventas Actuales: {analysis.currentMonthlyUnits.toLocaleString()} un/mes
                      </p>
                      <p className={`text-lg font-bold ${isProfitable ? 'text-green-900' : 'text-red-900'}`}>
                        Utilidad: {formatCurrency(calculations.currentMonthlyProfit)}
                      </p>
                      {!isAboveBreakEven && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ Por debajo del punto de equilibrio
                        </p>
                      )}
                    </div>

                    {/* Fiscal Year Info */}
                    <div className="text-xs text-gray-500 pt-2 border-t text-center">
                      <span>Año Fiscal {analysis.fiscalYear}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/cost-analysis/${analysis.id}`)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/cost-analysis/${analysis.id}/edit`)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(analysis.id, analysis.productName)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Educational Section */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-900">¿Por qué es importante el análisis de costos?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative bg-white p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setActiveTooltip(activeTooltip === 'breakEven' ? null : 'breakEven')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Punto de Equilibrio</h4>
                  <p className="text-sm text-gray-600">
                    Conoce cuántas unidades debes vender para no perder ni ganar dinero
                  </p>
                </div>
              </div>
              {activeTooltip === 'breakEven' && (
                <TooltipCard
                  title={tooltips.breakEven.title}
                  description={tooltips.breakEven.description}
                  onClose={() => setActiveTooltip(null)}
                />
              )}
            </div>

            <div className="relative bg-white p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setActiveTooltip(activeTooltip === 'contributionMargin' ? null : 'contributionMargin')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Margen de Contribución</h4>
                  <p className="text-sm text-gray-600">
                    Entiende cuánto aporta cada venta a cubrir tus costos fijos y generar utilidad
                  </p>
                </div>
              </div>
              {activeTooltip === 'contributionMargin' && (
                <TooltipCard
                  title={tooltips.contributionMargin.title}
                  description={tooltips.contributionMargin.description}
                  onClose={() => setActiveTooltip(null)}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// src/app/dashboard/investments/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, DollarSign, Target, Info, ArrowLeft, Eye, Edit, Trash2, PieChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useInvestmentSimulations, useDeleteInvestmentSimulation } from '@/src/lib/hooks/useInvestment';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import type { InvestmentSimulation, RiskProfile } from '@/src/types/models';

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

export default function InvestmentsPage() {
  const router = useRouter();
  const { data: simulations, isLoading } = useInvestmentSimulations();
  const deleteMutation = useDeleteInvestmentSimulation();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la simulación "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const tooltips = {
    investments: {
      title: 'Inversiones',
      description: 'El módulo de inversiones te ayuda a tomar decisiones informadas sobre dónde invertir tu excedente de liquidez. Puedes simular diferentes escenarios, comparar productos de inversión del mercado colombiano y crear portafolios diversificados según tu perfil de riesgo.'
    },
    riskProfile: {
      title: 'Perfil de Riesgo',
      description: 'Tu perfil de riesgo determina qué productos de inversión son más adecuados para ti. Conservador: baja volatilidad, retornos estables (CDTs, bonos). Moderado: balance entre riesgo y rentabilidad (fondos balanceados). Agresivo: mayor volatilidad, mayor potencial de retorno (acciones, fondos de renta variable).'
    },
    diversification: {
      title: 'Diversificación',
      description: 'Diversificar significa distribuir tu inversión entre diferentes productos para reducir el riesgo. No pongas todos los huevos en la misma canasta. Un portafolio diversificado combina diferentes tipos de inversiones según tu perfil de riesgo.'
    },
  };

  // Calculate summary metrics
  const totalInvested = simulations?.reduce((sum, s) => sum + s.initialAmount, 0) || 0;
  const avgReturn12M = simulations?.length
    ? simulations.reduce((sum, s) => {
        const total12M = s.projections.twelveMonths.totalAmount;
        const returnRate = ((total12M - s.initialAmount) / s.initialAmount) * 100;
        return sum + returnRate;
      }, 0) / simulations.length
    : 0;

  const cashFlowSimulations = simulations?.filter(s => s.sourceType === 'cashflow').length || 0;
  const manualSimulations = simulations?.filter(s => s.sourceType === 'manual').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando simulaciones...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Inversiones</h1>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'investments' ? null : 'investments')}
                className="text-blue-400 hover:text-blue-600"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
            {activeTooltip === 'investments' && (
              <TooltipCard
                title={tooltips.investments.title}
                description={tooltips.investments.description}
                onClose={() => setActiveTooltip(null)}
              />
            )}
            <p className="mt-1 text-sm text-gray-500">
              Simula y gestiona tus inversiones de manera inteligente
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/dashboard/investments/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Simulación
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Simulaciones</p>
                <p className="text-3xl font-bold text-blue-900">{simulations?.length || 0}</p>
              </div>
              <Target className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Capital Invertido</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(totalInvested)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Retorno Prom. 12M</p>
                <p className="text-3xl font-bold text-purple-900">
                  {avgReturn12M.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Diversificadas</p>
                <p className="text-3xl font-bold text-orange-900">
                  {simulations?.filter(s => s.diversificationStrategy).length || 0}
                </p>
              </div>
              <PieChart className="h-12 w-12 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulations List */}
      {!simulations || simulations.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay simulaciones de inversión
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Comienza creando tu primera simulación para explorar opciones de inversión
              </p>
              <Button onClick={() => router.push('/dashboard/investments/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Simulación
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {simulations.map((simulation) => {
            const projections12M = simulation.projections.twelveMonths;
            const returnRate12M = ((projections12M.totalAmount - simulation.initialAmount) / simulation.initialAmount) * 100;
            const earnings12M = projections12M.earnings;

            return (
              <Card
                key={simulation.id}
                className="relative transition-all hover:shadow-lg border-2 border-blue-300"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{simulation.name}</CardTitle>
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
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Investment Amount */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700 font-semibold">Capital Inicial</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(simulation.initialAmount)}
                      </p>
                    </div>

                    {/* Products Count */}
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Productos de Inversión</p>
                      <p className="text-sm font-bold text-gray-900">
                        {simulation.selectedProducts.length} productos
                      </p>
                    </div>

                    {/* 12 Month Projection */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs font-bold mb-1 text-green-900">
                        Proyección a 12 Meses
                      </p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(projections12M.totalAmount)}
                      </p>
                      <div className="flex justify-between mt-1 text-xs text-green-700">
                        <span>Ganancia: {formatCurrency(earnings12M)}</span>
                        <span className="font-semibold">{returnRate12M.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Diversification Strategy */}
                    {simulation.diversificationStrategy && (
                      <div className="text-xs text-gray-600 pt-2 border-t">
                        <span className="font-semibold">Estrategia: </span>
                        <span>
                          {simulation.diversificationStrategy === 'equal' && 'Distribución Igual'}
                          {simulation.diversificationStrategy === 'risk-weighted' && 'Ponderada por Riesgo'}
                          {simulation.diversificationStrategy === 'return-optimized' && 'Optimizada por Retorno'}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {simulation.notes && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {simulation.notes.length > 80
                          ? `${simulation.notes.substring(0, 80)}...`
                          : simulation.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/investments/${simulation.id}`)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/investments/${simulation.id}/edit`)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(simulation.id, simulation.name)}
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
          <CardTitle className="text-indigo-900">¿Por qué invertir tu excedente de liquidez?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative bg-white p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setActiveTooltip(activeTooltip === 'riskProfile' ? null : 'riskProfile')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Perfil de Riesgo</h4>
                  <p className="text-sm text-gray-600">
                    Encuentra productos de inversión que se ajusten a tu tolerancia al riesgo y objetivos financieros
                  </p>
                </div>
              </div>
              {activeTooltip === 'riskProfile' && (
                <TooltipCard
                  title={tooltips.riskProfile.title}
                  description={tooltips.riskProfile.description}
                  onClose={() => setActiveTooltip(null)}
                />
              )}
            </div>

            <div className="relative bg-white p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setActiveTooltip(activeTooltip === 'diversification' ? null : 'diversification')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Diversificación</h4>
                  <p className="text-sm text-gray-600">
                    Distribuye tu inversión entre diferentes productos para maximizar retornos y minimizar riesgos
                  </p>
                </div>
              </div>
              {activeTooltip === 'diversification' && (
                <TooltipCard
                  title={tooltips.diversification.title}
                  description={tooltips.diversification.description}
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

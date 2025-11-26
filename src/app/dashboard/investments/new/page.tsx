// src/app/dashboard/investments/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw, Info, TrendingUp, DollarSign, PieChart, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import {
  useTopInvestmentProducts,
  useProductsByRiskProfile,
  useCreateInvestmentSimulation,
  useDiversifiedPortfolio
} from '@/src/lib/hooks/useInvestment';
import { useCashFlows } from '@/src/lib/hooks/useCashFlow';
import { useOrganization } from '@/src/lib/hooks/useOrganization';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { InvestmentService } from '@/src/services/investment.service';
import { formatCurrency } from '@/src/lib/utils';
import type { RiskProfile, InvestmentProduct, InvestmentAllocation } from '@/src/types/models';

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

// Format number with thousands separator (.) and decimal separator (,)
function formatNumberInput(value: string): string {
  // Remove all non-digit characters except comma
  const cleanValue = value.replace(/[^\d,]/g, '');

  // Split by comma to separate integer and decimal parts
  const parts = cleanValue.split(',');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousands separator (.)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Return formatted value
  return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
}

// Parse formatted number to float
function parseFormattedNumber(value: string): number {
  // Remove thousands separator (.) and replace decimal separator (,) with (.)
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
}

export default function NewInvestmentPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const { currentOrganization } = useOrganization();
  const { data: cashFlows } = useCashFlows();
  const createMutation = useCreateInvestmentSimulation();

  // Form state
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<'cashflow' | 'manual'>('manual');
  const [selectedCashFlowId, setSelectedCashFlowId] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('moderate');
  const [diversificationStrategy, setDiversificationStrategy] = useState<'equal' | 'risk-weighted' | 'return-optimized'>('risk-weighted');
  const [useDiversification, setUseDiversification] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showTopProducts, setShowTopProducts] = useState(false);

  // Fetch products
  const { data: topProducts, refetch: refetchTopProducts } = useTopInvestmentProducts(5);
  const { data: productsByRisk } = useProductsByRiskProfile(riskProfile, 5);

  // Determine investment amount
  const investmentAmount = sourceType === 'cashflow' && selectedCashFlowId
    ? (() => {
        const cashFlow = cashFlows?.find((cf: any) => cf.id === selectedCashFlowId);
        console.log('=== INVESTMENT AMOUNT DEBUG ===');
        console.log('Selected Cash Flow ID:', selectedCashFlowId);
        console.log('Cash Flow Found:', cashFlow);
        console.log('Has Periods?:', cashFlow?.periods);

        if (!cashFlow || !cashFlow.periods || cashFlow.periods.length === 0) {
          console.log('No cash flow or no periods found');
          return 0;
        }

        // Get the final cumulative cash flow (closing balance)
        const lastPeriod = cashFlow.periods[cashFlow.periods.length - 1];
        console.log('Last Period:', lastPeriod);
        console.log('Cumulative Cash Flow:', lastPeriod.cumulative_cash_flow);

        const finalBalance = lastPeriod.cumulative_cash_flow;

        // Only return if positive, otherwise 0
        const result = finalBalance > 0 ? finalBalance : 0;
        console.log('Final Investment Amount:', result);
        return result;
      })()
    : parseFormattedNumber(manualAmount);

  // Get diversified portfolio
  const { data: diversifiedPortfolio } = useDiversifiedPortfolio(
    investmentAmount,
    riskProfile,
    diversificationStrategy
  );

  // Products to display
  const displayProducts = showTopProducts ? topProducts : productsByRisk;

  // Calculate projections
  const calculateProjections = () => {
    if (investmentAmount <= 0) return null;

    const service = new InvestmentService(supabase);
    let allocations: InvestmentAllocation[] = [];

    if (useDiversification && diversifiedPortfolio) {
      allocations = diversifiedPortfolio;
    } else {
      // Manual selection
      const products = displayProducts?.filter(p => selectedProducts.includes(p.id)) || [];
      if (products.length === 0) return null;

      const totalPercentage = Object.values(manualAllocations).reduce((sum, val) => sum + val, 0);
      if (totalPercentage !== 100) return null;

      allocations = products.map(p => ({
        productId: p.id,
        productName: p.name,
        percentage: manualAllocations[p.id] || 0,
        amount: (investmentAmount * (manualAllocations[p.id] || 0)) / 100,
        expectedReturn: p.expectedReturn12Months
      }));
    }

    // Calculate weighted projections
    let totalAmount3M = 0;
    let totalAmount6M = 0;
    let totalAmount12M = 0;

    allocations.forEach(alloc => {
      const product = displayProducts?.find(p => p.id === alloc.productId);
      if (!product) return;

      const projections = service.calculateProjections(alloc.amount, product);
      totalAmount3M += projections.threeMonths.totalAmount;
      totalAmount6M += projections.sixMonths.totalAmount;
      totalAmount12M += projections.twelveMonths.totalAmount;
    });

    return {
      threeMonths: {
        period: '3 meses',
        totalInvested: investmentAmount,
        expectedReturn: ((totalAmount3M - investmentAmount) / investmentAmount) * 100,
        totalAmount: totalAmount3M,
        earnings: totalAmount3M - investmentAmount,
        effectiveRate: ((totalAmount3M - investmentAmount) / investmentAmount) * 100
      },
      sixMonths: {
        period: '6 meses',
        totalInvested: investmentAmount,
        expectedReturn: ((totalAmount6M - investmentAmount) / investmentAmount) * 100,
        totalAmount: totalAmount6M,
        earnings: totalAmount6M - investmentAmount,
        effectiveRate: ((totalAmount6M - investmentAmount) / investmentAmount) * 100
      },
      twelveMonths: {
        period: '12 meses',
        totalInvested: investmentAmount,
        expectedReturn: ((totalAmount12M - investmentAmount) / investmentAmount) * 100,
        totalAmount: totalAmount12M,
        earnings: totalAmount12M - investmentAmount,
        effectiveRate: ((totalAmount12M - investmentAmount) / investmentAmount) * 100
      }
    };
  };

  const projections = calculateProjections();

  // Auto-select products when diversification is enabled
  useEffect(() => {
    if (useDiversification && diversifiedPortfolio) {
      setSelectedProducts(diversifiedPortfolio.map(p => p.productId));
    }
  }, [useDiversification, diversifiedPortfolio]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para la simulación');
      return;
    }

    if (investmentAmount <= 0) {
      alert('El monto de inversión debe ser mayor a cero');
      return;
    }

    if (!projections) {
      alert('No se pudieron calcular las proyecciones. Verifica los datos ingresados.');
      return;
    }

    if (!currentOrganization) {
      alert('No se pudo obtener la organización actual');
      return;
    }

    let allocations: InvestmentAllocation[] = [];
    if (useDiversification && diversifiedPortfolio) {
      allocations = diversifiedPortfolio;
    } else {
      const products = displayProducts?.filter(p => selectedProducts.includes(p.id)) || [];
      allocations = products.map(p => ({
        productId: p.id,
        productName: p.name,
        percentage: manualAllocations[p.id] || 0,
        amount: (investmentAmount * (manualAllocations[p.id] || 0)) / 100,
        expectedReturn: p.expectedReturn12Months
      }));
    }

    createMutation.mutate({
      organizationId: currentOrganization.id,
      name,
      initialAmount: investmentAmount,
      sourceType,
      cashFlowId: sourceType === 'cashflow' ? selectedCashFlowId : undefined,
      riskProfile,
      selectedProducts: allocations,
      diversificationStrategy: useDiversification ? diversificationStrategy : undefined,
      projections,
      notes,
      createdBy: '' // Will be set by service
    }, {
      onSuccess: () => {
        router.push('/dashboard/investments');
      },
      onError: (error) => {
        alert(`Error al crear la simulación: ${error.message}`);
      }
    });
  };

  const tooltips = {
    riskProfile: {
      title: 'Perfil de Riesgo',
      description: 'Conservador: Baja volatilidad, retornos estables (CDTs, bonos). Moderado: Balance riesgo-rentabilidad (fondos balanceados). Agresivo: Mayor volatilidad, mayor retorno potencial (acciones, fondos variables).'
    },
    diversification: {
      title: 'Estrategia de Diversificación',
      description: 'Igual: Distribuye equitativamente. Ponderada por Riesgo: Ajusta según perfil. Optimizada por Retorno: Maximiza rentabilidad esperada.'
    },
    cashFlowSource: {
      title: 'Fuente: Flujo de Caja',
      description: 'Utiliza el saldo de cierre (flujo de caja acumulado final) de tu flujo de caja operacional como monto disponible para inversión.'
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Simulación de Inversión</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configura tu simulación y explora oportunidades de inversión
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nombre de la Simulación *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  placeholder="Ej: Inversión Q1 2025"
                />
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Perfil de Riesgo *
                  </label>
                  <button
                    onClick={() => setActiveTooltip(activeTooltip === 'riskProfile' ? null : 'riskProfile')}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                {activeTooltip === 'riskProfile' && (
                  <TooltipCard
                    title={tooltips.riskProfile.title}
                    description={tooltips.riskProfile.description}
                    onClose={() => setActiveTooltip(null)}
                  />
                )}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setRiskProfile('conservative')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      riskProfile === 'conservative'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <p className={`font-bold text-sm ${riskProfile === 'conservative' ? 'text-blue-900' : 'text-gray-700'}`}>
                      Conservador
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Bajo riesgo</p>
                  </button>
                  <button
                    onClick={() => setRiskProfile('moderate')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      riskProfile === 'moderate'
                        ? 'border-yellow-600 bg-yellow-50 shadow-md'
                        : 'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
                    }`}
                  >
                    <p className={`font-bold text-sm ${riskProfile === 'moderate' ? 'text-yellow-900' : 'text-gray-700'}`}>
                      Moderado
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Riesgo medio</p>
                  </button>
                  <button
                    onClick={() => setRiskProfile('aggressive')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      riskProfile === 'aggressive'
                        ? 'border-red-600 bg-red-50 shadow-md'
                        : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                    }`}
                  >
                    <p className={`font-bold text-sm ${riskProfile === 'aggressive' ? 'text-red-900' : 'text-gray-700'}`}>
                      Agresivo
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Alto riesgo</p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Amount */}
          <Card>
            <CardHeader>
              <CardTitle>Monto de Inversión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setSourceType('manual')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    sourceType === 'manual'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <DollarSign className={`h-6 w-6 mx-auto mb-1 ${sourceType === 'manual' ? 'text-blue-700' : 'text-gray-600'}`} />
                  <p className={`font-bold text-sm ${sourceType === 'manual' ? 'text-blue-900' : 'text-gray-700'}`}>
                    Monto Manual
                  </p>
                </button>
                <button
                  onClick={() => setSourceType('cashflow')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    sourceType === 'cashflow'
                      ? 'border-green-600 bg-green-50 shadow-md'
                      : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <TrendingUp className={`h-6 w-6 mx-auto mb-1 ${sourceType === 'cashflow' ? 'text-green-700' : 'text-gray-600'}`} />
                  <p className={`font-bold text-sm ${sourceType === 'cashflow' ? 'text-green-900' : 'text-gray-700'}`}>
                    Desde Flujo de Caja
                  </p>
                </button>
              </div>

              {sourceType === 'manual' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Monto a Invertir (COP)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={manualAmount}
                    onChange={(e) => {
                      const formatted = formatNumberInput(e.target.value);
                      setManualAmount(formatted);
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: 1.000.000,00</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      Seleccionar Flujo de Caja
                    </label>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'cashFlowSource' ? null : 'cashFlowSource')}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'cashFlowSource' && (
                    <TooltipCard
                      title={tooltips.cashFlowSource.title}
                      description={tooltips.cashFlowSource.description}
                      onClose={() => setActiveTooltip(null)}
                    />
                  )}
                  <select
                    value={selectedCashFlowId}
                    onChange={(e) => setSelectedCashFlowId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  >
                    <option value="">Selecciona un flujo de caja</option>
                    {cashFlows?.map((cf: any) => (
                      <option key={cf.id} value={cf.id}>
                        {cf.name} - {cf.fiscal_year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sourceType === 'cashflow' && selectedCashFlowId && investmentAmount <= 0 ? (
                <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-bold text-red-900">Sin recursos disponibles</p>
                  </div>
                  <p className="text-xs text-red-700">
                    El flujo de caja seleccionado no tiene un saldo final positivo disponible para invertir.
                  </p>
                </div>
              ) : (
                <div className={`p-3 rounded-lg border-2 ${investmentAmount > 0 ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'}`}>
                  <p className={`text-sm font-semibold ${investmentAmount > 0 ? 'text-green-700' : 'text-blue-700'}`}>
                    Monto Disponible para Inversión
                  </p>
                  <p className={`text-2xl font-bold ${investmentAmount > 0 ? 'text-green-900' : 'text-blue-900'}`}>
                    {formatCurrency(investmentAmount)}
                  </p>
                  {sourceType === 'cashflow' && selectedCashFlowId && (
                    <p className="text-xs text-gray-600 mt-1">
                      Saldo final del flujo de caja seleccionado
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Productos de Inversión</CardTitle>
                  <CardDescription>
                    {showTopProducts ? 'Top 5 productos del mercado' : 'Productos según tu perfil de riesgo'}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (showTopProducts) {
                      refetchTopProducts();
                    }
                    setShowTopProducts(!showTopProducts);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {showTopProducts ? 'Ver por Perfil' : 'Ver Top 5'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Diversification Toggle */}
              <div className="relative bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Diversificación Automática</span>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'diversification' ? null : 'diversification')}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDiversification}
                      onChange={(e) => setUseDiversification(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {activeTooltip === 'diversification' && (
                  <TooltipCard
                    title={tooltips.diversification.title}
                    description={tooltips.diversification.description}
                    onClose={() => setActiveTooltip(null)}
                  />
                )}

                {useDiversification && (
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Estrategia
                    </label>
                    <select
                      value={diversificationStrategy}
                      onChange={(e) => setDiversificationStrategy(e.target.value as any)}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="equal">Distribución Igual</option>
                      <option value="risk-weighted">Ponderada por Riesgo</option>
                      <option value="return-optimized">Optimizada por Retorno</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Products List */}
              {!useDiversification && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Selecciona productos manualmente y asigna porcentajes (deben sumar 100%)
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {displayProducts?.map(product => {
                  const isSelected = selectedProducts.includes(product.id);
                  const allocation = useDiversification
                    ? diversifiedPortfolio?.find(p => p.productId === product.id)
                    : null;

                  return (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {!useDiversification && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProducts([...selectedProducts, product.id]);
                                  } else {
                                    setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                    const newAllocations = { ...manualAllocations };
                                    delete newAllocations[product.id];
                                    setManualAllocations(newAllocations);
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            )}
                            <div>
                              <p className="font-bold text-sm text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-700 font-medium">{product.institution}</p>
                            </div>
                          </div>
                        </div>
                        <Badge className={
                          product.riskLevel === 'conservative' ? 'bg-blue-600 text-white font-bold' :
                          product.riskLevel === 'moderate' ? 'bg-yellow-600 text-white font-bold' :
                          'bg-red-600 text-white font-bold'
                        }>
                          {product.expectedReturn12Months.toFixed(1)}% anual
                        </Badge>
                      </div>

                      {isSelected && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="text-xs">
                            <span className="text-gray-800 font-semibold">Mínimo:</span>
                            <span className="ml-1 font-bold text-gray-900">{formatCurrency(product.minAmount)}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-800 font-semibold">Liquidez:</span>
                            <span className="ml-1 font-bold text-gray-900">{product.liquidity}</span>
                          </div>
                        </div>
                      )}

                      {isSelected && allocation && useDiversification && (
                        <div className="mt-3 bg-white p-3 rounded border-2 border-blue-400">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-900 font-semibold">Asignación:</span>
                            <span className="font-bold text-blue-700">{allocation.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-900 font-semibold">Monto:</span>
                            <span className="font-bold text-blue-700">{formatCurrency(allocation.amount)}</span>
                          </div>
                        </div>
                      )}

                      {isSelected && !useDiversification && (
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-gray-900 mb-1">
                            Porcentaje de Asignación
                          </label>
                          <input
                            type="number"
                            value={manualAllocations[product.id] || ''}
                            onChange={(e) => {
                              setManualAllocations({
                                ...manualAllocations,
                                [product.id]: parseFloat(e.target.value) || 0
                              });
                            }}
                            className="w-full px-2 py-1 text-sm border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!useDiversification && selectedProducts.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Total Asignado:</span>
                    <span className={`font-bold ${
                      Object.values(manualAllocations).reduce((sum, val) => sum + val, 0) === 100
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {Object.values(manualAllocations).reduce((sum, val) => sum + val, 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                rows={3}
                placeholder="Agrega observaciones o comentarios sobre esta simulación..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Projections */}
        <div className="space-y-6">
          {/* Projections Summary */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Proyecciones</CardTitle>
              <CardDescription>Rendimientos esperados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!projections ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Configura tu inversión para ver las proyecciones</p>
                </div>
              ) : (
                <>
                  {/* 3 Months */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700">3 Meses</p>
                    <p className="text-xl font-bold text-blue-900 mt-1">
                      {formatCurrency(projections.threeMonths.totalAmount)}
                    </p>
                    <div className="flex justify-between mt-2 text-xs text-blue-700">
                      <span>Ganancia:</span>
                      <span className="font-semibold">
                        {formatCurrency(projections.threeMonths.earnings)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>Retorno:</span>
                      <span className="font-semibold">
                        {projections.threeMonths.effectiveRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* 6 Months */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-green-700">6 Meses</p>
                    <p className="text-xl font-bold text-green-900 mt-1">
                      {formatCurrency(projections.sixMonths.totalAmount)}
                    </p>
                    <div className="flex justify-between mt-2 text-xs text-green-700">
                      <span>Ganancia:</span>
                      <span className="font-semibold">
                        {formatCurrency(projections.sixMonths.earnings)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Retorno:</span>
                      <span className="font-semibold">
                        {projections.sixMonths.effectiveRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* 12 Months */}
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-purple-700">12 Meses</p>
                    <p className="text-xl font-bold text-purple-900 mt-1">
                      {formatCurrency(projections.twelveMonths.totalAmount)}
                    </p>
                    <div className="flex justify-between mt-2 text-xs text-purple-700">
                      <span>Ganancia:</span>
                      <span className="font-semibold">
                        {formatCurrency(projections.twelveMonths.earnings)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-purple-700">
                      <span>Retorno:</span>
                      <span className="font-semibold">
                        {projections.twelveMonths.effectiveRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createMutation.isPending ? 'Guardando...' : 'Guardar Simulación'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

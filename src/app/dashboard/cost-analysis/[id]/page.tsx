// src/app/dashboard/cost-analysis/[id]/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Info, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Package, Zap, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useCostAnalysis } from '@/src/lib/hooks/useCostAnalysis';
import { CostAnalysisService } from '@/src/services/cost-analysis.service';
import { useSupabase } from '@/src/lib/hooks/useSupabase';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { exportCostAnalysisToPDF } from '@/src/lib/utils/pdf-export';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

// Tooltip Component
interface TooltipCardProps {
  title: string;
  description: string;
  onClose: () => void;
}

function TooltipCard({ title, description, onClose }: TooltipCardProps) {
  return (
    <div className="absolute z-50 top-full left-0 mt-2 w-96 bg-white border-2 border-blue-300 rounded-lg shadow-xl p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-blue-900 text-sm">{title}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <span className="text-lg">×</span>
        </button>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
    </div>
  );
}

export default function CostAnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = useSupabase();
  const { data: analysis, isLoading } = useCostAnalysis(id);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const calculations = useMemo(() => {
    if (!analysis) return null;
    const service = new CostAnalysisService(supabase);
    return service.calculateAnalysis(analysis);
  }, [analysis, supabase]);

  const tooltips = {
    breakEven: {
      title: 'Punto de Equilibrio',
      description: 'Es la cantidad mínima de unidades que debes vender para que tus ingresos igualen tus costos totales. Por debajo de este punto pierdes dinero, por encima generas utilidades.\n\nFórmula: Costos Fijos / Margen de Contribución Unitario'
    },
    contributionMargin: {
      title: 'Margen de Contribución',
      description: 'Es lo que queda de cada venta después de pagar los costos variables. Este dinero sirve para:\n1. Cubrir los costos fijos\n2. Generar utilidad\n\nUn margen alto significa mayor rentabilidad por unidad vendida.'
    },
    marginOfSafety: {
      title: 'Margen de Seguridad',
      description: 'Indica cuánto pueden caer tus ventas antes de llegar al punto de equilibrio. Un margen alto es mejor porque tienes más "colchón" ante caídas en ventas.\n\nEjemplo: Si vendes 1000 unidades y tu punto de equilibrio es 600, tu margen de seguridad es 400 unidades (40%).'
    },
    operatingLeverage: {
      title: 'Apalancamiento Operativo',
      description: 'Mide qué tan sensible es tu utilidad a cambios en las ventas.\n\n• Alto (>2): Pequeños aumentos en ventas generan grandes aumentos en utilidad, pero también funciona al revés.\n• Bajo (<2): Utilidad más estable ante cambios en ventas.\n\nNegocio con costos fijos altos = apalancamiento alto.'
    },
  };

  // Generate recommendations based on analysis
  const recommendations = useMemo(() => {
    if (!analysis || !calculations) return [];

    const recs: Array<{ type: 'success' | 'warning' | 'danger'; title: string; message: string }> = [];

    // Check profitability
    if (calculations.currentMonthlyProfit < 0) {
      recs.push({
        type: 'danger',
        title: '⚠️ Producto No Rentable',
        message: `Estás perdiendo ${formatCurrency(Math.abs(calculations.currentMonthlyProfit))} al mes. Necesitas vender al menos ${calculations.breakEvenUnits} unidades para no perder dinero. Considera aumentar el precio, reducir costos o discontinuar el producto.`
      });
    } else if (calculations.currentMonthlyProfit > 0 && analysis.currentMonthlyUnits < calculations.breakEvenUnits * 1.2) {
      recs.push({
        type: 'warning',
        title: '⚡ Rentabilidad Marginal',
        message: `Aunque generas utilidad (${formatCurrency(calculations.currentMonthlyProfit)}), estás cerca del punto de equilibrio. Aumenta ventas o mejora márgenes para tener mayor seguridad.`
      });
    } else if (calculations.currentMonthlyProfit > 0) {
      recs.push({
        type: 'success',
        title: '✓ Producto Rentable',
        message: `Generas ${formatCurrency(calculations.currentMonthlyProfit)} de utilidad mensual. Buen desempeño, continúa monitoreando y busca oportunidades de crecimiento.`
      });
    }

    // Check contribution margin
    if (calculations.contributionMarginRatio < 0.3) {
      recs.push({
        type: 'danger',
        title: 'Margen de Contribución Bajo',
        message: `Tu margen de contribución es solo ${(calculations.contributionMarginRatio * 100).toFixed(1)}%. Cada venta contribuye muy poco a cubrir costos fijos. Considera aumentar precios o reducir costos variables.`
      });
    } else if (calculations.contributionMarginRatio < 0.5) {
      recs.push({
        type: 'warning',
        title: 'Margen de Contribución Moderado',
        message: `Margen de ${(calculations.contributionMarginRatio * 100).toFixed(1)}%. Aceptable pero mejorable. Analiza si puedes optimizar costos variables o ajustar precios.`
      });
    } else {
      recs.push({
        type: 'success',
        title: 'Excelente Margen de Contribución',
        message: `Margen de ${(calculations.contributionMarginRatio * 100).toFixed(1)}%. Muy bien, cada venta aporta significativamente a tu rentabilidad.`
      });
    }

    // Check margin of safety
    if (calculations.marginOfSafetyPercentage < 20) {
      recs.push({
        type: 'danger',
        title: 'Margen de Seguridad Crítico',
        message: `Solo ${calculations.marginOfSafetyPercentage.toFixed(1)}% por encima del punto de equilibrio. Una pequeña caída en ventas te llevaría a pérdidas. Aumenta ventas urgentemente.`
      });
    } else if (calculations.marginOfSafetyPercentage < 40) {
      recs.push({
        type: 'warning',
        title: 'Margen de Seguridad Bajo',
        message: `Margen de seguridad del ${calculations.marginOfSafetyPercentage.toFixed(1)}%. Tienes poco colchón ante caídas. Busca aumentar ventas o reducir costos fijos.`
      });
    }

    // Check capacity utilization
    if (calculations.capacityUtilization !== undefined) {
      if (calculations.capacityUtilization < 50) {
        recs.push({
          type: 'warning',
          title: 'Capacidad Subutilizada',
          message: `Solo usas ${calculations.capacityUtilization.toFixed(1)}% de tu capacidad. Tienes espacio para crecer sin inversiones adicionales. Enfócate en aumentar ventas.`
        });
      } else if (calculations.capacityUtilization > 90) {
        recs.push({
          type: 'warning',
          title: 'Capacidad Casi al Límite',
          message: `Estás usando ${calculations.capacityUtilization.toFixed(1)}% de capacidad. Considera invertir en más capacidad o arriesgas perder oportunidades de venta.`
        });
      }
    }

    // Operating leverage insights
    if (calculations.operatingLeverage > 3) {
      recs.push({
        type: 'warning',
        title: 'Alto Apalancamiento Operativo',
        message: `Apalancamiento de ${calculations.operatingLeverage.toFixed(2)}x. Tus utilidades son muy sensibles a cambios en ventas. Pequeños aumentos generan grandes ganancias, pero caídas también impactan fuerte.`
      });
    }

    // Pricing recommendation
    const minPriceForProfit = analysis.variableCostPerUnit + (analysis.monthlyFixedCosts / (analysis.currentMonthlyUnits || 1));
    if (analysis.unitPrice < minPriceForProfit * 1.1) {
      recs.push({
        type: 'warning',
        title: 'Precio Muy Ajustado',
        message: `Tu precio (${formatCurrency(analysis.unitPrice)}) deja poco margen. Considera aumentarlo para mejorar rentabilidad y tener mayor flexibilidad.`
      });
    }

    return recs;
  }, [analysis, calculations]);

  // Data for charts
  const breakEvenChartData = useMemo(() => {
    if (!analysis || !calculations) return [];

    const data = [];
    const maxUnits = Math.max(calculations.breakEvenUnits * 2, analysis.currentMonthlyUnits * 1.5);
    const step = Math.ceil(maxUnits / 10);

    for (let units = 0; units <= maxUnits; units += step) {
      const revenue = units * analysis.unitPrice;
      const variableCosts = units * analysis.variableCostPerUnit;
      const totalCosts = variableCosts + analysis.monthlyFixedCosts;

      data.push({
        units,
        'Ingresos': revenue,
        'Costos Totales': totalCosts,
        'Costos Fijos': analysis.monthlyFixedCosts,
        'Costos Variables': variableCosts,
      });
    }

    return data;
  }, [analysis, calculations]);

  const costStructureData = useMemo(() => {
    if (!analysis) return [];

    const totalVariableCost = analysis.variableCostPerUnit * analysis.currentMonthlyUnits;

    return [
      { name: 'Costos Variables', value: totalVariableCost, color: '#f97316' },
      { name: 'Costos Fijos', value: analysis.monthlyFixedCosts, color: '#ef4444' },
    ];
  }, [analysis]);

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

  if (!analysis || !calculations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Análisis no encontrado</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/cost-analysis')}>
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  const isProfitable = calculations.currentMonthlyProfit > 0;
  const isAboveBreakEven = analysis.currentMonthlyUnits >= calculations.breakEvenUnits;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/cost-analysis')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{analysis.productName}</h1>
              <Badge
                className={analysis.status === 'final' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}
              >
                {analysis.status === 'final' ? 'Final' : 'Borrador'}
              </Badge>
            </div>
            {analysis.productDescription && (
              <p className="mt-1 text-sm text-gray-600">{analysis.productDescription}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formatDate(analysis.periodStart, 'short')} - {formatDate(analysis.periodEnd, 'short')} | Año Fiscal {analysis.fiscalYear}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/cost-analysis/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => exportCostAnalysisToPDF(analysis, calculations)}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`${isProfitable ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                  Utilidad Mensual
                </p>
                <p className={`text-2xl font-bold ${isProfitable ? 'text-green-900' : 'text-red-900'}`}>
                  {formatCurrency(calculations.currentMonthlyProfit)}
                </p>
              </div>
              {isProfitable ? (
                <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
              ) : (
                <TrendingDown className="h-10 w-10 text-red-600 opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Ingresos Mensuales</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(calculations.currentMonthlyRevenue)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-2 border-purple-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-900">Ventas Actuales</p>
                <p className="text-2xl font-bold text-purple-900">
                  {analysis.currentMonthlyUnits.toLocaleString()} un.
                </p>
              </div>
              <Package className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-2 border-orange-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Punto Equilibrio</p>
                <p className="text-2xl font-bold text-orange-900">
                  {calculations.breakEvenUnits.toLocaleString()} un.
                </p>
              </div>
              <Zap className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              Recomendaciones Inteligentes
            </CardTitle>
            <CardDescription>
              Análisis automático basado en tus datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.type === 'success'
                      ? 'bg-green-50 border-green-500'
                      : rec.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <h4 className={`font-semibold mb-1 ${
                    rec.type === 'success'
                      ? 'text-green-900'
                      : rec.type === 'warning'
                      ? 'text-yellow-900'
                      : 'text-red-900'
                  }`}>
                    {rec.title}
                  </h4>
                  <p className={`text-sm ${
                    rec.type === 'success'
                      ? 'text-green-800'
                      : rec.type === 'warning'
                      ? 'text-yellow-800'
                      : 'text-red-800'
                  }`}>
                    {rec.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Break-even Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 relative">
            <CardTitle>Gráfica de Punto de Equilibrio</CardTitle>
            <button
              onClick={() => setActiveTooltip(activeTooltip === 'breakEven' ? null : 'breakEven')}
              className="text-blue-400 hover:text-blue-600"
            >
              <Info className="h-4 w-4" />
            </button>
            {activeTooltip === 'breakEven' && (
              <TooltipCard
                title={tooltips.breakEven.title}
                description={tooltips.breakEven.description}
                onClose={() => setActiveTooltip(null)}
              />
            )}
          </div>
          <CardDescription>
            Visualiza dónde tus ingresos superan tus costos totales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={breakEvenChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="units"
                  label={{ value: 'Unidades Vendidas', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Monto ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `${label} unidades`}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="Ingresos"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={false}
                  name="Ingresos Totales"
                />
                <Line
                  type="monotone"
                  dataKey="Costos Totales"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={false}
                  name="Costos Totales"
                />
                <Line
                  type="monotone"
                  dataKey="Costos Fijos"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Costos Fijos (referencia)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-700 font-semibold">Punto de Equilibrio</p>
              <p className="text-lg font-bold text-orange-900">
                {calculations.breakEvenUnits.toLocaleString()} unidades
              </p>
              <p className="text-sm text-orange-800">{formatCurrency(calculations.breakEvenRevenue)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-semibold">Ventas Actuales</p>
              <p className="text-lg font-bold text-blue-900">
                {analysis.currentMonthlyUnits.toLocaleString()} unidades
              </p>
              <p className="text-sm text-blue-800">
                {isAboveBreakEven ? '✓ Por encima del punto de equilibrio' : '⚠️ Por debajo del punto de equilibrio'}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700 font-semibold">Margen de Seguridad</p>
              <p className="text-lg font-bold text-green-900">
                {calculations.marginOfSafety.toLocaleString()} unidades
              </p>
              <p className="text-sm text-green-800">{calculations.marginOfSafetyPercentage.toFixed(1)}%</p>
            </div>
          </div>

          {/* Interpretación de la Gráfica */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Cómo Interpretar Esta Gráfica
            </h4>
            <div className="space-y-2 text-sm text-blue-900">
              <p>
                <strong className="text-blue-950">Línea Verde (Ingresos):</strong> Muestra el dinero que recibes al vender diferentes cantidades de unidades. Sube de forma constante porque cada unidad vendida genera el mismo ingreso.
              </p>
              <p>
                <strong className="text-blue-950">Línea Roja (Costos Totales):</strong> Representa todos tus costos (fijos + variables). Comienza en el nivel de tus costos fijos y sube más rápido que los ingresos si tus costos variables son altos.
              </p>
              <p>
                <strong className="text-blue-950">Línea Naranja Punteada (Costos Fijos):</strong> Es tu "piso" de costos - lo mínimo que debes pagar aunque no vendas nada (alquiler, salarios fijos, etc.).
              </p>
              <p>
                <strong className="text-blue-950">Punto de Equilibrio (donde se cruzan las líneas):</strong> Es donde tus ingresos igualan tus costos. A la izquierda de este punto pierdes dinero, a la derecha generas utilidad.
              </p>
              <p className="pt-2 border-t border-blue-200">
                <strong className="text-blue-950">💡 Conclusión:</strong> {
                  isAboveBreakEven
                    ? `Estás vendiendo ${analysis.currentMonthlyUnits.toLocaleString()} unidades, que es ${(calculations.marginOfSafetyPercentage).toFixed(0)}% más del punto de equilibrio. Esto significa que generas utilidad y tienes un colchón de seguridad ante caídas en ventas.`
                    : `Necesitas aumentar tus ventas a ${calculations.breakEvenUnits.toLocaleString()} unidades para dejar de perder dinero. Actualmente vendes ${analysis.currentMonthlyUnits.toLocaleString()} unidades, por lo que te faltan ${(calculations.breakEvenUnits - analysis.currentMonthlyUnits).toLocaleString()} unidades para alcanzar el punto de equilibrio.`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Structure and Detailed Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Cost Structure Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Estructura de Costos</CardTitle>
            <CardDescription>
              Distribución de tus costos mensuales actuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costStructureData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costStructureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-sm text-gray-700">Costos Variables Totales</span>
                <span className="text-sm font-bold text-orange-900">
                  {formatCurrency(analysis.variableCostPerUnit * analysis.currentMonthlyUnits)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                <span className="text-sm text-gray-700">Costos Fijos Mensuales</span>
                <span className="text-sm font-bold text-red-900">
                  {formatCurrency(analysis.monthlyFixedCosts)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-100 rounded border-t-2 border-gray-300">
                <span className="text-sm font-bold text-gray-900">Costos Totales</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculations.currentMonthlyTotalCosts)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas Detalladas</CardTitle>
            <CardDescription>
              Indicadores clave de rentabilidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Contribution Margin */}
              <div className="relative p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-blue-900">Margen de Contribución</p>
                      <button
                        onClick={() => setActiveTooltip(activeTooltip === 'contributionMargin' ? null : 'contributionMargin')}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </div>
                    {activeTooltip === 'contributionMargin' && (
                      <TooltipCard
                        title={tooltips.contributionMargin.title}
                        description={tooltips.contributionMargin.description}
                        onClose={() => setActiveTooltip(null)}
                      />
                    )}
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {formatCurrency(calculations.contributionMarginPerUnit)} / unidad
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {(calculations.contributionMarginRatio * 100).toFixed(1)}% del precio de venta
                    </p>
                  </div>
                </div>
              </div>

              {/* Operating Leverage */}
              <div className="relative p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-purple-900">Apalancamiento Operativo</p>
                      <button
                        onClick={() => setActiveTooltip(activeTooltip === 'operatingLeverage' ? null : 'operatingLeverage')}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </div>
                    {activeTooltip === 'operatingLeverage' && (
                      <TooltipCard
                        title={tooltips.operatingLeverage.title}
                        description={tooltips.operatingLeverage.description}
                        onClose={() => setActiveTooltip(null)}
                      />
                    )}
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {calculations.operatingLeverage.toFixed(2)}x
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      {calculations.operatingLeverage > 2
                        ? 'Alto - Sensible a cambios en ventas'
                        : 'Moderado - Estabilidad razonable'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capacity Utilization */}
              {calculations.capacityUtilization !== undefined && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <p className="text-sm font-semibold text-green-900">Utilización de Capacidad</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {calculations.capacityUtilization.toFixed(1)}%
                  </p>
                  <div className="mt-2 w-full bg-green-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(calculations.capacityUtilization, 100)}%` }}
                    />
                  </div>
                  {calculations.maxPotentialProfit !== undefined && (
                    <p className="text-sm text-green-700 mt-2">
                      Utilidad potencial máxima: {formatCurrency(calculations.maxPotentialProfit)}
                    </p>
                  )}
                </div>
              )}

              {/* Margin of Safety */}
              <div className="relative p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-yellow-900">Margen de Seguridad</p>
                      <button
                        onClick={() => setActiveTooltip(activeTooltip === 'marginOfSafety' ? null : 'marginOfSafety')}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </div>
                    {activeTooltip === 'marginOfSafety' && (
                      <TooltipCard
                        title={tooltips.marginOfSafety.title}
                        description={tooltips.marginOfSafety.description}
                        onClose={() => setActiveTooltip(null)}
                      />
                    )}
                    <p className="text-2xl font-bold text-yellow-900 mt-1">
                      {calculations.marginOfSafetyPercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {calculations.marginOfSafety.toLocaleString()} unidades de colchón
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Variable Costs Breakdown */}
        {analysis.variableCostBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-900">Desglose de Costos Variables</CardTitle>
              <CardDescription>Por unidad producida</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.variableCostBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-bold text-orange-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg border-t-2 border-orange-300 mt-3">
                  <span className="text-sm font-bold text-gray-900">Total por Unidad</span>
                  <span className="text-lg font-bold text-orange-900">
                    {formatCurrency(analysis.variableCostPerUnit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fixed Costs Breakdown */}
        {analysis.fixedCostBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-900">Desglose de Costos Fijos</CardTitle>
              <CardDescription>Mensuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.fixedCostBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-bold text-red-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border-t-2 border-red-300 mt-3">
                  <span className="text-sm font-bold text-gray-900">Total Mensual</span>
                  <span className="text-lg font-bold text-red-900">
                    {formatCurrency(analysis.monthlyFixedCosts)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pricing Summary */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-900">Resumen de Precios y Costos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-xs text-gray-600 mb-1">Precio de Venta</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(analysis.unitPrice)}</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-xs text-gray-600 mb-1">Costo Variable/Unidad</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(analysis.variableCostPerUnit)}</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-xs text-gray-600 mb-1">Margen Contribución</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(calculations.contributionMarginPerUnit)}</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-xs text-gray-600 mb-1">% Margen</p>
              <p className="text-2xl font-bold text-purple-900">
                {(calculations.contributionMarginRatio * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {analysis.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-line">{analysis.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

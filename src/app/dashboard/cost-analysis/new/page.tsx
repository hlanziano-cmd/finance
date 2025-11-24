// src/app/dashboard/cost-analysis/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Info, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import { useCreateCostAnalysis } from '@/src/lib/hooks/useCostAnalysis';
import type { CostBreakdownItem } from '@/src/types/models';
import { formatDate } from '@/src/lib/utils';

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
      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
    </div>
  );
}

export default function NewCostAnalysisPage() {
  const router = useRouter();
  const createMutation = useCreateCostAnalysis();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Basic Info
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);

  // Variable Costs
  const [variableCostPerUnit, setVariableCostPerUnit] = useState(0);
  const [variableCostBreakdown, setVariableCostBreakdown] = useState<CostBreakdownItem[]>([]);
  const [newVariableCostName, setNewVariableCostName] = useState('');
  const [newVariableCostAmount, setNewVariableCostAmount] = useState(0);

  // Fixed Costs
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState(0);
  const [fixedCostBreakdown, setFixedCostBreakdown] = useState<CostBreakdownItem[]>([]);
  const [newFixedCostName, setNewFixedCostName] = useState('');
  const [newFixedCostAmount, setNewFixedCostAmount] = useState(0);

  // Production Data
  const [currentMonthlyUnits, setCurrentMonthlyUnits] = useState<number | undefined>(undefined);
  const [productionCapacity, setProductionCapacity] = useState<number | undefined>(undefined);

  // Metadata - Usar fechas automáticas
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState('');

  // Calcular fechas automáticamente: inicio del mes actual, fin del año
  const getPeriodDates = () => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Primer día del mes actual
    const periodEnd = new Date(now.getFullYear(), 11, 31); // 31 de diciembre del año actual
    return { periodStart, periodEnd };
  };

  const tooltips = {
    productName: {
      title: 'Nombre del Producto',
      description: 'Identifica claramente tu producto o servicio. Ejemplo: "Camiseta Polo Premium", "Servicio de Consultoría Mensual", "Pizza Familiar".'
    },
    unitPrice: {
      title: 'Precio de Venta Unitario',
      description: 'Es el precio al que vendes cada unidad del producto. Este es el ingreso que recibes por cada venta. Debe ser mayor que tus costos variables para ser rentable.'
    },
    variableCosts: {
      title: 'Costos Variables',
      description: 'Son costos que cambian según cuánto produzcas o vendas.\n\nEjemplos:\n• Materias primas\n• Mano de obra directa\n• Empaques\n• Comisiones de venta\n• Envíos\n\nSi no produces, no pagas estos costos.'
    },
    fixedCosts: {
      title: 'Costos Fijos Mensuales',
      description: 'Son costos que pagas cada mes sin importar cuánto vendas.\n\nEjemplos:\n• Alquiler del local\n• Salarios fijos\n• Servicios (luz, agua, internet)\n• Seguros\n• Depreciación de equipos\n\nIncluso si no vendes nada, debes pagar estos costos.'
    },
    currentSales: {
      title: 'Ventas Mensuales Actuales',
      description: 'Cuántas unidades vendes actualmente por mes. Esta información te ayudará a calcular tu utilidad actual y comparar con el punto de equilibrio.'
    },
    capacity: {
      title: 'Capacidad de Producción',
      description: 'Máximo de unidades que puedes producir o vender por mes con tus recursos actuales. Es opcional pero útil para planificar el crecimiento y entender tu potencial máximo.'
    }
  };

  // Add Variable Cost
  const handleAddVariableCost = () => {
    if (newVariableCostName && newVariableCostAmount > 0) {
      setVariableCostBreakdown([...variableCostBreakdown, {
        name: newVariableCostName,
        amount: newVariableCostAmount
      }]);
      setNewVariableCostName('');
      setNewVariableCostAmount(0);

      // Update total
      setVariableCostPerUnit(variableCostPerUnit + newVariableCostAmount);
    }
  };

  const handleRemoveVariableCost = (index: number) => {
    const item = variableCostBreakdown[index];
    setVariableCostBreakdown(variableCostBreakdown.filter((_, i) => i !== index));
    setVariableCostPerUnit(variableCostPerUnit - item.amount);
  };

  // Add Fixed Cost
  const handleAddFixedCost = () => {
    if (newFixedCostName && newFixedCostAmount > 0) {
      setFixedCostBreakdown([...fixedCostBreakdown, {
        name: newFixedCostName,
        amount: newFixedCostAmount
      }]);
      setNewFixedCostName('');
      setNewFixedCostAmount(0);

      // Update total
      setMonthlyFixedCosts(monthlyFixedCosts + newFixedCostAmount);
    }
  };

  const handleRemoveFixedCost = (index: number) => {
    const item = fixedCostBreakdown[index];
    setFixedCostBreakdown(fixedCostBreakdown.filter((_, i) => i !== index));
    setMonthlyFixedCosts(monthlyFixedCosts - item.amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName) {
      alert('Por favor completa el nombre del producto');
      return;
    }

    if (unitPrice <= 0) {
      alert('El precio de venta debe ser mayor a 0');
      return;
    }

    try {
      const { periodStart, periodEnd } = getPeriodDates();

      const newAnalysis = await createMutation.mutateAsync({
        productName,
        productDescription: productDescription || undefined,
        unitPrice,
        variableCostPerUnit,
        variableCostBreakdown,
        monthlyFixedCosts,
        fixedCostBreakdown,
        currentMonthlyUnits: currentMonthlyUnits || 0,
        productionCapacity: productionCapacity || undefined,
        fiscalYear,
        periodStart,
        periodEnd,
        status: 'final',
        notes: notes || undefined,
      });

      router.push(`/dashboard/cost-analysis/${newAnalysis.id}`);
    } catch (error) {
      console.error('Error al crear análisis:', error);
      alert('Error al crear el análisis. Por favor intenta nuevamente.');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Análisis de Costos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra los costos de tu producto para calcular rentabilidad y punto de equilibrio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Datos básicos del producto o servicio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                  Nombre del Producto <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(activeTooltip === 'productName' ? null : 'productName')}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              {activeTooltip === 'productName' && (
                <TooltipCard
                  title={tooltips.productName.title}
                  description={tooltips.productName.description}
                  onClose={() => setActiveTooltip(null)}
                />
              )}
              <input
                id="productName"
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Camiseta Polo Premium"
              />
            </div>

            <div>
              <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700">
                Descripción (Opcional)
              </label>
              <textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción breve del producto..."
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
                onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader className="relative">
            <div className="flex items-center gap-2">
              <CardTitle className="text-blue-900">Precio de Venta</CardTitle>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'unitPrice' ? null : 'unitPrice')}
                className="text-blue-500 hover:text-blue-700"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            {activeTooltip === 'unitPrice' && (
              <TooltipCard
                title={tooltips.unitPrice.title}
                description={tooltips.unitPrice.description}
                onClose={() => setActiveTooltip(null)}
              />
            )}
            <CardDescription className="text-blue-700">
              Precio al que vendes cada unidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg">
              <CurrencyInput
                value={unitPrice}
                onChange={setUnitPrice}
                placeholder="0"
                className="text-2xl font-bold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Variable Costs */}
        <Card className="bg-orange-50 border-2 border-orange-300">
          <CardHeader className="relative">
            <div className="flex items-center gap-2">
              <CardTitle className="text-orange-900">Costos Variables por Unidad</CardTitle>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'variableCosts' ? null : 'variableCosts')}
                className="text-orange-500 hover:text-orange-700"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            {activeTooltip === 'variableCosts' && (
              <TooltipCard
                title={tooltips.variableCosts.title}
                description={tooltips.variableCosts.description}
                onClose={() => setActiveTooltip(null)}
              />
            )}
            <CardDescription className="text-orange-700">
              Costos que varían según la cantidad producida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Variable Cost */}
            <div className="bg-white p-4 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-gray-700">Agregar Costo Variable</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newVariableCostName}
                  onChange={(e) => setNewVariableCostName(e.target.value)}
                  className="flex-1 rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500"
                  placeholder="Ej: Materia Prima"
                />
                <CurrencyInput
                  value={newVariableCostAmount}
                  onChange={setNewVariableCostAmount}
                  placeholder="0"
                  className="w-32"
                />
                <Button
                  type="button"
                  onClick={handleAddVariableCost}
                  size="sm"
                  disabled={!newVariableCostName || newVariableCostAmount <= 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Variable Costs List */}
            {variableCostBreakdown.length > 0 && (
              <div className="bg-white p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Desglose de Costos Variables</p>
                {variableCostBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        ${item.amount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariableCost(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t-2 border-gray-300">
                  <span className="text-sm font-bold text-gray-900">Total Costo Variable</span>
                  <span className="text-lg font-bold text-orange-900">
                    ${variableCostPerUnit.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed Costs */}
        <Card className="bg-red-50 border-2 border-red-300">
          <CardHeader className="relative">
            <div className="flex items-center gap-2">
              <CardTitle className="text-red-900">Costos Fijos Mensuales</CardTitle>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'fixedCosts' ? null : 'fixedCosts')}
                className="text-red-500 hover:text-red-700"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            {activeTooltip === 'fixedCosts' && (
              <TooltipCard
                title={tooltips.fixedCosts.title}
                description={tooltips.fixedCosts.description}
                onClose={() => setActiveTooltip(null)}
              />
            )}
            <CardDescription className="text-red-700">
              Costos que pagas cada mes sin importar cuánto vendas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Fixed Cost */}
            <div className="bg-white p-4 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-gray-700">Agregar Costo Fijo</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFixedCostName}
                  onChange={(e) => setNewFixedCostName(e.target.value)}
                  className="flex-1 rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500"
                  placeholder="Ej: Alquiler"
                />
                <CurrencyInput
                  value={newFixedCostAmount}
                  onChange={setNewFixedCostAmount}
                  placeholder="0"
                  className="w-32"
                />
                <Button
                  type="button"
                  onClick={handleAddFixedCost}
                  size="sm"
                  disabled={!newFixedCostName || newFixedCostAmount <= 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Fixed Costs List */}
            {fixedCostBreakdown.length > 0 && (
              <div className="bg-white p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Desglose de Costos Fijos</p>
                {fixedCostBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        ${item.amount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFixedCost(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t-2 border-gray-300">
                  <span className="text-sm font-bold text-gray-900">Total Costos Fijos Mensuales</span>
                  <span className="text-lg font-bold text-red-900">
                    ${monthlyFixedCosts.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Data */}
        <Card className="bg-green-50 border-2 border-green-300">
          <CardHeader>
            <CardTitle className="text-green-900">Datos de Producción/Ventas</CardTitle>
            <CardDescription className="text-green-700">
              Información sobre tus ventas y capacidad actual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="currentMonthlyUnits" className="block text-sm font-medium text-gray-700">
                  Ventas Mensuales Actuales (unidades)
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(activeTooltip === 'currentSales' ? null : 'currentSales')}
                  className="text-green-500 hover:text-green-700"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              {activeTooltip === 'currentSales' && (
                <TooltipCard
                  title={tooltips.currentSales.title}
                  description={tooltips.currentSales.description}
                  onClose={() => setActiveTooltip(null)}
                />
              )}
              <input
                id="currentMonthlyUnits"
                type="number"
                min="0"
                value={currentMonthlyUnits || ''}
                onChange={(e) => setCurrentMonthlyUnits(e.target.value ? parseInt(e.target.value) : undefined)}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa tus ventas mensuales"
              />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="productionCapacity" className="block text-sm font-medium text-gray-700">
                  Capacidad de Producción Mensual (Opcional)
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(activeTooltip === 'capacity' ? null : 'capacity')}
                  className="text-green-500 hover:text-green-700"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              {activeTooltip === 'capacity' && (
                <TooltipCard
                  title={tooltips.capacity.title}
                  description={tooltips.capacity.description}
                  onClose={() => setActiveTooltip(null)}
                />
              )}
              <input
                id="productionCapacity"
                type="number"
                min="0"
                value={productionCapacity || ''}
                onChange={(e) => setProductionCapacity(e.target.value ? parseInt(e.target.value) : undefined)}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dejar vacío si no aplica"
              />
            </div>
          </CardContent>
        </Card>

        {/* Educational Guide */}
        <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-indigo-300">
          <CardHeader>
            <CardTitle className="text-indigo-900 flex items-center gap-2">
              📚 Guía: ¿Cómo Calcular Tus Costos?
            </CardTitle>
            <CardDescription className="text-indigo-700">
              Aprende a identificar y calcular correctamente tus costos variables y fijos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Variable Costs Guide */}
            <div className="bg-white rounded-lg p-5 border-l-4 border-orange-400">
              <h3 className="font-bold text-orange-900 mb-3 text-lg">🔄 Costos Variables - Paso a Paso</h3>
              <p className="text-sm text-gray-700 mb-3">
                Son los costos que <strong>dependen directamente</strong> de cuántas unidades produces o vendes.
              </p>

              <div className="space-y-3">
                <div className="bg-orange-50 p-3 rounded-md">
                  <p className="font-semibold text-sm text-orange-900 mb-2">Paso 1: Identifica los componentes</p>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                    <li><strong>Materias primas:</strong> materiales que usas para crear cada producto</li>
                    <li><strong>Mano de obra directa:</strong> pago por hora/unidad a quienes producen</li>
                    <li><strong>Empaques:</strong> cajas, bolsas, etiquetas para cada unidad</li>
                    <li><strong>Comisiones:</strong> porcentaje que pagas por cada venta</li>
                    <li><strong>Envíos:</strong> costo de entregar cada producto</li>
                    <li><strong>Servicios de pago:</strong> comisiones de tarjetas o plataformas</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-3 rounded-md">
                  <p className="font-semibold text-sm text-orange-900 mb-2">Paso 2: Ejemplo Práctico</p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p className="font-medium">Si vendes camisetas:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Tela: $8.00</li>
                      <li>• Botones e hilos: $1.50</li>
                      <li>• Costura (mano de obra): $5.00</li>
                      <li>• Empaque: $1.00</li>
                      <li>• Etiqueta: $0.50</li>
                    </ul>
                    <p className="font-bold mt-2 text-orange-900">Total Costo Variable: $16.00 por camiseta</p>
                  </div>
                </div>

                <div className="bg-orange-50 p-3 rounded-md">
                  <p className="font-semibold text-sm text-orange-900 mb-2">Paso 3: Regla de Oro</p>
                  <p className="text-xs text-gray-700 italic">
                    "Si no produzco ni vendo nada este mes, ¿tendría que pagar este costo?"
                    <br />Si la respuesta es NO → Es un <strong>costo variable</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Costs Guide */}
            <div className="bg-white rounded-lg p-5 border-l-4 border-red-400">
              <h3 className="font-bold text-red-900 mb-3 text-lg">📍 Costos Fijos - Paso a Paso</h3>
              <p className="text-sm text-gray-700 mb-3">
                Son los costos que <strong>pagas siempre</strong>, sin importar cuánto vendas o produzcas.
              </p>

              <div className="space-y-3">
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="font-semibold text-sm text-red-900 mb-2">Paso 1: Identifica tus costos mensuales fijos</p>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                    <li><strong>Alquiler:</strong> local, oficina, bodega</li>
                    <li><strong>Salarios fijos:</strong> empleados con sueldo mensual</li>
                    <li><strong>Servicios básicos:</strong> luz, agua, internet, teléfono</li>
                    <li><strong>Seguros:</strong> seguro del local, mercancía, etc.</li>
                    <li><strong>Software/Suscripciones:</strong> plataformas, contabilidad</li>
                    <li><strong>Publicidad fija:</strong> redes sociales, anuncios mensuales</li>
                    <li><strong>Depreciación:</strong> desgaste de maquinaria/equipos</li>
                  </ul>
                </div>

                <div className="bg-red-50 p-3 rounded-md">
                  <p className="font-semibold text-sm text-red-900 mb-2">Paso 2: Ejemplo Práctico</p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p className="font-medium">Tu taller de camisetas:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Alquiler del taller: $500.00/mes</li>
                      <li>• Luz y agua: $80.00/mes</li>
                      <li>• Internet: $30.00/mes</li>
                      <li>• Salario administrador: $800.00/mes</li>
                      <li>• Seguro: $50.00/mes</li>
                      <li>• Publicidad en redes: $100.00/mes</li>
                    </ul>
                    <p className="font-bold mt-2 text-red-900">Total Costos Fijos: $1,560.00/mes</p>
                  </div>
                </div>

                <div className="bg-red-50 p-3 rounded-md">
                  <p className="font-semibold text-sm text-red-900 mb-2">Paso 3: Regla de Oro</p>
                  <p className="text-xs text-gray-700 italic">
                    "Si no vendo nada este mes, ¿aún tengo que pagar esto?"
                    <br />Si la respuesta es SÍ → Es un <strong>costo fijo</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
              <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                💡 Consejos Prácticos
              </h4>
              <ul className="text-xs text-gray-700 space-y-2">
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Revisa tus recibos y facturas</strong> de los últimos 3 meses para tener cifras reales</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>No adivines:</strong> Usa datos reales. Si no tienes datos, haz estimaciones conservadoras</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Separa bien:</strong> Algunos costos tienen parte fija y variable (ej: electricidad)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Actualiza mensualmente:</strong> Los costos cambian, mantén tu análisis actualizado</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Adicionales</CardTitle>
            <CardDescription>
              Cualquier información adicional relevante (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas sobre este análisis..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
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
            disabled={createMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending ? 'Guardando...' : 'Guardar Análisis'}
          </Button>
        </div>
      </form>
    </div>
  );
}

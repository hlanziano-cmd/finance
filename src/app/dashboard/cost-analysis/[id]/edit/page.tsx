// src/app/dashboard/cost-analysis/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Info, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import { useCostAnalysis, useUpdateCostAnalysis } from '@/src/lib/hooks/useCostAnalysis';
import type { CostBreakdownItem } from '@/src/types/models';

export default function EditCostAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: analysis, isLoading } = useCostAnalysis(id);
  const updateMutation = useUpdateCostAnalysis();

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

  // Metadata
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState('');

  // Load existing data
  useEffect(() => {
    if (analysis) {
      setProductName(analysis.productName);
      setProductDescription(analysis.productDescription || '');
      setUnitPrice(analysis.unitPrice);
      setVariableCostPerUnit(analysis.variableCostPerUnit);
      setVariableCostBreakdown(analysis.variableCostBreakdown || []);
      setMonthlyFixedCosts(analysis.monthlyFixedCosts);
      setFixedCostBreakdown(analysis.fixedCostBreakdown || []);
      setCurrentMonthlyUnits(analysis.currentMonthlyUnits);
      setProductionCapacity(analysis.productionCapacity);
      setFiscalYear(analysis.fiscalYear);
      setNotes(analysis.notes || '');
    }
  }, [analysis]);

  // Add Variable Cost
  const handleAddVariableCost = () => {
    if (newVariableCostName && newVariableCostAmount > 0) {
      setVariableCostBreakdown([...variableCostBreakdown, {
        name: newVariableCostName,
        amount: newVariableCostAmount
      }]);
      setNewVariableCostName('');
      setNewVariableCostAmount(0);
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
      setMonthlyFixedCosts(monthlyFixedCosts + newFixedCostAmount);
    }
  };

  const handleRemoveFixedCost = (index: number) => {
    const item = fixedCostBreakdown[index];
    setFixedCostBreakdown(fixedCostBreakdown.filter((_, i) => i !== index));
    setMonthlyFixedCosts(monthlyFixedCosts - item.amount);
  };

  const getPeriodDates = () => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), 11, 31);
    return { periodStart, periodEnd };
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

      await updateMutation.mutateAsync({
        id,
        input: {
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
          notes: notes || undefined,
        }
      });

      router.push(`/dashboard/cost-analysis/${id}`);
    } catch (error) {
      console.error('Error al actualizar análisis:', error);
      alert('Error al actualizar el análisis. Por favor intenta nuevamente.');
    }
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

  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Análisis no encontrado</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Editar Análisis de Costos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Actualiza los datos de tu producto
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
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto <span className="text-red-500">*</span>
              </label>
              <input
                id="productName"
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Camiseta Polo Premium"
              />
            </div>

            <div>
              <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (Opcional)
              </label>
              <textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={2}
                className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción breve del producto..."
              />
            </div>

            <div>
              <label htmlFor="fiscalYear" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="text-blue-900">Precio de Venta</CardTitle>
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
          <CardHeader>
            <CardTitle className="text-orange-900">Costos Variables por Unidad</CardTitle>
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
          <CardHeader>
            <CardTitle className="text-red-900">Costos Fijos Mensuales</CardTitle>
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
            <div>
              <label htmlFor="currentMonthlyUnits" className="block text-sm font-medium text-gray-700 mb-1">
                Ventas Mensuales Actuales (unidades)
              </label>
              <input
                id="currentMonthlyUnits"
                type="number"
                min="0"
                value={currentMonthlyUnits || ''}
                onChange={(e) => setCurrentMonthlyUnits(e.target.value ? parseInt(e.target.value) : undefined)}
                className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa tus ventas mensuales"
              />
            </div>

            <div>
              <label htmlFor="productionCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad de Producción Mensual (Opcional)
              </label>
              <input
                id="productionCapacity"
                type="number"
                min="0"
                value={productionCapacity || ''}
                onChange={(e) => setProductionCapacity(e.target.value ? parseInt(e.target.value) : undefined)}
                className="block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dejar vacío si no aplica"
              />
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
            disabled={updateMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// src/app/dashboard/balances/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, CheckCircle2, Info, Plus, X, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import {
  useBalanceSheet,
  useUpdateBalanceSheet,
  useAddBalanceSheetItem,
  useUpdateBalanceSheetItem,
  useDeleteBalanceSheetItem,
} from '@/src/lib/hooks/useBalanceSheet';
import { validateAccountingEquation } from '@/src/lib/constants/chart-of-accounts';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import type { BalanceSheetItem } from '@/src/types/models';

interface EditableItem extends BalanceSheetItem {
  isNew?: boolean;
  isModified?: boolean;
  toDelete?: boolean;
}

export default function EditBalancePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: balance, isLoading } = useBalanceSheet(id);
  const updateBalanceMutation = useUpdateBalanceSheet(id);
  const addItemMutation = useAddBalanceSheetItem(id);
  const updateItemMutation = useUpdateBalanceSheetItem(id);
  const deleteItemMutation = useDeleteBalanceSheetItem(id);

  // Datos básicos del balance
  const [balanceName, setBalanceName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  // Items editables
  const [items, setItems] = useState<EditableItem[]>([]);

  // Cargar datos del balance cuando esté disponible
  useEffect(() => {
    if (balance) {
      setBalanceName(balance.name);
      setPeriodStart(formatDate(balance.periodStart, 'input'));
      setPeriodEnd(formatDate(balance.periodEnd, 'input'));
      setFiscalYear(balance.fiscalYear);
      setItems(balance.items.map(item => ({ ...item, isModified: false, toDelete: false })));
    }
  }, [balance]);

  // Agrupar items por categoría y subcategoría
  const groupByCategory = (category: 'activo' | 'pasivo' | 'patrimonio') => {
    return items.filter(item => item.category === category && !item.toDelete);
  };

  const groupBySubcategory = (categoryItems: EditableItem[]) => {
    const grouped = new Map<string, EditableItem[]>();
    categoryItems.forEach(item => {
      const existing = grouped.get(item.subcategory) || [];
      grouped.set(item.subcategory, [...existing, item]);
    });
    return grouped;
  };

  // Calcular totales
  const activoItems = groupByCategory('activo');
  const pasivoItems = groupByCategory('pasivo');
  const patrimonioItems = groupByCategory('patrimonio');

  const totalActivo = activoItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPasivo = pasivoItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPatrimonio = patrimonioItems.reduce((sum, item) => sum + item.amount, 0);

  const validation = validateAccountingEquation(totalActivo, totalPasivo, totalPatrimonio);

  const handleItemChange = (itemId: string, field: 'accountName' | 'amount', value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          [field]: value,
          isModified: true,
        };
      }
      return item;
    }));
  };

  const handleAddItem = (category: 'activo' | 'pasivo' | 'patrimonio', subcategory: string) => {
    const accountName = prompt('Nombre de la cuenta:');
    if (!accountName) return;

    const newItem: EditableItem = {
      id: `temp-${Date.now()}`,
      balanceSheetId: id,
      organizationId: balance?.organizationId || null,
      category,
      subcategory,
      accountName,
      accountCode: undefined,
      amount: 0,
      notes: undefined,
      orderIndex: items.length,
      isNew: true,
      isModified: false,
      toDelete: false,
    };

    setItems(prev => [...prev, newItem]);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        if (item.isNew) {
          // Si es nuevo, simplemente lo marcamos para ocultar
          return { ...item, toDelete: true };
        } else {
          // Si ya existe, lo marcamos para eliminar
          return { ...item, toDelete: true };
        }
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      alert('El balance no está cuadrado. Por favor revisa los valores ingresados.');
      return;
    }

    if (!balanceName || !periodStart || !periodEnd) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      // 1. Actualizar información básica del balance
      await updateBalanceMutation.mutateAsync({
        name: balanceName,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        fiscalYear,
      });

      // 2. Procesar items modificados
      for (const item of items) {
        if (item.toDelete && !item.isNew) {
          // Eliminar item existente
          await deleteItemMutation.mutateAsync(item.id);
        } else if (item.isNew && !item.toDelete) {
          // Agregar nuevo item
          await addItemMutation.mutateAsync({
            organizationId: balance?.organizationId || null,
            category: item.category,
            subcategory: item.subcategory,
            accountName: item.accountName,
            accountCode: item.accountCode,
            amount: item.amount,
            notes: item.notes,
            orderIndex: item.orderIndex,
          });
        } else if (item.isModified && !item.toDelete && !item.isNew) {
          // Actualizar item existente
          await updateItemMutation.mutateAsync({
            itemId: item.id,
            updates: {
              accountName: item.accountName,
              amount: item.amount,
              notes: item.notes,
            },
          });
        }
      }

      router.push(`/dashboard/balances/${id}`);
    } catch (error) {
      console.error('Error al actualizar balance:', error);
      alert('Error al actualizar el balance. Por favor intenta nuevamente.');
    }
  };

  const renderAccountSection = (
    title: string,
    category: 'activo' | 'pasivo' | 'patrimonio',
    categoryItems: EditableItem[],
    total: number,
    bgColor: string = 'bg-gray-50'
  ) => {
    const grouped = groupBySubcategory(categoryItems);

    return (
      <div className={`rounded-lg ${bgColor} p-4`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>

        {Array.from(grouped.entries()).map(([subcategory, subcatItems]) => (
          <div key={subcategory} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-800 uppercase">{subcategory}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAddItem(category, subcategory)}
                className="text-blue-600 hover:text-blue-700 h-6"
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {subcatItems.map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={item.accountName}
                      onChange={(e) => handleItemChange(item.id, 'accountName', e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                      placeholder="Nombre de la cuenta"
                    />
                    <CurrencyInput
                      value={item.amount}
                      onChange={(value) => handleItemChange(item.id, 'amount', value)}
                      placeholder="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Eliminar cuenta"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-gray-300 pt-2">
              <span className="text-sm font-semibold text-gray-700">Subtotal {subcategory}:</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(subcatItems.reduce((sum, item) => sum + item.amount, 0))}
              </span>
            </div>
          </div>
        ))}

        <div className="mt-3 flex items-center justify-between border-t-2 border-gray-400 pt-3">
          <span className="font-bold text-gray-900">TOTAL:</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando balance...</p>
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Balance no encontrado</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/balances')}>
            Volver a la lista
          </Button>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Balance General</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modifica la información financiera de tu negocio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Balance</CardTitle>
            <CardDescription>
              Datos generales del balance general
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre del Balance <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={balanceName}
                onChange={(e) => setBalanceName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Balance General Enero 2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="periodStart" className="block text-sm font-medium text-gray-700">
                  Fecha Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  id="periodStart"
                  type="date"
                  required
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="periodEnd" className="block text-sm font-medium text-gray-700">
                  Fecha Fin <span className="text-red-500">*</span>
                </label>
                <input
                  id="periodEnd"
                  type="date"
                  required
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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

        {/* ACTIVO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">ACTIVO</CardTitle>
            <CardDescription>
              Todo lo que tu negocio posee (dinero, inventarios, equipos, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderAccountSection('Activos', 'activo', activoItems, totalActivo, 'bg-green-50')}
          </CardContent>
        </Card>

        {/* PASIVO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">PASIVO</CardTitle>
            <CardDescription>
              Todo lo que tu negocio debe (proveedores, préstamos, salarios, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderAccountSection('Pasivos', 'pasivo', pasivoItems, totalPasivo, 'bg-red-50')}
          </CardContent>
        </Card>

        {/* PATRIMONIO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">PATRIMONIO</CardTitle>
            <CardDescription>
              Recursos propios de tu negocio (tu inversión + ganancias acumuladas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderAccountSection('Patrimonio', 'patrimonio', patrimonioItems, totalPatrimonio, 'bg-blue-50')}
          </CardContent>
        </Card>

        {/* Validación de Ecuación Contable */}
        <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800 mb-3">Ecuación Contable</p>
                <div className="flex items-center gap-4 text-lg font-bold">
                  <div className="bg-emerald-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide">ACTIVOS</p>
                    <p className="text-xl">{formatCurrency(totalActivo)}</p>
                  </div>
                  <span className="text-gray-800 text-3xl font-black">=</span>
                  <div className="bg-rose-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide">PASIVOS</p>
                    <p className="text-xl">{formatCurrency(totalPasivo)}</p>
                  </div>
                  <span className="text-gray-800 text-3xl font-black">+</span>
                  <div className="bg-blue-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide">PATRIMONIO</p>
                    <p className="text-xl">{formatCurrency(totalPatrimonio)}</p>
                  </div>
                </div>
                {!validation.isValid && (
                  <p className="mt-3 text-sm text-red-700 font-semibold bg-red-100 px-4 py-2 rounded-lg inline-block">
                    ⚠️ Advertencia: La ecuación contable no está balanceada (diferencia: {formatCurrency(validation.difference)})
                  </p>
                )}
                {validation.isValid && (
                  <p className="mt-3 text-sm text-green-700 font-semibold bg-green-100 px-4 py-2 rounded-lg inline-block">
                    ✓ La ecuación contable está balanceada correctamente
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
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
            disabled={!validation.isValid || updateBalanceMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateBalanceMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}

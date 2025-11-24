// src/app/dashboard/balances/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, CheckCircle2, Info, Plus, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LabelWithTooltip } from '@/src/components/ui/Tooltip';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import { useCreateBalanceSheet, useAddBalanceSheetItem } from '@/src/lib/hooks/useBalanceSheet';
import {
  ACTIVO_CORRIENTE_SIMPLE,
  ACTIVO_NO_CORRIENTE_SIMPLE,
  PASIVO_CORRIENTE_SIMPLE,
  PASIVO_NO_CORRIENTE_SIMPLE,
  PATRIMONIO_SIMPLE,
  type SimplifiedAccount,
} from '@/src/lib/constants/simplified-accounts';
import { validateAccountingEquation } from '@/src/lib/constants/chart-of-accounts';
import { formatCurrency } from '@/src/lib/utils';

export default function NewBalancePage() {
  const router = useRouter();
  const createBalanceMutation = useCreateBalanceSheet();
  const [createdBalanceId, setCreatedBalanceId] = useState<string | null>(null);
  const addItemMutation = useAddBalanceSheetItem(createdBalanceId || '');

  // Datos básicos del balance
  const [balanceName, setBalanceName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  // Valores de las cuentas
  const [accountValues, setAccountValues] = useState<Record<string, number>>({});

  // Cuentas adicionales por categoría
  const [customAccounts, setCustomAccounts] = useState<{
    activoCorriente: SimplifiedAccount[];
    activoNoCorriente: SimplifiedAccount[];
    pasivoCorriente: SimplifiedAccount[];
    pasivoNoCorriente: SimplifiedAccount[];
    patrimonio: SimplifiedAccount[];
  }>({
    activoCorriente: [],
    activoNoCorriente: [],
    pasivoCorriente: [],
    pasivoNoCorriente: [],
    patrimonio: [],
  });

  // Calcular totales incluyendo cuentas personalizadas
  const totalActivoCorriente = [...ACTIVO_CORRIENTE_SIMPLE, ...customAccounts.activoCorriente].reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );
  const totalActivoNoCorriente = [...ACTIVO_NO_CORRIENTE_SIMPLE, ...customAccounts.activoNoCorriente].reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );
  const totalActivo = totalActivoCorriente + totalActivoNoCorriente;

  const totalPasivoCorriente = [...PASIVO_CORRIENTE_SIMPLE, ...customAccounts.pasivoCorriente].reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );
  const totalPasivoNoCorriente = [...PASIVO_NO_CORRIENTE_SIMPLE, ...customAccounts.pasivoNoCorriente].reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );
  const totalPasivo = totalPasivoCorriente + totalPasivoNoCorriente;

  const totalPatrimonio = [...PATRIMONIO_SIMPLE, ...customAccounts.patrimonio].reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );

  // Validación de ecuación contable
  const validation = validateAccountingEquation(totalActivo, totalPasivo, totalPatrimonio);

  const handleAccountChange = (code: string, value: number) => {
    setAccountValues(prev => ({ ...prev, [code]: value }));
  };

  const handleAddAccount = (category: keyof typeof customAccounts) => {
    const accountName = prompt('Nombre de la cuenta:');
    if (!accountName) return;

    const accountCode = `CUSTOM_${category}_${Date.now()}`;

    // Mapear la categoría del estado a las categorías del modelo
    const categoryMap: Record<keyof typeof customAccounts, { category: SimplifiedAccount['category'], subcategory: string }> = {
      activoCorriente: { category: 'activo', subcategory: 'Activo Corriente' },
      activoNoCorriente: { category: 'activo', subcategory: 'Activo No Corriente' },
      pasivoCorriente: { category: 'pasivo', subcategory: 'Pasivo Corriente' },
      pasivoNoCorriente: { category: 'pasivo', subcategory: 'Pasivo No Corriente' },
      patrimonio: { category: 'patrimonio', subcategory: 'Patrimonio' },
    };

    const { category: accountCategory, subcategory } = categoryMap[category];

    const newAccount: SimplifiedAccount = {
      code: accountCode,
      name: accountName,
      description: 'Cuenta personalizada',
      category: accountCategory,
      subcategory: subcategory,
      examples: [],
    };

    setCustomAccounts(prev => ({
      ...prev,
      [category]: [...prev[category], newAccount],
    }));
  };

  const handleRemoveAccount = (category: keyof typeof customAccounts, code: string) => {
    setCustomAccounts(prev => ({
      ...prev,
      [category]: prev[category].filter(acc => acc.code !== code),
    }));

    // Eliminar el valor de la cuenta también
    setAccountValues(prev => {
      const newValues = { ...prev };
      delete newValues[code];
      return newValues;
    });
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
      // 1. Crear el balance
      const newBalance = await createBalanceMutation.mutateAsync({
        name: balanceName,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        fiscalYear,
      });

      // 2. Guardar todos los items con valor mayor a 0
      const allAccounts = [
        ...ACTIVO_CORRIENTE_SIMPLE.map(acc => ({ ...acc, category: 'activo' as const, subcategory: 'Activo Corriente' })),
        ...ACTIVO_NO_CORRIENTE_SIMPLE.map(acc => ({ ...acc, category: 'activo' as const, subcategory: 'Activo No Corriente' })),
        ...customAccounts.activoCorriente.map(acc => ({ ...acc, category: 'activo' as const, subcategory: 'Activo Corriente' })),
        ...customAccounts.activoNoCorriente.map(acc => ({ ...acc, category: 'activo' as const, subcategory: 'Activo No Corriente' })),
        ...PASIVO_CORRIENTE_SIMPLE.map(acc => ({ ...acc, category: 'pasivo' as const, subcategory: 'Pasivo Corriente' })),
        ...PASIVO_NO_CORRIENTE_SIMPLE.map(acc => ({ ...acc, category: 'pasivo' as const, subcategory: 'Pasivo No Corriente' })),
        ...customAccounts.pasivoCorriente.map(acc => ({ ...acc, category: 'pasivo' as const, subcategory: 'Pasivo Corriente' })),
        ...customAccounts.pasivoNoCorriente.map(acc => ({ ...acc, category: 'pasivo' as const, subcategory: 'Pasivo No Corriente' })),
        ...PATRIMONIO_SIMPLE.map(acc => ({ ...acc, category: 'patrimonio' as const, subcategory: 'Patrimonio' })),
        ...customAccounts.patrimonio.map(acc => ({ ...acc, category: 'patrimonio' as const, subcategory: 'Patrimonio' })),
      ];

      // Crear servicio para agregar items
      const { createClient } = await import('@/src/lib/supabase/client');
      const supabase = createClient();
      const { BalanceSheetService } = await import('@/src/services/balance-sheet.service');
      const service = new BalanceSheetService(supabase);

      // Agregar items con valor > 0
      for (const account of allAccounts) {
        const value = accountValues[account.code] || 0;
        if (value > 0) {
          await service.addItem(newBalance.id, {
            organizationId: newBalance.organizationId,
            category: account.category,
            subcategory: account.subcategory,
            accountName: account.name,
            accountCode: account.code,
            amount: value,
            notes: undefined,
            orderIndex: 0,
          });
        }
      }

      router.push('/dashboard/balances');
    } catch (error) {
      console.error('Error al crear balance:', error);
      alert('Error al crear el balance. Por favor intenta nuevamente.');
    }
  };

  const renderAccountSection = (
    title: string,
    baseAccounts: SimplifiedAccount[],
    customAccountsForCategory: SimplifiedAccount[],
    category: keyof typeof customAccounts,
    total: number,
    bgColor: string = 'bg-gray-50'
  ) => {
    const allAccounts = [...baseAccounts, ...customAccountsForCategory];

    return (
      <div className={`rounded-lg ${bgColor} p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleAddAccount(category)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar cuenta
          </Button>
        </div>
        <div className="space-y-3">
          {allAccounts.map((account) => {
            const isCustom = account.code.startsWith('CUSTOM_');
            return (
              <div key={account.code} className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <LabelWithTooltip
                      label={account.name}
                      tooltip={account.description}
                      examples={account.examples}
                      htmlFor={`account-${account.code}`}
                    />
                    {isCustom && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAccount(category, account.code)}
                        className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar cuenta"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-1">
                    <CurrencyInput
                      id={`account-${account.code}`}
                      value={accountValues[account.code] || 0}
                      onChange={(value) => handleAccountChange(account.code, value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-gray-300 pt-3">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Balance General</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra la situación financiera de tu negocio
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
            <CardTitle className="text-blue-600">ACTIVO</CardTitle>
            <CardDescription>
              Todo lo que tu negocio posee (dinero, inventarios, equipos, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderAccountSection('Activo Corriente (Corto Plazo)', ACTIVO_CORRIENTE_SIMPLE, customAccounts.activoCorriente, 'activoCorriente', totalActivoCorriente, 'bg-blue-50')}
            {renderAccountSection('Activo No Corriente (Largo Plazo)', ACTIVO_NO_CORRIENTE_SIMPLE, customAccounts.activoNoCorriente, 'activoNoCorriente', totalActivoNoCorriente, 'bg-blue-50')}

            <div className="rounded-lg bg-blue-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-900">TOTAL ACTIVO:</span>
                <span className="text-2xl font-bold text-blue-900">{formatCurrency(totalActivo)}</span>
              </div>
            </div>
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
          <CardContent className="space-y-4">
            {renderAccountSection('Pasivo Corriente (Corto Plazo)', PASIVO_CORRIENTE_SIMPLE, customAccounts.pasivoCorriente, 'pasivoCorriente', totalPasivoCorriente, 'bg-red-50')}
            {renderAccountSection('Pasivo No Corriente (Largo Plazo)', PASIVO_NO_CORRIENTE_SIMPLE, customAccounts.pasivoNoCorriente, 'pasivoNoCorriente', totalPasivoNoCorriente, 'bg-red-50')}

            <div className="rounded-lg bg-red-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-red-900">TOTAL PASIVO:</span>
                <span className="text-2xl font-bold text-red-900">{formatCurrency(totalPasivo)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PATRIMONIO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">PATRIMONIO</CardTitle>
            <CardDescription>
              Recursos propios de tu negocio (tu inversión + ganancias acumuladas)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderAccountSection('Patrimonio', PATRIMONIO_SIMPLE, customAccounts.patrimonio, 'patrimonio', totalPatrimonio, 'bg-green-50')}

            <div className="rounded-lg bg-green-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-900">TOTAL PATRIMONIO:</span>
                <span className="text-2xl font-bold text-green-900">{formatCurrency(totalPatrimonio)}</span>
              </div>
            </div>
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
                    <p className="text-xl">{formatCurrency(validation.totalActivo)}</p>
                  </div>
                  <span className="text-gray-800 text-3xl font-black">=</span>
                  <div className="bg-rose-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide">PASIVOS</p>
                    <p className="text-xl">{formatCurrency(validation.totalPasivo)}</p>
                  </div>
                  <span className="text-gray-800 text-3xl font-black">+</span>
                  <div className="bg-blue-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide">PATRIMONIO</p>
                    <p className="text-xl">{formatCurrency(validation.totalPatrimonio)}</p>
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
            disabled={!validation.isValid || createBalanceMutation.isPending}
          >
            {createBalanceMutation.isPending ? 'Guardando...' : 'Guardar Balance'}
          </Button>
        </div>
      </form>
    </div>
  );
}

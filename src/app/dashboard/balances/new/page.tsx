// src/app/dashboard/balances/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LabelWithTooltip } from '@/src/components/ui/Tooltip';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import { useCreateBalanceSheet } from '@/src/lib/hooks/useBalanceSheet';
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

  // Datos básicos del balance
  const [balanceName, setBalanceName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  // Valores de las cuentas
  const [accountValues, setAccountValues] = useState<Record<string, number>>({});

  // Calcular totales
  const totalActivoCorriente = ACTIVO_CORRIENTE_SIMPLE.reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );
  const totalActivoNoCorriente = ACTIVO_NO_CORRIENTE_SIMPLE.reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );
  const totalActivo = totalActivoCorriente + totalActivoNoCorriente;

  const totalPasivoCorriente = PASIVO_CORRIENTE_SIMPLE.reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );
  const totalPasivoNoCorriente = PASIVO_NO_CORRIENTE_SIMPLE.reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );
  const totalPasivo = totalPasivoCorriente + totalPasivoNoCorriente;

  const totalPatrimonio = PATRIMONIO_SIMPLE.reduce(
    (sum, acc) => sum + (accountValues[acc.code] || 0),
    0
  );

  // Validación de ecuación contable
  const validation = validateAccountingEquation(totalActivo, totalPasivo, totalPatrimonio);

  const handleAccountChange = (code: string, value: number) => {
    setAccountValues(prev => ({ ...prev, [code]: value }));
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
      await createBalanceMutation.mutateAsync({
        name: balanceName,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        fiscalYear,
      });

      router.push('/dashboard/balances');
    } catch (error) {
      console.error('Error al crear balance:', error);
      alert('Error al crear el balance. Por favor intenta nuevamente.');
    }
  };

  const renderAccountSection = (
    title: string,
    accounts: SimplifiedAccount[],
    total: number,
    bgColor: string = 'bg-gray-50'
  ) => (
    <div className={`rounded-lg ${bgColor} p-4`}>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="space-y-3">
        {accounts.map((account) => (
          <div key={account.code} className="flex items-start gap-2">
            <div className="flex-1">
              <LabelWithTooltip
                label={account.name}
                tooltip={account.description}
                examples={account.examples}
                htmlFor={`account-${account.code}`}
              />
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
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-300 pt-3">
        <span className="font-semibold text-gray-900">Total:</span>
        <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>
    </div>
  );

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
            {renderAccountSection('Activo Corriente (Corto Plazo)', ACTIVO_CORRIENTE_SIMPLE, totalActivoCorriente, 'bg-blue-50')}
            {renderAccountSection('Activo No Corriente (Largo Plazo)', ACTIVO_NO_CORRIENTE_SIMPLE, totalActivoNoCorriente, 'bg-blue-50')}

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
            {renderAccountSection('Pasivo Corriente (Corto Plazo)', PASIVO_CORRIENTE_SIMPLE, totalPasivoCorriente, 'bg-red-50')}
            {renderAccountSection('Pasivo No Corriente (Largo Plazo)', PASIVO_NO_CORRIENTE_SIMPLE, totalPasivoNoCorriente, 'bg-red-50')}

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
            {renderAccountSection('Patrimonio', PATRIMONIO_SIMPLE, totalPatrimonio, 'bg-green-50')}

            <div className="rounded-lg bg-green-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-900">TOTAL PATRIMONIO:</span>
                <span className="text-2xl font-bold text-green-900">{formatCurrency(totalPatrimonio)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validación de Ecuación Contable */}
        <Card className={validation.isValid ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {validation.isValid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <h3 className="text-lg font-semibold">Ecuación Contable</h3>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="mb-3 text-sm font-medium text-gray-600">
                  ACTIVO = PASIVO + PATRIMONIO
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Activo:</span>
                    <span className="font-mono">{formatCurrency(validation.totalActivo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pasivo + Patrimonio:</span>
                    <span className="font-mono">
                      {formatCurrency(validation.totalPasivo + validation.totalPatrimonio)}
                    </span>
                  </div>
                  {!validation.isValid && (
                    <div className="flex justify-between border-t border-gray-300 pt-1 text-red-600">
                      <span>Diferencia:</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(validation.difference)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className={`text-sm ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {validation.message}
              </p>

              {!validation.isValid && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>
                    El balance debe estar cuadrado antes de guardarlo. Revisa que el total de activos
                    sea igual a la suma de pasivos y patrimonio.
                  </p>
                </div>
              )}
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

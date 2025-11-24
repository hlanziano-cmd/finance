// src/app/dashboard/balances/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useBalanceSheet } from '@/src/lib/hooks/useBalanceSheet';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import { exportBalanceSheetToPDF } from '@/src/lib/utils/pdf-export';

export default function BalanceSheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: balance, isLoading } = useBalanceSheet(id);

  const handleExportPDF = () => {
    if (balance) {
      exportBalanceSheetToPDF(balance);
    }
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

  const totals = balance.totals || {
    totalActivo: 0,
    totalActivoCorriente: 0,
    totalActivoNoCorriente: 0,
    totalPasivo: 0,
    totalPasivoCorriente: 0,
    totalPasivoNoCorriente: 0,
    totalPatrimonio: 0,
    isBalanced: false,
    difference: 0
  };

  const totalAssets = totals.totalActivo;
  const totalLiabilities = totals.totalPasivo;
  const totalEquity = totals.totalPatrimonio;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  // Agrupar items por categoría y subcategoría
  const activoItems = balance.items.filter(item => item.category === 'activo');
  const pasivoItems = balance.items.filter(item => item.category === 'pasivo');
  const patrimonioItems = balance.items.filter(item => item.category === 'patrimonio');

  // Agrupar por subcategoría
  const groupBySubcategory = (items: typeof balance.items) => {
    const grouped = new Map<string, typeof balance.items>();
    items.forEach(item => {
      const existing = grouped.get(item.subcategory) || [];
      grouped.set(item.subcategory, [...existing, item]);
    });
    return grouped;
  };

  const activoGrouped = groupBySubcategory(activoItems);
  const pasivoGrouped = groupBySubcategory(pasivoItems);
  const patrimonioGrouped = groupBySubcategory(patrimonioItems);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{balance.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(balance.periodStart, 'short')} - {formatDate(balance.periodEnd, 'short')} | Año Fiscal {balance.fiscalYear}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/balances/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Ecuación Contable */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800 mb-3">Ecuación Contable</p>
              <div className="flex items-center gap-4 text-lg font-bold">
                <div className="bg-emerald-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <p className="text-xs font-semibold mb-1 uppercase tracking-wide">ACTIVOS</p>
                  <p className="text-xl">{formatCurrency(totalAssets)}</p>
                </div>
                <span className="text-gray-800 text-3xl font-black">=</span>
                <div className="bg-rose-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <p className="text-xs font-semibold mb-1 uppercase tracking-wide">PASIVOS</p>
                  <p className="text-xl">{formatCurrency(totalLiabilities)}</p>
                </div>
                <span className="text-gray-800 text-3xl font-black">+</span>
                <div className="bg-blue-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <p className="text-xs font-semibold mb-1 uppercase tracking-wide">PATRIMONIO</p>
                  <p className="text-xl">{formatCurrency(totalEquity)}</p>
                </div>
              </div>
              {Math.abs(totalAssets - totalLiabilitiesAndEquity) > 0.01 && (
                <p className="mt-3 text-sm text-red-700 font-semibold bg-red-100 px-4 py-2 rounded-lg inline-block">
                  ⚠️ Advertencia: La ecuación contable no está balanceada (diferencia: {formatCurrency(Math.abs(totalAssets - totalLiabilitiesAndEquity))})
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet Display */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ACTIVOS */}
        <Card>
          <CardHeader className="bg-green-50 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <TrendingUp className="h-5 w-5" />
              ACTIVOS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {Array.from(activoGrouped.entries()).map(([subcategory, items]) => (
              <div key={subcategory}>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">{subcategory}</h4>
                <div className="space-y-2 text-sm">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-gray-700">{item.accountName}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Subtotal {subcategory}</span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t-2 border-green-300">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-gray-900">TOTAL ACTIVOS</span>
                <span className="text-lg font-bold text-green-700">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PASIVOS Y PATRIMONIO */}
        <Card>
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <TrendingDown className="h-5 w-5" />
              PASIVOS Y PATRIMONIO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Pasivos */}
            {Array.from(pasivoGrouped.entries()).map(([subcategory, items]) => (
              <div key={subcategory}>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">{subcategory}</h4>
                <div className="space-y-2 text-sm">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-gray-700">{item.accountName}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Subtotal {subcategory}</span>
                    <span className="font-bold text-red-700">
                      {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t-2 border-red-300">
              <div className="flex justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">TOTAL PASIVOS</span>
                <span className="text-lg font-bold text-red-700">{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>

            {/* Patrimonio */}
            {Array.from(patrimonioGrouped.entries()).map(([subcategory, items]) => (
              <div key={subcategory}>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">{subcategory}</h4>
                <div className="space-y-2 text-sm">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-gray-700">{item.accountName}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Subtotal {subcategory}</span>
                    <span className="font-bold text-blue-700">
                      {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">TOTAL PATRIMONIO</span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(totalEquity)}</span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-gray-400">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-gray-900">TOTAL PASIVOS + PATRIMONIO</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

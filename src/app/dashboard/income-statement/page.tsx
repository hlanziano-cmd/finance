// src/app/dashboard/income-statement/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Calendar, Edit, Eye, FileDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useIncomeStatements, useDeleteIncomeStatement } from '@/src/lib/hooks/useIncomeStatement';
import { formatCurrency } from '@/src/lib/utils';
import { exportIncomeStatementToPDF } from '@/src/lib/utils/pdf-export';

export default function IncomeStatementPage() {
  const router = useRouter();
  const { data: statements, isLoading } = useIncomeStatements();
  const deleteMutation = useDeleteIncomeStatement();

  // Calcular totales
  const totalRevenue = statements?.reduce((sum: number, s: any) => sum + s.revenue, 0) || 0;
  const totalExpenses = statements?.reduce((sum: number, s: any) => sum + (s.cost_of_sales + s.operating_expenses + s.non_operating_expenses), 0) || 0;
  const totalNetProfit = statements?.reduce((sum: number, s: any) => sum + s.net_profit, 0) || 0;

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el estado de resultados "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando estados de resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estado de Resultados</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra tus ingresos y gastos para conocer tu utilidad
          </p>
        </div>
        <Link href="/dashboard/income-statement/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Estado de Resultados
          </Button>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="mt-2 text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                <p className="mt-1 text-xs text-gray-500">{statements?.length || 0} períodos</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gastos Totales</p>
                <p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="mt-1 text-xs text-gray-500">Costos + Gastos</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilidad Neta Acumulada</p>
                <p className={`mt-2 text-2xl font-bold ${totalNetProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(totalNetProfit)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {totalRevenue > 0 ? `${((totalNetProfit / totalRevenue) * 100).toFixed(1)}% margen` : '0% margen'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Estados de Resultados */}
      {!statements || statements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No hay estados de resultados
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              Crea tu primer estado de resultados para ver el análisis de tu rentabilidad
            </p>
            <Link href="/dashboard/income-statement/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Crear Estado de Resultados
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(statements || []).map((statement: any) => (
            <Card key={statement.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{statement.name}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        statement.net_profit >= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {statement.net_profit >= 0 ? 'Utilidad' : 'Pérdida'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(statement.period_start)} - {formatDate(statement.period_end)}
                      </div>
                      <div>
                        Año Fiscal: {statement.fiscal_year}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-gray-500">Ingresos</p>
                        <p className="mt-1 text-sm font-semibold text-green-600">
                          {formatCurrency(statement.revenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Utilidad Bruta</p>
                        <p className="mt-1 text-sm font-semibold text-blue-600">
                          {formatCurrency(statement.gross_profit)}
                        </p>
                        <p className="text-xs text-gray-500">{statement.gross_margin.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Utilidad Operacional</p>
                        <p className="mt-1 text-sm font-semibold text-purple-600">
                          {formatCurrency(statement.operating_profit)}
                        </p>
                        <p className="text-xs text-gray-500">{statement.operating_margin.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Utilidad Neta</p>
                        <p className={`mt-1 text-sm font-semibold ${statement.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(statement.net_profit)}
                        </p>
                        <p className="text-xs text-gray-500">{statement.net_margin.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Barra visual de rentabilidad */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                statement.net_margin > 15 ? 'bg-green-500' :
                                statement.net_margin > 5 ? 'bg-yellow-500' :
                                statement.net_margin > 0 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(Math.abs(statement.net_margin), 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-12 text-right">
                          {statement.net_margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportIncomeStatementToPDF(statement)}
                      title="Exportar a PDF"
                    >
                      <FileDown className="h-4 w-4 text-green-600" />
                    </Button>
                    <Link href={`/dashboard/income-statement/${statement.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(statement.id, statement.name)}
                      disabled={deleteMutation.isPending}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

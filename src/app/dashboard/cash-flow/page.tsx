// src/app/dashboard/cash-flow/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Calendar, Edit, FileDown, Download, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useCashFlows, useDeleteCashFlow, useCashFlow } from '@/src/lib/hooks/useCashFlow';
import { formatCurrency } from '@/src/lib/utils';
import { exportCashFlowToPDF } from '@/src/lib/utils/pdf-export';

export default function CashFlowPage() {
  const router = useRouter();
  const { data: cashFlows, isLoading } = useCashFlows();
  const deleteMutation = useDeleteCashFlow();

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el flujo de caja "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleExportPDF = async (id: string) => {
    // Necesitamos obtener el flujo de caja completo con períodos
    router.push(`/dashboard/cash-flow/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando flujos de caja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flujo de Caja Operacional</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las entradas y salidas de efectivo de tu negocio
          </p>
        </div>
        <Link href="/dashboard/cash-flow/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Flujo de Caja
          </Button>
        </Link>
      </div>

      {/* Info Cards */}
      {cashFlows && cashFlows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Flujos</p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">{cashFlows.length}</p>
                  <p className="mt-1 text-xs text-gray-500">Registros activos</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Último Año</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    {Math.max(...(cashFlows || []).map((cf: any) => cf.fiscal_year))}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Año fiscal más reciente</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="mt-2 text-2xl font-bold text-purple-600">Activo</p>
                  <p className="mt-1 text-xs text-gray-500">Sistema operativo</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Flujos de Caja */}
      {!cashFlows || cashFlows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No hay flujos de caja registrados
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              Crea tu primer flujo de caja para monitorear tus entradas y salidas de efectivo
            </p>
            <Link href="/dashboard/cash-flow/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Crear Flujo de Caja
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cashFlows.map((cashFlow) => (
            <Card key={cashFlow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{cashFlow.name}</h3>
                      <span className="rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                        Año {cashFlow.fiscal_year}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(cashFlow.created_at).toLocaleDateString('es-CO')}
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Gestión de entradas y salidas de efectivo mensuales
                    </p>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Link href={`/dashboard/cash-flow/${cashFlow.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/cash-flow/${cashFlow.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-green-600" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportPDF(cashFlow.id)}
                      title="Descargar PDF"
                    >
                      <Download className="h-4 w-4 text-purple-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cashFlow.id, cashFlow.name)}
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

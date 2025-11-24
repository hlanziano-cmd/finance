// src/app/balances/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Eye, Edit, Trash2, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/src/components/ui/Table';
import { useOrganization } from '@/src/lib/hooks/useOrganization';
import { useBalanceSheets, useDeleteBalanceSheet } from '@/src/lib/hooks/useBalanceSheet';
import { formatDate, formatCurrency } from '@/src/lib/utils';

export default function BalancesPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useBalanceSheets({ limit, offset: (page - 1) * limit });
  const deleteBalanceMutation = useDeleteBalanceSheet();

  const balances = data?.data || [];

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este balance? Esta acción no se puede deshacer.')) {
      await deleteBalanceMutation.mutateAsync(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'warning',
      final: 'success',
      archived: 'default',
    } as const;
    return variants[status as keyof typeof variants] || 'default';
  };

  const totalPages = data?.pagination ? Math.ceil(data.pagination.totalItems / limit) : 0;

  if (!currentOrganization) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No hay organización seleccionada</CardTitle>
            <CardDescription>
              Selecciona una organización para ver sus balances.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance General</h1>
          <p className="mt-1 text-sm text-gray-500">
            Estados de situación financiera de {currentOrganization.name}
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/balances/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Balance
        </Button>
      </div>

      {/* Summary Cards */}
      {balances.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Balances</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{data?.pagination?.totalItems || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Borradores</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {balances.filter(b => b.status === 'draft').length}
                  </p>
                </div>
                <Edit className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Finalizados</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {balances.filter(b => b.status === 'final').length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Balances</CardTitle>
          <CardDescription>
            Todos los balances generales registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-500">Cargando balances...</p>
              </div>
            </div>
          ) : balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No hay balances registrados
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Crea tu primer balance general para comenzar.
              </p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/balances/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Balance
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Año Fiscal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total Activos</TableHead>
                  <TableHead>Última modificación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell className="font-medium">{balance.name}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(balance.periodStart, 'short')} - {formatDate(balance.periodEnd, 'short')}
                    </TableCell>
                    <TableCell>{balance.fiscalYear}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(balance.status)}>
                        {balance.status === 'draft' ? 'Borrador' : balance.status === 'final' ? 'Finalizado' : 'Archivado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {balance.totals ? formatCurrency(balance.totals.totalActivo) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(balance.updatedAt || balance.createdAt, 'short')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="sm" title="Ver detalles">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {balance.status === 'draft' && (
                          <Button variant="ghost" size="sm" title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" title="Exportar">
                          <Download className="h-4 w-4" />
                        </Button>
                        {balance.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Eliminar"
                            onClick={() => handleDelete(balance.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {balances.length > 0 && data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, data.pagination.totalItems)} de {data.pagination.totalItems} balances
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination.hasPreviousPage}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination.hasNextPage}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

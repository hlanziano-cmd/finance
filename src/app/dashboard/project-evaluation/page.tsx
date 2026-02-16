// src/app/dashboard/project-evaluation/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Eye,
  Trash2,
  ClipboardList,
  Calendar,
  CalendarDays,
  X,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/src/components/ui/Table';
import { Badge } from '@/src/components/ui/Badge';
import {
  useProjectEvaluations,
  useCreateProjectEvaluation,
  useDeleteProjectEvaluation,
} from '@/src/lib/hooks/useProjectEvaluation';
import { formatDate } from '@/src/lib/utils';
import type { ProjectEvaluation } from '@/src/services/project-evaluation.service';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function ProjectEvaluationPage() {
  const router = useRouter();
  const { data: projects = [], isLoading } = useProjectEvaluations();
  const createMutation = useCreateProjectEvaluation();
  const deleteMutation = useDeleteProjectEvaluation();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    periodType: 'months' as 'months' | 'years',
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear(),
    numPeriods: 12,
  });

  const monthlyCount = (projects as ProjectEvaluation[]).filter(p => p.period_type === 'months').length;
  const yearlyCount = (projects as ProjectEvaluation[]).filter(p => p.period_type === 'years').length;

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      periodType: 'months',
      startMonth: new Date().getMonth() + 1,
      startYear: new Date().getFullYear(),
      numPeriods: 12,
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const project = await createMutation.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      periodType: formData.periodType,
      startMonth: formData.periodType === 'months' ? formData.startMonth : undefined,
      startYear: formData.startYear,
      numPeriods: formData.numPeriods,
      items: { incomes: [], expenses: [] },
      loans: [],
    });

    resetForm();
    router.push(`/dashboard/project-evaluation/${project.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evaluación de Proyectos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analiza el presupuesto de tus proyectos con ingresos, gastos y préstamos
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Proyectos</p>
                <p className="text-xl font-bold text-gray-900">{(projects as ProjectEvaluation[]).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <CalendarDays className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Proyectos Mensuales</p>
                <p className="text-xl font-bold text-gray-900">{monthlyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Proyectos Anuales</p>
                <p className="text-xl font-bold text-gray-900">{yearlyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevo Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del proyecto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Apertura nueva sucursal"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ej: Proyecto de expansión 2025"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de periodo *
                  </label>
                  <select
                    value={formData.periodType}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      periodType: e.target.value as 'months' | 'years',
                      numPeriods: e.target.value === 'months' ? 12 : 5,
                    }))}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="months">Meses</option>
                    <option value="years">Años</option>
                  </select>
                </div>

                {formData.periodType === 'months' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mes inicio
                    </label>
                    <select
                      value={formData.startMonth}
                      onChange={(e) => setFormData(prev => ({ ...prev, startMonth: parseInt(e.target.value) }))}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <option key={i} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año inicio *
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.startYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, startYear: parseInt(e.target.value) }))}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de periodos *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.numPeriods}
                    onChange={(e) => setFormData(prev => ({ ...prev, numPeriods: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" isLoading={createMutation.isPending}>
                  <Check className="h-4 w-4 mr-1" />
                  Crear Proyecto
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Mis Proyectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(projects as ProjectEvaluation[]).length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No tienes proyectos
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Crea tu primer proyecto para comenzar a evaluar presupuestos
              </p>
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Periodos</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(projects as ProjectEvaluation[]).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-gray-500">{project.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.period_type === 'months' ? 'info' : 'success'} size="sm">
                        {project.period_type === 'months' ? 'Mensual' : 'Anual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {project.num_periods} {project.period_type === 'months' ? 'meses' : 'años'}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {project.period_type === 'months' && project.start_month
                        ? `${MONTH_NAMES[project.start_month - 1]} ${project.start_year}`
                        : project.start_year}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(project.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/project-evaluation/${project.id}`)}
                          title="Ver presupuesto"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

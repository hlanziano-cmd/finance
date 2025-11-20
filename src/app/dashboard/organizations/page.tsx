// src/app/dashboard/organizations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Users, Crown, Shield, Edit, Trash2, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useOrganizations, useDeleteOrganization } from '@/src/lib/hooks/useOrganizations';
import { useOrganization } from '@/src/lib/hooks/useOrganization';
import { formatDate } from '@/src/lib/utils';

export default function OrganizationsPage() {
  const { data, isLoading } = useOrganizations();
  const { currentOrganization, setCurrentOrganization } = useOrganization();
  const deleteOrganization = useDeleteOrganization();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const organizations = data?.data || [];

  // Seleccionar automáticamente la primera organización si no hay ninguna seleccionada
  useEffect(() => {
    if (organizations.length > 0 && !currentOrganization) {
      console.log('Auto-selecting first organization:', organizations[0]);
      setCurrentOrganization(organizations[0]);
    }
  }, [organizations, currentOrganization, setCurrentOrganization]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta organización? Esta acción eliminará todos sus datos asociados y no se puede deshacer.')) {
      await deleteOrganization.mutateAsync(id);
    }
  };

  const handleSelectOrganization = (org: any) => {
    setCurrentOrganization(org);
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning'> = {
      free: 'default',
      professional: 'success',
      enterprise: 'warning',
    };
    return variants[plan] || 'default';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-amber-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando organizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizaciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona tus organizaciones y sus configuraciones
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Organización
        </Button>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Building2 className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No hay organizaciones
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Crea tu primera organización para comenzar.
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Crear Organización
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => {
            const isCurrentOrg = currentOrganization?.id === org.id;

            return (
              <Card
                key={org.id}
                className={`transition-all ${isCurrentOrg ? 'ring-2 ring-blue-500' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <div className="mt-1 flex items-center space-x-2">
                          <Badge variant={getPlanBadge(org.subscriptionPlan)}>
                            {org.subscriptionPlan}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Creada</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(org.createdAt, 'short')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Estado</span>
                      <span className="font-medium text-gray-900">
                        {org.subscriptionStatus}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2">
                      {!isCurrentOrg ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSelectOrganization(org)}
                        >
                          Seleccionar
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm" className="flex-1" disabled>
                          Seleccionada
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Configuración"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Eliminar"
                        onClick={() => handleDelete(org.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Section */}
      {organizations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{organizations.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {organizations.filter(o => o.subscriptionStatus === 'active').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">En Trial</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {organizations.filter(o => o.subscriptionStatus === 'trial').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Inactivas</p>
                <p className="mt-2 text-3xl font-bold text-gray-600">
                  {organizations.filter(o => o.subscriptionStatus === 'inactive').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

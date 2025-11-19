// src/app/dashboard/team/page.tsx
'use client';

import { Plus, UserPlus, Mail, Shield, Crown, Eye, Edit as EditIcon, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/src/components/ui/Table';
import { useOrganization } from '@/src/lib/hooks/useOrganization';
import { formatDate } from '@/src/lib/utils';

export default function TeamPage() {
  const { currentOrganization } = useOrganization();

  // Mock data - will be replaced with real hook
  const members = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Juan Pérez',
      userEmail: 'juan@example.com',
      role: 'owner',
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'María García',
      userEmail: 'maria@example.com',
      role: 'admin',
      joinedAt: new Date(),
      lastActive: new Date(),
    },
  ];

  if (!currentOrganization) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No hay organización seleccionada</CardTitle>
            <CardDescription>
              Selecciona una organización para ver su equipo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const config: Record<string, { variant: 'default' | 'success' | 'warning'; label: string; icon: any }> = {
      owner: { variant: 'warning', label: 'Propietario', icon: Crown },
      admin: { variant: 'success', label: 'Administrador', icon: Shield },
      analyst: { variant: 'default', label: 'Analista', icon: EditIcon },
      viewer: { variant: 'default', label: 'Visualizador', icon: Eye },
    };
    return config[role] || { variant: 'default', label: role, icon: Shield };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipo</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los miembros de {currentOrganization.name}
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Miembro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Miembros</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{members.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Propietarios</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {members.filter(m => m.role === 'owner').length}
                </p>
              </div>
              <Crown className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {members.filter(m => m.role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Analistas</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {members.filter(m => m.role === 'analyst').length}
                </p>
              </div>
              <EditIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros del Equipo</CardTitle>
          <CardDescription>
            Todos los usuarios con acceso a esta organización
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de Ingreso</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const roleConfig = getRoleBadge(member.role);
                const RoleIcon = roleConfig.icon;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                          {member.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.userName}</p>
                          <p className="text-sm text-gray-500">{member.userEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleConfig.variant}>
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {roleConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(member.joinedAt, 'short')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(member.lastActive, 'short')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {member.role !== 'owner' && (
                          <>
                            <Button variant="ghost" size="sm" title="Cambiar rol">
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Eliminar">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Invitaciones Pendientes</CardTitle>
          <CardDescription>
            Invitaciones enviadas que aún no han sido aceptadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Mail className="h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">No hay invitaciones pendientes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

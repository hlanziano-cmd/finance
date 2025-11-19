// src/app/dashboard/settings/page.tsx
'use client';

import { Save, Building2, User, Bell, Shield, CreditCard, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useOrganization } from '@/src/lib/hooks/useOrganization';

export default function SettingsPage() {
  const { currentOrganization } = useOrganization();

  if (!currentOrganization) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No hay organización seleccionada</CardTitle>
            <CardDescription>
              Selecciona una organización para ver su configuración.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona la configuración de {currentOrganization.name}
        </p>
      </div>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-gray-600" />
            <CardTitle>Información de la Organización</CardTitle>
          </div>
          <CardDescription>
            Detalles básicos de tu organización
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de la Organización</label>
            <input
              type="text"
              defaultValue={currentOrganization.name}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              rows={3}
              placeholder="Describe tu organización..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan de Suscripción</label>
            <div className="mt-2">
              <Badge variant="success">{currentOrganization.subscriptionPlan}</Badge>
            </div>
          </div>
          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-600" />
            <CardTitle>Preferencias de Usuario</CardTitle>
          </div>
          <CardDescription>
            Personaliza tu experiencia en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Idioma</label>
            <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zona Horaria</label>
            <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="America/Bogota">Bogotá (GMT-5)</option>
              <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
              <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
            </select>
          </div>
          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Guardar Preferencias
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <CardTitle>Notificaciones</CardTitle>
          </div>
          <CardDescription>
            Configura cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Notificaciones por Email</p>
              <p className="text-sm text-gray-500">Recibe actualizaciones importantes por correo</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Notificaciones de Actividad</p>
              <p className="text-sm text-gray-500">Recibe notificaciones de cambios en documentos</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Resumen Semanal</p>
              <p className="text-sm text-gray-500">Recibe un resumen semanal de actividades</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <CardTitle>Seguridad</CardTitle>
          </div>
          <CardDescription>
            Gestiona la seguridad de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline">Cambiar Contraseña</Button>
          </div>
          <div>
            <p className="font-medium text-gray-900">Autenticación de Dos Factores</p>
            <p className="mt-1 text-sm text-gray-500">Agrega una capa extra de seguridad a tu cuenta</p>
            <Button variant="outline" className="mt-2">Habilitar 2FA</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <CardTitle>Facturación y Suscripción</CardTitle>
          </div>
          <CardDescription>
            Gestiona tu suscripción y métodos de pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Plan Actual</p>
              <p className="text-sm text-gray-500">
                <Badge variant="success">{currentOrganization.subscriptionPlan}</Badge>
              </p>
            </div>
            <Button variant="outline">Actualizar Plan</Button>
          </div>
          <div>
            <p className="font-medium text-gray-900">Método de Pago</p>
            <p className="text-sm text-gray-500">No hay método de pago registrado</p>
            <Button variant="outline" className="mt-2">Agregar Método de Pago</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">Zona de Peligro</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            Acciones irreversibles que afectan tu organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Eliminar Organización</p>
              <p className="text-sm text-red-700">
                Esta acción eliminará permanentemente todos los datos de la organización
              </p>
            </div>
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

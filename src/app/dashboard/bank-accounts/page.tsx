// src/app/dashboard/bank-accounts/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Landmark,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/src/components/ui/Table';
import { Badge } from '@/src/components/ui/Badge';
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from '@/src/lib/hooks/useBankAccount';
import { formatCurrency } from '@/src/lib/utils';
import type { BankAccount } from '@/src/services/bank-account.service';

export default function BankAccountsPage() {
  const router = useRouter();
  const { data: accounts = [], isLoading } = useBankAccounts();
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bankName: '',
    accountType: 'corriente' as 'ahorro' | 'corriente',
    accountNumber: '',
    initialBalance: '',
  });

  const totalBalance = accounts.reduce(
    (sum: number, acc: BankAccount) => sum + Number(acc.current_balance),
    0
  );
  const savingsCount = accounts.filter((a: BankAccount) => a.account_type === 'ahorro').length;
  const checkingCount = accounts.filter((a: BankAccount) => a.account_type === 'corriente').length;

  const resetForm = () => {
    setFormData({
      name: '',
      bankName: '',
      accountType: 'corriente',
      accountNumber: '',
      initialBalance: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.bankName.trim()) return;

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        dto: {
          name: formData.name,
          bankName: formData.bankName,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber || undefined,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: formData.name,
        bankName: formData.bankName,
        accountType: formData.accountType,
        accountNumber: formData.accountNumber || undefined,
        initialBalance: formData.initialBalance ? parseFloat(formData.initialBalance) : 0,
      });
    }
    resetForm();
  };

  const handleEdit = (account: BankAccount) => {
    setFormData({
      name: account.name,
      bankName: account.bank_name,
      accountType: account.account_type,
      accountNumber: account.account_number || '',
      initialBalance: '',
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta? Se eliminarán también todas sus transacciones.')) return;
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
          <h1 className="text-3xl font-bold text-gray-900">Cuentas Bancarias</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitorea el saldo de tus cuentas de ahorro y corrientes
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cuenta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo Total</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cuentas de Ahorro</p>
                <p className="text-xl font-bold text-gray-900">{savingsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <ArrowDownCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cuentas Corrientes</p>
                <p className="text-xl font-bold text-gray-900">{checkingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la cuenta *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Cuenta operativa"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco *
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Ej: Bancolombia"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de cuenta
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as 'ahorro' | 'corriente' }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="corriente">Corriente</option>
                  <option value="ahorro">Ahorro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de cuenta
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Ej: 1234567890"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData(prev => ({ ...prev, initialBalance: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className="flex items-end gap-2">
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {editingId ? 'Actualizar' : 'Crear'}
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

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Mis Cuentas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No tienes cuentas bancarias
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Agrega tu primera cuenta para comenzar a monitorear tus saldos
              </p>
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cuenta
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account: BankAccount) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.bank_name}</TableCell>
                    <TableCell>
                      <Badge variant={account.account_type === 'ahorro' ? 'success' : 'info'} size="sm">
                        {account.account_type === 'ahorro' ? 'Ahorro' : 'Corriente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {account.account_number
                        ? `***${account.account_number.slice(-4)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={Number(account.current_balance) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(Number(account.current_balance))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/bank-accounts/${account.id}`)}
                          title="Ver transacciones"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(account)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
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

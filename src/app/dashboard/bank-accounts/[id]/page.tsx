// src/app/dashboard/bank-accounts/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Trash2,
  Landmark,
  Wallet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/src/components/ui/Table';
import { Badge } from '@/src/components/ui/Badge';
import {
  useBankAccount,
  useAddTransaction,
  useDeleteTransaction,
} from '@/src/lib/hooks/useBankAccount';
import { formatCurrency, formatDate } from '@/src/lib/utils';
import type { BankTransaction } from '@/src/services/bank-account.service';

export default function BankAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: account, isLoading } = useBankAccount(id);
  const addTransactionMutation = useAddTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [txForm, setTxForm] = useState({
    type: 'ingreso' as 'ingreso' | 'egreso',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txForm.amount);
    if (!amount || amount <= 0) return;

    await addTransactionMutation.mutateAsync({
      accountId: id,
      dto: {
        type: txForm.type,
        amount,
        description: txForm.description || undefined,
        transactionDate: txForm.transactionDate,
      },
    });

    setTxForm({
      type: 'ingreso',
      amount: '',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('¿Eliminar esta transacción? El saldo se ajustará automáticamente.')) return;
    await deleteTransactionMutation.mutateAsync({
      accountId: id,
      transactionId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cuenta no encontrada</p>
        <Button variant="ghost" onClick={() => router.push('/dashboard/bank-accounts')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const transactions = account.transactions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/bank-accounts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{account.bank_name}</p>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo Actual</p>
                <p className={`text-xl font-bold ${Number(account.current_balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Number(account.current_balance))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-50 p-2">
                <Landmark className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Cuenta</p>
                <p className="text-lg font-semibold text-gray-900">
                  {account.account_type === 'ahorro' ? 'Ahorro' : 'Corriente'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-50 p-2">
                <Landmark className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Número de Cuenta</p>
                <p className="text-lg font-semibold text-gray-900">
                  {account.account_number || '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Transacción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTransaction} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={txForm.type}
                onChange={(e) => setTxForm(prev => ({ ...prev, type: e.target.value as 'ingreso' | 'egreso' }))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={txForm.amount}
                onChange={(e) => setTxForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                value={txForm.description}
                onChange={(e) => setTxForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ej: Pago proveedor, Venta cliente..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={txForm.transactionDate}
                onChange={(e) => setTxForm(prev => ({ ...prev, transactionDate: e.target.value }))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" isLoading={addTransactionMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Historial de Transacciones ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay transacciones registradas</p>
              <p className="text-sm text-gray-400 mt-1">Usa el formulario de arriba para agregar la primera</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Saldo Después</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx: BankTransaction) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-gray-600">
                      {formatDate(tx.transaction_date)}
                    </TableCell>
                    <TableCell>
                      {tx.type === 'ingreso' ? (
                        <Badge variant="success" size="sm">
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                          Ingreso
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                          Egreso
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {tx.description || '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={tx.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                        {tx.type === 'ingreso' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(Number(tx.balance_after))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        title="Eliminar transacción"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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

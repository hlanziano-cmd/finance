// src/app/dashboard/transactions/page.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, TrendingUp, TrendingDown, ArrowUpDown,
  X, Copy, Check, MessageCircle, Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@/src/lib/utils';
import {
  useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction,
} from '@/src/lib/hooks/useTransactions';
import { useCashFlows } from '@/src/lib/hooks/useCashFlow';
import { BudgetTracker } from '@/src/components/cash-flow/BudgetTracker';
import {
  INCOME_CATEGORIES, EXPENSE_CATEGORIES,
  type Transaction, type TransactionDTO, type TransactionType,
} from '@/src/services/transaction.service';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const now = new Date();
const ALL_CATEGORIES = [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];

// ── WhatsApp template text ────────────────────────────────────────────────────
const WHATSAPP_TEMPLATE = `💰 REGISTRO DE TRANSACCIÓN
──────────────────────────
Tipo: INGRESO ✅  o  GASTO ❌
Categoría: [ej. Ventas / Arriendo]
Monto: $[cantidad]
Fecha: [DD/MM/AAAA]
Descripción: [detalles opcionales]
Referencia: [factura / recibo (opcional)]
──────────────────────────
Registrado en Fluxi Finance 📊`;

const WHATSAPP_EXAMPLE_INCOME = `💰 REGISTRO DE TRANSACCIÓN
──────────────────────────
Tipo: INGRESO ✅
Categoría: Ventas
Monto: $2.500.000
Fecha: 03/03/2026
Descripción: Factura #456 - Cliente ABC
Referencia: FAC-456
──────────────────────────
Registrado en Fluxi Finance 📊`;

const WHATSAPP_EXAMPLE_EXPENSE = `💰 REGISTRO DE TRANSACCIÓN
──────────────────────────
Tipo: GASTO ❌
Categoría: Nómina
Monto: $3.800.000
Fecha: 01/03/2026
Descripción: Pago nómina mes de marzo
Referencia: –
──────────────────────────
Registrado en Fluxi Finance 📊`;

// ── Transaction Modal ─────────────────────────────────────────────────────────
function TransactionModal({
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  initial?: Transaction;
  onClose: () => void;
  onSave: (dto: TransactionDTO) => void;
  isSaving: boolean;
}) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'income');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [customCategory, setCustomCategory] = useState('');
  const [amountDisplay, setAmountDisplay] = useState(
    initial ? formatNumberInput(initial.amount) : '',
  );
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [reference, setReference] = useState(initial?.reference ?? '');
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [cashFlowId, setCashFlowId] = useState<string>(initial?.cash_flow_id ?? '');
  const { data: cashFlows } = useCashFlows();

  const isCustomCategory = category === '__custom__';
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) return alert('Selecciona o escribe una categoría');
    const amount = parseNumberInput(amountDisplay);
    if (!amount) return alert('Ingresa un monto válido');
    if (!date) return alert('Ingresa la fecha');

    onSave({ type, category: finalCategory, amount, date, description: description || undefined, reference: reference || undefined, recurring, cash_flow_id: cashFlowId || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? 'Editar transacción' : 'Nueva transacción'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => { setType('income'); setCategory(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  type === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  type === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Gasto
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">Personalizada...</option>
            </select>
            {isCustomCategory && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Nombre de la categoría"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            )}
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                <input
                  type="text"
                  value={amountDisplay}
                  onChange={(e) => setAmountDisplay(e.target.value)}
                  onBlur={(e) => {
                    const v = parseNumberInput(e.target.value);
                    setAmountDisplay(v > 0 ? formatNumberInput(v) : '');
                  }}
                  placeholder="0"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white pl-6 pr-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles de la transacción..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Nº factura, recibo, cheque..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Project */}
          {cashFlows && cashFlows.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proyecto <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select
                value={cashFlowId}
                onChange={(e) => setCashFlowId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sin proyecto</option>
                {cashFlows.map((cf: any) => (
                  <option key={cf.id} value={cf.id}>{cf.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring */}
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Recurrente diario</p>
              <p className="text-xs text-gray-500 mt-0.5">Se mostrará todos los días del mes de forma permanente</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── WhatsApp Template Modal ───────────────────────────────────────────────────
function WhatsAppModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyText(text, id)}
      className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
    >
      {copied === id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied === id ? '¡Copiado!' : 'Copiar'}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-base font-semibold text-gray-900">Plantilla WhatsApp</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <p className="text-sm text-gray-600">
            Usa este formato para enviar transacciones por WhatsApp y registrarlas luego en el sistema.
          </p>

          {/* Plantilla base */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plantilla</span>
              <CopyBtn text={WHATSAPP_TEMPLATE} id="template" />
            </div>
            <pre className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {WHATSAPP_TEMPLATE}
            </pre>
          </div>

          {/* Ejemplo ingreso */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-green-600">Ejemplo — Ingreso</span>
              <CopyBtn text={WHATSAPP_EXAMPLE_INCOME} id="income" />
            </div>
            <pre className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {WHATSAPP_EXAMPLE_INCOME}
            </pre>
          </div>

          {/* Ejemplo gasto */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-red-600">Ejemplo — Gasto</span>
              <CopyBtn text={WHATSAPP_EXAMPLE_EXPENSE} id="expense" />
            </div>
            <pre className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {WHATSAPP_EXAMPLE_EXPENSE}
            </pre>
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">¿Cómo usarla?</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Copia la plantilla y envíala por WhatsApp</li>
              <li>Completa los campos: tipo, categoría, monto, fecha y descripción</li>
              <li>Regresa a esta página y haz clic en <strong>+ Nueva Transacción</strong></li>
              <li>Registra los datos del mensaje recibido</li>
            </ol>
          </div>

          <Button variant="outline" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterDay, setFilterDay] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCashFlowId, setFilterCashFlowId] = useState('');
  const [showBudgetTracker, setShowBudgetTracker] = useState(false);

  const { data: cashFlowProjects } = useCashFlows();

  const { data: transactions, isLoading, error } = useTransactions({
    month: filterMonth,
    year: filterYear,
    type: filterType !== 'all' ? filterType : undefined,
    cashFlowId: filterCashFlowId || undefined,
  });

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | undefined>();
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Expand recurring transactions into one row per active day; filter non-recurring normally
  const filtered = useMemo(() => {
    if (!transactions) return [] as (Transaction & { displayDate: string; rowKey: string })[];
    const rows: (Transaction & { displayDate: string; rowKey: string })[] = [];
    const daysInMonth = new Date(filterYear, filterMonth, 0).getDate();
    const mm = String(filterMonth).padStart(2, '0');

    for (const t of transactions) {
      if (filterCategory && t.category !== filterCategory) continue;

      if (!t.recurring) {
        if (filterDay !== '') {
          const day = new Date(t.date + 'T12:00:00').getDate();
          if (day !== filterDay) continue;
        }
        rows.push({ ...t, displayDate: t.date, rowKey: t.id });
      } else {
        // Recurring: generate one instance per day from start date onwards
        const startDate = new Date(t.date + 'T00:00:00');
        if (filterDay !== '') {
          const target = new Date(filterYear, filterMonth - 1, filterDay);
          if (startDate <= target) {
            const dd = String(filterDay).padStart(2, '0');
            rows.push({ ...t, displayDate: `${filterYear}-${mm}-${dd}`, rowKey: `${t.id}-${filterDay}` });
          }
        } else {
          for (let d = 1; d <= daysInMonth; d++) {
            const dayDate = new Date(filterYear, filterMonth - 1, d);
            if (dayDate >= startDate) {
              const dd = String(d).padStart(2, '0');
              rows.push({ ...t, displayDate: `${filterYear}-${mm}-${dd}`, rowKey: `${t.id}-${d}` });
            }
          }
        }
      }
    }

    rows.sort((a, b) => b.displayDate.localeCompare(a.displayDate));
    return rows;
  }, [transactions, filterCategory, filterDay, filterMonth, filterYear]);

  const summary = useMemo(() => {
    const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpense, net: totalIncome - totalExpense };
  }, [filtered]);

  const handleOpenCreate = () => { setEditTarget(undefined); setShowModal(true); };
  const handleOpenEdit = (t: Transaction) => {
    // For recurring instances find the original record so edit shows the real start date
    const original = transactions?.find(tx => tx.id === t.id) ?? t;
    setEditTarget(original);
    setShowModal(true);
  };

  const handleSave = async (dto: TransactionDTO) => {
    if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setShowModal(false);
  };

  const handleDelete = (t: Transaction) => {
    if (!confirm(`¿Eliminar "${t.category} — ${formatCurrency(t.amount)}"?`)) return;
    deleteMutation.mutate(t.id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Unique categories found in current results (for filter dropdown)
  const availableCategories = useMemo(() => {
    const cats = new Set(transactions?.map(t => t.category) ?? []);
    return [...cats].sort();
  }, [transactions]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingresos y Gastos</h1>
          <p className="text-sm text-gray-500 mt-1">Registra y consulta tus transacciones</p>
        </div>
        <div className="flex items-center gap-2">
          {filterCashFlowId && (
            <Button variant="outline" onClick={() => setShowBudgetTracker(true)}>
              <Target className="mr-2 h-4 w-4 text-blue-500" />
              Presupuesto vs Real
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowWhatsApp(true)}>
            <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
            Plantilla WhatsApp
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* Project tabs */}
      {cashFlowProjects && cashFlowProjects.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="flex items-center gap-1 overflow-x-auto pb-px">
            <button
              onClick={() => { setFilterCashFlowId(''); setShowBudgetTracker(false); }}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                !filterCashFlowId
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              Todos
            </button>
            {cashFlowProjects.map((cf: any) => (
              <button
                key={cf.id}
                onClick={() => setFilterCashFlowId(cf.id)}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterCashFlowId === cf.id
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {cf.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Ingresos</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(summary.totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Gastos</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(summary.totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${summary.net >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <ArrowUpDown className={`h-5 w-5 ${summary.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Saldo Neto</p>
                <p className={`text-xl font-bold ${summary.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(summary.net)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Día</label>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value === '' ? '' : Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Todos</option>
                {Array.from(
                  { length: new Date(filterYear, filterMonth, 0).getDate() },
                  (_, i) => i + 1
                ).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
              <select
                value={filterMonth}
                onChange={(e) => { setFilterMonth(Number(e.target.value)); setFilterDay(''); }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
              <select
                value={filterYear}
                onChange={(e) => { setFilterYear(Number(e.target.value)); setFilterDay(''); }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Gastos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Todas</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {MONTH_NAMES[filterMonth - 1]} {filterYear}
              </CardTitle>
              <CardDescription>
                {filtered.length} transacción{filtered.length !== 1 ? 'es' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-red-500">Error al cargar transacciones</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowUpDown className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No hay transacciones</p>
              <p className="text-xs text-gray-400 mt-1">Crea una nueva transacción para empezar</p>
              <Button className="mt-4" onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Transacción
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Referencia</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((t) => {
                    const dateObj = new Date(t.displayDate + 'T12:00:00');
                    return (
                      <tr key={t.rowKey} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              t.type === 'income'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {t.type === 'income'
                                ? <><TrendingUp className="h-3 w-3" /> Ingreso</>
                                : <><TrendingDown className="h-3 w-3" /> Gasto</>
                              }
                            </span>
                            {t.recurring && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Recurrente
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{t.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                          {t.description || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {t.reference || <span className="text-gray-300">—</span>}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-semibold whitespace-nowrap ${
                          t.type === 'income' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {t.type === 'expense' ? '- ' : '+ '}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="rounded-lg p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors mr-1"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer total */}
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">
                        Total ({filtered.length})
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-bold ${
                        summary.net >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(summary.net)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showModal && (
        <TransactionModal
          initial={editTarget}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
      {showWhatsApp && <WhatsAppModal onClose={() => setShowWhatsApp(false)} />}
      {showBudgetTracker && filterCashFlowId && (
        <BudgetTracker
          cashFlowId={filterCashFlowId}
          defaultMonth={filterMonth}
          defaultYear={filterYear}
          onClose={() => setShowBudgetTracker(false)}
        />
      )}
    </div>
  );
}

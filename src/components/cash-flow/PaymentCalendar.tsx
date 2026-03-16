// src/components/cash-flow/PaymentCalendar.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  TrendingUp, TrendingDown, CalendarDays, AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/src/lib/utils';
import type { CashFlowPeriodDTO, AdditionalItems, CellPayment } from '@/src/services/cash-flow.service';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const DEFAULT_LABELS: Record<string, string> = {
  salesCollections: 'Cobros de Ventas',
  otherIncome: 'Otros Ingresos',
  supplierPayments: 'Pagos a Proveedores',
  payroll: 'Nómina',
  rent: 'Arriendo',
  utilities: 'Servicios Públicos',
  taxes: 'Impuestos',
  otherExpenses: 'Otros Gastos',
};

interface CalendarItem {
  key: string;
  label: string;
  amount: number;
  type: 'income' | 'expense';
  paid: boolean;
  date?: string;
  comment?: string;
  colKey: number;
}

interface PaymentCalendarProps {
  periods: CashFlowPeriodDTO[];
  additionalItems: AdditionalItems;
  hiddenRows: string[];
  cellPayments: Record<string, Record<number, CellPayment>>;
  onSaveCellPayment: (itemKey: string, colKey: number, data: { paid: boolean; date: string; comment: string }) => void;
  customLabels: Record<string, string>;
  onClose: () => void;
}

function getLabel(field: string, customLabels: Record<string, string>) {
  return customLabels[field] || DEFAULT_LABELS[field] || field;
}

// ── Item detail row inside the calendar ──────────────────────────────────────
function ItemRow({
  item,
  onTogglePaid,
  onSave,
}: {
  item: CalendarItem;
  onTogglePaid: () => void;
  onSave: (data: { paid: boolean; date: string; comment: string }) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localDate, setLocalDate] = useState(item.date ?? '');
  const [localComment, setLocalComment] = useState(item.comment ?? '');

  const today = new Date().toISOString().slice(0, 10);

  const handleSave = () => {
    onSave({ paid: item.paid, date: localDate, comment: localComment });
    setIsEditing(false);
  };

  return (
    <div className={`rounded-lg border p-3 transition-colors ${
      item.paid
        ? 'border-green-200 bg-green-50'
        : item.type === 'expense'
          ? 'border-red-100 bg-red-50/50'
          : 'border-blue-100 bg-blue-50/50'
    }`}>
      <div className="flex items-start gap-2">
        {/* Paid toggle button */}
        <button
          onClick={onTogglePaid}
          className={`mt-0.5 flex-shrink-0 rounded-full transition-colors ${
            item.paid
              ? 'text-green-500 hover:text-green-700'
              : 'text-gray-300 hover:text-green-500'
          }`}
          title={item.paid ? 'Marcar como pendiente' : (item.type === 'expense' ? 'Marcar como pagado' : 'Marcar como recibido')}
        >
          {item.paid
            ? <CheckCircle2 className="h-5 w-5" />
            : <Circle className="h-5 w-5" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {item.type === 'expense'
                ? <TrendingDown className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                : <TrendingUp className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />}
              <span className={`text-sm font-medium truncate ${item.paid ? 'text-green-800' : 'text-gray-800'}`}>
                {item.label}
              </span>
            </div>
            <span className={`text-sm font-bold flex-shrink-0 ${
              item.type === 'expense' ? 'text-red-700' : 'text-green-700'
            }`}>
              {formatCurrency(item.amount)}
            </span>
          </div>

          {/* Date + comment */}
          {!isEditing ? (
            <div className="mt-1 flex items-center gap-3">
              {item.date ? (
                <span className="text-xs text-gray-500">
                  📅 {new Date(item.date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </span>
              ) : (
                <span className="text-xs text-orange-500 font-medium">Sin fecha programada</span>
              )}
              {item.comment && (
                <span className="text-xs text-gray-400 truncate">💬 {item.comment}</span>
              )}
              <button
                onClick={() => { setLocalDate(item.date ?? ''); setLocalComment(item.comment ?? ''); setIsEditing(true); }}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium ml-auto flex-shrink-0"
              >
                Editar
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-0.5">Fecha</label>
                  <input
                    type="date"
                    value={localDate}
                    onChange={(e) => setLocalDate(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-0.5">Comentario</label>
                  <input
                    type="text"
                    value={localComment}
                    onChange={(e) => setLocalComment(e.target.value)}
                    placeholder="Nota opcional..."
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                  Cancelar
                </button>
                <button onClick={handleSave} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-medium">
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main PaymentCalendar component ────────────────────────────────────────────
export function PaymentCalendar({
  periods,
  additionalItems,
  hiddenRows,
  cellPayments,
  onSaveCellPayment,
  customLabels,
  onClose,
}: PaymentCalendarProps) {
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const period = periods[selectedPeriodIdx];
  const colKey = selectedPeriodIdx + 1;

  // Build all calendar items for the selected period
  const allItems = useMemo<CalendarItem[]>(() => {
    if (!period) return [];
    const cp = (key: string) => cellPayments[key]?.[colKey];

    const makeItem = (
      key: string,
      label: string,
      amount: number,
      type: 'income' | 'expense',
    ): CalendarItem => {
      const cell = cp(key);
      return {
        key, label, amount, type, colKey,
        paid: cell?.paid ?? false,
        date: cell?.date,
        comment: cell?.comment,
      };
    };

    const items: CalendarItem[] = [];

    // Static incomes
    items.push(makeItem('salesCollections', getLabel('salesCollections', customLabels), period.salesCollections, 'income'));
    items.push(makeItem('otherIncome', getLabel('otherIncome', customLabels), period.otherIncome, 'income'));

    // Additional incomes
    for (const item of additionalItems.incomes) {
      items.push(makeItem(item.id, item.name || 'Ingreso adicional', item.amounts[colKey] ?? 0, 'income'));
    }

    // Static expenses (filtered by hiddenRows)
    const staticExpenses: [string, number][] = [
      ['supplierPayments', period.supplierPayments],
      ['payroll', period.payroll],
      ['rent', period.rent],
      ['utilities', period.utilities],
      ['taxes', period.taxes],
      ['otherExpenses', period.otherExpenses],
    ];
    for (const [field, amount] of staticExpenses) {
      if (!hiddenRows.includes(field)) {
        items.push(makeItem(field, getLabel(field, customLabels), amount, 'expense'));
      }
    }

    // Additional expenses
    for (const item of additionalItems.expenses) {
      items.push(makeItem(item.id, item.name || 'Gasto adicional', item.amounts[colKey] ?? 0, 'expense'));
    }

    // Exclude zero-amount items (nothing to track)
    return items.filter(i => i.amount > 0);
  }, [period, colKey, cellPayments, customLabels, hiddenRows, additionalItems]);

  // Group items by scheduled date
  const itemsByDate = useMemo(() => {
    const map: Record<number, CalendarItem[]> = {};
    for (const item of allItems) {
      if (item.date) {
        const day = parseInt(item.date.slice(8, 10), 10);
        if (!map[day]) map[day] = [];
        map[day].push(item);
      }
    }
    return map;
  }, [allItems]);

  const unscheduledItems = useMemo(() => allItems.filter(i => !i.date), [allItems]);
  const scheduledItems = useMemo(() => allItems.filter(i => !!i.date), [allItems]);

  // Summary
  const summary = useMemo(() => {
    const paid = allItems.filter(i => i.paid);
    const pending = allItems.filter(i => !i.paid);
    const paidIncome = paid.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
    const paidExpense = paid.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
    const pendingIncome = pending.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
    const pendingExpense = pending.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
    return { paidIncome, paidExpense, pendingIncome, pendingExpense };
  }, [allItems]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    if (!period) return [];
    const { month, year } = period;
    const firstDay = new Date(year, month - 1, 1);
    // ISO weekday: 1=Mon..7=Sun → offset to start on Monday
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to full rows of 7
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [period]);

  const today = new Date();
  const isCurrentPeriod = period?.month === today.getMonth() + 1 && period?.year === today.getFullYear();
  const todayDay = isCurrentPeriod ? today.getDate() : null;

  const handleTogglePaid = (item: CalendarItem) => {
    const newPaid = !item.paid;
    const dateToUse = item.date || today.toISOString().slice(0, 10);
    onSaveCellPayment(item.key, item.colKey, {
      paid: newPaid,
      date: dateToUse,
      comment: item.comment ?? '',
    });
  };

  const itemsForSelectedDay = selectedDay ? (itemsByDate[selectedDay] ?? []) : [];

  if (!period) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Calendario de Pagos</h2>
              <p className="text-xs text-gray-500">Control de ingresos y gastos del período</p>
            </div>
          </div>

          {/* Period navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedPeriodIdx(i => Math.max(0, i - 1)); setSelectedDay(null); }}
              disabled={selectedPeriodIdx === 0}
              className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="min-w-[130px] text-center text-sm font-semibold text-gray-900">
              {MONTH_NAMES[period.month - 1]} {period.year}
            </span>
            <button
              onClick={() => { setSelectedPeriodIdx(i => Math.min(periods.length - 1, i + 1)); setSelectedDay(null); }}
              disabled={selectedPeriodIdx === periods.length - 1}
              className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left panel: item list ── */}
          <div className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">

              {/* Pending */}
              {allItems.filter(i => !i.paid).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-2 flex items-center gap-1">
                    <Circle className="h-3 w-3" />
                    Pendiente ({allItems.filter(i => !i.paid).length})
                  </p>
                  <div className="space-y-2">
                    {allItems.filter(i => !i.paid).map(item => (
                      <ItemRow
                        key={`${item.key}-${item.colKey}`}
                        item={item}
                        onTogglePaid={() => handleTogglePaid(item)}
                        onSave={(data) => onSaveCellPayment(item.key, item.colKey, data)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Paid */}
              {allItems.filter(i => i.paid).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Pagado / Recibido ({allItems.filter(i => i.paid).length})
                  </p>
                  <div className="space-y-2">
                    {allItems.filter(i => i.paid).map(item => (
                      <ItemRow
                        key={`${item.key}-${item.colKey}`}
                        item={item}
                        onTogglePaid={() => handleTogglePaid(item)}
                        onSave={(data) => onSaveCellPayment(item.key, item.colKey, data)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {allItems.length === 0 && (
                <div className="py-8 text-center">
                  <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No hay ítems con monto para este período</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: calendar grid + day detail ── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Calendar grid */}
            <div className="px-5 py-4 border-b border-gray-100">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const dayItems = itemsByDate[day] ?? [];
                  const hasPending = dayItems.some(i => !i.paid);
                  const hasPaid = dayItems.some(i => i.paid);
                  const isToday = day === todayDay;
                  const isSelected = day === selectedDay;
                  const isPast = isCurrentPeriod && day < (todayDay ?? 0);

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`relative rounded-lg p-1.5 text-center transition-all border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : isToday
                            ? 'border-blue-400 bg-blue-50 text-blue-800 font-bold'
                            : dayItems.length > 0
                              ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-900'
                              : 'border-transparent bg-transparent hover:bg-gray-50 text-gray-500'
                      }`}
                    >
                      <span className={`text-xs font-medium block ${isPast && !isToday && !isSelected ? 'opacity-50' : ''}`}>
                        {day}
                      </span>
                      {/* Payment indicators */}
                      {dayItems.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {hasPending && (
                            <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-orange-300' : 'bg-orange-400'}`} />
                          )}
                          {hasPaid && (
                            <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-green-300' : 'bg-green-500'}`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day detail panel or unscheduled */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {selectedDay ? (
                <>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Pagos del {selectedDay} de {MONTH_NAMES[period.month - 1]}
                    <span className="ml-2 text-xs font-normal text-gray-400">({itemsForSelectedDay.length} ítem{itemsForSelectedDay.length !== 1 ? 's' : ''})</span>
                  </p>
                  {itemsForSelectedDay.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No hay pagos programados para este día</p>
                  ) : (
                    <div className="space-y-2">
                      {itemsForSelectedDay.map(item => (
                        <ItemRow
                          key={`${item.key}-${item.colKey}-day`}
                          item={item}
                          onTogglePaid={() => handleTogglePaid(item)}
                          onSave={(data) => onSaveCellPayment(item.key, item.colKey, data)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {unscheduledItems.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-400" />
                        <p className="text-sm font-semibold text-gray-600">
                          Sin fecha programada ({unscheduledItems.length})
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Abre cada ítem en el panel izquierdo para asignar una fecha y verlo en el calendario.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {unscheduledItems.map(item => (
                          <div key={item.key} className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 ${
                            item.type === 'expense' ? 'border-red-100 bg-red-50/40' : 'border-green-100 bg-green-50/40'
                          }`}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {item.type === 'expense'
                                ? <TrendingDown className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                                : <TrendingUp className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />}
                              <span className="text-xs font-medium text-gray-700 truncate">{item.label}</span>
                            </div>
                            <span className={`text-xs font-bold flex-shrink-0 ${item.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {scheduledItems.length > 0 && unscheduledItems.length === 0 && (
                    <div className="text-center py-6">
                      <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Todos los ítems tienen fecha programada</p>
                      <p className="text-xs text-gray-400 mt-1">Haz clic en un día del calendario para ver sus pagos</p>
                    </div>
                  )}
                  {allItems.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      No hay ítems con monto para este período
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer: summary ── */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">Ingresos recibidos:</span>
              <span className="font-semibold text-green-700">{formatCurrency(summary.paidIncome)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-red-400" />
              <span className="text-gray-600">Gastos pagados:</span>
              <span className="font-semibold text-red-700">{formatCurrency(summary.paidExpense)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-orange-400" />
              <span className="text-gray-600">Pendiente por cobrar:</span>
              <span className="font-semibold text-orange-600">{formatCurrency(summary.pendingIncome)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-orange-400" />
              <span className="text-gray-600">Pendiente por pagar:</span>
              <span className="font-semibold text-orange-600">{formatCurrency(summary.pendingExpense)}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 border-l border-gray-300 pl-6">
              <span className="text-gray-600 font-medium">Prog. sin fecha:</span>
              <span className="font-bold text-gray-700">{unscheduledItems.length} ítem{unscheduledItems.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

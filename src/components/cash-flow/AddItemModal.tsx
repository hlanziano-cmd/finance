'use client';

import { useState } from 'react';
import { X, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { formatNumberInput, parseNumberInput } from '@/src/lib/utils';
import type { AdditionalItem, RecurrenceFrequency } from '@/src/services/cash-flow.service';

const FREQUENCIES: { value: RecurrenceFrequency; label: string; step: number }[] = [
  { value: 'single', label: 'Único', step: 0 },
  { value: 'monthly', label: 'Mensual', step: 1 },
  { value: 'bimonthly', label: 'Bimestral', step: 2 },
  { value: 'quarterly', label: 'Trimestral', step: 3 },
  { value: 'semiannual', label: 'Semestral', step: 6 },
  { value: 'annual', label: 'Anual', step: 12 },
];

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: 'incomes' | 'expenses', item: AdditionalItem) => void;
  periods: { month: number; year: number }[];
  defaultType?: 'incomes' | 'expenses';
}

export function AddItemModal({ isOpen, onClose, onAdd, periods, defaultType = 'incomes' }: AddItemModalProps) {
  const [type, setType] = useState<'incomes' | 'expenses'>(defaultType);
  const [name, setName] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [startCol, setStartCol] = useState(1);
  const [endCol, setEndCol] = useState(periods.length);
  const [paymentDay, setPaymentDay] = useState<number | ''>('');

  const resetForm = () => {
    setType(defaultType);
    setName('');
    setAmountDisplay('');
    setFrequency('monthly');
    setStartCol(1);
    setEndCol(periods.length);
    setPaymentDay('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const amount = parseNumberInput(amountDisplay);
    if (amount <= 0) return;

    const frequencyConfig = FREQUENCIES.find(f => f.value === frequency)!;
    const amounts: Record<number, number> = {};

    if (frequency === 'single') {
      amounts[startCol] = amount;
    } else {
      const step = frequencyConfig.step;
      for (let col = startCol; col <= endCol; col += step) {
        amounts[col] = amount;
      }
    }

    const item: AdditionalItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      amounts,
      recurrence: {
        frequency,
        amount,
        startCol,
        endCol: frequency === 'single' ? startCol : endCol,
        ...(paymentDay !== '' && frequency !== 'single' ? { paymentDay: paymentDay as number } : {}),
      },
    };

    onAdd(type, item);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Agregar Rubro</h3>
          <button type="button" onClick={handleClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('incomes')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  type === 'incomes'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setType('expenses')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  type === 'expenses'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Gasto
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Arriendo, Salarios, Ventas..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
            <input
              type="text"
              value={amountDisplay}
              onChange={(e) => setAmountDisplay(e.target.value)}
              onBlur={(e) => {
                const val = parseNumberInput(e.target.value);
                setAmountDisplay(val > 0 ? formatNumberInput(val) : '');
              }}
              placeholder="0"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {FREQUENCIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Payment day (only for recurring) */}
          {frequency !== 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Día estimado de pago
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paymentDay}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                  setPaymentDay(val);
                }}
                placeholder="Ej: 15"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">Se generará una alerta cerca de esta fecha</p>
            </div>
          )}

          {/* Period range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodo inicio</label>
              <select
                value={startCol}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStartCol(val);
                  if (val > endCol) setEndCol(val);
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {periods.map((p, i) => (
                  <option key={i} value={i + 1}>
                    {MONTH_NAMES_SHORT[p.month - 1]} {p.year}
                  </option>
                ))}
              </select>
            </div>
            {frequency !== 'single' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periodo fin</label>
                <select
                  value={endCol}
                  onChange={(e) => setEndCol(parseInt(e.target.value))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {periods.map((p, i) => (
                    <option key={i} value={i + 1} disabled={i + 1 < startCol}>
                      {MONTH_NAMES_SHORT[p.month - 1]} {p.year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Preview */}
          {parseNumberInput(amountDisplay) > 0 && (
            <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span className="font-medium">Vista previa:</span>{' '}
              {frequency === 'single' ? (
                <>Se aplicará <strong>{formatNumberInput(parseNumberInput(amountDisplay))}</strong> en {MONTH_NAMES_SHORT[periods[startCol - 1]?.month - 1]} {periods[startCol - 1]?.year}</>
              ) : (
                <>
                  Se aplicará <strong>{formatNumberInput(parseNumberInput(amountDisplay))}</strong>{' '}
                  {FREQUENCIES.find(f => f.value === frequency)?.label.toLowerCase()} desde{' '}
                  {MONTH_NAMES_SHORT[periods[startCol - 1]?.month - 1]} {periods[startCol - 1]?.year} hasta{' '}
                  {MONTH_NAMES_SHORT[periods[endCol - 1]?.month - 1]} {periods[endCol - 1]?.year}
                  {' '}({Object.keys(
                    (() => {
                      const step = FREQUENCIES.find(f => f.value === frequency)!.step;
                      const result: Record<number, boolean> = {};
                      for (let col = startCol; col <= endCol; col += step) result[col] = true;
                      return result;
                    })()
                  ).length} periodos)
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// src/components/cash-flow/CellStatusPopover.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface CellStatusPopoverProps {
  paid: boolean;
  date: string;       // "YYYY-MM-DD" or ""
  comment: string;
  onSave: (data: { paid: boolean; date: string; comment: string }) => void;
  label: string;      // e.g. "Pagos a Proveedores"
  periodLabel: string; // e.g. "Ene 2026"
  type: 'expense' | 'income';
}

export function CellStatusPopover({
  paid, date, comment, onSave, label, periodLabel, type,
}: CellStatusPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localPaid, setLocalPaid] = useState(paid);
  const [localDate, setLocalDate] = useState(date);
  const [localComment, setLocalComment] = useState(comment);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync when props change
  useEffect(() => {
    setLocalPaid(paid);
    setLocalDate(date);
    setLocalComment(comment);
  }, [paid, date, comment]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const hasData = paid || date || comment;
  const paidLabel = type === 'expense' ? 'Pagado' : 'Recibido';
  const pendingLabel = type === 'expense' ? 'Marcar como pagado' : 'Marcar como recibido';

  const handleSave = () => {
    onSave({ paid: localPaid, date: localDate, comment: localComment });
    setIsOpen(false);
  };

  const handleClear = () => {
    onSave({ paid: false, date: '', comment: '' });
    setLocalPaid(false);
    setLocalDate('');
    setLocalComment('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="absolute top-0 right-0">
      {/* Trigger icon */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`p-0.5 rounded-bl transition-opacity ${
          paid
            ? 'text-green-500 opacity-100'
            : hasData
              ? 'text-blue-500 opacity-100'
              : 'text-gray-300 opacity-0 group-hover:opacity-100'
        }`}
        title={paid ? paidLabel : (hasData ? 'Ver detalles' : pendingLabel)}
      >
        {paid
          ? <CheckCircle2 className="h-3.5 w-3.5" />
          : <Circle className="h-3.5 w-3.5" />}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className="absolute top-6 right-0 z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-3 border-b border-gray-100 pb-2">
            <p className="text-xs font-semibold text-gray-900 truncate">{label}</p>
            <p className="text-[10px] text-gray-500">{periodLabel}</p>
          </div>

          {/* Paid toggle */}
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={localPaid}
              onChange={(e) => setLocalPaid(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className={`text-sm font-medium ${localPaid ? 'text-green-700' : 'text-gray-700'}`}>
              {localPaid ? paidLabel : pendingLabel}
            </span>
          </label>

          {/* Date picker */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {type === 'expense' ? 'Fecha de pago' : 'Fecha de recepción'}
            </label>
            <input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Comment */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Comentario
            </label>
            <textarea
              value={localComment}
              onChange={(e) => setLocalComment(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Nota opcional..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            {hasData && (
              <button type="button" onClick={handleClear}
                className="text-xs text-red-500 hover:text-red-700 font-medium">
                Limpiar
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md font-medium">
                Cancelar
              </button>
              <button type="button" onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

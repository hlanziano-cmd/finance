'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: string;
  onSave: (text: string) => void;
  cellLabel: string;
  periodLabel: string;
}

export function CommentModal({ isOpen, onClose, comment, onSave, cellLabel, periodLabel }: CommentModalProps) {
  const [text, setText] = useState(comment);

  useEffect(() => {
    setText(comment);
  }, [comment, isOpen]);

  const handleSave = () => {
    onSave(text.trim());
    onClose();
  };

  const handleDelete = () => {
    onSave('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Comentario</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="text-xs text-gray-500">
            <span className="font-medium">{cellLabel}</span> &middot; {periodLabel}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un comentario..."
            rows={3}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            autoFocus
          />

          <div className="flex items-center justify-between pt-1">
            <div>
              {comment && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={handleSave}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

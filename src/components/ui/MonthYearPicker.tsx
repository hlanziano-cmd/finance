'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

interface MonthYearPickerProps {
  value: { month: number; year: number };
  onChange: (month: number, year: number) => void;
  label?: string;
  compact?: boolean;
}

export function MonthYearPicker({ value, onChange, label, compact = false }: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(value.year);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayYear(value.year);
  }, [value.year]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (month: number) => {
    onChange(month, displayYear);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
        }`}
      >
        <Calendar className={compact ? 'h-3 w-3 text-gray-400' : 'h-4 w-4 text-gray-400'} />
        <span className="font-medium">
          {MONTH_NAMES_SHORT[value.month - 1]} {value.year}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setDisplayYear(y => y - 1)}
              className="rounded p-1 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-900">{displayYear}</span>
            <button
              type="button"
              onClick={() => setDisplayYear(y => y + 1)}
              className="rounded p-1 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_NAMES_SHORT.map((name, i) => {
              const month = i + 1;
              const isSelected = value.month === month && value.year === displayYear;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleSelect(month)}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

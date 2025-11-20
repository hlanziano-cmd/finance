// src/components/ui/CurrencyInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { formatInputValue, parseColombianNumber } from '@/src/lib/utils/number-format';

interface CurrencyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  className = '',
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Sincronizar el valor numérico con el valor mostrado
  useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatInputValue(value.toString()));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Si está vacío, resetear
    if (inputValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Formatear mientras escribe
    const formatted = formatInputValue(inputValue);
    setDisplayValue(formatted);

    // Parsear y enviar el valor numérico
    const numericValue = parseColombianNumber(formatted);
    onChange(numericValue);
  };

  const handleBlur = () => {
    // Al salir del campo, asegurar formato correcto
    if (value > 0) {
      setDisplayValue(formatInputValue(value.toString()));
    }
  };

  return (
    <div className="flex items-center">
      <span className="flex h-10 items-center rounded-l-md border border-r-0 border-gray-400 bg-gray-100 px-3 text-sm font-medium text-gray-700">
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`h-10 flex-1 rounded-r-md border border-gray-400 bg-white px-3 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
        placeholder={placeholder}
      />
    </div>
  );
}

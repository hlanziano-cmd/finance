// src/components/ui/Tooltip.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  examples?: string[];
  children?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({
  content,
  examples,
  children,
  side = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (side) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }

      setPosition({ top, left });
    }
  }, [isVisible, side]);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={`inline-flex items-center cursor-help ${className}`}
      >
        {children || <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg animate-in fade-in-0 zoom-in-95"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <p className="mb-1 font-medium">{content}</p>
          {examples && examples.length > 0 && (
            <div className="mt-2 border-t border-gray-700 pt-2">
              <p className="text-xs font-semibold text-gray-300">Ejemplos:</p>
              <ul className="mt-1 space-y-1 text-xs text-gray-300">
                {examples.map((example, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente simplificado para usar con labels de formulario
 */
interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
  examples?: string[];
  required?: boolean;
  htmlFor?: string;
}

export function LabelWithTooltip({
  label,
  tooltip,
  examples,
  required,
  htmlFor,
}: LabelWithTooltipProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1 text-sm font-medium text-gray-700"
    >
      {label}
      {required && <span className="text-red-500">*</span>}
      <Tooltip content={tooltip} examples={examples} />
    </label>
  );
}

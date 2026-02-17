'use client';

import { useMemo } from 'react';
import { Bell, Calendar, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/src/lib/utils';
import type { AdditionalItem } from '@/src/services/cash-flow.service';

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

interface PaymentAlert {
  itemName: string;
  amount: number;
  paymentDay: number;
  month: number;
  year: number;
  daysUntil: number;
  isPastDue: boolean;
}

interface PaymentAlertsProps {
  items: AdditionalItem[];
  periods: { month: number; year: number }[];
}

export function PaymentAlerts({ items, periods }: PaymentAlertsProps) {
  const alerts = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const result: PaymentAlert[] = [];

    for (const item of items) {
      if (!item.recurrence?.paymentDay) continue;
      const { paymentDay, startCol, endCol, frequency } = item.recurrence;

      // Find which periods this item applies to
      const step = frequency === 'single' ? 0
        : frequency === 'monthly' ? 1
        : frequency === 'bimonthly' ? 2
        : frequency === 'quarterly' ? 3
        : frequency === 'semiannual' ? 6
        : 12;

      if (step === 0) continue;

      const end = endCol ?? periods.length;
      for (let col = startCol; col <= end; col += step) {
        const period = periods[col - 1];
        if (!period) continue;

        // Only check current and next month
        const periodDate = new Date(period.year, period.month - 1, paymentDay);
        const diffTime = periodDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= -3 && diffDays <= 7) {
          result.push({
            itemName: item.name,
            amount: item.amounts[col] || item.recurrence.amount,
            paymentDay,
            month: period.month,
            year: period.year,
            daysUntil: diffDays,
            isPastDue: diffDays < 0,
          });
        }
      }
    }

    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [items, periods]);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-amber-600" />
        <h4 className="text-sm font-semibold text-amber-800">
          Alertas de Pago ({alerts.length})
        </h4>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={`${alert.itemName}-${alert.month}-${alert.year}-${i}`}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
              alert.isPastDue
                ? 'bg-red-100 border border-red-200'
                : alert.daysUntil <= 2
                  ? 'bg-orange-100 border border-orange-200'
                  : 'bg-white border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {alert.isPastDue ? (
                <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
              ) : (
                <Calendar className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <span className="font-medium text-gray-900">{alert.itemName}</span>
                <span className="text-gray-500 ml-1">
                  — {alert.paymentDay} de {MONTH_NAMES_SHORT[alert.month - 1]} {alert.year}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">{formatCurrency(alert.amount)}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                alert.isPastDue
                  ? 'bg-red-200 text-red-800'
                  : alert.daysUntil === 0
                    ? 'bg-orange-200 text-orange-800'
                    : alert.daysUntil <= 2
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-blue-100 text-blue-700'
              }`}>
                {alert.isPastDue
                  ? `Vencido hace ${Math.abs(alert.daysUntil)} día${Math.abs(alert.daysUntil) !== 1 ? 's' : ''}`
                  : alert.daysUntil === 0
                    ? 'Hoy'
                    : `En ${alert.daysUntil} día${alert.daysUntil !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

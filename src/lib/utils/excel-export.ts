// src/lib/utils/excel-export.ts

import ExcelJS from 'exceljs';
import type { CashFlow, CashFlowPeriod } from '@/src/services/cash-flow.service';

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

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

type BorderStyle = ExcelJS.Border;

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' } as BorderStyle,
  left: { style: 'thin' } as BorderStyle,
  bottom: { style: 'thin' } as BorderStyle,
  right: { style: 'thin' } as BorderStyle,
};

const currencyFormat = '"$"#,##0';

function getLabel(field: string, customLabels?: Record<string, string>) {
  return customLabels?.[field] || DEFAULT_LABELS[field] || field;
}

function addDataRow(
  ws: ExcelJS.Worksheet,
  label: string,
  values: number[],
  total: number,
  colCount: number,
  opts?: { bold?: boolean; fill?: string; fontColor?: string },
) {
  const row = ws.addRow([label, ...values, total]);
  // Style concept cell
  row.getCell(1).font = { bold: opts?.bold ?? false, size: 10 };
  row.getCell(1).alignment = { horizontal: 'left' };
  // Style value cells
  for (let c = 2; c <= colCount + 2; c++) {
    const cell = row.getCell(c);
    cell.numFmt = currencyFormat;
    cell.alignment = { horizontal: 'right' };
    cell.font = {
      bold: opts?.bold ?? false,
      size: 10,
      color: opts?.fontColor ? { argb: opts.fontColor } : undefined,
    };
  }
  // Fill
  if (opts?.fill) {
    for (let c = 1; c <= colCount + 2; c++) {
      row.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: opts.fill },
      };
    }
  }
  // Borders
  for (let c = 1; c <= colCount + 2; c++) {
    row.getCell(c).border = thinBorder;
  }
  return row;
}

function addSectionHeader(
  ws: ExcelJS.Worksheet,
  text: string,
  colCount: number,
  fillColor: string,
  fontColor: string,
) {
  const row = ws.addRow([text]);
  ws.mergeCells(row.number, 1, row.number, colCount + 2);
  const cell = row.getCell(1);
  cell.font = { bold: true, size: 10, color: { argb: fontColor } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: fillColor },
  };
  cell.border = thinBorder;
  // Apply border to all merged cells
  for (let c = 2; c <= colCount + 2; c++) {
    row.getCell(c).border = thinBorder;
  }
  return row;
}

export async function exportCashFlowToExcel(cashFlow: CashFlow) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Fluxi Finance';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Flujo de Caja');

  const periods = (cashFlow.periods || []).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const colCount = periods.length;
  const additionalItems = cashFlow.additional_items;
  const customLabels = additionalItems?.customLabels;
  const hiddenRows = additionalItems?.hiddenRows || [];

  // ── Title rows ──
  const titleRow = ws.addRow(['FLUJO DE CAJA OPERACIONAL']);
  ws.mergeCells(titleRow.number, 1, titleRow.number, colCount + 2);
  titleRow.getCell(1).font = { bold: true, size: 16 };
  titleRow.getCell(1).alignment = { horizontal: 'center' };

  const nameRow = ws.addRow([cashFlow.name]);
  ws.mergeCells(nameRow.number, 1, nameRow.number, colCount + 2);
  nameRow.getCell(1).font = { size: 12 };
  nameRow.getCell(1).alignment = { horizontal: 'center' };

  const yearRow = ws.addRow([`Año Fiscal: ${cashFlow.fiscal_year}`]);
  ws.mergeCells(yearRow.number, 1, yearRow.number, colCount + 2);
  yearRow.getCell(1).font = { size: 10, color: { argb: 'FF666666' } };
  yearRow.getCell(1).alignment = { horizontal: 'center' };

  ws.addRow([]); // blank row

  // ── Header row ──
  const headerValues = ['Concepto', ...periods.map(p => `${MONTH_NAMES[p.month - 1]} ${p.year}`), 'Total Año'];
  const headerRow = ws.addRow(headerValues);
  for (let c = 1; c <= colCount + 2; c++) {
    const cell = headerRow.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4285F4' },
    };
    cell.alignment = { horizontal: c === 1 ? 'left' : 'center' };
    cell.border = thinBorder;
  }

  // ── Column widths ──
  ws.getColumn(1).width = 30;
  for (let c = 2; c <= colCount + 1; c++) {
    ws.getColumn(c).width = 16;
  }
  ws.getColumn(colCount + 2).width = 18;

  // ── Helper: sum field across periods ──
  const sumField = (field: keyof CashFlowPeriod) =>
    periods.reduce((s, p) => s + ((p[field] as number) || 0), 0);

  // ── Helper: get additional item amounts per column ──
  const getAdditionalItemValues = (item: { amounts: Record<number, number> }) =>
    periods.map((_, idx) => item.amounts[idx + 1] || 0);

  const getAdditionalItemTotal = (item: { amounts: Record<number, number> }) =>
    periods.reduce((s, _, idx) => s + (item.amounts[idx + 1] || 0), 0);

  // ══════════════════════════════════════
  // ENTRADAS DE EFECTIVO
  // ══════════════════════════════════════
  addSectionHeader(ws, 'ENTRADAS DE EFECTIVO', colCount, 'FFDCFADC', 'FF006400');

  // Sales collections
  addDataRow(ws, getLabel('salesCollections', customLabels),
    periods.map(p => p.sales_collections), sumField('sales_collections'), colCount);

  // Other income
  addDataRow(ws, getLabel('otherIncome', customLabels),
    periods.map(p => p.other_income), sumField('other_income'), colCount);

  // Additional incomes
  const additionalIncomes = additionalItems?.incomes || [];
  for (const item of additionalIncomes) {
    addDataRow(ws, item.name || 'Ingreso adicional',
      getAdditionalItemValues(item), getAdditionalItemTotal(item), colCount);
  }

  // Total Entradas
  addDataRow(ws, 'Total Entradas',
    periods.map(p => p.total_inflows), sumField('total_inflows'), colCount,
    { bold: true, fill: 'FFC8F0C8' });

  // ══════════════════════════════════════
  // SALIDAS DE EFECTIVO
  // ══════════════════════════════════════
  addSectionHeader(ws, 'SALIDAS DE EFECTIVO', colCount, 'FFFFDCDC', 'FF960000');

  // Static expense fields
  const expenseFields: { field: keyof CashFlowPeriod; dtoField: string }[] = [
    { field: 'supplier_payments', dtoField: 'supplierPayments' },
    { field: 'payroll', dtoField: 'payroll' },
    { field: 'rent', dtoField: 'rent' },
    { field: 'utilities', dtoField: 'utilities' },
    { field: 'taxes', dtoField: 'taxes' },
    { field: 'other_expenses', dtoField: 'otherExpenses' },
  ];

  for (const { field, dtoField } of expenseFields) {
    if (hiddenRows.includes(dtoField)) continue;
    addDataRow(ws, getLabel(dtoField, customLabels),
      periods.map(p => (p[field] as number) || 0), sumField(field), colCount);
  }

  // Additional expenses
  const additionalExpenses = additionalItems?.expenses || [];
  for (const item of additionalExpenses) {
    addDataRow(ws, item.name || 'Gasto adicional',
      getAdditionalItemValues(item), getAdditionalItemTotal(item), colCount);
  }

  // Total Salidas
  addDataRow(ws, 'Total Salidas',
    periods.map(p => p.total_outflows), sumField('total_outflows'), colCount,
    { bold: true, fill: 'FFFFC8C8' });

  // ══════════════════════════════════════
  // FLUJO NETO
  // ══════════════════════════════════════
  const netTotal = sumField('net_cash_flow');
  const netFontColor = netTotal >= 0 ? 'FF006400' : 'FF960000';

  const netRow = addDataRow(ws, 'FLUJO NETO',
    periods.map(p => p.net_cash_flow), netTotal, colCount,
    { bold: true, fill: 'FFDCE6FF', fontColor: netFontColor });

  // Conditional font colors per month
  for (let i = 0; i < periods.length; i++) {
    const cell = netRow.getCell(i + 2);
    cell.font = {
      bold: true,
      size: 10,
      color: { argb: periods[i].net_cash_flow >= 0 ? 'FF006400' : 'FF960000' },
    };
  }

  // ══════════════════════════════════════
  // FLUJO ACUMULADO
  // ══════════════════════════════════════
  const cumulativeTotal = periods.length > 0
    ? periods[periods.length - 1].cumulative_cash_flow
    : 0;
  const cumulativeFontColor = cumulativeTotal >= 0 ? 'FF006400' : 'FF960000';

  const cumulativeRow = addDataRow(ws, 'FLUJO ACUMULADO',
    periods.map(p => p.cumulative_cash_flow), cumulativeTotal, colCount,
    { bold: true, fill: 'FFE8EEFF', fontColor: cumulativeFontColor });

  // Conditional font colors per month
  for (let i = 0; i < periods.length; i++) {
    const cell = cumulativeRow.getCell(i + 2);
    cell.font = {
      bold: true,
      size: 10,
      color: { argb: periods[i].cumulative_cash_flow >= 0 ? 'FF006400' : 'FF960000' },
    };
  }

  // ── Footer ──
  ws.addRow([]);
  const footerRow = ws.addRow([`Generado con Fluxi Finance — ${new Date().toLocaleString('es-CO')}`]);
  ws.mergeCells(footerRow.number, 1, footerRow.number, colCount + 2);
  footerRow.getCell(1).font = { size: 8, italic: true, color: { argb: 'FF999999' } };
  footerRow.getCell(1).alignment = { horizontal: 'center' };

  // ── Download ──
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cashFlow.name.replace(/\s+/g, '_')}_${cashFlow.fiscal_year}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

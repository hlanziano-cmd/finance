// src/lib/utils/pdf-export.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './index';
import type { IncomeStatement } from '@/src/services/income-statement.service';
import type { BalanceSheet } from '@/src/services/balance-sheet.service';

export function exportIncomeStatementToPDF(statement: IncomeStatement) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO DE RESULTADOS', 105, 20, { align: 'center' });

  // Información del período
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(statement.name, 105, 30, { align: 'center' });

  const startDate = new Date(statement.period_start).toLocaleDateString('es-CO');
  const endDate = new Date(statement.period_end).toLocaleDateString('es-CO');
  doc.setFontSize(10);
  doc.text(`Período: ${startDate} - ${endDate}`, 105, 37, { align: 'center' });
  doc.text(`Año Fiscal: ${statement.fiscal_year}`, 105, 43, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 48, 190, 48);

  let yPosition = 55;

  // Tabla de Estado de Resultados
  autoTable(doc, {
    startY: yPosition,
    head: [['CONCEPTO', 'MONTO', '%']],
    body: [
      ['INGRESOS OPERACIONALES', formatCurrency(statement.revenue), '100.0%'],
      ['(-) Costo de Ventas', formatCurrency(statement.cost_of_sales), `${statement.revenue > 0 ? ((statement.cost_of_sales / statement.revenue) * 100).toFixed(1) : '0.0'}%`],
      [{ content: 'UTILIDAD BRUTA', styles: { fontStyle: 'bold', fillColor: [220, 240, 255] } },
       { content: formatCurrency(statement.gross_profit), styles: { fontStyle: 'bold', fillColor: [220, 240, 255] } },
       { content: `${statement.gross_margin.toFixed(1)}%`, styles: { fontStyle: 'bold', fillColor: [220, 240, 255] } }],
      ['(-) Gastos Operacionales', formatCurrency(statement.operating_expenses), `${statement.revenue > 0 ? ((statement.operating_expenses / statement.revenue) * 100).toFixed(1) : '0.0'}%`],
      [{ content: 'UTILIDAD OPERACIONAL (EBIT)', styles: { fontStyle: 'bold', fillColor: [230, 220, 255] } },
       { content: formatCurrency(statement.operating_profit), styles: { fontStyle: 'bold', fillColor: [230, 220, 255] } },
       { content: `${statement.operating_margin.toFixed(1)}%`, styles: { fontStyle: 'bold', fillColor: [230, 220, 255] } }],
      ['(+) Depreciación y Amortización', formatCurrency(statement.depreciation_amortization), `${statement.revenue > 0 ? ((statement.depreciation_amortization / statement.revenue) * 100).toFixed(1) : '0.0'}%`],
      [{ content: 'EBITDA', styles: { fontStyle: 'bold', fillColor: [220, 255, 255] } },
       { content: formatCurrency(statement.ebitda), styles: { fontStyle: 'bold', fillColor: [220, 255, 255] } },
       { content: `${statement.revenue > 0 ? ((statement.ebitda / statement.revenue) * 100).toFixed(1) : '0.0'}%`, styles: { fontStyle: 'bold', fillColor: [220, 255, 255] } }],
      ['(+) Ingresos No Operacionales', formatCurrency(statement.non_operating_income), `${statement.revenue > 0 ? ((statement.non_operating_income / statement.revenue) * 100).toFixed(1) : '0.0'}%`],
      ['(-) Gastos No Operacionales', formatCurrency(statement.non_operating_expenses), `${statement.revenue > 0 ? ((statement.non_operating_expenses / statement.revenue) * 100).toFixed(1) : '0.0'}%`],
      [{ content: 'UTILIDAD ANTES DE IMPUESTOS', styles: { fontStyle: 'bold', fillColor: [240, 230, 255] } },
       { content: formatCurrency(statement.profit_before_tax), styles: { fontStyle: 'bold', fillColor: [240, 230, 255] } },
       { content: `${statement.revenue > 0 ? ((statement.profit_before_tax / statement.revenue) * 100).toFixed(1) : '0.0'}%`, styles: { fontStyle: 'bold', fillColor: [240, 230, 255] } }],
      [`(-) Impuestos (${statement.tax_rate}%)`, formatCurrency(statement.tax_expense), `${statement.revenue > 0 ? ((statement.tax_expense / statement.revenue) * 100).toFixed(1) : '0.0'}%`],
      [{ content: 'UTILIDAD NETA', styles: { fontStyle: 'bold', fillColor: statement.net_profit >= 0 ? [220, 255, 220] : [255, 220, 220] } },
       { content: formatCurrency(statement.net_profit), styles: { fontStyle: 'bold', fillColor: statement.net_profit >= 0 ? [220, 255, 220] : [255, 220, 220] } },
       { content: `${statement.net_margin.toFixed(1)}%`, styles: { fontStyle: 'bold', fillColor: statement.net_profit >= 0 ? [220, 255, 220] : [255, 220, 220] } }],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  // Indicadores clave
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  yPosition = finalY + 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICADORES CLAVE', 20, yPosition);

  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [['INDICADOR', 'VALOR']],
    body: [
      ['Margen Bruto', `${statement.gross_margin.toFixed(2)}%`],
      ['Margen Operacional', `${statement.operating_margin.toFixed(2)}%`],
      ['Margen Neto', `${statement.net_margin.toFixed(2)}%`],
      ['EBITDA', formatCurrency(statement.ebitda)],
      ['Tasa de Impuestos', `${statement.tax_rate}%`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 }
  });

  // Análisis de rentabilidad
  const finalY2 = (doc as any).lastAutoTable.finalY || 200;
  yPosition = finalY2 + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);

  let analysis = '';
  if (statement.net_margin > 15) {
    analysis = 'Rentabilidad excelente. El negocio genera muy buenas utilidades.';
  } else if (statement.net_margin > 5) {
    analysis = 'Rentabilidad saludable. El negocio es rentable con espacio para mejorar.';
  } else if (statement.net_margin > 0) {
    analysis = 'Rentabilidad ajustada. Se recomienda optimizar costos y gastos.';
  } else {
    analysis = 'El negocio presenta pérdidas. Se requieren acciones correctivas urgentes.';
  }

  doc.text(`Análisis: ${analysis}`, 20, yPosition, { maxWidth: 170 });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generado con Fluxi Finance - Sistema de Diagnóstico Financiero', 105, pageHeight - 10, { align: 'center' });
  doc.text(new Date().toLocaleString('es-CO'), 105, pageHeight - 5, { align: 'center' });

  // Guardar PDF
  const fileName = `${statement.name.replace(/\s+/g, '_')}_${statement.fiscal_year}.pdf`;
  doc.save(fileName);
}

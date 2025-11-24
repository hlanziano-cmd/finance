// src/lib/utils/pdf-export.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/src/lib/utils';
import type { IncomeStatement } from '@/src/services/income-statement.service';
import type { CashFlow } from '@/src/services/cash-flow.service';
import { BalanceSheet } from '@/src/types/models';

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

// Export indicators to executive PDF report
interface ExecutiveReportData {
  balanceName: string;
  incomeName: string;
  cashFlowName?: string;
  fiscalYear: number;
  indicators: {
    // Liquidez
    workingCapital: number;
    currentRatio: number;
    acidTest: number;
    cashRatio: number;
    // Endeudamiento
    debtRatio: number;
    debtToEquity: number;
    financialLeverage: number;
    // Rentabilidad
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    roa: number;
    roe: number;
    ebitda: number;
    // Eficiencia
    assetTurnover: number;
    inventoryTurnover?: number;
    receivablesDays?: number;
  };
}

export function exportExecutiveReportToPDF(data: ExecutiveReportData) {
  const doc = new jsPDF();

  // Título principal
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE EJECUTIVO GERENCIAL', 105, 20, { align: 'center' });

  // Subtítulo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Año Fiscal ${data.fiscalYear}`, 105, 28, { align: 'center' });

  // Información de documentos fuente
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Balance General: ${data.balanceName}`, 105, 35, { align: 'center' });
  doc.text(`Estado de Resultados: ${data.incomeName}`, 105, 40, { align: 'center' });
  if (data.cashFlowName) {
    doc.text(`Flujo de Caja: ${data.cashFlowName}`, 105, 45, { align: 'center' });
  }

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 50, 190, 50);

  let yPosition = 58;

  // SECCIÓN 1: INDICADORES DE LIQUIDEZ
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('1. INDICADORES DE LIQUIDEZ', 20, yPosition);
  yPosition += 2;

  doc.setDrawColor(66, 133, 244);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 60, yPosition);
  yPosition += 6;

  autoTable(doc, {
    startY: yPosition,
    head: [['Indicador', 'Valor', 'Análisis']],
    body: [
      [
        'Capital de Trabajo',
        formatCurrency(data.indicators.workingCapital),
        data.indicators.workingCapital > 0 ? 'Positivo' : 'Negativo'
      ],
      [
        'Razón Corriente',
        data.indicators.currentRatio.toFixed(2),
        data.indicators.currentRatio >= 1.5 ? 'Buena liquidez' : 'Liquidez limitada'
      ],
      [
        'Prueba Ácida',
        data.indicators.acidTest.toFixed(2),
        data.indicators.acidTest >= 1.0 ? 'Liquidez inmediata buena' : 'Requiere atención'
      ],
      [
        'Razón de Efectivo',
        data.indicators.cashRatio.toFixed(2),
        data.indicators.cashRatio >= 0.5 ? 'Adecuado' : 'Bajo'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [66, 133, 244], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 60 }
    },
    margin: { left: 20, right: 20 }
  });

  // SECCIÓN 2: INDICADORES DE RENTABILIDAD
  yPosition = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. INDICADORES DE RENTABILIDAD', 20, yPosition);
  yPosition += 2;

  doc.setDrawColor(34, 197, 94);
  doc.line(20, yPosition, 75, yPosition);
  yPosition += 6;

  autoTable(doc, {
    startY: yPosition,
    head: [['Indicador', 'Valor', 'Análisis']],
    body: [
      [
        'Margen Bruto',
        `${(data.indicators.grossMargin * 100).toFixed(2)}%`,
        data.indicators.grossMargin > 0.3 ? 'Excelente' : 'Mejorable'
      ],
      [
        'Margen Operacional',
        `${(data.indicators.operatingMargin * 100).toFixed(2)}%`,
        data.indicators.operatingMargin > 0.15 ? 'Muy bueno' : data.indicators.operatingMargin > 0.05 ? 'Aceptable' : 'Bajo'
      ],
      [
        'Margen Neto',
        `${(data.indicators.netMargin * 100).toFixed(2)}%`,
        data.indicators.netMargin > 0.10 ? 'Excelente' : data.indicators.netMargin > 0 ? 'Rentable' : 'Pérdidas'
      ],
      [
        'ROE',
        `${(data.indicators.roe * 100).toFixed(2)}%`,
        data.indicators.roe > 0.15 ? 'Excelente retorno' : data.indicators.roe > 0 ? 'Retorno positivo' : 'Sin retorno'
      ],
      [
        'ROA',
        `${(data.indicators.roa * 100).toFixed(2)}%`,
        data.indicators.roa > 0.10 ? 'Muy eficiente' : data.indicators.roa > 0 ? 'Eficiente' : 'Ineficiente'
      ],
      [
        'EBITDA',
        formatCurrency(data.indicators.ebitda),
        data.indicators.ebitda > 0 ? 'Positivo' : 'Negativo'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 60 }
    },
    margin: { left: 20, right: 20 }
  });

  // Nueva página
  doc.addPage();
  yPosition = 20;

  // SECCIÓN 3: INDICADORES DE ENDEUDAMIENTO
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('3. INDICADORES DE ENDEUDAMIENTO', 20, yPosition);
  yPosition += 2;

  doc.setDrawColor(239, 68, 68);
  doc.line(20, yPosition, 80, yPosition);
  yPosition += 6;

  autoTable(doc, {
    startY: yPosition,
    head: [['Indicador', 'Valor', 'Análisis']],
    body: [
      [
        'Ratio de Deuda',
        `${(data.indicators.debtRatio * 100).toFixed(2)}%`,
        data.indicators.debtRatio < 0.5 ? 'Endeudamiento bajo' : data.indicators.debtRatio < 0.7 ? 'Moderado' : 'Alto'
      ],
      [
        'Deuda/Patrimonio',
        data.indicators.debtToEquity.toFixed(2),
        data.indicators.debtToEquity < 1 ? 'Bajo riesgo' : data.indicators.debtToEquity < 2 ? 'Riesgo moderado' : 'Alto riesgo'
      ],
      [
        'Apalancamiento Financiero',
        data.indicators.financialLeverage.toFixed(2),
        data.indicators.financialLeverage < 2 ? 'Conservador' : data.indicators.financialLeverage < 3 ? 'Moderado' : 'Agresivo'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 60 }
    },
    margin: { left: 20, right: 20 }
  });

  // SECCIÓN 4: INDICADORES DE EFICIENCIA OPERATIVA
  yPosition = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('4. INDICADORES DE EFICIENCIA OPERATIVA', 20, yPosition);
  yPosition += 2;

  doc.setDrawColor(168, 85, 247);
  doc.line(20, yPosition, 95, yPosition);
  yPosition += 6;

  const efficiencyBody = [
    [
      'Rotación de Activos',
      `${data.indicators.assetTurnover.toFixed(2)}x`,
      data.indicators.assetTurnover > 1 ? 'Eficiente' : 'Mejorable'
    ]
  ];

  if (data.indicators.inventoryTurnover) {
    efficiencyBody.push([
      'Rotación de Inventario',
      `${data.indicators.inventoryTurnover.toFixed(2)}x`,
      data.indicators.inventoryTurnover > 6 ? 'Excelente' : data.indicators.inventoryTurnover > 3 ? 'Adecuado' : 'Lento'
    ]);
  }

  if (data.indicators.receivablesDays) {
    efficiencyBody.push([
      'Días de Cobro',
      `${data.indicators.receivablesDays.toFixed(0)} días`,
      data.indicators.receivablesDays < 30 ? 'Excelente' : data.indicators.receivablesDays < 60 ? 'Aceptable' : 'Mejorar'
    ]);
  }

  autoTable(doc, {
    startY: yPosition,
    head: [['Indicador', 'Valor', 'Análisis']],
    body: efficiencyBody,
    theme: 'grid',
    headStyles: { fillColor: [168, 85, 247], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 60 }
    },
    margin: { left: 20, right: 20 }
  });

  // SECCIÓN 5: RESUMEN EJECUTIVO
  yPosition = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('5. RESUMEN EJECUTIVO', 20, yPosition);
  yPosition += 2;

  doc.setDrawColor(100, 100, 100);
  doc.line(20, yPosition, 60, yPosition);
  yPosition += 8;

  // Análisis general
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let healthScore = 0;
  let recommendations: string[] = [];

  // Calcular health score básico
  if (data.indicators.currentRatio >= 1.5) healthScore += 15;
  else if (data.indicators.currentRatio >= 1.0) healthScore += 10;

  if (data.indicators.netMargin > 0.10) healthScore += 25;
  else if (data.indicators.netMargin > 0.05) healthScore += 15;
  else if (data.indicators.netMargin > 0) healthScore += 5;

  if (data.indicators.debtRatio < 0.5) healthScore += 20;
  else if (data.indicators.debtRatio < 0.7) healthScore += 10;

  if (data.indicators.roe > 0.15) healthScore += 20;
  else if (data.indicators.roe > 0.05) healthScore += 10;

  if (data.indicators.assetTurnover > 1) healthScore += 20;
  else if (data.indicators.assetTurnover > 0.5) healthScore += 10;

  // Generar recomendaciones
  if (data.indicators.currentRatio < 1.5) {
    recommendations.push('• Mejorar liquidez: Incrementar activos corrientes o reducir pasivos de corto plazo.');
  }
  if (data.indicators.netMargin < 0.10) {
    recommendations.push('• Optimizar rentabilidad: Reducir costos operativos o aumentar precios.');
  }
  if (data.indicators.debtRatio > 0.6) {
    recommendations.push('• Reducir endeudamiento: Priorizar pago de deudas o capitalizar el negocio.');
  }
  if (data.indicators.assetTurnover < 1) {
    recommendations.push('• Aumentar eficiencia: Mejorar uso de activos para generar más ventas.');
  }
  if (data.indicators.receivablesDays && data.indicators.receivablesDays > 60) {
    recommendations.push('• Acelerar cobranza: Reducir días de cobro para mejorar flujo de caja.');
  }

  // Mostrar Health Score
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Health Score Financiero:', 20, yPosition);

  const scoreColor = healthScore >= 80 ? [34, 197, 94] : healthScore >= 60 ? [234, 179, 8] : healthScore >= 40 ? [249, 115, 22] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFontSize(24);
  doc.text(`${healthScore}/100`, 90, yPosition);

  yPosition += 10;

  // Recomendaciones
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Recomendaciones Estratégicas:', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (recommendations.length > 0) {
    recommendations.forEach(rec => {
      const lines = doc.splitTextToSize(rec, 170);
      lines.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
    });
  } else {
    doc.text('• La empresa presenta indicadores financieros saludables. Continuar monitoreando.', 20, yPosition);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generado con Fluxi Finance - Sistema de Diagnóstico Financiero', 105, pageHeight - 10, { align: 'center' });
  doc.text(new Date().toLocaleString('es-CO'), 105, pageHeight - 5, { align: 'center' });

  // Guardar PDF
  const fileName = `Reporte_Ejecutivo_${data.fiscalYear}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}

// Export Balance Sheet to PDF
export function exportBalanceSheetToPDF(balanceSheet: BalanceSheet) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BALANCE GENERAL', 105, 20, { align: 'center' });

  // Información del balance
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(balanceSheet.name, 105, 30, { align: 'center' });

  const startDate = new Date(balanceSheet.period_start).toLocaleDateString('es-CO');
  const endDate = new Date(balanceSheet.period_end).toLocaleDateString('es-CO');
  doc.setFontSize(10);
  doc.text(`Período: ${startDate} - ${endDate}`, 105, 37, { align: 'center' });
  doc.text(`Año Fiscal: ${balanceSheet.fiscal_year}`, 105, 43, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 48, 190, 48);

  let yPosition = 55;

  // Calcular totales
  const totals = balanceSheet.totals || {
    totalActivo: 0,
    totalActivoCorriente: 0,
    totalActivoNoCorriente: 0,
    totalPasivo: 0,
    totalPasivoCorriente: 0,
    totalPasivoNoCorriente: 0,
    totalPatrimonio: 0,
    isBalanced: false,
    difference: 0
  };

  // Agrupar items por categoría y subcategoría
  const activoItems = balanceSheet.items.filter(item => item.category === 'activo');
  const pasivoItems = balanceSheet.items.filter(item => item.category === 'pasivo');
  const patrimonioItems = balanceSheet.items.filter(item => item.category === 'patrimonio');

  const groupBySubcategory = (items: typeof balanceSheet.items) => {
    const grouped = new Map<string, typeof balanceSheet.items>();
    items.forEach(item => {
      const existing = grouped.get(item.subcategory) || [];
      grouped.set(item.subcategory, [...existing, item]);
    });
    return grouped;
  };

  const activoGrouped = groupBySubcategory(activoItems);
  const pasivoGrouped = groupBySubcategory(pasivoItems);
  const patrimonioGrouped = groupBySubcategory(patrimonioItems);

  // SECCIÓN DE ACTIVOS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // green-600
  doc.text('ACTIVOS', 20, yPosition);
  yPosition += 2;

  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 40, yPosition);
  yPosition += 6;

  doc.setTextColor(0, 0, 0);

  // Crear tabla de activos
  const activoBody: any[] = [];

  Array.from(activoGrouped.entries()).forEach(([subcategory, items]) => {
    // Header de subcategoría
    activoBody.push([
      { content: subcategory.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52] } }
    ]);

    // Items de la subcategoría
    items.forEach(item => {
      activoBody.push([
        item.accountName,
        formatCurrency(item.amount)
      ]);
    });

    // Subtotal de subcategoría
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    activoBody.push([
      { content: `Subtotal ${subcategory}`, styles: { fontStyle: 'bold' } },
      { content: formatCurrency(subtotal), styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } }
    ]);
  });

  // Total de activos
  activoBody.push([
    { content: 'TOTAL ACTIVOS', styles: { fontStyle: 'bold', fillColor: [22, 163, 74], textColor: 255 } },
    { content: formatCurrency(totals.totalActivo), styles: { fontStyle: 'bold', fillColor: [22, 163, 74], textColor: 255 } }
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['CONCEPTO', 'MONTO']],
    body: activoBody,
    theme: 'grid',
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  // SECCIÓN DE PASIVOS Y PATRIMONIO
  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // Verificar si necesitamos una nueva página
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // red-600
  doc.text('PASIVOS Y PATRIMONIO', 20, yPosition);
  yPosition += 2;

  doc.setDrawColor(220, 38, 38);
  doc.line(20, yPosition, 75, yPosition);
  yPosition += 6;

  doc.setTextColor(0, 0, 0);

  const pasivoPatrimonioBody: any[] = [];

  // PASIVOS
  if (pasivoGrouped.size > 0) {
    pasivoPatrimonioBody.push([
      { content: 'PASIVOS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [254, 242, 242], textColor: [153, 27, 27] } }
    ]);

    Array.from(pasivoGrouped.entries()).forEach(([subcategory, items]) => {
      // Header de subcategoría
      pasivoPatrimonioBody.push([
        { content: subcategory.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [127, 29, 29] } }
      ]);

      // Items de la subcategoría
      items.forEach(item => {
        pasivoPatrimonioBody.push([
          item.accountName,
          formatCurrency(item.amount)
        ]);
      });

      // Subtotal de subcategoría
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      pasivoPatrimonioBody.push([
        { content: `Subtotal ${subcategory}`, styles: { fontStyle: 'bold' } },
        { content: formatCurrency(subtotal), styles: { fontStyle: 'bold', fillColor: [254, 202, 202] } }
      ]);
    });

    // Total de pasivos
    pasivoPatrimonioBody.push([
      { content: 'TOTAL PASIVOS', styles: { fontStyle: 'bold', fillColor: [220, 38, 38], textColor: 255 } },
      { content: formatCurrency(totals.totalPasivo), styles: { fontStyle: 'bold', fillColor: [220, 38, 38], textColor: 255 } }
    ]);
  }

  // PATRIMONIO
  if (patrimonioGrouped.size > 0) {
    pasivoPatrimonioBody.push([
      { content: 'PATRIMONIO', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [239, 246, 255], textColor: [29, 78, 216] } }
    ]);

    Array.from(patrimonioGrouped.entries()).forEach(([subcategory, items]) => {
      // Header de subcategoría
      pasivoPatrimonioBody.push([
        { content: subcategory.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [219, 234, 254], textColor: [30, 64, 175] } }
      ]);

      // Items de la subcategoría
      items.forEach(item => {
        pasivoPatrimonioBody.push([
          item.accountName,
          formatCurrency(item.amount)
        ]);
      });

      // Subtotal de subcategoría
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      pasivoPatrimonioBody.push([
        { content: `Subtotal ${subcategory}`, styles: { fontStyle: 'bold' } },
        { content: formatCurrency(subtotal), styles: { fontStyle: 'bold', fillColor: [191, 219, 254] } }
      ]);
    });

    // Total de patrimonio
    pasivoPatrimonioBody.push([
      { content: 'TOTAL PATRIMONIO', styles: { fontStyle: 'bold', fillColor: [37, 99, 235], textColor: 255 } },
      { content: formatCurrency(totals.totalPatrimonio), styles: { fontStyle: 'bold', fillColor: [37, 99, 235], textColor: 255 } }
    ]);
  }

  // Total de pasivos + patrimonio
  const totalPasivoPatrimonio = totals.totalPasivo + totals.totalPatrimonio;
  pasivoPatrimonioBody.push([
    { content: 'TOTAL PASIVOS + PATRIMONIO', styles: { fontStyle: 'bold', fillColor: [55, 65, 81], textColor: 255 } },
    { content: formatCurrency(totalPasivoPatrimonio), styles: { fontStyle: 'bold', fillColor: [55, 65, 81], textColor: 255 } }
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['CONCEPTO', 'MONTO']],
    body: pasivoPatrimonioBody,
    theme: 'grid',
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  // ECUACIÓN CONTABLE
  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // Verificar si necesitamos una nueva página
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('ECUACIÓN CONTABLE', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const ecuacion = `${formatCurrency(totals.totalActivo)} = ${formatCurrency(totals.totalPasivo)} + ${formatCurrency(totals.totalPatrimonio)}`;
  doc.text(ecuacion, 20, yPosition);
  yPosition += 6;

  const isBalanced = Math.abs(totals.totalActivo - totalPasivoPatrimonio) < 0.01;
  if (!isBalanced) {
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    const difference = Math.abs(totals.totalActivo - totalPasivoPatrimonio);
    doc.text(`⚠️ Advertencia: La ecuación contable no está balanceada (diferencia: ${formatCurrency(difference)})`, 20, yPosition);
    yPosition += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  } else {
    doc.setTextColor(22, 163, 74);
    doc.text('✓ La ecuación contable está balanceada correctamente', 20, yPosition);
    yPosition += 6;
    doc.setTextColor(0, 0, 0);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generado con Fluxi Finance - Sistema de Diagnóstico Financiero', 105, pageHeight - 10, { align: 'center' });
  doc.text(new Date().toLocaleString('es-CO'), 105, pageHeight - 5, { align: 'center' });

  // Guardar PDF
  const fileName = `${balanceSheet.name.replace(/\s+/g, '_')}_${balanceSheet.fiscal_year}.pdf`;
  doc.save(fileName);
}

// Export Cash Flow to PDF
export function exportCashFlowToPDF(cashFlow: CashFlow) {
  const doc = new jsPDF('landscape'); // Usar orientación horizontal para la tabla

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FLUJO DE CAJA OPERACIONAL', 148.5, 15, { align: 'center' });

  // Información del período
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(cashFlow.name, 148.5, 23, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Año Fiscal: ${cashFlow.fiscal_year}`, 148.5, 29, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 34, 282, 34);

  // Ordenar períodos por mes
  const periods = (cashFlow.periods || []).sort((a, b) => a.month - b.month);

  // Calcular totales anuales
  const yearTotals = periods.reduce((acc, p) => ({
    salesCollections: acc.salesCollections + p.sales_collections,
    otherIncome: acc.otherIncome + p.other_income,
    totalInflows: acc.totalInflows + p.total_inflows,
    supplierPayments: acc.supplierPayments + p.supplier_payments,
    payroll: acc.payroll + p.payroll,
    rent: acc.rent + p.rent,
    utilities: acc.utilities + p.utilities,
    taxes: acc.taxes + p.taxes,
    otherExpenses: acc.otherExpenses + p.other_expenses,
    totalOutflows: acc.totalOutflows + p.total_outflows,
    netCashFlow: acc.netCashFlow + p.net_cash_flow,
  }), {
    salesCollections: 0,
    otherIncome: 0,
    totalInflows: 0,
    supplierPayments: 0,
    payroll: 0,
    rent: 0,
    utilities: 0,
    taxes: 0,
    otherExpenses: 0,
    totalOutflows: 0,
    netCashFlow: 0,
  });

  let yPosition = 40;

  // Tabla de flujo de caja mensual
  const tableHead = [['Concepto', ...periods.map(p => MONTH_NAMES[p.month - 1].substring(0, 3)), 'Total Año']];

  const tableBody = [
    // ENTRADAS
    [{ content: 'ENTRADAS DE EFECTIVO', colSpan: periods.length + 2, styles: { fontStyle: 'bold', fillColor: [220, 250, 220], textColor: [0, 100, 0] } }],
    ['Cobros de Ventas', ...periods.map(p => formatCurrency(p.sales_collections)), formatCurrency(yearTotals.salesCollections)],
    ['Otros Ingresos', ...periods.map(p => formatCurrency(p.other_income)), formatCurrency(yearTotals.otherIncome)],
    [{ content: 'Total Entradas', styles: { fontStyle: 'bold', fillColor: [200, 240, 200] } },
     ...periods.map(p => ({ content: formatCurrency(p.total_inflows), styles: { fontStyle: 'bold', fillColor: [200, 240, 200] } })),
     { content: formatCurrency(yearTotals.totalInflows), styles: { fontStyle: 'bold', fillColor: [180, 230, 180] } }],

    // SALIDAS
    [{ content: 'SALIDAS DE EFECTIVO', colSpan: periods.length + 2, styles: { fontStyle: 'bold', fillColor: [255, 220, 220], textColor: [150, 0, 0] } }],
    ['Pagos a Proveedores', ...periods.map(p => formatCurrency(p.supplier_payments)), formatCurrency(yearTotals.supplierPayments)],
    ['Nómina', ...periods.map(p => formatCurrency(p.payroll)), formatCurrency(yearTotals.payroll)],
    ['Arriendo', ...periods.map(p => formatCurrency(p.rent)), formatCurrency(yearTotals.rent)],
    ['Servicios Públicos', ...periods.map(p => formatCurrency(p.utilities)), formatCurrency(yearTotals.utilities)],
    ['Impuestos', ...periods.map(p => formatCurrency(p.taxes)), formatCurrency(yearTotals.taxes)],
    ['Otros Gastos', ...periods.map(p => formatCurrency(p.other_expenses)), formatCurrency(yearTotals.otherExpenses)],
    [{ content: 'Total Salidas', styles: { fontStyle: 'bold', fillColor: [255, 200, 200] } },
     ...periods.map(p => ({ content: formatCurrency(p.total_outflows), styles: { fontStyle: 'bold', fillColor: [255, 200, 200] } })),
     { content: formatCurrency(yearTotals.totalOutflows), styles: { fontStyle: 'bold', fillColor: [255, 180, 180] } }],

    // FLUJO NETO
    [{ content: 'FLUJO NETO', styles: { fontStyle: 'bold', fillColor: [220, 230, 255] } },
     ...periods.map(p => ({ content: formatCurrency(p.net_cash_flow), styles: { fontStyle: 'bold', fillColor: [220, 230, 255], textColor: p.net_cash_flow >= 0 ? [0, 100, 0] : [150, 0, 0] } })),
     { content: formatCurrency(yearTotals.netCashFlow), styles: { fontStyle: 'bold', fillColor: [200, 220, 255], textColor: yearTotals.netCashFlow >= 0 ? [0, 100, 0] : [150, 0, 0] } }],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7,
      halign: 'right'
    },
    columnStyles: {
      0: { cellWidth: 40, halign: 'left', fontStyle: 'bold' },
      ...Object.fromEntries(
        Array.from({ length: periods.length }, (_, i) => [i + 1, { cellWidth: (242 - 50) / (periods.length + 1) }])
      ),
      [periods.length + 1]: { cellWidth: 30, fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 }
  });

  // Análisis y recomendaciones
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  yPosition = finalY + 10;

  // Análisis del flujo operacional
  const positiveMonths = periods.filter(p => p.net_cash_flow > 0).length;
  const negativeMonths = periods.filter(p => p.net_cash_flow < 0).length;
  const avgMonthlyFlow = periods.length > 0 ? yearTotals.netCashFlow / periods.length : 0;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS DEL FLUJO OPERACIONAL', 15, yPosition);

  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const analysisText = yearTotals.netCashFlow >= 0
    ? `El negocio genera un flujo de caja operacional POSITIVO de ${formatCurrency(yearTotals.netCashFlow)} durante el año. ` +
      `Esto indica que las operaciones generan más efectivo del que consumen.`
    : `El negocio presenta un flujo de caja operacional NEGATIVO de ${formatCurrency(Math.abs(yearTotals.netCashFlow))} durante el año. ` +
      `Esto significa que las operaciones están consumiendo más efectivo del que generan.`;

  const analysisLines = doc.splitTextToSize(analysisText, 267);
  analysisLines.forEach((line: string) => {
    doc.text(line, 15, yPosition);
    yPosition += 5;
  });

  yPosition += 3;

  // Indicadores clave
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICADORES CLAVE:', 15, yPosition);

  yPosition += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Meses con flujo positivo: ${positiveMonths} de ${periods.length}`, 15, yPosition);
  yPosition += 5;
  doc.text(`• Meses con flujo negativo: ${negativeMonths} de ${periods.length}`, 15, yPosition);
  yPosition += 5;
  doc.text(`• Flujo promedio mensual: ${formatCurrency(avgMonthlyFlow)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`• Total entradas anuales: ${formatCurrency(yearTotals.totalInflows)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`• Total salidas anuales: ${formatCurrency(yearTotals.totalOutflows)}`, 15, yPosition);

  yPosition += 8;

  // Recomendaciones
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMENDACIONES:', 15, yPosition);

  yPosition += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const recommendations: string[] = [];

  if (negativeMonths > positiveMonths) {
    recommendations.push('• CRÍTICO: Más meses negativos que positivos. Prioriza reducir gastos operativos o aumentar ventas.');
  }

  if (yearTotals.totalOutflows > yearTotals.totalInflows * 0.9 && yearTotals.netCashFlow >= 0) {
    recommendations.push('• ATENCIÓN: Las salidas representan más del 90% de las entradas. Optimizar costos.');
  }

  if (positiveMonths >= 9 && yearTotals.netCashFlow > 0) {
    recommendations.push('• EXCELENTE: Consistencia con ' + positiveMonths + ' meses positivos. Considerar inversión en crecimiento.');
  }

  if (yearTotals.netCashFlow < 0) {
    recommendations.push('• URGENTE: Analizar meses con mayor déficit. Puede requerir ajuste de precios o refinanciación.');
  }

  if (positiveMonths >= 6 && negativeMonths >= 6) {
    recommendations.push('• Flujos irregulares. Identificar patrones estacionales y planificar gastos mejor.');
  }

  if (avgMonthlyFlow > 0 && avgMonthlyFlow < yearTotals.totalInflows * 0.05) {
    recommendations.push('• Flujo promedio mensual bajo (menos del 5% de ingresos). Mejorar márgenes.');
  }

  if (recommendations.length === 0) {
    recommendations.push('• El flujo de caja es saludable. Continuar monitoreando mensualmente.');
  }

  recommendations.forEach(rec => {
    const lines = doc.splitTextToSize(rec, 267);
    lines.forEach((line: string) => {
      doc.text(line, 15, yPosition);
      yPosition += 5;
    });
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generado con Fluxi Finance - Sistema de Diagnóstico Financiero', 148.5, pageHeight - 10, { align: 'center' });
  doc.text(new Date().toLocaleString('es-CO'), 148.5, pageHeight - 5, { align: 'center' });

  // Guardar PDF
  const fileName = `${cashFlow.name.replace(/\s+/g, '_')}_${cashFlow.fiscal_year}.pdf`;
  doc.save(fileName);
}

// Export Cost Analysis to PDF
export function exportCostAnalysisToPDF(
  analysis: any,
  calculations: any
) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS DE COSTOS', 105, 20, { align: 'center' });

  // Información del producto
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(analysis.productName, 105, 30, { align: 'center' });

  if (analysis.productDescription) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(analysis.productDescription, 105, 37, { align: 'center' });
  }

  doc.setFontSize(9);
  const startDate = new Date(analysis.periodStart).toLocaleDateString('es-CO');
  const endDate = new Date(analysis.periodEnd).toLocaleDateString('es-CO');
  doc.text(`Período: ${startDate} - ${endDate} | Año Fiscal: ${analysis.fiscalYear}`, 105, 44, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 48, 190, 48);

  let yPosition = 55;

  // Key Metrics
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MÉTRICAS CLAVE', 20, yPosition);
  yPosition += 8;

  const isProfitable = calculations.currentMonthlyProfit > 0;

  autoTable(doc, {
    startY: yPosition,
    head: [['MÉTRICA', 'VALOR']],
    body: [
      ['Precio de Venta Unitario', formatCurrency(analysis.unitPrice)],
      ['Costo Variable por Unidad', formatCurrency(analysis.variableCostPerUnit)],
      ['Margen de Contribución Unitario', formatCurrency(calculations.contributionMarginPerUnit)],
      ['Margen de Contribución (%)', `${(calculations.contributionMarginRatio * 100).toFixed(1)}%`],
      ['Costos Fijos Mensuales', formatCurrency(analysis.monthlyFixedCosts)],
      ['', ''],
      [{ content: 'Punto de Equilibrio (unidades)', styles: { fontStyle: 'bold', fillColor: [255, 237, 213] } },
       { content: `${calculations.breakEvenUnits.toLocaleString()} unidades`, styles: { fontStyle: 'bold', fillColor: [255, 237, 213] } }],
      [{ content: 'Punto de Equilibrio (ingresos)', styles: { fontStyle: 'bold', fillColor: [255, 237, 213] } },
       { content: formatCurrency(calculations.breakEvenRevenue), styles: { fontStyle: 'bold', fillColor: [255, 237, 213] } }],
      ['', ''],
      ['Ventas Mensuales Actuales', `${analysis.currentMonthlyUnits.toLocaleString()} unidades`],
      ['Ingresos Mensuales Actuales', formatCurrency(calculations.currentMonthlyRevenue)],
      ['Costos Totales Mensuales', formatCurrency(calculations.currentMonthlyTotalCosts)],
      [{ content: 'UTILIDAD MENSUAL', styles: { fontStyle: 'bold', fillColor: isProfitable ? [220, 252, 231] : [254, 226, 226] } },
       { content: formatCurrency(calculations.currentMonthlyProfit), styles: { fontStyle: 'bold', fillColor: isProfitable ? [220, 252, 231] : [254, 226, 226], textColor: isProfitable ? [22, 101, 52] : [127, 29, 29] } }],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 80, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // Desglose de Costos Variables
  if (analysis.variableCostBreakdown && analysis.variableCostBreakdown.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE DE COSTOS VARIABLES (por unidad)', 20, yPosition);
    yPosition += 8;

    const variableBody = analysis.variableCostBreakdown.map((item: any) => [
      item.name,
      formatCurrency(item.amount)
    ]);

    variableBody.push([
      { content: 'TOTAL', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(analysis.variableCostPerUnit), styles: { fontStyle: 'bold', fillColor: [255, 237, 213] } }
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['CONCEPTO', 'MONTO']],
      body: variableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  // Check if we need a new page
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  // Desglose de Costos Fijos
  if (analysis.fixedCostBreakdown && analysis.fixedCostBreakdown.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE DE COSTOS FIJOS (mensuales)', 20, yPosition);
    yPosition += 8;

    const fixedBody = analysis.fixedCostBreakdown.map((item: any) => [
      item.name,
      formatCurrency(item.amount)
    ]);

    fixedBody.push([
      { content: 'TOTAL', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(analysis.monthlyFixedCosts), styles: { fontStyle: 'bold', fillColor: [254, 226, 226] } }
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['CONCEPTO', 'MONTO MENSUAL']],
      body: fixedBody,
      theme: 'grid',
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  // Análisis Adicional
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS ADICIONAL', 20, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [['INDICADOR', 'VALOR', 'INTERPRETACIÓN']],
    body: [
      [
        'Margen de Seguridad',
        `${calculations.marginOfSafetyPercentage.toFixed(1)}%`,
        calculations.marginOfSafetyPercentage > 40 ? 'Excelente' : calculations.marginOfSafetyPercentage > 20 ? 'Aceptable' : 'Crítico'
      ],
      [
        'Unidades de Seguridad',
        `${calculations.marginOfSafety.toLocaleString()} un.`,
        'Colchón sobre punto equilibrio'
      ],
      [
        'Apalancamiento Operativo',
        `${calculations.operatingLeverage.toFixed(2)}x`,
        calculations.operatingLeverage > 2 ? 'Alto - Sensible' : 'Moderado - Estable'
      ],
      ...(calculations.capacityUtilization !== undefined ? [[
        'Utilización de Capacidad',
        `${calculations.capacityUtilization.toFixed(1)}%`,
        calculations.capacityUtilization < 50 ? 'Subutilizada' : calculations.capacityUtilization > 90 ? 'Casi al límite' : 'Adecuada'
      ]] : []),
      ...(calculations.maxPotentialProfit !== undefined ? [[
        'Utilidad Potencial Máxima',
        formatCurrency(calculations.maxPotentialProfit),
        'Con capacidad máxima'
      ]] : []),
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 60, halign: 'center' }
    },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // Recomendaciones
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMENDACIONES', 20, yPosition);
  yPosition += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Generate recommendations
  const recommendations: string[] = [];

  if (!isProfitable) {
    recommendations.push(`⚠️ CRÍTICO: Producto no rentable. Pérdida de ${formatCurrency(Math.abs(calculations.currentMonthlyProfit))} mensuales.`);
    recommendations.push(`   Aumenta precio, reduce costos o ventas a ${calculations.breakEvenUnits} unidades mínimo.`);
  } else if (calculations.currentMonthlyProfit > 0 && analysis.currentMonthlyUnits < calculations.breakEvenUnits * 1.2) {
    recommendations.push(`⚡ Rentabilidad marginal. Aumenta ventas para mayor seguridad.`);
  } else {
    recommendations.push(`✓ Producto rentable con ${formatCurrency(calculations.currentMonthlyProfit)} de utilidad mensual.`);
  }

  if (calculations.contributionMarginRatio < 0.3) {
    recommendations.push(`⚠️ Margen bajo (${(calculations.contributionMarginRatio * 100).toFixed(1)}%). Considera aumentar precio o reducir costos variables.`);
  }

  if (calculations.marginOfSafetyPercentage < 20) {
    recommendations.push(`⚠️ Margen de seguridad crítico. Poco colchón ante caídas en ventas.`);
  }

  if (calculations.capacityUtilization !== undefined && calculations.capacityUtilization < 50) {
    recommendations.push(`• Capacidad subutilizada (${calculations.capacityUtilization.toFixed(1)}%). Oportunidad de crecimiento sin inversión.`);
  }

  // Print recommendations
  recommendations.forEach((rec, index) => {
    const lines = doc.splitTextToSize(rec, 170);
    lines.forEach((line: string) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });
    yPosition += 2; // Extra space between recommendations
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generado con Fluxi Finance - Sistema de Diagnóstico Financiero', 105, pageHeight - 10, { align: 'center' });
  doc.text(new Date().toLocaleString('es-CO'), 105, pageHeight - 5, { align: 'center' });

  // Guardar PDF
  const fileName = `Analisis_Costos_${analysis.productName.replace(/\s+/g, '_')}_${analysis.fiscalYear}.pdf`;
  doc.save(fileName);
}

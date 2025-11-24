// src/app/dashboard/indicators/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { TrendingUp, DollarSign, Percent, BarChart3, Info, X, Download, Save, Droplets, TrendingDown, PieChart, Zap, Trash2, Calendar, Eye, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { useBalanceSheets } from '@/src/lib/hooks/useBalanceSheet';
import { useIncomeStatements } from '@/src/lib/hooks/useIncomeStatement';
import { useCashFlows } from '@/src/lib/hooks/useCashFlow';
import { useCreateIndicatorAnalysis, useIndicatorAnalyses, useDeleteIndicatorAnalysis } from '@/src/lib/hooks/useIndicatorAnalysis';
import { formatCurrency, formatPercentage } from '@/src/lib/utils';
import { exportExecutiveReportToPDF } from '@/src/lib/utils/pdf-export';
import type { BalanceSheet } from '@/src/types';
import type { IncomeStatement } from '@/src/services/income-statement.service';
import type { CashFlow } from '@/src/services/cash-flow.service';

interface CalculatedIndicators {
  // Liquidez
  workingCapital: number;
  currentRatio: number;
  acidTest: number;
  cashRatio: number;

  // Endeudamiento
  debtRatio: number;
  debtToEquity: number;
  financialLeverage: number;
  interestCoverage?: number;

  // Rentabilidad
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  roa: number;
  roe: number;
  ebitda: number;

  // Eficiencia Operativa
  assetTurnover: number;
  inventoryTurnover?: number;
  receivablesDays?: number;
  payablesDays?: number;
}

interface TooltipInfo {
  title: string;
  definition: string;
  formula: string;
  optimalValue?: string;
  interpretation?: string;
}

const indicatorTooltips: Record<string, TooltipInfo> = {
  workingCapital: {
    title: 'Capital de Trabajo',
    definition: 'Recursos disponibles para operar día a día. Mide la capacidad de cubrir obligaciones a corto plazo.',
    formula: 'Activo Corriente - Pasivo Corriente',
    optimalValue: 'Positivo y suficiente para cubrir 2-3 meses de operación'
  },
  currentRatio: {
    title: 'Razón Corriente',
    definition: 'Capacidad de pagar deudas de corto plazo con activos líquidos.',
    formula: 'Activo Corriente ÷ Pasivo Corriente',
    optimalValue: '≥ 1.5 (Excelente: ≥ 2.0)',
    interpretation: '🔴 Crítico (< 1.0): No hay suficiente liquidez para cubrir deudas inmediatas. Riesgo de insolvencia. 🟡 Regular (1.0 - 1.5): Liquidez justa pero ajustada. Poco margen de seguridad. 🟢 Óptimo (≥ 1.5): Liquidez adecuada para operar con tranquilidad.'
  },
  acidTest: {
    title: 'Prueba Ácida',
    definition: 'Liquidez inmediata sin contar inventarios.',
    formula: '(Activo Corriente - Inventarios) ÷ Pasivo Corriente',
    optimalValue: '≥ 1.0 (Excelente: ≥ 1.5)',
    interpretation: '🔴 Crítico (< 0.7): Dependencia excesiva de inventarios para liquidez. 🟡 Regular (0.7 - 1.0): Liquidez limitada sin inventarios. 🟢 Óptimo (≥ 1.0): Puede cubrir deudas sin vender inventario.'
  },
  cashRatio: {
    title: 'Razón de Efectivo',
    definition: 'Capacidad de pagar deudas solo con efectivo disponible.',
    formula: 'Efectivo ÷ Pasivo Corriente',
    optimalValue: '≥ 0.3 (Excelente: ≥ 0.5)',
    interpretation: '🔴 Crítico (< 0.2): Efectivo muy limitado para emergencias. 🟡 Regular (0.2 - 0.3): Efectivo justo, poco margen. 🟢 Óptimo (≥ 0.3): Colchón adecuado de efectivo disponible.'
  },
  debtRatio: {
    title: 'Ratio de Deuda',
    definition: 'Porcentaje de activos financiados con deuda.',
    formula: 'Pasivo Total ÷ Activo Total',
    optimalValue: '< 0.5 (Excelente: < 0.3)',
    interpretation: '🔴 Crítico (> 0.7): Endeudamiento excesivo, alto riesgo financiero. 🟡 Regular (0.5 - 0.7): Deuda elevada pero manejable. 🟢 Óptimo (< 0.5): Estructura financiera equilibrada y saludable.'
  },
  debtToEquity: {
    title: 'Deuda/Patrimonio',
    definition: 'Veces que la deuda supera al patrimonio.',
    formula: 'Pasivo Total ÷ Patrimonio',
    optimalValue: '< 1.0 (Excelente: < 0.5)',
    interpretation: '🔴 Crítico (> 2.0): Deuda muy superior al patrimonio, riesgo alto. 🟡 Regular (1.0 - 2.0): Apalancamiento moderado. 🟢 Óptimo (< 1.0): Patrimonio supera a la deuda, posición sólida.'
  },
  financialLeverage: {
    title: 'Apalancamiento Financiero',
    definition: 'Proporción de activos financiados vs patrimonio.',
    formula: 'Activo Total ÷ Patrimonio',
    optimalValue: '1.5 - 2.5 (depende del sector)'
  },
  interestCoverage: {
    title: 'Cobertura de Intereses',
    definition: 'Capacidad de cubrir gastos financieros con utilidades operativas.',
    formula: 'EBIT ÷ Gastos Financieros',
    optimalValue: '≥ 3.0 (Excelente: ≥ 5.0)'
  },
  grossMargin: {
    title: 'Margen Bruto',
    definition: 'Rentabilidad después de costos de ventas.',
    formula: '(Utilidad Bruta ÷ Ingresos) × 100',
    optimalValue: '≥ 30% (varía según industria)',
    interpretation: '🔴 Crítico (< 20%): Costos de producción muy altos, rentabilidad comprometida. 🟡 Regular (20% - 30%): Margen ajustado, revisa costos. 🟢 Óptimo (≥ 30%): Capacidad adecuada de generar utilidad bruta.'
  },
  operatingMargin: {
    title: 'Margen Operacional',
    definition: 'Rentabilidad de la operación del negocio antes de impuestos.',
    formula: '(Utilidad Operacional ÷ Ingresos) × 100',
    optimalValue: '≥ 10% (Excelente: ≥ 20%)',
    interpretation: '🔴 Crítico (< 5%): Gastos operativos consumen casi toda la utilidad bruta. 🟡 Regular (5% - 10%): Margen operativo bajo, controla gastos. 🟢 Óptimo (≥ 10%): Operación eficiente y rentable.'
  },
  netMargin: {
    title: 'Margen Neto',
    definition: 'Rentabilidad final después de todos los gastos e impuestos.',
    formula: '(Utilidad Neta ÷ Ingresos) × 100',
    optimalValue: '≥ 10% (Excelente: ≥ 15%)',
    interpretation: '🔴 Crítico (< 0%): Operando con pérdidas, urgente revisar modelo de negocio. 🟡 Regular (0% - 10%): Rentabilidad baja, mejora márgenes o reduce costos. 🟢 Óptimo (≥ 10%): Rentabilidad neta saludable.'
  },
  roa: {
    title: 'ROA (Retorno sobre Activos)',
    definition: 'Eficiencia en generar utilidades con los activos disponibles.',
    formula: '(Utilidad Neta ÷ Activo Total) × 100',
    optimalValue: '≥ 5% (Excelente: ≥ 10%)',
    interpretation: '🔴 Crítico (< 2%): Activos poco productivos, baja eficiencia. 🟡 Regular (2% - 5%): Uso moderado de activos. 🟢 Óptimo (≥ 5%): Aprovechamiento adecuado de recursos.'
  },
  roe: {
    title: 'ROE (Retorno sobre Patrimonio)',
    definition: 'Rentabilidad de la inversión de los accionistas.',
    formula: '(Utilidad Neta ÷ Patrimonio) × 100',
    optimalValue: '≥ 15% (Excelente: ≥ 20%)',
    interpretation: '🔴 Crítico (< 5%): Retorno muy bajo para accionistas, inversión poco atractiva. 🟡 Regular (5% - 15%): Retorno moderado. 🟢 Óptimo (≥ 15%): Rentabilidad adecuada para inversores.'
  },
  ebitda: {
    title: 'EBITDA',
    definition: 'Utilidad operativa antes de intereses, impuestos, depreciación y amortización.',
    formula: 'Utilidad Operacional + Depreciación + Amortización',
    optimalValue: 'Positivo y creciente año tras año'
  },
  assetTurnover: {
    title: 'Rotación de Activos',
    definition: 'Eficiencia en generar ventas con los activos.',
    formula: 'Ingresos ÷ Activo Total',
    optimalValue: '≥ 1.0 (Excelente: ≥ 1.5)',
    interpretation: '🔴 Crítico (< 0.5): Activos improductivos, muy bajas ventas. 🟡 Regular (0.5 - 1.0): Uso moderado de activos. 🟢 Óptimo (≥ 1.0): Generación adecuada de ventas con activos.'
  },
  inventoryTurnover: {
    title: 'Rotación de Inventario',
    definition: 'Veces que se vende el inventario en un período.',
    formula: 'Costo de Ventas ÷ Inventario Promedio',
    optimalValue: '≥ 6 veces/año (varía según industria)',
    interpretation: '🔴 Crítico (< 3): Inventario se mueve muy lento, riesgo de obsolescencia. 🟡 Regular (3 - 6): Rotación moderada. 🟢 Óptimo (≥ 6): Inventario se mueve rápidamente.'
  },
  receivablesDays: {
    title: 'Días de Cobro',
    definition: 'Tiempo promedio para cobrar a clientes.',
    formula: '(Cuentas por Cobrar ÷ Ingresos) × 365',
    optimalValue: '≤ 45 días (Excelente: ≤ 30 días)',
    interpretation: '🔴 Crítico (> 90 días): Cobranza muy lenta, riesgo de liquidez y cuentas incobrables. 🟡 Regular (45 - 90 días): Cobranza lenta, mejorar gestión. 🟢 Óptimo (≤ 45 días): Cobranza eficiente.'
  },
  payablesDays: {
    title: 'Días de Pago',
    definition: 'Tiempo promedio para pagar a proveedores.',
    formula: '(Cuentas por Pagar ÷ Costo de Ventas) × 365',
    optimalValue: '30-60 días (equilibrio entre liquidez y relaciones)',
    interpretation: '🔴 Crítico (> 90 días): Retraso excesivo, riesgo de relación con proveedores. 🟡 Regular (60 - 90 días o < 30 días): Fuera de equilibrio ideal. 🟢 Óptimo (30 - 60 días): Balance entre liquidez y relaciones comerciales.'
  }
};

function TooltipCard({ info, onClose }: { info: TooltipInfo; onClose: () => void }) {
  return (
    <div className="absolute z-10 mt-2 w-96 rounded-lg bg-white p-4 shadow-xl border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900">{info.title}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-gray-700 mb-3">{info.definition}</p>
      <div className="bg-blue-50 p-2 rounded mb-2">
        <p className="text-xs font-mono text-blue-900">{info.formula}</p>
      </div>
      {info.optimalValue && (
        <div className="bg-green-50 p-2 rounded border border-green-200 mb-2">
          <p className="text-xs font-semibold text-green-900 mb-1">Valor Óptimo:</p>
          <p className="text-xs text-green-800">{info.optimalValue}</p>
        </div>
      )}
      {info.interpretation && (
        <div className="bg-gray-50 p-2 rounded border border-gray-200">
          <p className="text-xs font-semibold text-gray-900 mb-1">Interpretación:</p>
          <p className="text-xs text-gray-700 leading-relaxed">{info.interpretation}</p>
        </div>
      )}
    </div>
  );
}

// Helper para extraer valores específicos del balance
function getBalanceItemAmount(
  balance: BalanceSheet,
  searchTerms: string[]
): number {
  if (!balance.items || balance.items.length === 0) return 0;

  const item = balance.items.find(item =>
    searchTerms.some(term =>
      item.accountName.toLowerCase().includes(term.toLowerCase()) ||
      (item.accountCode && item.accountCode.includes(term))
    )
  );

  return item ? item.amount : 0;
}

// Helper para calcular totales del balance si no están disponibles
function calculateBalanceTotals(balance: BalanceSheet) {
  if (balance.totals && balance.totals.totalActivo > 0) {
    return balance.totals;
  }

  // Calcular totales desde los items
  const items = balance.items || [];

  const activoCorrienteItems = items.filter(item =>
    item.category === 'activo' &&
    (item.subcategory.toLowerCase().includes('corriente') ||
     item.subcategory.toLowerCase().includes('circulante'))
  );

  const activoNoCorrienteItems = items.filter(item =>
    item.category === 'activo' &&
    (item.subcategory.toLowerCase().includes('no corriente') ||
     item.subcategory.toLowerCase().includes('fijo') ||
     item.subcategory.toLowerCase().includes('largo plazo'))
  );

  const pasivoCorrienteItems = items.filter(item =>
    item.category === 'pasivo' &&
    (item.subcategory.toLowerCase().includes('corriente') ||
     item.subcategory.toLowerCase().includes('circulante'))
  );

  const pasivoNoCorrienteItems = items.filter(item =>
    item.category === 'pasivo' &&
    (item.subcategory.toLowerCase().includes('no corriente') ||
     item.subcategory.toLowerCase().includes('largo plazo'))
  );

  const patrimonioItems = items.filter(item => item.category === 'patrimonio');

  const totalActivoCorriente = activoCorrienteItems.reduce((sum, item) => sum + item.amount, 0);
  const totalActivoNoCorriente = activoNoCorrienteItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPasivoCorriente = pasivoCorrienteItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPasivoNoCorriente = pasivoNoCorrienteItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPatrimonio = patrimonioItems.reduce((sum, item) => sum + item.amount, 0);

  const totalActivo = totalActivoCorriente + totalActivoNoCorriente;
  const totalPasivo = totalPasivoCorriente + totalPasivoNoCorriente;

  const difference = Math.abs(totalActivo - (totalPasivo + totalPatrimonio));

  return {
    totalActivo,
    totalActivoCorriente,
    totalActivoNoCorriente,
    totalPasivo,
    totalPasivoCorriente,
    totalPasivoNoCorriente,
    totalPatrimonio,
    isBalanced: difference < 0.01,
    difference: difference > 0 ? difference : undefined,
  };
}

export default function IndicatorsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [analysisName, setAnalysisName] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<string>('');
  const [selectedIncome, setSelectedIncome] = useState<string>('');
  const [selectedCashFlow, setSelectedCashFlow] = useState<string>('');
  const [indicators, setIndicators] = useState<CalculatedIndicators | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('');

  const { data: balanceSheets, isLoading: loadingBalances } = useBalanceSheets();
  const { data: incomeStatements, isLoading: loadingIncomes } = useIncomeStatements();
  const { data: cashFlows, isLoading: loadingCashFlows } = useCashFlows();
  const createAnalysisMutation = useCreateIndicatorAnalysis();
  const { data: savedAnalyses, isLoading: loadingSavedAnalyses } = useIndicatorAnalyses();
  const deleteAnalysisMutation = useDeleteIndicatorAnalysis();

  const handleExportPDF = () => {
    if (!indicators) return;

    const balance = balanceSheets?.data?.find((b: any) => b.id === selectedBalance);
    const income = incomeStatements?.find((i: any) => i.id === selectedIncome);
    const cashFlow = selectedCashFlow ? cashFlows?.find((c: any) => c.id === selectedCashFlow) : undefined;

    if (!balance || !income) return;

    exportExecutiveReportToPDF({
      balanceName: balance.name,
      incomeName: income.name,
      cashFlowName: cashFlow?.name,
      fiscalYear: balance.fiscalYear,
      indicators
    });
  };

  const handleSaveAnalysis = async () => {
    if (!indicators || !analysisName.trim()) {
      alert('Por favor ingresa un nombre para el análisis');
      return;
    }

    if (!selectedBalance || !selectedIncome) {
      alert('Error: No se encontraron los documentos seleccionados');
      return;
    }

    const balance = balanceSheets?.data?.find((b: any) => b.id === selectedBalance);
    const income = incomeStatements?.find((i: any) => i.id === selectedIncome);

    if (!balance) {
      alert('Error: No se encontró el balance seleccionado');
      return;
    }

    if (!income) {
      alert('Error: No se encontró el estado de resultados seleccionado');
      return;
    }

    let fiscal_year = balance.fiscalYear;

    if (!fiscal_year) {
      console.warn('Balance sin fiscal_year, intentando obtener del estado de resultados');
      fiscal_year = income.fiscal_year;
    }

    if (!fiscal_year) {
      console.warn('Estado de resultados sin fiscal_year, usando el año del período');
      fiscal_year = new Date(balance.periodEnd).getFullYear();
    }

    console.log('Año fiscal a usar:', fiscal_year);

    try {
      await createAnalysisMutation.mutateAsync({
        name: analysisName.trim(),
        balance_sheet_id: selectedBalance,
        income_statement_id: selectedIncome,
        cash_flow_id: selectedCashFlow || null,
        fiscal_year: fiscal_year,
        score: currentScore,
        analysis_text: currentAnalysis,
        indicators: indicators as Record<string, any>,
      });

      alert('Análisis guardado exitosamente');
      setShowSaveModal(false);
      setAnalysisName('');
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Error al guardar el análisis. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este análisis?')) {
      return;
    }

    try {
      await deleteAnalysisMutation.mutateAsync(id);
      alert('Análisis eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Error al eliminar el análisis. Por favor intenta de nuevo.');
    }
  };

  const calculateIndicators = () => {
    if (!selectedBalance || !selectedIncome) {
      alert('Debes seleccionar al menos un Balance General y un Estado de Resultados');
      return;
    }

    const balance = balanceSheets?.data?.find((b: any) => b.id === selectedBalance);
    const income = incomeStatements?.find((i: any) => i.id === selectedIncome);

    if (!balance || !income) {
      alert('Error al obtener los documentos seleccionados');
      return;
    }

    // Calcular totales del balance (usará balance.totals si existe, o calculará desde items)
    const balanceTotals = calculateBalanceTotals(balance);
    const totalAssets = balanceTotals.totalActivo;
    const currentAssets = balanceTotals.totalActivoCorriente;
    const totalLiabilities = balanceTotals.totalPasivo;
    const currentLiabilities = balanceTotals.totalPasivoCorriente;
    const equity = balanceTotals.totalPatrimonio;

    // Extraer valores específicos de balance.items
    const cash = getBalanceItemAmount(balance, ['efectivo', 'caja', '1105', '1110']);
    const inventory = getBalanceItemAmount(balance, ['inventario', '1435', '1440']);
    const receivables = getBalanceItemAmount(balance, ['cuenta', 'cobrar', 'cliente', '1305', '1310']);

    // Estado de Resultados - usar la estructura correcta
    const revenue = income.revenue || 0;
    const costOfSales = income.cost_of_sales || 0;
    const operatingProfit = income.operating_profit || 0;
    const netProfit = income.net_profit || 0;
    const grossProfit = income.gross_profit || 0;
    const ebitda = income.ebitda || 0;

    const calculated: CalculatedIndicators = {
      // Liquidez
      workingCapital: currentAssets - currentLiabilities,
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      acidTest: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
      cashRatio: currentLiabilities > 0 ? cash / currentLiabilities : 0,

      // Endeudamiento
      debtRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
      debtToEquity: equity > 0 ? totalLiabilities / equity : 0,
      financialLeverage: equity > 0 ? totalAssets / equity : 0,

      // Rentabilidad
      grossMargin: revenue > 0 ? grossProfit / revenue : 0,
      operatingMargin: revenue > 0 ? operatingProfit / revenue : 0,
      netMargin: revenue > 0 ? netProfit / revenue : 0,
      roa: totalAssets > 0 ? netProfit / totalAssets : 0,
      roe: equity > 0 ? netProfit / equity : 0,
      ebitda,

      // Eficiencia
      assetTurnover: totalAssets > 0 ? revenue / totalAssets : 0,
      inventoryTurnover: inventory > 0 && costOfSales > 0 ? costOfSales / inventory : undefined,
      receivablesDays: revenue > 0 && receivables > 0 ? (receivables / revenue) * 365 : undefined,
      payablesDays: undefined
    };

    setIndicators(calculated);
    setShowModal(false);
  };

  // Helper para obtener badge de interpretación
  const getInterpretationBadge = (value: number, type: 'liquidity' | 'profitability' | 'debt' | 'efficiency') => {
    let label = '';
    let color = '';

    switch (type) {
      case 'liquidity':
        if (value >= 1.5) { label = 'Óptimo'; color = 'bg-green-500'; }
        else if (value >= 1) { label = 'Regular'; color = 'bg-yellow-500'; }
        else { label = 'Crítico'; color = 'bg-red-500'; }
        break;
      case 'profitability':
        if (value > 0.10) { label = 'Óptimo'; color = 'bg-green-500'; }
        else if (value > 0.05) { label = 'Regular'; color = 'bg-yellow-500'; }
        else { label = 'Crítico'; color = 'bg-red-500'; }
        break;
      case 'debt':
        if (value < 0.5) { label = 'Óptimo'; color = 'bg-green-500'; }
        else if (value < 0.7) { label = 'Regular'; color = 'bg-yellow-500'; }
        else { label = 'Crítico'; color = 'bg-red-500'; }
        break;
      case 'efficiency':
        if (value > 1) { label = 'Óptimo'; color = 'bg-green-500'; }
        else if (value > 0.5) { label = 'Regular'; color = 'bg-yellow-500'; }
        else { label = 'Crítico'; color = 'bg-red-500'; }
        break;
    }

    return <Badge className={`${color} text-white text-xs`}>{label}</Badge>;
  };

  // Helper para obtener alerta y recomendación de indicadores
  const getIndicatorAlert = (indicatorKey: string, value: number): { show: boolean; message: string; recommendation: string } | null => {
    const alerts: Record<string, (val: number) => { show: boolean; message: string; recommendation: string } | null> = {
      currentRatio: (val) => val < 1.5 ? {
        show: true,
        message: val < 1 ? 'CRÍTICO: Liquidez insuficiente' : 'ALERTA: Liquidez por debajo del óptimo',
        recommendation: 'Aumenta activos corrientes o reduce pasivos de corto plazo. Considera negociar plazos con proveedores o mejorar cobranza.'
      } : null,
      acidTest: (val) => val < 1.0 ? {
        show: true,
        message: val < 0.5 ? 'CRÍTICO: Liquidez inmediata muy baja' : 'ALERTA: Prueba ácida debajo del óptimo',
        recommendation: 'Incrementa efectivo y cuentas por cobrar. Reduce dependencia del inventario para cubrir obligaciones.'
      } : null,
      cashRatio: (val) => val < 0.3 ? {
        show: true,
        message: 'ALERTA: Efectivo insuficiente',
        recommendation: 'Mejora la gestión de efectivo. Considera líneas de crédito de corto plazo como respaldo.'
      } : null,
      debtRatio: (val) => val > 0.5 ? {
        show: true,
        message: val > 0.7 ? 'CRÍTICO: Endeudamiento excesivo' : 'ALERTA: Nivel de deuda elevado',
        recommendation: 'Reduce el endeudamiento mediante pago de deudas o aumento de patrimonio. Evita nuevos créditos innecesarios.'
      } : null,
      debtToEquity: (val) => val > 1.0 ? {
        show: true,
        message: val > 2.0 ? 'CRÍTICO: Deuda supera ampliamente el patrimonio' : 'ALERTA: Deuda mayor que patrimonio',
        recommendation: 'Fortalece el patrimonio con aportes de capital o reinversión de utilidades. Reestructura deudas.'
      } : null,
      netMargin: (val) => val < 0.10 ? {
        show: true,
        message: val < 0 ? 'CRÍTICO: Operación con pérdidas' : 'ALERTA: Margen de utilidad bajo',
        recommendation: 'Revisa estructura de costos y gastos. Aumenta precios si el mercado lo permite o mejora eficiencia operativa.'
      } : null,
      grossMargin: (val) => val < 0.30 ? {
        show: true,
        message: 'ALERTA: Margen bruto bajo',
        recommendation: 'Negocia mejores precios con proveedores o aumenta precios de venta. Optimiza procesos productivos.'
      } : null,
      operatingMargin: (val) => val < 0.10 ? {
        show: true,
        message: val < 0 ? 'CRÍTICO: Pérdida operativa' : 'ALERTA: Margen operacional bajo',
        recommendation: 'Reduce gastos operativos innecesarios. Revisa estructura administrativa y eficiencia de procesos.'
      } : null,
      roe: (val) => val < 0.15 ? {
        show: true,
        message: val < 0 ? 'CRÍTICO: Destrucción de valor' : 'ALERTA: Retorno bajo para accionistas',
        recommendation: 'Mejora rentabilidad aumentando ventas o reduciendo costos. Optimiza uso del patrimonio.'
      } : null,
      roa: (val) => val < 0.05 ? {
        show: true,
        message: 'ALERTA: Activos generan poco retorno',
        recommendation: 'Aumenta productividad de activos. Considera vender activos improductivos o aumentar ventas.'
      } : null,
      assetTurnover: (val) => val < 0.8 ? {
        show: true,
        message: val < 0.5 ? 'CRÍTICO: Activos muy poco productivos' : 'ALERTA: Rotación de activos baja',
        recommendation: 'Incrementa ventas o reduce activos ociosos. Optimiza gestión de inventarios y cuentas por cobrar.'
      } : null,
      workingCapital: (val) => val < 0 ? {
        show: true,
        message: 'CRÍTICO: Capital de trabajo negativo',
        recommendation: 'URGENTE: Reestructura pasivos corrientes o inyecta capital. Mejora cobranza y negocia plazos.'
      } : null,
    };

    const alertFn = alerts[indicatorKey];
    return alertFn ? alertFn(value) : null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/indicators')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Indicadores Financieros</h1>
            <p className="mt-1 text-sm text-gray-500">
              Construye indicadores a partir de tus documentos financieros
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {indicators && (
            <>
              <Button onClick={() => setShowSaveModal(true)} variant="outline" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar Análisis
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </>
          )}
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Construir Indicadores
          </Button>
        </div>
      </div>

      {/* Saved Analyses Section - Solo mostrar si NO hay indicadores calculados */}
      {!indicators && savedAnalyses && savedAnalyses.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-indigo-600" />
              Análisis Guardados
            </CardTitle>
            <CardDescription>
              Tus análisis financieros previos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedAnalyses.map((analysis) => {
                const scoreColor =
                  analysis.score >= 80 ? 'bg-green-100 border-green-400 text-green-700' :
                  analysis.score >= 60 ? 'bg-blue-100 border-blue-400 text-blue-700' :
                  analysis.score >= 40 ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
                  'bg-red-100 border-red-400 text-red-700';

                const scoreLabel =
                  analysis.score >= 80 ? 'Excelente' :
                  analysis.score >= 60 ? 'Bueno' :
                  analysis.score >= 40 ? 'Regular' :
                  'Crítico';

                const handleViewAnalysis = (analysisData: typeof analysis) => {
                  // Cargar los indicadores guardados para mostrarlos
                  if (analysisData.indicators) {
                    setIndicators(analysisData.indicators as CalculatedIndicators);
                    setCurrentScore(analysisData.score);
                    setCurrentAnalysis(analysisData.analysis_text);
                  }
                };

                const handleDownloadPDF = (analysisData: typeof analysis) => {
                  // Exportar el análisis a PDF
                  exportExecutiveReportToPDF({
                    balanceName: `Análisis: ${analysisData.name}`,
                    incomeName: 'Estado de Resultados',
                    cashFlowName: undefined,
                    fiscalYear: analysisData.fiscal_year,
                    indicators: analysisData.indicators as any
                  });
                };

                return (
                  <Card key={analysis.id} className="hover:shadow-lg transition-shadow border-2 border-indigo-200">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{analysis.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {new Date(analysis.created_at).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Eliminar análisis"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${scoreColor}`}>
                        <div>
                          <div className="text-2xl font-bold">{Math.round(analysis.score)}</div>
                          <div className="text-xs font-semibold">{scoreLabel}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-semibold">Año Fiscal</div>
                          <div className="text-lg font-bold">{analysis.fiscal_year}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-600 line-clamp-2">
                        {analysis.analysis_text}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAnalysis(analysis)}
                          className="flex-1 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Análisis
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(analysis)}
                          className="flex-1 text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Descargar PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Selecciona los Documentos Financieros</CardTitle>
              <CardDescription>
                Elige el Balance General, Estado de Resultados y Flujo de Caja para calcular los indicadores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Balance General */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Balance General <span className="text-red-600">*</span>
                </label>
                {loadingBalances ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : (
                  <select
                    value={selectedBalance}
                    onChange={(e) => setSelectedBalance(e.target.value)}
                    className="w-full bg-white border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500 transition-colors"
                  >
                    <option value="" className="text-gray-500">Selecciona un balance</option>
                    {balanceSheets?.data?.map((balance: any) => (
                      <option key={balance.id} value={balance.id} className="text-gray-900">
                        {balance.name} - {balance.fiscalYear}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Estado de Resultados */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Estado de Resultados <span className="text-red-600">*</span>
                </label>
                {loadingIncomes ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : (
                  <select
                    value={selectedIncome}
                    onChange={(e) => setSelectedIncome(e.target.value)}
                    className="w-full bg-white border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500 transition-colors"
                  >
                    <option value="" className="text-gray-500">Selecciona un estado de resultados</option>
                    {incomeStatements?.map((income: any) => (
                      <option key={income.id} value={income.id} className="text-gray-900">
                        {income.name} - {income.fiscal_year}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Flujo de Caja */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Flujo de Caja <span className="text-gray-500">(Opcional)</span>
                </label>
                {loadingCashFlows ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : (
                  <select
                    value={selectedCashFlow}
                    onChange={(e) => setSelectedCashFlow(e.target.value)}
                    className="w-full bg-white border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500 transition-colors"
                  >
                    <option value="" className="text-gray-500">Selecciona un flujo de caja (opcional)</option>
                    {cashFlows?.map((cashFlow: any) => (
                      <option key={cashFlow.id} value={cashFlow.id} className="text-gray-900">
                        {cashFlow.name} - {cashFlow.fiscal_year}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={calculateIndicators}>
                  Calcular Indicadores
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Guardar Análisis de Indicadores</CardTitle>
              <CardDescription>
                Dale un nombre a este análisis para guardarlo y poder consultarlo después
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nombre del Análisis <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  placeholder="Ej: Análisis Q1 2024"
                  className="w-full bg-white border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-500 transition-colors"
                  autoFocus
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Score:</strong> {Math.round(currentScore)} puntos
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Este análisis incluirá todos los indicadores calculados y el análisis generado.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => { setShowSaveModal(false); setAnalysisName(''); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAnalysis} disabled={createAnalysisMutation.isPending}>
                  {createAnalysisMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Indicators Display */}
      {!indicators ? (
        <div className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-20 w-20 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay indicadores calculados</h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Haz clic en &quot;Construir Indicadores&quot; para seleccionar tus documentos financieros y calcular los indicadores
          </p>
        </div>
      ) : (
        <>
          {/* Score General y Análisis */}
          {(() => {
            // Calcular score general (0-100)
            let score = 0;
            const weights = { liquidez: 25, rentabilidad: 35, endeudamiento: 20, eficiencia: 20 };

            // Liquidez (0-25 puntos)
            if (indicators.currentRatio >= 2) score += 25;
            else if (indicators.currentRatio >= 1.5) score += 20;
            else if (indicators.currentRatio >= 1) score += 15;
            else if (indicators.currentRatio >= 0.5) score += 8;

            // Rentabilidad (0-35 puntos)
            if (indicators.netMargin > 0.15) score += 35;
            else if (indicators.netMargin > 0.10) score += 28;
            else if (indicators.netMargin > 0.05) score += 20;
            else if (indicators.netMargin > 0) score += 10;

            // Endeudamiento (0-20 puntos)
            if (indicators.debtRatio < 0.3) score += 20;
            else if (indicators.debtRatio < 0.5) score += 15;
            else if (indicators.debtRatio < 0.7) score += 10;
            else if (indicators.debtRatio < 0.9) score += 5;

            // Eficiencia (0-20 puntos)
            if (indicators.assetTurnover > 1.5) score += 20;
            else if (indicators.assetTurnover > 1) score += 15;
            else if (indicators.assetTurnover > 0.5) score += 10;
            else if (indicators.assetTurnover > 0) score += 5;

            const getScoreColor = (score: number) => {
              if (score >= 80) return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', label: 'Excelente' };
              if (score >= 60) return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', label: 'Bueno' };
              if (score >= 40) return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', label: 'Regular' };
              return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', label: 'Crítico' };
            };

            const scoreColor = getScoreColor(score);

            // Análisis basado en el score
            const getAnalysis = (score: number) => {
              if (score >= 80) {
                return 'La empresa presenta indicadores financieros sólidos. La liquidez es adecuada, la rentabilidad es saludable, el nivel de endeudamiento está controlado y los activos se utilizan eficientemente. Se recomienda mantener estas prácticas y buscar oportunidades de crecimiento sostenible.';
              } else if (score >= 60) {
                return 'La situación financiera de la empresa es favorable con algunos aspectos a mejorar. La mayoría de los indicadores están en rangos aceptables. Se sugiere enfocarse en optimizar las áreas con menor puntuación para fortalecer la posición financiera general.';
              } else if (score >= 40) {
                return 'La empresa enfrenta desafíos financieros moderados que requieren atención. Es necesario implementar medidas correctivas en las áreas débiles, especialmente en liquidez o rentabilidad. Se recomienda un plan de acción para mejorar los indicadores críticos.';
              } else {
                return 'La situación financiera de la empresa es crítica y requiere intervención urgente. Los indicadores muestran debilidades significativas en múltiples áreas. Se requiere un plan de reestructuración inmediato enfocado en mejorar la liquidez, reducir costos y optimizar operaciones.';
              }
            };

            const analysisText = getAnalysis(score);

            // Actualizar el estado con el score y análisis para poder guardarlo
            if (currentScore !== score) {
              setCurrentScore(score);
            }
            if (currentAnalysis !== analysisText) {
              setCurrentAnalysis(analysisText);
            }

            return (
              <Card className={`border-2 ${scoreColor.border} ${scoreColor.bg}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center ${scoreColor.bg} border-4 ${scoreColor.border}`}>
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${scoreColor.text}`}>{Math.round(score)}</div>
                          <div className="text-xs font-semibold text-gray-600 mt-1">SCORE</div>
                        </div>
                      </div>
                      <div className={`mt-2 text-center text-sm font-bold ${scoreColor.text}`}>
                        {scoreColor.label}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Análisis General de Salud Financiera</h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">{analysisText}</p>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-semibold text-gray-600">Liquidez</div>
                          <div className={`text-lg font-bold ${indicators.currentRatio >= 1.5 ? 'text-green-600' : 'text-red-600'}`}>
                            {indicators.currentRatio >= 1.5 ? '✓' : '✗'}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-semibold text-gray-600">Rentabilidad</div>
                          <div className={`text-lg font-bold ${indicators.netMargin > 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                            {indicators.netMargin > 0.05 ? '✓' : '✗'}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-semibold text-gray-600">Endeudamiento</div>
                          <div className={`text-lg font-bold ${indicators.debtRatio < 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                            {indicators.debtRatio < 0.7 ? '✓' : '✗'}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-semibold text-gray-600">Eficiencia</div>
                          <div className={`text-lg font-bold ${indicators.assetTurnover > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                            {indicators.assetTurnover > 0.5 ? '✓' : '✗'}
                          </div>
                        </div>
                      </div>

                      {/* Plan de Acción Sugerido */}
                      {(() => {
                        const actionItems: string[] = [];

                        // Verificar áreas débiles y agregar sugerencias específicas
                        if (indicators.currentRatio < 1.5) {
                          actionItems.push('Mejorar liquidez: Reducir cuentas por pagar o aumentar activos corrientes líquidos');
                        }

                        if (indicators.netMargin < 0.10) {
                          actionItems.push('Aumentar rentabilidad: Revisar estructura de costos y estrategia de precios');
                        }

                        if (indicators.debtRatio > 0.6) {
                          actionItems.push('Reducir endeudamiento: Considerar refinanciamiento o capitalización');
                        }

                        if (indicators.assetTurnover < 0.8) {
                          actionItems.push('Optimizar eficiencia: Mejorar la rotación de inventarios y gestión de activos');
                        }

                        if (indicators.roe < 0.10) {
                          actionItems.push('Incrementar retorno sobre patrimonio: Enfocarse en rentabilidad y uso eficiente del capital');
                        }

                        if (indicators.workingCapital < 0) {
                          actionItems.push('Capital de trabajo negativo: URGENTE - Gestionar obligaciones de corto plazo');
                        }

                        // Si hay sugerencias, mostrarlas
                        if (actionItems.length > 0) {
                          return (
                            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-indigo-200">
                              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="text-indigo-600">📋</span>
                                Plan de Acción Sugerido
                              </h4>
                              <ul className="space-y-2">
                                {actionItems.map((item, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-indigo-600 font-bold mt-0.5">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Definición de Categorías */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Categorías de Indicadores Financieros</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                  <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                    💧 Liquidez
                  </h4>
                  <p className="text-sm text-gray-700">
                    Miden la capacidad de la empresa para cumplir con sus obligaciones de corto plazo.
                    Evalúan si hay suficiente efectivo y activos líquidos para pagar deudas inmediatas.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                  <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                    💰 Rentabilidad
                  </h4>
                  <p className="text-sm text-gray-700">
                    Evalúan la capacidad de la empresa para generar ganancias. Muestran qué porcentaje de
                    las ventas o activos se convierten en utilidades para los accionistas.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-red-300">
                  <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                    📊 Endeudamiento
                  </h4>
                  <p className="text-sm text-gray-700">
                    Miden el nivel de financiamiento externo de la empresa. Indican qué proporción de
                    los activos está financiada con deuda versus capital propio.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-purple-300">
                  <h4 className="font-bold text-purple-700 mb-2 flex items-center gap-2">
                    ⚡ Eficiencia Operativa
                  </h4>
                  <p className="text-sm text-gray-700">
                    Evalúan qué tan bien la empresa utiliza sus recursos. Muestran la velocidad de
                    conversión de inventario y cobro de cuentas, y el uso eficiente de los activos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liquidez */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 flex items-center gap-2">
              💧 Indicadores de Liquidez
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative bg-blue-50 border-2 border-blue-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-blue-700">Capital de Trabajo</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'workingCapital' ? null : 'workingCapital')}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'workingCapital' && (
                    <TooltipCard info={indicatorTooltips.workingCapital} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(indicators.workingCapital)}
                    </p>
                    <Droplets className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    {indicators.workingCapital > 0 ? (
                      <Badge className="bg-green-500 text-white text-xs">Óptimo</Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white text-xs">Crítico</Badge>
                    )}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('workingCapital', indicators.workingCapital);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-blue-50 border-2 border-blue-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-blue-700">Razón Corriente</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'currentRatio' ? null : 'currentRatio')}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'currentRatio' && (
                    <TooltipCard info={indicatorTooltips.currentRatio} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-700">
                      {indicators.currentRatio.toFixed(2)}
                    </p>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.currentRatio, 'liquidity')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('currentRatio', indicators.currentRatio);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-blue-50 border-2 border-blue-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-blue-700">Prueba Ácida</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'acidTest' ? null : 'acidTest')}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'acidTest' && (
                    <TooltipCard info={indicatorTooltips.acidTest} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-700">
                      {indicators.acidTest.toFixed(2)}
                    </p>
                    <TrendingDown className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.acidTest, 'liquidity')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('acidTest', indicators.acidTest);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-blue-50 border-2 border-blue-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-blue-700">Razón de Efectivo</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'cashRatio' ? null : 'cashRatio')}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'cashRatio' && (
                    <TooltipCard info={indicatorTooltips.cashRatio} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-700">
                      {indicators.cashRatio.toFixed(2)}
                    </p>
                    <Droplets className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.cashRatio, 'liquidity')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('cashRatio', indicators.cashRatio);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Rentabilidad */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 flex items-center gap-2">
              💰 Indicadores de Rentabilidad
            </h2>
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              <Card className="relative bg-green-50 border-2 border-green-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-green-700">Margen Bruto</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'grossMargin' ? null : 'grossMargin')}
                      className="text-green-400 hover:text-green-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'grossMargin' && (
                    <TooltipCard info={indicatorTooltips.grossMargin} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-700">
                      {formatPercentage(indicators.grossMargin)}
                    </p>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.grossMargin, 'profitability')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('grossMargin', indicators.grossMargin);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-green-50 border-2 border-green-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-green-700">Margen Operativo</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'operatingMargin' ? null : 'operatingMargin')}
                      className="text-green-400 hover:text-green-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'operatingMargin' && (
                    <TooltipCard info={indicatorTooltips.operatingMargin} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-700">
                      {formatPercentage(indicators.operatingMargin)}
                    </p>
                    <Percent className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.operatingMargin, 'profitability')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('operatingMargin', indicators.operatingMargin);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-green-50 border-2 border-green-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-green-700">Margen Neto</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'netMargin' ? null : 'netMargin')}
                      className="text-green-400 hover:text-green-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'netMargin' && (
                    <TooltipCard info={indicatorTooltips.netMargin} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-700">
                      {formatPercentage(indicators.netMargin)}
                    </p>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.netMargin, 'profitability')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('netMargin', indicators.netMargin);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-green-50 border-2 border-green-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-green-700">ROE</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'roe' ? null : 'roe')}
                      className="text-green-400 hover:text-green-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'roe' && (
                    <TooltipCard info={indicatorTooltips.roe} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-700">
                      {formatPercentage(indicators.roe)}
                    </p>
                    <BarChart3 className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.roe, 'profitability')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('roe', indicators.roe);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-green-50 border-2 border-green-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-green-700">ROA</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'roa' ? null : 'roa')}
                      className="text-green-400 hover:text-green-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'roa' && (
                    <TooltipCard info={indicatorTooltips.roa} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-700">
                      {formatPercentage(indicators.roa)}
                    </p>
                    <Zap className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.roa, 'profitability')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('roa', indicators.roa);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Endeudamiento */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 flex items-center gap-2">
              📊 Indicadores de Endeudamiento
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="relative bg-red-50 border-2 border-red-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-red-700">Ratio de Deuda</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'debtRatio' ? null : 'debtRatio')}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'debtRatio' && (
                    <TooltipCard info={indicatorTooltips.debtRatio} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-red-700">
                      {formatPercentage(indicators.debtRatio)}
                    </p>
                    <PieChart className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.debtRatio, 'debt')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('debtRatio', indicators.debtRatio);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-red-50 border-2 border-red-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-red-700">Deuda/Patrimonio</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'debtToEquity' ? null : 'debtToEquity')}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'debtToEquity' && (
                    <TooltipCard info={indicatorTooltips.debtToEquity} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-red-700">
                      {indicators.debtToEquity.toFixed(2)}x
                    </p>
                    <BarChart3 className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.debtToEquity, 'debt')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('debtToEquity', indicators.debtToEquity);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="relative bg-red-50 border-2 border-red-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-red-700">Apalancamiento</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'financialLeverage' ? null : 'financialLeverage')}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'financialLeverage' && (
                    <TooltipCard info={indicatorTooltips.financialLeverage} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-700">
                    {indicators.financialLeverage.toFixed(2)}x
                  </p>
                  <p className="mt-2 text-xs text-red-600">
                    Activos vs Patrimonio
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Eficiencia */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 flex items-center gap-2">
              ⚡ Indicadores de Eficiencia Operativa
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative bg-purple-50 border-2 border-purple-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-purple-700">Rotación de Activos</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'assetTurnover' ? null : 'assetTurnover')}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'assetTurnover' && (
                    <TooltipCard info={indicatorTooltips.assetTurnover} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-purple-700">
                      {indicators.assetTurnover.toFixed(2)}x
                    </p>
                    <Zap className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-2">
                    {getInterpretationBadge(indicators.assetTurnover, 'efficiency')}
                  </div>
                  {(() => {
                    const alert = getIndicatorAlert('assetTurnover', indicators.assetTurnover);
                    if (alert?.show) {
                      return (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800">{alert.message}</p>
                              <p className="text-xs text-yellow-700 mt-1">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              {indicators.inventoryTurnover !== undefined && (
                <Card className="relative bg-purple-50 border-2 border-purple-300">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium text-purple-700">Rotación Inventario</CardTitle>
                      <button
                        onClick={() => setActiveTooltip(activeTooltip === 'inventoryTurnover' ? null : 'inventoryTurnover')}
                        className="text-purple-400 hover:text-purple-600"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    {activeTooltip === 'inventoryTurnover' && (
                      <TooltipCard info={indicatorTooltips.inventoryTurnover} onClose={() => setActiveTooltip(null)} />
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-700">
                      {indicators.inventoryTurnover.toFixed(2)}x
                    </p>
                    <p className="mt-2 text-xs text-purple-600">Veces por período</p>
                  </CardContent>
                </Card>
              )}

              {indicators.receivablesDays !== undefined && (
                <Card className="relative bg-purple-50 border-2 border-purple-300">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium text-purple-700">Días de Cobro</CardTitle>
                      <button
                        onClick={() => setActiveTooltip(activeTooltip === 'receivablesDays' ? null : 'receivablesDays')}
                        className="text-purple-400 hover:text-purple-600"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    {activeTooltip === 'receivablesDays' && (
                      <TooltipCard info={indicatorTooltips.receivablesDays} onClose={() => setActiveTooltip(null)} />
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-700">
                      {indicators.receivablesDays.toFixed(0)} días
                    </p>
                    <p className="mt-2 text-xs text-purple-600">Tiempo promedio</p>
                  </CardContent>
                </Card>
              )}

              <Card className="relative bg-purple-50 border-2 border-purple-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-purple-700">EBITDA</CardTitle>
                    <button
                      onClick={() => setActiveTooltip(activeTooltip === 'ebitda' ? null : 'ebitda')}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {activeTooltip === 'ebitda' && (
                    <TooltipCard info={indicatorTooltips.ebitda} onClose={() => setActiveTooltip(null)} />
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(indicators.ebitda)}
                  </p>
                  <p className="mt-2 text-xs text-purple-600">Flujo operativo</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

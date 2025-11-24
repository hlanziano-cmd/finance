// src/types/models.ts

export interface Organization {
  id: string;
  name: string;
  taxId: string;
  country: string;
  currency: string;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceSheet {
  id: string;
  organizationId: string;
  name: string;
  periodStart: Date;
  periodEnd: Date;
  fiscalYear: number;
  status: 'draft' | 'final' | 'archived';
  notes?: string;
  items: BalanceSheetItem[];
  totals?: BalanceTotals;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface BalanceSheetItem {
  id: string;
  balanceSheetId: string;
  organizationId: string | null;
  category: 'activo' | 'pasivo' | 'patrimonio';
  subcategory: string;
  accountName: string;
  accountCode?: string;
  amount: number;
  notes?: string;
  orderIndex: number;
}

export interface BalanceTotals {
  totalActivo: number;
  totalActivoCorriente: number;
  totalActivoNoCorriente: number;
  totalPasivo: number;
  totalPasivoCorriente: number;
  totalPasivoNoCorriente: number;
  totalPatrimonio: number;
  isBalanced: boolean; // activo === pasivo + patrimonio
  difference?: number;
}

export interface FinancialIndicators {
  id: string;
  organizationId: string;
  balanceSheetId: string;
  incomeStatementId: string;
  periodStart: Date;
  periodEnd: Date;
  
  // Liquidez
  workingCapital: number;
  currentRatio: number;
  acidTest: number;
  
  // Rentabilidad
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  roe: number; // Return on Equity
  roa: number; // Return on Assets
  
  // Endeudamiento
  debtRatio: number;
  debtToEquity: number;
  financialLeverage: number;
  
  // Eficiencia
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesDays: number;
  payablesDays: number;
  
  // Otros
  ebitda: number;
  breakEvenPoint: number;
  
  // Análisis
  healthScore: number; // 0-100
  riskLevel: 'bajo' | 'medio' | 'alto' | 'critico';
  
  calculatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  organizations: OrganizationMembership[];
}

export interface OrganizationMembership {
  organizationId: string;
  organization: Organization;
  role: 'owner' | 'admin' | 'analyst' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
}

// Cost Analysis Models
export interface CostBreakdownItem {
  name: string;
  amount: number;
}

export interface CostAnalysis {
  id: string;
  organizationId: string | null;
  productName: string;
  productDescription?: string;

  // Pricing
  unitPrice: number;

  // Variable Costs
  variableCostPerUnit: number;
  variableCostBreakdown: CostBreakdownItem[];

  // Fixed Costs
  monthlyFixedCosts: number;
  fixedCostBreakdown: CostBreakdownItem[];

  // Production/Sales Data
  currentMonthlyUnits: number;
  productionCapacity?: number;

  // Metadata
  fiscalYear: number;
  periodStart: Date;
  periodEnd: Date;
  status: 'draft' | 'final';
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CostAnalysisCalculations {
  // Contribution Margin
  contributionMarginPerUnit: number;
  contributionMarginRatio: number;
  totalContributionMargin: number;

  // Break-even Analysis
  breakEvenUnits: number;
  breakEvenRevenue: number;
  marginOfSafety: number;
  marginOfSafetyPercentage: number;

  // Profitability
  currentMonthlyProfit: number;
  currentMonthlyRevenue: number;
  currentMonthlyTotalCosts: number;
  operatingLeverage: number;

  // Capacity Analysis
  capacityUtilization?: number;
  maxPotentialProfit?: number;
}

// Investment Module Types
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';
export type InvestmentType = 'cdt' | 'bonos' | 'acciones' | 'fondos' | 'fiducias';

export interface InvestmentProduct {
  id: string;
  name: string;
  type: InvestmentType;
  institution: string;
  minAmount: number;
  expectedReturn3Months: number; // Tasa anual
  expectedReturn6Months: number;
  expectedReturn12Months: number;
  riskLevel: RiskProfile;
  liquidity: 'alta' | 'media' | 'baja';
  description: string;
  features: string[];
  lastUpdated: Date;
}

export interface InvestmentSimulation {
  id: string;
  organizationId: string;
  name: string;
  initialAmount: number;
  sourceType: 'cashflow' | 'manual';
  cashFlowId?: string;
  riskProfile: RiskProfile;
  selectedProducts: InvestmentAllocation[];
  diversificationStrategy?: 'equal' | 'risk-weighted' | 'return-optimized';
  projections: {
    threeMonths: InvestmentProjection;
    sixMonths: InvestmentProjection;
    twelveMonths: InvestmentProjection;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface InvestmentAllocation {
  productId: string;
  productName: string;
  percentage: number;
  amount: number;
  expectedReturn: number;
}

export interface InvestmentProjection {
  period: string;
  totalInvested: number;
  expectedReturn: number;
  totalAmount: number;
  earnings: number;
  effectiveRate: number;
}
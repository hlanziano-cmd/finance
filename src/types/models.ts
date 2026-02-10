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


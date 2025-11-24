// src/types/database.types.ts
// Este archivo se genera automáticamente con: supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          legal_name: string | null
          tax_id: string
          country: string
          currency: string
          industry: string | null
          size: string | null
          settings: Json
          fiscal_year_start: number
          subscription_plan: string
          subscription_status: string
          subscription_expires_at: string | null
          logo_url: string | null
          website: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          legal_name?: string | null
          tax_id: string
          country?: string
          currency?: string
          industry?: string | null
          size?: string | null
          settings?: Json
          fiscal_year_start?: number
          subscription_plan?: string
          subscription_status?: string
          subscription_expires_at?: string | null
          logo_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          legal_name?: string | null
          tax_id?: string
          country?: string
          currency?: string
          industry?: string | null
          size?: string | null
          settings?: Json
          fiscal_year_start?: number
          subscription_plan?: string
          subscription_status?: string
          subscription_expires_at?: string | null
          logo_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_active?: boolean
        }
      }
      balance_sheets: {
        Row: {
          id: string
          organization_id: string
          name: string
          period_start: string
          period_end: string
          fiscal_year: number
          status: string
          version: number
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          period_start: string
          period_end: string
          fiscal_year: number
          status?: string
          version?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          period_start?: string
          period_end?: string
          fiscal_year?: number
          status?: string
          version?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      balance_sheet_items: {
        Row: {
          id: string
          balance_sheet_id: string
          organization_id: string
          category: string
          subcategory: string
          account_name: string
          account_code: string | null
          amount: number
          notes: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          balance_sheet_id: string
          organization_id: string
          category: string
          subcategory: string
          account_name: string
          account_code?: string | null
          amount?: number
          notes?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          balance_sheet_id?: string
          organization_id?: string
          category?: string
          subcategory?: string
          account_name?: string
          account_code?: string | null
          amount?: number
          notes?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      cost_analysis: {
        Row: {
          id: string
          organization_id: string | null
          product_name: string
          product_description: string | null
          unit_price: number
          variable_cost_per_unit: number
          variable_cost_breakdown: Json
          monthly_fixed_costs: number
          fixed_cost_breakdown: Json
          current_monthly_units: number
          production_capacity: number | null
          fiscal_year: number
          period_start: string
          period_end: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          product_name: string
          product_description?: string | null
          unit_price: number
          variable_cost_per_unit?: number
          variable_cost_breakdown?: Json
          monthly_fixed_costs?: number
          fixed_cost_breakdown?: Json
          current_monthly_units?: number
          production_capacity?: number | null
          fiscal_year: number
          period_start: string
          period_end: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          product_name?: string
          product_description?: string | null
          unit_price?: number
          variable_cost_per_unit?: number
          variable_cost_breakdown?: Json
          monthly_fixed_costs?: number
          fixed_cost_breakdown?: Json
          current_monthly_units?: number
          production_capacity?: number | null
          fiscal_year?: number
          period_start?: string
          period_end?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          updated_by?: string | null
        }
      }
      // ... más tablas
    }
    Views: {
      v_organization_financial_summary: {
        Row: {
          organization_id: string
          organization_name: string
          last_balance_date: string | null
          last_income_date: string | null
          health_score: number | null
          risk_level: string | null
          current_ratio: number | null
          net_margin: number | null
          roe: number | null
          balance_sheets_count: number
          income_statements_count: number
          cash_flows_count: number
        }
      }
    }
    Functions: {
      calculate_balance_totals: {
        Args: {
          p_balance_sheet_id: string
        }
        Returns: {
          total_activo: number
          total_activo_corriente: number
          total_activo_no_corriente: number
          total_pasivo: number
          total_pasivo_corriente: number
          total_pasivo_no_corriente: number
          total_patrimonio: number
        }[]
      }
      calculate_financial_indicators: {
        Args: {
          p_organization_id: string
          p_balance_sheet_id: string
          p_income_statement_id: string
        }
        Returns: string
      }
    }
    Enums: {
      organization_role: 'owner' | 'admin' | 'analyst' | 'viewer'
      organization_status: 'active' | 'inactive' | 'pending'
      document_status: 'draft' | 'final' | 'archived'
      subscription_plan: 'free' | 'pro' | 'enterprise'
    }
  }
}
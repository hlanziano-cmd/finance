// src/services/indicator-analysis.service.ts
import { SupabaseClient } from '@supabase/supabase-js';

export interface IndicatorAnalysis {
  id: string;
  name: string;
  balance_sheet_id: string;
  income_statement_id: string;
  cash_flow_id: string | null;
  fiscal_year: number;
  score: number;
  analysis_text: string;
  indicators: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIndicatorAnalysisInput {
  name: string;
  balance_sheet_id: string;
  income_statement_id: string;
  cash_flow_id?: string | null;
  fiscal_year: number;
  score: number;
  analysis_text: string;
  indicators: Record<string, any>;
}

export interface IndicatorAnalysisFilters {
  fiscal_year?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class IndicatorAnalysisService {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateIndicatorAnalysisInput): Promise<IndicatorAnalysis> {
    const { data: { user } } = await this.supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await this.supabase
      .from('indicator_analyses')
      .insert({
        name: input.name,
        balance_sheet_id: input.balance_sheet_id,
        income_statement_id: input.income_statement_id,
        cash_flow_id: input.cash_flow_id || null,
        fiscal_year: input.fiscal_year,
        score: input.score,
        analysis_text: input.analysis_text,
        indicators: input.indicators,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating indicator analysis:', error);
      throw new Error(`Error al crear análisis de indicadores: ${error.message}`);
    }

    return data;
  }

  async list(filters?: IndicatorAnalysisFilters): Promise<PaginatedResponse<IndicatorAnalysis>> {
    let query = this.supabase
      .from('indicator_analyses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.fiscal_year) {
      query = query.eq('fiscal_year', filters.fiscal_year);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing indicator analyses:', error);
      throw new Error(`Error al listar análisis de indicadores: ${error.message}`);
    }

    return {
      data: data || [],
      pagination: {
        page: 1,
        limit: 100,
        total: count || 0,
        totalPages: 1,
      },
    };
  }

  async getById(id: string): Promise<IndicatorAnalysis> {
    const { data, error } = await this.supabase
      .from('indicator_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting indicator analysis:', error);
      throw new Error(`Error al obtener análisis de indicadores: ${error.message}`);
    }

    if (!data) {
      throw new Error('Análisis de indicadores no encontrado');
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('indicator_analyses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting indicator analysis:', error);
      throw new Error(`Error al eliminar análisis de indicadores: ${error.message}`);
    }
  }

  async update(id: string, input: Partial<CreateIndicatorAnalysisInput>): Promise<IndicatorAnalysis> {
    const { data, error } = await this.supabase
      .from('indicator_analyses')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating indicator analysis:', error);
      throw new Error(`Error al actualizar análisis de indicadores: ${error.message}`);
    }

    return data;
  }
}

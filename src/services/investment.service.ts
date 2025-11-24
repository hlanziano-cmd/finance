// src/services/investment.service.ts
import type { TypedSupabaseClient } from '@/src/lib/supabase/client';
import type {
  InvestmentProduct,
  InvestmentSimulation,
  InvestmentAllocation,
  InvestmentProjection,
  RiskProfile
} from '@/src/types/models';

export class InvestmentService {
  constructor(private supabase: TypedSupabaseClient) {}

  // Productos de inversión del mercado colombiano (Enero 2025)
  private getInvestmentProducts(): InvestmentProduct[] {
    return [
      // CDTs - Conservador
      {
        id: 'cdt-bancolombia-1',
        name: 'CDT Bancolombia 90 días',
        type: 'cdt',
        institution: 'Bancolombia',
        minAmount: 1000000,
        expectedReturn3Months: 12.5,
        expectedReturn6Months: 13.0,
        expectedReturn12Months: 13.5,
        riskLevel: 'conservative',
        liquidity: 'baja',
        description: 'Certificado de Depósito a Término con tasa fija garantizada',
        features: [
          'Tasa fija garantizada',
          'Respaldo Fogafín hasta $50 millones',
          'Renovación automática',
          'Sin comisiones'
        ],
        lastUpdated: new Date('2025-01-24')
      },
      {
        id: 'cdt-davivienda-1',
        name: 'CDT Davivienda 180 días',
        type: 'cdt',
        institution: 'Davivienda',
        minAmount: 500000,
        expectedReturn3Months: 12.0,
        expectedReturn6Months: 13.2,
        expectedReturn12Months: 13.8,
        riskLevel: 'conservative',
        liquidity: 'baja',
        description: 'CDT con tasas competitivas y respaldo bancario',
        features: [
          'Desde $500.000',
          'Cobertura Fogafín',
          'Tasa preferencial para clientes',
          'Intereses pagados al vencimiento'
        ],
        lastUpdated: new Date('2025-01-24')
      },

      // Bonos - Conservador/Moderado
      {
        id: 'bonos-gobierno-1',
        name: 'TES Tasa Fija 2026',
        type: 'bonos',
        institution: 'Gobierno de Colombia',
        minAmount: 5000000,
        expectedReturn3Months: 10.5,
        expectedReturn6Months: 11.0,
        expectedReturn12Months: 11.5,
        riskLevel: 'conservative',
        liquidity: 'media',
        description: 'Títulos de deuda pública con tasa fija',
        features: [
          'Respaldo del Gobierno Nacional',
          'Mercado secundario líquido',
          'Exención tributaria para personas naturales',
          'Pago de cupón semestral'
        ],
        lastUpdated: new Date('2025-01-24')
      },
      {
        id: 'bonos-corporativos-1',
        name: 'Bonos Éxito Serie B',
        type: 'bonos',
        institution: 'Grupo Éxito',
        minAmount: 10000000,
        expectedReturn3Months: 12.0,
        expectedReturn6Months: 12.8,
        expectedReturn12Months: 13.5,
        riskLevel: 'moderate',
        liquidity: 'media',
        description: 'Bonos corporativos de emisor de alta calidad',
        features: [
          'Calificación AAA',
          'Mayor rentabilidad que TES',
          'Cupón trimestral',
          'Liquidez en mercado secundario'
        ],
        lastUpdated: new Date('2025-01-24')
      },

      // Fondos de Inversión - Moderado
      {
        id: 'fondo-btg-1',
        name: 'BTG Pactual Renta Fija Plus',
        type: 'fondos',
        institution: 'BTG Pactual',
        minAmount: 2000000,
        expectedReturn3Months: 11.5,
        expectedReturn6Months: 12.0,
        expectedReturn12Months: 12.8,
        riskLevel: 'moderate',
        liquidity: 'alta',
        description: 'Fondo de renta fija con gestión activa',
        features: [
          'Gestión profesional',
          'Diversificación automática',
          'Liquidez diaria',
          'Comisión de administración 1.5% anual'
        ],
        lastUpdated: new Date('2025-01-24')
      },
      {
        id: 'fondo-credicorp-1',
        name: 'Credicorp Capital Balanceado',
        type: 'fondos',
        institution: 'Credicorp Capital',
        minAmount: 3000000,
        expectedReturn3Months: 13.0,
        expectedReturn6Months: 14.5,
        expectedReturn12Months: 16.0,
        riskLevel: 'moderate',
        liquidity: 'alta',
        description: 'Fondo balanceado 60% renta fija, 40% renta variable',
        features: [
          'Diversificación renta fija y variable',
          'Gestión activa de riesgos',
          'Retiros en T+1',
          'Ideal para diversificación'
        ],
        lastUpdated: new Date('2025-01-24')
      },

      // Acciones - Agresivo
      {
        id: 'acciones-ecopetrol-1',
        name: 'Acciones Ecopetrol',
        type: 'acciones',
        institution: 'Bolsa de Valores de Colombia',
        minAmount: 1000000,
        expectedReturn3Months: 5.0,
        expectedReturn6Months: 8.0,
        expectedReturn12Months: 18.0,
        riskLevel: 'aggressive',
        liquidity: 'alta',
        description: 'Acciones de la principal petrolera de Colombia',
        features: [
          'Dividendos atractivos (4-5% anual)',
          'Liquidez alta en BVC',
          'Exposición al sector energético',
          'Potencial de valorización'
        ],
        lastUpdated: new Date('2025-01-24')
      },
      {
        id: 'fondo-acciones-1',
        name: 'Skandia Acciones Colombia',
        type: 'fondos',
        institution: 'Skandia',
        minAmount: 5000000,
        expectedReturn3Months: 6.0,
        expectedReturn6Months: 10.0,
        expectedReturn12Months: 20.0,
        riskLevel: 'aggressive',
        liquidity: 'alta',
        description: 'Fondo de acciones colombianas de alta capitalización',
        features: [
          'Exposición 100% renta variable',
          'Portafolio diversificado COLCAP',
          'Gestión profesional',
          'Mayor potencial de rentabilidad'
        ],
        lastUpdated: new Date('2025-01-24')
      },

      // Fiducias - Moderado/Agresivo
      {
        id: 'fiducia-bogota-1',
        name: 'Fiduciaria Bogotá Renta Plus',
        type: 'fiducias',
        institution: 'Fiduciaria Bogotá',
        minAmount: 10000000,
        expectedReturn3Months: 12.5,
        expectedReturn6Months: 13.5,
        expectedReturn12Months: 14.5,
        riskLevel: 'moderate',
        liquidity: 'media',
        description: 'Fideicomiso de inversión en renta fija y alternativa',
        features: [
          'Inversión mínima $10 millones',
          'Portafolio diversificado',
          'Asesoría personalizada',
          'Reinversión de utilidades'
        ],
        lastUpdated: new Date('2025-01-24')
      },
      {
        id: 'fiducia-alianza-1',
        name: 'Alianza Fiduciaria Inmobiliaria',
        type: 'fiducias',
        institution: 'Alianza Fiduciaria',
        minAmount: 20000000,
        expectedReturn3Months: 10.0,
        expectedReturn6Months: 14.0,
        expectedReturn12Months: 22.0,
        riskLevel: 'aggressive',
        liquidity: 'baja',
        description: 'Fideicomiso de inversión en proyectos inmobiliarios',
        features: [
          'Rentabilidad superior a largo plazo',
          'Proyectos inmobiliarios seleccionados',
          'Inversión patrimonial',
          'Menor liquidez pero mayor retorno'
        ],
        lastUpdated: new Date('2025-01-24')
      }
    ];
  }

  // Obtener productos según perfil de riesgo
  getProductsByRiskProfile(riskProfile: RiskProfile, limit = 5): InvestmentProduct[] {
    const allProducts = this.getInvestmentProducts();

    // Filtrar y ordenar por perfil
    let filtered = allProducts.filter(p => p.riskLevel === riskProfile);

    // Si no hay suficientes, agregar del perfil más cercano
    if (filtered.length < limit) {
      const closeProfile = riskProfile === 'conservative' ? 'moderate' :
                          riskProfile === 'aggressive' ? 'moderate' : 'conservative';
      const additional = allProducts
        .filter(p => p.riskLevel === closeProfile)
        .slice(0, limit - filtered.length);
      filtered = [...filtered, ...additional];
    }

    // Ordenar por rentabilidad a 12 meses
    return filtered
      .sort((a, b) => b.expectedReturn12Months - a.expectedReturn12Months)
      .slice(0, limit);
  }

  // Obtener los mejores 5 productos del momento
  getTopProducts(limit = 5): InvestmentProduct[] {
    const products = this.getInvestmentProducts();
    return products
      .sort((a, b) => {
        // Calcular score ponderado: rentabilidad + liquidez + riesgo
        const scoreA = a.expectedReturn12Months * 0.6 +
                      (a.liquidity === 'alta' ? 10 : a.liquidity === 'media' ? 5 : 0) * 0.2 +
                      (a.riskLevel === 'moderate' ? 5 : 0) * 0.2;
        const scoreB = b.expectedReturn12Months * 0.6 +
                      (b.liquidity === 'alta' ? 10 : b.liquidity === 'media' ? 5 : 0) * 0.2 +
                      (b.riskLevel === 'moderate' ? 5 : 0) * 0.2;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Calcular proyecciones de inversión
  calculateProjections(
    amount: number,
    product: InvestmentProduct
  ): {
    threeMonths: InvestmentProjection;
    sixMonths: InvestmentProjection;
    twelveMonths: InvestmentProjection;
  } {
    const calculate = (months: number, annualRate: number): InvestmentProjection => {
      const monthlyRate = annualRate / 100 / 12;
      const earnings = amount * monthlyRate * months;
      const totalAmount = amount + earnings;
      const effectiveRate = (earnings / amount) * 100;

      return {
        period: `${months} meses`,
        totalInvested: amount,
        expectedReturn: annualRate,
        totalAmount,
        earnings,
        effectiveRate
      };
    };

    return {
      threeMonths: calculate(3, product.expectedReturn3Months),
      sixMonths: calculate(6, product.expectedReturn6Months),
      twelveMonths: calculate(12, product.expectedReturn12Months)
    };
  }

  // Modelo de diversificación
  createDiversifiedPortfolio(
    amount: number,
    riskProfile: RiskProfile,
    strategy: 'equal' | 'risk-weighted' | 'return-optimized' = 'risk-weighted'
  ): InvestmentAllocation[] {
    const products = this.getProductsByRiskProfile(riskProfile, 5);

    if (strategy === 'equal') {
      // Distribución igual
      const percentage = 100 / products.length;
      return products.map(p => ({
        productId: p.id,
        productName: p.name,
        percentage: Number(percentage.toFixed(2)),
        amount: Number((amount * percentage / 100).toFixed(2)),
        expectedReturn: p.expectedReturn12Months
      }));
    }

    if (strategy === 'return-optimized') {
      // Optimizar por rentabilidad (más peso a mayor retorno)
      const totalReturn = products.reduce((sum, p) => sum + p.expectedReturn12Months, 0);
      return products.map(p => {
        const percentage = (p.expectedReturn12Months / totalReturn) * 100;
        return {
          productId: p.id,
          productName: p.name,
          percentage: Number(percentage.toFixed(2)),
          amount: Number((amount * percentage / 100).toFixed(2)),
          expectedReturn: p.expectedReturn12Months
        };
      });
    }

    // risk-weighted: Balance entre rentabilidad y riesgo
    const weights = {
      conservative: 3,
      moderate: 2,
      aggressive: 1
    };

    const totalWeight = products.reduce((sum, p) => {
      const riskWeight = weights[p.riskLevel] || 2;
      return sum + (p.expectedReturn12Months / riskWeight);
    }, 0);

    return products.map(p => {
      const riskWeight = weights[p.riskLevel] || 2;
      const percentage = ((p.expectedReturn12Months / riskWeight) / totalWeight) * 100;
      return {
        productId: p.id,
        productName: p.name,
        percentage: Number(percentage.toFixed(2)),
        amount: Number((amount * percentage / 100).toFixed(2)),
        expectedReturn: p.expectedReturn12Months
      };
    });
  }

  // CRUD Operations
  async list() {
    const { data, error } = await this.supabase
      .from('investment_simulations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('investment_simulations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(simulation: Omit<InvestmentSimulation, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('investment_simulations')
      .insert({
        organization_id: simulation.organizationId,
        name: simulation.name,
        initial_amount: simulation.initialAmount,
        source_type: simulation.sourceType,
        cash_flow_id: simulation.cashFlowId,
        risk_profile: simulation.riskProfile,
        selected_products: simulation.selectedProducts,
        diversification_strategy: simulation.diversificationStrategy,
        projections: simulation.projections,
        notes: simulation.notes,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<InvestmentSimulation>) {
    const { data, error } = await this.supabase
      .from('investment_simulations')
      .update({
        name: updates.name,
        initial_amount: updates.initialAmount,
        risk_profile: updates.riskProfile,
        selected_products: updates.selectedProducts,
        diversification_strategy: updates.diversificationStrategy,
        projections: updates.projections,
        notes: updates.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('investment_simulations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

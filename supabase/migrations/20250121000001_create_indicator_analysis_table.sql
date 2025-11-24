-- Migración: Crear tabla para guardar análisis de indicadores
BEGIN;

-- Tabla para almacenar análisis de indicadores guardados
CREATE TABLE IF NOT EXISTS indicator_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,

    -- Referencias a los documentos utilizados
    balance_sheet_id UUID NOT NULL,
    income_statement_id UUID NOT NULL,
    cash_flow_id UUID,

    fiscal_year INTEGER NOT NULL,

    -- Score y análisis
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    analysis_text TEXT NOT NULL,

    -- Indicadores calculados (almacenados como JSONB para flexibilidad)
    indicators JSONB NOT NULL,

    -- Metadatos
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Índices
    CONSTRAINT unique_analysis_name_per_user UNIQUE(created_by, name)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_indicator_analyses_user ON indicator_analyses(created_by);
CREATE INDEX idx_indicator_analyses_fiscal_year ON indicator_analyses(fiscal_year);
CREATE INDEX idx_indicator_analyses_created_at ON indicator_analyses(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE indicator_analyses ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios análisis
CREATE POLICY "Users can view their own indicator analyses"
    ON indicator_analyses FOR SELECT
    USING (auth.uid() = created_by);

-- Política: Los usuarios pueden crear sus propios análisis
CREATE POLICY "Users can create their own indicator analyses"
    ON indicator_analyses FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Política: Los usuarios pueden actualizar sus propios análisis
CREATE POLICY "Users can update their own indicator analyses"
    ON indicator_analyses FOR UPDATE
    USING (auth.uid() = created_by);

-- Política: Los usuarios pueden eliminar sus propios análisis
CREATE POLICY "Users can delete their own indicator analyses"
    ON indicator_analyses FOR DELETE
    USING (auth.uid() = created_by);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_indicator_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_indicator_analyses_updated_at
    BEFORE UPDATE ON indicator_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_indicator_analyses_updated_at();

COMMIT;

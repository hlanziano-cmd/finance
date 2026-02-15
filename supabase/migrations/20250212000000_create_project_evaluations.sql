-- =====================================================
-- MIGRACIÓN: Crear tabla para Evaluación de Proyectos
-- =====================================================

BEGIN;

CREATE TABLE project_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    period_type TEXT NOT NULL CHECK (period_type IN ('months', 'years')),
    start_month INTEGER CHECK (start_month BETWEEN 1 AND 12),
    start_year INTEGER NOT NULL CHECK (start_year BETWEEN 2000 AND 2100),
    num_periods INTEGER NOT NULL DEFAULT 12 CHECK (num_periods BETWEEN 1 AND 120),
    items JSONB NOT NULL DEFAULT '{"incomes":[],"expenses":[]}',
    loans JSONB NOT NULL DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_evaluations_created_by ON project_evaluations(created_by);

-- Trigger para updated_at
CREATE TRIGGER update_project_evaluations_updated_at
    BEFORE UPDATE ON project_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE project_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project evaluations"
ON project_evaluations FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own project evaluations"
ON project_evaluations FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own project evaluations"
ON project_evaluations FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own project evaluations"
ON project_evaluations FOR DELETE
USING (created_by = auth.uid());

COMMENT ON TABLE project_evaluations IS 'Evaluaciones de proyectos con presupuesto por periodos';

COMMIT;

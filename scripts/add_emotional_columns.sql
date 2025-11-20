-- Add missing emotional columns to dim_estado_emocional

ALTER TABLE dim_estado_emocional
ADD COLUMN IF NOT EXISTS energia INTEGER,
ADD COLUMN IF NOT EXISTS motivacion INTEGER,
ADD COLUMN IF NOT EXISTS enfoque INTEGER;

COMMENT ON COLUMN dim_estado_emocional.energia IS 'Nivel de energía (1-5)';
COMMENT ON COLUMN dim_estado_emocional.motivacion IS 'Nivel de motivación (1-5)';
COMMENT ON COLUMN dim_estado_emocional.enfoque IS 'Nivel de enfoque (1-5)';

-- =====================================================
-- LIFE OS - COMPLETE DATABASE SCHEMA
-- Ajustado para Frontend con Sliders 1-5
-- =====================================================

-- =====================================================
-- 1. ACTUALIZAR CONSTRAINT DE dim_espiritual
-- =====================================================
ALTER TABLE dim_espiritual 
DROP CONSTRAINT IF EXISTS dim_espiritual_practica_check;

ALTER TABLE dim_espiritual
ADD CONSTRAINT dim_espiritual_practica_check 
CHECK (practica = ANY (ARRAY[
  'Lectura'::text, 
  'Oracion'::text, 
  'Devocional'::text, 
  'Reflexion'::text,
  'Oración matutina'::text,
  'Lectura bíblica'::text,
  'Reflexión nocturna'::text,
  'Meditación'::text,
  'Ayuno'::text,
  'Alabanza'::text
]));

-- =====================================================
-- 2. ACTUALIZAR CONSTRAINTS DE dim_tentacion
-- =====================================================

-- Eliminar constraints antiguos
ALTER TABLE dim_tentacion 
DROP CONSTRAINT IF EXISTS dim_tentacion_nivel_riesgo_check;

-- Nivel de riesgo: 1-5 (slider frontend)
ALTER TABLE dim_tentacion
ADD CONSTRAINT dim_tentacion_nivel_riesgo_check 
CHECK (nivel_riesgo >= 1 AND nivel_riesgo <= 5);

-- Agregar columna gano_tentacion si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dim_tentacion' 
    AND column_name = 'gano_tentacion'
  ) THEN
    ALTER TABLE dim_tentacion 
    ADD COLUMN gano_tentacion BOOLEAN DEFAULT NULL;
  END IF;
END $$;

-- =====================================================
-- 3. ACTUALIZAR CONSTRAINTS DE dim_estado_emocional
-- =====================================================

-- Todos los estados emocionales: 1-5
DO $$ 
DECLARE
  col TEXT;
BEGIN
  FOR col IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'dim_estado_emocional' 
    AND data_type = 'integer'
    AND column_name IN ('ansiedad', 'tranquilidad', 'motivacion', 'enfoque', 'animo', 'ira', 'tristeza', 'euforia')
  LOOP
    EXECUTE format('ALTER TABLE dim_estado_emocional DROP CONSTRAINT IF EXISTS dim_estado_emocional_%I_check', col);
    EXECUTE format('ALTER TABLE dim_estado_emocional ADD CONSTRAINT dim_estado_emocional_%I_check CHECK (%I >= 1 AND %I <= 5)', col, col, col);
  END LOOP;
END $$;

-- =====================================================
-- 4. ACTUALIZAR CONSTRAINTS DE dim_ejercicio
-- =====================================================

-- Intensidad (RPE): 1-5
ALTER TABLE dim_ejercicio 
DROP CONSTRAINT IF EXISTS dim_ejercicio_intensidad_check;

ALTER TABLE dim_ejercicio
ADD CONSTRAINT dim_ejercicio_intensidad_check 
CHECK (intensidad >= 1 AND intensidad <= 5);

-- =====================================================
-- 5. ACTUALIZAR CONSTRAINTS DE dim_estudio
-- =====================================================

-- Profundidad: 1-5
ALTER TABLE dim_estudio 
DROP CONSTRAINT IF EXISTS dim_estudio_profundidad_check;

ALTER TABLE dim_estudio
ADD CONSTRAINT dim_estudio_profundidad_check 
CHECK (profundidad >= 1 AND profundidad <= 5);

-- =====================================================
-- 6. ACTUALIZAR CONSTRAINTS DE dim_ambiente
-- =====================================================

-- Todos los campos de orden: 1-5
DO $$ 
DECLARE
  col TEXT;
BEGIN
  FOR col IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'dim_ambiente' 
    AND data_type = 'integer'
    AND column_name IN ('orden_cuarto', 'orden_escritorio', 'orden_mochila', 'ruido_ambiental', 'limpieza_personal')
  LOOP
    EXECUTE format('ALTER TABLE dim_ambiente DROP CONSTRAINT IF EXISTS dim_ambiente_%I_check', col);
    EXECUTE format('ALTER TABLE dim_ambiente ADD CONSTRAINT dim_ambiente_%I_check CHECK (%I >= 1 AND %I <= 5)', col, col, col);
  END LOOP;
END $$;

-- =====================================================
-- 7. ACTUALIZAR CONSTRAINTS DE fact_habitos_diarios
-- =====================================================

-- Calidad de sueño: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_calidad_sueno_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_calidad_sueno_check 
CHECK (calidad_sueno >= 1 AND calidad_sueno <= 5);

-- Energía diaria: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_energia_diaria_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_energia_diaria_check 
CHECK (energia_diaria >= 1 AND energia_diaria <= 5);

-- Estrés: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_estres_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_estres_check 
CHECK (estres >= 1 AND estres <= 5);

-- Ansiedad: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_ansiedad_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_ansiedad_check 
CHECK (ansiedad >= 1 AND ansiedad <= 5);

-- Enfoque: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_enfoque_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_enfoque_check 
CHECK (enfoque >= 1 AND enfoque <= 5);

-- Claridad mental: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_claridad_mental_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_claridad_mental_check 
CHECK (claridad_mental >= 1 AND claridad_mental <= 5);

-- Motivación: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_motivacion_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_motivacion_check 
CHECK (motivacion >= 1 AND motivacion <= 5);

-- Estabilidad emocional: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_estabilidad_emocional_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_estabilidad_emocional_check 
CHECK (estabilidad_emocional >= 1 AND estabilidad_emocional <= 5);

-- Identidad del día: 1-5
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_identidad_dia_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_identidad_dia_check 
CHECK (identidad_dia >= 1 AND identidad_dia <= 5);

-- Scores de rutina: 0-100 (porcentaje)
ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_rutina_manana_score_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_rutina_manana_score_check 
CHECK (rutina_manana_score >= 0 AND rutina_manana_score <= 100);

ALTER TABLE fact_habitos_diarios 
DROP CONSTRAINT IF EXISTS fact_habitos_diarios_rutina_noche_score_check;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT fact_habitos_diarios_rutina_noche_score_check 
CHECK (rutina_noche_score >= 0 AND rutina_noche_score <= 100);

-- =====================================================
-- 8. CREAR TABLA journal_entries
-- =====================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  title TEXT,
  entry TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para journal_entries
CREATE INDEX IF NOT EXISTS idx_journal_user_date 
ON journal_entries(user_id, date_key DESC);

CREATE INDEX IF NOT EXISTS idx_journal_created 
ON journal_entries(created_at DESC);

-- RLS para journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;
CREATE POLICY "Users can view own entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own entries" ON journal_entries;
CREATE POLICY "Users can insert own entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;
CREATE POLICY "Users can update own entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;
CREATE POLICY "Users can delete own entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at 
  BEFORE UPDATE ON journal_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ÍNDICES ADICIONALES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_fact_user_date 
ON fact_habitos_diarios(user_id, date_key DESC);

CREATE INDEX IF NOT EXISTS idx_dim_rutina_user_tipo 
ON dim_rutina(user_id, tipo_rutina, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dim_espiritual_user 
ON dim_espiritual(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dim_ejercicio_user 
ON dim_ejercicio(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dim_tentacion_user 
ON dim_tentacion(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dim_tentacion_pecado 
ON dim_tentacion(pecado_principal, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dim_estudio_user 
ON dim_estudio(user_id, created_at DESC);

-- =====================================================
-- 10. FUNCIÓN HELPER: Get or Create Fact
-- =====================================================
CREATE OR REPLACE FUNCTION get_or_create_fact(
  p_user_id UUID,
  p_date_key DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fact_id UUID;
BEGIN
  -- Buscar fact existente
  SELECT fact_id INTO v_fact_id
  FROM fact_habitos_diarios
  WHERE user_id = p_user_id AND date_key = p_date_key;
  
  -- Si no existe, crear uno nuevo
  IF v_fact_id IS NULL THEN
    INSERT INTO fact_habitos_diarios (user_id, date_key)
    VALUES (p_user_id, p_date_key)
    RETURNING fact_id INTO v_fact_id;
  END IF;
  
  RETURN v_fact_id;
END;
$$;

-- =====================================================
-- 11. VISTA: Dashboard Today
-- =====================================================
CREATE OR REPLACE VIEW v_dashboard_today AS
SELECT 
  f.user_id,
  f.date_key,
  f.sueno_horas,
  f.calidad_sueno,
  f.energia_diaria,
  f.ansiedad,
  f.enfoque,
  f.estres,
  f.identidad_dia,
  f.rutina_manana_score,
  f.rutina_noche_score,
  
  -- Booleans
  CASE WHEN f.ejercicio_key IS NOT NULL THEN true ELSE false END as ejercicio_realizado,
  CASE WHEN f.estudio_key IS NOT NULL THEN true ELSE false END as estudio_realizado,
  CASE WHEN f.tentacion_key IS NOT NULL THEN true ELSE false END as tentacion_registrada,
  CASE WHEN f.espiritualidad_key IS NOT NULL THEN true ELSE false END as oracion_realizada,
  
  -- Interacciones
  f.interacciones_pos,
  f.interacciones_neg,
  f.notas_dia
  
FROM fact_habitos_diarios f
WHERE f.date_key = CURRENT_DATE;

-- Permisos
GRANT SELECT ON v_dashboard_today TO authenticated;
ALTER VIEW v_dashboard_today SET (security_invoker = true);

-- =====================================================
-- 12. VERIFICACIÓN FINAL
-- =====================================================
SELECT 
  'Constraints actualizados' as status,
  COUNT(*) as total
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid IN (
    'dim_tentacion'::regclass,
    'dim_estado_emocional'::regclass,
    'dim_ejercicio'::regclass,
    'dim_estudio'::regclass,
    'dim_ambiente'::regclass,
    'fact_habitos_diarios'::regclass
  );

-- =====================================================
-- ✅ SCRIPT COMPLETADO
-- Todos los sliders ahora funcionan en escala 1-5
-- =====================================================


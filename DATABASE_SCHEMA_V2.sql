-- =====================================================
-- LIFE OS - DATABASE SCHEMA V2
-- Critical Temporal & Context Improvements
-- =====================================================

-- =====================================================
-- PARTE 1: AGREGAR MOMENTO_DIA A DIMENSIONES
-- =====================================================

-- 1.1 dim_estado_emocional - Para distinguir mañana vs tarde
ALTER TABLE dim_estado_emocional 
ADD COLUMN IF NOT EXISTS momento_dia VARCHAR(20);

ALTER TABLE dim_estado_emocional
DROP CONSTRAINT IF EXISTS dim_estado_emocional_momento_check;

ALTER TABLE dim_estado_emocional
ADD CONSTRAINT dim_estado_emocional_momento_check 
CHECK (momento_dia IN ('Manana', 'Tarde', 'Noche', 'Madrugada', NULL));

CREATE INDEX IF NOT EXISTS idx_estado_emocional_momento 
ON dim_estado_emocional(user_id, momento_dia, created_at DESC);

-- 1.2 dim_tentacion - Para identificar horas de riesgo
ALTER TABLE dim_tentacion 
ADD COLUMN IF NOT EXISTS momento_dia VARCHAR(20),
ADD COLUMN IF NOT EXISTS hora_aproximada TIME,
ADD COLUMN IF NOT EXISTS fuente_registro VARCHAR(30);

ALTER TABLE dim_tentacion
DROP CONSTRAINT IF EXISTS dim_tentacion_momento_check;

ALTER TABLE dim_tentacion
ADD CONSTRAINT dim_tentacion_momento_check 
CHECK (momento_dia IN ('Manana', 'Tarde', 'Noche', 'Madrugada', NULL));

ALTER TABLE dim_tentacion
DROP CONSTRAINT IF EXISTS dim_tentacion_fuente_check;

ALTER TABLE dim_tentacion
ADD CONSTRAINT dim_tentacion_fuente_check 
CHECK (fuente_registro IN ('Tarde', 'Registro_Individual', NULL));

CREATE INDEX IF NOT EXISTS idx_tentacion_momento 
ON dim_tentacion(user_id, momento_dia, created_at DESC);

-- 1.3 dim_espiritual - Para tracking de prácticas por momento
ALTER TABLE dim_espiritual 
ADD COLUMN IF NOT EXISTS momento_dia VARCHAR(20);

ALTER TABLE dim_espiritual
DROP CONSTRAINT IF EXISTS dim_espiritual_momento_check;

ALTER TABLE dim_espiritual
ADD CONSTRAINT dim_espiritual_momento_check 
CHECK (momento_dia IN ('Manana', 'Tarde', 'Noche', 'Madrugada', NULL));

-- 1.4 dim_estudio - Para saber cuándo estudias más
ALTER TABLE dim_estudio 
ADD COLUMN IF NOT EXISTS momento_dia VARCHAR(20);

ALTER TABLE dim_estudio
DROP CONSTRAINT IF EXISTS dim_estudio_momento_check;

ALTER TABLE dim_estudio
ADD CONSTRAINT dim_estudio_momento_check 
CHECK (momento_dia IN ('Manana', 'Tarde', 'Noche', 'Madrugada', NULL));

-- 1.5 dim_interacciones - Para análisis de interacciones por horario
ALTER TABLE dim_interacciones 
ADD COLUMN IF NOT EXISTS momento_dia VARCHAR(20),
ADD COLUMN IF NOT EXISTS hora_inicio TIME;

ALTER TABLE dim_interacciones
DROP CONSTRAINT IF EXISTS dim_interacciones_momento_check;

ALTER TABLE dim_interacciones
ADD CONSTRAINT dim_interacciones_momento_check 
CHECK (momento_dia IN ('Manana', 'Tarde', 'Noche', 'Madrugada', NULL));

-- =====================================================
-- PARTE 2: CREAR TABLA EJERCICIO PLANEADO
-- =====================================================

CREATE TABLE IF NOT EXISTS dim_ejercicio_planeado (
  plan_key UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  tipo TEXT NOT NULL,
  grupo_muscular TEXT,
  distancia_km_planeada NUMERIC,
  duracion_estimada_min INTEGER,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para ejercicio_planeado
CREATE INDEX IF NOT EXISTS idx_ejercicio_planeado_user_date 
ON dim_ejercicio_planeado(user_id, date_key DESC);

-- RLS para ejercicio_planeado
ALTER TABLE dim_ejercicio_planeado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plans" ON dim_ejercicio_planeado;
CREATE POLICY "Users can view own plans" ON dim_ejercicio_planeado
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plans" ON dim_ejercicio_planeado;
CREATE POLICY "Users can insert own plans" ON dim_ejercicio_planeado
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON dim_ejercicio_planeado;
CREATE POLICY "Users can update own plans" ON dim_ejercicio_planeado
  FOR UPDATE USING (auth.uid() = user_id);

-- Agregar link en dim_ejercicio para conectar plan con ejecución
ALTER TABLE dim_ejercicio 
ADD COLUMN IF NOT EXISTS ejercicio_plan_key UUID REFERENCES dim_ejercicio_planeado(plan_key);

CREATE INDEX IF NOT EXISTS idx_ejercicio_plan_link 
ON dim_ejercicio(ejercicio_plan_key);

-- =====================================================
-- PARTE 3: MÚLTIPLES SNAPSHOTS EMOCIONALES EN FACT
-- =====================================================

ALTER TABLE fact_habitos_diarios
ADD COLUMN IF NOT EXISTS estado_emocional_manana_key UUID REFERENCES dim_estado_emocional(estado_emocional_key),
ADD COLUMN IF NOT EXISTS estado_emocional_tarde_key UUID REFERENCES dim_estado_emocional(estado_emocional_key);

-- estado_emocional_key existente se mantiene para última actualización

CREATE INDEX IF NOT EXISTS idx_fact_estado_manana 
ON fact_habitos_diarios(estado_emocional_manana_key);

CREATE INDEX IF NOT EXISTS idx_fact_estado_tarde 
ON fact_habitos_diarios(estado_emocional_tarde_key);

-- =====================================================
-- PARTE 4: TIMESTAMPS DE REGISTRO EN FACT
-- =====================================================

ALTER TABLE fact_habitos_diarios
ADD COLUMN IF NOT EXISTS hora_registro_manana TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hora_registro_tarde TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hora_registro_noche TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_fact_horas_registro 
ON fact_habitos_diarios(date_key, hora_registro_manana, hora_registro_tarde, hora_registro_noche);

-- =====================================================
-- PARTE 5: AGREGAR EJERCICIO_PLAN_KEY A FACT
-- =====================================================

ALTER TABLE fact_habitos_diarios
ADD COLUMN IF NOT EXISTS ejercicio_plan_key UUID REFERENCES dim_ejercicio_planeado(plan_key);

CREATE INDEX IF NOT EXISTS idx_fact_ejercicio_plan 
ON fact_habitos_diarios(ejercicio_plan_key);

-- =====================================================
-- PARTE 6: AUTO-CALCULATE ROUTINE SCORE (TRIGGER)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_routine_score()
RETURNS TRIGGER AS $$
DECLARE
  total_fields INT := 0;
  true_fields INT := 0;
BEGIN
  -- Count total boolean fields that are not null
  IF NEW.despertar_a_hora IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.despertar_a_hora = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.dormir_a_hora IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.dormir_a_hora = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.oracion IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.oracion = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.ejercicio IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.ejercicio = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.tender_cama IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.tender_cama = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.no_telefono IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.no_telefono = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.ducha IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.ducha = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.planeacion IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.planeacion = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.ropa_lista IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.ropa_lista = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.orden_espacio IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.orden_espacio = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  IF NEW.cierre_redes IS NOT NULL THEN 
    total_fields := total_fields + 1;
    IF NEW.cierre_redes = TRUE THEN true_fields := true_fields + 1; END IF;
  END IF;
  
  -- Calculate percentage
  IF total_fields > 0 THEN
    NEW.score_rutina := ROUND((true_fields::NUMERIC / total_fields) * 100);
  ELSE
    NEW.score_rutina := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_routine_score ON dim_rutina;
CREATE TRIGGER trigger_calculate_routine_score
BEFORE INSERT OR UPDATE ON dim_rutina
FOR EACH ROW
EXECUTE FUNCTION calculate_routine_score();

-- =====================================================
-- PARTE 7: FUNCIÓN HELPER ACTUALIZADA
-- =====================================================

-- Función para obtener momento del día basado en hora
CREATE OR REPLACE FUNCTION get_momento_dia(hora TIMESTAMPTZ DEFAULT now())
RETURNS VARCHAR(20) AS $$
DECLARE
  hora_del_dia INT;
BEGIN
  hora_del_dia := EXTRACT(HOUR FROM hora);
  
  IF hora_del_dia >= 5 AND hora_del_dia < 12 THEN
    RETURN 'Manana';
  ELSIF hora_del_dia >= 12 AND hora_del_dia < 19 THEN
    RETURN 'Tarde';
  ELSIF hora_del_dia >= 19 AND hora_del_dia < 24 THEN
    RETURN 'Noche';
  ELSE
    RETURN 'Madrugada';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 8: VISTA MEJORADA PARA COMPLIANCE DE EJERCICIO
-- =====================================================

CREATE OR REPLACE VIEW v_ejercicio_compliance AS
SELECT 
  ep.user_id,
  ep.date_key,
  ep.plan_key,
  ep.tipo as tipo_planeado,
  ep.distancia_km_planeada,
  ep.duracion_estimada_min,
  
  e.ejercicio_key,
  e.tipo as tipo_ejecutado,
  e.distancia_km as distancia_real,
  e.duracion_min as duracion_real,
  e.intensidad,
  
  -- Compliance flags
  CASE 
    WHEN e.ejercicio_key IS NOT NULL THEN true 
    ELSE false 
  END as se_ejecuto,
  
  CASE 
    WHEN e.ejercicio_key IS NOT NULL AND e.tipo = ep.tipo THEN true
    ELSE false
  END as mismo_tipo,
  
  CASE 
    WHEN e.distancia_km IS NOT NULL AND ep.distancia_km_planeada IS NOT NULL THEN
      ROUND((e.distancia_km / ep.distancia_km_planeada) * 100)
    ELSE NULL
  END as porcentaje_distancia_completado,
  
  ep.created_at as planeado_en,
  e.created_at as ejecutado_en
  
FROM dim_ejercicio_planeado ep
LEFT JOIN dim_ejercicio e ON e.ejercicio_plan_key = ep.plan_key
WHERE ep.tipo NOT IN ('Descanso', 'No haré ejercicio');

-- Permisos
GRANT SELECT ON v_ejercicio_compliance TO authenticated;
ALTER VIEW v_ejercicio_compliance SET (security_invoker = true);

-- =====================================================
-- PARTE 9: VISTA PARA ANÁLISIS DE TENTACIONES POR HORA
-- =====================================================

CREATE OR REPLACE VIEW v_tentaciones_por_momento AS
SELECT 
  user_id,
  momento_dia,
  DATE_TRUNC('hour', hora_aproximada) as hora_del_dia,
  COUNT(*) as total_tentaciones,
  SUM(CASE WHEN gano_tentacion = true THEN 1 ELSE 0 END) as tentaciones_ganadas,
  SUM(CASE WHEN gano_tentacion = false THEN 1 ELSE 0 END) as tentaciones_perdidas,
  ROUND(AVG(nivel_riesgo), 2) as nivel_riesgo_promedio,
  array_agg(DISTINCT pecado_principal) as tipos_pecados,
  array_agg(DISTINCT trigger_principal) as triggers_comunes
FROM dim_tentacion
WHERE momento_dia IS NOT NULL
GROUP BY user_id, momento_dia, DATE_TRUNC('hour', hora_aproximada);

-- Permisos
GRANT SELECT ON v_tentaciones_por_momento TO authenticated;
ALTER VIEW v_tentaciones_por_momento SET (security_invoker = true);

-- =====================================================
-- PARTE 10: VISTA TIMELINE EMOCIONAL DEL DÍA
-- =====================================================

CREATE OR REPLACE VIEW v_timeline_emocional_dia AS
WITH emotional_states AS (
  SELECT 
    f.user_id,
    f.date_key,
    'Manana' as momento,
    1 as orden,
    e.ansiedad,
    e.tranquilidad,
    e.motivacion,
    e.enfoque,
    e.animo,
    e.ira,
    e.tristeza,
    f.hora_registro_manana as timestamp_registro
  FROM fact_habitos_diarios f
  JOIN dim_estado_emocional e ON f.estado_emocional_manana_key = e.estado_emocional_key
  WHERE f.estado_emocional_manana_key IS NOT NULL
  
  UNION ALL
  
  SELECT 
    f.user_id,
    f.date_key,
    'Tarde' as momento,
    2 as orden,
    e.ansiedad,
    e.tranquilidad,
    e.motivacion,
    e.enfoque,
    e.animo,
    e.ira,
    e.tristeza,
    f.hora_registro_tarde as timestamp_registro
  FROM fact_habitos_diarios f
  JOIN dim_estado_emocional e ON f.estado_emocional_tarde_key = e.estado_emocional_key
  WHERE f.estado_emocional_tarde_key IS NOT NULL
)
SELECT * FROM emotional_states
ORDER BY user_id, date_key, orden;

-- Permisos
GRANT SELECT ON v_timeline_emocional_dia TO authenticated;
ALTER VIEW v_timeline_emocional_dia SET (security_invoker = true);

-- =====================================================
-- PARTE 11: COMENTARIOS EN COLUMNAS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON COLUMN dim_estado_emocional.momento_dia IS 'Momento del día en que se registró el estado: Manana, Tarde, Noche, Madrugada';
COMMENT ON COLUMN dim_tentacion.momento_dia IS 'Momento del día en que ocurrió la tentación';
COMMENT ON COLUMN dim_tentacion.hora_aproximada IS 'Hora aproximada de la tentación (para análisis de patrones horarios)';
COMMENT ON COLUMN dim_tentacion.fuente_registro IS 'Desde dónde se registró: Tarde (form de tarde) o Registro_Individual (página dedicada)';
COMMENT ON COLUMN dim_ejercicio.ejercicio_plan_key IS 'Link al plan de ejercicio si este registro es la ejecución de un plan';
COMMENT ON COLUMN dim_ejercicio_planeado.plan_key IS 'ID del plan de ejercicio (usado para link con ejecución real)';
COMMENT ON COLUMN fact_habitos_diarios.estado_emocional_manana_key IS 'Snapshot emocional de la mañana';
COMMENT ON COLUMN fact_habitos_diarios.estado_emocional_tarde_key IS 'Snapshot emocional de la tarde';
COMMENT ON COLUMN fact_habitos_diarios.hora_registro_manana IS 'Timestamp exacto de cuándo se registró la rutina matutina';
COMMENT ON COLUMN fact_habitos_diarios.hora_registro_tarde IS 'Timestamp exacto de cuándo se registró el check-in de tarde';
COMMENT ON COLUMN fact_habitos_diarios.hora_registro_noche IS 'Timestamp exacto de cuándo se registró la rutina nocturna';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 
  'Schema V2 aplicado correctamente' as status,
  COUNT(*) as nuevas_columnas
FROM information_schema.columns
WHERE table_name IN ('dim_estado_emocional', 'dim_tentacion', 'dim_espiritual', 'dim_estudio', 'dim_interacciones', 'dim_ejercicio', 'dim_ejercicio_planeado', 'fact_habitos_diarios')
  AND column_name IN ('momento_dia', 'hora_aproximada', 'fuente_registro', 'ejercicio_plan_key', 'estado_emocional_manana_key', 'estado_emocional_tarde_key', 'hora_registro_manana', 'hora_registro_tarde', 'hora_registro_noche', 'plan_key');

-- =====================================================
-- ✅ SCHEMA V2 COMPLETADO
-- =====================================================


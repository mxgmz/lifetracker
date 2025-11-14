-- =====================================================
-- LIFE OS - DATABASE SCHEMA V3
-- CRITICAL FIXES: Data Persistence, Integrity, BI Ready
-- =====================================================

-- =====================================================
-- PARTE 0: CONSTRAINT DE UNICIDAD EN FACT
-- =====================================================

ALTER TABLE fact_habitos_diarios
DROP CONSTRAINT IF EXISTS unique_user_date;

ALTER TABLE fact_habitos_diarios
ADD CONSTRAINT unique_user_date UNIQUE (user_id, date_key);

-- =====================================================
-- PARTE 1: AGREGAR CAMPOS FALTANTES A FACT
-- =====================================================

-- Campos de tracking diario que se capturan pero NO se guardaban
ALTER TABLE fact_habitos_diarios
ADD COLUMN IF NOT EXISTS agua_tomada_manana BOOLEAN,
ADD COLUMN IF NOT EXISTS agua_tomada_tarde BOOLEAN,
ADD COLUMN IF NOT EXISTS comida_bien_tarde BOOLEAN,
ADD COLUMN IF NOT EXISTS micro_reset_realizado BOOLEAN,
ADD COLUMN IF NOT EXISTS movimiento_matutino BOOLEAN,
ADD COLUMN IF NOT EXISTS silencio_manana BOOLEAN,
ADD COLUMN IF NOT EXISTS descripcion_emocional_tarde TEXT,
ADD COLUMN IF NOT EXISTS meta_principal_dia TEXT,
ADD COLUMN IF NOT EXISTS meta_secundaria_dia TEXT,
ADD COLUMN IF NOT EXISTS palabra_enfoque_dia TEXT,
ADD COLUMN IF NOT EXISTS quien_fuiste_hoy TEXT,
ADD COLUMN IF NOT EXISTS reflexion_matutina TEXT,
ADD COLUMN IF NOT EXISTS reflexion_tarde TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- =====================================================
-- PARTE 1B: ACTUALIZAR dim_estado_emocional
-- =====================================================

ALTER TABLE dim_estado_emocional
ADD COLUMN IF NOT EXISTS estabilidad_emocional INTEGER;

ALTER TABLE dim_tentacion
ADD COLUMN IF NOT EXISTS categoria TEXT;

-- =====================================================
-- PARTE 2: CREAR TABLA dim_gratitud
-- =====================================================

CREATE TABLE IF NOT EXISTS dim_gratitud (
  gratitud_key UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  orden INTEGER NOT NULL CHECK (orden IN (1, 2, 3)),
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para gratitud
CREATE INDEX IF NOT EXISTS idx_gratitud_user_date 
ON dim_gratitud(user_id, date_key DESC);

CREATE INDEX IF NOT EXISTS idx_gratitud_user_all 
ON dim_gratitud(user_id, created_at DESC);

-- RLS para gratitud
ALTER TABLE dim_gratitud ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own gratitude" ON dim_gratitud;
CREATE POLICY "Users can view own gratitude" ON dim_gratitud
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own gratitude" ON dim_gratitud;
CREATE POLICY "Users can insert own gratitude" ON dim_gratitud
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gratitude" ON dim_gratitud;
CREATE POLICY "Users can update own gratitude" ON dim_gratitud
  FOR UPDATE USING (auth.uid() = user_id);

-- Link en fact
ALTER TABLE fact_habitos_diarios
ADD COLUMN IF NOT EXISTS gratitud_key UUID REFERENCES dim_gratitud(gratitud_key);

-- =====================================================
-- PARTE 3: CREAR TABLA dim_metas
-- =====================================================

CREATE TABLE IF NOT EXISTS dim_metas (
  meta_key UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  descripcion TEXT NOT NULL,
  orden INTEGER, -- 1 = principal, 2 = secundaria
  cumplida BOOLEAN DEFAULT NULL, -- NULL = sin definir, true/false = definido
  reflexion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CHECK constraint para tipo
ALTER TABLE dim_metas
DROP CONSTRAINT IF EXISTS dim_metas_tipo_check;

ALTER TABLE dim_metas
ADD CONSTRAINT dim_metas_tipo_check 
CHECK (tipo IN ('Diaria', 'Manana', 'Secundaria'));

-- Índices para metas
CREATE INDEX IF NOT EXISTS idx_metas_user_date 
ON dim_metas(user_id, date_key DESC);

CREATE INDEX IF NOT EXISTS idx_metas_cumplimiento 
ON dim_metas(user_id, cumplida, date_key DESC);

-- RLS para metas
ALTER TABLE dim_metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metas" ON dim_metas;
CREATE POLICY "Users can view own metas" ON dim_metas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own metas" ON dim_metas;
CREATE POLICY "Users can insert own metas" ON dim_metas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own metas" ON dim_metas;
CREATE POLICY "Users can update own metas" ON dim_metas
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PARTE 4: CREAR TABLA dim_scripture_readings
-- =====================================================

CREATE TABLE IF NOT EXISTS dim_scripture_readings (
  reading_key UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  libro VARCHAR(50) NOT NULL,
  capitulo INTEGER NOT NULL,
  versiculos TEXT, -- "1-5,10,15-20"
  total_versiculos INTEGER,
  insight TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scripture_user_date 
ON dim_scripture_readings(user_id, date_key DESC);

CREATE INDEX IF NOT EXISTS idx_scripture_libro 
ON dim_scripture_readings(user_id, libro, capitulo);

ALTER TABLE dim_scripture_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own readings" ON dim_scripture_readings;
CREATE POLICY "Users can view own readings" ON dim_scripture_readings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own readings" ON dim_scripture_readings;
CREATE POLICY "Users can insert own readings" ON dim_scripture_readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PARTE 5: TABLAS PUENTE PARA MÚLTIPLES REGISTROS
-- =====================================================

-- Tabla puente: fact → ejercicios (permite múltiples por día)
CREATE TABLE IF NOT EXISTS fact_ejercicios (
  fact_id UUID REFERENCES fact_habitos_diarios(fact_id) ON DELETE CASCADE,
  ejercicio_key UUID REFERENCES dim_ejercicio(ejercicio_key) ON DELETE CASCADE,
  orden INTEGER,
  PRIMARY KEY (fact_id, ejercicio_key)
);

CREATE INDEX IF NOT EXISTS idx_fact_ejercicios_fact 
ON fact_ejercicios(fact_id);

-- Tabla puente: fact → estudios (permite múltiples por día)
CREATE TABLE IF NOT EXISTS fact_estudios (
  fact_id UUID REFERENCES fact_habitos_diarios(fact_id) ON DELETE CASCADE,
  estudio_key UUID REFERENCES dim_estudio(estudio_key) ON DELETE CASCADE,
  orden INTEGER,
  PRIMARY KEY (fact_id, estudio_key)
);

CREATE INDEX IF NOT EXISTS idx_fact_estudios_fact 
ON fact_estudios(fact_id);

-- Tabla puente: fact → tentaciones (permite múltiples por día)
CREATE TABLE IF NOT EXISTS fact_tentaciones (
  fact_id UUID REFERENCES fact_habitos_diarios(fact_id) ON DELETE CASCADE,
  tentacion_key UUID REFERENCES dim_tentacion(tentacion_key) ON DELETE CASCADE,
  orden INTEGER,
  PRIMARY KEY (fact_id, tentacion_key)
);

CREATE INDEX IF NOT EXISTS idx_fact_tentaciones_fact 
ON fact_tentaciones(fact_id);

-- Tabla puente: fact → prácticas espirituales (permite múltiples por día)
CREATE TABLE IF NOT EXISTS fact_practicas_espirituales (
  fact_id UUID REFERENCES fact_habitos_diarios(fact_id) ON DELETE CASCADE,
  espiritualidad_key UUID REFERENCES dim_espiritual(espiritualidad_key) ON DELETE CASCADE,
  momento_dia VARCHAR(20),
  orden INTEGER,
  PRIMARY KEY (fact_id, espiritualidad_key)
);

CREATE INDEX IF NOT EXISTS idx_fact_practicas_fact 
ON fact_practicas_espirituales(fact_id);

-- Tabla puente: fact → gratitudes (varias gracias por día)
CREATE TABLE IF NOT EXISTS fact_gratitudes (
  fact_id UUID REFERENCES fact_habitos_diarios(fact_id) ON DELETE CASCADE,
  gratitud_key UUID REFERENCES dim_gratitud(gratitud_key) ON DELETE CASCADE,
  orden INTEGER,
  PRIMARY KEY (fact_id, gratitud_key)
);

CREATE INDEX IF NOT EXISTS idx_fact_gratitudes_fact 
ON fact_gratitudes(fact_id);

-- Tabla puente: fact → metas (vincula metas capturadas)
CREATE TABLE IF NOT EXISTS fact_metas (
  fact_id UUID REFERENCES fact_habitos_diarios(fact_id) ON DELETE CASCADE,
  meta_key UUID REFERENCES dim_metas(meta_key) ON DELETE CASCADE,
  tipo VARCHAR(50),
  PRIMARY KEY (fact_id, meta_key)
);

CREATE INDEX IF NOT EXISTS idx_fact_metas_fact 
ON fact_metas(fact_id);

-- Tabla puente: fact → interacciones (detalle de interacciones positivas/negativas)
CREATE TABLE IF NOT EXISTS fact_interacciones (
  fact_id UUID REFERENCES fact_habitos_diarios(fact_id) ON DELETE CASCADE,
  interaccion_key UUID REFERENCES dim_interacciones(interaccion_key) ON DELETE CASCADE,
  orden INTEGER,
  PRIMARY KEY (fact_id, interaccion_key)
);

CREATE INDEX IF NOT EXISTS idx_fact_interacciones_fact 
ON fact_interacciones(fact_id);

-- =====================================================
-- PARTE 6: AGREGAR momento_dia A EJERCICIO SI NO EXISTE
-- =====================================================

ALTER TABLE dim_ejercicio
ADD COLUMN IF NOT EXISTS momento_dia VARCHAR(20);

ALTER TABLE dim_ejercicio
DROP CONSTRAINT IF EXISTS dim_ejercicio_momento_check;

ALTER TABLE dim_ejercicio
ADD CONSTRAINT dim_ejercicio_momento_check 
CHECK (momento_dia IN ('Manana', 'Tarde', 'Noche', 'Madrugada', NULL));

-- CHECK constraint para practica espiritual (evita strings no soportados)
ALTER TABLE dim_espiritual
DROP CONSTRAINT IF EXISTS dim_espiritual_practica_check;

ALTER TABLE dim_espiritual
ADD CONSTRAINT dim_espiritual_practica_check 
CHECK (practica IN ('Lectura', 'Oracion', 'Devocional', 'Reflexion'));

-- =====================================================
-- PARTE 7: CREAR REFERENCIAS DE NORMALIZACIÓN
-- =====================================================

-- Tabla de referencia: Tipos de pecados
CREATE TABLE IF NOT EXISTS ref_tipos_pecado (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO ref_tipos_pecado (nombre, descripcion) VALUES
  ('Lujuria', 'Deseos carnales, pornografía, infidelidad'),
  ('Gula', 'Exceso en comida o bebida'),
  ('Avaricia', 'Obsesión con dinero o posesiones'),
  ('Pereza', 'Falta de disciplina, procrastinación'),
  ('Ira', 'Rabia, resentimiento, violencia'),
  ('Envidia', 'Celos de otros, descontento'),
  ('Orgullo', 'Arrogancia, soberbia, vanidad')
ON CONFLICT (nombre) DO NOTHING;

-- Tabla de referencia: Triggers comunes
CREATE TABLE IF NOT EXISTS ref_triggers (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  categoria VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO ref_triggers (nombre, categoria) VALUES
  ('Soledad', 'Emocional'),
  ('Estrés', 'Emocional'),
  ('Aburrimiento', 'Emocional'),
  ('Cansancio', 'Físico'),
  ('Hambre', 'Físico'),
  ('Redes sociales', 'Digital'),
  ('Amigos', 'Social'),
  ('Pareja', 'Social'),
  ('Trabajo', 'Laboral'),
  ('Fracaso', 'Psicológico')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- PARTE 8: MEJORAR journal_entries
-- =====================================================

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array de tags
ADD COLUMN IF NOT EXISTS emocion_predominante TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS es_privado BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_journal_categoria 
ON journal_entries(user_id, categoria);

CREATE INDEX IF NOT EXISTS idx_journal_tags 
ON journal_entries USING GIN(tags);

-- =====================================================
-- PARTE 9: AGREGAR SOFT DELETE A TABLAS PRINCIPALES
-- =====================================================

ALTER TABLE fact_habitos_diarios
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE dim_gratitud
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE dim_metas
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =====================================================
-- PARTE 10: CREAR VIEW DE METAS CUMPLIDAS
-- =====================================================

CREATE OR REPLACE VIEW v_metas_cumplimiento AS
SELECT 
  m.user_id,
  m.date_key,
  COUNT(*) as total_metas,
  SUM(CASE WHEN m.cumplida = true THEN 1 ELSE 0 END) as metas_cumplidas,
  SUM(CASE WHEN m.cumplida = false THEN 1 ELSE 0 END) as metas_no_cumplidas,
  ROUND((SUM(CASE WHEN m.cumplida = true THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 1) as porcentaje_cumplimiento,
  STRING_AGG(m.descripcion, ' | ') as metas,
  STRING_AGG(CASE WHEN m.cumplida = true THEN m.descripcion END, ' | ') as cumplidas,
  STRING_AGG(CASE WHEN m.cumplida = false THEN m.descripcion END, ' | ') as no_cumplidas
FROM dim_metas m
WHERE m.deleted_at IS NULL
GROUP BY m.user_id, m.date_key;

GRANT SELECT ON v_metas_cumplimiento TO authenticated;
ALTER VIEW v_metas_cumplimiento SET (security_invoker = true);

-- =====================================================
-- PARTE 11: CREAR VIEW DE GRATITUD ANALYSIS
-- =====================================================

CREATE OR REPLACE VIEW v_gratitud_analysis AS
SELECT 
  g.user_id,
  DATE_TRUNC('week', g.date_key)::DATE as week_starting,
  COUNT(*) as total_gratitudes,
  COUNT(DISTINCT g.date_key) as dias_con_gratitud,
  STRING_AGG(DISTINCT g.descripcion, ' | ' ORDER BY g.descripcion) as temas_comunes
FROM dim_gratitud g
WHERE g.deleted_at IS NULL
GROUP BY g.user_id, DATE_TRUNC('week', g.date_key);

GRANT SELECT ON v_gratitud_analysis TO authenticated;
ALTER VIEW v_gratitud_analysis SET (security_invoker = true);

-- =====================================================
-- PARTE 12: CREAR VIEW DE SCRIPTURE READING STATS
-- =====================================================

CREATE OR REPLACE VIEW v_scripture_stats AS
SELECT 
  r.user_id,
  r.libro,
  COUNT(*) as veces_leido,
  SUM(r.total_versiculos) as total_versiculos_leidos,
  COUNT(DISTINCT r.date_key) as dias_diferentes,
  MAX(r.date_key) as ultima_lectura
FROM dim_scripture_readings r
GROUP BY r.user_id, r.libro
ORDER BY COUNT(*) DESC;

GRANT SELECT ON v_scripture_stats TO authenticated;
ALTER VIEW v_scripture_stats SET (security_invoker = true);

-- =====================================================
-- PARTE 13: CREAR VIEW DE MÚLTIPLES REGISTROS POR DÍA
-- =====================================================

CREATE OR REPLACE VIEW v_fact_registros_diarios AS
SELECT 
  f.fact_id,
  f.user_id,
  f.date_key,
  (SELECT COUNT(*) FROM fact_ejercicios fe WHERE fe.fact_id = f.fact_id) as num_ejercicios,
  (SELECT COUNT(*) FROM fact_estudios fs WHERE fs.fact_id = f.fact_id) as num_estudios,
  (SELECT COUNT(*) FROM fact_tentaciones ft WHERE ft.fact_id = f.fact_id) as num_tentaciones,
  (SELECT COUNT(*) FROM fact_practicas_espirituales fp WHERE fp.fact_id = f.fact_id) as num_practicas_espirituales,
  (SELECT COUNT(*) FROM dim_gratitud dg WHERE dg.date_key = f.date_key AND dg.user_id = f.user_id) as num_gratitudes,
  (SELECT COUNT(*) FROM dim_metas dm WHERE dm.date_key = f.date_key AND dm.user_id = f.user_id) as num_metas,
  f.created_at,
  f.updated_at
FROM fact_habitos_diarios f
WHERE f.is_deleted = false;

GRANT SELECT ON v_fact_registros_diarios TO authenticated;
ALTER VIEW v_fact_registros_diarios SET (security_invoker = true);

-- =====================================================
-- PARTE 14: ÍNDICES DE PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_fact_updated 
ON fact_habitos_diarios(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_fact_is_deleted 
ON fact_habitos_diarios(user_id, is_deleted, date_key DESC);

CREATE INDEX IF NOT EXISTS idx_dim_ejercicio_momento 
ON dim_ejercicio(user_id, momento_dia, created_at DESC);

-- =====================================================
-- PARTE 15: FUNCIONES HELPER ACTUALIZADAS
-- =====================================================

-- Función para agregar gratitud
CREATE OR REPLACE FUNCTION add_gratitude(
  p_user_id UUID,
  p_date_key DATE,
  p_gratitudes TEXT[] -- Array con 3 elementos
)
RETURNS UUID AS $$
DECLARE
  v_fact_id UUID;
  v_gratitud_key UUID;
  i INT;
BEGIN
  -- Obtener o crear fact
  SELECT fact_id INTO v_fact_id
  FROM fact_habitos_diarios
  WHERE user_id = p_user_id AND date_key = p_date_key;
  
  IF v_fact_id IS NULL THEN
    INSERT INTO fact_habitos_diarios (user_id, date_key)
    VALUES (p_user_id, p_date_key)
    RETURNING fact_id INTO v_fact_id;
  END IF;
  
  -- Insertar gratitudes
  FOR i IN 1..3 LOOP
    IF p_gratitudes[i] IS NOT NULL AND p_gratitudes[i] != '' THEN
      INSERT INTO dim_gratitud (user_id, date_key, orden, descripcion)
      VALUES (p_user_id, p_date_key, i, p_gratitudes[i]);
    END IF;
  END LOOP;
  
  RETURN v_fact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar metas
CREATE OR REPLACE FUNCTION add_metas(
  p_user_id UUID,
  p_date_key DATE,
  p_meta_principal TEXT,
  p_meta_secundaria TEXT,
  p_palabra_enfoque TEXT
)
RETURNS UUID AS $$
DECLARE
  v_fact_id UUID;
BEGIN
  SELECT fact_id INTO v_fact_id
  FROM fact_habitos_diarios
  WHERE user_id = p_user_id AND date_key = p_date_key;
  
  IF v_fact_id IS NULL THEN
    INSERT INTO fact_habitos_diarios (user_id, date_key)
    VALUES (p_user_id, p_date_key)
    RETURNING fact_id INTO v_fact_id;
  END IF;
  
  IF p_meta_principal IS NOT NULL AND p_meta_principal != '' THEN
    INSERT INTO dim_metas (user_id, date_key, tipo, descripcion, orden)
    VALUES (p_user_id, p_date_key, 'Diaria', p_meta_principal, 1);
  END IF;
  
  IF p_meta_secundaria IS NOT NULL AND p_meta_secundaria != '' THEN
    INSERT INTO dim_metas (user_id, date_key, tipo, descripcion, orden)
    VALUES (p_user_id, p_date_key, 'Secundaria', p_meta_secundaria, 2);
  END IF;
  
  RETURN v_fact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar múltiples ejercicios
CREATE OR REPLACE FUNCTION add_ejercicio_to_fact(
  p_fact_id UUID,
  p_ejercicio_key UUID,
  p_orden INT DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO fact_ejercicios (fact_id, ejercicio_key, orden)
  VALUES (p_fact_id, p_ejercicio_key, p_orden)
  ON CONFLICT (fact_id, ejercicio_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función similar para estudios
CREATE OR REPLACE FUNCTION add_estudio_to_fact(
  p_fact_id UUID,
  p_estudio_key UUID,
  p_orden INT DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO fact_estudios (fact_id, estudio_key, orden)
  VALUES (p_fact_id, p_estudio_key, p_orden)
  ON CONFLICT (fact_id, estudio_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 16: COMENTARIOS EN COLUMNAS
-- =====================================================

COMMENT ON TABLE dim_gratitud IS 'Registra las 3 gracias diarias del usuario';
COMMENT ON TABLE dim_metas IS 'Registra metas diarias (principal, secundaria, mañana)';
COMMENT ON TABLE dim_scripture_readings IS 'Tracking detallado de lecturas bíblicas';
COMMENT ON TABLE fact_ejercicios IS 'Tabla puente: permite múltiples ejercicios por día';
COMMENT ON TABLE fact_estudios IS 'Tabla puente: permite múltiples sesiones de estudio por día';
COMMENT ON TABLE fact_tentaciones IS 'Tabla puente: permite múltiples tentaciones por día';
COMMENT ON TABLE fact_practicas_espirituales IS 'Tabla puente: permite múltiples prácticas espirituales por día';

COMMENT ON COLUMN fact_habitos_diarios.agua_tomada_manana IS '¿Tomaste agua en la mañana?';
COMMENT ON COLUMN fact_habitos_diarios.agua_tomada_tarde IS 'Tomaste agua en la tarde?';
COMMENT ON COLUMN fact_habitos_diarios.comida_bien_tarde IS 'Comiste bien en la tarde?';
COMMENT ON COLUMN fact_habitos_diarios.micro_reset_realizado IS 'Realizaste micro-reset?';
COMMENT ON COLUMN fact_habitos_diarios.movimiento_matutino IS 'Movimiento ligero completado en la mañana?';
COMMENT ON COLUMN fact_habitos_diarios.silencio_manana IS 'Tomaste 2 minutos de silencio/respiración?';
COMMENT ON COLUMN fact_habitos_diarios.descripcion_emocional_tarde IS 'Contexto adicional del estado emocional de la tarde';
COMMENT ON COLUMN dim_estado_emocional.estabilidad_emocional IS 'Autoevaluación 1-5 de estabilidad en ese momento';
COMMENT ON COLUMN dim_tentacion.categoria IS 'Categoría/contexto: Emocional, Físico, Digital, Social, etc.';
COMMENT ON COLUMN fact_habitos_diarios.meta_principal_dia IS 'Meta principal capturada en /manana';
COMMENT ON COLUMN fact_habitos_diarios.palabra_enfoque_dia IS 'Palabra de enfoque/identidad del día';
COMMENT ON COLUMN fact_habitos_diarios.quien_fuiste_hoy IS 'Reflexión sobre quién fuiste hoy';
COMMENT ON COLUMN fact_habitos_diarios.reflexion_matutina IS 'Reflexión de cómo amaneciste';
COMMENT ON COLUMN fact_habitos_diarios.reflexion_tarde IS 'Reflexión de cómo va tu día en la tarde';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 
  'Schema V3 Applied Successfully' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'dim_%' OR table_name LIKE 'fact_%') as total_tables,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'ref_%') as reference_tables,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'fact_%' AND table_name != 'fact_habitos_diarios') as bridge_tables;


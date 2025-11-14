-- =====================================================
-- URGENTE: Ejecuta esto en Supabase SQL Editor
-- Para remover el constraint que está bloqueando
-- =====================================================

-- 1. Remover el constraint restrictivo
ALTER TABLE dim_ejercicio
DROP CONSTRAINT IF EXISTS dim_ejercicio_tipo_check;

-- 2. Verificar que fue removido
SELECT constraint_name
FROM information_schema.check_constraints
WHERE table_name = 'dim_ejercicio'
  AND constraint_name = 'dim_ejercicio_tipo_check';

-- Expected result: Empty (no rows returned)

-- 3. Puedes ahora registrar ejercicios de cualquier tipo
-- Los tipos soportados en el frontend son:
-- - Correr
-- - Pesas
-- - Caminata
-- - Ciclismo
-- - Natación
-- - Yoga
-- - Deportes
-- - Otro

-- Si en el futuro quieres un constraint, usar una tabla de referencia en lugar de CHECK:
-- CREATE TABLE ref_tipos_ejercicio (
--   id SERIAL PRIMARY KEY,
--   nombre VARCHAR(100) UNIQUE NOT NULL
-- );
-- 
-- INSERT INTO ref_tipos_ejercicio (nombre) VALUES 
--   ('Correr'),
--   ('Pesas'),
--   ('Caminata'),
--   ('Ciclismo'),
--   ('Natación'),
--   ('Yoga'),
--   ('Deportes'),
--   ('Otro');
-- 
-- ALTER TABLE dim_ejercicio 
-- ADD FOREIGN KEY (tipo) REFERENCES ref_tipos_ejercicio(nombre);


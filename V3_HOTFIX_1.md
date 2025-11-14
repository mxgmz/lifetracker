# V3 Hotfix #1 - Exercise Type Constraint Issue

## Issue
```
Error al guardar: Failed to insert into dim_ejercicio: 
new row for relation "dim_ejercicio" violates check constraint "dim_ejercicio_tipo_check"
```

## Root Cause
❌ The constraint was TOO RESTRICTIVO - solo permitía:
- Correr, Pesas, Otro, Descanso, No haré ejercicio

✅ Pero el frontend permite MUCHOS MÁS tipos:
- Correr ✅
- Pesas ✅
- Caminata ❌ (BLOQUEADO)
- Ciclismo ❌ (BLOQUEADO)
- Natación ❌ (BLOQUEADO)
- Yoga ❌ (BLOQUEADO)
- Deportes ❌ (BLOQUEADO)
- Otro ✅

## Solution: REMOVE the Constraint

### Ejecuta esto en Supabase SQL Editor AHORA:

```sql
-- Remover el constraint que está bloqueando
ALTER TABLE dim_ejercicio
DROP CONSTRAINT IF EXISTS dim_ejercicio_tipo_check;
```

¡Eso es todo! El problema se resuelve.

### Verification

```sql
-- Verifica que fue removido
SELECT constraint_name
FROM information_schema.check_constraints
WHERE table_name = 'dim_ejercicio'
  AND constraint_name = 'dim_ejercicio_tipo_check';

-- Should return: (empty - 0 rows)
```

## Testing

Después de ejecutar el SQL:

1. Ve a `/ejercicio`
2. Selecciona CUALQUIER tipo: Correr, Pesas, Caminata, Ciclismo, Natación, Yoga, Deportes, Otro
3. Llena los otros campos
4. Submit
5. ✅ Debe guardar SIN ERROR

## Alternative: Use a Reference Table (Future)

Si en el futuro quieres normalizar tipos de ejercicio, usa una tabla de referencia en lugar de CHECK:

```sql
CREATE TABLE ref_tipos_ejercicio (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO ref_tipos_ejercicio (nombre) VALUES 
  ('Correr'),
  ('Pesas'),
  ('Caminata'),
  ('Ciclismo'),
  ('Natación'),
  ('Yoga'),
  ('Deportes'),
  ('Otro');

ALTER TABLE dim_ejercicio 
ADD FOREIGN KEY (tipo) REFERENCES ref_tipos_ejercicio(nombre);
```

Pero por ahora, mejor dejar flexible sin constraint.

## Files Updated
- ✅ `DATABASE_SCHEMA_V3.sql` (Removed restrictive constraint)
- ✅ `REMOVE_EJERCICIO_CONSTRAINT.sql` (Quick fix SQL)

## Status
✅ HOTFIX READY  
⚠️ NEEDS EXECUTION in Supabase

---

**Date:** November 2025  
**Version:** V3.1  
**Severity:** MEDIUM (blocking exercise registration)  
**Resolution:** 1 SQL line to execute


# Database Schema V3 - Deployment Guide

## 🚀 Quick Start

### Phase 1: Database (5 minutes)

1. Open Supabase SQL Editor
2. Copy entire content of `DATABASE_SCHEMA_V3.sql`
3. Execute
4. Verify no errors

---

## 🔍 Verification Queries

Run these after deployment to confirm everything worked:

### Check 1: New Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE 'dim_%' OR table_name = 'fact%')
ORDER BY table_name;
```

**Expected Output:** Should show ALL these tables (plus the original ones):
- fact_ejercicios
- fact_estudios
- fact_tentaciones
- fact_practicas_espirituales
- dim_gratitud
- dim_metas
- dim_scripture_readings
- ref_tipos_pecado
- ref_triggers

### Check 2: New Columns in fact_habitos_diarios
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'fact_habitos_diarios'
  AND column_name IN (
    'agua_tomada_manana',
    'agua_tomada_tarde',
    'comida_bien_tarde',
    'micro_reset_realizado',
    'meta_principal_dia',
    'meta_secundaria_dia',
    'palabra_enfoque_dia',
    'quien_fuiste_hoy',
    'reflexion_matutina',
    'reflexion_tarde',
    'updated_at',
    'gratitud_key'
  )
ORDER BY column_name;
```

**Expected:** All 12 columns should exist

### Check 3: RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('dim_gratitud', 'dim_metas', 'dim_scripture_readings')
ORDER BY tablename, policyname;
```

**Expected:** Each table should have 3 policies (SELECT, INSERT, UPDATE)

### Check 4: Reference Data
```sql
SELECT COUNT(*) as tipos_pecado FROM ref_tipos_pecado;
SELECT COUNT(*) as triggers FROM ref_triggers;
```

**Expected:** 7 tipos_pecado, 10 triggers

### Check 5: Views Created
```sql
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname LIKE 'v_%'
ORDER BY viewname;
```

**Expected:** Should include:
- v_metas_cumplimiento
- v_gratitud_analysis
- v_scripture_stats
- v_fact_registros_diarios

### Check 6: Unique Constraint
```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'fact_habitos_diarios'
  AND constraint_type = 'UNIQUE';
```

**Expected:** Should show `unique_user_date`

---

## ✅ Data Migration (if you have existing data)

### Migrate Bridge Tables (Optional)
If you already have records, optionally populate bridge tables:

```sql
-- Populate fact_ejercicios from existing data
INSERT INTO fact_ejercicios (fact_id, ejercicio_key, orden)
SELECT fact_id, ejercicio_key, 1
FROM fact_habitos_diarios
WHERE ejercicio_key IS NOT NULL
ON CONFLICT (fact_id, ejercicio_key) DO NOTHING;

-- Populate fact_estudios from existing data
INSERT INTO fact_estudios (fact_id, estudio_key, orden)
SELECT fact_id, estudio_key, 1
FROM fact_habitos_diarios
WHERE estudio_key IS NOT NULL
ON CONFLICT (fact_id, estudio_key) DO NOTHING;

-- Populate fact_tentaciones from existing data
INSERT INTO fact_tentaciones (fact_id, tentacion_key, orden)
SELECT fact_id, tentacion_key, 1
FROM fact_habitos_diarios
WHERE tentacion_key IS NOT NULL
ON CONFLICT (fact_id, tentacion_key) DO NOTHING;

-- Populate fact_practicas_espirituales from existing data
INSERT INTO fact_practicas_espirituales (fact_id, espiritualidad_key, momento_dia, orden)
SELECT fact_id, espiritualidad_key, 
  CASE 
    WHEN hora_registro_manana IS NOT NULL THEN 'Manana'
    WHEN hora_registro_tarde IS NOT NULL THEN 'Tarde'
    WHEN hora_registro_noche IS NOT NULL THEN 'Noche'
    ELSE 'Tarde'
  END,
  1
FROM fact_habitos_diarios
WHERE espiritualidad_key IS NOT NULL
ON CONFLICT (fact_id, espiritualidad_key) DO NOTHING;
```

---

## 🧪 Testing Procedures

### Test 1: Register a Morning
1. Login to app
2. Go to `/manana`
3. Fill out:
   - Sleep hours: 8
   - Sleep quality: 5
   - Anxiety: 2
   - Energy: 4
   - Focus: 3
   - Morning reflection: "Woke up feeling great"
   - Prayer: checked
   - Bible book: Genesis, Chapter: 1
   - Morning insight: "God is good"
   - Routine checkboxes: all checked
   - Morning goal: "Be productive"
   - Second goal: "Stay focused"
   - Focus word: "Discipline"
4. Submit

**Expected DB result:**
```sql
SELECT * FROM fact_habitos_diarios WHERE date_key = TODAY;
-- Should have:
-- - hora_registro_manana: [timestamp]
-- - meta_principal_dia: "Be productive"
-- - meta_secundaria_dia: "Stay focused"
-- - palabra_enfoque_dia: "Discipline"
-- - reflexion_matutina: "Woke up feeling great"

SELECT * FROM dim_estado_emocional 
WHERE user_id = 'xxx' AND momento_dia = 'Manana';
-- Should exist with the values

SELECT * FROM dim_espiritual 
WHERE user_id = 'xxx' AND momento_dia = 'Manana';
-- Should exist with Genesis
```

### Test 2: Register Afternoon
1. Go to `/tarde`
2. Fill:
   - Anxiety: 3
   - Focus: 4
   - Stress: 2
   - Mood: 4
   - How's your day: "Progressing well"
   - Water: checked
   - Food: checked
   - Micro-reset: checked
   - Study: "JavaScript", 60 minutes, depth: 4
   - Temptation: checked, type: "Pereza", risk: 2, intensity: 3, won: true
3. Submit

**Expected DB result:**
```sql
SELECT * FROM fact_habitos_diarios WHERE date_key = TODAY;
-- Should have:
-- - hora_registro_tarde: [timestamp]
-- - agua_tomada_tarde: true
-- - comida_bien_tarde: true
-- - micro_reset_realizado: true
-- - reflexion_tarde: "Progressing well"

SELECT * FROM dim_estado_emocional 
WHERE user_id = 'xxx' AND momento_dia = 'Tarde';
-- Should exist

SELECT * FROM dim_estudio 
WHERE user_id = 'xxx' AND momento_dia = 'Tarde';
-- Should have JavaScript

SELECT * FROM dim_tentacion 
WHERE user_id = 'xxx' AND momento_dia = 'Tarde';
-- Should have Pereza with gano_tentacion = true
```

### Test 3: Register Night
1. Go to `/noche`
2. Fill:
   - Night routine: all checked
   - Order of room: 4
   - Gratitude 1: "My family"
   - Gratitude 2: "Good health"
   - Gratitude 3: "Opportunities to grow"
   - Identity: 4
   - Emotional stability: 4
   - Who were you today: "Disciplined and focused"
3. Submit

**Expected DB result:**
```sql
SELECT * FROM fact_habitos_diarios WHERE date_key = TODAY;
-- Should have:
-- - hora_registro_noche: [timestamp]
-- - quien_fuiste_hoy: "Disciplined and focused"

SELECT * FROM dim_gratitud 
WHERE user_id = 'xxx' AND date_key = TODAY
ORDER BY orden;
-- Should have 3 rows:
-- 1. "My family"
-- 2. "Good health"
-- 3. "Opportunities to grow"
```

### Test 4: Multiple Exercises Same Day
1. Go to `/ejercicio`
2. Register: Running, 5km, 30 minutes, RPE 7
3. Submit
4. Go back to `/ejercicio`
5. Register: Weights, chest, 40 minutes, RPE 8
6. Submit

**Expected DB result:**
```sql
SELECT COUNT(*) FROM fact_ejercicios 
WHERE fact_id = (SELECT fact_id FROM fact_habitos_diarios WHERE date_key = TODAY);
-- Should return: 2

SELECT e.tipo, e.distancia_km FROM dim_ejercicio e
JOIN fact_ejercicios fe ON fe.ejercicio_key = e.ejercicio_key
WHERE fe.fact_id = (SELECT fact_id FROM fact_habitos_diarios WHERE date_key = TODAY)
ORDER BY fe.orden;
-- Should show both: "Correr", "Pesas"
```

### Test 5: BI Views
```sql
-- Test v_metas_cumplimiento
SELECT * FROM v_metas_cumplimiento 
WHERE user_id = 'xxx' AND date_key = TODAY;

-- Test v_gratitud_analysis
SELECT * FROM v_gratitud_analysis 
WHERE user_id = 'xxx';

-- Test v_fact_registros_diarios
SELECT * FROM v_fact_registios_diarios 
WHERE user_id = 'xxx' AND date_key = TODAY;
```

---

## 🐛 Troubleshooting

### Error: "Relation 'dim_gratitud' does not exist"
**Cause:** SQL script didn't execute fully
**Solution:** 
1. Check Supabase SQL Editor for errors
2. Re-execute DATABASE_SCHEMA_V3.sql
3. Verify no syntax errors

### Error: "Violates constraint 'unique_user_date'"
**Cause:** You're trying to create 2 facts for same day
**Solution:** This is by design - one fact per day. Edit the existing fact instead.

### Error: "RLS policy denies SELECT"
**Cause:** User is trying to access other user's data
**Solution:** This is correct - RLS working as intended

### Fields not showing in fact table
**Cause:** JavaScript page isn't using updateFact correctly
**Solution:** 
1. Verify updateFact.js is updated
2. Check browser console for errors
3. Verify field names match exactly (case-sensitive)

---

## 📋 Pre-Production Checklist

- [ ] Executed DATABASE_SCHEMA_V3.sql
- [ ] Verified all 8 new tables exist
- [ ] Verified all 12 new columns in fact_habitos_diarios
- [ ] Verified 3 RLS policies per table
- [ ] Verified reference data populated (7 pecados, 10 triggers)
- [ ] Verified all 4 views created
- [ ] Updated all 7 pages (manana, tarde, noche, ejercicio, estudio, lectura, tentacion)
- [ ] Tested morning registration
- [ ] Tested afternoon registration
- [ ] Tested night registration
- [ ] Tested gratitude persistence
- [ ] Tested multiple exercises same day
- [ ] Tested BI views return results
- [ ] Deployed to production

---

## 📞 Support

If issues arise:

1. Check Supabase logs for SQL errors
2. Review browser console for JS errors
3. Query `information_schema` to verify schema
4. Test individual SQL queries in SQL Editor
5. Review file diffs before/after deployment

---

## ✅ Success Indicators

You'll know V3 is working when:

- ✅ All morning fields save (reflection, goals, focus word)
- ✅ All afternoon fields save (water, food, micro-reset, reflection)
- ✅ All 3 gratitudes save in dim_gratitud
- ✅ Multiple exercises appear in fact_ejercicios
- ✅ BI views return data
- ✅ fact_habitos_diarios has unique (user_id, date_key)
- ✅ All timestamps populated correctly

---

**Deployment Status:** Ready  
**Estimated Time:** 15 minutes  
**Risk Level:** Low (backwards compatible)


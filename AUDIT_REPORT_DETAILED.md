# REPORTE EXHAUSTIVO DE USO REAL DEL ESQUEMA SUPABASE
## LIFETRACKER - Análisis Basado 100% en Código

**Fecha:** 2025-01-27  
**Metodología:** Análisis estático de código fuente  
**Base de datos:** Supabase/PostgreSQL  
**Alcance:** Todas las rutas, componentes, librerías y helpers

---

## 1. TABLAS USADAS VS NO USADAS

### 1.1 DIMENSIONES (dim_*)

#### dim_ambiente
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:** `app/noche/page.js` (línea 74)
- **Columnas usadas en escritura:** user_id, orden_cuarto, orden_escritorio, orden_mochila, ruido_ambiental, limpieza_personal, sensacion_espacial
- **Columnas definidas pero NO usadas:** ambiente_key, created_at
- **Estado:** Write-only (solo inserción, nunca lectura)

#### dim_date
- **Se lee:** NO
- **Se escribe:** NO
- **Archivos que usan:** NINGUNO
- **Columnas definidas:** date_key, fecha, dia_semana, nombre_dia, semana, mes, anio, tipo_dia
- **Estado:** TABLA MUERTA (definida pero nunca referenciada)

#### dim_dia_especial
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:** `app/manana/page.js` (línea 104)
- **Columnas usadas en escritura:** user_id, tipo, descripcion
- **Columnas definidas pero NO usadas:** dia_especial_key, created_at
- **Estado:** Write-only

#### dim_ejercicio
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:** 
  - `app/manana/page.js` (línea 178 - cuando es "Descanso" o "No haré ejercicio")
  - `app/ejercicio/page.js` (línea 95)
- **Columnas usadas en escritura:** user_id, momento_dia, tipo, grupo_muscular, distancia_km, pace_min_km, duracion_min, intensidad, razon_no_ejercicio, descripcion, ejercicio_plan_key
- **Columnas definidas pero NO usadas:** ejercicio_key, created_at
- **Estado:** Write-only

#### dim_ejercicio_planeado
- **Se lee:** SÍ
- **Se escribe:** SÍ
- **Archivos que leen:** `app/ejercicio/page.js` (línea 50-51) - select plan_key, tipo, grupo_muscular, distancia_km_planeada, notas
- **Archivos que escriben:** `app/manana/page.js` (línea 187)
- **Columnas usadas en lectura:** plan_key, tipo, grupo_muscular, distancia_km_planeada, notas
- **Columnas usadas en escritura:** user_id, date_key, tipo, grupo_muscular, distancia_km_planeada, duracion_estimada_min, notas
- **Columnas definidas pero NO usadas:** created_at
- **Estado:** Lectura y escritura (única dimensión que se lee activamente)

#### dim_espiritual
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:**
  - `app/manana/page.js` (línea 90)
  - `app/noche/page.js` (línea 126)
  - `app/lectura/page.js` (línea 60)
- **Columnas usadas en escritura:** user_id, momento_dia, practica, libro_biblia, capitulo, versiculos_leidos, tiempo_min, insight_espiritual
- **Columnas definidas pero NO usadas:** espiritualidad_key, created_at
- **Estado:** Write-only

#### dim_estado_emocional
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:**
  - `app/manana/page.js` (línea 78)
  - `app/tarde/page.js` (línea 75)
- **Columnas usadas en escritura:** user_id, momento_dia, ansiedad, enfoque, tranquilidad, motivacion, animo, ira, tristeza, estabilidad_emocional, descripcion
- **Columnas definidas pero NO usadas:** estado_emocional_key, euforia, created_at
- **Estado:** Write-only

#### dim_estudio
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:**
  - `app/tarde/page.js` (línea 102)
  - `app/estudio/page.js` (línea 59)
  - `app/lectura/page.js` (línea 94 - para lectura general)
- **Columnas usadas en escritura:** user_id, momento_dia, tema, categoria, tiempo_min, profundidad, material_usado, insight_aprendido
- **Columnas definidas pero NO usadas:** estudio_key, created_at
- **Estado:** Write-only

#### dim_gratitud
- **Se lee:** SÍ (parcial)
- **Se escribe:** SÍ
- **Archivos que leen:** `app/analytics/page.js` (línea 275-276) - select date_key solamente
- **Archivos que escriben:** `app/noche/page.js` (línea 95)
- **Columnas usadas en lectura:** date_key (solo para contar días únicos)
- **Columnas usadas en escritura:** user_id, date_key, orden, descripcion
- **Columnas definidas pero NO usadas:** gratitud_key, created_at, updated_at, deleted_at
- **Estado:** Lectura mínima (solo para contar), escritura completa

#### dim_interacciones
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:** `app/noche/page.js` (líneas 146, 160)
- **Columnas usadas en escritura:** user_id, momento_dia, tipo_interaccion, intensidad, descripcion, emocion_predominante, hora_inicio, duracion_minutos
- **Columnas definidas pero NO usadas:** interaccion_key, categoria, created_at
- **Estado:** Write-only

#### dim_metas
- **Se lee:** SÍ
- **Se escribe:** SÍ
- **Archivos que leen:** 
  - `app/noche/page.js` (línea 222-223) - select meta_key, tipo
  - `app/analytics/page.js` (línea 269-270) - select date_key, cumplida
- **Archivos que escriben:**
  - `app/manana/page.js` (líneas 114, 124, 134)
  - `app/noche/page.js` (línea 233) - update cumplida
- **Columnas usadas en lectura:** meta_key, tipo, date_key, cumplida
- **Columnas usadas en escritura:** user_id, date_key, tipo, descripcion, orden, cumplida
- **Columnas definidas pero NO usadas:** reflexion, created_at, updated_at, deleted_at
- **Estado:** Lectura y escritura activa

#### dim_rutina
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:**
  - `app/manana/page.js` (línea 66)
  - `app/noche/page.js` (línea 61)
- **Columnas usadas en escritura:** user_id, tipo_rutina, despertar_a_hora, no_telefono, tender_cama, oracion, ejercicio, ducha, planeacion, cierre_redes, ropa_lista, orden_espacio
- **Columnas definidas pero NO usadas:** rutina_key, dormir_a_hora, score_rutina, created_at
- **Estado:** Write-only

#### dim_scripture_readings
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:** `app/lectura/page.js` (línea 72)
- **Columnas usadas en escritura:** user_id, date_key, libro, capitulo, versiculos, total_versiculos, insight
- **Columnas definidas pero NO usadas:** reading_key, created_at
- **Estado:** Write-only, REDUNDANTE con dim_espiritual

#### dim_tentacion
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que escriben:**
  - `app/tarde/page.js` (línea 142)
  - `app/tentacion/page.js` (línea 108)
- **Columnas usadas en escritura:** user_id, momento_dia, fuente_registro, hora_aproximada, trigger_principal, pecado_principal, nivel_riesgo, contexto, gano_tentacion, descripcion, categoria
- **Columnas definidas pero NO usadas:** tentacion_key, created_at
- **Estado:** Write-only

---

### 1.2 HECHOS (fact_*)

#### fact_ejercicios
- **Se lee:** NO (solo count)
- **Se escribe:** SÍ
- **Archivos que usan:** `app/ejercicio/page.js` (líneas 99, 107)
- **Columnas usadas:** fact_id, ejercicio_key, orden (escritura); count solamente (lectura)
- **Estado:** Write-only (solo inserción, count para calcular orden)

#### fact_estudios
- **Se lee:** NO (solo count)
- **Se escribe:** SÍ
- **Archivos que usan:**
  - `app/tarde/page.js` (líneas 114, 121)
  - `app/estudio/page.js` (línea 72)
- **Columnas usadas:** fact_id, estudio_key, orden (escritura); count solamente (lectura)
- **Estado:** Write-only

#### fact_gratitudes
- **Se lee:** NO (solo count)
- **Se escribe:** SÍ
- **Archivos que usan:** `app/noche/page.js` (líneas 177, 183)
- **Columnas usadas:** fact_id, gratitud_key, orden (escritura); count solamente (lectura)
- **Estado:** Write-only

#### fact_habitos_diarios
- **Se lee:** SÍ
- **Se escribe:** SÍ
- **Archivos que leen:**
  - `app/dia/page.js` (línea 35) - select *
  - `app/analytics/page.js` (línea 246) - select fact_id, date_key, sueno_horas, energia_diaria, ansiedad, enfoque, motivacion, claridad_mental, rutina_manana_score, rutina_noche_score, agua_tomada_manana, agua_tomada_tarde, micro_reset_realizado
  - `lib/getOrCreateFact.js` (línea 12) - select fact_id
- **Archivos que escriben:**
  - `app/manana/page.js` (vía updateFact)
  - `app/tarde/page.js` (vía updateFact)
  - `app/noche/page.js` (vía updateFact)
  - `app/ejercicio/page.js` (línea 111) - update ejercicio_key
  - `app/estudio/page.js` (línea 76) - update estudio_key
  - `app/lectura/page.js` (líneas 89, 105) - update espiritualidad_key, estudio_key
  - `app/tentacion/page.js` (línea 116) - update tentacion_key
  - `lib/getOrCreateFact.js` (línea 24) - insert
  - `lib/updateFact.js` (línea 18) - update
- **Columnas usadas en lectura:** fact_id, user_id, date_key, sueno_horas, calidad_sueno, energia_diaria, ansiedad, enfoque, motivacion, claridad_mental, rutina_manana_score, rutina_noche_score, agua_tomada_manana, agua_tomada_tarde, micro_reset_realizado, identidad_dia, notas_dia, created_at, updated_at
- **Columnas usadas en escritura:** fact_id, user_id, date_key, sueno_horas, calidad_sueno, rutina_manana_key, rutina_noche_key, estado_emocional_key, estado_emocional_manana_key, estado_emocional_tarde_key, hora_registro_manana, hora_registro_tarde, hora_registro_noche, ansiedad, enfoque, energia_diaria, claridad_mental, motivacion, reflexion_matutina, reflexion_tarde, meta_principal_dia, meta_secundaria_dia, palabra_enfoque_dia, agua_tomada_manana, agua_tomada_tarde, comida_bien_tarde, micro_reset_realizado, movimiento_matutino, silencio_manana, ejercicio_key, ejercicio_plan_key, estudio_key, tentacion_key, espiritualidad_key, ambiente_key, dia_especial_key, interacciones_pos, interacciones_neg, identidad_dia, estabilidad_emocional, desvio_mayor, causa_desvio, accion_recovery, notas_dia, quien_fuiste_hoy, estres, updated_at, updated_by, gratitud_key, descripcion_emocional_tarde
- **Columnas definidas pero NO usadas:** deleted_at, is_deleted
- **Estado:** Tabla central, lectura y escritura activa

#### fact_interacciones
- **Se lee:** NO (solo count)
- **Se escribe:** SÍ
- **Archivos que usan:** `app/noche/page.js` (líneas 195, 203)
- **Columnas usadas:** fact_id, interaccion_key, orden (escritura); count solamente (lectura)
- **Estado:** Write-only

#### fact_metas
- **Se lee:** NO
- **Se escribe:** SÍ
- **Archivos que usan:** `app/manana/page.js` (línea 222)
- **Columnas usadas:** fact_id, meta_key, tipo, orden
- **Estado:** Write-only

#### fact_practicas_espirituales
- **Se lee:** NO (solo count)
- **Se escribe:** SÍ
- **Archivos que usan:**
  - `app/manana/page.js` (líneas 204, 211)
  - `app/noche/page.js` (línea 135)
  - `app/lectura/page.js` (línea 84)
- **Columnas usadas:** fact_id, espiritualidad_key, momento_dia, orden (escritura); count solamente (lectura)
- **Estado:** Write-only

#### fact_tentaciones
- **Se lee:** NO (solo count)
- **Se escribe:** SÍ
- **Archivos que usan:**
  - `app/tarde/page.js` (líneas 158, 166)
  - `app/tentacion/page.js` (línea 112)
- **Columnas usadas:** fact_id, tentacion_key, orden (escritura); count solamente (lectura)
- **Estado:** Write-only

---

### 1.3 REFERENCIAS (ref_*)

#### ref_tipos_pecado
- **Se lee:** SÍ
- **Se escribe:** NO
- **Archivos que leen:** `lib/referenceData.js` (línea 32) - select nombre
- **Columnas usadas en lectura:** nombre solamente
- **Columnas definidas pero NO usadas:** id, descripcion, created_at
- **Estado:** Lectura con fallback hardcodeado

#### ref_triggers
- **Se lee:** SÍ
- **Se escribe:** NO
- **Archivos que leen:** `lib/referenceData.js` (línea 33) - select nombre, categoria
- **Columnas usadas en lectura:** nombre, categoria
- **Columnas definidas pero NO usadas:** id, created_at
- **Estado:** Lectura con fallback hardcodeado

---

### 1.4 OPERACIONALES

#### journal_entries
- **Se lee:** SÍ
- **Se escribe:** SÍ
- **Archivos que leen:** `app/analytics/page.js` (línea 281) - select id, date_key, title, categoria, emocion_predominante
- **Archivos que escriben:** `app/journal/page.js` (línea 54)
- **Columnas usadas en lectura:** id, date_key, title, categoria, emocion_predominante
- **Columnas usadas en escritura:** user_id, date_key, title, entry, categoria, emocion_predominante, tags
- **Columnas definidas pero NO usadas:** created_at, updated_at, es_privado
- **Estado:** Lectura y escritura activa

---

### 1.5 VISTAS (v_*)

#### v_dashboard_today
- **Se lee:** SÍ
- **Se escribe:** NO (vista)
- **Archivos que leen:** `app/dashboard/page.js` (línea 54) - select *
- **Columnas usadas:** Todas (select *)
- **Estado:** Vista activamente usada

#### v_ejercicio_compliance
- **Se lee:** NO
- **Se escribe:** NO (vista)
- **Archivos que usan:** NINGUNO
- **Estado:** VISTA MUERTA

#### v_fact_registros_diarios
- **Se lee:** SÍ (parcial)
- **Se escribe:** NO (vista)
- **Archivos que leen:** `app/analytics/page.js` (línea 255) - select date_key, num_ejercicios, num_estudios, num_tentaciones, num_practicas_espirituales
- **Columnas usadas:** date_key, num_ejercicios, num_estudios, num_tentaciones, num_practicas_espirituales
- **Columnas definidas pero NO usadas:** fact_id, user_id, num_gratitudes, num_metas, created_at, updated_at
- **Estado:** Vista parcialmente usada

#### v_gratitud_analysis
- **Se lee:** NO
- **Se escribe:** NO (vista)
- **Archivos que usan:** NINGUNO
- **Estado:** VISTA MUERTA

#### v_metas_cumplimiento
- **Se lee:** NO
- **Se escribe:** NO (vista)
- **Archivos que usan:** NINGUNO
- **Estado:** VISTA MUERTA

#### v_scripture_stats
- **Se lee:** NO
- **Se escribe:** NO (vista)
- **Archivos que usan:** NINGUNO
- **Estado:** VISTA MUERTA

#### v_tentaciones_por_momento
- **Se lee:** NO
- **Se escribe:** NO (vista)
- **Archivos que usan:** NINGUNO
- **Estado:** VISTA MUERTA

#### v_timeline_emocional_dia
- **Se lee:** SÍ (parcial)
- **Se escribe:** NO (vista)
- **Archivos que leen:** `app/analytics/page.js` (línea 262) - select date_key, ansiedad, enfoque, motivacion, animo
- **Columnas usadas:** date_key, ansiedad, enfoque, motivacion, animo
- **Columnas definidas pero NO usadas:** user_id, momento, orden, tranquilidad, ira, tristeza, timestamp_registro
- **Estado:** Vista parcialmente usada

---

## 2. RELACIONES REALMENTE UTILIZADAS

### 2.1 Foreign Keys en fact_habitos_diarios

#### fact_habitos_diarios.ejercicio_key → dim_ejercicio.ejercicio_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/ejercicio/page.js:111`, `app/manana/page.js:184`, pero nunca se hace JOIN para leer datos del ejercicio
- **Problema:** Duplicado con fact_ejercicios

#### fact_habitos_diarios.estado_emocional_key → dim_estado_emocional.estado_emocional_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/manana/page.js:149`, `app/tarde/page.js:88`, pero los valores emocionales se leen directamente desde fact_habitos_diarios (ansiedad, enfoque, etc.)
- **Problema:** Redundante - datos denormalizados en fact

#### fact_habitos_diarios.tentacion_key → dim_tentacion.tentacion_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/tarde/page.js:155`, `app/tentacion/page.js:116`, pero nunca se hace JOIN
- **Problema:** Duplicado con fact_tentaciones

#### fact_habitos_diarios.espiritualidad_key → dim_espiritual.espiritualidad_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/manana/page.js:171`, `app/noche/page.js:132`, `app/lectura/page.js:90`, pero nunca se hace JOIN
- **Problema:** Duplicado con fact_practicas_espirituales

#### fact_habitos_diarios.ambiente_key → dim_ambiente.ambiente_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/noche/page.js:121`, pero nunca se lee

#### fact_habitos_diarios.rutina_manana_key → dim_rutina.rutina_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/manana/page.js:148`, pero nunca se lee

#### fact_habitos_diarios.rutina_noche_key → dim_rutina.rutina_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/noche/page.js:107`, pero nunca se lee

#### fact_habitos_diarios.estudio_key → dim_estudio.estudio_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/tarde/page.js:111`, `app/estudio/page.js:76`, `app/lectura/page.js:106`, pero nunca se hace JOIN
- **Problema:** Duplicado con fact_estudios

#### fact_habitos_diarios.dia_especial_key → dim_dia_especial.dia_especial_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/manana/page.js:167`, pero nunca se lee

#### fact_habitos_diarios.gratitud_key → dim_gratitud.gratitud_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe pero nunca se lee directamente (se usa fact_gratitudes)

#### fact_habitos_diarios.ejercicio_plan_key → dim_ejercicio_planeado.plan_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/manana/page.js:196`, pero nunca se lee

### 2.2 Foreign Keys en tablas fact_* (tablas de unión)

#### fact_ejercicios.ejercicio_key → dim_ejercicio.ejercicio_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta en `app/ejercicio/page.js:108`, pero nunca se consulta esta tabla

#### fact_ejercicios.fact_id → fact_habitos_diarios.fact_id
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta pero nunca se consulta

#### fact_estudios.estudio_key → dim_estudio.estudio_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta en `app/tarde/page.js:122`, `app/estudio/page.js:73`, pero nunca se consulta

#### fact_estudios.fact_id → fact_habitos_diarios.fact_id
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta pero nunca se consulta

#### fact_tentaciones.tentacion_key → dim_tentacion.tentacion_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta en `app/tarde/page.js:167`, `app/tentacion/page.js:113`, pero nunca se consulta

#### fact_tentaciones.fact_id → fact_habitos_diarios.fact_id
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta pero nunca se consulta

#### fact_practicas_espirituales.espiritualidad_key → dim_espiritual.espiritualidad_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta en `app/manana/page.js:212`, `app/noche/page.js:136`, `app/lectura/page.js:85`, pero nunca se consulta

#### fact_practicas_espirituales.fact_id → fact_habitos_diarios.fact_id
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta pero nunca se consulta

#### fact_gratitudes.gratitud_key → dim_gratitud.gratitud_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta en `app/noche/page.js:184`, pero nunca se consulta

#### fact_gratitudes.fact_id → fact_habitos_diarios.fact_id
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta pero nunca se consulta

#### fact_metas.meta_key → dim_metas.meta_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta en `app/manana/page.js:223`, pero nunca se consulta

#### fact_metas.fact_id → fact_habitos_diarios.fact_id
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta pero nunca se consulta

#### fact_interacciones.interaccion_key → dim_interacciones.interaccion_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta en `app/noche/page.js:204`, pero nunca se consulta

#### fact_interacciones.fact_id → fact_habitos_diarios.fact_id
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se inserta pero nunca se consulta

### 2.3 Foreign Keys en dimensiones

#### dim_ejercicio.ejercicio_plan_key → dim_ejercicio_planeado.plan_key
- **Estado:** Solo escritura (nunca se lee)
- **Evidencia:** Se escribe en `app/ejercicio/page.js:92`, pero nunca se consulta para validar cumplimiento

---

## 3. FLUJO COMPLETO DEL DATO POR MÓDULO

### 3.1 Módulo: Mañana (`app/manana/page.js`)

**Tablas que toca:**
1. `fact_habitos_diarios` (getOrCreateFact, updateFact)
2. `dim_rutina` (upsertDimension)
3. `dim_estado_emocional` (upsertDimension)
4. `dim_espiritual` (upsertDimension - condicional)
5. `dim_dia_especial` (upsertDimension - condicional)
6. `dim_metas` (upsertDimension - hasta 3 metas)
7. `dim_ejercicio` (upsertDimension - si es "Descanso" o "No haré ejercicio")
8. `dim_ejercicio_planeado` (upsertDimension - si se planea ejercicio)
9. `fact_practicas_espirituales` (insert - si hay espiritualidad)
10. `fact_metas` (insert - si hay metas)

**Columnas que actualiza en fact_habitos_diarios:**
- sueno_horas, calidad_sueno
- rutina_manana_key, estado_emocional_key, estado_emocional_manana_key
- hora_registro_manana
- ansiedad, enfoque, energia_diaria, claridad_mental, motivacion
- reflexion_matutina
- meta_principal_dia, meta_secundaria_dia, palabra_enfoque_dia
- agua_tomada_manana, movimiento_matutino, silencio_manana
- dia_especial_key (condicional)
- espiritualidad_key (condicional)
- ejercicio_key (si es descanso/no ejercicio)
- ejercicio_plan_key (si se planea ejercicio)

**Columnas que consulta:**
- Ninguna (solo escribe)

**Relaciones que activa:**
- fact_habitos_diarios → dim_rutina (rutina_manana_key) - solo escritura
- fact_habitos_diarios → dim_estado_emocional (estado_emocional_key) - solo escritura
- fact_habitos_diarios → dim_espiritual (espiritualidad_key) - solo escritura
- fact_habitos_diarios → dim_dia_especial (dia_especial_key) - solo escritura
- fact_habitos_diarios → dim_ejercicio (ejercicio_key) - solo escritura
- fact_habitos_diarios → dim_ejercicio_planeado (ejercicio_plan_key) - solo escritura
- fact_practicas_espirituales → dim_espiritual - solo escritura
- fact_metas → dim_metas - solo escritura

**Relaciones que ignora:**
- Todas las relaciones se escriben pero nunca se leen

### 3.2 Módulo: Tarde (`app/tarde/page.js`)

**Tablas que toca:**
1. `fact_habitos_diarios` (getOrCreateFact, updateFact)
2. `dim_estado_emocional` (upsertDimension)
3. `dim_estudio` (upsertDimension - condicional)
4. `dim_tentacion` (upsertDimension - condicional)
5. `fact_estudios` (insert - condicional)
6. `fact_tentaciones` (insert - condicional)

**Columnas que actualiza en fact_habitos_diarios:**
- estado_emocional_key, estado_emocional_tarde_key
- hora_registro_tarde
- ansiedad, enfoque, estres
- reflexion_tarde
- agua_tomada_tarde, comida_bien_tarde, micro_reset_realizado
- estudio_key (condicional)
- tentacion_key (condicional)

**Columnas que consulta:**
- Ninguna (solo escribe)

**Relaciones que activa:**
- fact_habitos_diarios → dim_estado_emocional (estado_emocional_key) - solo escritura
- fact_habitos_diarios → dim_estudio (estudio_key) - solo escritura
- fact_habitos_diarios → dim_tentacion (tentacion_key) - solo escritura
- fact_estudios → dim_estudio - solo escritura
- fact_tentaciones → dim_tentacion - solo escritura

**Relaciones que ignora:**
- Todas las relaciones se escriben pero nunca se leen

### 3.3 Módulo: Noche (`app/noche/page.js`)

**Tablas que toca:**
1. `fact_habitos_diarios` (getOrCreateFact, updateFact)
2. `dim_rutina` (upsertDimension)
3. `dim_ambiente` (upsertDimension - condicional)
4. `dim_gratitud` (upsertDimension - hasta 3)
5. `dim_espiritual` (upsertDimension - condicional)
6. `dim_interacciones` (upsertDimension - hasta 2: positiva y negativa)
7. `dim_metas` (select, update - para marcar cumplimiento)
8. `fact_practicas_espirituales` (insert - condicional)
9. `fact_gratitudes` (insert - condicional)
10. `fact_interacciones` (insert - condicional)

**Columnas que actualiza en fact_habitos_diarios:**
- rutina_noche_key
- hora_registro_noche
- interacciones_pos, interacciones_neg
- identidad_dia, estabilidad_emocional
- desvio_mayor, causa_desvio, accion_recovery
- notas_dia, quien_fuiste_hoy
- ambiente_key (condicional)
- espiritualidad_key (condicional)

**Columnas que consulta:**
- dim_metas: meta_key, tipo (para buscar y actualizar cumplida)

**Relaciones que activa:**
- fact_habitos_diarios → dim_rutina (rutina_noche_key) - solo escritura
- fact_habitos_diarios → dim_ambiente (ambiente_key) - solo escritura
- fact_habitos_diarios → dim_espiritual (espiritualidad_key) - solo escritura
- fact_practicas_espirituales → dim_espiritual - solo escritura
- fact_gratitudes → dim_gratitud - solo escritura
- fact_interacciones → dim_interacciones - solo escritura
- dim_metas: lectura y actualización de cumplida

**Relaciones que ignora:**
- La mayoría de relaciones se escriben pero nunca se leen

### 3.4 Módulo: Ejercicio (`app/ejercicio/page.js`)

**Tablas que toca:**
1. `fact_habitos_diarios` (getOrCreateFact, update)
2. `dim_ejercicio_planeado` (select - para mostrar planes del día)
3. `dim_ejercicio` (upsertDimension)
4. `fact_ejercicios` (insert)

**Columnas que actualiza en fact_habitos_diarios:**
- ejercicio_key

**Columnas que consulta:**
- dim_ejercicio_planeado: plan_key, tipo, grupo_muscular, distancia_km_planeada, notas

**Relaciones que activa:**
- fact_habitos_diarios → dim_ejercicio (ejercicio_key) - solo escritura
- fact_ejercicios → dim_ejercicio - solo escritura
- dim_ejercicio → dim_ejercicio_planeado (ejercicio_plan_key) - solo escritura

**Relaciones que ignora:**
- La relación ejercicio_plan_key nunca se lee para validar cumplimiento

### 3.5 Módulo: Estudio (`app/estudio/page.js`)

**Tablas que toca:**
1. `fact_habitos_diarios` (getOrCreateFact, update)
2. `dim_estudio` (upsertDimension)
3. `fact_estudios` (insert)

**Columnas que actualiza en fact_habitos_diarios:**
- estudio_key

**Columnas que consulta:**
- Ninguna (solo escribe)

**Relaciones que activa:**
- fact_habitos_diarios → dim_estudio (estudio_key) - solo escritura
- fact_estudios → dim_estudio - solo escritura

**Relaciones que ignora:**
- Todas las relaciones se escriben pero nunca se leen

### 3.6 Módulo: Lectura (`app/lectura/page.js`)

**Tablas que toca:**
1. `fact_habitos_diarios` (getOrCreateFact, update)
2. `dim_espiritual` (upsertDimension - si es lectura bíblica)
3. `dim_scripture_readings` (upsertDimension - si es lectura bíblica)
4. `dim_estudio` (upsertDimension - si es lectura general)
5. `fact_practicas_espirituales` (insert - si es lectura bíblica)

**Columnas que actualiza en fact_habitos_diarios:**
- espiritualidad_key (si es bíblica)
- estudio_key (si es general)

**Columnas que consulta:**
- Ninguna (solo escribe)

**Relaciones que activa:**
- fact_habitos_diarios → dim_espiritual (espiritualidad_key) - solo escritura
- fact_habitos_diarios → dim_estudio (estudio_key) - solo escritura
- fact_practicas_espirituales → dim_espiritual - solo escritura

**Relaciones que ignora:**
- Todas las relaciones se escriben pero nunca se leen

**PROBLEMA CRÍTICO:** Lectura bíblica se registra en 3 lugares:
1. dim_espiritual (con practica='Lectura')
2. dim_scripture_readings (tabla dedicada)
3. fact_practicas_espirituales (tabla de unión)

### 3.7 Módulo: Tentación (`app/tentacion/page.js`)

**Tablas que toca:**
1. `fact_habitos_diarios` (getOrCreateFact, update)
2. `dim_tentacion` (upsertDimension)
3. `fact_tentaciones` (insert)

**Columnas que actualiza en fact_habitos_diarios:**
- tentacion_key

**Columnas que consulta:**
- Ninguna (solo escribe)

**Relaciones que activa:**
- fact_habitos_diarios → dim_tentacion (tentacion_key) - solo escritura
- fact_tentaciones → dim_tentacion - solo escritura

**Relaciones que ignora:**
- Todas las relaciones se escriben pero nunca se leen

### 3.8 Módulo: Journal (`app/journal/page.js`)

**Tablas que toca:**
1. `journal_entries` (insert)

**Columnas que actualiza:**
- user_id, date_key, title, entry, categoria, emocion_predominante, tags

**Columnas que consulta:**
- Ninguna (solo escribe)

**Relaciones que activa:**
- Ninguna (tabla independiente)

### 3.9 Módulo: Dashboard (`app/dashboard/page.js`)

**Tablas que toca:**
1. `v_dashboard_today` (select *)

**Columnas que consulta:**
- Todas las columnas de la vista (select *)

**Relaciones que activa:**
- Ninguna (usa vista pre-agregada)

### 3.10 Módulo: Analytics (`app/analytics/page.js`)

**Tablas que toca:**
1. `fact_habitos_diarios` (select múltiples columnas)
2. `v_fact_registros_diarios` (select contadores)
3. `v_timeline_emocional_dia` (select emociones)
4. `dim_metas` (select date_key, cumplida)
5. `dim_gratitud` (select date_key)
6. `journal_entries` (select id, date_key, title, categoria, emocion_predominante)

**Columnas que consulta:**
- fact_habitos_diarios: fact_id, date_key, sueno_horas, energia_diaria, ansiedad, enfoque, motivacion, claridad_mental, rutina_manana_score, rutina_noche_score, agua_tomada_manana, agua_tomada_tarde, micro_reset_realizado
- v_fact_registros_diarios: date_key, num_ejercicios, num_estudios, num_tentaciones, num_practicas_espirituales
- v_timeline_emocional_dia: date_key, ansiedad, enfoque, motivacion, animo
- dim_metas: date_key, cumplida
- dim_gratitud: date_key (solo para contar días)
- journal_entries: id, date_key, title, categoria, emocion_predominante

**Relaciones que activa:**
- Ninguna (consultas directas sin JOINs)

---

## 4. TABLAS REDUNDANTES O QUE SE PUEDEN CONSOLIDAR

### 4.1 Duplicación de Lectura Bíblica

**Problema:** Cuando se registra lectura bíblica (`app/lectura/page.js`), se inserta en 3 lugares:
1. `dim_espiritual` (línea 60) - con practica='Lectura', libro_biblia, capitulo, versiculos_leidos
2. `dim_scripture_readings` (línea 72) - libro, capitulo, versiculos, total_versiculos, insight
3. `fact_practicas_espirituales` (línea 84) - tabla de unión

**Evidencia:** `app/lectura/page.js` líneas 59-91

**Recomendación:** Eliminar `dim_scripture_readings` y usar solo `dim_espiritual` con practica='Lectura'. La vista `v_scripture_stats` que depende de `dim_scripture_readings` nunca se usa.

### 4.2 Duplicación de Estado Emocional

**Problema:** Los valores emocionales se guardan en dos lugares:
1. `dim_estado_emocional` (dimensión) - ansiedad, enfoque, tranquilidad, motivacion, animo, ira, tristeza, estabilidad_emocional
2. `fact_habitos_diarios` (campos directos) - ansiedad, enfoque, motivacion, claridad_mental, estabilidad_emocional

**Evidencia:** 
- Se escribe en `dim_estado_emocional` en `app/manana/page.js:78` y `app/tarde/page.js:75`
- Se escribe directamente en `fact_habitos_diarios` en `app/manana/page.js:152-156` y `app/tarde/page.js:91-92`
- Se lee desde `fact_habitos_diarios` en `app/analytics/page.js:248` y `app/dashboard/page.js` (vía vista)

**Recomendación:** Eliminar campos directos de `fact_habitos_diarios` y leer siempre desde `dim_estado_emocional` vía JOIN, O eliminar `dim_estado_emocional` y mantener solo campos directos.

### 4.3 Duplicación de Ejercicio

**Problema:** Ejercicio se guarda en dos lugares:
1. `fact_habitos_diarios.ejercicio_key` (campo directo)
2. `fact_ejercicios` (tabla de unión)

**Evidencia:**
- Se escribe `ejercicio_key` en `app/ejercicio/page.js:111`
- Se inserta en `fact_ejercicios` en `app/ejercicio/page.js:108`
- Nunca se lee ninguna de las dos

**Recomendación:** Eliminar `ejercicio_key` directo y usar solo `fact_ejercicios` para soportar múltiples ejercicios por día.

### 4.4 Duplicación de Metas

**Problema:** Metas se guardan en tres lugares:
1. `dim_metas` (dimensión) - descripcion, tipo, cumplida
2. `fact_metas` (tabla de unión)
3. `fact_habitos_diarios` (campos de texto directos) - meta_principal_dia, meta_secundaria_dia, palabra_enfoque_dia

**Evidencia:**
- Se escribe en `dim_metas` en `app/manana/page.js:114,124,134`
- Se escribe en `fact_metas` en `app/manana/page.js:222`
- Se escribe texto directo en `fact_habitos_diarios` en `app/manana/page.js:158-160`

**Recomendación:** Eliminar campos de texto directo de `fact_habitos_diarios` y leer siempre desde `dim_metas` vía `fact_metas`.

### 4.5 Campos Calculados Nunca Calculados

**Problema:** Existen campos y funciones para calcular scores pero nunca se usan:
1. `dim_rutina.score_rutina` - definido pero nunca se escribe
2. `fact_habitos_diarios.rutina_manana_score` y `rutina_noche_score` - se leen pero nunca se escriben
3. Función `calculateRoutineScore` en `lib/helpers.js:29` - definida pero nunca se llama

**Evidencia:**
- `lib/helpers.js:29-33` define la función
- `app/manana/page.js:66-75` crea dim_rutina pero no calcula score
- `app/noche/page.js:61-69` crea dim_rutina pero no calcula score
- `app/dashboard/page.js:244-249` lee rutina_manana_score pero nunca se escribe

**Recomendación:** Implementar cálculo de scores o eliminar los campos.

---

## 5. VISTAS ANALÍTICAS SUBUTILIZADAS

### 5.1 Vistas Completamente Muertas

#### v_ejercicio_compliance
- **Definida:** SÍ (en esquema SQL)
- **Usada en código:** NO
- **Lógica útil:** Compara ejercicio planeado vs ejecutado, calcula porcentaje de cumplimiento, valida si se ejecutó y si es el mismo tipo
- **Evidencia:** No aparece en ningún archivo .js
- **Recomendación:** Eliminar o implementar en analytics

#### v_metas_cumplimiento
- **Definida:** SÍ
- **Usada en código:** NO
- **Lógica útil:** Agrega metas por día, calcula porcentaje de cumplimiento, lista cumplidas y no cumplidas
- **Evidencia:** No aparece en ningún archivo .js
- **Recomendación:** Eliminar o implementar en analytics

#### v_gratitud_analysis
- **Definida:** SÍ
- **Usada en código:** NO
- **Lógica útil:** Agrupa gratitudes por semana, cuenta días con gratitud, identifica temas comunes
- **Evidencia:** No aparece en ningún archivo .js
- **Recomendación:** Eliminar o implementar en analytics

#### v_scripture_stats
- **Definida:** SÍ
- **Usada en código:** NO
- **Lógica útil:** Estadísticas por libro bíblico, total de versículos leídos, días diferentes de lectura
- **Evidencia:** No aparece en ningún archivo .js
- **Recomendación:** Eliminar (depende de dim_scripture_readings que también debería eliminarse)

#### v_tentaciones_por_momento
- **Definida:** SÍ
- **Usada en código:** NO
- **Lógica útil:** Agrupa tentaciones por momento del día y hora, calcula ganadas/perdidas, nivel de riesgo promedio, arrays de pecados y triggers comunes
- **Evidencia:** No aparece en ningún archivo .js
- **Recomendación:** Eliminar o implementar en analytics

### 5.2 Vistas Parcialmente Usadas

#### v_fact_registros_diarios
- **Definida:** SÍ
- **Usada en código:** SÍ (parcial)
- **Columnas usadas:** date_key, num_ejercicios, num_estudios, num_tentaciones, num_practicas_espirituales
- **Columnas no usadas:** fact_id, user_id, num_gratitudes, num_metas, created_at, updated_at
- **Evidencia:** `app/analytics/page.js:255-256`
- **Recomendación:** Usar todas las columnas o simplificar la vista

#### v_timeline_emocional_dia
- **Definida:** SÍ
- **Usada en código:** SÍ (parcial)
- **Columnas usadas:** date_key, ansiedad, enfoque, motivacion, animo
- **Columnas no usadas:** user_id, momento, orden, tranquilidad, ira, tristeza, timestamp_registro
- **Evidencia:** `app/analytics/page.js:262-263`
- **Recomendación:** Usar todas las columnas o simplificar la vista

---

## 6. LISTA DE PROBLEMAS O INCONSISTENCIAS DETECTADAS

### 6.1 Campos en fact_habitos_diarios Duplicando Dimensiones

**Problema:** `fact_habitos_diarios` tiene campos directos que duplican datos de dimensiones:
- `ansiedad`, `enfoque`, `motivacion`, `claridad_mental`, `estabilidad_emocional` (duplican `dim_estado_emocional`)
- `meta_principal_dia`, `meta_secundaria_dia`, `palabra_enfoque_dia` (duplican `dim_metas`)

**Evidencia:** Se escriben en ambos lugares y se leen solo desde fact_habitos_diarios

### 6.2 Tablas de Unión Sin Lecturas

**Problema:** Todas las tablas `fact_*` (fact_ejercicios, fact_estudios, fact_tentaciones, fact_practicas_espirituales, fact_gratitudes, fact_metas, fact_interacciones) solo se insertan, nunca se consultan.

**Evidencia:** Solo aparecen en operaciones `.insert()` o `.select('*', { count: 'exact', head: true })` para calcular orden

**Impacto:** No se pueden consultar múltiples ejercicios/estudios/tentaciones por día aunque la estructura lo permite

### 6.3 Soft Delete Sin Implementar

**Problema:** Campos `deleted_at` e `is_deleted` existen en varias tablas pero nunca se consultan ni filtran.

**Evidencia:**
- `fact_habitos_diarios.is_deleted` existe pero nunca se filtra en código
- `dim_gratitud.deleted_at`, `dim_metas.deleted_at` existen pero nunca se usan
- Solo `v_dashboard_today` filtra por `is_deleted = false` pero el código nunca lo consulta directamente

### 6.4 Naming Inconsistente de momento_dia

**Problema:** `momento_dia` aparece como:
- `text` en algunas tablas
- `character varying` en otras
- Valores: 'Manana', 'Tarde', 'Noche', 'Madrugada' (inconsistente con mayúsculas)

**Evidencia:** 
- `dim_ejercicio.momento_dia`: character varying
- `dim_espiritual.momento_dia`: character varying
- `dim_estado_emocional.momento_dia`: character varying
- `dim_estudio.momento_dia`: character varying
- `dim_tentacion.momento_dia`: character varying
- `dim_interacciones.momento_dia`: character varying
- `fact_practicas_espirituales.momento_dia`: character varying

**Recomendación:** Crear ENUM o tabla de referencia

### 6.5 Lógica Planeada vs Ejecutada Nunca Se Cruza

**Problema:** Existe `dim_ejercicio_planeado` y `dim_ejercicio.ejercicio_plan_key` para vincular plan con ejecución, pero:
- Se escribe `ejercicio_plan_key` pero nunca se lee
- La vista `v_ejercicio_compliance` que compara plan vs ejecución nunca se usa

**Evidencia:**
- `app/manana/page.js:196` escribe ejercicio_plan_key
- `app/ejercicio/page.js:92` escribe ejercicio_plan_key
- Nunca se consulta para validar cumplimiento

### 6.6 Tablas de Referencia con Fallback Hardcodeado

**Problema:** `ref_tipos_pecado` y `ref_triggers` tienen fallback a valores hardcodeados en el código.

**Evidencia:** `lib/referenceData.js:36-44` tiene DEFAULT_REFERENCE_DATA como fallback

**Impacto:** Las tablas de referencia son opcionales, no fuente única de verdad

### 6.7 dim_date Nunca Se Usa

**Problema:** La dimensión de fecha existe pero nunca se consulta ni se usa para joins.

**Evidencia:** El código usa `date_key` como string directamente, nunca hace JOIN con `dim_date`

**Impacto:** No se puede hacer análisis temporal (día de semana, mes, año) usando la dimensión

### 6.8 Estado Emocional con Múltiples Snapshots No Usados

**Problema:** `fact_habitos_diarios` tiene:
- `estado_emocional_key` (último)
- `estado_emocional_manana_key` (snapshot mañana)
- `estado_emocional_tarde_key` (snapshot tarde)

Pero solo se actualiza `estado_emocional_key` con el último valor, los snapshots se escriben pero nunca se leen.

**Evidencia:**
- `app/manana/page.js:149-150` escribe ambos
- `app/tarde/page.js:88-89` escribe ambos
- Nunca se leen los snapshots

---

## 7. RECOMENDACIONES TÉCNICAS DE REORGANIZACIÓN DEL MODELO

### 7.1 Qué Sobra

1. **dim_date** - Eliminar completamente (nunca se usa)
2. **dim_scripture_readings** - Eliminar (redundante con dim_espiritual)
3. **v_ejercicio_compliance** - Eliminar o implementar
4. **v_metas_cumplimiento** - Eliminar o implementar
5. **v_gratitud_analysis** - Eliminar o implementar
6. **v_scripture_stats** - Eliminar (depende de dim_scripture_readings)
7. **v_tentaciones_por_momento** - Eliminar o implementar
8. **Campos directos redundantes en fact_habitos_diarios:**
   - ansiedad, enfoque, motivacion, claridad_mental, estabilidad_emocional (si se mantiene dim_estado_emocional)
   - meta_principal_dia, meta_secundaria_dia, palabra_enfoque_dia (si se mantiene dim_metas)
   - ejercicio_key (si se mantiene fact_ejercicios)
   - estudio_key (si se mantiene fact_estudios)
   - tentacion_key (si se mantiene fact_tentaciones)
   - espiritualidad_key (si se mantiene fact_practicas_espirituales)
9. **estado_emocional_manana_key, estado_emocional_tarde_key** - Eliminar si no se van a usar
10. **deleted_at, is_deleted** - Eliminar si no se implementa soft delete

### 7.2 Qué Falta

1. **Implementación de soft delete** - Si se quiere mantener, implementar filtros en todas las consultas
2. **Cálculo de scores de rutina** - Implementar función calculateRoutineScore o eliminar campos
3. **Consultas a tablas de unión** - Implementar lectura de fact_ejercicios, fact_estudios, etc. para soportar múltiples registros
4. **Validación de cumplimiento** - Implementar uso de ejercicio_plan_key para validar cumplimiento
5. **ENUM o tabla de referencia para momento_dia** - Normalizar valores
6. **Uso de dim_date** - Si se quiere análisis temporal, implementar JOINs con dim_date

### 7.3 Qué Podría Fusionarse

1. **dim_scripture_readings → dim_espiritual** - Fusionar en una sola tabla
2. **dim_estado_emocional → fact_habitos_diarios** - Si se elimina la dimensión, mantener solo campos directos
3. **fact_habitos_diarios campos directos → dimensiones** - Si se mantienen dimensiones, eliminar campos directos y leer siempre vía JOINs

### 7.4 Qué Debería Eliminarse

1. **dim_date** - Completamente muerta
2. **dim_scripture_readings** - Redundante
3. **5 vistas analíticas muertas** - v_ejercicio_compliance, v_metas_cumplimiento, v_gratitud_analysis, v_scripture_stats, v_tentaciones_por_momento
4. **Campos redundantes en fact_habitos_diarios** - Decidir si mantener dimensiones o campos directos, no ambos
5. **Snapshots de estado emocional no usados** - estado_emocional_manana_key, estado_emocional_tarde_key

### 7.5 Qué Debería Normalizarse

1. **momento_dia** - Crear ENUM o tabla de referencia
2. **practica en dim_espiritual** - Crear ENUM o tabla de referencia (valores: 'Devocional', 'Reflexion', 'Lectura', 'Oracion')
3. **tipo_rutina en dim_rutina** - Crear ENUM (valores: 'Manana', 'Noche')
4. **tipo en dim_metas** - Ya tiene constraint, pero podría ser ENUM
5. **ref_tipos_pecado y ref_triggers** - Eliminar fallback hardcodeado, hacer fuente única de verdad

---

## CONCLUSIÓN

El modelo de datos muestra evolución iterativa con múltiples capas de compatibilidad hacia atrás. Hay redundancia masiva, dimensiones "write-only", y vistas analíticas definidas pero nunca usadas. 

**Prioridad alta:**
1. Decidir si mantener dimensiones o campos directos (no ambos)
2. Eliminar tablas/vistas completamente muertas
3. Implementar o eliminar soft delete
4. Consolidar lectura bíblica (eliminar dim_scripture_readings)

**Prioridad media:**
1. Normalizar momento_dia y otros campos con valores fijos
2. Implementar cálculo de scores de rutina
3. Activar uso de tablas de unión para múltiples registros

**Prioridad baja:**
1. Implementar uso de dim_date para análisis temporal
2. Activar vistas analíticas o eliminarlas
3. Validar cumplimiento de planes de ejercicio


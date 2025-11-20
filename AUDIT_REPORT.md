# AUDITORÍA TÉCNICA DE BASE DE DATOS - LIFETRACKER

**Fecha:** 2025-01-27  
**Auditor:** Análisis automatizado del código  
**Base de datos:** Supabase/PostgreSQL  
**Modelo:** Star Schema (dim_*, fact_*, ref_*, v_*)

---

## Resumen ejecutivo

- **Estado general del modelo:** Modelo híbrido entre star schema y OLTP. La estructura sigue convenciones de data warehouse (dim/fact) pero el uso es más operacional que analítico. Hay evidencia de evolución iterativa con múltiples capas de compatibilidad hacia atrás.

- **Nivel de alineación:** MEDIO-BAJO. El diseño sugiere un star schema puro, pero el código usa las tablas de forma más relacional tradicional:
  - Las tablas `fact_*` (fact_ejercicios, fact_estudios, etc.) funcionan como tablas de unión (bridge tables) en lugar de hechos agregados
  - `fact_habitos_diarios` es efectivamente una tabla operacional central, no un hecho puro
  - Las dimensiones tienen `user_id` y `date_key` directamente, lo que las hace más parecidas a tablas transaccionales que a dimensiones SCD

- **Principales riesgos detectados:**
  1. **Duplicación de datos:** Lectura bíblica se registra en 3 lugares distintos (dim_espiritual, dim_scripture_readings, fact_practicas_espirituales)
  2. **Campos redundantes:** `fact_habitos_diarios` tiene campos directos (ejercicio_key, estado_emocional_key) Y tablas de unión (fact_ejercicios, fact_estudios), creando dos fuentes de verdad
  3. **Vistas infrautilizadas:** 6 vistas definidas, solo 3 se usan en el código (v_dashboard_today, v_fact_registros_diarios, v_timeline_emocional_dia)
  4. **Falta de uso de dim_date:** La dimensión de fecha existe pero nunca se consulta ni se usa para joins
  5. **Inconsistencia en momento_dia:** Algunas dimensiones lo tienen, otras no; algunas lo usan, otras lo ignoran
  6. **Tablas de referencia subutilizadas:** ref_tipos_pecado y ref_triggers existen pero el código tiene fallback a valores hardcodeados

---

## Mapa de uso por tabla

### fact_habitos_diarios

**Tipo:** Hecho (pero funciona como tabla operacional central)

**Uso en código:**
- Rutas / componentes: 
  - `app/manana/page.js` (updateFact)
  - `app/tarde/page.js` (updateFact)
  - `app/noche/page.js` (updateFact)
  - `app/dia/page.js` (select *)
  - `app/ejercicio/page.js` (update ejercicio_key)
  - `app/estudio/page.js` (update estudio_key)
  - `app/lectura/page.js` (update espiritualidad_key, estudio_key)
  - `app/tentacion/page.js` (update tentacion_key)
  - `app/analytics/page.js` (select múltiples columnas)
  - `lib/getOrCreateFact.js` (select, insert)
  - `lib/updateFact.js` (update)

**Operaciones:** LECTURA | ESCRITURA

**Columnas usadas:**
- **Escritura:** fact_id, user_id, date_key, sueno_horas, calidad_sueno, rutina_manana_key, rutina_noche_key, estado_emocional_key, estado_emocional_manana_key, estado_emocional_tarde_key, hora_registro_manana, hora_registro_tarde, hora_registro_noche, ansiedad, enfoque, energia_diaria, claridad_mental, motivacion, reflexion_matutina, reflexion_tarde, meta_principal_dia, meta_secundaria_dia, palabra_enfoque_dia, agua_tomada_manana, agua_tomada_tarde, comida_bien_tarde, micro_reset_realizado, movimiento_matutino, silencio_manana, ejercicio_key, ejercicio_plan_key, estudio_key, tentacion_key, espiritualidad_key, ambiente_key, dia_especial_key, interacciones_pos, interacciones_neg, identidad_dia, estabilidad_emocional, desvio_mayor, causa_desvio, accion_recovery, notas_dia, quien_fuiste_hoy, estres, updated_at, updated_by, gratitud_key
- **Lectura:** fact_id, user_id, date_key, sueno_horas, calidad_sueno, energia_diaria, ansiedad, enfoque, motivacion, claridad_mental, rutina_manana_score, rutina_noche_score, agua_tomada_manana, agua_tomada_tarde, micro_reset_realizado, identidad_dia, notas_dia, created_at, updated_at

**Columnas definidas pero no usadas:**
- `deleted_at` (existe pero nunca se consulta ni se filtra)
- `is_deleted` (existe pero nunca se consulta; la vista v_dashboard_today sí lo filtra pero el código no)
- `descripcion_emocional_tarde` (se escribe en noche pero nunca se lee)
- `rutina_manana_score` y `rutina_noche_score` (se calculan en helpers.js pero nunca se escriben en el código)

**Comentarios:**
- Esta tabla es el núcleo del sistema. Tiene 50+ columnas, muchas de las cuales duplican información que ya está en dimensiones.
- Hay redundancia: `ejercicio_key` directo vs `fact_ejercicios` (tabla de unión). El código usa AMBOS, creando inconsistencia potencial.
- Los campos `estado_emocional_key`, `estado_emocional_manana_key`, `estado_emocional_tarde_key` sugieren que se intentó capturar estados emocionales por momento del día, pero el código solo actualiza `estado_emocional_key` con el último valor.

---

### dim_ejercicio

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (upsertDimension - cuando es "Descanso" o "No haré ejercicio")
  - `app/ejercicio/page.js` (upsertDimension)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, momento_dia, tipo, grupo_muscular, distancia_km, pace_min_km, duracion_min, intensidad, razon_no_ejercicio, descripcion, ejercicio_plan_key
- **Lectura:** NINGUNA (nunca se consulta directamente)

**Columnas definidas pero no usadas:**
- `ejercicio_key` (se genera pero nunca se lee directamente)
- `created_at` (se genera pero nunca se consulta)

**Comentarios:**
- Solo se inserta, nunca se lee. El acceso a ejercicios se hace vía `fact_ejercicios` o `fact_habitos_diarios.ejercicio_key`.
- La relación con `dim_ejercicio_planeado` vía `ejercicio_plan_key` existe pero el código solo la usa en escritura, nunca en lectura para validar cumplimiento.

---

### dim_ejercicio_planeado

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (upsertDimension - cuando se planea ejercicio)
  - `app/ejercicio/page.js` (select para mostrar planes del día)

**Operaciones:** LECTURA | ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, date_key, tipo, grupo_muscular, distancia_km_planeada, duracion_estimada_min, notas
- **Lectura:** plan_key, tipo, grupo_muscular, distancia_km_planeada, notas

**Columnas definidas pero no usadas:**
- `created_at` (se genera pero no se usa en lógica)

**Comentarios:**
- Se usa correctamente: se crea en mañana, se consulta en ejercicio para vincular ejecución con plan.
- La vista `v_ejercicio_compliance` está diseñada para analizar cumplimiento plan vs ejecución, pero NUNCA se usa en el código.

---

### dim_estado_emocional

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (upsertDimension)
  - `app/tarde/page.js` (upsertDimension)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, momento_dia, ansiedad, enfoque, tranquilidad, motivacion, animo, ira, tristeza, estabilidad_emocional, descripcion
- **Lectura:** NINGUNA (nunca se consulta directamente)

**Columnas definidas pero no usadas:**
- `estado_emocional_key` (se genera pero nunca se lee)
- `euforia` (definida en esquema, nunca se usa)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- Solo se inserta, nunca se lee. Los valores emocionales se leen desde `fact_habitos_diarios` (ansiedad, enfoque, etc.) que son campos directos, no desde la dimensión.
- Esto sugiere que `dim_estado_emocional` es redundante: los valores ya están denormalizados en `fact_habitos_diarios`.

---

### dim_espiritual

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (upsertDimension)
  - `app/noche/page.js` (upsertDimension)
  - `app/lectura/page.js` (upsertDimension - para lectura bíblica)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, momento_dia, practica, libro_biblia, capitulo, versiculos_leidos, tiempo_min, insight_espiritual
- **Lectura:** NINGUNA (nunca se consulta directamente)

**Columnas definidas pero no usadas:**
- `espiritualidad_key` (se genera pero nunca se lee)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- Solo se inserta. Hay DUPLICACIÓN: lectura bíblica se registra también en `dim_scripture_readings` (ver más abajo).

---

### dim_scripture_readings

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/lectura/page.js` (upsertDimension - solo para lectura bíblica)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, date_key, libro, capitulo, versiculos, total_versiculos, insight
- **Lectura:** NINGUNA

**Columnas definidas pero no usadas:**
- `reading_key` (se genera pero nunca se lee)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- **TABLA REDUNDANTE.** Se inserta en paralelo con `dim_espiritual` cuando es lectura bíblica. La vista `v_scripture_stats` está diseñada para analizar esto, pero NUNCA se usa en el código.
- Esta tabla debería fusionarse con `dim_espiritual` o eliminarse.

---

### dim_estudio

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/tarde/page.js` (upsertDimension)
  - `app/estudio/page.js` (upsertDimension)
  - `app/lectura/page.js` (upsertDimension - para lectura general)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, momento_dia, tema, categoria, tiempo_min, profundidad, material_usado, insight_aprendido
- **Lectura:** NINGUNA

**Columnas definidas pero no usadas:**
- `estudio_key` (se genera pero nunca se lee)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- Solo se inserta. El acceso se hace vía `fact_estudios` o `fact_habitos_diarios.estudio_key`.

---

### dim_tentacion

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/tarde/page.js` (upsertDimension)
  - `app/tentacion/page.js` (upsertDimension)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, momento_dia, fuente_registro, hora_aproximada, trigger_principal, pecado_principal, nivel_riesgo, contexto, gano_tentacion, descripcion, categoria
- **Lectura:** NINGUNA

**Columnas definidas pero no usadas:**
- `tentacion_key` (se genera pero nunca se lee)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- Solo se inserta. La vista `v_tentaciones_por_momento` está diseñada para analizar patrones, pero NUNCA se usa en el código.

---

### dim_rutina

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (upsertDimension - tipo "Manana")
  - `app/noche/page.js` (upsertDimension - tipo "Noche")

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, tipo_rutina, despertar_a_hora, no_telefono, tender_cama, oracion, ejercicio, ducha, planeacion, cierre_redes, ropa_lista, orden_espacio
- **Lectura:** NINGUNA

**Columnas definidas pero no usadas:**
- `rutina_key` (se genera pero nunca se lee)
- `score_rutina` (definida en esquema, NUNCA se escribe ni se lee)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- Solo se inserta. El `score_rutina` debería calcularse automáticamente (hay función `calculateRoutineScore` en helpers.js) pero nunca se usa.
- Los scores se leen desde `fact_habitos_diarios.rutina_manana_score` y `rutina_noche_score`, pero estos campos NUNCA se escriben en el código.

---

### dim_ambiente

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/noche/page.js` (upsertDimension)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, orden_cuarto, orden_escritorio, orden_mochila, ruido_ambiental, limpieza_personal, sensacion_espacial
- **Lectura:** NINGUNA

**Columnas definidas pero no usadas:**
- `ambiente_key` (se genera pero nunca se lee)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- Solo se inserta en noche, nunca se lee. Es una dimensión "muerta" desde el punto de vista de consultas.

---

### dim_interacciones

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/noche/page.js` (upsertDimension - para interacciones positiva y negativa)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, momento_dia, tipo_interaccion, intensidad, descripcion, emocion_predominante, hora_inicio, duracion_minutos
- **Lectura:** NINGUNA

**Columnas definidas pero no usadas:**
- `interaccion_key` (se genera pero nunca se lee)
- `categoria` (definida en esquema, nunca se usa)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- Solo se inserta. Los contadores `interacciones_pos` e `interacciones_neg` se guardan directamente en `fact_habitos_diarios`, haciendo esta dimensión redundante para análisis básicos.

---

### dim_gratitud

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/noche/page.js` (upsertDimension - hasta 3 gratitudes)
  - `app/analytics/page.js` (select date_key solamente para contar días)

**Operaciones:** LECTURA | ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, date_key, orden, descripcion
- **Lectura:** date_key (solo para contar días únicos en analytics)

**Columnas definidas pero no usadas:**
- `gratitud_key` (se genera pero nunca se lee directamente)
- `created_at`, `updated_at`, `deleted_at` (se generan pero nunca se consultan)

**Comentarios:**
- Se usa mínimamente. La vista `v_gratitud_analysis` está diseñada para análisis semanal, pero NUNCA se usa en el código.

---

### dim_metas

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (upsertDimension - para metas del día)
  - `app/noche/page.js` (select, update - para marcar cumplimiento)

**Operaciones:** LECTURA | ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, date_key, tipo, descripcion, orden, cumplida
- **Lectura:** meta_key, tipo (solo para buscar y actualizar cumplida)

**Columnas definidas pero no usadas:**
- `reflexion` (definida en esquema, nunca se usa)
- `created_at`, `updated_at`, `deleted_at` (se generan pero nunca se consultan)

**Comentarios:**
- Se usa correctamente para metas diarias. La vista `v_metas_cumplimiento` está diseñada para análisis, pero NUNCA se usa en el código.

---

### dim_dia_especial

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (upsertDimension)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, tipo, descripcion
- **Lectura:** NINGUNA

**Columnas definidas pero no usadas:**
- `dia_especial_key` (se genera pero nunca se lee)
- `created_at` (se genera pero no se consulta)

**Comentarios:**
- Solo se inserta, nunca se lee. Es una dimensión "muerta".

---

### fact_ejercicios

**Tipo:** Hecho (tabla de unión)

**Uso en código:**
- Rutas / componentes:
  - `app/ejercicio/page.js` (insert)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** fact_id, ejercicio_key, orden
- **Lectura:** NINGUNA (nunca se consulta directamente)

**Comentarios:**
- Solo se inserta. Permite múltiples ejercicios por día, pero el código nunca consulta esta tabla para leer ejercicios.

---

### fact_estudios

**Tipo:** Hecho (tabla de unión)

**Uso en código:**
- Rutas / componentes:
  - `app/tarde/page.js` (insert)
  - `app/estudio/page.js` (insert)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** fact_id, estudio_key, orden
- **Lectura:** NINGUNA (nunca se consulta directamente)

**Comentarios:**
- Solo se inserta. Permite múltiples estudios por día, pero el código nunca consulta esta tabla.

---

### fact_tentaciones

**Tipo:** Hecho (tabla de unión)

**Uso en código:**
- Rutas / componentes:
  - `app/tarde/page.js` (insert)
  - `app/tentacion/page.js` (insert)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** fact_id, tentacion_key, orden
- **Lectura:** NINGUNA (nunca se consulta directamente)

**Comentarios:**
- Solo se inserta. Permite múltiples tentaciones por día, pero el código nunca consulta esta tabla.

---

### fact_practicas_espirituales

**Tipo:** Hecho (tabla de unión)

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (insert)
  - `app/noche/page.js` (insert)
  - `app/lectura/page.js` (insert)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** fact_id, espiritualidad_key, momento_dia, orden
- **Lectura:** NINGUNA (nunca se consulta directamente)

**Comentarios:**
- Solo se inserta. Permite múltiples prácticas por día, pero el código nunca consulta esta tabla.

---

### fact_gratitudes

**Tipo:** Hecho (tabla de unión)

**Uso en código:**
- Rutas / componentes:
  - `app/noche/page.js` (insert, count)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** fact_id, gratitud_key, orden
- **Lectura:** count solamente (para calcular siguiente orden)

**Comentarios:**
- Solo se inserta. Permite múltiples gratitudes por día, pero el código nunca consulta esta tabla para leer gratitudes.

---

### fact_metas

**Tipo:** Hecho (tabla de unión)

**Uso en código:**
- Rutas / componentes:
  - `app/manana/page.js` (insert)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** fact_id, meta_key, tipo, orden
- **Lectura:** NINGUNA

**Comentarios:**
- Solo se inserta. El campo `tipo` está duplicado aquí y en `dim_metas`.

---

### fact_interacciones

**Tipo:** Hecho (tabla de unión)

**Uso en código:**
- Rutas / componentes:
  - `app/noche/page.js` (insert, count)

**Operaciones:** ESCRITURA

**Columnas usadas:**
- **Escritura:** fact_id, interaccion_key, orden
- **Lectura:** count solamente (para calcular siguiente orden)

**Comentarios:**
- Solo se inserta. Permite múltiples interacciones por día, pero el código nunca consulta esta tabla.

---

### journal_entries

**Tipo:** Operacional

**Uso en código:**
- Rutas / componentes:
  - `app/journal/page.js` (insert)
  - `app/analytics/page.js` (select - para mostrar entradas)

**Operaciones:** LECTURA | ESCRITURA

**Columnas usadas:**
- **Escritura:** user_id, date_key, title, entry, categoria, emocion_predominante, tags
- **Lectura:** id, date_key, title, categoria, emocion_predominante

**Columnas definidas pero no usadas:**
- `created_at`, `updated_at` (se generan pero nunca se consultan)
- `es_privado` (definida en esquema, nunca se usa)

**Comentarios:**
- Se usa correctamente. Es una tabla operacional pura, no sigue el patrón dim/fact.

---

### ref_tipos_pecado

**Tipo:** Referencia

**Uso en código:**
- Rutas / componentes:
  - `lib/referenceData.js` (select nombre)

**Operaciones:** LECTURA

**Columnas usadas:**
- **Lectura:** nombre solamente

**Columnas definidas pero no usadas:**
- `id`, `descripcion`, `created_at` (definidas pero nunca se usan)

**Comentarios:**
- Se usa con fallback a valores hardcodeados si falla la consulta. Esto sugiere que la tabla es opcional.

---

### ref_triggers

**Tipo:** Referencia

**Uso en código:**
- Rutas / componentes:
  - `lib/referenceData.js` (select nombre, categoria)

**Operaciones:** LECTURA

**Columnas usadas:**
- **Lectura:** nombre, categoria

**Columnas definidas pero no usadas:**
- `id`, `created_at` (definidas pero nunca se usan)

**Comentarios:**
- Se usa con fallback a valores hardcodeados si falla la consulta.

---

### dim_date

**Tipo:** Dimensión

**Uso en código:**
- Rutas / componentes: **NINGUNA**

**Operaciones:** NINGUNA

**Columnas usadas:**
- NINGUNA

**Comentarios:**
- **TABLA MUERTA.** Está definida en el esquema pero nunca se usa. El código usa `date_key` como string (YYYY-MM-DD) directamente, sin joins a esta dimensión.

---

### v_dashboard_today

**Tipo:** Vista

**Uso en código:**
- Rutas / componentes:
  - `app/dashboard/page.js` (select *)

**Operaciones:** LECTURA

**Columnas usadas:**
- Todas las columnas de la vista (select *)

**Comentarios:**
- Se usa correctamente. Es la única vista que se usa activamente en el frontend.

---

### v_fact_registros_diarios

**Tipo:** Vista

**Uso en código:**
- Rutas / componentes:
  - `app/analytics/page.js` (select date_key, num_ejercicios, num_estudios, num_tentaciones, num_practicas_espirituales)

**Operaciones:** LECTURA

**Columnas usadas:**
- date_key, num_ejercicios, num_estudios, num_tentaciones, num_practicas_espirituales

**Columnas definidas pero no usadas:**
- fact_id, user_id, num_gratitudes, num_metas, created_at, updated_at

**Comentarios:**
- Se usa parcialmente. Solo se consultan los contadores de actividades, no gratitudes ni metas.

---

### v_timeline_emocional_dia

**Tipo:** Vista

**Uso en código:**
- Rutas / componentes:
  - `app/analytics/page.js` (select date_key, ansiedad, enfoque, motivacion, animo)

**Operaciones:** LECTURA

**Columnas usadas:**
- date_key, ansiedad, enfoque, motivacion, animo

**Columnas definidas pero no usadas:**
- user_id, momento, orden, tranquilidad, ira, tristeza, timestamp_registro

**Comentarios:**
- Se usa parcialmente. Solo se consultan algunas emociones, no todas.

---

### v_ejercicio_compliance

**Tipo:** Vista

**Uso en código:**
- Rutas / componentes: **NINGUNA**

**Operaciones:** NINGUNA

**Comentarios:**
- **VISTA MUERTA.** Está diseñada para analizar cumplimiento de planes de ejercicio vs ejecución, pero nunca se usa.

---

### v_metas_cumplimiento

**Tipo:** Vista

**Uso en código:**
- Rutas / componentes: **NINGUNA**

**Operaciones:** NINGUNA

**Comentarios:**
- **VISTA MUERTA.** Está diseñada para análisis de cumplimiento de metas, pero nunca se usa.

---

### v_gratitud_analysis

**Tipo:** Vista

**Uso en código:**
- Rutas / componentes: **NINGUNA**

**Operaciones:** NINGUNA

**Comentarios:**
- **VISTA MUERTA.** Está diseñada para análisis semanal de gratitudes, pero nunca se usa.

---

### v_scripture_stats

**Tipo:** Vista

**Uso en código:**
- Rutas / componentes: **NINGUNA**

**Operaciones:** NINGUNA

**Comentarios:**
- **VISTA MUERTA.** Está diseñada para estadísticas de lectura bíblica, pero nunca se usa.

---

### v_tentaciones_por_momento

**Tipo:** Vista

**Uso en código:**
- Rutas / componentes: **NINGUNA**

**Operaciones:** NINGUNA

**Comentarios:**
- **VISTA MUERTA.** Está diseñada para análisis de patrones de tentaciones por hora/momento, pero nunca se usa.

---

## Relaciones clave y su uso real

### fact_habitos_diarios ↔ dim_ejercicio
- **Relación teórica:** `fact_habitos_diarios.ejercicio_key` → `dim_ejercicio.ejercicio_key`
- **Uso real:** Se escribe `ejercicio_key` en fact, pero NUNCA se hace JOIN para leer datos del ejercicio. Los datos del ejercicio nunca se consultan desde el código.
- **Estado:** Relación "muerta" - la FK existe pero nunca se explota.

### fact_habitos_diarios ↔ dim_estado_emocional
- **Relación teórica:** `fact_habitos_diarios.estado_emocional_key` → `dim_estado_emocional.estado_emocional_key`
- **Uso real:** Se escribe la FK, pero los valores emocionales se leen directamente desde `fact_habitos_diarios` (ansiedad, enfoque, etc.), no desde la dimensión.
- **Estado:** Relación redundante - los datos están denormalizados en fact.

### fact_habitos_diarios ↔ dim_espiritual
- **Relación teórica:** `fact_habitos_diarios.espiritualidad_key` → `dim_espiritual.espiritualidad_key`
- **Uso real:** Se escribe la FK, pero NUNCA se hace JOIN para leer datos espirituales.
- **Estado:** Relación "muerta".

### fact_ejercicios ↔ dim_ejercicio
- **Relación teórica:** `fact_ejercicios.ejercicio_key` → `dim_ejercicio.ejercicio_key`
- **Uso real:** Se inserta en fact_ejercicios, pero NUNCA se consulta esta tabla.
- **Estado:** Tabla de unión creada pero nunca leída.

### fact_estudios ↔ dim_estudio
- **Relación teórica:** `fact_estudios.estudio_key` → `dim_estudio.estudio_key`
- **Uso real:** Se inserta en fact_estudios, pero NUNCA se consulta esta tabla.
- **Estado:** Tabla de unión creada pero nunca leída.

### fact_tentaciones ↔ dim_tentacion
- **Relación teórica:** `fact_tentaciones.tentacion_key` → `dim_tentacion.tentacion_key`
- **Uso real:** Se inserta en fact_tentaciones, pero NUNCA se consulta esta tabla.
- **Estado:** Tabla de unión creada pero nunca leída.

### fact_practicas_espirituales ↔ dim_espiritual
- **Relación teórica:** `fact_practicas_espirituales.espiritualidad_key` → `dim_espiritual.espiritualidad_key`
- **Uso real:** Se inserta en fact_practicas_espirituales, pero NUNCA se consulta esta tabla.
- **Estado:** Tabla de unión creada pero nunca leída.

### dim_ejercicio ↔ dim_ejercicio_planeado
- **Relación teórica:** `dim_ejercicio.ejercicio_plan_key` → `dim_ejercicio_planeado.plan_key`
- **Uso real:** Se escribe la FK cuando se ejecuta un ejercicio planeado, pero NUNCA se consulta para validar cumplimiento.
- **Estado:** Relación parcialmente usada (solo escritura).

---

## Tablas / vistas potencialmente muertas o infrautilizadas

### Tablas completamente muertas (definidas, nunca usadas):
1. **dim_date** - Dimensión de fecha nunca consultada ni usada en joins
2. **v_ejercicio_compliance** - Vista de cumplimiento de ejercicio nunca consultada
3. **v_metas_cumplimiento** - Vista de cumplimiento de metas nunca consultada
4. **v_gratitud_analysis** - Vista de análisis de gratitud nunca consultada
5. **v_scripture_stats** - Vista de estadísticas bíblicas nunca consultada
6. **v_tentaciones_por_momento** - Vista de análisis de tentaciones nunca consultada

### Tablas solo escritura, nunca lectura (dimensiones "huérfanas"):
1. **dim_ejercicio** - Solo se inserta, nunca se lee
2. **dim_estado_emocional** - Solo se inserta, nunca se lee
3. **dim_espiritual** - Solo se inserta, nunca se lee
4. **dim_estudio** - Solo se inserta, nunca se lee
5. **dim_tentacion** - Solo se inserta, nunca se lee
6. **dim_rutina** - Solo se inserta, nunca se lee
7. **dim_ambiente** - Solo se inserta, nunca se lee
8. **dim_interacciones** - Solo se inserta, nunca se lee
9. **dim_dia_especial** - Solo se inserta, nunca se lee

### Tablas de unión solo escritura:
1. **fact_ejercicios** - Solo se inserta, nunca se lee
2. **fact_estudios** - Solo se inserta, nunca se lee
3. **fact_tentaciones** - Solo se inserta, nunca se lee
4. **fact_practicas_espirituales** - Solo se inserta, nunca se lee
5. **fact_gratitudes** - Solo se inserta, nunca se lee (excepto count)
6. **fact_metas** - Solo se inserta, nunca se lee
7. **fact_interacciones** - Solo se inserta, nunca se lee (excepto count)

### Vistas parcialmente usadas:
1. **v_fact_registros_diarios** - Solo se consultan 4 de 8 columnas
2. **v_timeline_emocional_dia** - Solo se consultan 4 de 9 columnas

---

## Smells de diseño y posibles líneas de mejora (solo a alto nivel)

### Redundancia y duplicación

1. **Lectura bíblica triplicada:**
   - Se registra en `dim_espiritual` (con practica='Lectura')
   - Se registra en `dim_scripture_readings` (tabla dedicada)
   - Se registra en `fact_practicas_espirituales` (tabla de unión)
   - **Mejora:** Fusionar `dim_scripture_readings` con `dim_espiritual` o eliminar una de las dos.

2. **Estado emocional duplicado:**
   - Se guarda en `dim_estado_emocional` (dimensión)
   - Se guarda directamente en `fact_habitos_diarios` (ansiedad, enfoque, motivacion, etc.)
   - **Mejora:** Eliminar campos directos de fact y leer siempre desde la dimensión, O eliminar la dimensión y mantener solo campos directos.

3. **Ejercicio con doble vía:**
   - Se guarda `ejercicio_key` directo en `fact_habitos_diarios`
   - Se guarda en `fact_ejercicios` (tabla de unión)
   - El código usa ambas, creando inconsistencia potencial
   - **Mejora:** Eliminar `ejercicio_key` directo y usar solo `fact_ejercicios`, O eliminar `fact_ejercicios` y usar solo el campo directo.

4. **Metas duplicadas:**
   - Se guarda en `dim_metas` (dimensión)
   - Se guarda en `fact_metas` (tabla de unión)
   - Se guarda texto directo en `fact_habitos_diarios` (meta_principal_dia, meta_secundaria_dia)
   - **Mejora:** Eliminar campos de texto directo y leer siempre desde dim_metas.

### Campos que deberían ser FK pero están sueltos

1. **`fact_habitos_diarios.meta_principal_dia`** - Debería ser FK a `dim_metas`, pero es texto libre.
2. **`fact_habitos_diarios.meta_secundaria_dia`** - Debería ser FK a `dim_metas`, pero es texto libre.
3. **`fact_habitos_diarios.palabra_enfoque_dia`** - Podría ser FK a una tabla de "palabras de enfoque" si se quiere tracking histórico.

### Vistas que recalculan algo que ya tiene la fact principal

1. **`v_fact_registros_diarios`** - Calcula contadores que podrían mantenerse como campos calculados en `fact_habitos_diarios` (aunque las vistas son más flexibles).
2. **`v_timeline_emocional_dia`** - Agrega emociones que ya están en `fact_habitos_diarios` directamente.

### Inconsistencias de naming y tipos

1. **`momento_dia`** - Aparece como `text` en algunas tablas, `character varying` en otras. Debería ser un ENUM o al menos tipo consistente.
2. **`practica` en dim_espiritual** - Valores: 'Devocional', 'Reflexion', 'Lectura', 'Oracion'. Debería ser ENUM o FK a tabla de referencia.
3. **`tipo_rutina` en dim_rutina** - Valores: 'Manana', 'Noche'. Debería ser ENUM.

### Dimensiones que nunca se consultan

- **Todas las dimensiones (dim_*)** excepto `dim_metas` y `dim_gratitud` (parcialmente) son "write-only". Esto sugiere que el modelo star schema no se está explotando: las dimensiones deberían usarse para análisis y joins, pero solo se usan como "log" de inserción.

### Falta de uso de dim_date

- La dimensión de fecha existe pero nunca se usa. El código usa `date_key` como string directamente. Si se quiere hacer análisis temporal (día de semana, mes, año), debería usarse esta dimensión.

### Campos calculados que nunca se calculan

1. **`dim_rutina.score_rutina`** - Existe función `calculateRoutineScore` en helpers.js pero nunca se llama.
2. **`fact_habitos_diarios.rutina_manana_score` y `rutina_noche_score`** - Se leen en dashboard pero NUNCA se escriben en el código.

### Tablas de referencia con fallback hardcodeado

- `ref_tipos_pecado` y `ref_triggers` tienen fallback a valores hardcodeados en el código. Esto sugiere que estas tablas son opcionales o que el código no confía en ellas. Deberían ser la fuente única de verdad o eliminarse.

### Soft delete no implementado

- `deleted_at` e `is_deleted` existen en varias tablas pero nunca se consultan ni se usan para filtrar. El soft delete está definido pero no implementado.

---

## Observaciones finales

El modelo de datos muestra signos claros de evolución iterativa con múltiples capas de compatibilidad hacia atrás. Hay un intento de seguir un star schema, pero el uso real es más parecido a un modelo relacional tradicional con algunas convenciones de naming de data warehouse.

**Fortalezas:**
- Estructura clara de naming (dim_*, fact_*, ref_*)
- Separación lógica entre dimensiones y hechos
- Soporte para múltiples registros por día (tablas de unión)

**Debilidades críticas:**
- Redundancia masiva (datos en múltiples lugares)
- Dimensiones "write-only" (no se explotan para análisis)
- Vistas analíticas definidas pero nunca usadas
- Falta de consistencia en tipos y naming
- Campos calculados definidos pero nunca calculados

**Recomendación general:**
Antes de agregar nuevas funcionalidades, se debería hacer una limpieza y consolidación del modelo actual para eliminar redundancias y activar las vistas/relaciones que ya están definidas pero no se usan.


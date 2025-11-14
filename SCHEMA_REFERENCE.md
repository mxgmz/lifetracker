# Esquema de Base de Datos - Referencia

Este archivo contiene el esquema completo de la base de datos para referencia.

## Tablas de Dimensión

### dim_ambiente
- ambiente_key (uuid, PK)
- user_id (uuid, NOT NULL)
- orden_cuarto (integer)
- orden_escritorio (integer)
- orden_mochila (integer)
- ruido_ambiental (integer)
- limpieza_personal (integer)
- sensacion_espacial (text)
- created_at (timestamp)

### dim_estado_emocional
- estado_emocional_key (uuid, PK)
- user_id (uuid, NOT NULL)
- ansiedad (integer)
- tranquilidad (integer)
- motivacion (integer)
- enfoque (integer)
- animo (integer)
- ira (integer)
- tristeza (integer)
- euforia (integer)
- descripcion (text)
- created_at (timestamp)

**NOTA: NO tiene campo "energia"**

### dim_ejercicio
- ejercicio_key (uuid, PK)
- user_id (uuid, NOT NULL)
- tipo (text, NOT NULL)
- grupo_muscular (text)
- distancia_km (numeric)
- pace_min_km (numeric)
- duracion_min (integer)
- intensidad (integer)
- razon_no_ejercicio (text)
- descripcion (text)
- created_at (timestamp)

### dim_espiritual
- espiritualidad_key (uuid, PK)
- user_id (uuid, NOT NULL)
- practica (text, NOT NULL)
- libro_biblia (text)
- capitulo (integer)
- versiculos_leidos (integer)
- insight_espiritual (text)
- tiempo_min (integer)
- created_at (timestamp)

### dim_estudio
- estudio_key (uuid, PK)
- user_id (uuid, NOT NULL)
- tema (text)
- categoria (text)
- profundidad (integer)
- tiempo_min (integer)
- material_usado (text)
- insight_aprendido (text)
- created_at (timestamp)

### dim_interacciones
- interaccion_key (uuid, PK)
- user_id (uuid, NOT NULL)
- tipo_interaccion (text)
- categoria (text)
- intensidad (integer)
- duracion_minutos (integer)
- emocion_predominante (text)
- descripcion (text)
- created_at (timestamp)

### dim_rutina
- rutina_key (uuid, PK)
- user_id (uuid, NOT NULL)
- tipo_rutina (text, NOT NULL) - CHECK: 'Manana' o 'Noche'
- despertar_a_hora (boolean)
- dormir_a_hora (boolean)
- oracion (boolean)
- ejercicio (boolean)
- tender_cama (boolean)
- no_telefono (boolean)
- ducha (boolean)
- planeacion (boolean)
- ropa_lista (boolean)
- orden_espacio (boolean)
- cierre_redes (boolean)
- score_rutina (integer)
- created_at (timestamp)

### dim_tentacion
- tentacion_key (uuid, PK)
- user_id (uuid, NOT NULL)
- trigger_principal (text)
- pecado_principal (text)
- nivel_riesgo (integer)
- contexto (text)
- descripcion (text)
- created_at (timestamp)

## Tabla Fact

### fact_habitos_diarios
- fact_id (uuid, PK)
- user_id (uuid, NOT NULL)
- date_key (date, NOT NULL)
- ejercicio_key (uuid, FK -> dim_ejercicio)
- estado_emocional_key (uuid, FK -> dim_estado_emocional)
- tentacion_key (uuid, FK -> dim_tentacion)
- espiritualidad_key (uuid, FK -> dim_espiritual)
- ambiente_key (uuid, FK -> dim_ambiente)
- rutina_manana_key (uuid, FK -> dim_rutina)
- rutina_noche_key (uuid, FK -> dim_rutina)
- interaccion_key (uuid, FK -> dim_interacciones)
- estudio_key (uuid, FK -> dim_estudio)
- dia_especial_key (uuid, FK -> dim_dia_especial)
- sueno_horas (numeric)
- calidad_sueno (integer)
- energia_diaria (integer) ← AQUÍ va la energía
- estres (integer)
- ansiedad (integer)
- enfoque (integer)
- claridad_mental (integer)
- motivacion (integer)
- estabilidad_emocional (integer)
- identidad_dia (integer)
- interacciones_pos (integer)
- interacciones_neg (integer)
- desvio_mayor (boolean)
- causa_desvio (text)
- accion_recovery (text)
- rutina_manana_score (integer)
- rutina_noche_score (integer)
- notas_dia (text)
- created_at (timestamp)


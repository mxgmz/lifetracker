import { supabase } from './supabaseClient'

/**
 * Generic function to insert into a dimension table and return the PK
 * @param {string} tableName - Name of the dimension table
 * @param {object} data - Data to insert (must include user_id)
 * @returns {Promise<string>} The primary key of the inserted row
 */
export async function upsertDimension(tableName, data) {
  // Map of table names to their primary key field names
  const pkFieldMap = {
    'dim_ambiente': 'ambiente_key',
    'dim_ejercicio': 'ejercicio_key',
    'dim_ejercicio_planeado': 'plan_key',
    'dim_espiritual': 'espiritualidad_key',
    'dim_estado_emocional': 'estado_emocional_key',
    'dim_estudio': 'estudio_key',
    'dim_interacciones': 'interaccion_key',
    'dim_rutina': 'rutina_key',
    'dim_tentacion': 'tentacion_key',
    'dim_dia_especial': 'dia_especial_key',
    'dim_gratitud': 'gratitud_key',
    'dim_metas': 'meta_key',
    'dim_scripture_readings': 'reading_key',
  }

  const { data: inserted, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to insert into ${tableName}: ${error.message}`)
  }

  // Return the primary key using the correct field name
  const pkField = pkFieldMap[tableName] || `${tableName.replace('dim_', '')}_key`
  return inserted[pkField]
}


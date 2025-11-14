import { supabase } from './supabaseClient'

/**
 * Updates a fact_habitos_diarios record
 * @param {string} factId - The fact_id to update
 * @param {object} updates - Object with fields to update
 * @returns {Promise<void>}
 */
export async function updateFact(factId, updates) {
  // Auto-add updated_at timestamp
  const updatesWithTimestamp = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('fact_habitos_diarios')
    .update(updatesWithTimestamp)
    .eq('fact_id', factId)

  if (error) {
    throw new Error(`Failed to update fact: ${error.message}`)
  }
}


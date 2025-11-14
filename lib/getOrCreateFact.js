import { supabase } from './supabaseClient'

/**
 * Gets or creates a fact_habitos_diarios record for the current user and date
 * @param {string} userId - The authenticated user's ID
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @returns {Promise<string>} The fact_id
 */
export async function getOrCreateFact(userId, dateKey) {
  // First, try to get existing fact
  const { data: existingFact, error: fetchError } = await supabase
    .from('fact_habitos_diarios')
    .select('fact_id')
    .eq('user_id', userId)
    .eq('date_key', dateKey)
    .single()

  if (existingFact) {
    return existingFact.fact_id
  }

  // If not found, create new fact
  const { data: newFact, error: insertError } = await supabase
    .from('fact_habitos_diarios')
    .insert({
      user_id: userId,
      date_key: dateKey,
    })
    .select('fact_id')
    .single()

  if (insertError) {
    throw new Error(`Failed to create fact: ${insertError.message}`)
  }

  return newFact.fact_id
}


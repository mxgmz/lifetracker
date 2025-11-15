import { supabase } from './supabaseClient'

export const DEFAULT_REFERENCE_DATA = {
  pecados: ['Lujuria', 'Gula', 'Avaricia', 'Pereza', 'Ira', 'Envidia', 'Orgullo', 'Otro'],
  categorias: ['Emocional', 'Fisico', 'Digital', 'Social', 'Laboral', 'Psicologico'],
  triggers: [
    { nombre: 'Soledad', categoria: 'Emocional' },
    { nombre: 'Estrés', categoria: 'Emocional' },
    { nombre: 'Aburrimiento', categoria: 'Emocional' },
    { nombre: 'Cansancio', categoria: 'Fisico' },
    { nombre: 'Hambre', categoria: 'Fisico' },
    { nombre: 'Redes sociales', categoria: 'Digital' },
    { nombre: 'Amigos', categoria: 'Social' },
    { nombre: 'Pareja', categoria: 'Social' },
    { nombre: 'Trabajo', categoria: 'Laboral' },
    { nombre: 'Fracaso', categoria: 'Psicologico' },
  ],
}

let cachedReferenceData = null
let lastFetch = 0
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutos

export async function getReferenceData() {
  const now = Date.now()
  if (cachedReferenceData && now - lastFetch < CACHE_TTL_MS) {
    return cachedReferenceData
  }

  try {
    const [pecadosResp, triggersResp] = await Promise.all([
      supabase.from('ref_tipos_pecado').select('nombre').order('nombre'),
      supabase.from('ref_triggers').select('nombre, categoria').order('nombre'),
    ])

    const pecados =
      !pecadosResp.error && pecadosResp.data?.length
        ? pecadosResp.data.map((row) => row.nombre)
        : DEFAULT_REFERENCE_DATA.pecados

    const triggers =
      !triggersResp.error && triggersResp.data?.length
        ? triggersResp.data.map((row) => ({ nombre: row.nombre, categoria: row.categoria }))
        : DEFAULT_REFERENCE_DATA.triggers

    const categoriasFromTriggers = Array.from(
      new Set(triggers.map((row) => row.categoria).filter(Boolean))
    )

    const categorias =
      categoriasFromTriggers.length > 0 ? categoriasFromTriggers : DEFAULT_REFERENCE_DATA.categorias

    cachedReferenceData = { pecados, triggers, categorias }
    lastFetch = now
    return cachedReferenceData
  } catch (error) {
    console.error('Failed to load reference data:', error)
    cachedReferenceData = DEFAULT_REFERENCE_DATA
    return cachedReferenceData
  }
}


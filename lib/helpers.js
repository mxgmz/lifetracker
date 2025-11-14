/**
 * Format date to Spanish
 */
export function formatDate(date = new Date()) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('es-ES', options)
}

/**
 * Get day of year
 */
export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

/**
 * Get today's date key (YYYY-MM-DD)
 */
export function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calculate routine score from boolean fields
 */
export function calculateRoutineScore(routineData) {
  const booleanFields = Object.values(routineData).filter(val => typeof val === 'boolean')
  const trueCount = booleanFields.filter(val => val === true).length
  return booleanFields.length > 0 ? Math.round((trueCount / booleanFields.length) * 100) : 0
}

/**
 * Get scripture for the day (rotating)
 */
export function getScriptureOfDay() {
  const scriptures = [
    {
      text: "Esfuérzate y sé valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo",
      reference: "Josué 1:9"
    },
    {
      text: "Este es el día que hizo Jehová; nos gozaremos y alegraremos en él",
      reference: "Salmos 118:24"
    },
    {
      text: "En paz me acostaré y asimismo dormiré; porque solo tú, Jehová, me haces vivir confiado",
      reference: "Salmos 4:8"
    },
    {
      text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino",
      reference: "Salmos 119:105"
    },
    {
      text: "Confía en Jehová de todo tu corazón, y no te apoyes en tu propia prudencia",
      reference: "Proverbios 3:5"
    },
    {
      text: "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas",
      reference: "Mateo 6:33"
    },
    {
      text: "Todo lo puedo en Cristo que me fortalece",
      reference: "Filipenses 4:13"
    },
  ]
  
  const dayOfYear = getDayOfYear()
  return scriptures[dayOfYear % scriptures.length]
}


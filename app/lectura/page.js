'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateFact } from '@/lib/getOrCreateFact'
import { upsertDimension } from '@/lib/upsertDimension'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  LightBulbIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

// --- Components for Steps ---

const StepIntro = ({ onNext }) => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center h-full">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <BookOpenIcon className="w-12 h-12 text-blue-500" />
    </motion.div>
    <div className="space-y-2">
      <h1 className="text-4xl font-display font-bold text-white">
        Descarga de Conocimiento
      </h1>
      <p className="text-xl text-white/50 font-light">
        "Lámpara es a mis pies tu palabra, y lumbrera a mi camino"
      </p>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-900/30 transition-all flex items-center"
    >
      Iniciar Lectura <ChevronRightIcon className="w-5 h-5 ml-2" />
    </motion.button>
  </div>
)

const StepBookDetails = ({ register, watch }) => {
  const tipoLectura = watch('tipo_lectura')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Fuente de Verdad</h2>
        <p className="text-white/50">¿Qué estás leyendo?</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-blue-400 uppercase tracking-widest">Tipo de Lectura</label>
          <select
            {...register('tipo_lectura', { required: true })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
          >
            <option value="biblica" className="bg-[#050507]">Lectura Bíblica</option>
            <option value="general" className="bg-[#050507]">Lectura General</option>
          </select>
        </div>

        {tipoLectura === 'biblica' ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Libro Bíblico</label>
              <select
                {...register('libro')}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="" className="bg-[#050507]">Selecciona...</option>
                {['Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Salmos', 'Proverbios', 'Eclesiastés', 'Isaías', 'Jeremías', 'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', 'Gálatas', 'Efesios', 'Filipenses', 'Colosenses', 'Santiago'].map(b => (
                  <option key={b} value={b} className="bg-[#050507]">{b}</option>
                ))}
                <option value="Otro" className="bg-[#050507]">Otro</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Capítulo</label>
                <input
                  {...register('capitulo')}
                  type="number"
                  placeholder="#"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Versículos</label>
                <input
                  {...register('versiculos_rango')}
                  placeholder="Ej: 1-10"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Título del Libro</label>
            <input
              {...register('libro')}
              placeholder="Nombre del libro..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        )}
      </div>
    </div>
  )
}

const StepSessionStats = ({ register }) => (
  <div className="space-y-8">
    <div className="text-center space-y-2">
      <h2 className="text-3xl font-display font-bold text-white">Métricas de Sesión</h2>
      <p className="text-white/50">Cuantifica tu progreso</p>
    </div>

    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Tiempo (minutos)</label>
          <div className="relative">
            <input
              {...register('minutos')}
              type="number"
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white text-2xl font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <ClockIcon className="w-6 h-6 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

const StepTakeaways = ({ register, watch }) => {
  const tipoLectura = watch('tipo_lectura')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Key Takeaways</h2>
        <p className="text-white/50">¿Qué aprendiste hoy?</p>
      </div>

      <div className="glass-panel p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-white/50 uppercase tracking-widest">
            {tipoLectura === 'biblica' ? 'Revelación / Rhema' : 'Ideas Principales'}
          </label>
          <div className="relative">
            <textarea
              {...register('notas')}
              rows={6}
              placeholder={tipoLectura === 'biblica' ? "¿Qué te habló Dios hoy?" : "¿Qué concepto nuevo aprendiste?"}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white placeholder-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            />
            <LightBulbIcon className="w-6 h-6 text-yellow-500 absolute left-3 top-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Page Component ---

export default function LecturaPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const router = useRouter()

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      tipo_lectura: 'biblica',
    },
  })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
    }
    init()
  }, [])

  const onSubmit = async (data) => {
    if (!user) return
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const factId = await getOrCreateFact(user.id, today)

      if (data.tipo_lectura === 'biblica') {
        const now = new Date()
        const hora = now.getHours()
        let momentoDia = 'Tarde'
        if (hora >= 5 && hora < 12) momentoDia = 'Manana'
        else if (hora >= 12 && hora < 19) momentoDia = 'Tarde'
        else if (hora >= 19 && hora < 24) momentoDia = 'Noche'
        else momentoDia = 'Madrugada'

        const espiritualidadId = await upsertDimension('dim_espiritual', {
          user_id: user.id,
          momento_dia: momentoDia,
          practica: 'Lectura',
          libro_biblia: data.libro || null,
          capitulo: data.capitulo ? parseInt(data.capitulo) : null,
          versiculos_leidos: data.versiculos ? parseInt(data.versiculos) : null,
          tiempo_min: data.minutos ? parseInt(data.minutos) : null,
          insight_espiritual: data.notas || null,
        })

        await upsertDimension('dim_scripture_readings', {
          user_id: user.id,
          date_key: today,
          libro: data.libro || null,
          capitulo: data.capitulo ? parseInt(data.capitulo) : null,
          versiculos: data.versiculos_rango || null,
          total_versiculos: data.versiculos ? parseInt(data.versiculos) : null,
          insight: data.notas || null,
        })

        await supabase
          .from('fact_practicas_espirituales')
          .insert({ fact_id: factId, espiritualidad_key: espiritualidadId, momento_dia: momentoDia })

        await supabase
          .from('fact_habitos_diarios')
          .update({ espiritualidad_key: espiritualidadId })
          .eq('fact_id', factId)
      } else {
        const estudioId = await upsertDimension('dim_estudio', {
          user_id: user.id,
          tema: data.libro || 'Lectura general',
          categoria: 'Lectura',
          tiempo_min: data.minutos ? parseInt(data.minutos) : null,
          material_usado: 'Libro',
          insight_aprendido: data.notas || null,
        })

        await supabase
          .from('fact_habitos_diarios')
          .update({ estudio_key: estudioId })
          .eq('fact_id', factId)
      }

      router.push('/dashboard?success=lectura')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    <StepIntro key="intro" onNext={() => setStep(1)} />,
    <StepBookDetails key="details" register={register} watch={watch} />,
    <StepSessionStats key="stats" register={register} />,
    <StepTakeaways key="takeaways" register={register} watch={watch} />,
  ]

  const isLastStep = step === steps.length - 1

  if (!user) return <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white/50">Cargando...</div>

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative">
      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          />
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors z-10"
      >
        <ArrowLeftIcon className="w-6 h-6" />
      </button>

      {/* Main Content Area */}
      <div className="h-screen flex flex-col items-center justify-center p-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Actions (only for steps > 0) */}
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 w-full flex justify-end"
          >
            {isLastStep ? (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl font-bold text-lg shadow-lg shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isLoading ? 'Guardando...' : 'Finalizar Lectura'}
                {!isLoading && <CheckCircleIcon className="w-5 h-5 ml-2" />}
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-white transition-all flex items-center"
              >
                Siguiente <ChevronRightIcon className="w-4 h-4 ml-2" />
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}


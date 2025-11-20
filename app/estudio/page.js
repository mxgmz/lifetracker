'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateFact } from '@/lib/getOrCreateFact'
import { updateFact } from '@/lib/updateFact'
import { upsertDimension } from '@/lib/upsertDimension'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  ChevronRightIcon,
  ClockIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

// --- Components for Steps ---

const StepIntro = ({ onNext }) => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center h-full">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
    >
      <AcademicCapIcon className="w-12 h-12 text-indigo-500" />
    </motion.div>
    <div className="space-y-2">
      <h1 className="text-4xl font-display font-bold text-white">
        Upgrade de Habilidades
      </h1>
      <p className="text-xl text-white/50 font-light">
        "El corazón del prudente adquiere sabiduría"
      </p>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="mt-8 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-900/30 transition-all flex items-center"
    >
      Iniciar Sesión <ChevronRightIcon className="w-5 h-5 ml-2" />
    </motion.button>
  </div>
)

const StepTopic = ({ register }) => (
  <div className="space-y-8">
    <div className="text-center space-y-2">
      <h2 className="text-3xl font-display font-bold text-white">Objetivo de Estudio</h2>
      <p className="text-white/50">¿Qué estás aprendiendo?</p>
    </div>

    <div className="glass-panel p-6 space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Tema Principal</label>
        <input
          {...register('tema', { required: true })}
          placeholder="Ej: React Avanzado, Finanzas..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Categoría</label>
        <select
          {...register('categoria')}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
        >
          <option value="Programación" className="bg-[#050507]">Programación</option>
          <option value="Matemáticas" className="bg-[#050507]">Matemáticas</option>
          <option value="Ciencias" className="bg-[#050507]">Ciencias</option>
          <option value="Negocios" className="bg-[#050507]">Negocios</option>
          <option value="Idiomas" className="bg-[#050507]">Idiomas</option>
          <option value="Diseño" className="bg-[#050507]">Diseño</option>
          <option value="Teología" className="bg-[#050507]">Teología</option>
          <option value="Otro" className="bg-[#050507]">Otro</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Material Usado</label>
        <select
          {...register('material_usado')}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
        >
          <option value="Video" className="bg-[#050507]">Video</option>
          <option value="Libro" className="bg-[#050507]">Libro</option>
          <option value="Clase" className="bg-[#050507]">Clase</option>
          <option value="Proyecto" className="bg-[#050507]">Proyecto</option>
          <option value="Documentación" className="bg-[#050507]">Documentación</option>
          <option value="Artículo" className="bg-[#050507]">Artículo</option>
          <option value="Otro" className="bg-[#050507]">Otro</option>
        </select>
      </div>
    </div>
  </div>
)

const StepStats = ({ register, watch, setValue }) => {
  const depth = watch('profundidad')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Métricas de Sesión</h2>
        <p className="text-white/50">Profundidad y Tiempo</p>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Tiempo (minutos)</label>
            <div className="relative">
              <input
                {...register('tiempo_min')}
                type="number"
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white text-2xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <ClockIcon className="w-6 h-6 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RocketLaunchIcon className="w-6 h-6 text-indigo-500" />
              <span className="text-lg font-medium text-white">Profundidad (Focus)</span>
            </div>
            <span className="text-2xl font-bold text-indigo-500">{depth}/5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={depth}
            onChange={(e) => setValue('profundidad', parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-white/30 uppercase tracking-widest">
            <span>Superficial</span>
            <span>Deep Work</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const StepProgress = ({ register }) => (
  <div className="space-y-8">
    <div className="text-center space-y-2">
      <h2 className="text-3xl font-display font-bold text-white">Progreso Logrado</h2>
      <p className="text-white/50">¿Qué dominaste hoy?</p>
    </div>

    <div className="glass-panel p-6 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Insight / Aprendizaje</label>
        <div className="relative">
          <textarea
            {...register('insight_aprendido')}
            rows={6}
            placeholder="Describe el concepto clave que entendiste..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
          />
          <LightBulbIcon className="w-6 h-6 text-yellow-500 absolute left-3 top-4" />
        </div>
      </div>
    </div>
  </div>
)

// --- Main Page Component ---

export default function EstudioPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const router = useRouter()

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      profundidad: 3,
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

      const now = new Date()
      const hora = now.getHours()
      let momentoDia = 'Tarde'
      if (hora >= 5 && hora < 12) momentoDia = 'Manana'
      else if (hora >= 12 && hora < 19) momentoDia = 'Tarde'
      else if (hora >= 19 && hora < 24) momentoDia = 'Noche'
      else momentoDia = 'Madrugada'

      const estudioId = await upsertDimension('dim_estudio', {
        user_id: user.id,
        momento_dia: momentoDia,
        tema: data.tema || null,
        categoria: data.categoria || null,
        tiempo_min: data.tiempo_min ? parseInt(data.tiempo_min) : null,
        profundidad: data.profundidad ? parseInt(data.profundidad) : null,
        material_usado: data.material_usado || null,
        insight_aprendido: data.insight_aprendido || null,
      })

      await supabase
        .from('fact_estudios')
        .insert({ fact_id: factId, estudio_key: estudioId, orden: 1 })

      await updateFact(factId, { estudio_key: estudioId }, user.id)

      router.push('/dashboard?success=estudio')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    <StepIntro key="intro" onNext={() => setStep(1)} />,
    <StepTopic key="topic" register={register} />,
    <StepStats key="stats" register={register} watch={watch} setValue={setValue} />,
    <StepProgress key="progress" register={register} />,
  ]

  const isLastStep = step === steps.length - 1

  if (!user) return <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white/50">Cargando...</div>

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative">
      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
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
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isLoading ? 'Guardando...' : 'Registrar Progreso'}
                {!isLoading && <AcademicCapIcon className="w-5 h-5 ml-2" />}
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


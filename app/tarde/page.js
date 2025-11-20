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
  SunIcon,
  BoltIcon,
  SparklesIcon,
  FlagIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  ChevronRightIcon,
  HeartIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// --- Components for Steps ---

const StepIntro = ({ user, onNext }) => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center h-full">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
    >
      <SunIcon className="w-12 h-12 text-amber-400" />
    </motion.div>
    <div className="space-y-2">
      <h1 className="text-4xl font-display font-bold text-white">
        Buenas tardes, {user?.email?.split('@')[0] || 'Guerrero'}
      </h1>
      <p className="text-xl text-white/50 font-light">
        "Examíname, oh Dios, y conoce mi corazón; pruébame y conoce mis pensamientos"
      </p>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="mt-8 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-amber-900/30 transition-all flex items-center"
    >
      Recalibrar Rumbo <ChevronRightIcon className="w-5 h-5 ml-2" />
    </motion.button>
  </div>
)

const StepPriorities = ({ priorities, togglePriority }) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Misión del Día</h2>
        <p className="text-white/50">¿Cómo vas con tus objetivos?</p>
      </div>

      <div className="glass-panel p-6 space-y-4">
        {priorities.length === 0 ? (
          <p className="text-center text-white/30 italic">No definiste prioridades esta mañana.</p>
        ) : (
          priorities.map((p) => (
            <button
              key={p.meta_key}
              onClick={() => togglePriority(p.meta_key)}
              className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between group ${p.cumplida
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
            >
              <span className={`text-lg font-medium ${p.cumplida ? 'text-green-300 line-through' : 'text-white'}`}>
                {p.descripcion}
              </span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${p.cumplida
                  ? 'border-green-400 bg-green-400 text-black'
                  : 'border-white/30 group-hover:border-white/50'
                }`}>
                {p.cumplida && <CheckCircleIcon className="w-4 h-4" />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

const StepMind = ({ register, watch, setValue }) => {
  const metrics = [
    {
      name: 'ansiedad',
      label: 'Ansiedad',
      icon: '😰',
      inverse: true,
      subtitles: ['Zen', 'Baja', 'Manejable', 'Alta', 'Pánico']
    },
    {
      name: 'enfoque',
      label: 'Enfoque',
      icon: '🎯',
      subtitles: ['Disperso', 'Distraído', 'Presente', 'Enfocado', 'Láser']
    },
    {
      name: 'animo',
      label: 'Ánimo',
      icon: '😐',
      subtitles: ['Deprimido', 'Bajo', 'Normal', 'Bueno', 'Excelente']
    },
    {
      name: 'estres',
      label: 'Estrés',
      icon: '🤯',
      inverse: true,
      subtitles: ['Relajado', 'Leve', 'Moderado', 'Alto', 'Burnout']
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Estado Mental</h2>
        <p className="text-white/50">Escaneo de medio día</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {metrics.map((m) => {
          const val = watch(m.name)
          return (
            <div key={m.name} className="glass-card p-4 flex items-center space-x-4">
              <div className="text-2xl">{m.icon}</div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80 font-medium">{m.label}</span>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold block">{val}/5</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                      {m.subtitles[val - 1]}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={val}
                  onChange={(e) => setValue(m.name, parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="glass-panel p-4">
        <textarea
          {...register('como_va_dia')}
          rows={2}
          placeholder="¿Cómo va tu día en una frase?"
          className="w-full bg-transparent text-white placeholder-white/30 focus:outline-none resize-none"
        />
      </div>
    </div>
  )
}

const StepPhysical = ({ register, watch, setValue }) => {
  const tomeAgua = watch('tome_agua')
  const comiBien = watch('comi_bien')
  const microReset = watch('micro_reset')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Cuerpo & Reset</h2>
        <p className="text-white/50">Mantenimiento del vehículo</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => setValue('tome_agua', !tomeAgua)}
          className={`p-6 rounded-xl border transition-all flex items-center space-x-4 ${tomeAgua ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/10'
            }`}
        >
          <div className={`p-3 rounded-full ${tomeAgua ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/30'}`}>
            <HeartIcon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-lg ${tomeAgua ? 'text-white' : 'text-white/50'}`}>Hidratación</h3>
            <p className="text-sm text-white/30">He tomado suficiente agua</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setValue('comi_bien', !comiBien)}
          className={`p-6 rounded-xl border transition-all flex items-center space-x-4 ${comiBien ? 'bg-green-500/20 border-green-500/50' : 'bg-white/5 border-white/10'
            }`}
        >
          <div className={`p-3 rounded-full ${comiBien ? 'bg-green-500 text-white' : 'bg-white/10 text-white/30'}`}>
            <SparklesIcon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-lg ${comiBien ? 'text-white' : 'text-white/50'}`}>Nutrición</h3>
            <p className="text-sm text-white/30">Comí alimentos nutritivos</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setValue('micro_reset', !microReset)}
          className={`p-6 rounded-xl border transition-all flex items-center space-x-4 ${microReset ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10'
            }`}
        >
          <div className={`p-3 rounded-full ${microReset ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/30'}`}>
            <ArrowPathIcon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-lg ${microReset ? 'text-white' : 'text-white/50'}`}>Micro-Reset</h3>
            <p className="text-sm text-white/30">2 min de respiración o pausa</p>
          </div>
        </button>
      </div>
    </div>
  )
}

// --- Main Page Component ---

export default function TardePage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [priorities, setPriorities] = useState([])
  const router = useRouter()

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      ansiedad: 3,
      enfoque: 3,
      animo: 3,
      estres: 3,
      tome_agua: false,
      comi_bien: false,
      micro_reset: false,
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
      fetchPriorities(session.user.id)
    }
    init()
  }, [])

  const fetchPriorities = async (userId) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('dim_metas')
      .select('*')
      .eq('user_id', userId)
      .eq('date_key', today)
      .eq('tipo', 'Diaria')
      .order('orden', { ascending: true })

    if (data) setPriorities(data)
  }

  const togglePriority = (metaKey) => {
    setPriorities(prev => prev.map(p =>
      p.meta_key === metaKey ? { ...p, cumplida: !p.cumplida } : p
    ))
  }

  const onSubmit = async (data) => {
    if (!user) return
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const factId = await getOrCreateFact(user.id, today)

      // 1. Update Priorities
      for (const p of priorities) {
        await supabase
          .from('dim_metas')
          .update({ cumplida: p.cumplida })
          .eq('meta_key', p.meta_key)
      }

      // 2. Emotional State
      const estadoEmocionalId = await upsertDimension('dim_estado_emocional', {
        user_id: user.id,
        momento_dia: 'Tarde',
        ansiedad: data.ansiedad,
        enfoque: data.enfoque,
        animo: data.animo,
        estres: data.estres, // Assuming column exists or mapping to something
        descripcion: data.como_va_dia || null,
      })

      // 3. Fact Update
      await updateFact(factId, {
        estado_emocional_tarde_key: estadoEmocionalId,
        hora_registro_tarde: new Date().toISOString(),
        ansiedad: data.ansiedad,
        enfoque: data.enfoque,
        estres: data.estres,
        reflexion_tarde: data.como_va_dia || null,
        agua_tomada_tarde: data.tome_agua,
        comida_bien_tarde: data.comi_bien,
        micro_reset_realizado: data.micro_reset,
      }, user.id)

      router.push('/dashboard?success=tarde')
    } catch (error) {
      console.error(error)
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    <StepIntro key="intro" user={user} onNext={() => setStep(1)} />,
    <StepPriorities key="priorities" priorities={priorities} togglePriority={togglePriority} />,
    <StepMind key="mind" register={register} watch={watch} setValue={setValue} />,
    <StepPhysical key="physical" register={register} watch={watch} setValue={setValue} />,
  ]

  const isLastStep = step === steps.length - 1

  if (!user) return <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white/50">Cargando...</div>

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative">
      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
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
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl font-bold text-lg shadow-lg shadow-amber-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isLoading ? 'Guardando...' : 'Finalizar Recalibración'}
                {!isLoading && <FlagIcon className="w-5 h-5 ml-2" />}
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

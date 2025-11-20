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
  MoonIcon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
  HeartIcon,
  SparklesIcon,
  FlagIcon,
  CheckCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

// --- Components for Steps ---

const StepIntro = ({ user, onNext }) => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center h-full">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
    >
      <MoonIcon className="w-12 h-12 text-indigo-400" />
    </motion.div>
    <div className="space-y-2">
      <h1 className="text-4xl font-display font-bold text-white">
        Buenas noches, {user?.email?.split('@')[0] || 'Guerrero'}
      </h1>
      <p className="text-xl text-white/50 font-light">
        "En paz me acostaré y asimismo dormiré; porque solo tú, Jehová, me haces vivir confiado"
      </p>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="mt-8 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-900/30 transition-all flex items-center"
    >
      Cerrar el Día <ChevronRightIcon className="w-5 h-5 ml-2" />
    </motion.button>
  </div>
)

const StepReview = ({ priorities, togglePriority }) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Revisión de Misión</h2>
        <p className="text-white/50">¿Cumpliste tus objetivos de hoy?</p>
      </div>

      <div className="glass-panel p-6 space-y-4">
        {priorities.length === 0 ? (
          <p className="text-center text-white/30 italic">No definiste prioridades hoy.</p>
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

const StepHabits = ({ register, watch, setValue }) => {
  const habits = [
    { name: 'oracion', label: 'Oración', icon: SparklesIcon },
    { name: 'planeacion', label: 'Planeación Mañana', icon: FlagIcon },
    { name: 'cierre_redes', label: 'Cierre de Redes', icon: ClipboardDocumentCheckIcon },
    { name: 'ropa_lista', label: 'Ropa Lista', icon: HomeIcon },
    { name: 'orden_minimo', label: 'Orden Mínimo', icon: CheckCircleIcon },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Rituales Nocturnos</h2>
        <p className="text-white/50">Prepara el terreno para mañana</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {habits.map((h) => {
          const isActive = watch(h.name)
          return (
            <button
              key={h.name}
              type="button"
              onClick={() => setValue(h.name, !isActive)}
              className={`p-4 rounded-xl border transition-all flex items-center space-x-4 ${isActive ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/10'
                }`}
            >
              <div className={`p-2 rounded-full ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/30'}`}>
                <h.icon className="w-6 h-6" />
              </div>
              <span className={`font-medium text-lg ${isActive ? 'text-white' : 'text-white/50'}`}>
                {h.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const StepGratitude = ({ register }) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Gratitud & Identidad</h2>
        <p className="text-white/50">Reconoce lo bueno y quién fuiste hoy</p>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">3 Gratitudes</h3>
          <input
            {...register('gratitud_1')}
            placeholder="1. Hoy agradezco por..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <input
            {...register('gratitud_2')}
            placeholder="2. Hoy agradezco por..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <input
            {...register('gratitud_3')}
            placeholder="3. Hoy agradezco por..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Identidad</h3>
          <textarea
            {...register('quien_fuiste')}
            rows={3}
            placeholder="¿Quién fuiste hoy? (Ej: Un líder paciente, un creador enfocado...)"
            className="w-full bg-transparent text-white placeholder-white/30 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  )
}

// --- Main Page Component ---

export default function NochePage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [priorities, setPriorities] = useState([])
  const router = useRouter()

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      oracion: false,
      planeacion: false,
      cierre_redes: false,
      ropa_lista: false,
      orden_minimo: false,
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

      // 2. Night Routine
      const rutinaNightId = await upsertDimension('dim_rutina', {
        user_id: user.id,
        tipo_rutina: 'Noche',
        oracion: data.oracion,
        planeacion: data.planeacion,
        cierre_redes: data.cierre_redes,
        ropa_lista: data.ropa_lista,
        orden_espacio: data.orden_minimo,
      })

      // 3. Gratitudes
      const gratitudesData = [data.gratitud_1, data.gratitud_2, data.gratitud_3].filter(Boolean)
      const gratitudesToLink = []

      for (let i = 0; i < gratitudesData.length; i++) {
        const gratitudKey = await upsertDimension('dim_gratitud', {
          user_id: user.id,
          date_key: today,
          orden: i + 1,
          descripcion: gratitudesData[i],
        })
        gratitudesToLink.push({ gratitud_key: gratitudKey, orden: i + 1 })
      }

      // 4. Fact Update
      await updateFact(factId, {
        rutina_noche_key: rutinaNightId,
        hora_registro_noche: new Date().toISOString(),
        quien_fuiste_hoy: data.quien_fuiste || null,
      }, user.id)

      // Link Gratitudes
      if (gratitudesToLink.length) {
        const { count: gratCount } = await supabase
          .from('fact_gratitudes')
          .select('*', { count: 'exact', head: true })
          .eq('fact_id', factId)

        await supabase.from('fact_gratitudes').insert(
          gratitudesToLink.map((gr, idx) => ({
            fact_id: factId,
            gratitud_key: gr.gratitud_key,
            orden: (gratCount || 0) + idx + 1,
          }))
        )
      }

      router.push('/dashboard?success=noche')
    } catch (error) {
      console.error(error)
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    <StepIntro key="intro" user={user} onNext={() => setStep(1)} />,
    <StepReview key="review" priorities={priorities} togglePriority={togglePriority} />,
    <StepHabits key="habits" register={register} watch={watch} setValue={setValue} />,
    <StepGratitude key="gratitude" register={register} />,
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
                {isLoading ? 'Guardando...' : 'Descansar'}
                {!isLoading && <MoonIcon className="w-5 h-5 ml-2" />}
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

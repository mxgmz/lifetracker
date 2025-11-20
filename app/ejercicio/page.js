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
  FireIcon,
  BoltIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

// --- Components for Steps ---

const StepIntro = ({ onNext }) => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center h-full">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
    >
      <FireIcon className="w-12 h-12 text-orange-500" />
    </motion.div>
    <div className="space-y-2">
      <h1 className="text-4xl font-display font-bold text-white">
        Sesión de Entrenamiento
      </h1>
      <p className="text-xl text-white/50 font-light">
        "¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo?"
      </p>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="mt-8 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-900/30 transition-all flex items-center"
    >
      Iniciar Registro <ChevronRightIcon className="w-5 h-5 ml-2" />
    </motion.button>
  </div>
)

const StepDetails = ({ register, watch, plans }) => {
  const tipoEjercicio = watch('tipo')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Detalles de la Sesión</h2>
        <p className="text-white/50">¿Qué entrenaste hoy?</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-orange-400 uppercase tracking-widest">Tipo de Ejercicio</label>
          <select
            {...register('tipo', { required: true })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none"
          >
            <option value="Correr" className="bg-[#050507]">Correr</option>
            <option value="Pesas" className="bg-[#050507]">Pesas</option>
            <option value="Caminata" className="bg-[#050507]">Caminata</option>
            <option value="Ciclismo" className="bg-[#050507]">Ciclismo</option>
            <option value="Natación" className="bg-[#050507]">Natación</option>
            <option value="Yoga" className="bg-[#050507]">Yoga</option>
            <option value="Deportes" className="bg-[#050507]">Deportes</option>
            <option value="Otro" className="bg-[#050507]">Otro</option>
          </select>
        </div>

        {plans.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-blue-400 uppercase tracking-widest">Plan Ejecutado</label>
            <select
              {...register('ejercicio_plan_key')}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="" className="bg-[#050507]">Sin plan específico</option>
              {plans.map(plan => (
                <option key={plan.plan_key} value={plan.plan_key} className="bg-[#050507]">
                  {plan.tipo} {plan.distancia_km_planeada ? `· ${plan.distancia_km_planeada}km` : ''} {plan.grupo_muscular ? `· ${plan.grupo_muscular}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {(tipoEjercicio === 'Correr' || tipoEjercicio === 'Caminata' || tipoEjercicio === 'Ciclismo') && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Distancia (km)</label>
              <div className="relative">
                <input
                  {...register('distancia_km')}
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
                <MapPinIcon className="w-5 h-5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            {tipoEjercicio === 'Correr' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Pace (min/km)</label>
                <div className="relative">
                  <input
                    {...register('pace')}
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  <ClockIcon className="w-5 h-5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
          </div>
        )}

        {tipoEjercicio === 'Pesas' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Grupo Muscular</label>
            <select
              {...register('grupo_muscular')}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none"
            >
              <option value="" className="bg-[#050507]">Selecciona...</option>
              <option value="Pecho" className="bg-[#050507]">Pecho</option>
              <option value="Espalda" className="bg-[#050507]">Espalda</option>
              <option value="Piernas" className="bg-[#050507]">Piernas</option>
              <option value="Hombros" className="bg-[#050507]">Hombros</option>
              <option value="Brazos" className="bg-[#050507]">Brazos</option>
              <option value="Core" className="bg-[#050507]">Core</option>
              <option value="Full body" className="bg-[#050507]">Full body</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

const StepStats = ({ register, watch, setValue }) => {
  const intensity = watch('intensidad')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Intensidad y Tiempo</h2>
        <p className="text-white/50">¿Qué tan duro trabajaste?</p>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Duración (minutos)</label>
            <div className="relative">
              <input
                {...register('duracion')}
                type="number"
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white text-2xl font-bold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
              <ClockIcon className="w-6 h-6 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FireIcon className="w-6 h-6 text-orange-500" />
              <span className="text-lg font-medium text-white">RPE (Esfuerzo Percibido)</span>
            </div>
            <span className="text-2xl font-bold text-orange-500">{intensity}/5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={intensity}
            onChange={(e) => setValue('intensidad', parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-white/30 uppercase tracking-widest">
            <span>Suave</span>
            <span>Máximo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const StepDebrief = ({ register }) => (
  <div className="space-y-8">
    <div className="text-center space-y-2">
      <h2 className="text-3xl font-display font-bold text-white">Debrief</h2>
      <p className="text-white/50">Notas finales de la sesión</p>
    </div>

    <div className="glass-panel p-6 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Observaciones</label>
        <textarea
          {...register('descripcion')}
          rows={6}
          placeholder="¿Cómo te sentiste? ¿Lograste tus objetivos? ¿Alguna molestia?"
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
        />
      </div>
    </div>
  </div>
)

// --- Main Page Component ---

export default function EjercicioPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [plans, setPlans] = useState([])
  const router = useRouter()

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      tipo: 'Correr',
      intensidad: 3,
      ejercicio_plan_key: '',
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
      await loadPlans(session.user.id)
    }
    init()
  }, [])

  const loadPlans = async (userId) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('dim_ejercicio_planeado')
      .select('plan_key, tipo, grupo_muscular, distancia_km_planeada, notas')
      .eq('user_id', userId)
      .eq('date_key', today)
      .order('created_at', { ascending: true })
    if (!error && data) {
      setPlans(data)
    }
  }

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

      const ejercicioData = {
        user_id: user.id,
        momento_dia: momentoDia,
        tipo: data.tipo,
        grupo_muscular: data.grupo_muscular || null,
        distancia_km: data.distancia_km ? parseFloat(data.distancia_km) : null,
        pace_min_km: data.pace ? parseFloat(data.pace) : null,
        duracion_min: data.duracion ? parseInt(data.duracion) : null,
        intensidad: data.intensidad ? parseInt(data.intensidad) : null,
        descripcion: data.descripcion || null,
      }

      if (data.ejercicio_plan_key) {
        ejercicioData.ejercicio_plan_key = data.ejercicio_plan_key
      }

      const ejercicioId = await upsertDimension('dim_ejercicio', ejercicioData)

      const { count: ejercicioCount } = await supabase
        .from('fact_ejercicios')
        .select('*', { count: 'exact', head: true })
        .eq('fact_id', factId)

      await supabase
        .from('fact_ejercicios')
        .insert({ fact_id: factId, ejercicio_key: ejercicioId, orden: (ejercicioCount || 0) + 1 })

      await updateFact(factId, { ejercicio_key: ejercicioId }, user.id)

      router.push('/dashboard?success=ejercicio')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    <StepIntro key="intro" onNext={() => setStep(1)} />,
    <StepDetails key="details" register={register} watch={watch} plans={plans} />,
    <StepStats key="stats" register={register} watch={watch} setValue={setValue} />,
    <StepDebrief key="debrief" register={register} />,
  ]

  const isLastStep = step === steps.length - 1

  if (!user) return <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white/50">Cargando...</div>

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative">
      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
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
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl font-bold text-lg shadow-lg shadow-orange-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isLoading ? 'Guardando...' : 'Finalizar Sesión'}
                {!isLoading && <TrophyIcon className="w-5 h-5 ml-2" />}
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


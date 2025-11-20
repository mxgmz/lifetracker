'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateFact } from '@/lib/getOrCreateFact'
import { updateFact } from '@/lib/updateFact'
import { upsertDimension } from '@/lib/upsertDimension'
import { getReferenceData, DEFAULT_REFERENCE_DATA } from '@/lib/referenceData'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  FireIcon,
  BoltIcon,
  ChevronRightIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

// --- Components for Steps ---

const StepIntro = ({ user, onNext }) => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center h-full">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
    >
      <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
    </motion.div>
    <div className="space-y-2">
      <h1 className="text-4xl font-display font-bold text-white">
        Reporte de Batalla
      </h1>
      <p className="text-xl text-white/50 font-light">
        "No os ha sobrevenido ninguna tentación que no sea humana; pero fiel es Dios"
      </p>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="mt-8 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-900/30 transition-all flex items-center"
    >
      Registrar Contacto <ChevronRightIcon className="w-5 h-5 ml-2" />
    </motion.button>
  </div>
)

const StepEnemyID = ({ register, watch, pecados, triggers, categorias }) => {
  const triggerOption = watch('trigger_option')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Identificación del Enemigo</h2>
        <p className="text-white/50">¿A qué te enfrentaste?</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-red-400 uppercase tracking-widest">Tipo de Tentación</label>
          <select
            {...register('tipo_tentacion', { required: true })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all appearance-none"
          >
            <option value="" className="bg-[#050507]">Selecciona...</option>
            {pecados.map(p => <option key={p} value={p} className="bg-[#050507]">{p}</option>)}
            <option value="Otro" className="bg-[#050507]">Otro</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-orange-400 uppercase tracking-widest">Detonante (Trigger)</label>
          <select
            {...register('trigger_option')}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none"
          >
            <option value="" className="bg-[#050507]">Selecciona...</option>
            {triggers.map(t => <option key={t.nombre} value={t.nombre} className="bg-[#050507]">{t.nombre}</option>)}
            <option value="otro" className="bg-[#050507]">Otro</option>
          </select>
        </div>

        {triggerOption === 'otro' && (
          <input
            {...register('trigger_custom')}
            placeholder="Describe el detonante específico..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Contexto</label>
          <textarea
            {...register('contexto')}
            rows={2}
            placeholder="¿Dónde estabas? ¿Qué hacías?"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  )
}

const StepBattleStats = ({ register, watch, setValue }) => {
  const risk = watch('nivel_riesgo')
  const intensity = watch('intensidad')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Estadísticas de Combate</h2>
        <p className="text-white/50">Evalúa la amenaza</p>
      </div>

      <div className="space-y-8">
        {/* Risk Slider */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
              <span className="text-lg font-medium text-white">Nivel de Riesgo</span>
            </div>
            <span className="text-2xl font-bold text-yellow-500">{risk}/5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={risk}
            onChange={(e) => setValue('nivel_riesgo', parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
          />
          <div className="flex justify-between text-xs text-white/30 uppercase tracking-widest">
            <span>Bajo</span>
            <span>Crítico</span>
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FireIcon className="w-6 h-6 text-red-500" />
              <span className="text-lg font-medium text-white">Intensidad</span>
            </div>
            <span className="text-2xl font-bold text-red-500">{intensity}/5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={intensity}
            onChange={(e) => setValue('intensidad', parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="flex justify-between text-xs text-white/30 uppercase tracking-widest">
            <span>Manejable</span>
            <span>Abrumadora</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const StepOutcome = ({ register, watch, setValue }) => {
  const gano = watch('gano_tentacion')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Resultado y Debrief</h2>
        <p className="text-white/50">¿Cuál fue el desenlace?</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setValue('gano_tentacion', true)}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center space-y-3 ${gano === true
                ? 'bg-green-500/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
          >
            <ShieldCheckIcon className={`w-10 h-10 ${gano === true ? 'text-green-400' : 'text-white/30'}`} />
            <span className={`font-bold ${gano === true ? 'text-green-400' : 'text-white/50'}`}>Victoria</span>
          </button>

          <button
            type="button"
            onClick={() => setValue('gano_tentacion', false)}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center space-y-3 ${gano === false
                ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
          >
            <XCircleIcon className={`w-10 h-10 ${gano === false ? 'text-red-400' : 'text-white/30'}`} />
            <span className={`font-bold ${gano === false ? 'text-red-400' : 'text-white/50'}`}>Derrota</span>
          </button>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Acción de Autocontrol</label>
            <input
              {...register('accion_autocontrol')}
              placeholder="¿Qué hiciste para resistir?"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Reflexión Táctica</label>
            <textarea
              {...register('reflexion')}
              rows={3}
              placeholder="¿Qué aprendiste? ¿Qué harás diferente la próxima vez?"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Page Component ---

export default function TentacionPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [pecados, setPecados] = useState(DEFAULT_REFERENCE_DATA.pecados)
  const [triggersRef, setTriggersRef] = useState(DEFAULT_REFERENCE_DATA.triggers)
  const [categorias, setCategorias] = useState(DEFAULT_REFERENCE_DATA.categorias)
  const router = useRouter()

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      nivel_riesgo: 3,
      intensidad: 3,
      gano_tentacion: false,
      trigger_option: '',
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
      await populateReferenceData()
    }
    init()
  }, [])

  const populateReferenceData = async () => {
    const data = await getReferenceData()
    setPecados(data.pecados)
    setTriggersRef(data.triggers)
    setCategorias(data.categorias)
  }

  const onSubmit = async (data) => {
    if (!user) return
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const factId = await getOrCreateFact(user.id, today)

      // Insert dim_tentacion with temporal info
      const now = new Date()
      const hora = now.getHours()
      let momentoDia = 'Tarde'
      if (hora >= 5 && hora < 12) momentoDia = 'Manana'
      else if (hora >= 12 && hora < 19) momentoDia = 'Tarde'
      else if (hora >= 19 && hora < 24) momentoDia = 'Noche'
      else momentoDia = 'Madrugada'

      const triggerValue =
        data.trigger_option && data.trigger_option !== 'otro'
          ? data.trigger_option
          : data.trigger_custom || null

      let categoriaValue = data.categoria_tentacion || null
      if (!categoriaValue && triggerValue) {
        const match = triggersRef.find((t) => t.nombre === triggerValue)
        if (match?.categoria) {
          categoriaValue = match.categoria
        }
      }

      const tentacionData = {
        user_id: user.id,
        momento_dia: momentoDia,
        fuente_registro: 'Registro_Individual',
        hora_aproximada: now.toTimeString().split(' ')[0],
        trigger_principal: triggerValue,
        pecado_principal: data.tipo_tentacion,
        nivel_riesgo: data.nivel_riesgo ? parseInt(data.nivel_riesgo) : null,
        contexto: data.contexto || null,
        gano_tentacion: data.gano_tentacion || false,
        descripcion: [
          data.accion_autocontrol || '',
          data.reflexion ? `Reflexión: ${data.reflexion}` : ''
        ].filter(Boolean).join(' | '),
      }

      if (categoriaValue) {
        tentacionData.categoria = categoriaValue
      }

      const tentacionId = await upsertDimension('dim_tentacion', tentacionData)

      // Add to fact using bridge table
      await supabase
        .from('fact_tentaciones')
        .insert({ fact_id: factId, tentacion_key: tentacionId, orden: 1 })

      // Update fact for backwards compatibility
      await updateFact(factId, { tentacion_key: tentacionId }, user.id)

      router.push('/dashboard?success=tentacion')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    <StepIntro key="intro" user={user} onNext={() => setStep(1)} />,
    <StepEnemyID key="enemy" register={register} watch={watch} pecados={pecados} triggers={triggersRef} categorias={categorias} />,
    <StepBattleStats key="stats" register={register} watch={watch} setValue={setValue} />,
    <StepOutcome key="outcome" register={register} watch={watch} setValue={setValue} />,
  ]

  const isLastStep = step === steps.length - 1

  if (!user) return <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white/50">Cargando...</div>

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative">
      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
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
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl font-bold text-lg shadow-lg shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isLoading ? 'Reportando...' : 'Finalizar Reporte'}
                {!isLoading && <BoltIcon className="w-5 h-5 ml-2" />}
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

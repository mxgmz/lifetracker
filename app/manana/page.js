'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
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
  ClockIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

// --- Helper Data ---

const BIBLE_BOOKS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut',
  '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras',
  'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios', 'Eclesiastés', 'Cantares',
  'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel',
  'Amós', 'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo',
  'Zacarías', 'Malaquías', 'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos',
  '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios', 'Filipenses', 'Colosenses',
  '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón',
  'Hebreos', 'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis'
]

// --- Components for Steps ---

const StepIntro = ({ user, onNext, yesterdaySleep }) => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center h-full">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <SunIcon className="w-12 h-12 text-blue-400" />
    </motion.div>
    <div className="space-y-2">
      <h1 className="text-4xl font-display font-bold text-white">
        Buenos días, {user?.email?.split('@')[0] || 'Guerrero'}
      </h1>
      <p className="text-xl text-white/50 font-light">
        "Este es el día que hizo Jehová; nos gozaremos y alegraremos en él"
      </p>
    </div>

    {yesterdaySleep && (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-xs mx-auto">
        <p className="text-sm text-white/40 uppercase tracking-wider mb-1">Ayer dormiste</p>
        <p className="text-2xl font-display font-bold text-white">{yesterdaySleep} horas</p>
      </div>
    )}

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-900/30 transition-all flex items-center"
    >
      Comenzar Protocolo <ChevronRightIcon className="w-5 h-5 ml-2" />
    </motion.button>
  </div>
)

const StepSleep = ({ register, watch, setValue }) => {
  const sleepQuality = watch('sleep_quality')
  const horaDespertar = watch('hora_despertar')
  const sleepHours = watch('sleep_hours')

  const calculateBedtime = () => {
    if (!horaDespertar || !sleepHours) return null
    const [hours, minutes] = horaDespertar.split(':').map(Number)
    const wakeDate = new Date()
    wakeDate.setHours(hours, minutes, 0)

    const bedDate = new Date(wakeDate.getTime() - (sleepHours * 60 * 60 * 1000))
    return bedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const bedtime = calculateBedtime()

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Análisis de Sueño</h2>
        <p className="text-white/50">¿Cómo recargaste tu batería?</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-white/60 font-medium flex items-center">
              <ClockIcon className="w-4 h-4 mr-2 text-blue-400" /> Hora de despertar
            </label>
            <input
              type="time"
              {...register('hora_despertar')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 text-lg text-center"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/60 font-medium flex items-center">
              <SunIcon className="w-4 h-4 mr-2 text-amber-400" /> Horas dormidas
            </label>
            <input
              type="number"
              step="0.5"
              {...register('sleep_hours')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 text-lg text-center"
            />
          </div>
        </div>

        {bedtime && (
          <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-300">
              Entonces te dormiste a las <span className="font-bold text-white">{bedtime}</span>?
            </p>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-sm text-white/60 font-medium block text-center">Calidad del Sueño</label>
          <div className="flex justify-between items-center px-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setValue('sleep_quality', val)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-all ${sleepQuality === val
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-110'
                  : 'bg-white/5 text-white/30 hover:bg-white/10'
                  }`}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-white/30 px-2">
            <span>Terrible</span>
            <span>Excelente</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const StepMind = ({ register, watch, setValue }) => {
  const metrics = [
    {
      name: 'energia',
      label: 'Energía',
      icon: '⚡️',
      subtitles: ['Agotado', 'Bajo', 'Normal', 'Alto', 'Imparable']
    },
    {
      name: 'enfoque',
      label: 'Enfoque',
      icon: '🎯',
      subtitles: ['Disperso', 'Distraído', 'Presente', 'Enfocado', 'Láser']
    },
    {
      name: 'motivacion',
      label: 'Motivación',
      icon: '🔥',
      subtitles: ['Apática', 'Baja', 'Neutra', 'Alta', 'On Fire']
    },
    {
      name: 'ansiedad',
      label: 'Ansiedad',
      icon: '😰',
      inverse: true,
      subtitles: ['Zen', 'Baja', 'Manejable', 'Alta', 'Pánico']
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Estado Mental</h2>
        <p className="text-white/50">Calibra tu motor interno</p>
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
                    <span className="text-blue-400 font-bold block">{val}/5</span>
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
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="glass-panel p-4">
        <textarea
          {...register('como_amaneciste')}
          rows={2}
          placeholder="¿Algún pensamiento dominante al despertar?"
          className="w-full bg-transparent text-white placeholder-white/30 focus:outline-none resize-none"
        />
      </div>
    </div>
  )
}

const StepSpirit = ({ register, watch, setValue, lastReading }) => {
  const oracion = watch('oracion_realizada')
  const [continueReading, setContinueReading] = useState(false)

  useEffect(() => {
    if (lastReading && continueReading) {
      setValue('libro_biblia', lastReading.libro)
      setValue('capitulo', lastReading.capitulo + 1)
    }
  }, [continueReading, lastReading, setValue])

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Espíritu</h2>
        <p className="text-white/50">Alineación vertical</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <button
          type="button"
          onClick={() => setValue('oracion_realizada', !oracion)}
          className={`w-full p-4 rounded-xl border transition-all flex items-center justify-center space-x-3 ${oracion
            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
            }`}
        >
          <SparklesIcon className="w-6 h-6" />
          <span className="font-medium text-lg">He orado hoy</span>
        </button>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Lectura Bíblica</h3>

          {lastReading && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-white/40">Última lectura:</span>
                <p className="text-white font-medium">{lastReading.libro} {lastReading.capitulo}</p>
              </div>
              <button
                type="button"
                onClick={() => setContinueReading(!continueReading)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${continueReading
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
              >
                {continueReading ? 'Continuando' : 'Continuar?'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <select
              {...register('libro_biblia')}
              className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="" className="bg-[#050507]">Libro...</option>
              {BIBLE_BOOKS.map(b => (
                <option key={b} value={b} className="bg-[#050507]">{b}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Cap."
              {...register('capitulo')}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/50 text-center"
            />
          </div>
          <textarea
            {...register('insight_espiritual_manana')}
            rows={3}
            placeholder="¿Qué te habló Dios?"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
          />
        </div>
      </div>
    </div>
  )
}

const StepMission = ({ register, control, watch }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "prioridades"
  });

  // Initialize with one field if empty
  useEffect(() => {
    if (fields.length === 0) {
      append({ descripcion: '' })
    }
  }, [])

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Misión del Día</h2>
        <p className="text-white/50">Define tu victoria</p>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6 border-l-4 border-l-blue-500 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs text-blue-400 font-bold uppercase tracking-widest">Prioridades (Máx 3)</label>
            {fields.length < 3 && (
              <button
                type="button"
                onClick={() => append({ descripcion: '' })}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
              >
                <PlusIcon className="w-3 h-3 mr-1" /> Añadir
              </button>
            )}
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <span className="text-white/30 font-mono text-sm">{index + 1}.</span>
                <input
                  {...register(`prioridades.${index}.descripcion`)}
                  placeholder={`Prioridad #${index + 1}`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-400/50 hover:text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 border-l-4 border-l-white/20">
          <label className="text-xs text-white/40 font-bold uppercase tracking-widest mb-2 block">Identidad</label>
          <input
            type="text"
            {...register('palabra_enfoque')}
            placeholder="Hoy soy..."
            className="w-full bg-transparent text-xl font-medium text-white placeholder-white/20 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

// --- Main Page Component ---

export default function MananaPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [yesterdaySleep, setYesterdaySleep] = useState(null)
  const [lastReading, setLastReading] = useState(null)
  const router = useRouter()

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      sleep_hours: 7,
      sleep_quality: 3,
      ansiedad: 3,
      energia: 3,
      enfoque: 3,
      motivacion: 3,
      oracion_realizada: false,
      hora_despertar: '07:00',
      prioridades: [{ descripcion: '' }]
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
      fetchContextData(session.user.id)
    }
    init()
  }, [])

  const fetchContextData = async (userId) => {
    // Fetch Yesterday's Sleep
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateKey = yesterday.toISOString().split('T')[0]

    const { data: sleepData } = await supabase
      .from('fact_habitos_diarios')
      .select('sueno_horas')
      .eq('user_id', userId)
      .eq('date_key', dateKey)
      .single()

    if (sleepData) setYesterdaySleep(sleepData.sueno_horas)

    // Fetch Last Scripture Reading
    const { data: readingData } = await supabase
      .from('dim_scripture_readings')
      .select('libro, capitulo')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (readingData) setLastReading(readingData)
  }

  const onSubmit = async (data) => {
    if (!user) return
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const factId = await getOrCreateFact(user.id, today)

      // 1. Rutina
      const rutinaId = await upsertDimension('dim_rutina', {
        user_id: user.id,
        tipo_rutina: 'Manana',
        hora_despertar: data.hora_despertar,
        oracion: data.oracion_realizada,
      })

      // 2. Emocional
      const emocionalId = await upsertDimension('dim_estado_emocional', {
        user_id: user.id,
        momento_dia: 'Manana',
        ansiedad: data.ansiedad,
        enfoque: data.enfoque,
        motivacion: data.motivacion,
        energia: data.energia,
      })

      // 3. Espiritual
      let espiritualId = null
      if (data.oracion_realizada || data.libro_biblia) {
        espiritualId = await upsertDimension('dim_espiritual', {
          user_id: user.id,
          momento_dia: 'Manana',
          practica: 'Devocional',
          libro_biblia: data.libro_biblia || null,
          capitulo: data.capitulo ? parseInt(data.capitulo) : null,
          insight_espiritual: data.insight_espiritual_manana || null,
        })
      }

      // 4. Metas (Dynamic Priorities)
      const metasToLink = []
      if (data.prioridades && data.prioridades.length > 0) {
        for (let i = 0; i < data.prioridades.length; i++) {
          const p = data.prioridades[i]
          if (p.descripcion) {
            const metaKey = await upsertDimension('dim_metas', {
              user_id: user.id,
              date_key: today,
              tipo: 'Diaria',
              descripcion: p.descripcion,
              orden: i + 1, // 1, 2, 3
            })
            metasToLink.push({ meta_key: metaKey, tipo: 'Diaria', orden: i + 1 })
          }
        }
      }

      // Also save Identity (Palabra Enfoque) as a meta
      if (data.palabra_enfoque) {
        const metaEnfoqueKey = await upsertDimension('dim_metas', {
          user_id: user.id,
          date_key: today,
          tipo: 'Manana',
          descripcion: `Identidad: ${data.palabra_enfoque}`,
          orden: 10,
        })
        metasToLink.push({ meta_key: metaEnfoqueKey, tipo: 'Manana', orden: 10 })
      }

      // 5. Fact Update
      await updateFact(factId, {
        rutina_manana_key: rutinaId,
        estado_emocional_manana_key: emocionalId,
        espiritualidad_key: espiritualId,
        sueno_horas: parseFloat(data.sleep_hours),
        calidad_sueno: parseInt(data.sleep_quality),
        reflexion_matutina: data.como_amaneciste,
        meta_principal_dia: data.prioridades?.[0]?.descripcion || null, // Legacy/Fallback
        palabra_enfoque_dia: data.palabra_enfoque,
        hora_registro_manana: new Date().toISOString(),
      }, user.id)

      // Link Metas
      if (metasToLink.length) {
        await supabase
          .from('fact_metas')
          .insert(metasToLink.map((meta) => ({
            fact_id: factId,
            meta_key: meta.meta_key,
            tipo: meta.tipo,
            orden: meta.orden,
          })))
      }

      router.push('/dashboard?success=manana')
    } catch (error) {
      console.error(error)
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    <StepIntro key="intro" user={user} onNext={() => setStep(1)} yesterdaySleep={yesterdaySleep} />,
    <StepSleep key="sleep" register={register} watch={watch} setValue={setValue} />,
    <StepMind key="mind" register={register} watch={watch} setValue={setValue} />,
    <StepSpirit key="spirit" register={register} watch={watch} setValue={setValue} lastReading={lastReading} />,
    <StepMission key="mission" register={register} control={control} watch={watch} />,
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
                {isLoading ? 'Guardando...' : 'Iniciar Día'}
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

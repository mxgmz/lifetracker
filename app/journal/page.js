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
  PencilSquareIcon,
  ChevronRightIcon,
  TagIcon,
  FaceSmileIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

// --- Components for Steps ---

const StepIntro = ({ onNext }) => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center h-full">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-4 rounded-full bg-pink-500/10 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.2)]"
    >
      <PencilSquareIcon className="w-12 h-12 text-pink-500" />
    </motion.div>
    <div className="space-y-2">
      <h1 className="text-4xl font-display font-bold text-white">
        Mind Dump
      </h1>
      <p className="text-xl text-white/50 font-light">
        "Sobre toda cosa guardada, guarda tu corazón"
      </p>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onNext}
      className="mt-8 px-8 py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-pink-900/30 transition-all flex items-center"
    >
      Iniciar Escritura <ChevronRightIcon className="w-5 h-5 ml-2" />
    </motion.button>
  </div>
)

const StepContext = ({ register, watch }) => {
  const mood = watch('mood')

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-white">Contexto Emocional</h2>
        <p className="text-white/50">¿Cómo te sientes al escribir?</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-pink-400 uppercase tracking-widest">Estado de Ánimo</label>
          <select
            {...register('mood', { required: true })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all appearance-none"
          >
            <option value="Neutral" className="bg-[#050507]">Neutral</option>
            <option value="Feliz" className="bg-[#050507]">Feliz</option>
            <option value="Triste" className="bg-[#050507]">Triste</option>
            <option value="Ansioso" className="bg-[#050507]">Ansioso</option>
            <option value="Enojado" className="bg-[#050507]">Enojado</option>
            <option value="Motivado" className="bg-[#050507]">Motivado</option>
            <option value="Cansado" className="bg-[#050507]">Cansado</option>
            <option value="Agradecido" className="bg-[#050507]">Agradecido</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Etiquetas (Tags)</label>
          <div className="relative">
            <input
              {...register('tags')}
              placeholder="Ej: trabajo, familia, ideas..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
            <TagIcon className="w-5 h-5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs text-white/30">Separa las etiquetas con comas</p>
        </div>
      </div>
    </div>
  )
}

const StepWriting = ({ register }) => (
  <div className="space-y-8 h-full flex flex-col">
    <div className="text-center space-y-2 shrink-0">
      <h2 className="text-3xl font-display font-bold text-white">Espacio Libre</h2>
      <p className="text-white/50">Vacia tu mente</p>
    </div>

    <div className="glass-panel p-6 flex-grow flex flex-col space-y-4 min-h-[300px]">
      <textarea
        {...register('content', { required: true })}
        placeholder="Escribe aquí todo lo que tengas en mente..."
        className="w-full h-full bg-transparent border-none text-white placeholder-white/20 resize-none focus:ring-0 text-lg leading-relaxed"
      />
    </div>
  </div>
)

// --- Main Page Component ---

export default function JournalPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const router = useRouter()

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      mood: 'Neutral',
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

      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : []

      await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          date_key: today,
          content: data.content,
          mood: data.mood,
          tags: tagsArray,
          is_private: true
        })

      // Update fact to indicate journal entry exists (if not already tracked by specific count)
      // The current schema doesn't have a specific journal_key in fact_habitos_diarios, 
      // but we can assume the journal_entries table is the source of truth.
      // We could update a "last_journal_entry" timestamp if needed, but for now this is sufficient.

      router.push('/dashboard?success=journal')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    <StepIntro key="intro" onNext={() => setStep(1)} />,
    <StepContext key="context" register={register} watch={watch} />,
    <StepWriting key="writing" register={register} />,
  ]

  const isLastStep = step === steps.length - 1

  if (!user) return <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white/50">Cargando...</div>

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative">
      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
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
      <div className="h-screen flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex flex-col justify-center"
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Actions (only for steps > 0) */}
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 w-full flex justify-end shrink-0"
          >
            {isLastStep ? (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-pink-500 rounded-2xl font-bold text-lg shadow-lg shadow-pink-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {isLoading ? 'Guardando...' : 'Guardar Entrada'}
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

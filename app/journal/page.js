'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabaseClient'
import PageHeader from '@/components/PageHeader'
import FormBlock from '@/components/FormBlock'
import TextInput from '@/components/TextInput'
import Select from '@/components/Select'
import SubmitButton from '@/components/SubmitButton'
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

export default function JournalPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit } = useForm()

  useEffect(() => {
    checkUser()
    createTableIfNeeded()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  const createTableIfNeeded = async () => {
    // Note: This assumes the table already exists
    // If not, you'll need to create it via Supabase dashboard
  }

  const onSubmit = async (data) => {
    if (!user) return

    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const tags = data.tags
        ? data.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : null

      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          date_key: today,
          title: data.titulo || 'Sin título',
          entry: data.entrada,
          categoria: data.categoria || null,
          emocion_predominante: data.emocion_predominante || null,
          tags,
        })

      if (error) throw error

      router.push('/dashboard?success=journal')
    } catch (error) {
      console.error('Error submitting journal:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-[680px] mx-auto space-y-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Volver
        </button>

        <PageHeader 
          title="Journal"
          subtitle="Escribe tus pensamientos, reflexiones y aprendizajes del día."
          scripture="Escribe la visión, y declárala en tablas, para que corra el que leyere en ella"
          reference="Habacuc 2:2"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormBlock title="Entrada del Día" icon={PencilSquareIcon}>
            <TextInput
              label="Título"
              name="titulo"
              placeholder="Dale un título a tu entrada..."
              register={register}
            />

            <Select
              label="Categoría"
              name="categoria"
              register={register}
              options={[
                { value: 'Reflexion', label: 'Reflexión' },
                { value: 'Gratitud', label: 'Gratitud' },
                { value: 'Aprendizaje', label: 'Aprendizaje' },
                { value: 'Oracion', label: 'Oración' },
                { value: 'Procesamiento', label: 'Procesamiento emocional' },
              ]}
              placeholder="Selecciona una categoría"
            />

            <Select
              label="Emoción predominante"
              name="emocion_predominante"
              register={register}
              options={[
                { value: 'Gozo', label: 'Gozo' },
                { value: 'Paz', label: 'Paz' },
                { value: 'Ansiedad', label: 'Ansiedad' },
                { value: 'Tristeza', label: 'Tristeza' },
                { value: 'Frustracion', label: 'Frustración' },
                { value: 'Neutral', label: 'Neutral' },
              ]}
              placeholder="¿Cómo te sentiste?"
            />

            <TextInput
              label="Entrada"
              name="entrada"
              rows={15}
              placeholder="Escribe libremente... ¿Qué sucedió hoy? ¿Qué aprendiste? ¿Qué sentiste? ¿Qué te preocupa? ¿Por qué estás agradecido?"
              register={register}
              required
            />

            <TextInput
              label="Tags (separa con comas)"
              name="tags"
              placeholder="ej. gratitud, enfoque, familia"
              register={register}
            />

            <div className="text-xs text-gray-500 space-y-1">
              <p>💡 Ideas para escribir:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>¿Qué fue lo mejor del día?</li>
                <li>¿Qué desafíos enfrenté?</li>
                <li>¿Qué decisión importante tomé?</li>
                <li>¿Qué conversación significativa tuve?</li>
                <li>¿Qué me está enseñando Dios?</li>
              </ul>
            </div>
          </FormBlock>

          <SubmitButton label="Guardar Entrada" isLoading={isLoading} />
        </form>
      </div>
    </div>
  )
}


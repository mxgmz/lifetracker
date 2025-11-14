'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateFact } from '@/lib/getOrCreateFact'
import { updateFact } from '@/lib/updateFact'
import { upsertDimension } from '@/lib/upsertDimension'
import PageHeader from '@/components/PageHeader'
import FormBlock from '@/components/FormBlock'
import Slider from '@/components/Slider'
import Select from '@/components/Select'
import TextInput from '@/components/TextInput'
import SubmitButton from '@/components/SubmitButton'
import { ArrowLeftIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

export default function EstudioPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      profundidad: 3,
    },
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
    }
  }

  const onSubmit = async (data) => {
    if (!user) return

    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const factId = await getOrCreateFact(user.id, today)

      // Detect momento_dia based on current time
      const now = new Date()
      const hora = now.getHours()
      let momentoDia = 'Tarde'
      if (hora >= 5 && hora < 12) momentoDia = 'Manana'
      else if (hora >= 12 && hora < 19) momentoDia = 'Tarde'
      else if (hora >= 19 && hora < 24) momentoDia = 'Noche'
      else momentoDia = 'Madrugada'

      // Insert dim_estudio with momento_dia
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

      // Add to fact using bridge table (allows multiple study sessions per day)
      const { data: factEs, error: faEsError } = await supabase
        .from('fact_estudios')
        .insert({ fact_id: factId, estudio_key: estudioId, orden: 1 })
      
      // Also update fact for backwards compatibility
      await updateFact(factId, { estudio_key: estudioId })

      router.push('/dashboard?success=estudio')
    } catch (error) {
      console.error('Error submitting form:', error)
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
          title="Registro de Estudio"
          subtitle="Documenta tu aprendizaje y crecimiento intelectual."
          scripture="El corazón del prudente adquiere sabiduría; y el oído de los sabios busca la ciencia"
          reference="Proverbios 18:15"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormBlock title="Detalles del Estudio" icon={AcademicCapIcon}>
            <TextInput
              label="Tema"
              name="tema"
              placeholder="¿Qué estudiaste?"
              register={register}
              required
            />

            <Select
              label="Categoría"
              name="categoria"
              register={register}
              options={[
                { value: 'Programación', label: 'Programación' },
                { value: 'Matemáticas', label: 'Matemáticas' },
                { value: 'Ciencias', label: 'Ciencias' },
                { value: 'Negocios', label: 'Negocios' },
                { value: 'Idiomas', label: 'Idiomas' },
                { value: 'Diseño', label: 'Diseño' },
                { value: 'Teología', label: 'Teología' },
                { value: 'Otro', label: 'Otro' },
              ]}
              placeholder="Selecciona..."
            />

            <TextInput
              label="Tiempo (minutos)"
              name="tiempo_min"
              type="number"
              placeholder="0"
              register={register}
            />

            <Slider
              label="Profundidad (1-5)"
              name="profundidad"
              register={register}
              min={1}
              max={5}
              value={watch('profundidad')}
              onChange={(e) => setValue('profundidad', parseInt(e.target.value))}
            />

            <Select
              label="Material usado"
              name="material_usado"
              register={register}
              options={[
                { value: 'Video', label: 'Video' },
                { value: 'Libro', label: 'Libro' },
                { value: 'Clase', label: 'Clase' },
                { value: 'Proyecto', label: 'Proyecto' },
                { value: 'Documentación', label: 'Documentación' },
                { value: 'Artículo', label: 'Artículo' },
                { value: 'Otro', label: 'Otro' },
              ]}
              placeholder="Selecciona..."
            />

            <TextInput
              label="Insight aprendido"
              name="insight_aprendido"
              rows={6}
              placeholder="¿Qué aprendiste? ¿Qué concepto entendiste? ¿Qué vas a aplicar?"
              register={register}
            />
          </FormBlock>

          <SubmitButton label="Guardar Estudio" isLoading={isLoading} />
        </form>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateFact } from '@/lib/getOrCreateFact'
import { upsertDimension } from '@/lib/upsertDimension'
import PageHeader from '@/components/PageHeader'
import FormBlock from '@/components/FormBlock'
import Select from '@/components/Select'
import TextInput from '@/components/TextInput'
import SubmitButton from '@/components/SubmitButton'
import { ArrowLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline'

export default function LecturaPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      tipo_lectura: 'biblica',
    },
  })

  const tipoLectura = watch('tipo_lectura')

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

      if (data.tipo_lectura === 'biblica') {
        // Detect momento_dia
        const now = new Date()
        const hora = now.getHours()
        let momentoDia = 'Tarde'
        if (hora >= 5 && hora < 12) momentoDia = 'Manana'
        else if (hora >= 12 && hora < 19) momentoDia = 'Tarde'
        else if (hora >= 19 && hora < 24) momentoDia = 'Noche'
        else momentoDia = 'Madrugada'

        // Insert into dim_espiritual
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

        // Also track in scripture readings (for detailed analysis)
        await upsertDimension('dim_scripture_readings', {
          user_id: user.id,
          date_key: today,
          libro: data.libro || null,
          capitulo: data.capitulo ? parseInt(data.capitulo) : null,
          versiculos: data.versiculos_rango || null,
          total_versiculos: data.versiculos ? parseInt(data.versiculos) : null,
          insight: data.notas || null,
        })

        // Add to fact using bridge table
        const { data: factPr } = await supabase
          .from('fact_practicas_espirituales')
          .insert({ fact_id: factId, espiritualidad_key: espiritualidadId, momento_dia: momentoDia })
        
        // Update fact for backwards compatibility
        await supabase
          .from('fact_habitos_diarios')
          .update({ espiritualidad_key: espiritualidadId })
          .eq('fact_id', factId)
      } else {
        // Insert into dim_estudio for general reading
        const estudioId = await upsertDimension('dim_estudio', {
          user_id: user.id,
          tema: data.libro || 'Lectura general',
          categoria: 'Lectura',
          tiempo_min: data.minutos ? parseInt(data.minutos) : null,
          material_usado: 'Libro',
          insight_aprendido: data.notas || null,
        })

        // Update fact
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
          title="Registro de Lectura"
          subtitle="Documenta tu tiempo con los libros."
          scripture="Lámpara es a mis pies tu palabra, y lumbrera a mi camino"
          reference="Salmos 119:105"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormBlock title="Detalles de Lectura" icon={BookOpenIcon}>
            <Select
              label="Tipo de lectura"
              name="tipo_lectura"
              register={register}
              options={[
                { value: 'biblica', label: 'Lectura Bíblica' },
                { value: 'general', label: 'Lectura General' },
              ]}
            />

            {tipoLectura === 'biblica' ? (
              <>
                <Select
                  label="Libro bíblico"
                  name="libro"
                  register={register}
                  options={[
                    { value: 'Génesis', label: 'Génesis' },
                    { value: 'Éxodo', label: 'Éxodo' },
                    { value: 'Levítico', label: 'Levítico' },
                    { value: 'Números', label: 'Números' },
                    { value: 'Deuteronomio', label: 'Deuteronomio' },
                    { value: 'Josué', label: 'Josué' },
                    { value: 'Salmos', label: 'Salmos' },
                    { value: 'Proverbios', label: 'Proverbios' },
                    { value: 'Eclesiastés', label: 'Eclesiastés' },
                    { value: 'Isaías', label: 'Isaías' },
                    { value: 'Jeremías', label: 'Jeremías' },
                    { value: 'Mateo', label: 'Mateo' },
                    { value: 'Marcos', label: 'Marcos' },
                    { value: 'Lucas', label: 'Lucas' },
                    { value: 'Juan', label: 'Juan' },
                    { value: 'Hechos', label: 'Hechos' },
                    { value: 'Romanos', label: 'Romanos' },
                    { value: 'Gálatas', label: 'Gálatas' },
                    { value: 'Efesios', label: 'Efesios' },
                    { value: 'Filipenses', label: 'Filipenses' },
                    { value: 'Colosenses', label: 'Colosenses' },
                    { value: 'Santiago', label: 'Santiago' },
                    { value: 'Otro', label: 'Otro' },
                  ]}
                  placeholder="Selecciona..."
                />

                <div className="grid grid-cols-3 gap-4">
                  <TextInput
                    label="Capítulo"
                    name="capitulo"
                    type="number"
                    placeholder="Ej: 3"
                    register={register}
                  />
                  <TextInput
                    label="Versículos leídos (cantidad)"
                    name="versiculos"
                    type="number"
                    placeholder="Ej: 15"
                    register={register}
                  />
                  <TextInput
                    label="Rango de versículos (ej. 1-5,10-12)"
                    name="versiculos_rango"
                    placeholder="Ej: 1-5,10-12"
                    register={register}
                  />
                </div>
              </>
            ) : (
              <TextInput
                label="Libro"
                name="libro"
                placeholder="Nombre del libro que leíste"
                register={register}
              />
            )}

            <TextInput
              label="Tiempo (minutos)"
              name="minutos"
              type="number"
              placeholder="0"
              register={register}
            />

            <TextInput
              label="Notas y reflexiones"
              name="notas"
              rows={6}
              placeholder={tipoLectura === 'biblica' 
                ? "¿Qué te habló Dios? ¿Qué versículo te impactó?" 
                : "¿Qué aprendiste? ¿Qué te gustó?"}
              register={register}
            />
          </FormBlock>

          <SubmitButton label="Guardar Lectura" isLoading={isLoading} />
        </form>
      </div>
    </div>
  )
}


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
import { ArrowLeftIcon, FireIcon } from '@heroicons/react/24/outline'

export default function EjercicioPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [plans, setPlans] = useState([])
  const router = useRouter()
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      tipo: 'Correr',
      intensidad: 3,
      ejercicio_plan_key: '',
    },
  })

  const tipoEjercicio = watch('tipo')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
      await loadPlans(session.user.id)
    }
  }

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

      // Detect momento_dia based on current time
      const now = new Date()
      const hora = now.getHours()
      let momentoDia = 'Tarde'
      if (hora >= 5 && hora < 12) momentoDia = 'Manana'
      else if (hora >= 12 && hora < 19) momentoDia = 'Tarde'
      else if (hora >= 19 && hora < 24) momentoDia = 'Noche'
      else momentoDia = 'Madrugada'

      // Insert dim_ejercicio with momento_dia + plan link
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
      
      // If this is linked to a plan from the morning, add the link
      if (data.ejercicio_plan_key) {
        ejercicioData.ejercicio_plan_key = data.ejercicio_plan_key
      }
      
      const ejercicioId = await upsertDimension('dim_ejercicio', ejercicioData)

      // Add to fact using bridge table (allows multiple exercises per day)
      const { count: ejercicioCount, error: ejercCountError } = await supabase
        .from('fact_ejercicios')
        .select('*', { count: 'exact', head: true })
        .eq('fact_id', factId)
      if (ejercCountError) {
        throw new Error(`Failed to count fact_ejercicios: ${ejercCountError.message}`)
      }

      await supabase
        .from('fact_ejercicios')
        .insert({ fact_id: factId, ejercicio_key: ejercicioId, orden: (ejercicioCount || 0) + 1 })
      
      // Also update fact for backwards compatibility
      await updateFact(factId, { ejercicio_key: ejercicioId })

      router.push('/dashboard?success=ejercicio')
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
          title="Registro de Ejercicio"
          subtitle="Documenta tu disciplina física."
          scripture="¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo?"
          reference="1 Corintios 6:19"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormBlock title="Detalles del Ejercicio" icon={FireIcon}>
            <Select
              label="Tipo de ejercicio"
              name="tipo"
              register={register}
              options={[
                { value: 'Correr', label: 'Correr' },
                { value: 'Pesas', label: 'Pesas' },
                { value: 'Caminata', label: 'Caminata' },
                { value: 'Ciclismo', label: 'Ciclismo' },
                { value: 'Natación', label: 'Natación' },
                { value: 'Yoga', label: 'Yoga' },
                { value: 'Deportes', label: 'Deportes' },
                { value: 'Otro', label: 'Otro' },
              ]}
            />

            {plans.length > 0 && (
              <Select
                label="Plan ejecutado (opcional)"
                name="ejercicio_plan_key"
                register={register}
                options={[
                  { value: '', label: 'Sin plan' },
                  ...plans.map((plan) => ({
                    value: plan.plan_key,
                    label: `${plan.tipo}${plan.distancia_km_planeada ? ` · ${plan.distancia_km_planeada}km` : ''}${plan.grupo_muscular ? ` · ${plan.grupo_muscular}` : ''}`,
                  })),
                ]}
                placeholder="Selecciona el plan registrado en la mañana"
              />
            )}

            {(tipoEjercicio === 'Correr' || tipoEjercicio === 'Caminata' || tipoEjercicio === 'Ciclismo') && (
              <div className="space-y-4">
                <TextInput
                  label="Distancia (km)"
                  name="distancia_km"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 5.0"
                  register={register}
                />
                {tipoEjercicio === 'Correr' && (
                  <TextInput
                    label="Pace (min/km)"
                    name="pace"
                    type="number"
                    step="0.1"
                    placeholder="Ej: 5.5"
                    register={register}
                  />
                )}
              </div>
            )}

            {tipoEjercicio === 'Pesas' && (
              <Select
                label="Grupo muscular"
                name="grupo_muscular"
                register={register}
                options={[
                  { value: 'Pecho', label: 'Pecho' },
                  { value: 'Espalda', label: 'Espalda' },
                  { value: 'Piernas', label: 'Piernas' },
                  { value: 'Hombros', label: 'Hombros' },
                  { value: 'Brazos', label: 'Brazos' },
                  { value: 'Core', label: 'Core' },
                  { value: 'Full body', label: 'Full body' },
                ]}
                placeholder="Selecciona..."
              />
            )}

            <TextInput
              label="Duración (minutos)"
              name="duracion"
              type="number"
              placeholder="0"
              register={register}
            />

            <Slider
              label="RPE - Intensidad percibida (1-5)"
              name="intensidad"
              register={register}
              min={1}
              max={5}
              value={watch('intensidad')}
              onChange={(e) => setValue('intensidad', parseInt(e.target.value))}
            />

            <TextInput
              label="Notas adicionales"
              name="descripcion"
              rows={4}
              placeholder="¿Cómo te sentiste? ¿Qué ejercicios hiciste? ¿Alguna observación?"
              register={register}
            />
          </FormBlock>

          <SubmitButton label="Guardar Ejercicio" isLoading={isLoading} />
        </form>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateFact } from '@/lib/getOrCreateFact'
import { updateFact } from '@/lib/updateFact'
import { upsertDimension } from '@/lib/upsertDimension'
import { getReferenceData, DEFAULT_REFERENCE_DATA } from '@/lib/referenceData'
import PageHeader from '@/components/PageHeader'
import FormBlock from '@/components/FormBlock'
import Slider from '@/components/Slider'
import Toggle from '@/components/Toggle'
import Select from '@/components/Select'
import TextInput from '@/components/TextInput'
import SubmitButton from '@/components/SubmitButton'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function TentacionPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
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
  const triggerOption = watch('trigger_option')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
      await populateReferenceData()
    }
  }

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
      let momentoDia = 'Tarde' // default
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
        hora_aproximada: now.toTimeString().split(' ')[0], // HH:MM:SS
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

      // Add to fact using bridge table (allows multiple temptations per day)
      const { data: factTent } = await supabase
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
          title="Registro de Tentación"
          subtitle="Sé honesto. Registra tu batalla. Aprende de ella."
          scripture="No os ha sobrevenido ninguna tentación que no sea humana; pero fiel es Dios"
          reference="1 Corintios 10:13"
        />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormBlock title="Detalles de la Tentación" icon={ExclamationTriangleIcon}>
              <Select
                label="Tipo de tentación"
                name="tipo_tentacion"
                register={register}
                required
                options={[
                ...pecados.map((p) => ({ value: p, label: p })),
                  { value: 'Otro', label: 'Otro' },
                ]}
                placeholder="Selecciona..."
              />

            <Select
              label="Trigger principal"
              name="trigger_option"
              register={register}
              options={[
                ...triggersRef.map((t) => ({ value: t.nombre, label: t.nombre })),
                { value: 'otro', label: 'Otro' },
              ]}
              placeholder="Selecciona el detonante"
            />

            {triggerOption === 'otro' && (
              <TextInput
                label="Trigger personalizado"
                name="trigger_custom"
                placeholder="Describe el detonante"
                register={register}
              />
            )}

            <Select
              label="Categoría / contexto"
              name="categoria_tentacion"
              register={register}
              options={[
                ...categorias.map((c) => ({ value: c, label: c })),
                { value: 'Otro', label: 'Otro' },
              ]}
              placeholder="¿Dónde/qué tipo?"
            />
            
            <TextInput
              label="Contexto"
              name="contexto"
              rows={2}
              placeholder="¿Dónde estabas? ¿Qué hacías? ¿Qué sentías?"
              register={register}
            />

            <Slider
              label="Nivel de riesgo (¿Qué tan cerca estuviste de caer?)"
              name="nivel_riesgo"
              register={register}
              min={1}
              max={5}
              value={watch('nivel_riesgo')}
              onChange={(e) => setValue('nivel_riesgo', parseInt(e.target.value))}
            />

              <Slider
              label="Intensidad (¿Qué tan fuerte fue la tentación?)"
                name="intensidad"
                register={register}
                min={1}
              max={5}
                value={watch('intensidad')}
                onChange={(e) => setValue('intensidad', parseInt(e.target.value))}
              />

              <TextInput
                label="Acción de autocontrol"
                name="accion_autocontrol"
              placeholder="¿Qué hiciste para resistir o manejarla?"
              register={register}
            />

            <div className="pt-2">
              <Toggle
                label="¿Ganaste la tentación?"
                name="gano_tentacion"
                description="Marca esto si lograste resistir exitosamente"
                register={register}
              />
            </div>

            <TextInput
              label="Reflexión: ¿Qué harás diferente mañana?"
              name="reflexion"
              rows={3}
              placeholder="Escribe qué aprendiste y cómo te prepararás mejor..."
              register={register}
            />
          </FormBlock>

            <SubmitButton label="Guardar Tentación" isLoading={isLoading} />
          </form>
      </div>
    </div>
  )
}

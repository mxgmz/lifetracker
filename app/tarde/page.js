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
import Toggle from '@/components/Toggle'
import Select from '@/components/Select'
import TextInput from '@/components/TextInput'
import SubmitButton from '@/components/SubmitButton'
import { ArrowLeftIcon, BoltIcon, AcademicCapIcon, HeartIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function TardePage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      ansiedad: 3,
      enfoque: 3,
      estres: 3,
      animo: 3,
      ira: 3,
      tristeza: 3,
      profundidad: 3,
      tentacion: false,
      intensidad: 3,
    },
  })

  const tentacion = watch('tentacion')

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

      // Update emotional state (afternoon refresh) with new fields + momento_dia
      const estadoEmocionalId = await upsertDimension('dim_estado_emocional', {
        user_id: user.id,
        momento_dia: 'Tarde',
        ansiedad: data.ansiedad,
        enfoque: data.enfoque,
        animo: data.animo,
        ira: data.ira ? parseInt(data.ira) : null,
        tristeza: data.tristeza ? parseInt(data.tristeza) : null,
        estabilidad_emocional: data.estabilidad_tarde ? parseInt(data.estabilidad_tarde) : null,
        descripcion: data.como_va_dia || null,
      })

      const updates = {
        estado_emocional_key: estadoEmocionalId, // última actualización
        estado_emocional_tarde_key: estadoEmocionalId, // snapshot tarde
        hora_registro_tarde: new Date().toISOString(),
        ansiedad: data.ansiedad,
        enfoque: data.enfoque,
        estres: data.estres || null,
        reflexion_tarde: data.como_va_dia || null,
        agua_tomada_tarde: data.tome_agua || false,
        comida_bien_tarde: data.comi_bien || false,
        micro_reset_realizado: data.micro_reset || false,
      }

      // Handle estudio + momento_dia
      if (data.tema || data.tiempo_min) {
        const estudioId = await upsertDimension('dim_estudio', {
          user_id: user.id,
          momento_dia: 'Tarde',
          tema: data.tema || null,
          tiempo_min: data.tiempo_min ? parseInt(data.tiempo_min) : null,
          profundidad: data.profundidad ? parseInt(data.profundidad) : null,
          material_usado: data.material_usado || null,
          insight_aprendido: data.insight_aprendido || null,
        })
        updates.estudio_key = estudioId

        const { count: studyCount, error: studyCountError } = await supabase
          .from('fact_estudios')
          .select('*', { count: 'exact', head: true })
          .eq('fact_id', factId)
        if (studyCountError) {
          throw new Error(`Failed to count fact_estudios: ${studyCountError.message}`)
        }
        await supabase
          .from('fact_estudios')
          .insert({
            fact_id: factId,
            estudio_key: estudioId,
            orden: (studyCount || 0) + 1,
          })
      }

      // Handle tentación + momento_dia
      if (data.tentacion && data.tipo_tentacion) {
        const tentacionId = await upsertDimension('dim_tentacion', {
          user_id: user.id,
          momento_dia: 'Tarde',
          fuente_registro: 'Tarde',
          hora_aproximada: new Date().toTimeString().split(' ')[0], // HH:MM:SS
          trigger_principal: data.trigger || null,
          pecado_principal: data.tipo_tentacion,
          nivel_riesgo: data.intensidad ? parseInt(data.intensidad) : null,
          contexto: data.contexto || null,
          gano_tentacion: data.gano_tentacion || false,
          descripcion: data.accion_autocontrol || null,
        })
        updates.tentacion_key = tentacionId

        const { count: tentCount, error: tentError } = await supabase
          .from('fact_tentaciones')
          .select('*', { count: 'exact', head: true })
          .eq('fact_id', factId)
        if (tentError) {
          throw new Error(`Failed to count fact_tentaciones: ${tentError.message}`)
        }

        await supabase
          .from('fact_tentaciones')
          .insert({
            fact_id: factId,
            tentacion_key: tentacionId,
            orden: (tentCount || 0) + 1,
          })
      }

      await updateFact(factId, updates)

      router.push('/dashboard?success=tarde')
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
          title="Registro de la Tarde"
          subtitle="Refresca tu mente, revisa tu rumbo, corrige tu curso."
          scripture="Examíname, oh Dios, y conoce mi corazón; pruébame y conoce mis pensamientos"
          reference="Salmos 139:23"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Block 1: Estado Mental (Refresher) */}
          <FormBlock title="Estado Mental (Refresher)" icon={BoltIcon}>
            <div className="grid grid-cols-2 gap-4">
              <Slider
                label="Ansiedad"
                name="ansiedad"
                register={register}
                min={1}
                max={5}
                value={watch('ansiedad')}
                onChange={(e) => setValue('ansiedad', parseInt(e.target.value))}
              />
              <Slider
                label="Enfoque"
                name="enfoque"
                register={register}
                min={1}
                max={5}
                value={watch('enfoque')}
                onChange={(e) => setValue('enfoque', parseInt(e.target.value))}
              />
              <Slider
                label="Estrés"
                name="estres"
                register={register}
                min={1}
                max={5}
                value={watch('estres')}
                onChange={(e) => setValue('estres', parseInt(e.target.value))}
              />
              <Slider
                label="Ánimo"
                name="animo"
                register={register}
                min={1}
                max={5}
                value={watch('animo')}
                onChange={(e) => setValue('animo', parseInt(e.target.value))}
              />
              <Slider
                label="Ira"
                name="ira"
                register={register}
                min={1}
                max={5}
                value={watch('ira')}
                onChange={(e) => setValue('ira', parseInt(e.target.value))}
              />
              <Slider
                label="Tristeza"
                name="tristeza"
                register={register}
                min={1}
                max={5}
                value={watch('tristeza')}
                onChange={(e) => setValue('tristeza', parseInt(e.target.value))}
              />
            </div>
            <TextInput
              label="¿Cómo va tu día? (1-2 líneas)"
              name="como_va_dia"
              rows={2}
              placeholder="Describe brevemente..."
              register={register}
            />
            <Slider
              label="Estabilidad emocional (1-5)"
              name="estabilidad_tarde"
              register={register}
              min={1}
              max={5}
              value={watch('estabilidad_tarde')}
              onChange={(e) => setValue('estabilidad_tarde', parseInt(e.target.value))}
            />
            <TextInput
              label="Descripción / contexto emocional"
              name="descripcion_emocional_tarde"
              rows={2}
              placeholder="Detalle adicional..."
              register={register}
            />
          </FormBlock>

          {/* Block 2: Estudio */}
          <FormBlock title="Estudio" icon={AcademicCapIcon}>
            <TextInput
              label="Tema"
              name="tema"
              placeholder="¿Qué estudiaste?"
              register={register}
            />
            <TextInput
              label="Tiempo (minutos)"
              name="tiempo_min"
              type="number"
              placeholder="0"
              register={register}
            />
            <Slider
              label="Profundidad"
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
                { value: 'Otro', label: 'Otro' },
              ]}
              placeholder="Selecciona..."
            />
            <TextInput
              label="Insight aprendido"
              name="insight_aprendido"
              rows={3}
              placeholder="¿Qué aprendiste?"
              register={register}
            />
          </FormBlock>

          {/* Block 3: Disciplina Física */}
          <FormBlock title="Disciplina Física" icon={HeartIcon}>
            <div className="grid grid-cols-2 gap-4">
              <Toggle
                label="Tomé agua"
                name="tome_agua"
                register={register}
              />
              <Toggle
                label="Comí bien"
                name="comi_bien"
                register={register}
              />
            </div>
          </FormBlock>

          {/* Block 4: Micro-Restablecimiento */}
          <FormBlock title="Micro-Restablecimiento" icon={ArrowPathIcon}>
            <Toggle
              label="Realicé un micro-reset de 2 minutos (respiración, silencio o plegaria)"
              name="micro_reset"
              register={register}
            />
          </FormBlock>

          {/* Block 5: Tentación */}
          <FormBlock title="Tentación" icon={ExclamationTriangleIcon}>
            <Toggle
              label="¿Tuviste una tentación?"
              name="tentacion"
              register={register}
            />
            {tentacion && (
              <div className="space-y-4 pt-2">
                <Select
                  label="Tipo"
                  name="tipo_tentacion"
                  register={register}
                  required
                  options={[
                    { value: 'Comida', label: 'Comida' },
                    { value: 'Redes sociales', label: 'Redes sociales' },
                    { value: 'Pornografía', label: 'Pornografía' },
                    { value: 'Pereza', label: 'Pereza' },
                    { value: 'Gastos', label: 'Gastos' },
                    { value: 'Otro', label: 'Otro' },
                  ]}
                  placeholder="Selecciona..."
                />
                <TextInput
                  label="Trigger"
                  name="trigger"
                  placeholder="¿Qué la desencadenó?"
                  register={register}
                />
                <Slider
                  label="Intensidad"
                  name="intensidad"
                  register={register}
                  min={1}
                  max={5}
                  value={watch('intensidad')}
                  onChange={(e) => setValue('intensidad', parseInt(e.target.value))}
                />
                <TextInput
                  label="Contexto"
                  name="contexto"
                  placeholder="¿Dónde estabas? ¿Qué hacías?"
                  register={register}
                />
                <TextInput
                  label="Acción de autocontrol"
                  name="accion_autocontrol"
                  placeholder="¿Qué hiciste?"
                  register={register}
                />
                <Toggle
                  label="¿Ganaste?"
                  name="gano_tentacion"
                  register={register}
                />
              </div>
            )}
          </FormBlock>

          <SubmitButton label="Guardar Tarde" isLoading={isLoading} />
        </form>
      </div>
    </div>
  )
}

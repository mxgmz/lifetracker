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
import { ArrowLeftIcon, SunIcon, BoltIcon, SparklesIcon, BookOpenIcon, ClipboardDocumentCheckIcon, FireIcon, FlagIcon } from '@heroicons/react/24/outline'

export default function MananaPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      sleep_hours: 7,
      sleep_quality: 3,
      ansiedad: 3,
      energia: 3,
      enfoque: 3,
      tranquilidad: 3,
      motivacion: 3,
      claridad_mental: 3,
      oracion_realizada: false,
      silencio: false,
      ejercicio_tipo: '',
      ejercicio_km: '',
      dia_especial: false,
    },
  })

  const ejercicioTipo = watch('ejercicio_tipo')
  const diaEspecial = watch('dia_especial')

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

      // Insert dim_rutina (morning)
      const rutinaMorningId = await upsertDimension('dim_rutina', {
        user_id: user.id,
        tipo_rutina: 'Manana',
        despertar_a_hora: data.despertar_a_hora || false,
        no_telefono: data.no_telefono || false,
        tender_cama: data.tender_cama || false,
        oracion: data.oracion_manana || false,
        ejercicio: data.movimiento || false,
        ducha: data.ducha || false,
      })

      // Insert dim_estado_emocional with new fields + momento_dia
      const estadoEmocionalId = await upsertDimension('dim_estado_emocional', {
        user_id: user.id,
        momento_dia: 'Manana',
        ansiedad: data.ansiedad,
        enfoque: data.enfoque,
        tranquilidad: data.tranquilidad ? parseInt(data.tranquilidad) : null,
        motivacion: data.motivacion ? parseInt(data.motivacion) : null,
      })

      // Insert dim_espiritual if provided + momento_dia
      let espiritualidadId = null
      if (data.oracion_realizada || data.libro_biblia || data.insight_espiritual_manana) {
        espiritualidadId = await upsertDimension('dim_espiritual', {
          user_id: user.id,
          momento_dia: 'Manana',
          practica: 'Devocional',
          libro_biblia: data.libro_biblia || null,
          capitulo: data.capitulo ? parseInt(data.capitulo) : null,
          insight_espiritual: data.insight_espiritual_manana || null,
        })
      }

      // Handle dim_dia_especial if provided
      let diaEspecialId = null
      if (data.dia_especial && (data.tipo_dia_especial || data.descripcion_dia_especial)) {
        diaEspecialId = await upsertDimension('dim_dia_especial', {
          user_id: user.id,
          tipo: data.tipo_dia_especial || null,
          descripcion: data.descripcion_dia_especial || null,
        })
      }

      // Capture metas (store in dim_metas + link después)
      const metasToLink = []
      if (data.meta_principal) {
        const metaPrincipalKey = await upsertDimension('dim_metas', {
          user_id: user.id,
          date_key: today,
          tipo: 'Diaria',
          descripcion: data.meta_principal,
          orden: 1,
        })
        metasToLink.push({ meta_key: metaPrincipalKey, tipo: 'Diaria' })
      }
      if (data.meta_secundaria) {
        const metaSecundariaKey = await upsertDimension('dim_metas', {
          user_id: user.id,
          date_key: today,
          tipo: 'Secundaria',
          descripcion: data.meta_secundaria,
          orden: 2,
        })
        metasToLink.push({ meta_key: metaSecundariaKey, tipo: 'Secundaria' })
      }
      if (data.palabra_enfoque) {
        const metaEnfoqueKey = await upsertDimension('dim_metas', {
          user_id: user.id,
          date_key: today,
          tipo: 'Manana',
          descripcion: `Palabra enfoque: ${data.palabra_enfoque}`,
          orden: 3,
        })
        metasToLink.push({ meta_key: metaEnfoqueKey, tipo: 'Manana' })
      }

      // Update fact with morning data + ALL captured fields
      const updates = {
        sueno_horas: data.sleep_hours ? parseFloat(data.sleep_hours) : null,
        calidad_sueno: data.sleep_quality ? parseInt(data.sleep_quality) : null,
        rutina_manana_key: rutinaMorningId,
        estado_emocional_key: estadoEmocionalId, // última actualización
        estado_emocional_manana_key: estadoEmocionalId, // snapshot mañana
        hora_registro_manana: new Date().toISOString(),
        ansiedad: data.ansiedad,
        enfoque: data.enfoque,
        energia_diaria: data.energia || null,
        claridad_mental: data.claridad_mental ? parseInt(data.claridad_mental) : null,
        motivacion: data.motivacion ? parseInt(data.motivacion) : null,
        reflexion_matutina: data.como_amaneciste || null,
        meta_principal_dia: data.meta_principal || null,
        meta_secundaria_dia: data.meta_secundaria || null,
        palabra_enfoque_dia: data.palabra_enfoque || null,
        agua_tomada_manana: data.agua || false,
        movimiento_matutino: data.movimiento || false,
        silencio_manana: data.silencio || false,
      }

      if (diaEspecialId) {
        updates.dia_especial_key = diaEspecialId
      }

      if (espiritualidadId) {
        updates.espiritualidad_key = espiritualidadId
      }

      // Handle ejercicio PLANEADO (new approach)
      if (data.ejercicio_tipo) {
        // Si es descanso o no hacer ejercicio, registrar en dim_ejercicio con razón
        if (data.ejercicio_tipo === 'Descanso' || data.ejercicio_tipo === 'No haré ejercicio') {
          const ejercicioId = await upsertDimension('dim_ejercicio', {
            user_id: user.id,
            momento_dia: 'Manana',
            tipo: data.ejercicio_tipo,
            razon_no_ejercicio: data.razon_no_ejercicio || null,
          })
          updates.ejercicio_key = ejercicioId
        } else {
          // Si es ejercicio real, crear PLAN en dim_ejercicio_planeado
          const planId = await upsertDimension('dim_ejercicio_planeado', {
            user_id: user.id,
            date_key: today,
            tipo: data.ejercicio_tipo,
            grupo_muscular: data.grupo_muscular || null,
            distancia_km_planeada: data.ejercicio_km ? parseFloat(data.ejercicio_km) : null,
            notas: data.ejercicio_otro || null,
          })
          updates.ejercicio_plan_key = planId
        }
      }

      await updateFact(factId, updates)

      if (espiritualidadId) {
        const { count, error: practCountError } = await supabase
          .from('fact_practicas_espirituales')
          .select('*', { count: 'exact', head: true })
          .eq('fact_id', factId)
        if (practCountError) {
          throw new Error(`Failed to count prácticas espirituales: ${practCountError.message}`)
        }
        await supabase
          .from('fact_practicas_espirituales')
          .insert({
            fact_id: factId,
            espiritualidad_key: espiritualidadId,
            momento_dia: 'Manana',
            orden: (count || 0) + 1,
          })
      }

      if (metasToLink.length) {
        await supabase
          .from('fact_metas')
          .insert(metasToLink.map((meta, index) => ({
            fact_id: factId,
            meta_key: meta.meta_key,
            tipo: meta.tipo,
            orden: index + 1,
          })))
      }

      router.push('/dashboard?success=manana')
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
          title="Registro Matutino"
          subtitle="Comienza tu día con claridad, intención y propósito."
          scripture="Este es el día que hizo Jehová; nos gozaremos y alegraremos en él"
          reference="Salmos 118:24"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Block 1: Sueño (Cuerpo) */}
          <FormBlock title="Sueño (Cuerpo)" icon={SunIcon}>
            <Slider
              label="Horas de sueño"
              name="sleep_hours"
              register={register}
              min={0}
              max={12}
              step={0.5}
              value={watch('sleep_hours')}
              onChange={(e) => setValue('sleep_hours', parseFloat(e.target.value))}
            />
            <Slider
              label="Calidad del sueño"
              name="sleep_quality"
              register={register}
              min={1}
              max={5}
              value={watch('sleep_quality')}
              onChange={(e) => setValue('sleep_quality', parseInt(e.target.value))}
            />
          </FormBlock>

          {/* Block 2: Estado Mental (Mente) */}
          <FormBlock title="Estado Mental (Mente)" icon={BoltIcon}>
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
                label="Tranquilidad"
                name="tranquilidad"
                register={register}
                min={1}
                max={5}
                value={watch('tranquilidad')}
                onChange={(e) => setValue('tranquilidad', parseInt(e.target.value))}
              />
              <Slider
                label="Energía"
                name="energia"
                register={register}
                min={1}
                max={5}
                value={watch('energia')}
                onChange={(e) => setValue('energia', parseInt(e.target.value))}
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
                label="Motivación"
                name="motivacion"
                register={register}
                min={1}
                max={5}
                value={watch('motivacion')}
                onChange={(e) => setValue('motivacion', parseInt(e.target.value))}
              />
              <Slider
                label="Claridad Mental"
                name="claridad_mental"
                register={register}
                min={1}
                max={5}
                value={watch('claridad_mental')}
                onChange={(e) => setValue('claridad_mental', parseInt(e.target.value))}
              />
            </div>
            <TextInput
              label="¿Cómo amaneciste hoy?"
              name="como_amaneciste"
              placeholder="Opcional: describe brevemente..."
              register={register}
            />
          </FormBlock>

          {/* Block 3: Espiritualidad (Alma) */}
          <FormBlock title="Espiritualidad (Alma)" icon={SparklesIcon}>
            <Toggle
              label="Oración realizada"
              name="oracion_realizada"
              register={register}
            />
            <Select
              label="Libro bíblico"
              name="libro_biblia"
              register={register}
              options={[
                { value: 'Génesis', label: 'Génesis' },
                { value: 'Éxodo', label: 'Éxodo' },
                { value: 'Salmos', label: 'Salmos' },
                { value: 'Proverbios', label: 'Proverbios' },
                { value: 'Mateo', label: 'Mateo' },
                { value: 'Marcos', label: 'Marcos' },
                { value: 'Lucas', label: 'Lucas' },
                { value: 'Juan', label: 'Juan' },
                { value: 'Romanos', label: 'Romanos' },
                { value: 'Otro', label: 'Otro' },
              ]}
              placeholder="Selecciona..."
            />
            <TextInput
              label="Capítulo"
              name="capitulo"
              type="number"
              placeholder="Ej: 3"
              register={register}
            />
            <TextInput
              label="Insight espiritual de la mañana"
              name="insight_espiritual_manana"
              rows={3}
              placeholder="¿Qué te habló Dios hoy?"
              register={register}
            />
          </FormBlock>

          {/* Block 4: Rutina Matutina (Disciplina) */}
          <FormBlock title="Rutina Matutina (Disciplina)" icon={ClipboardDocumentCheckIcon}>
            <div className="grid grid-cols-2 gap-4">
              <Toggle
                label="Despertar a hora"
                name="despertar_a_hora"
                register={register}
              />
              <Toggle
                label="No teléfono"
                name="no_telefono"
                register={register}
              />
              <Toggle
                label="Tender cama"
                name="tender_cama"
                register={register}
              />
              <Toggle
                label="Agua"
                name="agua"
                register={register}
              />
              <Toggle
                label="Movimiento"
                name="movimiento"
                register={register}
              />
              <Toggle
                label="Ducha"
                name="ducha"
                register={register}
              />
              <Toggle
                label="Oración"
                name="oracion_manana"
                register={register}
              />
              <Toggle
                label="2 min silencio"
                name="silencio"
                register={register}
              />
            </div>
          </FormBlock>

          {/* Block 5: Ejercicio Planeado */}
          <FormBlock title="Ejercicio Planeado" icon={FireIcon}>
            <Select
              label="Tipo de ejercicio"
              name="ejercicio_tipo"
              register={register}
              options={[
                { value: 'Pesas', label: 'Pesas' },
                { value: 'Correr', label: 'Correr' },
                { value: 'Descanso', label: 'Descanso planeado' },
                { value: 'No haré ejercicio', label: 'No haré ejercicio' },
                { value: 'Otro', label: 'Otro' },
              ]}
              placeholder="Selecciona..."
            />
            
            {(ejercicioTipo === 'Descanso' || ejercicioTipo === 'No haré ejercicio') && (
              <Select
                label="Razón"
                name="razon_no_ejercicio"
                register={register}
                options={[
                  { value: 'Descanso planeado', label: 'Descanso planeado' },
                  { value: 'Lesión', label: 'Lesión' },
                  { value: 'Enfermedad', label: 'Enfermedad' },
                  { value: 'Falta de tiempo', label: 'Falta de tiempo' },
                  { value: 'Falta de motivación', label: 'Falta de motivación' },
                  { value: 'Clima', label: 'Clima' },
                  { value: 'Otro', label: 'Otro' },
                ]}
                placeholder="¿Por qué no harás ejercicio?"
              />
            )}
            {ejercicioTipo === 'Pesas' && (
              <Select
                label="Músculo objetivo"
                name="grupo_muscular"
                register={register}
                options={[
                  { value: 'Pecho', label: 'Pecho' },
                  { value: 'Espalda', label: 'Espalda' },
                  { value: 'Piernas', label: 'Piernas' },
                  { value: 'Hombros', label: 'Hombros' },
                  { value: 'Brazos', label: 'Brazos' },
                  { value: 'Full body', label: 'Full body' },
                ]}
                placeholder="Selecciona..."
              />
            )}
            {ejercicioTipo === 'Correr' && (
              <TextInput
                label="Kilómetros planeados"
                name="ejercicio_km"
                type="number"
                step="0.1"
                placeholder="Ej: 5.0"
                register={register}
              />
            )}
            {ejercicioTipo === 'Otro' && (
              <TextInput
                label="Descripción"
                name="ejercicio_otro"
                placeholder="Describe el ejercicio..."
                register={register}
              />
            )}
          </FormBlock>

          {/* Block 6: Propósito del Día */}
          <FormBlock title="Propósito del Día" icon={FlagIcon}>
            <TextInput
              label="Meta principal del día"
              name="meta_principal"
              placeholder="¿Cuál es tu prioridad máxima hoy?"
              register={register}
            />
            <TextInput
              label="Segunda meta (opcional)"
              name="meta_secundaria"
              placeholder="Meta adicional..."
              register={register}
            />
            <TextInput
              label="Palabra de enfoque (Identity keyword)"
              name="palabra_enfoque"
              placeholder="Ej: Disciplinado, Enfocado, Paciente..."
              register={register}
            />
          </FormBlock>

          {/* Block 7: Día Especial */}
          <FormBlock title="Día Especial" icon={SparklesIcon}>
            <Toggle
              label="¿Es un día especial?"
              name="dia_especial"
              description="Marca esto si hoy es un día fuera de lo común"
              register={register}
            />
            {diaEspecial && (
              <div className="space-y-4 pt-2">
                <Select
                  label="Tipo"
                  name="tipo_dia_especial"
                  register={register}
                  options={[
                    { value: 'Cumpleaños', label: 'Cumpleaños' },
                    { value: 'Aniversario', label: 'Aniversario' },
                    { value: 'Examen', label: 'Examen' },
                    { value: 'Entrevista', label: 'Entrevista' },
                    { value: 'Viaje', label: 'Viaje' },
                    { value: 'Ayuno', label: 'Ayuno' },
                    { value: 'Retiro espiritual', label: 'Retiro espiritual' },
                    { value: 'Evento familiar', label: 'Evento familiar' },
                    { value: 'Presentación', label: 'Presentación' },
                    { value: 'Otro', label: 'Otro' },
                  ]}
                  placeholder="Selecciona el tipo..."
                />
                <TextInput
                  label="Descripción"
                  name="descripcion_dia_especial"
                  rows={2}
                  placeholder="Describe qué hace especial este día..."
                  register={register}
                />
              </div>
            )}
          </FormBlock>

          <SubmitButton label="Guardar Mañana" isLoading={isLoading} />
        </form>
      </div>
    </div>
  )
}

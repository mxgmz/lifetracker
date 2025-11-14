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
import { ArrowLeftIcon, ClipboardDocumentCheckIcon, HomeIcon, UserGroupIcon, SparklesIcon, HeartIcon, FlagIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function NochePage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      orden_cuarto: 3,
      orden_escritorio: 3,
      orden_mochila: 3,
      ruido_ambiental: 3,
      limpieza_personal: 3,
      identidad_dia: 3,
      estabilidad_emocional: 3,
      interaccion_positiva_intensidad: 3,
      interaccion_negativa_intensidad: 3,
      cumplio_meta_principal: false,
      cumplio_meta_secundaria: false,
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

      // Insert dim_rutina (night)
      const rutinaNightId = await upsertDimension('dim_rutina', {
        user_id: user.id,
        tipo_rutina: 'Noche',
        oracion: data.oracion || false,
        planeacion: data.planeacion || false,
        cierre_redes: data.cierre_redes || false,
        ropa_lista: data.ropa_lista || false,
        orden_espacio: data.orden_minimo || false,
      })

      // Insert dim_ambiente with all fields
      let ambienteId = null
      if (data.orden_cuarto || data.orden_escritorio || data.orden_mochila || data.ruido_ambiental || data.limpieza_personal || data.sensacion_espacial) {
        ambienteId = await upsertDimension('dim_ambiente', {
          user_id: user.id,
          orden_cuarto: data.orden_cuarto ? parseInt(data.orden_cuarto) : null,
          orden_escritorio: data.orden_escritorio ? parseInt(data.orden_escritorio) : null,
          orden_mochila: data.orden_mochila ? parseInt(data.orden_mochila) : null,
          ruido_ambiental: data.ruido_ambiental ? parseInt(data.ruido_ambiental) : null,
          limpieza_personal: data.limpieza_personal ? parseInt(data.limpieza_personal) : null,
          sensacion_espacial: data.sensacion_espacial || null,
        })
      }

      // Save gratitudes
      const gratitudesToLink = []
      if (data.gratitud_1 || data.gratitud_2 || data.gratitud_3) {
        const gratitudesData = [
          data.gratitud_1 || null,
          data.gratitud_2 || null,
          data.gratitud_3 || null,
        ]
        for (let i = 0; i < gratitudesData.length; i++) {
          if (gratitudesData[i]) {
            const gratitudKey = await upsertDimension('dim_gratitud', {
              user_id: user.id,
              date_key: today,
              orden: i + 1,
              descripcion: gratitudesData[i],
            })
            gratitudesToLink.push({ gratitud_key: gratitudKey, orden: i + 1 })
          }
        }
      }

      const updates = {
        rutina_noche_key: rutinaNightId,
        hora_registro_noche: new Date().toISOString(),
        interacciones_pos: data.interacciones_pos ? parseInt(data.interacciones_pos) : null,
        interacciones_neg: data.interacciones_neg ? parseInt(data.interacciones_neg) : null,
        identidad_dia: data.identidad_dia ? parseInt(data.identidad_dia) : null,
        estabilidad_emocional: data.estabilidad_emocional ? parseInt(data.estabilidad_emocional) : null,
        desvio_mayor: data.desvio_mayor || false,
        causa_desvio: data.causa_desvio || null,
        accion_recovery: data.accion_recovery || null,
        notas_dia: data.notas_dia || null,
        quien_fuiste_hoy: data.quien_fuiste || null,
      }

      if (ambienteId) {
        updates.ambiente_key = ambienteId
      }

      // Handle spiritual insight + momento_dia
      if (data.insight_espiritual) {
        const espiritualidadId = await upsertDimension('dim_espiritual', {
          user_id: user.id,
          momento_dia: 'Noche',
          practica: 'Reflexion',
          insight_espiritual: data.insight_espiritual,
        })
        updates.espiritualidad_key = espiritualidadId

        await supabase
          .from('fact_practicas_espirituales')
          .insert({
            fact_id: factId,
            espiritualidad_key: espiritualidadId,
            momento_dia: 'Noche',
          })
      }

      // Detailed interactions
      const interaccionesToLink = []
      if (data.interaccion_positiva_desc) {
        const interaccionPositivaKey = await upsertDimension('dim_interacciones', {
          user_id: user.id,
          momento_dia: 'Noche',
          tipo_interaccion: 'Positiva',
          intensidad: data.interaccion_positiva_intensidad ? parseInt(data.interaccion_positiva_intensidad) : null,
          descripcion: data.interaccion_positiva_desc,
          emocion_predominante: data.interaccion_positiva_emocion || null,
        })
        interaccionesToLink.push({ interaccion_key: interaccionPositivaKey })
      }

      if (data.interaccion_negativa_desc) {
        const interaccionNegativaKey = await upsertDimension('dim_interacciones', {
          user_id: user.id,
          momento_dia: 'Noche',
          tipo_interaccion: 'Negativa',
          intensidad: data.interaccion_negativa_intensidad ? parseInt(data.interaccion_negativa_intensidad) : null,
          descripcion: data.interaccion_negativa_desc,
          emocion_predominante: data.interaccion_negativa_emocion || null,
        })
        interaccionesToLink.push({ interaccion_key: interaccionNegativaKey })
      }

      await updateFact(factId, updates)

      if (gratitudesToLink.length) {
        const { count: gratCount, error: gratCountError } = await supabase
          .from('fact_gratitudes')
          .select('*', { count: 'exact', head: true })
          .eq('fact_id', factId)
        if (gratCountError) throw new Error(`Failed to count fact_gratitudes: ${gratCountError.message}`)

        await supabase
          .from('fact_gratitudes')
          .insert(
            gratitudesToLink.map((gr, idx) => ({
              fact_id: factId,
              gratitud_key: gr.gratitud_key,
              orden: (gratCount || 0) + idx + 1,
            }))
          )
      }

      if (interaccionesToLink.length) {
        const { count: interCount, error: interCountError } = await supabase
          .from('fact_interacciones')
          .select('*', { count: 'exact', head: true })
          .eq('fact_id', factId)
        if (interCountError) {
          throw new Error(`Failed to count fact_interacciones: ${interCountError.message}`)
        }

        await supabase
          .from('fact_interacciones')
          .insert(
            interaccionesToLink.map((inter, idx) => ({
              fact_id: factId,
              interaccion_key: inter.interaccion_key,
              orden: (interCount || 0) + idx + 1,
            }))
          )
      }

      // Update metas completion status
      const metasCumplidas = [
        { tipo: 'Diaria', cumplida: data.cumplio_meta_principal },
        { tipo: 'Secundaria', cumplida: data.cumplio_meta_secundaria },
      ]
      const metasToUpdate = metasCumplidas.filter((meta) => typeof meta.cumplida === 'boolean')

      if (metasToUpdate.length) {
        const { data: metasDia, error: metasError } = await supabase
          .from('dim_metas')
          .select('meta_key, tipo')
          .eq('user_id', user.id)
          .eq('date_key', today)
        if (!metasError && metasDia?.length) {
          await Promise.all(
            metasToUpdate.map(async (metaUpdate) => {
              const meta = metasDia.find((m) => m.tipo === metaUpdate.tipo)
              if (meta) {
                await supabase
                  .from('dim_metas')
                  .update({ cumplida: metaUpdate.cumplida })
                  .eq('meta_key', meta.meta_key)
              }
            })
          )
        }
      }

      router.push('/dashboard?success=noche')
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
          title="Registro Nocturno"
          subtitle="Cierra tu día con claridad, gratitud y honestidad."
          scripture="En paz me acostaré y asimismo dormiré; porque solo tú, Jehová, me haces vivir confiado"
          reference="Salmos 4:8"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Block 1: Rutina Nocturna */}
          <FormBlock title="Rutina Nocturna" icon={ClipboardDocumentCheckIcon}>
            <div className="grid grid-cols-2 gap-4">
              <Toggle
                label="Oración"
                name="oracion"
                register={register}
              />
              <Toggle
                label="Planeación mañana"
                name="planeacion"
                register={register}
              />
              <Toggle
                label="Cierre de redes"
                name="cierre_redes"
                register={register}
              />
              <Toggle
                label="Ropa lista"
                name="ropa_lista"
                register={register}
              />
              <Toggle
                label="Orden mínimo"
                name="orden_minimo"
                register={register}
              />
            </div>
          </FormBlock>

          {/* Block 2: Ambiente Detallado */}
          <FormBlock title="Ambiente" icon={HomeIcon}>
            <div className="space-y-4">
              <Slider
                label="Orden del cuarto (1-5)"
                name="orden_cuarto"
                register={register}
                min={1}
                max={5}
                value={watch('orden_cuarto')}
                onChange={(e) => setValue('orden_cuarto', parseInt(e.target.value))}
              />
              <Slider
                label="Orden del escritorio (1-5)"
                name="orden_escritorio"
                register={register}
                min={1}
                max={5}
                value={watch('orden_escritorio')}
                onChange={(e) => setValue('orden_escritorio', parseInt(e.target.value))}
              />
              <Slider
                label="Orden de mochila/bolsa (1-5)"
                name="orden_mochila"
                register={register}
                min={1}
                max={5}
                value={watch('orden_mochila')}
                onChange={(e) => setValue('orden_mochila', parseInt(e.target.value))}
              />
              <Slider
                label="Nivel de ruido ambiental (1-5)"
                name="ruido_ambiental"
                register={register}
                min={1}
                max={5}
                value={watch('ruido_ambiental')}
                onChange={(e) => setValue('ruido_ambiental', parseInt(e.target.value))}
              />
              <Slider
                label="Limpieza personal (1-5)"
                name="limpieza_personal"
                register={register}
                min={1}
                max={5}
                value={watch('limpieza_personal')}
                onChange={(e) => setValue('limpieza_personal', parseInt(e.target.value))}
              />
              <Select
                label="Sensación del espacio"
                name="sensacion_espacial"
                register={register}
                options={[
                  { value: 'Amplio', label: 'Amplio' },
                  { value: 'Cómodo', label: 'Cómodo' },
                  { value: 'Ordenado', label: 'Ordenado' },
                  { value: 'Caótico', label: 'Caótico' },
                  { value: 'Claustrofóbico', label: 'Claustrofóbico' },
                  { value: 'Neutral', label: 'Neutral' },
                ]}
                placeholder="Selecciona..."
              />
            </div>
          </FormBlock>

          {/* Block 3: Interacciones */}
          <FormBlock title="Interacciones" icon={UserGroupIcon}>
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Interacciones positivas"
                name="interacciones_pos"
                type="number"
                placeholder="0"
                register={register}
              />
              <TextInput
                label="Interacciones negativas"
                name="interacciones_neg"
                type="number"
                placeholder="0"
                register={register}
              />
            </div>
            <div className="mt-4 space-y-4">
              <TextInput
                label="Describe una interacción positiva"
                name="interaccion_positiva_desc"
                rows={2}
                placeholder="¿Qué sucedió? ¿Con quién?"
                register={register}
              />
              <div className="grid grid-cols-2 gap-4">
                <Slider
                  label="Intensidad positiva (1-5)"
                  name="interaccion_positiva_intensidad"
                  register={register}
                  min={1}
                  max={5}
                  value={watch('interaccion_positiva_intensidad')}
                  onChange={(e) => setValue('interaccion_positiva_intensidad', parseInt(e.target.value))}
                />
                <Select
                  label="Emoción predominante (positiva)"
                  name="interaccion_positiva_emocion"
                  register={register}
                  options={[
                    { value: 'Gozo', label: 'Gozo' },
                    { value: 'Calma', label: 'Calma' },
                    { value: 'Inspiracion', label: 'Inspiración' },
                    { value: 'Agradecimiento', label: 'Agradecimiento' },
                  ]}
                  placeholder="Selecciona..."
                />
              </div>
              <TextInput
                label="Describe una interacción negativa"
                name="interaccion_negativa_desc"
                rows={2}
                placeholder="¿Qué pasó? ¿Cómo te sentiste?"
                register={register}
              />
              <div className="grid grid-cols-2 gap-4">
                <Slider
                  label="Intensidad negativa (1-5)"
                  name="interaccion_negativa_intensidad"
                  register={register}
                  min={1}
                  max={5}
                  value={watch('interaccion_negativa_intensidad')}
                  onChange={(e) => setValue('interaccion_negativa_intensidad', parseInt(e.target.value))}
                />
                <Select
                  label="Emoción predominante (negativa)"
                  name="interaccion_negativa_emocion"
                  register={register}
                  options={[
                    { value: 'Estres', label: 'Estrés' },
                    { value: 'Ansiedad', label: 'Ansiedad' },
                    { value: 'Tristeza', label: 'Tristeza' },
                    { value: 'Ira', label: 'Ira' },
                  ]}
                  placeholder="Selecciona..."
                />
              </div>
            </div>
          </FormBlock>

          {/* Block 4: Reflexión Espiritual */}
          <FormBlock title="Reflexión Espiritual" icon={SparklesIcon}>
            <TextInput
              label="Insight espiritual del día"
              name="insight_espiritual"
              rows={4}
              placeholder="¿Qué aprendiste espiritualmente hoy?"
              register={register}
            />
          </FormBlock>

          {/* Block 5: Gratitud */}
          <FormBlock title="Gratitud" icon={HeartIcon}>
            <TextInput
              label="Hoy agradezco por (1)"
              name="gratitud_1"
              placeholder="Primera cosa por la que estás agradecido..."
              register={register}
            />
            <TextInput
              label="Hoy agradezco por (2)"
              name="gratitud_2"
              placeholder="Segunda cosa..."
              register={register}
            />
            <TextInput
              label="Hoy agradezco por (3)"
              name="gratitud_3"
              placeholder="Tercera cosa..."
              register={register}
            />
          </FormBlock>

          {/* Block 6: Autoconcepto */}
          <FormBlock title="Autoconcepto" icon={UserGroupIcon}>
            <Slider
              label="Identidad del día (1-5)"
              name="identidad_dia"
              register={register}
              min={1}
              max={5}
              value={watch('identidad_dia')}
              onChange={(e) => setValue('identidad_dia', parseInt(e.target.value))}
            />
            <Slider
              label="Estabilidad emocional del día (1-5)"
              name="estabilidad_emocional"
              register={register}
              min={1}
              max={5}
              value={watch('estabilidad_emocional')}
              onChange={(e) => setValue('estabilidad_emocional', parseInt(e.target.value))}
            />
            <TextInput
              label="¿Quién fuiste hoy?"
              name="quien_fuiste"
              rows={2}
              placeholder="Describe tu identidad del día..."
              register={register}
            />
          </FormBlock>

          {/* Block 7b: Cumplimiento de metas */}
          <FormBlock title="Metas del día" icon={FlagIcon}>
            <Toggle
              label="¿Cumpliste tu meta principal?"
              name="cumplio_meta_principal"
              register={register}
            />
            <Toggle
              label="¿Cumpliste tu meta secundaria?"
              name="cumplio_meta_secundaria"
              register={register}
            />
          </FormBlock>

          {/* Block 7: Planeación Mañana */}
          <FormBlock title="Planeación Mañana" icon={FlagIcon}>
            <TextInput
              label="Meta principal de mañana"
              name="meta_manana"
              placeholder="¿Cuál es tu prioridad para mañana?"
              register={register}
            />
          </FormBlock>

          {/* Block 8: Desvíos y Recovery */}
          <FormBlock title="Desvíos y Recovery" icon={ArrowPathIcon}>
            <Toggle
              label="¿Tuve un desvío mayor hoy?"
              name="desvio_mayor"
              description="Un momento donde te desviaste significativamente de tus valores o metas"
              register={register}
            />
            {watch('desvio_mayor') && (
              <div className="space-y-4 pt-2">
                <TextInput
                  label="¿Qué causó el desvío?"
                  name="causa_desvio"
                  rows={2}
                  placeholder="Describe qué sucedió..."
                  register={register}
                />
                <TextInput
                  label="¿Qué acción de recovery tomaré?"
                  name="accion_recovery"
                  rows={2}
                  placeholder="¿Cómo te recuperarás mañana?"
                  register={register}
                />
              </div>
            )}
          </FormBlock>

          {/* Block 9: Notas del Día */}
          <FormBlock title="Notas del Día" icon={DocumentTextIcon}>
            <TextInput
              label="Notas adicionales"
              name="notas_dia"
              rows={6}
              placeholder="Escribe cualquier reflexión adicional del día..."
              register={register}
            />
          </FormBlock>

          <SubmitButton label="Guardar Noche" isLoading={isLoading} />
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import PageHeader from '@/components/PageHeader'
import { ArrowLeftIcon, CalendarDaysIcon, ClockIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'

export default function DiaPage() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
      loadDayData(session.user.id, dateParam)
    }
  }

  const loadDayData = async (userId, date) => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      const { data: fact, error } = await supabase
        .from('fact_habitos_diarios')
        .select('*')
        .eq('user_id', userId)
        .eq('date_key', targetDate)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setData(fact)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    return new Date(dateString + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050507]">
        <span className="text-white/50 animate-pulse font-light tracking-widest">CARGANDO REGISTRO...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Volver
        </button>

        <PageHeader
          title="Registro del Día"
          subtitle={formatDate(dateParam)}
          scripture="Este es el día que hizo el Señor; nos gozaremos y alegraremos en él."
          reference="Salmos 118:24"
        />

        <div className="glass-card p-8">
          {data ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-blue-400">
                    <MoonIcon className="w-5 h-5" />
                    <h3 className="text-sm font-medium uppercase tracking-wider">Sueño</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-display font-bold text-white">{data.sueno_horas || '--'}</p>
                    <p className="text-sm text-white/50 mb-1.5">horas</p>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Calidad: {data.calidad_sueno || 'No registrada'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-amber-400">
                    <SunIcon className="w-5 h-5" />
                    <h3 className="text-sm font-medium uppercase tracking-wider">Energía</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-display font-bold text-white">{data.energia_diaria || '--'}</p>
                    <p className="text-sm text-white/50 mb-1.5">/ 5</p>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Nivel de energía percibido
                  </p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div>
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Meta Principal</h3>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-white/90 italic">
                    "{data.meta_principal_dia || 'No registrada'}"
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Notas & Reflexiones</h3>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-white/80 whitespace-pre-wrap min-h-[100px]">
                    {data.notas_dia || 'Sin notas registradas para este día.'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 font-medium">No hay registros para este día</p>
              <p className="text-sm text-white/40 mt-2 max-w-xs mx-auto">
                Completa tus protocolos diarios para ver la información reflejada aquí.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


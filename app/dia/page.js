'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Card from '@/components/Card'
import PageTitle from '@/components/PageTitle'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function DiaPage() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
      loadDayData(session.user.id)
    }
  }

  const loadDayData = async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: fact, error } = await supabase
        .from('fact_habitos_diarios')
        .select('*')
        .eq('user_id', userId)
        .eq('date_key', today)
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

  if (!user || loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Volver
        </button>

        <PageTitle 
          title="Registro del Día" 
          subtitle={new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        />

        <Card>
          {data ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Horas de sueño</h3>
                <p className="text-lg">{data.sleep_hours || 'No registrado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Calidad del sueño</h3>
                <p className="text-lg">{data.sleep_quality || 'No registrado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Meta del día</h3>
                <p className="text-lg">{data.meta_del_dia || 'No registrado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notas del día</h3>
                <p className="text-lg whitespace-pre-wrap">{data.notas_dia || 'No registrado'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No hay registros para hoy</p>
              <p className="text-sm mt-2">Completa los formularios para ver tus datos aquí</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}


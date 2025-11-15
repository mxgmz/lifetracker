'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ScriptureHeader from '@/components/ScriptureHeader'
import QuickActionCard from '@/components/QuickActionCard'
import StatCard from '@/components/StatCard'
import {
  SunIcon,
  CloudIcon,
  MoonIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  AcademicCapIcon,
  FireIcon,
  PencilSquareIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayData, setTodayData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [router])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        await loadTodayData(session.user.id)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadTodayData = async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('v_dashboard_today')
        .select('*')
        .eq('user_id', userId)
        .eq('date_key', today)
        .single()

      if (data) {
        setTodayData(data)
      }
    } catch (error) {
      console.error('Error loading today data:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    )
  }

  const getDayOfYear = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const oneDay = 1000 * 60 * 60 * 24
    return Math.floor(diff / oneDay)
  }

  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return new Date().toLocaleDateString('es-ES', options)
  }

  const quickActions = [
    {
      title: 'Registrar Mañana',
      description: 'Comienza tu día con claridad e intención',
      icon: SunIcon,
      href: '/manana',
      color: 'yellow',
    },
    {
      title: 'Registrar Tarde',
      description: 'Recalibra tu rumbo a mitad del día',
      icon: CloudIcon,
      href: '/tarde',
      color: 'blue',
    },
    {
      title: 'Registrar Noche',
      description: 'Cierra tu día con reflexión',
      icon: MoonIcon,
      href: '/noche',
      color: 'indigo',
    },
    {
      title: 'Registrar Tentación',
      description: 'Monitorea tus batallas internas',
      icon: ExclamationTriangleIcon,
      href: '/tentacion',
      color: 'red',
    },
    {
      title: 'Registrar Ejercicio',
      description: 'Documenta tu disciplina física',
      icon: FireIcon,
      href: '/ejercicio',
      color: 'amber',
    },
    {
      title: 'Registrar Lectura',
      description: 'Captura tu tiempo con la palabra',
      icon: BookOpenIcon,
      href: '/lectura',
      color: 'green',
    },
    {
      title: 'Registrar Estudio',
      description: 'Registra tu aprendizaje del día',
      icon: AcademicCapIcon,
      href: '/estudio',
      color: 'purple',
    },
    {
      title: 'Journal',
      description: 'Escribe tus pensamientos',
      icon: PencilSquareIcon,
      href: '/journal',
      color: 'gray',
    },
    {
      title: 'Ver Día',
      description: 'Revisa tu registro completo',
      icon: CalendarIcon,
      href: '/dia',
      color: 'gray',
    },
    {
      title: 'Dashboard BI',
      description: 'Analiza métricas y tendencias',
      icon: ChartBarIcon,
      href: '/analytics',
      color: 'gray',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-[680px] mx-auto space-y-8">
        {/* HEADER SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hola, {user?.email?.split('@')[0]}
              </h1>
              <p className="text-sm text-gray-600 mt-1 capitalize">
                {formatDate()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Salir
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Día {getDayOfYear()} del año
            </span>
            {todayData?.identidad_dia && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {todayData.identidad_dia}
              </span>
            )}
          </div>

          <ScriptureHeader 
            scripture="Esfuérzate y sé valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo"
            reference="Josué 1:9"
          />
        </div>

        {/* QUICK ACTIONS SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.href}
                title={action.title}
                description={action.description}
                icon={action.icon}
                color={action.color}
                onClick={() => router.push(action.href)}
              />
            ))}
          </div>
        </div>

        {/* TODAY SNAPSHOT SECTION */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Hoy
          </h2>
          {todayData ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Sueño"
                value={todayData.sueno_horas ? `${Number(todayData.sueno_horas).toFixed(1)}h` : '—'}
                color="blue"
              />
              <StatCard
                label="Calidad"
                value={todayData.calidad_sueno ? `${todayData.calidad_sueno}/5` : '—'}
                color="blue"
              />
              <StatCard
                label="Rutina AM"
                value={
                  typeof todayData.rutina_manana_score === 'number'
                    ? `${todayData.rutina_manana_score}%`
                    : '—'
                }
                color="indigo"
              />
              <StatCard
                label="Energía"
                value={todayData.energia_diaria ? `${todayData.energia_diaria}/5` : '—'}
                color="green"
              />
              <StatCard
                label="Ansiedad"
                value={todayData.ansiedad_promedio ? `${todayData.ansiedad_promedio}/5` : '—'}
                color="amber"
              />
              <StatCard
                label="Enfoque"
                value={todayData.enfoque_promedio ? `${todayData.enfoque_promedio}/5` : '—'}
                color="purple"
              />
              <StatCard
                label="Ejercicio"
                value={todayData.ejercicio_realizado ? 'Sí' : 'No'}
                color={todayData.ejercicio_realizado ? 'green' : 'gray'}
              />
              <StatCard
                label="Estudio"
                value={todayData.estudio_realizado ? 'Sí' : 'No'}
                color={todayData.estudio_realizado ? 'green' : 'gray'}
              />
              <StatCard
                label="Lectura"
                value={todayData.lectura_realizada ? 'Sí' : 'No'}
                color={todayData.lectura_realizada ? 'green' : 'gray'}
              />
              <StatCard
                label="Oración"
                value={todayData.oracion_realizada ? 'Sí' : 'No'}
                color={todayData.oracion_realizada ? 'green' : 'gray'}
              />
              <StatCard
                label="Tentación"
                value={todayData.tentacion_registrada ? 'Sí' : 'No'}
                color={todayData.tentacion_registrada ? 'red' : 'gray'}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">
                No hay registros para hoy. Comienza registrando tu mañana.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

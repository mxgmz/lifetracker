'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import PageHeader from '@/components/PageHeader'
import QuickActionCard from '@/components/QuickActionCard'
import StatCard from '@/components/StatCard'
import {
  SunIcon,
  CloudIcon,
  MoonIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
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
      <div className="min-h-screen flex items-center justify-center bg-[#050507]">
        <div className="text-white/50 animate-pulse">Cargando sistema...</div>
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
      title: 'Mañana',
      description: 'Claridad e intención',
      icon: SunIcon,
      href: '/manana',
      color: 'yellow',
    },
    {
      title: 'Tarde',
      description: 'Recalibración',
      icon: CloudIcon,
      href: '/tarde',
      color: 'blue',
    },
    {
      title: 'Noche',
      description: 'Cierre y reflexión',
      icon: MoonIcon,
      href: '/noche',
      color: 'indigo',
    },
    {
      title: 'Tentación',
      description: 'Registro rápido',
      icon: ExclamationTriangleIcon,
      href: '/tentacion',
      color: 'red',
    },
    {
      title: 'Ejercicio',
      description: 'Disciplina física',
      icon: FireIcon,
      href: '/ejercicio',
      color: 'amber',
    },
    {
      title: 'Lectura',
      description: 'Tiempo en la palabra',
      icon: BookOpenIcon,
      href: '/lectura',
      color: 'green',
    },
    {
      title: 'Estudio',
      description: 'Aprendizaje',
      icon: AcademicCapIcon,
      href: '/estudio',
      color: 'purple',
    },
    {
      title: 'Journal',
      description: 'Pensamientos',
      icon: PencilSquareIcon,
      href: '/journal',
      color: 'gray',
    },
    {
      title: 'Ver Día',
      description: 'Registro completo',
      icon: CalendarIcon,
      href: '/dia',
      color: 'gray',
    },
    {
      title: 'Analytics',
      description: 'Métricas y tendencias',
      icon: ChartBarIcon,
      href: '/analytics',
      color: 'gray',
    },
  ]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Día {getDayOfYear()}
              </span>
              {todayData?.identidad_dia && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {todayData.identidad_dia}
                </span>
              )}
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tighter font-display">
              Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-gray-400 font-light text-lg capitalize">
              {formatDate()}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="glass-button-secondary text-sm py-2 px-4"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: HUD / METRICS */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                Estado del Sistema
              </h2>
              {todayData ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
                  <p className="text-gray-400">
                    Sin datos. Inicia el protocolo matutino.
                  </p>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                Protocolos Activos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions.slice(0, 4).map((action) => (
                  <QuickActionCard
                    key={action.href}
                    {...action}
                    onClick={() => router.push(action.href)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: ACTIONS & QUOTES */}
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                Módulos Auxiliares
              </h2>
              <div className="space-y-3">
                {quickActions.slice(4).map((action) => (
                  <QuickActionCard
                    key={action.href}
                    {...action}
                    onClick={() => router.push(action.href)}
                    compact
                  />
                ))}
              </div>
            </section>

            <div className="glass-card p-6 border-l-4 border-purple-500/50">
              <p className="text-gray-300 italic font-light text-sm mb-2 leading-relaxed">
                "Esfuérzate y sé valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo"
              </p>
              <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">
                — Josué 1:9
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import PageHeader from '@/components/PageHeader'
import { ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline'

export default function ConfiguracionPage() {
  const [user, setUser] = useState(null)
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
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050507]">
        <div className="text-white/50 animate-pulse font-light tracking-widest">CARGANDO...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Volver
        </button>

        <PageHeader
          title="Configuración"
          subtitle="Ajustes de tu sistema operativo personal."
        />

        <div className="glass-card p-8 space-y-8">
          <div className="flex items-center space-x-4 border-b border-white/10 pb-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <UserIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Cuenta</h3>
              <p className="text-lg font-display text-white">{user.email}</p>
            </div>
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="w-full py-4 px-6 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition-all hover:border-red-500/40"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


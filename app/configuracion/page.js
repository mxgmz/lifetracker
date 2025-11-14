'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Card from '@/components/Card'
import PageTitle from '@/components/PageTitle'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

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

        <PageTitle title="Configuración" subtitle="Ajustes y preferencias" />

        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Correo electrónico</h3>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


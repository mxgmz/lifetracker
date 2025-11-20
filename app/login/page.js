'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import SubmitButton from '@/components/SubmitButton'
import { EnvelopeIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      setMessage('Revisa tu correo para el enlace de acceso')
    } catch (error) {
      setMessage(error.message || 'Error al enviar el enlace')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl border border-white/10 mb-2 shadow-lg shadow-blue-900/20">
              <SparklesIcon className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">
              Life OS
            </h1>
            <p className="text-white/50">
              Tu sistema operativo personal para una vida intencional.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-white/10"
                />
                <EnvelopeIcon className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {message && (
              <div
                className={`p-4 rounded-xl text-sm border ${message.includes('Revisa')
                    ? 'bg-green-500/10 border-green-500/20 text-green-200'
                    : 'bg-red-500/10 border-red-500/20 text-red-200'
                  }`}
              >
                {message}
              </div>
            )}

            <SubmitButton label="Enviar enlace de acceso" isLoading={isLoading} />
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          © 2024 Life OS. All rights reserved.
        </p>
      </div>
    </div>
  )
}


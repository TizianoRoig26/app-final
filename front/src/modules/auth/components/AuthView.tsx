import React, { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { ShieldCheck, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react'

export const AuthView: React.FC = () => {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (isRegister) {
        await register({ email, password, full_name: fullName })
      } else {
        await login({ email, password })
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ocurrió un error inesperado al procesar la autenticación')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
      <div className="w-full max-w-sm">
        {/* Encabezado formal */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded border border-[#102246]/20 bg-[#102246]/5 text-[#102246] mb-3 shadow-xs">
            <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-[#102246]">
            Control de Acceso
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Plataforma de Auditoría y Escaneo de Vulnerabilidades
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="thesis-panel rounded border border-slate-200 p-6 shadow-sm bg-white">
          <div className="flex border-b border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                setError(null)
              }}
              className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                !isRegister
                  ? 'border-[#102246] text-[#102246] font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true)
                setError(null)
              }}
              className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                isRegister
                  ? 'border-[#102246] text-[#102246] font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Registrar Usuario
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5] text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isRegister && (
              <div>
                <label className="block text-slate-700 mb-1 font-mono text-[11px] uppercase tracking-wider">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.5]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Lic. / Ing. Evaluador"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#102246]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 mb-1 font-mono text-[11px] uppercase tracking-wider">
                Correo Electrónico Institucional
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.5]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@seguridad.com"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#102246] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-mono text-[11px] uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.5]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#102246]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-2 px-3 bg-[#102246] hover:bg-[#183162] border border-[#102246] disabled:opacity-50 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>{isSubmitting ? 'Verificando...' : isRegister ? 'Registrar Cuenta' : 'Acceder'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </form>

          <div className="mt-5 text-center text-[10px] text-slate-500 font-mono">
            Autenticación JWT • Base de datos relacional
          </div>
        </div>
      </div>
    </div>
  )
}

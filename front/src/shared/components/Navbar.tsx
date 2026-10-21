import React, { useState } from 'react'
import { useAuth } from '../../modules/auth/context/useAuth'
import { downloadScanPdf } from '../../modules/escaneo/api/scanApi'
import { ShieldCheck, Play, Clock, Download, LogOut, Check } from 'lucide-react'

interface NavbarProps {
  onOpenTriggerModal: () => void
  onOpenScheduleModal: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTriggerModal,
  onOpenScheduleModal,
}) => {
  const { user, logout } = useAuth()
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true)
      await downloadScanPdf()
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2500)
    } catch {
      alert('Error al descargar el informe técnico')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <header className="thesis-panel border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 py-3 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Identificación institucional */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-[#102246]/20 bg-[#102246]/5 text-[#102246] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#102246] tracking-tight flex items-center gap-2">
                Sistema de Evaluación de Vulnerabilidades
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">
                  v1.0 • Laboratorio
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Integración de Telemetría: Nmap / OpenVAS / PostgreSQL
              </div>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Botón Configurar Horario */}
          <button
            type="button"
            onClick={onOpenScheduleModal}
            className="px-3 py-1.5 rounded border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configurar ejecución periódica"
          >
            <Clock className="w-3.5 h-3.5 stroke-[1.5] text-slate-500" />
            <span>Programación</span>
          </button>

          {/* Botón Exportar Informe */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-3 py-1.5 rounded border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Descargar informe técnico consolidado"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[1.5] text-[#71b743]" />
                <span className="text-[#3b6e1e]">Informe Generado</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[1.5] text-slate-500" />
                <span>{isDownloadingPdf ? 'Generando...' : 'Exportar Informe'}</span>
              </>
            )}
          </button>

          {/* Botón Disparo Manual con Prussian Blue */}
          <button
            type="button"
            onClick={onOpenTriggerModal}
            className="px-3.5 py-1.5 rounded border border-[#102246] bg-[#102246] hover:bg-[#183162] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Ejecutar Escaneo</span>
          </button>

          {/* Separador */}
          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Sesión de Usuario */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-slate-800 font-medium truncate max-w-[150px]">
                {user?.full_name || user?.email}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Operador</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

import React, { useState } from 'react'
import { useTriggerScan } from '../api/scanApi'
import { Play, X, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'

interface TriggerScanModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TriggerScanModal: React.FC<TriggerScanModalProps> = ({ isOpen, onClose }) => {
  const [target, setTarget] = useState('192.168.100.0/24')
  const [scanType, setScanType] = useState('full')
  const [notes, setNotes] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const triggerMutation = useTriggerScan()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    triggerMutation.mutate(
      { target, scan_type: scanType, notes },
      {
        onSuccess: (data) => {
          setSuccessMessage(`Solicitud de escaneo despachada exitosamente (Estado: ${data.status})`)
          setTimeout(() => {
            setSuccessMessage(null)
            onClose()
          }, 1600)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="thesis-panel bg-white border border-slate-200 w-full max-w-md rounded p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 stroke-[1.5] text-[#102246]" />
            <h3 className="text-sm font-semibold text-[#102246]">
              Disparo Manual de Escaneo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {triggerMutation.isError && (
          <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5] text-rose-600" />
            <span>{triggerMutation.error?.message || 'Error al iniciar escaneo'}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded bg-emerald-50 border border-[#71b743]/40 text-[#3b6e1e] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[1.5] text-[#71b743]" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-mono text-[11px] uppercase tracking-wider">
              Segmento o Host Objetivo
            </label>
            <input
              type="text"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="192.168.100.0/24"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 font-mono text-xs placeholder-slate-400 focus:outline-none focus:border-[#102246]"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-mono text-[11px] uppercase tracking-wider">
              Tipo de Evaluación
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-[#102246]"
            >
              <option value="full">Completo (Descubrimiento Nmap + OpenVAS)</option>
              <option value="quick">Rápido (Puertos Principales)</option>
              <option value="nmap-only">Auditoría de Servicios de Red</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-mono text-[11px] uppercase tracking-wider">
              Justificación / Notas de Auditoría
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones para el registro de auditoría..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-[#102246]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={triggerMutation.isPending}
              className="px-3.5 py-1.5 bg-[#102246] hover:bg-[#183162] border border-[#102246] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{triggerMutation.isPending ? 'Transmitiendo...' : 'Iniciar Procedimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

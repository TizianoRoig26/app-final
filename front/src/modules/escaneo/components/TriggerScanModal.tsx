import React, { useState } from 'react'
import { useTriggerScan } from '../api/scanApi'
import { Play, X, Shield, AlertCircle, CheckCircle2, Server, Terminal } from 'lucide-react'

interface TriggerScanModalProps {
  isOpen: boolean
  onClose: () => void
}

const LAB_TARGETS = [
  { label: 'Todos (Laboratorio)', value: '172.18.0.200 172.18.0.201 172.18.0.202' },
  { label: 'vuln-srv1', value: '172.18.0.200' },
  { label: 'vuln-srv2', value: '172.18.0.201' },
  { label: 'vuln-srv3', value: '172.18.0.202' },
]

export const TriggerScanModal: React.FC<TriggerScanModalProps> = ({ isOpen, onClose }) => {
  const [target, setTarget] = useState('172.18.0.200 172.18.0.201 172.18.0.202')
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
          setSuccessMessage(`Solicitud transmitida exitosamente (Estado: ${data.status})`)
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
      <div className="thesis-panel bg-white border border-slate-200 w-full max-w-lg rounded p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 stroke-[1.5] text-[#102246]" />
            <h3 className="text-sm font-semibold text-[#102246]">
              Disparo Manual de Evaluación
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Metadatos del workflow controlado */}
        <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Terminal className="w-3.5 h-3.5 stroke-[1.5] text-[#102246]" />
              Workflow ID:
            </span>
            <span className="font-semibold text-[#102246]">eZcFfWr0YiA2pAE3</span>
          </div>
          <p className="text-[11px] text-slate-500">
            La ejecución manual no interrumpe el disparador Cron programado a las 02:00 AM diario.
          </p>
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-mono text-[11px] uppercase tracking-wider">
                Objetivo / Hosts
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Laboratorio TASTSERV</span>
            </div>

            {/* Chips rápidos de objetivos */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {LAB_TARGETS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTarget(t.value)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer flex items-center gap-1 ${
                    target === t.value
                      ? 'bg-[#102246] text-white border-[#102246]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Server className="w-3 h-3 stroke-[1.5]" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="172.18.0.200 172.18.0.201 172.18.0.202"
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
              <option value="full">Completo (Descubrimiento Nmap + OpenVAS GMP)</option>
              <option value="quick">Rápido (Servicios de Red Principales)</option>
              <option value="nmap-only">Auditoría Exclusiva Nmap</option>
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


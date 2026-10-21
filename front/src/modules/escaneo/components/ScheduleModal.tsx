import React, { useState } from 'react'
import type { ScanSchedule } from '../types'
import { useUpdateSchedule } from '../api/scanApi'
import { Clock, X, CheckCircle2, AlertCircle } from 'lucide-react'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  currentSchedule?: ScanSchedule
}

const ScheduleForm: React.FC<{
  currentSchedule?: ScanSchedule
  onClose: () => void
}> = ({ currentSchedule, onClose }) => {
  const [cronTime, setCronTime] = useState(currentSchedule?.cron_time || '02:00')
  const [targetCidr, setTargetCidr] = useState(currentSchedule?.target_cidr || '192.168.100.0/24')
  const [isEnabled, setIsEnabled] = useState(currentSchedule?.is_enabled ?? true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const updateScheduleMutation = useUpdateSchedule()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    updateScheduleMutation.mutate(
      {
        cron_time: cronTime,
        target_cidr: targetCidr,
        is_enabled: isEnabled,
      },
      {
        onSuccess: () => {
          setSuccessMessage('Parámetros de cron actualizados correctamente')
          setTimeout(() => {
            setSuccessMessage(null)
            onClose()
          }, 1500)
        },
      }
    )
  }

  return (
    <div className="thesis-panel bg-white border border-slate-200 w-full max-w-md rounded p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 stroke-[1.5] text-[#102246]" />
          <h3 className="text-sm font-semibold text-[#102246]">
            Configuración de Ejecución Programada
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>

      {updateScheduleMutation.isError && (
        <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5] text-rose-600" />
          <span>{updateScheduleMutation.error?.message || 'Error al persistir la programación'}</span>
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
            Hora Diaria de Disparo (Formato HH:MM)
          </label>
          <input
            type="time"
            required
            value={cronTime}
            onChange={(e) => setCronTime(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 font-mono text-xs focus:outline-none focus:border-[#102246]"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Hora de invocación para el trigger de workflow de n8n.
          </p>
        </div>

        <div>
          <label className="block text-slate-700 mb-1 font-mono text-[11px] uppercase tracking-wider">
            Segmento de Red Predeterminado
          </label>
          <input
            type="text"
            required
            value={targetCidr}
            onChange={(e) => setTargetCidr(e.target.value)}
            placeholder="192.168.100.0/24"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 font-mono text-xs focus:outline-none focus:border-[#102246]"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="enableSchedule"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#102246] focus:ring-[#102246]"
          />
          <label htmlFor="enableSchedule" className="text-slate-700 cursor-pointer text-xs">
            Habilitar automatización programada en n8n
          </label>
        </div>

        <div className="pt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateScheduleMutation.isPending}
            className="px-3.5 py-1.5 bg-[#102246] hover:bg-[#183162] border border-[#102246] text-white rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {updateScheduleMutation.isPending ? 'Guardando...' : 'Actualizar Horario'}
          </button>
        </div>
      </form>
    </div>
  )
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  currentSchedule,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <ScheduleForm
        key={currentSchedule?.updated_at || currentSchedule?.cron_time}
        currentSchedule={currentSchedule}
        onClose={onClose}
      />
    </div>
  )
}

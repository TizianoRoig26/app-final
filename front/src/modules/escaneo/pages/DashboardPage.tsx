import React, { useState } from 'react'
import { Navbar } from '../../../shared/components/Navbar'
import { StatCards } from '../components/StatCards'
import { ThesisBenchmarkPanel } from '../components/ThesisBenchmarkPanel'
import { ScanTable } from '../components/ScanTable'
import { TriggerScanModal } from '../components/TriggerScanModal'
import { ScheduleModal } from '../components/ScheduleModal'
import { useScans, useScanSummary, useScanSchedule } from '../api/scanApi'
import { Activity, RefreshCw } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const [isTriggerOpen, setIsTriggerOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  const { data: scans = [], isLoading: isLoadingScans, refetch: refetchScans, isFetching: isFetchingScans } = useScans()
  const { data: summary, isLoading: isLoadingSummary } = useScanSummary()
  const { data: schedule } = useScanSchedule()

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800">
      <Navbar
        onOpenTriggerModal={() => setIsTriggerOpen(true)}
        onOpenScheduleModal={() => setIsScheduleOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Encabezado del Dashboard y Estado de Sincronización */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-lg font-semibold text-[#102246] tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 stroke-[1.5] text-[#102246]" />
              <span>Consola de Evaluación de Seguridad y Vulnerabilidades</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Base de Datos: PostgreSQL / SQLite (vulnerability_scans) • Motor: Nmap & OpenVAS
            </p>
          </div>

          <div className="flex items-center gap-3">
            {summary?.last_scan_date ? (
              <span className="text-xs text-slate-500 font-mono hidden md:inline-block">
                Último registro:{' '}
                <span className="text-slate-800 font-medium">
                  {new Date(summary.last_scan_date).toLocaleString()}
                </span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => refetchScans()}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Actualizar datos"
              aria-label="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[1.5] ${isFetchingScans ? 'animate-spin text-[#102246]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Indicadores KPI */}
        <StatCards
          summary={summary}
          schedule={schedule}
          isLoading={isLoadingSummary}
        />

        {/* Panel de Métricas Experimentales de la Tesis */}
        <ThesisBenchmarkPanel />

        {/* Tabla de Hallazgos */}
        <section aria-labelledby="hallazgos-heading">
          <div className="flex items-center justify-between mb-2.5">
            <h2 id="hallazgos-heading" className="text-xs font-mono font-medium text-slate-600 uppercase tracking-wider">
              Registro Sistemático de Hallazgos
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Total indexado: {scans.length}
            </span>
          </div>

          <ScanTable scans={scans} isLoading={isLoadingScans} />
        </section>
      </main>

      {/* Pie de página institucional */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-mono">
        Proyecto de Tesis • Automatización de Escaneos de Seguridad con Nmap, OpenVAS y N8N
      </footer>

      {/* Modales */}
      <TriggerScanModal
        isOpen={isTriggerOpen}
        onClose={() => setIsTriggerOpen(false)}
      />

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        currentSchedule={schedule}
      />
    </div>
  )
}

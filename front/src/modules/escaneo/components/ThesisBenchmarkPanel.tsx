import React, { useState } from 'react'
import { useThesisMetrics } from '../api/scanApi'
import {
  Clock,
  CheckCircle2,
  Server,
  Terminal,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export const ThesisBenchmarkPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true)
  const { data: metrics, isLoading } = useThesisMetrics()

  if (isLoading || !metrics) {
    return (
      <div className="bg-white border border-slate-200 rounded p-4 text-xs font-mono text-slate-500 animate-pulse">
        Cargando métricas experimentales del entorno de tesis...
      </div>
    )
  }

  const { experimental_benchmark, laboratory_targets, workflow_id, cron_schedule } = metrics

  return (
    <section
      aria-labelledby="thesis-benchmark-heading"
      className="bg-white border border-slate-200 rounded overflow-hidden shadow-xs"
    >
      {/* Barra de título con toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 stroke-[1.5] text-[#102246]" />
          <div>
            <h2
              id="thesis-benchmark-heading"
              className="text-xs font-semibold text-[#102246] tracking-tight uppercase font-mono"
            >
              Entorno Experimental y Resultados de la Tesis (TASTSERV)
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Workflow ID: {workflow_id} • Disparador Programado: {cron_schedule}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] font-mono text-[#71b743] font-medium bg-emerald-50 px-2 py-0.5 rounded border border-[#71b743]/30">
            -{experimental_benchmark.time_reduction_percentage}% Tiempo de Ejecución
          </span>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700"
            aria-label={isExpanded ? 'Contraer panel de tesis' : 'Expandir panel de tesis'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 stroke-[1.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[1.5]" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Métricas Comparativas: Manual vs Automatizado */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 stroke-[1.5] text-slate-400" />
              <span>Validación Experimental de Rendimiento (Anexos III y IV)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tarjeta Tiempo Manual */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-mono text-slate-500 block uppercase">
                  Procedimiento Manual
                </span>
                <span className="text-xl font-bold font-mono text-slate-700 block mt-1">
                  {experimental_benchmark.manual_duration_formatted}
                </span>
                <span className="text-[11px] text-slate-500 font-mono block mt-1">
                  Promedio de ejecución y correlación manual
                </span>
              </div>

              {/* Tarjeta Tiempo Automatizado con n8n */}
              <div className="p-3.5 rounded bg-[#f4f8f0] border border-[#71b743]/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#3b6e1e] font-medium uppercase">
                    Workflow Automatizado
                  </span>
                  <span className="text-[10px] font-mono text-[#3b6e1e] font-semibold flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3 stroke-[1.5]" />
                    -{experimental_benchmark.time_reduction_percentage}%
                  </span>
                </div>
                <span className="text-xl font-bold font-mono text-[#102246] block mt-1">
                  {experimental_benchmark.automated_duration_formatted}
                </span>
                <span className="text-[11px] text-slate-600 font-mono block mt-1">
                  Orquestación autónoma n8n + Nmap + OpenVAS
                </span>
              </div>

              {/* Tarjeta Efectividad de Detección */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Efectividad de Detección
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 font-medium flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 stroke-[1.5] text-[#71b743]" />
                    {experimental_benchmark.detected_vulnerabilities} / {experimental_benchmark.ground_truth_total}
                  </span>
                </div>
                <span className="text-xl font-bold font-mono text-[#102246] block mt-1">
                  {experimental_benchmark.effectiveness_rate_percentage}%
                </span>
                <span className="text-[11px] text-slate-500 font-mono block mt-1">
                  Disparidad diagnóstica con método manual: {experimental_benchmark.diagnostic_disparity_percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Infraestructura de Laboratorio (Servidores Vulnerables) */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 stroke-[1.5] text-slate-400" />
              <span>Objetivos del Laboratorio Controlado</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {laboratory_targets.map((target) => (
                <div
                  key={target.ip}
                  className="p-3 rounded border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="font-mono text-xs font-semibold text-[#102246]">
                      {target.hostname}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {target.ip}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                    {target.description}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Servicios Evaluados:
                    </span>
                    <ul className="space-y-0.5">
                      {target.services.map((srv, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"
                        >
                          {srv}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Terminal className="w-3 h-3 stroke-[1.5]" />
                      SO Contenedor:
                    </span>
                    <span className="text-slate-600">{target.os}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

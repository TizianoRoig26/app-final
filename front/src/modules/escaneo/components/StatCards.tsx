import React from 'react'
import type { ScanSummary, ScanSchedule } from '../types'
import { Shield, AlertOctagon, AlertTriangle, AlertCircle, Info, Server, Clock } from 'lucide-react'

interface StatCardsProps {
  summary?: ScanSummary
  schedule?: ScanSchedule
  isLoading: boolean
}

export const StatCards: React.FC<StatCardsProps> = ({ summary, schedule, isLoading }) => {
  const stats = [
    {
      title: 'Total Hallazgos',
      value: summary?.total ?? 0,
      description: 'Vulnerabilidades detectadas',
      icon: Shield,
      accentBorder: 'border-l-4 border-l-[#102246]',
      valueColor: 'text-[#102246]',
    },
    {
      title: 'Críticas (>= 9.0)',
      value: summary?.critical ?? 0,
      description: 'CVSS v3.1 crítico',
      icon: AlertOctagon,
      accentBorder: 'border-l-4 border-l-[#673520]',
      valueColor: 'text-[#673520]',
    },
    {
      title: 'Altas (7.0 - 8.9)',
      value: summary?.high ?? 0,
      description: 'CVSS v3.1 alto',
      icon: AlertTriangle,
      accentBorder: 'border-l-4 border-l-[#df912c]',
      valueColor: 'text-[#9a570b]',
    },
    {
      title: 'Medias (4.0 - 6.9)',
      value: summary?.medium ?? 0,
      description: 'CVSS v3.1 medio',
      icon: AlertCircle,
      accentBorder: 'border-l-4 border-l-[#fbcd22]',
      valueColor: 'text-[#855e00]',
    },
    {
      title: 'Bajas (< 4.0)',
      value: summary?.low ?? 0,
      description: 'CVSS v3.1 bajo',
      icon: Info,
      accentBorder: 'border-l-4 border-l-[#71b743]',
      valueColor: 'text-[#3b6e1e]',
    },
    {
      title: 'Hosts Analizados',
      value: summary?.total_hosts ?? 0,
      description: 'Equipos en red local',
      icon: Server,
      accentBorder: 'border-l-4 border-l-slate-300',
      valueColor: 'text-slate-800',
    },
    {
      title: 'Programación',
      value: `${schedule?.cron_time || '02:00'}`,
      description: 'Disparo n8n diario',
      icon: Clock,
      accentBorder: 'border-l-4 border-l-slate-300',
      valueColor: 'text-slate-800',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <div
            key={idx}
            className={`thesis-card p-3.5 rounded bg-white border border-slate-200 ${stat.accentBorder} flex flex-col justify-between transition-colors`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider leading-tight">
                {stat.title}
              </span>
              <Icon className="w-3.5 h-3.5 stroke-[1.5] text-slate-400 shrink-0" />
            </div>
            <div>
              <div className={`text-xl font-mono font-semibold tracking-tight ${stat.valueColor}`}>
                {isLoading ? (
                  <span className="inline-block w-8 h-5 bg-slate-100 animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate font-mono">
                {stat.description}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import type { VulnerabilityScan } from '../types'
import { SeverityBadge } from '../../../shared/components/SeverityBadge'
import { Search, Filter, Eye, X, ShieldAlert } from 'lucide-react'

interface ScanTableProps {
  scans: VulnerabilityScan[]
  isLoading: boolean
}

export const ScanTable: React.FC<ScanTableProps> = ({ scans, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [selectedScan, setSelectedScan] = useState<VulnerabilityScan | null>(null)

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        scan.vulnerability_name.toLowerCase().includes(term) ||
        scan.host.toLowerCase().includes(term) ||
        Boolean(scan.cve && scan.cve.toLowerCase().includes(term))

      if (!matchesSearch) return false

      if (severityFilter === 'critical') return scan.severity >= 9.0
      if (severityFilter === 'high') return scan.severity >= 7.0 && scan.severity < 9.0
      if (severityFilter === 'medium') return scan.severity >= 4.0 && scan.severity < 7.0
      if (severityFilter === 'low') return scan.severity < 4.0

      return true
    })
  }, [scans, searchTerm, severityFilter])

  return (
    <div className="thesis-panel rounded border border-slate-200 overflow-hidden bg-white">
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-3.5 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/70">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Filtrar por host, vulnerabilidad o CVE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#102246] font-mono shadow-2xs"
          />
        </div>

        {/* Pestañas de Severidad */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 stroke-[1.5]" />
            Nivel:
          </span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'critical', label: 'Críticas' },
            { id: 'high', label: 'Altas' },
            { id: 'medium', label: 'Medias' },
            { id: 'low', label: 'Bajas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSeverityFilter(tab.id as typeof severityFilter)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                severityFilter === tab.id
                  ? 'bg-[#102246] text-white border-[#102246]'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold text-[11px] border-b border-slate-200 font-mono">
            <tr>
              <th className="py-2.5 px-3.5">Severidad</th>
              <th className="py-2.5 px-3.5">Identificador / Vulnerabilidad</th>
              <th className="py-2.5 px-3.5">Host</th>
              <th className="py-2.5 px-3.5">Puerto</th>
              <th className="py-2.5 px-3.5">CVE</th>
              <th className="py-2.5 px-3.5">Fecha</th>
              <th className="py-2.5 px-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                  Consultando registros en base de datos...
                </td>
              </tr>
            ) : filteredScans.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                  No se encontraron hallazgos registrados con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              filteredScans.map((scan) => (
                <tr
                  key={scan.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <SeverityBadge severity={scan.severity} />
                  </td>
                  <td className="py-2.5 px-3.5 max-w-sm">
                    <div className="font-medium text-slate-900 truncate">
                      {scan.vulnerability_name}
                    </div>
                    {scan.description && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                        {scan.description}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-700">
                    {scan.host}
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {scan.port || '-'}
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-800">
                    {scan.cve || '-'}
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {new Date(scan.scan_date).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedScan(scan)}
                      className="px-2 py-1 rounded border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3 stroke-[1.5]" />
                      <span>Detalle</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle Técnico */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="thesis-panel w-full max-w-xl rounded border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 stroke-[1.5] text-[#102246]" />
                <h4 className="text-sm font-semibold text-[#102246]">
                  Ficha Técnica de Vulnerabilidad
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Cerrar detalle"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block mb-1">
                  Denominación
                </span>
                <p className="font-medium text-slate-900 text-sm">
                  {selectedScan.vulnerability_name}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 border-y border-slate-200 py-2.5 font-mono bg-slate-50 px-2 rounded">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Host</span>
                  <span className="text-slate-800">{selectedScan.host}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Puerto</span>
                  <span className="text-slate-800">{selectedScan.port || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">CVE</span>
                  <span className="text-slate-800">{selectedScan.cve || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Origen</span>
                  <span className="text-slate-800">{selectedScan.scan_source || 'automated'}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block mb-1">
                  Severidad Registrada
                </span>
                <SeverityBadge severity={selectedScan.severity} />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block mb-1">
                  Descripción Técnica
                </span>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] leading-relaxed">
                  {selectedScan.description || 'Sin descripción detallada provista por el motor de escaneo.'}
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block mb-1">
                  Recomendación / Medida Correctiva
                </span>
                <div className="p-2.5 rounded bg-emerald-50/50 border border-[#71b743]/30 text-slate-800 font-mono text-[11px] leading-relaxed">
                  {selectedScan.solution || 'Sin solución específica registrada.'}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="px-3.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

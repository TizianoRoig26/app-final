import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, downloadPdfBlob } from '../../../shared/api/client'
import type {
  VulnerabilityScan,
  ScanSummary,
  ScanSchedule,
  TriggerScanPayload,
  TriggerScanResponse,
  ScanFilterParams,
  ThesisMetrics,
} from '../types'

export const SCAN_KEYS = {
  all: ['scans'] as const,
  list: (filters: ScanFilterParams) => [...SCAN_KEYS.all, 'list', filters] as const,
  summary: () => [...SCAN_KEYS.all, 'summary'] as const,
  schedule: () => [...SCAN_KEYS.all, 'schedule'] as const,
  thesisMetrics: () => [...SCAN_KEYS.all, 'thesis-metrics'] as const,
}

// Obtener listado de escaneos
export function useScans(filters: ScanFilterParams = {}) {
  return useQuery({
    queryKey: SCAN_KEYS.list(filters),
    queryFn: () =>
      apiClient<VulnerabilityScan[]>('/scans', {
        params: {
          host: filters.host,
          min_severity: filters.min_severity,
          limit: filters.limit ?? 200,
          offset: filters.offset ?? 0,
        },
      }),
    refetchInterval: 30000,
  })
}

// Obtener métricas de resumen
export function useScanSummary() {
  return useQuery({
    queryKey: SCAN_KEYS.summary(),
    queryFn: () => apiClient<ScanSummary>('/scans/summary'),
    refetchInterval: 15000,
  })
}

// Obtener configuración de programación
export function useScanSchedule() {
  return useQuery({
    queryKey: SCAN_KEYS.schedule(),
    queryFn: () => apiClient<ScanSchedule>('/scans/schedule'),
  })
}

// Obtener métricas experimentales y objetivos de laboratorio de la tesis
export function useThesisMetrics() {
  return useQuery({
    queryKey: SCAN_KEYS.thesisMetrics(),
    queryFn: () => apiClient<ThesisMetrics>('/scans/thesis-metrics'),
    staleTime: 60000,
  })
}

// Disparar escaneo manual
export function useTriggerScan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TriggerScanPayload) =>
      apiClient<TriggerScanResponse>('/scans/trigger', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCAN_KEYS.all })
    },
  })
}

// Actualizar horario de disparo automático
export function useUpdateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ScanSchedule>) =>
      apiClient<ScanSchedule>('/scans/schedule', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCAN_KEYS.schedule() })
    },
  })
}

// Descargar reporte PDF
export async function downloadScanPdf(): Promise<void> {
  const filename = `informe_escaneo_${new Date().toISOString().slice(0, 10)}.pdf`
  await downloadPdfBlob('/scans/export/pdf', filename)
}

export interface VulnerabilityScan {
  id: number
  scan_date: string
  host: string
  vulnerability_name: string
  severity: number
  port?: string | null
  cve?: string | null
  description?: string | null
  solution?: string | null
}

export interface ScanSummary {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  total_hosts: number
  last_scan_date?: string | null
}

export interface ScanSchedule {
  id: number
  cron_time: string
  target_cidr: string
  is_enabled: boolean
  updated_at?: string | null
}

export interface TriggerScanPayload {
  target: string
  scan_type: string
  notes?: string
}

export interface TriggerScanResponse {
  id: number
  status: string
  target: string
  triggered_at: string
  message: string
}

export interface ScanFilterParams {
  host?: string
  min_severity?: number
  limit?: number
  offset?: number
}

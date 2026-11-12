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
  scan_source?: string | null
}

export interface LaboratoryTarget {
  ip: string
  hostname: string
  os: string
  services: string[]
  description: string
}

export interface ExperimentalBenchmark {
  manual_duration_formatted: string
  manual_duration_seconds: number
  automated_duration_formatted: string
  automated_duration_seconds: number
  time_reduction_percentage: number
  ground_truth_total: number
  detected_vulnerabilities: number
  effectiveness_rate_percentage: number
  diagnostic_disparity_percentage: number
}

export interface ThesisMetrics {
  workflow_id: string
  cron_schedule: string
  laboratory_targets: LaboratoryTarget[]
  experimental_benchmark: ExperimentalBenchmark
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

const BASE_URL = '/api/v1'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options

  let url = `${BASE_URL}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const token = localStorage.getItem('scan_token')

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  })

  if (response.status === 401) {
    localStorage.removeItem('scan_token')
    localStorage.removeItem('scan_user')
    window.dispatchEvent(new Event('auth:unauthorized'))
    throw new Error('Sesión expirada o credenciales inválidas')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || `Error en la solicitud (${response.status})`
    throw new Error(message)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export async function downloadPdfBlob(endpoint: string, filename: string): Promise<void> {
  const token = localStorage.getItem('scan_token')
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error('No se pudo generar el reporte PDF')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

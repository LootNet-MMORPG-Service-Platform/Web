import { navigateToError, navigateToLogin } from '../router/navigation'
import { API_BASE_URL } from './urls'

const BASE_URL = API_BASE_URL

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (!headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    navigateToError()
    throw new Error('Server is unavailable. Please try again later.')
  }

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    const refreshToken = localStorage.getItem('refreshToken')

    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        })

        if (refreshRes.ok) {
          const newAuth = await refreshRes.json()

          localStorage.setItem('token', newAuth.token)
          localStorage.setItem('refreshToken', newAuth.refreshToken)

          headers.set('Authorization', `Bearer ${newAuth.token}`)
          response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })
        } else {
          forceLogout()
          throw new Error('Session expired. Please log in again.')
        }
      } catch {
        forceLogout()
        throw new Error('Session expired. Please log in again.')
      }
    } else {
      forceLogout()
      throw new Error('Unauthorized. Please log in.')
    }
  }

  if (!response.ok) {
    if (response.status >= 500) {
      navigateToError()
    }
    const errorText = await response.text()
    const message = errorText || `API Request Failed with status ${response.status}`
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  if (response.status === 204)
    return undefined as T

  const raw = await response.text()
  if (!raw || raw.trim().length === 0)
    return undefined as T

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json'))
    return raw as T

  return JSON.parse(raw) as T
}

function forceLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  navigateToLogin()
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(endpoint: string, body: FormData) => request<T>(endpoint, { method: 'POST', body }),
}

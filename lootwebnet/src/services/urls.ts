const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

export const API_BASE_URL = String(rawApiBaseUrl).replace(/\/$/, '')

export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
})()

export const HUB_URL = import.meta.env.VITE_HUB_URL
  || (API_ORIGIN ? `${API_ORIGIN}/hub` : '/hub')

export function toAssetUrl(path?: string | null) {
  if (!path)
    return ''

  if (/^(https?:|data:|blob:)/i.test(path))
    return path

  if (path.startsWith('/') && API_ORIGIN)
    return `${API_ORIGIN}${path}`

  return path
}

export const SUPPORTED_BROWSER_PROTOCOLS = new Set(['http:', 'https:'])

export interface BrowserUrlResult {
  ok: boolean
  url?: string
  reason?: string
  search?: boolean
}

export const DEFAULT_BROWSER_HOME_URL = 'https://www.google.com'
export const DEFAULT_SEARCH_PROVIDER_URL = 'https://www.google.com/search?q={query}'

export function isLoopbackHost(hostname: string) {
  const value = hostname.toLowerCase()
  return value === 'localhost' || value === '127.0.0.1' || value === '[::1]' || value === '::1'
}

export function normalizeBrowserUrl(input: string): BrowserUrlResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, reason: 'Enter a URL to open.' }
  if (/^\s*javascript:/i.test(trimmed)) {
    return { ok: false, reason: 'JavaScript URLs are not allowed in the browser surface.' }
  }

  const candidate = isLikelyLocalhost(trimmed)
    ? `http://${trimmed}`
    : /^[a-z][a-z\d+.-]*:/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`

  try {
    const parsed = new URL(candidate)
    if (!SUPPORTED_BROWSER_PROTOCOLS.has(parsed.protocol)) {
      return { ok: false, reason: `Protocol ${parsed.protocol} is not allowed.` }
    }
    return { ok: true, url: parsed.toString() }
  } catch {
    return { ok: false, reason: 'The URL could not be parsed.' }
  }
}

export function normalizeBrowserAddress(
  input: string,
  searchProviderUrl = DEFAULT_SEARCH_PROVIDER_URL,
): BrowserUrlResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, reason: 'Enter a URL or search query.' }

  const normalized = normalizeBrowserUrl(trimmed)
  if (normalized.ok) return normalized

  if (looksLikeUrlButFailed(trimmed)) return normalized
  return {
    ok: true,
    url: searchUrl(searchProviderUrl, trimmed),
    search: true,
  }
}

export function isLocalPreviewUrl(url: string) {
  try {
    const parsed = new URL(url)
    return SUPPORTED_BROWSER_PROTOCOLS.has(parsed.protocol) && isLoopbackHost(parsed.hostname)
  } catch {
    return false
  }
}

export function titleFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.hostname + (parsed.port ? `:${parsed.port}` : '')
  } catch {
    return 'Browser'
  }
}

function isLikelyLocalhost(value: string) {
  return /^(localhost|127\.0\.0\.1|\[?::1\]?)(:\d+)?(\/.*)?$/i.test(value)
}

function looksLikeUrlButFailed(value: string) {
  return (
    /^[a-z][a-z\d+.-]*:/i.test(value) ||
    value.includes('/') ||
    value.includes('\\') ||
    /^[^\s]+\.[^\s]+$/.test(value)
  )
}

function searchUrl(template: string, query: string) {
  const encoded = encodeURIComponent(query)
  if (template.includes('{query}')) return template.replaceAll('{query}', encoded)
  try {
    const parsed = new URL(template)
    parsed.searchParams.set('q', query)
    return parsed.toString()
  } catch {
    return `${DEFAULT_SEARCH_PROVIDER_URL.replace('{query}', encoded)}`
  }
}

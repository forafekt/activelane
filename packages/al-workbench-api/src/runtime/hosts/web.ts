import type {
  WorkbenchDialogOptions,
  WorkbenchFileHandle,
  WorkbenchHostAdapter,
  WorkbenchNotificationOptions,
  WorkbenchStorageAdapter,
  WorkbenchStorageScope,
} from '../../index'

export interface CreateWebWorkbenchHostOptions {
  id?: string
  kind?: 'webapp'
  label?: string
  storagePrefix?: string
  apiBaseUrl?: string
}

function createLocalStorageScope(prefix: string, namespace: string): WorkbenchStorageScope {
  const buildKey = (key: string) => `${prefix}:${namespace}:${key}`

  return {
    async get<T>(key: string) {
      const raw = window.localStorage.getItem(buildKey(key))
      return raw ? (JSON.parse(raw) as T) : undefined
    },
    async set<T>(key: string, value: T) {
      window.localStorage.setItem(buildKey(key), JSON.stringify(value))
    },
    async remove(key: string) {
      window.localStorage.removeItem(buildKey(key))
    },
  }
}

function createStorageAdapter(prefix: string): WorkbenchStorageAdapter {
  return {
    scope(namespace: string) {
      return createLocalStorageScope(prefix, namespace)
    },
  }
}

async function openLocalFile() {
  return new Promise<WorkbenchFileHandle | null>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.style.display = 'none'
    input.addEventListener(
      'change',
      async () => {
        const file = input.files?.[0]
        input.remove()
        if (!file) {
          resolve(null)
          return
        }
        resolve({
          name: file.name,
          contents: await file.text(),
        })
      },
      { once: true },
    )
    document.body.appendChild(input)
    input.click()
  })
}

export function createWebWorkbenchHost(
  options: CreateWebWorkbenchHostOptions = {},
): WorkbenchHostAdapter {
  const prefix = options.storagePrefix ?? 'activelane.webapp'

  return {
    id: options.id ?? 'webapp',
    kind: options.kind ?? 'webapp',
    label: options.label ?? 'Web App',
    mode: 'standard',
    capabilities: {
      config: {
        apiBaseUrl: options.apiBaseUrl,
      },
      storage: createStorageAdapter(prefix),
      notify: async ({ title, message, tone }: WorkbenchNotificationOptions) => {
        const detail = message ? `${title}: ${message}` : title
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body: message })
          return undefined
        }
        const logger =
          tone === 'error' ? console.error : tone === 'warning' ? console.warn : console.info
        logger(detail)
        return undefined
      },
      confirm: async ({ title, message }: WorkbenchDialogOptions) => {
        console.warn(message ? `${title}: ${message}` : title)
        return false
      },
      clipboard: {
        readText: async () => navigator.clipboard.readText(),
        writeText: async (value: string) => navigator.clipboard.writeText(value),
      },
      files: {
        open: openLocalFile,
      },
      network: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
      },
    },
  }
}

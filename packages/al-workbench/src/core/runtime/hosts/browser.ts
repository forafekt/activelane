import type {
  WorkbenchDialogOptions,
  WorkbenchHostAdapter,
  WorkbenchNotificationOptions,
  WorkbenchStorageAdapter,
} from '../../host/types'

type ExtensionStorageArea = {
  get: (
    key: string,
    callback?: (result: Record<string, unknown>) => void,
  ) => Promise<Record<string, unknown>> | undefined
  set: (items: Record<string, unknown>, callback?: () => void) => Promise<void> | void
  remove: (key: string, callback?: () => void) => Promise<void> | void
}

type ExtensionApi = {
  storage: {
    local: ExtensionStorageArea
  }
  notifications?: {
    create: (
      options: {
        type: 'basic'
        title: string
        message: string
        iconUrl: string
      },
      callback?: () => void,
    ) => Promise<unknown> | undefined
  }
  runtime: {
    getURL: (path: string) => string
    openOptionsPage: (callback?: () => void) => Promise<void> | void
  }
}

function getExtensionApi(): ExtensionApi {
  const candidate =
    (globalThis as typeof globalThis & { browser?: ExtensionApi }).browser ??
    (globalThis as typeof globalThis & { chrome?: ExtensionApi }).chrome
  if (!candidate) {
    throw new Error('Browser extension host capabilities are only available in extension contexts.')
  }
  return candidate
}

function isPromiseLike<T>(value: Promise<T> | undefined): value is Promise<T> {
  return Boolean(value && typeof value.then === 'function')
}

async function storageGet(area: ExtensionStorageArea, key: string) {
  const maybePromise = area.get(key)
  if (isPromiseLike(maybePromise)) return maybePromise
  return new Promise<Record<string, unknown>>((resolve) => {
    area.get(key, resolve)
  })
}

async function storageSet(area: ExtensionStorageArea, items: Record<string, unknown>) {
  const maybePromise = area.set(items)
  if (isPromiseLike(maybePromise as Promise<void>)) return maybePromise
  return new Promise<void>((resolve) => {
    area.set(items, resolve)
  })
}

async function storageRemove(area: ExtensionStorageArea, key: string) {
  const maybePromise = area.remove(key)
  if (isPromiseLike(maybePromise as Promise<void>)) return maybePromise
  return new Promise<void>((resolve) => {
    area.remove(key, resolve)
  })
}

async function callMaybePromise(callback: () => Promise<unknown> | undefined) {
  const maybePromise = callback()
  if (isPromiseLike(maybePromise as Promise<void>)) await maybePromise
}

function createBrowserStorageAdapter(): WorkbenchStorageAdapter {
  return {
    scope(namespace: string) {
      return {
        async get<T>(key: string) {
          const browser = getExtensionApi()
          const storageKey = `${namespace}:${key}`
          const result = await storageGet(browser.storage.local, storageKey)
          return result[storageKey] as T | undefined
        },
        async set<T>(key: string, value: T) {
          const browser = getExtensionApi()
          const storageKey = `${namespace}:${key}`
          await storageSet(browser.storage.local, { [storageKey]: value })
        },
        async remove(key: string) {
          const browser = getExtensionApi()
          const storageKey = `${namespace}:${key}`
          await storageRemove(browser.storage.local, storageKey)
        },
      }
    },
  }
}

export function createBrowserWorkbenchHost(): WorkbenchHostAdapter {
  return {
    id: 'browser-extension',
    kind: 'browser-extension',
    label: 'Browser Extension',
    mode: 'standard',
    capabilities: {
      storage: createBrowserStorageAdapter(),
      notify: async ({ title, message }: WorkbenchNotificationOptions) => {
        const browser = getExtensionApi()
        if (browser.notifications?.create) {
          await callMaybePromise(() =>
            browser.notifications?.create({
              type: 'basic',
              title,
              message: message ?? '',
              iconUrl: browser.runtime.getURL('icon/128.png'),
            }),
          )
        }
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
      network: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
      },
    },
  }
}

export function createBrowserHostCapabilities() {
  return {
    ...createBrowserWorkbenchHost().capabilities,
    openOptionsPage: async () => {
      const browser = getExtensionApi()
      await callMaybePromise(async () => {
        await browser.runtime.openOptionsPage()
      })
    },
  }
}

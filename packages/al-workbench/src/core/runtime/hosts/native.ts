import type {
  WorkbenchHostAdapter,
  WorkbenchHostCapabilities,
  WorkbenchStorageAdapter,
  WorkbenchStorageScope,
} from '../../host/types'

export interface CreateNativeWorkbenchHostOptions {
  id?: string
  label?: string
  storagePrefix?: string
  capabilities?: Omit<WorkbenchHostCapabilities, 'storage'> & {
    storage?: WorkbenchStorageAdapter
  }
}

function createLocalStorageScope(prefix: string, namespace: string): WorkbenchStorageScope {
  const buildKey = (key: string) => `${prefix}:${namespace}:${key}`
  return {
    async get<T>(key: string) {
      const raw = localStorage.getItem(buildKey(key))
      return raw ? (JSON.parse(raw) as T) : undefined
    },
    async set<T>(key: string, value: T) {
      localStorage.setItem(buildKey(key), JSON.stringify(value))
    },
    async remove(key: string) {
      localStorage.removeItem(buildKey(key))
    },
  }
}

function createStorageAdapter(prefix: string): WorkbenchStorageAdapter {
  return { scope: (namespace) => createLocalStorageScope(prefix, namespace) }
}

// Native hosts inject their platform capabilities here. The shared workbench API
// intentionally has no knowledge of any concrete host runtime.
export function createNativeWorkbenchHost(
  options: CreateNativeWorkbenchHostOptions = {},
): WorkbenchHostAdapter {
  return {
    id: options.id ?? 'native',
    kind: 'desktop',
    label: options.label ?? 'Native App',
    mode: 'native',
    capabilities: {
      ...options.capabilities,
      storage:
        options.capabilities?.storage ??
        createStorageAdapter(options.storagePrefix ?? 'activelane.native'),
    },
  }
}

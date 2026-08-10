export type ActiveLaneHostKind = 'webapp' | 'desktop' | 'browser-extension' | 'server'

export interface ActiveLaneRuntimeCapabilities {
  storage: boolean
  notifications: boolean
  dialogs: boolean
  clipboard: {
    readText: boolean
    writeText: boolean
  }
  files: {
    open: boolean
    save: boolean
  }
  network: {
    fetch: boolean
  }
  extensions: {
    install: boolean
    uninstall: boolean
    discover: boolean
  }
  server: {
    manage: boolean
    extensions: boolean
  }
}

export interface ActiveLaneRuntimeContext {
  hostKind: ActiveLaneHostKind
  runtimeId: string
  appVersion?: string
  capabilities: ActiveLaneRuntimeCapabilities
}

export function deriveRuntimeCapabilities(
  host: import('../host/types').WorkbenchHostAdapter,
): ActiveLaneRuntimeCapabilities {
  return {
    storage: Boolean(host.capabilities.storage),
    notifications: Boolean(host.capabilities.notify),
    dialogs: Boolean(host.capabilities.confirm),
    clipboard: {
      readText: Boolean(host.capabilities.clipboard?.readText),
      writeText: Boolean(host.capabilities.clipboard?.writeText),
    },
    files: {
      open: Boolean(host.capabilities.files?.open),
      save: Boolean(host.capabilities.files?.save),
    },
    network: {
      fetch: Boolean(host.capabilities.network?.fetch),
    },
    extensions: {
      install: Boolean(host.capabilities.extensions?.install),
      uninstall: Boolean(host.capabilities.extensions?.uninstall),
      discover: Boolean(host.capabilities.extensions?.discover),
    },
    server: {
      manage: Boolean(host.server),
      extensions: Boolean(host.server),
    },
  }
}

export function createRuntimeContext(
  host: import('../host/types').WorkbenchHostAdapter,
  options: Pick<ActiveLaneRuntimeContext, 'runtimeId' | 'appVersion'>,
): ActiveLaneRuntimeContext {
  return {
    hostKind: host.kind,
    runtimeId: options.runtimeId,
    appVersion: options.appVersion,
    capabilities: deriveRuntimeCapabilities(host),
  }
}

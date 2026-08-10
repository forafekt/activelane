import type {
  ExtensionLogEntry,
  ServerRuntimeStatusSnapshot,
  WorkbenchRuntimeApi,
} from '@activelane/workbench-api'
import { onBeforeUnmount, ref } from 'vue'

export function useServerRuntime(runtime: WorkbenchRuntimeApi) {
  const servers = ref<ServerRuntimeStatusSnapshot[]>(
    runtime.host.server
      .listServers()
      .map((server) => runtime.host.server.getServerStatus(server.id))
      .filter((server): server is ServerRuntimeStatusSnapshot => Boolean(server)),
  )

  const disposable = runtime.host.server.watchServerStatus((status) => {
    const index = servers.value.findIndex((server) => server.id === status.id)
    if (index >= 0) servers.value.splice(index, 1, status)
    else servers.value.push(status)
    servers.value.sort((left, right) => left.label.localeCompare(right.label))
  })

  onBeforeUnmount(() => disposable.dispose())

  return {
    servers,
    startServer: (id: string) => runtime.host.server.startServer(id),
    stopServer: (id: string) => runtime.host.server.stopServer(id),
    restartServer: (id: string) => runtime.host.server.restartServer(id),
  }
}

export function useServerLogs(runtime: WorkbenchRuntimeApi, serverId: () => string | undefined) {
  const logs = ref<ExtensionLogEntry[]>([])
  let disposable: { dispose(): void } | undefined

  function bind() {
    disposable?.dispose()
    logs.value = []
    const id = serverId()
    if (!id) return
    disposable = runtime.host.server.watchServerLogs(id, (entry) => {
      logs.value.push(entry)
      if (logs.value.length > 1000) logs.value.splice(0, logs.value.length - 1000)
    })
  }

  onBeforeUnmount(() => disposable?.dispose())

  return { logs, bind }
}

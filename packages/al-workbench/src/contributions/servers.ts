import { getIcon } from '@activelane/icons'
import { defineWorkbenchExtension } from '../core/extensions/helpers'
import type {
  WorkbenchExtensionContext,
  WorkbenchExtensionDefinition,
} from '../core/extensions/types'

import WorkbenchServerLogsView from '../servers/WorkbenchServerLogsView.vue'
import WorkbenchServersView from '../servers/WorkbenchServersView.vue'

const ServerIcon = getIcon('lucide:server')
const LogsIcon = getIcon('lucide:scroll-text')

const SERVERS_TAB_KIND = 'workbench.servers'
const SERVER_LOGS_TAB_KIND = 'workbench.server.logs'
const SERVERS_SURFACE_ID = 'workbench.servers.surface'
const SERVER_LOGS_SURFACE_ID = 'workbench.server.logs.surface'

function activeServerId(context: Pick<WorkbenchExtensionContext, 'workbench'>) {
  return context.workbench.getActiveTab()?.input?.serverId as string | undefined
}

export function createWorkbenchServersContribution(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: 'activelane.workbench-servers',
      name: 'workbench-servers',
      displayName: 'Workbench Servers',
      version: '0.1.0',
      description: 'Manage ActiveLane server extension processes and logs.',
      builtin: true,
      activationEvents: ['onStartup'],
      contributes: {
        commands: [
          {
            id: 'servers.show',
            title: 'Servers: Show Servers',
            category: 'Servers',
            icon: ServerIcon,
            run({ workbench }) {
              workbench.openTab({
                id: 'workbench.servers',
                kind: SERVERS_TAB_KIND,
                surfaceId: SERVERS_SURFACE_ID,
                title: 'Servers',
                icon: ServerIcon,
                preview: false,
              })
            },
          },
          {
            id: 'servers.start',
            title: 'Servers: Start',
            category: 'Servers',
            icon: ServerIcon,
            async run(context) {
              const serverId = activeServerId(context)
              if (serverId) await context.runtime.host.server.startServer(serverId)
            },
          },
          {
            id: 'servers.stop',
            title: 'Servers: Stop',
            category: 'Servers',
            icon: ServerIcon,
            async run(context) {
              const serverId = activeServerId(context)
              if (serverId) await context.runtime.host.server.stopServer(serverId)
            },
          },
          {
            id: 'servers.restart',
            title: 'Servers: Restart',
            category: 'Servers',
            icon: ServerIcon,
            async run(context) {
              const serverId = activeServerId(context)
              if (serverId) await context.runtime.host.server.restartServer(serverId)
            },
          },
          {
            id: 'servers.showLogs',
            title: 'Servers: Show Logs',
            category: 'Servers',
            icon: LogsIcon,
            run(context) {
              const serverId =
                activeServerId(context) ?? context.runtime.host.server.listServers()[0]?.id
              context.workbench.openTab({
                id: serverId ? `workbench.server.logs:${serverId}` : 'workbench.server.logs',
                kind: SERVER_LOGS_TAB_KIND,
                surfaceId: SERVER_LOGS_SURFACE_ID,
                title: 'Server Logs',
                icon: LogsIcon,
                input: serverId ? { serverId } : undefined,
                preview: false,
              })
            },
          },
          {
            id: 'servers.openUrl',
            title: 'Servers: Open URL',
            category: 'Servers',
            icon: ServerIcon,
            run(context) {
              const serverId = activeServerId(context)
              const origin = serverId
                ? context.runtime.host.server.getServerStatus(serverId)?.origin
                : undefined
              if (origin) globalThis.open?.(origin, '_blank', 'noopener,noreferrer')
            },
          },
        ],
        commandPalette: [
          {
            id: 'servers.show.command',
            title: 'Servers: Show Servers',
            commandId: 'servers.show',
            category: 'Servers',
            keywords: ['runtime', 'extensions', 'processes'],
          },
          {
            id: 'servers.logs.command',
            title: 'Servers: Show Logs',
            commandId: 'servers.showLogs',
            category: 'Servers',
            keywords: ['runtime', 'logs', 'output'],
          },
        ],
        tabSurfaces: [
          {
            id: SERVERS_SURFACE_ID,
            title: 'Servers',
            tabKind: SERVERS_TAB_KIND,
            mode: 'native-vue',
            component: WorkbenchServersView,
          },
          {
            id: SERVER_LOGS_SURFACE_ID,
            title: 'Server Logs',
            tabKind: SERVER_LOGS_TAB_KIND,
            mode: 'native-vue',
            component: WorkbenchServerLogsView,
          },
        ],
      },
    },
  })
}

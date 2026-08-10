import { getIcons } from '@activelane/icons'
import {
  defineWorkbenchExtension,
  registerCapability,
  type WorkbenchExtensionDefinition,
} from '@activelane/workbench/extensions'
import McpInspectorSidebar from './McpInspectorSidebar.vue'
import McpInspectorTab from './McpInspectorTab.vue'
import ServerExtensionsTab from './ServerExtensionsTab.vue'

const [Boxes, RadioTower] = getIcons(['Boxes', 'RadioTower'])

const MCP_INSPECTOR_TAB_KIND = 'platform.mcp.inspector'
const SERVER_EXTENSIONS_TAB_KIND = 'platform.server.status'
const MCP_INSPECTOR_SURFACE_ID = 'platform.mcp.surface'
const SERVER_EXTENSIONS_SURFACE_ID = 'platform.server.surface'

export function createMcpInspectorExtension(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: 'activelane.mcp-inspector',
      name: 'mcp-inspector',
      displayName: 'MCP Inspector',
      version: '0.1.0',
      description:
        'Inspect capability providers, discover MCP-adapter capabilities, and test invocation flows.',
      builtin: true,
      type: 'hybrid',
      categories: ['Platform', 'Developer'],
      keywords: ['mcp', 'capabilities', 'tools', 'resources', 'server extensions'],
      activationEvents: ['onStartup'],
      server: {
        id: 'browser-worker-demo',
        label: 'MCP Inspector Worker',
        mode: 'worker',
        runtime: 'node',
        startup: 'auto',
        restart: { policy: 'never', maxRestarts: 0, windowMs: 60_000, backoffMs: 0 },
      },
      permissions: {
        filesystem: 'none',
        network: 'loopback',
        processes: false,
      },
      contributes: {
        capabilities: [
          {
            id: 'activelane.mcp-inspector.echo',
            kind: 'mcp.tool',
            title: 'Echo Payload',
            description: 'Returns the provided JSON payload.',
          },
          {
            id: 'activelane.mcp-inspector.runtime',
            kind: 'mcp.resource',
            title: 'Runtime Snapshot',
            description: 'Returns extension and capability counts.',
          },
          {
            id: 'activelane.mcp-inspector.open',
            kind: 'command',
            title: 'Open MCP Inspector',
            description: 'Opens the MCP inspector workbench tab.',
          },
        ],
        activityRail: [
          {
            id: 'platform.mcp.activity',
            title: 'MCP',
            icon: RadioTower,
            defaultSidebarViewId: 'platform.mcp.sidebar',
            order: 25,
          },
        ],
        sidebarViews: [
          {
            id: 'platform.mcp.sidebar',
            title: 'MCP Runtime',
            activityId: 'platform.mcp.activity',
            component: McpInspectorSidebar,
          },
        ],
        commands: [
          {
            id: 'platform.mcp.open',
            title: 'MCP: Open Inspector',
            icon: RadioTower,
            run(context) {
              context.workbench.setActiveActivity('platform.mcp.activity')
              context.workbench.setActiveSidebarView('platform.mcp.sidebar')
              context.workbench.openTab({
                id: 'platform.mcp.inspector',
                kind: MCP_INSPECTOR_TAB_KIND,
                surfaceId: MCP_INSPECTOR_SURFACE_ID,
                title: 'MCP Inspector',
                ownerExtensionId: 'activelane.mcp-inspector',
                preview: false,
                icon: RadioTower,
              })
            },
          },
          {
            id: 'platform.server.open',
            title: 'Server Extensions: Open Status',
            icon: Boxes,
            run(context) {
              context.workbench.openTab({
                id: 'platform.server.status',
                kind: SERVER_EXTENSIONS_TAB_KIND,
                surfaceId: SERVER_EXTENSIONS_SURFACE_ID,
                title: 'Server Extensions',
                ownerExtensionId: 'activelane.mcp-inspector',
                preview: false,
                icon: Boxes,
              })
            },
          },
        ],
        commandPalette: [
          {
            id: 'platform.mcp.command.open',
            title: 'MCP: Open Inspector',
            commandId: 'platform.mcp.open',
            icon: RadioTower,
            category: 'Developer',
            keywords: ['mcp', 'tools', 'resources', 'actions'],
          },
          {
            id: 'platform.server.command.open',
            title: 'Server Extensions: Open Status',
            commandId: 'platform.server.open',
            icon: Boxes,
            category: 'Developer',
            keywords: ['server', 'worker', 'extension lifecycle'],
          },
        ],
        tabSurfaces: [
          {
            id: MCP_INSPECTOR_SURFACE_ID,
            title: 'MCP Inspector',
            tabKind: MCP_INSPECTOR_TAB_KIND,
            mode: 'native-vue',
            component: McpInspectorTab,
          },
          {
            id: SERVER_EXTENSIONS_SURFACE_ID,
            title: 'Server Extensions',
            tabKind: SERVER_EXTENSIONS_TAB_KIND,
            mode: 'native-vue',
            component: ServerExtensionsTab,
          },
        ],
        settings: [
          {
            id: 'platform.mcp.logInvocations',
            label: 'Log MCP invocations',
            description: 'Record local MCP invocations in developer surfaces.',
            category: 'Platform',
            type: 'boolean',
            defaultValue: true,
            scope: 'user',
          },
        ],
        marketplace: {
          categories: ['Platform', 'Developer'],
          featured: true,
          keywords: ['mcp', 'server extensions', 'developer'],
          longDescription:
            'A built-in extension that proves MCP discovery, invocation, and browser-safe server extension representation inside the webapp workbench.',
        },
      },
    },
    activate(context) {
      registerCapability(
        context,
        {
          id: 'activelane.mcp-inspector.echo',
          kind: 'mcp.tool',
          title: 'Echo Payload',
          extensionId: context.extensionId,
        },
        ({ input }) => ({
          payload: input,
          extensionId: context.extensionId,
          timestamp: new Date().toISOString(),
        }),
      )
      registerCapability(
        context,
        {
          id: 'activelane.mcp-inspector.runtime',
          kind: 'mcp.resource',
          title: 'Runtime Snapshot',
          extensionId: context.extensionId,
        },
        () => ({
          hostKind: context.runtime.context.hostKind,
          runtimeId: context.runtime.context.runtimeId,
          extensions: context.runtime.extensions.records.length,
          capabilities: context.runtime.capabilities.entries.length,
          mcpCapabilities: context.runtime.capabilities
            .list()
            .filter((capability) => capability.kind.startsWith('mcp.')).length,
        }),
      )
      registerCapability(
        context,
        {
          id: 'activelane.mcp-inspector.open',
          kind: 'command',
          title: 'Open MCP Inspector',
          extensionId: context.extensionId,
        },
        () => {
          context.runtime.commands.execute('platform.mcp.open')
          return { opened: true }
        },
      )
      return undefined
    },
  })
}

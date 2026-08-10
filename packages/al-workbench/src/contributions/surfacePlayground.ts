import { getIcon } from '@activelane/icons'
import type {
  OpenWorkbenchTabOptions,
  WorkbenchCommandExecutionContext,
  WorkbenchExtensionDefinition,
  WorkbenchRuntimeApi,
  WorkbenchSurfaceDescriptor,
} from '@activelane/workbench-api'
import { defineWorkbenchExtension } from '@activelane/workbench-api'
import SurfacePlaygroundView from '../views/surfaces/SurfacePlaygroundView.vue'
import SurfaceZoneDemoPane from '../views/surfaces/SurfaceZoneDemoPane.vue'

const EXTENSION_ID = 'activelane.surface-playground'
const TAB_KIND = 'workbench.surface-playground'

type PlaygroundMode = WorkbenchSurfaceDescriptor['mode']

const iframeHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: Canvas; color: CanvasText; }
      main { width: min(36rem, calc(100vw - 2rem)); border: 1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius: 8px; padding: 1rem; }
      code { font-size: 0.8rem; }
    </style>
  </head>
  <body>
    <main>
      <p><strong>Iframe srcdoc surface</strong></p>
      <p>This tab is rendered from an inline HTML descriptor, not a Vue component.</p>
      <code>activelane.surface.ready</code>
    </main>
    <script>
      parent.postMessage({
        type: 'activelane.surface.ready',
        surfaceId: 'surface-playground.iframe',
        extensionId: 'activelane.surface-playground',
        payload: { source: 'srcdoc' }
      }, '*')
    </script>
  </body>
</html>`

function surfaceForMode(mode: PlaygroundMode): WorkbenchSurfaceDescriptor {
  if (mode === 'native-vue') {
    return {
      id: 'surface-playground.native-vue',
      title: 'Native Vue Surface',
      ownerExtensionId: EXTENSION_ID,
      mode,
      component: SurfacePlaygroundView,
      metadata: { playground: true },
    }
  }

  if (mode === 'shadow-dom') {
    return {
      id: 'surface-playground.shadow-dom',
      title: 'Shadow DOM Surface',
      ownerExtensionId: EXTENSION_ID,
      mode,
      component: SurfacePlaygroundView,
      styles: [
        `
:host {
  --surface-playground-accent: #0f766e;
}
section {
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--surface-playground-accent) 14%, transparent), transparent 34%),
    var(--background);
}
h1 {
  color: var(--surface-playground-accent);
}
pre {
  border-color: color-mix(in srgb, var(--surface-playground-accent) 45%, transparent);
}
`,
      ],
      styleUrls: [
        '/home/jonnydoyle/Dev/github/activelane-project/packages/al-shadcn/src/styles/index.css',
      ],
      metadata: { playground: true },
    }
  }

  if (mode === 'iframe') {
    return {
      id: 'surface-playground.iframe',
      title: 'Iframe Srcdoc Surface',
      ownerExtensionId: EXTENSION_ID,
      mode,
      srcdoc: iframeHtml,
      bridge: {
        enabled: true,
        allowedOrigins: ['null'],
        allowedCapabilities: [],
      },
      metadata: { playground: true },
    }
  }

  if (mode === 'external-url') {
    return {
      id: 'surface-playground.external-url',
      title: 'External URL Surface',
      ownerExtensionId: EXTENSION_ID,
      mode,
      url: 'https://example.com/',
      bridge: {
        enabled: false,
        allowExternalUrl: false,
      },
      metadata: { playground: true },
    }
  }

  return {
    id: 'surface-playground.webview',
    title: 'Webview Placeholder Surface',
    ownerExtensionId: EXTENSION_ID,
    mode: 'webview',
    fallback: {
      title: 'Webview surface unavailable',
      message: 'Desktop webview surfaces are not implemented in this host yet.',
    },
    metadata: { playground: true },
  }
}

function openPlaygroundSurface(
  runtime: WorkbenchRuntimeApi,
  mode: PlaygroundMode,
  options: Partial<OpenWorkbenchTabOptions> = {},
) {
  const surface = surfaceForMode(mode)
  runtime.workbench.openTab({
    id: options.id ?? surface.id,
    kind: TAB_KIND,
    surfaceId: surface.id,
    surface,
    title: options.title ?? surface.title ?? surface.id,
    ownerExtensionId: EXTENSION_ID,
    preview: false,
    icon: options.icon,
    input: {
      mode,
      mount: mode === 'shadow-dom' ? 'shadow-root' : mode,
      ...(options.input ?? {}),
    },
  })
}

function command(id: string, title: string, mode: PlaygroundMode, icon = getIcon('Layers3')) {
  return {
    id,
    title,
    category: 'Surface Playground',
    icon,
    run(context: WorkbenchCommandExecutionContext) {
      openPlaygroundSurface(context.runtime, mode, { icon })
    },
  }
}

export function createWorkbenchSurfacePlaygroundContribution(): WorkbenchExtensionDefinition {
  return defineWorkbenchExtension({
    manifest: {
      id: EXTENSION_ID,
      name: 'surface-playground',
      displayName: 'Surface Playground',
      version: '0.1.0',
      description: 'Developer-only examples for each workbench surface render mode.',
      builtin: true,
      categories: ['Developer'],
      activationEvents: ['onStartup'],
      contributes: {
        commands: [
          {
            id: 'surfacePlayground.openZoneDemo',
            title: 'Surface Playground: Open Zone Demo',
            category: 'Surface Playground',
            icon: getIcon('PanelBottomOpen'),
            run(context: WorkbenchCommandExecutionContext) {
              context.workbench.setActiveBottomPanelView('surfacePlayground.zoneDemo.bottomPane')
            },
          },
          command(
            'surfacePlayground.openNativeVue',
            'Surface Playground: Native Vue',
            'native-vue',
          ),
          command(
            'surfacePlayground.openShadowDom',
            'Surface Playground: Shadow DOM',
            'shadow-dom',
          ),
          command(
            'surfacePlayground.openIframe',
            'Surface Playground: Iframe Srcdoc',
            'iframe',
            getIcon('Code2'),
          ),
          command(
            'surfacePlayground.openExternalUrl',
            'Surface Playground: External URL',
            'external-url',
            getIcon('ExternalLink'),
          ),
          command(
            'surfacePlayground.openWebview',
            'Surface Playground: Webview Placeholder',
            'webview',
            getIcon('MonitorX'),
          ),
          {
            id: 'surfacePlayground.openAll',
            title: 'Surface Playground: Open All Modes',
            category: 'Surface Playground',
            icon: getIcon('AppWindow'),
            run(context: WorkbenchCommandExecutionContext) {
              for (const mode of [
                'native-vue',
                'shadow-dom',
                'iframe',
                'external-url',
                'webview',
              ] satisfies PlaygroundMode[]) {
                openPlaygroundSurface(context.runtime, mode)
              }
            },
          },
        ],
        commandPalette: [
          {
            id: 'surfacePlayground.palette.zoneDemo',
            title: 'Surface Playground: Open Zone Demo',
            commandId: 'surfacePlayground.openZoneDemo',
            icon: getIcon('PanelBottomOpen'),
            category: 'Surface Playground',
            keywords: ['zone', 'status', 'activity', 'bottom pane'],
          },
          {
            id: 'surfacePlayground.palette.openAll',
            title: 'Surface Playground: Open All Modes',
            commandId: 'surfacePlayground.openAll',
            icon: getIcon('AppWindow'),
            category: 'Surface Playground',
            keywords: ['surface', 'iframe', 'shadow', 'webview', 'external'],
          },
          {
            id: 'surfacePlayground.palette.iframe',
            title: 'Surface Playground: Iframe Srcdoc',
            commandId: 'surfacePlayground.openIframe',
            icon: getIcon('Code2'),
            category: 'Surface Playground',
            keywords: ['surface', 'iframe', 'srcdoc'],
          },
        ],
        menus: [
          {
            id: 'surfacePlayground.menu.openAll',
            title: 'Surface Playground',
            location: 'global/app',
            group: 'developer',
            commandId: 'surfacePlayground.openAll',
            icon: getIcon('AppWindow'),
          },
          {
            id: 'surfacePlayground.menu.zoneDemo',
            title: 'Open Zone Demo',
            location: 'global/app',
            group: 'developer',
            commandId: 'surfacePlayground.openZoneDemo',
            icon: getIcon('PanelBottomOpen'),
            order: 10,
          },
        ],
        globalMenus: [
          {
            id: 'surfacePlayground.menu.developer',
            title: 'Developer',
            menuId: 'developer',
            placement: ['topBar', 'activityLauncher'],
            order: 95,
          },
        ],
        statusBar: [
          {
            id: 'surfacePlayground.status.zoneDemo',
            title: 'Open zone demo',
            label: 'Zones',
            icon: 'PanelBottomOpen',
            commandId: 'surfacePlayground.openZoneDemo',
            alignment: 'right',
            order: 20,
          },
        ],
        activityRail: [
          {
            id: 'surfacePlayground.activity.zoneDemo',
            title: 'Workbench Zones',
            icon: getIcon('LayoutPanelLeft'),
            badge: { value: 'Z', tone: 'info' },
            defaultSidebarViewId: 'surfacePlayground.zoneDemo.sidebar',
            order: 900,
          },
        ],
        sidebarViews: [
          {
            id: 'surfacePlayground.zoneDemo.sidebar',
            title: 'Workbench Zones',
            activityId: 'surfacePlayground.activity.zoneDemo',
            component: SurfaceZoneDemoPane,
            order: 900,
          },
        ],
        bottomPaneViews: [
          {
            id: 'surfacePlayground.zoneDemo.bottomPane',
            title: 'Zones',
            icon: 'PanelBottomOpen',
            component: SurfaceZoneDemoPane,
            placement: 'bottomPane',
            order: 900,
          },
        ],
      },
    },
  })
}

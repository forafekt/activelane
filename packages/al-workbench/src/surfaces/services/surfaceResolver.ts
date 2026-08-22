import { WorkbenchSettingsView } from '../../components/settings'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type {
  WorkbenchTab,
  WorkbenchTabRendererContribution,
} from '../../core/workbench/contributions'
import type { WorkbenchSurfaceDescriptor } from '../../core/workbench/surfaces'

function buildContext(tab: WorkbenchTab, runtime: WorkbenchRuntimeApi) {
  return {
    tab,
    groupId: tab.groupId,
    tabKind: tab.kind,
    ownerExtensionId: tab.ownerExtensionId,
    pinned: tab.pinned,
    dirty: tab.dirty,
    lifecycle: tab.lifecycle,
    preview: tab.preview,
    closable: tab.closable,
    capabilities: tab.capabilities ?? [],
    runtime,
  }
}

export function surfaceFromRenderer(
  renderer: WorkbenchTabRendererContribution,
  tab: WorkbenchTab,
  runtime: WorkbenchRuntimeApi,
): WorkbenchSurfaceDescriptor | Promise<WorkbenchSurfaceDescriptor> {
  if (typeof renderer.surface === 'function') {
    const resolved = renderer.surface(buildContext(tab, runtime))
    return Promise.resolve(resolved).then((surface) =>
      normalizeRendererSurface(surface, renderer, tab, runtime),
    )
  }

  if (renderer.surface) {
    return {
      ...renderer.surface,
      ownerExtensionId:
        renderer.surface.ownerExtensionId ?? renderer.ownerExtensionId ?? tab.ownerExtensionId,
      props: {
        tab,
        runtime,
        ...(renderer.surface.props ?? {}),
        ...(renderer.surface.passThrough ?? {}),
      },
    }
  }

  if (renderer.component) {
    return {
      id: renderer.id,
      title: renderer.title,
      ownerExtensionId: renderer.ownerExtensionId ?? tab.ownerExtensionId,
      mode: 'native-vue',
      component: renderer.component,
      props: { tab, runtime },
    }
  }

  return unsupportedSurface(tab, `Renderer ${renderer.id} did not declare a component or surface.`)
}

export function rendererHasSurface(renderer: WorkbenchTabRendererContribution) {
  return Boolean(renderer.surface)
}

export function unsupportedSurface(tab: WorkbenchTab, message: string): WorkbenchSurfaceDescriptor {
  return {
    id: `unsupported:${tab.id}`,
    title: tab.title,
    ownerExtensionId: tab.ownerExtensionId,
    mode: 'webview',
    fallback: {
      title: 'Unsupported surface',
      message,
    },
  }
}

export function resolveWorkbenchTabSurface(
  tab: WorkbenchTab,
  runtime: WorkbenchRuntimeApi,
): WorkbenchSurfaceDescriptor | Promise<WorkbenchSurfaceDescriptor> {
  if (tab.surface) {
    return normalizeTabSurface(tab.surface, tab, runtime)
  }

  if (tab.kind === 'workbench.settings') {
    return {
      id: 'workbench.settings',
      title: 'Settings',
      ownerExtensionId: tab.ownerExtensionId,
      mode: 'native-vue',
      component: WorkbenchSettingsView,
      props: { tab, runtime },
    }
  }

  const view = runtime.registry.views.find(
    (candidate) => candidate.id === tab.surfaceId || candidate.id === tab.kind,
  )
  if (view?.renderer.type === 'isolated') {
    return {
      id: view.id,
      title: tab.title,
      ownerExtensionId: view.ownerExtensionId ?? tab.ownerExtensionId,
      mode: 'isolated',
      view,
      instanceId: tab.viewInstanceId ?? tab.id,
      context: tab.input,
    }
  }

  const renderer = runtime.registry.tabRenderers.find(
    (item) => item.tabKind === tab.kind || item.id === tab.kind,
  )
  if (renderer && rendererHasSurface(renderer)) return surfaceFromRenderer(renderer, tab, runtime)

  if (renderer) return surfaceFromRenderer(renderer, tab, runtime)

  return unsupportedSurface(tab, `No renderer is registered for ${tab.kind}.`)
}

function normalizeTabSurface(
  surface: WorkbenchSurfaceDescriptor,
  tab: WorkbenchTab,
  runtime: WorkbenchRuntimeApi,
): WorkbenchSurfaceDescriptor {
  return {
    ...surface,
    ownerExtensionId: surface.ownerExtensionId ?? tab.ownerExtensionId,
    props: {
      tab,
      runtime,
      ...(surface.props ?? {}),
      ...(surface.passThrough ?? {}),
    },
  }
}

function normalizeRendererSurface(
  surface: WorkbenchSurfaceDescriptor,
  renderer: WorkbenchTabRendererContribution,
  tab: WorkbenchTab,
  runtime: WorkbenchRuntimeApi,
): WorkbenchSurfaceDescriptor {
  return {
    ...surface,
    ownerExtensionId: surface.ownerExtensionId ?? renderer.ownerExtensionId ?? tab.ownerExtensionId,
    props: {
      tab,
      runtime,
      ...(surface.props ?? {}),
      ...(surface.passThrough ?? {}),
    },
  }
}

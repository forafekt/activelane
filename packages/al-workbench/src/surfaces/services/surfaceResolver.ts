import type {
  WorkbenchRuntimeApi,
  WorkbenchSurfaceDescriptor,
  WorkbenchTab,
  WorkbenchTabRendererContribution,
  WorkbenchTabSurfaceContribution,
} from '@activelane/workbench-api'
import { WorkbenchSettingsView } from '../../components/settings'

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

export function surfaceFromTabSurface(
  contribution: WorkbenchTabSurfaceContribution,
  tab: WorkbenchTab,
  runtime: WorkbenchRuntimeApi,
): WorkbenchSurfaceDescriptor {
  return {
    ...contribution,
    id: contribution.id,
    title: contribution.title ?? tab.title,
    ownerExtensionId: contribution.ownerExtensionId ?? tab.ownerExtensionId,
    props: {
      tab,
      runtime,
      ...(contribution.props ?? {}),
      ...(contribution.passThrough ?? {}),
    },
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

  const renderer = runtime.registry.tabRenderers.find(
    (item) => item.tabKind === tab.kind || item.id === tab.kind,
  )
  if (renderer && rendererHasSurface(renderer)) return surfaceFromRenderer(renderer, tab, runtime)

  const tabSurface = runtime.registry.tabSurfaces.find(
    (item) =>
      item.id === tab.surfaceId ||
      item.tabKind === tab.kind ||
      item.id === tab.kind ||
      item.id === tab.id,
  )
  if (tabSurface) return surfaceFromTabSurface(tabSurface, tab, runtime)

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

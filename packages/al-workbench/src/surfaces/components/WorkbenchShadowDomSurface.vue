<script setup lang="ts">
import { createApp, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { WorkbenchTab } from '../../core/workbench/contributions'
import type { WorkbenchSurfaceDescriptor } from '../../core/workbench/surfaces'

defineOptions({ name: 'WorkbenchShadowDomSurface' })

const props = defineProps<{
  tab: WorkbenchTab
  surface: WorkbenchSurfaceDescriptor
}>()

const host = ref<HTMLElement | null>(null)
const errorMessage = ref<string | null>(null)
const currentInstance = getCurrentInstance()
let app: ReturnType<typeof createApp> | null = null

const baseShadowStyles = `
:host{display:block;height:100%;min-height:0;color:var(--foreground);background:var(--background);}
*{box-sizing:border-box;}
.h-full{height:100%;}
.min-h-0{min-height:0;}
`

function cleanup() {
  app?.unmount()
  app = null
  if (host.value?.shadowRoot) host.value.shadowRoot.innerHTML = ''
}

async function mountSurface() {
  cleanup()
  errorMessage.value = null
  await nextTick()
  if (!host.value || !props.surface.component) {
    errorMessage.value = 'No Vue component was provided for this Shadow DOM surface.'
    return
  }

  try {
    const shadowRoot = host.value.shadowRoot ?? host.value.attachShadow({ mode: 'open' })
    const mountPoint = document.createElement('section')
    mountPoint.className = 'h-full min-h-0'
    shadowRoot.append(mountPoint)

    injectShadowStyles(shadowRoot)

    // Shadow DOM isolates styles only; extension code still runs in the workbench JS realm.
    app = createApp(props.surface.component, props.surface.props ?? props.surface.passThrough ?? {})
    if (currentInstance) app._context = currentInstance.appContext
    app.mount(mountPoint)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}

function injectShadowStyles(shadowRoot: ShadowRoot) {
  const baseStyle = document.createElement('style')
  baseStyle.dataset.surfaceStyle = 'base'
  baseStyle.textContent = baseShadowStyles
  shadowRoot.prepend(baseStyle)

  for (const styleUrl of props.surface.styleUrls ?? []) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    if (typeof styleUrl === 'string') {
      link.href = styleUrl
    } else {
      link.href = styleUrl.href
      if (styleUrl.crossOrigin) link.crossOrigin = styleUrl.crossOrigin
      if (styleUrl.integrity) link.integrity = styleUrl.integrity
    }
    shadowRoot.append(link)
  }

  for (const cssText of props.surface.styles ?? []) {
    const style = document.createElement('style')
    style.dataset.surfaceStyle = 'descriptor'
    style.textContent = cssText
    shadowRoot.append(style)
  }
}

watch(
  () => [
    props.surface.id,
    props.surface.component,
    props.surface.props,
    props.surface.styles,
    props.surface.styleUrls,
  ],
  mountSurface,
  {
    immediate: true,
  },
)

onBeforeUnmount(cleanup)
</script>

<template>
  <div :data-surface-id="surface.id" class="h-full min-h-0">
    <div v-show="!errorMessage" ref="host" class="h-full min-h-0" />
    <section
      v-if="errorMessage"
      class="m-4 grid gap-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Shadow DOM surface
      </p>
      <h3 class="m-0 text-sm font-semibold tracking-tight text-foreground">Surface failed</h3>
      <p class="m-0 text-sm leading-relaxed text-muted-foreground">{{ errorMessage }}</p>
      <AlButton
        type="button"
        size="sm"
        variant="secondary"
        class="justify-self-start"
        @click="mountSurface"
      >
        Retry surface
      </AlButton>
    </section>
  </div>
</template>

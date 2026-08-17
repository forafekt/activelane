<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { AlBadge, AlButton } from '@activelane/shadcn'
import { computed, nextTick, ref, watch } from 'vue'
import { useWorkbenchRuntime } from '../../composables/useWorkbenchRuntime'
import { useApplications } from '../composables/useApplications'
import { useLauncher } from '../composables/useLauncher'
import LauncherAppGrid from './LauncherAppGrid.vue'
import LauncherSearch from './LauncherSearch.vue'
import LauncherSection from './LauncherSection.vue'
import WorkspaceSwitcher from './WorkspaceSwitcher.vue'

const LayoutGrid = getIcon('lucide.layout-grid')
const X = getIcon('lucide.x')

defineOptions({ name: 'LauncherOverlay' })

const launcher = useLauncher()
const runtime = useWorkbenchRuntime()
const applications = useApplications()
const panelRef = ref<HTMLElement | null>(null)

const results = applications.results
const pinnedApps = applications.pinnedApps
const recentApps = applications.recentApps
const allApps = applications.apps
const selectedApp = computed(() => results.value[launcher.selectedIndex] ?? results.value[0])
const pinnedIds = computed(() => pinnedApps.value.map((app) => app.id))
const showRecentApps = computed(
  () =>
    runtime.settings.get<boolean>('launcher.showRecentApps') !== false &&
    launcher.getRecentApps().length > 0,
)
const showPinnedApps = computed(
  () =>
    runtime.settings.get<boolean>('launcher.showPinnedApps') !== false &&
    launcher.getPinnedApps().length > 0,
)
const showCategories = computed(
  () =>
    runtime.settings.get<boolean>('launcher.showCategories') !== false &&
    launcher.getCategories().length > 1,
)
const showWorkspaceSwitcher = computed(
  () => runtime.settings.get<boolean>('launcher.enableWorkspaceSwitcher') !== false,
)
const defaultView = computed(
  () => runtime.settings.get<'grid' | 'list'>('launcher.defaultView', 'grid') ?? 'grid',
)

function close() {
  launcher.setOpen(false)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault()
    launcher.moveSelection(1)
    return
  }
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault()
    launcher.moveSelection(-1)
    return
  }
  if (event.key === 'Enter' && selectedApp.value) {
    event.preventDefault()
    void launcher.launchApp(selectedApp.value.id)
  }
}

watch(
  () => launcher.open,
  async (open) => {
    if (!open) return
    await nextTick()
    panelRef.value?.querySelector<HTMLInputElement>('input')?.focus()
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="launcher-overlay">
      <!-- biome-ignore lint/a11y/noStaticElementInteractions: <explanation> -->
      <div v-if="launcher.open" class="launcher-overlay" @keydown="handleKeydown">
        <button
          type="button"
          class="launcher-overlay__scrim"
          aria-label="Close app launcher"
          @click="close"
        />
        <section ref="panelRef" class="launcher-overlay__panel" role="dialog" aria-modal="true">
          <header class="launcher-overlay__header">
            <div class="launcher-overlay__title">
              <LayoutGrid class="size-5" />
              <div>
                <h2>Show Apps</h2>
                <p>{{ allApps.length }} launchable apps</p>
              </div>
            </div>
            <AlButton variant="ghost" size="icon" aria-label="Close app launcher" @click="close">
              <X class="size-4" />
            </AlButton>
          </header>

          <LauncherSearch :model-value="launcher.query" @update:model-value="launcher.setQuery" />

          <main class="launcher-overlay__content">
            <LauncherSection
              v-if="
                showWorkspaceSwitcher && launcher.getApps().length && launcher.workspace.workspaces.length
              "
              title="Workspaces"
            >
              <WorkspaceSwitcher />
            </LauncherSection>

            <LauncherSection
              v-if="!launcher.query && showPinnedApps"
              title="Pinned"
              :count="pinnedApps.length"
            >
              <LauncherAppGrid
                :apps="pinnedApps"
                :view="defaultView"
                :selected-app-id="selectedApp?.id"
                :pinned-ids="pinnedIds"
                @launch="launcher.launchApp"
                @pin="launcher.pinApp"
                @unpin="launcher.unpinApp"
              />
            </LauncherSection>

            <LauncherSection
              v-if="!launcher.query && showRecentApps"
              title="Recent"
              :count="recentApps.length"
            >
              <LauncherAppGrid
                :apps="recentApps"
                :view="defaultView"
                :selected-app-id="selectedApp?.id"
                :pinned-ids="pinnedIds"
                @launch="launcher.launchApp"
                @pin="launcher.pinApp"
                @unpin="launcher.unpinApp"
              />
            </LauncherSection>

            <LauncherSection
              v-if="results.length"
              :title="launcher.query ? 'Results' : 'All Apps'"
              :count="results.length"
            >
              <div v-if="!launcher.query && showCategories" class="launcher-overlay__categories">
                <AlBadge
                  v-for="category in launcher.getCategories()"
                  :key="category.name"
                  variant="outline"
                >
                  {{ category.name }}
                </AlBadge>
              </div>
              <LauncherAppGrid
                :apps="results"
                :view="defaultView"
                :selected-app-id="selectedApp?.id"
                :pinned-ids="pinnedIds"
                @launch="launcher.launchApp"
                @pin="launcher.pinApp"
                @unpin="launcher.unpinApp"
              />
            </LauncherSection>

            <div v-else class="launcher-overlay__empty">
              <LayoutGrid class="size-8" />
              <h3>No apps found</h3>
              <p>Installed and enabled extensions with app contributions will appear here.</p>
            </div>
          </main>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.launcher-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: clamp(1rem, 4vw, 3rem);
}

.launcher-overlay__scrim {
  position: absolute;
  inset: 0;
  border: 0;
  background: var(--background);
  backdrop-filter: blur(16px);
}

.launcher-overlay__panel {
  position: relative;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 1rem;
  width: min(72rem, 100%);
  height: min(48rem, calc(100vh - 2rem));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 1rem;
  background: hsl(var(--background) / 0.96);
  box-shadow: 0 30px 100px hsl(var(--foreground) / 0.2);
}

.launcher-overlay__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.launcher-overlay__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.launcher-overlay__title h2,
.launcher-overlay__empty h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0;
}

.launcher-overlay__title p,
.launcher-overlay__empty p {
  margin: 0.15rem 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 0.8rem;
}

.launcher-overlay__content {
  display: grid;
  align-content: start;
  gap: 1.25rem;
  min-height: 0;
  overflow: auto;
  padding-right: 0.25rem;
}

.launcher-overlay__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.launcher-overlay__empty {
  display: grid;
  min-height: 16rem;
  place-items: center;
  align-content: center;
  gap: 0.5rem;
  border: 1px dashed hsl(var(--border));
  border-radius: 8px;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.launcher-overlay-enter-active,
.launcher-overlay-leave-active {
  transition: opacity 120ms ease;
}

.launcher-overlay-enter-from,
.launcher-overlay-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .launcher-overlay {
    padding: 0.5rem;
  }

  .launcher-overlay__panel {
    height: calc(100vh - 1rem);
  }
}
</style>

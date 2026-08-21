<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { IconButton } from '@activelane/shadcn'
import { computed } from 'vue'
import type { WorkbenchApplicationContribution } from '../../core/workbench/contributions'
import { resolveLauncherIcon } from './iconResolver'

const Pin = getIcon('lucide:pin')
const PinOff = getIcon('lucide:pin-off')

defineOptions({ name: 'LauncherAppCard' })

const props = defineProps<{
  app: WorkbenchApplicationContribution
  active?: boolean
  pinned?: boolean
}>()

const emit = defineEmits<{
  launch: [appId: string]
  pin: [appId: string]
  unpin: [appId: string]
}>()

const icon = computed(() => resolveLauncherIcon(props.app.icon))
</script>

<template>
  <!-- biome-ignore lint/a11y/useSemanticElements: the composite launch target contains a separate pin button, so it cannot itself be a button. -->
  <div
    role="button"
    class="launcher-app-card"
    :class="{ 'launcher-app-card--active': active }"
    tabindex="0"
    @click="emit('launch', app.id)"
    @keydown.enter.prevent="emit('launch', app.id)"
  >
    <div class="launcher-app-card__icon">
      <component :is="icon" class="size-6" />
    </div>
    <div class="launcher-app-card__body">
      <h4>{{ app.name }}</h4>
      <p>{{ app.description || app.category || app.ownerExtensionId }}</p>
    </div>
    <IconButton
      class="launcher-app-card__pin"
      :label="pinned ? 'Unpin app' : 'Pin app'"
      :icon="pinned ? PinOff : Pin"
      size="icon-xs"
      variant="ghost"
      @click.stop="pinned ? emit('unpin', app.id) : emit('pin', app.id)"
    />
  </div>
</template>

<style scoped>
.launcher-app-card {
  position: relative;
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  min-height: 4.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 0.75rem;
  background: hsl(var(--card) / 0.72);
  color: hsl(var(--card-foreground));
  cursor: pointer;
  outline: none;
  transition:
    border-color 120ms ease,
    background 120ms ease,
    transform 120ms ease;
}

.launcher-app-card:hover,
.launcher-app-card:focus-visible,
.launcher-app-card--active {
  border-color: hsl(var(--primary) / 0.62);
  background: hsl(var(--accent) / 0.84);
}

.launcher-app-card--active {
  box-shadow: 0 0 0 1px hsl(var(--primary) / 0.22);
}

.launcher-app-card__icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 8px;
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
}

.launcher-app-card__body {
  min-width: 0;
}

.launcher-app-card__body h4 {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0;
}

.launcher-app-card__body p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0.2rem 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 0.78rem;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.launcher-app-card__pin {
  opacity: 0;
}

.launcher-app-card:hover .launcher-app-card__pin,
.launcher-app-card:focus-within .launcher-app-card__pin {
  opacity: 1;
}
</style>

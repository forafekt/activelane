<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
} from '@activelane/shadcn'

defineOptions({ name: 'WorkbenchBrowserToolbar' })

const Copy = getIcon('lucide.copy')
const ArrowLeft = getIcon('lucide.arrow-left')
const ArrowRight = getIcon('lucide.arrow-right')
const ExternalLink = getIcon('lucide.external-link')
const Home = getIcon('lucide.house')
const MoreHorizontal = getIcon('lucide.ellipsis')
const Plus = getIcon('lucide.plus')
const RotateCcw = getIcon('lucide.rotate-ccw')
const Trash2 = getIcon('lucide.trash-2')
const X = getIcon('lucide.x')

defineProps<{
  address: string
  canGoBack: boolean
  canGoForward: boolean
  loading: boolean
  progress: number
  error?: string | null
}>()

const emit = defineEmits<{
  'update:address': [value: string]
  navigate: []
  back: []
  forward: []
  reload: []
  stop: []
  home: []
  newTab: []
  external: []
  duplicate: []
  clearStorage: []
}>()
</script>

<template>
  <form class="browser-toolbar" @submit.prevent="emit('navigate')">
    <IconButton
      label="Back"
      :icon="ArrowLeft"
      size="icon-sm"
      variant="ghost"
      :disabled="!canGoBack"
      @click="emit('back')"
    />
    <IconButton
      label="Forward"
      :icon="ArrowRight"
      size="icon-sm"
      variant="ghost"
      :disabled="!canGoForward"
      @click="emit('forward')"
    />
    <IconButton
      label="Reload"
      :icon="loading ? X : RotateCcw"
      size="icon-sm"
      variant="ghost"
      @click="loading ? emit('stop') : emit('reload')"
    />
    <IconButton label="Home" :icon="Home" size="icon-sm" variant="ghost" @click="emit('home')" />
    <Input
      class="browser-toolbar__address"
      :model-value="address"
      placeholder="Search or enter URL"
      spellcheck="false"
      @update:model-value="emit('update:address', $event)"
    />
    <IconButton
      label="New browser tab"
      :icon="Plus"
      size="icon-sm"
      variant="ghost"
      @click="emit('newTab')"
    />
    <IconButton
      label="Open externally"
      :icon="ExternalLink"
      size="icon-sm"
      variant="ghost"
      @click="emit('external')"
    />
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon-sm" aria-label="Browser actions">
          <MoreHorizontal class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuItem @select="emit('duplicate')">
          <Copy class="mr-2 size-4" />
          Duplicate Tab
        </DropdownMenuItem>
        <DropdownMenuItem @select="emit('external')">
          <ExternalLink class="mr-2 size-4" />
          Open Externally
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @select="emit('clearStorage')">
          <Trash2 class="mr-2 size-4" />
          Clear Storage
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </form>
  <div v-if="loading" class="browser-toolbar__progress" aria-hidden="true">
    <div :style="{ transform: `scaleX(${Math.max(0.12, Math.min(progress || 0.35, 1))})` }" />
  </div>
  <p v-if="error" class="browser-toolbar__error">{{ error }}</p>
</template>

<style scoped>
.browser-toolbar {
  display: grid;
  grid-template-columns: auto auto auto auto minmax(8rem, 1fr) auto auto auto;
  align-items: center;
  gap: 0.25rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.36);
  padding: 0.25rem 0.5rem;
}

.browser-toolbar__progress {
  height: 0.125rem;
  overflow: hidden;
  background: hsl(var(--muted));
}

.browser-toolbar__progress > div {
  width: 100%;
  height: 100%;
  transform-origin: left center;
  background: hsl(var(--primary));
  transition: transform 160ms ease;
}

.browser-toolbar__address {
  height: 1.875rem;
  min-width: 0;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
}

.browser-toolbar__error {
  margin: 0;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--destructive) / 0.08);
  padding: 0.375rem 0.75rem;
  color: hsl(var(--destructive));
  font-size: 0.75rem;
}
</style>

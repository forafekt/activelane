<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'
import ScrollArea from '../overlays/ScrollArea.vue'
import { ContextMenu, ContextMenuTrigger } from '../ui/context-menu'
import IconButton from '../ui/IconButton.vue'

const X = getIcon('X')

defineOptions({ name: 'AlTabbedWorkspace' })

defineProps<{
  tabs: Array<{
    id: string
    title: string
    dirty?: boolean
    pinned?: boolean
    preview?: boolean
    closable?: boolean
  }>
  activeId?: string
  class?: string
}>()

const emit = defineEmits<{
  select: [id: string]
  close: [id: string]
  contextmenu: [id: string, event: MouseEvent]
}>()
</script>

<template>
  <section :class="cn('grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]', $props.class)">
    <nav
      data-tabbed-workspace="true"
      :data-tabbed-workspace-active-id="activeId"
      class="flex min-w-0 items-center gap-2 border-b bg-background"
    >
      <ScrollArea :data-tabbed-workspace-scroll-area="true" class="flex-1">
        <div class="flex min-w-0 flex-1 max-w-screen">
          <ContextMenu v-for="tab in tabs" :key="tab.id">
            <ContextMenuTrigger as-child>
              <div
                class="group flex h-10 max-w-72 shrink-0 items-center gap-1 border-r border-border/80 border-t-2 pr-1 last:border-r-0 data-[tab-active=true]:bg-muted/60 hover:border-t-primary/50 hover:bg-muted/60"
                :class="{ 'border-t-primary': tab.id === activeId }"
                :data-tab-active="tab.id === activeId"
                :data-tab-pinned="tab.pinned"
                :data-tab-preview="tab.preview"
                :data-tab-closable="tab.closable"
                :data-tab-id="tab.id"
                @contextmenu="emit('contextmenu', tab.id, $event)"
              >
                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center gap-2 rounded-none px-2.5 py-2 text-xs text-muted-foreground transition-colors data-[active=true]:text-foreground cursor-pointer"
                  :data-active="tab.id === activeId"
                  :title="tab.id"
                  @click="emit('select', tab.id)"
                >
                  <slot name="tab" :tab="tab" :active="tab.id === activeId">
                    <span
                      v-if="tab.dirty"
                      class="size-1.5 rounded-full bg-foreground"
                      aria-label="Unsaved changes"
                    />
                    <span class="truncate">{{ tab.title }}</span>
                  </slot>
                </button>
                <slot name="tab-action" :tab="tab" :active="tab.id === activeId">
                  <IconButton
                    v-if="tab.closable !== false"
                    label="Close tab"
                    size="icon-xs"
                    class="opacity-0 group-hover:opacity-100"
                    @click.stop="emit('close', tab.id)"
                  >
                    <X class="size-3" />
                  </IconButton>
                </slot>
              </div>
            </ContextMenuTrigger>
            <slot name="tab-context-menu" :tab="tab" :active="tab.id === activeId" />
          </ContextMenu>
        </div>
      </ScrollArea>

      <div v-if="$slots.actions" class="shrink-0" data-tabbed-workspace-actions="true">
        <slot name="actions" />
      </div>
    </nav>
    <ScrollArea
      class="flex-1"
      data-tabbed-workspace-content="true"
      :data-tabbed-workspace-active-id="activeId"
    >
      <slot />
    </ScrollArea>
  </section>
</template>

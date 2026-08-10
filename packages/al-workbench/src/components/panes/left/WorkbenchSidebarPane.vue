<script setup lang="ts">
import { SidebarContent, SidebarHeader } from '@activelane/shadcn'
import { computed, watchEffect } from 'vue'
import { WorkbenchExtensionBoundary } from '../../../components/render/surface'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'

defineOptions({ name: 'WorkbenchSidebarPane' })

const runtime = useWorkbenchRuntime()

const ChevronsUpDown = runtime.workbench.ui.getIcon('ChevronsUpDown')

const [
  AlEmptyState,
  AlIconButton,
  AlPanelHeader,
  AlScrollArea,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
] = runtime.workbench.ui.getComponents([
  'AlEmptyState',
  'AlIconButton',
  'AlPanelHeader',
  'ScrollArea',
  'Collapsible',
  'CollapsibleContent',
  'CollapsibleTrigger',
  'ContextMenu',
  'ContextMenuContent',
  'ContextMenuItem',
  'ContextMenuLabel',
  'ContextMenuSeparator',
  'ContextMenuTrigger',
  'DropdownMenu',
  'DropdownMenuContent',
  'DropdownMenuItem',
  'DropdownMenuLabel',
  'DropdownMenuSeparator',
  'DropdownMenuTrigger',
  'Sidebar',
  'SidebarGroup',
  'SidebarGroupContent',
  'SidebarGroupLabel',
  'SidebarMenu',
  'SidebarMenuButton',
  'SidebarMenuItem',
])

const activeView = computed(() => {
  const activeActivityId = runtime.workbench.state.activeActivityId
  const current = runtime.registry.sidebarViews.find(
    (item) =>
      item.id === runtime.workbench.state.activeSidebarViewId &&
      item.activityId === activeActivityId,
  )
  if (current) return current
  const fallback = runtime.registry.sidebarViews.find(
    (item) => item.activityId === activeActivityId,
  )
  return fallback ?? null
})

const activityViews = computed(() =>
  runtime.registry.sidebarViews.filter(
    (item) => item.activityId === runtime.workbench.state.activeActivityId,
  ),
)

const activeRecord = computed(() =>
  activeView.value?.ownerExtensionId
    ? runtime.extensions.getRecord(activeView.value.ownerExtensionId)
    : undefined,
)

const nextSidebarViewId = computed(() => {
  if (!activeView.value || activityViews.value.length < 2) return null
  const currentIndex = activityViews.value.findIndex((view) => view.id === activeView.value?.id)
  return (
    activityViews.value[(currentIndex + 1) % activityViews.value.length]?.id ?? activeView.value.id
  )
})

watchEffect(() => {
  if (!runtime.workbench.state.activeActivityId && runtime.registry.activityRail[0]) {
    runtime.workbench.setActiveActivity(runtime.registry.activityRail[0].id)
  }
  if (!runtime.workbench.state.activeSidebarViewId && activityViews.value[0]) {
    runtime.workbench.setActiveSidebarView(activityViews.value[0].id)
  } else if (
    runtime.workbench.state.activeSidebarViewId &&
    activeView.value &&
    runtime.workbench.state.activeSidebarViewId !== activeView.value.id
  ) {
    runtime.workbench.setActiveSidebarView(activeView.value.id)
  }
})
</script>

<template>
  <Sidebar v-if="activeView" collapsible="none" class="wb-sidebar-pane static flex h-full">
    <SidebarHeader class="wb-sidebar-pane__header p-0">
      <AlPanelHeader
        :title="activeView.title"
        :description="runtime.workbench.state.activeActivityId ?? undefined"
        class="border-0"
      >
        <template #actions>
          <DropdownMenu v-if="activityViews.length > 1">
            <DropdownMenuTrigger as-child>
              <AlIconButton
                label="Switch sidebar view"
                :icon="ChevronsUpDown"
                variant="ghost"
                size="icon-sm"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel>Sidebar views</DropdownMenuLabel>
              <DropdownMenuItem
                v-for="view in activityViews"
                :key="view.id"
                @select="runtime.workbench.setActiveSidebarView(view.id)"
              >
                {{ view.title }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                @select="runtime.workbench.setActiveSidebarView(nextSidebarViewId ?? activeView.id)"
              >
                Next view
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlIconButton
            v-for="action in activeView.actions ?? []"
            :key="action.id"
            :label="action.title"
            :icon="action.icon"
            variant="ghost"
            size="icon-sm"
            @click="runtime.commands.execute(action.commandId)"
          />
        </template>
      </AlPanelHeader>
    </SidebarHeader>

    <SidebarContent class="wb-sidebar-pane__content">
      <AlScrollArea class="flex-1">
        <SidebarGroup v-if="activityViews.length > 1" class="wb-sidebar-pane__view-group">
          <Collapsible default-open>
            <SidebarGroupLabel as-child>
              <CollapsibleTrigger class="wb-sidebar-pane__view-trigger"> Views </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="view in activityViews" :key="view.id">
                    <ContextMenu>
                      <ContextMenuTrigger as-child>
                        <SidebarMenuButton
                          :is-active="runtime.workbench.state.activeSidebarViewId === view.id"
                          @click="runtime.workbench.setActiveSidebarView(view.id)"
                        >
                          <span>{{ view.title }}</span>
                        </SidebarMenuButton>
                      </ContextMenuTrigger>
                      <ContextMenuContent class="w-48">
                        <ContextMenuLabel>{{ view.title }}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem @select="runtime.workbench.setActiveSidebarView(view.id)">
                          Focus view
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <div class="min-h-0 min-w-0">
          <WorkbenchExtensionBoundary
            :component="activeView.component"
            :extension-id="activeView.ownerExtensionId"
            :extension-name="activeRecord?.manifest.displayName"
            :contribution-id="activeView.id"
            surface="sidebar"
            :pass-through="{ runtime }"
          />
        </div>

        <footer v-if="activeView.footerComponent" class="border-t border-border p-3">
          <WorkbenchExtensionBoundary
            :component="activeView.footerComponent"
            :extension-id="activeView.ownerExtensionId"
            :extension-name="activeRecord?.manifest.displayName"
            :contribution-id="`${activeView.id}:footer`"
            surface="sidebar"
            :pass-through="{ runtime }"
          />
        </footer>
      </AlScrollArea>
    </SidebarContent>
  </Sidebar>

  <AlEmptyState
    v-else
    class="m-0 h-full rounded-none border-0"
    title="No sidebar views"
    description="Register an activity and a matching sidebar contribution to populate this pane."
  />
</template>

<style scoped>
.wb-sidebar-pane {
  background: var(--pane-surface);
}

.wb-sidebar-pane__header {
  border-bottom: 1px solid var(--border);
  background: var(--toolbar-surface);
  backdrop-filter: blur(14px) saturate(1.06);
}

.wb-sidebar-pane__content {
  background: transparent;
}

.wb-sidebar-pane__view-group {
  border-bottom: 1px solid var(--border);
}

.wb-sidebar-pane__view-trigger {
  display: flex;
  width: 100%;
  height: 2rem;
  align-items: center;
  border-radius: 6px;
  padding: 0 0.5rem;
  color: color-mix(in srgb, var(--text-muted) 92%, transparent);
  font-size: 0.75rem;
  font-weight: 500;
}

.wb-sidebar-pane__view-trigger:hover {
  background: var(--hover);
  color: var(--text-primary);
}
</style>

<script setup lang="ts">
import { SidebarContent, SidebarHeader } from '@activelane/shadcn'
import { computed, watchEffect } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import IsolatedViewHost from '../../../views/IsolatedViewHost.vue'
import WorkbenchExtensionBoundary from '../WorkbenchExtensionBoundary.vue'

defineOptions({ name: 'WorkbenchSidebar' })

const runtime = useWorkbenchRuntime()

const ChevronsUpDown = runtime.workbench.ui.getIcon('lucide:chevrons-up-down')

const [
  EmptyState,
  IconButton,
  PanelHeader,
  ScrollArea,
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
  'EmptyState',
  'IconButton',
  'PanelHeader',
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
const activeIsolatedView = computed(() => {
  const containerId =
    runtime.workbench.state.activeSidebarViewId ?? runtime.workbench.state.activeActivityId
  const container = runtime.registry.containers.find(
    (item) => item.id === containerId && item.location === 'primary-sidebar',
  )
  return container
    ? (runtime.registry.views.find(
        (item) => item.container === container.id && item.renderer.type === 'isolated',
      ) ?? null)
    : null
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
  <Sidebar v-if="activeIsolatedView" collapsible="none" class="wb-sidebar-pane static flex h-full">
    <SidebarHeader class="wb-sidebar-pane__header p-0">
      <PanelHeader :title="activeIsolatedView.title" class="border-0" />
    </SidebarHeader>
    <SidebarContent class="wb-sidebar-pane__content min-h-0">
      <IsolatedViewHost
        :definition="activeIsolatedView"
        :instance-id="activeIsolatedView.id"
        class="h-full min-h-0"
      />
    </SidebarContent>
  </Sidebar>

  <Sidebar v-else-if="activeView" collapsible="none" class="wb-sidebar-pane static flex h-full">
    <SidebarHeader class="wb-sidebar-pane__header p-0">
      <PanelHeader :title="activeView.title" class="border-0">
        <template #actions>
          <DropdownMenu v-if="activityViews.length > 1">
            <DropdownMenuTrigger as-child>
              <IconButton
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
          <IconButton
            v-for="action in activeView.actions ?? []"
            :key="action.id"
            :label="action.title"
            :icon="typeof action.icon === 'string' ? runtime.workbench.ui.getIcon(action.icon) : action.icon"
            variant="ghost"
            size="icon-sm"
            @click="runtime.commands.execute(action.commandId)"
          />
        </template>
      </PanelHeader>
    </SidebarHeader>

    <SidebarContent class="wb-sidebar-pane__content">
      <ScrollArea class="flex-1">
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

        <footer v-if="activeView.footerComponent" class="border-t border-border p-2">
          <WorkbenchExtensionBoundary
            :component="activeView.footerComponent"
            :extension-id="activeView.ownerExtensionId"
            :extension-name="activeRecord?.manifest.displayName"
            :contribution-id="`${activeView.id}:footer`"
            surface="sidebar"
            :pass-through="{ runtime }"
          />
        </footer>
      </ScrollArea>
    </SidebarContent>
  </Sidebar>

  <EmptyState
    v-else
    class="m-0 h-full rounded-none border-0"
    title="No sidebar views"
    description="Register an activity and a matching sidebar contribution to populate this pane."
  />
</template>

<script setup lang="ts">
import type {
  WorkbenchTabIndicator as Indicator,
  WorkbenchTabGroupNode,
  WorkbenchTabRailGroup,
} from '@activelane/workbench-api'
import { computed, nextTick, ref } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import { tabColorClass } from './tabPresentation'
import { useWorkbenchTabInteractions } from './useWorkbenchTabInteractions'
import WorkbenchTabIndicator from './WorkbenchTabIndicator.vue'

defineOptions({ name: 'WorkbenchTabGroupHeader' })

const props = defineProps<{
  group: WorkbenchTabGroupNode
  tabGroup: WorkbenchTabRailGroup
  draggingId?: string | null
  draggingGroupId?: string | null
}>()

const emit = defineEmits<{
  dropTab: [tabGroupId: string]
  dragstartGroup: [tabGroupId: string]
  dropGroup: [tabGroupId: string]
  dragendGroup: []
}>()

const runtime = useWorkbenchRuntime()
const interactions = useWorkbenchTabInteractions()
const editingInline = ref(false)
const inlineName = ref('')
const inlineInput = ref<HTMLInputElement | null>(null)

const [ChevronDown, ChevronRight, Lock, Shield] = runtime.workbench.ui.getIcons([
  'ChevronDown',
  'ChevronRight',
  'Lock',
  'Shield',
])
const [
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
] = runtime.workbench.ui.getComponents([
  'ContextMenu',
  'ContextMenuContent',
  'ContextMenuItem',
  'ContextMenuLabel',
  'ContextMenuSeparator',
  'ContextMenuTrigger',
])

const groupedTabs = computed(() =>
  props.group.tabs.filter((tab) => tab.tabGroupId === props.tabGroup.id),
)
const aggregatedIndicators = computed(() => {
  const map = new Map<string, { indicator: Indicator; count: number }>()
  for (const indicator of props.tabGroup.indicators ?? []) {
    map.set(indicator.id, { indicator, count: Number(indicator.count ?? 0) || 0 })
  }
  for (const tab of groupedTabs.value) {
    for (const indicator of tab.indicators ?? []) {
      const current = map.get(indicator.id)
      if (current) current.count += Number(indicator.count ?? 1) || 1
      else map.set(indicator.id, { indicator, count: Number(indicator.count ?? 1) || 1 })
    }
  }
  return Array.from(map.values())
    .slice(0, 3)
    .map(({ indicator, count }) => ({
      ...indicator,
      count: indicator.count ?? (count > 1 ? count : undefined),
    }))
})
const dynamicActions = computed(() =>
  runtime.workbench.tabs.getTabGroupActions(props.tabGroup, props.group.id).filter((action) => {
    if (typeof action.visible === 'function') {
      return action.visible({
        runtime,
        host: runtime.host,
        workbench: runtime.workbench,
        tabGroup: props.tabGroup,
        groupId: props.group.id,
        tabs: groupedTabs.value,
      })
    }
    return action.visible !== false
  }),
)

async function startInlineRename() {
  if (props.tabGroup.locked) {
    interactions.notify(
      'Group is locked',
      `Unlock "${props.tabGroup.name}" before renaming it.`,
      'warning',
    )
    return
  }
  if (!(await interactions.requestUnlockGroup(props.tabGroup.id, 'rename it'))) return
  inlineName.value = props.tabGroup.name
  editingInline.value = true
  await nextTick()
  inlineInput.value?.focus()
  inlineInput.value?.select()
}

function saveInlineRename() {
  const name = inlineName.value.trim()
  if (!name) {
    interactions.notify('Group name is required', 'Enter a name before saving.', 'warning')
    return
  }
  runtime.workbench.renameTabGroup(props.tabGroup.id, name, props.group.id)
  void runtime.workbench.persist()
  editingInline.value = false
}

function cancelInlineRename() {
  editingInline.value = false
  inlineName.value = ''
}

function runGroupAction(
  action: string,
  callback: () => void | Promise<void>,
  requireEditable = false,
) {
  void interactions.runProtectedGroupAction(props.tabGroup.id, action, callback, {
    requireEditable,
  })
}

function toggleCollapsed() {
  runGroupAction('collapse or expand it', () =>
    runtime.workbench.setTabGroupCollapsed(
      props.tabGroup.id,
      !props.tabGroup.collapsed,
      props.group.id,
    ),
  )
}

function toggleLocked() {
  runGroupAction('change its lock', () =>
    runtime.workbench.setTabGroupLocked(props.tabGroup.id, !props.tabGroup.locked, props.group.id),
  )
}

function ungroupTabs() {
  runGroupAction(
    'ungroup it',
    () => runtime.workbench.ungroupTabs(props.tabGroup.id, props.group.id),
    true,
  )
}

function closeGroup() {
  runGroupAction(
    'close it',
    () => runtime.workbench.closeTabGroup(props.tabGroup.id, props.group.id),
    true,
  )
}

function closeOtherGroups() {
  runGroupAction('close other groups', () =>
    runtime.workbench.closeOtherTabGroups(props.tabGroup.id, props.group.id),
  )
}

function hibernateGroup() {
  runGroupAction(
    'hibernate it',
    () => {
      const count = runtime.workbench.tabs.hibernateGroup(props.tabGroup.id, props.group.id)
      interactions.notify('Group hibernated', `${count} tab${count === 1 ? '' : 's'} suspended.`)
    },
    true,
  )
}

async function shareGroup() {
  const set = runtime.workbench.tabs.sharing.createFromWorkspace(
    `Shared Group: ${props.tabGroup.name}`,
  )
  if (set.workspace.layout.kind === 'group') {
    set.workspace.layout.tabs = set.workspace.layout.tabs.filter(
      (tab) => tab.tabGroupId === props.tabGroup.id,
    )
    set.workspace.layout.tabGroups = set.workspace.layout.tabGroups.filter(
      (group) => group.id === props.tabGroup.id,
    )
  }
  const json = runtime.workbench.tabs.sharing.exportJson(set)
  await (runtime.host.capabilities.clipboard?.writeText?.(json) ??
    navigator.clipboard?.writeText(json))
  interactions.notify('Shared group copied', `${json.length} bytes copied to clipboard.`)
}

function runDynamicAction(actionId: string) {
  void runtime.workbench.tabs.runTabGroupAction(actionId, props.tabGroup.id, props.group.id)
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <div
        role="button"
        tabindex="0"
        class="wb-tab-group-header"
        :class="{
          'wb-tab-group-header--drop': draggingId,
          [tabColorClass(tabGroup.color)]: true,
        }"
        :aria-expanded="!tabGroup.collapsed"
        draggable="true"
        @click="editingInline ? undefined : toggleCollapsed()"
        @dblclick.stop="startInlineRename"
        @keydown.enter.prevent="editingInline ? undefined : toggleCollapsed()"
        @keydown.space.prevent="editingInline ? undefined : toggleCollapsed()"
        @dragstart="tabGroup.locked ? $event.preventDefault() : emit('dragstartGroup', tabGroup.id)"
        @dragover.prevent
        @drop.prevent="draggingGroupId ? emit('dropGroup', tabGroup.id) : emit('dropTab', tabGroup.id)"
        @dragend="emit('dragendGroup')"
      >
        <ChevronRight v-if="tabGroup.collapsed" class="size-3.5" />
        <ChevronDown v-else class="size-3.5" />
        <input
          v-if="editingInline"
          ref="inlineInput"
          v-model="inlineName"
          class="wb-tab-group-header__input"
          aria-label="Group name"
          @click.stop
          @keydown.enter.prevent="saveInlineRename"
          @keydown.escape.prevent="cancelInlineRename"
          @blur="saveInlineRename"
        >
        <span v-else class="wb-tab-group-header__name">{{ tabGroup.name }}</span>
        <span class="wb-tab-group-header__count">{{ groupedTabs.length }}</span>
        <span v-if="aggregatedIndicators.length" class="wb-tab-group-header__indicators">
          <WorkbenchTabIndicator
            v-for="indicator in aggregatedIndicators"
            :key="indicator.id"
            :indicator="indicator"
          />
        </span>
        <Lock v-if="tabGroup.locked" class="size-3.5" />
        <Shield v-if="tabGroup.protection" class="size-3.5" />
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent class="w-64">
      <ContextMenuLabel>{{ tabGroup.name }}</ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem @select="interactions.requestRenameTabGroup(tabGroup.id)">
        Rename Group...
      </ContextMenuItem>
      <ContextMenuItem @select="startInlineRename">Rename Inline</ContextMenuItem>
      <ContextMenuItem @select="toggleCollapsed">
        {{ tabGroup.collapsed ? 'Expand Group' : 'Collapse Group' }}
      </ContextMenuItem>
      <ContextMenuItem @select="toggleLocked">
        {{ tabGroup.locked ? 'Unlock Group' : 'Lock Group' }}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        v-if="!tabGroup.protection"
        @select="interactions.requestProtectGroup(tabGroup.id)"
      >
        Set Protection
      </ContextMenuItem>
      <template v-else>
        <ContextMenuItem @select="interactions.requestUnlockGroup(tabGroup.id, 'use it')">
          Unlock
        </ContextMenuItem>
        <ContextMenuItem @select="interactions.requestProtectGroup(tabGroup.id, 'change')">
          Change PIN/password
        </ContextMenuItem>
        <ContextMenuItem @select="interactions.requestProtectGroup(tabGroup.id, 'remove')">
          Remove Protection
        </ContextMenuItem>
        <ContextMenuItem @select="interactions.requestProtectGroup(tabGroup.id, 'reset')">
          Forgot/Reset Protection
        </ContextMenuItem>
      </template>
      <ContextMenuSeparator />
      <ContextMenuItem @select="interactions.requestSetGroupColor(tabGroup.id)">
        Change Group Color...
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem :disabled="tabGroup.locked" @select="hibernateGroup">
        Hibernate Group
      </ContextMenuItem>
      <ContextMenuItem @select="shareGroup"> Share Group </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem :disabled="tabGroup.locked" @select="ungroupTabs"> Ungroup </ContextMenuItem>
      <ContextMenuItem :disabled="tabGroup.locked" @select="closeGroup">
        Close Group
      </ContextMenuItem>
      <ContextMenuItem @select="closeOtherGroups"> Close Other Groups </ContextMenuItem>
      <ContextMenuSeparator v-if="dynamicActions.length" />
      <ContextMenuItem
        v-for="action in dynamicActions"
        :key="action.id"
        :disabled="typeof action.enabled === 'function'
          ? !action.enabled({ runtime, host: runtime.host, workbench: runtime.workbench, tabGroup, groupId: group.id, tabs: groupedTabs })
          : action.enabled === false"
        @select="runDynamicAction(action.id)"
      >
        {{ action.title }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<style scoped>
.wb-tab-group-header {
  display: inline-flex;
  min-width: 6.5rem;
  max-width: 12rem;
  min-height: 2rem;
  align-items: center;
  gap: 0.3125rem;
  border: 0;
  border-right: 1px solid var(--border);
  border-left: 3px solid transparent;
  background: color-mix(in srgb, var(--panel) 88%, var(--hover));
  padding: 0 0.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

.wb-tab-group-header:hover,
.wb-tab-group-header--drop {
  background: var(--hover);
  color: var(--text-primary);
}

.wb-tab-group-header__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 650;
  font-size: 0.75rem;
}

.wb-tab-group-header__input {
  width: min(8rem, 100%);
  min-width: 4rem;
  height: 1.35rem;
  border: 1px solid var(--focus-ring);
  border-radius: 0.25rem;
  background: var(--background);
  padding: 0 0.35rem;
  color: var(--text-primary);
  font-size: 0.75rem;
  outline: none;
}

.wb-tab-group-header__count {
  display: inline-flex;
  min-width: 1.25rem;
  height: 1.125rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--foreground) 8%, transparent);
  padding: 0 0.3125rem;
  font-size: 0.6875rem;
}

.wb-tab-group-header__indicators {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
}

.wb-tab-color--blue {
  border-left-color: color-mix(in srgb, var(--focus-ring) 82%, transparent);
}

.wb-tab-color--green {
  border-left-color: color-mix(in srgb, var(--success) 82%, transparent);
}

.wb-tab-color--amber {
  border-left-color: color-mix(in srgb, var(--warning) 82%, transparent);
}

.wb-tab-color--rose {
  border-left-color: color-mix(in srgb, var(--destructive) 72%, transparent);
}

.wb-tab-color--violet {
  border-left-color: color-mix(in srgb, var(--accent) 82%, var(--focus-ring));
}

.wb-tab-color--slate {
  border-left-color: color-mix(in srgb, var(--text-muted) 70%, transparent);
}
</style>

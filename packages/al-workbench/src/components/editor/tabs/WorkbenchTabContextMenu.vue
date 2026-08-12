<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchMenus } from '../../../composables/useWorkbenchMenus'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { WorkbenchTab } from '../../../core/workbench/contributions'
import type { WorkbenchTabGroupNode } from '../../../core/workbench/shell'
import { createTabContext } from '../../../runtime/menus/menuRegistry'

import { useWorkbenchTabInteractions } from './useWorkbenchTabInteractions'

defineOptions({ name: 'WorkbenchTabContextMenu' })

const props = defineProps<{
  tab: WorkbenchTab
  group: WorkbenchTabGroupNode
}>()

const runtime = useWorkbenchRuntime()
const interactions = useWorkbenchTabInteractions()

const [
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
] = runtime.workbench.ui.getComponents([
  'ContextMenuContent',
  'ContextMenuItem',
  'ContextMenuLabel',
  'ContextMenuSeparator',
  'ContextMenuShortcut',
])

const menus = useWorkbenchMenus()

const index = computed(() => props.group.tabs.findIndex((item) => item.id === props.tab.id))
const extensionActions = computed(() =>
  menus.tabContextMenu(createTabContext(props.tab, props.group.id)),
)
const dynamicActions = computed(() =>
  runtime.workbench.tabs.getTabActions(props.tab, props.group.id).filter((action) => {
    if (typeof action.visible === 'function') {
      return action.visible({
        runtime,
        host: runtime.host,
        workbench: runtime.workbench,
        tab: props.tab,
        groupId: props.group.id,
      })
    }
    return action.visible !== false
  }),
)
const tabGroup = computed(() => interactions.tabGroupForTab(props.tab) ?? null)
const otherTabGroups = computed(() =>
  props.group.tabGroups.filter((item) => item.id !== props.tab.tabGroupId),
)

function execute(commandId: string | undefined) {
  if (!commandId) return
  void runtime.commands.execute(commandId)
}

function copyTabReference() {
  const value = props.tab.input?.url ?? props.tab.input?.path ?? props.tab.surfaceId ?? props.tab.id
  void (
    runtime.host.capabilities.clipboard?.writeText?.(String(value)) ??
    navigator.clipboard?.writeText(String(value))
  )
}

function runTabAction(
  action: string,
  callback: () => void | Promise<void>,
  requireEditable = false,
) {
  void interactions.runProtectedTabAction(props.tab, action, callback, { requireEditable })
}

function persistPreviewTab() {
  runtime.workbench.persistPreviewTab(props.tab.id, props.group.id)
  void runtime.workbench.persist()
}

function setPinned(pinned: boolean) {
  runTabAction('change its pinned state', () =>
    runtime.workbench.setTabPinned(props.tab.id, pinned, props.group.id),
  )
}

function toggleLocked() {
  runTabAction('change its lock', () =>
    runtime.workbench.setTabLocked(props.tab.id, !props.tab.locked, props.group.id),
  )
}

function revealTab() {
  runTabAction('open it', () => runtime.workbench.activateTab(props.tab.id, props.group.id))
}

function duplicateTab() {
  runTabAction(
    'duplicate it',
    () => {
      runtime.workbench.duplicateTab(props.tab.id, props.group.id)
    },
    true,
  )
}

function removeFromGroup() {
  runTabAction(
    'remove it from its group',
    () => {
      runtime.workbench.moveTabToTabGroup(props.tab.id, null, props.group.id)
    },
    true,
  )
}

function moveToGroup(tabGroupId: string) {
  runTabAction(
    'move it',
    async () => {
      const targetGroup = interactions.groupById(tabGroupId)
      if (targetGroup?.locked) {
        interactions.notify(
          'Group is locked',
          `Unlock "${targetGroup.name}" before moving tabs into it.`,
          'warning',
        )
        return
      }
      if (!(await interactions.requestUnlockGroup(tabGroupId, 'move tabs into it'))) return
      void runtime.workbench.moveTabToTabGroup(props.tab.id, tabGroupId, props.group.id)
    },
    true,
  )
}

function closeTab() {
  if (props.tab.closable === false) {
    interactions.notify('Tab cannot be closed', `"${props.tab.title}" is not closable.`, 'warning')
    return
  }
  runTabAction('close it', () => runtime.workbench.closeTab(props.tab.id, props.group.id), true)
}

function closeTabs(tabs: WorkbenchTab[], label = 'tabs') {
  const closable = tabs.filter(
    (tab) => !interactions.isCloseBlocked(tab) && !interactions.isProtectionLocked(tab),
  )
  const skipped = tabs.length - closable.length
  if (closable.length) {
    runtime.workbench.closeTabs(
      closable.map((tab) => tab.id),
      props.group.id,
    )
    void runtime.workbench.persist()
  }
  if (skipped) {
    interactions.notify(
      'Some tabs were kept open',
      `${skipped} locked or protected ${label} ${skipped === 1 ? 'was' : 'were'} skipped.`,
      'warning',
    )
  }
}

function hibernateTab() {
  runTabAction(
    'hibernate it',
    () => {
      const ok = runtime.workbench.tabs.hibernateTab(props.tab.id, props.group.id)
      if (!ok) {
        interactions.notify(
          'Tab was not hibernated',
          'Dirty, locked, or protected tabs stay awake.',
          'warning',
        )
      }
    },
    true,
  )
}

function wakeTab() {
  runtime.workbench.tabs.wakeTab(props.tab.id, props.group.id)
  runtime.workbench.activateTab(props.tab.id, props.group.id)
  void runtime.workbench.persist()
}

function hibernateOthers() {
  const count = runtime.workbench.tabs.hibernateOtherTabs(props.tab.id, props.group.id)
  interactions.notify('Tabs hibernated', `${count} tab${count === 1 ? '' : 's'} suspended.`)
  void runtime.workbench.persist()
}

async function shareTab() {
  const set = runtime.workbench.tabs.sharing.createFromWorkspace(`Shared Tab: ${props.tab.title}`)
  if (set.workspace.layout.kind === 'group') {
    set.workspace.layout.tabs = set.workspace.layout.tabs.filter((tab) => tab.id === props.tab.id)
    set.workspace.layout.tabGroups = set.workspace.layout.tabGroups.filter(
      (group) =>
        set.workspace.layout.kind === 'group' &&
        set.workspace.layout.tabs.some((tab) => tab.tabGroupId === group.id),
    )
  }
  const json = runtime.workbench.tabs.sharing.exportJson(set)
  await (runtime.host.capabilities.clipboard?.writeText?.(json) ??
    navigator.clipboard?.writeText(json))
  interactions.notify('Shared tab copied', `${json.length} bytes copied to clipboard.`)
}

function runDynamicAction(actionId: string) {
  void runtime.workbench.tabs.runTabAction(actionId, props.tab.id, props.group.id)
}
</script>

<template>
  <ContextMenuContent class="w-64">
    <ContextMenuLabel>{{ tab.title }}</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuItem v-if="tab.preview" @select="persistPreviewTab"> Keep Open </ContextMenuItem>
    <ContextMenuItem @select="interactions.requestRenameTab(tab.id)">Rename Tab</ContextMenuItem>
    <ContextMenuItem v-if="!tab.pinned" @select="setPinned(true)"> Pin </ContextMenuItem>
    <ContextMenuItem v-else @select="setPinned(false)"> Unpin </ContextMenuItem>
    <ContextMenuItem @select="toggleLocked">
      {{ tab.locked ? 'Unlock Tab' : 'Lock Tab' }}
    </ContextMenuItem>
    <ContextMenuItem @select="duplicateTab">Duplicate Tab</ContextMenuItem>
    <ContextMenuItem @select="copyTabReference">Copy Tab Link/Path/ID</ContextMenuItem>
    <ContextMenuItem @select="shareTab">Share Tab</ContextMenuItem>
    <ContextMenuItem
      :disabled="runtime.workbench.state.activeSidebarViewId == null"
      @select="revealTab"
    >
      Reveal
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem v-if="tab.hibernation?.hibernated" @select="wakeTab">Wake Tab</ContextMenuItem>
    <ContextMenuItem v-else :disabled="tab.dirty || tab.locked" @select="hibernateTab">
      Hibernate Tab
    </ContextMenuItem>
    <ContextMenuItem
      :disabled="!group.tabs.some((item) => item.id !== tab.id)"
      @select="hibernateOthers"
    >
      Hibernate Other Tabs
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem v-if="!tabGroup" @select="interactions.requestNewGroupFromTab(tab.id)">
      New Group from Tab
    </ContextMenuItem>
    <ContextMenuItem v-if="tabGroup" @select="removeFromGroup"> Remove from Group </ContextMenuItem>
    <ContextMenuItem
      v-for="targetGroup in otherTabGroups"
      :key="targetGroup.id"
      @select="moveToGroup(targetGroup.id)"
    >
      Add Tab to Group: {{ targetGroup.name }}
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem @select="interactions.requestSetTabColor(tab.id)">
      Change Tab Color...
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem v-if="!tab.protection" @select="interactions.requestProtectTab(tab.id)">
      Set Protection
    </ContextMenuItem>
    <template v-else>
      <ContextMenuItem @select="interactions.requestUnlockTab(tab.id, 'use it')">
        Unlock
      </ContextMenuItem>
      <ContextMenuItem @select="interactions.requestProtectTab(tab.id, 'change')">
        Change PIN/password
      </ContextMenuItem>
      <ContextMenuItem @select="interactions.requestProtectTab(tab.id, 'remove')">
        Remove Protection
      </ContextMenuItem>
      <ContextMenuItem @select="interactions.requestProtectTab(tab.id, 'reset')">
        Forgot/Reset Protection
      </ContextMenuItem>
    </template>
    <ContextMenuSeparator />
    <ContextMenuItem
      :disabled="tab.closable === false || interactions.isCloseBlocked(tab) || interactions.isProtectionLocked(tab)"
      @select="closeTab"
    >
      Close
      <ContextMenuShortcut>Mod+W</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem
      :disabled="!group.tabs.some((item) => item.id !== tab.id && item.closable !== false)"
      @select="closeTabs(group.tabs.filter((item) => item.id !== tab.id), 'tab')"
    >
      Close Others
    </ContextMenuItem>
    <ContextMenuItem
      :disabled="index < 0 || index >= group.tabs.length - 1"
      @select="closeTabs(group.tabs.slice(index + 1), 'tab')"
    >
      Close to the Right
    </ContextMenuItem>
    <ContextMenuItem :disabled="index <= 0" @select="closeTabs(group.tabs.slice(0, index), 'tab')">
      Close to the Left
    </ContextMenuItem>
    <ContextMenuItem
      :disabled="!group.tabs.some((item) => !item.pinned && item.closable !== false)"
      @select="closeTabs(group.tabs.filter((item) => !item.pinned), 'tab')"
    >
      Close Unpinned
    </ContextMenuItem>
    <ContextMenuItem
      :disabled="!group.tabs.some((item) => item.preview && item.closable !== false)"
      @select="closeTabs(group.tabs.filter((item) => item.preview), 'tab')"
    >
      Close Preview Tab
    </ContextMenuItem>
    <ContextMenuItem
      class="text-destructive/20"
      :disabled="!group.tabs.some((item) => item.closable !== false)"
      @select="closeTabs(group.tabs, 'tab')"
    >
      Close All
    </ContextMenuItem>
    <ContextMenuSeparator v-if="extensionActions.length" />
    <template v-for="action in extensionActions" :key="action.id">
      <ContextMenuSeparator v-if="action.kind === 'separator'" />
      <ContextMenuItem v-else-if="action.commandId" @select="execute(action.commandId)">
        {{ action.title }}
      </ContextMenuItem>
    </template>
    <ContextMenuSeparator v-if="dynamicActions.length" />
    <ContextMenuItem
      v-for="action in dynamicActions"
      :key="action.id"
      :disabled="typeof action.enabled === 'function'
        ? !action.enabled({ runtime, host: runtime.host, workbench: runtime.workbench, tab, groupId: group.id })
        : action.enabled === false"
      @select="runDynamicAction(action.id)"
    >
      {{ action.title }}
    </ContextMenuItem>
  </ContextMenuContent>
</template>

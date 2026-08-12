import type { Ref } from 'vue'
import { computed, inject, provide, reactive, ref } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import {
  createProtectionMetadata,
  verifyProtectionSecret,
} from '../../../core/runtime/workbenchStore/protection'
import type {
  WorkbenchTab,
  WorkbenchTabColorId,
  WorkbenchTabProtectionMetadata,
} from '../../../core/workbench/contributions'
import type { WorkbenchTabGroupNode, WorkbenchTabRailGroup } from '../../../core/workbench/shell'

type TabTarget = { kind: 'tab'; id: string }
type GroupTarget = { kind: 'group'; id: string }
type NewGroupTarget = { kind: 'new-group-from-tab'; id: string }
type ProtectionMode = 'set' | 'change' | 'remove' | 'reset'

export interface RenameDialogState {
  open: boolean
  target: TabTarget | GroupTarget | NewGroupTarget | null
  title: string
  description: string
  value: string
  error: string
}

export interface ColorDialogState {
  open: boolean
  target: TabTarget | GroupTarget | null
  title: string
  selected: WorkbenchTabColorId
}

export interface ProtectionDialogState {
  open: boolean
  mode: ProtectionMode
  target: TabTarget | GroupTarget | null
  title: string
  description: string
  password: string
  confirmation: string
  hint: string
  showPassword: boolean
  error: string
}

export interface UnlockDialogState {
  open: boolean
  target: TabTarget | GroupTarget | null
  title: string
  description: string
  hint: string
  password: string
  showPassword: boolean
  error: string
}

export interface WorkbenchTabInteractions {
  group: WorkbenchTabGroupNode
  rename: RenameDialogState
  color: ColorDialogState
  protection: ProtectionDialogState
  unlock: UnlockDialogState
  tabGroups: Ref<WorkbenchTabRailGroup[]>
  tabById: (tabId: string) => WorkbenchTab | undefined
  groupById: (groupId: string) => WorkbenchTabRailGroup | undefined
  tabGroupForTab: (tab: WorkbenchTab) => WorkbenchTabRailGroup | undefined
  isProtectionLocked: (tab: WorkbenchTab) => boolean
  isCloseBlocked: (tab: WorkbenchTab) => boolean
  notify: (title: string, message?: string, tone?: 'info' | 'warning' | 'error') => void
  requestRenameTab: (tabId: string) => Promise<void>
  requestRenameTabGroup: (groupId: string) => Promise<void>
  requestNewGroupFromTab: (tabId: string) => Promise<void>
  submitRename: () => void
  cancelRename: () => void
  requestSetTabColor: (tabId: string) => Promise<void>
  requestSetGroupColor: (groupId: string) => Promise<void>
  applyColor: (color: WorkbenchTabColorId) => Promise<void>
  requestProtectTab: (tabId: string, mode?: ProtectionMode) => Promise<void>
  requestProtectGroup: (groupId: string, mode?: ProtectionMode) => Promise<void>
  submitProtection: () => Promise<void>
  cancelProtection: () => void
  requestUnlockTab: (tabId: string, action: string) => Promise<boolean>
  requestUnlockGroup: (groupId: string, action: string) => Promise<boolean>
  submitUnlock: () => Promise<void>
  cancelUnlock: () => void
  runProtectedTabAction: (
    tab: WorkbenchTab,
    action: string,
    callback: () => void | Promise<void>,
    options?: { requireEditable?: boolean },
  ) => Promise<void>
  runProtectedGroupAction: (
    groupId: string,
    action: string,
    callback: () => void | Promise<void>,
    options?: { requireEditable?: boolean },
  ) => Promise<void>
}

const WORKBENCH_TAB_INTERACTIONS = Symbol('WORKBENCH_TAB_INTERACTIONS')

export function provideWorkbenchTabInteractions(group: WorkbenchTabGroupNode) {
  const runtime = useWorkbenchRuntime()
  const pendingUnlock = ref<((unlocked: boolean) => void) | null>(null)
  const tabGroups = computed(() => [...(group.tabGroups ?? [])].sort((a, b) => a.order - b.order))

  const rename = reactive<RenameDialogState>({
    open: false,
    target: null,
    title: '',
    description: '',
    value: '',
    error: '',
  })

  const color = reactive<ColorDialogState>({
    open: false,
    target: null,
    title: '',
    selected: 'default',
  })

  const protection = reactive<ProtectionDialogState>({
    open: false,
    mode: 'set',
    target: null,
    title: '',
    description: '',
    password: '',
    confirmation: '',
    hint: '',
    showPassword: false,
    error: '',
  })

  const unlock = reactive<UnlockDialogState>({
    open: false,
    target: null,
    title: '',
    description: '',
    hint: '',
    password: '',
    showPassword: false,
    error: '',
  })

  function persist() {
    void runtime.workbench.persist()
  }

  function notify(title: string, message?: string, tone: 'info' | 'warning' | 'error' = 'info') {
    void runtime.host.capabilities.notify?.({ title, message, tone })
  }

  function tabById(tabId: string) {
    return group.tabs.find((tab) => tab.id === tabId)
  }

  function groupById(groupId: string) {
    return group.tabGroups.find((item) => item.id === groupId)
  }

  function tabGroupForTab(tab: WorkbenchTab) {
    return tab.tabGroupId ? groupById(tab.tabGroupId) : undefined
  }

  function targetLabel(target: TabTarget | GroupTarget) {
    if (target.kind === 'tab') return tabById(target.id)?.title ?? 'Tab'
    return groupById(target.id)?.name ?? 'Group'
  }

  function protectionForTarget(
    target: TabTarget | GroupTarget,
  ): WorkbenchTabProtectionMetadata | null {
    if (target.kind === 'tab') return tabById(target.id)?.protection ?? null
    return groupById(target.id)?.protection ?? null
  }

  function isProtectionLocked(tab: WorkbenchTab) {
    if (tab.protection && !runtime.workbench.isProtectionUnlocked(tab.id)) return true
    const tabGroup = tabGroupForTab(tab)
    return Boolean(tabGroup?.protection && !runtime.workbench.isProtectionUnlocked(tabGroup.id))
  }

  function isCloseBlocked(tab: WorkbenchTab) {
    return tab.closable === false || tab.locked || Boolean(tabGroupForTab(tab)?.locked)
  }

  async function requestUnlockTarget(target: TabTarget | GroupTarget, action: string) {
    const metadata = protectionForTarget(target)
    if (!metadata || runtime.workbench.isProtectionUnlocked(target.id)) return true
    unlock.open = true
    unlock.target = target
    unlock.title = `Unlock ${targetLabel(target)}`
    unlock.description = `Unlock this ${target.kind} to ${action}. Session unlock lasts until the app is reset.`
    unlock.hint = metadata.hint ?? ''
    unlock.password = ''
    unlock.showPassword = false
    unlock.error = ''
    return new Promise<boolean>((resolve) => {
      pendingUnlock.value = resolve
    })
  }

  async function requestUnlockTab(tabId: string, action: string) {
    const tab = tabById(tabId)
    if (!tab) return false
    if (tab.protection && !(await requestUnlockTarget({ kind: 'tab', id: tab.id }, action)))
      return false
    const tabGroup = tabGroupForTab(tab)
    if (tabGroup?.protection) return requestUnlockTarget({ kind: 'group', id: tabGroup.id }, action)
    return true
  }

  async function requestUnlockGroup(groupId: string, action: string) {
    return requestUnlockTarget({ kind: 'group', id: groupId }, action)
  }

  async function submitUnlock() {
    if (!unlock.target) return
    const metadata = protectionForTarget(unlock.target)
    if (!metadata) return
    if (!unlock.password) {
      unlock.error = 'Enter the PIN/password.'
      return
    }
    if (!(await verifyProtectionSecret(metadata, unlock.password))) {
      unlock.error = 'The PIN/password did not match.'
      return
    }
    runtime.workbench.unlockProtection(unlock.target.id)
    unlock.open = false
    pendingUnlock.value?.(true)
    pendingUnlock.value = null
  }

  function cancelUnlock() {
    unlock.open = false
    unlock.password = ''
    unlock.error = ''
    pendingUnlock.value?.(false)
    pendingUnlock.value = null
  }

  async function runProtectedTabAction(
    tab: WorkbenchTab,
    action: string,
    callback: () => void | Promise<void>,
    options: { requireEditable?: boolean } = {},
  ) {
    const tabGroup = tabGroupForTab(tab)
    if (options.requireEditable && tab.locked) {
      notify('Tab is locked', `Unlock "${tab.title}" before ${action}.`, 'warning')
      return
    }
    if (options.requireEditable && tabGroup?.locked) {
      notify('Group is locked', `Unlock "${tabGroup.name}" before ${action}.`, 'warning')
      return
    }
    if (!(await requestUnlockTab(tab.id, action))) return
    await callback()
    persist()
  }

  async function runProtectedGroupAction(
    groupId: string,
    action: string,
    callback: () => void | Promise<void>,
    options: { requireEditable?: boolean } = {},
  ) {
    const tabGroup = groupById(groupId)
    if (!tabGroup) return
    if (options.requireEditable && tabGroup.locked) {
      notify('Group is locked', `Unlock "${tabGroup.name}" before ${action}.`, 'warning')
      return
    }
    if (!(await requestUnlockGroup(groupId, action))) return
    await callback()
    persist()
  }

  async function requestRenameTab(tabId: string) {
    const tab = tabById(tabId)
    if (!tab) return
    await runProtectedTabAction(
      tab,
      'rename it',
      () => {
        rename.open = true
        rename.target = { kind: 'tab', id: tabId }
        rename.title = 'Rename Tab'
        rename.description = 'Give this tab a clear title.'
        rename.value = tab.title
        rename.error = ''
      },
      { requireEditable: true },
    )
  }

  async function requestRenameTabGroup(groupId: string) {
    const tabGroup = groupById(groupId)
    if (!tabGroup) return
    await runProtectedGroupAction(
      groupId,
      'rename it',
      () => {
        rename.open = true
        rename.target = { kind: 'group', id: groupId }
        rename.title = 'Rename Group'
        rename.description = 'Group names are saved with the workspace layout.'
        rename.value = tabGroup.name
        rename.error = ''
      },
      { requireEditable: true },
    )
  }

  async function requestNewGroupFromTab(tabId: string) {
    const tab = tabById(tabId)
    if (!tab) return
    await runProtectedTabAction(
      tab,
      'create a group from it',
      () => {
        rename.open = true
        rename.target = { kind: 'new-group-from-tab', id: tabId }
        rename.title = 'New Group from Tab'
        rename.description = 'Create a saved group around this tab.'
        rename.value = tab.title
        rename.error = ''
      },
      { requireEditable: true },
    )
  }

  function submitRename() {
    const value = rename.value.trim()
    if (!value) {
      rename.error = 'Name is required.'
      return
    }
    if (!rename.target) return
    if (rename.target.kind === 'tab') {
      runtime.workbench.setTabTitle(rename.target.id, value, group.id)
    } else if (rename.target.kind === 'group') {
      runtime.workbench.renameTabGroup(rename.target.id, value, group.id)
    } else {
      runtime.workbench.createTabGroup(value, group.id, [rename.target.id])
    }
    rename.open = false
    persist()
  }

  function cancelRename() {
    rename.open = false
    rename.error = ''
  }

  async function requestSetTabColor(tabId: string) {
    const tab = tabById(tabId)
    if (!tab) return
    await runProtectedTabAction(
      tab,
      'change its color',
      () => {
        color.open = true
        color.target = { kind: 'tab', id: tabId }
        color.title = 'Tab Color'
        color.selected = tab.color ?? 'default'
      },
      { requireEditable: true },
    )
  }

  async function requestSetGroupColor(groupId: string) {
    const tabGroup = groupById(groupId)
    if (!tabGroup) return
    await runProtectedGroupAction(
      groupId,
      'change its color',
      () => {
        color.open = true
        color.target = { kind: 'group', id: groupId }
        color.title = 'Group Color'
        color.selected = tabGroup.color ?? 'default'
      },
      { requireEditable: true },
    )
  }

  async function applyColor(nextColor: WorkbenchTabColorId) {
    color.selected = nextColor
    if (!color.target) return
    if (color.target.kind === 'tab')
      runtime.workbench.setTabColor(color.target.id, nextColor, group.id)
    else runtime.workbench.setTabGroupColor(color.target.id, nextColor, group.id)
    persist()
  }

  async function requestProtectTarget(target: TabTarget | GroupTarget, mode: ProtectionMode) {
    if (
      (mode === 'change' || mode === 'remove') &&
      !(await requestUnlockTarget(target, `${mode} protection`))
    ) {
      return
    }
    protection.open = true
    protection.mode = mode
    protection.target = target
    protection.title =
      mode === 'remove'
        ? `Remove Protection`
        : mode === 'reset'
          ? `Reset Protection`
          : mode === 'change'
            ? `Change Protection`
            : `Protect ${targetLabel(target)}`
    protection.description =
      'This protects the tab locally in this workspace. It is not encryption unless explicitly implemented.'
    protection.password = ''
    protection.confirmation = ''
    protection.hint = ''
    protection.showPassword = false
    protection.error = ''
  }

  function requestProtectTab(tabId: string, mode: ProtectionMode = 'set') {
    return requestProtectTarget({ kind: 'tab', id: tabId }, mode)
  }

  function requestProtectGroup(groupId: string, mode: ProtectionMode = 'set') {
    return requestProtectTarget({ kind: 'group', id: groupId }, mode)
  }

  async function submitProtection() {
    if (!protection.target) return
    if (protection.mode === 'remove' || protection.mode === 'reset') {
      if (protection.target.kind === 'tab')
        runtime.workbench.setTabProtection(protection.target.id, null, group.id)
      else runtime.workbench.setTabGroupProtection(protection.target.id, null, group.id)
      protection.open = false
      persist()
      return
    }
    if (protection.password.length < 4) {
      protection.error = 'Use at least 4 characters.'
      return
    }
    if (protection.password !== protection.confirmation) {
      protection.error = 'PIN/password entries do not match.'
      return
    }
    const metadata = await createProtectionMetadata(protection.password, protection.hint.trim())
    if (protection.target.kind === 'tab') {
      runtime.workbench.setTabProtection(protection.target.id, metadata, group.id)
    } else {
      runtime.workbench.setTabGroupProtection(protection.target.id, metadata, group.id)
    }
    runtime.workbench.unlockProtection(protection.target.id)
    protection.open = false
    persist()
  }

  function cancelProtection() {
    protection.open = false
    protection.password = ''
    protection.confirmation = ''
    protection.error = ''
  }

  const controller: WorkbenchTabInteractions = {
    group,
    rename,
    color,
    protection,
    unlock,
    tabGroups,
    tabById,
    groupById,
    tabGroupForTab,
    isProtectionLocked,
    isCloseBlocked,
    notify,
    requestRenameTab,
    requestRenameTabGroup,
    requestNewGroupFromTab,
    submitRename,
    cancelRename,
    requestSetTabColor,
    requestSetGroupColor,
    applyColor,
    requestProtectTab,
    requestProtectGroup,
    submitProtection,
    cancelProtection,
    requestUnlockTab,
    requestUnlockGroup,
    submitUnlock,
    cancelUnlock,
    runProtectedTabAction,
    runProtectedGroupAction,
  }

  provide(WORKBENCH_TAB_INTERACTIONS, controller)
  return controller
}

export function useWorkbenchTabInteractions() {
  const controller = inject<WorkbenchTabInteractions>(WORKBENCH_TAB_INTERACTIONS)
  if (!controller) throw new Error('Workbench tab interactions were not provided.')
  return controller
}

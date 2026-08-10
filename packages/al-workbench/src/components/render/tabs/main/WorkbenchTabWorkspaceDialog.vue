<script setup lang="ts">
import type { WorkbenchTabSession, WorkbenchTabTemplate } from '@activelane/workbench-api'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'

defineOptions({ name: 'WorkbenchTabWorkspaceDialog' })

type Mode = 'sessions' | 'templates' | 'share'
type Item = WorkbenchTabSession | WorkbenchTabTemplate

const runtime = useWorkbenchRuntime()
const [
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  AlButton,
] = runtime.workbench.ui.getComponents([
  'Dialog',
  'DialogContent',
  'DialogDescription',
  'DialogFooter',
  'DialogHeader',
  'DialogTitle',
  'AlButton',
])

const open = ref(false)
const mode = ref<Mode>('sessions')
const selectedId = ref('')
const name = ref('')
const importJson = ref('')
const error = ref('')

const sessions = computed(() => runtime.workbench.tabs.sessions.list())
const templates = computed(() => runtime.workbench.tabs.templates.list())
const items = computed<Item[]>(() =>
  mode.value === 'templates' ? templates.value : sessions.value,
)
const selected = computed(() => items.value.find((item) => item.id === selectedId.value))
const hasDirtyTabs = computed(() => {
  const queue = [runtime.workbench.state.layout]
  while (queue.length) {
    const node = queue.shift()
    if (!node) continue
    if (node.kind === 'split') queue.push(...node.children)
    else if (node.tabs.some((tab) => tab.dirty)) return true
  }
  return false
})
const title = computed(() =>
  mode.value === 'templates'
    ? 'Tab Templates'
    : mode.value === 'share'
      ? 'Import Shared Tab Set'
      : 'Workspace Sessions',
)
const description = computed(() =>
  mode.value === 'templates'
    ? 'Apply, rename, duplicate, export, or delete reusable tab layouts.'
    : mode.value === 'share'
      ? 'Paste a shared tab set JSON payload, preview warnings, then apply it.'
      : 'Restore, rename, duplicate, export, or delete saved workspace sessions.',
)

function openDialog(nextMode: Mode) {
  mode.value = nextMode
  selectedId.value = items.value[0]?.id ?? ''
  name.value = selected.value?.name ?? ''
  importJson.value = ''
  error.value = ''
  open.value = true
}

function onRequest(event: Event) {
  const detail = (event as CustomEvent<{ mode?: Mode }>).detail
  openDialog(detail?.mode ?? 'sessions')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function workspaceStats(item: Item) {
  const layout = item.workspace.layout
  if (layout.kind !== 'group') return 'Split workspace'
  return `${layout.tabs.length} tabs, ${layout.tabGroups.length} groups`
}

async function saveCurrent() {
  const service =
    mode.value === 'templates' ? runtime.workbench.tabs.templates : runtime.workbench.tabs.sessions
  const item = await service.saveCurrent(name.value.trim() || undefined)
  selectedId.value = item.id
  name.value = item.name
}

async function renameSelected() {
  if (!selected.value) return
  const service =
    mode.value === 'templates' ? runtime.workbench.tabs.templates : runtime.workbench.tabs.sessions
  await service.rename(selected.value.id, name.value)
}

async function duplicateSelected() {
  if (!selected.value) return
  const service =
    mode.value === 'templates' ? runtime.workbench.tabs.templates : runtime.workbench.tabs.sessions
  const duplicate = await service.duplicate(selected.value.id)
  if (duplicate) selectedId.value = duplicate.id
}

async function deleteSelected() {
  if (!selected.value) return
  const service =
    mode.value === 'templates' ? runtime.workbench.tabs.templates : runtime.workbench.tabs.sessions
  await service.delete(selected.value.id)
  selectedId.value = items.value[0]?.id ?? ''
}

function applySelected(replace: boolean) {
  if (!selected.value) return
  const service =
    mode.value === 'templates' ? runtime.workbench.tabs.templates : runtime.workbench.tabs.sessions
  service.apply(selected.value.id, { replace })
  void runtime.workbench.persist()
  open.value = false
}

async function copyExport() {
  if (!selected.value) return
  const service =
    mode.value === 'templates' ? runtime.workbench.tabs.templates : runtime.workbench.tabs.sessions
  const json = service.exportJson(selected.value.id)
  if (!json) return
  await (runtime.host.capabilities.clipboard?.writeText?.(json) ??
    navigator.clipboard?.writeText(json))
}

async function importCollectionItem() {
  const service =
    mode.value === 'templates' ? runtime.workbench.tabs.templates : runtime.workbench.tabs.sessions
  try {
    error.value = ''
    const item = await service.importJson(importJson.value)
    selectedId.value = item.id
    name.value = item.name
    importJson.value = ''
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  }
}

function parseShared() {
  try {
    error.value = ''
    return runtime.workbench.tabs.sharing.importPayload(importJson.value)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
    return null
  }
}

function applyShared(replace: boolean) {
  const set = parseShared()
  if (!set) return
  runtime.workbench.tabs.sharing.apply(set, { replace })
  void runtime.workbench.persist()
  open.value = false
}

onMounted(() => {
  window.addEventListener('activelane:tab-workspace-dialog', onRequest)
})

onUnmounted(() => {
  window.removeEventListener('activelane:tab-workspace-dialog', onRequest)
})
</script>

<template>
  <Dialog :open="open" @update:open="open = $event">
    <DialogContent class="sm:max-w-[44rem]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <div v-if="mode !== 'share'" class="wb-tab-workspace-dialog">
        <aside class="wb-tab-workspace-dialog__list" aria-label="Saved tab workspaces">
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="wb-tab-workspace-dialog__item"
            :class="{ 'wb-tab-workspace-dialog__item--active': item.id === selectedId }"
            @click="selectedId = item.id; name = item.name"
          >
            <span>{{ item.name }}</span>
            <small>{{ workspaceStats(item) }} · {{ formatDate(item.updatedAt) }}</small>
          </button>
          <p v-if="!items.length" class="wb-tab-workspace-dialog__empty">No saved items yet.</p>
        </aside>

        <section class="wb-tab-workspace-dialog__detail">
          <label class="wb-tab-workspace-dialog__label">
            Name
            <input v-model="name" class="wb-tab-workspace-dialog__input" type="text">
          </label>
          <div v-if="selected" class="wb-tab-workspace-dialog__meta">
            <span>Created {{ formatDate(selected.createdAt) }}</span>
            <span>Updated {{ formatDate(selected.updatedAt) }}</span>
            <span>{{ workspaceStats(selected) }}</span>
          </div>
          <div v-if="selected?.workspace.warnings.length" class="wb-tab-workspace-dialog__warning">
            {{ selected.workspace.warnings.join(' ') }}
          </div>
          <div v-if="hasDirtyTabs" class="wb-tab-workspace-dialog__warning">
            Current workspace has dirty tabs. Replacing the workspace can discard unsaved state.
          </div>
          <label class="wb-tab-workspace-dialog__label">
            Import JSON
            <textarea
              v-model="importJson"
              class="wb-tab-workspace-dialog__textarea wb-tab-workspace-dialog__textarea--small"
              placeholder="Paste exported session or template JSON"
              aria-label="Import JSON"
            />
          </label>
          <p v-if="error" class="wb-tab-workspace-dialog__error">{{ error }}</p>
        </section>
      </div>

      <div v-else class="wb-tab-workspace-dialog__import">
        <textarea
          v-model="importJson"
          class="wb-tab-workspace-dialog__textarea"
          placeholder="{ &quot;schema&quot;: &quot;activelane.workbench.tabs.shared-set&quot;, ... }"
          aria-label="Shared tab set JSON"
        />
        <p v-if="error" class="wb-tab-workspace-dialog__error">{{ error }}</p>
        <div v-if="hasDirtyTabs" class="wb-tab-workspace-dialog__warning">
          Current workspace has dirty tabs. Replacing the workspace can discard unsaved state.
        </div>
      </div>

      <DialogFooter>
        <template v-if="mode !== 'share'">
          <AlButton type="button" variant="outline" @click="saveCurrent">Save Current</AlButton>
          <AlButton type="button" variant="outline" :disabled="!selected" @click="renameSelected">
            Rename
          </AlButton>
          <AlButton
            type="button"
            variant="outline"
            :disabled="!selected"
            @click="duplicateSelected"
          >
            Duplicate
          </AlButton>
          <AlButton type="button" variant="outline" :disabled="!selected" @click="copyExport">
            Export
          </AlButton>
          <AlButton
            type="button"
            variant="outline"
            :disabled="!importJson.trim()"
            @click="importCollectionItem"
          >
            Import
          </AlButton>
          <AlButton
            type="button"
            variant="destructive"
            :disabled="!selected"
            @click="deleteSelected"
          >
            Delete
          </AlButton>
          <AlButton
            type="button"
            variant="secondary"
            :disabled="!selected"
            @click="applySelected(false)"
          >
            Restore Into Current
          </AlButton>
          <AlButton type="button" :disabled="!selected" @click="applySelected(true)">
            Replace Workspace
          </AlButton>
        </template>
        <template v-else>
          <AlButton type="button" variant="secondary" @click="applyShared(false)">
            Apply Into Current
          </AlButton>
          <AlButton type="button" @click="applyShared(true)">Replace Workspace</AlButton>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.wb-tab-workspace-dialog {
  display: grid;
  grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
  gap: 1rem;
  min-height: 18rem;
}

.wb-tab-workspace-dialog__list {
  display: grid;
  align-content: start;
  gap: 0.375rem;
  min-height: 0;
  max-height: 22rem;
  overflow: auto;
}

.wb-tab-workspace-dialog__item {
  display: grid;
  gap: 0.25rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: var(--panel);
  padding: 0.625rem;
  color: var(--text-primary);
  text-align: left;
}

.wb-tab-workspace-dialog__item--active {
  border-color: var(--focus-ring);
  background: var(--hover);
}

.wb-tab-workspace-dialog__item small,
.wb-tab-workspace-dialog__meta,
.wb-tab-workspace-dialog__empty {
  color: var(--text-muted);
}

.wb-tab-workspace-dialog__detail,
.wb-tab-workspace-dialog__import {
  display: grid;
  align-content: start;
  gap: 0.75rem;
}

.wb-tab-workspace-dialog__label {
  display: grid;
  gap: 0.375rem;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.wb-tab-workspace-dialog__input,
.wb-tab-workspace-dialog__textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: var(--background);
  padding: 0.5rem 0.625rem;
  color: var(--text-primary);
  outline: none;
}

.wb-tab-workspace-dialog__textarea--small {
  min-height: 6rem;
}

.wb-tab-workspace-dialog__textarea {
  min-height: 18rem;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.wb-tab-workspace-dialog__warning,
.wb-tab-workspace-dialog__error {
  border: 1px solid color-mix(in srgb, var(--warning) 45%, var(--border));
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--warning) 10%, transparent);
  padding: 0.625rem;
  color: var(--text-primary);
}

.wb-tab-workspace-dialog__error {
  border-color: color-mix(in srgb, var(--destructive) 45%, var(--border));
  background: color-mix(in srgb, var(--destructive) 10%, transparent);
}

@media (max-width: 720px) {
  .wb-tab-workspace-dialog {
    grid-template-columns: 1fr;
  }
}
</style>

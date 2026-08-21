<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ExplorerNode } from '../../core/explorer/types'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { FileOpenIntent, ResolvedFileOpener } from '../../core/workbench/fileOpeners'

import { openExplorerFileInfo, openExplorerNode } from '../services/openExplorerNode'

defineOptions({ name: 'WorkbenchExplorerNode' })
const MAX_RENDERED_CHILDREN = 300

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  node: ExplorerNode
  depth: number
}>()

const ChevronRight = props.runtime.workbench.ui.getIcon('lucide:chevron-right')
const Loader2 = props.runtime.workbench.ui.getIcon('lucide:loader-circle')
const AlertTriangle = props.runtime.workbench.ui.getIcon('lucide:triangle-alert')
const Copy = props.runtime.workbench.ui.getIcon('lucide:copy')
const ExternalLink = props.runtime.workbench.ui.getIcon('lucide:external-link')
const Info = props.runtime.workbench.ui.getIcon('lucide:info')
const AppWindow = props.runtime.workbench.ui.getIcon('lucide:app-window')

const [
  ContextMenu,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
] = props.runtime.workbench.ui.getComponents([
  'ContextMenu',
  'ContextMenuContent',
  'ContextMenuLabel',
  'ContextMenuSeparator',
  'ContextMenuItem',
  'ContextMenuTrigger',
  'Dialog',
  'DialogContent',
  'DialogDescription',
  'DialogHeader',
  'DialogTitle',
])

const pickerOpen = ref(false)
const pickerIntent = ref<FileOpenIntent | null>(null)
const providerId = computed(() => props.node.providerId ?? '')
const nodeState = computed(() =>
  providerId.value
    ? props.runtime.explorer.state.nodeState[`${providerId.value}::${props.node.id}`]
    : undefined,
)
const expanded = computed(() => props.runtime.explorer.isExpanded(props.node, providerId.value))
const children = computed(() =>
  providerId.value
    ? props.runtime.explorer.getChildren(providerId.value, props.node.id)
    : undefined,
)
const renderedChildren = computed(() => children.value?.slice(0, MAX_RENDERED_CHILDREN))
const hiddenChildCount = computed(() =>
  children.value && children.value.length > MAX_RENDERED_CHILDREN
    ? children.value.length - MAX_RENDERED_CHILDREN
    : 0,
)
const Icon = computed(() =>
  props.runtime.workbench.ui.getIcon(
    props.node.icon ?? (props.node.isLeaf ? 'lucide:file' : 'lucide:folder'),
  ),
)
const selected = computed(
  () =>
    props.runtime.explorer.state.selectedProviderId === providerId.value &&
    props.runtime.explorer.state.selectedNodeId === props.node.id,
)
const disabled = computed(() => props.node.disabled || Boolean(nodeState.value?.error))
const pickerOpeners = computed<ResolvedFileOpener[]>(() =>
  pickerIntent.value ? props.runtime.fileOpeners.resolve(pickerIntent.value) : [],
)

onMounted(() => {
  if (props.depth === 0 && expanded.value && !children.value && providerId.value) {
    void props.runtime.explorer.loadChildren(providerId.value, props.node)
  }
})

async function activate() {
  props.runtime.explorer.select(props.node, providerId.value)
  props.runtime.explorer.focus(props.node, providerId.value)
  await openExplorerNode(props.runtime, props.node, { onOpenWith: showOpenWith })
}

function toggle() {
  void props.runtime.explorer.toggle(props.node, providerId.value)
}

function onClick() {
  if (props.node.isLeaf || props.node.collapsible === false) {
    props.runtime.explorer.select(props.node, providerId.value)
    props.runtime.explorer.focus(props.node, providerId.value)
    return
  }
  toggle()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    activate()
  } else if (event.key === 'ArrowRight' && !props.node.isLeaf) {
    event.preventDefault()
    if (!expanded.value) toggle()
  } else if (event.key === 'ArrowLeft' && expanded.value) {
    event.preventDefault()
    toggle()
  }
}

function fileIntentFromNode(): FileOpenIntent | null {
  const path = props.node.metadata?.path
  if (typeof path !== 'string') return null
  const extension = props.node.label.includes('.')
    ? props.node.label.split('.').pop()?.toLowerCase()
    : undefined
  return { filePath: path, fileName: props.node.label, extension, isDirectory: false }
}

function showOpenWith(intent?: FileOpenIntent) {
  props.runtime.explorer.select(props.node, providerId.value)
  props.runtime.explorer.focus(props.node, providerId.value)
  pickerIntent.value = intent ?? fileIntentFromNode()
  if (pickerIntent.value) pickerOpen.value = true
}

async function openWith(opener: ResolvedFileOpener, preferred = false) {
  if (!pickerIntent.value) return
  if (preferred) await props.runtime.fileOpeners.setPreferred(pickerIntent.value, opener.id)
  const result = await props.runtime.fileOpeners.open(pickerIntent.value, opener.id)
  pickerOpen.value = false
  if (result !== 'opened') openExplorerFileInfo(props.runtime, props.node)
}

async function openSystemDefault() {
  const intent = fileIntentFromNode()
  if (!intent) return
  const result = await props.runtime.fileOpeners.open(intent, 'system.default')
  if (result !== 'opened') {
    void props.runtime.host.capabilities.notify?.({
      title: 'System default opener is unavailable',
      message: 'Native file opening is only available in the desktop app.',
      tone: 'warning',
    })
  }
}

function copyPath() {
  const path = props.node.metadata?.path
  if (typeof path === 'string') void props.runtime.host.capabilities.clipboard?.writeText?.(path)
}

function reveal() {
  const path = props.node.metadata?.path
  if (typeof path === 'string')
    void props.runtime.host.capabilities.files?.revealInFileManager?.(path)
}

function properties() {
  props.runtime.explorer.select(props.node, providerId.value)
  props.runtime.explorer.focus(props.node, providerId.value)
  pickerOpen.value = false
  openExplorerFileInfo(props.runtime, props.node)
}
</script>

<template>
  <li class="explorer-node">
    <ContextMenu>
      <ContextMenuTrigger as-child>
        <button
          type="button"
          class="explorer-node__row"
          :class="{
            'explorer-node__row--selected': selected,
            'explorer-node__row--disabled': disabled,
          }"
          :style="{ paddingLeft: `${0.45 + depth * 0.85}rem` }"
          :title="node.tooltip"
          @click="onClick"
          @dblclick="activate"
          @keydown="onKeydown"
          @focus="runtime.explorer.focus(node, providerId)"
          @click.stop="toggle"
          aria-label="Toggle folder"
        >
          <div class="explorer-node__twisty">
            <Loader2 v-if="nodeState?.loading" class="explorer-node__spinner" />
            <ChevronRight
              v-else-if="!node.isLeaf && node.collapsible !== false"
              :class="{ 'explorer-node__chevron--open': expanded }"
            />
          </div>
          <component :is="Icon" class="explorer-node__icon" />
          <span class="explorer-node__label">{{ node.label }}</span>
          <span v-if="node.description" class="explorer-node__description">
            {{ node.description }}
          </span>
          <span v-if="node.badge" class="explorer-node__badge">{{ node.badge }}</span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent class="w-56">
        <ContextMenuLabel>{{ node.label }}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem @select="activate">Open</ContextMenuItem>
        <ContextMenuItem v-if="node.resourceType === 'file'" @select="showOpenWith()">
          <AppWindow class="mr-2 h-3.5 w-3.5" />
          Open With...
        </ContextMenuItem>
        <ContextMenuItem v-if="node.resourceType === 'file'" @select="openSystemDefault">
          Open With System Default
        </ContextMenuItem>
        <ContextMenuItem @select="runtime.explorer.refresh(providerId, node.id)">
          Refresh
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem @select="copyPath">
          <Copy class="mr-2 h-3.5 w-3.5" />
          Copy Path
        </ContextMenuItem>
        <ContextMenuItem @select="reveal">
          <ExternalLink class="mr-2 h-3.5 w-3.5" />
          Reveal in Folder
        </ContextMenuItem>
        <ContextMenuItem v-if="node.resourceType === 'file'" @select="properties">
          <Info class="mr-2 h-3.5 w-3.5" />
          Properties / File Info
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>

    <Dialog v-model:open="pickerOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Open With</DialogTitle>
          <DialogDescription>{{ pickerIntent?.filePath }}</DialogDescription>
        </DialogHeader>
        <div class="explorer-open-with" role="listbox" aria-label="Available file openers">
          <div v-for="opener in pickerOpeners" :key="opener.id" class="explorer-open-with__item">
            <button type="button" class="explorer-open-with__primary" @click="openWith(opener)">
              <span class="explorer-open-with__label">{{ opener.label }}</span>
              <span class="explorer-open-with__meta">
                {{ opener.source }}
                <template v-if="opener.recommended"> · recommended</template>
              </span>
            </button>
            <button
              type="button"
              class="explorer-open-with__preferred"
              @click="openWith(opener, true)"
            >
              Set default
            </button>
          </div>
          <button type="button" class="explorer-open-with__item" @click="properties">
            <span class="explorer-open-with__label">Properties / File Info</span>
            <span class="explorer-open-with__meta">Built-in fallback</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>

    <p v-if="nodeState?.error" class="explorer-node__error">
      <AlertTriangle />
      <span>{{ nodeState.error }}</span>
    </p>

    <ul v-if="expanded && renderedChildren?.length" class="explorer-node__children">
      <WorkbenchExplorerNode
        v-for="child in renderedChildren"
        :key="child.id"
        :runtime="runtime"
        :node="child"
        :depth="depth + 1"
      />
      <li v-if="hiddenChildCount" class="explorer-node__overflow">
        {{ hiddenChildCount }}
        more entries hidden
      </li>
    </ul>
  </li>
</template>

<style scoped>
.explorer-node,
.explorer-node__children {
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.explorer-node__row {
  display: grid;
  grid-template-columns: 1rem 1rem minmax(0, 1fr) auto auto;
  align-items: center;
  width: 100%;
  height: 1.55rem;
  gap: 0.32rem;
  border: 0;
  border-radius: 4px;
  background: transparent;
  padding-right: 0.45rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1;
  text-align: left;
}

.explorer-node__row:hover {
  background: var(--hover);
  color: var(--text-primary);
}

.explorer-node__row:focus-visible {
  outline: 1px solid var(--focus-ring);
  outline-offset: -1px;
}

.explorer-node__row--selected {
  background: var(--selected);
  color: var(--text-primary);
}

.explorer-node__row--disabled {
  color: var(--text-muted);
}

.explorer-node__twisty,
.explorer-node__icon {
  display: inline-grid;
  place-items: center;
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
}

.explorer-node__twisty svg,
.explorer-node__icon {
  width: 0.88rem;
  height: 0.88rem;
}

.explorer-node__chevron--open {
  transform: rotate(90deg);
}

.explorer-node__spinner {
  animation: explorer-spin 0.9s linear infinite;
}

.explorer-node__label,
.explorer-node__description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explorer-node__description {
  color: var(--text-muted);
  font-size: 0.74rem;
}

.explorer-node__badge {
  min-width: 1rem;
  border-radius: 999px;
  background: var(--surface-raised);
  padding: 0.08rem 0.35rem;
  color: var(--text-muted);
  font-size: 0.68rem;
  text-align: center;
}

.explorer-node__error {
  display: flex;
  gap: 0.4rem;
  margin: 0.2rem 0.5rem 0.35rem;
  color: var(--danger);
  font-size: 0.72rem;
}

.explorer-node__overflow {
  height: 1.55rem;
  padding-left: 2.3rem;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.55rem;
}

.explorer-node__error svg {
  width: 0.85rem;
  height: 0.85rem;
  flex: 0 0 auto;
}

.explorer-open-with {
  display: grid;
  gap: 0.4rem;
}

.explorer-open-with__item,
.explorer-open-with__item[type="button"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.2rem 0.7rem;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  padding: 0.55rem 0.65rem;
  color: var(--text-primary);
  text-align: left;
}

.explorer-open-with__item:hover {
  background: var(--hover);
}

.explorer-open-with__primary {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  text-align: left;
}

.explorer-open-with__primary:focus-visible,
.explorer-open-with__preferred:focus-visible,
.explorer-open-with__item[type="button"]:focus-visible {
  outline: 1px solid var(--focus-ring);
  outline-offset: 2px;
}

.explorer-open-with__label,
.explorer-open-with__meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explorer-open-with__label {
  font-size: 0.86rem;
  font-weight: 600;
}

.explorer-open-with__meta {
  color: var(--text-muted);
  font-size: 0.72rem;
  text-transform: capitalize;
}

.explorer-open-with__preferred {
  grid-row: span 2;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--surface-raised);
  padding: 0.25rem 0.45rem;
  color: var(--text-secondary);
  font-size: 0.72rem;
}

@keyframes explorer-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

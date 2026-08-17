<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'
import type { WorkbenchTab } from '../../core/workbench/contributions'

defineOptions({ name: 'WorkbenchExplorerFileTab' })

const props = defineProps<{
  tab: WorkbenchTab
  runtime: WorkbenchRuntimeApi
}>()

const File = props.runtime.workbench.ui.getIcon('lucide.file')
const Copy = props.runtime.workbench.ui.getIcon('lucide.copy')
const ExternalLink = props.runtime.workbench.ui.getIcon('lucide.external-link')
const [AlBadge] = props.runtime.workbench.ui.getComponents(['Badge'])

const path = computed(() => String(props.tab.input?.path ?? props.tab.input?.uri ?? ''))
const size = computed(() =>
  typeof props.tab.input?.size === 'number' ? `${props.tab.input.size.toLocaleString()} bytes` : '',
)

function copyPath() {
  if (path.value) void props.runtime.host.capabilities.clipboard?.writeText?.(path.value)
}

function reveal() {
  if (path.value) void props.runtime.host.capabilities.files?.revealInFileManager?.(path.value)
}
</script>

<template>
  <section class="explorer-file-tab">
    <header class="explorer-file-tab__header">
      <File class="explorer-file-tab__icon" />
      <div>
        <h1>{{ tab.title }}</h1>
        <p>{{ path }}</p>
      </div>
      <AlBadge variant="outline">Preview</AlBadge>
    </header>

    <dl class="explorer-file-tab__meta">
      <div>
        <dt>URI</dt>
        <dd>{{ tab.input?.uri }}</dd>
      </div>
      <div>
        <dt>Type</dt>
        <dd>{{ tab.input?.resourceType ?? 'file' }}</dd>
      </div>
      <div v-if="size">
        <dt>Size</dt>
        <dd>{{ size }}</dd>
      </div>
      <div v-if="tab.input?.modifiedAt">
        <dt>Modified</dt>
        <dd>{{ tab.input.modifiedAt }}</dd>
      </div>
    </dl>

    <div class="explorer-file-tab__actions">
      <button type="button" @click="copyPath">
        <Copy />
        <span>Copy Path</span>
      </button>
      <button type="button" @click="reveal">
        <ExternalLink />
        <span>Reveal</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.explorer-file-tab {
  display: grid;
  align-content: start;
  gap: 1rem;
  min-height: 100%;
  padding: 1.5rem;
  background: var(--surface);
  color: var(--text-primary);
}

.explorer-file-tab__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
}

.explorer-file-tab__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-muted);
}

.explorer-file-tab h1,
.explorer-file-tab p {
  margin: 0;
}

.explorer-file-tab h1 {
  font-size: 1.35rem;
  font-weight: 650;
}

.explorer-file-tab p,
.explorer-file-tab dd {
  overflow-wrap: anywhere;
  color: var(--text-muted);
}

.explorer-file-tab__meta {
  display: grid;
  gap: 0.7rem;
  max-width: 48rem;
  margin: 0;
}

.explorer-file-tab__meta div {
  display: grid;
  grid-template-columns: 7rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--border);
}

.explorer-file-tab dt {
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
}

.explorer-file-tab dd {
  margin: 0;
  font-size: 0.9rem;
}

.explorer-file-tab__actions {
  display: flex;
  gap: 0.5rem;
}

.explorer-file-tab__actions button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  height: 2rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface-raised);
  padding: 0 0.7rem;
  color: var(--text-primary);
  font-size: 0.82rem;
}

.explorer-file-tab__actions svg {
  width: 0.9rem;
  height: 0.9rem;
}
</style>

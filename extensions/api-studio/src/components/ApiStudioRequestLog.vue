<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '@activelane/workbench'
import { useApiStudioStore } from '../runtime'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const studio = useApiStudioStore()
const DataTableView = props.runtime.workbench.ui.getBlock('DataTableView')
const EmptyState = props.runtime.workbench.ui.getComponent('EmptyState')
const columns = [
  { key: 'time', label: 'Time', width: '82px' },
  { key: 'method', label: 'Method', width: '62px' },
  { key: 'request', label: 'Request' },
  { key: 'status', label: 'Status', width: '70px' },
  { key: 'duration', label: 'Duration', width: '75px' },
]
const time = (value: string) => new Date(value).toLocaleTimeString([], { hour12: false })
</script>

<template>
  <DataTableView :columns="columns">
    <button
      type="button"
      v-for="entry in studio.state.history"
      :key="entry.id"
      class="log-row"
      @click="studio.openRequest(entry.requestId)"
    >
      <time>{{ time(entry.timestamp) }}</time
      ><b :class="`method-${entry.method.toLowerCase()}`">{{ entry.method }}</b
      ><span class="truncate">{{ entry.url }}</span
      ><strong :class="(entry.responseStatus ?? 500) < 400 ? 'good' : 'bad'"
        >{{ entry.responseStatus ?? 'ERR' }}</strong
      ><span>{{ entry.durationMs }} ms</span>
    </button>
    <EmptyState
      v-if="!studio.state.history.length"
      title="No request history"
      description="Request execution details will appear here."
    />
  </DataTableView>
</template>

<style scoped>
.log-row {
  display: grid;
  grid-template-columns: 82px 62px minmax(0, 1fr) 70px 75px;
  gap: 8px;
  align-items: center;
  min-height: 27px;
  width: 100%;
  border-bottom: 1px solid var(--border);
  padding: 0 12px;
  text-align: left;
  font:
    11px ui-monospace,
    monospace;
}
.log-row:hover {
  background: var(--accent);
}
.method-get {
  color: #63d391;
}
.method-post {
  color: #ffb454;
}
.method-delete {
  color: #ef6b73;
}
.method-put,
.method-patch {
  color: #61afef;
}
.good {
  color: #63d391;
}
.bad {
  color: #ef6b73;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

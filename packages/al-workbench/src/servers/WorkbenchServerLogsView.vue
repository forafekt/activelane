<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { WorkbenchRuntimeApi } from '../core/runtime/types'
import type { WorkbenchTab } from '../core/workbench/contributions'

import { useServerLogs, useServerRuntime } from './useServerRuntime'

defineOptions({ name: 'WorkbenchServerLogsView' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  tab: WorkbenchTab
}>()

const [Badge, EmptyState] = props.runtime.workbench.ui.getComponents(['Badge', 'EmptyState'])

const { servers } = useServerRuntime(props.runtime)
const selectedServerId = computed(
  () => (props.tab.input?.serverId as string | undefined) ?? servers.value[0]?.id,
)
const selectedServer = computed(() =>
  servers.value.find((server) => server.id === selectedServerId.value),
)
const { logs, bind } = useServerLogs(props.runtime, () => selectedServerId.value)

onMounted(bind)
watch(selectedServerId, bind)
</script>

<template>
  <section class="server-logs">
    <header class="server-logs__header">
      <div>
        <p class="server-logs__eyebrow">Server Logs</p>
        <h1>{{ selectedServer?.label ?? tab.title }}</h1>
      </div>
      <Badge variant="outline">{{ logs.length }} entries</Badge>
    </header>

    <EmptyState
      v-if="!selectedServer"
      title="No server selected"
      description="Open logs from the Servers view to stream a server log channel."
    />

    <div v-else class="server-logs__stream" role="log" aria-live="polite">
      <p v-if="!logs.length" class="server-logs__empty">No logs recorded for this server.</p>
      <article v-for="entry in logs" :key="`${entry.timestamp}:${entry.message}`">
        <time>{{ new Date(entry.timestamp).toLocaleTimeString() }}</time>
        <span class="server-logs__level">{{ entry.level }}</span>
        <span class="server-logs__stream-name">{{ entry.stream }}</span>
        <p>{{ entry.message }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.server-logs {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  padding: 14px;
}

.server-logs__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.server-logs__header h1,
.server-logs__header p,
.server-logs__stream p {
  margin: 0;
}

.server-logs__eyebrow {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.server-logs__stream {
  min-height: 0;
  overflow: auto;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--muted) / 0.28);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.server-logs__stream article {
  display: grid;
  grid-template-columns: 72px 52px 64px minmax(0, 1fr);
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid hsl(var(--border));
}

.server-logs__stream time,
.server-logs__level,
.server-logs__stream-name,
.server-logs__empty {
  color: hsl(var(--muted-foreground));
}

.server-logs__empty {
  padding: 10px;
}
</style>

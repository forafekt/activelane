<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchRuntimeApi } from '../core/runtime/types'
import type { WorkbenchTab } from '../core/workbench/contributions'

import { useServerRuntime } from './useServerRuntime'

defineOptions({ name: 'WorkbenchServersView' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  tab: WorkbenchTab
}>()

const [AlScrollArea, AlBadge, AlButton, AlEmptyState, AlSection, AlStatBlock] =
  props.runtime.workbench.ui.getComponents([
    'ScrollArea',
    'Badge',
    'Button',
    'EmptyState',
    'Section',
    'StatBlock',
  ])

const { servers, startServer, stopServer, restartServer } = useServerRuntime(props.runtime)

const runningCount = computed(
  () => servers.value.filter((server) => server.status === 'running').length,
)

function uptime(server: (typeof servers.value)[number]) {
  if (!server.uptimeMs) return ''
  const seconds = Math.floor(server.uptimeMs / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return `${seconds}s`
  return `${minutes}m ${seconds % 60}s`
}

function openLogs(serverId: string) {
  props.runtime.workbench.openTab({
    id: `workbench.server.logs:${serverId}`,
    kind: 'workbench.server.logs',
    surfaceId: 'workbench.server.logs.surface',
    title: 'Server Logs',
    input: { serverId },
    preview: false,
  })
}

function openUrl(url?: string) {
  if (!url) return
  globalThis.open?.(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <AlScrollArea>
    <section class="servers-view">
      <header class="servers-view__header">
        <div>
          <p class="servers-view__eyebrow">Runtime</p>
          <h1>{{ tab.title }}</h1>
        </div>
        <AlBadge variant="outline">{{ runningCount }} running</AlBadge>
      </header>

      <AlEmptyState
        v-if="!servers.length"
        title="No server extensions"
        description="Installed extensions that declare servers will appear here."
      />

      <AlSection v-else title="Servers">
        <div class="servers-list">
          <article v-for="server in servers" :key="server.id" class="servers-list__item">
            <header>
              <div>
                <h2>{{ server.label }}</h2>
                <p>{{ server.extensionName }}</p>
              </div>
              <AlBadge :variant="server.status === 'failed' ? 'destructive' : 'outline'">
                {{ server.status }}
              </AlBadge>
            </header>

            <dl>
              <div>
                <dt>Startup</dt>
                <dd>{{ server.startup }}</dd>
              </div>
              <div>
                <dt>Restart</dt>
                <dd>{{ server.restartPolicy }}</dd>
              </div>
              <div>
                <dt>Process</dt>
                <dd>{{ server.pid ? `pid ${server.pid}` : 'not running' }}</dd>
              </div>
              <div>
                <dt>URL</dt>
                <dd>
                  {{ server.origin ?? (server.port ? `http://127.0.0.1:${server.port}` : '-') }}
                </dd>
              </div>
              <div>
                <dt>Uptime</dt>
                <dd>{{ uptime(server) || '-' }}</dd>
              </div>
              <div>
                <dt>Crashes</dt>
                <dd>{{ server.crashCount }}</dd>
              </div>
              <div v-if="server.lastError || server.unsupportedReason">
                <dt>Last error</dt>
                <dd>{{ server.lastError ?? server.unsupportedReason }}</dd>
              </div>
            </dl>

            <div class="servers-list__actions">
              <AlButton
                size="sm"
                :disabled="server.status === 'running'"
                :variant="server.status === 'running' ? 'outline' : 'default'"
                @click="startServer(server.id)"
                >Start</AlButton
              >
              <AlButton
                size="sm"
                :disabled="server.status !== 'running'"
                :variant="server.status === 'running' ? 'destructive' : 'outline'"
                @click="stopServer(server.id)"
                >Stop</AlButton
              >
              <AlButton
                size="sm"
                :disabled="server.status !== 'running'"
                :variant="server.status === 'running' ? 'outline' : 'default'"
                @click="restartServer(server.id)"
              >
                Restart
              </AlButton>
              <AlButton size="sm" variant="outline" @click="openLogs(server.id)">Logs</AlButton>
              <AlButton
                size="sm"
                variant="link"
                :disabled="!server.origin"
                @click="openUrl(server.origin)"
              >
                Open URL
              </AlButton>
            </div>
          </article>
        </div>
      </AlSection>
    </section>
  </AlScrollArea>
</template>

<style scoped>
.servers-view {
  display: grid;
  gap: 16px;
  min-height: 100%;
  padding: 18px;
}

.servers-view__header,
.servers-list__item header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.servers-view__header h1,
.servers-view__header p,
.servers-list__item h2,
.servers-list__item p {
  margin: 0;
}

.servers-view__eyebrow,
.servers-list__item dt {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.servers-list {
  display: grid;
  gap: 10px;
}

.servers-list__item {
  display: grid;
  gap: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  padding: 12px;
}

.servers-list__item dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.servers-list__item dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
}

.servers-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 900px) {
  .servers-list__item dl {
    grid-template-columns: 1fr;
  }
}
</style>

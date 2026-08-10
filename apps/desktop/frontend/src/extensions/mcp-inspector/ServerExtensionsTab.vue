<script setup lang="ts">
import type {
  ActiveLaneCapabilityRecord,
  InstalledExtensionRecord,
  ServerExtensionHandle,
  WorkbenchRuntimeApi,
  WorkbenchTab,
} from '@activelane/workbench'
import { createWorkbenchRuntimeHttpClient } from '@activelane/workbench'
import { computed, onMounted, ref } from 'vue'

defineOptions({ name: 'ServerExtensionsTab' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  tab: WorkbenchTab
}>()

const [AlBadge, AlButton, AlSection, AlStatBlock] = props.runtime.workbench.ui.getComponents([
  'AlBadge',
  'AlButton',
  'AlSection',
  'AlStatBlock',
])

const backend = createWorkbenchRuntimeHttpClient(props.runtime)
const installedExtensions = ref<InstalledExtensionRecord[]>([])
const backendCapabilities = ref<ActiveLaneCapabilityRecord[]>([])
const simulatedAi = ref<ActiveLaneCapabilityRecord[]>([])
const simulatedMcp = ref<ActiveLaneCapabilityRecord[]>([])
const serverExtensions = ref<ServerExtensionHandle[]>([])

function refreshServerRuntime() {
  serverExtensions.value = props.runtime.host.server?.listServers() ?? []
}

onMounted(async () => {
  installedExtensions.value = await backend.listInstalledExtensions()
  backendCapabilities.value = await backend.listCapabilities()
  simulatedAi.value = await backend.getSimulatedAi()
  simulatedMcp.value = await backend.getSimulatedMcp()
  refreshServerRuntime()
})

const serverRecords = computed(() =>
  installedExtensions.value.filter(
    (record) => record.manifest.server || record.manifest.type === 'server',
  ),
)

const capabilitiesByOwner = computed(() => {
  const map = new Map<string, number>()
  for (const capability of backendCapabilities.value) {
    const owner = capability.extensionId ?? 'runtime'
    map.set(owner, (map.get(owner) ?? 0) + 1)
  }
  return map
})

async function startExtension(serverId: string) {
  await props.runtime.host.server?.startServer(serverId)
  refreshServerRuntime()
}

async function stopExtension(serverId: string) {
  await props.runtime.host.server?.stopServer(serverId)
  refreshServerRuntime()
}

async function restartExtension(serverId: string) {
  await props.runtime.host.server?.restartServer(serverId)
  refreshServerRuntime()
}
</script>

<template>
  <section class="server-tab">
    <header class="server-tab__header">
      <div>
        <p class="server-tab__eyebrow">Browser-safe server runtime</p>
        <h1>{{ tab.title }}</h1>
      </div>
      <AlBadge variant="outline">{{ runtime.context.hostKind }}</AlBadge>
    </header>

    <div class="server-tab__stats">
      <AlStatBlock label="Server manifests" :value="serverRecords.length" />
      <AlStatBlock label="Runtime handles" :value="serverExtensions.length" />
      <AlStatBlock label="AI simulator" :value="simulatedAi.length" />
      <AlStatBlock label="MCP simulator" :value="simulatedMcp.length" />
    </div>

    <AlSection
      title="Lifecycle Model"
      description="The webapp reads this from the local backend registry. Optional AI and MCP simulator extensions appear here only when installed and enabled, while the core workbench shell stays generic."
    >
      <div class="server-list">
        <article
          v-for="record in serverRecords"
          :key="record.extensionId"
          class="server-list__item"
        >
          <header>
            <div>
              <h2>{{ record.displayName }}</h2>
              <p>{{ record.manifest.description }}</p>
            </div>
            <AlBadge :variant="record.enabled ? 'default' : 'outline'">
              {{ record.enabled ? 'enabled' : 'disabled' }}
            </AlBadge>
          </header>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>
                {{ runtime.host.server?.getServer(record.extensionId)?.status ?? 'not registered' }}
              </dd>
            </div>
            <div>
              <dt>Server</dt>
              <dd>
                {{ record.manifest.server
                    ? `${record.manifest.server.id}:${record.manifest.server.mode}`
                    : 'none' }}
              </dd>
            </div>
            <div>
              <dt>Capabilities</dt>
              <dd>{{ capabilitiesByOwner.get(record.extensionId) ?? 0 }}</dd>
            </div>
            <div>
              <dt>Permissions</dt>
              <dd>{{ JSON.stringify(record.manifest.permissions ?? {}) }}</dd>
            </div>
          </dl>
          <div
            v-if="runtime.host.server?.getServer(record.extensionId)"
            class="server-list__actions"
          >
            <AlButton size="sm" variant="outline" @click="startExtension(record.extensionId)">
              Start
            </AlButton>
            <AlButton size="sm" variant="outline" @click="restartExtension(record.extensionId)">
              Restart
            </AlButton>
            <AlButton size="sm" variant="outline" @click="stopExtension(record.extensionId)">
              Stop
            </AlButton>
          </div>
        </article>
      </div>
    </AlSection>

    <AlSection
      title="Optional Simulators"
      description="Installed optional capability providers from the backend registry."
    >
      <div class="server-list">
        <article class="server-list__item">
          <header>
            <div>
              <h2>AI Simulator</h2>
              <p>Deterministic mock AI capabilities surfaced as optional extension capabilities.</p>
            </div>
            <AlBadge variant="outline">{{ simulatedAi.length }} capabilities</AlBadge>
          </header>
          <dl>
            <div v-for="capability in simulatedAi" :key="capability.id">
              <dt>{{ capability.id }}</dt>
              <dd>{{ capability.description }}</dd>
            </div>
          </dl>
        </article>
        <article class="server-list__item">
          <header>
            <div>
              <h2>MCP Simulator</h2>
              <p>
                Adapter-style MCP tools, resources, and prompts mapped into generic capabilities.
              </p>
            </div>
            <AlBadge variant="outline">{{ simulatedMcp.length }} capabilities</AlBadge>
          </header>
          <dl>
            <div v-for="capability in simulatedMcp" :key="capability.id">
              <dt>{{ capability.id }}</dt>
              <dd>{{ capability.description }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </AlSection>
  </section>
</template>

<style scoped>
.server-tab {
  display: grid;
  gap: 16px;
  min-height: 100%;
  padding: 18px;
}

.server-tab__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.server-tab__header h1,
.server-tab__header p,
.server-list__item h2,
.server-list__item p {
  margin: 0;
}

.server-tab__eyebrow {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.server-tab__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.server-list {
  display: grid;
  gap: 10px;
}

.server-list__item {
  display: grid;
  gap: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  padding: 12px;
}

.server-list__item header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.server-list__item p,
.server-list__item dt {
  color: hsl(var(--muted-foreground));
}

.server-list__item dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.server-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.server-list__item dt,
.server-list__item dd {
  margin: 0;
}

@media (max-width: 900px) {
  .server-tab__stats {
    grid-template-columns: 1fr;
  }
}
</style>

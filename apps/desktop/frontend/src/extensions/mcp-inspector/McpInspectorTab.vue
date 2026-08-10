<script setup lang="ts">
import type {
  ActiveLaneCapabilityRecord,
  WorkbenchRuntimeApi,
  WorkbenchTab,
} from '@activelane/workbench'
import { computed, ref } from 'vue'

defineOptions({ name: 'McpInspectorTab' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
  tab: WorkbenchTab
}>()

const [AlBadge, AlButton, AlEmptyState, AlInput, AlSection, AlStatBlock] =
  props.runtime.workbench.ui.getComponents([
    'AlBadge',
    'AlButton',
    'AlEmptyState',
    'AlInput',
    'AlSection',
    'AlStatBlock',
  ])

const selectedId = ref<string | null>(null)
const input = ref('{}')
const output = ref('')
const error = ref('')
const running = ref(false)

const capabilities = computed<ActiveLaneCapabilityRecord[]>(() =>
  props.runtime.capabilities
    .list()
    .filter((capability) => capability.kind.startsWith('mcp.'))
    .sort((left, right) => left.id.localeCompare(right.id)),
)

const selected = computed(
  () => capabilities.value.find((item) => item.id === selectedId.value) ?? capabilities.value[0],
)

const grouped = computed(() => ({
  tools: capabilities.value.filter((item) => item.kind === 'mcp.tool').length,
  resources: capabilities.value.filter((item) => item.kind === 'mcp.resource').length,
  prompts: capabilities.value.filter((item) => item.kind === 'mcp.prompt').length,
}))

async function invoke(capability: ActiveLaneCapabilityRecord) {
  running.value = true
  error.value = ''
  output.value = ''
  try {
    const parsed = input.value.trim() ? JSON.parse(input.value) : undefined
    const result = await props.runtime.capabilities.invoke(capability.id, parsed)
    output.value = JSON.stringify(result, null, 2)
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : String(unknownError)
  } finally {
    running.value = false
  }
}
</script>

<template>
  <section class="mcp-tab">
    <header class="mcp-tab__header">
      <div>
        <p class="mcp-tab__eyebrow">MCP Runtime</p>
        <h1>{{ tab.title }}</h1>
      </div>
      <AlBadge variant="outline">{{ capabilities.length }} capabilities</AlBadge>
    </header>

    <div class="mcp-tab__stats">
      <AlStatBlock label="Tools" :value="grouped.tools" />
      <AlStatBlock label="Resources" :value="grouped.resources" />
      <AlStatBlock label="Prompts" :value="grouped.prompts" />
      <AlStatBlock
        label="Providers"
        :value="new Set(capabilities.map((item) => item.providerId ?? item.extensionId ?? 'unknown')).size"
      />
      <AlStatBlock label="Host" :value="runtime.context.hostKind" />
    </div>

    <AlEmptyState
      v-if="capabilities.length === 0"
      title="No MCP capabilities registered"
      description="Enable an extension that exposes tools, resources, or actions."
    />

    <div v-else class="mcp-tab__grid">
      <AlSection
        title="Capability Discovery"
        description="MCP-exposed capabilities represented through the generic capability registry."
      >
        <div class="mcp-list">
          <button
            v-for="capability in capabilities"
            :key="capability.id"
            class="mcp-list__item"
            :class="{ 'mcp-list__item--active': selected?.id === capability.id }"
            type="button"
            @click="selectedId = capability.id"
          >
            <span>{{ capability.title }}</span>
            <small
              >{{ capability.kind }}
              · {{ capability.providerId ?? capability.extensionId ?? 'runtime' }}</small
            >
          </button>
        </div>
      </AlSection>

      <AlSection
        title="Invocation"
        :description="selected ? `${selected.kind}: ${selected.id}` : 'Select a capability to invoke.'"
      >
        <div v-if="selected" class="mcp-runner">
          <AlInput v-model="input" aria-label="MCP JSON input" />
          <AlButton :loading="running" @click="invoke(selected)">Invoke</AlButton>
          <pre v-if="output" class="mcp-output">{{ output }}</pre>
          <p v-if="error" class="mcp-error">{{ error }}</p>
        </div>
      </AlSection>
    </div>
  </section>
</template>

<style scoped>
.mcp-tab {
  display: grid;
  gap: 16px;
  min-height: 100%;
  padding: 18px;
}

.mcp-tab__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.mcp-tab__header h1,
.mcp-tab__header p {
  margin: 0;
}

.mcp-tab__eyebrow {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.mcp-tab__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.mcp-tab__grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr);
  gap: 14px;
  min-height: 0;
}

.mcp-list {
  display: grid;
  gap: 8px;
}

.mcp-list__item {
  display: grid;
  gap: 3px;
  width: 100%;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 10px;
  text-align: left;
}

.mcp-list__item--active {
  border-color: hsl(var(--ring));
  background: hsl(var(--accent));
}

.mcp-list__item small {
  color: hsl(var(--muted-foreground));
}

.mcp-runner {
  display: grid;
  gap: 10px;
}

.mcp-output {
  overflow: auto;
  max-height: 360px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--muted));
  padding: 12px;
  font-size: 12px;
}

.mcp-error {
  margin: 0;
  color: hsl(var(--destructive));
}

@media (max-width: 900px) {
  .mcp-tab__stats,
  .mcp-tab__grid {
    grid-template-columns: 1fr;
  }
}
</style>

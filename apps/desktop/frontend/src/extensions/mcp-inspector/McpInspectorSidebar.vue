<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '@activelane/workbench'
import { computed } from 'vue'

defineOptions({ name: 'McpInspectorSidebar' })

const props = defineProps<{
  runtime: WorkbenchRuntimeApi
}>()

const [AlButton, AlSidebarSection, AlStatBlock] = props.runtime.workbench.ui.getComponents([
  'AlButton',
  'AlSidebarSection',
  'AlStatBlock',
])

const capabilities = computed(() =>
  props.runtime.capabilities.list().filter((capability) => capability.kind.startsWith('mcp.')),
)
const providers = computed(() =>
  Array.from(
    new Set(
      capabilities.value.map(
        (capability) => capability.providerId ?? capability.extensionId ?? 'unknown',
      ),
    ),
  ),
)

function openInspector() {
  props.runtime.workbench.openTab({
    id: 'platform.mcp.inspector',
    kind: 'platform.mcp.inspector',
    surfaceId: 'platform.mcp.surface',
    title: 'MCP Inspector',
    ownerExtensionId: 'activelane.mcp-inspector',
    preview: false,
  })
}

function openServerStatus() {
  props.runtime.workbench.openTab({
    id: 'platform.server.status',
    kind: 'platform.server.status',
    surfaceId: 'platform.server.surface',
    title: 'Server Extensions',
    ownerExtensionId: 'activelane.mcp-inspector',
    preview: false,
  })
}
</script>

<template>
  <div class="mcp-sidebar">
    <AlSidebarSection label="Capability Runtime">
      <div class="mcp-sidebar__stats">
        <AlStatBlock label="Host" :value="runtime.context.hostKind" />
        <AlStatBlock label="Capabilities" :value="capabilities.length" />
        <AlStatBlock label="Providers" :value="providers.length" />
      </div>
      <div class="mcp-sidebar__actions">
        <AlButton class="w-full" @click="openInspector">Open Inspector</AlButton>
        <AlButton class="w-full" variant="outline" @click="openServerStatus"
          >Server Extensions</AlButton
        >
      </div>
    </AlSidebarSection>

    <AlSidebarSection label="Providers">
      <ul class="mcp-sidebar__list">
        <li v-for="provider in providers" :key="provider">
          <span>{{ provider }}</span>
          <small
            >{{ capabilities.filter(
              (capability) =>
                (capability.providerId ?? capability.extensionId ?? 'unknown') === provider,
            ).length }}
            capabilities</small
          >
        </li>
      </ul>
    </AlSidebarSection>
  </div>
</template>

<style scoped>
.mcp-sidebar {
  display: grid;
  gap: 14px;
  padding: 10px;
}

.mcp-sidebar__stats,
.mcp-sidebar__actions {
  display: grid;
  gap: 8px;
}

.mcp-sidebar__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mcp-sidebar__list li {
  display: grid;
  gap: 2px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  padding: 8px;
}

.mcp-sidebar__list small {
  color: hsl(var(--muted-foreground));
}
</style>

<script setup lang="ts">
import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench'
import { computed, onUnmounted, ref } from 'vue'
import { API_STUDIO_ENTITLEMENTS } from '../model'
import { useApiStudioStore } from '../runtime'

const props = defineProps<{ tab?: WorkbenchTab | null; runtime: WorkbenchRuntimeApi }>()
const studio = useApiStudioStore()
const PaneSection = props.runtime.workbench.ui.getBlock('PaneSection')
const [Badge, EmptyState, KeyValueList] = props.runtime.workbench.ui.getComponents([
  'Badge',
  'EmptyState',
  'KeyValueList',
])
const request = computed(() => studio.findRequest(String(props.tab?.input?.requestId ?? '')))
const variables = computed(() => Object.entries(studio.activeEnvironment()?.variables ?? {}))
const entitlements = [
  API_STUDIO_ENTITLEMENTS.advancedInspector,
  API_STUDIO_ENTITLEMENTS.unlimitedHistory,
  API_STUDIO_ENTITLEMENTS.unlimitedEnvironments,
]
const entitlementVersion = ref(0)
const entitlementListener = studio.context.entitlements.onDidChange(() => {
  entitlementVersion.value += 1
})
const plan = computed(() => {
  entitlementVersion.value
  return studio.context.entitlements.plan()
})
const requestProperties = computed(() =>
  request.value
    ? [
        { key: 'method', label: 'Method', value: request.value.method },
        { key: 'url', label: 'Resolved URL', value: studio.resolvedUrl(request.value) },
        {
          key: 'environment',
          label: 'Environment',
          value: studio.activeEnvironment()?.name ?? 'None',
        },
        {
          key: 'content-type',
          label: 'Content Type',
          value:
            request.value.body.type === 'json'
              ? 'application/json'
              : request.value.body.type === 'text'
                ? 'text/plain'
                : 'None',
        },
      ]
    : [],
)
const hasEntitlement = (entitlement: string) => {
  entitlementVersion.value
  return studio.context.entitlements.has(entitlement)
}
onUnmounted(() => entitlementListener.dispose())
</script>

<template>
  <div v-if="request" class="inspector">
    <PaneSection title="Request"><KeyValueList :items="requestProperties" /></PaneSection>
    <PaneSection title="Variables">
      <KeyValueList
        v-if="variables.length"
        :items="variables.map(([key, value]) => ({ key, label: key, value }))"
      />
      <EmptyState v-else title="No active variables" />
    </PaneSection>
    <PaneSection title="Entitlements">
      <div class="plan">
        <strong>API Studio {{ plan === 'free' ? 'Free' : 'Pro' }}</strong><Badge>{{ plan }}</Badge>
      </div>
      <div v-for="entitlement in entitlements" :key="entitlement" class="entitlement">
        <span>{{ entitlement.replace('api-studio.', '') }}</span
        ><Badge :tone="hasEntitlement(entitlement) ? 'success' : 'neutral'"
          >{{ hasEntitlement(entitlement) ? 'Enabled' : 'Unavailable' }}</Badge
        >
      </div>
    </PaneSection>
  </div>
</template>

<style scoped>
.inspector {
  display: grid;
  padding: 4px;
  font-size: 11px;
  color: var(--foreground);
}
.plan,
.entitlement {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px;
}
</style>

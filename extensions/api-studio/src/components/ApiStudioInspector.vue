<script setup lang="ts">
import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench'
import { computed, onUnmounted, ref } from 'vue'
import { API_STUDIO_ENTITLEMENTS } from '../model'
import { useApiStudioStore } from '../runtime'

const props = defineProps<{ tab?: WorkbenchTab | null; runtime: WorkbenchRuntimeApi }>()
const studio = useApiStudioStore()
const request = computed(() => studio.findRequest(String(props.tab?.input?.requestId ?? '')))
const variables = computed(() => Object.entries(studio.activeEnvironment()?.variables ?? {}))
const entitlements = [API_STUDIO_ENTITLEMENTS.advancedInspector, API_STUDIO_ENTITLEMENTS.unlimitedHistory, API_STUDIO_ENTITLEMENTS.unlimitedEnvironments]
const entitlementVersion = ref(0)
const entitlementListener = studio.context.entitlements.onDidChange(() => { entitlementVersion.value += 1 })
const plan = computed(() => { entitlementVersion.value; return studio.context.entitlements.plan() })
const hasEntitlement = (entitlement: string) => { entitlementVersion.value; return studio.context.entitlements.has(entitlement) }
onUnmounted(() => entitlementListener.dispose())
</script>

<template>
  <div v-if="request" class="inspector">
    <section><h4>REQUEST</h4><dl><dt>Method</dt><dd class="method">{{ request.method }}</dd><dt>Resolved URL</dt><dd class="mono wrap">{{ studio.resolvedUrl(request) }}</dd><dt>Environment</dt><dd>{{ studio.activeEnvironment()?.name ?? 'None' }}</dd><dt>Content Type</dt><dd>{{ request.body.type === 'json' ? 'application/json' : request.body.type === 'text' ? 'text/plain' : 'None' }}</dd></dl></section>
    <section><h4>VARIABLES</h4><div v-for="([key, value]) in variables" :key="key" class="variable"><code>{{ key }}</code><span>→</span><span class="wrap">{{ value }}</span></div><p v-if="!variables.length" class="muted">No active variables.</p></section>
    <section><h4>ENTITLEMENTS</h4><div class="plan"><span class="plan-dot" /><strong>API Studio {{ plan === 'free' ? 'Free' : 'Pro' }}</strong><small>{{ plan }}</small></div><div v-for="entitlement in entitlements" :key="entitlement" class="entitlement"><span>{{ entitlement.replace('api-studio.', '') }}</span><b :class="{ on: hasEntitlement(entitlement) }">{{ hasEntitlement(entitlement) ? '✓' : '—' }}</b></div></section>
  </div>
</template>

<style scoped>
.inspector{display:grid;gap:10px;padding:10px;font-size:11px;color:var(--foreground)}section{border:1px solid var(--border);border-radius:6px;background:var(--card);padding:10px}h4{margin:0 0 10px;color:var(--muted-foreground);font-size:9px;letter-spacing:.12em}dl{display:grid;grid-template-columns:78px 1fr;gap:8px;margin:0}dt{color:var(--muted-foreground)}dd{margin:0}.method{font-weight:800;color:#63d391}.mono,code{font-family:ui-monospace,monospace}.wrap{overflow-wrap:anywhere}.variable{display:grid;grid-template-columns:auto 15px 1fr;gap:5px;padding:4px 0}.variable code{color:#61afef}.plan{display:flex;align-items:center;gap:7px;margin-bottom:9px}.plan small{margin-left:auto;color:var(--muted-foreground)}.plan-dot{width:7px;height:7px;border-radius:50%;background:#63d391}.entitlement{display:flex;justify-content:space-between;padding:4px 0;color:var(--muted-foreground)}.entitlement b.on{color:#63d391}.muted{color:var(--muted-foreground)}
</style>

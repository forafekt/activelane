<script setup lang="ts">
import { useApiStudioStore } from '../runtime'
const studio = useApiStudioStore()
const time = (value: string) => new Date(value).toLocaleTimeString([], { hour12: false })
</script>

<template>
  <div class="request-log">
    <div class="log-head"><span>Time</span><span>Method</span><span>Request</span><span>Status</span><span>Duration</span></div>
    <button v-for="entry in studio.state.history" :key="entry.id" class="log-row" @click="studio.openRequest(entry.requestId)"><time>{{ time(entry.timestamp) }}</time><b :class="`method-${entry.method.toLowerCase()}`">{{ entry.method }}</b><span class="truncate">{{ entry.url }}</span><strong :class="(entry.responseStatus ?? 500) < 400 ? 'good' : 'bad'">{{ entry.responseStatus ?? 'ERR' }}</strong><span>{{ entry.durationMs }} ms</span></button>
    <div v-if="!studio.state.history.length" class="empty">Request execution details will appear here.</div>
  </div>
</template>

<style scoped>
.request-log{height:100%;overflow:auto;padding:7px 12px;color:var(--foreground);font:11px ui-monospace,monospace}.log-head,.log-row{display:grid;grid-template-columns:82px 62px 1fr 70px 75px;gap:8px;align-items:center;min-height:27px;text-align:left}.log-head{position:sticky;top:0;background:var(--background);color:var(--muted-foreground);font-size:9px;text-transform:uppercase}.log-row{width:100%;border-top:1px solid var(--border)}.log-row:hover{background:var(--accent)}.method-get{color:#63d391}.method-post{color:#ffb454}.method-delete{color:#ef6b73}.method-put,.method-patch{color:#61afef}.good{color:#63d391}.bad{color:#ef6b73}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.empty{padding:25px;text-align:center;color:var(--muted-foreground)}
</style>

<script setup lang="ts">
import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench'
import { computed, ref, watch } from 'vue'
import { useApiStudioStore } from '../runtime'

const props = defineProps<{ tab: WorkbenchTab; runtime: WorkbenchRuntimeApi }>()
const studio = useApiStudioStore()
const requestId = computed(() => String(props.tab.input?.requestId ?? ''))
const request = computed(() => studio.findRequest(requestId.value))
const response = computed(() => studio.responses[requestId.value])
const requestSection = ref<'params' | 'headers' | 'body' | 'auth'>('params')
const responseSection = ref<'body' | 'headers' | 'metadata'>('body')
const sending = ref(false)

watch(requestId, (value) => { studio.selectedRequestId = value }, { immediate: true })
async function send() { sending.value = true; await studio.send(requestId.value); sending.value = false; props.runtime.workbench.setBottomPanelOpen(true); props.runtime.workbench.setActiveBottomPanelView('api-studio.request-log') }
const addPair = (kind: 'query' | 'headers') => request.value?.[kind].push({ key: '', value: '', enabled: true })
const formatBytes = (value: number) => value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KB`
</script>

<template>
  <div v-if="request" class="request-editor">
    <header class="request-bar">
      <select v-model="request.method" class="method-select" @change="studio.save()"><option v-for="method in ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']" :key="method">{{ method }}</option></select>
      <input v-model="request.url" class="url-input" spellcheck="false" @change="studio.save()" @keydown.enter="send" />
      <button class="save-button" title="Save request" @click="studio.save()">Save</button>
      <button class="send-button" :disabled="sending" @click="send">{{ sending ? 'Sending…' : 'Send' }}</button>
    </header>
    <div class="resolved-url">Resolved: <span>{{ studio.resolvedUrl(request) }}</span></div>

    <section class="request-config">
      <nav class="tabs"><button v-for="item in ['params','headers','body','auth'] as const" :key="item" :class="{ active: requestSection === item }" @click="requestSection = item">{{ item }}<b v-if="item === 'params' && request.query.length">{{ request.query.length }}</b><b v-if="item === 'headers' && request.headers.length">{{ request.headers.length }}</b></button></nav>
      <div v-if="requestSection === 'params' || requestSection === 'headers'" class="pair-editor">
        <div class="pair-editor__head"><span></span><span>Key</span><span>Value</span><span></span></div>
        <div v-for="(pair, index) in requestSection === 'params' ? request.query : request.headers" :key="index" class="pair-row">
          <input v-model="pair.enabled" type="checkbox" /><input v-model="pair.key" placeholder="key" @change="studio.save()" /><input v-model="pair.value" placeholder="value" @change="studio.save()" /><button @click="(requestSection === 'params' ? request.query : request.headers).splice(index, 1); studio.save()">×</button>
        </div>
        <button class="add-row" @click="addPair(requestSection === 'params' ? 'query' : 'headers')">＋ Add {{ requestSection === 'params' ? 'parameter' : 'header' }}</button>
      </div>
      <div v-else-if="requestSection === 'body'" class="body-editor">
        <div class="body-types"><label v-for="type in ['none','json','text'] as const" :key="type"><input v-model="request.body.type" type="radio" :value="type" @change="studio.save()" /> {{ type === 'none' ? 'None' : type.toUpperCase() }}</label></div>
        <textarea v-if="request.body.type !== 'none'" v-model="request.body.value" :placeholder="request.body.type === 'json' ? '{\n  &quot;name&quot;: &quot;Ada&quot;\n}' : 'Request body'" spellcheck="false" @change="studio.save()" />
        <div v-else class="empty-pane">This request does not have a body.</div>
      </div>
      <div v-else class="empty-pane"><strong>Authorization</strong><p>Use request headers for bearer tokens and API keys. Dedicated OAuth flows are planned.</p></div>
    </section>

    <section class="response-pane">
      <header class="response-header"><strong>Response</strong><template v-if="response"><span :class="response.status >= 400 || response.error ? 'bad' : 'good'">{{ response.status || 'ERR' }} {{ response.statusText }}</span><span>{{ response.durationMs }} ms</span><span>{{ formatBytes(response.sizeBytes) }}</span></template><span v-else class="muted">Send the request to inspect its response.</span></header>
      <nav class="tabs"><button v-for="item in ['body','headers','metadata'] as const" :key="item" :class="{ active: responseSection === item }" @click="responseSection = item">{{ item }}</button></nav>
      <pre v-if="response && responseSection === 'body'" class="response-body">{{ response.body || '(empty response)' }}</pre>
      <div v-else-if="response && responseSection === 'headers'" class="response-headers"><div v-for="header in response.headers" :key="header.key"><span>{{ header.key }}</span><code>{{ header.value }}</code></div></div>
      <div v-else-if="response && responseSection === 'metadata'" class="metadata"><div><span>Content type</span><strong>{{ response.contentType || 'Unknown' }}</strong></div><div><span>Size</span><strong>{{ formatBytes(response.sizeBytes) }}</strong></div><div><span>Duration</span><strong>{{ response.durationMs }} ms</strong></div></div>
      <div v-else class="empty-response"><span>↗</span><strong>No response yet</strong><small>Configure the request above and press Send.</small></div>
    </section>
  </div>
  <div v-else class="empty-response">Request not found.</div>
</template>

<style scoped>
.request-editor{display:grid;height:100%;grid-template-rows:auto auto minmax(180px,42%) 1fr;background:var(--background);color:var(--foreground);font-size:12px}.request-bar{display:flex;gap:7px;padding:14px 16px 8px}.method-select,.url-input,.save-button,.send-button{height:34px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--foreground)}.method-select{width:105px;padding:0 9px;font-weight:800;color:#63d391}.url-input{min-width:0;flex:1;padding:0 11px;font-family:ui-monospace,monospace}.save-button{padding:0 13px}.send-button{min-width:82px;border-color:#1687b8;background:#1687b8;color:white;font-weight:700}.resolved-url{padding:0 18px 10px;color:var(--muted-foreground);font-size:10px}.resolved-url span{font-family:ui-monospace,monospace;color:var(--foreground)}.request-config,.response-pane{min-height:0;border-top:1px solid var(--border)}.tabs{display:flex;height:35px;gap:18px;padding:0 16px;border-bottom:1px solid var(--border)}.tabs button{position:relative;color:var(--muted-foreground);text-transform:capitalize}.tabs button.active{color:var(--foreground)}.tabs button.active:after{position:absolute;right:0;bottom:-1px;left:0;height:2px;background:#1c9bd1;content:''}.tabs b{margin-left:5px;border-radius:8px;background:var(--accent);padding:1px 5px;font-size:9px}.pair-editor{padding:8px 16px}.pair-editor__head,.pair-row{display:grid;grid-template-columns:25px 1fr 1fr 25px}.pair-editor__head{color:var(--muted-foreground);font-size:10px}.pair-row input:not([type=checkbox]){min-width:0;border:1px solid var(--border);background:var(--card);padding:7px;color:var(--foreground)}.pair-row button,.add-row{color:var(--muted-foreground)}.add-row{padding:8px}.body-types{display:flex;gap:17px;padding:9px 16px}.body-editor textarea{width:calc(100% - 32px);height:115px;margin:0 16px;resize:none;border:1px solid var(--border);border-radius:5px;background:#15191f;padding:10px;color:#d8dee9;font-family:ui-monospace,monospace}.empty-pane{padding:18px;color:var(--muted-foreground)}.response-pane{display:grid;grid-template-rows:38px 35px 1fr}.response-header{display:flex;align-items:center;gap:16px;padding:0 16px}.response-header strong{margin-right:auto}.good{color:#63d391}.bad{color:#ef6b73}.muted{color:var(--muted-foreground)}.response-body{min-height:0;overflow:auto;margin:0;background:#15191f;padding:15px;color:#d8dee9;font:11px/1.6 ui-monospace,monospace;white-space:pre-wrap}.response-headers{overflow:auto;padding:10px 16px}.response-headers div,.metadata div{display:grid;grid-template-columns:180px 1fr;padding:6px;border-bottom:1px solid var(--border)}.response-headers span,.metadata span{color:var(--muted-foreground)}.metadata{padding:12px 16px}.empty-response{display:grid;place-content:center;justify-items:center;gap:5px;color:var(--muted-foreground)}.empty-response>span{font-size:28px}.empty-response small{font-size:10px}
</style>

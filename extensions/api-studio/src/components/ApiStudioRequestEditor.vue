<script setup lang="ts">
import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench'
import { computed, ref, watch } from 'vue'
import { useApiStudioStore } from '../runtime'

const props = defineProps<{ tab: WorkbenchTab; runtime: WorkbenchRuntimeApi }>()
const studio = useApiStudioStore()
const [Button, Checkbox, EmptyState, Input, Select, Tabs, Textarea] =
  props.runtime.workbench.ui.getComponents([
    'Button',
    'Checkbox',
    'EmptyState',
    'Input',
    'Select',
    'Tabs',
    'Textarea',
  ])
const requestTabs = ['params', 'headers', 'body', 'auth'].map((value) => ({
  value,
  label: value,
}))
const responseTabs = ['body', 'headers', 'metadata'].map((value) => ({ value, label: value }))
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((value) => ({
  value,
  label: value,
}))
const requestId = computed(() => String(props.tab.input?.requestId ?? ''))
const request = computed(() => studio.findRequest(requestId.value))
const response = computed(() => studio.responses[requestId.value])
const requestSection = ref<'params' | 'headers' | 'body' | 'auth'>('params')
const responseSection = ref<'body' | 'headers' | 'metadata'>('body')
const sending = ref(false)

watch(
  requestId,
  (value) => {
    studio.selectedRequestId = value
  },
  { immediate: true },
)
async function send() {
  sending.value = true
  await studio.send(requestId.value)
  sending.value = false
  props.runtime.workbench.setBottomPanelOpen(true)
  props.runtime.workbench.setActiveBottomPanelView('api-studio.request-log')
}
const addPair = (kind: 'query' | 'headers') =>
  request.value?.[kind].push({ key: '', value: '', enabled: true })
const formatBytes = (value: number) =>
  value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KB`
</script>

<template>
  <div v-if="request" class="request-editor">
    <header class="request-bar">
      <Select
        v-model="request.method"
        class="method-select"
        :options="methodOptions"
        @update:model-value="studio.save()"
      />
      <Input
        v-model="request.url"
        class="url-input"
        spellcheck="false"
        @change="studio.save()"
        @keydown.enter="send"
      />
      <Button variant="outline" title="Save request" @click="studio.save()">Save</Button>
      <Button :loading="sending" tone="primary" @click="send">Send</Button>
    </header>
    <div class="resolved-url">Resolved: <span>{{ studio.resolvedUrl(request) }}</span></div>

    <section class="request-config">
      <Tabs v-model="requestSection" :tabs="requestTabs" class="request-tabs" />
      <div v-if="requestSection === 'params' || requestSection === 'headers'" class="pair-editor">
        <div class="pair-editor__head">
          <span></span><span>Key</span><span>Value</span><span></span>
        </div>
        <div
          v-for="(pair, index) in requestSection === 'params' ? request.query : request.headers"
          :key="index"
          class="pair-row"
        >
          <Checkbox v-model="pair.enabled" />
          <Input v-model="pair.key" placeholder="key" @change="studio.save()" />
          <Input v-model="pair.value" placeholder="value" @change="studio.save()" />
          <Button
            variant="ghost"
            size="icon-xs"
            @click="(requestSection === 'params' ? request.query : request.headers).splice(index, 1); studio.save()"
            >×</Button
          >
        </div>
        <Button
          variant="ghost"
          size="sm"
          @click="addPair(requestSection === 'params' ? 'query' : 'headers')"
          >＋ Add {{ requestSection === 'params' ? 'parameter' : 'header' }}</Button
        >
      </div>
      <div v-else-if="requestSection === 'body'" class="body-editor">
        <div class="body-types">
          <label v-for="type in ['none','json','text'] as const" :key="type"
            ><input v-model="request.body.type" type="radio" :value="type" @change="studio.save()">
            {{ type === 'none' ? 'None' : type.toUpperCase() }}</label
          >
        </div>
        <Textarea
          v-if="request.body.type !== 'none'"
          v-model="request.body.value"
          :placeholder="request.body.type === 'json' ? '{\n  &quot;name&quot;: &quot;Ada&quot;\n}' : 'Request body'"
          class="body-textarea"
          spellcheck="false"
          @change="studio.save()"
        />
        <EmptyState
          v-else
          title="No request body"
          description="This request does not have a body."
        />
      </div>
      <div v-else class="empty-pane">
        <strong>Authorization</strong>
        <p>
          Use request headers for bearer tokens and API keys. Dedicated OAuth flows are planned.
        </p>
      </div>
    </section>

    <section class="response-pane">
      <header class="response-header">
        <strong>Response</strong
        ><template v-if="response"
          ><span :class="response.status >= 400 || response.error ? 'bad' : 'good'"
            >{{ response.status || 'ERR' }} {{ response.statusText }}</span
          ><span>{{ response.durationMs }} ms</span
          ><span>{{ formatBytes(response.sizeBytes) }}</span></template
        ><span v-else class="muted">Send the request to inspect its response.</span>
      </header>
      <Tabs v-model="responseSection" :tabs="responseTabs" class="response-tabs" />
      <pre
        v-if="response && responseSection === 'body'"
        class="response-body"
      >{{ response.body || '(empty response)' }}</pre>
      <div v-else-if="response && responseSection === 'headers'" class="response-headers">
        <div v-for="header in response.headers" :key="header.key">
          <span>{{ header.key }}</span><code>{{ header.value }}</code>
        </div>
      </div>
      <div v-else-if="response && responseSection === 'metadata'" class="metadata">
        <div><span>Content type</span><strong>{{ response.contentType || 'Unknown' }}</strong></div>
        <div><span>Size</span><strong>{{ formatBytes(response.sizeBytes) }}</strong></div>
        <div><span>Duration</span><strong>{{ response.durationMs }} ms</strong></div>
      </div>
      <EmptyState
        v-else
        title="No response yet"
        description="Configure the request above and press Send."
      />
    </section>
  </div>
  <EmptyState
    v-else
    title="Request not found"
    description="The request may have been removed from its collection."
  />
</template>

<style scoped>
.request-editor {
  display: grid;
  height: 100%;
  grid-template-rows: auto auto minmax(180px, 42%) 1fr;
  background: var(--background);
  color: var(--foreground);
  font-size: 12px;
}
.request-bar {
  display: flex;
  gap: 7px;
  padding: 14px 16px 8px;
}
.method-select {
  width: 105px;
}
.url-input {
  min-width: 0;
  flex: 1;
  font-family: ui-monospace, monospace;
}
.resolved-url {
  padding: 0 18px 10px;
  color: var(--muted-foreground);
  font-size: 10px;
}
.resolved-url span {
  font-family: ui-monospace, monospace;
  color: var(--foreground);
}
.request-config,
.response-pane {
  min-height: 0;
  border-top: 1px solid var(--border);
}
.request-tabs,
.response-tabs {
  padding: 6px 16px 0;
}
.pair-editor {
  padding: 8px 16px;
}
.pair-editor__head,
.pair-row {
  display: grid;
  grid-template-columns: 25px 1fr 1fr 25px;
  align-items: center;
}
.pair-editor__head {
  color: var(--muted-foreground);
  font-size: 10px;
}
.body-types {
  display: flex;
  gap: 17px;
  padding: 9px 16px;
}
.body-textarea {
  width: calc(100% - 32px);
  height: 115px;
  margin: 0 16px;
  resize: none;
  font-family: ui-monospace, monospace;
}
.response-pane {
  display: grid;
  grid-template-rows: 38px auto 1fr;
}
.response-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
}
.response-header strong {
  margin-right: auto;
}
.good {
  color: #63d391;
}
.bad {
  color: #ef6b73;
}
.muted {
  color: var(--muted-foreground);
}
.response-body {
  min-height: 0;
  overflow: auto;
  margin: 0;
  background: #15191f;
  padding: 15px;
  color: #d8dee9;
  font:
    11px / 1.6 ui-monospace,
    monospace;
  white-space: pre-wrap;
}
.response-headers {
  overflow: auto;
  padding: 10px 16px;
}
.response-headers div,
.metadata div {
  display: grid;
  grid-template-columns: 180px 1fr;
  padding: 6px;
  border-bottom: 1px solid var(--border);
}
.response-headers span,
.metadata span {
  color: var(--muted-foreground);
}
.metadata {
  padding: 12px 16px;
}
</style>

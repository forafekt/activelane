<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApiStudioStore } from '../runtime'

const studio = useApiStudioStore()
const expanded = ref<Record<string, boolean>>({ 'collection-example': true, 'collection-mine': true })
const section = ref<'collections' | 'environments' | 'history'>('collections')
const activeEnvironment = computed(() => studio.activeEnvironment()?.id)
const methodClass = (method: string) => `method method-${method.toLowerCase()}`

async function rename(requestId: string, current: string) {
  const value = window.prompt('Rename request', current)
  if (value) await studio.renameRequest(requestId, value)
}
</script>

<template>
  <div class="api-sidebar">
    <div class="api-sidebar__switcher">
      <button v-for="item in ['collections', 'environments', 'history'] as const" :key="item" :class="{ active: section === item }" @click="section = item">{{ item }}</button>
    </div>

    <div v-if="section === 'collections'" class="api-sidebar__body">
      <div class="section-title"><span>COLLECTIONS</span><button title="New collection" @click="studio.newCollection()">＋</button></div>
      <div v-for="collection in studio.state.collections" :key="collection.id" class="collection">
        <div class="collection__row">
          <button class="collection__toggle" @click="expanded[collection.id] = !expanded[collection.id]">{{ expanded[collection.id] ? '⌄' : '›' }}</button>
          <button class="collection__name" @click="expanded[collection.id] = !expanded[collection.id]">{{ collection.name }}</button>
          <button title="New request" @click="studio.newRequest(collection.id)">＋</button>
          <button title="Delete collection" @click="studio.deleteCollection(collection.id)">⋯</button>
        </div>
        <div v-if="expanded[collection.id]" class="request-list">
          <div v-for="request in collection.requests" :key="request.id" class="request-row" @dblclick="studio.openRequest(request.id)">
            <button class="request-row__main" @click="studio.openRequest(request.id, true)">
              <span :class="methodClass(request.method)">{{ request.method }}</span>
              <span class="truncate">{{ request.name }}</span>
            </button>
            <div class="request-row__actions">
              <button title="Duplicate" @click="studio.duplicateRequest(request.id)">⧉</button>
              <button title="Rename" @click="rename(request.id, request.name)">✎</button>
              <button title="Delete" @click="studio.deleteRequest(request.id)">×</button>
            </div>
          </div>
          <button v-if="!collection.requests.length" class="empty-action" @click="studio.newRequest(collection.id)">＋ Add request</button>
        </div>
      </div>
    </div>

    <div v-else-if="section === 'environments'" class="api-sidebar__body">
      <div class="section-title"><span>ENVIRONMENTS</span><button title="New environment" @click="studio.addEnvironment({ id: `environment-${Date.now()}`, name: 'New Environment', variables: {} })">＋</button></div>
      <button v-for="environment in studio.state.environments" :key="environment.id" class="environment-row" :class="{ active: activeEnvironment === environment.id }" @click="studio.selectEnvironment(environment.id)">
        <span class="environment-dot" />
        <span>{{ environment.name }}</span>
        <small>{{ Object.keys(environment.variables).length }} vars</small>
      </button>
      <div v-if="studio.activeEnvironment()" class="variables-card">
        <div class="variables-card__title">{{ studio.activeEnvironment()?.name }} variables</div>
        <label v-for="(_, key) in studio.activeEnvironment()?.variables" :key="key"><span>{{ key }}</span><input v-model="studio.activeEnvironment()!.variables[key]" @change="studio.save()" /></label>
      </div>
    </div>

    <div v-else class="api-sidebar__body">
      <div class="section-title"><span>RECENT REQUESTS</span><button title="Clear history" @click="studio.clearHistory()">Clear</button></div>
      <button v-for="entry in studio.state.history" :key="entry.id" class="history-row" @click="studio.openRequest(entry.requestId)">
        <span :class="methodClass(entry.method)">{{ entry.method }}</span><span class="truncate">{{ entry.requestName }}</span><small>{{ entry.responseStatus ?? 'ERR' }}</small>
      </button>
      <div v-if="!studio.state.history.length" class="empty-state">Send a request and it will appear here.</div>
    </div>
  </div>
</template>

<style scoped>
.api-sidebar{height:100%;min-height:0;color:var(--foreground);font-size:12px}.api-sidebar__switcher{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:6px;border-bottom:1px solid var(--border)}.api-sidebar__switcher button{padding:6px 3px;border-radius:5px;text-transform:capitalize;color:var(--muted-foreground)}.api-sidebar__switcher button.active{background:var(--accent);color:var(--foreground)}.api-sidebar__body{padding:8px 6px}.section-title{display:flex;align-items:center;justify-content:space-between;padding:5px 7px;font-size:10px;font-weight:700;letter-spacing:.09em;color:var(--muted-foreground)}.section-title button,.collection button,.request-row button{border:0;background:transparent;color:inherit}.collection__row{display:flex;align-items:center;gap:3px;min-height:29px;border-radius:5px}.collection__row:hover{background:var(--accent)}.collection__toggle{width:20px}.collection__name{flex:1;text-align:left;font-weight:600}.request-list{margin-left:13px;border-left:1px solid var(--border);padding-left:4px}.request-row{display:flex;align-items:center;border-radius:4px}.request-row:hover{background:var(--accent)}.request-row__main{display:flex;min-width:0;flex:1;align-items:center;gap:7px;padding:6px;text-align:left}.request-row__actions{display:none;gap:1px;padding-right:3px}.request-row:hover .request-row__actions{display:flex}.request-row__actions button{padding:2px}.method{width:32px;font-size:9px;font-weight:800}.method-get{color:#63d391}.method-post{color:#ffb454}.method-put,.method-patch{color:#61afef}.method-delete{color:#ef6b73}.empty-action,.empty-state{padding:10px;color:var(--muted-foreground)}.environment-row,.history-row{display:flex;width:100%;align-items:center;gap:8px;border-radius:5px;padding:8px;text-align:left}.environment-row:hover,.environment-row.active,.history-row:hover{background:var(--accent)}.environment-row small,.history-row small{margin-left:auto;color:var(--muted-foreground)}.environment-dot{width:7px;height:7px;border-radius:50%;background:#6bd38f}.variables-card{margin-top:10px;border:1px solid var(--border);border-radius:6px;padding:9px}.variables-card__title{margin-bottom:8px;font-weight:600}.variables-card label{display:grid;gap:4px;margin-top:6px}.variables-card label span{font-size:10px;color:var(--muted-foreground)}.variables-card input{width:100%;border:1px solid var(--border);border-radius:4px;background:var(--background);padding:6px}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>

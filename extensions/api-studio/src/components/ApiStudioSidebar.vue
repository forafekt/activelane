<script setup lang="ts">
import type { WorkbenchRuntimeApi } from '@activelane/workbench'
import { computed, ref } from 'vue'
import { useApiStudioStore } from '../runtime'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const studio = useApiStudioStore()
const [ResourceListPane, PaneSection, ResourceList, ResourceListItem] =
  props.runtime.workbench.ui.getBlocks([
    'ResourceListPane',
    'PaneSection',
    'ResourceList',
    'ResourceListItem',
  ])
const [Button, EmptyState, IconButton, Input] = props.runtime.workbench.ui.getComponents([
  'Button',
  'EmptyState',
  'IconButton',
  'Input',
])
const ChevronDown = props.runtime.workbench.ui.getIcon('lucide:chevron-down')
const ChevronRight = props.runtime.workbench.ui.getIcon('lucide:chevron-right')
const Copy = props.runtime.workbench.ui.getIcon('lucide:copy')
const Edit = props.runtime.workbench.ui.getIcon('lucide:pencil')
const Plus = props.runtime.workbench.ui.getIcon('lucide:plus')
const Trash = props.runtime.workbench.ui.getIcon('lucide:trash-2')

const expanded = ref<Record<string, boolean>>({
  'collection-example': true,
  'collection-mine': true,
})
const section = ref<'collections' | 'environments' | 'history'>('collections')
const search = ref('')
const activeEnvironment = computed(() => studio.activeEnvironment()?.id)
const normalizedSearch = computed(() => search.value.trim().toLocaleLowerCase())
const collections = computed(() =>
  studio.state.collections
    .map((collection) => ({
      ...collection,
      requests: collection.requests.filter((request) =>
        request.name.toLocaleLowerCase().includes(normalizedSearch.value),
      ),
    }))
    .filter((collection) =>
      normalizedSearch.value
        ? collection.name.toLocaleLowerCase().includes(normalizedSearch.value) ||
          collection.requests.length > 0
        : true,
    ),
)

async function rename(requestId: string, current: string) {
  const value = window.prompt('Rename request', current)
  if (value) await studio.renameRequest(requestId, value)
}
function updateVariable(key: string, value: string) {
  const environment = studio.activeEnvironment()
  if (!environment) return
  environment.variables[key] = value
  void studio.save()
}
</script>

<template>
  <ResourceListPane
    v-model:search="search"
    v-model:active-tab="section"
    search-placeholder="Search requests and collections"
    :tabs="[
      { value: 'collections', label: 'Collections' },
      { value: 'environments', label: 'Environments' },
      { value: 'history', label: 'History' },
    ]"
  >
    <template #tab-collections>
      <PaneSection title="Collections" :count="studio.state.collections.length">
        <template #actions
          ><IconButton
            label="New collection"
            :icon="Plus"
            @click="studio.newCollection()"
          /></template
        >
        <ResourceList>
          <template v-for="collection in collections" :key="collection.id">
            <ResourceListItem
              :title="collection.name"
              :badge="collection.requests.length"
              @select="expanded[collection.id] = !expanded[collection.id]"
            >
              <template #actions>
                <IconButton
                  label="New request"
                  :icon="Plus"
                  @click="studio.newRequest(collection.id)"
                />
                <IconButton
                  label="Delete collection"
                  :icon="Trash"
                  @click="studio.deleteCollection(collection.id)"
                />
              </template>
              <component
                :is="expanded[collection.id] ? ChevronDown : ChevronRight"
                class="order-first size-3.5"
              />
            </ResourceListItem>
            <ResourceList v-if="expanded[collection.id]">
              <ResourceListItem
                v-for="request in collection.requests"
                :key="request.id"
                :title="request.name"
                :badge="request.method"
                :depth="1"
                @select="studio.openRequest(request.id, true)"
                @dblclick="studio.openRequest(request.id)"
              >
                <template #actions>
                  <IconButton
                    label="Duplicate request"
                    :icon="Copy"
                    @click="studio.duplicateRequest(request.id)"
                  />
                  <IconButton
                    label="Rename request"
                    :icon="Edit"
                    @click="rename(request.id, request.name)"
                  />
                  <IconButton
                    label="Delete request"
                    :icon="Trash"
                    @click="studio.deleteRequest(request.id)"
                  />
                </template>
              </ResourceListItem>
              <Button
                v-if="!collection.requests.length"
                variant="ghost"
                size="sm"
                :leading-icon="Plus"
                @click="studio.newRequest(collection.id)"
                >Add request</Button
              >
            </ResourceList>
          </template>
        </ResourceList>
        <EmptyState
          v-if="!collections.length"
          title="No matching resources"
          description="Try a different search term."
        />
      </PaneSection>
    </template>

    <template #tab-environments>
      <PaneSection title="Environments" :count="studio.state.environments.length">
        <template #actions>
          <IconButton
            label="New environment"
            :icon="Plus"
            @click="studio.addEnvironment({ id: `environment-${Date.now()}`, name: 'New Environment', variables: {} })"
          />
        </template>
        <ResourceList>
          <ResourceListItem
            v-for="environment in studio.state.environments"
            :key="environment.id"
            :title="environment.name"
            :description="`${Object.keys(environment.variables).length} variables`"
            :selected="activeEnvironment === environment.id"
            @select="studio.selectEnvironment(environment.id)"
          />
        </ResourceList>
      </PaneSection>
      <PaneSection
        v-if="studio.activeEnvironment()"
        :title="`${studio.activeEnvironment()?.name} variables`"
      >
        <div
          v-for="(_, key) in studio.activeEnvironment()?.variables"
          :key="key"
          class="grid gap-1 p-2 text-xs text-muted-foreground"
        >
          <span>{{ key }}</span>
          <Input
            :model-value="studio.activeEnvironment()?.variables[key]"
            @update:model-value="updateVariable(String(key), $event)"
          />
        </div>
      </PaneSection>
    </template>

    <template #tab-history>
      <PaneSection title="Recent requests" :count="studio.state.history.length">
        <template #actions
          ><Button variant="ghost" size="sm" @click="studio.clearHistory()">Clear</Button></template
        >
        <ResourceList>
          <ResourceListItem
            v-for="entry in studio.state.history"
            :key="entry.id"
            :title="entry.requestName"
            :description="entry.url"
            :badge="entry.responseStatus ?? 'ERR'"
            @select="studio.openRequest(entry.requestId)"
          />
        </ResourceList>
        <EmptyState
          v-if="!studio.state.history.length"
          title="No request history"
          description="Sent requests will appear here."
        />
      </PaneSection>
    </template>
  </ResourceListPane>
</template>

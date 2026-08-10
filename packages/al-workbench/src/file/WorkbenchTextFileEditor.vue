<script setup lang="ts">
import type { WorkbenchRuntimeApi, WorkbenchTab } from '@activelane/workbench-api'
import { computed, ref, watch } from 'vue'

defineOptions({ name: 'WorkbenchTextFileEditor' })

const props = defineProps<{
  tab: WorkbenchTab
  runtime: WorkbenchRuntimeApi
}>()

const content = ref(String(props.tab.input?.contents ?? ''))
const path = computed(() => (typeof props.tab.input?.path === 'string' ? props.tab.input.path : ''))

let autosaveTimer: number | undefined

watch(
  () => props.tab.id,
  () => {
    content.value = String(props.tab.input?.contents ?? '')
  },
)

watch(content, (value) => {
  props.tab.input = {
    ...(props.tab.input ?? {}),
    contents: value,
  }
  props.runtime.workbench.markTabDirty(props.tab.id, true, props.tab.groupId)
  scheduleAutoSave()
})

function scheduleAutoSave() {
  if (!props.runtime.settings.get<boolean>('files.autoSave', false)) return
  if (!path.value) return
  if (autosaveTimer) window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    void props.runtime.commands.execute('workbench.file.save')
  }, 900)
}
</script>

<template>
  <section class="wb-text-file-editor" :aria-label="tab.title">
    <div class="wb-text-file-editor__bar">
      <span class="wb-text-file-editor__title">{{ tab.title }}</span>
      <span class="wb-text-file-editor__path">{{ path || 'Untitled' }}</span>
    </div>
    <textarea
      v-model="content"
      class="wb-text-file-editor__input"
      spellcheck="false"
      :aria-label="`Edit ${tab.title}`"
    />
  </section>
</template>

<style scoped>
.wb-text-file-editor {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  background: var(--background);
  color: var(--foreground);
}

.wb-text-file-editor__bar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--border);
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
}

.wb-text-file-editor__title {
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-text-file-editor__path {
  min-width: 0;
  overflow: hidden;
  color: var(--muted-foreground);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-text-file-editor__input {
  width: 100%;
  height: 100%;
  min-height: 0;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: inherit;
  padding: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.8125rem;
  line-height: 1.55;
}
</style>

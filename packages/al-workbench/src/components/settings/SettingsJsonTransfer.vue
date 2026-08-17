<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { AlButton } from '@activelane/shadcn'

const Download = getIcon('lucide.download')
const Upload = getIcon('lucide.upload')

defineOptions({ name: 'SettingsJsonTransfer' })

defineProps<{
  importDraft: string
  importMessage: string
  exportDraft: string
}>()

const emit = defineEmits<{
  'update:importDraft': [value: string]
  import: []
}>()
</script>

<template>
  <section class="settings-json-transfer">
    <div class="settings-json-transfer__panel">
      <div class="settings-json-transfer__title">
        <Upload class="size-4" />
        Import Settings JSON
      </div>
      <textarea
        :value="importDraft"
        class="settings-json-transfer__textarea"
        placeholder='{ "workbench.appearance.density": "compact" }'
        @input="emit('update:importDraft', ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="flex items-center gap-2">
        <AlButton size="sm" @click="emit('import')">Import</AlButton>
        <span class="text-xs text-muted-foreground">{{ importMessage }}</span>
      </div>
    </div>
    <div class="settings-json-transfer__panel">
      <div class="settings-json-transfer__title">
        <Download class="size-4" />
        Exported Settings JSON
      </div>
      <textarea class="settings-json-transfer__textarea" :value="exportDraft" readonly />
    </div>
  </section>
</template>

<style scoped>
.settings-json-transfer {
  display: grid;
  gap: 0.75rem;
  border-top: 1px solid var(--border);
  padding: 1rem;
}

.settings-json-transfer__panel {
  display: grid;
  gap: 0.5rem;
}

.settings-json-transfer__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.settings-json-transfer__textarea {
  min-height: 7rem;
  resize: vertical;
  border: 1px solid var(--input);
  border-radius: 6px;
  background: var(--surface-raised);
  padding: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.75rem;
  outline: none;
}

.settings-json-transfer__textarea:focus {
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--focus-ring) 22%, transparent);
}

@media (min-width: 768px) {
  .settings-json-transfer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

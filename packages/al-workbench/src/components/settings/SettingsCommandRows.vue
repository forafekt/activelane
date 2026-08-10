<script setup lang="ts">
import { AlButton, AlInput } from '@activelane/shadcn'
import type { WorkbenchCommandContribution } from '@activelane/workbench-api'

defineOptions({ name: 'SettingsCommandRows' })

defineProps<{
  rows: Array<{
    command: WorkbenchCommandContribution
    userShortcut: string
    source: string
  }>
  editingCommandId: string | null
  keybindingDraft: string
  conflictsFor: (
    commandId: string,
    shortcut: string,
  ) => Array<{ command: WorkbenchCommandContribution }>
}>()

const emit = defineEmits<{
  'update:keybindingDraft': [value: string]
  edit: [commandId: string, shortcut: string]
  save: [commandId: string]
  reset: [commandId: string]
}>()
</script>

<template>
  <section class="settings-command-rows">
    <div class="settings-command-rows__header">
      <span>Command</span>
      <span>Keybinding</span>
      <span>Source</span>
      <span class="text-right">Actions</span>
    </div>
    <article v-for="row in rows" :key="row.command.id" class="settings-command-rows__row">
      <div class="min-w-0">
        <div class="truncate text-sm font-medium">{{ row.command.title }}</div>
        <code class="text-xs text-muted-foreground">{{ row.command.id }}</code>
        <p
          v-if="conflictsFor(row.command.id, row.userShortcut).length"
          class="m-0 mt-1 text-xs text-destructive"
        >
          Conflicts with
          {{ conflictsFor(row.command.id, row.userShortcut).map((item) => item.command.title).join(', ') }}
        </p>
      </div>
      <AlInput
        v-if="editingCommandId === row.command.id"
        :model-value="keybindingDraft"
        placeholder="Ctrl+,"
        @update:model-value="emit('update:keybindingDraft', String($event))"
      />
      <kbd v-else class="settings-command-rows__kbd"> {{ row.userShortcut || 'Unassigned' }} </kbd>
      <span class="text-xs text-muted-foreground">{{ row.source }}</span>
      <div class="flex justify-end gap-2">
        <AlButton
          v-if="editingCommandId === row.command.id"
          size="sm"
          @click="emit('save', row.command.id)"
        >
          Save
        </AlButton>
        <AlButton
          v-else
          size="sm"
          variant="outline"
          @click="emit('edit', row.command.id, row.userShortcut)"
        >
          Edit
        </AlButton>
        <AlButton size="sm" variant="ghost" @click="emit('reset', row.command.id)">Reset</AlButton>
      </div>
    </article>
  </section>
</template>

<style scoped>
.settings-command-rows {
  max-width: 72rem;
  margin: 0 auto;
}

.settings-command-rows__header {
  display: none;
  grid-template-columns: minmax(220px, 1fr) 220px 120px 170px;
  border-bottom: 1px solid var(--border);
  padding: 0.5rem 1rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

.settings-command-rows__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 1rem;
}

.settings-command-rows__row:hover {
  background: color-mix(in srgb, var(--hover) 48%, transparent);
}

.settings-command-rows__kbd {
  width: fit-content;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--surface-raised);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

@media (min-width: 768px) {
  .settings-command-rows__header {
    display: grid;
  }

  .settings-command-rows__row {
    grid-template-columns: minmax(220px, 1fr) 220px 120px 170px;
    align-items: center;
  }
}
</style>

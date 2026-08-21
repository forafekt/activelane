<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { Badge, Button, Checkbox, Input, Select, Switch, Textarea } from '@activelane/shadcn'
import { computed, ref } from 'vue'
import type { WorkbenchSettingEntry } from '../../settings/types'

const RotateCcw = getIcon('lucide.rotate-ccw')

defineOptions({ name: 'WorkbenchSettingRow' })

const props = defineProps<{
  setting: WorkbenchSettingEntry
}>()

const emit = defineEmits<{
  change: [id: string, value: unknown]
  reset: [id: string]
}>()

const jsonDraft = ref('')
const jsonError = ref<string | null>(null)

const selectOptions = computed(
  () =>
    props.setting.options?.map((option) => ({
      label: option.label,
      value: String(option.value),
    })) ?? [],
)

function emitOption(value: string) {
  const option = props.setting.options?.find((item) => String(item.value) === value)
  emit('change', props.setting.id, option ? option.value : value)
}

function updateNumber(value: string) {
  const nextValue = Number(value)
  if (!Number.isNaN(nextValue)) emit('change', props.setting.id, nextValue)
}

function updateJson(value: string) {
  jsonDraft.value = value
  try {
    const parsed = JSON.parse(value)
    jsonError.value = null
    emit('change', props.setting.id, parsed)
  } catch {
    jsonError.value = 'Invalid JSON'
  }
}

function toggleMultiSelect(value: string | number | boolean, checked: boolean) {
  const current = Array.isArray(props.setting.value) ? props.setting.value : []
  const next = checked ? [...current, value] : current.filter((item) => item !== value)
  emit('change', props.setting.id, next)
}

function displayValue(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}
</script>

<template>
  <article
    class="grid grid-cols-1 gap-3 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]"
    :data-modified="setting.modified"
  >
    <div class="min-w-0">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <h3 class="m-0 truncate text-sm font-medium text-foreground">{{ setting.label }}</h3>
        <span v-if="setting.modified" class="size-1.5 rounded-full bg-primary" title="Modified" />
        <Badge v-if="setting.requiresReload" variant="outline">Requires Reload</Badge>
        <Badge v-if="setting.experimental" variant="secondary">Experimental</Badge>
        <Badge v-if="setting.ownerExtensionId" variant="outline">
          {{ setting.ownerExtensionName ?? 'Extension' }}
        </Badge>
        <Badge v-if="setting.missingOwner" variant="secondary">Missing Extension</Badge>
        <Badge v-if="setting.integration?.status === 'integration-point'" variant="outline">
          Integration Point
        </Badge>
        <Badge v-if="setting.integration?.status === 'reserved'" variant="secondary">
          Reserved
        </Badge>
      </div>
      <p v-if="setting.description" class="m-0 mt-1 text-xs leading-5 text-muted-foreground">
        {{ setting.description }}
      </p>
      <p
        v-if="setting.integration?.reason"
        class="m-0 mt-1 text-xs leading-5 text-muted-foreground"
      >
        {{ setting.integration.reason }}
      </p>
      <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <code>{{ setting.id }}</code>
        <span>{{ setting.scope ?? 'user' }}</span>
        <span v-if="setting.validationError" class="text-destructive"
          >{{ setting.validationError }}</span
        >
        <span v-if="jsonError" class="text-destructive">{{ jsonError }}</span>
      </div>
      <div class="mt-1 text-[11px] text-muted-foreground">
        Default: <code>{{ displayValue(setting.defaultValue) }}</code>
      </div>
    </div>

    <div class="flex min-w-0 items-start justify-end gap-2">
      <Switch
        v-if="setting.type === 'boolean'"
        class="mt-1"
        :disabled="setting.readonly"
        :model-value="Boolean(setting.value)"
        @update:model-value="emit('change', setting.id, $event)"
      />

      <Select
        v-else-if="setting.type === 'enum'"
        class="w-full"
        :disabled="setting.readonly"
        :model-value="String(setting.value)"
        :options="selectOptions"
        @update:model-value="emitOption"
      />

      <div v-else-if="setting.type === 'number'" class="grid w-full gap-2">
        <Input
          type="number"
          :disabled="setting.readonly"
          :model-value="Number(setting.value)"
          @update:model-value="updateNumber"
        />
        <input
          v-if="setting.render?.min !== undefined && setting.render?.max !== undefined"
          type="range"
          class="w-full accent-primary"
          :disabled="setting.readonly"
          :value="Number(setting.value)"
          :min="setting.render.min"
          :max="setting.render.max"
          :step="setting.render.step ?? 1"
          @input="updateNumber(($event.target as HTMLInputElement).value)"
        >
      </div>

      <Input
        v-else-if="setting.type === 'string' || setting.type === 'path' || setting.type === 'keybinding' || setting.type === 'color'"
        class="w-full"
        :type="setting.type === 'color' ? 'color' : 'text'"
        :disabled="setting.readonly"
        :model-value="displayValue(setting.value)"
        :placeholder="setting.render?.placeholder"
        @update:model-value="emit('change', setting.id, $event)"
      />

      <div v-else-if="setting.type === 'multi-select'" class="grid w-full gap-2">
        <div
          v-for="option in setting.options"
          :key="String(option.value)"
          class="flex items-center gap-2 text-sm"
        >
          <Checkbox
            :disabled="setting.readonly"
            :model-value="Array.isArray(setting.value) && setting.value.includes(option.value)"
            @update:model-value="toggleMultiSelect(option.value, Boolean($event))"
          />
          <span>{{ option.label }}</span>
        </div>
      </div>

      <Textarea
        v-else
        class="min-h-24 w-full font-mono text-xs"
        :disabled="setting.readonly"
        :model-value="jsonDraft || displayValue(setting.value)"
        :rows="setting.render?.rows ?? 5"
        @update:model-value="updateJson"
      />

      <Button
        size="icon"
        variant="ghost"
        :disabled="!setting.modified || setting.readonly"
        title="Reset setting"
        @click="emit('reset', setting.id)"
      >
        <RotateCcw class="size-4" />
      </Button>
    </div>
  </article>
</template>

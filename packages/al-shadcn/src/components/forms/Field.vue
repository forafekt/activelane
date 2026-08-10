<script setup lang="ts">
import { computed } from 'vue'
import { cn, createId } from '../../lib/utils'
import Label from '../ui/Label.vue'

defineOptions({ name: 'AlField' })

const props = withDefaults(
  defineProps<{
    id?: string
    labelFor?: string
    label?: string
    help?: string
    error?: string
    required?: boolean
    horizontal?: boolean
    compact?: boolean
    class?: string
  }>(),
  {
    horizontal: false,
    compact: false,
  },
)

const fieldId = computed(() => props.id ?? props.labelFor ?? createId('field'))
</script>

<template>
  <div
    :class="cn(horizontal ? 'grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start' : 'grid gap-1.5', compact && 'gap-1', $props.class)"
  >
    <div class="grid gap-1">
      <slot name="label">
        <Label v-if="label" :for="fieldId" :required="required">{{ label }}</Label>
      </slot>
      <p v-if="help" class="m-0 text-xs leading-relaxed text-muted-foreground">{{ help }}</p>
    </div>
    <div class="grid gap-1.5">
      <slot :id="fieldId" :aria-describedby="error ? `${fieldId}-error` : undefined" />
      <p v-if="error" :id="`${fieldId}-error`" class="m-0 text-xs font-medium text-destructive">
        {{ error }}
      </p>
    </div>
  </div>
</template>

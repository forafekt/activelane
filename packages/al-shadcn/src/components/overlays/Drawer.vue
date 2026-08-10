<script setup lang="ts">
import { cn } from '../../lib/utils'
import Sheet from './Sheet.vue'

defineOptions({ name: 'AlDrawer' })

withDefaults(
  defineProps<{
    open?: boolean
    modelValue?: boolean
    title?: string
    side?: 'left' | 'right' | 'top' | 'bottom'
    widthClass?: string
    class?: string
  }>(),
  {
    side: 'bottom',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <Sheet
    :open="open ?? modelValue"
    :title="title"
    :side="side"
    :class="cn($props.class, widthClass)"
    @update:open="
      (value) => {
        emit('update:open', value)
        emit('update:modelValue', value)
      }
    "
  >
    <template v-if="$slots.trigger" #trigger> <slot name="trigger" /> </template>
    <template v-if="$slots.header" #header> <slot name="header" /> </template>
    <slot />
  </Sheet>
</template>

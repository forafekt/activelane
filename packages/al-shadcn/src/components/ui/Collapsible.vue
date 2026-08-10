<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlCollapsible' })

defineProps<{
  open?: boolean
  class?: string
  triggerClass?: string
  contentClass?: string
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <CollapsibleRoot
    :open="open"
    :class="cn('grid gap-2', $props.class)"
    @update:open="emit('update:open', $event)"
  >
    <CollapsibleTrigger v-if="$slots.trigger" :class="cn('text-left', triggerClass)">
      <slot name="trigger" />
    </CollapsibleTrigger>
    <CollapsibleContent :class="cn('overflow-hidden', contentClass)"> <slot /> </CollapsibleContent>
  </CollapsibleRoot>
</template>

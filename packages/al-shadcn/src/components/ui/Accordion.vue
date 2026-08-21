<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'
import { cn } from '../../lib/utils'

const ChevronDown = getIcon('lucide:chevron-down')

defineOptions({ name: 'Accordion' })

defineProps<{
  modelValue?: string
  items: Array<{ value: string; label: string; content?: string; disabled?: boolean }>
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <AccordionRoot
    type="single"
    collapsible
    :model-value="modelValue"
    :class="cn('w-full divide-y divide-border rounded-lg border border-border bg-card', $props.class)"
    @update:model-value="emit('update:modelValue', $event as string)"
  >
    <AccordionItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      class="overflow-hidden"
    >
      <AccordionHeader>
        <AccordionTrigger
          class="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/60 disabled:opacity-50 [&[data-state=open]>svg]:rotate-180"
          :disabled="item.disabled"
        >
          {{ item.label }}
          <ChevronDown class="size-4 text-muted-foreground transition-transform" />
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent
        class="overflow-hidden text-sm data-[state=closed]:animate-[accordion-up_160ms_ease-out] data-[state=open]:animate-[accordion-down_160ms_ease-out]"
      >
        <div class="px-3 pb-3 pt-1 text-muted-foreground">
          <slot :name="item.value">{{ item.content }}</slot>
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlTabs' })

defineProps<{
  modelValue?: string
  tabs: Array<{ value: string; label: string; disabled?: boolean }>
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    :class="cn('grid gap-2', $props.class)"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <TabsList
      class="inline-flex h-[var(--toolbar-height,2.125rem)] items-stretch gap-0 border-b border-border bg-transparent px-1 text-muted-foreground"
    >
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :disabled="tab.disabled"
        class="relative inline-flex min-w-0 items-center justify-center whitespace-nowrap border-x border-t border-transparent px-2.5 text-[0.6875rem] font-medium transition-[background-color,color,border-color] hover:bg-[var(--control-surface-hover,var(--accent))] hover:text-foreground focus-visible:z-10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-outline,var(--ring))] disabled:pointer-events-none disabled:opacity-45 data-[state=active]:border-border data-[state=active]:bg-[var(--control-surface,var(--background))] data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-[-1px] data-[state=active]:after:h-px data-[state=active]:after:bg-[var(--control-surface,var(--background))]"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent
      v-for="tab in tabs"
      :key="tab.value"
      :value="tab.value"
      class="min-w-0 outline-none"
    >
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>

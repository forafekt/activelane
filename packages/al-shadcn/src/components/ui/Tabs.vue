<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'

defineOptions({ name: 'Tabs' })

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
    :class="cn('grid gap-3', $props.class)"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <TabsList class="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :disabled="tab.disabled"
        class="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-md px-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
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

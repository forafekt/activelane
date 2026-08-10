<script setup lang="ts">
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlCodeBlock' })

defineProps<{
  code?: string
  language?: string
  class?: string
}>()
</script>

<template>
  <pre
    :class="
      cn(
        'overflow-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-relaxed text-foreground',
        $props.class,
      )
    "
  ><code><slot>{{ code }}</slot></code></pre>
</template>

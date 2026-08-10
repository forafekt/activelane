<script setup lang="ts">
import { cn } from '../../lib/utils'
import { panelClass } from '../../lib/variants'

defineOptions({ name: 'AlContentSurface' })

defineProps<{
  inset?: boolean
  class?: string
}>()
</script>

<template>
  <section :class="cn(panelClass, inset ? 'p-3' : 'p-4', $props.class)"><slot /></section>
</template>

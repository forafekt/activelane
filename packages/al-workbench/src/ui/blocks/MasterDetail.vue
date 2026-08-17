<script setup lang="ts">
defineOptions({ name: 'MasterDetail' })

withDefaults(defineProps<{ masterWidth?: string }>(), { masterWidth: '18rem' })
</script>

<template>
  <div
    class="grid h-full min-h-0"
    :style="{ gridTemplateColumns: `${masterWidth} minmax(0, 1fr)` }"
  >
    <aside class="min-h-0 border-r border-border"><slot name="master" /></aside>
    <main class="min-h-0 min-w-0"><slot /></main>
  </div>
</template>

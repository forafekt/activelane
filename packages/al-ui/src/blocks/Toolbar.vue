<script setup lang="ts">
defineOptions({ name: 'ActiveLaneToolbar' })
withDefaults(defineProps<{ label?: string; dense?: boolean }>(), { dense: true })
</script>
<template>
  <div class="al-toolbar" role="toolbar" :aria-label="label" :data-dense="dense || undefined">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string }>()
</script>
<template>
  <fieldset class="al-toolbar-group" :aria-label="label"><slot /></fieldset>
</template>

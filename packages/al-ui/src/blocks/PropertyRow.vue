<script setup lang="ts">
defineProps<{ label: string; description?: string }>()
</script>
<template>
  <div class="al-property-row">
    <div>
      <div class="al-property-row__label">{{ label }}</div>
      <div v-if="description" class="al-property-row__description">{{ description }}</div>
    </div>
    <div class="al-property-row__value"><slot /></div>
  </div>
</template>

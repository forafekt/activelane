<script setup lang="ts">
withDefaults(
  defineProps<{ status?: 'neutral' | 'success' | 'warning' | 'error' | 'info'; label: string }>(),
  { status: 'neutral' },
)
</script>
<template
  ><span class="al-status" :data-status="status"
    ><span class="al-status__dot" aria-hidden="true" />{{ label }}</span
  ></template
>

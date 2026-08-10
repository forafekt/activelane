<script setup lang="ts">
import ContentSurface from '../layout/ContentSurface.vue'

defineOptions({ name: 'AlDashboardTopbar' })
</script>

<template>
  <ContentSurface class="rounded-none border-x-0 border-t-0 px-3 py-2">
    <div class="flex min-w-0 items-center justify-between gap-3"><slot /></div>
  </ContentSurface>
</template>

<script setup lang="ts">
import Sidebar from '../navigation/Sidebar.vue'

defineOptions({ name: 'AlDashboardSidebar' })
</script>

<template>
  <Sidebar class="bg-surface-1"> <slot /> </Sidebar>
</template>

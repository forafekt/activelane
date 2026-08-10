<script setup lang="ts">
import AppShell from './AppShell.vue'

defineOptions({ name: 'AlShell' })

defineProps<{
  sidebarOpen?: boolean
  sidebarWidth?: string
  class?: string
}>()

const emit = defineEmits<{ 'update:sidebarOpen': [value: boolean] }>()
</script>

<template>
  <AppShell
    :sidebar-open="sidebarOpen"
    :sidebar-width="sidebarWidth"
    :class="$props.class"
    @update:sidebar-open="emit('update:sidebarOpen', $event)"
  >
    <template v-if="$slots.sidebar" #sidebar> <slot name="sidebar" /> </template>
    <template v-if="$slots.topbar" #topbar> <slot name="topbar" /> </template>
    <slot />
  </AppShell>
</template>

<script setup lang="ts">
import Breadcrumb from './Breadcrumb.vue'

defineOptions({ name: 'AlBreadcrumbs' })

defineProps<{
  items: Array<{ id?: string; label: string; href?: string }>
  class?: string
}>()
</script>

<template>
  <Breadcrumb
    :items="items.map((item, index) => ({ id: item.id ?? item.href ?? String(index), label: item.label }))"
    :class="$props.class"
  />
</template>

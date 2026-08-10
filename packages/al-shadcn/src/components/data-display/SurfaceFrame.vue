<script setup lang="ts">
import ContentSurface from '../layout/ContentSurface.vue'
import HeaderBar from '../layout/HeaderBar.vue'

defineOptions({ name: 'AlSurfaceFrame' })

defineProps<{
  title?: string
  description?: string
  class?: string
}>()
</script>

<template>
  <ContentSurface :class="$props.class">
    <div class="grid gap-3">
      <HeaderBar
        v-if="title || description || $slots.actions"
        :title="title"
        :description="description"
      >
        <template v-if="$slots.actions" #actions> <slot name="actions" /> </template>
      </HeaderBar>
      <slot />
    </div>
  </ContentSurface>
</template>

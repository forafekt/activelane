<script setup lang="ts">
import { useToast } from '../../composables/useToast'
import { cn } from '../../lib/utils'
import Alert from './Alert.vue'

defineOptions({ name: 'AlToastViewport' })

defineProps<{ class?: string }>()

const { toasts, remove } = useToast()
</script>

<template>
  <div
    :class="cn('fixed bottom-3 right-3 z-80 grid w-[min(24rem,calc(100vw-1.5rem))] gap-2', $props.class)"
    role="region"
    aria-label="Notifications"
  >
    <Alert
      v-for="toast in toasts"
      :key="toast.id"
      :title="toast.title"
      :tone="toast.tone"
      class="shadow-lg"
      role="status"
      @click="remove(toast.id)"
    >
      {{ toast.description }}
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { NButton, NEmpty } from 'naive-ui'

defineProps<{ title?: string; description?: string; actionLabel?: string }>()
defineEmits<{ action: [] }>()
</script>
<template>
  <div class="al-empty-state">
    <NEmpty :description="description || title"
      ><template #icon><slot name="icon" /></template
      ><template #extra
        ><slot name="action"
          ><NButton v-if="actionLabel" size="small" @click="$emit('action')"
            >{{ actionLabel }}</NButton
          ></slot
        ></template
      ></NEmpty
    >
  </div>
</template>

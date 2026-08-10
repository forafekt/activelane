<script setup lang="ts">
import type { IconComponent } from '../../types'
import Button from './Button.vue'

defineOptions({ name: 'AlIconButton' })

withDefaults(
  defineProps<{
    label?: string
    icon?: IconComponent
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'subtle' | 'destructive'
    size?: 'icon' | 'icon-sm' | 'icon-xs' | 'icon-xs' | 'sm' | 'md' | 'lg'
    disabled?: boolean
    class?: string
  }>(),
  {
    variant: 'ghost',
    size: 'icon-xs',
  },
)
</script>

<template>
  <Button
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :aria-label="label"
    :class="$props.class"
  >
    <component :is="icon" v-if="icon" class="size-4" />
    <slot />
  </Button>
</template>

<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import { cn } from '../../lib/utils'

defineOptions({ name: 'Avatar' })

withDefaults(
  defineProps<{
    src?: string
    alt?: string
    fallback?: string
    size?: 'sm' | 'md' | 'lg'
    class?: string
  }>(),
  {
    size: 'md',
  },
)
</script>

<template>
  <AvatarRoot
    :class="
      cn(
        'relative flex shrink-0 overflow-hidden rounded-full border border-border bg-muted',
        size === 'sm' && 'size-7',
        size === 'md' && 'size-8',
        size === 'lg' && 'size-10',
        $props.class,
      )
    "
  >
    <AvatarImage
      v-if="src"
      :src="src"
      :alt="alt ?? ''"
      class="aspect-square size-full object-cover"
    />
    <AvatarFallback
      class="flex size-full items-center justify-center text-xs font-medium text-muted-foreground"
    >
      <slot>{{ fallback }}</slot>
    </AvatarFallback>
  </AvatarRoot>
</template>

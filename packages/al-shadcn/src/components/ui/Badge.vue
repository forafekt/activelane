<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { badgeVariants } from '../../lib/variants'

defineOptions({ name: 'Badge' })

type BadgeVariants = VariantProps<typeof badgeVariants>

withDefaults(
  defineProps<{
    variant?: BadgeVariants['variant']
    tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'destructive' | 'error' | 'info'
    size?: 'sm' | 'md'
    outline?: boolean
    class?: string
  }>(),
  {
    variant: 'muted',
  },
)
</script>

<template>
  <span
    :class="
      cn(
        badgeVariants({
          variant: outline
            ? 'outline'
            : tone === 'success'
              ? 'success'
              : tone === 'warning'
                ? 'warning'
                : tone === 'destructive' || tone === 'error'
                  ? 'destructive'
                  : variant,
        }),
        size === 'md' && 'px-2.5 py-1 text-xs',
        $props.class,
      )
    "
  >
    <slot />
  </span>
</template>

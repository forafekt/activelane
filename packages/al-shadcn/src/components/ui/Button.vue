<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'vue'
import type { IconComponent } from '../../componentTypes'
import { cn } from '../../lib/utils'
import { buttonVariants } from '../../lib/variants'

defineOptions({ name: 'Button' })

type ButtonVariants = VariantProps<typeof buttonVariants>
type ButtonVariant = ButtonVariants['variant'] | 'soft'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonVariants['size']
    tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'destructive' | 'error' | 'info'
    label?: string
    block?: boolean
    wide?: boolean
    leadingIcon?: IconComponent
    trailingIcon?: IconComponent
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    class?: HTMLAttributes['class']
  }>(),
  {
    variant: 'default',
    size: 'md',
    type: 'button',
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="
      cn(
        buttonVariants({
          variant:
            variant === 'soft'
              ? 'secondary'
              : tone === 'destructive' || tone === 'error'
                ? 'destructive'
                : variant,
          size,
        }),
        block && 'w-full',
        wide && 'min-w-36',
        $props.class,
      )
    "
  >
    <span
      v-if="loading"
      class="size-3.5 animate-spin rounded-full border border-current border-r-transparent"
      aria-hidden="true"
    />
    <component :is="leadingIcon" v-else-if="leadingIcon" class="size-4" />
    <slot />
    <span v-if="!$slots.default">{{ label }}</span>
    <component :is="trailingIcon" v-if="trailingIcon" class="size-4" />
  </button>
</template>

<script setup lang="ts">
import {
  HoverCardArrow,
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from 'reka-ui'
import { cn } from '../../lib/utils'

defineOptions({ name: 'AlHoverCard' })

withDefaults(
  defineProps<{
    side?: 'top' | 'right' | 'bottom' | 'left'
    class?: string
  }>(),
  {
    side: 'bottom',
  },
)
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger as-child> <slot name="trigger" /> </HoverCardTrigger>
    <HoverCardPortal>
      <HoverCardContent
        :side="side"
        :side-offset="8"
        :class="cn('z-40 w-80 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none', $props.class)"
      >
        <slot />
        <HoverCardArrow class="fill-popover" />
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>

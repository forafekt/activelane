<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { reactiveOmit } from '@vueuse/core'
import type { PaginationNextProps } from 'reka-ui'
import { PaginationNext, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'
import type { ButtonVariants } from '../button/index'
import { buttonVariants } from '../button/index'

const ChevronRightIcon = getIcon('lucide:chevron-right')

const props = withDefaults(
  defineProps<
    PaginationNextProps & {
      size?: ButtonVariants['size']
      class?: HTMLAttributes['class']
    }
  >(),
  {
    size: 'default',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'size')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationNext
    data-slot="pagination-next"
    :class="cn(buttonVariants({ variant: 'ghost', size }), 'gap-1 px-2.5 sm:pr-2.5', props.class)"
    v-bind="forwarded"
  >
    <slot>
      <span class="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </slot>
  </PaginationNext>
</template>

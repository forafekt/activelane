<script lang="ts" setup>
import { getIcon } from '@activelane/icons'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const MoreHorizontal = getIcon('lucide:more-horizontal')

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    data-slot="breadcrumb-ellipsis"
    role="presentation"
    aria-hidden="true"
    :class="cn('flex size-9 items-center justify-center', props.class)"
  >
    <slot> <MoreHorizontal class="size-4" /> </slot>
    <span class="sr-only">More</span>
  </span>
</template>

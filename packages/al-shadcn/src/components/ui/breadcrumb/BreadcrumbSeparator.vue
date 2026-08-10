<script lang="ts" setup>
import { getIcon } from '@activelane/icons'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const ChevronRight = getIcon('ChevronRight')

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <li
    data-slot="breadcrumb-separator"
    role="presentation"
    aria-hidden="true"
    :class="cn('[&>svg]:size-3.5', props.class)"
  >
    <slot> <ChevronRight /> </slot>
  </li>
</template>

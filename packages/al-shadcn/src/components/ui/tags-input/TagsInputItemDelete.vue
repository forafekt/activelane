<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { reactiveOmit } from '@vueuse/core'
import type { TagsInputItemDeleteProps } from 'reka-ui'
import { TagsInputItemDelete, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const X = getIcon('lucide:x')

const props = defineProps<TagsInputItemDeleteProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TagsInputItemDelete
    v-bind="forwardedProps"
    :class="cn('flex rounded bg-transparent mr-1', props.class)"
  >
    <slot> <X class="w-4 h-4" /> </slot>
  </TagsInputItemDelete>
</template>

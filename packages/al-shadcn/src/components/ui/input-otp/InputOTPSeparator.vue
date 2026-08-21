<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const MinusIcon = getIcon('lucide:minus')

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(props)
</script>

<template>
  <div data-slot="input-otp-separator" v-bind="forwarded">
    <slot> <MinusIcon /> </slot>
  </div>
</template>

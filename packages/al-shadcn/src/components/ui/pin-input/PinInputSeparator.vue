<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import type { PrimitiveProps } from 'reka-ui'
import { Primitive, useForwardProps } from 'reka-ui'

const Minus = getIcon('Minus')

const props = defineProps<PrimitiveProps>()
const forwardedProps = useForwardProps(props)
</script>

<template>
  <Primitive data-slot="pin-input-separator" v-bind="forwardedProps">
    <slot> <Minus /> </slot>
  </Primitive>
</template>

<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const Loader2Icon = getIcon('lucide:loader')

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Loader2Icon role="status" aria-label="Loading" :class="cn('size-4 animate-spin', props.class)" />
</template>

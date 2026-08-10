<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { cn } from '../../lib/utils'

const LoaderCircle = getIcon('LoaderCircle')

defineOptions({ name: 'AlSpinner' })

defineProps<{ class?: string }>()
</script>

<template>
  <LoaderCircle :class="cn('size-4 animate-spin text-muted-foreground', $props.class)" />
</template>

<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'
import { Button } from '../button/index'
import { useSidebar } from './utils'

const PanelLeft = getIcon('PanelLeft')

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="cn('h-7 w-7', props.class)"
    @click="toggleSidebar"
  >
    <PanelLeft />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>

<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import Button from '../ui/Button.vue'
import DropdownMenu from './DropdownMenu.vue'

const ChevronDown = getIcon('ChevronDown')

defineOptions({ name: 'AlDropdown' })

defineProps<{
  label?: string
  class?: string
}>()
</script>

<template>
  <DropdownMenu :class="$props.class">
    <template #trigger>
      <slot name="trigger">
        <Button variant="outline" size="sm">
          {{ label ?? 'Menu' }}
          <ChevronDown class="size-4" />
        </Button>
      </slot>
    </template>
    <slot />
  </DropdownMenu>
</template>

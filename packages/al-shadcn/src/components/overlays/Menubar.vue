<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarTrigger,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import { menuItemClass } from '../../lib/variants'

const ChevronDown = getIcon('ChevronDown')

defineOptions({ name: 'AlMenubar' })

defineProps<{
  menus: Array<{
    id: string
    label: string
    items: Array<{ id: string; label: string; disabled?: boolean }>
  }>
  class?: string
}>()

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <MenubarRoot
    :class="cn('flex h-9 items-center gap-1 rounded-lg border border-border bg-background p-1', $props.class)"
  >
    <MenubarMenu v-for="menu in menus" :key="menu.id">
      <MenubarTrigger
        class="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground data-[highlighted]:bg-muted data-[state=open]:bg-muted"
      >
        {{ menu.label }}
        <ChevronDown class="size-3" />
      </MenubarTrigger>
      <MenubarPortal>
        <MenubarContent
          class="z-40 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none"
          :side-offset="6"
        >
          <MenubarItem
            v-for="item in menu.items"
            :key="item.id"
            :disabled="item.disabled"
            :class="menuItemClass"
            @select="emit('select', item.id)"
          >
            {{ item.label }}
          </MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>

<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import { menuItemClass } from '../../lib/variants'

const Check = getIcon('lucide.check')
const ChevronRight = getIcon('lucide.chevron-right')

defineOptions({ name: 'AlDropdownMenu' })

withDefaults(
  defineProps<{
    items?: Array<{
      id: string
      label: string
      shortcut?: string
      disabled?: boolean
      checked?: boolean
      destructive?: boolean
      children?: Array<{ id: string; label: string; disabled?: boolean }>
    }>
    align?: 'start' | 'center' | 'end'
    class?: string
  }>(),
  {
    align: 'end',
    items: () => [],
  },
)

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child> <slot name="trigger" /> </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side-offset="6"
        :class="cn('z-40 min-w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none', $props.class)"
      >
        <slot>
          <template v-for="item in items" :key="item.id">
            <DropdownMenuSub v-if="item.children?.length">
              <DropdownMenuSubTrigger
                :class="cn(menuItemClass, item.destructive && 'text-destructive')"
              >
                {{ item.label }}
                <ChevronRight class="ml-auto size-4" />
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  class="z-40 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none"
                >
                  <DropdownMenuItem
                    v-for="child in item.children"
                    :key="child.id"
                    :disabled="child.disabled"
                    :class="menuItemClass"
                    @select="emit('select', child.id)"
                  >
                    {{ child.label }}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem
              v-else-if="typeof item.checked === 'boolean'"
              :checked="item.checked"
              :disabled="item.disabled"
              :class="cn(menuItemClass, 'pl-8', item.destructive && 'text-destructive')"
              @select="emit('select', item.id)"
            >
              <span class="absolute left-2 flex size-3.5 items-center justify-center">
                <Check v-if="item.checked" class="size-3.5" />
              </span>
              {{ item.label }}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator
              v-else-if="item.id === 'separator'"
              class="-mx-1 my-1 h-px bg-border"
            />
            <DropdownMenuLabel
              v-else-if="item.id.startsWith('label:')"
              class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {{ item.label }}
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-else
              :disabled="item.disabled"
              :class="cn(menuItemClass, item.destructive && 'text-destructive focus:text-destructive')"
              @select="emit('select', item.id)"
            >
              <span>{{ item.label }}</span>
              <span
                v-if="item.shortcut"
                class="ml-auto text-xs tracking-widest text-muted-foreground"
                >{{ item.shortcut }}</span
              >
            </DropdownMenuItem>
          </template>
        </slot>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

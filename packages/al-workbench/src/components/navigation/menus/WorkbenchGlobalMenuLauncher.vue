<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { getComponent } from '@activelane/ui'
import type { DropdownOption } from '@activelane/ui/components'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useWorkbenchMenus } from '../../../composables/useWorkbenchMenus'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import type { WorkbenchResolvedMenuItem } from '../../../core/menus/menuContracts'

defineOptions({ name: 'WorkbenchGlobalMenuLauncher' })

const props = defineProps<{
  placement: 'topBar' | 'activityLauncher'
  labels?: boolean
}>()

const runtime = useWorkbenchRuntime()
const menus = useWorkbenchMenus()

const Icon = getComponent('icon')
const Image = getComponent('image')
const Button = getComponent('button')
const IconButton = getComponent('icon-button')
const Dropdown = getComponent('dropdown')

const menuRoot = ref<HTMLElement | null>(null)
const showMenuParentItems = ref(false)

const groups = computed(() => menus.globalMenuGroups(props.placement))

function toggleMenuParentItems() {
  showMenuParentItems.value = !showMenuParentItems.value
}

function closeMenu() {
  showMenuParentItems.value = false
}

function toDropdownOptions(items: WorkbenchResolvedMenuItem[]): DropdownOption[] {
  return items.flatMap((item): DropdownOption[] => {
    if (item.kind === 'separator') {
      return [
        {
          key: item.id,
          type: 'divider',
        },
      ]
    }

    if (item.kind === 'submenu') {
      return [
        {
          key: item.id,
          label: item.label,
          children: toDropdownOptions(item.items),
        },
      ]
    }

    return [
      {
        key: item.commandId,
        label: item.label,
        disabled: !item.enabled,
      },
    ]
  })
}

function execute(commandId: string) {
  closeMenu()
  void runtime.commands.execute(commandId)
}

function handleSelect(key: string | number) {
  execute(String(key))
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!showMenuParentItems.value) return

  const target = event.target as Node | null

  if (!target) return

  // Naive UI dropdown menus are teleported to <body>, so they are not
  // descendants of menuRoot. Ignore clicks inside an open Naive UI dropdown.
  const element = target instanceof Element ? target : target.parentElement

  if (menuRoot.value?.contains(target) || element?.closest('.n-dropdown-menu')) {
    return
  }

  closeMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<template>
  <nav ref="menuRoot" class="wb-global-menu-bar" aria-label="Application menu">
    <Icon size="30" :depth="1">
      <Image src="/assets/resources/activelane-a-logo3.png" width="100%" height="100%" />
    </Icon>

    <IconButton
      v-if="!showMenuParentItems"
      label="Workbench menu"
      :icon="getIcon('lucide:menu')"
      :aria-expanded="showMenuParentItems"
      @click="toggleMenuParentItems"
    />

    <template v-if="showMenuParentItems">
      <Dropdown
        v-for="group in groups"
        :key="group.id"
        trigger="hover"
        placement="bottom-start"
        :options="toDropdownOptions(group.items)"
        @select="handleSelect"
      >
        <Button
          type="button"
          quaternary
          size="tiny"
        >
          {{ group.label }}
        </Button>
      </Dropdown>
    </template>
  </nav>
</template>

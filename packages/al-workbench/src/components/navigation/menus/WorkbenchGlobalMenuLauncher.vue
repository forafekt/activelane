<script setup lang="ts">
import type {
  WorkbenchResolvedMenuCommandItem,
  WorkbenchResolvedMenuItem,
} from '@activelane/workbench-api'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useWorkbenchMenus } from '../../../composables/useWorkbenchMenus'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'

defineOptions({ name: 'WorkbenchGlobalMenuLauncher' })

const props = defineProps<{
  placement: 'topBar' | 'activityLauncher'
  labels?: boolean
}>()

const runtime = useWorkbenchRuntime()

const [
  AlIconButton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
] = runtime.workbench.ui.getComponents([
  'AlIconButton',
  'DropdownMenu',
  'DropdownMenuContent',
  'DropdownMenuItem',
  'DropdownMenuLabel',
  'DropdownMenuSeparator',
  'DropdownMenuSub',
  'DropdownMenuSubContent',
  'DropdownMenuSubTrigger',
  'DropdownMenuTrigger',
])
const menus = useWorkbenchMenus()

const groups = computed(() => menus.globalMenuGroups(props.placement))

const activeGroupId = ref<string | null>(null)
const panelLeft = ref(0)
const panelTop = ref(0)

const activeGroup = computed(
  () => groups.value.find((group) => group.id === activeGroupId.value) ?? null,
)

function openGroup(groupId: string, event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  panelLeft.value = rect.left
  panelTop.value = rect.bottom + 4
  activeGroupId.value = groupId
}

function toggleGroup(groupId: string, event: MouseEvent) {
  if (activeGroupId.value === groupId) {
    closeMenuBar()
    return
  }

  openGroup(groupId, event)
}

function hoverGroup(groupId: string, event: MouseEvent) {
  if (!activeGroupId.value) return
  openGroup(groupId, event)
}

function closeMenuBar() {
  activeGroupId.value = null
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement | null

  if (!target) return

  if (
    target.closest('[data-wb-global-menu-trigger]') ||
    target.closest('[data-wb-global-menu-panel]')
  ) {
    return
  }

  closeMenuBar()
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenuBar()
  }
}

async function enableOutsideListeners() {
  await nextTick()
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeyDown)
}

function execute(commandId: string) {
  closeMenuBar()
  void runtime.commands.execute(commandId)
}

function commandItems(items: WorkbenchResolvedMenuItem[]): WorkbenchResolvedMenuCommandItem[] {
  return items.filter((item): item is WorkbenchResolvedMenuCommandItem => item.kind === 'command')
}

enableOutsideListeners()

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeyDown)
})
</script>

<template>
  <nav v-if="labels" class="wb-global-menu-bar" aria-label="Application menu">
    <button
      v-for="group in groups"
      :key="group.id"
      type="button"
      data-wb-global-menu-trigger
      class="wb-global-menu-bar__item"
      :class="{ 'wb-global-menu-bar__item--active': activeGroupId === group.id }"
      @click="toggleGroup(group.id, $event)"
      @pointerenter="hoverGroup(group.id, $event)"
    >
      {{ group.label }}
    </button>

    <Teleport to="body">
      <div
        v-if="activeGroup"
        data-wb-global-menu-panel
        class="wb-global-menu-panel"
        :style="{
          left: `${panelLeft}px`,
          top: `${panelTop}px`,
        }"
      >
        <div class="wb-global-menu-panel__label">
          {{ activeGroup.label }}
        </div>

        <div class="wb-global-menu-panel__separator" />

        <template v-for="item in activeGroup.items" :key="item.id">
          <div v-if="item.kind === 'separator'" class="wb-global-menu-panel__separator" />
          <button
            v-else-if="item.kind === 'command'"
            type="button"
            class="wb-global-menu-panel__item"
            :disabled="!item.enabled"
            @click="execute(item.commandId)"
          >
            <span class="wb-global-menu-panel__label-row">
              <span v-if="item.checked" aria-hidden="true" class="wb-global-menu-panel__check"
                >*</span
              >
              <span>{{ item.label }}</span>
            </span>
            <span v-if="item.shortcut" class="wb-global-menu-panel__shortcut">
              {{ item.shortcut }}
            </span>
          </button>
          <div v-else-if="item.kind === 'submenu'" class="wb-global-menu-panel__submenu">
            <div class="wb-global-menu-panel__submenu-label">{{ item.label }}</div>
            <button
              v-for="child in commandItems(item.items)"
              :key="child.id"
              type="button"
              class="wb-global-menu-panel__item wb-global-menu-panel__item--nested"
              :disabled="!child.enabled"
              @click="execute(child.commandId)"
            >
              <span class="wb-global-menu-panel__label-row">
                <span v-if="child.checked" aria-hidden="true" class="wb-global-menu-panel__check"
                  >*</span
                >
                <span>{{ child.label }}</span>
              </span>
              <span v-if="child.shortcut" class="wb-global-menu-panel__shortcut">
                {{ child.shortcut }}
              </span>
            </button>
          </div>
        </template>
      </div>
    </Teleport>
  </nav>

  <DropdownMenu v-else :modal="false">
    <DropdownMenuTrigger as-child>
      <AlIconButton
        label="Workbench menu"
        :icon="runtime.workbench.ui.getIcon('Menu')"
        size="icon"
        variant="ghost"
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" side="right" class="w-64">
      <DropdownMenuLabel>Workbench</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuSub v-for="group in groups" :key="group.id">
        <DropdownMenuSubTrigger>{{ group.label }}</DropdownMenuSubTrigger>

        <DropdownMenuSubContent class="w-56">
          <template v-for="item in group.items" :key="item.id">
            <DropdownMenuSeparator v-if="item.kind === 'separator'" />
            <DropdownMenuItem
              v-else-if="item.kind === 'command'"
              :disabled="!item.enabled"
              @select="execute(item.commandId)"
            >
              <span class="wb-global-menu-panel__label-row">
                <span v-if="item.checked" aria-hidden="true" class="wb-global-menu-panel__check"
                  >*</span
                >
                <span>{{ item.label }}</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuSub v-else-if="item.kind === 'submenu'">
              <DropdownMenuSubTrigger>{{ item.label }}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent class="w-56">
                <template v-for="child in item.items" :key="child.id">
                  <DropdownMenuSeparator v-if="child.kind === 'separator'" />
                  <DropdownMenuItem
                    v-else-if="child.kind === 'command'"
                    :disabled="!child.enabled"
                    @select="execute(child.commandId)"
                  >
                    <span class="wb-global-menu-panel__label-row">
                      <span
                        v-if="child.checked"
                        aria-hidden="true"
                        class="wb-global-menu-panel__check"
                        >*</span
                      >
                      <span>{{ child.label }}</span>
                    </span>
                  </DropdownMenuItem>
                </template>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </template>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>
.wb-global-menu-bar {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.125rem;
}

.wb-global-menu-bar__item {
  min-height: 1.75rem;
  border: 0;
  border-radius: calc(var(--radius) - 4px);
  background: transparent;
  padding: 0 0.5rem;
  color: var(--foreground);
  font-size: 0.8125rem;
  cursor: pointer;
}

.wb-global-menu-bar__item:hover,
.wb-global-menu-bar__item--active {
  background: var(--accent);
  color: var(--accent-foreground);
}

.wb-global-menu-panel {
  position: fixed;
  z-index: 9999;
  width: 14rem;
  overflow: hidden;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--popover);
  color: var(--popover-foreground);
  padding: 0.25rem;
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.28);
}

.wb-global-menu-panel__label {
  padding: 0.375rem 0.5rem;
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 500;
}

.wb-global-menu-panel__separator {
  height: 1px;
  margin: 0.25rem -0.25rem;
  background: var(--border);
}

.wb-global-menu-panel__item {
  display: flex;
  width: 100%;
  min-height: 1.75rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 0;
  border-radius: calc(var(--radius) - 4px);
  background: transparent;
  padding: 0 0.5rem;
  color: inherit;
  font-size: 0.8125rem;
  text-align: left;
  cursor: pointer;
}

.wb-global-menu-panel__item:hover:not(:disabled) {
  background: var(--accent);
  color: var(--accent-foreground);
}

.wb-global-menu-panel__item:disabled {
  color: var(--muted-foreground);
  cursor: default;
  opacity: 0.55;
}

.wb-global-menu-panel__item--nested {
  padding-left: 1rem;
}

.wb-global-menu-panel__submenu-label {
  padding: 0.375rem 0.5rem;
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 500;
}

.wb-global-menu-panel__shortcut {
  color: var(--muted-foreground);
  font-size: 0.75rem;
}

.wb-global-menu-panel__label-row {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
}

.wb-global-menu-panel__check {
  width: 0.75rem;
  color: currentColor;
  font-size: 0.75rem;
  line-height: 1;
}
</style>

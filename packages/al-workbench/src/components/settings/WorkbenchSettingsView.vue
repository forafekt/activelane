<script setup lang="ts">
import {
  AlBadge,
  AlButton,
  AlInput,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@activelane/shadcn'
import { useWorkbenchSettingsViewModel } from '../../composables/useWorkbenchSettingsViewModel'
import SettingsCommandRows from './SettingsCommandRows.vue'
import SettingsJsonTransfer from './SettingsJsonTransfer.vue'
import WorkbenchSettingRow from './WorkbenchSettingRow.vue'

defineOptions({ name: 'WorkbenchSettingsView' })

const {
  runtime,
  query,
  activeCategory,
  showModified,
  showExtensionSettings,
  importDraft,
  importMessage,
  exportDraft,
  editingCommandId,
  keybindingDraft,
  categories,
  baseSettings,
  groupedSettings,
  activeCategoryLabel,
  commandRows,
  isCommandCategory,
  conflictsFor,
  updateSetting,
  resetSetting,
  resetShown,
  exportShown,
  importSettings,
  startKeybindingEdit,
  saveKeybinding,
} = useWorkbenchSettingsViewModel()

const [Braces, Filter, RotateCcw, Search, Settings2, Command, Keyboard] =
  runtime.workbench.ui.getIcons([
    'Braces',
    'Filter',
    'RotateCcw',
    'Search',
    'Settings2',
    'Command',
    'Keyboard',
  ])
</script>

<template>
  <SidebarProvider class="h-full min-h-0 bg-background text-foreground">
    <section class="settings-workbench">
      <Sidebar collapsible="offcanvas" class="settings-workbench__sidebar sticky top-0">
        <SidebarHeader class="settings-workbench__sidebar-header px-3 py-3">
          <div class="flex items-center gap-2">
            <Settings2 class="size-4" />
            <div class="min-w-0">
              <h1 class="m-0 truncate text-sm font-semibold">Settings</h1>
              <p class="m-0 text-xs text-muted-foreground">Workbench command center</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem v-for="category in categories" :key="category.id">
                  <SidebarMenuButton
                    type="button"
                    :data-active="activeCategory === category.id"
                    @click="activeCategory = category.id"
                  >
                    <Keyboard v-if="category.id === 'keybindings'" />
                    <Command v-else-if="category.id === 'commands'" />
                    <Settings2 v-else />
                    <span>{{ category.label }}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{{ category.count }}</SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset class="min-w-0 flex-1">
        <section class="flex h-full min-h-0 flex-col">
          <header class="settings-workbench__header">
            <div class="flex flex-wrap items-center gap-2">
              <div class="relative min-w-60 flex-1">
                <Search
                  class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <AlInput
                  v-model="query"
                  class="h-9 pl-8"
                  placeholder="Search settings, commands, extensions, tags"
                />
              </div>
              <AlButton
                size="sm"
                :variant="showModified ? 'default' : 'outline'"
                @click="showModified = !showModified"
              >
                <Filter class="size-4" />
                Modified
              </AlButton>
              <AlButton
                size="sm"
                :variant="showExtensionSettings ? 'default' : 'outline'"
                @click="showExtensionSettings = !showExtensionSettings"
              >
                <Braces class="size-4" />
                Extension
              </AlButton>
              <AlButton size="sm" variant="outline" @click="resetShown">
                <RotateCcw class="size-4" />
                Reset Shown
              </AlButton>
              <AlButton size="sm" variant="outline" @click="exportShown">Export</AlButton>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{{ activeCategoryLabel }}</span>
              <span
                >{{ isCommandCategory(activeCategory) ? commandRows.length : baseSettings.length }}
                results</span
              >
              <AlBadge v-if="showModified" variant="outline">Modified only</AlBadge>
              <AlBadge v-if="showExtensionSettings" variant="outline">Extension settings</AlBadge>
            </div>
          </header>

          <main class="min-h-0 flex-1 overflow-auto">
            <section v-if="isCommandCategory(activeCategory)" class="mx-auto max-w-6xl">
              <SettingsCommandRows
                v-model:keybinding-draft="keybindingDraft"
                :rows="commandRows"
                :editing-command-id="editingCommandId"
                :conflicts-for="conflictsFor"
                @edit="startKeybindingEdit"
                @save="saveKeybinding"
                @reset="runtime.settings.reset(`keybindings.${$event}`)"
              />
            </section>

            <section v-else class="mx-auto max-w-6xl pb-8">
              <section
                v-for="group in groupedSettings"
                :key="group.title"
                class="settings-workbench__group"
              >
                <div class="settings-workbench__group-header">
                  <h2 class="m-0 text-xs font-semibold uppercase text-muted-foreground">
                    {{ group.title }}
                  </h2>
                </div>
                <WorkbenchSettingRow
                  v-for="setting in group.settings"
                  :key="setting.id"
                  :setting="setting"
                  @change="updateSetting"
                  @reset="resetSetting"
                />
              </section>

              <div v-if="!groupedSettings.length" class="px-4 py-12 text-sm text-muted-foreground">
                No settings match the current filters.
              </div>

              <SettingsJsonTransfer
                v-model:import-draft="importDraft"
                :import-message="importMessage"
                :export-draft="exportDraft"
                @import="importSettings"
              />
            </section>
          </main>
        </section>
      </SidebarInset>
    </section>
  </SidebarProvider>
</template>

<style scoped>
.settings-workbench {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--editor);
}

.settings-workbench__sidebar {
  background: var(--sidebar);
  border-right: 1px solid var(--border);
}

.settings-workbench__sidebar-header {
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface-raised) 72%, transparent);
}

.settings-workbench__header {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface-overlay) 94%, transparent);
  padding: 0.75rem 1rem;
  backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: var(--elevation-1);
}

.settings-workbench__group {
  border-bottom: 1px solid var(--border);
}

.settings-workbench__group-header {
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel) 82%, transparent);
  padding: 0.5rem 1rem;
}
</style>

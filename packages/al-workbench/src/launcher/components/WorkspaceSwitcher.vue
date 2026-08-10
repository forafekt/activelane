<script setup lang="ts">
import { getIcon, getIcons } from '@activelane/icons'
import { AlButton } from '@activelane/shadcn'
import { useWorkspaceSwitcher } from '../composables/useWorkspaceSwitcher'

const [Check, Plus] = getIcons(['Check', 'Plus'])

defineOptions({ name: 'WorkspaceSwitcher' })

const workspace = useWorkspaceSwitcher()
</script>

<template>
  <div class="workspace-switcher">
    <button
      v-for="item in workspace.workspaces.value"
      :key="item.id"
      type="button"
      class="workspace-switcher__item"
      :class="{ 'workspace-switcher__item--active': item.id === workspace.currentWorkspaceId.value }"
      @click="workspace.switchWorkspace(item.id)"
    >
      <span>
        <strong>{{ item.name }}</strong>
        <small>{{ item.description || 'Workbench layout context' }}</small>
      </span>
      <Check v-if="item.id === workspace.currentWorkspaceId.value" class="size-4" />
    </button>
    <AlButton
      variant="outline"
      size="sm"
      class="workspace-switcher__create"
      @click="workspace.createWorkspace()"
    >
      <Plus class="size-4" />
      New Workspace
    </AlButton>
  </div>
</template>

<style scoped>
.workspace-switcher {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.625rem;
}

.workspace-switcher__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 4rem;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 0.75rem;
  background: hsl(var(--card) / 0.64);
  color: hsl(var(--foreground));
  text-align: left;
}

.workspace-switcher__item--active {
  border-color: hsl(var(--primary) / 0.65);
  background: hsl(var(--primary) / 0.1);
}

.workspace-switcher__item span {
  display: grid;
  min-width: 0;
  gap: 0.15rem;
}

.workspace-switcher__item strong,
.workspace-switcher__item small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-switcher__item small {
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
}

.workspace-switcher__create {
  min-height: 4rem;
  justify-content: center;
}
</style>

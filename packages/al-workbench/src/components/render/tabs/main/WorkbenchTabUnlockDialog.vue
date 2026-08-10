<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useWorkbenchRuntime } from '../../../../composables/useWorkbenchRuntime'
import { useWorkbenchTabInteractions } from './useWorkbenchTabInteractions'

defineOptions({ name: 'WorkbenchTabUnlockDialog' })

const runtime = useWorkbenchRuntime()
const interactions = useWorkbenchTabInteractions()
const passwordRef = ref<HTMLInputElement | null>(null)

const [Eye, EyeOff] = runtime.workbench.ui.getIcons(['Eye', 'EyeOff'])
const [
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  AlButton,
  AlInput,
  AlLabel,
] = runtime.workbench.ui.getComponents([
  'Dialog',
  'DialogContent',
  'DialogDescription',
  'DialogFooter',
  'DialogHeader',
  'DialogTitle',
  'AlButton',
  'AlInput',
  'AlLabel',
])

watch(
  () => interactions.unlock.open,
  async (open) => {
    if (!open) return
    await nextTick()
    passwordRef.value?.focus()
  },
)

function updateOpen(open: boolean) {
  if (!open) interactions.cancelUnlock()
}
</script>

<template>
  <Dialog :open="interactions.unlock.open" @update:open="updateOpen">
    <DialogContent class="sm:max-w-[25rem]">
      <form class="wb-tab-dialog-form" @submit.prevent="interactions.submitUnlock">
        <DialogHeader>
          <DialogTitle>{{ interactions.unlock.title }}</DialogTitle>
          <DialogDescription>{{ interactions.unlock.description }}</DialogDescription>
        </DialogHeader>

        <div class="wb-tab-dialog-field">
          <AlLabel for="workbench-tab-unlock-password">PIN/password</AlLabel>
          <div class="wb-tab-secret-field">
            <AlInput
              id="workbench-tab-unlock-password"
              ref="passwordRef"
              v-model="interactions.unlock.password"
              :type="interactions.unlock.showPassword ? 'text' : 'password'"
              :aria-invalid="Boolean(interactions.unlock.error)"
              autocomplete="current-password"
              @keydown.escape.prevent="interactions.cancelUnlock"
            />
            <button
              type="button"
              class="wb-tab-secret-toggle"
              :aria-label="interactions.unlock.showPassword ? 'Hide password' : 'Show password'"
              @click="interactions.unlock.showPassword = !interactions.unlock.showPassword"
            >
              <EyeOff v-if="interactions.unlock.showPassword" class="size-4" />
              <Eye v-else class="size-4" />
            </button>
          </div>
        </div>

        <p v-if="interactions.unlock.hint" class="wb-tab-unlock-hint">
          Hint: {{ interactions.unlock.hint }}
        </p>
        <p v-if="interactions.unlock.error" class="wb-tab-dialog-error">
          {{ interactions.unlock.error }}
        </p>

        <DialogFooter>
          <AlButton type="button" variant="ghost" @click="interactions.cancelUnlock">
            Cancel
          </AlButton>
          <AlButton type="submit">Unlock</AlButton>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.wb-tab-dialog-form {
  display: grid;
  gap: 1rem;
}

.wb-tab-dialog-field {
  display: grid;
  gap: 0.45rem;
}

.wb-tab-secret-field {
  position: relative;
}

.wb-tab-secret-field :deep(input) {
  padding-right: 2.5rem;
}

.wb-tab-secret-toggle {
  position: absolute;
  top: 50%;
  right: 0.35rem;
  display: grid;
  width: 1.85rem;
  height: 1.85rem;
  place-items: center;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-muted);
  transform: translateY(-50%);
  cursor: pointer;
}

.wb-tab-secret-toggle:hover {
  background: var(--hover);
  color: var(--text-primary);
}

.wb-tab-unlock-hint,
.wb-tab-dialog-error {
  margin: 0;
  font-size: 0.8125rem;
}

.wb-tab-unlock-hint {
  color: var(--text-muted);
}

.wb-tab-dialog-error {
  color: var(--destructive);
}
</style>

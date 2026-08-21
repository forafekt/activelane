<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import { useWorkbenchTabInteractions } from './useWorkbenchTabInteractions'

defineOptions({ name: 'WorkbenchTabProtectionDialog' })

const runtime = useWorkbenchRuntime()
const interactions = useWorkbenchTabInteractions()
const passwordRef = ref<HTMLInputElement | null>(null)

const Eye = runtime.workbench.ui.getIcon('lucide:eye')
const EyeOff = runtime.workbench.ui.getIcon('lucide:eye-off')
const [
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
] = runtime.workbench.ui.getComponents([
  'Dialog',
  'DialogContent',
  'DialogDescription',
  'DialogFooter',
  'DialogHeader',
  'DialogTitle',
  'Button',
  'Input',
  'Label',
])

const needsSecret = computed(
  () => interactions.protection.mode === 'set' || interactions.protection.mode === 'change',
)
const actionLabel = computed(() => {
  if (interactions.protection.mode === 'remove') return 'Remove Protection'
  if (interactions.protection.mode === 'reset') return 'Reset Protection'
  if (interactions.protection.mode === 'change') return 'Change Protection'
  return 'Protect'
})
const actionVariant = computed(() =>
  interactions.protection.mode === 'remove' || interactions.protection.mode === 'reset'
    ? 'destructive'
    : 'default',
)

watch(
  () => interactions.protection.open,
  async (open) => {
    if (!open || !needsSecret.value) return
    await nextTick()
    passwordRef.value?.focus()
  },
)

function updateOpen(open: boolean) {
  if (!open) interactions.cancelProtection()
}
</script>

<template>
  <Dialog :open="interactions.protection.open" @update:open="updateOpen">
    <DialogContent class="sm:max-w-[27rem]">
      <form class="wb-tab-dialog-form" @submit.prevent="interactions.submitProtection">
        <DialogHeader>
          <DialogTitle>{{ interactions.protection.title }}</DialogTitle>
          <DialogDescription>{{ interactions.protection.description }}</DialogDescription>
        </DialogHeader>

        <p class="wb-tab-protection-note">
          This protects the tab locally in this workspace. It is not encryption unless explicitly
          implemented.
        </p>

        <template v-if="needsSecret">
          <div class="wb-tab-dialog-field">
            <Label for="workbench-tab-protection-password">PIN/password</Label>
            <div class="wb-tab-secret-field">
              <Input
                id="workbench-tab-protection-password"
                ref="passwordRef"
                v-model="interactions.protection.password"
                :type="interactions.protection.showPassword ? 'text' : 'password'"
                :aria-invalid="Boolean(interactions.protection.error)"
                autocomplete="new-password"
                @keydown.escape.prevent="interactions.cancelProtection"
              />
              <button
                type="button"
                class="wb-tab-secret-toggle"
                :aria-label="interactions.protection.showPassword ? 'Hide password' : 'Show password'"
                @click="interactions.protection.showPassword = !interactions.protection.showPassword"
              >
                <EyeOff v-if="interactions.protection.showPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </button>
            </div>
          </div>

          <div class="wb-tab-dialog-field">
            <Label for="workbench-tab-protection-confirm">Confirm PIN/password</Label>
            <Input
              id="workbench-tab-protection-confirm"
              v-model="interactions.protection.confirmation"
              :type="interactions.protection.showPassword ? 'text' : 'password'"
              :aria-invalid="Boolean(interactions.protection.error)"
              autocomplete="new-password"
              @keydown.escape.prevent="interactions.cancelProtection"
            />
          </div>

          <div class="wb-tab-dialog-field">
            <Label for="workbench-tab-protection-hint">Hint</Label>
            <Input
              id="workbench-tab-protection-hint"
              v-model="interactions.protection.hint"
              autocomplete="off"
              placeholder="Optional"
              @keydown.escape.prevent="interactions.cancelProtection"
            />
          </div>
        </template>

        <p v-else class="wb-tab-protection-warning">
          This removes the local protection metadata for this workspace. Tab content is not deleted.
        </p>

        <p v-if="interactions.protection.error" class="wb-tab-dialog-error">
          {{ interactions.protection.error }}
        </p>

        <DialogFooter>
          <Button type="button" variant="ghost" @click="interactions.cancelProtection">
            Cancel
          </Button>
          <Button type="submit" :variant="actionVariant">{{ actionLabel }}</Button>
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

.wb-tab-protection-note,
.wb-tab-protection-warning,
.wb-tab-dialog-error {
  margin: 0;
  font-size: 0.8125rem;
}

.wb-tab-protection-note {
  color: var(--text-muted);
}

.wb-tab-protection-warning,
.wb-tab-dialog-error {
  color: var(--destructive);
}
</style>

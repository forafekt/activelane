<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useWorkbenchRuntime } from '../../../composables/useWorkbenchRuntime'
import { useWorkbenchTabInteractions } from './useWorkbenchTabInteractions'

defineOptions({ name: 'WorkbenchTabRenameDialog' })

const runtime = useWorkbenchRuntime()
const interactions = useWorkbenchTabInteractions()
const inputRef = ref<HTMLInputElement | null>(null)

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

watch(
  () => interactions.rename.open,
  async (open) => {
    if (!open) return
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  },
)

function updateOpen(open: boolean) {
  if (!open) interactions.cancelRename()
}
</script>

<template>
  <Dialog :open="interactions.rename.open" @update:open="updateOpen">
    <DialogContent class="sm:max-w-[24rem]">
      <form class="wb-tab-dialog-form" @submit.prevent="interactions.submitRename">
        <DialogHeader>
          <DialogTitle>{{ interactions.rename.title }}</DialogTitle>
          <DialogDescription>{{ interactions.rename.description }}</DialogDescription>
        </DialogHeader>

        <div class="wb-tab-dialog-field">
          <Label for="workbench-tab-rename-input">Name</Label>
          <Input
            id="workbench-tab-rename-input"
            ref="inputRef"
            v-model="interactions.rename.value"
            :aria-invalid="Boolean(interactions.rename.error)"
            autocomplete="off"
            @keydown.escape.prevent="interactions.cancelRename"
          />
          <p v-if="interactions.rename.error" class="wb-tab-dialog-error">
            {{ interactions.rename.error }}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" @click="interactions.cancelRename"> Cancel </Button>
          <Button type="submit">Save</Button>
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

.wb-tab-dialog-error {
  margin: 0;
  color: var(--destructive);
  font-size: 0.8125rem;
}
</style>

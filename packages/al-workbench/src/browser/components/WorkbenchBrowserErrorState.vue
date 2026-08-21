<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import { Button } from '@activelane/shadcn'

defineOptions({ name: 'WorkbenchBrowserErrorState' })

defineProps<{
  title?: string
  message: string
  url?: string
}>()

const emit = defineEmits<{ external: [] }>()
const AlertTriangle = getIcon('lucide:triangle-alert')
const ExternalLink = getIcon('lucide:external-link')
</script>

<template>
  <section class="browser-error">
    <AlertTriangle class="browser-error__icon" />
    <h2>{{ title ?? 'This page cannot be shown inside ActiveLane' }}</h2>
    <p>{{ message }}</p>
    <p v-if="url" class="browser-error__url">{{ url }}</p>
    <Button variant="outline" size="sm" :leading-icon="ExternalLink" @click="emit('external')">
      Open Externally
    </Button>
  </section>
</template>

<style scoped>
.browser-error {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.625rem;
  height: 100%;
  min-height: 0;
  padding: 1.5rem;
  color: hsl(var(--foreground));
  text-align: center;
}

.browser-error__icon {
  width: 1.75rem;
  height: 1.75rem;
  color: hsl(var(--muted-foreground));
}

.browser-error h2 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
}

.browser-error p {
  max-width: 34rem;
  margin: 0;
  color: hsl(var(--muted-foreground));
  font-size: 0.8125rem;
  line-height: 1.45;
}

.browser-error__url {
  max-width: min(42rem, 100%);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>

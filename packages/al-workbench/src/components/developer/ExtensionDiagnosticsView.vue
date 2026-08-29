<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WorkbenchRuntimeApi } from '../../core/runtime/types'

const props = defineProps<{ runtime: WorkbenchRuntimeApi }>()
const selectedExtensionId = ref<string>()
const extensions = computed(() =>
  props.runtime.extensions.records
    .filter(
      (record) =>
        !record.manifest.builtin ||
        props.runtime.diagnostics.active.some((item) => item.extensionId === record.extensionId),
    )
    .map((record) => ({
      record,
      diagnostics: props.runtime.diagnostics.active.filter(
        (item) => item.extensionId === record.extensionId,
      ),
      instances: [...props.runtime.views.instances.values()].filter(
        (item) => item.extensionId === record.extensionId,
      ),
    })),
)
const selected = computed(
  () =>
    extensions.value.find((item) => item.record.extensionId === selectedExtensionId.value) ??
    extensions.value[0],
)
</script>

<template>
  <div class="grid h-full min-h-0 grid-cols-[minmax(15rem,0.32fr)_1fr] bg-background text-sm">
    <nav class="min-h-0 overflow-auto border-r border-border p-2" aria-label="Extensions">
      <button
        v-for="extension in extensions"
        :key="extension.record.extensionId"
        type="button"
        class="mb-1 grid w-full grid-cols-[1fr_auto] gap-2 rounded px-2 py-2 text-left hover:bg-muted"
        :class="{ 'bg-muted': selected?.record.extensionId === extension.record.extensionId }"
        @click="selectedExtensionId = extension.record.extensionId"
      >
        <span>
          <strong class="block font-medium">{{ extension.record.manifest.displayName }}</strong>
          <span class="text-xs text-muted-foreground"
            >{{ extension.record.status }}
            · {{ extension.instances.length }} views</span
          >
        </span>
        <span v-if="extension.diagnostics.length" class="text-xs text-destructive"
          >{{ extension.diagnostics.length }}</span
        >
      </button>
    </nav>

    <section v-if="selected" class="min-h-0 overflow-auto p-4">
      <h2 class="m-0 text-base font-semibold">{{ selected.record.manifest.displayName }}</h2>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ selected.record.extensionId }}
        · runtime {{ selected.record.active ? 'active' : 'inactive' }}
      </p>

      <h3 class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        View instances
      </h3>
      <p v-if="!selected.instances.length" class="text-muted-foreground">
        No active view instances.
      </p>
      <div
        v-for="instance in selected.instances"
        :key="instance.id"
        class="mb-2 rounded border border-border p-2"
      >
        <strong class="font-medium">{{ instance.definitionId }}</strong>
        <div class="mt-1 font-mono text-xs text-muted-foreground">{{ instance.id }}</div>
        <div class="text-xs text-muted-foreground">
          bridge identity available · context
          {{ instance.context === undefined ? 'absent' : 'available' }}
        </div>
      </div>

      <h3 class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Diagnostics
      </h3>
      <p v-if="!selected.diagnostics.length" class="text-muted-foreground">
        No active diagnostics.
      </p>
      <article
        v-for="diagnostic in selected.diagnostics"
        :key="diagnostic.id"
        class="mb-2 rounded border border-border p-2"
      >
        <div class="flex items-center justify-between gap-2">
          <strong class="font-mono text-xs">{{ diagnostic.code }}</strong>
          <time class="text-xs text-muted-foreground"
            >{{ new Date(diagnostic.timestamp).toLocaleTimeString() }}</time
          >
        </div>
        <p class="my-1">{{ diagnostic.message }}</p>
        <details v-if="diagnostic.detail" class="text-xs text-muted-foreground">
          <summary>Developer detail</summary>
          <pre class="whitespace-pre-wrap">{{ diagnostic.detail }}</pre>
        </details>
      </article>
    </section>
  </div>
</template>

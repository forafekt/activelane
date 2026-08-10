<script setup lang="ts">
defineOptions({ name: 'LauncherSection' })

defineProps<{
  title: string
  count?: number
}>()
</script>

<template>
  <section class="launcher-section">
    <header class="launcher-section__header">
      <h3>{{ title }}</h3>
      <span v-if="count !== undefined">{{ count }}</span>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.launcher-section {
  display: grid;
  gap: 0.75rem;
}

.launcher-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: hsl(var(--muted-foreground));
}

.launcher-section__header h3 {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.launcher-section__header span {
  font-size: 0.75rem;
}
</style>

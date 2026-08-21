<script setup lang="ts">
import { type ButtonSize, NButton } from 'naive-ui'
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label: string
    disabled?: boolean
    loading?: boolean
    size?: ButtonSize
    icon?: Component
  }>(),
  { size: 'small' },
)
</script>

<template>
  <NButton
    v-bind="$attrs"
    :aria-label="label"
    :disabled="disabled"
    :loading="loading"
    :size="size"
    quaternary
    attr-type="button"
    native-focus-behavior
  >
    <template #icon>
      <component v-if="icon" :is="icon" />
      <slot v-else />
    </template>
  </NButton>
</template>

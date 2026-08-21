<script setup lang="ts">
import { NInput } from 'naive-ui'

const model = defineModel<string | null>()
withDefaults(defineProps<{ placeholder?: string; clearable?: boolean }>(), {
  placeholder: 'Search…',
  clearable: true,
})
</script>
<template
  ><NInput v-model:value="model" type="text" :placeholder="placeholder" :clearable="clearable"
    ><template v-if="$slots.prefix" #prefix><slot name="prefix" /></template></NInput
  ></template
>

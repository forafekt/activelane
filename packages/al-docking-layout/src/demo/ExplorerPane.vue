<script setup lang="ts">
defineProps<{ active: boolean }>()
</script>
<template>
  <div class="demo-list">
    <label><span class="sr-only">Filter files</span><input placeholder="Filter files…"></label>
    <ul>
      <li>▾ src</li>
      <li class="nested active">◇ App.vue</li>
      <li class="nested">TS main.ts</li>
      <li>▾ layout</li>
      <li class="nested">▣ components</li>
      <li class="nested">◇ core</li>
      <li>▸ public</li>
    </ul>
  </div>
</template>

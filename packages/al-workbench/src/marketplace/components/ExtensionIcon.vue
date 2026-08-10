<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'

defineOptions({ name: 'ExtensionIcon' })
const props = defineProps({
  src: String,
  class: String || Object,
})

// fetch content from url

// const srcx = ref('')

// onMounted(() => {
//   fetch(props.src)
//     .then((response) => response.text())
//     .then((data) => {
//       srcx.value = data
//     })
// })
</script>

<template>
  <!-- biome-ignore lint/a11y/noSvgWithoutTitle: false positive -->
  <img :src="props.src" :class="props.class" :alt="''">
</template>

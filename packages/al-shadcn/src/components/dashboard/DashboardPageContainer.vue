<script setup lang="ts">
import Page from '../layout/Page.vue'

defineOptions({ name: 'AlDashboardPageContainer' })

defineProps<{ class?: string }>()
</script>

<template>
  <Page width="wide" :class="$props.class"> <slot /> </Page>
</template>

<script setup lang="ts">
import { getComponent } from '@activelane/ui'

defineOptions({ name: 'WorkbenchTitleBarBrand' })

// const props = defineProps<{
 
// }>()

// const runtime = useWorkbenchRuntime()


const Icon = getComponent('icon')
const Image = getComponent('image')
</script>

<template>
 <Icon size="30" :depth="1">
    <Image src="/assets/resources/activelane-a-logo3.png" width="100%" height="100%" />
  </Icon>
</template>

<script setup lang="ts">
import type { PaneInstance } from '../layout'

defineProps<{ pane: PaneInstance }>()
const surfaceInstanceId = crypto.randomUUID()
</script>
<template>
  <div class="demo-editor" :data-surface-instance="surfaceInstanceId">
    <div class="editor-gutter">1<br>2<br>3<br>4<br>5<br>6</div>
    <pre
    ><code><span class="kw">import</span> { createApp } <span class="kw">from</span> <span class="str">'vue'</span>

<span class="kw">const</span> workspace = {
  resource: <span class="str">'{{ pane.resourceId ?? 'welcome.ts' }}'</span>,
  docking: <span class="bool">true</span>,
  modular: <span class="bool">true</span>,
}

createApp(workspace).mount(<span class="str">'#app'</span>)</code></pre>
  </div>
</template>

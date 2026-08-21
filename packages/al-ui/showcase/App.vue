<script setup lang="ts">
import { ref } from 'vue'
import type { DataTableColumns, Density, ThemeMode, TreeOption } from '../src'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DataTable,
  DatePicker,
  EmptyStatePanel,
  Form,
  FormItem,
  Input,
  Modal,
  Progress,
  SearchField,
  Select,
  Skeleton,
  Split,
  StatusIndicator,
  Switch,
  TabPane,
  Tabs,
  Tag,
  Toolbar,
  Tree,
  UiProvider,
} from '../src'

const mode = ref<ThemeMode>('light')
const density = ref<Density>('compact')
const query = ref('')
const enabled = ref(true)
const checked = ref(false)
const modal = ref(false)
const rows = [
  { name: 'Registry', status: 'Healthy' },
  { name: 'Extension host', status: 'Starting' },
]
const columns: DataTableColumns<(typeof rows)[number]> = [
  { title: 'Service', key: 'name' },
  { title: 'Status', key: 'status' },
]
const tree: TreeOption[] = [
  { label: 'Workspace', key: 'root', children: [{ label: 'packages', key: 'packages' }] },
]
</script>
<template
  ><UiProvider :theme="mode" :density="density"
    ><main class="catalog">
      <Toolbar label="Showcase controls"
        ><Select
          v-model:value="mode"
          :options="['light','dark','high-contrast'].map(value => ({label:value,value}))"
        /><Select
          v-model:value="density"
          :options="['compact','comfortable'].map(value => ({label:value,value}))"
        /><Button @click="modal=true">Open modal</Button></Toolbar
      >
      <header>
        <h1>ActiveLane UI catalog</h1>
        <p>Provider, portals, states, density, narrow layouts, and component families.</p>
      </header>
      <section>
        <h2>Forms</h2>
        <Card
          ><Form
            ><FormItem
              label="Search"
              feedback="Validation feedback is intentionally visible"
              validation-status="error"
              ><SearchField v-model="query" /></FormItem
            ><FormItem label="Date"><DatePicker /></FormItem
            ><Checkbox v-model:checked="checked">Selected</Checkbox>
            <Switch v-model:value="enabled" /></Form
          ></Card
        >
      </section>
      <section>
        <h2>Data and navigation</h2>
        <Split style="height:240px" :default-size="0.28"
          ><template #1
            ><div class="narrow"><Tree :data="tree" block-line /></div></template
          ><template #2
            ><DataTable :columns="columns" :data="rows" size="small" />
            <Tabs type="line"
              ><TabPane name="one" tab="Details"><Tag>Stable</Tag></TabPane
              ><TabPane name="two" tab="Logs">Logs</TabPane></Tabs
            ></template
          ></Split
        >
      </section>
      <section>
        <h2>Feedback</h2>
        <Alert title="Provider services ready" type="info" /><Progress :percentage="68" />
        <Skeleton text :repeat="2" /><StatusIndicator status="success" label="Connected" />
      </section>
      <section>
        <h2>Empty and disabled</h2>
        <EmptyStatePanel
          title="No extensions"
          description="Install an extension to begin."
          action-label="Browse"
        /><Input disabled value="Disabled control" loading />
      </section>
      <Modal v-model:show="modal" preset="card" title="Portal check" style="width:min(28rem,90vw)"
        >The overlay inherits the active theme and density.</Modal
      >
    </main></UiProvider
  ></template
>
<style>
.catalog {
  min-height: 100vh;
  background: var(--al-ui-canvas);
  padding: 1rem;
  display: grid;
  gap: 1rem;
}
.catalog header,
.catalog section {
  max-width: 72rem;
  width: 100%;
  margin: auto;
}
.catalog h1,
.catalog h2 {
  margin: 0.25rem 0;
}
.narrow {
  width: 220px;
  padding: 0.5rem;
}
</style>

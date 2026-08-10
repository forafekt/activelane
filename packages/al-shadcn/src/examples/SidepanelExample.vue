<script setup lang="ts">
import { getIcon } from '@activelane/icons'
import CaptureListItem from '../components/sidepanel/CaptureListItem.vue'
import ContentPreviewBlock from '../components/sidepanel/ContentPreviewBlock.vue'
import SidepanelShell from '../components/sidepanel/SidepanelShell.vue'
import StickyPanelHeader from '../components/sidepanel/StickyPanelHeader.vue'
import Button from '../components/ui/Button.vue'
import IconButton from '../components/ui/IconButton.vue'

const FileText = getIcon('FileText')
const Plus = getIcon('Plus')
</script>

<template>
  <SidepanelShell wide>
    <template #list>
      <StickyPanelHeader title="Library" query="" search-placeholder="Search captures">
        <template #actions>
          <IconButton label="New note"> <Plus class="size-4" /> </IconButton>
        </template>
      </StickyPanelHeader>
      <div class="grid gap-1 p-2">
        <CaptureListItem
          selected
          title="Design systems for constrained workspaces"
          excerpt="Dense layouts need strong hierarchy, quiet surfaces, and predictable keyboard loops."
          source="ActiveLane"
          time="Today"
          :tags="['design', 'systems']"
        />
      </div>
    </template>
    <template #detail>
      <div class="grid h-full grid-rows-[auto_minmax(0,1fr)]">
        <StickyPanelHeader title="Design systems for constrained workspaces">
          <template #actions>
            <Button size="sm"><FileText class="size-4" /> Edit</Button>
          </template>
        </StickyPanelHeader>
        <main class="overflow-auto p-4">
          <ContentPreviewBlock title="Preview">
            <p>This example stays domain-light while showing the sidepanel density target.</p>
          </ContentPreviewBlock>
        </main>
      </div>
    </template>
  </SidepanelShell>
</template>

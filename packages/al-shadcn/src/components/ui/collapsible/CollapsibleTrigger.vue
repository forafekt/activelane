<script setup lang="ts">
import { getIcons } from '@activelane/icons'
import type { CollapsibleTriggerProps } from 'reka-ui'
import { CollapsibleTrigger } from 'reka-ui'

const [ChevronDown, ChevronRight] = getIcons(['lucide:chevron-down', 'lucide:chevron-right'])

defineOptions({
  name: 'CollapsibleTrigger',
})

const props = defineProps<CollapsibleTriggerProps>()
</script>

<template>
  <CollapsibleTrigger data-slot="collapsible-trigger" v-bind="props" class="collapsible-trigger">
    <div class="collapsible-trigger-icons">
      <slot name="toggle-icons">
        <ChevronDown class="collapsible-trigger-open-icon" />
        <ChevronRight class="collapsible-trigger-closed-icon" />
      </slot>
    </div>

    <div class="collapsible-trigger-label">
      <slot />
      <span class="collapsible-trigger-bottom-moving-animation"></span>
    </div>

    <div class="collapsible-trigger-actions">
      <slot name="actions" />
    </div>
  </CollapsibleTrigger>
</template>
<style scoped>
.collapsible-trigger-open-icon {
  display: none;
  width: 16px;
}

.collapsible-trigger-closed-icon {
  width: 16px;
}

button[data-state="open"] .collapsible-trigger-open-icon {
  display: block;
}

button[data-state="open"] .collapsible-trigger-closed-icon {
  display: none;
}

.collapsible-trigger {
  cursor: pointer;
  padding: 0;
  padding-inline: 0.5rem;
  border-width: 1px;
  border-color: transparent;
  border-top-color: var(--border);
  color: var(--muted-foreground);
  font-weight: bold;
  text-transform: uppercase;
  text-align: left;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.collapsible-trigger:hover {
  color: var(--primary);
  background-color: var(--background);
  transition: all 0.2s ease-in-out;
}

.collapsible-trigger:focus {
  border-color: var(--ring);
  transition: all 0.2s ease-in-out;
  color: var(--primary);
}
.collapsible-trigger:active {
  color: var(--primary);
  box-shadow:
    0 0 4px var(--ring),
    0 0 8px var(--ring),
    -4px 0 12px var(--ring); /* Trails the glow backward */
}

button[data-state="open"].collapsible-trigger {
  color: var(--primary);
}

.collapsible-trigger-bottom-moving-animation {
  display: none;
}

button[data-state="open"] .collapsible-trigger-bottom-moving-animation {
  position: relative;
  display: inline-block;
  /* Faster duration and ease-in feels more like a laser blast */
  animation: movingAnimation 0.4s ease-in forwards;
  bottom: -9px;
  height: 2px;
  width: 25px; /* Slightly longer for a sleek beam look */

  /* Pure white core makes it look intensely hot */
  background-color: var(--ring);

  /* Layered glow using the theme's ring color */
  /* box-shadow:
    0 0 4px var(--ring),
    0 0 8px var(--ring),
    -4px 0 12px var(--ring);  */

  border-radius: 1px; /* Smooths the laser tips */
}

@keyframes movingAnimation {
  0% {
    transform: scaleX(0.2) translateX(0);
    opacity: 1;
  }
  50% {
    transform: scaleX(1.2) translateX(50px);
    opacity: 1;
  }
  100% {
    transform: scaleX(0.1) translateX(550px);
    opacity: 0; /* Automatically fades out at the end */
  }
}

.collapsible-trigger-icons {
  color: var(--primary);
}

.collapsible-trigger-label {
  flex: 1;
}

.collapsible-trigger-actions {
  color: var(--primary);
  display: none;
  gap: 0.15rem;
}

.collapsible-trigger:hover .collapsible-trigger-actions {
  display: flex;
  gap: 0.15rem;
}

button[data-state="open"].collapsible-trigger .collapsible-trigger-actions {
  display: flex;
}
</style>

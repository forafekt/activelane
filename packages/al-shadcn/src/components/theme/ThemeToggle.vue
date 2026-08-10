<script setup lang="ts">
import { getIcons } from '@activelane/icons'
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme'
import IconButton from '../ui/IconButton.vue'

const [Contrast, Monitor, MoonStar, SunMedium] = getIcons([
  'Contrast',
  'Monitor',
  'MoonStar',
  'SunMedium',
])

defineOptions({ name: 'AlThemeToggle' })

withDefaults(
  defineProps<{
    compact?: boolean
    class?: string
  }>(),
  {
    compact: false,
  },
)

const { mode, setTheme } = useTheme()
const icon = computed(() =>
  mode.value === 'light'
    ? SunMedium
    : mode.value === 'dark'
      ? MoonStar
      : mode.value === 'high-contrast'
        ? Contrast
        : Monitor,
)

function cycle() {
  setTheme(
    mode.value === 'system'
      ? 'light'
      : mode.value === 'light'
        ? 'dark'
        : mode.value === 'dark'
          ? 'high-contrast'
          : 'system',
  )
}
</script>

<template>
  <IconButton
    label="Cycle theme"
    :icon="icon"
    :size="compact ? 'icon-xs' : 'icon-sm'"
    :class="$props.class"
    @click="cycle"
  />
</template>

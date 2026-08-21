<script setup lang="ts">
import {
  NConfigProvider,
  type NDateLocale,
  NDialogProvider,
  NLoadingBarProvider,
  type NLocale,
  NMessageProvider,
  NModalProvider,
  NNotificationProvider,
} from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import type { Density, ResolvedThemeMode, ThemeMode, UiThemePreset } from '../theme'
import { darkTheme, highContrastTheme, lightTheme, toNaiveTheme } from '../theme'

const props = withDefaults(
  defineProps<{
    theme?: ThemeMode | UiThemePreset
    density?: Density
    locale?: NLocale | null
    dateLocale?: NDateLocale | null
    reducedMotion?: boolean | 'system'
    abstract?: boolean
  }>(),
  {
    theme: 'system',
    density: 'compact',
    locale: null,
    dateLocale: null,
    reducedMotion: 'system',
    abstract: false,
  },
)

const systemDark = ref(false)
const systemReducedMotion = ref(false)
let darkQuery: MediaQueryList | undefined
let motionQuery: MediaQueryList | undefined
const syncSystem = () => {
  systemDark.value = !!darkQuery?.matches
  systemReducedMotion.value = !!motionQuery?.matches
}
onMounted(() => {
  darkQuery = matchMedia('(prefers-color-scheme: dark)')
  motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  syncSystem()
  darkQuery.addEventListener('change', syncSystem)
  motionQuery.addEventListener('change', syncSystem)
})
onBeforeUnmount(() => {
  darkQuery?.removeEventListener('change', syncSystem)
  motionQuery?.removeEventListener('change', syncSystem)
})

const preset = computed<UiThemePreset>(() =>
  typeof props.theme === 'object'
    ? props.theme
    : props.theme === 'dark'
      ? darkTheme
      : props.theme === 'high-contrast'
        ? highContrastTheme
        : props.theme === 'system' && systemDark.value
          ? darkTheme
          : lightTheme,
)
const resolvedMode = computed<ResolvedThemeMode>(() => preset.value.mode)
const naive = computed(() => toNaiveTheme(preset.value, props.density))
const motionReduced = computed(
  () =>
    props.reducedMotion === true || (props.reducedMotion === 'system' && systemReducedMotion.value),
)
const cssVars = computed(() => {
  const t = preset.value.tokens
  return Object.fromEntries(
    [
      ['canvas', t.colors.canvas],
      ['surface', t.colors.surface],
      ['surface-elevated', t.colors.elevated],
      ['surface-subtle', t.colors.subtle],
      ['border', t.colors.border],
      ['text', t.colors.text],
      ['text-muted', t.colors.textMuted],
      ['primary', t.colors.primary],
      ['focus-ring', t.colors.focus],
      ['selected', t.colors.selected],
      ['success', t.colors.success],
      ['warning', t.colors.warning],
      ['error', t.colors.error],
      ['info', t.colors.info],
      ['control-radius', t.radius.medium],
      ['overlay-radius', t.radius.large],
      ['control-height', props.density === 'compact' ? '1.75rem' : '2.125rem'],
      ['list-row-height', props.density === 'compact' ? '1.875rem' : '2.25rem'],
    ].map(([key, value]) => [`--al-ui-${key}`, value]),
  )
})

watchEffect(() => {
  /* keep all provider inputs reactive before descendant services resolve */ void naive.value
})
</script>

<template>
  <div
    class="al-ui-root"
    :data-theme="resolvedMode"
    :data-density="density"
    :data-reduced-motion="motionReduced || undefined"
    :style="cssVars"
  >
    <NConfigProvider
      :theme="naive.theme"
      :theme-overrides="naive.overrides"
      :locale="locale || undefined"
      :date-locale="dateLocale || undefined"
      :abstract="abstract"
    >
      <NLoadingBarProvider
        ><NDialogProvider
          ><NModalProvider
            ><NNotificationProvider
              ><NMessageProvider>
                <slot />
              </NMessageProvider></NNotificationProvider
            ></NModalProvider
          ></NDialogProvider
        ></NLoadingBarProvider
      >
    </NConfigProvider>
  </div>
</template>

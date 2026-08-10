export const themeModes = ['system', 'light', 'dark', 'high-contrast'] as const
export type ThemeMode = (typeof themeModes)[number]

export const densityModes = ['compact', 'comfortable', 'touch'] as const
export type DensityMode = (typeof densityModes)[number]

export const zIndex = {
  dropdown: 40,
  sticky: 50,
  overlay: 60,
  modal: 70,
  toast: 80,
} as const

export const motion = {
  fast: 'var(--motion-fast)',
  normal: 'var(--motion-normal)',
  slow: 'var(--motion-slow)',
  standard: 'var(--ease-standard)',
  emphasized: 'var(--ease-emphasized)',
} as const

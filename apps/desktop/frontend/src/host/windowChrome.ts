import { System } from '@wailsio/runtime'
import { onMounted, reactive, readonly } from 'vue'
import { workbenchWindow } from '../services/native'

export type DesktopOperatingSystem = 'macos' | 'windows' | 'linux'

export function normalizeOperatingSystem(platform: string): DesktopOperatingSystem {
  if (platform === 'darwin') return 'macos'
  if (platform === 'win32') return 'windows'
  return 'linux'
}

export function useDesktopWindowChrome() {
  const platform = System.IsMac() ? 'darwin' : System.IsWindows() ? 'win32' : 'linux'
  const os = normalizeOperatingSystem(platform)
  const state = reactive({
    maximized: false,
    fullscreen: false,
  })

  onMounted(async () => {
    state.maximized = await workbenchWindow.IsMaximised()
    state.fullscreen = await workbenchWindow.IsFullscreen()
  })

  function handleTitleBarDoubleClick(event: MouseEvent) {
    if ((event.target as HTMLElement | null)?.closest('[data-desktop-no-drag]')) return
    if (os === 'macos') {
      void toggleFullscreen()
      return
    }
    void toggleMaximize()
  }

  async function toggleMaximize() {
    if (await workbenchWindow.IsMaximised()) await workbenchWindow.Restore()
    else await workbenchWindow.Maximise()
    state.maximized = await workbenchWindow.IsMaximised()
  }

  async function toggleFullscreen() {
    if (await workbenchWindow.IsFullscreen()) await workbenchWindow.Restore()
    else await workbenchWindow.Fullscreen()
    state.fullscreen = await workbenchWindow.IsFullscreen()
  }

  return {
    platform,
    os,
    state: readonly(state),
    minimize: () => workbenchWindow.Minimise(),
    toggleMaximize,
    toggleFullscreen,
    close: () => workbenchWindow.Close(),
    handleTitleBarDoubleClick,
  }
}

export type DesktopWindowChrome = ReturnType<typeof useDesktopWindowChrome>

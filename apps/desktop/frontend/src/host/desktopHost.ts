import type { WorkbenchHost, WorkbenchNativePlatform } from '@activelane/workbench'
import { System } from '@wailsio/runtime'
import { reactive, readonly } from 'vue'
import { workbenchWindow } from '../services/native'

export function normalizeOperatingSystem(platform: string): WorkbenchNativePlatform {
  if (platform === 'darwin') return 'macos'
  if (platform === 'win32') return 'windows'
  return 'linux'
}

export function useDesktopHost(): WorkbenchHost {
  const runtimePlatform = System.IsMac() ? 'darwin' : System.IsWindows() ? 'win32' : 'linux'
  const platform = normalizeOperatingSystem(runtimePlatform)
  const state = reactive({
    maximized: false,
    fullscreen: false,
  })

  void Promise.all([workbenchWindow.IsMaximised(), workbenchWindow.IsFullscreen()]).then(
    ([maximized, fullscreen]) => Object.assign(state, { maximized, fullscreen }),
  )

  function handleTitleBarDoubleClick(event?: MouseEvent) {
    if ((event?.target as HTMLElement | null)?.closest('[data-desktop-no-drag]')) return
    if (platform === 'macos') {
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
    window: {
      state: readonly(state),
      minimize: () => workbenchWindow.Minimise(),
      toggleMaximize,
      close: () => workbenchWindow.Close(),
      handleTitleBarDoubleClick,
    },
  }
}

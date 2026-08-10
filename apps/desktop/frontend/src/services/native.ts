import type {
  WorkbenchDialogOptions,
  WorkbenchFileHandle,
  WorkbenchFileSystemEntry,
  WorkbenchHostCapabilities,
  WorkbenchNotificationOptions,
} from '@activelane/workbench-api'
import { Clipboard, Dialogs, System, Window as WailsWindow } from '@wailsio/runtime'
import {
  ReadDirectory,
  ReadFile,
  Root,
  SetRoot,
  WriteFile,
} from '../../bindings/github.com/activelane/desktop/workspaceservice'

export async function getPlatform() {
  return (await System.Environment()).OS
}

export const workbenchWindow = WailsWindow

export function createNativeCapabilities(): WorkbenchHostCapabilities {
  return {
    lifecycle: { closeWindow: () => workbenchWindow.Close() },
    storage: undefined,
    notify: async ({ title, message, tone }: WorkbenchNotificationOptions) => {
      const options = { Title: title, Message: message ?? '' }
      if (tone === 'error') await Dialogs.Error(options)
      else if (tone === 'warning') await Dialogs.Warning(options)
      else await Dialogs.Info(options)
      return undefined
    },
    confirm: async ({ title, message, confirmLabel, cancelLabel }: WorkbenchDialogOptions) => {
      const accepted = confirmLabel ?? 'OK'
      const result = await Dialogs.Question({
        Title: title,
        Message: message,
        Buttons: [
          { Label: cancelLabel ?? 'Cancel', IsCancel: true },
          { Label: accepted, IsDefault: true },
        ],
      })
      return result === accepted
    },
    clipboard: {
      readText: () => Clipboard.Text(),
      writeText: (value) => Clipboard.SetText(value),
    },
    network: { fetch: (input, init) => fetch(input, init) },
    files: {
      open: async () => {
        const path = await Dialogs.OpenFile({ Title: 'Open File', CanChooseFiles: true })
        return path ? (ReadFile(path) as Promise<WorkbenchFileHandle>) : null
      },
      read: (path) => ReadFile(path) as Promise<WorkbenchFileHandle>,
      openFolder: async () => {
        const path = await Dialogs.OpenFile({
          Title: 'Open Folder',
          CanChooseFiles: false,
          CanChooseDirectories: true,
        })
        if (!path) return undefined
        await SetRoot(path)
        return path
      },
      openWorkspaceFile: async () => {
        const path = await Dialogs.OpenFile({ Title: 'Open Workspace', CanChooseFiles: true })
        return path ? (ReadFile(path) as Promise<WorkbenchFileHandle>) : null
      },
      saveAs: async (file) => {
        const path = await Dialogs.SaveFile({ Title: 'Save File', Filename: file.name })
        return path ? (WriteFile({ ...file, path }) as Promise<WorkbenchFileHandle>) : null
      },
      save: async (file) => {
        if (file.path) {
          await WriteFile(file)
          return
        }
        const path = await Dialogs.SaveFile({ Title: 'Save File', Filename: file.name })
        if (path) await WriteFile({ ...file, path })
      },
      workspaceRoot: async () => (await Root()) || undefined,
      readDirectory: async (path) =>
        (await ReadDirectory(path ?? '')) as WorkbenchFileSystemEntry[],
    },
  }
}

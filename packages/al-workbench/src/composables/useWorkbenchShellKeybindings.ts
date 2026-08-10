import type { WorkbenchRuntimeApi } from '@activelane/workbench-api'
import { onBeforeUnmount, onMounted } from 'vue'

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function normalizeShortcut(shortcut: string) {
  return shortcut
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
}

function matchShortcut(event: KeyboardEvent, shortcut: string) {
  const parts = normalizeShortcut(shortcut)
  const main = parts.find(
    (part) => !['mod', 'ctrl', 'control', 'meta', 'cmd', 'shift', 'alt', 'option'].includes(part),
  )
  const wantsMod =
    parts.includes('mod') ||
    parts.includes('ctrl') ||
    parts.includes('control') ||
    parts.includes('meta') ||
    parts.includes('cmd')
  const wantsShift = parts.includes('shift')
  const wantsAlt = parts.includes('alt') || parts.includes('option')
  const hasMod = navigator.platform.toLowerCase().includes('mac') ? event.metaKey : event.ctrlKey

  if (Boolean(wantsMod) !== Boolean(hasMod)) return false
  if (Boolean(wantsShift) !== Boolean(event.shiftKey)) return false
  if (Boolean(wantsAlt) !== Boolean(event.altKey)) return false
  if (!main) return false

  const normalizedKey = event.key.toLowerCase()
  const aliases: Record<string, string[]> = {
    right: ['arrowright'],
    left: ['arrowleft'],
    up: ['arrowup'],
    down: ['arrowdown'],
    esc: ['escape'],
  }

  return normalizedKey === main || aliases[main]?.includes(normalizedKey) === true
}

export function useWorkbenchShellKeybindings(runtime: WorkbenchRuntimeApi) {
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && runtime.workbench.state.commandPaletteOpen) {
      event.preventDefault()
      runtime.workbench.setCommandPaletteOpen(false)
      runtime.workbench.setCommandBarFocused(false)
      return
    }

    const command = runtime.commands.search.list().find((entry) => {
      const shortcuts = Array.isArray(entry.shortcut)
        ? entry.shortcut
        : [entry.shortcut].filter((shortcut): shortcut is string => Boolean(shortcut))
      return shortcuts.some((candidate) => candidate && matchShortcut(event, candidate))
    })
    if (!command) return
    if (isEditableTarget(event.target) && command.commandId !== 'workbench.commandPalette.open')
      return
    event.preventDefault()
    void runtime.commands.search.execute(command.commandId)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}

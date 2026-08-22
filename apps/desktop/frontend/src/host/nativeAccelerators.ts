import type {
  WorkbenchNativeApplicationMenuSnapshot,
  WorkbenchNativePlatform,
} from '@activelane/workbench'

const modifierAliases: Record<string, string> = {
  alt: 'OptionOrAlt',
  cmd: 'Cmd',
  cmdorctrl: 'CmdOrCtrl',
  command: 'Cmd',
  commandorcontrol: 'CmdOrCtrl',
  control: 'Ctrl',
  ctrl: 'Ctrl',
  meta: 'Super',
  mod: 'CmdOrCtrl',
  option: 'OptionOrAlt',
  optionoralt: 'OptionOrAlt',
  shift: 'Shift',
  super: 'Super',
}

const keyAliases: Record<string, string> = {
  arrowdown: 'Down',
  arrowleft: 'Left',
  arrowright: 'Right',
  arrowup: 'Up',
  backspace: 'Backspace',
  delete: 'Delete',
  down: 'Down',
  enter: 'Enter',
  esc: 'Escape',
  escape: 'Escape',
  left: 'Left',
  minus: '-',
  option: 'Option',
  plus: 'plus',
  return: 'Enter',
  right: 'Right',
  space: 'Space',
  tab: 'Tab',
  up: 'Up',
}

function normalizeKey(part: string) {
  const lower = part.toLowerCase()
  if (/^f\d{1,2}$/.test(lower)) return lower.toUpperCase()
  return keyAliases[lower] ?? part
}

function normalizeModifier(part: string, platform: WorkbenchNativePlatform) {
  const lower = part.toLowerCase()
  if (lower === 'meta') return platform === 'macos' ? 'Cmd' : 'Super'
  return modifierAliases[lower]
}

export function toWailsAccelerator(
  shortcut: string | null | undefined,
  platform: WorkbenchNativePlatform,
): string | undefined {
  const parts = shortcut?.split('+').map((part) => part.trim())

  if (!parts?.length) return undefined

  const key = parts.at(-1)
  if (!key) return undefined
  if (parts.length === 1 && normalizeModifier(key, platform)) return undefined

  const modifiers = parts.slice(0, -1).map((part) => normalizeModifier(part, platform))

  if (modifiers.some((part) => !part)) return undefined

  return [...(modifiers as string[]), normalizeKey(key)].join('+')
}

export type DesktopNativeMenuSnapshot = {
  platform: 'desktop'
  os: WorkbenchNativePlatform
  menus: DesktopNativeMenuGroup[]
}

export type DesktopNativeMenuGroup = {
  id: string
  label: string
  menuId: string
  order: number
  items: DesktopNativeMenuItem[]
}

export type DesktopNativeMenuItem =
  | {
      kind: 'command'
      id: string
      label: string
      commandId: string
      enabled: boolean
      visible: boolean
      group?: string
      order: number
      accelerator?: string
      nativeRole?: string
      checked?: boolean
    }
  | {
      kind: 'separator'
      id: string
      group?: string
      order: number
    }
  | {
      kind: 'submenu'
      id: string
      label: string
      menuId: string
      group?: string
      order: number
      items: DesktopNativeMenuItem[]
    }

function toDesktopNativeMenuItem(
  item: WorkbenchNativeApplicationMenuSnapshot['menus'][number]['items'][number],
  platform: WorkbenchNativePlatform,
): DesktopNativeMenuItem {
  if (item.kind === 'separator') return item
  if (item.kind === 'submenu') {
    return {
      ...item,
      items: item.items.map((child) => toDesktopNativeMenuItem(child, platform)),
    }
  }
  const accelerator = toWailsAccelerator(item.shortcut, platform)
  return { ...item, ...(accelerator ? { accelerator } : {}) }
}

export function toDesktopNativeMenuSnapshot(
  snapshot: WorkbenchNativeApplicationMenuSnapshot,
  platform: WorkbenchNativePlatform,
): DesktopNativeMenuSnapshot {
  return {
    platform: 'desktop',
    os: platform,
    menus: snapshot.menus.map((menu) => ({
      id: menu.id,
      label: menu.label,
      menuId: menu.menuId,
      order: menu.order,
      items: menu.items.map((item) => toDesktopNativeMenuItem(item, platform)),
    })),
  }
}

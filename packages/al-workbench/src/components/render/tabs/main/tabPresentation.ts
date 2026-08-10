import type { WorkbenchTabColorId } from '../../../../core/workbench/contributions'

export const TAB_COLOR_OPTIONS: Array<{ id: WorkbenchTabColorId; label: string }> = [
  { id: 'default', label: 'Default' },
  { id: 'blue', label: 'Blue' },
  { id: 'green', label: 'Green' },
  { id: 'amber', label: 'Amber' },
  { id: 'rose', label: 'Rose' },
  { id: 'violet', label: 'Violet' },
  { id: 'slate', label: 'Slate' },
]

export function tabColorClass(color: WorkbenchTabColorId | undefined) {
  return color && color !== 'default' ? `wb-tab-color--${color}` : 'wb-tab-color--default'
}

export function colorLabel(color: WorkbenchTabColorId | undefined) {
  return TAB_COLOR_OPTIONS.find((item) => item.id === (color ?? 'default'))?.label ?? 'Default'
}

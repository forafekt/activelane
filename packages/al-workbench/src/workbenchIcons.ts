import { getIcon } from '@activelane/icons'

const ChevronLeft = getIcon('lucide:chevron-left')

const ChevronRight = getIcon('lucide:chevron-right')

const Copy = getIcon('lucide:copy')

const Minus = getIcon('lucide:minus')

const Square = getIcon('lucide:square')

const X = getIcon('lucide:x')

const PanelLeft = getIcon('lucide:panel-left')

const PanelLeftFill = getIcon('lucide:panel-left-dashed')

const PanelRight = getIcon('lucide:panel-right')

const PanelRightFill = getIcon('lucide:panel-right-dashed')

const PanelBottom = getIcon('lucide:panel-bottom')

const PanelBottomFill = getIcon('lucide:panel-bottom-dashed')

const registry = {
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelLeftFill,
  PanelRight,
  PanelRightFill,
  PanelBottom,
  PanelBottomFill,
  MinimizeWindow: Minus,
  RestoreDownWindow: Copy,
  MaximizeWindow: Square,
  CloseWindow: X,
}

export function getWorkbenchIcon(
  nameA: keyof typeof registry,
  nameB?: keyof typeof registry,
  bool?: boolean,
) {
  if (nameB && bool === true) return registry[nameB]
  return registry[nameA]
}

export function getWorkbenchIcons(
  names: [nameA: keyof typeof registry, nameB?: keyof typeof registry, bool?: boolean][],
  $bool?: boolean,
) {
  return names.map(([nameA, nameB, bool]) => getWorkbenchIcon(nameA, nameB, bool ?? $bool))
}

import { getIcons } from '@activelane/icons'

const [ChevronLeft, ChevronRight] = getIcons(['ChevronLeft', 'ChevronRight'], 'lucide')
const [Copy, Minus, Square, X] = getIcons(['Copy', 'Minus', 'Square', 'X'])

const [PanelLeft, PanelLeftFill, PanelRight, PanelRightFill, PanelBottom, PanelBottomFill] =
  getIcons(
    [
      'PanelLeft',
      'PanelLeftFill',
      'PanelRight',
      'PanelRightFill',
      'PanelBottom',
      'PanelBottomFill',
    ],
    'custom',
  )

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

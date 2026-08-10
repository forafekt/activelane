import type { IconComponent } from '../../types'

export interface DashboardActionItem {
  id: string
  title: string
  description?: string
  icon?: IconComponent
  badge?: string | number
}

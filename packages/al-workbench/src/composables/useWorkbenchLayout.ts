import type { WorkbenchPartContribution, WorkbenchRuntimeApi } from '@activelane/workbench-api'
import { computed } from 'vue'
import { useWorkbenchRuntime } from './useWorkbenchRuntime'

const builtinParts: WorkbenchPartContribution[] = [
  {
    id: 'workbench.part.topBar',
    title: 'Top Bar',
    part: 'topBar',
    zone: 'top',
    order: 10,
    defaultVisible: true,
    movable: true,
  },
  {
    id: 'workbench.part.activityRail',
    title: 'Activity Bar',
    part: 'activityRail',
    zone: 'left',
    order: 20,
    defaultVisible: true,
    movable: true,
  },
  {
    id: 'workbench.part.primarySideBar',
    title: 'Primary Side Bar',
    part: 'primarySideBar',
    zone: 'left',
    order: 30,
    defaultVisible: true,
  },
  {
    id: 'workbench.part.editor',
    title: 'Editor Area',
    part: 'editor',
    zone: 'center',
    order: 40,
    defaultVisible: true,
  },
  {
    id: 'workbench.part.secondarySideBar',
    title: 'Secondary Side Bar',
    part: 'secondarySideBar',
    zone: 'right',
    order: 50,
    defaultVisible: true,
  },
  {
    id: 'workbench.part.bottomPanel',
    title: 'Bottom Panel',
    part: 'bottomPanel',
    zone: 'bottom',
    order: 60,
    defaultVisible: false,
  },
]

export function useWorkbenchLayout(activeRuntime?: WorkbenchRuntimeApi) {
  const runtime = activeRuntime ?? useWorkbenchRuntime()

  const parts = computed(() =>
    [...builtinParts, ...runtime.registry.parts].sort(
      (left, right) =>
        (left.order ?? 0) - (right.order ?? 0) || left.title.localeCompare(right.title),
    ),
  )

  function part(partId: WorkbenchPartContribution['part']) {
    return parts.value.find((item) => item.part === partId)
  }

  const activityRailVisible = computed(
    () => runtime.settings.get<boolean>('workbench.layout.activityRail.visible') !== false,
  )

  const commandBarVisible = computed(
    () =>
      runtime.workbench.state.layoutPreference.commandBarVisible &&
      runtime.settings.get<boolean>('workbench.layout.commandBar.visible') !== false,
  )

  return {
    parts,
    part,
    activityRailVisible,
    commandBarVisible,
  }
}

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const tsxCli = fileURLToPath(new URL('../../../node_modules/tsx/dist/cli.mjs', import.meta.url))

test('workbench contribution normalization keeps component references non-reactive', () => {
  const script = `
    import assert from 'node:assert/strict'
    import { isReactive, markRaw, reactive } from 'vue'
    import {
      normalizeWorkbenchContribution,
      normalizeWorkbenchTabOptions,
    } from './packages/al-workbench-api/src/workbench/normalizeComponents.ts'

    const activityIcon = { name: 'ActivityIcon' }
    const toolbarIcon = { name: 'ToolbarIcon' }
    const surfaceComponent = { name: 'SurfaceComponent' }

    const activity = normalizeWorkbenchContribution(
      'activityRail',
      { id: 'test.activity', title: 'Activity', icon: activityIcon },
      markRaw,
    )
    const toolbarAction = normalizeWorkbenchContribution(
      'tabToolbarActions',
      { id: 'test.action', title: 'Action', icon: toolbarIcon, run: () => undefined },
      markRaw,
    )
    const tab = normalizeWorkbenchTabOptions(
      {
        id: 'test.tab',
        title: 'Tab',
        kind: 'custom',
        surface: { id: 'test.surface', mode: 'native-vue', component: surfaceComponent },
      },
      markRaw,
    )

    const registry = reactive({
      activityRail: [activity],
      tabToolbarActions: [toolbarAction],
      tabs: [tab],
    })

    assert.equal(isReactive(registry.activityRail[0].icon), false)
    assert.equal(isReactive(registry.tabToolbarActions[0].icon), false)
    assert.equal(isReactive(registry.tabs[0].surface.component), false)
  `

  const result = spawnSync(process.execPath, [tsxCli, '-e', script], {
    cwd: fileURLToPath(new URL('../../..', import.meta.url)),
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})

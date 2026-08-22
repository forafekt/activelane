import type {
  ExtensionContext,
  ExtensionDefinition,
} from '@activelane/extension'
import { defineComponent, h } from 'vue'

const RuntimeTestView = defineComponent({
  name: 'RuntimeTestView',
  setup: () => () =>
    h('section', { class: 'runtime-test-view' }, [
      h('h2', 'Runtime Test'),
      h('p', 'Loaded from an installed ALX package.'),
    ]),
})

export default {
  manifest: {
    id: '@activelane/runtime-test',
    publisher: 'activelane',
    name: 'runtime-test',
    displayName: 'Runtime Test',
    version: '1.1.1',
  },
  activate(context: ExtensionContext) {
    context.contribute.activityRail({
      id: 'runtime-test.activity',
      title: 'Runtime Test',
      icon: 'flask-conical',
      order: 900,
      activate: ({ workbench }) => workbench.setActiveSidebarView('runtime-test.sidebar'),
    })
    context.contribute.sidebarViews({
      id: 'runtime-test.sidebar',
      title: 'Runtime Test',
      component: RuntimeTestView,
    })
    context.contribute.commands({
      id: 'runtime-test.hello',
      title: 'Runtime Test: Hello',
      run: () =>
        context.host.capabilities.notify?.({
          title: 'Runtime Test',
          message: 'Hello from an installed extension.',
        }),
    })
  },
} satisfies ExtensionDefinition

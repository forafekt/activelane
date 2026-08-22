import { defineExtension } from '@activelane/extension'

// `alx dev` bundles and reloads this lifecycle module independently from isolated-view HMR.

const extensionId = '@activelane/api-studio'
const requests = [
  { id: 'users', method: 'GET', url: 'https://api.example.com/users' },
  { id: 'orders', method: 'POST', url: 'https://api.example.com/orders' },
  { id: 'settings', method: 'PUT', url: 'https://api.example.com/settings' },
]

export default defineExtension({
  manifest: {
    id: extensionId,
    name: 'api-studio',
    displayName: 'ActiveLane API Studio',
    version: '0.1.0',
    activationEvents: ['onStartup', 'onCommand', 'onView'],
  },
  activate(context) {
    const openRequest = (requestId: string) => {
      const request = requests.find((candidate) => candidate.id === requestId)
      if (!request) return
      context.workbench.openView('api-studio.request-editor', {
        resource: `request:${request.id}`,
        title: `${request.method} ${new URL(request.url).pathname}`,
        context: { requestId: request.id },
        preview: false,
      })
      context.workbench.setInspectorCollapsed(false)
      context.workbench.setBottomPanelOpen(true)
    }
    const resources = [
      context.capabilities.register(
        { id: 'apiStudio.requests.list', title: 'List API Studio requests', kind: 'service' },
        async () => requests,
      ),
      context.contribute.commands(
        {
          id: 'api-studio.open-users',
          title: 'API Studio: Open Users Request',
          run: () => openRequest('users'),
        },
        {
          id: 'api-studio.open-orders',
          title: 'API Studio: Open Orders Request',
          run: () => openRequest('orders'),
        },
        {
          id: 'api-studio.open-settings',
          title: 'API Studio: Open Settings Request',
          run: () => openRequest('settings'),
        },
      ),
    ]
    return {
      dispose: () =>
        resources.forEach((resource) => {
          resource.dispose()
        }),
    }
  },
})

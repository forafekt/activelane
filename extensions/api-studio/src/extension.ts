import { defineExtension } from '@activelane/workbench/extensions'

const extensionId = '@activelane/api-studio'
const requests = [
  { id: 'users', method: 'GET', url: 'https://api.example.com/users' },
  { id: 'orders', method: 'POST', url: 'https://api.example.com/orders' },
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
    const resources = [
      context.capabilities.register(
        { id: 'apiStudio.requests.list', title: 'List API Studio requests', kind: 'service' },
        async () => requests,
      ),
      context.contribute.commands({
        id: 'api-studio.open-request',
        title: 'API Studio: Open Request',
        run: () => {
          const request = requests[0]
          if (!request) return
          context.workbench.openTab({
            id: `api-studio.request:${crypto.randomUUID()}`,
            kind: 'api-studio.request-editor',
            surfaceId: 'api-studio.request-editor',
            title: `${request.method} /users`,
            ownerExtensionId: extensionId,
            input: { requestId: request.id },
            preview: false,
          })
        },
      }),
    ]
    return {
      dispose: () =>
        resources.forEach((resource) => {
          resource.dispose()
        }),
    }
  },
})

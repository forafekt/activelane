import { connectActiveLaneView } from '@activelane/extension-view'
import './view.css'

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('API Studio view root is missing.')
const surface = document.body.dataset.surface ?? 'view'
const activelane = await connectActiveLaneView()
const context = await activelane.view.getContext<Record<string, unknown>>()
const theme = await activelane.theme.getCurrent()
applyTheme(theme.tokens)
activelane.theme.onDidChange((next) => applyTheme(next.tokens))

if (surface === 'sidebar') {
  const requests = await activelane.services.call<
    Array<{ id: string; method: string; url: string }>
  >('apiStudio.requests', 'list')
  root.innerHTML = `<header><strong>Collections</strong></header>${requests.map((request) => `<button class="request" data-request="${request.id}"><b>${request.method}</b><span>${request.url}</span></button>`).join('')}`
  for (const button of root.querySelectorAll<HTMLElement>('[data-request]')) {
    button.addEventListener('click', () => {
      const requestId = button.dataset.request
      if (requestId) void activelane.commands.execute(`api-studio.open-${requestId}`)
    })
  }
} else if (surface === 'editor') {
  const requests = await activelane.services.call<
    Array<{ id: string; method: string; url: string }>
  >('apiStudio.requests', 'list')
  const request = requests.find((candidate) => candidate.id === context?.requestId)
  root.innerHTML = `<header><strong>${request?.method ?? 'Request'}</strong><button id="send">Send</button></header><main><label>URL<input value="${request?.url ?? ''}"></label><p>Instance context</p><code>${escapeHtml(JSON.stringify(context ?? {}, null, 2))}</code></main>`
  await activelane.view.setTitle(
    `${request?.method ?? 'Request'} ${request ? new URL(request.url).pathname : ''}`,
  )
  root.querySelector('input')?.addEventListener('input', () => void activelane.view.setDirty(true))
  root.querySelector('#send')?.addEventListener('click', () => {
    void activelane.events.emit('api-studio.request-sent', {
      requestId: request?.id,
      method: request?.method,
      sentAt: new Date().toISOString(),
    })
  })
} else if (surface === 'inspector') {
  root.innerHTML = `<header><strong>Inspector</strong></header><main><p>Active editor context</p><code>${escapeHtml(JSON.stringify(context ?? {}, null, 2))}</code><p id="event">Waiting for request events…</p></main>`
  activelane.events.on<{ requestId?: string }>('api-studio.request-sent', (event) => {
    const target = root.querySelector('#event')
    if (target) target.textContent = `Observed request: ${event.requestId ?? 'unknown'}`
  })
} else if (surface === 'log') {
  root.innerHTML =
    '<header><strong>Request Log</strong></header><main><ol id="events"><li>Bridge connected</li></ol></main>'
  activelane.events.on<{ requestId?: string; sentAt?: string }>(
    'api-studio.request-sent',
    (event) => {
      root
        .querySelector('#events')
        ?.insertAdjacentHTML(
          'afterbegin',
          `<li>${escapeHtml(event.requestId ?? 'unknown')} · ${escapeHtml(event.sentAt ?? '')}</li>`,
        )
    },
  )
}

function applyTheme(tokens: Record<string, string>) {
  for (const [name, value] of Object.entries(tokens))
    document.documentElement.style.setProperty(name, value)
}
function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

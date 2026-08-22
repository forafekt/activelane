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
  root.innerHTML = `<header><strong>Collections</strong><button id="open">New tab</button></header>${requests.map((request) => `<button class="request"><b>${request.method}</b><span>${request.url}</span></button>`).join('')}`
  root
    .querySelector('#open')
    ?.addEventListener('click', () => void activelane.commands.execute('api-studio.open-request'))
} else {
  root.innerHTML = `<header><strong>${surface}</strong></header><main><p>Isolated ${surface} application</p><code>${escapeHtml(JSON.stringify(context ?? {}, null, 2))}</code></main>`
}

function applyTheme(tokens: Record<string, string>) {
  for (const [name, value] of Object.entries(tokens))
    document.documentElement.style.setProperty(name, value)
}
function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

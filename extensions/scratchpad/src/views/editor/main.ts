import { connectActiveLaneView } from '@activelane/extension/view'
import './style.css'

const activelane = await connectActiveLaneView()

const context = await activelane.view.getContext<{ noteId: string }>()

const editor = document.querySelector<HTMLTextAreaElement>('textarea')!

const status = document.querySelector<HTMLElement>('#status')!

editor.value = (await activelane.storage.get<string>(context.noteId)) ?? ''

status.textContent = context.noteId

editor.addEventListener('input', () => {
  void activelane.storage.set(context.noteId, editor.value)
  void activelane.view.setDirty(editor.value.length > 0)
})

window.addEventListener('beforeunload', () => activelane.dispose(), { once: true })

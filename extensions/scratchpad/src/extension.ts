import { defineExtension } from '@activelane/extension'

export default defineExtension({
  manifest: {
    id: '@activelane/scratchpad',
    name: 'scratchpad',
    displayName: 'Scratchpad',
    version: '0.1.0',
  },
  activate(runtime) {
    let sequence = 0
    runtime.contribute.commands({
      id: 'scratchpad.new',
      title: 'Scratchpad: New Note',
      run: () => {
        const noteId = `note-${Date.now()}-${sequence++}`
        runtime.workbench.openView('scratchpad.editor', {
          resource: noteId,
          title: 'Untitled note',
          context: { noteId },
          policy: 'always-new',
        })
      },
    })
  },
})

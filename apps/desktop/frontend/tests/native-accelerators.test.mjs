import assert from 'node:assert/strict'
import test from 'node:test'
import { toDesktopNativeMenuSnapshot, toWailsAccelerator } from '../src/host/nativeAccelerators.ts'

test('converts workbench shortcuts to Wails accelerators', () => {
  assert.equal(toWailsAccelerator('Mod+O', 'macos'), 'CmdOrCtrl+O')
  assert.equal(toWailsAccelerator('Mod+Alt+N', 'windows'), 'CmdOrCtrl+OptionOrAlt+N')
  assert.equal(toWailsAccelerator('Meta+Shift+P', 'macos'), 'Cmd+Shift+P')
  assert.equal(toWailsAccelerator('Meta+Shift+P', 'linux'), 'Super+Shift+P')
  assert.equal(toWailsAccelerator('Ctrl+Option+ArrowRight', 'macos'), 'Ctrl+OptionOrAlt+Right')
})

test('omits missing, blank, and invalid accelerators', () => {
  assert.equal(toWailsAccelerator(undefined, 'macos'), undefined)
  assert.equal(toWailsAccelerator(null, 'macos'), undefined)
  assert.equal(toWailsAccelerator('', 'macos'), undefined)
  assert.equal(toWailsAccelerator('   ', 'macos'), undefined)
  assert.equal(toWailsAccelerator('Mod+', 'macos'), undefined)
  assert.equal(toWailsAccelerator('Hyper+K', 'macos'), undefined)
})

test('desktop native menu snapshot uses optional accelerators recursively', () => {
  const converted = toDesktopNativeMenuSnapshot(
    {
      platform: 'desktop',
      os: 'macos',
      menus: [
        {
          id: 'menu.file',
          label: 'File',
          menuId: 'file',
          order: 10,
          items: [
            {
              kind: 'command',
              id: 'file.open',
              label: 'Open',
              commandId: 'core.open',
              enabled: true,
              visible: true,
              order: 10,
              shortcut: 'Mod+O',
            },
            {
              kind: 'command',
              id: 'extension.run',
              label: 'Run Extension',
              commandId: 'extension.run',
              enabled: true,
              visible: true,
              order: 20,
            },
            {
              kind: 'separator',
              id: 'separator',
              order: 30,
            },
            {
              kind: 'submenu',
              id: 'file.more',
              label: 'More',
              menuId: 'file.more',
              order: 40,
              items: [
                {
                  kind: 'command',
                  id: 'file.more.blank',
                  label: 'Blank',
                  commandId: 'core.blank',
                  enabled: true,
                  visible: true,
                  order: 10,
                  shortcut: '',
                },
              ],
            },
          ],
        },
      ],
    },
    'macos',
  )

  const [open, extension, separator, submenu] = converted.menus[0].items
  assert.equal(open.accelerator, 'CmdOrCtrl+O')
  assert.equal(Object.hasOwn(extension, 'accelerator'), false)
  assert.equal(Object.hasOwn(separator, 'accelerator'), false)
  assert.equal(Object.hasOwn(submenu, 'accelerator'), false)
  assert.equal(Object.hasOwn(submenu.items[0], 'accelerator'), false)
})

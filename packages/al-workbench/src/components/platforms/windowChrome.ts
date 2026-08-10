export interface WorkbenchWindowChrome {
  os?: 'macos' | 'windows' | 'linux'
  state: Readonly<{
    maximized: boolean
    fullscreen: boolean
  }>
  minimize(): Promise<void>
  toggleMaximize(): Promise<void>
  close(): Promise<void>
  handleTitleBarDoubleClick(event?: MouseEvent): void
}

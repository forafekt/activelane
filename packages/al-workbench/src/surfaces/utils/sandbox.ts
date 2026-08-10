import type { WorkbenchSurfaceSandboxOptions } from '../../core/workbench/surfaces'

const SANDBOX_TOKEN_BY_OPTION: Record<keyof WorkbenchSurfaceSandboxOptions, string> = {
  allowDownloads: 'allow-downloads',
  allowForms: 'allow-forms',
  allowModals: 'allow-modals',
  allowPopups: 'allow-popups',
  allowPopupsToEscapeSandbox: 'allow-popups-to-escape-sandbox',
  allowPresentation: 'allow-presentation',
  allowSameOrigin: 'allow-same-origin',
  allowScripts: 'allow-scripts',
  allowTopNavigationByUserActivation: 'allow-top-navigation-by-user-activation',
  extraTokens: '',
}

export function resolveSurfaceSandbox(options?: WorkbenchSurfaceSandboxOptions) {
  const tokens = new Set<string>()

  if (options?.allowScripts !== false) tokens.add('allow-scripts')
  if (options?.allowForms) tokens.add('allow-forms')
  if (options?.allowDownloads) tokens.add('allow-downloads')
  if (options?.allowModals) tokens.add('allow-modals')
  if (options?.allowPopups) tokens.add('allow-popups')
  if (options?.allowPopupsToEscapeSandbox) tokens.add('allow-popups-to-escape-sandbox')
  if (options?.allowPresentation) tokens.add('allow-presentation')
  if (options?.allowTopNavigationByUserActivation) {
    tokens.add('allow-top-navigation-by-user-activation')
  }

  // `allow-same-origin` makes same-origin iframe content much less isolated. Surfaces must
  // opt in explicitly when they have a concrete need for origin identity.
  if (options?.allowSameOrigin) tokens.add(SANDBOX_TOKEN_BY_OPTION.allowSameOrigin)

  for (const token of options?.extraTokens ?? []) {
    if (token.trim()) tokens.add(token.trim())
  }

  return [...tokens].sort().join(' ')
}

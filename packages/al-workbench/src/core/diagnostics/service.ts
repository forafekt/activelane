import type {
  ExtensionDiagnostic,
  ExtensionDiagnosticInput,
  ExtensionDiagnosticsService,
} from './types'

const MAX_ACTIVE_DIAGNOSTICS = 200

export function createExtensionDiagnosticsService(
  active: ExtensionDiagnostic[],
): ExtensionDiagnosticsService {
  return {
    active,
    report(input: ExtensionDiagnosticInput) {
      const diagnostic: ExtensionDiagnostic = {
        ...input,
        id: input.id ?? crypto.randomUUID(),
        timestamp: input.timestamp ?? Date.now(),
      }
      const duplicate = active.findIndex(
        (candidate) =>
          candidate.extensionId === diagnostic.extensionId &&
          candidate.generation === diagnostic.generation &&
          candidate.code === diagnostic.code &&
          candidate.viewInstanceId === diagnostic.viewInstanceId,
      )
      if (duplicate >= 0) active.splice(duplicate, 1)
      active.unshift(diagnostic)
      if (active.length > MAX_ACTIVE_DIAGNOSTICS) active.splice(MAX_ACTIVE_DIAGNOSTICS)
      return diagnostic
    },
    clearExtension(extensionId, generation) {
      removeMatching(
        active,
        (item) =>
          item.extensionId === extensionId &&
          (generation === undefined || item.generation === generation),
      )
    },
    clearView(viewInstanceId) {
      removeMatching(active, (item) => item.viewInstanceId === viewInstanceId)
    },
    clear(id) {
      removeMatching(active, (item) => item.id === id)
    },
  }
}

function removeMatching(
  diagnostics: ExtensionDiagnostic[],
  predicate: (diagnostic: ExtensionDiagnostic) => boolean,
) {
  for (let index = diagnostics.length - 1; index >= 0; index -= 1) {
    const diagnostic = diagnostics[index]
    if (diagnostic && predicate(diagnostic)) diagnostics.splice(index, 1)
  }
}

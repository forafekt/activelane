import { createId } from './ids'
import type { OpenPolicy, PaneDefinition, PaneInstance } from './types'

export class PaneRegistry {
  private definitions = new Map<string, PaneDefinition>()
  register(definition: PaneDefinition) {
    if (!definition.type.trim()) throw new Error('Pane type cannot be empty')
    if (this.definitions.has(definition.type))
      throw new Error(`Pane type is already registered: ${definition.type}`)
    this.definitions.set(definition.type, definition)
    return () => this.unregister(definition.type, definition)
  }
  unregister(type: string, expected?: PaneDefinition) {
    if (!expected || this.definitions.get(type) === expected) this.definitions.delete(type)
  }
  get(type: string) {
    return this.definitions.get(type)
  }
  list() {
    return [...this.definitions.values()]
  }
  create(type: string, options: Partial<Omit<PaneInstance, 'type'>> = {}): PaneInstance {
    const definition = this.get(type)
    if (!definition) throw new Error(`Unknown pane type: ${type}`)
    const pane: PaneInstance = {
      id: options.id ?? createId('pane'),
      type,
      title: options.title,
      resourceId: options.resourceId,
      props: options.props,
      closable: options.closable ?? true,
      movable: options.movable ?? true,
    }
    definition.onCreate?.(pane, { reason: 'create' })
    return pane
  }
  identity(pane: PaneInstance) {
    return `${pane.type}:${pane.resourceId ?? this.get(pane.type)?.resourceKey?.(pane.resource) ?? pane.id}`
  }
  chooseExisting(panes: PaneInstance[], candidate: PaneInstance, policy: OpenPolicy) {
    if (policy === 'new') return undefined
    return panes.find(
      (pane) => pane.type === candidate.type && pane.resourceId === candidate.resourceId,
    )
  }
}

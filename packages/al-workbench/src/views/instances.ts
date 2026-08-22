import type { CreateViewInstanceInput, ViewDefinition, ViewInstance } from './model'

export class ViewInstanceRegistry {
  readonly instances = new Map<string, ViewInstance>()

  constructor(private readonly definitions: () => readonly ViewDefinition[]) {}

  create<TContext>(input: CreateViewInstanceInput<TContext>): ViewInstance<TContext> {
    const definition = this.definitions().find(
      (candidate) =>
        candidate.id === input.definitionId && candidate.ownerExtensionId === input.extensionId,
    )
    if (!definition) throw new Error(`Unknown view ${input.extensionId}:${input.definitionId}.`)

    const id = input.instanceId ?? crypto.randomUUID()
    if (this.instances.has(id)) throw new Error(`View instance ${id} already exists.`)
    if (!definition.multiple) {
      const existing = [...this.instances.values()].find(
        (instance) =>
          instance.definitionId === definition.id && instance.extensionId === input.extensionId,
      )
      if (existing) return existing as ViewInstance<TContext>
    }

    const instance: ViewInstance<TContext> = {
      id,
      definitionId: definition.id,
      extensionId: input.extensionId,
      title: input.title ?? definition.title,
      context: input.context,
      dirty: false,
      createdAt: Date.now(),
    }
    this.instances.set(id, instance)
    return instance
  }

  get(id: string) {
    return this.instances.get(id)
  }

  dispose(id: string) {
    return this.instances.delete(id)
  }

  disposeExtension(extensionId: string) {
    for (const [id, instance] of this.instances) {
      if (instance.extensionId === extensionId) this.instances.delete(id)
    }
  }
}

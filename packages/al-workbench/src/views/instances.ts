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

    const policy =
      input.policy ??
      definition.opening ??
      (input.resource ? 'reveal-or-create' : definition.multiple ? 'always-new' : 'singleton')
    if (policy !== 'always-new') {
      const existing = [...this.instances.values()].find(
        (instance) =>
          instance.definitionId === definition.id &&
          instance.extensionId === input.extensionId &&
          (policy === 'singleton' || instance.resource === input.resource),
      )
      if (existing) return existing as ViewInstance<TContext>
    }

    const id = input.instanceId ?? crypto.randomUUID()
    if (this.instances.has(id)) throw new Error(`View instance ${id} already exists.`)

    const instance: ViewInstance<TContext> = {
      id,
      definitionId: definition.id,
      extensionId: input.extensionId,
      title: input.title ?? definition.title,
      resource: input.resource,
      context: immutableContext(input.context),
      dirty: false,
      createdAt: Date.now(),
    }
    this.instances.set(id, instance)
    return instance
  }

  get(id: string) {
    return this.instances.get(id)
  }

  restore(instance: ViewInstance) {
    const existing = this.instances.get(instance.id)
    if (existing) return existing
    const restored = { ...instance, context: immutableContext(instance.context) }
    this.instances.set(restored.id, restored)
    return restored
  }

  dispose(id: string) {
    return this.instances.delete(id)
  }

  disposeExtension(extensionId: string) {
    for (const [id, instance] of this.instances) {
      if (instance.extensionId === extensionId) this.instances.delete(id)
    }
  }

  prune(retain: (instance: ViewInstance) => boolean) {
    for (const [id, instance] of this.instances) {
      if (!retain(instance)) this.instances.delete(id)
    }
  }
}

function immutableContext<T>(context: T | undefined): T | undefined {
  if (context === undefined) return undefined
  let cloned: T
  try {
    cloned = structuredClone(context)
  } catch {
    throw new Error('View context must be structured-clone compatible.')
  }
  return deepFreeze(cloned) as T
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}

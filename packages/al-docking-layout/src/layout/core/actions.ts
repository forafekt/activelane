import type {
  ContextAction,
  ContextActionProvider,
  GroupActionContext,
  GroupActionProvider,
  PaneActionContext,
} from './types'

export class PaneActionRegistry {
  private readonly providers = new Map<string, ContextActionProvider>()
  register(id: string, provider: ContextActionProvider) {
    if (this.providers.has(id)) throw new Error(`Pane action provider is already registered: ${id}`)
    this.providers.set(id, provider)
    return () => {
      if (this.providers.get(id) === provider) this.providers.delete(id)
    }
  }
  resolve(context: PaneActionContext): ContextAction[] {
    return [...this.providers.values()].flatMap((provider) => provider(context))
  }
}

export class GroupActionRegistry {
  private readonly providers = new Map<string, GroupActionProvider>()
  register(id: string, provider: GroupActionProvider) {
    if (this.providers.has(id))
      throw new Error(`Group action provider is already registered: ${id}`)
    this.providers.set(id, provider)
    return () => {
      if (this.providers.get(id) === provider) this.providers.delete(id)
    }
  }
  resolve(context: GroupActionContext): ContextAction[] {
    return [...this.providers.values()].flatMap((provider) => provider(context))
  }
}

import type { InjectionKey } from 'vue'

export class SurfaceMountRegistry {
  private retention: HTMLElement | null = null
  private readonly contents = new Map<string, HTMLElement>()
  private readonly mounts = new Map<string, HTMLElement>()
  setRetention(element: HTMLElement | null) {
    this.retention = element
    this.reconcileAll()
  }
  setContent(groupId: string, element: HTMLElement | null) {
    if (element) this.contents.set(groupId, element)
    else this.contents.delete(groupId)
    this.reconcile(groupId)
  }
  setMount(groupId: string, element: HTMLElement | null) {
    if (element) this.mounts.set(groupId, element)
    else this.mounts.delete(groupId)
    this.reconcile(groupId)
  }
  private reconcileAll() {
    for (const groupId of this.mounts.keys()) this.reconcile(groupId)
  }
  private reconcile(groupId: string) {
    const mount = this.mounts.get(groupId)
    const destination = this.contents.get(groupId) ?? this.retention
    if (mount && destination && mount.parentElement !== destination) destination.append(mount)
  }
}

export const surfaceMountRegistryKey: InjectionKey<SurfaceMountRegistry> = Symbol(
  'dock-surface-mount-registry',
)

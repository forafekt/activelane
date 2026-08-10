import type { CommandAction, NavigationItem } from '../types'

export interface DesignSystemRegistry {
  navigation: NavigationItem[]
  commands: CommandAction[]
}

export function createDesignSystemRegistry(
  seed: Partial<DesignSystemRegistry> = {},
): DesignSystemRegistry {
  return {
    navigation: seed.navigation ?? [],
    commands: seed.commands ?? [],
  }
}

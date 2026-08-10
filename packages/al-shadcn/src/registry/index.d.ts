import type { CommandAction, NavigationItem } from '../types';
export interface DesignSystemRegistry {
    navigation: NavigationItem[];
    commands: CommandAction[];
}
export declare function createDesignSystemRegistry(seed?: Partial<DesignSystemRegistry>): DesignSystemRegistry;
//# sourceMappingURL=index.d.ts.map
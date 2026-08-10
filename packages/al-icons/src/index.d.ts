import { type Component } from 'vue';
export type IconComponent = Component;
export type IconProviderId = 'lucide' | 'custom';
export type IconProviderInput = IconProvider | IconProviderId;
export type IconRegistry = Map<string, IconComponent>;
export interface IconProvider {
    id: IconProviderId;
    icons: IconRegistry;
    get: (name: string) => IconComponent | undefined;
    has: (name: string) => boolean;
    set: (name: string, component: IconComponent) => void;
}
export declare function createIconProvider(id: IconProviderId, icons: Record<string, unknown>): IconProvider;
export declare const iconRegistry: IconRegistry;
type Lucide = typeof import('./lucide');
type LucideName = keyof Lucide;
type Custom = typeof import('./custom');
type CustomName = keyof Custom;
export type IconProviderIdType = LucideName | CustomName;
export declare function getIcon(name: string, providerInput?: IconProviderInput): Component;
export declare function getIcons(names: string[], provider?: IconProviderInput): IconComponent[];
export declare function registerIcon(name: string, component: IconComponent): void;
export {};
//# sourceMappingURL=index.d.ts.map
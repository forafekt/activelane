import type { Component } from 'vue';
export type Density = 'compact' | 'comfortable' | 'touch';
export type Orientation = 'horizontal' | 'vertical';
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg';
export type Intent = 'neutral' | 'success' | 'warning' | 'destructive' | 'error' | 'info';
export type Tone = Intent | 'primary';
export type ResolvedTheme = 'light' | 'dark' | 'high-contrast';
export type IconComponent = Component;
export interface SelectOption<TValue extends string = string> {
    value: TValue;
    label: string;
    description?: string;
    disabled?: boolean;
}
export interface NavigationItem {
    id: string;
    label: string;
    icon?: IconComponent;
    badge?: string | number | null;
    active?: boolean;
    disabled?: boolean;
    description?: string;
}
export interface SidebarNavItem extends NavigationItem {
    description?: string;
}
export interface SidebarNavGroup {
    id: string;
    label: string;
    items: SidebarNavItem[];
}
export interface CommandAction {
    id: string;
    title: string;
    group?: string;
    description?: string;
    keywords?: string[];
    shortcut?: string | string[];
    icon?: IconComponent;
    disabled?: boolean;
    destructive?: boolean;
    children?: CommandAction[];
}
//# sourceMappingURL=index.d.ts.map
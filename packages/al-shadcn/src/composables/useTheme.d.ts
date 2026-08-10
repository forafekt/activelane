import type { ThemeMode } from '../tokens';
export declare const THEME_STORAGE_KEY = "activelane-ui-theme";
export declare const THEME_MODES: readonly ["system", "light", "dark", "high-contrast"];
export declare const activeLaneThemeNames: {
    readonly light: "light";
    readonly dark: "dark";
    readonly highContrast: "high-contrast";
};
export interface ThemeOptions {
    storageKey?: string;
    target?: HTMLElement | null;
}
export declare function initializeTheme(defaultTheme?: ThemeMode): void;
export declare function useTheme(options?: ThemeOptions): {
    mode: import("@vueuse/core").RemovableRef<"system" | "light" | "dark" | "high-contrast">;
    resolvedMode: import("vue").ComputedRef<"light" | "dark" | "high-contrast">;
    setTheme(value: ThemeMode): void;
};
//# sourceMappingURL=useTheme.d.ts.map
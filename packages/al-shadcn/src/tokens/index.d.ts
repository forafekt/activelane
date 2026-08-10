export declare const themeModes: readonly ["system", "light", "dark", "high-contrast"];
export type ThemeMode = (typeof themeModes)[number];
export declare const densityModes: readonly ["compact", "comfortable", "touch"];
export type DensityMode = (typeof densityModes)[number];
export declare const zIndex: {
    readonly dropdown: 40;
    readonly sticky: 50;
    readonly overlay: 60;
    readonly modal: 70;
    readonly toast: 80;
};
export declare const motion: {
    readonly fast: "var(--motion-fast)";
    readonly normal: "var(--motion-normal)";
    readonly slow: "var(--motion-slow)";
    readonly standard: "var(--ease-standard)";
    readonly emphasized: "var(--ease-emphasized)";
};
//# sourceMappingURL=index.d.ts.map
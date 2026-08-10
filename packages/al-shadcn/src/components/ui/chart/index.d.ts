import type { Component, Ref } from 'vue';
export { default as ChartContainer } from './ChartContainer.vue';
export { default as ChartLegendContent } from './ChartLegendContent.vue';
export { default as ChartTooltipContent } from './ChartTooltipContent.vue';
export { componentToString } from './utils';
export declare const THEMES: {
    readonly light: "";
    readonly dark: ".dark";
};
export type ChartConfig = {
    [k in string]: {
        label?: string | Component;
        icon?: string | Component;
    } & ({
        color?: string;
        theme?: never;
    } | {
        color?: never;
        theme: Record<keyof typeof THEMES, string>;
    });
};
interface ChartContextProps {
    id: string;
    config: Ref<ChartConfig>;
}
export declare const useChart: <T extends ChartContextProps | null | undefined = ChartContextProps>(fallback?: T | undefined) => T extends null ? ChartContextProps | null : ChartContextProps, provideChartContext: (contextValue: ChartContextProps) => ChartContextProps;
export { VisCrosshair as ChartCrosshair, VisTooltip as ChartTooltip } from '@unovis/vue';
//# sourceMappingURL=index.d.ts.map
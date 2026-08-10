import type { VariantProps } from 'class-variance-authority';
export { default as Button } from './Button.vue';
export declare const buttonVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "link" | "outline" | "ghost" | null | undefined;
    size?: "default" | "icon" | "sm" | "lg" | "icon-sm" | "icon-lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type ButtonVariants = VariantProps<typeof buttonVariants>;
//# sourceMappingURL=index.d.ts.map
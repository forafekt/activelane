import type { VariantProps } from 'class-variance-authority';
export { default as InputGroup } from './InputGroup.vue';
export { default as InputGroupAddon } from './InputGroupAddon.vue';
export { default as InputGroupButton } from './InputGroupButton.vue';
export { default as InputGroupInput } from './InputGroupInput.vue';
export { default as InputGroupText } from './InputGroupText.vue';
export { default as InputGroupTextarea } from './InputGroupTextarea.vue';
export declare const inputGroupAddonVariants: (props?: ({
    align?: "inline-start" | "inline-end" | "block-start" | "block-end" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type InputGroupVariants = VariantProps<typeof inputGroupAddonVariants>;
export declare const inputGroupButtonVariants: (props?: ({
    size?: "sm" | "icon-sm" | "xs" | "icon-xs" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type InputGroupButtonVariants = VariantProps<typeof inputGroupButtonVariants>;
//# sourceMappingURL=index.d.ts.map
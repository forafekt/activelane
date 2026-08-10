export declare function useRovingSelection<T extends {
    id: string;
}>(items: () => T[], initialId?: string): {
    activeId: import("vue").Ref<string | null, string | null>;
    activeIndex: import("vue").ComputedRef<number>;
    move: (delta: number) => T | null;
    first: () => void;
    last: () => void;
};
//# sourceMappingURL=useRovingSelection.d.ts.map
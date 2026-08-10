import type { Tone } from '../types';
export interface ToastItem {
    id: number;
    title: string;
    description?: string;
    tone?: Tone;
    duration?: number;
}
export declare function useToast(): {
    toasts: Readonly<import("vue").Ref<readonly {
        readonly id: number;
        readonly title: string;
        readonly description?: string | undefined;
        readonly tone?: Tone | undefined;
        readonly duration?: number | undefined;
    }[], readonly {
        readonly id: number;
        readonly title: string;
        readonly description?: string | undefined;
        readonly tone?: Tone | undefined;
        readonly duration?: number | undefined;
    }[]>>;
    push: (toast: Omit<ToastItem, "id">) => number;
    remove: (id: number) => void;
    clear: () => void;
};
//# sourceMappingURL=useToast.d.ts.map
import type { ChartConfig } from '.';
interface Constructor<P = any> {
    __isFragment?: never;
    __isTeleport?: never;
    __isSuspense?: never;
    new (...args: any[]): {
        $props: P;
    };
}
export declare function componentToString<P>(config: ChartConfig, component: Constructor<P>, props?: P): ((_data: any, x: number | Date) => string) | undefined;
export {};
//# sourceMappingURL=utils.d.ts.map
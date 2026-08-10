import type { Ref } from 'vue';
import type { UnwrapRefCarouselApi as CarouselApi, CarouselEmits, CarouselProps } from './interface';
type CarouselState = {
    carouselRef: Ref<HTMLElement | undefined>;
    carouselApi: Ref<CarouselApi | undefined>;
    canScrollPrev: Ref<boolean>;
    canScrollNext: Ref<boolean>;
    scrollPrev: () => void;
    scrollNext: () => void;
    orientation?: 'horizontal' | 'vertical';
};
declare const useProvideCarousel: (props: CarouselProps, emits: CarouselEmits) => CarouselState;
declare function useCarousel(): CarouselState;
export { useCarousel, useProvideCarousel };
//# sourceMappingURL=useCarousel.d.ts.map
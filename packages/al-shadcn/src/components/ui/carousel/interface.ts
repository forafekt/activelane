import type useEmblaCarousel from 'embla-carousel-vue'
import type { HTMLAttributes } from 'vue'

type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

export type UnwrapRefCarouselApi = any

export interface CarouselProps {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: 'horizontal' | 'vertical'
}

export type CarouselEmits = (e: 'init-api', payload: UnwrapRefCarouselApi) => void

export interface WithClassAsProps {
  class?: HTMLAttributes['class']
}

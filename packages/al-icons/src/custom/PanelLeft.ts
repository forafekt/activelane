// PanelLeft.ts
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'PanelLeft',

  props: {},

  emits: [],

  setup() {
    return () =>
      h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          width: '24',
          height: '24',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          class: 'lucide lucide-panel-left-icon lucide-panel-left',
        },
        [
          h('title', { domProps: { innerHTML: 'lucide-panel-left-icon' } }),
          h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
          h('path', { d: 'M9 3v18' }),
        ],
      )
  },
})

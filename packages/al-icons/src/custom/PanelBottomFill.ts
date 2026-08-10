// PanelBottomFill.ts
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'PanelBottomFill',

  props: {},

  emits: [],

  setup(props, { emit }) {
    //     <svg
    //   xmlns="http://www.w3.org/2000/svg"
    //   width="24"
    //   height="24"
    //   viewBox="0 0 24 24"
    //   fill="none"
    //   stroke="currentColor"
    //   stroke-width="2"
    //   stroke-linecap="round"
    //   stroke-linejoin="round"
    //   class="lucide lucide-panel-bottom-icon lucide-panel-bottom"
    // >
    //   <title>lucide-panel-bottom-fill-icon</title>
    //   <rect width="18" height="18" x="3" y="3" rx="2" />
    //   <path d="M3 15h18 M3 18h18" />
    // </svg>

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
          class: 'lucide lucide-panel-bottom-icon lucide-panel-bottom',
        },
        [
          h('title', {}, 'lucide-panel-bottom-icon'),
          h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
          h('path', { d: 'M3 15h18 M3 18h18' }),
        ],
      )
  },
})

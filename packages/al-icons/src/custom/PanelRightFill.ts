// PanelRightFill.ts
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'PanelRightFill',

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
    //   class="lucide lucide-panel-right-icon lucide-panel-right"
    // >
    //   <title>lucide-panel-right-fill-icon</title>
    //   <rect width="18" height="18" x="3" y="3" rx="2" />
    //   <path d="M15 3v18 M18 3v18" />
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
          class: 'lucide lucide-panel-right-icon lucide-panel-right',
        },
        [
          h('title', { domProps: { innerHTML: 'lucide-panel-right-fill-icon' } }),
          h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
          h('path', { d: 'M15 3v18 M18 3v18' }),
        ],
      )
  },
})

import { addCollection, Icon, type IconifyIcon, iconLoaded, loadIcon } from '@iconify/vue'
import lucide from '@iconify-json/lucide/icons.json'
import { defineComponent, h, markRaw, shallowRef } from 'vue'
import { type IconReference, normalizeIconReference } from './icon-reference'

addCollection(lucide)

const fallback = 'lucide:circle-slash'
const cache = new Map<IconReference, ReturnType<typeof defineComponent>>()

export function getIcon(reference: IconReference) {
  const normalized = normalizeIconReference(reference)
  const cached = cache.get(reference)
  if (cached) return cached

  const name = `Icon-${reference.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')}`

  const component = markRaw(
    defineComponent({
      name,
      inheritAttrs: false,
      props: { size: { type: [Number, String], default: '1em' } },
      setup(props, { attrs }) {
        const data = shallowRef<IconifyIcon>()
        if (!iconLoaded(normalized)) {
          loadIcon(normalized)
            .then((icon) => {
              data.value = icon
            })
            .catch(() => {
              console.warn(`Iconify icon not found: ${reference}`)
            })
        }

        return () => {
          const labelled = attrs['aria-label'] != null || attrs['aria-labelledby'] != null
          return h(Icon, {
            ...attrs,
            icon: data.value ?? (iconLoaded(normalized) ? normalized : fallback),
            width: props.size,
            height: props.size,
            ariaHidden: !labelled,
            role: labelled ? 'img' : undefined,
            focusable: 'false',
          })
        }
      },
    }),
  )

  cache.set(reference, component)
  return component
}

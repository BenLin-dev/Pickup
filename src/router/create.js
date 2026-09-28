import { createRouter as createVueRouter } from 'vue-router'
import { routes } from './routes'

/**
 * Height of the sticky header plus a little breathing room.
 *
 * Read from the `--header-h` custom property so it can never drift from the
 * CSS. Returns 0 during prerender, where there is no document.
 */
function headerOffset() {
  if (typeof document === 'undefined') return 0
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-h')
  const h = parseFloat(raw)
  return (Number.isFinite(h) ? h : 76) + 16
}

/**
 * Builds a router for a given history implementation.
 *
 *   browser  -> createWebHistory()
 *   prerender -> createMemoryHistory()
 *
 * Sharing one definition keeps the two paths in sync.
 */
export function createRouter(history) {
  const router = createVueRouter({
    history,
    routes,
    scrollBehavior(to, from, saved) {
      if (saved) return saved
      if (to.hash) {
        // `top` is subtracted from the target's *document* offset, which is the
        // only way to keep the sticky header off a deep link —
        // `/airport-transfer#fares` and `/contact#quote` both landed with their
        // heading tucked under it. The `scroll-padding-top` on <html> only
        // reaches the browser's own anchor jump; vue-router positions the page
        // itself with `window.scrollTo` and never consults it.
        return { el: to.hash, top: headerOffset(), behavior: 'smooth' }
      }
      if (to.path === from.path) return {}
      return { top: 0 }
    },
  })

  router.afterEach((to) => {
    if (typeof document === 'undefined') return
    if (!to.meta?.noindex) return
    let tag = document.head.querySelector('meta[name="robots"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'robots')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', 'noindex, follow')
  })

  return router
}

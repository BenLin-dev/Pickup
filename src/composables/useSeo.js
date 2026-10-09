import { onUnmounted } from 'vue'
import { site } from '@/data/site'
import { currentLocale, locale } from '@/i18n'

/**
 * Per-route document head management.
 * Keeps <title>, meta description/keywords, canonical and OG tags in sync
 * with the router. Works in the browser and during prerender.
 */
function setMeta(attr, key, content) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSeo(page) {
  const url = site.domain + (page.path === '/' ? '/' : page.path)

  // Per-page share image when there is one (guides use their own cover),
  // otherwise the single 1200x630 brand card. Without this every shared link
  // rendered as a grey box: the prerender step replaces the whole head block,
  // so the `og:image` sitting in index.html never reached the built pages.
  const image = page.image ? site.domain + page.image : site.domain + site.ogImage

  if (typeof document !== 'undefined') {
    document.title = page.title
    // The active locale, not a literal 'en'. This runs on every route, so a
    // hard-coded value silently re-labelled a French or German page as English
    // — wrong for screen readers (which pick a pronunciation from it) and for
    // the translation tooling browsers offer.
    document.documentElement.lang = locale
  }

  setMeta('name', 'description', page.description)
  if (page.keywords) setMeta('name', 'keywords', page.keywords)
  setLink('canonical', url)

  setMeta('property', 'og:title', page.title)
  setMeta('property', 'og:description', page.description)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:type', page.type || 'website')
  setMeta('property', 'og:image', image)
  setMeta('property', 'og:image:width', '1200')
  setMeta('property', 'og:image:height', '630')
  setMeta('property', 'og:site_name', site.name)
  setMeta('property', 'og:locale', currentLocale.ogLocale)
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', page.title)
  setMeta('name', 'twitter:description', page.description)
  setMeta('name', 'twitter:image', image)

  // Deliberately no "restore the previous document.title on unmount" hook.
  //
  // App.vue keys <RouterView> on `route.path`, so on every navigation the
  // incoming view mounts *before* the outgoing one is torn down. A restore
  // hook therefore fired last and wrote the title of the page you had just
  // left back into the tab: URL, H1 and body all moved, and the <title> sat
  // one page behind until a refresh. (It also captured `prevTitle` *after*
  // overwriting it, so it never held the previous title in the first place.)
  //
  // Every route calls useSeo(), so there is nothing to fall back to — the
  // page you are on owns the title outright.

  return { url }
}

/** Adds a JSON-LD block for a specific page (FAQ, breadcrumbs, etc.). */
export function useJsonLd(id, data) {
  if (typeof document === 'undefined') return
  let el = document.getElementById(`ld-${id}`)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = `ld-${id}`
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
  onUnmounted(() => {
    el?.remove()
  })
}

/**
 * Adds a BreadcrumbList JSON-LD block for the current page.
 *
 * Pass an ordered array of `{ name, path }`:
 *   - `name` is the visible label that Google will show.
 *   - `path` is the site-relative path with a leading slash (e.g. `/about`).
 *   - The final entry (the page itself) should pass `null` for `path` so it is
 *     treated as the current page, not a self-link.
 *
 * Example:
 *   useBreadcrumbs([
 *     { name: 'Home', path: '/' },
 *     { name: 'Airport Transfer', path: '/airport-transfer' },
 *     { name: 'Guangzhou Baiyun (CAN)', path: null },
 *   ])
 */
export function useBreadcrumbs(id, crumbs) {
  if (typeof document === 'undefined') return
  const list = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: site.domain + c.path } : {}),
    })),
  }
  useJsonLd(`bc-${id}`, list)
}

import { locale, preloadLocale } from './i18n'
import { revealDirective } from './composables/useReveal'
import './assets/styles/fonts.css'
import './assets/styles/main.css'

/**
 * Bootstrap is async so that a non-English catalogue is in place *before*
 * `src/data/*.js` runs.
 *
 * Those modules translate at module scope (`export const fleet = tr(fleetEn)`),
 * so the catalogue has to be loaded before they are evaluated — which means
 * `App.vue` and `router` cannot be static imports: ESM hoists those ahead of
 * any code in this file. Pulling them in after the await is what makes the
 * split work.
 *
 * Cost is one extra round-trip, paid only because the bundle is now ~400 KB
 * instead of 926 KB (the six non-English catalogues used to be inlined).
 * English visitors still fetch `en.json` — it is the extraction template and
 * keeps the fallback path identical to what prerendering produced.
 */
async function boot() {
  if (locale !== 'en') await preloadLocale(locale)

  const [{ createApp }, { default: App }, { default: router }] = await Promise.all([
    import('vue'),
    import('./App.vue'),
    import('./router'),
  ])

  const app = createApp(App)

  app.use(router)
  app.directive('reveal', revealDirective)
  app.mount('#app')
}

boot()

/**
 * Site-wide WhatsApp click delegate.
 *
 * Catches every anchor whose href goes to `wa.me` (Header CTA, Footer
 * link, landing-page buttons, modals, etc.) — there are 18 of them across
 * `src/`. Rather than wire `@click="track(...)"` into each one, we attach
 * a single capture-phase listener at the document level so new routes or
 * newly-added CTAs are picked up automatically with zero per-file edits.
 *
 * Two side effects per click:
 *   1) `dataLayer.push({event:'contact_click', channel:'whatsapp'})`
 *      for GA4 / GTM attribution.
 *   2) Direct `gtag('event','conversion', ...)` call to Google Ads
 *      using the dedicated "Click WhatsApp" conversion action
 *      (Label `wfnvCN21yf8cEJWSz-RE`, value 0.5 CNY).
 *
 *      Value is denominated in CNY, not USD, because the Ads account
 *      currency is CNY (the 出價 screen prefixes max-CPC with `¥`, and
 *      Google's own generated event snippets come back as CNY). Ads
 *      reports conversion values in account currency. See the longer
 *      note in `QuoteForm.vue` — v2.9.4, 2026-09-21.
 *
 * The Submit-Lead-Form conversion path (Label `sOmeCK_G0P8cEJWSz-RE`)
 * still lives in `QuoteForm.vue` — different action, different Label.
 *
 * The capture phase (`true` as 3rd arg) lets us fire BEFORE any other
 * `@click` handlers; we still don't preventDefault because the actual
 * navigation to wa.me should proceed normally.
 *
 * NOTE: `FloatingContact.vue` previously pushed `contact_click` itself
 * via its local `track('whatsapp')`. That `@click` was removed so the
 * same WA click does NOT fire `contact_click` twice. Email / phone
 * FAB clicks still go through the local `track()` because they don't
 * have an Ads conversion action — only dataLayer push for GA4.
 */
document.addEventListener(
  'click',
  (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href*="wa.me"]')
    if (!a) return
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'contact_click', channel: 'whatsapp' })
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', {
        send_to: 'AW-18464622869/wfnvCN21yf8cEJWSz-RE',
        value: 0.5,
        currency: 'CNY', // Ads account currency — see note above
        transaction_id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      })
    }
  },
  true,
)

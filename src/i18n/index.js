/**
 * Message-catalogue i18n — no dependency, one lookup table per language.
 *
 * WHY THE ENGLISH TEXT IS THE KEY
 * ------------------------------
 * The copy for this site already lives in `src/data/*.js` as plain English
 * strings (~1,400 of them) and inside the view/component templates. Minting a
 * dotted key for every one of them (`services.airportTransfer.hero.title`)
 * would mean maintaining a second vocabulary that nothing enforces — edit the
 * English and the key silently rots.
 *
 * Instead the English sentence *is* the key. `locales/en.json` is generated
 * from the source by `scripts/extract-i18n.mjs`, and the other four files map
 * that English text to their own. A message with no entry in the active
 * language falls back to the English source string, so a half-finished
 * translation degrades to English rather than to blanks or to `undefined`.
 *
 * That fallback is also what lets `tr()` below be safe: it walks a whole data
 * structure and translates every leaf string it recognises. A slug, a file
 * path, an email address or a hex colour is simply not in the catalogue, comes
 * back unchanged, and needs no allow-list to protect it.
 *
 * Add copy to the site as English, run `npm run i18n`, and the new string shows
 * up in `en.json` waiting to be translated. Nothing else to remember.
 *
 * SWITCHING
 * ---------
 * The active locale is resolved **once, at import time**, before the app
 * mounts. Templates read `t()`, data modules read `tr()`, and neither needs to
 * be reactive — switching languages writes the choice to `localStorage` and
 * reloads, which re-evaluates every module with the new catalogue. That is one
 * round-trip on an explicit user action and zero reactive plumbing everywhere
 * else.
 *
 * Prerendering runs in Node, where there is no `window`: `resolveLocale()`
 * returns English, so the static HTML stays English (and stays the version
 * Google indexes) while a French visitor's browser mounts straight into French.
 */

/**
 * Import attributes (`with { type: 'json' }`) are required by Node's ESM
 * loader, which reaches this module through `scripts/extract-i18n.mjs` and
 * `scripts/prerender.mjs`; Vite and Rollup both accept the same syntax.
 */
import en from './locales/en.json' with { type: 'json' }
import fr from './locales/fr.json' with { type: 'json' }
import es from './locales/es.json' with { type: 'json' }
import it from './locales/it.json' with { type: 'json' }
import de from './locales/de.json' with { type: 'json' }

/** Every language the site ships, in switcher order. `label` is endonymic. */
export const LOCALES = [
  { code: 'en', label: 'English', short: 'EN', ogLocale: 'en_US' },
  { code: 'fr', label: 'Français', short: 'FR', ogLocale: 'fr_FR' },
  { code: 'es', label: 'Español', short: 'ES', ogLocale: 'es_ES' },
  { code: 'it', label: 'Italiano', short: 'IT', ogLocale: 'it_IT' },
  { code: 'de', label: 'Deutsch', short: 'DE', ogLocale: 'de_DE' },
]

export const DEFAULT_LOCALE = 'en'
export const STORAGE_KEY = 'cantonpickup.locale'

const BUNDLES = { en, fr, es, it, de }
const SUPPORTED = LOCALES.map((l) => l.code)

/**
 * Which language to render in. Order of precedence:
 *   1. the visitor's own choice, remembered across visits
 *   2. the browser's ordered language preferences
 *   3. English
 *
 * A `zh-CN` or `pt-BR` visitor falls through to English rather than being
 * force-fed the nearest neighbour — a French page is not an improvement to
 * somebody who reads Chinese.
 */
export function resolveLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED.includes(stored)) return stored
  } catch {
    /* private mode / storage disabled — fall through to the browser's list */
  }

  const wanted =
    (navigator.languages && navigator.languages.length && navigator.languages) ||
    [navigator.language]

  for (const tag of wanted) {
    if (!tag) continue
    const base = String(tag).toLowerCase().split('-')[0]
    if (SUPPORTED.includes(base)) return base
  }

  return DEFAULT_LOCALE
}

export const locale = resolveLocale()
export const currentLocale = LOCALES.find((l) => l.code === locale) || LOCALES[0]
export const isDefaultLocale = locale === DEFAULT_LOCALE

/**
 * Keys are matched after collapsing whitespace, so a heading that wraps across
 * three lines in a template still hits the one-line entry in the catalogue.
 */
const normalise = (s) => s.replace(/\s+/g, ' ').trim()

const cache = new Map()

/**
 * Extraction escape hatch.
 *
 * `scripts/extract-i18n.mjs` needs the *raw* English structures to rebuild
 * `en.json`, but `tr()` translates as the data modules evaluate. Flipping this
 * on before those modules are imported makes `t()`/`tr()` pass-through, so the
 * extractor sees the source strings exactly as written. Never set at runtime.
 */
let passThrough = false

export function setPassThrough(on) {
  passThrough = Boolean(on)
}

function applyParams(message, params) {
  if (!params) return message
  return message.replace(/\{(\w+)\}/g, (whole, name) =>
    params[name] === undefined || params[name] === null ? whole : String(params[name]),
  )
}

/**
 * Translate one message. `t('Book now')` → "Réserver" in French.
 *
 * Unknown messages come back as given, so a string that was never extracted
 * (or a translation that is still missing) renders as the English copy instead
 * of an empty element.
 */
export function t(message, params) {
  if (passThrough) return message
  if (typeof message !== 'string' || message === '') return message

  let value = cache.get(message)
  if (value === undefined) {
    const key = normalise(message)
    const hit = BUNDLES[locale] && BUNDLES[locale][key]
    value = typeof hit === 'string' && hit ? hit : message
    cache.set(message, value)
  }
  return applyParams(value, params)
}

/**
 * Translate a whole structure — objects, arrays and every string leaf.
 *
 * Data modules wrap their exports in this (`export const fleet = tr(fleetEn)`)
 * instead of threading `t()` through hundreds of call sites. Non-copy strings
 * pass through untouched because they have no catalogue entry.
 */
export function tr(value) {
  if (typeof value === 'string') return t(value)
  if (Array.isArray(value)) return value.map(tr)
  if (value && typeof value === 'object') {
    const out = {}
    for (const key of Object.keys(value)) out[key] = tr(value[key])
    return out
  }
  return value
}

/** Human label for a locale code, for the switcher's `aria-label`s. */
export function labelOf(code) {
  return (LOCALES.find((l) => l.code === code) || LOCALES[0]).label
}

function applyDocumentLang(code) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = code
}

applyDocumentLang(locale)

/**
 * Remember the choice and re-render in it. A reload rather than a live swap:
 * `locale` is read once at import time by every data module, and re-running
 * them is the whole point.
 */
export function setLocale(code) {
  if (!SUPPORTED.includes(code) || code === locale) return
  try {
    window.localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* nothing to persist to — the reload still picks up the browser default */
  }
  applyDocumentLang(code)
  window.location.reload()
}

import { pricing } from '@/data/site'

/**
 * Price formatting helpers.
 *
 * Every figure on this site is quoted in US dollars, per vehicle: the number
 * shown is the number charged. There is no second currency and no conversion
 * step — the values in `src/data/site.js` are the ones that appear on the
 * invoice, so a price never has to be "read as" something else.
 *
 * (The renminbi helper that used to live here went with the Hong Kong car when
 * it was swapped for the minibus and coach on 2026-11-03. Nothing on the site
 * is priced in RMB any more.)
 */

/** 57 -> "$57" */
export function money(value) {
  if (value === null || value === undefined || value === '') return ''
  return `${pricing.currencySymbol}${Number(value).toLocaleString('en-US')}`
}

/**
 * Like `money`, but a price we have not been given yet reads as "On request"
 * instead of vanishing — used on route tables where the row still matters.
 */
export function moneyOr(value, fallback = 'On request') {
  return money(value) || fallback
}

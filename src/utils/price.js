import { pricing } from '@/data/site'

/**
 * Price formatting helpers.
 *
 * Every figure on this site is quoted in US dollars, per vehicle: the number
 * shown is the number charged. There is no second currency and no conversion
 * step — the values in `src/data/site.js` are the ones that appear on the
 * invoice, so a price never has to be "read as" something else.
 *
 * One exception: `moneyCny` below, for the Hong Kong car, which the customer
 * sells in renminbi by the hour. Converting it to dollars would print a number
 * nobody agreed to, which is exactly what the rule above forbids.
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

/**
 * 260 -> "CN¥260" — renminbi, for the one hourly-priced Hong Kong vehicle.
 *
 * `CN¥`, not a bare `¥`: this site ships a Japanese catalogue, and to a
 * Japanese reader `¥260` means two hundred and sixty yen. The customer quoted
 * the price in RMB, so it is printed in RMB and never converted.
 */
export function moneyCny(value) {
  if (value === null || value === undefined || value === '') return ''
  return `CN¥${Number(value).toLocaleString('en-US')}`
}

/**
 * Central site configuration.
 *
 * Everything a non-developer might want to change lives here:
 * contact details, navigation, the fleet list, the price table and the
 * SEO keyword set. Page copy lives in `content.js`.
 *
 * NOTE: `scripts/prerender.mjs` imports this file with plain Node ESM (to read
 * `site.domain` for sitemap.xml), so every relative import here must carry an
 * explicit `.js` extension — Node does not do extension guessing.
 */

import { serviceCards } from './content.js'
import { routePages } from './routePages.js'
import { t, tr } from '../i18n/index.js'

/**
 * WhatsApp click-to-chat, in three pieces.
 *
 * Every WhatsApp button on the site used to point at the bare
 * `https://wa.me/<number>`, which opens an EMPTY composer. A visitor arriving
 * from an ad had to invent a sentence before anything could be answered — the
 * highest-intent tap on the whole site dead-ended in a blank box. The
 * reference site (cantonride.com) pre-fills "Hi, I need a transfer in
 * Guangzhou"; this is the same idea.
 *
 * Three separate values on purpose:
 *   - `whatsappUrl`   bare profile address. Used in structured data (`sameAs`)
 *                     and anywhere a canonical, parameterless URL is expected
 *                     — you do not want `?text=...` sitting in JSON-LD.
 *   - `whatsappLink`  what every human-facing button uses.
 *   - `whatsappText`  the message itself, exported so the copy can be shown or
 *                     asserted against without re-deriving it from the URL.
 *
 * Keep the message SHORT and ready to send as-is. A message containing blanks
 * the visitor has to fill in is worse than no message at all — on a phone they
 * would have to place a cursor mid-sentence.
 */
const WHATSAPP_NUMBER = '8613202442074'
const WHATSAPP_TEXT = "Hi CantonPickup, I'd like a quote for a private transfer in Guangzhou."

/**
 * Pre-filled WhatsApp messages, one per page.
 *
 * Every button used to open the same composer no matter which page the visitor
 * was reading. The message is the first thing we see on the phone, so it may as
 * well name what they were looking at: "I need an airport transfer from Baiyun
 * Airport" can be answered from a standing start, "I'd like a quote" cannot.
 *
 * Same rules as the original single message:
 *   - SHORT, and sendable as-is. No blanks to fill in — on a phone the visitor
 *     would have to place a cursor mid-sentence before they could hit send.
 *   - No price and no date we cannot stand behind.
 *   - Keep the "Hi CantonPickup, ..." opening: it reads as a person and it
 *     tells the inbox which brand the lead came from.
 */
const WA_MESSAGES = {
  '/airport-transfer': 'Hi CantonPickup, I need an airport transfer from Baiyun Airport (CAN).',
  '/private-driver': 'Hi CantonPickup, I would like a price for a private driver in Guangzhou.',
  '/factory-visits': 'Hi CantonPickup, I need a driver for factory visits in Guangdong.',
  '/intercity-transfer': 'Hi CantonPickup, I need a private transfer between two cities in Guangdong.',
  '/canton-fair-transfer': 'Hi CantonPickup, I need a Canton Fair transfer to Pazhou.',
  '/multi-day-sourcing-tour':
    'Hi CantonPickup, I am planning a multi-day sourcing trip in Guangdong.',
  '/vehicles-pricing': 'Hi CantonPickup, which vehicle do you recommend for my trip?',
  '/reviews': 'Hi CantonPickup, I would like a quote for a private transfer in Guangzhou.',
  '/faqs': 'Hi CantonPickup, I have a question about your private car service.',
  '/blog': 'Hi CantonPickup, I read your Guangzhou guide and would like a quote.',
}

/**
 * `route.path` → pre-filled message. Not read from `window`: the caller passes
 * the path in, so the server render and the client render produce the same URL
 * and the prerendered markup is what the browser actually uses.
 */
function waMessageFor(path) {
  // Vue Router hands us `/airport-transfer`; a hand-typed trailing slash or an
  // older inbound link gives `/airport-transfer/`. Both must answer the same.
  const clean = String(path || '/').replace(/\/+$/, '') || '/'

  if (WA_MESSAGES[clean]) return WA_MESSAGES[clean]

  // Intercity route pages (/guangzhou-to-foshan, /guangzhou-to-shenzhen, …) —
  // derived from the same list that builds the pages, so a new route cannot be
  // added without getting its own message.
  const routePage = routePages.find((r) => `/${r.slug}` === clean)
  if (routePage) {
    return `Hi CantonPickup, I need a private transfer from Guangzhou to ${routePage.city}.`
  }

  // Individual guides under /blog/<slug>.
  if (clean.startsWith('/blog/')) {
    return 'Hi CantonPickup, I read your guide and would like a quote.'
  }

  return WHATSAPP_TEXT
}

/**
 * `encodeURIComponent` deliberately leaves `'` unescaped — it is in the
 * function's unreserved set. That put a raw apostrophe inside an HTML
 * attribute, which Vue then had to write as `&#39;`, so the URL in the served
 * markup did not read as the URL we built. Encode it explicitly so the link
 * that reaches WhatsApp is byte-for-byte what is written here.
 */
const enc = (s) => encodeURIComponent(s).replace(/'/g, '%27')

/**
 * Everything that is NOT display copy: identity, contact details, structured
 * data, integration keys. None of it is translated — a phone number, an e-mail
 * address and the `addressLine` that goes into JSON-LD must read the same in
 * every language, and the pre-filled WhatsApp message stays English so the
 * booking inbox keeps receiving something a human can triage at a glance.
 */
const siteBase = {
  name: 'CantonPickup',
  legalName: 'CantonPickup',
  domain: 'https://cantonpickup.com',

  // ---- contact ----------------------------------------------------------
  phone: '+86 13202442074',
  phoneRaw: '+8613202442074',
  whatsapp: '+86 13202442074',
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  whatsappText: WHATSAPP_TEXT,
  whatsappLink: `https://wa.me/${WHATSAPP_NUMBER}?text=${enc(WHATSAPP_TEXT)}`,
  /**
   * Click-to-chat carrying the message that matches the page the visitor is on.
   * Used by every WhatsApp button: `site.waLink(route.path)`.
   *
   * `whatsappLink` above stays as the page-agnostic fallback — it is the one to
   * use in a context with no route (and it is what `waLink('/')` returns).
   */
  waLink: (path) => `https://wa.me/${WHATSAPP_NUMBER}?text=${enc(waMessageFor(path))}`,
  wechat: '+86 13202442074',
  email: 'jack@cantonpickup.com',
  mailto: 'mailto:jack@cantonpickup.com',
  /**
   * Instagram (added 2026-10-08). `instagram` is the bare profile URL — the one
   * the footer icon links to; `instagramHandle` is what we print, because a
   * visitor arriving on a desktop cannot scan a QR code out of a screenshot.
   * The trailing slash is left off so the link is byte-identical to what the
   * Instagram app's own profile-QR resolves to.
   */
  instagram: 'https://www.instagram.com/cantonpickup4',
  instagramHandle: '@cantonpickup4',

  // ---- address / area ---------------------------------------------------
  // The base of operations. Baiyun District (广州白云区) sits between
  // downtown Guangzhou and Baiyun International Airport, which is why
  // airport pickups are our most common booking.
  district: 'Baiyun District',
  city: 'Guangzhou',
  region: 'Guangdong',
  country: 'China',
  addressLine: 'Baiyun District, Guangzhou, Guangdong, China',
  /** Shown on the map link in the footer and on the contact page. */
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=Baiyun+District%2C+Guangzhou%2C+China',

  // ---- integrations -----------------------------------------------------
  gtmId: 'GTM-KNZMJW4H',
  web3formsAccessKey: '02187a0a-00ea-48ee-8843-3dfdc845997a',
  web3formsEndpoint: 'https://api.web3forms.com/submit',

  social: {
    // Bare profile URL — this object feeds `sameAs` style listings, not buttons.
    whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
    instagram: 'https://www.instagram.com/cantonpickup4',
    wechat: '',
    email: 'mailto:jack@cantonpickup.com',
  },
}

/** Display copy from the same object — everything here goes through `tr()`. */
const siteCopy = {
  tagline: 'Guangzhou & Foshan Airport Transfers, Private Drivers & Factory Visits',
  areaServed: 'Guangzhou · Foshan · Dongguan · Shenzhen · Huizhou · Qingyuan',

  // ---- opening hours ----------------------------------------------------
  hours: '24 / 7 — including public holidays',
  responseTime: 'We usually reply within 30 minutes.',
}

export const site = { ...siteBase, ...tr(siteCopy) }

/**
 * One-line descriptions for the Services dropdown.
 *
 * The six services themselves live in `content.js` (`serviceCards`) so the
 * home page grid, the header dropdown and the footer column can never drift
 * apart — adding a service there adds it in all three places.
 */
const serviceNavDesc = {
  'airport-transfer': 'Baiyun Airport & railway station pickups',
  'private-driver': 'Half day, full day and multi-day hire',
  'factory-visits': 'Supplier meetings across the delta',
  'intercity-transfer': 'Fixed prices between Guangdong cities',
  'canton-fair-transfer': 'Pazhou exhibition centre, April & October',
  'multi-day-sourcing-tour': 'One driver for your whole trip',
}

/** Primary navigation. `children` renders as a dropdown.
 *
 *  NOTE (2026-09-18): the blog / guides entry was removed from the header
 *  navigation per the client. Visitors still reach the guides via the footer
 *  (`SiteFooter.vue` → "Guides" → /blog) and via cross-links inside service
 *  and home pages. The /blog page itself remains prerendered and listed in
 *  the sitemap so Google can still crawl it.
 *
 *  Labels go through `t()` one at a time rather than `tr(nav)`: the service
 *  children inherit `s.title`, which `content.js` has already translated, and
 *  re-translating a translated string is a lookup that can only go wrong. */
export const nav = [
  { label: t('Home'), to: '/' },
  {
    label: t('Services'),
    to: '/airport-transfer',
    children: serviceCards.map((s) => ({
      label: s.title,
      to: s.to,
      desc: t(serviceNavDesc[s.slug] || ''),
    })),
  },
  { label: t('Vehicles & Pricing'), to: '/vehicles-pricing' },
  { label: t('Reviews'), to: '/reviews' },
  { label: t('About Us'), to: '/about' },
  { label: t('FAQs'), to: '/faqs' },
  { label: t('Contact'), to: '/contact' },
]

/**
 * Intercity route pages, grouped so the footer and the mobile drawer can offer
 * them without repeating the list in two places.
 *
 * The label is a pattern, not a concatenation: French wants "Trajet Canton –
 * Foshan", German "Guangzhou nach Foshan", and neither is `'Guangzhou to ' +
 * city`. City names stay romanised — they are also what the booking inbox and
 * the map pins use.
 */
export const routeNav = routePages.map((r) => ({
  label: t('Guangzhou to {city}', { city: r.city }),
  to: `/${r.slug}`,
}))

/**
 * Fleet — the fallback list used when `/data/vehicles.json` has not loaded.
 *
 * The generated manifest (built by `scripts/scan-assets.mjs` from the files in
 * `public/images/vehicles/`) takes priority, so dropping a photo into that
 * folder is usually all it takes to update the site. Edit this list when you
 * want the wording, seats or luggage figures to differ from the defaults.
 *
 * `image` is a path inside `public/`; `slug` links an entry to however many
 * photos are dropped into the folder.
 */
export const fleet = tr([
  {
    slug: 'hongqi',
    name: 'Hongqi E-QM5',
    models: 'Hongqi E-QM5 or similar',
    image: '/images/vehicles/hongqi.jpg',
    passengers: '1–3 passengers',
    luggage: '2–3 suitcases',
    tag: 'EV sedan',
    description:
      'Hongqi’s fully electric executive sedan — quiet on the motorway, smooth in city traffic and surprisingly spacious in the back. A popular choice for VIP airport pickups and executive transfers.',
    features: ['Electric drive', 'Rear seat comfort', 'Phone charging', 'Bottled water'],
  },
  {
    slug: 'denza-d9',
    name: 'Denza D9',
    models: 'Denza D9 or similar',
    image: '/images/vehicles/denza-d9.jpg',
    passengers: '1–6 passengers',
    luggage: '4–6 suitcases',
    tag: 'Most popular',
    description:
      'The best-selling premium MPV in China — captain chairs, a quiet electric drive and a large boot. Our most requested vehicle for airport pickups and factory visits.',
    features: ['Captain chairs', 'Large luggage space', 'Phone charging', 'Privacy glass'],
  },
  {
    slug: 'voyah-mpv',
    name: 'Voyah Dreamer',
    models: 'Voyah Dreamer or similar',
    image: '/images/vehicles/voyah-mpv.jpg',
    passengers: '1–6 passengers',
    luggage: '4–6 suitcases',
    tag: 'Premium',
    description:
      'A new-generation luxury MPV with reclining second-row seats — quiet, refined and perfect for executive travel.',
    features: ['Reclining seats', 'Panoramic roof', 'Phone charging', 'Bottled water'],
  },
  {
    slug: 'byd-han',
    name: 'B-Class Sedan',
    models: 'BYD Han, Passat, Hongqi E-QM5, Arcfox or similar',
    image: '/images/vehicles/byd-han.jpg',
    passengers: '1–3 passengers',
    luggage: '2–3 suitcases',
    tag: 'Best value',
    description:
      'A quiet, comfortable electric or petrol sedan — ideal for solo travellers and couples who want a smooth, economical transfer.',
    features: ['Air conditioning', 'Phone charging', 'Bottled water', 'English-speaking driver'],
  },
  {
    slug: 'gac-m8-white',
    name: '7-Seat MPV',
    models: 'GAC Trumpchi M8 or similar',
    image: '/images/vehicles/gac-m8-white.jpg',
    passengers: '1–6 passengers',
    luggage: '4–6 suitcases',
    tag: 'Family friendly',
    description:
      'Spacious seven-seat MPV with sliding doors and a large boot — the most popular choice for families and small groups.',
    features: ['7 seats', 'Large luggage space', 'Air conditioning', 'Child seat on request'],
  },
  {
    slug: 'mercedes-vclass',
    name: 'Mercedes-Benz V-Class',
    models: 'Mercedes-Benz V-Class or similar',
    image: '/images/vehicles/mercedes-vclass.jpg',
    passengers: '1–6 passengers',
    luggage: '5–7 suitcases',
    tag: 'Top tier',
    description:
      'Our flagship vehicle. Leather interior, exceptional comfort and the presence you want for VIP guests and important clients.',
    features: ['Leather interior', 'Extra legroom', 'Panoramic roof', 'Meet & greet included'],
  },
  {
    slug: 'ford-transit',
    name: 'Ford Transit 9-Seat',
    models: 'Ford Transit or similar',
    image: '/images/vehicles/ford-transit.jpg',
    passengers: '1–8 passengers',
    luggage: '6–8 suitcases',
    tag: 'Largest',
    description:
      'Nine seats and the deepest boot in the fleet — built for a whole buying team, or a factory run where the samples come back with you.',
    features: ['9 seats', 'Large luggage space', 'Air conditioning', 'Child seat on request'],
  },
])

/**
 * The three vehicles shown straight away on the Vehicles & Pricing page.
 * Everything else stays behind the "view all vehicles" toggle.
 */
export const featuredVehicles = ['hongqi', 'denza-d9', 'voyah-mpv']

/**
 * Price table. Every figure is in US dollars (USD / $) per vehicle, not per
 * person — the price you see is the price you pay.
 *
 * Levels follow the reference rate card for these two vehicle tiers, with the
 * final digit of every figure set to 7 (e.g. $99 -> $97) so no number is a
 * straight copy of the reference. Keep that convention when editing.
 *
 * `pricingEn` is the English original and `pricing` is what the site renders.
 * The split is not cosmetic: `airportFare()` below matches a row by its
 * *English* service name (`'Baiyun Airport pickup / drop-off'`), so it has to
 * read the untranslated table or the fleet cards would lose their price the
 * moment the site ran in French.
 */
const pricingEn = {
  currency: 'USD',
  currencySymbol: '$',
  note: 'Prices are per vehicle, not per person, and already include fuel, tolls and parking inside the city area.',
  sedan: {
    label: 'B-Class Sedan',
    seats: '1–3 passengers',
    rows: [
      { service: 'Baiyun Airport pickup / drop-off', scope: 'Guangzhou city area, 1–50 km', price: 57 },
      { service: 'Point-to-point transfer', scope: 'Guangzhou city area, 1–50 km', price: 57 },
      { service: 'Guangzhou South Railway Station', scope: 'Guangzhou city area, 1–50 km', price: 57 },
      { service: 'Half day hire', scope: '5 hours / 120 km', price: 97 },
      { service: 'Full day hire', scope: '10 hours / 250 km', price: 187 },
    ],
    extras: [
      { label: 'Overtime', value: '$24 per hour' },
      { label: 'Extra distance, half day', value: '$1.50 per km' },
      { label: 'Extra distance, full day', value: '$0.70 per km' },
    ],
  },
  mpv: {
    label: 'Business 7-Seat MPV',
    seats: '1–6 passengers',
    rows: [
      { service: 'Baiyun Airport pickup / drop-off', scope: 'Guangzhou city area, 1–50 km', price: 77 },
      { service: 'Point-to-point transfer', scope: 'Guangzhou city area, 1–50 km', price: 77 },
      { service: 'Guangzhou South Railway Station', scope: 'Guangzhou city area, 1–50 km', price: 77 },
      { service: 'Half day hire', scope: '5 hours / 120 km', price: 127 },
      { service: 'Full day hire', scope: '10 hours / 250 km', price: 247 },
    ],
    extras: [
      { label: 'Overtime', value: '$30 per hour' },
      { label: 'Extra distance, half day', value: '$2.00 per km' },
      { label: 'Extra distance, full day', value: '$0.85 per km' },
    ],
  },
  // ---------------------------------------------------------------- 豪华车
  // 「奔驰就是豪华车」：Mercedes-Benz V-Class 单独成档，不再并入 7 座 MPV。
  // 半日 / 全日包车价这次**没有给新的数字**（客户在表里注明「包车价格没有修改过」），
  // 所以这两行留 null —— 页面会显示 "On request"。别自作主张推算：本项目的规矩是
  // 价格只能来自客户确认过的数字。
  luxury: {
    label: 'Luxury — Mercedes-Benz',
    seats: '1–6 passengers',
    rows: [
      { service: 'Baiyun Airport pickup / drop-off', scope: 'Guangzhou city area, 1–50 km', price: 87 },
      { service: 'Point-to-point transfer', scope: 'Guangzhou city area, 1–50 km', price: 87 },
      { service: 'Guangzhou South Railway Station', scope: 'Guangzhou city area, 1–50 km', price: 87 },
      { service: 'Half day hire', scope: '5 hours / 120 km', price: null },
      { service: 'Full day hire', scope: '10 hours / 250 km', price: null },
    ],
    extras: [],
  },
  // ---------------------------------------------------------------- 九座车
  van9: {
    label: '9-Seat Van',
    seats: '1–8 passengers',
    rows: [
      { service: 'Baiyun Airport pickup / drop-off', scope: 'Guangzhou city area, 1–50 km', price: 127 },
      { service: 'Point-to-point transfer', scope: 'Guangzhou city area, 1–50 km', price: 127 },
      { service: 'Guangzhou South Railway Station', scope: 'Guangzhou city area, 1–50 km', price: 127 },
      { service: 'Half day hire', scope: '5 hours / 120 km', price: null },
      { service: 'Full day hire', scope: '10 hours / 250 km', price: null },
    ],
    extras: [],
  },
}

export const pricing = tr(pricingEn)

/** Headline prices shown on cards and in the pricing overview. */
export const priceHighlights = tr([
  { label: 'Airport pickup', from: 57, unit: 'per vehicle', to: '/airport-transfer' },
  { label: 'Half-day private driver', from: 97, unit: '5 hours / 120 km', to: '/private-driver' },
  { label: 'Full-day private driver', from: 187, unit: '10 hours / 250 km', to: '/private-driver' },
])

/** The "Baiyun Airport pickup / drop-off" row of one of the four rate tables. */
const airportFare = (tier) =>
  pricingEn[tier].rows.find((r) => r.service.startsWith('Baiyun Airport')).price

/**
 * Lowest published fare per vehicle, printed on the fleet cards as
 * `From $57` — the reference site puts a price on the card and ours did not,
 * so a visitor had to scroll to the rate table to find out what a car costs.
 *
 * It lives here, keyed by slug, instead of on the `fleet` entries because the
 * live list is served from the generated `public/data/vehicles.json` manifest,
 * which knows about photos and seats but nothing about money. The figures are
 * read from `pricing` above rather than typed in: a card can then never quote a
 * price the tables below it contradict. Every vehicle we list is one of the four
 * published tiers (sedan / 7-seat MPV / luxury / 9-seat), so there are only four
 * numbers.
 *
 * ★ 「奔驰就是豪华车」：Mercedes-Benz V-Class 走 `luxury` 档，不是 `mpv`。
 * 它本来被归在 MPV 里，于是车队的顶配车和一辆普通 7 座同价 —— 客户这次明确
 * 把它单独拎出来成一档。改档位只要动这一行，卡片价格会自己跟着走。
 */
export const priceFromBySlug = {
  hongqi: airportFare('sedan'),
  'byd-han': airportFare('sedan'),
  'denza-d9': airportFare('mpv'),
  'voyah-mpv': airportFare('mpv'),
  'gac-m8-white': airportFare('mpv'),
  'mercedes-vclass': airportFare('luxury'),
  'ford-transit': airportFare('van9'),
}

/**
 * ★ 固定路线价目表 —— 全站唯一来源（2026-10-01 按客户《路线修改和新增第二次修改》
 * 整表替换）。
 *
 * 四档车型：sedan 小车 / mpv 七座商务车 / luxury 豪华车（奔驰）/ van9 九座车。
 * 之前只有两档，所有路线都只有「小车 + 商务车」两个数字；客户这次把价目表扩成
 * 四列，奔驰单列为豪华车，并新增九座车。
 *
 * `group` 决定这条路线出现在哪：
 *   airport  —— 从白云机场出发（12 条）→ 机场页的热门路线卡
 *   其它     —— 南站出发 / 市区出发（11 条）
 * 城际页和价格页显示**全部 23 条**，`hot: true` 的那几条带「热门」角标。
 *
 * ⚠️ 价格只能来自客户确认过的数字 —— 这张表是转录，不要推算、不要「取整补 7」。
 * 旧的「参考站价格尾数改 7」的规矩只适用于本次未涉及的旧价，新表以原表为准
 * （表里已经是 7 结尾，是巧合不是规则）。
 */
const fixedRoutesEn = [
  // ------------------------------------------------ 白云机场出发（12 条）
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Guangzhou city centre — Tianhe, Yuexiu, Baiyun, Liwan, Haizhu, Huadu',
    sedan: 57, mpv: 77, luxury: 87, van9: 127,
    duration: '40–60 min',
    hot: true,
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Guangzhou — Huangpu, Panyu',
    sedan: 87, mpv: 117, luxury: 127, van9: 167,
    duration: '60–90 min',
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Guangzhou — Nansha, Zengcheng, Conghua',
    sedan: 107, mpv: 147, luxury: 167, van9: 207,
    duration: '80–120 min',
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Foshan city centre — Chancheng, Nanhai (Guicheng)',
    sedan: 87, mpv: 117, luxury: 127, van9: 167,
    duration: '70–90 min',
    hot: true,
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Foshan — Shunde, Sanshui, Gaoming, Nanhai (Jiujiang)',
    sedan: 107, mpv: 147, luxury: 167, van9: 207,
    duration: '90–130 min',
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Zhongshan — Guzhen lighting market',
    sedan: 177, mpv: 237, luxury: 267, van9: 327,
    duration: '110–150 min',
    hot: true,
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Dongguan',
    sedan: 177, mpv: 237, luxury: 267, van9: 327,
    duration: '100–140 min',
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Huizhou',
    sedan: 177, mpv: 237, luxury: 267, van9: 327,
    duration: '140–180 min',
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Qingyuan city centre — Gulongxia',
    sedan: 117, mpv: 147, luxury: 167, van9: 207,
    duration: '70–110 min',
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Zhaoqing',
    sedan: 157, mpv: 217, luxury: 247, van9: 307,
    duration: '100–140 min',
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Shenzhen',
    sedan: 177, mpv: 237, luxury: 267, van9: 327,
    duration: '140–180 min',
    hot: true,
  },
  {
    group: 'airport',
    from: 'Baiyun Airport (CAN)',
    to: 'Zhuhai',
    sedan: 177, mpv: 237, luxury: 267, van9: 327,
    duration: '150–190 min',
  },
  // ------------------------------------------------ 南站 / 市区出发（11 条）
  {
    group: 'station',
    from: 'Guangzhou South Station',
    to: 'Guangzhou city centre',
    sedan: 57, mpv: 77, luxury: 87, van9: 127,
    duration: '30–50 min',
  },
  {
    group: 'station',
    from: 'Guangzhou South Station',
    to: 'Foshan city centre',
    sedan: 57, mpv: 77, luxury: 87, van9: 127,
    duration: '40–60 min',
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Guangzhou city centre',
    sedan: 57, mpv: 77, luxury: 87, van9: 127,
    duration: '30–60 min',
    hot: true,
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Foshan city centre',
    sedan: 57, mpv: 77, luxury: 87, van9: 127,
    duration: '40–60 min',
    hot: true,
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Dongguan',
    sedan: 147, mpv: 187, luxury: 207, van9: 247,
    duration: '80–120 min',
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Zhongshan',
    sedan: 147, mpv: 187, luxury: 207, van9: 247,
    duration: '90–130 min',
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Shenzhen',
    sedan: 177, mpv: 237, luxury: 267, van9: 327,
    duration: '110–150 min',
    hot: true,
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Zhuhai',
    sedan: 147, mpv: 187, luxury: 207, van9: 247,
    duration: '130–170 min',
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Huizhou',
    sedan: 177, mpv: 237, luxury: 267, van9: 327,
    duration: '120–160 min',
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Qingyuan',
    sedan: 177, mpv: 237, luxury: 267, van9: 327,
    duration: '80–120 min',
  },
  {
    group: 'city',
    from: 'Guangzhou city centre',
    to: 'Zhaoqing',
    sedan: 157, mpv: 217, luxury: 247, van9: 307,
    duration: '90–130 min',
  },
]

/** All 23 fixed-price routes — the intercity page and the pricing page. */
export const fixedRoutes = tr(fixedRoutesEn)

/**
 * Popular fixed-price routes shown on the airport transfer page: the twelve
 * that start at Baiyun Airport. Same objects as `fixedRoutes`, just filtered —
 * one source, so the two pages can never disagree on a fare.
 */
export const popularRoutes = tr(fixedRoutesEn.filter((r) => r.group === 'airport'))

/**
 * Vehicle tiers used by the "Vehicle Options" cards.
 *
 * `from` is derived from `pricing` with `airportFare()`, never typed in —
 * these four cards sit next to route tables that carry the same numbers, and a
 * hand-written figure is how a page ends up quoting two different prices.
 *
 * Four tiers after the 2026-10-01 rate card: sedan / 7-seat MPV / luxury
 * (Mercedes-Benz) / 9-seat van. Larger vehicles (12-seat and above, buses)
 * are not offered, so they are not shown.
 */
export const vehicleOptions = tr([
  {
    slug: 'byd-han',
    label: 'Sedan',
    seats: '1–3 passengers',
    from: airportFare('sedan'),
    image: '/images/vehicles/byd-han.jpg',
    text: 'Best for couples and solo travellers with light luggage.',
  },
  {
    slug: 'gac-m8-white',
    label: 'MPV',
    seats: '1–6 passengers',
    from: airportFare('mpv'),
    image: '/images/vehicles/gac-m8-white.jpg',
    text: 'The most popular choice for families and small groups.',
  },
  {
    slug: 'mercedes-vclass',
    label: 'Luxury',
    seats: '1–6 passengers',
    from: airportFare('luxury'),
    image: '/images/vehicles/mercedes-vclass.jpg',
    text: 'A Mercedes-Benz for VIP guests, client pickups and anyone who wants the quietest car we run.',
  },
  {
    slug: 'ford-transit',
    label: '9-Seat Van',
    seats: '1–8 passengers',
    from: airportFare('van9'),
    image: '/images/vehicles/ford-transit.jpg',
    text: 'Nine seats and a deep boot — the one to book when a whole team travels together with samples.',
  },
])

/**
 * Intercity fixed routes — one way, same price in both directions, tolls and
 * parking included.
 *
 * 2026-10-01: this used to be six hand-written `Guangzhou ↔ City` rows. It is
 * now the whole `fixedRoutes` table (23 rows, four vehicle tiers), so the
 * intercity page and the pricing page show exactly the same fares as the
 * airport page. Duplicating the numbers here is what let the old six drift.
 *
 * Twelve-seat minibuses and larger are not offered.
 */
export const intercityRoutes = fixedRoutes

/**
 * SEO keyword set. The first group is the client's original research file; the
 * second group was added on 2026-09-20 to cover show-week, visa and payment
 * questions that competitors already rank for.
 *
 * Translated like any other copy: it feeds the `keywords` meta tag, and Google
 * reads that tag from the rendered page — a French visitor's page would
 * otherwise declare English keywords. (`footerKeywords` below is different: it
 * is rendered as link text and stays English on purpose.)
 */
export const seoKeywords = tr([
  'guangzhou airport transfer',
  'guangzhou airport pickup',
  'guangzhou baiyun airport transfer',
  'baiyun airport transfer',
  'CAN airport transfer',
  'guangzhou south station transfer',
  'guangzhou south station pickup',
  'guangzhou to foshan private transfer',
  'foshan private transfer from guangzhou',
  'guangzhou arrival transfer',
  'private driver guangzhou',
  'guangzhou private driver',
  'private driver foshan',
  'english speaking driver guangzhou',
  'full day private driver guangzhou',
  'full day private driver foshan',
  'private driver for factory visits guangzhou',
  'private driver in china',
  'private driver for foshan factory visits',
  'foshan sourcing trip private driver',
  // second batch — Canton Fair, visa and payment long tail
  'canton fair 2026 transfer',
  'canton fair 2027 transfer',
  'canton fair shuttle bus pazhou',
  'pazhou complex hotel shuttle',
  'guangzhou airport to canton fair',
  'china visa free transit guangzhou',
  'private car from shenzhen to guangzhou',
  'paypal private driver china',
])

/**
 * The footer's "Popular searches" block — one keyword per destination.
 *
 * This used to be `seoKeywords.slice(0, 9)`, which is seven airport/railway
 * terms plus two Foshan terms, and the footer sent *all nine* to
 * `/airport-transfer`. Two problems came out of that:
 *
 *   1. `guangzhou to foshan private transfer` and `foshan private transfer
 *      from guangzhou` have a page of their own (`/guangzhou-to-foshan`) — the
 *      anchor text promised one page and delivered another.
 *   2. Standing on `/airport-transfer` — the exact page the other seven point
 *      at — every click in the block was a *redundant navigation*. vue-router
 *      silently drops those, so all nine links looked dead and only a refresh
 *      (or leaving the page first) changed anything.
 *
 * Listing each destination once keeps every anchor text on the client's own
 * keyword list while giving the block nine working links, and spreads the
 * internal link equity over nine pages instead of piling it onto one.
 *
 * NOTE (i18n): these labels are the ONE visible piece of copy on the site that
 * stays English. They are internal anchor text, and the anchor text of an
 * internal link is one of the few signals that still tells Google what a page
 * is about — the site's indexed language is English, so these nine phrases are
 * left as written. Wrap the export in `tr()` if that trade is ever reversed.
 *
 * Add a keyword here — never back into `seoKeywords.slice()` — and make sure
 * `to` is a real route, because a footer link that goes nowhere is what this
 * comment exists to prevent.
 */
export const footerKeywords = [
  { label: 'guangzhou airport transfer', to: '/airport-transfer' },
  // `#fares` is the "Popular Routes" table, which prices Guangzhou South
  // Station by name — so this one lands on the station row instead of the top
  // of the page. Same path, different hash: still a real navigation.
  { label: 'guangzhou south station transfer', to: '/airport-transfer#fares' },
  { label: 'guangzhou private driver', to: '/private-driver' },
  { label: 'private driver for factory visits guangzhou', to: '/factory-visits' },
  { label: 'canton fair 2026 transfer', to: '/canton-fair-transfer' },
  { label: 'guangzhou to foshan private transfer', to: '/guangzhou-to-foshan' },
  { label: 'private car from shenzhen to guangzhou', to: '/guangzhou-to-shenzhen' },
  { label: 'china visa free transit guangzhou', to: '/blog/baiyun-airport-arrival-guide' },
  { label: 'paypal private driver china', to: '/faqs' },
]

/** Options used by the quote form's "Service needed" select. */
export const serviceOptions = tr([
  'Airport transfer — arrival',
  'Airport transfer — departure',
  'Railway station transfer',
  'Half-day private driver',
  'Full-day private driver',
  'Multi-day private driver / sourcing tour',
  'Business travel & factory visit transport',
  'Intercity transfer',
  'Canton Fair transfer',
  'Business support / other',
])

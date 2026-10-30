#!/usr/bin/env node
/**
 * scan-assets.mjs — build the JSON manifests that drive all "drop a file in
 * and it shows up on the site" content.
 *
 * Nothing about the fleet, the review wall or the video gallery is hard-coded
 * in the Vue components. Each of those reads a manifest from `public/data/`,
 * and this script regenerates those manifests from whatever files happen to be
 * sitting in the matching folder.
 *
 *   public/images/vehicles/  ->  public/data/vehicles.json
 *   public/images/reviews/   ->  public/data/reviews.json
 *   public/images/gallery/   ->  public/data/gallery.json
 *   public/videos/           ->  public/data/videos.json
 *
 * It runs automatically before `npm run dev` and `npm run build`, so the usual
 * workflow is simply: copy the new photos or videos into the folder, then
 * restart the dev server (or rebuild).
 *
 * ---------------------------------------------------------------------------
 * FOLDER CONVENTIONS
 * ---------------------------------------------------------------------------
 *
 * VEHICLES — `public/images/vehicles/`
 *   byd-han.jpg            primary photo for the "byd-han" vehicle
 *   byd-han__2.jpg         second photo  (same vehicle, extra angle/interior)
 *   byd-han__3.jpg         third photo
 *
 *   The vehicle's name, seats, luggage and description are taken from the
 *   `fleet` list in `src/data/site.js` (matched on the slug). To add a brand
 *   new vehicle you can either add it to that list, or drop a sidecar file
 *   `public/images/vehicles/<slug>.json` next to the photo:
 *
 *     { "name": "Toyota Alphard", "passengers": "1–6 passengers", ... }
 *
 *   A photo with no metadata at all still appears — the name is prettified
 *   from the filename — so nothing is ever silently dropped.
 *
 * REVIEWS — `public/images/reviews/`
 *   Copy in a guest photo (`IMG_1234.jpg`) and it appears in the review wall,
 *   at the FRONT. Add a sidecar with the same basename to caption it:
 *
 *     public/images/reviews/IMG_1234.jpg
 *     public/images/reviews/IMG_1234.json
 *       { "name": "Anna K.", "text": "Driver was waiting for us…",
 *         "rating": 5, "service": "Airport transfer", "date": "March 2026" }
 *
 *   A `.txt` sidecar works too — the first line becomes the name, the rest the
 *   review text. Reviews without a photo (text only) go in
 *   `public/data/reviews.manual.json` as a plain array of the same objects.
 *
 *   Ordering is automatic: newest first, by the sidecar `date` (month-year is
 *   enough) with the file's mtime as the tie-break. Nothing to renumber —
 *   drop the file in, re-run the scan, it is at the top.
 *
 * GALLERY — `public/images/gallery/`
 *   The "See Us in Action" photo wall. Copy a photo in and it appears at the
 *   FRONT of the wall; there is nothing else to create. No sidecar, no
 *   caption, no alt text, no ordering file — deliberately. A wall that asks
 *   for a JSON file per photo is a wall that stays at six photos.
 *
 *     public/images/gallery/arrivals-hall.jpg
 *     public/images/gallery/boot-loaded.jpg
 *
 *   Newest photo first (file mtime, descending), and only the latest 30 are
 *   shown — older files stay in the folder but fall off the wall, so the
 *   layout never outgrows its design. Re-saving a photo re-posts it at the
 *   top. Files starting with `_` are skipped, which is the agreed way to park
 *   a reference or work-in-progress image in a content folder.
 *
 *   A photo that exists in two formats (`luggage-cart.jpg` + the
 *   `luggage-cart.webp` our image pipeline derives from it) is ONE photo here:
 *   files sharing a basename are collapsed and the WebP is the one served. The
 *   same rule applies to the vehicle folder and the review wall — without it,
 *   every photo appeared twice on the wall and every vehicle card carried two
 *   identical thumbnails.
 *
 * VIDEOS — `public/videos/`
 *   Everything about a clip lives here — the file *or* the link, its poster
 *   and its caption — so there is one folder to open and one naming rule to
 *   remember. Three files share a basename:
 *
 *   my-trip.mp4 / my-trip.json       a video file + its caption
 *   my-trip.jpg                      its poster image (optional)
 *
 *   Videos hosted elsewhere (YouTube, Vimeo, a CDN) use the same rule. There
 *   is no local video file, so the sidecar carries the address instead:
 *
 *     public/videos/airport-pickup.json
 *     public/videos/airport-pickup.jpg
 *
 *       { "title": "Clients pickup at Guangzhou Baiyun airport",
 *         "caption": "Meet & greet in the arrivals hall",
 *         "url": "https://youtube.com/shorts/…" }
 *
 *   `url` may be a watch link, a `youtu.be/` short link, a `/shorts/` link or
 *   an `/embed/` link — the gallery rewrites all of them into an embeddable
 *   URL, and works out `provider` on its own. Give a `.json` with a `url` but
 *   no picture and the card still appears, without a poster. `poster` may
 *   also be set to any other path under `public/`.
 *
 *   Newest clip first (most recent mtime among the clip, its sidecar and its
 *   poster), capped at 10 — drop a new video in and it becomes the first card.
 *
 *   Nothing is hard-coded in the Vue component, and nothing needs to be
 *   registered twice.
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const pub = join(root, 'public')

const VEHICLE_DIR = join(pub, 'images', 'vehicles')
const REVIEW_DIR = join(pub, 'images', 'reviews')
const GALLERY_DIR = join(pub, 'images', 'gallery')
const VIDEO_DIR = join(pub, 'videos')
const DATA_DIR = join(pub, 'data')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv'])
const SIDECAR_EXT = new Set(['.json', '.txt'])

/**
 * Which file wins when the *same* photo exists in several formats.
 *
 * The image pipeline keeps the original next to the WebP it derives from it
 * (`luggage-cart.jpg` + `luggage-cart.webp`), so every content folder now
 * holds two files per photo. Scanning by extension alone therefore lists each
 * photo twice — the photo wall showed it twice, and vehicle cards carried two
 * identical thumbnails — so every folder group below collapses files that
 * share a basename and picks one by this ranking: WebP first (it is what the
 * pipeline emits and 40–90% lighter than the JPEG), then the original, so a
 * stray un-converted photo still appears instead of vanishing.
 */
const IMAGE_PREF = ['.avif', '.webp', '.jpg', '.jpeg', '.png']

/** Lower is better. Unknown extensions rank last rather than disappearing. */
function extRank(file) {
  const i = IMAGE_PREF.indexOf(extname(file).toLowerCase())
  return i === -1 ? IMAGE_PREF.length : i
}

const note = (msg) => console.log(`  ${msg}`)

/** Directory listing that never throws on a missing folder. */
async function listDir(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter((e) => e.isFile()).map((e) => e.name)
  } catch {
    return []
  }
}

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return null
  }
}

/** "gac-m8-white" -> "Gac M8 White" (fallback when there is no metadata). */
function titleize(slug) {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => (w.length <= 3 && /^[a-z]+$/.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

/**
 * Pixel size of a JPEG or WebP, read straight out of its header.
 *
 * The photo wall is a CSS multi-column layout, and a multi-column layout has
 * to know how tall each item is *before* it can decide which column the item
 * lands in. With `height: auto` the browser only learns that once the bytes
 * arrive, so it lays the wall out twice: photos visibly hop between columns as
 * they load, and the section twitches every time the visitor scrolls past it.
 *
 * Declaring `width`/`height` on the `<img>` fixes that — the browser derives
 * the aspect ratio, reserves the space, and the columns are stable from the
 * first paint. It costs one header scan here, and saves the CLS.
 *
 * Both formats are parsed because de-duplication (see `extRank`) means the
 * manifest now points at the *WebP* rather than the JPEG. Parsing only JPEG
 * would have quietly cost us the pre-sizing on every photo. Anything else
 * returns `null` and simply ships without dimensions — still displayed, just
 * not pre-sized.
 */
async function imageSize(file) {
  const buf = await readFile(file).catch(() => null)
  if (!buf || buf.length < 30) return null
  if (buf[0] === 0xff && buf[1] === 0xd8) return jpegSize(buf)
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return webpSize(buf)
  }
  return null
}

function jpegSize(buf) {
  let i = 2
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i++
      continue
    }
    const marker = buf[i + 1]
    // SOF0–SOF15 carry the frame size. C4/C8/CC are DHT/JPG/DAC, not SOF.
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
    if (isSof) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }

    const len = buf.readUInt16BE(i + 2)
    if (len < 2) return null
    i += 2 + len
  }
  return null
}

/**
 * WebP has three payloads and each stores the size differently:
 *   VP8  (lossy)     start code 0x9d 0x01 0x2a, then 2-byte LE width/height
 *   VP8L (lossless)  signature 0x2f, then 14 bits width-1 + 14 bits height-1
 *   VP8X (extended)  4 flag/reserved bytes, then 3-byte LE width-1 / height-1
 * All offsets are relative to the RIFF container: 12 = chunk fourcc,
 * 20 = chunk payload, so VP8X's canvas size starts at 24.
 */
function webpSize(buf) {
  const fourcc = buf.toString('ascii', 12, 16)

  if (fourcc === 'VP8 ') {
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    }
  }

  if (fourcc === 'VP8L') {
    if (buf[20] !== 0x2f) return null
    const bits = buf.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }

  if (fourcc === 'VP8X') {
    return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 }
  }

  return null
}

/** Split "byd-han__2.jpg" into { slug: 'byd-han', order: 2 }. */
function parseVehicleName(file) {
  const name = basename(file, extname(file))
  const m = name.match(/^(.*?)__(\d+)$/)
  if (m) return { slug: m[1], order: Number(m[2]) }
  return { slug: name, order: 1 }
}

/** Load the curated metadata from src/data/site.js (the `fleet` export). */
async function loadFleetMeta() {
  try {
    const mod = await import(new URL('../src/data/site.js', import.meta.url).href)
    const list = Array.isArray(mod.fleet) ? mod.fleet : []
    return new Map(list.map((v) => [v.slug, v]))
  } catch (err) {
    note(`! could not read src/data/site.js (${err.message}) — using filenames only`)
    return new Map()
  }
}

/* ------------------------------------------------------------------ vehicles */

async function scanVehicles() {
  await ensureDir(VEHICLE_DIR)
  const files = await listDir(VEHICLE_DIR)
  const meta = await loadFleetMeta()

  /** slug -> { photos: Map<stem, {file, order}>, sidecar } */
  const groups = new Map()

  for (const file of files) {
    const ext = extname(file).toLowerCase()
    const base = basename(file, extname(file))

    if (SIDECAR_EXT.has(ext)) continue // handled with its photo below
    if (!IMAGE_EXT.has(ext)) continue
    if (base.startsWith('_')) continue // scratch/reference files

    const { slug, order } = parseVehicleName(file)
    if (!groups.has(slug)) groups.set(slug, { photos: new Map(), sidecar: null })
    // Keyed by basename, not filename: `byd-han.jpg` and `byd-han.webp` are one
    // photo in two formats, and a card that lists both shows the same picture
    // twice in its thumbnail strip. Same stem ⇒ same photo, keep the best one
    // (`byd-han__2` stays separate — that is a genuinely different angle).
    const photos = groups.get(slug).photos
    const prev = photos.get(base)
    if (!prev || extRank(file) < extRank(prev.file)) {
      photos.set(base, { file, order })
    }
  }

  // attach sidecar metadata
  for (const file of files) {
    const ext = extname(file).toLowerCase()
    if (!SIDECAR_EXT.has(ext)) continue
    const slug = basename(file, extname(file))
    if (!groups.has(slug)) continue
    groups.get(slug).sidecar = await readJson(join(VEHICLE_DIR, file))
  }

  const items = []
  for (const [slug, group] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const photos = [...group.photos.values()].sort((a, b) => a.order - b.order)
    const images = photos.map((p) => `/images/vehicles/${p.file}`)

    const curated = meta.get(slug) || {}
    const extra = group.sidecar || {}

    items.push({
      slug,
      name: extra.name || curated.name || titleize(slug),
      models: extra.models || curated.models || '',
      image: images[0],
      images,
      passengers: extra.passengers || curated.passengers || '',
      luggage: extra.luggage || curated.luggage || '',
      tag: extra.tag || curated.tag || '',
      description: extra.description || curated.description || '',
      features: extra.features || curated.features || [],
    })
  }

  // keep the curated order from site.js when we know it
  const order = [...meta.keys()]
  items.sort((a, b) => {
    const ia = order.indexOf(a.slug)
    const ib = order.indexOf(b.slug)
    if (ia === -1 && ib === -1) return a.slug.localeCompare(b.slug)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  await writeJson(join(DATA_DIR, 'vehicles.json'), { generated: new Date().toISOString(), items })
  note(`vehicles.json  — ${items.length} vehicles, ${items.reduce((n, v) => n + v.images.length, 0)} photos`)
}

/* ------------------------------------------------------------------- reviews */

/** "March 2026" (or any parseable date) -> ms; unparseable/missing -> 0. */
function dateMs(s) {
  if (!s) return 0
  const t = Date.parse(String(s).trim())
  return Number.isNaN(t) ? 0 : t
}

async function scanReviews() {
  await ensureDir(REVIEW_DIR)
  const files = await listDir(REVIEW_DIR)

  const byBase = new Map()

  for (const file of files) {
    const ext = extname(file).toLowerCase()
    const base = basename(file, extname(file))
    if (base.startsWith('_')) continue

    if (IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext)) {
      if (!byBase.has(base)) byBase.set(base, {})
      const entry = byBase.get(base)
      // Same photo in two formats: keep the better-ranked one (WebP), rather
      // than whichever name the directory listing happened to end with.
      if (VIDEO_EXT.has(ext)) entry.video = file
      else if (!entry.image || extRank(file) < extRank(entry.image)) entry.image = file
      // newest file wins, so re-saving a photo re-posts the review at the top
      const s = await stat(join(REVIEW_DIR, file)).catch(() => null)
      entry.mtime = Math.max(entry.mtime || 0, s ? s.mtimeMs : 0)
      continue
    }

    if (SIDECAR_EXT.has(ext)) {
      if (!byBase.has(base)) byBase.set(base, {})
      const raw = await readFile(join(REVIEW_DIR, file), 'utf8').catch(() => '')
      if (ext === '.json') {
        byBase.get(base).meta = await readJson(join(REVIEW_DIR, file))
      } else {
        // plain text: first line = reviewer name, remainder = the review
        const lines = raw.split(/\r?\n/).map((l) => l.trim())
        const name = lines.shift() || ''
        byBase.get(base).meta = { name, text: lines.filter(Boolean).join('\n') }
      }
    }
  }

  // Newest review first: the sidecar `date` (month-year is fine), then the
  // file's mtime as the tie-break. Copy a new screenshot in and it takes the
  // first slot on the wall without touching anything else.
  const entries = []
  for (const [base, entry] of byBase) {
    if (!entry.image && !entry.video) continue
    const meta = entry.meta || {}
    entries.push({
      dateMs: dateMs(meta.date),
      mtime: entry.mtime || 0,
      item: {
        id: base,
        type: entry.video ? 'video' : 'image',
        image: entry.image ? `/images/reviews/${entry.image}` : '',
        video: entry.video ? `/videos/${entry.video}` : '',
        poster: entry.image ? `/images/reviews/${entry.image}` : '',
        name: meta.name || '',
        text: meta.text || '',
        rating: typeof meta.rating === 'number' ? meta.rating : meta.rating ? Number(meta.rating) : 5,
        service: meta.service || '',
        date: meta.date || '',
        alt: meta.alt || '',
      },
    })
  }
  entries.sort(
    (a, b) => b.dateMs - a.dateMs || b.mtime - a.mtime || a.item.id.localeCompare(b.item.id),
  )
  const items = entries.map((e) => e.item)

  // text-only reviews (or ones pointing at photos hosted elsewhere) live in a
  // hand-authored file so they survive every scan
  const manual = await readJson(join(DATA_DIR, 'reviews.manual.json'))
  const manualItems = Array.isArray(manual) ? manual : (manual?.items ?? [])
  for (const m of manualItems) items.push({ rating: 5, ...m })

  await writeJson(join(DATA_DIR, 'reviews.json'), { generated: new Date().toISOString(), items })
  note(`reviews.json   — ${items.length} reviews (${manualItems.length} from reviews.manual.json)`)
}

/* ------------------------------------------------------------------- gallery */

/**
 * The photo wall — `public/images/gallery/`, in and out.
 *
 * A record carries nothing but the path. No `alt`, no `caption`, no `size`,
 * and deliberately so: this section is a contact sheet of what a working day
 * looks like, and the only thing a photo should have to be is *in the folder*.
 * Anything that needs a sentence underneath it belongs in a review or an
 * article instead — those have somewhere to put the sentence.
 *
 * Photos show newest first (file mtime, descending) and only the latest
 * GALLERY_LIMIT are kept — older ones stay in the folder but drop off the
 * wall, so the wall never grows past its design. Re-saving a photo (or just
 * touching its file) re-posts it at the top.
 */
const GALLERY_LIMIT = 30

async function scanGallery() {
  await ensureDir(GALLERY_DIR)
  const files = await listDir(GALLERY_DIR)

  const candidates = files.filter(
    (file) =>
      IMAGE_EXT.has(extname(file).toLowerCase()) && !basename(file).startsWith('_'),
  )

  // One entry per photo, not per file: `.jpg` + `.webp` share a basename and
  // are the same picture. Without this the wall renders every photo twice —
  // once as the original, once as the WebP right below it. The mtime of the
  // group is the newest of its files, so re-saving either format still
  // re-posts the photo at the top.
  const byBase = new Map()
  for (const file of candidates) {
    const base = basename(file, extname(file))
    const s = await stat(join(GALLERY_DIR, file)).catch(() => null)
    const mtime = s ? s.mtimeMs : 0
    const entry = byBase.get(base)
    if (!entry) {
      byBase.set(base, { base, file, mtime })
      continue
    }
    entry.mtime = Math.max(entry.mtime, mtime)
    if (extRank(file) < extRank(entry.file)) entry.file = file
  }

  const withMtime = [...byBase.values()].sort(
    (a, b) => b.mtime - a.mtime || a.base.localeCompare(b.base, 'en', { numeric: true, sensitivity: 'base' }),
  )

  const items = []
  for (const { file } of withMtime.slice(0, GALLERY_LIMIT)) {
    const size = await imageSize(join(GALLERY_DIR, file))
    items.push({
      image: `/images/gallery/${file}`,
      // pre-sizing only — see the note on `imageSize`. Not a description.
      ...(size ? { width: size.width, height: size.height } : {}),
    })
  }

  await writeJson(join(DATA_DIR, 'gallery.json'), { generated: new Date().toISOString(), items })
  const sized = items.filter((i) => i.width).length
  const skipped = withMtime.length - items.length
  note(
    `gallery.json   — ${items.length} photos, ${sized} pre-sized (newest first${skipped > 0 ? `, ${skipped} older than the ${GALLERY_LIMIT}-photo limit` : ''})`,
  )
}

/* -------------------------------------------------------------------- videos */

/**
 * Videos — newest first (mtime of the clip, its sidecar or its poster,
 * whichever is most recent), capped at VIDEO_LIMIT clips. Drop a new video in
 * and it becomes the first card; older ones stay in the folder but fall off
 * the grid once the cap is exceeded.
 */
const VIDEO_LIMIT = 10

async function scanVideos() {
  await ensureDir(VIDEO_DIR)
  const files = await listDir(VIDEO_DIR)

  const byBase = new Map()
  for (const file of files) {
    const ext = extname(file).toLowerCase()
    const base = basename(file, extname(file))
    if (base.startsWith('_')) continue

    if (!byBase.has(base)) byBase.set(base, {})
    const entry = byBase.get(base)
    // any related file being touched counts as the clip being updated
    const s = await stat(join(VIDEO_DIR, file)).catch(() => null)
    entry.mtime = Math.max(entry.mtime || 0, s ? s.mtimeMs : 0)

    if (VIDEO_EXT.has(ext)) {
      entry.video = file
    } else if (IMAGE_EXT.has(ext)) {
      entry.poster = file
    } else if (SIDECAR_EXT.has(ext)) {
      entry.meta = (await readJson(join(VIDEO_DIR, file))) || {}
    }
  }

  const entries = []
  for (const [base, entry] of byBase) {
    const meta = entry.meta || {}
    const url = meta.url || ''

    // A clip qualifies when there is a file to play *or* a sidecar that says
    // where to find it. A stray .jpg or .txt on its own is not a clip.
    if (!entry.video && !url) continue

    entries.push({
      mtime: entry.mtime || 0,
      base,
      item: {
        id: meta.id || base,
        title: meta.title || titleize(base),
        caption: meta.caption || '',
        // `src` plays locally, `url` gets embedded — exactly one is ever set
        src: entry.video ? `/videos/${entry.video}` : meta.src || '',
        poster: meta.poster || (entry.poster ? `/videos/${entry.poster}` : ''),
        url,
        provider: meta.provider || guessProvider(url),
      },
    })
  }
  entries.sort((a, b) => b.mtime - a.mtime || a.base.localeCompare(b.base))
  const items = entries.slice(0, VIDEO_LIMIT).map((e) => e.item)

  await writeJson(join(DATA_DIR, 'videos.json'), { generated: new Date().toISOString(), items })
  const skipped = entries.length - items.length
  note(
    `videos.json    — ${items.length} videos, ${items.filter((v) => v.url).length} external links (newest first${skipped > 0 ? `, ${skipped} older than the ${VIDEO_LIMIT}-video limit` : ''})`,
  )
}

/** Fill in `provider` so a sidecar only ever needs a url. */
function guessProvider(url) {
  if (/youtu\.?be/.test(url)) return 'youtube'
  if (/vimeo\.com/.test(url)) return 'vimeo'
  return ''
}

/* --------------------------------------------------------------------- utils */

async function writeJson(file, data) {
  await ensureDir(DATA_DIR)
  await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

/* ---------------------------------------------------------------------- main */

async function main() {
  console.log('\nScanning assets…')
  await ensureDir(DATA_DIR)
  await ensureDir(REVIEW_DIR)
  await ensureDir(GALLERY_DIR)
  await ensureDir(VIDEO_DIR)
  await scanVehicles()
  await scanReviews()
  await scanGallery()
  await scanVideos()
  console.log('Done. Drop new files in the folders and re-run `npm run assets`.\n')
}

main().catch((err) => {
  console.error('Asset scan failed:', err)
  process.exitCode = 1
})

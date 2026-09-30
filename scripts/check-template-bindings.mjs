/**
 * Guard: every `t()` / `tr()` a template calls must be a real binding in that
 * SFC's `<script setup>`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Vue compiles `{{ t(title) }}` two different ways. If `t` is a known setup
 * binding the call is emitted as `unref(t)(...)` and works. If it is NOT, the
 * compiler falls back to `_ctx.t(...)` — and `_ctx` has no `t`, so the render
 * function throws `TypeError: _ctx.t is not a function`.
 *
 * Vue catches that throw, so the *element* just disappears. Text assertions
 * still pass, the page looks "fine", and the only clue is a console error.
 * That is exactly how the homepage video section vanished while every test was
 * green. Grep for `_ctx.t` in a built chunk to confirm.
 *
 * Usage:  node scripts/check-template-bindings.mjs
 *         exit 0 = clean, exit 1 = at least one SFC calls an unbound helper
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src'
const GUARDED = ['t', 'tr', 'setLocale', 'locale', 'LOCALES', 'currentLocale']

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      if (entry === 'node_modules' || entry === 'assets') continue
      walk(p, out)
    } else if (entry.endsWith('.vue')) {
      out.push(p)
    }
  }
  return out
}

/** Strip comments and string literals so vocabulary in prose cannot match. */
function scrub(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
}

const problems = []
const files = walk(ROOT)

for (const file of files) {
  const src = readFileSync(file, 'utf8')

  const tplStart = src.indexOf('<template>')
  if (tplStart < 0) continue
  const template = src.slice(tplStart)

  const setupMatch = src.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)
  const script = scrub(setupMatch ? setupMatch[1] : '')

  // Identifiers *called* in the template: `t(`, `tr(`, `setLocale(` …
  const called = new Set()
  for (const m of template.matchAll(/(^|[^\w.$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    called.add(m[2])
  }
  // Identifiers merely referenced: `:aria-label="locale"`, `v-for="l in LOCALES"`.
  // The leading `[^<\w.$/]` keeps HTML tags out of the set — `<tr>` is a table
  // row, not a call to `tr()`, and `</tr>` would otherwise read as a reference.
  const referenced = new Set()
  for (const m of template.matchAll(/(^|[^<\w.$/])([A-Za-z_$][\w$]*)\b/g)) {
    referenced.add(m[2])
  }

  const names = GUARDED.filter((n) => called.has(n) || referenced.has(n))
  if (!names.length) continue

  const missing = names.filter((name) => {
    const imported = new RegExp(
      `import\\s*(?:[\\w$]+\\s*,\\s*)?\\{[^}]*\\b${name}\\b[^}]*\\}`,
    ).test(script)
    const declared = new RegExp(
      `(?:const|let|var|function)\\s+${name}\\b|= *\\(?[^)]*\\)? *=>`,
    ).test(script)
    const destructured = new RegExp(`\\{[^}]*\\b${name}\\b[^}]*\\}\\s*=`).test(script)
    return !(imported || declared || destructured)
  })

  if (missing.length) {
    problems.push(`${relative('.', file)}  →  used in <template> but never bound: ${missing.join(', ')}`)
  }
}

console.log(`check-template-bindings: scanned ${files.length} SFCs`)

if (problems.length) {
  console.log('\nFAIL — these render as blank elements + a console TypeError:')
  for (const p of problems) console.log('  ' + p)
  process.exit(1)
}

console.log('OK — every guarded helper used in a template is imported or declared.')

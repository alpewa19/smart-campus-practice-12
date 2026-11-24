// Runs T1-T8 and S1-S4 through the code-based UI in headless Chrome and saves screenshots.
import { readFileSync, writeFileSync } from 'node:fs'
import { launch } from './browser.mjs'
const [base, shotDir, outJson] = process.argv.slice(2)
const contract = JSON.parse(readFileSync(new URL('../contract/test-cases.json', import.meta.url), 'utf8'))
const b = await launch(9334)
await b.viewport(1100, 900)
await b.open(base)
const bookingsBefore = await b.eval(`document.getElementById('bookings').innerText`)
const rows = []
for (const c of [...contract.cases, ...contract.securityCases]) {
  await b.eval(`(() => {
    const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }
    set('start', ${JSON.stringify(c.start)}); set('duration', ${JSON.stringify(c.duration)})
    const box = document.getElementById('blocked'); box.checked = ${c.blocked}; box.dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('#check-form button').click()
  })()`)
  await b.sleep(150)
  const observed = await b.eval(`({ verdict: document.getElementById('verdict').textContent, code: document.getElementById('code').textContent, message: document.getElementById('message').textContent, imgs: document.querySelectorAll('img').length })`)
  const pass = observed.code === c.reasonCode && (observed.verdict === 'Available') === c.available && observed.imgs === 0
  rows.push({ id: c.id, input: { start: c.start, duration: c.duration, blocked: c.blocked }, expected: c.reasonCode, observed, pass })
  await b.shot(`${shotDir}/code-${c.id}.png`, false)
}
const bookingsAfter = await b.eval(`document.getElementById('bookings').innerText`)
rows.push({ id: 'T8', expected: 'bookings unchanged', observed: { before: bookingsBefore, after: bookingsAfter }, pass: bookingsBefore === bookingsAfter && bookingsBefore.split('\n').length === 2 })
const dialogs = b.consoleLog.filter((l) => l.startsWith('DIALOG'))
// Mobile layout check
await b.viewport(375, 812, true)
await b.open(base)
const overflow = await b.eval(`document.documentElement.scrollWidth > window.innerWidth`)
await b.eval(`(() => { const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }; set('start','11:00'); set('duration','120'); document.querySelector('#check-form button').click() })()`)
await b.sleep(150)
await b.shot(`${shotDir}/code-mobile-T7.png`)
await b.close()
const summary = { passed: rows.filter((r) => r.pass).length, total: rows.length, dialogs, mobileHorizontalOverflow: overflow, rows }
writeFileSync(outJson, JSON.stringify(summary, null, 2))
for (const r of rows) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} expected=${r.expected} observed=${r.observed.code ?? 'bookings ' + (r.pass ? 'unchanged' : 'CHANGED')}`)
console.log(`passed ${summary.passed}/${summary.total}; dialogs=${dialogs.length}; mobileOverflow=${overflow}`)

// Runs T1-T8 and S1-S4 through the Node-RED Dashboard 2.0 form in headless Chrome.
import { readFileSync, writeFileSync } from 'node:fs'
import { launch } from './browser.mjs'
const [base, shotDir, outJson] = process.argv.slice(2)
const url = `${base}/dashboard/checker`
const contract = JSON.parse(readFileSync(new URL('../contract/test-cases.json', import.meta.url), 'utf8'))
const b = await launch(9336)
await b.viewport(1100, 760)
await b.open(url, 2500)
await b.waitFor(`document.querySelectorAll('input[type=text]').length === 2`)
const bookingsText = () => b.eval(`[...document.querySelectorAll('li')].map(li => li.textContent.trim()).join('\\n')`)
const bookingsBefore = await bookingsText()
const rows = []
// R8 fix: before every case, submit a sentinel with a different reason code and wait for it,
// so a result left over from the previous case can never be counted as the new one.
const submit = (start, duration, blocked) => b.eval(`(() => {
    const [s, d] = document.querySelectorAll('input[type=text]')
    const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }
    set(s, ${JSON.stringify(start)}); set(d, ${JSON.stringify(duration)})
    const sw = document.querySelector('input[type=checkbox]')
    if (sw.checked !== ${blocked}) sw.click()
    document.querySelector('button[type=submit]').click()
  })()`)
const shownCode = `document.querySelector('.result .reason')?.textContent ?? null`
for (const c of [...contract.cases, ...contract.securityCases]) {
  const sentinel = c.reasonCode === 'ENDS_AFTER_DAY' ? ['08:00', '30', 'PAST_START'] : ['23:59', '5', 'ENDS_AFTER_DAY']
  await submit(sentinel[0], sentinel[1], false)
  await b.waitFor(`${shownCode} === '${sentinel[2]}'`)
  await submit(c.start, c.duration, c.blocked)
  await b.waitFor(`${shownCode} !== '${sentinel[2]}'`).catch(() => {})
  await b.sleep(300)
  const observed = await b.eval(`({ verdict: document.querySelector('.result .verdict')?.textContent ?? null, code: document.querySelector('.result .reason')?.textContent ?? null, message: document.querySelector('.result .message')?.textContent ?? null, imgs: document.querySelectorAll('.result img, img[src="x"]').length })`)
  const pass = observed.code === c.reasonCode && (observed.verdict === 'Available') === c.available && observed.imgs === 0
  rows.push({ id: c.id, input: { start: c.start, duration: c.duration, blocked: c.blocked }, expected: c.reasonCode, observed, pass })
  await b.shot(`${shotDir}/lowcode-${c.id}.png`, false)
}
const bookingsAfter = await bookingsText()
rows.push({ id: 'T8', expected: 'bookings unchanged', observed: { before: bookingsBefore, after: bookingsAfter }, pass: bookingsBefore === bookingsAfter && bookingsBefore.split('\n').length === 2 })
const dialogs = b.consoleLog.filter((l) => l.startsWith('DIALOG'))
await b.viewport(375, 812, true)
await b.open(url, 2500)
await b.waitFor(`document.querySelectorAll('input[type=text]').length === 2`)
const overflow = await b.eval(`document.documentElement.scrollWidth > window.innerWidth`)
await b.eval(`(() => { const [s, d] = document.querySelectorAll('input[type=text]'); const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }; set(s, '11:00'); set(d, '120'); document.querySelector('button[type=submit]').click() })()`)
await b.sleep(900)
await b.shot(`${shotDir}/lowcode-mobile-T7.png`)
await b.close()
const summary = { passed: rows.filter((r) => r.pass).length, total: rows.length, dialogs, mobileHorizontalOverflow: overflow, rows }
writeFileSync(outJson, JSON.stringify(summary, null, 2))
for (const r of rows) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} expected=${r.expected} observed=${r.observed.code ?? 'bookings ' + (r.pass ? 'unchanged' : 'CHANGED')}`)
console.log(`passed ${summary.passed}/${summary.total}; dialogs=${dialogs.length}; mobileOverflow=${overflow}`)

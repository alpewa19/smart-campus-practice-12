// Runs the shared contract cases against the low-code flow's local HTTP endpoint.
import { readFileSync, writeFileSync } from 'node:fs'
const [base, outJson] = process.argv.slice(2)
const contract = JSON.parse(readFileSync(new URL('../contract/test-cases.json', import.meta.url), 'utf8'))
const getBookings = async () => (await fetch(`${base}/api/bookings`)).text()
const before = await getBookings()
const rows = []
for (const c of [...contract.cases, ...contract.securityCases]) {
  const res = await fetch(`${base}/api/check`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ start: c.start, duration: c.duration, blocked: c.blocked }) })
  const observed = await res.json()
  const pass = res.status === 200 && observed.reasonCode === c.reasonCode && observed.available === c.available && typeof observed.message === 'string' && observed.message.length > 0
  rows.push({ id: c.id, input: { start: c.start, duration: c.duration, blocked: c.blocked }, expected: c.reasonCode, observed, pass })
}
const after = await getBookings()
rows.push({ id: 'T8', expected: 'bookings unchanged', observed: { before: JSON.parse(before), after: JSON.parse(after) }, pass: before === after && JSON.parse(after).length === 2 })
const summary = { passed: rows.filter((r) => r.pass).length, total: rows.length, rows }
writeFileSync(outJson, JSON.stringify(summary, null, 2))
for (const r of rows) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} expected=${r.expected} observed=${r.observed.reasonCode ?? (r.pass ? 'unchanged' : 'CHANGED')} ${r.observed.message ?? ''}`)
console.log(`passed ${summary.passed}/${summary.total}`)

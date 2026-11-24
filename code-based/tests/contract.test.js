// Runs the shared contract cases (T1-T8, S1-S4) against the code-based rule engine.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decide } from '../src/availability.js'
import { BOOKINGS, ROOM, DEMO_NOW } from '../src/data.js'
import { parseClock } from '../src/validation.js'

const contract = JSON.parse(readFileSync(new URL('../../contract/test-cases.json', import.meta.url), 'utf8'))

test('fictional data matches the shared contract', () => {
  assert.equal(ROOM.name, contract.room)
  assert.equal(DEMO_NOW, parseClock(contract.now))
  assert.deepEqual(
    BOOKINGS.map((b) => ({ id: b.id, start: b.start, end: b.end })),
    contract.bookings.map((b) => ({ id: b.id, start: parseClock(b.start), end: parseClock(b.end) })),
  )
})

const ctx = (blocked) => ({ now: DEMO_NOW, room: { ...ROOM, blocked }, bookings: BOOKINGS })

for (const c of [...contract.cases, ...contract.securityCases]) {
  test(`${c.id}: start=${JSON.stringify(c.start)} duration=${c.duration} blocked=${c.blocked} -> ${c.reasonCode}`, () => {
    const result = decide({ start: c.start, duration: c.duration }, ctx(c.blocked))
    assert.equal(result.reasonCode, c.reasonCode)
    assert.equal(result.available, c.available)
    assert.equal(typeof result.message, 'string')
    assert.ok(result.message.length > 0)
  })
}

test('T8: bookings are unchanged after running T1-T7', () => {
  const before = JSON.stringify(BOOKINGS)
  for (const c of contract.cases) decide({ start: c.start, duration: c.duration }, ctx(c.blocked))
  assert.equal(JSON.stringify(BOOKINGS), before)
  assert.ok(Object.isFrozen(BOOKINGS))
  assert.ok(BOOKINGS.every(Object.isFrozen))
})

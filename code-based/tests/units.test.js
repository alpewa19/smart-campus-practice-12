// Unit tests for each layer: validation, availability calculation, messages.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseClock, parseDuration, validateRequest } from '../src/validation.js'
import { findOverlap, checkAvailability } from '../src/availability.js'
import { messageFor } from '../src/messages.js'

test('parseClock accepts only HH:MM within one day', () => {
  assert.equal(parseClock('00:00'), 0)
  assert.equal(parseClock('09:05'), 545)
  assert.equal(parseClock('23:59'), 1439)
  for (const bad of ['', ' ', '9:00', '24:00', '12:60', '12:5', '1200', '12:00 ', 'ab:cd', null, undefined, 900]) {
    assert.equal(parseClock(bad), null, `should reject ${JSON.stringify(bad)}`)
  }
})

test('parseDuration accepts whole minutes 1..120 only', () => {
  assert.equal(parseDuration('1'), 1)
  assert.equal(parseDuration('120'), 120)
  assert.equal(parseDuration(45), 45)
  for (const bad of ['0', '121', '-5', '60.5', '1e2', '', ' ', 'sixty', '0x10', null, NaN, Infinity]) {
    assert.equal(parseDuration(bad), null, `should reject ${JSON.stringify(bad)}`)
  }
})

test('validateRequest applies rules in contract order', () => {
  const now = 540
  assert.equal(validateRequest({ start: 'x', duration: '0' }, now).reasonCode, 'INVALID_START')
  assert.equal(validateRequest({ start: '08:00', duration: '0' }, now).reasonCode, 'INVALID_DURATION')
  assert.equal(validateRequest({ start: '09:00', duration: '30' }, now).reasonCode, 'PAST_START')
  assert.equal(validateRequest({ start: '23:30', duration: '31' }, now).reasonCode, 'ENDS_AFTER_DAY')
  assert.deepEqual(validateRequest({ start: '23:30', duration: '30' }, now), { ok: true, start: 1410, end: 1440 })
})

test('findOverlap uses half-open intervals', () => {
  const bookings = [{ id: 'B1', start: 600, end: 660 }]
  assert.equal(findOverlap(540, 600, bookings), null)
  assert.equal(findOverlap(660, 720, bookings), null)
  assert.equal(findOverlap(659, 700, bookings)?.id, 'B1')
  assert.equal(findOverlap(500, 700, bookings)?.id, 'B1')
})

test('blocked room wins over overlap', () => {
  const r = checkAvailability({ start: 630, end: 690 }, { blocked: true }, [{ id: 'B1', start: 600, end: 660 }])
  assert.equal(r.reasonCode, 'ROOM_BLOCKED')
})

test('every reason code has a message, unknown codes fail loudly', () => {
  for (const code of ['AVAILABLE', 'OVERLAP', 'ROOM_BLOCKED', 'INVALID_START', 'INVALID_DURATION', 'PAST_START', 'ENDS_AFTER_DAY']) {
    assert.ok(messageFor(code, { start: 900, end: 960, booking: { id: 'B1', start: 600, end: 660 }, now: 540 }).length > 10)
  }
  assert.throws(() => messageFor('NOPE', {}))
})

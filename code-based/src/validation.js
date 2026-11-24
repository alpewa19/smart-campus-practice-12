// Input validation layer: turns raw form text into minutes or a reason code. No DOM access.
import { MAX_DURATION, DAY_END } from './data.js'

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/
const WHOLE_NUMBER = /^\d{1,4}$/

/** "HH:MM" -> minutes after midnight, or null. */
export function parseClock(text) {
  if (typeof text !== 'string') return null
  const match = CLOCK.exec(text)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** Whole minutes 1..MAX_DURATION, or null. Accepts a number or a digit-only string. */
export function parseDuration(value) {
  let n
  if (typeof value === 'number') n = value
  else if (typeof value === 'string' && WHOLE_NUMBER.test(value)) n = Number(value)
  else return null
  if (!Number.isInteger(n) || n < 1 || n > MAX_DURATION) return null
  return n
}

/** Applies the input rules in contract order. */
export function validateRequest({ start, duration }, now) {
  const startMin = parseClock(start)
  if (startMin === null) return { ok: false, reasonCode: 'INVALID_START' }
  const minutes = parseDuration(duration)
  if (minutes === null) return { ok: false, reasonCode: 'INVALID_DURATION' }
  if (startMin <= now) return { ok: false, reasonCode: 'PAST_START' }
  const end = startMin + minutes
  if (end > DAY_END) return { ok: false, reasonCode: 'ENDS_AFTER_DAY' }
  return { ok: true, start: startMin, end }
}

// Availability calculation layer: pure functions, never mutates the room or the bookings.
import { validateRequest } from './validation.js'
import { messageFor } from './messages.js'

/** First booking that overlaps [start, end), or null. Half-open: touching ends do not overlap. */
export function findOverlap(start, end, bookings) {
  return bookings.find((b) => start < b.end && b.start < end) ?? null
}

/** Decision for an already valid interval. */
export function checkAvailability({ start, end }, room, bookings) {
  if (room.blocked) return { available: false, reasonCode: 'ROOM_BLOCKED' }
  const booking = findOverlap(start, end, bookings)
  if (booking) return { available: false, reasonCode: 'OVERLAP', booking }
  return { available: true, reasonCode: 'AVAILABLE' }
}

/** Full contract: raw input -> { available, reasonCode, message }. */
export function decide(input, { now, room, bookings }) {
  const valid = validateRequest(input, now)
  if (!valid.ok) {
    return { available: false, reasonCode: valid.reasonCode, message: messageFor(valid.reasonCode, { now }) }
  }
  const result = checkAvailability(valid, room, bookings)
  return {
    available: result.available,
    reasonCode: result.reasonCode,
    message: messageFor(result.reasonCode, { start: valid.start, end: valid.end, booking: result.booking, now }),
  }
}

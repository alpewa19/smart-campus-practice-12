// Presentation text for each reason code. Plain strings only; the UI renders them as text.
export const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

const MESSAGES = {
  AVAILABLE: (d) => `Available: Cedar 101 is free from ${fmt(d.start)} to ${fmt(d.end)}.`,
  OVERLAP: (d) => `Unavailable: the request overlaps booking ${d.booking.id} (${fmt(d.booking.start)}–${fmt(d.booking.end)}).`,
  ROOM_BLOCKED: () => 'Unavailable: Cedar 101 is blocked and cannot be booked.',
  INVALID_START: () => 'Enter the start time as HH:MM (24-hour clock).',
  INVALID_DURATION: () => 'Duration must be a whole number of minutes from 1 to 120.',
  PAST_START: (d) => `Start time must be later than the current time (${fmt(d.now)}).`,
  ENDS_AFTER_DAY: () => 'The booking must end by 24:00 on the same day.',
}

export function messageFor(reasonCode, details) {
  const build = MESSAGES[reasonCode]
  if (!build) throw new Error(`Unknown reason code: ${reasonCode}`)
  return build(details)
}

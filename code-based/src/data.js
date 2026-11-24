// Fictional data for the shared contract. Frozen so that no check can change it (AC5).
export const ROOM = Object.freeze({ name: 'Cedar 101', blocked: false })

// Minutes after midnight, half-open intervals [start, end).
export const BOOKINGS = Object.freeze([
  Object.freeze({ id: 'B1', start: 600, end: 660, label: 'Fictional study group' }),
  Object.freeze({ id: 'B2', start: 780, end: 870, label: 'Fictional robotics club' }),
])

// Demo clock: "now" is fixed at 09:00 so that AC1 is reproducible.
export const DEMO_NOW = 540

export const MAX_DURATION = 120
export const DAY_END = 1440

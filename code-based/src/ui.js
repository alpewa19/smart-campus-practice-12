// UI display layer: reads the form, calls the rule engine, renders text. No booking rules here.
import { decide } from './availability.js'
import { BOOKINGS, ROOM, DEMO_NOW } from './data.js'
import { fmt } from './messages.js'

const $ = (id) => document.getElementById(id)
const form = $('check-form')
const result = $('result')

$('now').textContent = fmt(DEMO_NOW)

for (const b of BOOKINGS) {
  const li = document.createElement('li')
  li.textContent = `${b.id} · ${fmt(b.start)}–${fmt(b.end)} · ${b.label}`
  $('bookings').append(li)
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const decision = decide(
    { start: $('start').value, duration: $('duration').value },
    { now: DEMO_NOW, room: { ...ROOM, blocked: $('blocked').checked }, bookings: BOOKINGS },
  )
  // textContent only: user input and messages are never parsed as HTML.
  $('verdict').textContent = decision.available ? 'Available' : 'Unavailable'
  $('message').textContent = decision.message
  $('code').textContent = decision.reasonCode
  result.dataset.state = decision.available ? 'ok' : 'no'
  result.hidden = false
})

// Editing any input hides the previous decision so a stale result is never shown.
for (const el of [$('start'), $('duration'), $('blocked')]) {
  el.addEventListener('input', () => { result.hidden = true })
}

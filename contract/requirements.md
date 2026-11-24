# Shared requirements and acceptance criteria

Both implementations — the code-based web app and the low-code Node-RED app — are built and tested against this sheet. Neither may change it to suit its platform.

## User story

As a student, I want to choose a start time and a duration for the Cedar 101 study room, so that I can see at once whether the room is free and why.

## Scope

- One fictional room: **Cedar 101**.
- Fictional existing bookings (read-only):

  | ID | Start | End | Label |
  |---|---|---|---|
  | B1 | 10:00 | 11:00 | Fictional study group |
  | B2 | 13:00 | 14:30 | Fictional robotics club |

- A fixed **demo clock: now = 09:00**, so that "future" is reproducible in tests. The UI shows this clock.
- No login, payment, personal data or database. A check never creates, edits or deletes a booking.
- The Practice 11 explanation feature is not part of this practice.

## Inputs

| Input | Type | Rule |
|---|---|---|
| `start` | text `HH:MM`, 24-hour clock | `00:00`–`23:59`, two-digit hour and minute |
| `duration` | whole minutes | 1–120 |
| `blocked` | boolean | `true` means the room is closed for booking |
| `bookings` | list of `{id, start, end}` in minutes after midnight | fictional data above |
| `now` | minutes after midnight | demo clock, 540 (09:00) |

## Outputs

| Output | Type | Meaning |
|---|---|---|
| `available` | boolean | `true` only for `AVAILABLE` |
| `reasonCode` | string | one of the codes below |
| `message` | string | visible text for the student |

| `reasonCode` | `available` | Message |
|---|---|---|
| `AVAILABLE` | true | Available: Cedar 101 is free from {start} to {end}. |
| `OVERLAP` | false | Unavailable: the request overlaps booking {id} ({bookingStart}–{bookingEnd}). |
| `ROOM_BLOCKED` | false | Unavailable: Cedar 101 is blocked and cannot be booked. |
| `INVALID_START` | false | Enter the start time as HH:MM (24-hour clock). |
| `INVALID_DURATION` | false | Duration must be a whole number of minutes from 1 to 120. |
| `PAST_START` | false | Start time must be later than the current time (09:00). |
| `ENDS_AFTER_DAY` | false | The booking must end by 24:00 on the same day. |

Rules are applied in this order; the first failing rule wins:
`INVALID_START` → `INVALID_DURATION` → `PAST_START` → `ENDS_AFTER_DAY` → `ROOM_BLOCKED` → `OVERLAP` → `AVAILABLE`.

Intervals are half-open: `[start, end)`. Two intervals overlap when `a.start < b.end` and `b.start < a.end`, so a request ending exactly when a booking starts (or starting when one ends) is available.

## Acceptance criteria

| ID | Criterion |
|---|---|
| AC1 | Start time must be in the future (later than the demo clock). |
| AC2 | Duration must be greater than zero and at most 120 minutes. |
| AC3 | Overlapping bookings are unavailable. |
| AC4 | Blocked room is unavailable. |
| AC5 | Display a clear decision without changing existing bookings. |
| AC6 | Invalid input receives understandable feedback. |

## Common test inputs

Prepared before either implementation. Machine-readable copy: `contract/test-cases.json`.

| ID | start | duration | blocked | Expected `reasonCode` | Expected `available` | AC |
|---|---|---|---|---|---|---|
| T1 | 15:00 | 60 | false | AVAILABLE | true | AC5 |
| T2 | 10:30 | 60 | false | OVERLAP (B1) | false | AC3 |
| T3 | 15:00 | 60 | true | ROOM_BLOCKED | false | AC4 |
| T4 | 15:00 | 0 | false | INVALID_DURATION | false | AC2, AC6 |
| T5 | 15:00 | 121 | false | INVALID_DURATION | false | AC2, AC6 |
| T6 | 08:00 | 30 | false | PAST_START | false | AC1, AC6 |
| T7 | 11:00 | 120 | false | AVAILABLE (touches B1 end and B2 start) | true | AC3 |
| T8 | run T1–T7 | | | bookings identical to the initial list | — | AC5 |

Extra security inputs (not counted in the eight):

| ID | start | duration | Expected |
|---|---|---|---|
| S1 | `<img src=x onerror=alert(1)>` | 60 | INVALID_START; the text is never executed or rendered as HTML |
| S2 | 15:00 | `60.5` | INVALID_DURATION |
| S3 | 23:30 | 60 | ENDS_AFTER_DAY |
| S4 | (empty) | 60 | INVALID_START |

# Code-based version

Plain HTML, CSS and JavaScript modules. No framework, no build step and no npm dependencies.

| Layer | File | Job |
|---|---|---|
| Data | `src/data.js` | Fictional room, two frozen bookings, demo clock 09:00 |
| Validation | `src/validation.js` | `HH:MM` start, whole-minute duration 1–120, past start, end of day |
| Availability | `src/availability.js` | Blocked room, half-open overlap check, final decision |
| Messages | `src/messages.js` | One visible message per reason code |
| UI display | `src/ui.js`, `index.html`, `style.css` | Reads the form, renders text only, hides a stale result on edit |

## Run

```bash
npm test                 # node --test, 19 tests (contract T1–T8, S1–S4, unit tests)
npm start                # static server on http://127.0.0.1:8012/
```

Any static host works, because the app is three static files plus `src/`. The page sets a Content-Security-Policy that allows only its own scripts and styles.

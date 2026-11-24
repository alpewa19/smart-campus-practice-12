# Smart Campus: code-based vs low-code (Practice Work #12)

The same Cedar 101 room availability checker, built twice against one shared contract:

- `code-based/`: plain HTML, CSS and JavaScript modules, no dependencies, 19 tests.
- `low-code/`: a Node-RED flow with a FlowFuse Dashboard 2.0 page. It has no custom function nodes.

Live demo of the code-based version: https://alpewa19.github.io/smart-campus-practice-12/code-based/

Both versions pass the eight shared tests T1–T8. The full comparison, security review and recommendation are in [`report/Practice12_Report.md`](report/Practice12_Report.md) and in the PDF next to it.

## Layout

| Path | Contents |
|---|---|
| `contract/` | Shared user story, six acceptance criteria, reason codes, test inputs (`test-cases.json`) |
| `code-based/` | Code-based app and tests |
| `low-code/` | `flows.json`, `settings.js`, pinned `package.json` |
| `tools/` | Headless-Chrome test runners for both UIs, API test runner, DAST checks, report builder |
| `evidence/logs/` | Every command output: baseline, red/green, test runs, audits, probes, fix diffs, timings |
| `evidence/screenshots/` | Baseline, every test case for both versions, flow editor, security checks |
| `evidence/ai/` | Prompt and unedited output of the read-only AI review |
| `report/` | Report (Markdown and PDF) |

Logs whose name contains `INVALID` come from runs that hit an old server process. They are kept on purpose and explained in the report, section 10.

## Run

```bash
cd code-based && npm test && npm start      # http://127.0.0.1:8012/
cd low-code && npm ci --ignore-scripts && npm start   # http://127.0.0.1:1880/dashboard/checker
node tools/api-test-lowcode.mjs http://127.0.0.1:1880 /tmp/lowcode-api.json
```

All data is fictional: one room, two bookings and a fixed demo clock (09:00). The app has no login, no database and no personal data. The low-code editor has no login, so keep it on `127.0.0.1`.

AI assistance: Claude Code with Claude Opus 5.5. What it generated and what I verified is described in the report, section 13.

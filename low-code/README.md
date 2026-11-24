# Low-code version (Node-RED + FlowFuse Dashboard 2.0)

The app is a visual flow (`flows.json`) and a dashboard page assembled from widgets. There are no function nodes. Rules live in change and switch nodes with short JSONata expressions. One template has a 3-line Vue helper that formats minutes as `HH:MM`.

## Run locally

```bash
npm ci --ignore-scripts
npm start
```

- Dashboard: http://127.0.0.1:1880/dashboard/checker
- Flow editor: http://127.0.0.1:1880/
- Test endpoints used by the shared test runner: `POST /api/check`, `GET /api/bookings`

The server listens on `127.0.0.1` only. The flow editor has no login (`adminAuth` is not set). Anyone who can reach port 1880 can change the flow, so do not expose it on a network without adding `adminAuth`.

## Versions

`node-red` 5.0.9 and `@flowfuse/node-red-dashboard` 1.36.0 are pinned. `npm audit` reports 43 advisories (6 high) in the Node-RED 5.0.9 dependency tree. The fix is in 5.0.10, which was released one week before this practice; it has not been applied yet. See the security section of the report.

## Not implemented / platform limits

- The dashboard form does not emit events while the user types. After a check, editing a field leaves the old result on screen until the next submit.
- No public live demo: hosting this flow needs a server (FlowFuse Cloud or a VM). The project is exported as `flows.json` instead.

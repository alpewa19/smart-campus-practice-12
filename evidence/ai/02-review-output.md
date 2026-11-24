# Read-only reviewer output (verbatim)

Unedited text returned by the Explore subagent. My evaluation of each finding is in the report, section 10.

---

## Code-based vs low-code review: Cedar 101 availability checker

I read every requested file, the test tools and the evidence logs. I changed nothing and ran nothing. Paths are relative to `practice12_lowcode_comparison/`.

### 1. Findings

**R1. Low-code · security · high.** The Node-RED editor and admin API have no login, and they share the same root path (`/`) as the app.
- Evidence (seen): `low-code/settings.js` has no `adminAuth`, and lines 8–9 set both roots to `/`. `evidence/logs/20-lowcode-dast-probes.log:28-31` shows `GET /flows` and `GET /settings` returning HTTP 200. The 127.0.0.1 binding is confirmed at line 37. Whether a local caller can *write* flows (for example deploy an `exec` node) has not been tested; that part is a hypothesis.
- How to verify: `curl -s http://127.0.0.1:1880/auth/login` returns `{}` when no login is configured. Then, on a throwaway copy only, `POST /flows` and check whether `flows.json` changes.

**R2. Low-code · security · high.** The installed packages have 43 known vulnerabilities, 6 of them high. A fix that is not a major version (node-red 5.0.10) is available but was not applied.
- Evidence (seen): `evidence/logs/11-lowcode-npm-audit.json` metadata, `evidence/logs/10-lowcode-install.log:5`, and `low-code/package.json:10` pinning 5.0.9. One of the high items is a body-parser denial-of-service (GHSA-27r3-jxmh-p828), and body-parser is the library that parses requests to `/api/check`. Nobody checked whether the flaws are actually reachable.
- How to verify: bump to 5.0.10, run `npm audit --json`, then re-run `tools/api-test-lowcode.mjs` and `tools/ui-test-lowcode.mjs`.

**R3. Both · correctness/security · medium.** The two versions treat a non-boolean `blocked` value differently. Low-code fails open; code-based fails closed.
- Evidence (seen, low-code): `"blocked":"true"` returns AVAILABLE (`20-lowcode-dast-probes.log:22-23`). The cause is the strict check `payload.blocked = true` in `flows.json:181,273`.
- Evidence (hypothesis, code-based): `src/availability.js:12` uses a truthy check, so `"false"` would be treated as blocked.
- How to verify: `node -e "import('./src/availability.js').then(m=>console.log(m.checkAvailability({start:900,end:960},{blocked:'false'},[])))"` from `code-based/`. For low-code, repeat the curl probe.

**R4. Low-code · correctness · medium.** The rule engine may report AVAILABLE if a request arrives before the data has loaded.
- Evidence (hypothesis, not verified): the room data is loaded by an inject node 0.2 s after start-up (`flows.json:28`). Before that, `startMin <= $flowContext("now")` (line 449) compares against an unset value. The switch node treats an unset overlap as "no overlap" (`node_modules/@node-red/nodes/core/function/10-switch.js:33`), so the request would fall through to AVAILABLE.
- How to verify: restart Node-RED and, inside the first 200 ms, send `curl` requests in a loop with `start=10:30`. Any AVAILABLE response confirms the race.

**R5. Low-code · correctness (AC5) · medium.** Bookings are read-only only by convention.
- Evidence (seen): the bookings sit in mutable flow context. The only guard is the comment "read-only after start-up" (`flows.json:13`). The code-based version freezes the data (`src/data.js:2-8`) and its tests assert that (`tests/contract.test.js:36-37`). T8 only compares bookings before and after one test run.
- How to verify: add a change node that writes `flow.bookings`, deploy it, then call `GET /api/bookings`. Combined with R1, no login is needed to do this.

**R6. Low-code · security · medium.** The fix for results leaking between users works, but it depends on two settings that are easy to miss.
- Evidence (seen): before the fix, client B saw client A's result (`15-dast-shared-result-before.log:4`); after it, B saw nothing (`17-…-after.log:4`). The fix is three flags in `16-lowcode-fix1.diff`. The test covered only 2 clients and no page reload.
- How to verify: re-run `tools/dast-shared-result.mjs` after every flow change, and add a case where B reloads after A submits.

**R7. Low-code · security/portability · low.** Hiding stack traces depends on how the server is started.
- Evidence (seen): before the fix, a malformed request returned a full stack trace with absolute paths (`20-…-probes.log:14`). The fix is `NODE_ENV=production` in the npm script (`21-lowcode-fix2.diff`), which now returns "Bad Request" (`22-…log:9`). Starting `node-red` directly still leaks the trace. The `VAR=value command` syntax is POSIX-only and fails in Windows cmd. The error body is HTML, not JSON.
- How to verify: start with `npx node-red --settings ./settings.js --userDir .` and repeat the `{bad json` probe; separately, run `npm start` on Windows.

**R8. Low-code · correctness of the evidence · medium.** The low-code UI test could pass on a stale result, and the dashboard keeps an old result after the user edits the inputs.
- Evidence (seen): `tools/ui-test-lowcode.mjs` saves `__lastMsg` and `__lastCode` but never compares them, and it waits a fixed 900 ms. T5 follows T4 with the same expected code, so an unchanged card would still "pass" T5. The API test passes T5 independently (`13-…run1.log:5`), so this weakens the UI evidence, not the logic. The code-based UI hides the result on every input (`src/ui.js:33-35`).
- How to verify: in the dashboard, change Start without submitting and take a screenshot. Also make the test fail when the message is the same as `__lastMsg`.

**R9. Low-code · maintainability/portability · medium.** The rules live as JSONata strings spread across about 15 nodes, and their order is set by switch-node wiring. They can only be tested through a running Node-RED.
- Evidence (seen): the message builder's final `else` returns the ENDS_AFTER_DAY text for any unknown code (`flows.json:707`). The code-based version throws instead (`src/messages.js:16`) and has a test for that (`tests/units.test.js:52`).
- How to verify: route a new reason code into `chg_build` and observe the misleading message.

**R10. Code-based · security · low.** There is no real hosting setup.
- Evidence (hypothesis, not verified): `python3 -m http.server` (`code-based/package.json:9`) sends no security headers and lists folders such as `/tests/`. The CSP is set only in a meta tag (`index.html:6`), which cannot carry `frame-ancestors`. All rules run in the browser.
- How to verify: `curl -I http://127.0.0.1:8012/` and `curl http://127.0.0.1:8012/tests/`.

### 2. Unsupported assumptions

- **"Bound to localhost, so safe."** The binding limits network exposure. It does not stop other local users or processes, or browser DNS-rebinding attacks (R1).
- **"12/12 passes in both, so they are equivalent."** The shared cases do not cover type confusion (R3), start-up timing (R4), several clients (R6) or stale UI state (R8).
- **"T8 proves bookings never change."** It covers only one test run (R5).
- **"`credentialSecret: false`, nothing to encrypt"** (`settings.js:7`). This holds only until someone adds a credentialed node. The log already warns "Using unencrypted credentials".
- **"No dependencies means no supply-chain risk."** Mostly true for the code-based version, but it relies on python3 and on the browser, and nobody checked those.
- **Audit counts as risk.** The 43/6 figures were not checked for reachability. The 200 KB probe was accepted, and the default body limit is 5 MB (`21-httpin.js:306`). No probe checked denial of service.
- **`timing.csv` as cost.** Code-based took 1m41s and low-code 3m59s, but both were built by an agent, timing stops before the security fixes, and hosting, upgrades and training are not counted. The 373 packages and 234 MB of `node_modules` are a recurring maintenance cost that the timing leaves out.
- **Fixed demo clock.** Neither version's real-time behaviour was tested.

### 3. Verdict

Both implementations meet the shared contract on the evidence provided: 12/12 at the unit, UI and API level, and those passes held after both low-code fixes. They are not equally trustworthy, though. The code-based version keeps its rules in small pure functions, freezes its data, fails closed on bad input, has no dependencies, and can be tested without a runtime. Its weak point is hosting, which has not been built out. The low-code version reached the same behaviour, but its security depends on settings that are easy to get wrong and were not caught by the shared tests. A results leak between users and stack-trace disclosure were found only by DAST probes. The editor and admin API still have no login, 6 high-severity dependency vulnerabilities remain unpatched, the blocked check fails open on a wrong type, and immutability is a comment rather than enforced. Being low-code did not make it secure: it widened the attack surface, and the fixes are platform-specific. I'd prefer the code-based version for correctness, maintainability and portability. The low-code version should not move beyond a single-user local demo until R1–R5 are verified and closed.

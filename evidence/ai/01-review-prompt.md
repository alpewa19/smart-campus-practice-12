# Prompt given to the read-only reviewer

Tool: Claude Code, built-in `Explore` subagent (read-only: it can read files and run read-only searches; it has no edit or write tools). Model: Claude Opus 5.5.

```text
You are a read-only reviewer. Do not modify any file. Working folder: practice12_lowcode_comparison

Prompt (from the course slide, use as your brief):
"Compare these code-based and low-code implementations against the same requirements and test evidence. Assess correctness, maintainability, portability, cost, and security. Identify unsupported assumptions. For each risk, provide the observable evidence needed to verify it. Do not treat a platform as secure merely because it is low-code."

Inputs to read:
- contract/requirements.md and contract/test-cases.json (shared requirements, 6 acceptance criteria, T1–T8, S1–S4)
- code-based/ (index.html, style.css, src/*.js, tests/*.js, package.json) — plain ES modules, no dependencies
- low-code/flows.json, low-code/settings.js, low-code/package.json (Node-RED 5.0.9 + @flowfuse/node-red-dashboard 1.36.0). Ignore low-code/node_modules except to confirm a specific claim.
- evidence/logs/*.log and *.json (test runs, npm audit, DAST probes, diffs of two fixes already applied)

Report format (plain markdown, max ~900 words):
1. Up to 10 findings. For each: ID (R1..), implementation (code-based / low-code / both), category (correctness, security, maintainability, portability, cost), severity (high/medium/low), the claim, file:line or log file evidence you actually saw, and "how to verify" (a concrete command or observable check). Mark each finding as "seen in evidence" or "hypothesis, not verified".
2. Unsupported assumptions you notice in the evidence or design.
3. Your one-paragraph comparison verdict.
Do not invent test results. If something cannot be verified from files, say so.
```

The review ran after fixes D1 and D2 and before fix D4. Its line numbers refer to that state of the files.

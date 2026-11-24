// Minimal headless-Chrome driver over the DevTools protocol (no npm packages).
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launch(port = 9333) {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'p12-chrome-'))
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank',
  ], { stdio: 'ignore' })
  let targets
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break } catch { await sleep(200) }
  }
  const pageTarget = targets.find((t) => t.type === 'page')
  const socket = new WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((res, rej) => { socket.onopen = res; socket.onerror = rej })
  let id = 0
  const pending = new Map()
  const consoleLog = []
  socket.onmessage = ({ data }) => {
    const m = JSON.parse(data)
    if (m.method === 'Runtime.consoleAPICalled') consoleLog.push(m.params.args.map((a) => a.value).join(' '))
    if (m.method === 'Page.javascriptDialogOpening') consoleLog.push(`DIALOG: ${m.params.message}`)
    if (!m.id || !pending.has(m.id)) return
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? reject(new Error(m.error.message)) : resolve(m.result)
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id
    pending.set(n, { resolve, reject })
    socket.send(JSON.stringify({ id: n, method, params }))
  })
  await send('Page.enable')
  await send('Runtime.enable')

  const api = {
    consoleLog,
    async viewport(width, height, mobile = false) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
    },
    async open(url, settleMs = 800) {
      await send('Page.navigate', { url })
      await sleep(settleMs)
      for (let i = 0; i < 50; i++) {
        if (await api.eval('document.readyState') === 'complete') break
        await sleep(100)
      }
      await sleep(settleMs)
    },
    async eval(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
      return r.result.value
    },
    async waitFor(expression, timeoutMs = 8000) {
      const end = Date.now() + timeoutMs
      while (Date.now() < end) {
        if (await api.eval(expression)) return true
        await sleep(100)
      }
      throw new Error(`Timed out waiting for: ${expression}`)
    },
    async shot(file, fullPage = true) {
      let clip
      if (fullPage) {
        const { cssContentSize } = await send('Page.getLayoutMetrics')
        clip = { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 }
      }
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: fullPage, ...(clip ? { clip } : {}) })
      await fs.writeFile(file, Buffer.from(data, 'base64'))
    },
    sleep,
    async close() { socket.close(); proc.kill(); await sleep(300); await fs.rm(profile, { recursive: true, force: true }) },
  }
  return api
}

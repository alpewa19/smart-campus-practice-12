// DAST check: does a decision made by client A appear on client B's dashboard?
import { launch } from './browser.mjs'
const [base, shotFile] = process.argv.slice(2)
const url = `${base}/dashboard/checker`
const a = await launch(9341)
const bClient = await launch(9342)
for (const c of [a, bClient]) { await c.viewport(1100, 760); await c.open(url, 2500) }
const resultOf = (c) => c.eval(`document.querySelector('.result .message')?.textContent ?? '(no result shown)'`)
console.log('B before A submits:', await resultOf(bClient))
await a.eval(`(() => { const [s, d] = document.querySelectorAll('input[type=text]'); const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }; set(s, '16:45'); set(d, '15'); document.querySelector('button[type=submit]').click() })()`)
await a.sleep(1200)
console.log('A after its own submit:', await resultOf(a))
const leaked = await resultOf(bClient)
console.log('B after A submits:', leaked)
console.log('B typed nothing; shared result visible to B =', leaked.includes('16:45'))
if (shotFile) await bClient.shot(shotFile, false)
await a.close(); await bClient.close()

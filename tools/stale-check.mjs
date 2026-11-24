// After a check, edit the start field without submitting. Is the old decision still shown?
import { launch } from './browser.mjs'
const b = await launch(9344)
await b.viewport(1100, 760)
const set = `const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }`
await b.open('http://127.0.0.1:8012/')
await b.eval(`(() => { ${set}; set(document.getElementById('start'), '15:00'); set(document.getElementById('duration'), '60'); document.querySelector('#check-form button').click(); set(document.getElementById('start'), '10:30') })()`)
await b.sleep(200)
console.log('code-based: result visible after edit =', await b.eval(`!document.getElementById('result').hidden`))
await b.open('http://127.0.0.1:1880/dashboard/checker', 2500)
await b.eval(`(() => { ${set}; const [s, d] = document.querySelectorAll('input[type=text]'); set(s, '15:00'); set(d, '60'); document.querySelector('button[type=submit]').click() })()`)
await b.sleep(900)
await b.eval(`(() => { ${set}; set(document.querySelectorAll('input[type=text]')[0], '10:30') })()`)
await b.sleep(500)
console.log('low-code: result visible after edit =', await b.eval(`!!document.querySelector('.result')`), '| shown text:', await b.eval(`document.querySelector('.result .message')?.textContent`))
await b.shot(process.argv[2], false)
await b.close()

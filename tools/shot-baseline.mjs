import { launch } from './browser.mjs'
const out = process.argv[2]
const b = await launch()
await b.viewport(1280, 900)
await b.open('http://127.0.0.1:4173/')
await b.eval(`(() => {
  const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }
  set('#start-input', '660'); set('#end-input', '720'); set('#now-input', '540')
  document.querySelector('#check-btn').click()
})()`)
await b.sleep(300)
console.log('result:', await b.eval(`document.querySelector('#result').innerText`))
await b.shot(out)
await b.close()

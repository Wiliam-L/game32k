// Diagnóstico: ¿avanza el bucle en headless? muestrea G.t, pila, monstruos y errores.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const chrome = path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe');
const dir = path.join(path.resolve('.'), 'shots');
mkdirSync(dir, { recursive: true });
const file = 'file:///' + path.join(dir, 'diag.html').replace(/\\/g, '/');
writeFileSync(path.join(dir, 'diag.html'), readFileSync('index.html', 'utf8'), 'utf8');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--mute-audio',
  '--window-size=1440,900', '--remote-debugging-port=9335', '--hide-scrollbars', file
], { stdio: 'ignore' });

const send = (ws, id, method, params) => new Promise((resolve, reject) => {
  const onMsg = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id === id) { ws.removeEventListener('message', onMsg); resolve(msg.result || {}); }
  };
  ws.addEventListener('message', onMsg);
  ws.send(JSON.stringify({ id, method, params }));
  setTimeout(() => reject(new Error('timeout ' + method)), 10000);
});

try {
  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(300);
    try {
      const list = await (await fetch('http://127.0.0.1:9335/json/list')).json();
      target = list.find(t => t.type === 'page' && t.url.includes('diag.html'));
    } catch (e) { }
  }
  if (!target) throw new Error('page target not found');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let id = 1;
  const ev = (expression) => send(ws, id++, 'Runtime.evaluate', { expression, returnByValue: true });

  await ev('window.__err=[];addEventListener("error",e=>__err.push(String(e.message||e.error)))');
  await ev('window.dispatchEvent(new KeyboardEvent("keydown",{code:"Space",key:"Space",bubbles:true}))');
  await sleep(400);
  await ev('window.__AQ.q.drop(0)');
  await sleep(400);
  await ev('window.__AQ.q.drop(0)');
  for (let s = 0; s < 22; s++) {
    await sleep(2000);
    const r = await ev('JSON.stringify({ts:window.__AQ.ts(),st:window.__AQ.q.st(),co:window.__AQ.q.co(),mn:window.__AQ.q.m.length,scene:window.__AQ.s(),err:(window.__err||[]).slice(-2)})');
    console.log((s * 2 + 4) + 's:', JSON.stringify(r));
  }
  ws.close();
} catch (e) {
  console.log('CDP FAILED:', e.message);
  process.exitCode = 1;
} finally {
  proc.kill();
}

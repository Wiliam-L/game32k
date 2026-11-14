// CDP-driven capture: real wall-clock frames, starts game, drops rings on both
// pillars, waits for catch animation, then screenshots. Verifies stack render.
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const chrome = path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe');
const dir = path.join(path.resolve('.'), 'shots');
mkdirSync(dir, { recursive: true });
const file = 'file:///' + path.join(dir, 'stack.html').replace(/\\/g, '/');

import { readFileSync } from 'node:fs';
writeFileSync(path.join(dir, 'stack.html'), readFileSync('index.html', 'utf8'), 'utf8');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--mute-audio',
  '--window-size=1440,900', '--remote-debugging-port=9333', '--hide-scrollbars', file
], { stdio: 'ignore' });

const send = (ws, id, method, params) => new Promise((resolve, reject) => {
  const onMsg = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id === id) { ws.removeEventListener('message', onMsg); resolve(msg.result || {}); }
  };
  ws.addEventListener('message', onMsg);
  ws.send(JSON.stringify({ id, method, params }));
  setTimeout(() => reject(new Error('timeout ' + method)), 8000);
});

try {
  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(300);
    try {
      const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
      target = list.find(t => t.type === 'page' && t.url.includes('stack.html'));
    } catch (e) { }
  }
  if (!target) throw new Error('page target not found');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let id = 1;
  const ev = (expression) => send(ws, id++, 'Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });

  await ev('window.__AQ && window.__AQ.s()');
  await ev('window.dispatchEvent(new KeyboardEvent("keydown",{code:"Space",key:"Space",bubbles:true}))');
  await sleep(400);
  for (let i = 0; i < 16; i++) {
    await ev(`window.__AQ.q.drop(${i % 2})`);
    await sleep(320);
  }
  await sleep(1800);
  const st = await ev('window.__AQ.q.st()');
  console.log('stack total:', JSON.stringify(st));
  const shot = await send(ws, id++, 'Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(dir, 'desktop-stack.png'), Buffer.from(shot.data, 'base64'));
  console.log('stack shot saved');
  ws.close();
} catch (e) {
  console.log('CDP FAILED:', e.message);
  process.exitCode = 1;
} finally {
  proc.kill();
}

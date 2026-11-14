// CDP capture for the aquarium game: real wall-clock frames (no virtual time),
// so heavy canvas scenes can't stall Chrome's screenshot path.
// usage: node tools/aqshot.mjs [menu|menuhard|hardrun|hardwave5|play|wave5|help]
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const mode = process.argv[2] || 'menu';
const base = mode.replace('zoom', '');
const chrome = path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe');
const dir = path.join(path.resolve('.'), 'shots');
mkdirSync(dir, { recursive: true });
const file = 'file:///' + path.join(dir, 'aq.html').replace(/\\/g, '/');
writeFileSync(path.join(dir, 'aq.html'), readFileSync('index.html', 'utf8'), 'utf8');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 9400 + (mode.length % 40);
const profile = path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode', 'aq-' + mode);
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--mute-audio', '--disable-extensions',
  '--no-first-run', '--user-data-dir=' + profile,
  '--window-size=1440,900', '--remote-debugging-port=' + port, '--hide-scrollbars', file
], { stdio: 'ignore' });

const send = (ws, id, method, params) => new Promise((resolve, reject) => {
  const onMsg = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id === id) { ws.removeEventListener('message', onMsg); resolve(msg.result || {}); }
  };
  ws.addEventListener('message', onMsg);
  ws.send(JSON.stringify({ id, method, params }));
  setTimeout(() => reject(new Error('timeout ' + method)), 20000);
});

try {
  let target = null;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    try {
      const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      target = list.find(t => t.type === 'page' && t.url.includes('aq.html'));
    } catch (e) { }
  }
  if (!target) throw new Error('page target not found');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let id = 1;
  const ev = async expr => {
    const r = await send(ws, id++, 'Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result && r.result.value;
  };
  const key = (type, code) => ev(`window.dispatchEvent(new KeyboardEvent(${JSON.stringify(type)},{code:${JSON.stringify(code)},key:${JSON.stringify(code)},bubbles:true}))`);
  await ev('window.__AQ && window.__AQ.s()');

  if (base === 'menuhard' || base === 'hardrun' || base === 'hardwave5') {
    await ev('window.__AQ && window.__AQ.s()');
    await key('keydown', 'KeyD'); await key('keyup', 'KeyD');
    await sleep(350);
    if (base === 'hardrun' || base === 'hardwave5') {
      await key('keydown', 'Space'); await key('keyup', 'Space');
      for (let i = 0; i < 50; i++) { if ((await ev('__AQ.s()')) === 'play') break; await sleep(150); }
      await sleep(1000);
    }
  } else if (base !== 'menu') {
    for (let i = 0; i < 50; i++) { if (await ev('!!window.__AQ')) break; await sleep(200); }
    await key('keydown', 'Space'); await key('keyup', 'Space');
    await sleep(700);
  }
  const wave = (base === 'wave5' || base === 'hardwave5') ? 5 : 1;
  if (wave > 1) {
    await ev('window.__AQ.q.rr.length = 0');
    await ev(`window.__AQ.sw(${wave})`);
    await ev('window.__AQ.q.m.length = 0');
    await sleep(600);
  }
  if (base === 'play') {
    for (let i = 0; i < 5; i++) {
      await key('keydown', 'KeyA'); await sleep(220); await key('keyup', 'KeyA'); await sleep(380);
      await key('keydown', 'KeyD'); await sleep(220); await key('keyup', 'KeyD'); await sleep(380);
    }
  }
  await sleep(500);
  const state = await ev('JSON.stringify({scene:__AQ.s(),wave:__AQ.wv(),rings:__AQ.n(),volc:__AQ.q.v.length,posts:__AQ.q.p.length,px:__AQ.xs()})');
  console.log(mode, state);
  const params = { format: 'png' };
  if (mode.endsWith('zoom')) params.clip = { x: 180, y: 430, width: 420, height: 360, scale: 2 };
  const shot = await send(ws, id++, 'Page.captureScreenshot', params);
  writeFileSync(path.join(dir, 'aq-' + mode + '.png'), Buffer.from(shot.data, 'base64'));
  console.log('saved shots/aq-' + mode + '.png');
  ws.close();
} catch (e) {
  console.log('CDP FAILED:', e.message);
  process.exitCode = 1;
} finally {
  proc.kill();
}

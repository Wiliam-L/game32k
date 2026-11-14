// CDP capture: crab reaching the stack and CHUPANDO time.
// Strategy: keep pillar 0 stocked with exactly 2 rings (below the 3-ring coil
// threshold) by topping up after puffer rams; detect a bite via st() dropping,
// then screenshot the beam + HUD chomp flash. Crab spawn timing is real-time.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const chrome = path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe');
const dir = path.join(path.resolve('.'), 'shots');
mkdirSync(dir, { recursive: true });
const file = 'file:///' + path.join(dir, 'crab.html').replace(/\\/g, '/');
writeFileSync(path.join(dir, 'crab.html'), readFileSync('index.html', 'utf8'), 'utf8');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--mute-audio',
  '--window-size=1440,900', '--remote-debugging-port=9334', '--hide-scrollbars', file
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
      const list = await (await fetch('http://127.0.0.1:9334/json/list')).json();
      target = list.find(t => t.type === 'page' && t.url.includes('crab.html'));
    } catch (e) { }
  }
  if (!target) throw new Error('page target not found');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let id = 1;
  const ev = (expression) => send(ws, id++, 'Runtime.evaluate', { expression, returnByValue: true });
  const stOf = r => (r.result && typeof r.result.value === 'number') ? r.result.value : -1;

  await ev('window.dispatchEvent(new KeyboardEvent("keydown",{code:"Space",key:"Space",bubbles:true}))');
  await sleep(400);
  await ev('window.__AQ.q.drop(0)');
  await sleep(300);
  await ev('window.__AQ.q.drop(0)');

  let prev = 2, bitten = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 120000 && !bitten) {
    await sleep(250);
    const cur = stOf(await ev('window.__AQ.q.st()'));
    if (cur < 0) continue;
    if (cur < prev) {
      if (prev - cur === 1) { bitten = true; console.log('crab bite detected: stack', prev, '->', cur, 'at', ((Date.now() - t0) / 1000).toFixed(1) + 's'); break; }
      console.log('embestida (' + prev + ' -> ' + cur + '), reponiendo anillos...');
      prev = cur;
      continue; // fue globo/tiburón/bomba, no el cangrejo
    }
    prev = cur;
    if (cur < 2) await ev('window.__AQ.q.drop(0)'); // reabastece tras la embestida del globo
  }
  if (!bitten) throw new Error('no bite detected within 120s');
  await sleep(150); // la animación de chorro se dibuja cada frame en mode eat
  const shot = await send(ws, id++, 'Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(dir, 'crab-eat.png'), Buffer.from(shot.data, 'base64'));
  console.log('crab eat shot saved');
  ws.close();
} catch (e) {
  console.log('CDP FAILED:', e.message);
  process.exitCode = 1;
} finally {
  proc.kill();
}

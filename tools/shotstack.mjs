// One-off: like shot.mjs but stacks rings on both pillars to verify the stack render.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const chrome = path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe');
const html = readFileSync('index.html', 'utf8');
const dir = path.join(path.resolve('.'), 'shots');
mkdirSync(dir, { recursive: true });

const boot = `<script>
(() => {
  const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  setTimeout(() => key('keydown', 'Space'), 80);
  let i = 0;
  setTimeout(() => { const t = setInterval(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', key: 'KeyD', bubbles: true })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD', key: 'KeyD', bubbles: true })), 60); }, 170); setTimeout(() => clearInterval(t), 4200); }, 300);
  setTimeout(() => { const t = setInterval(() => { try { window.__AQ.q.drop(i % 2); i++; } catch (e) {} }, 260); setTimeout(() => clearInterval(t), 4200); }, 400);
})();
</script>`;

const game = path.join(dir, 'stack.html');
writeFileSync(game, html.replace('</body>', boot + '</body>'), 'utf8');
const png = path.join(dir, 'desktop-stack.png');
const r = spawnSync(chrome, [
  '--headless=new', '--disable-gpu', '--disable-extensions', '--no-sandbox',
  '--hide-scrollbars', '--no-first-run', '--mute-audio',
  '--allow-file-access-from-files', '--force-device-scale-factor=1',
  '--window-size=1440,900', '--virtual-time-budget=6000',
  '--screenshot=' + png, 'file:///' + game.replace(/\\/g, '/')
], { encoding: 'utf8', timeout: 60000 });
if (r.status !== 0) { console.log((r.stderr || '').split('\n').slice(-3).join('\n')); }
console.log(r.status === 0 ? 'stack shot ok' : 'FAILED', png);

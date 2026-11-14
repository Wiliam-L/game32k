import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const chrome = path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe');
const html = readFileSync('index.html', 'utf8');
const dir = path.join(path.resolve('.'), 'shots');
mkdirSync(dir, { recursive: true });

const boot = mode => `<script>
(() => {
  const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  const tap = (code, at, hold = 240) => {
    setTimeout(() => key('keydown', code), at);
    setTimeout(() => key('keyup', code), at + hold);
  };
  if (${mode === 'play' || mode === 'tilt'}) {
    setTimeout(() => key('keydown', 'Space'), 80);        // empezar
    setTimeout(() => key('keydown', 'Space'), 500);       // cerrar controles
    setTimeout(() => key('keydown', 'ArrowLeft'), 800);
    setTimeout(() => key('keyup', 'ArrowLeft'), 1600);
    setTimeout(() => key('keydown', 'ArrowRight'), 1900);
    setTimeout(() => key('keyup', 'ArrowRight'), 2600);
    setTimeout(() => key('keydown', 'ArrowLeft'), 2900);
    setTimeout(() => key('keyup', 'ArrowLeft'), 3600);
    setTimeout(() => key('keydown', 'ArrowRight'), 3900);
    setTimeout(() => key('keyup', 'ArrowRight'), 4600);
  }
})();
</script>`;

const run = (file, png, w, h, budget, tag) => {
  const r = spawnSync(chrome, [
    '--headless=new', '--disable-gpu', '--disable-extensions', '--no-sandbox',
    '--user-data-dir=' + path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode', 'chrome-aq'),
    '--hide-scrollbars', '--no-first-run', '--mute-audio',
    '--allow-file-access-from-files', '--force-device-scale-factor=1',
    '--window-size=' + w + ',' + h, '--virtual-time-budget=' + budget,
    '--screenshot=' + png, 'file:///' + file.replace(/\\/g, '/')
  ], { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0) console.log((r.stderr || '').split('\n').slice(-3).join('\n'));
  return r.status === 0;
};

const targets = [
  ['desktop', 'menu', 1440, 900],
  ['desktop', 'play', 1440, 900],
  ['desktop', 'tilt', 1440, 900],
  ['short', 'play', 1366, 638],
  ['phone', 'menu', 390, 844],
  ['phone', 'play', 390, 844]
];

let only = process.argv[2];
for (const [label, mode, vw, vh] of targets) {
  if (only && only !== label + '-' + mode && only !== label) continue;
  const game = path.join(dir, 'game.html');
  writeFileSync(game, html.replace('</body>', boot(mode) + '</body>'), 'utf8');
  const png = path.join(dir, label + '-' + mode + '.png');
  const ok = run(game, png, vw, vh, mode === 'play' || mode === 'tilt' ? 6000 : 2500);
  console.log(label + '-' + mode, ok ? 'ok' : 'FAILED', png);
}

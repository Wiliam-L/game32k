import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error('no inline script');
// Guard: index.html debe ser nuestro build (no un artefacto stale/otro)
if (!html.includes('PUNTOS|OLEADA') || html.includes('P/ESC·R')) {
  throw new Error('index.html no es nuestro build — reconstruye con: node tools/build.mjs');
}
const code = match[1];

let drawCalls = 0, texts = [];
class Grad { addColorStop() { } }
const ctxBase = {
  createLinearGradient: () => new Grad(),
  createRadialGradient: () => new Grad(),
  measureText: () => ({ width: 10 }),
  fillText: s => { texts.push(s); },
  fill: () => { drawCalls++; },
  stroke: () => { drawCalls++; },
  fillRect: () => { drawCalls++; },
  clearRect: () => { drawCalls++; }
};
const ctx = new Proxy(ctxBase, {
  get(t, p) { if (p in t) return t[p]; return () => { }; },
  set(t, p, v) { t[p] = v; return true; }
});

class El {
  constructor(id) {
    this.id = id; this.width = 1200; this.height = 760;
    this.style = {}; this._h = {};
    this.clientWidth = this.width; this.clientHeight = this.height;
    this.parentElement = { style: {} };
  }
  addEventListener(t, f) { (this._h[t] ||= []).push(f); }
  getContext() { return ctx; }
  getBoundingClientRect() { return { left: 0, top: 0, right: this.width, bottom: this.height, width: this.width, height: this.height }; }
  fire(t, ev = {}) { ev.preventDefault ||= () => { }; ev.stopPropagation ||= () => { }; for (const f of this._h[t] || []) f(ev); }
}
const canvas = new El('c');
const els = new Map([['c', canvas]]);
const document = {
  hidden: false,
  getElementById: id => { if (!els.has(id)) els.set(id, new El(id)); return els.get(id); },
  addEventListener() { }, createElement: () => new El('x')
};
class Param { setValueAtTime() { } linearRampToValueAtTime() { } exponentialRampToValueAtTime() { } setTargetAtTime() { } cancelScheduledValues() { } }
class Node { constructor() { this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); this.detune = new Param(); this.threshold = new Param(); this.ratio = new Param(); this.delayTime = new Param(); } connect() { } start() { } stop() { } }
class AC {
  constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = 'running'; this.destination = new Node(); lastAC = this; }
  createGain() { return new Node(); } createOscillator() { oscCount++; return new Node(); }
  createBiquadFilter() { return new Node(); } createDelay() { return new Node(); }
  createDynamicsCompressor() { return new Node(); } createBufferSource() { return new Node(); }
  createBuffer(c, l) { return { getChannelData: () => new Float32Array(l) }; }
  resume() { }
}
let lastAC = null, raf = null, now = 0, oscCount = 0;
const winH = {};
const sandbox = {
  console, Math, Date, Float32Array, Uint8ClampedArray, AudioContext: AC, performance: { now: () => now },
  document, navigator: { getGamepads: () => [] },
  localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = '' + v; } },
  innerWidth: 1440, innerHeight: 900,
  addEventListener(t, f) { (winH[t] ||= []).push(f); },
  requestAnimationFrame(f) { raf = f; },
  setTimeout(f) { f(); return 1; }, clearTimeout() { }, setInterval() { return 1; }, clearInterval() { }
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'index.html' });

const frame = (ms = 16.7) => {
  const f = raf; if (!f) throw new Error('loop stopped');
  raf = null; now += ms;
  f(now);
  if (lastAC) lastAC.currentTime += ms / 1000;
};
const key = (t, k, c = k) => {
  const ev = { key: k, code: c, repeat: false, preventDefault() { }, stopPropagation() { } };
  for (const f of winH[t] || []) f(ev);
};
const AQ = sandbox.__AQ;
if (!AQ) throw new Error('debug hook missing');

frame();
if (AQ.s() !== 'menu') throw new Error('expected menu, got ' + AQ.s());
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 5; i++) frame();
if (AQ.s() !== 'play') throw new Error('space did not start: ' + AQ.s());
if (!texts.some(t => /CONTROLES/.test(t))) throw new Error('controls window never drawn on start');
if (oscCount < 4) throw new Error('audio engine never scheduled notes: ' + oscCount);
console.log('  audio oscillators scheduled:', oscCount);
// cerrar la ventana de controles con cualquier tecla
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 3; i++) frame();
const helpTexts = texts.length;
for (let i = 0; i < 20; i++) frame();
if (texts.length > helpTexts && texts.slice(helpTexts).some(t => /CONTROLES/.test(t)))
  throw new Error('controls window did not close on key');
console.log('  controls window ok (abre al empezar, cierra con tecla)');

// controls for ~12 seconds
let maxM = 0;
for (let i = 0; i < 720; i++) {
  if (i % 120 === 0) { key('keydown', 'ArrowLeft', 'ArrowLeft'); }
  if (i % 120 === 60) { key('keyup', 'ArrowLeft', 'ArrowLeft'); key('keydown', 'ArrowRight', 'ArrowRight'); }
  if (i % 120 === 100) { key('keyup', 'ArrowRight', 'ArrowRight'); }
  if (i % 70 === 10) { key('keydown', 'a', 'KeyA'); }
  if (i % 70 === 45) { key('keyup', 'a', 'KeyA'); key('keydown', 'd', 'KeyD'); }
  if (i % 70 === 60) { key('keyup', 'd', 'KeyD'); }
  frame();
  maxM = Math.max(maxM, AQ.q.m.length);
}
if (oscCount < 30) throw new Error('music sequencer stalled: ' + oscCount);
console.log('  audio loop alive, oscillators:', oscCount);
if (AQ.n() === 0 && AQ.sc() === 0) throw new Error('no rings ever spawned/scored');
key('keydown', 'ArrowLeft', 'ArrowLeft');
for (let i = 0; i < 30; i++) frame();
if (AQ.ti() > -.5) throw new Error('arrow-left tilt not applied: ' + AQ.ti());
key('keyup', 'ArrowLeft', 'ArrowLeft');
for (let i = 0; i < 20; i++) frame();
console.log('  tilt ok:', AQ.ti().toFixed(3), 'scene:', AQ.s(), 'wave:', AQ.wv());
const score1 = AQ.sc();

const ts0 = AQ.ts(), sc0 = AQ.sc();
let drops = 0;
for (let k = 0; k < 30 && AQ.ts() < ts0 + 10; k++) {
  AQ.q.m.length = 0; 
  AQ.q.v.length = 0; 
  if (!AQ.q.drop(k % 2)) { for (let i = 0; i < 90; i++) frame(); continue; }
  for (let i = 0; i < 45; i++) frame();
  drops++;
}
if (AQ.ts() < ts0 + 10) throw new Error('stacking failed: ' + AQ.ts() + ' after ' + drops + ' drops');
if (AQ.sc() <= sc0) throw new Error('stacking did not score');
if (!texts.some(t => /PROTECTOR/.test(t))) throw new Error('protector banner missing');
console.log('  stacking ok, rings stacked:', AQ.ts(), 'coils:', AQ.q.co());

for (let i = 0; i < 1100; i++) { frame(); maxM = Math.max(maxM, AQ.q.m.length); }
if (!texts.some(t => /PELIGRO|¡TIBURÓN!|¡CANGREJO|¡PEZ GLOBO!/.test(t))) throw new Error('monster warning never drawn');
if (!maxM && !texts.some(t => /ZAP/.test(t))) throw new Error('no monster ever appeared');
const zaps = texts.filter(t => /¡ZAP!/.test(t)), globos = texts.filter(t => /¡GLOBO!/.test(t));
if (!zaps.length) throw new Error('no tesla kills seen');
if (!zaps.every(t => /\+[0-2]s$/.test(t))) throw new Error('zap reward outside 0-2s: ' + zaps.find(t => !/\+[0-2]s$/.test(t)));
if (globos.length && !globos.every(t => /\+[0-2]s$/.test(t))) throw new Error('globo reward outside 0-2s');
console.log('  zaps drawn:', zaps.length, '| recompensas 0-2s ok | globos:', globos.length);
const cnt = re => texts.filter(t => re.test(t)).length;
console.log('  crab steals:', cnt(/ROBADO/), 'time-suck ticks:', cnt(/-1s/),
  'puffer banners:', cnt(/PEZ GLOBO/), 'puffer rams:', cnt(/GLOBO!/), 'rings returned:', cnt(/DE VUELTA/));

// fin de partida determinista (el equilibrio del reloj lo juzga el jugador)
AQ.tm(.01);
for (let i = 0; i < 10 && AQ.s() === 'play'; i++) frame();
if (AQ.s() !== 'over') throw new Error('game never ended');
if (AQ.s() === 'over') {
  key('keydown', 'r', 'KeyR'); key('keyup', 'r', 'KeyR');
  for (let i = 0; i < 5; i++) frame();
  if (AQ.s() !== 'play') throw new Error('restart failed: ' + AQ.s());
}

key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 3; i++) frame();
key('keydown', 'p', 'KeyP');
for (let i = 0; i < 3; i++) frame();
if (!AQ.p()) throw new Error('pause failed');
if (!texts.some(t => /PAUSA/.test(t))) throw new Error('pause panel never drawn');
key('keydown', 'p', 'KeyP');
for (let i = 0; i < 3; i++) frame();
if (AQ.p()) throw new Error('unpause failed');
sandbox.innerWidth = 390; sandbox.innerHeight = 844;
for (const f of winH.resize || []) f();
for (let i = 0; i < 30; i++) frame();
canvas.fire('pointerdown', { clientX: 50, clientY: 400 });
for (let i = 0; i < 30; i++) frame();
canvas.fire('pointerup', {});
for (let i = 0; i < 30; i++) frame();
canvas.fire('pointerdown', { clientX: 300, clientY: 400 });
for (let i = 0; i < 30; i++) frame();
canvas.fire('pointerup', {});
for (let i = 0; i < 30; i++) frame();
canvas.fire('pointerdown', { clientX: 100, clientY: 300 });
canvas.fire('pointermove', { clientX: 160, clientY: 200 });
canvas.fire('pointerup', {});

if (drawCalls < 1000) throw new Error('renderer did not run: ' + drawCalls);
if (!texts.some(t => /OLEADA/.test(t))) throw new Error('HUD text missing');
console.log('SMOKE OK');
console.log('  score before fast-forward:', score1);
console.log('  final scene:', AQ.s(), 'score:', AQ.sc(), 'wave:', AQ.wv());
console.log('  draw calls:', drawCalls, 'text draws:', texts.length);

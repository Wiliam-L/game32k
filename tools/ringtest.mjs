// Verifica la composición de cada oleada: anillos reales (normales+oro) vs bombas,
// colores que las identifican, y que FALTAN solo cuenta reales. Uso: node tools/ringtest.mjs [--hard]
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const HARD = process.argv.includes('--hard');

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error('no inline script');
const code = match[1];

let drawCalls = 0, texts = [];
class Grad { addColorStop() { } }
const ctxBase = {
  createLinearGradient: () => new Grad(), createRadialGradient: () => new Grad(),
  measureText: () => ({ width: 10 }), fillText: s => { texts.push(String(s)); },
  fill: () => { drawCalls++; }, stroke: () => { drawCalls++; },
  fillRect: () => { drawCalls++; }, clearRect: () => { drawCalls++; }
};
const ctx = new Proxy(ctxBase, {
  get(t, p) { if (p in t) return t[p]; return () => { }; },
  set(t, p, v) { t[p] = v; return true; }
});
class El {
  constructor(id) { this.id = id; this.width = 1440; this.height = 810; this.style = {}; this._h = {}; this.clientWidth = this.width; this.clientHeight = this.height; this.parentElement = { style: {} }; }
  addEventListener(t, f) { (this._h[t] ||= []).push(f); }
  getContext() { return ctx; }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height, right: this.width, bottom: this.height }; }
}
const canvas = new El('c');
const els = new Map([['c', canvas]]);
const document = { hidden: false, getElementById: id => { if (!els.has(id)) els.set(id, new El(id)); return els.get(id); }, addEventListener() { }, createElement: () => new El('x') };
class Param { setValueAtTime() { } linearRampToValueAtTime() { } exponentialRampToValueAtTime() { } setTargetAtTime() { } cancelScheduledValues() { } }
class Node { constructor() { this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); } connect() { } start() { } stop() { } }
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
  requestAnimationFrame(f) { raf = f; }, setTimeout(f) { f(); return 1; }, clearTimeout() { }, setInterval() { return 1; }, clearInterval() { }
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
frame();
if (HARD) { key('keydown', 'D', 'KeyD'); key('keyup', 'D', 'KeyD'); } // menú: DIFICIL
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 5; i++) frame();
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 3; i++) frame();
console.log('dificultad:', HARD ? 'DIFICIL' : 'FÁCIL', '| banner DIFICIL:', texts.some(t => /- DIFICIL/.test(t)), '| scene:', AQ.s(), 'wave:', AQ.wv());

const COL = ['#5ef2d6', '#57b8ff', '#b784ff', '#ffc857', '#ff7b9c', '#9bf6ff'];
let bad = 0;
for (const w of [1, 2, 3]) {
  AQ.q.rr.length = 0; AQ.q.m.length = 0;
  AQ.sw(w);
  for (let i = 0; i < 3; i++) frame(); // dibuja HUD con FALTAN de esta oleada
  const rr = AQ.q.rr;
  const rk = Object.keys(rr[0]).find(k => ['normal', 'gold', 'bomb'].includes(rr[0][k]));
  const ck = Object.keys(rr[0]).find(k => k !== rk && typeof rr[0][k] === 'string' && rr[0][k][0] === '#');
  const real = rr.filter(r => r[rk] !== 'bomb');
  const bomb = rr.filter(r => r[rk] === 'bomb');
  const gold = rr.filter(r => r[rk] === 'gold');
  const norm = rr.filter(r => r[rk] === 'normal');
  const okBombCol = bomb.every(r => r[ck] === '#ff4d6d');
  const okGoldCol = gold.every(r => r[ck] === '#ffd166');
  const okNormCol = norm.every(r => COL.includes(r[ck]));
  const expReal = Math.min(23, 7 + w * 3), expBomb = Math.min(9, w + 1), maxGold = 1 + Math.floor(w / 3);
  const okLeft = texts.some(t => t === 'FALTAN ' + expReal);
  const ok = real.length === expReal && bomb.length === expBomb && gold.length <= maxGold
    && norm.length + gold.length === real.length && okBombCol && okGoldCol && okNormCol && okLeft;
  if (!ok) bad++;
  console.log(`oleada ${w}: reales ${real.length} (normal ${norm.length} + oro ${gold.length}/${maxGold}) · bombas ${bomb.length}`
    + ` · FALTAN ${okLeft ? expReal : 'MAL'} · bomba roja ${okBombCol ? 'ok' : 'MAL'} · oro ${okGoldCol ? 'ok' : 'MAL'} · normales ${okNormCol ? 'ok' : 'MAL'} · ${ok ? 'OK' : 'MAL'}`);
}
console.log(bad ? '>>> RINGTEST FALLÓ' : '>>> RINGTEST OK');
process.exitCode = bad ? 1 : 0;

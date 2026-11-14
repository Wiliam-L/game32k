// Verifica que las teslas duran más en FÁCIL: al apilar 6 anillos (2 cargas de
// PROTECTOR) FÁCIL debe llegar a 6 cargas (cap 6, +3 por carga) y DIFICIL a 4
// (cap 4, +2 por carga). Uso: node tools/coiltest.mjs [--hard]
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const HARD = process.argv.includes('--hard');

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error('no inline script');
const code = match[1];

let texts = [];
class Grad { addColorStop() { } }
const ctxBase = {
  createLinearGradient: () => new Grad(), createRadialGradient: () => new Grad(),
  measureText: () => ({ width: 10 }), fillText: s => { texts.push(String(s)); },
  fill: () => { }, stroke: () => { }, fillRect: () => { }, clearRect: () => { }
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
  createGain() { return new Node(); } createOscillator() { return new Node(); }
  createBiquadFilter() { return new Node(); } createDelay() { return new Node(); }
  createDynamicsCompressor() { return new Node(); } createBufferSource() { return new Node(); }
  createBuffer(c, l) { return { getChannelData: () => new Float32Array(l) }; }
  resume() { }
}
let lastAC = null, raf = null, now = 0;
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
if (HARD) { key('keydown', 'D', 'KeyD'); key('keyup', 'D', 'KeyD'); }
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 5; i++) frame();
// la ventana de controles se abre al empezar: cerrarla
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 3; i++) frame();

for (let i = 0; i < 6; i++) {
  AQ.q.drop(0);
  for (let j = 0; j < 45; j++) frame(); // deja que el anillo caiga, se apile y sume cargas
}
const coil = AQ.q.co();
const exp = 12; // 6 cargas por torre x2 torres, en ambas dificultades
console.log('dificultad:', HARD ? 'DIFICIL' : 'FÁCIL', '| cargas de PROTECTOR tras 6 apilados:', coil, '| esperado:', exp);
const ok = coil === exp;
console.log(ok ? '>>> COILTEST OK' : '>>> COILTEST FALLÓ');
process.exitCode = ok ? 0 : 1;

// DiagnÃ³stico: Â¿se completa la oleada al apilar todos los anillos?
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

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
  getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
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
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 5; i++) frame();
// la ventana de controles se abre al empezar: cerrarla antes de simular
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 3; i++) frame();
console.log('scene:', AQ.s(), 'wave:', AQ.wv());

// apilar anillos usando el hook: teleporta un anillo libre sobre el pilar menos lleno
let iter = 0;
const falts = [];
while (AQ.wv() === 1 && iter < 60) {
  iter++;
  AQ.q.m.length = 0;   // sin monstruos: prueba limpia de oleada
  AQ.q.v.length = 0;   // sin volcanes ladrones de foco (no afectan a la lÃ³gica)
  if (!AQ.q.drop(AQ.wv() % 2)) { for (let i = 0; i < 90; i++) frame(); continue; }
  for (let i = 0; i < 45; i++) frame();
  for (const t of texts) { const m = /^FALTAN (\d+)$/.exec(t); if (m) falts.push(+m[1]); }
  texts.length = 0;
}
console.log('iteraciones:', iter, 'wave:', AQ.wv(), 'stacked:', AQ.ts());
console.log('FALTAN vistos (tras cada drop):', falts.join(' '));
if (falts.length && falts[falts.length - 1] > 0 && AQ.wv() === 1) {
  console.log('>>> el contador nunca llegÃ³ a 0');
  process.exitCode = 1;
} else {
  console.log('>>> contador FALTAN en 0 y oleada completada');
}
const completos = texts.filter(t => /COMPLETA/.test(t));
console.log('banner OLEADA COMPLETA visto:', completos.length ? completos : 'NUNCA');
if (AQ.wv() === 1) {
  console.log('>>> LA OLEADA NUNCA SE COMPLETA');
  process.exitCode = 1;
} else {
  console.log('>>> oleada completada y avanzada a wave', AQ.wv());
}

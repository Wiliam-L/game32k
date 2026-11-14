// Verifica en DIFICIL: (a) los impulsos A/D de los volcanes funcionan en oleada 1
// (se gasta un jet y el anillo sale disparado), y (b) el cangrejo huye del estallido.
// Uso: node tools/volctest.mjs
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

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
key('keydown', 'D', 'KeyD'); key('keyup', 'D', 'KeyD'); // menú: DIFICIL
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space');
for (let i = 0; i < 5; i++) frame();
key('keydown', ' ', 'Space'); key('keyup', ' ', 'Space'); // cierra ventana de controles
for (let i = 0; i < 3; i++) frame();

let bad = 0;
const esHard = texts.some(t => /- DIFICIL/.test(t));
console.log('dificultad: DIFICIL | banner:', esHard ? 'ok' : 'MAL', '| scene:', AQ.s(), 'wave:', AQ.wv());
if (!esHard) bad++;

// --- (a) impulso A en DIFICIL oleada 1 ---
const jets0 = AQ.jp();
const vp = AQ.q.vp(0);
console.log('volcán 0 en:', vp, '| jets antes:', jets0);
const placed = AQ.rt(vp[0] + 70, vp[1] - 70); // anillo libre junto al volcán
key('keydown', 'A', 'KeyA');
for (let i = 0; i < 12; i++) frame(); // carga ~0.2s
key('keyup', 'A', 'KeyA');
for (let i = 0; i < 4; i++) frame(); // erupción + física
const rg = AQ.rg();
const jets1 = AQ.jp();
console.log('jets después:', jets1, '| anillo vx/vy:', rg && rg[2].toFixed(1), rg && rg[3].toFixed(1));
if (!placed || jets0 !== 3 || jets1 !== 2 || !rg || !(rg[3] < -200)) { bad++; console.log('MAL: impulso no funciona en DIFICIL'); }
else console.log('impulso A/D en DIFICIL: ok');

// --- (b) el cangrejo huye del estallido ---
// apilar 4 anillos: el pilar queda con pila no vacía y el cangrejo camina
// (pilares vacíos al nacer → huye solo y el test no verificaría nada)
for (let i = 0; i < 4; i++) { AQ.q.drop(0); for (let j = 0; j < 45; j++) frame(); }

let crab = null, tries = 0;
while (!crab && tries++ < 1500) { // ~25s: avisa 1.5s + camina
  frame();
  for (const m of AQ.q.m) {
    const vals = Object.values(m);
    if (vals.includes('crab') && !vals.includes('dead')) { crab = m; break; }
  }
}
console.log('cangrejo apareció en', tries, 'frames');
if (!crab) { bad++; console.log('MAL: no apareció cangrejo'); }
else {
  // sniff robusto: x = clave numérica con mayor Δ en un frame (walk ≈1.3 px/f);
  // y = la otra clave numérica >100 (y ≈0.17 px/f, ph < 6.3, dir ±1)
  const snap = { ...crab };
  frame();
  const xk = Object.keys(crab).filter(k => typeof crab[k] === 'number').sort((a, b) => Math.abs(crab[b] - snap[b]) - Math.abs(crab[a] - snap[a]))[0];
  const yk = Object.keys(crab).find(k => typeof crab[k] === 'number' && k !== xk && crab[k] > 100);
  const mk = Object.keys(crab).find(k => ['walk', 'climb', 'eat', 'flee', 'dead'].includes(crab[k]));
  const before = crab[mk];
  console.log('sniff · mode:', mk, '=', before, '· x:', xk, '· y:', yk || 'NO HALLADA');
  if (!xk || !yk) { bad++; console.log('MAL: no pude identificar x/y del cangrejo'); }
  else {
    const dist0 = Math.hypot(crab[xk] - vp[0], crab[yk] - (vp[1] - 22));
    crab[xk] = vp[0] + 20; crab[yk] = vp[1] - 40; // junto al volcán 0
    console.log('teletransportado · dist al volcán antes:', dist0.toFixed(0));
    key('keydown', 'A', 'KeyA');
    for (let i = 0; i < 45; i++) frame(); // carga completa ~0.75s
    key('keyup', 'A', 'KeyA');
    for (let i = 0; i < 4; i++) frame();
    const after = crab[mk];
    console.log('cangrejo modo antes/después:', before, '→', after, '| jets ahora:', AQ.jp());
    if (before === 'flee') { bad++; console.log('MAL: el cangrejo ya huía antes del impulso (test vacuo)'); }
    else if (after !== 'flee') { bad++; console.log('MAL: el cangrejo no huye del impulso'); }
    else console.log('cangrejo asustado por el impulso: ok');
  }
}
// --- (c) oleadas 2 y 5: los impulsos siguen activos en TODAS las oleadas ---
for (const wv of [2, 5]) {
  AQ.sw(wv);
  for (let i = 0; i < 3; i++) frame();
  const ja = AQ.jp();
  AQ.rt(vp[0] + 70, vp[1] - 70);
  key('keydown', 'A', 'KeyA');
  for (let i = 0; i < 12; i++) frame(); // carga corta
  key('keyup', 'A', 'KeyA');
  for (let i = 0; i < 4; i++) frame();
  const jb = AQ.jp(), rg2 = AQ.rg();
  console.log('oleada ' + wv + ': jets antes/después de pulsar A:', ja, '→', jb, '| vy:', rg2 && rg2[3].toFixed(1));
  if (ja !== 3 || jb !== 2 || !rg2 || !(rg2[3] < -200)) { bad++; console.log('MAL: impulso inactivo en oleada ' + wv); }
  else console.log('impulso activo en oleada ' + wv + ' (' + (esHard ? 'DIFICIL' : 'FÁCIL') + '): ok');
}
console.log(bad ? '>>> VOLCTEST FALLÓ' : '>>> VOLCTEST OK');
process.exitCode = bad ? 1 : 0;

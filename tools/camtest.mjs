// Verifica el rediseño sin cañón: dos pilares siempre, ventana de controles
// solo al empezar/pausa, sin estado de cañón y rampa Fácil -> Difícil en oleada 6.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
if (!html.includes('PUNTOS|OLEADA')) throw new Error('index.html no es nuestro build');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

let texts = [];
class Grad { addColorStop() { } }
const ctxBase = {
  createLinearGradient: () => new Grad(), createRadialGradient: () => new Grad(),
  measureText: () => ({ width: 10 }), fillText: s => { texts.push(String(s)); },
  fill() { }, stroke() { }, fillRect() { }, clearRect() { }
};
const ctx = new Proxy(ctxBase, {
  get(t, p) { if (p in t) return t[p]; return () => { }; },
  set(t, p, v) { t[p] = v; return true; }
});
class El {
  constructor(id) { this.id = id; this.width = 1440; this.height = 810; this.style = {}; this._h = {};
    this.clientWidth = this.width; this.clientHeight = this.height;
    this.parentElement = { style: {} }; }
  addEventListener(t, f) { (this._h[t] ||= []).push(f); }
  getContext() { return ctx; }
  getBoundingClientRect() { return { left: 0, top: 0, right: this.width, bottom: this.height, width: this.width, height: this.height }; }
}
const canvas = new El('c');
const els = new Map([['c', canvas]]);
const document = { hidden: false, getElementById: id => { if (!els.has(id)) els.set(id, new El(id)); return els.get(id); }, addEventListener() { }, createElement: () => new El('x') };
class Param { setValueAtTime() { } linearRampToValueAtTime() { } exponentialRampToValueAtTime() { } setTargetAtTime() { } cancelScheduledValues() { } }
class Node {
  constructor() {
    this.gain = new Param(); this.frequency = new Param(); this.Q = new Param();
    this.threshold = new Param(); this.ratio = new Param(); this.delayTime = new Param();
    this.type = '';
  }
  connect() { } start() { } stop() { }
}
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
  raf = null; now += ms; f(now);
  if (lastAC) lastAC.currentTime += ms / 1000;
};
const key = (t, k, c = k) => {
  const ev = { key: k, code: c, repeat: false, preventDefault() { }, stopPropagation() { } };
  for (const f of winH[t] || []) f(ev);
};
const tap = (k, c = k) => { key('keydown', k, c); key('keyup', k, c); };
const AQ = sandbox.__AQ;

frame();
if ('can' in AQ.G) throw new Error('el estado del cañón sigue existiendo');
if ('canA' in AQ.G) throw new Error('canA sigue existiendo');
tap(' ', 'Space');
for (let i = 0; i < 5; i++) frame();
if (AQ.wv() !== 1) throw new Error('no arrancó en oleada 1');
if (!texts.some(t => /CONTROLES/.test(t))) throw new Error('la ventana de controles no salió al empezar');
if (AQ.xs() !== '288|672') throw new Error('oleada 1 debe tener dos pilares: ' + AQ.xs());
if (AQ.q.v.length !== 2) throw new Error('la oleada 1 debe tener 2 volcanes');
console.log('oleada 1: pilares', AQ.xs(), '| volcanes', AQ.q.v.length, '| controles al empezar ok');

tap(' ', 'Space');
for (let i = 0; i < 4; i++) frame();
const nHelp = texts.length;
for (let i = 0; i < 10; i++) frame();
if (texts.length > nHelp && texts.slice(nHelp).some(t => /CONTROLES/.test(t)))
  throw new Error('la ventana de controles no se cerró');

// A/D: los volcanes lanzan anillos en todas las oleadas, ambas dificultades
const [lx, ly] = AQ.q.vp(0), [rx2, ry2] = AQ.q.vp(1);
if (!AQ.rt(lx + 70, ly - 70)) throw new Error('no hay anillos libres para probar los volcanes');
const j0 = AQ.jp();
key('keydown', 'a', 'KeyA');
for (let i = 0; i < 12; i++) frame();
key('keyup', 'a', 'KeyA');
for (let i = 0; i < 2; i++) frame();
let rr = AQ.rg();
if (AQ.jp() !== j0 - 1) throw new Error('A no gastó un impulso del volcán izquierdo');
if (!(rr[3] < -200 && rr[2] > 100)) throw new Error('A no empujó el anillo (vx=' + rr[2] + ', vy=' + rr[3] + ')');
if (!AQ.rt(rx2 - 70, ry2 - 70)) throw new Error('no quedan anillos libres para D');
key('keydown', 'd', 'KeyD');
for (let i = 0; i < 12; i++) frame();
key('keyup', 'd', 'KeyD');
for (let i = 0; i < 2; i++) frame();
rr = AQ.rg();
if (AQ.jp() !== j0 - 2) throw new Error('D no gastó un impulso del volcán derecho');
if (!(rr[3] < -200 && rr[2] < -100)) throw new Error('D no empujó el anillo (vx=' + rr[2] + ', vy=' + rr[3] + ')');
console.log('volcanes A/D ok: impulsos', j0, '->', AQ.jp(), '| anillo vx', Math.round(rr[2]), 'vy', Math.round(rr[3]));

// el marco completo (no el lienzo) se inclina con ??
key('keydown', 'ArrowRight', 'ArrowRight');
for (let i = 0; i < 14; i++) frame();
const tf = canvas.parentElement.style.transform || '';
key('keyup', 'ArrowRight', 'ArrowRight');
if (!/rotate\([1-9.]/.test(tf)) throw new Error('el marco no se inclinó: ' + tf);
if (!/scale\(0?\.\d+\)/.test(tf)) throw new Error('el marco no redujo escala: ' + tf);
if (canvas.style.transform) throw new Error('el lienzo se rota por dentro; debe hacerlo el marco');
for (let i = 0; i < 30; i++) frame();
console.log('inclinación de marco completo ok:', tf);

// completar oleada 1
let iter = 0;
while (AQ.wv() === 1 && iter < 80) {
  iter++;
  AQ.q.m.length = 0;
  if (!AQ.q.drop(AQ.wv() % 2)) { for (let i = 0; i < 90; i++) frame(); continue; }
  for (let i = 0; i < 45; i++) frame();
}
for (let i = 0; i < 20; i++) frame();
if (AQ.wv() !== 2) throw new Error('no se llegó a la oleada 2');
if (AQ.xs() !== '288|672') throw new Error('oleada 2 debe mantener dos pilares: ' + AQ.xs());
if (AQ.q.v.length !== 2) throw new Error('los volcanes deben seguir en oleada 2');
const tx = texts.length;
for (let i = 0; i < 10; i++) frame();
if (texts.length > tx && texts.slice(tx).some(t => /CONTROLES/.test(t)))
  throw new Error('la ventana de controles no debe reabrirse en oleada 2');
console.log('oleada 2: pilares', AQ.xs(), '| volcanes', AQ.q.v.length, '| sin reapertura de controles');

// en oleadas 2+ los impulsos siguen activos (todas las oleadas, ambas dificultades)
const jw = AQ.jp();
if (!AQ.rt(lx + 70, ly - 70)) throw new Error('no hay anillos libres para probar el impulso en oleada 2');
key('keydown', 'a', 'KeyA');
for (let i = 0; i < 12; i++) frame();
key('keyup', 'a', 'KeyA');
for (let i = 0; i < 4; i++) frame();
if (AQ.jp() !== jw - 1) throw new Error('los volcanes no gastaron un impulso en oleada 2');
console.log('oleada 2: volcán activo ok (impulsos', jw, '->', AQ.jp() + ')');

// W/S/E/F ya no hacen nada
const n0 = AQ.n(), p0 = AQ.xs();
for (const [k, c] of [['w', 'KeyW'], ['s', 'KeyS'], ['e', 'KeyE'], ['f', 'KeyF']]) {
  key('keydown', k, c); for (let i = 0; i < 4; i++) frame(); key('keyup', k, c);
}
if (AQ.n() !== n0 || AQ.xs() !== p0) throw new Error('las teclas del cañón aún alteran el juego');
console.log('teclas W/S/E/F inertes ok | anillos', n0);

// rampa Fácil -> Difícil: no anuncia antes de 6, sí desde 6
for (const w of [5, 6, 50]) {
  AQ.q.rr.length = 0;
  AQ.sw(w);
  for (let i = 0; i < 8; i++) frame();
  if (AQ.wv() !== w) throw new Error('no se generó la oleada ' + w);
  if (AQ.xs() !== '288|672') throw new Error('la oleada ' + w + ' perdió los dos pilares: ' + AQ.xs());
  if (AQ.q.v.length !== 2) throw new Error('la oleada ' + w + ' perdió los volcanes');
  const hard = texts.includes('OLEADA ' + w + ' - DIFICIL');
  if ((w >= 6) !== hard) throw new Error('oleada ' + w + (w >= 6 ? ' no anuncia' : ' sí anuncia') + ' DIFICIL');
  console.log('oleada', w, 'ok: pilares', AQ.xs(), '| anillos', AQ.n(), '| DIFICIL', hard);
}

// pausa dibuja el mismo panel animado
tap('p', 'KeyP');
for (let i = 0; i < 4; i++) frame();
if (!AQ.p()) throw new Error('la pausa no activó');
if (!texts.some(t => /PAUSA|PAUSE/.test(t))) throw new Error('el panel de pausa no se dibujó');
tap('p', 'KeyP');
console.log('>>> SIN CAÑÓN + CONTROLES OK');
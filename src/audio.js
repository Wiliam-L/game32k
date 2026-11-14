import { midi, MX, MN, R } from './config.js';
import { G } from './state.js';

let AC = null, master = null, mBus = null, mGain = null, sfxBus = null, delay = null, send = null;
let musicOn = false, muted = false, step = 0, nextT = 0, noiseBuf = null;
const SI='sine',TR='triangle',SW='sawtooth',SQ='square',HP='highpass',LP='lowpass';
const N=()=>AC.currentTime;

export function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = .8; master.connect(AC.destination);
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5; comp.connect(master);
    sfxBus = AC.createGain(); sfxBus.gain.value = .9; sfxBus.connect(comp);
    mGain = AC.createGain(); mGain.gain.value = 0; mGain.connect(comp);
    mBus = AC.createGain(); mBus.gain.value = .9;
    const lp = AC.createBiquadFilter(); lp.type = LP; lp.frequency.value = 2600; lp.Q.value = .9;
    mBus.connect(lp); lp.connect(mGain);
    delay = AC.createDelay(.8); delay.delayTime.value = .23;
    const fb = AC.createGain(); fb.gain.value = .26; delay.connect(fb); fb.connect(delay);
    send = AC.createGain(); send.gain.value = .42; send.connect(delay); delay.connect(lp);
    AC.resume();
  } catch (e) { AC = null; }
}

function tone(f, t, d, kind, vol, dest = sfxBus, to = 0) {
  if (!AC || !dest) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = kind; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(MX(20, to), t + d);
  g.gain.setValueAtTime(.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + .008);
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + .03);
}

function noise(t, d, vol, kind, f) {
  if (!AC || !sfxBus) return;
  if (!noiseBuf) {
    noiseBuf = AC.createBuffer(1, (AC.sampleRate * .6) | 0, AC.sampleRate);
    const b = noiseBuf.getChannelData(0);
    for (let i = 0; i < b.length; i++) b[i] = R() * 2 - 1;
  }
  const s = AC.createBufferSource(); s.buffer = noiseBuf;
  const flt = AC.createBiquadFilter(); flt.type = kind; flt.frequency.value = f;
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(flt); flt.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + d);
}

const BASS = [40, 0, 40, 43, 40, 0, 38, 40, 40, 0, 40, 43, 45, 43, 41, 40];
const ARP = [64, 65, 67, 71, 76, 71, 67, 65, 64, 65, 67, 71, 74, 71, 67, 65];
const CHORD = [[52, 55, 59], [53, 57, 60], [52, 55, 59], [50, 54, 57]];

function mstep(i, t) {
  const k = MN(6, G.wave - 1) * 2;
  const bass = BASS[i % 16] + k;
  if (bass) tone(midi(bass), t, .34, TR, .3, mBus);
  const arp = ARP[i % 16] + k + (i % 32 > 23 && i % 2 ? 12 : 0);
  if (arp) {
    tone(midi(arp), t, .3, SI, .085, mBus);
    tone(midi(arp), t, .3, SI, .05, send);
  }
  if (i % 8 === 0) {
    const ch = CHORD[(i / 8) % 4 | 0];
    for (const n of ch) tone(midi(n + 12 + k), t, 1.6, TR, .035, mBus);
    tone(58, t, .18, SI, .22, sfxBus, 32);
  }
  if (i % 4 === 2) noise(t, .04, .045, HP, 5200);
  if (i % 8 === 4) tone(midi(84 + (i % 3) * 2 + k), t, .22, SI, .05, send);
}

export function musicTick() {
  if (!AC || !musicOn) return;
  const now = N();
  if (nextT < now - .2) nextT = now + .03;
  while (nextT < now + .18) {
    mstep(step, nextT);
    step = (step + 1) % 32;
    nextT += 60 / 98 / 2;
  }
}

export function musicStart() {
  if (!AC) return;
  if (AC.state === 'suspended') AC.resume();
  musicOn = true; step = 0; nextT = N() + .05;
  mGain.gain.cancelScheduledValues(N());
  mGain.gain.setTargetAtTime(muted ? 0 : .85, N(), .3);
}

export function musicStop() {
  if (!AC) return;
  musicOn = false;
  mGain.gain.setTargetAtTime(0, N(), .2);
}

export function toggleMute() {
  muted = !muted;
  if (AC) mGain.gain.setTargetAtTime(muted ? 0 : (musicOn ? .85 : 0), N(), .15);
  return muted;
}

export const sfx = {
  jet(p = 1) {
    if (!AC) return;
    const t = N();
    noise(t, .35, .18 * p, 'bandpass', 900);
    tone(220, t, .28, SI, .08 * p, sfxBus, 70);
  },
  clink(n = 0) {
    if (!AC) return;
    const t = N(), f = midi(84 + (n % 5) * 2);
    tone(f, t, .16, TR, .11);
    tone(f * 1.5, t, .12, SI, .05);
  },
  perfect() {
    if (!AC) return;
    const t = N();
    [76, 81, 88].forEach((n, i) => tone(midi(n), t + i * .055, .3, TR, .1));
  },
  pop() { if (AC) tone(520, N(), .07, SI, .08, sfxBus, 880); },
  bomb() {
    if (!AC) return;
    const t = N();
    noise(t, .55, .3, LP, 700);
    tone(160, t, .5, SW, .2, sfxBus, 40);
  },
  zap() {
    if (!AC) return;
    const t = N();
    noise(t, .22, .22, HP, 2600);
    tone(1400, t, .25, SQ, .12, sfxBus, 180);
    tone(90, t, .3, SW, .12, sfxBus, 50);
  },
  _monster(f, d, v, to, nd, nv, nf) { if (AC) { tone(f, N(), d, SW, v, sfxBus, to); noise(N(), nd, nv, LP, nf); } },
  crab() { this._monster(90, .5, .14, 55, .35, .1, 500); },
  shark() { this._monster(65, .8, .2, 40, .7, .16, 400); },
  wave() {
    if (!AC) return;
    const t = N();
    [69, 72, 76, 81].forEach((n, i) => tone(midi(n), t + i * .09, .45, TR, .12));
  },
  over() {
    if (!AC) return;
    const t = N();
    [69, 65, 62, 57].forEach((n, i) => tone(midi(n), t + i * .16, .5, TR, .13));
  }
};


import { COL, TAU, rand, pick, A, MN, MX, R, F, RO, cA, cB, cC, cD, cE, cN , PL, SH, CB, FR, BM, PF, DD, OV } from './config.js';
import { sfx } from './audio.js';
export const L = {
  portrait: false, W: 960, H: 686,
  tank: { x: 0, y: 0, w: 960, h: 686 }, sandY: 626,
  volcanoes: []
};
const mkPost = (x, topY, botY, r) => ({ x, topY, botY, r, stack: [], coil: 0, wob: 0 });
export const posts = [mkPost(288, 370, 580, 6), mkPost(672, 370, 580, 6)];
export function layoutPosts() {
  const p = L.portrait;
  const topY = L.tank.y + (p ? 720 : 370), botY = L.sandY - 46, r = p ? 7 : 6;
  posts.length = 0;
  for (const x of p ? [200, 500] : [288, 672]) posts.push(mkPost(x, topY, botY, r));
}
export const rings = [], monsters = [], parts = [], pops = [], bubbles = [];
export const zaps = [], fish = [], weeds = [], corals = [], gravel = [];
export const loot = [];
export const cv = document.getElementById('c');
const T = 'PUNTOS|OLEADA|FALTAN|TIEMPO|TOCA PARA SEGUIR|¡PELIGRO!|EN CAMINO|PAUSA|MAREA MUERTA|¡NUEVO RECORD!|RECORD|ESPACIO/TOCA|PAUSA|MUDO|JUGAR|ESPACIO|FÁCIL|DIFICIL|A/D ELIGE|INCLINA|IDIOMA|TOCA|P/ESC PAUSA - M MUDO|COMPLETA|PERFECTO +|¡BOMBA!|¡BOOM! -3s|IMPULSO|¡ATURDIDO!|¡ROBADO!|¡DE VUELTA!|PROTECTOR|¡ZAP!|¡GLOBO!|CANGREJO|PEZ GLOBO|TIBURON|CONTROLES'.split('|');
export const tr = i => T[i];
export const mn = k => k === CB ? tr(34) : k === SH ? tr(36) : tr(35);

export const G = {
  scene: 'menu', t: 0, score: 0, best: 0, wave: 1, time: 65, maxTime: 65,
  combo: 0, comboT: 0, mult: 1, stacked: 0, stackCount: 0,
  tilt: 0, tiltT: 0, chargeL: 0, chargeR: 0, jets: 3, jetT: 0, kills: [], hard: 0,
  shake: 0, flash: 0, banner: '', bannerT: 0,
  waveDelay: 0, monsterT: 10, warn: 0, warnKind: '', left: 0, pumpT: 5,
  paused: false, muted: false, newBest: false, pufs: 0, diff: 0, help: 0, helpSeen: 0
};

try { G.best = parseInt(localStorage.getItem('aqua_best') || '0') || 0; } catch (e) { }

export function waterY() {
  return L.tank.y + (L.portrait ? 92 : 58);
}
export function spreadVolcanoes() {
  const nv = L.volcanoes.length, spread = L.tank.w * .7, x0 = L.tank.x + L.tank.w * .15;
  L.volcanoes.forEach((v, i) => {
    v.x = nv > 1 ? x0 + i * spread / (nv - 1) : L.tank.x + L.tank.w / 2;
    v.y = L.sandY;
  });
}
export function coilY(p) { return p.topY - 26; }

export function resize() {
  const portrait = innerHeight > innerWidth * 1.05;
  const W = portrait ? 800 : 960, H = portrait ? 1250 : 686;
  L.portrait = portrait; L.W = W; L.H = H;
  L.tank = portrait
    ? { x: 0, y: 0, w: 700, h: 1250 }
    : { x: 0, y: 0, w: 960, h: 686 };
  L.sandY = L.tank.y + L.tank.h - (portrait ? 70 : 60);
  layoutPosts();
  spreadVolcanoes();
  cv.width = W; cv.height = H;
  if (innerWidth >= innerHeight) {
    const s = MN(innerWidth * .75 / W, innerHeight / H);
    cv.style.width = (W * s) + 'px'; cv.style.height = (H * s) + 'px';
  } else { cv.style.width = '100vw'; cv.style.height = '100vh'; }
  buildDecor();
}

export function buildDecor() {
  const t = L.tank;
  gravel.length = 0; weeds.length = 0; corals.length = 0; fish.length = 0; bubbles.length = 0;
  for (let i = 0; i < 110; i++) {
    gravel.push({
      x: rand(t.x + 10, t.x + t.w - 10),
      y: rand(L.sandY + 2, t.y + t.h - 4),
      r: rand(1, 4.2), col: pick(['#d9bd7d', '#b9965c', '#8e6f42', '#f0d79a'])
    });
  }
  for (let i = 0; i < 9; i++) {
    weeds.push({
      x: t.x + 34 + i * (t.w - 68) / 8 + rand(-14, 14),
      h: rand(L.portrait ? 90 : 54, L.portrait ? 230 : 150),
      ph: rand(0, TAU), w: rand(3, 6),
      col: rand(138, 174)
    });
  }
  for (let i = 0; i < 5; i++) {
    corals.push({
      x: t.x + 40 + i * (t.w - 80) / 4 + rand(-20, 20),
      h: rand(30, 78), col: pick([348, 34, 265, 16]) + rand(-6, 6)
    });
  }
  for (let i = 0; i < 9; i++) {
    fish.push({
      x: rand(t.x + 60, t.x + t.w - 60), y: rand(t.y + 130, L.sandY - 40),
      vx: rand(18, 46) * (R() < .5 ? 1 : -1), len: rand(10, 22),
      ph: rand(0, TAU), col: rand(0, 360),
      fin: rand(0, 360)
    });
  }
  for (let i = 0; i < 18; i++) {
    bubbles.push({
      x: rand(t.x + 14, t.x + t.w - 14), y: rand(t.y + 40, L.sandY),
      r: rand(1.2, 4), sp: rand(14, 34), ph: rand(0, TAU)
    });
  }
}
export function banner(text) { G.banner = text; G.bannerT = 2.2; }
export function popup(x, y, text, col, size = 18) { pops.push({ x, y, text, col, size, life: 1 }); }
export function burst(x, y, col, n = 14, pw = 1) {
  for (let i = 0; i < n; i++) parts.push({
    x, y, vx: rand(-170, 170) * pw, vy: rand(-220, 60) * pw,
    r: rand(1.4, 4), col, life: 1
  });
}
const clearPosts = () => posts.forEach(p => { p.stack.length = 0; p.coil = 0; p.wob = 0; });
export function startGame() {
  G.scene = PL; G.score = 0; G.wave = 1;
  G.combo = 0; G.comboT = 0; G.mult = 1; G.stacked = 0;
  G.shake = 0; G.flash = 0; G.bannerT = 0; G.paused = false; G.help = 1; G.helpSeen = 0;
  G.newBest = false; G.pufs = 0;
  G.tilt = 0; G.tiltT = 0;
  G.chargeL = 0; G.chargeR = 0; G.jets = 3; G.jetT = 0;
  rings.length = 0; monsters.length = 0; parts.length = 0; pops.length = 0; zaps.length = 0; loot.length = 0;
  G.kills.length = 0;
  clearPosts();
  startWave(1);
}
export function startWave(n) {
  G.wave = n; G.stackCount = 0; G.waveDelay = 0; G.pumpT = 6;
  G.hard = G.diff || n >= 6;
  const w = G.diff ? n + 4 : n;
  G.time = G.maxTime = MX(30, 62 - w * 2 - MX(0, w - 2) * 2);
  G.monsterT = w === 1 ? 9 : MX(7, 20 - w * 2);
  G.chargeL = 0; G.chargeR = 0; G.jets = 3; G.jetT = 0;
  layoutPosts();
  G.warn = 0;
  monsters.length = 0;
  const nb = MN(9, F(n + 1)), nr = MN(23, 7 + n * 3), N = nr + nb;
  const types = [];
  for (let i = 0; i < nr; i++) types.push('normal');
  for (let i = 0; i < nb; i++) types.push(BM);
  for (let i = 0; i < 1 + F(n / 3); i++) {
    let k = (R() * N) | 0;
    if (types[k] === 'normal') types[k] = 'gold';
  }
  G.left = nr;
  const cols = L.W >= L.H ? 10 : 7, spread = L.tank.w - 80, step = spread / (cols - 1);
  for (let i = 0; i < N; i++) {
    const row = F(i / cols), col = i % cols, kind = types[i];
    rings.push({
      x: MN(L.tank.x + 40 + step * col + (row % 2 ? step / 2 : 0) + rand(-4, 4), L.tank.x + L.tank.w - 44),
      y: L.sandY - 26 - row * 26 + rand(-3, 3), vx: 0, vy: 0, r: 15,
      va: rand(-1.6, 1.6), ang: rand(0, TAU), flat: .52,
      col: kind === BM ? cC : kind === 'gold' ? cA : pick(COL),
      kind, mode: FR, ct: 0, post: null, fuse: 0, perfect: false
    });
  }
  banner(tr(1) + ' ' + n + (G.hard ? ' - ' + tr(17) : ''));
  L.volcanoes.length = 0;
  for (let i = 0; i < 2; i++) L.volcanoes.push({ x: 0, y: L.sandY, t: 0 });
  spreadVolcanoes();
}
export function catchRing(rg, p) {
  if (p.stack.length >= 18) return false;
  rg.mode = 'catch'; rg.ct = 0; rg.post = p;
  rg.sx = rg.x; rg.sy = rg.y;
  rg.tx = p.x; rg.ty = p.botY - 8 - p.stack.length * 11;
  p.stack.push(rg);
  rg.perfect = A(rg.x - p.x) < 5;
  sfx.clink(p.stack.length);
  return true;
}
export function stackDone(rg) {
  rg.mode = 'stacked'; rg.flat = 1; rg.ang = 0;
  rg.kind !== BM && G.left--; G.stacked++; G.stackCount++;
  G.combo++; G.comboT = 4.5;
  G.mult = MN(8, 1 + F(G.combo / 2));
  const pts = RO(((rg.kind === 'gold' ? 500 : 100) + (rg.perfect ? 150 : 0)) * G.mult);
  G.score += pts;
  G.shake = MX(G.shake, 3 + G.mult); G.flash = rg.perfect ? .32 : .1;
  popup(rg.x, rg.y - 30, (rg.perfect ? tr(24) : '+') + pts, rg.perfect ? cN : rg.kind === 'gold' ? '#ffd60a' : '#7cf7d8', rg.perfect ? 21 : 18);
  burst(rg.x, rg.y, rg.perfect ? cN : rg.col, rg.perfect ? 24 : 12, 1.1);
  if (rg.perfect) sfx.perfect(); else sfx.clink(G.combo);
  if (rg.kind === BM) { rg.fuse = 2.4; popup(rg.x, rg.y - 56, tr(25), cC, 20); }
  G.combo % 8 || grantCoil(); 
  if (G.stackCount % 3 === 0) grantCoil();
}
export function freeRing(rg, pushX, pushY) {
  rg.mode = FR; rg.post = null; rg.vx = pushX; rg.vy = pushY;
  rg.va = rand(-3, 3); rg.flat = .3;
  if (rg.kind !== BM) G.left++;
}
export function explode(rg) {
  const p = rg.post;
  if (!p) return;
  const i = p.stack.indexOf(rg);
  if (i >= 0) p.stack.splice(i, 1);
  const j = rings.indexOf(rg);
  if (j >= 0) rings.splice(j, 1);
  const top = p.stack.splice(-2);
  top.forEach((r, k) => freeRing(r, rand(-120, 120), -240 - k * 40));
  p.wob = 1; G.combo = 0; G.mult = 1; G.comboT = 0;
  G.time = MX(0, G.time - 3);
  G.shake = 16; G.flash = .7; sfx.bomb();
  burst(rg.x, rg.y, cC, 42, 1.7); burst(rg.x, rg.y, cA, 20, 1.2);
  popup(rg.x, rg.y - 30, tr(26), cC, 22);
}
export function grantCoil() {
  for (const p of posts) {
    p.coil = 6;
    popup(p.x, p.topY - 56, tr(31) + ' +6', cB, 20);
    burst(p.x, coilY(p), cB, 26, 1.4);
  }
  banner(tr(31) + ' x2');
  sfx.perfect();
}
export function zap(m, p) {
  if (m.mode === DD) return;
  zaps.push({ x1: p.x, y1: coilY(p), x2: m.x, y2: m.y, life: .38 });
  m.mode = DD; m.deadT = .7;
  if (m.kind === PF) G.pufs++;
  G.kills.push(m.kind);
  G.score += 300; G.shake = MX(G.shake, 9); G.flash = .45;
  const g = (R() * 3) | 0;
  G.time = MN(99, G.time + g);
  popup(m.x, m.y - 38, '+300 ' + tr(32) + ' +' + g + 's', cB, 19);
  burst(m.x, m.y, cD, 30, 1.5);
  sfx.zap();
}
export function loseTime(sec, text) {
  G.time = MX(0, G.time - sec);
  G.combo = 0; G.mult = 1; G.comboT = 0;
  popup(L.tank.x + L.tank.w / 2, L.tank.y + 90, text, cE, 22);
}
export function gameOver() {
  if (G.scene !== PL) return;
  G.scene = OV;
  G.newBest = G.score > G.best;
  if (G.newBest) {
    G.best = G.score;
    try { localStorage.setItem('aqua_best', '' + G.score); } catch (e) { }
  }
  sfx.over();
}
export function chooseMonster() {
  return pick(G.wave < 3 ? [CB, CB] : G.wave < 5 ? [CB, CB, SH] : [CB, SH, SH]);
}
export function spawnMonster(kind) {
  const t = L.tank;
  const target = posts.reduce((a, p) => p.stack.length < a.stack.length ? p : a);
  const m = {
    kind, mode: 'walk', x: target.x < t.x + t.w / 2 ? t.x + 24 : t.x + t.w - 24,
    y: L.sandY - 18, dir: 0, ph: rand(0, TAU), post: target,
    eatT: 0, eats: 0, deadT: 0, hit: false, baseY: 0, sp: 1
  };
  m.dir = m.x < target.x ? 1 : -1;
  if (kind === PF || kind === SH) {
    const left = R() < .5;
    m.x = left ? t.x - 60 : t.x + t.w + 60;
    m.dir = left ? 1 : -1;
    m.baseY = waterY() + (kind === SH ? rand(34, 66) : rand(50, 110));
    m.y = m.baseY;
    m.sp = kind === SH ? 290 : 96;
  }
  monsters.push(m);
  banner('¡' + mn(kind) + '!');
  G.shake = MX(G.shake, 10); G.flash = .2;
  if (kind === SH) sfx.shark(); else sfx.crab();
}
export function waveClear() {
  const bonus = 500 * G.wave + RO(G.time * 10);
  G.score += bonus;
  G.waveDelay = .45;
  banner(tr(1) + ' ' + G.wave + ' ' + tr(23) + ' +' + bonus);
  sfx.wave();
  clearPosts();
  rings.length = 0; monsters.length = 0; G.left = 0; loot.length = 0;
  G.monsterT = 999; G.warn = 0;
}
export function togglePause() {
  if (G.scene !== PL) return;
  G.paused = !G.paused;
}



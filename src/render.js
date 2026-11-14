import { TAU, clamp, PI, S, C, R, cA, cB, cC, cD, cE, cF, cH, cI, cJ, cK, cM, cN , PL, CB, BM, PF, DD, OV } from './config.js';
import { G, L, posts, rings, monsters, parts, pops, bubbles, zaps, fish, weeds, corals, gravel, waterY, coilY, tr, mn, cv } from './state.js';

let X = cv.getContext('2d'), DH = 0;

function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  X.beginPath();
  X.moveTo(x + r, y);
  X.arcTo(x + w, y, x + w, y + h, r);
  X.arcTo(x + w, y + h, x, y + h, r);
  X.arcTo(x, y + h, x, y, r);
  X.arcTo(x, y, x + w, y, r);
  X.closePath();
}
function fr(x, y, w, h, r, col) { rr(x, y, w, h, r); X.fillStyle = col; X.fill(); }
function frb(x, y, w, h, r, f, s, lw = 1.5) {
  fr(x, y, w, h, r, f); X.strokeStyle = s; X.lineWidth = lw; rr(x, y, w, h, r); X.stroke();
}
function d(x, y, r, col) { X.beginPath(); X.arc(x, y, r, 0, TAU); X.fillStyle = col; X.fill(); }
function el(x, y, rx, ry, col, rot = 0) { X.beginPath(); X.ellipse(x, y, rx, ry, rot, 0, TAU); X.fillStyle = col; X.fill(); }
function ln(x1, y1, x2, y2, col, w = 1) {
  X.strokeStyle = col; X.lineWidth = w;
  X.beginPath(); X.moveTo(x1, y1); X.lineTo(x2, y2); X.stroke();
}
function txt(s, x, y, size, col, align = 'center') {
  X.font = 'bold ' + size + 'px monospace';
  X.textAlign = align; X.textBaseline = 'middle';
  X.fillStyle = '#001018'; X.fillText(s, x + 2, y + 2);
  X.shadowColor = col; X.shadowBlur = 8;
  X.fillStyle = col; X.fillText(s, x, y);
  X.shadowBlur = 0;
}
function glowDisc(x, y, r, a, b) {
  X.save(); X.globalCompositeOperation = 'lighter';
  const g = X.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, a); g.addColorStop(.55, b); g.addColorStop(1, 'rgba(0,0,0,0)');
  X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fill();
  X.restore();
}
// color de decoración que gira con la oleada (h = tono base, guardado como número)
const hs = (h, s, l) => 'hsl(' + h + ',' + s + '%,' + l + '%)';

export function draw() {
  X.setTransform(1, 0, 0, 1, 0, 0);
  X.clearRect(0, 0, L.W, L.H);
  const bg = X.createRadialGradient(L.W / 2, L.H * .35, 60, L.W / 2, L.H * .55, L.W * .82);
  bg.addColorStop(0, '#0b2536'); bg.addColorStop(.55, '#05101a'); bg.addColorStop(1, '#02060a');
  X.fillStyle = bg; X.fillRect(0, 0, L.W, L.H);
  // el marco completo (marco + HUD) se inclina como una sola pieza
  const tf = G.scene === PL ? G.tilt : 0;
  cv.parentElement.style.transform =
    'rotate(' + (tf * 5) + 'deg) scale(' + (1 - Math.abs(tf) * (L.portrait ? .11 : .01)) + ')';
  drawTank();
  drawHUD();
  if (G.scene === 'menu') drawMenu();
  if (G.scene === OV) drawOver();
  if (G.paused && G.scene === PL) drawPause();
  if (G.help && G.scene === PL && !G.paused) drawHelp();
  else if (G.helpSeen && G.scene === PL && !G.paused) {
    d(L.W - 28, L.H - 30, 16, 'rgba(3,16,25,.85)');
    txt('!', L.W - 28, L.H - 29, 19, cB);
  }
}

function drawTank() {
  const t = L.tank;
  const bg = X.createLinearGradient(0, t.y, 0, t.y + t.h);
  X.filter = 'hue-rotate(' + (G.wave - 1) * 42 + 'deg)';
  bg.addColorStop(0, '#0d4f6a'); bg.addColorStop(.5, '#08364a'); bg.addColorStop(1, '#03121c');
  X.fillStyle = bg; X.fillRect(t.x, t.y, t.w, t.h);
  // rayos de luz: 6 haces con vaivén, ancho variable y brillo pulsado
  X.save(); X.globalCompositeOperation = 'lighter';
  const lg = X.createLinearGradient(0, t.y, 0, L.sandY);
  lg.addColorStop(0, 'rgba(150,240,255,.20)'); lg.addColorStop(1, 'rgba(150,240,255,0)');
  X.fillStyle = lg;
  for (let i = 0; i < 6; i++) {
    const x = t.x + t.w * (.08 + i * .17) + S(G.t * .22 + i * 1.7) * 26, w = 10 + i % 3 * 7;
    X.globalAlpha = .45 + S(G.t * .5 + i * 2.3) * .25;
    X.beginPath(); X.moveTo(x - w, t.y); X.lineTo(x + w, t.y);
    X.lineTo(x + w * 3.4, L.sandY); X.lineTo(x - w * 2.6, L.sandY); X.fill();
  }
  // motas de polvo a la deriva dentro de los haces
  X.globalAlpha = .12; X.fillStyle = '#cfeeff';
  const hh = L.sandY - t.y;
  for (let i = 0; i < 8; i++) d(t.x + (i * 137 + G.t * 9) % t.w, t.y + (i * 89 + hh - G.t * 22 % hh) % hh, 1.3, '#cfeeff');
  X.restore();
  X.filter = 'none';
  DH = (G.wave - 1) * 31;
  drawSand(t); drawWeeds(); drawCorals(); drawFish();
  posts.forEach(drawPost);
  rings.forEach(drawRing);
  const wy = waterY();
  const wg = X.createLinearGradient(0, wy, 0, t.y + t.h);
  wg.addColorStop(0, 'rgba(80,235,225,.09)');
  wg.addColorStop(.45, 'rgba(28,150,190,.16)');
  wg.addColorStop(1, 'rgba(4,60,100,.34)');
  X.fillStyle = wg; X.fillRect(t.x, wy, t.w, t.y + t.h - wy);
  drawSurface(wy, t);
  monsters.forEach(drawMonster);
  posts.forEach(drawCoil);
  drawZaps(); drawBubbles(); drawParts(); drawVolcanoes();
  drawPops();
}

function drawSand(t) {
  X.beginPath();
  X.moveTo(t.x, L.sandY + 20);
  X.bezierCurveTo(t.x + t.w * .22, L.sandY - 24, t.x + t.w * .4, L.sandY + 24, t.x + t.w * .62, L.sandY - 5);
  X.bezierCurveTo(t.x + t.w * .8, L.sandY - 24, t.x + t.w * .92, L.sandY + 10, t.x + t.w, L.sandY + 3);
  X.lineTo(t.x + t.w, t.y + t.h); X.lineTo(t.x, t.y + t.h); X.closePath();
  const g = X.createLinearGradient(0, L.sandY - 20, 0, t.y + t.h);
  g.addColorStop(0, '#d8b878'); g.addColorStop(.35, '#b08b52'); g.addColorStop(1, '#5b4026');
  X.fillStyle = g; X.fill();
  X.globalAlpha = .5;
  gravel.forEach(s => d(s.x, s.y, s.r, s.col));
  X.globalAlpha = 1;
  // caustics: bandas claras onduladas que se deslizan sobre la grava
  X.globalAlpha = .08; X.fillStyle = cB;
  for (let i = 0; i < 3; i++) {
    const y = L.sandY - 4 - i * 12 + S(G.t * .7 + i * 2) * 3;
    X.beginPath(); X.moveTo(t.x, y);
    for (let x = 0; x <= t.w; x += 48) X.lineTo(t.x + x, y + S(x * .05 + G.t * 1.3 + i) * 4);
    X.lineTo(t.x + t.w, L.sandY + 20); X.lineTo(t.x, L.sandY + 20); X.fill();
  }
  X.globalAlpha = 1;
}

function drawWeeds() {
  weeds.forEach(w => {
    X.strokeStyle = hs(w.col + DH, 55, 45); X.lineWidth = w.w; X.lineCap = 'round';
    X.beginPath(); X.moveTo(w.x, L.sandY + 10);
    let px = w.x;
    for (let k = 1; k <= 4; k++) {
      const yy = L.sandY + 10 - w.h * k / 4;
      const xx = w.x + S(G.t * 1.2 + w.ph + k * .7) * w.h * .05 * k;
      X.lineTo(xx, yy);
      if (k > 1) el((xx + px) / 2, yy, 9, 3, w.col, .5 * (k % 2 ? 1 : -1));
      px = xx;
    }
    X.stroke();
  });
}

function drawCorals() {
  corals.forEach(c => {
    X.strokeStyle = hs(c.col + DH, 70, 60); X.lineWidth = 5; X.lineCap = 'round';
    for (let b = -1; b <= 1; b++) {
      const bx = c.x + b * 11;
      X.beginPath(); X.moveTo(bx, L.sandY + 8);
      X.quadraticCurveTo(bx + b * 9, L.sandY - c.h * .55, bx + b * 22, L.sandY - c.h);
      X.stroke();
      d(bx + b * 22, L.sandY - c.h, 5, c.col);
    }
  });
}

function drawFish() {
  fish.forEach(f => {
    const len = f.len, hh = len * .46, wag = S(f.ph) * .3;
    X.save(); X.translate(f.x, f.y); X.scale(f.vx < 0 ? -1 : 1, 1);
    X.globalAlpha = .16; el(0, hh + 8, len * .8, 3, '#000'); X.globalAlpha = 1;
    X.fillStyle = hs(f.fin + DH, 75, 68);
    X.beginPath(); X.moveTo(-len * .6, 0);
    X.quadraticCurveTo(-len * 1.4, -hh + wag * 9, -len * 1.1, 0);
    X.quadraticCurveTo(-len * 1.4, hh + wag * 9, -len * .6, 0); X.fill();
    el(0, 0, len, hh, hs(f.col + DH, 70, 62));
    el(-len * .1, -hh * .82, len * .34, hh * .5, hs(f.fin + DH, 75, 68), .4);
    d(len * .55, -hh * .16, len * .15, '#f2feff');
    d(len * .59, -hh * .16, len * .07, '#04101a');
    X.restore();
  });
}

function drawSurface(wy, t) {
  X.save(); X.globalAlpha = .45;
  X.strokeStyle = cM; X.lineWidth = 2;
  X.beginPath();
  for (let x = t.x; x <= t.x + t.w; x += 10) {
    const y = wy + S(x * .045 + G.t * 1.5) * 4 + S(x * .012 - G.t) * 2;
    x === t.x ? X.moveTo(x, y) : X.lineTo(x, y);
  }
  X.stroke();
  X.globalAlpha = .13; X.strokeStyle = '#7cf7d8'; X.lineWidth = 8; X.stroke();
  X.restore();
}

function drawPost(p) {
  X.save(); X.translate(p.x + S(G.t * 55) * p.wob * 6, 0);
  el(0, p.botY, 12, 5, '#4a2030');
  const g = X.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, '#5a2a3d'); g.addColorStop(.35, '#ff9a6a');
  g.addColorStop(.62, '#d9554d'); g.addColorStop(1, '#4a2030');
  fr(-5, p.topY, 10, p.botY - p.topY, 5, g);
  X.globalAlpha = .35;
  for (let y = p.topY + 34; y < p.botY - 10; y += 58) fr(-6, y, 12, 3, 2, cA);
  X.globalAlpha = 1;
  el(0, p.topY, 8, 4, cA);
  el(-2, p.topY - 1.5, 5, 2.1, '#fff3b0');
  p.stack.forEach((r, i) => drawRingAt(0, p.botY - 8 - i * 11, r.r, r.col, 0, 1, r.kind, r));
  X.restore();
}

function drawRingAt(x, y, r, col, ang, flat, kind, rg) {
  X.save(); X.translate(x, y); X.rotate(ang);
  const sc = rg.q || 1;
  X.scale(sc, (1 - .66 * flat) * sc);
  if (kind === 'gold') { X.shadowColor = cA; X.shadowBlur = 16; }
  d(0, 0, r, col);
  X.shadowBlur = 0;
  X.globalAlpha = .55; d(0, 0, r * .5, '#0a1a26'); X.globalAlpha = 1;
  X.strokeStyle = 'rgba(255,255,255,.6)'; X.lineWidth = 2.2;
  X.beginPath(); X.arc(0, 0, r * .83, PI * 1.02, PI * 1.72); X.stroke();
  if (kind === BM) {
    const fast = rg && rg.fuse > 0 && rg.fuse < 1.2;
    d(0, 0, r * .68, '#210a12');
    if (S(G.t * (fast ? 22 : 8)) > -.2) d(0, 0, r * .46, fast ? '#ffc2c2' : cC);
    d(0, 0, r * .18, '#120609');
  }
  X.restore();
  if (!ang) { X.globalAlpha = .2; el(x, y + 3, r * .9, 3, col); X.globalAlpha = 1; }
}

function drawRing(rg) {
  drawRingAt(rg.x, rg.y, rg.r, rg.col, rg.ang, rg.flat, rg.kind, rg);
}

function drawCoil(p) {
  const x = p.x, y = coilY(p), on = p.coil > 0;
  frb(x - 11, y + 11, 22, 18, 5, '#0d2a36', '#2f7186', 2);
  glowDisc(x, y, on ? 50 : 20, on ? 'rgba(210,255,250,.85)' : 'rgba(60,100,110,.35)',
    on ? 'rgba(94,242,214,.3)' : 'rgba(60,100,110,.08)');
  d(x, y, 8.5, on ? cI : '#375a63');
  d(x, y, 4.6, on ? cB : '#1c3a44');
  if (on) {
    X.strokeStyle = cD; X.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = G.t * 5 + i * 2.1;
      X.beginPath();
      X.moveTo(x + C(a) * 9, y + S(a) * 9);
      X.lineTo(x + C(a + .5) * 18, y + S(a + .5) * 18);
      X.lineTo(x + C(a + .2) * 26, y + S(a + .2) * 26);
      X.stroke();
    }
  }
  for (let i = 0; i < 6; i++) d(x - 23.25 + i * 9.3, y + 22, 2.4, i < p.coil ? cB : '#24444e');
}

function drawZaps() {
  zaps.forEach(z => {
    X.save(); X.globalCompositeOperation = 'lighter';
    X.globalAlpha = clamp(z.life / .38, 0, 1);
    for (let pass = 2; pass--;) {
      X.strokeStyle = pass ? '#fff' : cB; X.lineWidth = pass ? 1.5 : 5;
      X.beginPath(); X.moveTo(z.x1, z.y1);
      for (let i = 1; i < 8; i++) {
        const k = i / 8, j = (R() - .5) * 30 * (1 - k);
        X.lineTo(z.x1 + (z.x2 - z.x1) * k + j, z.y1 + (z.y2 - z.y1) * k + j);
      }
      X.lineTo(z.x2, z.y2); X.stroke();
    }
    X.restore();
  });
}

function drawBubbles() {
  X.strokeStyle = cM; X.lineWidth = 1.2;
  bubbles.forEach(b => {
    X.globalAlpha = .25 + S(G.t * 3 + b.ph) * .1;
    X.beginPath(); X.arc(b.x, b.y, b.r, 0, TAU); X.stroke();
  });
  X.globalAlpha = 1;
}

function drawParts() {
  parts.forEach(p => { X.globalAlpha = clamp(p.life, 0, 1); d(p.x, p.y, p.r, p.col); });
  X.globalAlpha = 1;
}

function drawVolcanoes() {
  L.volcanoes.forEach(v => {
    const pulse = .6 + S(G.t * 2.5) * .2;
    const glow = v.t > 0 ? 1 : pulse;
    const dir = v.x < L.W / 2 ? 1 : -1;
    const tilt = dir * .2 + (v.t > 0 ? S(G.t * 30) * .04 * v.t : 0);
    X.globalAlpha = 1;
    el(v.x, v.y, 30, 8, '#5a2a3d');
    X.save();
    X.translate(v.x, v.y);
    X.rotate(tilt);
    const g = X.createLinearGradient(-27, -22, 27, 0);
    g.addColorStop(0, '#3d1a2a'); g.addColorStop(.5, '#8a4a3a'); g.addColorStop(1, '#2a0f1f');
    X.fillStyle = g;
    X.beginPath(); X.moveTo(-28, 0);
    X.lineTo(-11, -22); X.lineTo(11, -22); X.lineTo(28, 0);
    X.closePath(); X.fill();
    el(0, -22, 11, 4, '#1c0a14');
    glowDisc(0, -22, 28 * glow, v.t > 0 ? cA : cE, v.t > 0 ? 'rgba(255,200,100,.6)' : 'rgba(255,60,80,.4)');
    d(0, -22, 5 * glow, v.t > 0 ? cN : cC);
    X.restore();
    const cx = v.x + S(tilt) * 22, cy = v.y - C(tilt) * 22;
    X.globalAlpha = .4 + S(G.t * 3) * .2;
    for (let i = 6; i--;) {
      const a = G.t * .8 + i * 1.05;
      d(cx + C(a) * (9 + i * 2), cy - S(a * 2.7) * 11, 2 + S(a * 1.3) * .8, cA);
    }
    X.globalAlpha = 1;
    if (v.t > 0) {
      for (let i = 22; i--;) {
        const a = (i / 22) * TAU + G.t;
        d(cx + C(a) * 16, cy - 4, 2 + S(a * 4) * 1.6, cC);
      }
    }
  });
}

function drawPops() {
  pops.forEach(p => {
    X.globalAlpha = clamp(p.life, 0, 1);
    txt(p.text, p.x, p.y, p.size, p.col);
  });
  X.globalAlpha = 1;
}

function drawMonster(m) {
  X.save();
  X.translate(m.x, m.y);
  X.scale(m.dir, 1);
  if (m.mode === DD) {
    X.globalAlpha = clamp(m.deadT / .7, 0, 1);
    if (m.kind !== PF) X.rotate((.7 - m.deadT) * 7);
  }
  if (m.kind === CB) {
    X.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      const sw = S(m.ph + i) * 4;
      ln(i * 6, 2, i * 12 + sw, 18, '#8e2b25', 3.5);
      ln(i * 6, 2, i * 14 - sw, 12, '#8e2b25', 3.5);
    }
    el(-21, -8 + S(m.ph * 2) * 2, 8, 8, hs(12 + DH * 2, 70, 58));
    el(21, -8 + S(m.ph * 2) * 2, 8, 8, hs(12 + DH * 2, 70, 58));
    el(0, 0, 20, 14, hs(4 + DH * 2, 65, 42));
    el(0, -3, 19, 10, hs(12 + DH * 2, 70, 58));
    [-1, 1].forEach(s => {
      ln(s * 7, -10, s * 8, -18, '#7a2420', 2.5);
      d(s * 8, -19, 5, '#f5ffff');
      d(s * 9, -19, 2.4, cJ);
    });
  } else if (m.kind === PF) {
    const inf = m.inf || 0;
    if (m.mode === DD) {
      // se DESINFLA: se desploma aplastado con un último respingo
      const k = clamp(m.deadT / .55, .06, 1);
      X.scale((1 + inf * .5) * (1 + (1 - k) * .5), (1 + inf * .55) * k * k);
    } else if (inf) X.scale(1 + inf * .55, 1 + inf * .55);
    X.fillStyle = hs(35 + DH * 2, 85, 60);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU + S(m.ph) * .1, sp = 24 + inf * 12;
      X.beginPath();
      X.moveTo(C(a) * 18, S(a) * 18);
      X.lineTo(C(a + .16) * sp, S(a + .16) * sp);
      X.lineTo(C(a + .32) * 18, S(a + .32) * 18);
      X.fill();
    }
    d(0, 0, 23, hs(35 + DH * 2, 85, 60));
    d(-5, -6, 13, '#ffe9a8');
    el(4, 9, 12, 7 + inf * 3.5, '#fff6d8');
    d(10, -6, 6 + inf * 3, '#fff');
    d(12, -6, 3 + inf * 1.4, cJ);
    X.strokeStyle = '#7a3a1a'; X.lineWidth = 2;
    X.beginPath(); X.arc(14, 4, 4 + inf * 4.5, .2, 1.4); X.stroke();
    el(-21, 0, 6, 10, cE, .3);
  } else {
    X.fillStyle = hs(340 + DH * 2, 60, 66);
    X.beginPath(); X.moveTo(-42, 0); X.lineTo(-58, -18); X.lineTo(-54, 0); X.lineTo(-58, 18); X.closePath(); X.fill();
    X.fillStyle = hs(197 + DH * 2, 35, 52);
    X.beginPath(); X.moveTo(-48, 0);
    X.quadraticCurveTo(-20, -20, 22, -9);
    X.quadraticCurveTo(52, -2, 60, 6);
    X.quadraticCurveTo(18, 16, -20, 14);
    X.quadraticCurveTo(-40, 10, -48, 0); X.fill();
    X.beginPath(); X.moveTo(-6, -12); X.lineTo(8, -32); X.lineTo(22, -10); X.fill();
    X.beginPath(); X.moveTo(-2, 12); X.lineTo(12, 26); X.lineTo(26, 10); X.fill();
    el(10, 5, 30, 6, '#c7dde6');
    d(38, -5, 4, '#fff');
    d(39, -5, 2, cJ);
    for (let i = 0; i < 4; i++) ln(32 + i * 6, 8, 35 + i * 6, 13, '#fff', 2);
  }
  X.restore();
}

const pad = n => (n + '').padStart(6, 0);



function drawHUD() {
  const hy = 10;
  const biting = monsters.some(mc => mc.mode === 'eat');
  frb(0, hy, L.W, 48, 12, 'rgba(2,12,20,.78)');
  txt(tr(0), 10, hy + 13, 10, cF, 'left');
  txt(pad(G.score), 10, hy + 33, 24, '#eaffff', 'left');
  txt(tr(1) + ' ' + G.wave, L.W / 2, hy + 15, 17, cA);
  txt(tr(2) + ' ' + G.left, L.W / 2, hy + 35, 9, cF);
  txt(Math.ceil(G.time) + 's', L.W - 10, hy + 16, 24, G.time < 10 || biting ? cC : cB, 'right');
  txt(tr(3), L.W - 10, hy + 35, 9, cF, 'right');
  const frac = clamp(G.time / G.maxTime, 0, 1);
  fr(2, hy + 50, L.W - 4, 6, 3, '#0b2634');
  fr(2, hy + 50, (L.W - 4) * frac, 6, 3, biting && S(G.t * 16) > 0 ? '#ff9db4' : frac < .22 ? cC : cB);
  if (G.combo > 1) txt('x' + G.mult, L.W - 14, hy + 80, 24, cA, 'right');
  // impulsos de los volcanes (solo oleada 1, ambas dificultades): A izquierda, D derecha
  if (G.wave < 2) {
    txt(tr(27), 14, hy + 70, 9, cD, 'left');
    for (let i = 0; i < 3; i++) {
      const on = i < G.jets;
      d(20 + i * 18, hy + 84, 6, on ? cA : '#123c4c');
      if (on) d(20 + i * 18, hy + 84, 3, '#fff2c0');
    }
  }
  if (G.warn > 0) {
    X.strokeStyle = 'rgba(255,60,90,' + (.3 + S(G.t * 22) * .16) + ')';
    X.lineWidth = 10;
    rr(5, 5, L.W - 10, L.H - 10, 20); X.stroke();
    txt(tr(5), L.W / 2, 78, 22, cC);
    txt(mn(G.warnKind) + ' ' + tr(6), L.W / 2, 102, 12, cK);
  } else if (G.bannerT > 0) {
    X.globalAlpha = clamp(G.bannerT * 1.5, 0, 1);
    txt(G.banner, L.W / 2, hy + 92, L.portrait ? 18 : 20, cA);
    X.globalAlpha = 1;
  }
}

function drawMenu() {
  X.fillStyle = 'rgba(2,8,15,.74)'; X.fillRect(0, 0, L.W, L.H);
  const cx = L.W / 2, cy = L.H * .2;
  X.font = 'bold ' + (L.portrait ? 68 : 86) + 'px monospace';
  X.textAlign = 'center'; X.textBaseline = 'middle';
  X.shadowColor = cB; X.shadowBlur = 26;
  const tg = X.createLinearGradient(0, cy - 48, 0, cy + 34);
  tg.addColorStop(0, '#ffffff'); tg.addColorStop(.42, cD);
  tg.addColorStop(.56, '#0fa39c'); tg.addColorStop(1, cI);
  X.fillStyle = tg; X.fillText('AQUARING', cx, cy);
  X.shadowBlur = 0;
  // START (solo texto suave, sin caja ni borde)
  const sy = L.H * (L.portrait ? .34 : .38);
  if (S(G.t * 4) > -.2) {
    X.shadowColor = cI; X.shadowBlur = 12;
    txt(tr(14), cx, sy + 26, 33, cI);
    X.shadowBlur = 0;
    txt(L.portrait ? tr(21) : tr(15), cx, sy + 48, 11, '#7fc4cc');
  }
  // elección de modo (texto; el activo brilla, el otro se atenúa)
  const my = sy + 138, bw = 172, gap = 24;
  for (let i = 0; i < 2; i++) {
    const bx = cx - bw - gap / 2 + i * (bw + gap), sel = G.diff === i;
    if (sel) { X.shadowColor = cB; X.shadowBlur = 10; }
    txt(tr(16 + i), bx + bw / 2, my, sel ? 32 : 26, sel ? cI : '#3d5a66');
    X.shadowBlur = 0;
  }
}

function drawOver() {
  X.fillStyle = 'rgba(2,6,12,.82)'; X.fillRect(0, 0, L.W, L.H);
  const cx = L.W / 2, cy = L.H * (L.portrait ? .17 : .15);
  txt(tr(8), cx, cy, L.portrait ? 42 : 50, cC);
  fr(cx - 160, cy + 60, 320, 68, 14, 'rgba(4,18,28,.8)');
  txt(pad(G.score), cx, cy + 84, 34, '#eaffff');
  txt(G.newBest ? tr(9) : tr(10) + ' ' + pad(G.best), cx, cy + 111, 10, G.newBest ? cA : cF);
  const sy = cy + 154;
  if (S(G.t * 4) > -.2) {
    fr(cx - 170, sy + 30, 340, 48, 12, '#082a33');
    txt(L.portrait ? tr(21) : tr(11), cx, sy + 54, 11, cI);
  }
}

function drawHelp(paused) {
  const cx = L.W / 2, cy = L.H / 2, w = Math.min(L.W - 40, 440), h = 250;
  fr(0, 0, L.W, L.H, 0, 'rgba(2,8,15,.62)');
  frb(cx - w / 2, cy - h / 2, w, h, 16, 'rgba(3,16,25,.95)', cB, 2);
  txt(paused ? tr(7) : tr(37), cx, cy - h / 2 + 26, 22, cB);
  // mini animación: el tanque se inclina y un anillo cae y se apila
  const px = cx - w * .28, gy = cy + 74;
  X.save(); X.translate(px, gy); X.rotate(S(G.t * 2) * .12);
  el(0, 4, 52, 6, '#b08b52');
  el(0, 0, 52, 5, 'rgba(80,235,225,.25)');
  X.restore();
  fr(px - 4, cy - 2, 8, gy - cy + 2, 4, '#d9554d');
  el(px, cy - 2, 7, 3, cA);
  for (let i = 0; i < 2; i++) d(px, gy - 10 - i * 11, 12, i ? cD : cB);
  const k = (G.t % 2) / 2, fall = k < .55 ? k / .55 : 1;
  const yy = cy - 82 + (gy - 22 - (cy - 82)) * fall * fall;
  const sq = k > .55 ? 1 - S(clamp((k - .55) * 10, 0, 1) * PI / 2) * .45 : 1;
  X.save(); X.translate(px, yy);
  X.scale(1 + (1 - sq) * .4, sq);
  d(0, 0, 12, cB);
  X.globalAlpha = .55; d(0, 0, 6, '#0a1a26'); X.globalAlpha = 1;
  X.strokeStyle = 'rgba(255,255,255,.65)'; X.lineWidth = 2;
  X.beginPath(); X.arc(0, 0, 10, PI * 1.02, PI * 1.72); X.stroke();
  X.restore();
  // mini volcán: glow + erupción periódica con anillo y chispas
  const vx = px + 74, vby = gy;
  X.save(); X.translate(vx, vby); X.rotate(S(G.t * 2 + 1) * .06);
  const vg = X.createLinearGradient(-10, -14, 10, 0);
  vg.addColorStop(0, '#3d1a2a'); vg.addColorStop(.5, '#8a4a3a'); vg.addColorStop(1, '#2a0f1f');
  X.fillStyle = vg;
  X.beginPath(); X.moveTo(-12, 0); X.lineTo(-5, -14); X.lineTo(5, -14); X.lineTo(12, 0); X.closePath(); X.fill();
  X.restore();
  el(vx, vby, 14, 3.5, '#5a2a3d');
  el(vx, vby - 14, 5, 2, '#1c0a14');
  const ec = G.t % 3, er = ec < .9 ? 1 - ec / .9 : 0;
  if (er > 0) {
    glowDisc(vx, vby - 14, 8 + 10 * er, cA, 'rgba(255,200,100,.5)');
    d(vx, vby - 14, 3 + 2 * er, cN);
    for (let i = 0; i < 5; i++) {
      const ph = G.t * 2 + i * 1.3;
      d(vx + S(ph) * 8 * er, vby - 16 - i * 5 - (1 - er) * 14, 1.6, i % 2 ? cA : cC);
    }
    X.save(); X.translate(vx, vby - 18 - (1 - er) * 34); X.scale(1 + (1 - er) * .3, 1);
    X.strokeStyle = cB; X.lineWidth = 2;
    X.beginPath(); X.arc(0, 0, 6, PI * 1.02, PI * 1.72); X.stroke();
    X.restore();
  } else glowDisc(vx, vby - 14, 5 + S(G.t * 3) * 1.5, 'rgba(255,90,80,.3)', 'rgba(255,60,80,.12)');
  // filas de controles (teclas que laten)
  const rx = cx - w * .06;
  const row = (y, ks, label) => {
    let x = rx;
    for (const kk of ks) {
      const on = S(G.t * 3 + y) > -.3;
      fr(x, y - 12, 30, 24, 6, on ? cB : '#0d2a36');
      txt(kk, x + 15, y + 1, kk.length > 1 ? 10 : 14, on ? '#03232c' : cI);
      x += 36;
    }
    txt(label, x + 4, y + 1, 12, cD, 'left');
  };
  row(cy - 36, ['←', '→'], tr(19));
  if (G.wave < 2) row(cy - 74, ['A', 'D'], tr(27));
  row(cy + 2, ['P'], 'P/ESC ' + tr(12));
  row(cy + 40, ['M'], tr(13));
  txt(paused ? tr(4) : tr(11), cx, cy + h / 2 - 18, 10, '#7fc4cc');
}

function drawPause() { drawHelp(1); }

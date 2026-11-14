import { clamp, rand, S, C, A, MN, MX, R, HY, SG, PW, TAU, cA, cC, cD, cG, cP , PL, SH, CB, FR, BM, PF, DD, OV } from './config.js';
import { initAudio, musicStart, musicStop, toggleMute, sfx } from './audio.js';
import {
  G, L, posts, rings, monsters, parts, pops, bubbles, zaps, fish,
  waterY, coilY, startGame, startWave, catchRing, stackDone,
  freeRing, explode, zap, loseTime, gameOver, waveClear, togglePause,
  spawnMonster, chooseMonster, mn, tr, banner, popup, burst, cv, loot
} from './state.js';
const keys = {};
const PD = e => e.preventDefault();


function begin() { initAudio(); startGame(); musicStart(); }

function toCanvas(e) {
  const r = cv.getBoundingClientRect();
  const t = G.scene === PL ? G.tilt : 0, a = t * 5 * Math.PI / 180;
  const c = Math.cos(a), s = Math.sin(a), k = 1 - Math.abs(t) * (L.portrait ? .11 : .01);
  const dx = e.clientX - (r.right - r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  return {
    x: ((dx * c + dy * s) / k / cv.clientWidth + .5) * L.W,
    y: ((-dx * s + dy * c) / k / cv.clientHeight + .5) * L.H
  };
}

export function bindInput() {
  window.addEventListener('keydown', e => {
    initAudio();
    const k = e.code;
    keys[k] = true;
    if (k === 'KeyM') { G.muted = toggleMute(); return; }
    if (G.help && G.scene === PL) { G.help = 0; G.helpSeen = 1; PD(e); return; }
    if (G.scene === 'menu' || G.scene === OV) {
      if (G.scene === 'menu' && (k === 'ArrowLeft' || k === 'KeyA')) { G.diff = 0; PD(e); return; }
      if (G.scene === 'menu' && (k === 'ArrowRight' || k === 'KeyD')) { G.diff = 1; PD(e); return; }
      if (k === 'Space' || k === 'Enter' || (G.scene === OV && k === 'KeyR')) begin();
      else if (G.scene === OV && k === 'Escape') G.scene = 'menu';
      PD(e); return;
    }
    if (k === 'KeyP' || k === 'Escape') {
      togglePause();
      if (G.paused) musicStop(); else musicStart();
      return;
    }
    if (k.startsWith('Arrow') || k === 'Space') PD(e);
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });
  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
  });
  cv.addEventListener('pointerdown', e => {
    initAudio();
    const p = toCanvas(e);
    if (G.scene === 'menu') {
      const cx = L.W / 2, sy = L.H * (L.portrait ? .34 : .38), my = sy + 138;
      if (p.y > my - 32 && p.y < my + 32) {
        if (A(p.x - (cx - 98)) < 86) { G.diff = 0; return; }
        if (A(p.x - (cx + 98)) < 86) { G.diff = 1; return; }
      }
      return begin();
    }
    if (G.scene === OV) { begin(); return; }
    if (G.help) { G.help = 0; G.helpSeen = 1; return; }
    if (G.helpSeen && A(p.x - (L.W - 28)) < 24 && A(p.y - (L.H - 30)) < 24) { G.help = 1; return; }
    if (G.paused) { togglePause(); musicStart(); return; }
    if (p.x > L.W - 74 && p.y < 74) { togglePause(); musicStop(); return; }
  });
}

function ejectTop(p, n, vx, vy) {
  for (let i = 0; i < n && p.stack.length; i++) {
    const r = p.stack.pop();
    freeRing(r, rand(-vx, vx), vy - rand(0, 110));
    burst(r.x, r.y, r.col, 10, 1);
  }
  p.wob = 1;
}
function breakPost(p) {
  ejectTop(p, 2, 260, -180);
  loseTime(4, mn(SH) + ' -4s');
  G.shake = 20; G.flash = .6;
  sfx.bomb();
}

function erupt(i, ch) {
  if (G.jets <= 0) return;
  const v = L.volcanoes[i];
  if (!v) return;
  G.jets--; v.t = 1; G.shake = 8;
  const mx = v.x, my = v.y - 22, pw = 1 + ch * 1.3, rad = 215 * pw;
  for (const rg of rings) {
    if (rg.mode !== FR) continue;
    const dx = rg.x - mx, dy = rg.y - my, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > rad) continue;
    const f = 1 - (dist / rad) * .55;
    rg.vx += (dx / (dist || 1)) * 660 * pw * f;
    rg.vy -= 1500 * pw * f;
    rg.flat = .3;
  }
  for (const m of monsters) {
    if (m.mode === DD) continue;
    const dx = m.x - mx, dy = m.y - my, dist = HY(dx, dy);
    if (dist > rad) continue;
    const f = 1 - (dist / rad) * .55;
    m.mode = 'flee';
    m.dir = SG(dx) || 1;
    m.x += SG(dx) * 130 * pw * f;
  }
  burst(mx, my, cA, 16, 1.2);
  sfx.jet(pw / 2.3);
}

function updateRings(dt) {
  const wy = waterY(), tank = L.tank, bottom = L.sandY - 12;
  for (let i = rings.length - 1; i >= 0; i--) {
    const rg = rings[i];
    if (rg.mode === 'catch') {
      rg.ct = MN(1, rg.ct + dt * 3.2);
      const k = rg.ct;
      const a = MN(1, k / .4), ea = 1 - PW(1 - a, 3);
      rg.x = rg.sx + (rg.tx - rg.sx) * ea;
      rg.flat = MN(1, rg.flat + dt * 4.5);
      rg.ang *= PW(.82, dt * 60);
      rg.q = 1 + .2 * S(TAU / 2 * MN(1, k / .55));
      const d2 = clamp((k - .4) / .6, 0, 1), ed = d2 * d2 * (3 - 2 * d2);
      rg.y = rg.sy + (rg.ty - rg.sy) * ed;
      if (k >= 1) { rg.q = 1; stackDone(rg); }
      continue;
    }
    if (rg.mode === 'stacked') {
      if (rg.kind === BM) { rg.fuse -= dt; if (rg.fuse <= 0) explode(rg); }
      continue;
    }
    if (rg.mode !== FR) continue;
    const wet = rg.y > wy;
    const onFloor = rg.y >= bottom - 2;
    if (!rg.uw && wet && rg.vy > 170) { rg.vy *= .55; burst(rg.x, wy, cD, 9, .8); }
    rg.uw = wet;
    rg.vy += (wet ? 560 : 1230) * dt;
    rg.vx += (G.tilt * (onFloor ? 650 : 430) + S(G.t * 1.15 + rg.ang) * 16) * dt;
    rg.vx *= MX(0, 1 - (wet ? 2.8 : .18) * dt);
    rg.vy *= MX(0, 1 - (wet ? 2.5 : .1) * dt);
    rg.vx = clamp(rg.vx, -720, 720); rg.vy = clamp(rg.vy, -1000, 900);
    rg.x += rg.vx * dt; rg.y += rg.vy * dt;
    rg.ang += rg.va * dt; rg.va *= PW(.25, dt);
    rg.flat += ((wet ? .52 : .14) - rg.flat) * MN(1, dt * 5);
    rg.flat = clamp(rg.flat, .06, .92);
    const m = rg.r + 6;
    if (rg.x < tank.x + m) { rg.x = tank.x + m; rg.vx = A(rg.vx) * (wet ? .3 : .5); }
    if (rg.x > tank.x + tank.w - m) { rg.x = tank.x + tank.w - m; rg.vx = -A(rg.vx) * (wet ? .3 : .5); }
    if (rg.y < tank.y + 26) { rg.y = tank.y + 26; rg.vy = A(rg.vy) * .3; }
    if (rg.y > bottom) {
      rg.y = bottom;
      rg.vy = -A(rg.vy) * (wet ? .16 : .36);
      rg.vx *= .86;
    }
    for (let j = 0; j < i; j++) {
      const o = rings[j];
      if (o.mode !== FR) continue;
      const dx = o.x - rg.x, dy = o.y - rg.y, d = HY(dx, dy), min = rg.r * 1.3;
      if (d < min && d > .01) {
        const p = (min - d) * .5, nx = dx / d, ny = dy / d;
        rg.x -= nx * p; rg.y -= ny * p; o.x += nx * p; o.y += ny * p;
      }
    }
    for (const p of posts) {
      const dx = rg.x - p.x;
      if (p.stack.length < 18
        && rg.y > p.topY - 8 && rg.y < p.topY + 44 && rg.vy > 30 && A(dx) < 14) {
        if (catchRing(rg, p)) break;
      }
      if (rg.y > p.topY && rg.y < p.botY && A(dx) < rg.r + p.r) {
        const s = SG(dx) || 1;
        rg.x = p.x + s * (rg.r + p.r);
        rg.vx *= -.42; rg.va += rand(-1.5, 1.5);
      }
    }
  }
}

function updateMonsters(dt) {
  const t = L.tank, mid = t.x + t.w / 2;
  for (const p of posts) if (p.coil) {
    let h = 0;
    for (const m of monsters) if (m.mode !== DD && m.kind !== CB && HY(m.x - p.x, m.y - coilY(p)) < 480) zap(m, p), h = 1;
    if (h) p.coil--;
  }
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    if (m.mode === DD) {
      m.deadT -= dt;
      if (m.deadT <= 0) monsters.splice(i, 1);
      continue;
    }
    if (m.mode === 'flee') {
      m.x += m.dir * 220 * dt; m.y -= 34 * dt; m.ph += dt * 6;
      if (m.x < t.x - 150 || m.x > t.x + t.w + 150 || m.y < t.y - 100) monsters.splice(i, 1);
      continue;
    }
    if (m.stun > 0) {
      m.stun -= dt; m.x += m.dir * 80 * dt; m.ph += dt * 4;
      if (m.x < t.x - 160 || m.x > t.x + t.w + 160) monsters.splice(i, 1);
      continue;
    }
    if (m.kind === CB) {
      if (m.mode === 'walk') {
        if (!m.post.stack.length) {
          const o = posts.find(p => p !== m.post && p.stack.length);
          if (o) m.post = o;
          else { m.mode = 'flee'; m.dir = SG(m.x - mid) || 1; continue; }
        }
        const dx = m.post.x - m.x;
        m.x += SG(dx) * 76 * dt;
        m.y += (L.sandY - 20 - m.y) * MN(1, dt * 5);
        m.ph += dt * 8;
        if (A(dx) < 12) m.mode = 'climb';
      } else if (m.mode === 'climb') {
        const st = m.post.stack;
        const top = st.length ? st[st.length - 1].y : m.post.topY + 50;
        m.x += (m.post.x - m.x) * MN(1, dt * 9);
        m.y += (top + 9 - m.y) * MN(1, dt * 3.6);
        m.ph += dt * 10;
        if (A(m.y - (top + 9)) < 9) { m.mode = 'eat'; m.eatT = .35; }
      } else if (m.mode === 'eat') {
        m.eatT -= dt; m.ph += dt * 10;
        if (m.eatT <= 0) {
          m.eatT = .72; m.y += 9;
          const st = m.post.stack;
          if (st.length) {
            const r = st.pop();
            r.mode = 'hold'; r.lootT = 2;
            const j = rings.indexOf(r); if (j >= 0) rings.splice(j, 1);
            loot.push(r);
            popup(m.x, m.y - 24, tr(29), cG, 16);
            burst(m.x, m.y, cG, 10, 1);
            sfx.pop();
            G.time = MX(0, G.time - 1);
            popup(L.W - 46, 76, '-1s', cC, 17);
            burst(L.W - 46, 60, cC, 6, .8);
            G.shake = MX(G.shake, 5);
            m.eats++;
            if (m.eats >= 3) { m.mode = 'flee'; m.dir = SG(m.x - mid) || 1; }
          } else { m.mode = 'flee'; m.dir = SG(m.x - mid) || 1; }
        }
      }
    } else if (m.kind === PF) {
      m.x += m.dir * m.sp * dt; m.ph += dt * 4;
      m.y = m.baseY + S(m.ph) * 22;
      let nd = 1e9; for (const p of posts) nd = MN(nd, A(m.x - p.x));
      m.inf = clamp(1 - nd / 320, 0, 1);
      for (const p of posts) {
        if (A(m.x - p.x) < 30) {
          ejectTop(p, 1 + (R() * 2 | 0), 150, -240);
          G.shake = 14; G.flash = .25; sfx.bomb();
          G.pufs++;
          const g = (R() * 3) | 0;
          G.time = MN(99, G.time + g);
          popup(p.x, p.topY - 12, tr(33) + ' +' + g + 's', cP, 19);
          burst(p.x, p.topY + 30, cP, 26, 1.3);
          m.mode = DD; m.deadT = .55;
          break;
        }
      }
      if (m.x < t.x - 120 || m.x > t.x + t.w + 120) monsters.splice(i, 1);
    } else {
      m.x += m.dir * m.sp * dt; m.ph += dt * 5;
      m.y = m.baseY + S(m.ph) * 8;
      if (!m.hit) {
        for (const p of posts) {
          if (A(m.x - p.x) < 34) { m.hit = true; breakPost(p); break; }
        }
      }
      if (m.x < t.x - 160 || m.x > t.x + t.w + 160) monsters.splice(i, 1);
    }
  }
}



function updateAmbient(dt) {
  const t = L.tank;
  fish.forEach(f => {
    f.x += f.vx * dt; f.ph += dt * 2.8;
    if (f.x < t.x + 30) { f.x = t.x + 30; f.vx = A(f.vx); }
    if (f.x > t.x + t.w - 30) { f.x = t.x + t.w - 30; f.vx = -A(f.vx); }
    f.y += S(f.ph) * 6 * dt;
  });
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.x += (b.vx || 0) * dt + S(G.t * 2 + b.ph) * 7 * dt;
    b.y += (b.vy == null ? -b.sp : b.vy *= PW(.35, dt)) * dt;
    if (b.life != null) {
      b.life -= dt * .75;
      if (b.life <= 0) { bubbles.splice(i, 1); continue; }
    }
    if (b.y < waterY() + 2 || b.y < t.y + 8) {
      if (b.life != null) { bubbles.splice(i, 1); continue; }
      b.y = L.sandY - rand(0, 26); b.x = rand(t.x + 14, t.x + t.w - 14);
    }
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 760 * dt; p.life -= dt * 1.7;
    if (p.life <= 0) parts.splice(i, 1);
  }
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i];
    p.y -= 44 * dt; p.life -= dt * 1.15;
    if (p.life <= 0) pops.splice(i, 1);
  }
  for (let i = zaps.length - 1; i >= 0; i--) {
    zaps[i].life -= dt;
    if (zaps[i].life <= 0) zaps.splice(i, 1);
  }
  posts.forEach(p => {
    if (p.wob > 0) p.wob *= PW(.015, dt);
  });
  for (const v of L.volcanoes) {
    if (v.t > 0) { v.t -= dt / 1.4; if (v.t < 0) v.t = 0; }
  }
}

export function update(dt) {
  dt = MN(dt, .033);
  G.t += dt;
  G.shake *= PW(.02, dt);
  G.flash *= PW(.01, dt);
  if (G.bannerT > 0) G.bannerT -= dt;
  updateAmbient(dt);
  if (G.scene !== PL || G.paused || G.help) return;

  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) { G.combo = 0; G.mult = 1; } }

  let tt = 0;
  if (keys.ArrowLeft) tt--;
  if (keys.ArrowRight) tt++;
  G.tiltT = tt;
  G.tilt += (G.tiltT - G.tilt) * MN(1, dt * 7);

  if (G.wave < 2) {
    if (keys.KeyA && G.jets) G.chargeL = MN(1, G.chargeL + dt / .75);
    else if (G.chargeL > 0) { erupt(0, G.chargeL); G.chargeL = 0; }
    if (keys.KeyD && G.jets) G.chargeR = MN(1, G.chargeR + dt / .75);
    else if (G.chargeR > 0) { erupt(1, G.chargeR); G.chargeR = 0; }
    G.jetT += dt;
    if (G.jetT > 1.7) { G.jetT = 0; if (G.jets < 3) G.jets++; }
  }

  if (G.waveDelay <= 0) {
    if (G.warn > 0) {
      G.warn -= dt;
      if (G.warn <= 0) {
        spawnMonster(G.warnKind);
        G.monsterT = clamp(16 - G.wave * 2, 7, 16) + rand(0, 4);
      }
    } else if (G.monsterT < 900) {
      G.monsterT -= dt;
      if (G.monsterT <= 0) {
        G.warnKind = chooseMonster();
        G.warn = 1.5;
        banner('¡' + mn(G.warnKind) + '!');
        sfx.crab();
      }
    }
  }

  if (G.pumpT > 0) G.pumpT -= dt; else { for (let i = MN(2, 1 + G.pufs); i--;) spawnMonster(PF); G.pumpT = G.hard || G.wave > 1 ? 7 : 10; }

  updateRings(dt);
  updateMonsters(dt);
  if (G.kills.length) {
    const k = G.kills[0];
    for (let i = 2; i-- && monsters.length < 12;) spawnMonster(k);
    G.kills.length = 0;
  }

  for (let i = loot.length - 1; i >= 0; i--) {
    const r = loot[i];
    r.lootT -= dt;
    if (r.lootT > 0) continue;
    r.mode = FR; r.post = null;
    r.x = rand(L.tank.x + 80, L.tank.x + L.tank.w - 80);
    r.y = L.sandY - 60; r.vx = rand(-40, 40); r.vy = -80; r.flat = .3; r.va = rand(-2, 2);
    rings.push(r); G.left++;
    loot.splice(i, 1);
    popup(r.x, r.y - 20, tr(30), cG, 16);
  }

  if (G.waveDelay > 0) {
    G.waveDelay -= dt;
    if (G.waveDelay <= 0) startWave(G.wave + 1);
  } else if (G.left === 0 && !rings.some(r => r.kind === BM && r.mode === 'stacked')) {
    waveClear();
  } else {
    G.time -= dt;
    if (G.time <= 0) { G.time = 0; gameOver(); }
  }
}



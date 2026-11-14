(() => {
  // src/config.js
  var TAU = Math.PI * 2;
  var clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  var rand = (a, b) => a + Math.random() * (b - a);
  var pick = (a) => a[Math.random() * a.length | 0];
  var cA = "#ffd166";
  var cB = "#5ef2d6";
  var cC = "#ff4d6d";
  var cD = "#9bf6ff";
  var cE = "#ff7b9c";
  var cF = "#5f93a8";
  var cG = "#ffb347";
  var cH = "#ffc857";
  var cI = "#d8fff8";
  var cJ = "#06121b";
  var cK = "#ffb3c0";
  var cL = "#e85d3f";
  var cM = "#bffff8";
  var cN = "#ffe066";
  var cO = "#57b8ff";
  var cP = "#b784ff";
  var COL = [cB, cO, cP, cH, cE, cD];
  var midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  var PI = Math.PI;
  var S = Math.sin;
  var C = Math.cos;
  var A = Math.abs;
  var MN = Math.min;
  var MX = Math.max;
  var R = Math.random;
  var F = Math.floor;
  var HY = Math.hypot;
  var SG = Math.sign;
  var PW = Math.pow;

  // src/audio.js
  var AC = null;
  var master = null;
  var mBus = null;
  var mGain = null;
  var sfxBus = null;
  var delay = null;
  var send = null;
  var musicOn = false;
  var muted = false;
  var step = 0;
  var nextT = 0;
  var noiseBuf = null;
  var SI = "sine";
  var TR = "triangle";
  var SW = "sawtooth";
  function initAudio() {
    if (AC) {
      if (AC.state === "suspended") AC.resume();
      return;
    }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain();
      master.gain.value = 0.8;
      master.connect(AC.destination);
      const comp = AC.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 5;
      comp.connect(master);
      sfxBus = AC.createGain();
      sfxBus.gain.value = 0.9;
      sfxBus.connect(comp);
      mGain = AC.createGain();
      mGain.gain.value = 0;
      mGain.connect(comp);
      mBus = AC.createGain();
      mBus.gain.value = 0.9;
      const lp = AC.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2600;
      lp.Q.value = 0.9;
      mBus.connect(lp);
      lp.connect(mGain);
      delay = AC.createDelay(0.8);
      delay.delayTime.value = 0.23;
      const fb = AC.createGain();
      fb.gain.value = 0.26;
      delay.connect(fb);
      fb.connect(delay);
      send = AC.createGain();
      send.gain.value = 0.42;
      send.connect(delay);
      delay.connect(lp);
      AC.resume();
    } catch (e) {
      AC = null;
    }
  }
  function tone(f, t, d2, kind, vol, dest = sfxBus, to = 0) {
    if (!AC || !dest) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = kind;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(MX(20, to), t + d2);
    g.gain.setValueAtTime(1e-4, t);
    g.gain.linearRampToValueAtTime(vol, t + 8e-3);
    g.gain.exponentialRampToValueAtTime(1e-4, t + d2);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + d2 + 0.03);
  }
  function noise(t, d2, vol, kind, f) {
    if (!AC || !sfxBus) return;
    if (!noiseBuf) {
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.6 | 0, AC.sampleRate);
      const b = noiseBuf.getChannelData(0);
      for (let i = 0; i < b.length; i++) b[i] = R() * 2 - 1;
    }
    const s = AC.createBufferSource();
    s.buffer = noiseBuf;
    const flt = AC.createBiquadFilter();
    flt.type = kind;
    flt.frequency.value = f;
    const g = AC.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(1e-3, t + d2);
    s.connect(flt);
    flt.connect(g);
    g.connect(sfxBus);
    s.start(t);
    s.stop(t + d2);
  }
  var BASS = [40, 0, 40, 43, 40, 0, 38, 40, 40, 0, 40, 43, 45, 43, 41, 40];
  var ARP = [64, 65, 67, 71, 76, 71, 67, 65, 64, 65, 67, 71, 74, 71, 67, 65];
  var CHORD = [[52, 55, 59], [53, 57, 60], [52, 55, 59], [50, 54, 57]];
  function mstep(i, t) {
    const k = MN(6, G.wave - 1) * 2;
    const bass = BASS[i % 16] + k;
    if (bass) tone(midi(bass), t, 0.34, TR, 0.3, mBus);
    const arp = ARP[i % 16] + k + (i % 32 > 23 && i % 2 ? 12 : 0);
    if (arp) {
      tone(midi(arp), t, 0.3, SI, 0.085, mBus);
      tone(midi(arp), t, 0.3, SI, 0.05, send);
    }
    if (i % 8 === 0) {
      const ch = CHORD[i / 8 % 4 | 0];
      for (const n of ch) tone(midi(n + 12 + k), t, 1.6, TR, 0.035, mBus);
      tone(58, t, 0.18, SI, 0.22, sfxBus, 32);
    }
    if (i % 4 === 2) noise(t, 0.04, 0.045, "highpass", 5200);
    if (i % 8 === 4) tone(midi(84 + i % 3 * 2 + k), t, 0.22, SI, 0.05, send);
  }
  function musicTick() {
    if (!AC || !musicOn) return;
    const now = AC.currentTime;
    if (nextT < now - 0.2) nextT = now + 0.03;
    while (nextT < now + 0.18) {
      mstep(step, nextT);
      step = (step + 1) % 32;
      nextT += 60 / 98 / 2;
    }
  }
  function musicStart() {
    if (!AC) return;
    if (AC.state === "suspended") AC.resume();
    musicOn = true;
    step = 0;
    nextT = AC.currentTime + 0.05;
    mGain.gain.cancelScheduledValues(AC.currentTime);
    mGain.gain.setTargetAtTime(muted ? 0 : 0.85, AC.currentTime, 0.3);
  }
  function musicStop() {
    if (!AC) return;
    musicOn = false;
    mGain.gain.setTargetAtTime(0, AC.currentTime, 0.2);
  }
  function toggleMute() {
    muted = !muted;
    if (AC) mGain.gain.setTargetAtTime(muted ? 0 : musicOn ? 0.85 : 0, AC.currentTime, 0.15);
    return muted;
  }
  var sfx = {
    click() {
      if (AC) tone(700, AC.currentTime, 0.06, "square", 0.06);
    },
    charge() {
      if (AC) tone(180, AC.currentTime, 0.5, SW, 0.05, sfxBus, 620);
    },
    jet(p = 1) {
      if (!AC) return;
      const t = AC.currentTime;
      noise(t, 0.38, 0.2 * p, "bandpass", 900);
      tone(220, t, 0.3, SI, 0.1 * p, sfxBus, 70);
    },
    clink(n = 0) {
      if (!AC) return;
      const t = AC.currentTime, f = midi(84 + n % 5 * 2);
      tone(f, t, 0.16, TR, 0.11);
      tone(f * 1.5, t, 0.12, SI, 0.05);
    },
    perfect() {
      if (!AC) return;
      const t = AC.currentTime;
      [76, 81, 88].forEach((n, i) => tone(midi(n), t + i * 0.055, 0.3, TR, 0.1));
    },
    pop() {
      if (AC) tone(520, AC.currentTime, 0.07, SI, 0.08, sfxBus, 880);
    },
    bomb() {
      if (!AC) return;
      const t = AC.currentTime;
      noise(t, 0.55, 0.3, "lowpass", 700);
      tone(160, t, 0.5, SW, 0.2, sfxBus, 40);
    },
    zap() {
      if (!AC) return;
      const t = AC.currentTime;
      noise(t, 0.22, 0.22, "highpass", 2600);
      tone(1400, t, 0.25, "square", 0.12, sfxBus, 180);
      tone(90, t, 0.3, SW, 0.12, sfxBus, 50);
    },
    _monster(f, d2, v, to, nd, nv, nf) {
      if (AC) {
        tone(f, AC.currentTime, d2, SW, v, sfxBus, to);
        noise(AC.currentTime, nd, nv, "lowpass", nf);
      }
    },
    crab() {
      this._monster(90, 0.5, 0.14, 55, 0.35, 0.1, 500);
    },
    shark() {
      this._monster(65, 0.8, 0.2, 40, 0.7, 0.16, 400);
    },
    wave() {
      if (!AC) return;
      const t = AC.currentTime;
      [69, 72, 76, 81].forEach((n, i) => tone(midi(n), t + i * 0.09, 0.45, TR, 0.12));
    },
    over() {
      if (!AC) return;
      const t = AC.currentTime;
      [69, 65, 62, 57].forEach((n, i) => tone(midi(n), t + i * 0.16, 0.5, TR, 0.13));
    }
  };

  // src/state.js
  var L = {
    portrait: false,
    W: 960,
    H: 686,
    k: 1,
    tank: { x: 0, y: 0, w: 960, h: 686 },
    sandY: 626,
    postsX: [288, 672],
    btns: [],
    volcanoes: []
  };
  var posts = [
    { x: 288, topY: 370, botY: 580, r: 6, stack: [], coil: 0, wob: 0, zapT: 0 },
    { x: 672, topY: 370, botY: 580, r: 6, stack: [], coil: 0, wob: 0, zapT: 0 }
  ];
  var rings = [];
  var monsters = [];
  var parts = [];
  var pops = [];
  var bubbles = [];
  var zaps = [];
  var fish = [];
  var weeds = [];
  var corals = [];
  var gravel = [];
  var loot = [];
  var cv = document.getElementById("c");
  var G = {
    scene: "menu",
    t: 0,
    score: 0,
    best: 0,
    wave: 1,
    time: 65,
    maxTime: 65,
    combo: 0,
    comboT: 0,
    mult: 1,
    stacked: 0,
    stackCount: 0,
    tilt: 0,
    tiltT: 0,
    jets: 3,
    jetT: 0,
    chargeL: 0,
    chargeR: 0,
    can: [],
    canA: 1,
    kills: [],
    hard: 0,
    shake: 0,
    flash: 0,
    banner: "",
    bannerT: 0,
    waveDelay: 0,
    monsterT: 10,
    warn: 0,
    warnKind: "",
    left: 0,
    pumpT: 5,
    paused: false,
    muted: false,
    newBest: false,
    pufs: 0
  };
  try {
    G.best = parseInt(localStorage.getItem("aqua_best") || "0", 10) || 0;
  } catch (e) {
  }
  function waterY() {
    return L.tank.y + (L.portrait ? 92 : 58);
  }
  function spreadVolcanoes() {
    const nv = L.volcanoes.length, spread = L.tank.w * 0.7, x0 = L.tank.x + L.tank.w * 0.15;
    L.volcanoes.forEach((v, i) => {
      v.x = nv > 1 ? x0 + i * spread / (nv - 1) : L.tank.x + L.tank.w / 2;
      v.y = L.sandY;
    });
  }
  function coilY(p) {
    return p.topY - 26;
  }
  function resize() {
    const portrait = innerHeight > innerWidth * 1.05;
    const W = portrait ? 800 : 960, H = portrait ? 1250 : 686;
    L.portrait = portrait;
    L.W = W;
    L.H = H;
    L.tank = portrait ? { x: 0, y: 0, w: 700, h: 1250 } : { x: 0, y: 0, w: 960, h: 686 };
    L.sandY = L.tank.y + L.tank.h - (portrait ? 70 : 60);
    L.postsX = portrait ? [200, 500] : [288, 672];
    posts.forEach((p, i) => {
      p.x = L.postsX[i];
      p.topY = L.tank.y + (portrait ? 720 : 370);
      p.botY = L.sandY - 46;
      p.r = portrait ? 7 : 6;
    });
    spreadVolcanoes();
    if (cv) {
      cv.width = W;
      cv.height = H;
      if (innerWidth >= innerHeight) {
        const s = Math.min(innerWidth * 0.75 / W, innerHeight / H);
        cv.style.width = W * s + "px";
        cv.style.height = H * s + "px";
      } else {
        cv.style.width = "100vw";
        cv.style.height = "100vh";
      }
    }
    buildDecor();
  }
  function buildDecor() {
    const t = L.tank;
    gravel.length = 0;
    weeds.length = 0;
    corals.length = 0;
    fish.length = 0;
    bubbles.length = 0;
    for (let i = 0; i < 110; i++) {
      gravel.push({
        x: rand(t.x + 10, t.x + t.w - 10),
        y: rand(L.sandY + 2, t.y + t.h - 4),
        r: rand(1, 4.2),
        col: pick([31, 36, 40, 43])
      });
    }
    for (let i = 0; i < 9; i++) {
      weeds.push({
        x: t.x + 34 + i * (t.w - 68) / 8 + rand(-14, 14),
        h: rand(L.portrait ? 90 : 54, L.portrait ? 230 : 150),
        ph: rand(0, TAU),
        w: rand(3, 6),
        col: rand(138, 174)
      });
    }
    for (let i = 0; i < 5; i++) {
      corals.push({
        x: t.x + 40 + i * (t.w - 80) / 4 + rand(-20, 20),
        h: rand(30, 78),
        col: pick([348, 34, 265, 16]) + rand(-6, 6)
      });
    }
    for (let i = 0; i < 9; i++) {
      fish.push({
        x: rand(t.x + 60, t.x + t.w - 60),
        y: rand(t.y + 130, L.sandY - 40),
        vx: rand(18, 46) * (R() < 0.5 ? 1 : -1),
        len: rand(10, 22),
        ph: rand(0, TAU),
        col: rand(0, 360),
        fin: rand(0, 360)
      });
    }
    for (let i = 0; i < 18; i++) {
      bubbles.push({
        x: rand(t.x + 14, t.x + t.w - 14),
        y: rand(t.y + 40, L.sandY),
        r: rand(1.2, 4),
        sp: rand(14, 34),
        ph: rand(0, TAU)
      });
    }
  }
  function banner(text) {
    G.banner = text;
    G.bannerT = 2.2;
  }
  function popup(x, y, text, col, size = 18) {
    pops.push({ x, y, text, col, size, life: 1 });
  }
  function burst(x, y, col, n = 14, pw = 1) {
    for (let i = 0; i < n; i++) parts.push({
      x,
      y,
      vx: rand(-170, 170) * pw,
      vy: rand(-220, 60) * pw,
      r: rand(1.4, 4),
      col,
      life: 1
    });
  }
  function startGame() {
    G.scene = "play";
    G.score = 0;
    G.wave = 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stacked = 0;
    G.shake = 0;
    G.flash = 0;
    G.bannerT = 0;
    G.paused = false;
    G.chargeL = 0;
    G.chargeR = 0;
    G.newBest = false;
    G.pufs = 0;
    rings.length = 0;
    monsters.length = 0;
    parts.length = 0;
    pops.length = 0;
    zaps.length = 0;
    loot.length = 0;
    G.can = [];
    G.canA = 1;
    G.kills.length = 0;
    posts.forEach((p) => {
      p.stack.length = 0;
      p.coil = 0;
      p.wob = 0;
      p.zapT = 0;
    });
    startWave(1);
  }
  function startWave(n) {
    G.wave = n;
    G.stackCount = 0;
    G.waveDelay = 0;
    G.pumpT = 6;
    G.hard = n > 4;
    G.time = G.maxTime = G.hard ? MX(30, 42 - (n - 5) * 2) : 60 - (n - 1) * 4;
    G.monsterT = n === 1 ? 8 : G.hard ? MX(7, 20 - n * 2) : 18 - n * 2;
    G.warn = 0;
    monsters.length = 0;
    const nb = MN(9, F(n + 1)), nr = MN(23, 7 + n * 3), N = nr + nb;
    const types = [];
    for (let i = 0; i < nr; i++) types.push("normal");
    for (let i = 0; i < nb; i++) types.push("bomb");
    for (let i = 0; i < 1 + F(n / 3); i++) {
      let k = R() * N | 0;
      if (types[k] === "normal") types[k] = "gold";
    }
    G.left = nr;
    const cols = L.W >= L.H ? 10 : 7, spread = L.tank.w - 80, step2 = spread / (cols - 1);
    for (let i = 0; i < N; i++) {
      const row = F(i / cols), col = i % cols, kind = types[i];
      rings.push({
        x: Math.min(L.tank.x + 40 + step2 * col + (row % 2 ? step2 / 2 : 0) + rand(-4, 4), L.tank.x + L.tank.w - 44),
        y: L.sandY - 26 - row * 26 + rand(-3, 3),
        vx: 0,
        vy: 0,
        r: 15,
        va: rand(-1.6, 1.6),
        ang: rand(0, TAU),
        flat: 0.52,
        col: kind === "bomb" ? cC : kind === "gold" ? cA : pick(COL),
        kind,
        mode: "free",
        ct: 0,
        post: null,
        fuse: 0,
        perfect: false
      });
    }
    banner("OLEADA " + n + (G.hard ? " \xB7 DIF\xCDCIL" : ""));
    L.volcanoes.length = 0;
    if (n < 2) {
      for (let i = 0; i < 2; i++) L.volcanoes.push({ x: 0, y: L.sandY, t: 0 });
      spreadVolcanoes();
    }
  }
  function catchRing(rg, p) {
    if (p.stack.length >= 18) return false;
    rg.mode = "catch";
    rg.ct = 0;
    rg.post = p;
    rg.sx = rg.x;
    rg.sy = rg.y;
    rg.tx = p.x;
    rg.ty = p.botY - 8 - p.stack.length * 11;
    p.stack.push(rg);
    rg.perfect = A(rg.x - p.x) < 5;
    sfx.clink(p.stack.length);
    return true;
  }
  function stackDone(rg) {
    rg.mode = "stacked";
    rg.flat = 1;
    rg.ang = 0;
    rg.kind !== "bomb" && G.left--;
    G.stacked++;
    G.stackCount++;
    G.combo++;
    G.comboT = 4.5;
    G.mult = MN(8, 1 + F(G.combo / 2));
    const pts = Math.round(((rg.kind === "gold" ? 500 : 100) + (rg.perfect ? 150 : 0)) * G.mult);
    G.score += pts;
    G.shake = MX(G.shake, 3 + G.mult);
    G.flash = rg.perfect ? 0.32 : 0.1;
    popup(rg.x, rg.y - 30, (rg.perfect ? "PERFECTO +" : "+") + pts, rg.perfect ? cN : rg.kind === "gold" ? "#ffd60a" : "#7cf7d8", rg.perfect ? 21 : 18);
    burst(rg.x, rg.y, rg.perfect ? cN : rg.col, rg.perfect ? 24 : 12, 1.1);
    if (rg.perfect) sfx.perfect();
    else sfx.clink(G.combo);
    if (rg.kind === "bomb") {
      rg.fuse = 2.4;
      popup(rg.x, rg.y - 56, "\xA1BOMBA!", cC, 20);
    }
    G.combo % 8 || grantCoil();
    if (G.stackCount % 3 === 0) grantCoil();
  }
  function freeRing(rg, pushX, pushY) {
    rg.mode = "free";
    rg.post = null;
    rg.vx = pushX;
    rg.vy = pushY;
    rg.va = rand(-3, 3);
    rg.flat = 0.3;
    if (rg.kind !== "bomb") G.left++;
  }
  function explode(rg) {
    const p = rg.post;
    if (!p) return;
    const i = p.stack.indexOf(rg);
    if (i >= 0) p.stack.splice(i, 1);
    const j = rings.indexOf(rg);
    if (j >= 0) rings.splice(j, 1);
    const top = p.stack.splice(-2);
    top.forEach((r, k) => freeRing(r, rand(-120, 120), -240 - k * 40));
    p.wob = 1;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.time = MX(0, G.time - 3);
    G.shake = 16;
    G.flash = 0.7;
    sfx.bomb();
    burst(rg.x, rg.y, cC, 42, 1.7);
    burst(rg.x, rg.y, cA, 20, 1.2);
    popup(rg.x, rg.y - 30, "\xA1BOOM! -3s", cC, 22);
  }
  function grantCoil() {
    for (const p of posts) {
      p.coil = MN(4, p.coil + 2);
      popup(p.x, p.topY - 56, "PROTECTOR +2", cB, 20);
      burst(p.x, coilY(p), cB, 26, 1.4);
    }
    banner("PROTECTOR x2");
    sfx.perfect();
  }
  function zap(m, p) {
    if (m.mode === "dead") return;
    zaps.push({ x1: p.x, y1: coilY(p), x2: m.x, y2: m.y, life: 0.38 });
    m.mode = "dead";
    m.deadT = 0.7;
    if (m.kind === "puffer") G.pufs++;
    G.kills.push(m.kind);
    G.score += 300;
    G.shake = MX(G.shake, 9);
    G.flash = 0.45;
    const g = R() * 3 | 0;
    G.time = MN(99, G.time + g);
    popup(m.x, m.y - 38, "+300 \xA1ZAP! +" + g + "s", cB, 19);
    burst(m.x, m.y, cD, 30, 1.5);
    sfx.zap();
  }
  function loseTime(sec, text) {
    G.time = MX(0, G.time - sec);
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    popup(L.tank.x + L.tank.w / 2, L.tank.y + 90, text, cE, 22);
  }
  function gameOver() {
    if (G.scene !== "play") return;
    G.scene = "over";
    G.newBest = G.score > G.best;
    if (G.newBest) {
      G.best = G.score;
      try {
        localStorage.setItem("aqua_best", "" + G.score);
      } catch (e) {
      }
    }
    sfx.over();
  }
  function chooseMonster() {
    const pool = G.wave < 3 ? ["crab", "crab"] : G.wave < 5 ? ["crab", "crab", "shark"] : ["crab", "shark", "shark"];
    return pick(pool);
  }
  var MONSTER_NAME = { crab: "CANGREJO", puffer: "PEZ GLOBO", shark: "TIBUR\xD3N" };
  function spawnMonster(kind) {
    const t = L.tank;
    const target = posts[0].stack.length >= posts[1].stack.length ? posts[0] : posts[1];
    const m = {
      kind,
      mode: "walk",
      x: target.x < t.x + t.w / 2 ? t.x + 24 : t.x + t.w - 24,
      y: L.sandY - 18,
      dir: 0,
      ph: rand(0, TAU),
      post: target,
      eatT: 0,
      eats: 0,
      deadT: 0,
      hit: false,
      baseY: 0,
      sp: 1
    };
    m.dir = m.x < target.x ? 1 : -1;
    if (kind === "puffer" || kind === "shark") {
      const left = R() < 0.5;
      m.x = left ? t.x - 60 : t.x + t.w + 60;
      m.dir = left ? 1 : -1;
      m.baseY = waterY() + (kind === "shark" ? rand(34, 66) : rand(50, 110));
      m.y = m.baseY;
      m.sp = kind === "shark" ? 290 : 96;
    }
    monsters.push(m);
    banner(kind === "shark" ? "\xA1TIBUR\xD3N!" : kind === "crab" ? "\xA1CANGREJO LADR\xD3N!" : "\xA1PEZ GLOBO!");
    G.shake = MX(G.shake, 10);
    G.flash = 0.2;
    if (kind === "shark") sfx.shark();
    else sfx.crab();
  }
  function waveClear() {
    const bonus = 500 * G.wave + Math.round(G.time * 10);
    G.score += bonus;
    G.waveDelay = 0.45;
    banner("OLEADA " + G.wave + " COMPLETA +" + bonus);
    sfx.wave();
    posts.forEach((p) => {
      p.stack.length = 0;
      p.coil = 0;
      p.wob = 0;
    });
    rings.length = 0;
    monsters.length = 0;
    G.left = 0;
    loot.length = 0;
    G.monsterT = 999;
    G.warn = 0;
  }
  function togglePause() {
    if (G.scene !== "play") return;
    G.paused = !G.paused;
    if (G.paused) {
      G.chargeL = 0;
      G.chargeR = 0;
    }
  }

  // src/game.js
  var keys = {};
  function erupt(v, pw) {
    v.t = 1;
    v.pw = pw;
    const rad = 215 * pw;
    rings.forEach((rg) => {
      if (rg.mode !== "free") return;
      const dx = rg.x - v.x, dy = rg.y - (v.y - 24), d2 = HY(dx, dy) || 1;
      if (d2 < rad) {
        const p = 1 - d2 / rad;
        rg.vy -= p * 1500 * pw;
        rg.vx += dx / d2 * p * 660 * pw;
        rg.va += (R() - 0.5) * 5 * p;
        rg.flat = MX(0.06, rg.flat - p * 0.35);
      }
    });
  }
  function startCharge(side) {
    if (G.scene !== "play" || G.paused || G.wave > 1) return;
    if (G.jets < 1) {
      sfx.click();
      return;
    }
    if (side === "L") {
      if (G.chargeL <= 0) {
        G.chargeL = 0.02;
        sfx.charge();
      }
    } else {
      if (G.chargeR <= 0) {
        G.chargeR = 0.02;
        sfx.charge();
      }
    }
  }
  function release(side) {
    if (side === "L" && G.chargeL > 0) {
      const c = G.chargeL;
      G.chargeL = 0;
      fireJet("L", c);
    }
    if (side === "R" && G.chargeR > 0) {
      const c = G.chargeR;
      G.chargeR = 0;
      fireJet("R", c);
    }
  }
  function fireJet(side, charge) {
    if (G.scene !== "play" || G.paused) return;
    if (G.jets < 1) {
      sfx.click();
      return;
    }
    const onLeft = side === "L";
    const cand = L.volcanoes.filter((v2) => onLeft ? v2.x < L.W / 2 : v2.x >= L.W / 2);
    const pool = cand.length ? cand : L.volcanoes;
    if (!pool.length) {
      sfx.click();
      return;
    }
    pool.sort((a, b) => onLeft ? a.x - b.x : b.x - a.x);
    const v = pool.find((o) => o.t <= 0) || pool[0];
    const pw = MN(2.3, 1 + charge * 1.6);
    erupt(v, pw);
    G.jets--;
    G.jetT = 0;
    sfx.jet(pw);
    G.shake = MX(G.shake, 3 + pw * 3);
    const emberCols = [cA, "#ff8a5c", cC];
    const dir = v.x < L.W / 2 ? 1 : -1;
    for (let i = 0; i < 30 * pw; i++) parts.push({
      x: v.x + rand(-12, 12),
      y: v.y - 24,
      vx: rand(-85, 85) * pw + dir * 130 * pw,
      vy: rand(-560, -280) * pw,
      r: rand(1.4, 4.2),
      col: emberCols[R() * 3 | 0],
      life: 1
    });
    monsters.forEach((m) => {
      if (m.mode === "dead") return;
      if (A(m.x - v.x) < 205) {
        if (m.kind === "crab") {
          m.mode = "flee";
          m.dir = SG(m.x - v.x) || 1;
          popup(m.x, m.y - 30, "\xA1HUYE!", cA, 18);
        } else {
          m.stun = 1.4;
          m.dir = SG(m.x - v.x) || 1;
          popup(m.x, m.y - 30, "\xA1ATURDIDO!", cA, 18);
        }
        burst(m.x, m.y, cA, 14, 1);
        G.score += 80;
      }
    });
  }
  function absorbCannon() {
    if (G.scene !== "play" || G.paused || G.wave < 2 || G.can.length > 4) return;
    const cx = L.tank.x + 96, cy = L.sandY - 40;
    let best = null, bd = 1e9;
    for (const r of rings) {
      if (r.mode !== "free" || r.y < L.sandY - 150) continue;
      const d2 = HY(r.x - cx, r.y - cy);
      if (d2 < bd) {
        bd = d2;
        best = r;
      }
    }
    if (!best) {
      sfx.click();
      popup(cx, cy - 34, "\xA1NADA!", cK, 12);
      return;
    }
    rings.splice(rings.indexOf(best), 1);
    G.can.push(best);
    burst(cx, cy, cD, 12, 1);
    popup(cx, cy - 34, "GLUP " + G.can.length, cD, 15);
    sfx.clink(4);
  }
  function fireCannon() {
    if (G.scene !== "play" || G.paused || G.wave < 2 || !G.can.length) return;
    const a = G.canA, cx = L.tank.x + 96, cy = L.sandY - 34;
    const mx = cx + C(a) * 46, my = cy - S(a) * 46;
    erupt({ x: mx, y: my + 24, t: 0 }, 1.4);
    while (G.can.length) {
      const rg = G.can.pop(), aa = a + rand(-0.05, 0.05), sp = 900 + rand(0, 120);
      rings.push(Object.assign(rg, {
        x: mx,
        y: my,
        vx: C(aa) * sp,
        vy: -S(aa) * sp,
        va: rand(-4, 4),
        ang: R() * TAU,
        flat: 0.2,
        mode: "free",
        ct: 0,
        post: null,
        fuse: 0,
        perfect: false
      }));
    }
    sfx.jet(1.5);
    G.shake = MX(G.shake, 6);
    burst(mx, my, cA, 18, 1.2);
    popup(mx, my - 20, "\xA1FUEGO!", cA, 15);
  }
  function begin() {
    initAudio();
    startGame();
    musicStart();
  }
  function toCanvas(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * L.W / r.width, y: (e.clientY - r.top) * L.H / r.height };
  }
  function bindInput() {
    let aiming = 0, py = 0;
    window.addEventListener("keydown", (e) => {
      initAudio();
      const k = e.code;
      keys[k] = true;
      if (k === "KeyM") {
        G.muted = toggleMute();
        return;
      }
      if (G.scene === "menu" || G.scene === "over") {
        if (k === "Space" || k === "Enter" || G.scene === "over" && k === "KeyR") begin();
        else if (G.scene === "over" && k === "Escape") G.scene = "menu";
        e.preventDefault();
        return;
      }
      if (k === "KeyP" || k === "Escape") {
        togglePause();
        if (G.paused) musicStop();
        else musicStart();
        return;
      }
      if (k === "KeyE") {
        absorbCannon();
        e.preventDefault();
      }
      if (k === "KeyF") {
        fireCannon();
        e.preventDefault();
      }
      if (k === "KeyR") {
        begin();
        return;
      }
      if (k === "KeyA" || k === "KeyD") {
        if (!e.repeat) startCharge(k === "KeyA" ? "L" : "R");
        e.preventDefault();
      }
      if (k.startsWith("Arrow") || k === "Space") e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      keys[e.code] = false;
      if (e.code === "KeyA") release("L");
      if (e.code === "KeyD") release("R");
    });
    window.addEventListener("blur", () => {
      for (const k in keys) keys[k] = false;
    });
    cv.addEventListener("pointerdown", (e) => {
      initAudio();
      const p = toCanvas(e);
      if (G.scene === "menu" || G.scene === "over") {
        begin();
        return;
      }
      if (G.paused) {
        togglePause();
        musicStart();
        return;
      }
      if (p.x > L.W - 74 && p.y < 74) {
        togglePause();
        musicStop();
        return;
      }
      if (G.wave < 2) {
        if (p.x < L.W / 2) startCharge("L");
        else startCharge("R");
      } else {
        aiming = 1;
        py = p.y;
        if (p.x < L.W / 2) absorbCannon();
        else fireCannon();
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (!aiming || G.wave < 2) return;
      const p = toCanvas(e);
      G.canA = clamp(G.canA + (py - p.y) * 0.012, 0.75, 1.55);
      py = p.y;
    });
    const up = () => {
      aiming = 0;
      release("L");
      release("R");
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", up);
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
    loseTime(4, "\xA1TIBUR\xD3N! -4s");
    G.shake = 20;
    G.flash = 0.6;
    sfx.bomb();
  }
  function updateRings(dt) {
    const wy = waterY(), tank = L.tank, bottom = L.sandY - 12;
    for (let i = rings.length - 1; i >= 0; i--) {
      const rg = rings[i];
      if (rg.mode === "catch") {
        rg.ct = MN(1, rg.ct + dt * 3.2);
        const k = rg.ct;
        const a = MN(1, k / 0.4), ea = 1 - PW(1 - a, 3);
        rg.x = rg.sx + (rg.tx - rg.sx) * ea;
        rg.flat = MN(1, rg.flat + dt * 4.5);
        rg.ang *= PW(0.82, dt * 60);
        rg.scale = 1 + 0.2 * Math.sin(Math.PI * MN(1, k / 0.55));
        const d2 = clamp((k - 0.4) / 0.6, 0, 1), ed = d2 * d2 * (3 - 2 * d2);
        rg.y = rg.sy + (rg.ty - rg.sy) * ed;
        if (k >= 1) {
          rg.scale = 1;
          stackDone(rg);
        }
        continue;
      }
      if (rg.mode === "stacked") {
        if (rg.kind === "bomb") {
          rg.fuse -= dt;
          if (rg.fuse <= 0) explode(rg);
        }
        continue;
      }
      if (rg.mode !== "free") continue;
      const wet = rg.y > wy;
      const onFloor = rg.y >= bottom - 2;
      rg.vy += (wet ? 560 : 1080) * dt;
      rg.vx += (G.tilt * (onFloor ? 650 : 430) + S(G.t * 1.15 + rg.ang) * 16) * dt;
      rg.vx *= MX(0, 1 - (wet ? 2.8 : 0.18) * dt);
      rg.vy *= MX(0, 1 - (wet ? 2.5 : 0.1) * dt);
      rg.vx = clamp(rg.vx, -720, 720);
      rg.vy = clamp(rg.vy, -1e3, 900);
      rg.x += rg.vx * dt;
      rg.y += rg.vy * dt;
      rg.ang += rg.va * dt;
      rg.va *= PW(0.25, dt);
      rg.flat += ((wet ? 0.52 : 0.14) - rg.flat) * MN(1, dt * 5);
      rg.flat = clamp(rg.flat, 0.06, 0.92);
      const m = rg.r + 6;
      if (rg.x < tank.x + m) {
        rg.x = tank.x + m;
        rg.vx = A(rg.vx) * 0.45;
      }
      if (rg.x > tank.x + tank.w - m) {
        rg.x = tank.x + tank.w - m;
        rg.vx = -A(rg.vx) * 0.45;
      }
      if (rg.y < tank.y + 26) {
        rg.y = tank.y + 26;
        rg.vy = A(rg.vy) * 0.3;
      }
      if (rg.y > bottom) {
        rg.y = bottom;
        rg.vy = -A(rg.vy) * 0.26;
        rg.vx *= 0.86;
      }
      for (let j = 0; j < i; j++) {
        const o = rings[j];
        if (o.mode !== "free") continue;
        const dx = o.x - rg.x, dy = o.y - rg.y, d2 = HY(dx, dy), min = rg.r * 1.3;
        if (d2 < min && d2 > 0.01) {
          const p = (min - d2) * 0.5, nx = dx / d2, ny = dy / d2;
          rg.x -= nx * p;
          rg.y -= ny * p;
          o.x += nx * p;
          o.y += ny * p;
        }
      }
      for (const p of posts) {
        const dx = rg.x - p.x;
        if (p.stack.length < 18 && rg.y > p.topY - 8 && rg.y < p.topY + 44 && rg.vy > 30 && A(dx) < 14) {
          if (catchRing(rg, p)) break;
        }
        if (rg.y > p.topY && rg.y < p.botY && A(dx) < rg.r + p.r) {
          const s = SG(dx) || 1;
          rg.x = p.x + s * (rg.r + p.r);
          rg.vx *= -0.42;
          rg.va += rand(-1.5, 1.5);
        }
      }
    }
  }
  function updateMonsters(dt) {
    const t = L.tank, mid = t.x + t.w / 2;
    for (const p of posts) if (p.coil) {
      let h = 0;
      for (const m of monsters) if (m.mode !== "dead" && m.kind !== "crab" && HY(m.x - p.x, m.y - coilY(p)) < 480) zap(m, p), h = 1;
      if (h) p.coil--, p.zapT = 0.45;
    }
    for (let i = monsters.length - 1; i >= 0; i--) {
      const m = monsters[i];
      if (m.mode === "dead") {
        m.deadT -= dt;
        if (m.deadT <= 0) monsters.splice(i, 1);
        continue;
      }
      if (m.mode === "flee") {
        m.x += m.dir * 220 * dt;
        m.y -= 34 * dt;
        m.ph += dt * 6;
        if (m.x < t.x - 150 || m.x > t.x + t.w + 150 || m.y < t.y - 100) monsters.splice(i, 1);
        continue;
      }
      if (m.stun > 0) {
        m.stun -= dt;
        m.x += m.dir * 80 * dt;
        m.ph += dt * 4;
        if (m.x < t.x - 160 || m.x > t.x + t.w + 160) monsters.splice(i, 1);
        continue;
      }
      if (m.kind === "crab") {
        if (m.mode === "walk") {
          if (!m.post.stack.length) {
            const o = posts.find((p) => p !== m.post && p.stack.length);
            if (o) m.post = o;
            else {
              m.mode = "flee";
              m.dir = SG(m.x - mid) || 1;
              continue;
            }
          }
          const dx = m.post.x - m.x;
          m.x += SG(dx) * 76 * dt;
          m.y += (L.sandY - 20 - m.y) * MN(1, dt * 5);
          m.ph += dt * 8;
          if (A(dx) < 12) m.mode = "climb";
        } else if (m.mode === "climb") {
          const st = m.post.stack;
          const top = st.length ? st[st.length - 1].y : m.post.topY + 50;
          m.x += (m.post.x - m.x) * MN(1, dt * 9);
          m.y += (top + 9 - m.y) * MN(1, dt * 3.6);
          m.ph += dt * 10;
          if (A(m.y - (top + 9)) < 9) {
            m.mode = "eat";
            m.eatT = 0.35;
          }
        } else if (m.mode === "eat") {
          m.eatT -= dt;
          m.ph += dt * 10;
          if (m.eatT <= 0) {
            m.eatT = 0.72;
            m.y += 9;
            const st = m.post.stack;
            if (st.length) {
              const r = st.pop();
              r.mode = "hold";
              r.lootT = 2;
              const j = rings.indexOf(r);
              if (j >= 0) rings.splice(j, 1);
              loot.push(r);
              popup(m.x, m.y - 24, "\xA1ROBADO!", cG, 16);
              burst(m.x, m.y, cG, 10, 1);
              sfx.pop();
              G.time = MX(0, G.time - 1);
              popup(L.W - 46, 76, "-1s", cC, 17);
              burst(L.W - 46, 60, cC, 6, 0.8);
              G.shake = MX(G.shake, 5);
              m.eats++;
              if (m.eats >= 3) {
                m.mode = "flee";
                m.dir = SG(m.x - mid) || 1;
              }
            } else {
              m.mode = "flee";
              m.dir = SG(m.x - mid) || 1;
            }
          }
        }
      } else if (m.kind === "puffer") {
        m.x += m.dir * m.sp * dt;
        m.ph += dt * 4;
        m.y = m.baseY + S(m.ph) * 22;
        let nd = 1e9;
        for (const p of posts) nd = MN(nd, A(m.x - p.x));
        m.inf = clamp(1 - nd / 320, 0, 1);
        for (const p of posts) {
          if (A(m.x - p.x) < 30) {
            ejectTop(p, 1 + (R() * 2 | 0), 150, -240);
            G.shake = 14;
            G.flash = 0.25;
            sfx.bomb();
            G.pufs++;
            const g = R() * 3 | 0;
            G.time = MN(99, G.time + g);
            popup(p.x, p.topY - 12, "\xA1GLOBO! +" + g + "s", cP, 19);
            burst(p.x, p.topY + 30, cP, 26, 1.3);
            m.mode = "dead";
            m.deadT = 0.55;
            break;
          }
        }
        if (m.x < t.x - 120 || m.x > t.x + t.w + 120) monsters.splice(i, 1);
      } else {
        m.x += m.dir * m.sp * dt;
        m.ph += dt * 5;
        m.y = m.baseY + S(m.ph) * 8;
        if (!m.hit) {
          for (const p of posts) {
            if (A(m.x - p.x) < 34) {
              m.hit = true;
              breakPost(p);
              break;
            }
          }
        }
        if (m.x < t.x - 160 || m.x > t.x + t.w + 160) monsters.splice(i, 1);
      }
    }
  }
  function updateAmbient(dt) {
    const t = L.tank;
    fish.forEach((f) => {
      f.x += f.vx * dt;
      f.ph += dt * 2.8;
      if (f.x < t.x + 30) {
        f.x = t.x + 30;
        f.vx = A(f.vx);
      }
      if (f.x > t.x + t.w - 30) {
        f.x = t.x + t.w - 30;
        f.vx = -A(f.vx);
      }
      f.y += S(f.ph) * 6 * dt;
    });
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.x += (b.vx || 0) * dt + S(G.t * 2 + b.ph) * 7 * dt;
      b.y += (b.vy === void 0 ? -b.sp : b.vy) * dt;
      if (b.vy !== void 0) b.vy *= PW(0.35, dt);
      if (b.life !== void 0) {
        b.life -= dt * 0.75;
        if (b.life <= 0) {
          bubbles.splice(i, 1);
          continue;
        }
      }
      if (b.y < waterY() + 2 || b.y < t.y + 8) {
        if (b.life !== void 0) {
          bubbles.splice(i, 1);
          continue;
        }
        b.y = L.sandY - rand(0, 26);
        b.x = rand(t.x + 14, t.x + t.w - 14);
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 760 * dt;
      p.life -= dt * 1.7;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.y -= 44 * dt;
      p.life -= dt * 1.15;
      if (p.life <= 0) pops.splice(i, 1);
    }
    for (let i = zaps.length - 1; i >= 0; i--) {
      zaps[i].life -= dt;
      if (zaps[i].life <= 0) zaps.splice(i, 1);
    }
    posts.forEach((p) => {
      if (p.wob > 0) p.wob *= PW(0.015, dt);
      if (p.zapT > 0) p.zapT -= dt;
    });
    for (const v of L.volcanoes) {
      if (v.t > 0) {
        v.t -= dt / 1.4;
        if (v.t < 0) v.t = 0;
      }
    }
  }
  function update(dt) {
    dt = MN(dt, 0.033);
    G.t += dt;
    G.shake *= PW(0.02, dt);
    G.flash *= PW(0.01, dt);
    if (G.bannerT > 0) G.bannerT -= dt;
    updateAmbient(dt);
    if (G.scene !== "play" || G.paused) return;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    if (G.chargeL > 0) G.chargeL = MN(1, G.chargeL + dt / 1.15);
    if (G.chargeR > 0) G.chargeR = MN(1, G.chargeR + dt / 1.15);
    if (keys.KeyW) G.canA = MN(1.55, G.canA + 1.4 * dt);
    if (keys.KeyS) G.canA = MX(0.75, G.canA - 1.4 * dt);
    G.jetT += dt;
    if (G.jetT > 1.7 && G.jets < 3) {
      G.jets++;
      G.jetT = 0;
    }
    let tt = 0;
    if (keys.ArrowLeft) tt--;
    if (keys.ArrowRight) tt++;
    G.tiltT = tt;
    G.tilt += (G.tiltT - G.tilt) * MN(1, dt * 7);
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
          banner("\xA1" + MONSTER_NAME[G.warnKind] + "!");
          sfx.crab();
        }
      }
    }
    if (G.pumpT > 0) G.pumpT -= dt;
    else {
      for (let i = MN(2, 1 + G.pufs); i--; ) spawnMonster("puffer");
      G.pumpT = G.hard ? 7 : 10;
    }
    updateRings(dt);
    updateMonsters(dt);
    if (G.kills.length) {
      const k = G.kills[0];
      for (let i = 2; i-- && monsters.length < 12; ) spawnMonster(k);
      G.kills.length = 0;
    }
    for (let i = loot.length - 1; i >= 0; i--) {
      const r = loot[i];
      r.lootT -= dt;
      if (r.lootT > 0) continue;
      r.mode = "free";
      r.post = null;
      r.x = rand(L.tank.x + 80, L.tank.x + L.tank.w - 80);
      r.y = L.sandY - 60;
      r.vx = rand(-40, 40);
      r.vy = -80;
      r.flat = 0.3;
      r.va = rand(-2, 2);
      rings.push(r);
      G.left++;
      loot.splice(i, 1);
      popup(r.x, r.y - 20, "\xA1DE VUELTA!", cG, 16);
    }
    if (G.waveDelay > 0) {
      G.waveDelay -= dt;
      if (G.waveDelay <= 0) startWave(G.wave + 1);
    } else if (G.left === 0 && !rings.some((r) => r.kind === "bomb" && r.mode === "stacked")) {
      waveClear();
    } else {
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        gameOver();
      }
    }
  }

  // src/render.js
  var X = null;
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
  function fr(x, y, w, h, r, col) {
    rr(x, y, w, h, r);
    X.fillStyle = col;
    X.fill();
  }
  function d(x, y, r, col) {
    X.beginPath();
    X.arc(x, y, r, 0, TAU);
    X.fillStyle = col;
    X.fill();
  }
  function el(x, y, rx, ry, col, rot = 0) {
    X.beginPath();
    X.ellipse(x, y, rx, ry, rot, 0, TAU);
    X.fillStyle = col;
    X.fill();
  }
  function ln(x1, y1, x2, y2, col, w = 1) {
    X.strokeStyle = col;
    X.lineWidth = w;
    X.beginPath();
    X.moveTo(x1, y1);
    X.lineTo(x2, y2);
    X.stroke();
  }
  function txt(s, x, y, size, col, align = "center") {
    X.font = "bold " + size + "px monospace";
    X.textAlign = align;
    X.textBaseline = "middle";
    X.fillStyle = "#001018";
    X.fillText(s, x + 2, y + 2);
    X.shadowColor = col;
    X.shadowBlur = 8;
    X.fillStyle = col;
    X.fillText(s, x, y);
    X.shadowBlur = 0;
  }
  function glowDisc(x, y, r, a, b) {
    X.save();
    X.globalCompositeOperation = "lighter";
    const g = X.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, a);
    g.addColorStop(0.55, b);
    g.addColorStop(1, "rgba(0,0,0,0)");
    X.fillStyle = g;
    X.beginPath();
    X.arc(x, y, r, 0, TAU);
    X.fill();
    X.restore();
  }
  var hs = (h, s, l) => "hsl(" + h + "," + s + "%," + l + "%)";
  function draw() {
    X = cv.getContext("2d");
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.clearRect(0, 0, L.W, L.H);
    const bg = X.createRadialGradient(L.W / 2, L.H * 0.35, 60, L.W / 2, L.H * 0.55, L.W * 0.82);
    bg.addColorStop(0, "#0b2536");
    bg.addColorStop(0.55, "#05101a");
    bg.addColorStop(1, "#02060a");
    X.fillStyle = bg;
    X.fillRect(0, 0, L.W, L.H);
    drawTank();
    drawHUD();
    if (G.scene === "menu") drawMenu();
    if (G.scene === "over") drawOver();
    if (G.paused && G.scene === "play") drawPause();
  }
  function drawTank() {
    const t = L.tank;
    X.save();
    const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
    X.translate(cx, cy);
    X.rotate(G.tilt * 0.085);
    X.translate(-cx, -cy);
    const bg = X.createLinearGradient(0, t.y, 0, t.y + t.h);
    X.filter = "hue-rotate(" + (G.wave - 1) * 42 + "deg)";
    bg.addColorStop(0, "#0d4f6a");
    bg.addColorStop(0.5, "#08364a");
    bg.addColorStop(1, "#03121c");
    X.fillStyle = bg;
    X.fillRect(t.x, t.y, t.w, t.h);
    X.globalAlpha = 0.07;
    X.fillStyle = cM;
    for (let i = 0; i < 4; i++) {
      const x = t.x + t.w * (0.16 + i * 0.23) + S(G.t * 0.2 + i) * 20;
      X.beginPath();
      X.moveTo(x - 26, t.y);
      X.lineTo(x + 26, t.y);
      X.lineTo(x + 84, L.sandY);
      X.lineTo(x - 40, L.sandY);
      X.fill();
    }
    X.globalAlpha = 1;
    X.filter = "none";
    drawSand(t);
    drawWeeds();
    drawCorals();
    drawFish();
    posts.forEach(drawPost);
    rings.forEach(drawRing);
    const wy = waterY();
    const wg = X.createLinearGradient(0, wy, 0, t.y + t.h);
    wg.addColorStop(0, "rgba(80,235,225,.09)");
    wg.addColorStop(0.45, "rgba(28,150,190,.16)");
    wg.addColorStop(1, "rgba(4,60,100,.34)");
    X.fillStyle = wg;
    X.fillRect(t.x, wy, t.w, t.y + t.h - wy);
    drawSurface(wy, t);
    monsters.forEach(drawMonster);
    posts.forEach(drawCoil);
    drawZaps();
    drawBubbles();
    drawParts();
    drawVolcanoes();
    drawCannon();
    X.restore();
    drawPops();
  }
  function drawSand(t) {
    X.beginPath();
    X.moveTo(t.x, L.sandY + 20);
    X.bezierCurveTo(t.x + t.w * 0.22, L.sandY - 24, t.x + t.w * 0.4, L.sandY + 24, t.x + t.w * 0.62, L.sandY - 5);
    X.bezierCurveTo(t.x + t.w * 0.8, L.sandY - 24, t.x + t.w * 0.92, L.sandY + 10, t.x + t.w, L.sandY + 3);
    X.lineTo(t.x + t.w, t.y + t.h);
    X.lineTo(t.x, t.y + t.h);
    X.closePath();
    const g = X.createLinearGradient(0, L.sandY - 20, 0, t.y + t.h);
    g.addColorStop(0, "#d8b878");
    g.addColorStop(0.35, "#b08b52");
    g.addColorStop(1, "#5b4026");
    X.fillStyle = g;
    X.fill();
    X.globalAlpha = 0.5;
    const dh = (G.wave - 1) * 31;
    gravel.forEach((s) => d(s.x, s.y, s.r, hs(s.col + dh, 45, 58)));
    X.globalAlpha = 1;
  }
  function drawWeeds() {
    const dh = (G.wave - 1) * 31;
    weeds.forEach((w) => {
      X.strokeStyle = hs(w.col + dh, 55, 45);
      X.lineWidth = w.w;
      X.lineCap = "round";
      X.beginPath();
      X.moveTo(w.x, L.sandY + 10);
      let px = w.x, py = 0;
      for (let k = 1; k <= 4; k++) {
        const yy = L.sandY + 10 - w.h * k / 4;
        const xx = w.x + S(G.t * 1.2 + w.ph + k * 0.7) * w.h * 0.05 * k;
        X.lineTo(xx, yy);
        if (k > 1) el((xx + px) / 2, yy, 9, 3, w.col, 0.5 * (k % 2 ? 1 : -1));
        px = xx;
        py = yy;
      }
      X.stroke();
    });
  }
  function drawCorals() {
    const dh = (G.wave - 1) * 31;
    corals.forEach((c) => {
      X.strokeStyle = hs(c.col + dh, 70, 60);
      X.lineWidth = 5;
      X.lineCap = "round";
      for (let b = -1; b <= 1; b++) {
        const bx = c.x + b * 11;
        X.beginPath();
        X.moveTo(bx, L.sandY + 8);
        X.quadraticCurveTo(bx + b * 9, L.sandY - c.h * 0.55, bx + b * 22, L.sandY - c.h);
        X.stroke();
        d(bx + b * 22, L.sandY - c.h, 5, c.col);
      }
    });
  }
  function drawFish() {
    const dh = (G.wave - 1) * 31;
    fish.forEach((f) => {
      const len = f.len, hh = len * 0.46, wag = S(f.ph) * 0.3;
      X.save();
      X.translate(f.x, f.y);
      X.scale(f.vx < 0 ? -1 : 1, 1);
      X.globalAlpha = 0.16;
      el(0, hh + 8, len * 0.8, 3, "#000");
      X.globalAlpha = 1;
      X.fillStyle = hs(f.fin + dh, 75, 68);
      X.beginPath();
      X.moveTo(-len * 0.6, 0);
      X.quadraticCurveTo(-len * 1.4, -hh + wag * 9, -len * 1.1, 0);
      X.quadraticCurveTo(-len * 1.4, hh + wag * 9, -len * 0.6, 0);
      X.fill();
      el(0, 0, len, hh, hs(f.col + dh, 70, 62));
      el(-len * 0.1, -hh * 0.82, len * 0.34, hh * 0.5, hs(f.fin + dh, 75, 68), 0.4);
      d(len * 0.55, -hh * 0.16, len * 0.15, "#f2feff");
      d(len * 0.59, -hh * 0.16, len * 0.07, "#04101a");
      X.restore();
    });
  }
  function drawSurface(wy, t) {
    X.save();
    X.globalAlpha = 0.45;
    X.strokeStyle = cM;
    X.lineWidth = 2;
    X.beginPath();
    for (let x = t.x; x <= t.x + t.w; x += 10) {
      const y = wy + S(x * 0.045 + G.t * 1.5) * 4 + S(x * 0.012 - G.t) * 2;
      x === t.x ? X.moveTo(x, y) : X.lineTo(x, y);
    }
    X.stroke();
    X.globalAlpha = 0.13;
    X.strokeStyle = "#7cf7d8";
    X.lineWidth = 8;
    X.stroke();
    X.restore();
  }
  function drawPost(p) {
    X.save();
    X.translate(p.x + S(G.t * 55) * p.wob * 6, 0);
    el(0, p.botY, 12, 5, "#4a2030");
    const g = X.createLinearGradient(-5, 0, 5, 0);
    g.addColorStop(0, "#5a2a3d");
    g.addColorStop(0.35, "#ff9a6a");
    g.addColorStop(0.62, "#d9554d");
    g.addColorStop(1, "#4a2030");
    fr(-5, p.topY, 10, p.botY - p.topY, 5, g);
    X.globalAlpha = 0.35;
    for (let y = p.topY + 34; y < p.botY - 10; y += 58) fr(-6, y, 12, 3, 2, cA);
    X.globalAlpha = 1;
    el(0, p.topY, 8, 4, cA);
    el(-2, p.topY - 1.5, 5, 2.1, "#fff3b0");
    p.stack.forEach((r, i) => drawRingAt(0, p.botY - 8 - i * 11, r.r, r.col, 0, 1, r.kind, r));
    X.restore();
  }
  function drawRingAt(x, y, r, col, ang, flat, kind, rg) {
    X.save();
    X.translate(x, y);
    X.rotate(ang);
    const sc = rg.scale || 1;
    X.scale(sc, (1 - 0.66 * flat) * sc);
    if (kind === "gold") {
      X.shadowColor = cA;
      X.shadowBlur = 16;
    }
    d(0, 0, r, col);
    X.shadowBlur = 0;
    X.globalAlpha = 0.55;
    d(0, 0, r * 0.5, "#0a1a26");
    X.globalAlpha = 1;
    X.strokeStyle = "rgba(255,255,255,.6)";
    X.lineWidth = 2.2;
    X.beginPath();
    X.arc(0, 0, r * 0.83, PI * 1.02, PI * 1.72);
    X.stroke();
    if (kind === "bomb") {
      const fast = rg && rg.fuse > 0 && rg.fuse < 1.2;
      d(0, 0, r * 0.68, "#210a12");
      if (S(G.t * (fast ? 22 : 8)) > -0.2) d(0, 0, r * 0.46, fast ? "#ffc2c2" : cC);
      d(0, 0, r * 0.18, "#120609");
    }
    X.restore();
    if (!ang) {
      X.globalAlpha = 0.2;
      el(x, y + 3, r * 0.9, 3, col);
      X.globalAlpha = 1;
    }
  }
  function drawRing(rg) {
    drawRingAt(rg.x, rg.y, rg.r, rg.col, rg.ang, rg.flat, rg.kind, rg);
  }
  function drawCoil(p) {
    const x = p.x, y = coilY(p), on = p.coil > 0;
    fr(x - 11, y + 11, 22, 18, 5, "#0d2a36");
    X.strokeStyle = "#2f7186";
    X.lineWidth = 2;
    rr(x - 11, y + 11, 22, 18, 5);
    X.stroke();
    glowDisc(
      x,
      y,
      on ? 50 : 20,
      on ? "rgba(210,255,250,.85)" : "rgba(60,100,110,.35)",
      on ? "rgba(94,242,214,.3)" : "rgba(60,100,110,.08)"
    );
    d(x, y, 8.5, on ? cI : "#375a63");
    d(x, y, 4.6, on ? cB : "#1c3a44");
    if (on) {
      X.strokeStyle = cD;
      X.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = G.t * 5 + i * 2.1;
        X.beginPath();
        X.moveTo(x + C(a) * 9, y + S(a) * 9);
        X.lineTo(x + C(a + 0.5) * 18, y + S(a + 0.5) * 18);
        X.lineTo(x + C(a + 0.2) * 26, y + S(a + 0.2) * 26);
        X.stroke();
      }
    }
    for (let i = 0; i < 4; i++) d(x - 14 + i * 9.3, y + 22, 2.4, i < p.coil ? cB : "#24444e");
  }
  function drawZaps() {
    zaps.forEach((z) => {
      X.save();
      X.globalCompositeOperation = "lighter";
      X.globalAlpha = clamp(z.life / 0.38, 0, 1);
      for (let pass = 0; pass < 2; pass++) {
        X.strokeStyle = pass ? "#fff" : cB;
        X.lineWidth = pass ? 1.5 : 5;
        X.beginPath();
        X.moveTo(z.x1, z.y1);
        for (let i = 1; i < 8; i++) {
          const k = i / 8, j = (R() - 0.5) * 30 * (1 - k);
          X.lineTo(z.x1 + (z.x2 - z.x1) * k + j, z.y1 + (z.y2 - z.y1) * k + j);
        }
        X.lineTo(z.x2, z.y2);
        X.stroke();
      }
      X.restore();
    });
  }
  function drawBubbles() {
    X.strokeStyle = cM;
    X.lineWidth = 1.2;
    bubbles.forEach((b) => {
      X.globalAlpha = 0.25 + S(G.t * 3 + b.ph) * 0.1;
      X.beginPath();
      X.arc(b.x, b.y, b.r, 0, TAU);
      X.stroke();
    });
    X.globalAlpha = 1;
  }
  function drawParts() {
    parts.forEach((p) => {
      X.globalAlpha = clamp(p.life, 0, 1);
      d(p.x, p.y, p.r, p.col);
    });
    X.globalAlpha = 1;
  }
  function drawVolcanoes() {
    L.volcanoes.forEach((v) => {
      const pulse = 0.6 + S(G.t * 2.5) * 0.2;
      const glow = v.t > 0 ? 1 : pulse;
      const dir = v.x < L.W / 2 ? 1 : -1;
      const tilt = dir * 0.2 + (v.t > 0 ? S(G.t * 30) * 0.04 * v.t : 0);
      X.globalAlpha = 1;
      el(v.x, v.y, 30, 8, "#5a2a3d");
      X.save();
      X.translate(v.x, v.y);
      X.rotate(tilt);
      const g = X.createLinearGradient(-27, -22, 27, 0);
      g.addColorStop(0, "#3d1a2a");
      g.addColorStop(0.5, "#8a4a3a");
      g.addColorStop(1, "#2a0f1f");
      X.fillStyle = g;
      X.beginPath();
      X.moveTo(-28, 0);
      X.lineTo(-11, -22);
      X.lineTo(11, -22);
      X.lineTo(28, 0);
      X.closePath();
      X.fill();
      el(0, -22, 11, 4, "#1c0a14");
      glowDisc(0, -22, 28 * glow, v.t > 0 ? cA : cE, v.t > 0 ? "rgba(255,200,100,.6)" : "rgba(255,60,80,.4)");
      d(0, -22, 5 * glow, v.t > 0 ? cN : cC);
      X.restore();
      const cx = v.x + S(tilt) * 22, cy = v.y - C(tilt) * 22;
      X.globalAlpha = 0.4 + S(G.t * 3) * 0.2;
      for (let i = 0; i < 6; i++) {
        const a = G.t * 0.8 + i * 1.05;
        d(cx + C(a) * (9 + i * 2), cy - S(a * 2.7) * 11, 2 + S(a * 1.3) * 0.8, cA);
      }
      X.globalAlpha = 1;
      if (v.t > 0) {
        for (let i = 0; i < 22; i++) {
          const a = i / 22 * TAU + G.t;
          d(cx + C(a) * 16, cy - 4, 2 + S(a * 4) * 1.6, cC);
        }
      }
    });
  }
  function drawPops() {
    pops.forEach((p) => {
      X.globalAlpha = clamp(p.life, 0, 1);
      txt(p.text, p.x, p.y, p.size, p.col);
    });
    X.globalAlpha = 1;
  }
  function drawMonster(m) {
    X.save();
    X.filter = "hue-rotate(" + (G.wave - 1) * 47 % 360 + "deg)";
    X.translate(m.x, m.y);
    X.scale(m.dir, 1);
    if (m.mode === "dead") {
      X.globalAlpha = clamp(m.deadT / 0.7, 0, 1);
      if (m.kind !== "puffer") X.rotate((0.7 - m.deadT) * 7);
    }
    if (m.kind === "crab") {
      X.lineCap = "round";
      for (let i = -2; i <= 2; i++) {
        const sw = S(m.ph + i) * 4;
        ln(i * 6, 2, i * 12 + sw, 18, "#8e2b25", 3.5);
        ln(i * 6, 2, i * 14 - sw, 12, "#8e2b25", 3.5);
      }
      el(-21, -8 + S(m.ph * 2) * 2, 8, 8, cL);
      el(21, -8 + S(m.ph * 2) * 2, 8, 8, cL);
      el(0, 0, 20, 14, "#a82b25");
      el(0, -3, 19, 10, cL);
      [-1, 1].forEach((s) => {
        ln(s * 7, -10, s * 8, -18, "#7a2420", 2.5);
        d(s * 8, -19, 5, "#f5ffff");
        d(s * 9, -19, 2.4, cJ);
      });
    } else if (m.kind === "puffer") {
      const inf = m.inf || 0;
      if (m.mode === "dead") {
        const k = clamp(m.deadT / 0.55, 0.06, 1);
        X.scale((1 + inf * 0.5) * (1 + (1 - k) * 0.5), (1 + inf * 0.55) * k * k);
      } else if (inf) X.scale(1 + inf * 0.55, 1 + inf * 0.55);
      X.fillStyle = cG;
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU + S(m.ph) * 0.1, sp = 24 + inf * 12;
        X.beginPath();
        X.moveTo(C(a) * 18, S(a) * 18);
        X.lineTo(C(a + 0.16) * sp, S(a + 0.16) * sp);
        X.lineTo(C(a + 0.32) * 18, S(a + 0.32) * 18);
        X.fill();
      }
      d(0, 0, 23, cG);
      d(-5, -6, 13, "#ffe9a8");
      el(4, 9, 12, 7 + inf * 3.5, "#fff6d8");
      d(10, -6, 6 + inf * 3, "#fff");
      d(12, -6, 3 + inf * 1.4, cJ);
      X.strokeStyle = "#7a3a1a";
      X.lineWidth = 2;
      X.beginPath();
      X.arc(14, 4, 4 + inf * 4.5, 0.2, 1.4);
      X.stroke();
      el(-21, 0, 6, 10, cE, 0.3);
    } else {
      X.fillStyle = cE;
      X.beginPath();
      X.moveTo(-42, 0);
      X.lineTo(-58, -18);
      X.lineTo(-54, 0);
      X.lineTo(-58, 18);
      X.closePath();
      X.fill();
      X.fillStyle = "#5d8ca0";
      X.beginPath();
      X.moveTo(-48, 0);
      X.quadraticCurveTo(-20, -20, 22, -9);
      X.quadraticCurveTo(52, -2, 60, 6);
      X.quadraticCurveTo(18, 16, -20, 14);
      X.quadraticCurveTo(-40, 10, -48, 0);
      X.fill();
      X.beginPath();
      X.moveTo(-6, -12);
      X.lineTo(8, -32);
      X.lineTo(22, -10);
      X.fill();
      X.beginPath();
      X.moveTo(-2, 12);
      X.lineTo(12, 26);
      X.lineTo(26, 10);
      X.fill();
      el(10, 5, 30, 6, "#c7dde6");
      d(38, -5, 4, "#f5ffff");
      d(39, -5, 2, cJ);
      X.strokeStyle = "#fff";
      X.lineWidth = 2;
      for (let i = 0; i < 4; i++) ln(32 + i * 6, 8, 35 + i * 6, 13, "#fff", 2);
    }
    X.restore();
  }
  var pad = (n) => ("" + n).padStart(6, "0");
  function drawCannon() {
    if (G.wave < 2) return;
    const cx = L.tank.x + 96, cy = L.sandY - 34, a = G.canA;
    el(cx, cy + 2, 30, 6, "rgba(0,0,0,.4)");
    X.fillStyle = "#46536a";
    X.beginPath();
    X.arc(cx, cy, 15, Math.PI, 0);
    X.fill();
    fr(cx - 15, cy - 3, 30, 5, 2, "#232c3a");
    d(cx, cy, 5, "#101820");
    X.globalAlpha = 0.3;
    X.setLineDash([5, 7]);
    ln(cx, cy, cx + C(a) * 92, cy - S(a) * 92, cH, 2);
    X.setLineDash([]);
    X.globalAlpha = 1;
    X.save();
    X.translate(cx, cy);
    X.rotate(-a);
    fr(-4, -9, 48, 18, 8, "#5b6d87");
    fr(34, -9, 10, 18, 3, "#8aa2bd");
    X.restore();
    for (let i = 0; i < 5; i++) d(cx - 12 + i * 6, cy + 17, 2.2, i < G.can.length ? cH : "#151f29");
  }
  function drawHUD() {
    const hy = 10;
    const biting = monsters.some((mc) => mc.mode === "eat");
    fr(0, hy, L.W, 48, 12, "rgba(2,12,20,.78)");
    X.strokeStyle = "#2f7186";
    X.lineWidth = 1.5;
    rr(0, hy, L.W, 48, 12);
    X.stroke();
    txt("PUNTOS", 10, hy + 13, 10, cF, "left");
    txt(pad(G.score), 10, hy + 33, 24, "#eaffff", "left");
    txt("OLEADA " + G.wave + " \xB7 " + (G.hard ? "DIF\xCDCIL" : "NORMAL"), L.W / 2, hy + 15, 13, cA);
    txt("FALTAN " + G.left, L.W / 2, hy + 35, 9, cF);
    txt(Math.ceil(G.time) + "s", L.W - 10, hy + 16, 24, G.time < 10 || biting ? cC : cB, "right");
    txt("TIEMPO", L.W - 10, hy + 35, 9, cF, "right");
    txt("IMPULSO", 150, hy + 12, 8, cF, "left");
    for (let i = 0; i < 3; i++) d(158 + i * 20, hy + 30, 5, i < G.jets ? cA : "#1b3a44");
    const frac = clamp(G.time / G.maxTime, 0, 1);
    fr(2, hy + 50, L.W - 4, 6, 3, "#0b2634");
    fr(2, hy + 50, (L.W - 4) * frac, 6, 3, biting && S(G.t * 16) > 0 ? "#ff9db4" : frac < 0.22 ? cC : cB);
    if (G.combo > 1) txt("x" + G.mult, L.W - 30, hy + 84, 28, cA, "right");
    if (G.warn > 0) {
      X.strokeStyle = "rgba(255,60,90," + (0.3 + S(G.t * 22) * 0.16) + ")";
      X.lineWidth = 10;
      rr(5, 5, L.W - 10, L.H - 10, 20);
      X.stroke();
      txt("\xA1PELIGRO!", L.W / 2, 82, 24, cC);
      txt(MONSTER_NAME[G.warnKind] + " EN CAMINO", L.W / 2, 106, 12, cK);
    }
    if (G.bannerT > 0) {
      X.globalAlpha = clamp(G.bannerT * 1.5, 0, 1);
      txt(G.banner, L.W / 2, hy + 92, L.portrait ? 18 : 20, cA);
      X.globalAlpha = 1;
    }
  }
  function drawMenu() {
    X.fillStyle = "rgba(2,8,15,.74)";
    X.fillRect(0, 0, L.W, L.H);
    const cx = L.W / 2, cy = L.H * (L.portrait ? 0.2 : 0.22);
    X.font = "bold " + (L.portrait ? 68 : 86) + "px monospace";
    X.textAlign = "center";
    X.textBaseline = "middle";
    X.shadowColor = cB;
    X.shadowBlur = 26;
    const tg = X.createLinearGradient(0, cy - 48, 0, cy + 34);
    tg.addColorStop(0, "#ffffff");
    tg.addColorStop(0.42, cD);
    tg.addColorStop(0.56, "#0fa39c");
    tg.addColorStop(1, cI);
    X.fillStyle = tg;
    X.fillText("AQUARING", cx, cy);
    X.shadowBlur = 0;
    txt("M A R E A   V I V A", cx, cy + 54, 15, cH);
    const by = L.H * (L.portrait ? 0.46 : 0.48);
    if (S(G.t * 4) > -0.2) {
      fr(cx - 150, by, 300, 54, 14, "#082a33");
      X.strokeStyle = cB;
      X.lineWidth = 2;
      rr(cx - 150, by, 300, 54, 14);
      X.stroke();
      txt("PULSA START", cx, by + 20, 20, cI);
      txt(L.portrait ? "TOCA PARA JUGAR" : "ESPACIO / ENTER", cx, by + 39, 9, "#7fc4cc");
    }
    const ly = by + (L.portrait ? 96 : 88);
    txt("A/D: ERUPCI\xD3N (OLEADA 1)", cx, ly + 17, 9, cH);
    txt("W/S \xC1NGULO \xB7 E ABSORBE \xB7 F FUEGO (2+)", cx, ly + 32, 9, cD);
    txt("3 ANILLOS = PROTECTOR x2", cx, ly, 11, cH);
    txt("R\xC9CORD  " + pad(G.best), cx, ly + 49, 14, cB);
  }
  function drawOver() {
    X.fillStyle = "rgba(2,6,12,.82)";
    X.fillRect(0, 0, L.W, L.H);
    const cx = L.W / 2, cy = L.H * (L.portrait ? 0.17 : 0.15);
    txt("MAREA MUERTA", cx, cy, L.portrait ? 42 : 50, cC);
    txt("EL TANQUE SE QUED\xD3 SIN TIEMPO", cx, cy + 36, 10, cK);
    fr(cx - 160, cy + 60, 320, 68, 14, "rgba(4,18,28,.85)");
    X.strokeStyle = "#2f7186";
    X.lineWidth = 1.5;
    rr(cx - 160, cy + 60, 320, 68, 14);
    X.stroke();
    txt(pad(G.score), cx, cy + 84, 34, "#eaffff");
    txt(G.newBest ? "\xA1NUEVO R\xC9CORD!" : "R\xC9CORD " + pad(G.best), cx, cy + 111, 10, G.newBest ? cA : cF);
    const rank = G.score >= 15e3 ? "S" : G.score >= 8e3 ? "A" : G.score >= 4e3 ? "B" : "C";
    txt(rank, cx + 236, cy + 96, 66, rank === "S" ? cA : rank === "A" ? cB : rank === "B" ? cO : cE);
    const sy = cy + 154;
    txt("OLEADA " + G.wave + " \xB7 ANILLOS " + G.stacked, cx, sy, 11, "#8fc4d0");
    if (S(G.t * 4) > -0.2) {
      fr(cx - 170, sy + 30, 340, 48, 12, "#082a33");
      X.strokeStyle = cB;
      X.lineWidth = 2;
      rr(cx - 170, sy + 30, 340, 48, 12);
      X.stroke();
      txt(L.portrait ? "TOCA PARA REINTENTAR" : "ESPACIO / TOCA PARA REINTENTAR", cx, sy + 54, 11, cI);
    }
  }
  function drawPause() {
    X.fillStyle = "rgba(2,8,15,.72)";
    X.fillRect(0, 0, L.W, L.H);
    const cx = L.W / 2, cy = L.H / 2;
    txt("PAUSA", cx, cy - 22, 48, cB);
    txt("P/ESC - R REINICIA", cx, cy + 34, 11, "#8fc4d0");
  }

  // src/main.js
  resize();
  bindInput();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && G.scene === "play" && !G.paused) {
      G.paused = true;
      musicStop();
    }
  });
  window.__AQ = {
    G,
    L,
    s: () => G.scene,
    sc: () => G.score,
    wv: () => G.wave,
    p: () => G.paused,
    ti: () => G.tilt,
    tm: (n) => G.time = n,
    ca: () => G.canA,
    hd: () => G.hard,
    ts: () => G.stacked,
    n: () => rings.length,
    cn: () => G.can.length,
    q: {
      rr: rings,
      p: posts,
      m: monsters,
      v: L.volcanoes,
      // stable ref: resize clears in place
      st: () => posts[0].stack.length + posts[1].stack.length,
      co: () => posts[0].coil + posts[1].coil,
      // test helper: teleport a live free ring over a pillar
      drop: (i) => {
        const p = posts[i], g = rings.find((v) => v.mode === "free");
        if (!g) return false;
        g.x = p.x;
        g.y = p.topY - 30;
        g.vx = 0;
        g.vy = 120;
        return true;
      }
    }
  };
  var last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1e3);
    last = now;
    update(dt);
    draw();
    musicTick();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

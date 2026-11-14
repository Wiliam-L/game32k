import { PL, FR } from './config.js';
import { resize, G, L, rings, posts, monsters, startWave } from './state.js';
import { update, bindInput } from './game.js';
import { draw } from './render.js';
import { musicTick, musicStop } from './audio.js';

resize();
bindInput();
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && G.scene === PL && !G.paused) { G.paused = true; musicStop(); }
});
let tr0 = null;
window.__AQ = {
  G, L, s: () => G.scene, sc: () => G.score, wv: () => G.wave, p: () => G.paused,
  ti: () => G.tilt, tm: n => G.time = n, sw: n => startWave(n),
  ts: () => G.stacked, xs: () => posts.map(p => p.x).join('|'),
  n: () => rings.length, jp: () => G.jets,
  hp: () => G.help, hs: () => G.helpSeen,
  // test hooks: mover/leer el primer anillo libre (A/D)
  rg: () => tr0 && [tr0.x, tr0.y, tr0.vx, tr0.vy],
  rt: (x, y) => { tr0 = rings.find(v => v.mode === FR) || null; if (!tr0) return 0; tr0.x = x; tr0.y = y; tr0.vx = tr0.vy = 0; return 1; },
  q: {
    rr: rings, p: posts, m: monsters, v: L.volcanoes, // stable ref: resize clears in place
    vp: i => { const v = L.volcanoes[i]; return v && [v.x, v.y]; },
    st: () => posts.reduce((a, p) => a + p.stack.length, 0),
    co: () => posts.reduce((a, p) => a + p.coil, 0),
    // test helper: teleport a live free ring over a pillar
    drop: i => {
      const p = posts[i] || posts[0], g = rings.find(v => v.mode === FR);
      if (!g) return false;
      g.x = p.x; g.y = p.topY - 30;
      g.vx = 0; g.vy = 120; return true;
    }
  }
};

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  musicTick();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

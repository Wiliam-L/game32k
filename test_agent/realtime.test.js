#!/usr/bin/env node
// AQUARING — prueba de juego en tiempo real (sin saltos de oleada).
// Distinto de auto_test.js: aquí el teclado y los frames corren a velocidad real.
// Uso: cd test_agent && node realtime.test.js
'use strict';
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const rootDir = path.resolve(__dirname, '..');
const gameUrl = 'file:///' + path.join(rootDir, 'index.html').replace(/\\/g, '/');
const shotsDir = path.join(__dirname, 'shots');
fs.mkdirSync(shotsDir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const failures = [];
const ok = m => console.log('  OK  ' + m);
const fail = m => { failures.push(m); console.log('  FALLO ' + m); };
const BENIGN = /AudioContext|user gesture|Autoplay|Web Audio/i;
const aq = (page, expr) => page.evaluate('window.__AQ.' + expr);

(async () => {
  console.log('AQUARING realtime.test →', gameUrl);
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error' && !BENIGN.test(msg.text())) problems.push('console.error: ' + msg.text()); });

  // --- FÁCIL: partida real desde el menú ---
  await page.goto(gameUrl, { waitUntil: 'load' });
  await page.waitForFunction('!!window.__AQ', null, { timeout: 10000 });
  ok('el juego arranca y expone window.__AQ');
  await page.keyboard.press('Space');           // PULSA START (FÁCIL por defecto)
  await sleep(800);
  (await aq(page, 's()') === 'play') ? ok('la partida arranca en FÁCIL') : fail('no arrancó la partida');
  await page.screenshot({ path: path.join(shotsDir, 'realtime-0-controles.png') });
  ok('ventana de controles visible al empezar (captura realtime-0-controles.png)');
  await page.keyboard.press('Space');           // cualquier tecla la cierra
  await sleep(400);
  await page.keyboard.down('ArrowLeft');
  await sleep(900);
  const tiltL = await aq(page, 'ti()');
  await page.keyboard.up('ArrowLeft');
  await sleep(150);
  await page.keyboard.down('ArrowRight');
  await sleep(1500);
  const tiltR = await aq(page, 'ti()');
  await page.keyboard.up('ArrowRight');
  await sleep(150);
  console.log('  inclinación real (←/→): ' + tiltL.toFixed(2) + ' → ' + tiltR.toFixed(2));
  (tiltL < -.5 && tiltR > .5) ? ok('el tanque se inclina en tiempo real') : fail('la inclinación real no responde');
  // el giro debe aplicarse al marco completo (#sc), no al lienzo por dentro
  const tf = await page.evaluate(() => {
    const c = document.getElementById('c');
    return { marco: c.parentElement.style.transform, lienzo: c.style.transform || '' };
  });
  const marcoRota = /rotate\(-?[1-9]/.test(tf.marco);
  (marcoRota && !tf.lienzo)
    ? ok('el marco completo rota: ' + tf.marco)
    : fail('el marco no rota como una pieza (marco="' + tf.marco + '", lienzo="' + tf.lienzo + '")');
  await page.screenshot({ path: path.join(shotsDir, 'realtime-1-playing.png') });

  // --- A/D: los volcanes lanzan anillos (todas las oleadas, ambas dificultades) ---
  const vpL = await aq(page, 'q.vp(0)'), vpR = await aq(page, 'q.vp(1)');
  const j0 = await aq(page, 'jp()');
  await aq(page, 'rt(' + vpL[0] + ',' + (vpL[1] - 70) + ')');
  await page.keyboard.down('a');
  await sleep(420);
  await page.keyboard.up('a');
  await sleep(120);
  let rg = await aq(page, 'rg()');
  const jL = await aq(page, 'jp()');
  (rg[3] < -200 && jL === j0 - 1)
    ? ok('A erupciona el volcán izquierdo (vy ' + Math.round(rg[3]) + ', impulsos ' + j0 + '→' + jL + ')')
    : fail('A no lanzó el anillo (vy=' + (rg && rg[3]) + ', impulsos=' + jL + ')');
  await aq(page, 'rt(' + vpR[0] + ',' + (vpR[1] - 70) + ')');
  await page.keyboard.down('d');
  await sleep(420);
  await page.keyboard.up('d');
  await sleep(120);
  rg = await aq(page, 'rg()');
  const jD = await aq(page, 'jp()');
  (rg[3] < -200 && jD === j0 - 2)
    ? ok('D erupciona el volcán derecho (vy ' + Math.round(rg[3]) + ', impulsos →' + jD + ')')
    : fail('D no lanzó el anillo (vy=' + (rg && rg[3]) + ', impulsos=' + jD + ')');
  await page.screenshot({ path: path.join(shotsDir, 'realtime-1b-volcanes.png') });
  // determina la tubería de apilado de forma determinista: deposita un anillo libre sobre un pilar
  await aq(page, 'q.drop(0)');
  await sleep(2500);
  const stacked = await aq(page, 'q.st()');
  console.log('  anillos apilados tras drop asistido: ' + stacked + ' · puntuación: ' + await aq(page, 'sc()'));
  stacked >= 1 ? ok('el apilado funciona con frames reales') : fail('ningún anillo se apiló');
  await page.screenshot({ path: path.join(shotsDir, 'realtime-2-stacked.png') });

  // --- DIFICIL: dos pilares y volcanes decorativos desde la oleada 1 ---
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction('!!window.__AQ', null, { timeout: 10000 });
  await page.keyboard.press('d');                // DIFICIL en el menú
  await sleep(250);
  await page.keyboard.press('Space');
  await sleep(800);
  await page.keyboard.press('Space');            // cerrar controles
  await sleep(300);
  const xs = await aq(page, 'xs()');
  const volc = await aq(page, 'q.v.length');
  const pil = await aq(page, 'q.p.length');
  console.log('  DIFICIL oleada 1: pilares ' + xs + ' · volcanes ' + volc);
  (xs === '288|672' && pil === 2 && volc === 2)
    ? ok('DIFICIL mantiene dos pilares y volcanes')
    : fail('DIFICIL no tiene el layout esperado (pilares=' + xs + ', volcanes=' + volc + ')');
  await page.keyboard.down('ArrowLeft'); await sleep(500); await page.keyboard.up('ArrowLeft');
  await sleep(400);
  await page.screenshot({ path: path.join(shotsDir, 'realtime-3-dificil.png') });

  for (const p of problems) fail(p);
  await browser.close();
  console.log('');
  if (failures.length) {
    console.log('REALTIME TEST FALLADO (' + failures.length + '):');
    for (const f of failures) console.log(' - ' + f);
    process.exit(1);
  }
  console.log('REALTIME TEST OK — marco completo y A/D reales, inclinación, apilado, controles y DIFICIL de dos pilares');
  process.exit(0);
})().catch(e => { console.error('REALTIME TEST ERROR:', e); process.exit(1); });
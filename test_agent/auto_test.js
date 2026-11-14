#!/usr/bin/env node
// AQUARING â€” test end-to-end del build final (../index.html, <= 32768 bytes).
// Navegador real (Chrome del sistema vÃ­a channel:'chrome', sin descargar navegador).
// Uso:  cd test_agent && npm install && node auto_test.js
// Sale con cÃ³digo 0 si todo pasa; 1 si algo falla. Las capturas quedan en ./shots/.
'use strict';
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const rootDir = path.resolve(__dirname, '..');
const gameUrl = 'file:///' + path.join(rootDir, 'index.html').replace(/\\/g, '/');
const shotsDir = path.join(__dirname, 'shots');
fs.mkdirSync(shotsDir, { recursive: true });
if (!fs.existsSync(path.join(rootDir, 'index.html'))) {
  console.error('No existe ../index.html â€” genera el build primero: node ../tools/build.mjs');
  process.exit(1);
}

const failures = [];
const ok = m => console.log('  OK  ' + m);
const fail = m => { failures.push(m); console.log('  FALLO ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ruido benigno del navegador (autoplay de audio antes del primer gesto) â€” lo demÃ¡s es fatal
const BENIGN = /AudioContext|user gesture|Autoplay|Web Audio/i;

async function newGamePage(browser, tag) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && !BENIGN.test(msg.text())) problems.push('console.error: ' + msg.text());
  });
  await page.goto(gameUrl, { waitUntil: 'load' });
  await page.waitForFunction('!!window.__AQ', null, { timeout: 10000 });
  return { page, problems, tag };
}
// MÃ©todos del hook interno window.__AQ (lo Ãºnico estable: las claves internas estÃ¡n
// ofuscadas por terser â€” ver README.md, "Aviso: mangle de propiedades")
const aq = (page, expr) => page.evaluate('window.__AQ.' + expr);
const shot = (page, name) => page.screenshot({ path: path.join(shotsDir, name) });
const check = (cond, msg) => cond ? ok(msg) : fail(msg);

async function scenarioFacil(browser) {
  console.log('\nFÃCIL (default): menÃº â†’ controles â†’ jugar oleada 1 â†’ salto tÃ©cnico a oleada 5');
  const { page, problems } = await newGamePage(browser, 'facil');
  try {
    check(await aq(page, 's()') === 'menu', 'arranca en el menÃº');
    await page.keyboard.press('a');           // FÃCIL (es el valor por defecto; pulsar A es idempotente)
    await sleep(250);
    await shot(page, 'facil-1-menu.png');
    await page.keyboard.press('Space');       // PULSA START
    await sleep(800);
    check(await aq(page, 's()') === 'play', 'la partida arranca (escena play)');
    check(await aq(page, 'wv()') === 1, 'oleada 1');
    await shot(page, 'facil-2-controles.png');
    await page.keyboard.press('Space');       // cualquier tecla cierra la ventana de controles
    await sleep(300);
    check(await aq(page, 'xs()') === '288|672', 'oleada 1 FÃCIL: dos pilares (' + await aq(page, 'xs()') + ')');
    check((await aq(page, 'q.v.length')) === 2, 'oleada 1: dos volcanes');
    check((await aq(page, 'n()')) > 0, 'anillos sembrados (' + await aq(page, 'n()') + ')');
    check((await page.evaluate("'cn' in window.__AQ")) === false, 'el hook del caÃ±Ã³n ya no existe');
    check((await page.evaluate("'can' in window.__AQ.G")) === false, 'el estado del caÃ±Ã³n ya no existe');
    await shot(page, 'facil-3-wave1.png');
    // prueba de la tuberÃ­a de apilado con frames reales: deposita un anillo libre sobre el pilar izquierdo
    await aq(page, 'q.drop(0)');
    await sleep(2500);
    check((await aq(page, 'q.st()')) >= 1, 'un anillo apilado de verdad en el pilar (stack=' + await aq(page, 'q.st()') + ')');
    // salto tÃ©cnico con el hook de pruebas sw(): oleada 5 en FÃCIL (NO aÃ±ade Â· DIFICIL; eso llega en la 6)
    await aq(page, 'sw(5)');
    await sleep(900);
    check(await aq(page, 'wv()') === 5, 'oleada 5 alcanzada');
    check(await aq(page, 'xs()') === '288|672', 'oleada 5: dos pilares, x=' + await aq(page, 'xs()'));
    check((await aq(page, 'q.v.length')) === 2, 'oleada 5: volcanes presentes');
    await shot(page, 'facil-4-wave5.png');
  } catch (e) {
    fail('excepciÃ³n en escenario FÃCIL: ' + e.message);
  }
  for (const p of problems) fail('FÃCIL: ' + p);
  await page.close();
}

async function scenarioDificil(browser) {
  console.log('\nDIFICIL (menÃº, tecla D): dos pilares desde la oleada 1 â†’ oleada 5');
  const { page, problems } = await newGamePage(browser, 'dificil');
  try {
    check(await aq(page, 's()') === 'menu', 'arranca en el menÃº');
    await page.keyboard.press('d');           // DIFICIL
    await sleep(250);
    await shot(page, 'dificil-1-menu.png');
    await page.keyboard.press('Space');
    await sleep(800);
    check(await aq(page, 's()') === 'play', 'la partida arranca (escena play)');
    check(await aq(page, 'wv()') === 1, 'oleada 1');
    await page.keyboard.press('Space');       // cerrar controles
    await sleep(300);
    check(await aq(page, 'xs()') === '288|672', 'DIFICIL oleada 1: dos pilares (' + await aq(page, 'xs()') + ')');
    check((await aq(page, 'q.v.length')) === 2, 'DIFICIL oleada 1: dos volcanes');
    check((await aq(page, 'q.p.length')) === 2, 'DIFICIL: 2 pilares en pantalla');
    await shot(page, 'dificil-2-wave1.png');
    await aq(page, 'sw(5)');
    await sleep(900);
    check(await aq(page, 'wv()') === 5, 'oleada 5 alcanzada');
    check(await aq(page, 'xs()') === '288|672', 'DIFICIL oleada 5: dos pilares, x=' + await aq(page, 'xs()'));
    await shot(page, 'dificil-3-wave5.png');
  } catch (e) {
    fail('excepciÃ³n en escenario DIFICIL: ' + e.message);
  }
  for (const p of problems) fail('DIFICIL: ' + p);
  await page.close();
}

(async () => {
  console.log('AQUARING auto_test â†’', gameUrl);
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio', '--no-sandbox'] });
  await scenarioFacil(browser);
  await scenarioDificil(browser);
  await browser.close();
  console.log('');
  if (failures.length) {
    console.log('AUTO TEST FALLADO (' + failures.length + '):');
    for (const f of failures) console.log(' - ' + f);
    process.exit(1);
  }
  console.log('AUTO TEST OK â€” FÃCIL y DIFICIL llegan a la oleada 5; capturas en test_agent/shots/');
  process.exit(0);
})().catch(e => { console.error('AUTO TEST ERROR:', e); process.exit(1); });

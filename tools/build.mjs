#!/usr/bin/env node
import { build, transform } from 'esbuild';
import { minify } from 'terser';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = 32400; // acuerdo: meta 32 000 B; tope absoluto 32 400 B (32 768 B físicos)
const GOAL = 32000; // informativo: objetivo si da el presupuesto
const OUT = path.join(root, 'index.html');
const checkOnly = process.argv.includes('--check');
const kb = n => (n / 1024).toFixed(2) + ' KB';

const template = await readFile(path.join(root, 'index.template.html'), 'utf8');
const cssSource = await readFile(path.join(root, 'src/style.css'), 'utf8');

const bundle = await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true, write: false, format: 'iife', target: ['es2020'],
  minify: false, legalComments: 'none', logLevel: 'silent'
});

const jsRaw = bundle.outputFiles[0].text;
const compressed = await minify(jsRaw, {
  ecma: 2020,
  compress: {
    passes: 25, toplevel: true, drop_console: true, drop_debugger: true,
    pure_getters: true, unsafe: true, unsafe_arrows: true, unsafe_comps: true,
    unsafe_math: true, booleans_as_integers: true, sequences: true,
    unused: true, dead_code: true, collapse_vars: true, reduce_vars: true,
    unsafe_methods: true, hoist_vars: true, reduce_funcs: true
  },
  mangle: {
    toplevel: true,
    properties: {
      builtins: true,
      regex: /^(x|y|vx|vy|r|w|h|va|ang|flat|col|kind|mode|ct|fuse|perfect|sx|sy|tx|ty|stack|coil|wob|topY|botY|dir|baseY|eatT|eats|deadT|hit|stun|ph|sp|len|fin|life|size|text|t|bannerT|comboT|stackCount|maxTime|waveDelay|monsterT|warnKind|chargeL|chargeR|spawnT|tiltT|jetT|newBest|paused|muted|score|best|wave|time|combo|mult|stacked|zaps|tide|tilt|jets|shake|flash|banner|warn|queue|types|post|left|scene|sandY|tank|portrait|nozzles|postsX|uw|help|helpSeen|can|canCd|canFl|canDir|canA|hard|diff|volcanoes|charge|clink|jet|bomb|zap|click|crab|shark|over|_monster|lootT|pumpT|pufs|inf|kills)$/
    }
  },
  format: { comments: false }
});
if (compressed.error) throw compressed.error;
const js = compressed.code;

const css = (await transform(cssSource, {
  loader: 'css', minify: true, legalComments: 'none'
})).code;

const html = template
  .replace('/*__STYLE__*/', () => css)
  .replace('/*__SCRIPT__*/', () => js);

const bytes = Buffer.byteLength(html, 'utf8');
const htmlBytes = bytes - Buffer.byteLength(js, 'utf8') - Buffer.byteLength(css, 'utf8');

if (!checkOnly) await writeFile(OUT, html, 'utf8');

console.log('');
console.log('  AQUARING // build');
console.log('  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
console.log('  JS minificado   ' + kb(Buffer.byteLength(js, 'utf8')).padStart(10));
console.log('  CSS minificado  ' + kb(Buffer.byteLength(css, 'utf8')).padStart(10));
console.log('  HTML + markup   ' + kb(htmlBytes).padStart(10));
console.log('  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
console.log('  TOTAL           ' + kb(bytes).padStart(10) + '  /  ' + kb(LIMIT));
console.log('  margen          ' + kb(LIMIT - bytes).padStart(10));
console.log('  meta 32 000 B   ' + (bytes <= GOAL ? 'ok' : 'por encima (' + kb(bytes - GOAL) + ')'));
console.log('');

if (bytes > LIMIT) {
  console.error('  âœ— LÃMITE SUPERADO por ' + kb(bytes - LIMIT));
  process.exitCode = 1;
} else {
  console.log('  âœ“ ' + (checkOnly ? 'tamaÃ±o verificado' : 'index.html generado') + ' (' + ((bytes / LIMIT) * 100).toFixed(1) + '% del lÃ­mite)');
  console.log('');
}

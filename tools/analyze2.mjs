#!/usr/bin/env node
// Second pass: aggressive terser settings, with and without own-property mangling.
import { readFile } from 'node:fs/promises';
import { minify } from 'terser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const kb = n => (n / 1024).toFixed(2) + ' KB';

const aggressive = {
  ecma: 2020,
  compress: {
    passes: 6, toplevel: true, drop_console: true, drop_debugger: true,
    pure_getters: true, unsafe: true, unsafe_arrows: true, unsafe_comps: true,
    unsafe_math: true, unsafe_proto: true, booleans_as_integers: true,
    sequences: true, unused: true, dead_code: true, collapse_vars: true,
    reduce_vars: true, inline: 3
  },
  mangle: { toplevel: true },
  format: { comments: false }
};

const PROP_SAFE = /^(x|y|z|w|h|r|g|b|a|vx|vy|vz|angle|life|maxL|speed|size|r|t|dt|kind|type|id|name|desc|side|key|pressed|stack|wob|clog|clogT|broken|shut|shutT|magnet|x1|y1|x2|y2|topY|botY|dx|dy|dist|score|combo|wave|level|hp|maxHp|state|tank|posts|nozzles|buttons|fish|rings|bombs|particles|bubbles|sfx|paused|over|started|mode|mutator|time|timer|goal|best|muted|quality|effects)$/;

const candidates = ['lunar_rush.html', 'game_peces_anillos.htm'];
for (const name of candidates) {
  const html = await readFile(path.join(root, name), 'utf8');
  const js = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');
  const plain = await minify(js, aggressive);
  const props = await minify(js, {
    ...aggressive,
    mangle: { toplevel: true, properties: { regex: PROP_SAFE } }
  });
  console.log('\n=== ' + name + ' ===');
  console.log('aggressive js     ', kb(Buffer.byteLength(plain.code)));
  console.log('+ own props mangle', kb(Buffer.byteLength(props.code)));
  console.log('projected total   ', kb(Buffer.byteLength(plain.code) + 13000), '(js + ~13KB markup/css)');
  if (plain.warnings) console.log('warnings:', plain.warnings.slice(0, 3));
}

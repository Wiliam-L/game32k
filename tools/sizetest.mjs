import { build, transform } from 'esbuild';
import { minify } from 'terser';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = await readFile(path.join(root, 'index.template.html'), 'utf8');
const cssSource = await readFile(path.join(root, 'src/style.css'), 'utf8');
const bundle = await build({
  entryPoints: [path.join(root, 'src/main.js')], bundle: true, write: false,
  format: 'iife', target: ['es2020'], minify: false, legalComments: 'none', logLevel: 'silent'
});
const jsRaw = bundle.outputFiles[0].text;
const css = (await transform(cssSource, { loader: 'css', minify: true, legalComments: 'none' })).code;
const cssB = Buffer.byteLength(css, 'utf8');
const htmlB = Buffer.byteLength(template, 'utf8') - Buffer.byteLength('/*__STYLE__*/') - Buffer.byteLength('/*__SCRIPT__*/') + cssB;

const base = {
  ecma: 2020,
  compress: {
    passes: 12, toplevel: true, drop_console: true, drop_debugger: true,
    pure_getters: true, unsafe: true, unsafe_arrows: true, unsafe_comps: true,
    unsafe_math: true, booleans_as_integers: true, sequences: true,
    unused: true, dead_code: true, collapse_vars: true, reduce_vars: true
  },
  mangle: { toplevel: true, properties: { builtins: true, regex: /^(x|y|vx|vy|r|w|h|va|ang|flat|col|kind|mode|ct|fuse|perfect|sx|sy|tx|ty|stack|coil|wob|topY|botY|dir|baseY|eatT|eats|deadT|hit|stun|ph|sp|len|fin|life|size|text|t|bannerT|comboT|stackCount|maxTime|waveDelay|monsterT|warnKind|chargeL|chargeR|spawnT|tiltT|jetT|newBest|paused|muted|score|best|wave|time|combo|mult|stacked|zaps|tide|tilt|jets|shake|flash|banner|warn|queue|types|post|left|scene|sandY|tank|portrait|nozzles|postsX|uw|canHelp|canHelpSeen|can|canCd|canFl|canDir|canA|hard|diff|volcanoes|charge|clink|jet|bomb|zap|click|crab|shark|over|_monster|lootT|pumpT|pufs|inf|kills)$/ } },
  format: { comments: false }
};

const variants = {
  base,
  pass30: { ...base, compress: { ...base.compress, passes: 30 } },
  extra: { ...base, compress: { ...base.compress, unsafe_undefined: true, unsafe_regexp: true, hoist_props: true, inline: 3 } },
  extra30: { ...base, compress: { ...base.compress, passes: 30, unsafe_undefined: true, unsafe_regexp: true, hoist_props: true, inline: 3 } }
};
for (const [k, opt] of Object.entries(variants)) {
  const r = await minify(jsRaw, opt);
  if (r.error) { console.log(k, 'ERR', r.error.message); continue; }
  const total = htmlB + Buffer.byteLength(r.code, 'utf8');
  console.log(k.padEnd(8), 'js', Buffer.byteLength(r.code, 'utf8'), 'total', total, 'margin', 32768 - total);
}
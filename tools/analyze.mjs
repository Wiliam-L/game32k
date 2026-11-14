#!/usr/bin/env node
// Compares the two candidate sources: real minified weight, dependencies and
// feature surface. Read-only: never writes over the originals.
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import { minify } from 'terser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const LIMIT = 32 * 1024;
const kb = n => (n / 1024).toFixed(2) + ' KB';

const candidates = ['lunar_rush.html', 'game_peces_anillos.htm'];

function extract(html, tag) {
  const out = [];
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

for (const name of candidates) {
  const html = await readFile(path.join(root, name), 'utf8');
  const styles = extract(html, 'style');
  const scripts = extract(html, 'script');
  const css = styles.join('\n');
  const js = scripts.join('\n');
  const markup = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');

  const cssMin = (await transform(css, { loader: 'css', minify: true, legalComments: 'none' })).code;

  let jsMin = { code: '' };
  try {
    jsMin = await minify(js, {
      ecma: 2020,
      compress: { passes: 3, toplevel: true, drop_console: true, drop_debugger: true },
      mangle: { toplevel: true },
      format: { comments: false }
    });
  } catch (e) {
    jsMin = { code: js, error: e.message };
  }

  const total = Buffer.byteLength(markup) + Buffer.byteLength(cssMin) + Buffer.byteLength(jsMin.code);
  const externals = [...new Set([...html.matchAll(/https?:\/\/[^\s"'>]+/g)].map(m => m[0]))];
  const dataUris = (html.match(/data:[a-z/+.-]+;base64/gi) || []).length;

  console.log('\n=== ' + name + ' ===');
  console.log('source bytes      ', kb(Buffer.byteLength(html)));
  console.log('markup            ', kb(Buffer.byteLength(markup)));
  console.log('css min           ', kb(Buffer.byteLength(cssMin)));
  console.log('js min            ', kb(Buffer.byteLength(jsMin.code)) + (jsMin.error ? '  (MINIFY ERROR: ' + jsMin.error + ')' : ''));
  console.log('estimated total   ', kb(total), total <= LIMIT ? 'FITS' : 'OVER by ' + kb(total - LIMIT));
  console.log('external URLs     ', externals.length ? externals.join(', ') : 'none');
  console.log('base64 assets     ', dataUris);
  console.log('script blocks     ', scripts.length, '| style blocks', styles.length);
  console.log('canvas elements   ', (html.match(/<canvas/g) || []).length);
  console.log('webgl             ', /getContext\(['"]webgl/i.test(js) ? 'yes' : 'no');
  console.log('gamepad           ', /gamepad/i.test(js) ? 'yes' : 'no');
  console.log('touch controls    ', /touchstart|pointerdown|ontouch/i.test(js) ? 'yes' : 'no');
  console.log('localStorage      ', /localStorage/i.test(js) ? 'yes' : 'no');
  console.log('lines in source   ', html.split('\n').length);
  const ids = [...new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]))];
  console.log('DOM ids           ', ids.length);
}

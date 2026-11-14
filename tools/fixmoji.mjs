// Reparación puntual de render.js: secuencias UTF-8 doble-codificadas -> originales
import fs from 'node:fs';
const p = new URL('../src/render.js', import.meta.url);
let s = fs.readFileSync(p, 'utf8');
const before = s.length;
const pairs = [['Â¡', '¡'], ['Â·', '·'], ['Ã‘', 'Ñ'], ['Ã“', 'Ó'], ['Ã‰', 'É']];
for (const [a, b] of pairs) s = s.split(a).join(b);
fs.writeFileSync(p, s, 'utf8');
const bad = (s.match(/[ÃÂ‘“‰]/g) || []).length;
console.log('bytes antes:', before, 'después:', s.length, '| caracteres dañados restantes:', bad);
for (const [i, l] of s.split('\n').entries()) {
  if (/[ÃÂ‘“‰]/.test(l)) console.log('!', i + 1, l.trim());
}

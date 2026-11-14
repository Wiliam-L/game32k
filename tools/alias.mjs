import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const map = [
  ['Math.PI', 'PI'], ['Math.sin', 'S'], ['Math.cos', 'C'], ['Math.abs', 'A'],
  ['Math.min', 'MN'], ['Math.max', 'MX'], ['Math.random', 'R'], ['Math.floor', 'F'],
  ['Math.hypot', 'HY'], ['Math.sign', 'SG'], ['Math.pow', 'PW']
];
for (const f of readdirSync('src')) {
  if (!f.endsWith('.js') || f === 'config.js') continue;
  const p = 'src/' + f;
  let s = readFileSync(p, 'utf8');
  for (const [a, b] of map) s = s.split(a).join(b);
  const used = map.map(x => x[1]).filter(n => new RegExp('\\b' + n + '\\b').test(s));
  // merge into the existing config import
  s = s.replace(/import \{([^}]*)\} from '\.\/config\.js';/, (m, names) => {
    const set = new Set(names.split(',').map(v => v.trim()).filter(Boolean));
    used.forEach(u => set.add(u));
    return `import { ${[...set].join(', ')} } from './config.js';`;
  });
  writeFileSync(p, s);
  console.log(f, '->', used.join(','));
}

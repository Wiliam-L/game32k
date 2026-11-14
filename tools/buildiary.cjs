const s = require('fs').readFileSync('index.html', 'utf8');
const re = /"crab"/g; let m, i = 0;
while ((m = re.exec(s)) && i < 12) { i++; console.log('---', m.index, JSON.stringify(s.slice(m.index - 70, m.index + 30))); }

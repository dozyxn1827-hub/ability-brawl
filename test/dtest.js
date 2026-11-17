const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + __dirname + '/../dist/index.html'); await p.waitForTimeout(400);
  const list = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const r = await p.evaluate((list) => list.map(([ab, dr]) => { const sp = fallbackSpec(ab, [{ by: 'x', text: dr }]); const d = sp.drawbacks[0]; return `${dr}  ⇒  ${d.how}   [${[d.fx].concat(d.more || []).map((x) => x.t + (x.on ? '@' + x.on : '') + (x.st ? ':' + (x.st.k || x.st) : '') + (x.stat ? ':' + x.stat : '')).join(',')}]`; }), list);
  console.log(r.join('\n')); console.log(errs.join('\n') || 'no errors'); await b.close();
})();

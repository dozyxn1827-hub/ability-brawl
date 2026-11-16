const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + __dirname + '/../dist/index.html'); await p.waitForTimeout(400);
  const texts = JSON.parse(process.argv[2]);
  const r = await p.evaluate((texts) => texts.map((t) => t + ' → ' + wfFind(t).map((h) => `${h.word}(${h.fam})`).join(', ')), texts);
  console.log(r.join('\n')); console.log(errs.join('\n') || 'no errors'); await b.close();
})();

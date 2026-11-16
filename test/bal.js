const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + __dirname + '/../' + (process.argv[2] || 'dist') + '/index.html');
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const tc = document.createElement('canvas'); tc.width = 768; tc.height = 512;
    const by = { 2: [], 3: [], 4: [] }; let casts = 0, errors = [];
    for (let b = 0; b < 60; b++) {
      const n = 2 + (b % 3);
      const roster = Array.from({ length: n }, (_, i) => ({ name: 'B' + i, spec: fallbackSpec(pick(BOT_ABILITIES), [{ by: 'q', text: pick(SIDE_IDEAS) }]), owned: true, bot: true }));
      let ended = false;
      try {
        const bt = new Battle({ canvas: tc, roster, mapIdx: b % 4, focus: [], decider: true, onEnd: () => { ended = true; } });
        bt.count = 0;
        let steps = 0;
        while (!ended && steps < 60 * 130) { bt.step(1 / 60); steps++; }
        by[n].push(Math.round(bt.t));
      } catch (e) { errors.push(String(e.stack).split('\n').slice(0, 3).join(' | ')); }
    }
    const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
    return { med2: med(by[2]), med3: med(by[3]), med4: med(by[4]), all: by, errors };
  });
  console.log(JSON.stringify(res));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await browser.close();
})();

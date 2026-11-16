const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  await page.goto('file://' + __dirname + '/../dist/index.html');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1050; document.body.append(cv);
    const roster = [0, 1, 2, 3].map((i) => ({ name: 'B' + i, spec: fallbackSpec(BOT_ABILITIES[i * 3], [{ by: 'x', text: '벌이 쫓아온다' }]), owned: true, bot: true }));
    const out = {};
    for (const mi of [0, 1, 3]) {
      const b = new Battle({ canvas: cv, roster, mapIdx: mi, decider: true, focus: [0] });
      b.count = 0;
      for (let i = 0; i < 600; i++) b.step(1 / 60);
      let t0 = performance.now(), n = 0;
      for (let i = 0; i < 240; i++) { b.step(1 / 60); b.draw(1 / 60); n++; }
      out[mi] = ((performance.now() - t0) / n).toFixed(2) + 'ms/frame, parts ' + b.parts.length + ', objs ' + b.objs.length;
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();

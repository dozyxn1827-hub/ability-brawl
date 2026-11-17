const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 430 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + __dirname + '/../dist/index.html'); await page.waitForTimeout(400);
  const keys = process.argv[2].split(','), times = (process.argv[3] || '0.3,0.6,0.9').split(',').map(Number);
  for (const key of keys) for (const tm of times) {
    await page.evaluate(({ key, tm }) => {
      document.body.innerHTML = '';
      const cv = document.createElement('canvas'); cv.width = 640; cv.height = 430; document.body.style.margin = '0'; document.body.append(cv);
      const X = XT[key], slot = X.slots.includes('u') ? 'ult' : X.slots.includes('2') ? 's2' : X.slots.includes('1') ? 's1' : 'basic';
      const sp = fallbackSpec('양말로 때린다', []);
      const mv = sanMove({ name: X.ko, desc: X.desc, fx: [{ t: key }] }, slot, { accent: '#ff8a3a' });
      sp.moves.basic = Object.assign({}, sp.moves.basic, { fx: mv.fx, cd: 0.1, name: X.ko });
      const d = fallbackSpec('허수아비', []);
      const roster = [{ name: '나', spec: sp, owned: true }, { name: 'A', spec: d, owned: true, dummy: true }, { name: 'B', spec: d, owned: true, dummy: true }, { name: 'C', spec: d, owned: true, dummy: true }];
      const b = new Battle({ canvas: cv, roster, mapIdx: 0, decider: true, focus: [0], practice: true });
      b.count = 0; b.t = 5;
      const [me, a, bb, c] = b.fighters;
      const place = () => { me.x = 150; me.y = 170; a.x = 255; a.y = 175; bb.x = 300; bb.y = 215; c.x = 240; c.y = 120; for (const f of b.fighters) { f.px = f.x; f.py = f.y; f.vx = 0; f.vy = 0; } };
      place(); for (let i = 0; i < 200; i++) { b.step(1 / 60); place(); }
      for (const f of b.fighters) { f.say = null; }
      b.pops.length = 0; b.bursts.length = 0;
      me.aim = Math.atan2(175 - 170, 255 - 150);
      b.fire(me, 'basic');
      for (let i = 0; i < Math.round(tm * 60); i++) { b.step(1 / 60); b.draw(1 / 60); }
      const g = cv.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, 640, 28); g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.fillText(`${key} ${X.ko} ${tm}s`, 8, 20);
    }, { key, tm });
    await page.screenshot({ path: `/tmp/xt/s-${key}-${tm}.png` });
  }
  console.log(errs.join('\n') || 'no errors'); await browser.close();
})();

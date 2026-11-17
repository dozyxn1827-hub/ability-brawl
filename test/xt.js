// 추가 공격 100종: 하나씩 쏴 보고 (오류·피해) 화면을 찍는다
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 430 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message + (e.stack || '').split('\n').slice(0, 3).join(' ')));
  await page.goto('file://' + __dirname + '/../dist/index.html'); await page.waitForTimeout(400);
  const keys = await page.evaluate(() => XT_LIST.map((x) => x.key));
  const only = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2].split(',') : null;
  const shots = process.argv.includes('--shots');
  const out = [];
  for (const key of keys) {
    if (only && !only.includes(key)) continue;
    const r = await page.evaluate(({ key, shots }) => {
      document.body.innerHTML = '';
      const cv = document.createElement('canvas'); cv.width = 640; cv.height = 430; document.body.style.margin = '0'; document.body.append(cv);
      const X = XT[key], slot = X.slots.includes('u') ? 'ult' : X.slots.includes('2') ? 's2' : X.slots.includes('1') ? 's1' : 'basic';
      const sp = fallbackSpec('양말로 때린다', []);
      const mv = sanMove({ name: X.ko, desc: X.desc, fx: [{ t: key }] }, slot, { accent: '#ff8a3a', hair: '#333', body: '#46c', skin: '#f2c79b' });
      sp.moves.basic = Object.assign({}, sp.moves.basic, { fx: mv.fx, cd: 0.1 });
      const d = fallbackSpec('허수아비', []);
      const roster = [{ name: '나', spec: sp, owned: true, bot: false }, { name: 'A', spec: d, owned: true, dummy: true }, { name: 'B', spec: d, owned: true, dummy: true }, { name: 'C', spec: d, owned: true, dummy: true }];
      const b = new Battle({ canvas: cv, roster, mapIdx: 0, decider: true, focus: [0], practice: false });
      b.count = 0;
      const [me, a, bb, c] = b.fighters;
      const place = () => { me.x = 190; me.y = 170; a.x = 265; a.y = 170; bb.x = 290; bb.y = 200; c.x = 245; c.y = 135; for (const f of b.fighters) { f.px = f.x; f.py = f.y; f.vx = 0; f.vy = 0; } };
      place(); b.step(1 / 60); place();
      for (const f of b.fighters) { f.maxHp = 999; f.hp = 999; }
      me.aim = 0;
      b.fire(me, 'basic');
      const T = Math.round(2.6 * 60); let snap = null, best = 0;
      for (let i = 0; i < T; i++) {
        if (i % 3 === 0) { const n = b.objs.filter((o) => !o.dead).length; if (n > best && i > 6) { best = n; snap = i; } }
        b.step(1 / 60);
      }
      const dealt = b.fighters.slice(1).map((f) => Math.round(999 - f.hp));
      return { key, slot, fx: mv.fx.map((e) => e.t + (e.shape ? ':' + e.shape : '') + (e.path && e.path !== 'line' ? ':' + e.path : '') + (e.end && e.end !== 'none' ? '>' + e.end : '')).join(' + '), dealt, total: dealt.reduce((s, x) => s + x, 0), snap, exp: Math.round(mv.fx.reduce((s, e) => s + fxExpected(e), 0)) };
    }, { key, shots });
    out.push(r);
    console.log(`${r.key.padEnd(12)} ${r.slot.padEnd(5)} dealt ${String(r.total).padStart(4)} [${r.dealt}] exp ${r.exp}  ${r.fx}`);
    if (shots) {
      await page.evaluate(({ key, snap }) => {
        document.body.innerHTML = '';
        const cv = document.createElement('canvas'); cv.width = 640; cv.height = 430; document.body.append(cv);
        const X = XT[key], slot = X.slots.includes('u') ? 'ult' : X.slots.includes('2') ? 's2' : X.slots.includes('1') ? 's1' : 'basic';
        const sp = fallbackSpec('양말로 때린다', []);
        const mv = sanMove({ name: X.ko, desc: X.desc, fx: [{ t: key }] }, slot, { accent: '#ff8a3a', hair: '#333', body: '#46c', skin: '#f2c79b' });
        sp.moves.basic = Object.assign({}, sp.moves.basic, { fx: mv.fx, cd: 0.1, name: X.ko });
        const d = fallbackSpec('허수아비', []);
        const roster = [{ name: '나', spec: sp, owned: true, bot: false }, { name: 'A', spec: d, owned: true, dummy: true }, { name: 'B', spec: d, owned: true, dummy: true }, { name: 'C', spec: d, owned: true, dummy: true }];
        const b = new Battle({ canvas: cv, roster, mapIdx: 0, decider: true, focus: [0], practice: true });
        b.count = 0;
        const [me, a, bb, c] = b.fighters;
        const place = () => { me.x = 190; me.y = 170; a.x = 265; a.y = 170; bb.x = 290; bb.y = 200; c.x = 245; c.y = 135; for (const f of b.fighters) { f.px = f.x; f.py = f.y; f.vx = 0; f.vy = 0; } };
        place(); b.step(1 / 60); place(); me.aim = 0;
        b.fire(me, 'basic');
        for (let i = 0; i < (snap || 20); i++) { b.step(1 / 60); b.draw(1 / 60); }
        const g = cv.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, 640, 30); g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.fillText(`${key}  ${X.ko}`, 10, 22);
      }, { key, snap: r.snap });
      await page.screenshot({ path: `/tmp/xt/${String(out.length).padStart(3, '0')}-${key}.png` });
    }
  }
  require('fs').writeFileSync('/tmp/xt/res.json', JSON.stringify(out));
  console.log(errs.join('\n') || 'no errors'); await browser.close();
})();

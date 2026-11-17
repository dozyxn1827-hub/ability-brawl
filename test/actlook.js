const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 430 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message + (e.stack || '').split('\n').slice(0, 3).join(' ')));
  await page.goto('file://' + __dirname + '/../dist/index.html'); await page.waitForTimeout(400);
  const cases = [['방귀', '3초마다 방귀를 뀐다', 0, 0], ['울음', '3초마다 운다', 0, 0], ['똥', '3초마다 똥을 싼다', 0, 0], ['노래', '능력을 쓸 때 노래를 부른다', 1, 0.1], ['넘어짐', '공격할 때마다 넘어진다', 1, 0.15], ['약점', '물에 약하다', 2, 0.3], ['재채기', '3초마다 재채기를 하면 능력이 나간다', 0, 0], ['돈', '3초마다 돈을 잃는다', 0, 0]];
  for (const [name, side, mode, wait] of cases) {
    const r = await page.evaluate(({ side, mode, wait }) => {
      document.body.innerHTML = '';
      const cv = document.createElement('canvas'); cv.width = 640; cv.height = 430; document.body.style.margin = '0'; document.body.append(cv);
      const sp = fallbackSpec('번개 주먹', [{ by: 'x', text: side }]);
      const foe = fallbackSpec(mode === 2 ? '물을 뿌린다' : '허수아비', []);
      const roster = [{ name: '나', spec: sp, owned: true, bot: false }, { name: 'A', spec: foe, owned: true, dummy: true }];
      const b = new Battle({ canvas: cv, roster, mapIdx: 0, decider: true, focus: [0], practice: false });
      b.count = 0;
      const [me, a] = b.fighters;
      for (let i = 0; i < 150; i++) b.step(1 / 60);
      me.say = null; a.say = null; for (const A of me.acts) A.t = 99;
      me.x = 200; me.y = 170; a.x = 260; a.y = 170;
      for (const f of b.fighters) { f.px = f.x; f.py = f.y; }
      let shot = '';
      if (mode === 0) { for (const A of me.acts) A.t = 0.05; for (let i = 0; i < 30; i++) { b.step(1 / 60); b.draw(1 / 60); } }
      else if (mode === 1) { b.fire(me, 's1'); for (let i = 0; i < Math.round(wait * 60); i++) { b.step(1 / 60); b.draw(1 / 60); } }
      else { const hp0 = me.hp; b.fire(a, 'basic'); for (let i = 0; i < 40; i++) { b.step(1 / 60); b.draw(1 / 60); } shot = `물 공격 피해: ${Math.round(hp0 - me.hp)}`; }
      return `${sp.drawbacks[0].how} | say=${me.say ? me.say.text : '-'} | st=${Object.keys(me.st).join(',')} ${shot}`;
    }, { side, mode, wait });
    await page.screenshot({ path: `${__dirname}/act-${name}.png` });
    console.log(name, r);
  }
  console.log(errs.join('\n') || 'no errors'); await browser.close();
})();

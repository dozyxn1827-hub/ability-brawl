// 맵마다 봇 4명 전투를 돌려 화면을 찍는다 (휴대폰 가로 크기)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.goto('file://' + __dirname + '/../dist/index.html');
  await page.waitForTimeout(400);
  for (let mi = 0; mi < 4; mi++) {
    for (const [tag, focus, steps] of [['zoom', [0], 60 * 8], ['all', [], 60 * 12]]) {
      await page.evaluate(({ mi, focus, steps }) => {
        document.body.innerHTML = '';
        const cv = document.createElement('canvas'); cv.width = 864; cv.height = 576; cv.style.width = '864px'; cv.style.height = '576px';
        document.body.style.margin = '0'; document.body.append(cv);
        const abil = ['불을 자유자재로 다룬다', '번개를 부른다', '고양이 군단을 소환한다', '노래로 사람을 홀린다', '닿는 것을 전부 얼린다', '독을 뿌린다', '총을 아주 잘 쏜다', '중력을 조종한다'];
        const roster = [0, 1, 2, 3].map((i) => { const sp = fallbackSpec(abil[(i + mi * 2) % abil.length], [{ by: 'x', text: '쓸 때마다 재채기를 한다' }]); return { name: ['가람', '나래', '다온', '라온'][i], spec: sp, owned: true, bot: true }; });
        const b = new Battle({ canvas: cv, roster, mapIdx: mi, decider: true, focus });
        b.count = 0;
        for (let i = 0; i < steps; i++) { b.step(1 / 60); if (i % 4 === 0) b.draw(4 / 60); }
        b.draw(1 / 60);
        window.__b = b;
      }, { mi, focus, steps });
      await page.screenshot({ path: `${__dirname}/look-${mi}-${tag}.png`, clip: { x: 0, y: 0, width: 864, height: 576 } });
    }
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close();
})();

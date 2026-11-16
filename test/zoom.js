const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.goto('file://' + __dirname + '/../dist/index.html');
  await page.waitForTimeout(300);
  const shots = [[0, 200, '불을 자유자재로 다룬다', '번개를 부른다'], [3, 260, '고양이 군단을 소환한다', '닿는 것을 전부 얼린다'], [1, 330, '노래로 사람을 홀린다', '총을 아주 잘 쏜다'], [0, 420, '중력을 조종한다', '그림자 속에 숨는다']];
  for (const [mi, steps, a1, a2] of shots) {
    await page.evaluate(({ mi, steps, a1, a2 }) => {
      document.body.innerHTML = '';
      const cv = document.createElement('canvas'); cv.width = 1152; cv.height = 768; cv.style.width = '1152px'; cv.style.height = '768px';
      document.body.style.margin = '0'; document.body.append(cv);
      const roster = [a1, a2, a1, a2].map((ab, i) => ({ name: ['가람', '나래', '다온', '라온'][i], spec: fallbackSpec(ab, [{ by: 'x', text: i === 1 ? '벌이 쫓아온다' : '술 취한 듯 비틀거린다' }]), owned: true, bot: true }));
      const b = new Battle({ canvas: cv, roster, mapIdx: mi, decider: true, focus: [0] });
      b.count = 0;
      // 가까이 붙여서 싸우게
      b.fighters.forEach((f, i) => { f.x = 240 + (i % 2 ? 30 : -30); f.y = 160 + (i < 2 ? -12 : 14); });
      b.vision = 'zoom'; b.visionOf = b.fighters[0];
      for (let i = 0; i < steps; i++) { b.step(1 / 60); if (i % 3 === 0) b.draw(3 / 60); }
      b.draw(1 / 60);
    }, { mi, steps, a1, a2 });
    await page.screenshot({ path: `${__dirname}/zoom-${mi}-${steps}.png`, clip: { x: 0, y: 0, width: 1152, height: 768 } });
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close();
})();

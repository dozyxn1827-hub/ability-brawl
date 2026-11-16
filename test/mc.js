const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const [tag, vp] of [['desk', { width: 1280, height: 800 }], ['phone', { width: 390, height: 780 }]]) {
    const p = await b.newPage({ viewport: vp }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('file://' + __dirname + '/../dist/index.html'); await p.waitForTimeout(500);
    await p.evaluate(() => {
      Sfx.voiceOn = false;
      const mk = (name, ab, sides) => ({ name, ability: ab, spec: fallbackSpec(ab, sides) });
      const es = [mk('민수', '상어로 변신해서 적을 물어뜯는다', [{ by: '지우', text: '물을 보면 운다' }, { by: '하준', text: '가끔 넘어진다' }]), mk('지우', '엄마의 등짝 스매싱', [{ by: '민수', text: '잔소리를 못 한다' }, { by: '하준', text: '느려진다' }]), mk('하준', '불을 쓰는 고양이', [{ by: '민수', text: '불을 못 쓴다' }, { by: '지우', text: '털이 빠진다' }])];
      show(revealView(es, [h('button.btn.primary', '연습하고 시작')], '노트'));
    });
    for (const t of [1600, 4200, 12000]) { await p.waitForTimeout(t === 1600 ? 1600 : t - 1600); await p.screenshot({ path: `test/mc-${tag}-${t}.png` }); }
    // 말풍선 눌러서 넘기기, 건너뛰기
    const st = await p.evaluate(() => [...document.querySelectorAll('.mcbox')].map((x) => x.className.replace('mcbox', '').trim() + ':' + x.querySelector('.mc-t').textContent.slice(0, 30)));
    await p.click('.mcbox.live .mc-b'); await p.waitForTimeout(200); await p.click('.mcbox.live .mc-b'); await p.waitForTimeout(300);
    await p.click('.mcbox.live .mc-btn'); await p.waitForTimeout(300);
    const st2 = await p.evaluate(() => [...document.querySelectorAll('.mcbox')].map((x) => x.className.replace('mcbox', '').trim()));
    await p.screenshot({ path: `test/mc-${tag}-done.png` });
    console.log(tag, JSON.stringify(st), JSON.stringify(st2), errs.join('|') || 'no errors');
    await p.close();
  }
  await b.close();
})();

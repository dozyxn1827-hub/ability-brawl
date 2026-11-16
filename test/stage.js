const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const shots = process.argv[2] ? JSON.parse(process.argv[2]) : [1200, 2600, 5000, 9000, 14000, 19000, 24000, 30000, 36000];
  for (const [tag, vp] of [['desk', { width: 1280, height: 720 }], ['phone', { width: 390, height: 780 }]]) {
    const p = await b.newPage({ viewport: vp }); const errs = []; p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
    await p.goto('file://' + __dirname + '/../dist/index.html'); await p.waitForTimeout(500);
    await p.evaluate(() => {
      Sfx.voiceOn = false;
      const mk = (name, ab, sides) => ({ name, ability: ab, spec: fallbackSpec(ab, sides) });
      const es = [mk('민수', '상어로 변신해서 적을 물어뜯는다', [{ by: '지우', text: '물을 보면 운다' }, { by: '하준', text: '가끔 넘어진다' }]), mk('지우', '엄마의 등짝 스매싱', [{ by: '민수', text: '느려진다' }, { by: '하준', text: '가끔 실패한다' }])];
      show(revealView(es, [h('button.btn.primary', '연습하고 시작')], '노트'));
    });
    let tPrev = 0;
    for (const t of shots) { await p.waitForTimeout(t - tPrev); tPrev = t; await p.screenshot({ path: `test/st-${tag}-${t}.png` }); }
    const lot = await p.evaluate(() => [document.querySelector('.ss-lot') && document.querySelector('.ss-lot').textContent, document.querySelector('.ss-t') && document.querySelector('.ss-t').textContent]);
    // 클릭으로 넘기기 → 다음 상품 → 건너뛰기
    for (let i = 0; i < 4; i++) { await p.mouse.click(vp.width / 2, vp.height / 3); await p.waitForTimeout(120); }
    await p.click('.ss-btn >> text=다음 상품'); await p.waitForTimeout(1800);
    const lot2 = await p.evaluate(() => document.querySelector('.ss-lot').textContent + ' | ' + document.querySelector('.ss-t').textContent);
    await p.click('.ss-btn >> text=쇼 건너뛰기'); await p.waitForTimeout(700);
    const gone = await p.evaluate(() => !document.querySelector('.ss') && !document.body.classList.contains('ss-on') && document.querySelectorAll('.fcard').length);
    await p.click('text=경매 쇼 다시 보기'); await p.waitForTimeout(400);
    const again = await p.evaluate(() => !!document.querySelector('.ss'));
    console.log(tag, JSON.stringify(lot), '|', lot2, '| 끝나고 카드:', gone, '| 다시 보기:', again, '|', errs.join(' ; ') || 'no errors');
    await p.close();
  }
  await b.close();
})();

// 연습장: 허수아비, 안 죽음, 써 본 기술 표시, 준비 완료 → 같은 맵으로 전투
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  for (const [label, vp, duo] of [['portrait', { width: 390, height: 780 }, false], ['landscape', { width: 780, height: 360 }, true]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    p.on('pageerror', (e) => errs.push(label + ' ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
    await p.goto('file://' + __dirname + '/../dist/index.html');
    await p.waitForTimeout(700);
    await p.click('text=한 기기에서 하기'); await p.waitForTimeout(200);
    if (duo) { await p.click('.seg button:has-text("2명")'); await p.waitForTimeout(100); }
    await p.click('text=능력 쓰러 가기'); await p.waitForTimeout(200);
    for (let i = 0; i < (duo ? 2 : 1); i++) {
      if (duo) { await p.click('button:has-text("준비됐어요")'); await p.waitForTimeout(150); }
      await p.fill('#ab-text', i ? '바나나 껍질을 던진다' : '양말 냄새로 적을 기절시킨다'); await p.click('text=이 능력으로 정하기'); await p.waitForTimeout(200);
    }
    for (let i = 0; i < (duo ? 2 : 1); i++) {
      if (duo) { await p.click('button:has-text("준비됐어요")'); await p.waitForTimeout(150); }
      const ins = await p.$$('textarea[id^="sd-"], input[id^="sd-"]');
      for (const el of ins) await el.fill('가끔 미끄러진다');
      await p.click('text=부작용 확정'); await p.waitForTimeout(300);
    }
    await p.waitForSelector('text=연습하고 시작', { timeout: 20000 });
    await p.screenshot({ path: __dirname + `/prac-reveal-${label}.png` });
    await p.click('text=연습하고 시작'); await p.waitForTimeout(600);
    // 모든 기술을 한 번씩 눌러 본다 (화면 버튼)
    const info0 = await p.evaluate(() => { const bt = App.root.querySelector('.prac') ? true : false; return { overlay: bt }; });
    const pads = await p.$$('.pad-act .pb');
    for (const pb of pads) { const bb = await pb.boundingBox(); if (bb) { await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(700); } }
    await p.waitForTimeout(1500);
    await p.screenshot({ path: __dirname + `/prac-${label}.png` });
    const st = await p.evaluate(() => {
      const view = document.querySelector('.prac');
      return { marks: [...document.querySelectorAll(".prac-m i")].map((x) => x.className + ':' + x.textContent), left: document.querySelector('.prac-left').textContent };
    });
    console.log(label, JSON.stringify(info0), JSON.stringify(st));
    await p.click('.prac-go'); await p.waitForTimeout(800);
    const after = await p.evaluate(() => ({ prac: !!document.querySelector('.prac'), battle: !!document.querySelector('.battle') }));
    console.log(label, 'after ready', JSON.stringify(after));
    await p.close();
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const run = async (vp, tag, touch) => {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(tag + ' PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
    await page.goto('file://' + __dirname + '/../dist/index.html');
    await page.waitForTimeout(400);
    await page.click('text=한 기기에서 하기');
    await page.click('.seg[aria-label="사람 수"] button:has-text("2명")');
    await page.fill('#ln0', '가람'); await page.fill('#ln1', '나래');
    await page.screenshot({ path: __dirname + `/d-${tag}-setup.png` });
    await page.click('text=능력 쓰러 가기');
    await page.click('text=가람 준비됐어요'); await page.fill('#ab-text', '거대한 망치를 휘두르는 괴력'); await page.click('text=이 능력으로 정하기');
    await page.click('text=나래 준비됐어요'); await page.fill('#ab-text', '고양이 군단을 소환한다'); await page.click('text=이 능력으로 정하기');
    await page.click('text=가람 준비됐어요'); await page.fill('#sd-1', '쓸 때마다 고양이가 운다'); await page.$$eval('.side-card input', (els) => els.forEach((e, i) => { if (!e.value) { e.value = ['쓸 때마다 고양이가 운다', '쓰고 나면 졸리다', '가끔 딸꾹질로 멈춘다'][i % 3]; e.dispatchEvent(new Event('input')); } })); await page.click('text=부작용 확정');
    await page.click('text=나래 준비됐어요'); await page.fill('#sd-0', '쓰고 나면 졸리다'); await page.$$eval('.side-card input', (els) => els.forEach((e, i) => { if (!e.value) { e.value = ['쓸 때마다 고양이가 운다', '쓰고 나면 졸리다', '가끔 딸꾹질로 멈춘다'][i % 3]; e.dispatchEvent(new Event('input')); } })); await page.click('text=부작용 확정');
    await page.waitForSelector('text=설계서 공개');
    await page.click('button:has-text("바로 전투")');
    await page.waitForTimeout(3300);
    const before = await page.evaluate(() => { const b = document.querySelector('.battle'); return null; });
    // 조작 확인: 1P 오른쪽 이동 + 기술
    const pads = await page.$$('.pads .pad');
    const press = async (padIdx, k, ms) => {
      const sel = k === 'r' || k === 'l' ? '.joy' : `.pb[data-k="${k}"]`;
      const b = await pads[padIdx].$(sel); const box = await b.boundingBox(); if (!box) return 'hidden';
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
      if (sel === '.joy') await page.mouse.move(box.x + (k === 'r' ? box.width : 0), box.y + box.height / 2, { steps: 3 });
      await page.waitForTimeout(ms); await page.mouse.up(); return 'ok'; };
    if (touch) { console.log(tag, 'p1 right', await press(0, 'r', 600), 'p1 s1', await press(0, 'b', 80), 'p2 left', await press(1, 'l', 600), 'p2 s1', await press(1, 'b', 80)); }
    else { await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(600); await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft'); await page.keyboard.press('KeyG'); await page.keyboard.press('KeyL'); }
    await page.waitForTimeout(400);
    await page.screenshot({ path: __dirname + `/d-${tag}-battle.png` });
    const over = await page.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }; return { stage: r('.stage'), pads: r('.pads'), hud: r('.hud'), vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }; });
    console.log(tag, JSON.stringify(over));
    await ctx.close();
  };
  await run({ width: 390, height: 780 }, 'portrait', true);
  await run({ width: 780, height: 360 }, 'landscape', true);
  await run({ width: 1200, height: 760 }, 'desktop', false);
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close();
})();

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 780, height: 360 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + __dirname + '/../dist/index.html');
  await p.waitForTimeout(800);
  await p.click('text=한 기기에서 하기'); await p.waitForTimeout(200);
  await p.click('text=능력 쓰러 가기'); await p.waitForTimeout(200);
  await p.fill('#ab-text', '양말 냄새로 적을 기절시킨다'); await p.click('text=이 능력으로 정하기'); await p.waitForTimeout(200);
  await p.fill('#sd-1', '냄새가 나를 쫓아온다'); await p.click('text=부작용 확정'); await p.waitForTimeout(500);
  await p.click('text=바로 전투'); await p.waitForTimeout(2500);
  await p.click('.sndb'); await p.waitForTimeout(150);
  await p.click('.snd-pop button:has-text("음악")'); await p.waitForTimeout(150);
  await p.screenshot({ path: __dirname + '/snd-landscape.png' });
  console.log(JSON.stringify(await p.evaluate(() => ({ music: Sfx.musicOn, on: Sfx.on, voice: Sfx.voiceOn, saved: localStorage.getItem('nn-audio'), cur: Music.cur }))));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const mkp = async (n) => { const p = await b.newPage({ viewport: { width: 900, height: 700 } }); p.on('pageerror', (e) => errs.push(n + e.message)); await p.goto('http://localhost:3123/?room=t1'); await p.waitForTimeout(1200); return p; };
  const A = await mkp('A'), B = await mkp('B');
  console.log('home', await A.evaluate(() => [App.roomState, App.aiState]));
  for (const [p, n] of [[A, '철수'], [B, '영희']]) { await p.fill('input', n).catch(() => {}); await p.click('text=온라인으로 모이기'); await p.waitForTimeout(900); }
  await A.waitForTimeout(1500);
  console.log('peers', await A.evaluate(() => Net.peers().length), await B.evaluate(() => Net.peers().length));
  console.log('lobbyA', (await A.textContent('body')).includes('영희'), 'lobbyB', (await B.textContent('body')).includes('철수'));
  await A.click('button:has-text("게임 시작")').catch((e) => console.log('start btn?', e.message.slice(0, 80)));
  await A.waitForTimeout(1500);
  console.log('phase', await A.evaluate(() => Online.ctx && Online.ctx.ph.p), await B.evaluate(() => Online.ctx && Online.ctx.ph.p));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();

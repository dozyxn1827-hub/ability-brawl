const { chromium } = require('playwright');
const mock = require('./mock.js');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const pages = [];
  const LAT = 90;
  const mkPage = async (peer, vp, touch) => {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(peer + ' PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
    page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push(peer + ' CONSOLE ' + m.text()); });
    await page.exposeFunction('__hubSend', (json) => { setTimeout(() => { for (const p of pages) if (p !== page) p.evaluate((j) => window.__hubRecv && window.__hubRecv(j), json).catch(() => {}); }, LAT); });
    await page.addInitScript(mock, { peer });
    await page.goto('file://' + __dirname + '/../dist/index.html');
    pages.push(page);
    return page;
  };
  const A = await mkPage('peeraaaa', { width: 390, height: 780 }, true);
  const B = await mkPage('peerbbbb', { width: 1100, height: 720 }, false);
  await A.waitForTimeout(800);
  await A.fill('#nick', '철수'); await A.click('text=온라인으로 모이기');
  await A.waitForTimeout(400);
  await B.fill('#nick', '영희'); await B.click('text=온라인으로 모이기');
  await A.waitForTimeout(900);
  await A.screenshot({ path: __dirname + '/o1-lobbyA.png' });
  await B.screenshot({ path: __dirname + '/o1-lobbyB.png' });
  // 방장(A): 봇 1명 추가 후 시작
  await A.click('.seg[aria-label="봇 수"] button:has-text("1명")');
  await A.waitForTimeout(400);
  await A.click('text=게임 시작');
  await A.waitForTimeout(700);
  await A.fill('#ab-text', '번개를 창처럼 던진다'); await A.click('text=이 능력으로 정하기');
  await A.waitForTimeout(500);
  await A.screenshot({ path: __dirname + '/o2-waitA.png' });
  await B.fill('#ab-text', '모든 것을 얼려 버린다'); await B.click('text=이 능력으로 정하기');
  await A.waitForTimeout(900);
  await B.screenshot({ path: __dirname + '/o3-sideB.png', fullPage: true });
  await A.fill('#sd-1', '얼음을 절대 못 쓴다'); await A.fill('#sd-2', '벌이 계속 쫓아온다'); await A.$$eval('.side-card input', (els) => els.forEach((e, i) => { if (!e.value) { e.value = ['쓸 때마다 고양이가 운다', '쓰고 나면 졸리다', '가끔 딸꾹질로 멈춘다'][i % 3]; e.dispatchEvent(new Event('input')); } })); await A.click('text=부작용 확정');
  await B.fill('#sd-0', '술 취한 것처럼 비틀거린다'); await B.fill('#sd-2', '앞이 안 보인다'); await B.$$eval('.side-card input', (els) => els.forEach((e, i) => { if (!e.value) { e.value = ['쓸 때마다 고양이가 운다', '쓰고 나면 졸리다', '가끔 딸꾹질로 멈춘다'][i % 3]; e.dispatchEvent(new Event('input')); } })); await B.click('text=부작용 확정');
  await A.waitForTimeout(700);
  await B.screenshot({ path: __dirname + '/o4-forgeB.png' });
  await A.waitForSelector('text=설계서 공개', { timeout: 15000 });
  await B.waitForSelector('text=설계서 공개', { timeout: 15000 });
  await B.screenshot({ path: __dirname + '/o5-revealB.png', fullPage: true });
  await A.waitForSelector('button:has-text("연습하고 시작"):not([disabled])', { timeout: 15000 });
  await A.waitForSelector('.ss', { timeout: 5000 }).catch(() => {}); await A.click('text=쇼 건너뛰기').catch(() => {}); await A.waitForTimeout(700);
  await A.click('button:has-text("연습하고 시작")');
  await A.waitForSelector('.prac', { timeout: 8000 });
  await B.waitForSelector('.prac', { timeout: 8000 });
  await B.keyboard.press('KeyJ'); await B.waitForTimeout(400); await B.keyboard.press('KeyI'); await B.waitForTimeout(600);
  console.log('practice B', JSON.stringify(await B.evaluate(() => ({ marks: [...document.querySelectorAll('.prac-m i.on')].map((x) => x.textContent), names: Online.pview && Online.pview.battle.fighters.map((f) => f.name) }))));
  await A.click('.prac-go'); await A.waitForTimeout(600);
  console.log('A after ready', await A.evaluate(() => document.querySelector('.prac-go') && document.querySelector('.prac-go').textContent));
  await B.click('.prac-go');
  await A.waitForSelector('.battle .bt-timer:visible', { timeout: 8000 });
  console.log('maps', await A.evaluate(() => Online.ctx.ph.mp), await B.evaluate(() => Online.ctx.ph.mp), await A.evaluate(() => Online.ctx.ph.p));
  await A.waitForTimeout(3500);
  // 전투: B는 키보드, A는 터치 버튼
  await B.keyboard.down('ArrowLeft'); await B.waitForTimeout(700); await B.keyboard.up('ArrowLeft');
  await B.keyboard.press('KeyK'); await B.waitForTimeout(200);
  await B.keyboard.down('KeyJ'); await B.waitForTimeout(600); await B.keyboard.up('KeyJ');
  await A.waitForTimeout(300);
  await A.screenshot({ path: __dirname + '/o6-battleA.png' });
  await B.screenshot({ path: __dirname + '/o6-battleB.png' });
  const snap = async (p) => p.evaluate(() => { const b = Online.bview && Online.bview.battle; return b ? b.fighters.map((f) => ({ n: f.name, own: f.owned, x: Math.round(f.x), y: Math.round(f.y), hp: Math.round(f.hp), alive: f.alive })) : null; });
  console.log('A view', JSON.stringify(await snap(A)));
  console.log('B view', JSON.stringify(await snap(B)));
  // 끝날 때까지: B가 계속 공격
  for (let i = 0; i < 60; i++) {
    const done = await A.evaluate(() => Online.ctx && Online.ctx.ph.p);
    if (done === 'result') break;
    await B.keyboard.down('KeyJ'); await B.keyboard.press('KeyL'); await B.keyboard.press('KeyI');
    await B.waitForTimeout(1500);
    await B.keyboard.up('KeyJ');
    if (i === 3) { console.log('A view', JSON.stringify(await snap(A))); console.log('B view', JSON.stringify(await snap(B))); }
  }
  await A.waitForTimeout(2500);
  await A.screenshot({ path: __dirname + '/o7-resultA.png', fullPage: true });
  await B.screenshot({ path: __dirname + '/o7-resultB.png', fullPage: true });
  for (const [n, p] of [['A', A], ['B', B]]) console.log(n, await p.evaluate(() => JSON.stringify({ maxPresence: window.__maxPresence, rejects: window.__presenceReject || 0, phase: Online.ctx && Online.ctx.ph.p, prompts: (window.__prompts || []).length, promptLen: (window.__prompts || [''])[0].length, netErr: Net.err })));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close();
})();

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file:///home/claude/game/dist/index.html'); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => {
    const raw = composeRaw('번개 주먹', [], true);
    raw.drawbacks = [
      { how: 'x', fx: { t: 'act', every: 10, text: '뿌지직!', pose: 'poop', d: 1.4 } },
      { how: 'x', fx: { t: 'weakto', vfx: ['water'], pct: 100, name: '물' }, more: [{ t: 'selfst', on: 'skills', nth: 3, st: { k: 'stun', d: 1.2 } }] },
      { how: 'x', fx: { t: 'bogus' } },
      { how: 'x', fx: { t: 'ramp', stat: 'dmg', by: 'time', pct: 50 } },
    ];
    const sp = sanSpec(raw, [{ by: 'a', text: '똥을 싼다' }, { by: 'b', text: '물에 약하고 3번 쓰면 기절' }, { by: 'c', text: '맞으면 운다' }, { by: 'd', text: '시간이 지날수록 약해진다' }]);
    return sp.drawbacks.map((d) => d.how + '  ' + JSON.stringify([d.fx].concat(d.more))).join('\n');
  }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

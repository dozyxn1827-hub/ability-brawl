// 모든 소리 종류와 배경음악을 실제로 만들어 보고 오류가 없는지, 소리가 나는지 확인
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + __dirname + '/../dist/index.html');
  await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    Sfx.init();
    const out = { state: Sfx.ctx.state, bad: [] };
    const an = Sfx.ctx.createAnalyser(); an.fftSize = 2048; Sfx.master.connect(an);
    const buf = new Float32Array(2048);
    const peak = () => { an.getFloatTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v)); return m; };
    const t0 = Sfx.ctx.currentTime;
    for (const k of SOUND_KINDS) { try { Sfx.kind(k, Sfx.ctx.currentTime, 1, 1, 1, false); Sfx.kind(k, Sfx.ctx.currentTime, 1.5, 0.6, 1, true); } catch (e) { out.bad.push(k + ': ' + e.message); } }
    for (const n of ['dash', 'blink', 'summon', 'buff', 'beam', 'boom', 'hit', 'bighit', 'tick', 'heal', 'shield', 'fail', 'selfhit', 'lock', 'pest', 'ko', 'combo', 'count', 'go', 'storm', 'ui', 'ready', 'win', 'shoot', 'cast', 'ult']) {
      const o = Sfx.osc.bind(Sfx); let err = null;
      try { Sfx.last = {}; Sfx.play(n, 'ice', { n: 5 }); } catch (e) { err = e.message; }
      if (err) out.bad.push(n + ': ' + err);
    }
    try { Sfx.move({ name: '양말', color: '#fff', vfx: 'poison', sfx: { kind: 'fart', pitch: 0.8, len: 1.3 } }, 'ult'); } catch (e) { out.bad.push('move: ' + e.message); }
    await new Promise((r) => setTimeout(r, 120));
    out.peakFx = peak();
    for (const name of ['menu', 0, 1, 2, 3]) {
      Music.play(name); Music.setHype(name === 3 ? 1 : 0);
      try { for (let s = 0; s < 64; s++) Music.note(s, Sfx.ctx.currentTime + 0.05, 0.1); } catch (e) { out.bad.push('music ' + name + ': ' + e.message); }
    }
    await new Promise((r) => setTimeout(r, 400));
    out.peakMusic = peak();
    out.cur = Music.cur;
    Music.stop();
    return out;
  });
  console.log(JSON.stringify(r));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await b.close();
})();

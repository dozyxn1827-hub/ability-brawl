const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + __dirname + '/../dist/index.html'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const bad = [], miss = [], types = {}; let n = 0;
    for (const k in WF) for (const w of WF[k].words.slice(0, 4)) {
      for (const txt of [w, `거대한 ${w}`, `${w}로 세 번 공격`, `불을 쓰는 ${w}`]) {
        n++;
        const sp = fallbackSpec(txt, [{ by: 'x', text: '가끔 실패한다' }]);
        const raw = composeRaw(txt, []);
        if (txt === w && !SLOTS.some((s) => raw.moves[s]._f === k) && !wfFind(w).some((h) => h.fam !== k)) miss.push(`${w}(${k})`);
        for (const s of SLOTS) {
          const m = sp.moves[s];
          if (!m.fx.length) bad.push(`${txt}:${s} 빈 기술`);
          for (const e of m.fx) { types[e.t] = (types[e.t] || 0) + 1; for (const q in e) if (typeof e[q] === 'number' && !isFinite(e[q])) bad.push(`${txt}:${s}:${e.t}.${q}=NaN`); }
          if (!m.name || m.name.includes('{') || m.desc.includes('{')) bad.push(`${txt}:${s} 이름 오류 ${m.name}`);
        }
      }
    }
    return { n, bad: bad.slice(0, 20), nbad: bad.length, miss: miss.slice(0, 30), nmiss: miss.length, types: Object.keys(types).length };
  });
  console.log(JSON.stringify(r, null, 1)); console.log(errs.join('\n') || 'no errors'); await b.close();
})();

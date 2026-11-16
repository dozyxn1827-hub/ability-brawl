const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + __dirname + '/../dist/index.html');
  await page.waitForTimeout(500);
  await page.evaluate((n) => { window.__N = n; }, +(process.argv[2] || 120));
  const res = await page.evaluate(() => {
    const R = Math.random, ri = (a, b) => a + Math.floor(R() * (b - a + 1)), rf = (a, b) => a + R() * (b - a);
    const st = () => (R() < 0.5 ? { k: pick(DEBUFFS), d: rf(0.5, 5) } : undefined);
    const FX = ['trail', 'shot', 'shot', 'beam', 'blast', 'zone', 'dash', 'blink', 'buff', 'heal', 'summon', 'all', 'swap'];
    const rfx = () => {
      const t = pick(FX);
      return { t, dmg: rf(1, 40), range: rf(10, 60), kb: rf(-10, 10), lift: rf(0, 10), st: st(), n: ri(1, 8), spread: rf(0, 90), speed: rf(80, 460), size: rf(2, 9), grav: R() < 0.4 ? rf(0, 1) : 0, homing: R() < 0.3 ? rf(0, 1) : 0, pierce: R() < 0.3, bounce: ri(0, 3), life: rf(0.3, 4), boom: R() < 0.3 ? rf(10, 60) : 0, from: pick(['hand', 'sky', 'ground', 'around']), len: rf(50, 384), w: rf(3, 24), ticks: ri(1, 6), dur: rf(0.1, 10), both: R() < 0.3, r: rf(14, 100), at: pick(['self', 'front', 'target']), off: rf(0, 200), delay: rf(0, 1.5), follow: R() < 0.3, heal: rf(0, 6), dist: rf(30, 170), up: rf(-1, 1), invuln: R() < 0.4, to: pick(['front', 'back', 'up', 'behind', 'random']), k: pick(BUFFS), d: rf(1, 10), pow: rf(2, 60), amt: rf(5, 45), kind: pick(['turret', 'chaser', 'orbit', 'mine', 'barrier']), rate: rf(0.4, 2), only: pick(['all', 'ground', 'air']), ret: R() < 0.3, split: R() < 0.3 ? ri(1, 6) : 0 };
    };
    const mv = () => ({ name: '기술', desc: '설명', vfx: pick(VFX), say: R() < 0.5 ? '얍' : '', pix: R() < 0.5 ? ['  ##   ', ' #oo#  ', '#oooo# ', '#oooo##', ' #..#  ', '  ##   ', '       '] : null, cd: rf(0.2, 30), color: '#' + ri(0x100000, 0xffffff).toString(16), shape: pick(SHAPES), fx: Array.from({ length: ri(1, 3) }, rfx) });
    const DF = ['lock', 'replace', 'reverse', 'healfoe', 'random', 'fail', 'backfire', 'selfdmg', 'selfst', 'tick', 'when', 'move', 'vision', 'pest', 'shout', 'look', 'stat', 'mul', 'cd', 'recoil', 'hurtst', 'drain', 'windup', 'uses', 'aidfoe', 'stack', 'tele'];
    const one = () => ({ t: pick(DF), on: pick(ON_SET), amt: rf(0.5, 40), pct: rf(3, 300), chance: rf(5, 100), st: R() < 0.5 ? { k: pick(DEBUFFS), d: rf(0.3, 5) } : pick(DEBUFFS), stat: pick(['hp', 'speed', 'size', 'dmg', 'taken', 'slow']), every: rf(3, 20), force: rf(3, 14), back: pick(['fizzle', 'selfhit', 'stun']), if: pick(['moving', 'still', 'lowhp', 'highhp', 'near', 'far', 'always']), time: rf(0.2, 3), n: ri(0, 6), k: pick(['haste', 'power', 'regen', 'shield', 'giant', 'invuln']), d: rf(1, 5), mode: pick(MOVE_MODES.concat(['dark', 'flip', 'mirror', 'shake', 'tiny', 'zoom'])), text: '살려줘', name: '벌', color: '#ffe14a', dmg: rf(0, 8), head: 'bald', body: '#ff8ad0', moves: { basic: mv(), s1: R() < 0.5 ? mv() : undefined, ult: mv() } });
    const rd = () => ({ how: '병맛', say: R() < 0.5 ? '에취' : '', fx: one(), more: R() < 0.4 ? [one(), one()] : [] });
    const spec = () => sanSpec({ title: '무작위', concept: '시험', look: { outfit: pick(OUTFITS), head: pick(HEADS), weapon: pick(WEAPONS), aura: pick(AURAS), cape: R() < 0.5, body: '#' + ri(0x100000, 0xffffff).toString(16) }, stats: { hp: rf(60, 150), speed: rf(0.6, 1.5), size: rf(0.7, 1.4) }, moves: { basic: mv(), s1: mv(), s2: mv(), ult: mv() }, passive: R() < 0.7 ? { k: pick(PASSIVES), desc: 'p' } : null, drawbacks: [rd(), rd(), rd()] }, [{ by: 'a', text: 'x' }, { by: 'b', text: 'y' }, { by: 'c', text: 'z' }], true, false);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const tc = document.createElement('canvas'); tc.width = 768; tc.height = 512;
    const out = { battles: 0, ended: 0, timeSum: 0, errors: [], nan: 0, kinds: {}, dfx: {}, dmgSum: 0 };
    for (let b = 0; b < (window.__N || 120); b++) {
      const n = ri(2, 4);
      let ended = false;
      const roster = Array.from({ length: n }, (_, i) => ({ name: 'B' + i, spec: b % 6 === 0 ? fallbackSpec(pick(BOT_ABILITIES), [{ by: 'q', text: pick(SIDE_IDEAS) }]) : spec(), owned: true, bot: true }));
      roster.forEach((r) => { SLOTS.forEach((s) => r.spec.moves[s].fx.forEach((e) => { out.kinds[e.t] = (out.kinds[e.t] || 0) + 1; })); r.spec.drawbacks.forEach((d) => { out.dfx[d.fx.t] = (out.dfx[d.fx.t] || 0) + 1; }); });
      let bt;
      try {
        bt = new Battle({ canvas: tc, roster, mapIdx: b % 4, focus: b % 2 ? [0] : [], decider: true, onEnd: () => { ended = true; } });
        bt.count = 0;
        let steps = 0;
        while (!ended && steps < 60 * 130) {
          bt.step(1 / 60); steps++;
          if (steps % 7 === 0) bt.draw(7 / 60);
          for (const f of bt.fighters) if (!Number.isFinite(f.x) || !Number.isFinite(f.y) || !Number.isFinite(f.hp) || !Number.isFinite(f.vx) || !Number.isFinite(f.vy) || !Number.isFinite(f.size) || f.x < 0 || f.x > W || f.y < 0 || f.y > H) { out.nan++; throw new Error('NaN in fighter ' + JSON.stringify({ x: f.x, y: f.y, hp: f.hp, vx: f.vx, size: f.size })); }
        }
        out.battles++; if (ended) out.ended++; out.timeSum += bt.t; (out.times = out.times || []).push(Math.round(bt.t)); (out.ns = out.ns || []).push(n);
        out.dmgSum += bt.fighters.reduce((s, f) => s + f.stats.dealt, 0);
      } catch (e) { out.errors.push(String(e && e.stack || e).split('\n').slice(0, 4).join(' | ') + ' @battle ' + b); if (out.errors.length > 6) break; }
    }
    out.avg = out.timeSum / Math.max(1, out.battles);
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await browser.close();
})();

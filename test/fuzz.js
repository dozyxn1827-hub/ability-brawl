const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + __dirname + '/../dist/index.html');
  await page.waitForTimeout(500);
  await page.evaluate(([n, ideas]) => { window.__N = n; window.__IDEAS = ideas; }, [+(process.argv[2] || 120), ["물에 약하다", "물을 맞으면 2배로 아프다", "궁극기를 쓰면 체력이 절반이 된다", "능력을 쓸 때마다 방귀를 뀐다", "공격할 때마다 넘어진다", "10초마다 잠든다", "속도가 엄청 느리다", "키가 작아진다", "체력이 50밖에 없다", "3번 쓰면 기절한다", "능력을 쓰면 엄마한테 혼난다", "가끔 자기 자신을 공격한다", "고양이를 무서워한다", "적을 공격하면 적이 회복된다", "왼쪽으로만 움직일 수 있다", "점프를 못 한다", "노래를 부르면서 싸워야 한다", "한 번만 쓸 수 있다", "배가 고프면 약해진다", "체력이 줄수록 느려진다", "맞으면 운다", "공격력이 반으로 줄어든다", "쿨타임이 2배다", "능력을 쓰면 3초 동안 못 움직인다", "가만히 있으면 체력이 준다", "벽에 부딪히면 기절한다", "자꾸 춤을 춘다", "능력 쓸 때마다 몸이 커진다", "능력을 쓰면 상대가 빨라진다", "앞이 잘 안 보인다", "똥을 싼다", "모든 능력이 약하다", "능력이 1초 늦게 나간다", "맞으면 데미지를 2배로 받는다", "적 근처에 가면 잠든다", "팔이 짧아서 멀리 못 때린다", "기본 공격을 못 한다", "재채기를 하면 능력이 나간다", "딸꾹질을 한다", "5초마다 운다", "울보다", "능력을 쓸 때 노래를 부른다", "공격하면 내가 날아간다", "돈을 잃는다", "엄마가 쫓아온다", "체력이 적다", "적이 나를 보면 웃는다", "10초에 한 번만 공격할 수 있다", "능력을 쓰면 배가 아프다", "화장실에 가야 한다", "눈이 나쁘다", "겁쟁이다", "적이 가까이 오면 도망간다", "공격이 다 빗나간다", "능력을 쓸 때마다 늙는다", "시간이 지날수록 약해진다", "맞을 때마다 작아진다", "체력이 낮으면 능력을 못 쓴다", "스킬이 2번 중 1번 실패한다", "얼음이 녹는다", "얼음 대신 물이 나온다", "가만히 있으면 체력이 준다", "체력이 낮으면 능력을 못 쓴다", "10초에 한 번만 공격할 수 있다", "공격할 때마다 넘어진다", "능력을 쓰면 배가 아프다", "불을 쓰면 내 손도 탄다", "궁극기를 쓰면 3초 동안 잠든다", "기술을 쓸 때마다 '죄송합니다'라고 외친다", "번개를 쓰면 내가 감전된다", "얼음을 쓰면 내가 언다", "적이 가까이 오면 춤을 춘다", "체력이 반 이하가 되면 울면서 도망간다", "움직이면 방귀가 나온다", "벽에 닿으면 튕겨나간다", "1분마다 엄마가 온다", "총알이 5발밖에 없다", "점점 느려진다", "점점 작아진다", "능력이 랜덤으로 나간다", "공격하면 적이 커진다", "맞으면 날아간다", "비가 오면 능력을 못 쓴다", "밤이 되면 잠든다", "똥을 싼다", "말을 못 한다", "3초마다 방귀를 뀐다", "궁극기를 쓰면 대머리가 된다", "능력을 쓸 때마다 체력이 5씩 준다", "적한테 가까이 가면 체력이 닳는다", "적을 때리면 내가 아프다", "공격이 너무 느리게 나간다", "움직일 때마다 미끄러진다", "5번 쓰면 잠든다", "능력이 거꾸로 나간다", "적 공격을 맞으면 3배로 아프다", "불에 약하다", "상어를 못 쓴다", "불이 안 나온다", "매운 걸 먹으면 불을 뿜는다"]]);
  const res = await page.evaluate(() => {
    const R = Math.random, ri = (a, b) => a + Math.floor(R() * (b - a + 1)), rf = (a, b) => a + R() * (b - a);
    const st = () => (R() < 0.5 ? { k: pick(DEBUFFS), d: rf(0.5, 5) } : undefined);
    const FX = ['trail', 'shot', 'beam', 'blast', 'zone', 'dash', 'blink', 'buff', 'heal', 'summon', 'all', 'swap', 'swing', 'cone', 'wave', 'line', 'chain', 'hook', 'lob', 'meteor', 'thrust', 'launch', 'leap', 'flurry', 'spikering', 'cross', 'tornado', 'roll', 'firewall', 'net', 'surge', 'clone', 'mark', 'charge', 'missiles', 'vortex', 'storm', 'ring', 'phantom', 'spiral', 'prism', 'whip', 'skyline', 'gatling', 'top', 'beacon', 'snipe', 'gust', 'drain', 'bite', 'stampede', 'pillar', 'lasergrid', 'hop', 'swarm', 'bubble', 'grab', 'claw', 'crack', 'stomp', 'sonic'];
    const XK = XT_LIST.map((x) => x.key);
    const rfx = () => {
      const t = R() < 0.3 ? pick(XK) : R() < 0.15 ? 'pattern' : pick(FX);
      return { t, path: pick(SHOT_PATHS), end: pick(['none', 'burst', 'mine', 'zone', 'pillars']), n2: ri(2, 12), drop: R() < 0.2 ? rf(0, 0.5) : 0, dropk: pick(['blast', 'zone', 'spike']), aura: R() < 0.2 ? rf(0, 22) : 0, grow: R() < 0.2 ? rf(0, 10) : 0, shape: pick(PATTERNS), at: pick(['self', 'target', 'front']), kind: pick(['blast', 'pillar', 'spike', 'drop']), turn: R() < 0.5 ? -1 : 1, pull: rf(0, 14), arc: rf(20, 180), step: rf(10, 30), size: rf(2, 14), dmg: rf(1, 40), range: rf(10, 60), kb: rf(-10, 10), lift: rf(0, 10), st: st(), n: ri(1, 8), spread: rf(0, 90), speed: rf(80, 460), size: rf(2, 9), grav: R() < 0.4 ? rf(0, 1) : 0, homing: R() < 0.3 ? rf(0, 1) : 0, pierce: R() < 0.3, bounce: ri(0, 3), life: rf(0.3, 4), boom: R() < 0.3 ? rf(10, 60) : 0, from: pick(['hand', 'sky', 'ground', 'around']), len: rf(50, 384), w: rf(3, 24), ticks: ri(1, 6), dur: rf(0.1, 10), both: R() < 0.3, r: rf(14, 100), at: pick(['self', 'front', 'target']), off: rf(0, 200), delay: rf(0, 1.5), follow: R() < 0.3, heal: rf(0, 6), dist: rf(30, 170), up: rf(-1, 1), invuln: R() < 0.4, to: pick(['front', 'back', 'up', 'behind', 'random']), k: pick(BUFFS), d: rf(1, 10), pow: rf(2, 60), amt: rf(5, 45), kind: pick(['turret', 'chaser', 'orbit', 'mine', 'barrier']), rate: rf(0.4, 2), only: pick(['all', 'ground', 'air']), ret: R() < 0.3, split: R() < 0.3 ? ri(1, 6) : 0 };
    };
    const mv = () => ({ name: '기술', desc: '설명', vfx: pick(VFX), say: R() < 0.5 ? '얍' : '', pix: R() < 0.5 ? ['  ##   ', ' #oo#  ', '#oooo# ', '#oooo##', ' #..#  ', '  ##   ', '       '] : null, cd: rf(0.2, 30), color: '#' + ri(0x100000, 0xffffff).toString(16), shape: pick(SHAPES), fx: Array.from({ length: ri(1, 3) }, rfx) });
    const DF = ['act', 'aim', 'range', 'ramp', 'flee', 'weakto', 'lock', 'replace', 'reverse', 'healfoe', 'random', 'fail', 'backfire', 'selfdmg', 'selfst', 'tick', 'when', 'move', 'vision', 'pest', 'shout', 'look', 'stat', 'mul', 'cd', 'recoil', 'hurtst', 'drain', 'windup', 'uses', 'aidfoe', 'stack', 'tele'];
    const one = () => ({ t: pick(DF), on: pick(ON_SET), amt: rf(0.5, 40), pct: rf(3, 300), chance: rf(5, 100), st: R() < 0.5 ? { k: pick(DEBUFFS), d: rf(0.3, 5) } : pick(DEBUFFS), stat: pick(['hp', 'speed', 'size', 'dmg', 'taken', 'slow']), every: rf(3, 20), force: rf(3, 14), back: pick(['fizzle', 'selfhit', 'stun']), if: pick(IFS), ev: R() < 0.4 ? pick(ACT_EVS) : undefined, nth: R() < 0.3 ? ri(2, 5) : undefined, n: R() < 0.4 ? ri(1, 60) : undefined, hp: R() < 0.2 ? ri(1, 30) : undefined, time: rf(0.2, 3), n: ri(0, 6), k: pick(['haste', 'power', 'regen', 'shield', 'giant', 'invuln']), d: rf(1, 5), mode: pick(MOVE_MODES.concat(['dark', 'flip', 'mirror', 'shake', 'tiny', 'zoom'])), text: '살려줘', name: '벌', color: '#ffe14a', dmg: rf(0, 8), head: 'bald', body: '#ff8ad0', moves: { basic: mv(), s1: R() < 0.5 ? mv() : undefined, ult: mv() } });
    const rd = () => ({ how: '병맛', say: R() < 0.5 ? '에취' : '', fx: one(), more: R() < 0.4 ? [one(), one()] : [] });
    const spec = () => sanSpec({ title: '무작위', concept: '시험', look: { outfit: pick(OUTFITS), head: pick(HEADS), weapon: pick(WEAPONS), aura: pick(AURAS), cape: R() < 0.5, body: '#' + ri(0x100000, 0xffffff).toString(16) }, stats: { hp: rf(60, 150), speed: rf(0.6, 1.5), size: rf(0.7, 1.4) }, moves: { basic: mv(), s1: mv(), s2: mv(), ult: mv() }, passive: R() < 0.7 ? { k: pick(PASSIVES), desc: 'p' } : null, drawbacks: [rd(), rd(), rd()] }, [{ by: 'a', text: 'x' }, { by: 'b', text: 'y' }, { by: 'c', text: 'z' }], true, false);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const tc = document.createElement('canvas'); tc.width = 768; tc.height = 512;
    const out = { battles: 0, ended: 0, timeSum: 0, errors: [], nan: 0, kinds: {}, dfx: {}, dmgSum: 0 };
    for (let b = 0; b < (window.__N || 120); b++) {
      const n = ri(2, 4);
      let ended = false;
      const roster = Array.from({ length: n }, (_, i) => ({ name: 'B' + i, spec: b % 2 === 0 ? fallbackSpec(pick(WF[pick(Object.keys(WF))].words) + ' ' + pick(['거대한', '세 번', '사방으로', '빠르게', '작은', '불을 쓰는']), [{ by: 'q', text: pick(window.__IDEAS) }, { by: 'r', text: pick(window.__IDEAS) }]) : spec(), owned: true, bot: true }));
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

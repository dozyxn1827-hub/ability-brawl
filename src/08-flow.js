/* ===== 게임 흐름: 첫 화면 · 한 기기 모드 · 온라인 모드 ===== */
const randMap = () => (Math.random() * MAPS.length) | 0;
const leaveBtn = (fn, label) => h('button.btn.small.ghost', { type: 'button', on: { click: fn } }, label || '나가기');

function passView(name, msg, go) {
  return h('main.page', h('section.panel.pass',
    h('p.step', 'PASS THE DEVICE'),
    h('h2', `${name} 차례`),
    h('p', msg),
    h('button.btn.primary', { type: 'button', on: { click: () => { Sfx.init(); Sfx.play('ui'); go(); } } }, `${name} 준비됐어요`)));
}
function revealView(entries, actions, note) {
  return h('main.page',
    h('p.step', 'STEP 3 / 3'),
    h('h2', '설계서 공개'),
    h('p.hint', '능력이 어떻게 구현됐는지, 상대가 붙인 부작용이 어떤 규칙이 됐는지 확인하세요.'),
    h('div.cards', entries.map((e, i) => fighterCard(e, i))),
    h('div.sticky', actions, note ? h('span.hint', note) : null));
}
function forgeList(entries, note) {
  const bars = [], badges = [];
  const el = h('main.page', h('section.panel',
    h('p.step', 'STEP 3 / 3'),
    h('h2', 'AI가 능력을 구현하는 중'),
    h('p.hint', note),
    h('ul.plist', entries.map((e, i) => {
      const bar = h('i'), badge = h('span.badge', 'WORKING');
      bars.push(bar); badges.push(badge);
      return h('li', { style: { '--pc': FIGHTER_COLORS[i % 4] } }, h('span.nm', e.name), h('span.sub', e.ability || ''), h('span.bar', bar), badge);
    }))));
  const set = (i, p, done) => {
    if (!bars[i]) return;
    bars[i].style.width = Math.round(clamp(p, 0, 1) * 100) + '%';
    badges[i].textContent = done ? 'DONE' : 'WORKING';
    badges[i].classList.toggle('done', !!done);
  };
  return { el, set };
}
const forgeNote = () => (App.sample
  ? '능력과 부작용을 읽고 전투 설계서를 쓰고 있어요. 가장 똑똑한 AI가 웃기고 짜릿하게 짜느라 1분쯤 걸릴 수 있어요. 처음 한 번은 AI 사용을 허용할지 물어봅니다.'
  : 'AI에 연결되지 않아 기본 해석기가 낱말을 보고 만들어요.');

/* ---------- 첫 화면 ---------- */
function goHome() {
  Music.play('menu');
  const stage = mkStage();
  let stopDemo = null, demoT = 0, alive = true;
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startDemo = () => {
    if (!alive) return;
    const roster = shuffle(BOT_ABILITIES).slice(0, 3).map((a) => {
      const spec = fallbackSpec(a, [{ by: '?', text: pick(SIDE_IDEAS) }]);
      return { name: spec.title, spec, owned: true, bot: true };
    });
    const b = new Battle({ canvas: stage.world, roster, mapIdx: randMap(), decider: true, focus: [], onEnd: () => { demoT = setTimeout(() => { if (stopDemo) stopDemo(); startDemo(); }, 1600); } });
    b.count = -1;
    if (still) { stage.fitText(); for (let i = 0; i < 150; i++) b.step(1 / 60); b.draw(1 / 60); return; }
    stopDemo = runLoop(b, stage);
  };
  const nick = h('input#nick', { type: 'text', maxLength: 8, placeholder: '예: 번개손', value: App.name, autocomplete: 'off' });
  const aiS = h('span'), roomS = h('span');
  const online = h('button.btn.primary', { type: 'button' }, '온라인으로 모이기');
  const local = h('button.btn', { type: 'button' }, '한 기기에서 하기');
  const refresh = () => {
    aiS.className = App.aiState === 'ok' ? 'ok' : App.aiState === 'no' ? 'no' : '';
    aiS.textContent = App.aiState === 'ok' ? 'AI 설계 사용 가능' : App.aiState === 'no' ? 'AI 연결 안 됨 · 기본 해석기로 진행' : 'AI 확인 중';
    roomS.className = App.roomState === 'ok' ? 'ok' : App.roomState === 'no' ? 'no' : '';
    roomS.textContent = App.roomState === 'ok' ? '온라인 모이기 가능' : App.roomState === 'no' ? '온라인 연결 안 됨 · 한 기기 모드로 진행' : '온라인 확인 중';
    online.disabled = App.roomState !== 'ok';
  };
  App.refreshHome = refresh;
  const takeName = () => { App.name = str(nick.value, 8, '') || '플레이어'; Sfx.init(); Sfx.play('ui'); };
  online.addEventListener('click', () => { takeName(); Online.enter(); });
  local.addEventListener('click', () => { takeName(); localSetup(); });
  const el = h('main.home',
    h('section.hero', stage.el, h('div.hero-copy',
      h('h1', '능력 난투'),
      h('p.tagline', '능력은 내가 쓰고, ', h('span.hazard-tag', '부작용'), '은 상대가 쓴다.'))),
    h('ol.how',
      h('li', h('b', '능력 쓰기'), '갖고 싶은 능력을 아무 말로나 적는다.'),
      h('li', h('b', '부작용 붙이기'), '상대들이 내 능력에 부작용을 하나씩 적는다.'),
      h('li', h('b', '난투'), 'AI가 둘을 합쳐 만든 캐릭터로 2~4명이 싸운다.')),
    h('section.panel.join',
      h('div', h('label', { htmlFor: 'nick' }, '닉네임 (8자까지)'), nick),
      h('div.row', online, local),
      h('p.status', aiS, roomS)));
  refresh();
  show(el, { cleanup: () => { alive = false; clearTimeout(demoT); if (stopDemo) stopDemo(); App.refreshHome = null; } });
  stage.fitText();
  startDemo();
}

/* ---------- 한 기기 모드 ---------- */
const Local = { humans: 1, names: ['', ''], bots: 1, map: -1, entries: null, token: 0 };

function seg(options, value, onPick, label) {
  const el = h('div.seg', { role: 'group', 'aria-label': label });
  const draw = (v) => el.replaceChildren(...options.map(([val, text]) => h('button', { type: 'button', 'aria-pressed': String(val === v), on: { click: () => { draw(val); onPick(val); } } }, text)));
  draw(value);
  return el;
}

function localSetup() {
  const L = Local;
  if (!L.names[0]) L.names[0] = App.name;
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });
  const draw = () => {
    const maxBots = 4 - L.humans, minBots = L.humans === 1 ? 1 : 0;
    L.bots = clamp(L.bots, minBots, maxBots);
    const botOpts = [];
    for (let i = minBots; i <= maxBots; i++) botOpts.push([i, i + '명']);
    const n1 = h('input#ln0', { type: 'text', maxLength: 8, value: L.names[0], placeholder: '1P' });
    n1.addEventListener('input', () => { L.names[0] = n1.value; });
    const n2 = h('input#ln1', { type: 'text', maxLength: 8, value: L.names[1], placeholder: '2P' });
    n2.addEventListener('input', () => { L.names[1] = n2.value; });
    body.replaceChildren(
      h('div', h('label', '직접 조작하는 사람'), seg([[1, '1명'], [2, '2명']], L.humans, (v) => { L.humans = v; draw(); }, '사람 수')),
      h('div.row', h('div.grow', h('label', { htmlFor: 'ln0' }, '1P 이름'), n1), L.humans === 2 ? h('div.grow', h('label', { htmlFor: 'ln1' }, '2P 이름'), n2) : null),
      h('div', h('label', '봇 (능력은 무작위, 부작용도 서로 붙여요)'), seg(botOpts, L.bots, (v) => { L.bots = v; }, '봇 수')),
      h('div', h('label', '맵'), seg([[-1, '랜덤']].concat(MAPS.map((m, i) => [i, m.short])), L.map, (v) => { L.map = v; }, '맵')),
      h('p.hint', App.touch
        ? (L.humans === 2 ? '휴대폰을 가로로 눕히면 왼쪽이 1P, 오른쪽이 2P예요. 조이스틱으로 움직이고 버튼으로 능력을 써요.' : '왼쪽 조이스틱으로 움직이고 오른쪽 버튼으로 능력을 써요. 능력은 가장 가까운 적을 자동으로 조준해요.')
        : (L.humans === 2 ? '1P: W A S D 이동, F G H T 능력 · 2P: 방향키 이동, K L ; O 능력 · 자동 조준' : '이동: 방향키 또는 W A S D · 능력: J K L I · 가장 가까운 적을 자동 조준')));
  };
  draw();
  show(h('main.page', h('section.panel',
    h('p.step', 'LOCAL'),
    h('h2', '한 기기에서 하기'),
    body,
    h('div.row', h('button.btn.primary', { type: 'button', on: { click: () => { Sfx.init(); Sfx.play('ui'); localStart(); } } }, '능력 쓰러 가기'), leaveBtn(goHome, '뒤로')))));
}

function localStart() {
  const L = Local, es = [];
  for (let i = 0; i < L.humans; i++) es.push({ name: str(L.names[i], 8, '') || (i ? '2P' : App.name || '1P'), bot: false, keymap: L.humans === 1 ? 'solo' : i ? 'p2' : 'p1', ability: '', sides: [] });
  if (es.length === 2 && es[0].name === es[1].name) es[1].name = str(es[1].name + '2', 8, '2P');
  const ab = shuffle(BOT_ABILITIES);
  for (let i = 0; i < L.bots; i++) es.push({ name: BOT_NAMES[i], bot: true, ability: ab[i], sides: [] });
  L.entries = es; L.token++;
  localWrite(0);
}
function localWrite(i) {
  const es = Local.entries, humans = es.filter((e) => !e.bot);
  if (i >= humans.length) return localSide(0);
  const e = humans[i];
  const go = () => show(abilityForm(e.name, (text) => { e.ability = text; localWrite(i + 1); }, `STEP 1 / 3 · ${i + 1} OF ${humans.length}`));
  if (humans.length > 1) show(passView(e.name, '능력을 쓸 차례예요.', go)); else go();
}
function localSide(i) {
  const es = Local.entries, humans = es.filter((e) => !e.bot);
  if (i >= humans.length) {
    es.forEach((b, bi) => { if (b.bot) es.forEach((t, ti) => { if (ti !== bi) t.sides.push({ by: b.name, text: pick(SIDE_IDEAS), o: bi }); }); });
    es.forEach((t) => t.sides.sort((a, b) => a.o - b.o));
    return localForge();
  }
  const e = humans[i], ei = es.indexOf(e);
  const targets = es.map((t, idx) => ({ idx, name: t.name, ability: t.ability })).filter((t) => t.idx !== ei);
  const go = () => show(sideForm(e.name, targets, (out) => { for (const k in out) es[k].sides.push({ by: e.name, text: out[k], o: ei }); localSide(i + 1); }, `STEP 2 / 3 · ${i + 1} OF ${humans.length}`));
  if (humans.length > 1) show(passView(e.name, '부작용을 쓸 차례예요. 다른 사람은 잠깐 보지 마세요.', go)); else go();
}
async function localForge() {
  const L = Local, es = L.entries, token = L.token;
  const view = forgeList(es, forgeNote());
  show(view.el);
  await Promise.all(es.map(async (e, i) => {
    const r = await forgeSpec(App.sample, e, (p) => view.set(i, p, false));
    e.spec = r.spec; e.err = r.err;
    view.set(i, 1, true);
  }));
  if (token !== L.token || App.root.firstChild !== view.el) return;
  const failed = es.filter((e) => e.err && e.err !== 'no_ai').length;
  if (failed) toast(`AI 응답을 받지 못한 ${failed}명은 기본 해석기로 만들었어요.`);
  localReveal();
}
function localReveal() {
  show(revealView(Local.entries, [
    h('button.btn.primary', { type: 'button', on: { click: () => { Sfx.init(); Sfx.play('ui'); localPractice(); } } }, '연습하고 시작'),
    h('button.btn', { type: 'button', on: { click: () => { Sfx.init(); Sfx.play('ui'); localBattle(); } } }, '바로 전투'),
    leaveBtn(goHome, '처음으로'),
  ], `전투 전에 ${PRACTICE_SEC}초 동안 허수아비에게 기술을 마음껏 써 볼 수 있어요.`));
}
function localPractice() {
  const L = Local, map = L.map < 0 ? randMap() : L.map;
  let gone = false;
  const pv = practiceView({
    fighters: L.entries.filter((e) => !e.bot).map((e) => ({ name: e.name, spec: e.spec, keymap: e.keymap })),
    mapIdx: map, onQuit: goHome,
    onReady: () => { if (gone || App.root.firstChild !== pv.el) return; gone = true; setTimeout(() => { if (App.root.firstChild === pv.el) localBattle(map); }, 250); },
  });
  show(pv.el, { battle: true, cleanup: pv.destroy });
  pv.fit(); requestAnimationFrame(pv.fit);
}
function localBattle(mapIdx) {
  const L = Local;
  const view = battleView({
    roster: L.entries.map((e) => ({ name: e.name, spec: e.spec, owned: true, bot: e.bot, keymap: e.keymap })),
    mapIdx: mapIdx != null ? mapIdx : L.map < 0 ? randMap() : L.map, decider: true, onQuit: goHome,
    onEnd: (win) => { const stats = view.battle.fighters.map((f) => f.stats); Sfx.play('win'); setTimeout(() => { if (App.root.firstChild === view.el) localResult(win, stats); }, 1100); },
  });
  show(view.el, { battle: true, cleanup: view.destroy });
  view.fit(); requestAnimationFrame(view.fit);
}
function localResult(win, stats) {
  show(resultView(Local.entries, win, stats, [
    h('button.btn.primary', { type: 'button', on: { click: () => { Sfx.play('ui'); localBattle(); } } }, '같은 능력으로 다시'),
    h('button.btn', { type: 'button', on: { click: () => { Sfx.play('ui'); localStart(); } } }, '새 능력 쓰기'),
    leaveBtn(goHome, '처음으로'),
  ]));
}

/* ---------- 온라인 모드 ---------- */
const Online = {
  on: false, timer: 0, view: '', hostPh: null, wasHost: false, prevHost: null, hostSeenAt: 0, lastPhase: 'lobby',
  rid: 0, bn: 0, bots: 0, map: -1, specs: null, abil: null, specKey: null, curBn: -1, bview: null, forgeToken: 0,
  gone: new Map(), revealAt: 0, resultAt: 0, force: false, ctx: null, dirty: false,

  enter() {
    this.on = true; this.view = ''; this.hostPh = null; this.wasHost = false; this.prevHost = null; this.specs = null; this.specKey = null; this.curBn = -1; this.bview = null;
    Net.set({ g: 1, n: App.name, j: Date.now(), ph: null, lb: null, rid: null, ab: null, sd: null, got: null, ch: null, f: null, ev: null, eb: null, pr: null });
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 120);
    this.tick();
  },
  leave() {
    this.on = false; clearInterval(this.timer); Net.docStop(); this.forgeToken++;
    Net.set({ g: null, n: null, j: null, ph: null, lb: null, rid: null, ab: null, sd: null, got: null, ch: null, f: null, ev: null, eb: null, pr: null });
    goHome();
  },
  render(key, build, opts) {
    if (this.view === key) return false;
    this.view = key;
    show(build(), opts);
    return true;
  },
  pushPh() { Net.set({ ph: this.hostPh }); },
  name(p) { return str(p && p.presence && p.presence.n, 8, '플레이어'); },

  tick() {
    if (!this.on) return;
    const me = Net.me();
    if (!me || !me.presence || me.presence.g !== 1) {
      this.render('conn', () => listView('연결하는 중', '잠시만 기다려 주세요.', [], h('div.row', leaveBtn(() => this.leave()))));
      return;
    }
    const players = Net.players(), now = Date.now();
    let host = players[0] || me;
    if (this.prevHost && host.peer !== this.prevHost.peer && !players.some((p) => p.peer === this.prevHost.peer) && now - this.hostSeenAt < 4000) host = this.prevHost;
    else { this.prevHost = host; this.hostSeenAt = now; }
    const amHost = host.peer === me.peer;
    if (amHost && !this.wasHost && !this.hostPh) {
      this.hostPh = { p: 'lobby' };
      this.pushPh(); Net.set({ lb: { bots: this.bots, map: this.map } });
      if (this.lastPhase !== 'lobby') toast('방장이 나가서 대기실로 돌아왔어요.');
    }
    if (!amHost && this.wasHost) { this.hostPh = null; this.forgeToken++; Net.docStop(); Net.set({ ph: null, lb: null }); }
    this.wasHost = amHost;
    const hp = host.presence && host.presence.ph;
    const ph = amHost ? this.hostPh : hp && typeof hp === 'object' && typeof hp.p === 'string' ? hp : { p: 'lobby' };
    this.lastPhase = ph.p;
    this.ctx = { me, players, host, amHost, ph, r: Array.isArray(ph.r) ? ph.r : [] };
    if (amHost) this.hostTick();
    this.follow();
  },

  /* ----- 방장이 하는 일 ----- */
  peerDone(pe, test) {
    const p = this.ctx.players.find((q) => q.peer === pe);
    if (!p) {
      if (!this.gone.has(pe)) this.gone.set(pe, Date.now());
      return Date.now() - this.gone.get(pe) > 5000 ? 'gone' : false;
    }
    this.gone.delete(pe);
    return test(p.presence) ? p : false;
  },
  hostTick() {
    const { ph, r } = this.ctx;
    if (ph.p === 'practice') {
      // 모두 준비를 누르거나 시간이 다 되면 전투 시작
      const all = r.every((e) => e.b || this.peerDone(e.pe, (pr) => pr.pr === ph.pn));
      if (all || Date.now() - (this.practiceAt || 0) > (ph.sec + 3) * 1000) this.startBattle();
      return;
    }
    if (ph.p === 'write') {
      let all = true;
      const got = r.map((e) => {
        if (e.b) return null;
        const d = this.peerDone(e.pe, (pr) => pr.rid === ph.rid && typeof pr.ab === 'string' && pr.ab);
        if (!d) all = false;
        return d;
      });
      if (all || this.force) {
        this.force = false;
        this.hostPh = { p: 'side', rid: ph.rid, r: r.map((e, i) => (e.b ? e : { pe: e.pe, n: e.n, ab: got[i] && got[i] !== 'gone' ? str(got[i].presence.ab, 80, '') || '평범한 사람' : '평범한 사람' })) };
        this.pushPh();
      }
    } else if (ph.p === 'side') {
      let all = true;
      const got = r.map((e) => {
        if (e.b) return null;
        const d = this.peerDone(e.pe, (pr) => pr.rid === ph.rid && pr.sd && typeof pr.sd === 'object');
        if (!d) all = false;
        return d;
      });
      if (all || this.force) {
        this.force = false;
        const entries = r.map((e, i) => ({
          name: e.n, ability: e.ab, bot: !!e.b,
          sides: r.map((o, j) => {
            if (j === i) return null;
            const g = got[j];
            const text = !o.b && g && g !== 'gone' && g.presence.sd ? str(g.presence.sd[i], 60, '') : '';
            return { by: o.n, text: text || (o.b ? pick(SIDE_IDEAS) : '부작용 없음') };
          }).filter(Boolean),
        }));
        this.hostPh = { p: 'forge', rid: ph.rid, r: r.map((e) => ({ pe: e.pe, n: e.n, b: e.b ? 1 : 0 })), pg: r.map(() => 0) };
        this.pushPh();
        this.forge(entries);
      }
    } else if (ph.p === 'forge' && this.dirty) { this.dirty = false; this.pushPh(); }
  },
  startRound() {
    const players = Net.players().slice(0, 4);
    const ab = shuffle(BOT_ABILITIES);
    const r = players.map((p) => ({ pe: p.peer, n: this.name(p) }));
    r.forEach((e, i) => { if (r.findIndex((o) => o.n === e.n) !== i) e.n = str(e.n + (i + 1), 8, 'P' + (i + 1)); });
    for (let i = 0; i < this.bots && r.length < 4; i++) r.push({ pe: '', n: BOT_NAMES[i], b: 1, ab: ab[i] });
    if (r.length < 2) { toast('두 명 이상이어야 시작할 수 있어요. 봇을 추가해 보세요.'); return; }
    this.rid = Date.now() % 1e9;
    this.force = false; this.gone.clear();
    this.hostPh = { p: 'write', rid: this.rid, r };
    this.pushPh();
  },
  async forge(entries) {
    const token = ++this.forgeToken, rid = this.hostPh.rid;
    let lastPush = 0;
    const specs = await Promise.all(entries.map(async (e, i) => {
      const res = await forgeSpec(App.sample, e, (p) => {
        if (token !== this.forgeToken || !this.hostPh || this.hostPh.p !== 'forge') return;
        this.hostPh.pg[i] = Math.round(p * 10) / 10;
        if (Date.now() - lastPush > 500) { lastPush = Date.now(); this.dirty = true; }
      });
      if (token === this.forgeToken && this.hostPh && this.hostPh.p === 'forge') { this.hostPh.pg[i] = 1; this.dirty = true; }
      return res.spec;
    }));
    if (token !== this.forgeToken || !this.on || !this.hostPh || this.hostPh.p !== 'forge' || this.hostPh.rid !== rid) return;
    this.specs = specs; this.abil = entries.map((e) => e.ability);
    const key = 'k' + rid + 'x' + ((Math.random() * 1e6) | 0);
    this.specKey = key;
    Net.docSend(key, JSON.stringify({ a: this.abil, s: specs }));
    Net.set({ got: key });
    this.revealAt = Date.now();
    this.hostPh = { p: 'reveal', rid, r: this.hostPh.r, k: key };
    this.pushPh();
  },
  startPractice() {
    const ph = this.hostPh;
    this.practiceAt = Date.now();
    this.hostPh = { p: 'practice', rid: ph.rid, r: ph.r, k: ph.k, pn: Date.now() % 1e9, mp: this.map < 0 ? randMap() : this.map, sec: PRACTICE_SEC };
    this.pushPh();
  },
  startBattle() {
    const ph = this.hostPh;
    Net.docStop();
    this.bn = (this.bn || 0) + 1;
    this.hostPh = { p: 'battle', rid: ph.rid, r: ph.r, k: ph.k, bn: this.bn, mp: ph.p === 'practice' ? ph.mp | 0 : this.map < 0 ? randMap() : this.map };
    this.pushPh();
  },

  /* ----- 모두가 하는 일: 방장의 단계에 맞춰 화면을 바꾼다 ----- */
  follow() {
    const { me, players, host, amHost, ph, r } = this.ctx;
    const myIdx = r.findIndex((e) => e && e.pe === me.peer);
    const quit = () => this.leave();
    const waitRows = (test) => r.map((e, i) => {
      const p = e.b ? null : players.find((q) => q.peer === e.pe);
      const done = e.b ? true : !!(p && test(p.presence));
      return { name: e.n, color: FIGHTER_COLORS[i % 4], sub: e.b ? '봇' : p ? '' : '연결 끊김', badge: done ? 'DONE' : 'WRITING', done };
    });
    const hostExtra = (label) => h('div.row',
      amHost ? h('button.btn.small', { type: 'button', on: { click: () => { this.force = true; } } }, label) : null,
      leaveBtn(quit));
    if (ph.p !== 'battle' && ph.p !== 'result') this.bview = null;
    if (ph.p !== 'practice') this.pview = null;

    switch (ph.p) {
      case 'lobby': {
        const lb = amHost ? { bots: this.bots, map: this.map } : host.presence.lb && typeof host.presence.lb === 'object' ? host.presence.lb : { bots: 0, map: -1 };
        const humans = players.slice(0, 4), maxBots = 4 - humans.length;
        if (amHost && this.bots > maxBots) { this.bots = Math.max(0, maxBots); Net.set({ lb: { bots: this.bots, map: this.map } }); }
        const nb = clamp(lb.bots | 0, 0, Math.max(0, maxBots));
        const key = 'lobby|' + players.map((p) => p.peer + this.name(p)).join(',') + '|' + amHost + '|' + nb + '|' + lb.map + '|' + host.peer;
        this.render(key, () => {
          const rows = players.map((p, i) => ({ name: this.name(p), color: i < 4 ? FIGHTER_COLORS[i] : 'var(--line)', sub: (p.peer === me.peer ? '나' : '') + (i >= 4 ? ' · 다음 판 대기' : ''), badge: p.peer === host.peer ? 'HOST' : null, host: true }));
          for (let i = 0; i < nb; i++) rows.push({ name: BOT_NAMES[i], color: FIGHTER_COLORS[(humans.length + i) % 4], sub: '봇', badge: 'BOT' });
          const botOpts = [];
          for (let i = 0; i <= Math.max(0, maxBots); i++) botOpts.push([i, i + '명']);
          const setLb = () => Net.set({ lb: { bots: this.bots, map: this.map } });
          const controls = amHost
            ? [h('div', h('label', '봇 추가'), seg(botOpts, nb, (v) => { this.bots = v; setLb(); }, '봇 수')),
              h('div', h('label', '맵'), seg([[-1, '랜덤']].concat(MAPS.map((m, i) => [i, m.short])), this.map, (v) => { this.map = v; setLb(); }, '맵')),
              h('div.row', h('button.btn.primary', { type: 'button', disabled: humans.length + nb < 2, on: { click: () => { Sfx.init(); Sfx.play('ui'); this.startRound(); } } }, '게임 시작'), leaveBtn(quit))]
            : [h('p.hint', '방장이 시작하면 바로 능력 쓰기로 넘어가요.'), h('div.row', leaveBtn(quit))];
          return listView('대기실', '이 페이지를 지금 열고 입장한 사람이 여기에 보여요. 최대 4명까지 한 판에 들어갑니다.', rows, controls, 'ONLINE LOBBY');
        });
        break;
      }
      case 'write': {
        if (myIdx < 0) { this.spectate(quit); break; }
        const mine = me.presence.rid === ph.rid && me.presence.ab;
        if (!mine) this.render('write:' + ph.rid, () => abilityForm(r[myIdx].n, (text) => { Net.set({ rid: ph.rid, ab: text, sd: null, got: null }); this.tick(); }));
        else {
          const rows = waitRows((pr) => pr.rid === ph.rid && pr.ab);
          this.render('writew:' + ph.rid + rows.map((x) => +x.done).join('') + amHost, () => listView('다른 사람이 능력을 쓰는 중', '모두 쓰면 부작용 붙이기로 넘어가요.', rows, hostExtra('기다리지 않고 넘어가기'), 'STEP 1 / 3'));
        }
        break;
      }
      case 'side': {
        if (myIdx < 0) { this.spectate(quit); break; }
        const mine = me.presence.rid === ph.rid && me.presence.sd;
        if (!mine) {
          const targets = r.map((e, idx) => ({ idx, name: e.n, ability: str(e.ab, 80, '') })).filter((t) => t.idx !== myIdx);
          this.render('side:' + ph.rid, () => sideForm(r[myIdx].n, targets, (out) => { Net.set({ rid: ph.rid, sd: out }); this.tick(); }));
        } else {
          const rows = waitRows((pr) => pr.rid === ph.rid && pr.sd);
          this.render('sidew:' + ph.rid + rows.map((x) => +x.done).join('') + amHost, () => listView('다른 사람이 부작용을 쓰는 중', '모두 쓰면 AI가 설계서를 만들어요.', rows, hostExtra('기다리지 않고 넘어가기'), 'STEP 2 / 3'));
        }
        break;
      }
      case 'forge': {
        const pg = Array.isArray(ph.pg) ? ph.pg : [];
        if (this.render('forge:' + ph.rid, () => { this.fview = forgeList(r.map((e) => ({ name: e.n, ability: e.b ? '봇' : '' })), amHost ? forgeNote() : '방장의 기기에서 AI가 모두의 설계서를 쓰고 있어요.'); return this.fview.el; }) || this.fview) {
          r.forEach((e, i) => this.fview.set(i, +pg[i] || 0, pg[i] >= 1));
        }
        break;
      }
      case 'reveal': case 'practice': case 'battle': case 'result': {
        if (this.specKey !== ph.k) {
          const txt = amHost ? null : Net.docPoll(host, ph.k);
          if (txt) {
            try {
              const d = JSON.parse(txt);
              this.specs = d.s.map((x) => sanSpec(x, (x.drawbacks || []).map((q) => ({ by: q.by, text: q.text })), x.ai, true));
              this.abil = d.a.map((a) => str(a, 80, ''));
              this.specKey = ph.k;
              Net.set({ got: ph.k });
            } catch (e) { this.specs = null; }
          }
          if (this.specKey !== ph.k) {
            this.render('recv:' + ph.k + ':' + ph.p, () => listView(ph.p === 'reveal' ? '설계서를 받는 중' : '게임이 진행 중이에요', ph.p === 'reveal' ? '곧 모두의 능력이 공개돼요.' : '다음 판부터 함께할 수 있어요.', [], h('div.row', leaveBtn(quit))));
            break;
          }
        }
        const entries = r.map((e, i) => ({ name: e.n, ability: this.abil[i] || '', spec: this.specs[i], bot: !!e.b }));
        if (entries.some((e) => !e.spec)) break;
        if (ph.p === 'reveal') {
          const waiting = r.filter((e) => !e.b && e.pe !== me.peer).filter((e) => { const p = players.find((q) => q.peer === e.pe); return p && p.presence.got !== ph.k; }).length;
          const ready = waiting === 0 || Date.now() - this.revealAt > 9000;
          this.render('reveal:' + ph.k + amHost + (amHost ? ready : ''), () => revealView(entries,
            amHost
              ? [h('button.btn.primary', { type: 'button', disabled: !ready, on: { click: () => { Sfx.init(); Sfx.play('ui'); this.startPractice(); } } }, ready ? '연습하고 시작' : '모두 받는 중'),
                h('button.btn', { type: 'button', disabled: !ready, on: { click: () => { Sfx.init(); Sfx.play('ui'); this.startBattle(); } } }, '바로 전투'), leaveBtn(quit)]
              : [leaveBtn(quit)],
            amHost ? `전투 전에 모두 ${PRACTICE_SEC}초 동안 허수아비에게 기술을 써 볼 수 있어요.` : myIdx < 0 ? '이번 판은 구경만 할 수 있어요.' : '방장이 시작하면 먼저 연습장에서 기술을 써 볼 수 있어요.'));
        } else if (ph.p === 'practice') {
          if (myIdx < 0) { this.render('pracw:' + ph.pn, () => listView('연습 시간', '참가자들이 허수아비에게 기술을 연습하는 중이에요. 곧 전투가 시작돼요.', [], h('div.row', leaveBtn(quit)))); break; }
          if (this.view !== 'practice:' + ph.pn) {
            const pn = ph.pn;
            const pv = practiceView({
              fighters: [{ name: entries[myIdx].name, spec: entries[myIdx].spec, keymap: 'solo' }],
              mapIdx: ph.mp | 0, sec: clamp(+ph.sec || PRACTICE_SEC, 10, 90), onQuit: quit,
              onReady: () => { Net.set({ pr: pn }); this.tick(); return 'wait'; },
            });
            this.pview = pv; this.view = 'practice:' + pn;
            show(pv.el, { battle: true, cleanup: pv.destroy });
            pv.fit(); requestAnimationFrame(pv.fit);
          }
          const hum = r.filter((e) => !e.b);
          const rd = hum.filter((e) => { const p = players.find((q) => q.peer === e.pe); return !p || p.presence.pr === ph.pn; }).length;
          if (this.pview) this.pview.status(`대기 ${rd}/${hum.length}`);
        } else if (ph.p === 'battle') {
          if (this.curBn !== ph.bn) {
            this.curBn = ph.bn; this.resultAt = 0;
            Net.startBattle(ph.bn);
            Net.set({ ab: null, sd: null });
            const hostPeer = host.peer, miss = new Map();
            const ownerOf = (idx) => { const e = r[idx]; return e ? (e.b ? hostPeer : e.pe) : null; };
            let fr = 0;
            const view = battleView({
              roster: entries.map((e, i) => ({ name: e.name, spec: e.spec, owned: e.bot ? amHost : r[i].pe === me.peer, bot: e.bot, keymap: 'solo' })),
              mapIdx: ph.mp | 0, net: true, decider: amHost, ownerOf, onQuit: quit,
              tick: (battle) => {
                if (fr++ % 30) return;
                const here = new Set(Net.peers().map((p) => p.peer)), t = Date.now();
                battle.fighters.forEach((f) => {
                  if (f.owned || !f.alive) return;
                  const o = ownerOf(f.idx);
                  if (here.has(o)) { miss.delete(f.idx); return; }
                  if (!miss.has(f.idx)) miss.set(f.idx, t);
                  else if (t - miss.get(f.idx) > 5000) battle.onKO(f.idx, -1);
                });
              },
              onEnd: (win) => {
                if (!this.hostPh || this.hostPh.p !== 'battle' || this.hostPh.bn !== ph.bn) return;
                this.hostPh = Object.assign({}, this.hostPh, { p: 'result', win, sc: view.battle.fighters.map((f) => [Math.round(f.stats.dealt), Math.round(f.stats.taken), f.stats.ko]) });
                this.pushPh();
              },
            });
            this.bview = view;
            this.view = 'battle:' + ph.bn;
            show(view.el, { battle: true, cleanup: view.destroy });
            view.fit(); requestAnimationFrame(view.fit);
          }
        } else {
          if (this.curBn === ph.bn && this.bview && !this.resultAt) { this.resultAt = Date.now(); Sfx.play('win'); }
          if (this.curBn === ph.bn && this.bview && Date.now() - this.resultAt < 1100) break;
          const sc = Array.isArray(ph.sc) ? ph.sc : [];
          const stats = entries.map((e, i) => { const s = Array.isArray(sc[i]) ? sc[i] : []; return { dealt: +s[0] || 0, taken: +s[1] || 0, ko: s[2] | 0 }; });
          this.render('result:' + ph.bn + amHost, () => resultView(entries, ph.win | 0, stats,
            amHost
              ? [h('button.btn.primary', { type: 'button', on: { click: () => { Sfx.play('ui'); this.hostPh = Object.assign({}, this.hostPh, { p: 'reveal' }); this.revealAt = 0; this.startBattle(); } } }, '같은 능력으로 다시'),
                h('button.btn', { type: 'button', on: { click: () => { Sfx.play('ui'); this.startRound(); } } }, '새 능력 쓰기'),
                h('button.btn.small', { type: 'button', on: { click: () => { this.hostPh = { p: 'lobby' }; this.pushPh(); } } }, '대기실로'),
                leaveBtn(quit)]
              : [leaveBtn(quit)],
            amHost ? null : '방장이 다음 판을 고르는 중이에요.'));
        }
        break;
      }
    }
  },
  spectate(quit) {
    this.render('spec', () => listView('게임이 진행 중이에요', '다음 판부터 함께할 수 있어요. 방장이 새 판을 시작할 때까지 기다려 주세요.', [], h('div.row', leaveBtn(quit))));
  },
};

/* ---------- 시작 ---------- */
function start(saved) {
  App.root = $('#app');
  if (saved && typeof saved.name === 'string') App.name = str(saved.name, 8, '');
  goHome();
  const cl = window.claude;
  if (cl && typeof cl.use === 'function') {
    Promise.resolve().then(() => cl.use('sample')).then((s) => { App.sample = typeof s === 'function' && typeof s.json === 'function' ? s : null; }).catch(() => { App.sample = null; })
      .then(() => { App.aiState = App.sample ? 'ok' : 'no'; if (App.refreshHome) App.refreshHome(); });
    Net.init().then((r) => { App.roomState = r ? 'ok' : 'no'; if (App.refreshHome) App.refreshHome(); });
  } else { App.aiState = 'no'; App.roomState = 'no'; if (App.refreshHome) App.refreshHome(); }
}
try { if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ name: App.name })); } catch (e) { /* 무시 */ }
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
else start((window.claude && window.claude.hot && window.claude.hot.data) || {});

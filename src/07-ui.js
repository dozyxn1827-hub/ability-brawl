/* ===== 화면 부품 ===== */
const App = {
  root: null, cleanups: [], name: '', sample: null, aiState: 'wait', roomState: 'wait',
  touch: (window.matchMedia && matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window,
};

function show(node, opts) {
  App.cleanups.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* 무시 */ } });
  document.body.classList.toggle('in-battle', !!(opts && opts.battle));
  App.root.replaceChildren(node);
  if (opts && opts.cleanup) App.cleanups.push(opts.cleanup);
  window.scrollTo(0, 0);
}
let toastEl = null, toastT = 0;
function toast(msg) {
  if (toastEl) toastEl.remove();
  toastEl = h('div.toast', { role: 'status' }, msg);
  document.body.append(toastEl);
  clearTimeout(toastT);
  toastT = setTimeout(() => { if (toastEl) toastEl.remove(); toastEl = null; }, 3200);
}

function mkStage() {
  const screen = h('canvas.screen', { width: 300, height: 200 });
  const el = h('div.stage', screen);
  const fitText = () => {
    const r = el.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), hh = Math.max(1, Math.round(r.height * dpr));
    if (screen.width !== w || screen.height !== hh) { screen.width = w; screen.height = hh; }
  };
  return { el, world: screen, text: screen, fitText };
}

function runLoop(battle, stage, hooks) {
  let raf = 0, last = performance.now(), acc = 0, frame = 0, stopped = false;
  const DT = 1 / 60;
  const tick = (t) => {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    acc += Math.min(0.25, Math.max(0, (t - last) / 1000)); last = t;
    if (hooks && hooks.pre) hooks.pre();
    let n = 0;
    while (acc >= DT && n < 6) { battle.step(DT); acc -= DT; n++; }
    if (n === 6) acc = 0;
    if ((frame & 31) === 0) stage.fitText();
    battle.draw(n ? n * DT : 0);
    if (hooks && hooks.post) hooks.post(frame);
    frame++;
  };
  raf = requestAnimationFrame(tick);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

/** 캐릭터 초상화 (픽셀 그대로 키워서 보여 준다) */
function portrait(spec, pose, dir) {
  const m = makeCanvas(SW, SH);
  renderSprite(m[0], spec.look, { pose: pose || 'idle', t: 0, dir: dir || 0, hurt: false, st: {}, hurtFlash: false, glow: pose === 'cast' ? spec.look.accent : null });
  const p = makeCanvas(SW, SW);
  p[1].drawImage(m[0], 0, -(OY - 38));
  p[0].className = 'portrait';
  p[0].setAttribute('role', 'img');
  return p[0];
}
/** 세 가지 자세를 나란히 */
function poseStrip(spec) {
  const m = makeCanvas(SW * 3, 46);
  const one = makeCanvas(SW, SH);
  [['idle', 0], ['run', 2], ['cast', 0]].forEach(([pose, dir], i) => {
    renderSprite(one[0], spec.look, { pose, t: pose === 'run' ? 0.05 : 0, dir, st: {}, glow: spec.moves.ult.color });
    m[1].drawImage(one[0], i * SW, -(OY - 44));
  });
  m[0].className = 'poses';
  m[0].setAttribute('role', 'img');
  m[0].setAttribute('aria-label', `${spec.title} 모습`);
  return m[0];
}

function mkHud(battle) {
  const el = h('div.hud');
  const cards = battle.fighters.map((f) => {
    const hp = h('i'), lag = h('b'), sh = h('u'), hpn = h('span.hpn'), sts = h('div.sts');
    const pc = portrait(f.spec); pc.className = 'hface';
    const card = h('div.hcard', { style: { '--pc': f.color } }, h('div.top', pc, h('span.n', f.name), hpn), h('div.hp', lag, hp, sh), sts);
    el.append(card);
    return { card, hp, lag, sh, hpn, sts, key: '' };
  });
  const update = () => battle.fighters.forEach((f, i) => {
    const c = cards[i];
    c.hp.style.width = clamp(f.hp / f.maxHp * 100, 0, 100) + '%';
    c.lag.style.width = clamp(f.hpShow / f.maxHp * 100, 0, 100) + '%';
    c.sh.style.width = clamp((f.stPow && f.stPow.shield ? f.stPow.shield : f.st.shield ? 20 : 0) / f.maxHp * 100, 0, 100) + '%';
    c.hpn.textContent = Math.max(0, Math.ceil(f.hp));
    c.card.classList.toggle('ko', !f.alive);
    const keys = ST_ALL.filter((k) => f.st[k]).slice(0, 4);
    const key = keys.join(',');
    if (key !== c.key) {
      c.key = key;
      c.sts.replaceChildren(...keys.map((k) => h('span', { style: { background: ST_COLOR[k] } }, ST_KO[k])));
    }
  });
  return { el, update };
}

/** 터치 조이스틱: 누른 곳에서 끌어당긴 방향으로 움직인다 */
function mkJoy(f) {
  const knob = h('i');
  const el = h('div.joy', { role: 'group', 'aria-label': `${f.name} 이동 조이스틱`, style: { '--pc': f.color } }, knob);
  let id = null, cx = 0, cy = 0, rad = 40;
  const set = (e) => {
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const l = Math.hypot(dx, dy);
    if (l > rad) { dx = dx / l * rad; dy = dy / l * rad; }
    knob.style.setProperty('--jx', dx + 'px'); knob.style.setProperty('--jy', dy + 'px');
    const m = Math.hypot(dx, dy) / rad;
    f.ctrl.joy = m < 0.2 ? { x: 0, y: 0 } : { x: dx / rad / Math.max(m, 0.001) * Math.min(1, m * 1.4), y: dy / rad / Math.max(m, 0.001) * Math.min(1, m * 1.4) };
  };
  const end = () => { id = null; f.ctrl.joy = null; knob.style.setProperty('--jx', '0px'); knob.style.setProperty('--jy', '0px'); el.classList.remove('is-down'); };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); Sfx.init();
    id = e.pointerId; try { el.setPointerCapture(id); } catch (err) { /* 무시 */ }
    const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; rad = r.width * 0.36;
    el.classList.add('is-down'); set(e);
  });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === id) { e.preventDefault(); set(e); } });
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  return el;
}

function mkPads(humans) {
  const duo = humans.length > 1;
  const el = h('div.pads' + (duo ? '.duo' : ''));
  const skill = [];
  humans.forEach((f) => {
    const hint = KEY_HINT[f.keymap] || KEY_HINT.solo;
    const sk = (k, slot) => {
      const mv = f.spec.moves[slot];
      const cdn = h('span.cdn'), lbl = h('span.lbl', mv.name);
      const ic = glyphIcon(rowsOf(mv.shape, mv.pix), mv.color);
      const lk = !!f.lock[slot];
      const b = h('button.pb' + (lk ? '.locked' : ''), { type: 'button', 'data-k': k, 'aria-label': `${SLOT_KO[slot]} ${mv.name}${lk ? ' (봉인)' : ''}`, style: { '--pc': mv.color } }, h('span.cdfill'), ic, lbl, h('span.key', App.touch ? SLOT_KO[slot] : hint[k]), cdn, lk ? h('span.lockx', '봉인') : null);
      bindHold(b, () => { Sfx.init(); f.ctrl.press(k); }, () => f.ctrl.release(k));
      skill.push({ f, slot, b, cdn, last: -1, was: 0 });
      return b;
    };
    const pad = h('div.pad', App.touch ? mkJoy(f) : null, h('div.pad-act', sk('a', 'basic'), sk('b', 's1'), sk('c', 's2'), sk('u', 'ult')));
    if (!App.touch) pad.classList.add('keys');
    el.append(pad);
    if (!App.touch) el.append(h('p.pad-help', `${f.name} · 이동 ${hint.move} · 능력 ${hint.a} ${hint.b} ${hint.c} ${hint.u} · 가장 가까운 적을 자동 조준`));
  });
  const update = () => {
    for (const s of skill) {
      const f = s.f, cd = f.cd[s.slot], mx = f.cdMax[s.slot] || 1;
      const frac = cd > 0 ? clamp(cd / mx, 0, 1) : 0;
      const q = Math.round(frac * 40);
      if (q !== s.last) { s.last = q; s.b.style.setProperty('--cd', frac.toFixed(3)); }
      if (s.was > 0 && cd <= 0 && f.alive) { s.b.classList.remove('ready'); void s.b.offsetWidth; s.b.classList.add('ready'); if (s.slot === 'ult') Sfx.play('ready'); }
      s.was = cd;
      const uses = f.uses[s.slot];
      const t = cd >= 1 ? String(Math.ceil(cd)) : uses !== Infinity ? 'x' + uses : '';
      if (s.cdn.textContent !== t) s.cdn.textContent = t;
      s.b.classList.toggle('off', !f.alive || uses <= 0 || !!f.st.silence || !!f.st.morph);
    }
  };
  return { el, update };
}

/** 전투 화면 전체 */
function battleView(o) {
  const stage = mkStage();
  const roster = o.roster.map((e) => {
    const r = Object.assign({}, e);
    if (e.owned && !e.bot && !e.dummy) r.ctrl = new Ctrl(e.keymap || 'solo');
    return r;
  });
  const focus = roster.map((e, i) => (e.owned && !e.bot && !e.dummy ? i : -1)).filter((i) => i >= 0);
  const battle = new Battle({ canvas: stage.world, roster, mapIdx: o.mapIdx, net: o.net ? Net : null, decider: o.decider, onEnd: o.onEnd, sfx: (n, st, ex) => Sfx.play(n, st, ex), focus, practice: o.practice });
  Music.play(o.mapIdx);
  const humans = [];
  battle.fighters.forEach((f, i) => { if (roster[i].ctrl) { f.keymap = roster[i].keymap || 'solo'; humans.push(f); } });
  const hud = mkHud(battle), pads = mkPads(humans);
  const timer = h('div.bt-timer', '0');
  const tog = (label, get, set) => { const b = h('button', { type: 'button', class: get() ? '' : 'off', on: { click: () => { set(!get()); Sfx.init(); b.classList.toggle('off', !get()); Sfx.play('ui'); } } }, label); return b; };
  const pop = h('div.snd-pop',
    tog('효과음', () => Sfx.on, (v) => { Sfx.on = v; Sfx.save(); }),
    tog('음악', () => Sfx.musicOn, (v) => Sfx.setMusic(v)),
    tog('목소리', () => Sfx.voiceOn, (v) => { Sfx.voiceOn = v; Sfx.save(); if (!v && window.speechSynthesis) window.speechSynthesis.cancel(); }));
  const sndB = h('button.sndb', { type: 'button', 'aria-expanded': 'false', on: { click: () => { Sfx.init(); const open = pop.classList.toggle('open'); sndB.setAttribute('aria-expanded', String(open)); } } }, '소리');
  const snd = h('div.snd', sndB, pop);
  let armed = 0;
  const quit = h('button', { type: 'button', on: { click: () => { if (Date.now() - armed < 2500) o.onQuit(); else { armed = Date.now(); quit.textContent = '한 번 더 누르면 나가기'; setTimeout(() => { quit.textContent = 'EXIT'; }, 2500); } } } }, 'EXIT');
  const info = h('div.bt-info', humans.map((f) => h('div', { style: { '--pc': f.color } }, h('b', `${f.name}의 부작용`), f.spec.drawbacks.length ? f.spec.drawbacks.flatMap((d) => allRules(d).map((r) => h('span', r))) : h('span', '없음'))));
  if (o.practice) timer.style.display = 'none';
  const wrap = h('div.stage-wrap', stage.el, timer, h('div.bt-tools', snd, o.onQuit ? quit : null), humans.length ? info : null, o.overlay || null);
  const el = h('div.battle', hud.el, wrap, humans.length ? pads.el : null);
  const fit = () => {
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    if (!cw || !ch) return;
    // 화면 비율에 맞춰 무대를 최대한 넓게 (카메라가 보이는 범위를 맞춘다)
    const infoH = humans.length && ch > cw * 1.2 ? Math.min(70, 26 + 18 * humans.length) : 0;
    const avail = ch - infoH;
    let w = cw, sh = avail;
    if (w / sh > 2.2) w = Math.floor(sh * 2.2);
    if (w / sh < 0.72) sh = Math.floor(w / 0.72);
    stage.el.style.width = w + 'px'; stage.el.style.height = sh + 'px';
    info.style.top = sh + 'px';
    info.style.display = infoH && ch - sh >= 40 ? '' : 'none';
    info.style.maxHeight = Math.max(0, ch - sh) + 'px';
    if (o.overlay) o.overlay.style.bottom = (ch - sh + 6) + 'px';
    stage.fitText();
  };
  const stop = runLoop(battle, stage, {
    pre: () => { if (o.net) Net.pollBattle(battle, o.ownerOf); if (o.tick) o.tick(battle); },
    post: (frame) => {
      if (frame % 6 === 0) {
        hud.update(); pads.update();
        const t = Math.max(0, battle.t - 2.7);
        timer.textContent = battle.sudden ? 'SUDDEN DEATH' : String(Math.floor(t));
      }
      if (frame % 20 === 0) fit();
      if (o.net && frame % 4 === 0) {
        const snaps = {};
        for (const f of battle.fighters) if (f.owned) snaps[f.idx] = battle.snapshot(f);
        Net.publish(snaps);
      }
    },
  });
  window.addEventListener('resize', fit);
  const destroy = () => { stop(); window.removeEventListener('resize', fit); Keys.pressed.clear(); };
  return { el, battle, fit, destroy };
}

/* ----- 연습장: 진짜 전투 전에 허수아비에게 기술을 마음껏 써 본다 ----- */
const PRACTICE_SEC = 45;
function dummySpec(wander) {
  return sanSpec({
    title: '허수아비',
    look: { skin: '#e3c27a', hair: '#e8c860', body: '#8a5a2b', accent: '#c23b22', head: wander ? 'cap' : 'hat', outfit: 'plain' },
    stats: { hp: 140, speed: 0.8 },
    lines: { intro: wander ? '나 잡아 봐라~' : '살살 때려 주세요' },
  }, [], false);
}
function practiceView(o) {
  const sec = o.sec || PRACTICE_SEC, t0 = Date.now();
  const roster = o.fighters.map((e) => ({ name: e.name, spec: e.spec, owned: true, keymap: e.keymap }))
    .concat([{ name: '허수아비', spec: dummySpec(false), owned: true, dummy: true }, { name: '도망이', spec: dummySpec(true), owned: true, dummy: true, wander: true }]);
  let done = false, waiting = false;
  const left = h('b.prac-left', String(sec));
  const marks = h('div.prac-marks');
  const btn = h('button.prac-go', { type: 'button', on: { click: () => ready() } }, '준비 완료 ▶');
  const chip = h('div.prac', h('span.prac-tag', '연습'), left, marks, btn);
  const ready = () => {
    if (done || waiting) return;
    Sfx.init(); Sfx.play('ready');
    if (o.onReady && o.onReady() === 'wait') { waiting = true; btn.disabled = true; btn.textContent = '대기 중'; return; }
    done = true;
  };
  let fr = 0, markKey = '';
  const SHORT = { basic: '1', s1: '2', s2: '3', ult: '궁' };
  const view = battleView({
    roster, mapIdx: o.mapIdx, practice: true, decider: true, onQuit: o.onQuit, overlay: chip,
    tick: (battle) => {
      if (fr++ % 10) return;
      const rem = Math.max(0, Math.ceil(sec - (Date.now() - t0) / 1000));
      left.textContent = rem > 0 ? String(rem) : '0';
      left.classList.toggle('hot', rem <= 10);
      const me = battle.fighters.filter((f) => !f.dummy);
      const key = me.map((f) => SLOTS.map((sl) => (f.tried[sl] ? 1 : 0)).join('')).join('|');
      if (key !== markKey) {
        markKey = key;
        marks.replaceChildren(...me.map((f) => h('span.prac-m', { style: { '--pc': f.color }, title: f.name + ' 써 본 기술' },
          ...SLOTS.map((sl) => h('i', { class: f.tried[sl] ? 'on' : '' }, SHORT[sl])))));
        chip.classList.toggle('all', me.every((f) => SLOTS.every((sl) => f.tried[sl])));
      }
      if (rem <= 0 && !done && !waiting) ready();
    },
  });
  setTimeout(() => toast(`연습 ${sec}초! 허수아비에게 기술을 마음껏 써 보세요. 연습에서는 아무도 쓰러지지 않아요.`), 300);
  return {
    el: view.el, fit: view.fit, destroy: view.destroy, battle: view.battle,
    status(text) { if (waiting) btn.textContent = text; },
  };
}

/** 설계서 카드 */
/** 부작용으로 봉인된 기술 */
function lockedSlots(sp) {
  const out = new Set();
  for (const d of sp.drawbacks) for (const x of [d.fx].concat(d.more || [])) {
    if (x && (x.t === 'lock' || (x.t === 'uses' && x.n === 0))) SLOTS.forEach((s) => { if (onMatch(x.on, s)) out.add(s); });
  }
  return out;
}
const allRules = (d) => [d.fx].concat(d.more || []).filter(Boolean).map(dfxText).filter(Boolean);

function fighterCard(e, idx) {
  const sp = e.spec, color = FIGHTER_COLORS[idx % 4];
  const st = sp.stats;
  const locks = lockedSlots(sp);
  const moves = h('ul.moves', SLOTS.map((s) => {
    const m = sp.moves[s], lk = locks.has(s);
    return h('li' + (lk ? '.locked' : ''), { 'data-mcf': s }, h('span.slot', { style: { '--mc': m.color } }, SLOT_KO[s]),
      h('span.mn', glyphIcon(rowsOf(m.shape, m.pix), m.color, 28), m.name, lk ? h('span.lock-tag', '봉인') : null, m.was ? h('span.was-tag', '바뀜') : null),
      h('span.cd', m.cd + '초'),
      h('span.md', m.was ? h('s', m.was) : null, m.was ? ' → ' : null, [m.desc, m.say ? ` “${m.say}”` : '', ` · ${VFX_KO[m.vfx] || ''}`].join('')));
  }));
  return h('article.fcard', { style: { '--pc': color } },
    h('header', { 'data-mcf': 'head' }, poseStrip(sp), h('div', h('p.fname', e.name), h('h3', sp.title), sp.concept ? h('p.concept', sp.concept) : null)),
    h('div.sec', { 'data-mcf': 'ability' }, h('p.ability.quote', e.ability),
      h('p.stats', h('span', '체력 ', h('b', Math.round(st.hp * HP_SCALE))), h('span', '속도 ', h('b', '×' + st.speed)), h('span', '몸집 ', h('b', '×' + st.size)), h('span', '옷 ', h('b', { text: { plain: '기본', robe: '로브', armor: '갑옷', stripes: '줄무늬', suit: '정장', dress: '드레스', spots: '점박이' }[sp.look.outfit] || '기본' })))),
    h('div.sec', { 'data-mcf': 'moves' }, moves, sp.passive ? h('p.passive', { 'data-mcf': 'passive' }, h('b', '패시브 · ' + PASSIVE_KO[sp.passive.k]), ' ', sp.passive.desc) : null),
    sp.drawbacks.length ? h('div.sec', { 'data-mcf': 'draws' }, h('div', h('span.hazard-tag', '부작용')), h('ul.draws', sp.drawbacks.map((d, di) =>
      h('li', { 'data-mcf': 'draw-' + di }, h('span.by', d.by + ' 작성'), h('span.quote', d.text), h('span.dh', d.how), allRules(d).filter((r) => r !== d.how).map((r) => h('span.mech', '규칙: ' + r)))))) : null,
    sp.lines && (sp.lines.ko || sp.lines.win) ? h('div.sec.lines', sp.lines.ko ? h('span', '쓰러질 때 “' + sp.lines.ko + '”') : null, sp.lines.win ? h('span', '이길 때 “' + sp.lines.win + '”') : null) : null,
    h('p.src', sp.ai ? 'DESIGNED BY AI' : 'BASIC INTERPRETER'));
}

/** 능력 쓰기 폼 (예시 없이 플레이어가 직접 쓴다) */
function abilityForm(name, onDone, stepText) {
  const ta = h('textarea#ab-text', { maxLength: 80, rows: 3 });
  const go = h('button.btn.primary', { type: 'button', disabled: true }, '이 능력으로 정하기');
  ta.addEventListener('input', () => { go.disabled = !str(ta.value, 80, ''); });
  go.addEventListener('click', () => { const v = str(ta.value, 80, ''); if (!v) return; Sfx.init(); Sfx.play('ui'); onDone(v); });
  const el = h('main.page', h('section.panel',
    h('p.step', stepText || 'STEP 1 / 3'),
    h('h2', `${name}의 능력`),
    h('p.hint', '어떤 능력이든 직접 지어서 적어요. 아무리 이상한 능력이어도 AI가 그 내용 그대로 능력 기술 세 개와 궁극기로 만들어요.'),
    h('div', h('label', { htmlFor: 'ab-text' }, '내 능력 (80자까지)'), ta),
    h('div.row', go)));
  setTimeout(() => { if (!App.touch) ta.focus(); }, 30);
  return el;
}

/** 부작용 쓰기 폼. targets: [{idx,name,ability}] */
function sideForm(name, targets, onDone, stepText) {
  const go = h('button.btn.primary', { type: 'button', disabled: true }, '부작용 확정');
  const inputs = targets.map((t) => h('input', { type: 'text', id: 'sd-' + t.idx, maxLength: 60, autocomplete: 'off' }));
  const check = () => { go.disabled = inputs.some((x) => !str(x.value, 60, '')); };
  inputs.forEach((x) => x.addEventListener('input', check));
  go.addEventListener('click', () => {
    if (inputs.some((x) => !str(x.value, 60, ''))) return;
    const out = {};
    targets.forEach((t, i) => { out[t.idx] = str(inputs[i].value, 60, ''); });
    Sfx.init(); Sfx.play('ui');
    onDone(out);
  });
  const el = h('main.page', h('section.panel',
    h('p.step', stepText || 'STEP 2 / 3'),
    h('h2', `${name}, 상대 능력에 부작용을 붙여요`),
    h('p.hint', '상대마다 하나씩 직접 지어서 적어요. 적은 그대로 AI가 실제 불이익으로 만들어요.'),
    targets.map((t, i) => h('div.side-card', h('div.stripe'), h('div.in',
      h('div.target', h('span.who', { style: { color: FIGHTER_COLORS[t.idx % 4] } }, t.name + '의 능력'), h('span.quote', t.ability)),
      h('div', h('label', { htmlFor: 'sd-' + t.idx }, '이 능력의 부작용 (60자까지)'), inputs[i])))),
    h('div.row', go)));
  return el;
}

/** 진행 목록: rows [{name,color,sub,badge,done,progress}] */
function listView(title, hintText, rows, extra, stepText) {
  return h('main.page', h('section.panel',
    stepText ? h('p.step', stepText) : null,
    h('h2', title),
    hintText ? h('p.hint', hintText) : null,
    h('ul.plist', rows.map((r) => h('li', { style: { '--pc': r.color || 'var(--line)' } },
      h('span.nm', r.name), h('span.sub', r.sub || ''),
      r.progress != null ? h('span.bar', h('i', { style: { width: Math.round(r.progress * 100) + '%' } })) : null,
      r.badge ? h('span.badge' + (r.done ? '.done' : '') + (r.host ? '.host' : ''), r.badge) : null))),
    extra || null));
}

function resultView(roster, winIdx, stats, buttons, note) {
  setTimeout(() => Music.play('menu'), 1800);
  const w = roster[winIdx];
  return h('main.page', h('section.panel.result',
    h('p.step', 'RESULT'),
    h('h2', w ? `${w.name} 승리!` : '무승부'),
    w ? portrait(w.spec, 'cast') : null,
    w && w.spec.lines && w.spec.lines.win ? h('p.winline', '“' + w.spec.lines.win + '”') : null,
    w ? h('p', `${w.spec.title} · “${w.ability}”`) : null,
    h('table.score', h('thead', h('tr', h('th', '이름'), h('th', '준 피해'), h('th', '받은 피해'), h('th', 'K.O.'))),
      h('tbody', roster.map((e, i) => { const s = stats[i] || { dealt: 0, taken: 0, ko: 0 }; return h('tr', h('td', { style: { color: FIGHTER_COLORS[i % 4] } }, e.name), h('td', Math.round(s.dealt)), h('td', Math.round(s.taken)), h('td', s.ko)); }))),
    note ? h('p.hint', note) : null,
    h('div.row', { style: { justifyContent: 'center' } }, buttons)));
}

/* ===== 설계서 공개 MC: 각 캐릭터 카드 안에서 능력과 부작용을 차례로 소개한다 ===== */
const MC_NAME = 'MC 왕수다';
const MC = { played: new Map(), sprites: new Set(), raf: 0, run: null };
const MC_REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/** MC 그림 (24×34 픽셀). pose: talk | point | hype | shock | wait | done */
function mcDraw(g, t, pose, open) {
  const bob = MC_REDUCED ? 0 : pose === 'hype' ? -Math.round(Math.abs(Math.sin(t * 9)) * 2) : pose === 'wait' ? (Math.floor(t * 1.5) % 2) : (Math.floor(t * 4) % 2);
  const oy = 1 + bob;
  const r = (x, y, w, hh, c) => { g.fillStyle = c; g.fillRect(x, y + oy, w, hh); };
  const SK = '#f2c79b', SKD = '#d9a273', HR = '#1a1426', HRL = '#6a5acd', JK = '#ffcf3a', JKD = '#c9971e', JKL = '#fff6c8';
  const PN = '#2e2660', SH = '#0e0b1e', BT = '#ff4d6d', GL = '#0e0b1e', MIC = '#b8b8cc', MICD = '#4a4a5e', MO = '#5a1a2a';
  // 스포트라이트와 그림자
  g.fillStyle = pose === 'wait' ? 'rgba(255,247,200,0.05)' : 'rgba(255,247,200,0.14)';
  g.beginPath(); g.moveTo(8, 0); g.lineTo(16, 0); g.lineTo(23, 34); g.lineTo(1, 34); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(5, 32, 14, 2);
  // 다리·신발
  r(9, 24, 3, 6, PN); r(13, 24, 3, 6, PN); r(8, 30, 4, 2, SH); r(13, 30, 4, 2, SH);
  // 반짝이 재킷
  r(7, 15, 10, 10, JK); r(7, 15, 1, 10, JKD); r(16, 15, 1, 10, JKD); r(7, 24, 3, 1, JKD); r(14, 24, 3, 1, JKD);
  r(11, 15, 2, 7, '#ffffff'); r(10, 15, 1, 4, JKD); r(13, 15, 1, 4, JKD);
  if (!MC_REDUCED) { const k = Math.floor(t * 6); r(8 + (k * 3) % 8, 17 + (k * 5) % 6, 1, 1, JKL); r(8 + (k * 5 + 4) % 8, 17 + (k * 3 + 2) % 6, 1, 1, JKL); }
  r(10, 15, 1, 2, BT); r(13, 15, 1, 2, BT); r(11, 15, 2, 1, BT);
  // 머리
  r(11, 14, 2, 1, SKD); r(8, 6, 8, 8, SK); r(7, 9, 1, 2, SK); r(16, 9, 1, 2, SK); r(9, 13, 6, 1, SKD);
  r(7, 3, 10, 4, HR); r(8, 2, 9, 1, HR); r(14, 1, 4, 2, HR); r(9, 3, 4, 1, HRL); r(15, 1, 2, 1, HRL); r(8, 6, 1, 3, HR); r(15, 6, 1, 3, HR);
  if (pose === 'shock') {
    // 선글라스를 이마로 올리고 눈이 휘둥그레
    r(8, 5, 8, 1, GL); r(9, 8, 2, 2, '#ffffff'); r(13, 8, 2, 2, '#ffffff'); r(10, 9, 1, 1, GL); r(13, 9, 1, 1, GL);
    r(10, 10, 4, 1, HR); r(11, 11, 2, 2, MO);
  } else {
    r(8, 8, 8, 2, GL); r(12, 8, 1, 1, '#2e2660'); r(9, 8, 1, 1, '#7fd8ff'); r(13, 8, 1, 1, '#7fd8ff');
    r(10, 10, 4, 1, HR);
    if (open) { r(10, 11, 4, 2, MO); r(11, 12, 2, 1, '#ff8a9a'); } else if (pose === 'hype' || pose === 'done') { r(10, 11, 4, 1, MO); r(9, 10, 1, 1, MO); r(14, 10, 1, 1, MO); } else r(10, 11, 4, 1, MO);
  }
  // 마이크 든 손 (그림 왼쪽)
  if (pose === 'wait') { r(5, 16, 2, 5, JK); r(5, 21, 2, 2, SK); r(5, 23, 1, 3, MICD); r(4, 26, 2, 2, MIC); }
  else { r(5, 15, 2, 3, JK); r(6, 13, 2, 2, SK); r(7, 12, 1, 2, MICD); r(7, 10, 2, 2, MIC); r(8, 10, 1, 1, '#ffffff'); }
  // 다른 손 (그림 오른쪽): 자세마다 다르다
  const wave = !MC_REDUCED && Math.floor(t * 5) % 2;
  if (pose === 'point') { r(17, 15, 2, 2, JK); r(19, 14, 2, 2, JK); r(21, 13, 2, 2, SK); r(23, 13, 1, 1, SK); }
  else if (pose === 'hype') { r(17, 11, 2, 5, JK); r(17, 8 + (wave ? 0 : 1), 2, 3, SK); }
  else if (pose === 'shock') { r(17, 10, 2, 6, JK); r(18, 7, 2, 3, SK); r(4, 7, 2, 3, SK); }
  else if (pose === 'done') { r(17, 15, 2, 2, JK); r(19, 13, 2, 2, SK); r(20, 11, 1, 2, SK); }
  else if (pose === 'talk' && open) { r(17, 15, 2, 3, JK); r(19, 13, 2, 2, SK); }
  else { r(16, 16, 2, 6, JK); r(16, 22, 2, 2, SK); }
  // 신났을 때 반짝이
  if ((pose === 'hype' || pose === 'done') && !MC_REDUCED) { const k = Math.floor(t * 8); g.fillStyle = '#ffffff'; g.fillRect(1 + (k * 7) % 22, 1 + (k * 11) % 10, 1, 1); g.fillRect(2 + (k * 13) % 20, 2 + (k * 5) % 12, 1, 1); }
}
function mcLoop() {
  MC.raf = 0;
  const now = performance.now() / 1000;
  for (const s of MC.sprites) {
    if (!s.cv.isConnected) { MC.sprites.delete(s); continue; }
    if (now - s.last < 1 / 14) continue;
    s.last = now;
    s.g.clearRect(0, 0, 24, 34);
    mcDraw(s.g, now, s.pose, s.talking && (MC_REDUCED || Math.floor(now * 9) % 2 === 0));
  }
  if (MC.sprites.size) MC.raf = requestAnimationFrame(mcLoop);
}
function mcSprite() {
  const [cv, g] = makeCanvas(24, 34);
  cv.className = 'mc-spr';
  cv.setAttribute('aria-hidden', 'true');
  const s = { cv, g, pose: 'wait', talking: false, last: 0 };
  MC.sprites.add(s);
  if (!MC.raf) MC.raf = requestAnimationFrame(mcLoop);
  return s;
}

/* ---- 대본: 이 캐릭터의 칭호·능력·기술·패시브·부작용을 병맛 MC 말투로 ---- */
const mcPick = (a) => a[Math.floor(Math.random() * a.length)];
const mcCut = (s, n) => { const a = Array.from(String(s || '')); return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join(''); };
function mcLines(e, idx) {
  const sp = e.spec, M = sp.moves, st = sp.stats, nm = e.name, L = [];
  L.push({ p: 'point', f: 'head', s: mcPick([`자~ ${idx + 1}번 선수 입장! **${nm}**!!`, `다음 선수! 박수 주세요~ **${nm}**!`, `여러분 주목! **${nm}** 선수 등장입니다!`, `두구두구두구… **${nm}** 선수!!`]) });
  L.push({ p: 'talk', f: 'head', s: mcPick([`칭호는… **『${sp.title}』**! 벌써부터 냄새가 납니다.`, `오늘의 칭호, **『${sp.title}』**! 누가 지었죠 이거?`, `별명은 **『${sp.title}』**! 멋있… 나요?`, `**『${sp.title}』**! 칭호부터 범상치 않습니다.`]) });
  if (e.ability) {
    L.push({ p: 'point', f: 'ability', s: `직접 쓴 능력은 바로~ **“${mcCut(e.ability, 60)}”**!` });
    L.push({ p: 'talk', f: 'ability', s: mcPick(['심사위원석이 술렁입니다!', '이걸 진짜 적었다고요? 네, 적었습니다.', '해석하는 데 3초 걸렸습니다.', '저도 갖고 싶네요, 이 능력.', '와… 상상력 무엇?', '방금 관중석에서 누가 웃었어요.']) });
  }
  L.push({ p: 'point', f: 'moves', s: `기본 공격은 **${M.basic.name}**, 능력 1은 **${M.s1.name}**!` });
  L.push({ p: 'point', f: 's2', s: `능력 2는 **${M.s2.name}**! ${mcCut(M.s2.desc, 34)}` });
  L.push({ p: 'hype', f: 'ult', s: `그리고 궁극기!! **${M.ult.name}**!! ${mcCut(M.ult.desc, 34)}` });
  const quip = st.hp >= 120 ? `체력 ${Math.round(st.hp * HP_SCALE)}, 맷집 하나는 인정!` : st.speed >= 1.12 ? '발도 엄청 빠릅니다!' : st.speed <= 0.9 ? '대신 좀 느려요.' : st.hp <= 88 ? '근데 몸이 좀 약해요.' : '';
  if (sp.passive) L.push({ p: 'talk', f: 'passive', s: `숨은 특기는 **${PASSIVE_KO[sp.passive.k]}**! ${quip}` });
  else if (quip) L.push({ p: 'talk', f: 'head', s: quip });
  if (sp.drawbacks.length) {
    L.push({ p: 'shock', f: 'draws', s: mcPick(['하지만!! 세상에 공짜는 없죠.', '그런데 말입니다… 부작용이 있습니다.', '자, 이제 제일 웃긴 시간! 부작용 공개!', '잠깐! 상대들이 선물을 준비했다는데요?']), sfx: 'mcuh' });
    sp.drawbacks.forEach((d, i) => {
      L.push({ p: 'point', f: 'draw-' + i, s: `**${d.by}**님이 붙인 부작용, **“${mcCut(d.text, 50)}”**!` });
      L.push({ p: 'shock', f: 'draw-' + i, s: `결과는… **${mcCut(d.how, 48)}**! ${mcPick(['아이고…', '이건 좀 심했다!', '본인 표정 보세요.', '박수!! 아니 위로를!', '이거 이길 수 있나요?', '부작용 맛집이네요.', '작성자 나와!'])}` });
    });
  }
  L.push({ p: 'hype', f: null, s: mcPick([`**${nm}** 선수, 과연 살아남을 수 있을까요!`, '이상 해설이었습니다! 다음!', `**『${sp.title}』**의 활약, 기대해 주세요!`, '여기까지! 박수 한 번 주세요~']) });
  return L;
}
/** "**굵게**" 표시를 조각으로 */
function mcSegs(s) { return String(s).split(/\*\*/).map((t, i) => ({ t, b: i % 2 === 1 })).filter((x) => x.t); }
function mcRender(bub, segs, n) {
  const out = [];
  let left = n;
  for (const sg of segs) {
    if (left <= 0) break;
    const a = Array.from(sg.t), part = a.slice(0, left).join('');
    left -= a.length;
    out.push(sg.b ? h('b', part) : document.createTextNode(part));
  }
  bub.replaceChildren(...out);
}
/** 대사 읽기: 한국어 목소리가 있을 때만. 끝나면 onEnd */
function mcSpeak(text, onEnd) {
  if (!Sfx.voiceOn || !Sfx.on || !window.speechSynthesis) return false;
  try {
    const vs = window.speechSynthesis.getVoices();
    if (vs.length && !vs.some((x) => /^ko/i.test(x.lang))) return false;
    const ko = vs.find((x) => /^ko/i.test(x.lang));
    const u = new SpeechSynthesisUtterance(text.replace(/[*“”『』「」]/g, '').replace(/…/g, ', '));
    u.lang = 'ko-KR'; if (ko) u.voice = ko; u.rate = 1.35; u.pitch = 1.25; u.volume = 1;
    u.onend = onEnd; u.onerror = onEnd;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}

/** 카드 하나에 MC 자리를 만든다 */
function mcBox(card, e, idx) {
  const spr = mcSprite();
  const text = h('span.mc-t', '곧 소개해 드릴게요!');
  const nx = h('span.mc-nx', '▶');
  const bub = h('div.mc-b', { role: 'button', tabIndex: 0, 'aria-live': 'polite' }, h('span.mc-who', MC_NAME), text, nx);
  const replay = h('button.mc-btn', { type: 'button' }, '다시 듣기 ↻');
  const skip = h('button.mc-btn', { type: 'button' }, '건너뛰기 ▶▶');
  const box = h('div.mcbox.wait', spr.cv, bub, h('div.mc-ctl', skip, replay));
  return { card, e, idx, spr, bub, text, nx, box, replay, skip, lines: null };
}
function mcSet(b, state) {
  b.box.classList.toggle('wait', state === 'wait');
  b.box.classList.toggle('live', state === 'live');
  b.box.classList.toggle('done', state === 'done');
  b.card.classList.toggle('mc-live', state === 'live');
  b.spr.talking = false;
  if (state === 'wait') { b.spr.pose = 'wait'; b.text.replaceChildren('앞 선수 소개 중… 잠시만요!'); }
  if (state === 'done') { b.spr.pose = 'done'; b.text.replaceChildren('소개 끝! 다시 들으려면 “다시 듣기”를 눌러요.'); mcFocus(b, null); }
}
function mcFocus(b, f) {
  b.card.querySelectorAll('.mc-hi').forEach((x) => x.classList.remove('mc-hi'));
  if (!f) return;
  const el = b.card.querySelector(`[data-mcf="${f}"]`) || (f.startsWith('draw-') ? b.card.querySelector('[data-mcf="draws"]') : null);
  if (!el) return;
  el.classList.add('mc-hi');
  const r = el.getBoundingClientRect(), vh = window.innerHeight || 600;
  if (r.top < 120 || r.bottom > vh - 70) el.scrollIntoView({ behavior: MC_REDUCED ? 'auto' : 'smooth', block: 'center' });
}

/** 공개 화면의 카드들에서 MC 소개를 차례로 진행한다. only: 그 카드만 다시 */
function mcStart(boxes, key, only) {
  if (MC.run) MC.run.stop();
  if (!boxes.length) return;
  const run = { stopped: false, timers: [], typer: 0, stop() { this.stopped = true; this.timers.forEach(clearTimeout); clearInterval(this.typer); try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* 없어도 됨 */ } } };
  MC.run = run;
  const alive = () => !run.stopped && boxes[0].card.isConnected;
  const later = (fn, ms) => run.timers.push(setTimeout(() => { if (alive()) fn(); else run.stop(); }, ms));
  let ci = only != null ? only : Math.min(MC.played.get(key) || 0, boxes.length), li = 0, typing = false, next = null;
  const finishAll = () => { run.stop(); MC.played.set(key, boxes.length); boxes.forEach((b) => mcSet(b, 'done')); };
  boxes.forEach((b, i) => {
    b.skip.onclick = () => { Sfx.play('ui'); finishAll(); };
    b.replay.onclick = () => { Sfx.init(); Sfx.play('ui'); mcStart(boxes, key, i); };
    b.bub.onclick = b.bub.onkeydown = (ev) => {
      if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
      if (ev.type === 'keydown') ev.preventDefault();
      if (MC.run !== run || !b.box.classList.contains('live')) return;
      if (typing) { typing = 'skip'; return; }
      if (next) { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* 없음 */ } const n = next; next = null; n(); }
    };
    const played = MC.played.get(key) || 0;
    mcSet(b, only != null ? (i === only ? 'live' : i < played ? 'done' : 'wait') : i < ci ? 'done' : i === ci ? 'live' : 'wait');
  });
  if (ci >= boxes.length) return;
  const startCard = () => {
    const b = boxes[ci];
    b.lines = mcLines(b.e, b.idx);
    li = 0;
    mcSet(b, 'live');
    const r = b.card.getBoundingClientRect();
    if (r.top < 0 || r.top > (window.innerHeight || 600) * 0.6) b.card.scrollIntoView({ behavior: MC_REDUCED ? 'auto' : 'smooth', block: 'start' });
    Sfx.play('mcin');
    later(showLine, 450);
  };
  const endCard = () => {
    const b = boxes[ci];
    mcSet(b, 'done');
    if (only != null) { run.stop(); setTimeout(() => { if (b.card.isConnected && MC.run === run) mcStart(boxes, key); }, 600); return; }
    ci++;
    MC.played.set(key, ci);
    if (ci < boxes.length) {
      if (boxes[ci].box.classList.contains('done')) { endCard(); return; }
      later(startCard, 500);
    } else run.stop();
  };
  const showLine = () => {
    const b = boxes[ci], ln = b.lines[li];
    if (!ln) { endCard(); return; }
    b.spr.pose = ln.p; b.spr.talking = true;
    mcFocus(b, ln.f);
    if (ln.sfx) Sfx.play(ln.sfx);
    const segs = mcSegs(ln.s), total = segs.reduce((a, x) => a + Array.from(x.t).length, 0);
    let n = 0, spoke = false, said = false;
    b.nx.hidden = true;
    const advance = () => { next = null; li++; later(showLine, 160); };
    const settle = () => {
      if (run.stopped) return;
      typing = false; b.nx.hidden = false;
      mcRender(b.text, segs, total);
      if (!spoke) b.spr.talking = false;
      next = advance;
      const len = Array.from(segs.map((x) => x.t).join('')).length;
      later(() => { if (next === advance) advance(); }, spoke ? (said ? 450 : Math.max(1500, len * 150)) : 650 + len * 38);
    };
    spoke = mcSpeak(ln.s, () => { said = true; b.spr.talking = false; if (next === advance && !typing) later(() => { if (next === advance) advance(); }, 350); });
    if (MC_REDUCED) { settle(); return; }
    typing = true;
    clearInterval(run.typer);
    run.typer = setInterval(() => {
      if (!alive()) { run.stop(); return; }
      if (typing === 'skip') n = total; else n += 1;
      mcRender(b.text, segs, n);
      if (n % 2 === 0) Sfx.play('blip');
      if (n >= total) { clearInterval(run.typer); settle(); }
    }, 26);
  };
  startCard();
}

/* ===== 설계서 공개 쇼: 경매 무대에서 MC가 캐릭터를 한 명씩 "상품"으로 소개한다 =====
   막이 열리고 → 캐릭터가 무대 아래에서 솟아 회전대 위에 서고 → 능력·기술·궁극기를 하나씩 보여 주고
   → "하자(부작용)" 공지 → 입찰 → 낙찰! → 막이 닫히고 다음 상품. 다 끝나면 설계서 카드 화면으로. */
const SHOW = { seen: new Set(), pos: new Map() };

/** 상품 하나의 진행표 */
function showSteps(e, idx, entries) {
  const sp = e.spec, M = sp.moves, P = mcPick, L = [];
  L.push({ cue: 'open', p: 'hype', s: P(['레이디스 앤 젠틀맨~!', '자~ 능력 경매장에 오신 걸 환영합니다!', '두구두구두구…', '오늘의 경매, 시작합니다!']) + ` **LOT ${idx + 1}**번 상품!` });
  L.push({ cue: 'spin', p: 'point', s: P([`**${e.name}** 선수! 칭호는 **『${sp.title}』**! 한 바퀴 돌려 보시죠~`, `**『${sp.title}』**, **${e.name}** 선수입니다! 앞태, 옆태, 뒤태까지!`, `보세요 이 자태! **${e.name}**, 별명은 **『${sp.title}』**!`]) });
  if (e.ability) {
    L.push({ cue: 'ability', p: 'point', s: `이 상품의 능력은~ **“${mcCut(e.ability, 60)}”**!` });
    L.push({ cue: 'react', p: 'talk', s: P(['심사위원석이 술렁입니다!', '이걸 진짜 적었다고요? 네, 적었습니다.', '저도 갖고 싶네요, 이 능력.', '와… 상상력 무엇?', '방금 관중석에서 누가 웃었어요.', '상품 상태 아주 좋습니다!']) });
  }
  L.push({ cue: 'move', slot: 'basic', p: 'point', s: `기본 공격! **${M.basic.name}**!` });
  L.push({ cue: 'move', slot: 's1', p: 'point', s: `능력 1! **${M.s1.name}**! ${mcCut(M.s1.desc, 30)}` });
  L.push({ cue: 'move', slot: 's2', p: 'point', s: `능력 2! **${M.s2.name}**! ${mcCut(M.s2.desc, 30)}` });
  L.push({ cue: 'ult', p: 'hype', s: `그리고 이 상품의 하이라이트!! 궁극기 **${M.ult.name}**!!` });
  L.push({ cue: 'ult2', p: 'hype', s: `${mcCut(M.ult.desc, 40)}${M.ult.say ? ` **“${mcCut(M.ult.say, 14)}”**` : ''}` });
  if (sp.passive) L.push({ cue: 'passive', p: 'talk', s: `옵션으로 숨은 특기 **${PASSIVE_KO[sp.passive.k]}**까지! 이 가격에!` });
  if (sp.drawbacks.length) {
    L.push({ cue: 'defect', p: 'shock', s: P(['잠깐!! 하자 공지가 있습니다!', '아, 그런데… 이 상품 하자가 있네요?', '고객님들 잠깐만요! 부작용 공개!', '띠용?! 하자 신고가 들어왔습니다!']) });
    sp.drawbacks.forEach((d, i) => {
      L.push({ cue: 'draw', i, p: 'point', s: `**${d.by}**님이 신고한 하자, **“${mcCut(d.text, 50)}”**!` });
      L.push({ cue: 'drawhow', i, p: 'shock', s: `그래서… **${mcCut(d.how, 48)}**! ${P(['아이고…', '이건 좀 심했다!', '본인 표정 보세요.', '환불 안 됩니다!', '이거 이길 수 있나요?', '부작용 맛집이네요.', '작성자 나와!'])}` });
    });
  }
  const start = P([1, 2, 3, 5]), others = entries.filter((x) => x !== e).map((x) => x.name);
  const buyer = others.length && Math.random() < 0.75 ? P(others) : P(['관객석 7번', '익명의 부자', '옆 반 선생님', '지나가던 고양이', '경매장 청소부']);
  const price = P(['10억', '50억', '100억', '1조', '떡볶이 세 그릇', '라면 한 박스', '용돈 석 달 치', '무한대 원', '사탕 하나']);
  L.push({ cue: 'bid', p: 'hype', start, s: P([`그래도 사실 분~? 시작가 **${start}억**!`, `하자가 있어도 갖고 싶다! 시작가 **${start}억**!`, `자, 입찰 받습니다! **${start}억**부터!`]) });
  L.push({ cue: 'sold', p: 'done', buyer, price, s: `땅! 땅! 땅! **${buyer}** 님께 **${price}**에 낙찰!!` });
  return L;
}

function stageShow(entries, key, onDone) {
  const cv = h('canvas.ss-cv');
  const lot = h('div.ss-lot'), card = h('div.ss-card'), stamp = h('div.ss-stamp'), shouts = h('div.ss-shouts');
  const txt = h('div.ss-t'), nx = h('span.ss-nx', '▼');
  const box = h('div.ss-box', h('span.ss-who', MC_NAME), txt, nx);
  const bNext = h('button.ss-btn', { type: 'button' }, '다음 상품 ▶');
  const bSkip = h('button.ss-btn', { type: 'button' }, '쇼 건너뛰기 ✕');
  const el = h('div.ss', { role: 'dialog', 'aria-label': '능력 경매 쇼' }, cv, lot, card, stamp, shouts, box, h('div.ss-ctl', bNext, bSkip));
  const mg = cv.getContext('2d');
  const [spr] = makeCanvas(SW, SH), [mcc, mcg] = makeCanvas(24, 34);
  let buf, bg, LW = 200, LH = 140, portrait = false, floorY = 90, fh = 14, charX = 140, mcX = 30;
  const S = {
    lot: Math.min(SHOW.pos.get(key) || 0, entries.length), step: -1, steps: [], e: null,
    co: 0, coT: 0, rise: 1, riseT: 1, spinT: 0, spinA: 0, pose: 'idle', glow: null, hurt: 0, st: {},
    z: 1, tz: 1, fx: 0, fy: 0, shake: 0, flash: 0, flashC: '#ffffff', dark: 0, tdark: 0, siren: 0, cheer: 0, paddles: 0,
    parts: [], mcPose: 'wait', talking: false, gavel: 0, mcFront: false, done: false,
  };
  const run = { timers: [], typer: 0, typing: false, next: null };
  const alive = () => el.isConnected && !S.done;
  const later = (fn, ms) => run.timers.push(setTimeout(() => { if (alive()) fn(); }, ms));
  const clearRun = () => { run.timers.forEach(clearTimeout); run.timers = []; clearInterval(run.typer); run.typing = false; run.next = null; try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* 없음 */ } };
  const R = (x, y, w, hh, c) => { bg.fillStyle = c; bg.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(hh)); };

  /* ---- 크기: 화면 비율에 맞춰 작은 픽셀 화면을 만들고 크게 늘린다 ---- */
  const fit = () => {
    const vw = Math.max(320, window.innerWidth), vh = Math.max(320, window.innerHeight), dpr = Math.min(2, window.devicePixelRatio || 1);
    LW = clamp(Math.round(Math.sqrt(vw / vh) * 170), 110, 300); LH = Math.round(LW * vh / vw);
    portrait = LW < LH;
    floorY = Math.round(LH * (portrait ? 0.6 : 0.64)); fh = Math.round(LH * (portrait ? 0.07 : 0.1));
    charX = Math.round(LW * (portrait ? 0.62 : 0.74)); mcX = Math.round(LW * (portrait ? 0.17 : 0.13));
    [buf, bg] = makeCanvas(LW, LH);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    mg.imageSmoothingEnabled = false;
  };
  fit();

  /* ---- 입자 ---- */
  const addP = (k, x, y, vx, vy, life, c, ex) => { if (S.parts.length < 500) S.parts.push(Object.assign({ k, x, y, vx, vy, life, max: life, c, rot: Math.random() * 6 }, ex || {})); };
  const burst = (n, k, c, ex) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, sp = 30 + Math.random() * 90; addP(k, charX, floorY - 26, Math.cos(a) * sp, Math.sin(a) * sp - 30, 0.8 + Math.random() * 0.8, Array.isArray(c) ? mcPick(c) : c, ex); } };
  const confetti = (n) => { for (let i = 0; i < n; i++) addP('conf', Math.random() * LW, -4 - Math.random() * 30, (Math.random() - 0.5) * 30, 20 + Math.random() * 40, 2.4 + Math.random(), mcPick(['#ff4d6d', '#ffcf3a', '#7fd8ff', '#7dff8a', '#ff9ad0', '#ffffff'])); };
  const coins = (n) => { for (let i = 0; i < n; i++) addP('coin', Math.random() * LW, -4 - Math.random() * 40, (Math.random() - 0.5) * 10, 50 + Math.random() * 40, 2.2, '#ffcf3a'); };
  const smoke = (n) => { for (let i = 0; i < n; i++) addP('smoke', charX + (Math.random() - 0.5) * 34, floorY + 1, (Math.random() - 0.5) * 30, -10 - Math.random() * 20, 1 + Math.random() * 0.8, Math.random() < 0.5 ? '#d8d0f0' : '#8a80a8', { s: 3 + Math.random() * 4 }); };
  const bolt = () => { const x = charX + (Math.random() - 0.5) * 60, pts = [[x, 0]]; let y = 0; while (y < floorY - 10) { y += 6 + Math.random() * 8; pts.push([x + (Math.random() - 0.5) * 14, y]); } addP('bolt', x, 0, 0, 0, 0.18, '#fff3a0', { pts }); };

  /* ---- 그리기 ---- */
  const drawStage = (t) => {
    // 뒷벽
    const gr = bg.createLinearGradient(0, 0, 0, floorY);
    gr.addColorStop(0, '#120a26'); gr.addColorStop(1, '#2e1650');
    bg.fillStyle = gr; bg.fillRect(0, 0, LW, floorY);
    for (let x = 6; x < LW; x += 16) R(x, LH * 0.1, 2, floorY - LH * 0.1, 'rgba(0,0,0,0.18)');
    // 전광판 전구 줄
    const by = Math.round(LH * 0.12), k = Math.floor(t * 7);
    R(4, by - 2, LW - 8, 5, '#2a1a10');
    for (let i = 0, x = 7; x < LW - 6; x += 6, i++) R(x, by, 2, 2, (i + k) % 3 === 0 ? '#ffcf3a' : (i + k) % 3 === 1 ? '#ff9a3a' : '#5a3a1a');
    // 뒤쪽 조명 빔 (움직인다)
    bg.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const sx = LW * (0.2 + i * 0.3), a = Math.sin(t * (0.6 + i * 0.2) + i * 2) * 0.5, ex = sx + Math.tan(a) * floorY;
      bg.fillStyle = ['rgba(255,77,109,0.07)', 'rgba(127,216,255,0.07)', 'rgba(255,207,58,0.07)'][i];
      bg.beginPath(); bg.moveTo(sx - 2, 0); bg.moveTo(sx + 2, 0); bg.lineTo(ex + 16, floorY); bg.lineTo(ex - 16, floorY); bg.lineTo(sx - 2, 0); bg.fill();
    }
    bg.globalCompositeOperation = 'source-over';
    // 무대 바닥
    R(0, floorY - 4, LW, fh + 4, '#6a3a1a');
    for (let y = floorY - 1; y < floorY + fh; y += 4) R(0, y, LW, 1, '#4a2410');
    for (let x = (Math.floor(t) % 2) * 9; x < LW; x += 18) R(x, floorY - 4, 1, fh + 4, '#4a2410');
    R(0, floorY - 4, LW, 1, '#a8642a');
    R(0, floorY + fh, LW, 4, '#2a1408');
    for (let i = 0, x = 5; x < LW; x += 11, i++) { const on = (i + k) % 2; R(x, floorY + fh + 1, 3, 2, on ? '#fff3a0' : '#7a6a3a'); }
  };
  const drawPedestal = (t) => {
    const cx = charX, cy = floorY - 1;
    fillEll(bg, cx, cy + 2, 24, 6, 'rgba(0,0,0,0.45)');
    fillEll(bg, cx, cy + 1, 22, 5, '#8a6a1a');
    fillEll(bg, cx, cy, 21, 4, '#ffcf3a');
    fillEll(bg, cx, cy, 15, 2, '#ffe680');
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * 6.283 + S.spinA;
      if (Math.sin(a) < -0.2) continue;
      R(cx + Math.cos(a) * 20, cy + Math.sin(a) * 4 + 1, 1, 1, (i + Math.floor(t * 8)) % 3 ? '#ffffff' : '#ff4d6d');
    }
  };
  const drawSpot = () => {
    bg.globalCompositeOperation = 'lighter';
    bg.fillStyle = `rgba(255,247,210,${0.08 + 0.1 * S.co})`;
    bg.beginPath(); bg.moveTo(charX - 5, 0); bg.lineTo(charX + 5, 0); bg.lineTo(charX + 26, floorY); bg.lineTo(charX - 26, floorY); bg.fill();
    fillEll(bg, charX, floorY - 1, 26, 6, `rgba(255,247,210,${0.12 + 0.12 * S.co})`);
    bg.globalCompositeOperation = 'source-over';
  };
  const drawChar = (t) => {
    if (!S.e || S.rise >= 1) return;
    const sp = S.e.spec;
    const dir = S.spinT > 0 ? [0, 1, 2, 3][Math.floor(t * 10) % 4] : 0;
    renderSprite(spr, sp.look, { pose: S.pose, t, dir, st: S.st, glow: S.glow, hurt: S.hurt > 0, hurtFlash: S.hurt > 0 && Math.floor(t * 16) % 2 === 0 });
    bg.save(); bg.beginPath(); bg.rect(0, 0, LW, floorY + 2); bg.clip();
    if (S.glow) { bg.globalAlpha = 0.35 + 0.15 * Math.sin(t * 10); fillEll(bg, charX, floorY - 24, 20, 26, S.glow); bg.globalAlpha = 1; }
    bg.drawImage(spr, Math.round(charX - OX), Math.round(floorY + 2 - OY + S.rise * 64));
    bg.restore();
  };
  const drawMC = (t) => {
    mcg.clearRect(0, 0, 24, 34);
    mcDraw(mcg, t, S.mcPose, S.talking && (MC_REDUCED || Math.floor(t * 9) % 2 === 0));
    bg.drawImage(mcc, mcX - 12, floorY - 31);
    // 경매대와 망치
    R(mcX - 10, floorY - 13, 20, 14, '#5a2a1a'); R(mcX - 10, floorY - 13, 20, 2, '#ffcf3a'); R(mcX - 8, floorY - 9, 16, 1, '#3a1a0a'); R(mcX - 2, floorY - 7, 4, 4, '#ffcf3a'); R(mcX - 1, floorY - 6, 2, 2, '#8a6a1a');
    const down = S.gavel > 0 && Math.floor(S.gavel * 8) % 2 === 0;
    R(mcX + 7, floorY - (down ? 15 : 21), 6, 3, '#8a4a1a'); R(mcX + 9, floorY - (down ? 12 : 18), 2, 5, '#c08040');
    if (down) R(mcX + 6, floorY - 13, 8, 1, '#ffffff');
  };
  const drawCurtains = (t) => {
    const top = Math.round(LH * 0.07), bot = floorY + fh;
    const wL = Math.round(LW / 2 * (1 - S.co * 0.86));
    const COL = ['#6a0a18', '#8a0f1f', '#b5172b', '#d8263c', '#b5172b', '#8a0f1f'];
    const sway = Math.sin(t * 1.3) * 1.5 * (1 - S.co);
    for (let x = 0; x < wL; x++) {
      const c = COL[(x + Math.round(sway)) % 6 < 0 ? 0 : (x + Math.round(sway)) % 6];
      R(x, top, 1, bot - top, c); R(LW - 1 - x, top, 1, bot - top, c);
    }
    if (wL > 0) { R(0, bot - 3, wL, 3, '#ffcf3a'); R(LW - wL, bot - 3, wL, 3, '#ffcf3a'); R(wL - 1, top, 1, bot - top, '#4a0610'); R(LW - wL, top, 1, bot - top, '#4a0610'); }
    // 위 장식막
    R(0, 0, LW, top, '#8a0f1f');
    for (let x = 0; x < LW; x += 10) { fillEll(bg, x + 5, top, 5, 3, '#8a0f1f'); R(x + 4, top + 2, 2, 2, '#ffcf3a'); }
    R(0, top - 2, LW, 1, '#ffcf3a'); R(0, 2, LW, 1, '#ffcf3a');
  };
  const drawAudience = (t) => {
    const y0 = floorY + fh + 9;
    for (let row = 0; row < 3; row++) {
      const yy = y0 + row * 7, step = 9 - row;
      for (let i = 0, x = (row % 2) * 4 + 2; x < LW; x += step, i++) {
        const j = i * 7 + row * 13, jump = S.cheer > 0 ? Math.abs(Math.sin(t * 11 + j)) * Math.min(1, S.cheer) * 3 : Math.abs(Math.sin(t * 2 + j)) * 0.6;
        const c = row === 2 ? '#15122b' : row === 1 ? '#221c46' : '#2e2856';
        R(x - 4, yy + 2 - jump, 8, 7, c); fillEll(bg, x, yy - jump, 3, 3, c); R(x - 1, yy - 3 - jump, 3, 1, row === 0 ? '#5a4f9f' : '#3a3070');
        if (S.paddles > 0 && (j % 5 === 0) && Math.sin(t * 3 + j) > -0.3) { R(x + 3, yy - 8 - jump, 1, 6, '#c08040'); R(x + 1, yy - 13 - jump, 6, 5, '#ffffff'); R(x + 2, yy - 11 - jump, 4, 1, '#ff4d6d'); }
      }
    }
  };
  const drawParts = (dt) => {
    for (let i = S.parts.length - 1; i >= 0; i--) {
      const p = S.parts[i];
      p.life -= dt;
      if (p.life <= 0) { S.parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 'conf' || p.k === 'coin') { p.vy = Math.min(p.vy + 30 * dt, 70); p.vx += Math.sin(p.life * 6 + p.rot) * 10 * dt; }
      else if (p.k === 'glyph' || p.k === 'px') { p.vy += 40 * dt; p.vx *= 0.98; }
      const a = Math.min(1, p.life / (p.max * 0.5));
      bg.globalAlpha = a;
      if (p.k === 'conf') { const w = Math.abs(Math.cos(p.life * 8 + p.rot)) * 3 + 1; R(p.x, p.y, w, 2, p.c); }
      else if (p.k === 'coin') { R(p.x, p.y, 3, 3, '#c9971e'); R(p.x, p.y, 2, 2, Math.floor(p.life * 10) % 2 ? '#ffcf3a' : '#fff6c8'); }
      else if (p.k === 'smoke') { bg.globalAlpha = a * 0.6; fillEll(bg, p.x, p.y, p.s * (1.6 - a * 0.6), p.s * (1.2 - a * 0.4), p.c); }
      else if (p.k === 'glyph') drawGlyph(bg, p.rows, p.c, p.x, p.y, 1, Math.floor(p.life * 8) % 4);
      else if (p.k === 'bolt') { bg.strokeStyle = p.c; bg.lineWidth = 2; bg.beginPath(); p.pts.forEach(([x, y], j) => (j ? bg.lineTo(x, y) : bg.moveTo(x, y))); bg.stroke(); }
      else if (p.k === 'spark') { R(p.x - 1, p.y, 3, 1, p.c); R(p.x, p.y - 1, 1, 3, p.c); }
      else if (p.k === 'sweat') { R(p.x, p.y, 2, 3, '#9fe8ff'); R(p.x, p.y, 1, 1, '#ffffff'); }
      else R(p.x, p.y, 2, 2, p.c);
    }
    bg.globalAlpha = 1;
  };
  let raf = 0, last = performance.now();
  const frame = (now) => {
    raf = 0;
    if (!el.isConnected || S.done) { stop(); return; }
    const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000;
    last = now;
    // 움직임
    const ap = (v, to, sp) => (v < to ? Math.min(to, v + sp * dt) : Math.max(to, v - sp * dt));
    S.co = ap(S.co, S.coT, 1.3); S.rise = ap(S.rise, S.riseT, 1.6);
    if (S.spinT > 0) { S.spinT -= dt; S.spinA += dt * 9; } else S.spinA += dt * 0.8;
    S.flash = Math.max(0, S.flash - dt * 2.5); S.shake = Math.max(0, S.shake - dt * 8); S.siren = Math.max(0, S.siren - dt); S.cheer = Math.max(0, S.cheer - dt * 0.7);
    S.hurt = Math.max(0, S.hurt - dt); S.gavel = Math.max(0, S.gavel - dt); S.paddles = Math.max(0, S.paddles - dt);
    S.dark += (S.tdark - S.dark) * Math.min(1, dt * 5); S.z += (S.tz - S.z) * Math.min(1, dt * 4);
    if (S.glow && S.pose === 'cast' && Math.random() < 0.5) addP('spark', charX + (Math.random() - 0.5) * 30, floorY - 10 - Math.random() * 40, 0, -20, 0.4, S.glow);
    if (S.tdark > 0.3 && Math.random() < 0.06) bolt();
    // 그리기
    const sx = MC_REDUCED ? 0 : (Math.random() - 0.5) * S.shake, sy = MC_REDUCED ? 0 : (Math.random() - 0.5) * S.shake;
    const fx = S.tz > 1.01 || S.z > 1.01 ? charX : LW / 2, fy = S.tz > 1.01 || S.z > 1.01 ? floorY - 24 : LH / 2;
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.fillStyle = '#0b0820'; bg.fillRect(0, 0, LW, LH);
    bg.setTransform(S.z, 0, 0, S.z, LW / 2 - fx * S.z + sx, LH / 2 - fy * S.z + sy);
    drawStage(t); drawSpot(); drawPedestal(t); drawChar(t);
    if (!S.mcFront) drawMC(t);
    drawParts(dt); drawCurtains(t);
    if (S.mcFront) drawMC(t);
    bg.setTransform(1, 0, 0, 1, sx, sy);
    drawAudience(t);
    bg.setTransform(1, 0, 0, 1, 0, 0);
    if (S.dark > 0.01) { bg.globalAlpha = S.dark; R(0, 0, LW, LH, '#05030f'); bg.globalAlpha = 1; bg.globalCompositeOperation = 'lighter'; fillEll(bg, LW / 2, LH * 0.45, LW * 0.3, LH * 0.35, `rgba(255,220,120,${S.dark * 0.25})`); bg.globalCompositeOperation = 'source-over'; }
    if (S.siren > 0) { bg.globalAlpha = Math.min(0.28, S.siren * 0.3) * (Math.floor(t * 6) % 2 ? 1 : 0.4); R(0, 0, LW, LH, Math.floor(t * 3) % 2 ? '#ff2040' : '#2060ff'); bg.globalAlpha = 1; }
    if (S.flash > 0 && !MC_REDUCED) { bg.globalAlpha = Math.min(0.8, S.flash); R(0, 0, LW, LH, S.flashC); bg.globalAlpha = 1; }
    mg.drawImage(buf, 0, 0, cv.width, cv.height);
    raf = requestAnimationFrame(frame);
  };

  /* ---- 글자 카드·도장·환호 ---- */
  const showCard = (cls, ...kids) => { card.className = 'ss-card'; void card.offsetWidth; card.replaceChildren(...kids); card.className = 'ss-card show ' + (cls || ''); };
  const hideCard = () => { card.className = 'ss-card'; };
  const doStamp = (text, cls) => { stamp.textContent = text; stamp.className = 'ss-stamp'; void stamp.offsetWidth; stamp.className = 'ss-stamp go ' + (cls || ''); later(() => { stamp.className = 'ss-stamp'; }, 1500); };
  const shout = (text, cls) => {
    const s = h('span', { class: cls || '', style: { left: (6 + Math.random() * 78) + '%', bottom: (portrait ? 24 : 22) + Math.random() * 8 + '%' } }, text);
    shouts.append(s); setTimeout(() => s.remove(), 1700);
  };
  const moveCard = (slot) => {
    const m = S.e.spec.moves[slot];
    return [h('div.ss-k', { style: { background: m.color } }, SLOT_KO[slot]), h('div.ss-name', glyphIcon(rowsOf(m.shape, m.pix), m.color, 34), m.name), h('p.ss-desc', m.desc), h('p.ss-meta', `쿨타임 ${m.cd}초 · ${VFX_KO[m.vfx] || ''}`)];
  };
  const glyphBurst = (m, n) => {
    const rows = rowsOf(m.shape, m.pix);
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, sp = 50 + Math.random() * 70; addP('glyph', charX, floorY - 30, Math.cos(a) * sp, Math.sin(a) * sp, 0.9 + Math.random() * 0.5, m.color, { rows }); }
  };

  /* ---- 연출 신호 ---- */
  const cue = (st) => {
    const sp = S.e.spec, M = sp.moves;
    S.pose = 'idle'; S.glow = null; S.st = {}; S.tz = 1; S.tdark = 0;
    switch (st.cue) {
      case 'open':
        hideCard(); lot.className = 'ss-lot';
        S.coT = 1; S.cheer = 2.5; Sfx.play('drumroll');
        later(() => { S.riseT = 0; smoke(18); Sfx.play('cymbal'); Sfx.play('crowd'); S.flash = 0.5; for (let i = 0; i < 5; i++) shout(mcPick(['와아아!', '오오오!', '등장이다!', '꺄아!', '멋있다!']), ''); }, 900);
        later(() => { lot.replaceChildren(h('span.n', `LOT ${S.lot + 1} · ${S.e.name}`), h('span.t', `『${sp.title}』`)); lot.className = 'ss-lot show'; }, 1500);
        break;
      case 'spin': S.spinT = 1.8; S.riseT = 0; Sfx.play('dash', 'wind'); burst(14, 'spark', ['#ffffff', '#ffcf3a']); break;
      case 'ability':
        S.pose = 'cast'; S.glow = sp.look.accent; S.flash = 0.25; Sfx.play('ready');
        showCard('quote', h('div.ss-k', '능력'), h('p.ss-q', `“${e0(S.e.ability)}”`), h('p.ss-meta', `${S.e.name} 작성`));
        break;
      case 'react': S.cheer = 1.4; for (let i = 0; i < 3; i++) shout(mcPick(['ㅋㅋㅋㅋ', '뭐야 그게', '사고 싶다!', '천재다', '오…']), ''); break;
      case 'move': {
        const m = M[st.slot];
        S.pose = 'cast'; S.glow = m.color; S.shake = 2;
        showCard('move', ...moveCard(st.slot));
        glyphBurst(m, st.slot === 'basic' ? 8 : 12);
        Sfx.play('move', m.vfx, { mv: m, slot: st.slot });
        break;
      }
      case 'ult': {
        const m = M.ult;
        S.pose = 'cast'; S.glow = m.color; S.tdark = 0.6; S.tz = 1.55; S.shake = 5; S.flash = 0.7; S.flashC = m.color;
        Music.setHype && Music.setHype(1);
        showCard('ult', ...moveCard('ult'));
        later(() => { glyphBurst(m, 26); bolt(); bolt(); Sfx.play('move', m.vfx, { mv: m, slot: 'ult' }); Sfx.play('bighit'); }, 250);
        break;
      }
      case 'ult2': S.pose = 'cast'; S.glow = M.ult.color; S.tdark = 0.45; S.tz = 1.3; confetti(40); S.cheer = 2; Sfx.play('crowd'); for (let i = 0; i < 4; i++) shout(mcPick(['미쳤다!!', '사기다!', '궁극기 실화?', '와아아아!']), 'bid'); break;
      case 'passive': S.glow = '#7dff8a'; burst(16, 'spark', '#7dff8a'); showCard('passive', h('div.ss-k', '패시브'), h('div.ss-name', PASSIVE_KO[sp.passive.k]), h('p.ss-desc', sp.passive.desc || '')); Sfx.play('ready'); break;
      case 'defect': S.siren = 3; S.hurt = 0.6; S.shake = 4; Sfx.play('siren'); doStamp('하자 발견!!'); hideCard(); for (let i = 0; i < 3; i++) shout(mcPick(['뭐라고?!', '하자품?', '헉']), 'boo'); break;
      case 'draw': {
        const d = sp.drawbacks[st.i];
        S.siren = 1.2; S.hurt = 0.5; Sfx.play('mcuh');
        showCard('warn', h('div.ss-k', `⚠ 하자 신고 · ${d.by}`), h('p.ss-q', `“${e0(d.text)}”`));
        break;
      }
      case 'drawhow': {
        const d = sp.drawbacks[st.i];
        S.hurt = 1; S.shake = 3; S.st = { poison: true }; Sfx.play('boo');
        for (let i = 0; i < 6; i++) addP('sweat', charX + (Math.random() - 0.5) * 16, floorY - 46, (Math.random() - 0.5) * 40, -30, 0.8, '#9fe8ff');
        showCard('warn', h('div.ss-k', '부작용 결과'), h('p.ss-q', d.how), ...allRules(d).filter((r) => r !== d.how).slice(0, 2).map((r) => h('p.ss-meta', '규칙: ' + r)));
        doStamp('부작용!', '');
        for (let i = 0; i < 4; i++) shout(mcPick(['우우~', '환불해!', '에이~', '불쌍해…', 'ㅋㅋㅋㅋ']), 'boo');
        break;
      }
      case 'bid': {
        S.paddles = 4; S.cheer = 3; Music.setHype && Music.setHype(1);
        const price = h('div.ss-price', `${st.start}억`);
        showCard('bid', h('div.ss-k', '현재 입찰가'), price);
        let v = st.start;
        for (let i = 0; i < 7; i++) later(() => { v = Math.round(v * (1.6 + Math.random())); price.textContent = `${v}억`; price.className = 'ss-price up'; void price.offsetWidth; price.className = 'ss-price'; shout(`${v}억!`, 'bid'); Sfx.play('tick'); if (i % 2) coins(6); }, 450 + i * 330);
        break;
      }
      case 'sold':
        S.cheer = 3; S.paddles = 0; Music.setHype && Music.setHype(0);
        [0, 280, 560].forEach((ms, i) => later(() => { S.gavel = 0.25; S.shake = 3 + i; S.flash = 0.35; Sfx.play('gavel'); }, ms));
        later(() => { doStamp('낙찰!!', 'gold'); confetti(70); coins(20); S.flash = 0.6; S.flashC = '#ffcf3a'; Sfx.play('win'); Sfx.play('crowd'); showCard('sold', h('div.ss-k', '낙찰'), h('div.ss-name', st.price), h('p.ss-desc', `${st.buyer} 님께`)); for (let i = 0; i < 5; i++) shout(mcPick(['축하합니다!', '와아아!', '부럽다!', '돈 많네…', '짝짝짝!']), 'bid'); }, 760);
        break;
    }
  };
  const e0 = (s) => mcCut(s, 70);

  /* ---- 진행 ---- */
  const say = (st, then) => {
    S.mcPose = st.p; S.talking = true;
    const segs = mcSegs(st.s), total = segs.reduce((a, x) => a + Array.from(x.t).length, 0);
    let n = 0, spoke = false, said = false;
    nx.hidden = true;
    const advance = () => { if (run.next !== advance) return; run.next = null; then(); };
    const settle = () => {
      run.typing = false; nx.hidden = false;
      mcRender(txt, segs, total);
      if (!spoke || said) S.talking = false;
      run.next = advance;
      const extra = st.cue === 'bid' ? 2400 : st.cue === 'sold' ? 1800 : st.cue === 'open' ? 900 : 0;
      later(advance, (spoke && !said ? Math.max(1500, total * 150) : 600 + total * 32) + extra);
    };
    spoke = mcSpeak(st.s, () => { said = true; S.talking = false; if (run.next === advance && !run.typing) later(advance, 500); });
    if (MC_REDUCED) { settle(); return; }
    run.typing = true;
    clearInterval(run.typer);
    run.typer = setInterval(() => {
      if (!alive()) { clearInterval(run.typer); return; }
      n = run.typing === 'skip' ? total : n + 1;
      mcRender(txt, segs, n);
      if (n % 2 === 0) Sfx.play('blip');
      if (n >= total) { clearInterval(run.typer); settle(); }
    }, 22);
  };
  const nextStep = () => {
    if (!alive()) return;
    S.step++;
    const st = S.steps[S.step];
    if (!st) { lotEnd(); return; }
    cue(st);
    say(st, nextStep);
  };
  const lotStart = () => {
    S.e = entries[S.lot];
    S.steps = showSteps(S.e, S.lot, entries); S.step = -1;
    S.rise = 1; S.riseT = 1; S.mcFront = false; S.co = 0; S.coT = 0;
    later(nextStep, 350);
  };
  const lotEnd = () => {
    clearRun();
    hideCard(); lot.className = 'ss-lot'; S.coT = 0; S.tz = 1; S.tdark = 0; S.glow = null; S.pose = 'idle';
    Sfx.play('dash', 'wind');
    later(() => {
      S.lot++; SHOW.pos.set(key, S.lot);
      if (S.lot < entries.length) lotStart(); else finale();
    }, 1300);
  };
  const finale = () => {
    S.e = null; S.mcFront = true; S.cheer = 3; confetti(80);
    say({ p: 'hype', s: mcPick(['오늘의 경매는 여기까지!! 이제 진짜 싸움입니다!!', '모든 상품 소개 끝! 다들 박수~!! 이제 붙어 봅시다!', '경매 끝! 낙찰받은 능력으로 싸워 보세요!!']) }, end);
  };
  const end = () => {
    if (S.done) return;
    clearRun(); S.done = true;
    SHOW.seen.add(key); SHOW.pos.delete(key);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', fit);
    document.body.classList.remove('ss-on');
    if (Music.setHype) Music.setHype(0);
    el.classList.add('out');
    setTimeout(() => { el.remove(); if (onDone) onDone(); }, 450);
  };
  const stop = () => { clearRun(); if (raf) cancelAnimationFrame(raf); raf = 0; document.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); document.body.classList.remove('ss-on'); };
  const advance = () => {
    if (S.done) return;
    if (run.typing) { run.typing = 'skip'; return; }
    if (run.next) { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* 없음 */ } run.next(); }
  };
  const onKey = (ev) => {
    if (!el.isConnected) return;
    if (ev.key === 'Escape') { ev.preventDefault(); end(); }
    else if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); advance(); }
  };
  el.addEventListener('click', (ev) => { if (ev.target.closest('button')) return; Sfx.init(); advance(); });
  bNext.addEventListener('click', () => { Sfx.play('ui'); if (S.e) lotEnd(); });
  bSkip.addEventListener('click', () => { Sfx.play('ui'); end(); });
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', fit);
  document.body.classList.add('ss-on');
  if (S.lot >= entries.length) S.lot = 0;
  setTimeout(() => { if (!el.isConnected) return; raf = requestAnimationFrame(frame); Music.play('menu'); lotStart(); }, 60);
  return el;
}

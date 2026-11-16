/* ===== MC 왕수다: 그림·대사 도우미 (경매 쇼 076-stage.js가 쓴다) ===== */
const MC_NAME = 'MC 왕수다';
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
const mcPick = (a) => a[Math.floor(Math.random() * a.length)];
const mcCut = (s, n) => { const a = Array.from(String(s || '')); return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join(''); };
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


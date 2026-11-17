/* ===== 능력 설계서: 검증기 · 기본 해석기 · AI 프롬프트 (탑뷰) ===== */
const num = (v, lo, hi, def) => {
  v = Number(v);
  if (!Number.isFinite(v)) v = def;
  return clamp(v, lo, hi);
};
const r1 = (v) => Math.round(v * 10) / 10;
const str = (v, max, def = '') => {
  if (typeof v !== 'string') return def;
  v = v.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202f\ufeff]/g, ' ').replace(/\s+/g, ' ').trim();
  return v ? Array.from(v).slice(0, max).join('') : def;
};
const col = (v, def) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim().toLowerCase() : def);
const oneOf = (v, list, def) => (list.includes(v) ? v : def);
const bool = (v) => v === true || v === 'true' || v === 1;

function sanSt(st, slot) {
  if (!st || typeof st !== 'object') return null;
  let k = st.k === 'float' ? 'slip' : st.k;
  k = oneOf(k, DEBUFFS, null);
  if (!k) return null;
  let d = num(st.d, 0.4, 5, 1.5);
  const hard = HARD_ST.includes(k);
  const mid = k === 'root' || k === 'silence' || k === 'confuse' || k === 'morph';
  if (slot === 'basic') {
    if (hard) return { k: 'slow', d: 0.8 };
    d = Math.min(d, mid ? 1 : 2);
  } else if (hard) d = Math.min(d, slot === 'ult' ? 2.2 : 1.4);
  else if (mid) d = Math.min(d, slot === 'ult' ? 3.5 : 2.5);
  return { k, d: r1(d) };
}

/** 추가 공격 100종: 이름만 오면 기본 기술 여러 개로 펼친다 */
function xtExpand(e, slot) {
  const X = XT[e.t];
  const D = num(e.dmg, 1, 60, XT_D[slot] || 10);
  const k = e.st && typeof e.st === 'object' ? e.st.k : e.st;
  const raw = X.make(D, DEBUFFS.includes(k) ? k : undefined);
  if (e.n && raw[0] && raw[0].n) raw[0].n = e.n;
  return raw.map((r) => sanFx(r, slot)).flat().filter(Boolean);
}
const PATTERNS = ['ring', 'double', 'star', 'cross', 'x', 'grid', 'checker', 'heart', 'square', 'triangle', 'spiral', 'line', 'zigzag', 'arrow', 'random', 'flower', 'smile', 'wave', 'kk', 'hex'];
const SHOT_PATHS = ['line', 'zigzag', 'sine', 'helix', 'curve', 'spiral', 'orbit', 'stopgo', 'stay', 'wobble', 'late', 'blink', 'accel', 'decel'];
function sanFx(e, slot) {
  if (e && XT[e.t]) return xtExpand(e, slot);
  if (!e || typeof e !== 'object') return null;
  const st = sanSt(e.st, slot);
  const at = oneOf(e.at, ['self', 'front', 'target'], 'front');
  switch (e.t) {
    case 'melee': case 'punch': case 'kick':
      // 맨손·무기 휘두르기는 없다. 들어오면 앞쪽 능력 폭발로 바꾼다.
      return sanFx({ t: 'blast', dmg: e.dmg, r: num(e.range, 8, 60, 24) * 0.45, at: 'front', off: 9, delay: 0, kb: e.kb, st: e.st }, slot);
    case 'shot': {
      const r = {
        t: 'shot', dmg: num(e.dmg, 1, 40, 6), n: Math.round(num(e.n, 1, 8, 1)), spread: num(e.spread, 0, 120, 0),
        speed: num(e.speed, 80, 340, 200), size: Math.round(num(e.size, 1, 4, 2)), homing: num(e.homing, 0, 1, 0),
        pierce: bool(e.pierce), bounce: Math.round(num(e.bounce, 0, 3, 0)), life: num(e.life, 0.3, 3, 1), boom: num(e.boom, 0, 34, 0),
        ret: bool(e.ret), split: Math.round(num(e.split, 0, 6, 0)),
        path: oneOf(e.path, SHOT_PATHS, 'line'), turn: e.turn < 0 ? -1 : 1, end: oneOf(e.end, ['none', 'burst', 'mine', 'zone', 'pillars'], 'none'), n2: Math.round(num(e.n2, 2, 12, 6)),
        drop: num(e.drop, 0, 0.5, 0) && Math.max(0.07, num(e.drop, 0, 0.5, 0)), dropk: oneOf(e.dropk, ['blast', 'zone', 'spike'], 'blast'), aura: num(e.aura, 0, 22, 0), grow: num(e.grow, 0, 10, 0), pull: num(e.pull, -16, 16, 0),
        from: oneOf(e.from, ['hand', 'sky', 'ground', 'around'], 'hand'), kb: num(e.kb, 0, 10, 2), st,
      };
      // 기본값인 새 움직임 값은 빼서 온라인으로 보내는 글을 짧게
      if (r.path === 'line') delete r.path;
      if (r.turn === 1) delete r.turn;
      if (r.end === 'none') { delete r.end; delete r.n2; }
      if (!r.drop) { delete r.drop; delete r.dropk; }
      for (const k of ['aura', 'grow', 'pull']) if (!r[k]) delete r[k];
      return r;
    }
    case 'beam':
      return { t: 'beam', dmg: num(e.dmg, 1, 20, 5), len: num(e.len, 24, 320, 110), w: num(e.w, 2, 14, 4), ticks: Math.round(num(e.ticks, 1, 6, 2)), dur: num(e.dur, 0.1, 1.5, 0.4), both: bool(e.both), sweep: num(e.sweep, 0, 220, 0), kb: num(e.kb, 0, 10, 1), st };
    case 'swing':
      return { t: 'swing', dmg: num(e.dmg, 1, 30, 9), r: num(e.r, 10, 44, 20), arc: num(e.arc, 40, 360, 120), n: Math.round(num(e.n, 1, 4, 1)), kb: num(e.kb, 0, 10, 4), st };
    case 'cone':
      return { t: 'cone', dmg: num(e.dmg, 1, 10, 3), len: num(e.len, 24, 120, 60), arc: num(e.arc, 20, 100, 50), dur: num(e.dur, 0.2, 1.6, 0.6), ticks: Math.round(num(e.ticks, 1, 8, 4)), kb: num(e.kb, 0, 6, 1), st };
    case 'wave':
      return { t: 'wave', dmg: num(e.dmg, 1, 40, 10), r: num(e.r, 16, 100, 44), at: oneOf(e.at, ['self', 'front', 'target'], 'self'), off: num(e.off, 0, 140, 40), n: Math.round(num(e.n, 1, 3, 1)), kb: num(e.kb, -10, 10, 6), st };
    case 'line':
      return { t: 'line', dmg: num(e.dmg, 1, 30, 10), n: Math.round(num(e.n, 3, 9, 5)), step: num(e.step, 10, 28, 18), r: num(e.r, 5, 16, 9), kb: num(e.kb, 0, 10, 4), st };
    case 'chain':
      return { t: 'chain', dmg: num(e.dmg, 1, 25, 9), n: Math.round(num(e.n, 1, 6, 3)), range: num(e.range, 40, 140, 90), kb: num(e.kb, 0, 6, 1), st };
    case 'hook':
      return { t: 'hook', dmg: num(e.dmg, 1, 25, 8), speed: num(e.speed, 150, 340, 280), range: num(e.range, 50, 200, 130), st };
    case 'lob':
      return { t: 'lob', dmg: num(e.dmg, 1, 45, 14), r: num(e.r, 8, 50, 20), n: Math.round(num(e.n, 1, 5, 1)), kb: num(e.kb, 0, 10, 5), st };
    /* ----- 추가 공격 30종 ----- */
    case 'meteor': return { t: 'meteor', dmg: num(e.dmg, 5, 50, 24), r: num(e.r, 14, 56, 30), kb: num(e.kb, 0, 10, 8), st };
    case 'thrust': return { t: 'thrust', dmg: num(e.dmg, 2, 30, 11), len: num(e.len, 20, 80, 44), w: num(e.w, 3, 12, 6), n: Math.round(num(e.n, 1, 4, 1)), kb: num(e.kb, 0, 10, 5), st };
    case 'launch': return { t: 'launch', dmg: num(e.dmg, 2, 30, 10), r: num(e.r, 8, 30, 14), off: num(e.off, 6, 40, 14), kb: 1, st: { k: 'air', d: num(e.d, 0.4, slot === 'basic' ? 0.5 : 1.4, 0.8) } };
    case 'leap': return { t: 'leap', dmg: num(e.dmg, 3, 40, 16), r: num(e.r, 12, 50, 26), dist: num(e.dist, 40, 150, 100), kb: num(e.kb, 0, 10, 8), st };
    case 'flurry': return { t: 'flurry', dmg: num(e.dmg, 1, 8, 3), r: num(e.r, 10, 34, 18), off: num(e.off, 0, 50, 18), dur: num(e.dur, 0.2, 1.2, 0.5), ticks: Math.round(num(e.ticks, 2, 10, 5)), kb: num(e.kb, 0, 4, 0), st };
    case 'spikering': return { t: 'spikering', dmg: num(e.dmg, 2, 30, 10), r: num(e.r, 14, 60, 26), n: Math.round(num(e.n, 4, 14, 8)), at: oneOf(e.at, ['self', 'target'], 'self'), kb: num(e.kb, 0, 10, 4), st };
    case 'cross': return { t: 'cross', dmg: num(e.dmg, 2, 30, 12), n: Math.round(num(e.n, 1, 5, 3)), at: oneOf(e.at, ['self', 'target'], 'target'), kb: num(e.kb, 0, 10, 4), st };
    case 'tornado': return { t: 'tornado', dmg: num(e.dmg, 1, 10, 4), r: num(e.r, 8, 26, 14), speed: num(e.speed, 30, 160, 80), life: num(e.life, 1, 5, 2.5), kb: num(e.kb, 0, 6, 2), st };
    case 'roll': return { t: 'roll', dmg: num(e.dmg, 3, 30, 12), size: num(e.size, 5, 14, 8), speed: num(e.speed, 60, 220, 130), life: num(e.life, 0.8, 4, 2.2), bounce: Math.round(num(e.bounce, 0, 4, 2)), kb: num(e.kb, 0, 10, 7), st };
    case 'firewall': return { t: 'firewall', dmg: num(e.dmg, 1, 8, 3), len: num(e.len, 30, 140, 70), off: num(e.off, 10, 90, 40), dur: num(e.dur, 1, 6, 3.5), st };
    case 'net': return { t: 'net', dmg: num(e.dmg, 0, 20, 4), speed: num(e.speed, 120, 300, 220), range: num(e.range, 50, 200, 130), r: num(e.r, 10, 30, 16), d: num(e.d, 1, 4, 2) };
    case 'surge': return { t: 'surge', dmg: num(e.dmg, 2, 30, 12), w: num(e.w, 20, 120, 50), len: num(e.len, 40, 260, 150), speed: num(e.speed, 80, 280, 170), kb: num(e.kb, 0, 10, 7), st };
    case 'clone': return { t: 'clone', dmg: num(e.dmg, 3, 30, 12), n: Math.round(num(e.n, 1, 3, 1)), r: num(e.r, 10, 34, 18), dur: num(e.dur, 2, 8, 5), st };
    case 'mark': return { t: 'mark', dmg: num(e.dmg, 4, 45, 18), r: num(e.r, 10, 40, 18), delay: num(e.delay, 0.6, 2.5, 1.2), range: num(e.range, 40, 220, 160), kb: num(e.kb, 0, 10, 6), st };
    case 'charge': return { t: 'charge', dmg: num(e.dmg, 5, 40, 18), delay: num(e.delay, 0.2, 0.9, 0.4), speed: num(e.speed, 150, 340, 300), boom: num(e.boom, 0, 34, 0), kb: num(e.kb, 0, 10, 8), st };
    case 'missiles': return { t: 'missiles', dmg: num(e.dmg, 2, 20, 6), n: Math.round(num(e.n, 2, 8, 4)), speed: num(e.speed, 120, 300, 220), kb: num(e.kb, 0, 6, 2), st };
    case 'vortex': return { t: 'vortex', dmg: num(e.dmg, 0, 8, 3), r: num(e.r, 16, 60, 34), dur: num(e.dur, 1, 6, 3), pull: num(e.pull, 4, 14, 9), at: oneOf(e.at, ['self', 'target'], 'target'), st };
    case 'storm': return { t: 'storm', dmg: num(e.dmg, 2, 20, 7), n: Math.round(num(e.n, 3, 12, 6)), r: num(e.r, 16, 70, 36), kb: num(e.kb, 0, 6, 2), st };
    case 'ring': return { t: 'ring', dmg: num(e.dmg, 1, 10, 5), r: num(e.r, 18, 60, 32), dur: num(e.dur, 1, 6, 3.5), at: oneOf(e.at, ['self', 'target'], 'target'), st };
    case 'phantom': return { t: 'phantom', dmg: num(e.dmg, 3, 40, 16), dist: num(e.dist, 40, 140, 100), st };
    case 'spiral': return { t: 'spiral', dmg: num(e.dmg, 1, 12, 4), n: Math.round(num(e.n, 6, 24, 14)), speed: num(e.speed, 120, 300, 200), dir: e.dir === -1 ? -1 : 1, st };
    case 'prism': return { t: 'prism', dmg: num(e.dmg, 1, 14, 4), len: num(e.len, 40, 260, 150), w: num(e.w, 2, 8, 4), spread: num(e.spread, 8, 45, 22), ticks: Math.round(num(e.ticks, 1, 5, 2)), dur: num(e.dur, 0.2, 1, 0.45), st };
    case 'whip': return { t: 'whip', dmg: num(e.dmg, 2, 30, 10), len: num(e.len, 24, 90, 56), kb: num(e.kb, 0, 10, 5), st };
    case 'skyline': return { t: 'skyline', dmg: num(e.dmg, 2, 30, 10), n: Math.round(num(e.n, 3, 10, 6)), step: num(e.step, 10, 30, 18), r: num(e.r, 6, 18, 10), st };
    case 'gatling': return { t: 'gatling', dmg: num(e.dmg, 1, 8, 3), n: Math.round(num(e.n, 4, 20, 12)), spread: num(e.spread, 0, 50, 20), st };
    case 'top': return { t: 'top', dmg: num(e.dmg, 1, 14, 5), n: Math.round(num(e.n, 1, 4, 2)), speed: num(e.speed, 60, 200, 120), dur: num(e.dur, 2, 8, 5), kb: num(e.kb, 0, 8, 4), st };
    case 'beacon': return { t: 'beacon', dmg: num(e.dmg, 1, 14, 5), r: num(e.r, 16, 60, 34), rate: num(e.rate, 0.5, 2, 0.9), dur: num(e.dur, 2, 9, 5), kb: num(e.kb, 0, 8, 4), st };
    case 'snipe': return { t: 'snipe', dmg: num(e.dmg, 5, 50, 24), delay: num(e.delay, 0.3, 1, 0.55), kb: num(e.kb, 0, 10, 8), st };
    case 'gust': return { t: 'gust', dmg: num(e.dmg, 0, 10, 3), len: num(e.len, 30, 110, 70), arc: num(e.arc, 30, 120, 70), kb: num(e.kb, 4, 10, 10), st };
    case 'drain': return slot === 'basic' ? null : { t: 'drain', dmg: num(e.dmg, 1, 8, 3), range: num(e.range, 40, 160, 110), dur: num(e.dur, 0.6, 3, 1.6), ticks: Math.round(num(e.ticks, 2, 10, 6)), heal: num(e.heal, 0, 5, 2), st };
    /* ----- 추가 공격 12종 (단어 전용 패턴용) ----- */
    case 'bite': return { t: 'bite', dmg: num(e.dmg, 3, 40, 14), r: num(e.r, 10, 34, 16), range: num(e.range, 20, 140, 40), kb: num(e.kb, 0, 10, 4), st };
    case 'stampede': return { t: 'stampede', dmg: num(e.dmg, 2, 25, 9), n: Math.round(num(e.n, 1, 8, 4)), speed: num(e.speed, 100, 320, 200), len: num(e.len, 80, 300, 200), size: num(e.size, 4, 14, 7), kb: num(e.kb, 0, 10, 6), st };
    case 'pillar': return { t: 'pillar', dmg: num(e.dmg, 2, 30, 10), n: Math.round(num(e.n, 2, 9, 5)), step: num(e.step, 12, 32, 20), r: num(e.r, 6, 18, 10), lift: bool(e.lift), kb: num(e.kb, 0, 8, 2), st };
    case 'lasergrid': return { t: 'lasergrid', dmg: num(e.dmg, 3, 35, 14), n: Math.round(num(e.n, 2, 6, 4)), delay: num(e.delay, 0.4, 1.2, 0.7), kb: num(e.kb, 0, 8, 3), st };
    case 'hop': return { t: 'hop', dmg: num(e.dmg, 3, 30, 12), n: Math.round(num(e.n, 1, 5, 3)), r: num(e.r, 10, 40, 22), size: num(e.size, 4, 14, 8), kb: num(e.kb, 0, 10, 6), st };
    case 'swarm': return slot === 'basic' ? null : { t: 'swarm', dmg: num(e.dmg, 1, 6, 2), r: num(e.r, 10, 34, 18), dur: num(e.dur, 1.5, 7, 4), speed: num(e.speed, 30, 120, 70), st };
    case 'bubble': return { t: 'bubble', dmg: num(e.dmg, 0, 20, 5), n: Math.round(num(e.n, 1, 3, 1)), speed: num(e.speed, 70, 220, 130), size: num(e.size, 2, 8, 4), d: num(e.d, 0.5, slot === 'basic' ? 0.6 : 1.6, 1) };
    case 'grab': return { t: 'grab', dmg: num(e.dmg, 3, 40, 14), r: num(e.r, 10, 28, 16), range: num(e.range, 50, 240, 160), delay: num(e.delay, 0.25, 0.9, 0.45), kb: num(e.kb, 0, 10, 8), st };
    case 'claw': return { t: 'claw', dmg: num(e.dmg, 2, 18, 6), r: num(e.r, 14, 50, 26), kb: num(e.kb, 0, 6, 2), st };
    case 'crack': return { t: 'crack', dmg: num(e.dmg, 3, 35, 13), len: num(e.len, 50, 240, 140), speed: num(e.speed, 100, 300, 190), r: num(e.r, 6, 20, 11), kb: num(e.kb, 0, 10, 5), st };
    case 'stomp': return { t: 'stomp', dmg: num(e.dmg, 2, 25, 8), n: Math.round(num(e.n, 1, 4, 3)), r: num(e.r, 12, 40, 20), kb: num(e.kb, 0, 10, 5), st };
    case 'sonic': return { t: 'sonic', dmg: num(e.dmg, 1, 18, 6), n: Math.round(num(e.n, 1, 4, 2)), len: num(e.len, 40, 180, 110), arc: num(e.arc, 30, 140, 70), kb: num(e.kb, 0, 10, 3), st };
    case 'pattern': {
      const at = oneOf(e.at, ['self', 'target', 'front'], 'target');
      return { t: 'pattern', shape: oneOf(e.shape, PATTERNS, 'ring'), at, kind: oneOf(e.kind, ['blast', 'pillar', 'spike', 'drop'], 'blast'), dmg: num(e.dmg, 1, 35, 8), n: Math.round(num(e.n, 3, 12, 8)), size: num(e.size, 12, 110, 40), r: num(e.r, 4, 26, 9), delay: num(e.delay, 0, 1.5, e.kind === 'blast' || !e.kind ? 0.35 : 0), step: num(e.step, 0, 0.45, 0.05), kb: num(e.kb, -10, 10, 3), st };
    }
    case 'blast':
      return { t: 'blast', dmg: num(e.dmg, 1, 50, 14), r: num(e.r, 6, 56, 18), at, off: num(e.off, 0, 140, 26), delay: num(e.delay, 0, 1.5, 0.15), kb: num(e.kb, -10, 10, 5), st };
    case 'zone':
      return { t: 'zone', dmg: num(e.dmg, 0, 8, 3), r: num(e.r, 8, 50, 18), dur: num(e.dur, 1.5, 8, 4), at, off: num(e.off, 0, 140, 26), follow: bool(e.follow), heal: slot === 'basic' ? 0 : num(e.heal, 0, 6, 0), st };
    case 'dash':
      return { t: 'dash', dist: num(e.dist, 20, 130, 64), dmg: num(e.dmg, 0, 30, 8), invuln: bool(e.invuln) && slot !== 'basic', kb: num(e.kb, 0, 10, 3), st };
    case 'blink':
      return { t: 'blink', to: oneOf(e.to === 'up' ? 'side' : e.to, ['front', 'back', 'behind', 'random', 'side'], 'front'), dist: num(e.dist, 20, 140, 64) };
    case 'buff': {
      if (slot === 'basic') return null;
      const k = oneOf(e.k, BUFFS, null);
      if (!k) return null;
      const cap = k === 'invuln' ? (slot === 'ult' ? 2.5 : 1.5) : k === 'counter' ? 2 : k === 'invis' ? 5 : k === 'fly' ? 6 : 8;
      const o = { t: 'buff', k, d: r1(num(e.d, 1, cap, Math.min(4, cap))) };
      if (k === 'shield') o.pow = num(e.pow, 10, 60, 25);
      if (k === 'regen') o.pow = num(e.pow, 2, 8, 4);
      return o;
    }
    case 'heal':
      if (slot === 'basic') return null;
      return { t: 'heal', amt: num(e.amt, 5, slot === 'ult' ? 45 : slot === 's2' ? 25 : 18, 15) };
    case 'summon':
      return { t: 'summon', kind: oneOf(e.kind, ['turret', 'chaser', 'orbit', 'mine', 'barrier'], 'chaser'), n: Math.round(num(e.n, 1, 4, 1)), dur: num(e.dur, 3, 14, 6), dmg: num(e.dmg, 1, 20, 6), rate: num(e.rate, 0.4, 2, 1), st };
    case 'all':
      if (slot === 'basic') return null;
      return { t: 'all', dmg: num(e.dmg, 0, 10, 4), st: st ? { k: st.k, d: Math.min(st.d, 2.5) } : null };
    case 'swap':
      return slot === 'basic' ? null : { t: 'swap' };
    case 'trail':
      return { t: 'trail', dmg: num(e.dmg, 0, 6, 2), r: num(e.r, 6, 16, 9), dur: num(e.dur, 1, 6, 3), life: num(e.life, 1, 4, 2.5), st };
  }
  return null;
}

/** 한 번 썼을 때 기대 피해량(밸런스 예산용) */
function fxExpected(e) {
  switch (e.t) {
    case 'blast': case 'dash': return e.dmg;
    case 'shot': return e.dmg * (e.n <= 2 ? e.n : 2 + (e.n - 2) * 0.5) * (e.ret ? 1.4 : 1) * (e.aura ? 2.6 : 1) * (e.path === 'orbit' || e.path === 'stay' ? 1.4 : 1) + (e.boom > 0 ? e.dmg * 0.3 : 0) + (e.split ? e.dmg * 0.4 * Math.min(2, e.split) : 0) + (e.end === 'burst' ? e.dmg * 0.45 * Math.min(3, e.n2) * 0.6 : e.end === 'mine' ? e.dmg * 1.6 : e.end === 'zone' || e.end === 'pillars' ? e.dmg * 0.8 : 0) + (e.drop ? e.dmg * 0.9 : 0);
    case 'pattern': return e.dmg * 1.7;
    case 'trail': return e.dmg * e.dur * 1.2;
    case 'beam': return e.dmg * e.ticks;
    case 'zone': return e.dmg * (e.dur / 0.5) * 0.4;
    case 'all': return e.dmg * 1.5;
    case 'swing': return e.dmg * e.n * (e.arc >= 300 ? 1.2 : 1);
    case 'cone': return e.dmg * e.ticks * 0.7;
    case 'wave': return e.dmg * e.n;
    case 'line': return e.dmg * 1.2;
    case 'chain': return e.dmg * Math.min(2.2, 1 + e.n * 0.3);
    case 'hook': return e.dmg;
    case 'lob': return e.dmg * (1 + (e.n - 1) * 0.5);
    case 'meteor': case 'leap': case 'launch': case 'mark': case 'snipe': case 'phantom': case 'charge': case 'whip': case 'cross': case 'spikering': case 'surge': return e.dmg * (e.t === 'thrust' ? e.n : 1);
    case 'thrust': return e.dmg * e.n;
    case 'flurry': return e.dmg * e.ticks * 0.8;
    case 'tornado': return e.dmg * (e.life / 0.35) * 0.35;
    case 'roll': return e.dmg * (1 + e.bounce * 0.3);
    case 'firewall': case 'ring': return e.dmg * (e.dur / 0.5) * 0.35;
    case 'vortex': return e.dmg * (e.dur / 0.5) * 0.4;
    case 'net': return e.dmg + 6;
    case 'clone': return e.dmg * e.n;
    case 'missiles': return e.dmg * Math.min(e.n, 3) * 0.9;
    case 'storm': return e.dmg * Math.min(3, e.n * 0.4);
    case 'spiral': return e.dmg * Math.min(4, e.n * 0.25);
    case 'prism': return e.dmg * e.ticks * 1.5;
    case 'skyline': return e.dmg * 1.3;
    case 'gatling': return e.dmg * Math.min(6, e.n * 0.5);
    case 'top': return e.dmg * e.n * 1.5;
    case 'beacon': return e.dmg * (e.dur / e.rate) * 0.4;
    case 'gust': return e.dmg + 3;
    case 'bite': case 'grab': case 'crack': return e.dmg;
    case 'stampede': return e.dmg * Math.min(e.n, 3) * 0.7;
    case 'pillar': case 'lasergrid': return e.dmg * 1.3;
    case 'hop': return e.dmg * Math.min(e.n, 3) * 0.6;
    case 'swarm': return e.dmg * (e.dur / 0.4) * 0.45;
    case 'bubble': return e.dmg + 8;
    case 'claw': return e.dmg * 2.2;
    case 'stomp': return e.dmg * Math.min(e.n, 3) * 0.7;
    case 'sonic': return e.dmg * e.n * 0.8;
    case 'drain': return e.dmg * e.ticks + e.heal * e.ticks * 0.5;
    case 'summon':
      if (e.kind === 'turret') return e.dmg * e.rate * e.dur * 0.35 * e.n;
      if (e.kind === 'chaser') return e.dmg * e.n * 1.5;
      if (e.kind === 'orbit') return e.dmg * (e.dur / 0.6) * 0.3;
      if (e.kind === 'mine') return e.dmg * e.n * 0.6;
      return 0;
  }
  return 0;
}
const BUDGET = { basic: 14, s1: 24, s2: 30, ult: 55 };
const CD_RANGE = { basic: [0.25, 1.2, 0.5], s1: [0.8, 3.5, 1.8], s2: [1.2, 4.5, 2.6], ult: [5, 10, 7] };

/** AI가 그린 픽셀 그림(12x12 권장, 6~16): '#' 기본색, 'o' 밝은색, '.' 어두운색, 'w' 흰색, 'k' 검정, ' ' 빈칸 */
function sanPix(p) {
  if (!Array.isArray(p) || p.length < 5) return null;
  const n = clamp(Math.max(p.length, ...p.map((r) => (typeof r === 'string' ? Array.from(r).length : 0))), 6, 16);
  const rows = [];
  for (let y = 0; y < n; y++) {
    const r = typeof p[y] === 'string' ? Array.from(p[y]) : [];
    let out = '';
    for (let x = 0; x < n; x++) { const c = r[x]; out += c === '#' || c === 'o' || c === '.' || c === 'w' || c === 'k' ? c : ' '; }
    rows.push(out);
  }
  const filled = rows.join('').replace(/ /g, '').length;
  return filled >= 8 && filled <= n * n - 4 ? rows : null;
}
const SHAPE_VFX = { fire: 'fire', ice: 'ice', bolt: 'electric', skull: 'poison', heart: 'cute', leaf: 'nature', bubble: 'water', note: 'sound', wave: 'wind', drop: 'water', moon: 'shadow', gear: 'tech', paw: 'cute', coin: 'gold', star: 'holy', eye: 'arcane', rock: 'earth', cube: 'ice', bomb: 'fire', bullet: 'metal', blade: 'metal', slash: 'metal', feather: 'wind' };
function sanSfx(x) {
  if (!x || typeof x !== 'object' || !SOUND_KINDS.includes(x.kind)) return null;
  return { kind: x.kind, pitch: r1(num(x.pitch, 0.4, 2.2, 1)), len: r1(num(x.len, 0.4, 2.2, 1)) };
}
function sanMove(m, slot, look, keep) {
  m = m && typeof m === 'object' ? m : {};
  const [lo, hi, def] = CD_RANGE[slot];
  let fx = (Array.isArray(m.fx) ? m.fx : []).map((e) => sanFx(e, slot)).flat().filter(Boolean).slice(0, 4);
  if (!fx.length) fx = [sanFx(slot === 'basic' ? { t: 'shot', dmg: 7 } : { t: 'shot', dmg: 12, size: 3 }, slot)];
  const exp = fx.reduce((s, e) => s + fxExpected(e), 0);
  if (!keep && exp > BUDGET[slot]) {
    const k = BUDGET[slot] / exp;
    fx.forEach((e) => { if (e.dmg) e.dmg = Math.max(1, e.dmg * k); });
  }
  fx.forEach((e) => { if (e.dmg != null) e.dmg = r1(e.dmg); });
  return {
    name: str(m.name, 12, SLOT_KO[slot]),
    desc: str(m.desc, 44, ''),
    cd: r1(num(m.cd, lo, hi, def)),
    color: col(m.color, look.accent),
    shape: oneOf(m.shape, SHAPES, 'orb'),
    pix: sanPix(m.pix),
    pix2: m.pix ? sanPix(m.pix2) : null,
    vfx: oneOf(m.vfx, VFX, SHAPE_VFX[m.shape] || 'plain'),
    say: str(m.say, 10, ''),
    sfx: sanSfx(m.sfx),
    fx,
  };
}

/* ----- 부작용: 글자 그대로, 병맛 있게 ----- */
function sanSelfSt(st, maxD) {
  if (!st || typeof st !== 'object') return null;
  const k = oneOf(st.k === 'float' ? 'slip' : st.k, DEBUFFS.concat(['tiny']), null);
  if (!k) return null;
  return { k, d: r1(num(st.d, 0.3, maxD, Math.min(1.5, maxD))) };
}
const IF_MAP = { air: 'moving', ground: 'still' };
const IFS = ['always', 'moving', 'still', 'lowhp', 'highhp', 'near', 'far', 'edge', 'center', 'crowd', 'alone', 'foelow', 'foehigh', 'fullhp', 'debuffed', 'buffed', 'idle', 'busy', 'ready', 'early', 'late', 'onzone', 'dashing', 'casting', 'lead', 'behind'];
const ACT_EVS = ['hitfoe', 'kill', 'heal', 'debuff', 'foeskill', 'dash', 'ally', 'miss', 'buff', 'crit', 'talk'];
/** 부작용 하나. look·replace는 설계서를 직접 바꾸고, 나머지는 엔진이 실행한다 */
/** 부작용 효과 하나 검사. 쓸 때 효과에는 nth(N번째마다)·hit(맞을 때) 같은 덧붙임이 붙을 수 있다 */
function sanDfx(d) {
  const r = sanDfx0(d);
  if (!r || !d) return r;
  if (r.on && d.nth && ['selfst', 'selfdmg', 'stack', 'recoil', 'tele', 'aidfoe', 'act', 'shout', 'backfire'].includes(r.t)) { const n = Math.round(num(d.nth, 1, 10, 3)); if (n > 1) r.nth = n; }
  return r;
}
function sanDfx0(d) {
  if (!d || typeof d !== 'object') return null;
  const on = oneOf(d.on === 'any' ? 'skills' : d.on, ON_SET, 'skills');
  switch (d.t) {
    case 'lock': return { t: 'lock', on };
    case 'replace': {
      const M = d.moves && typeof d.moves === 'object' ? d.moves : {};
      const moves = {};
      let n = 0;
      for (const s of SLOTS) if (M[s]) { moves[s] = typeof M[s] === 'object' ? M[s] : 1; n++; }
      return n ? { t: 'replace', moves } : null;
    }
    case 'selfdmg': return d.pct ? { t: 'selfdmg', on, amt: 0, pct: Math.round(num(d.pct, 5, 90, 50)) } : { t: 'selfdmg', on, amt: r1(num(d.amt, 1, 40, 8)) };
    case 'backfire': return { t: 'backfire', on, pct: Math.round(num(d.pct, 10, 100, 50)) };
    case 'selfst': { const st = sanSelfSt(d.st, 5); return st ? { t: 'selfst', on, st } : null; }
    case 'stat': { const k = oneOf(d.stat === 'jump' ? 'speed' : d.stat, ['hp', 'speed', 'size', 'dmg', 'taken', 'kb'], 'taken'); if (k === 'kb') return { t: 'stat', stat: 'kb', pct: Math.round(num(d.pct, 20, 400, 100)) }; return { t: 'stat', stat: k, pct: Math.round(k === 'size' ? num(d.pct, -60, 200, 30) || 30 : num(d.pct, 10, k === 'taken' ? 300 : 80, 30)) }; }
    case 'mul': return { t: 'mul', on, pct: Math.round(num(d.pct, 10, 95, 50)) };
    case 'cd': return d.min ? { t: 'cd', on, pct: 0, min: r1(num(d.min, 1, 60, 5)) } : { t: 'cd', on, pct: Math.round(num(d.pct, 30, 400, 100)) };
    case 'tick': { const st = sanSelfSt(d.st, 4); return st ? { t: 'tick', every: Math.round(num(d.every, 3, 20, 8)), st } : null; }
    case 'recoil': return { t: 'recoil', on, force: num(d.force, 3, 14, 7) };
    case 'fail': return { t: 'fail', on, chance: Math.round(num(d.chance, 10, 100, 40)), back: oneOf(d.back, ['fizzle', 'selfhit', 'stun'], 'fizzle') };
    case 'reverse': return { t: 'reverse', on, chance: Math.round(num(d.chance, 10, 100, 100)) };
    case 'healfoe': return { t: 'healfoe', on, chance: Math.round(num(d.chance, 10, 100, 100)) };
    case 'random': return { t: 'random', on, chance: Math.round(num(d.chance, 10, 100, 50)) };
    case 'hurtst': { const st = sanSelfSt(d.st, 3); return st ? { t: 'hurtst', st, chance: Math.round(num(d.chance, 20, 100, 50)) } : null; }
    case 'when': {
      const k = typeof d.st === 'object' && d.st ? d.st.k : d.st;
      const r = { t: 'when', if: oneOf(IF_MAP[d.if] || d.if, IFS.slice(1), 'still'), st: oneOf(k === 'float' ? 'slip' : k, DEBUFFS, 'weak') };
      if (d.n) r.n = r1(num(d.n, 1, 120, 3));
      return r;
    }
    case 'drain': { const r = { t: 'drain', amt: r1(num(d.amt, 0.5, 6, 1.5)), if: oneOf(IF_MAP[d.if] || d.if, IFS, 'always') }; if (d.n) r.n = r1(num(d.n, 1, 120, 3)); return r; }
    case 'windup': return { t: 'windup', on, time: r1(num(d.time, 0.2, 5, 0.8)) };
    case 'uses': return { t: 'uses', on, n: Math.round(num(d.n, 0, 20, 3)) };
    case 'aidfoe': return { t: 'aidfoe', on, k: oneOf(d.k, ['haste', 'power', 'regen', 'shield', 'giant', 'invuln'], 'haste'), d: r1(num(d.d, 1, 5, 2)) };
    case 'stack': { const k = oneOf(d.stat, ['size', 'slow', 'taken', 'weak'], 'size'); const r = { t: 'stack', on, stat: k, pct: Math.round(num(d.pct, k === 'size' ? -25 : 3, 25, 8)) || 8 }; if (d.hit) { r.hit = true; delete r.on; } return r; }
    case 'tele': return { t: 'tele', on };
    case 'move': return { t: 'move', mode: oneOf(d.mode, MOVE_MODES, 'reverse') };
    case 'vision': return { t: 'vision', mode: oneOf(d.mode, Object.keys(VISION_KO), 'dark') };
    case 'hpset': return { t: 'hpset', hp: Math.round(num(d.hp, 1, 999, 50)) };
    case 'foestat': { const k = oneOf(d.stat, ['hp', 'speed', 'dmg', 'size', 'taken'], 'dmg'); return { t: 'foestat', stat: k, pct: Math.round(num(d.pct, -90, 300, 50)) }; }
    case 'dmgfix': return { t: 'dmgfix', on, n: Math.round(num(d.n, 0, 99, 1)) };
    case 'pspeed': return { t: 'pspeed', on, pct: Math.round(num(d.pct, -85, 200, -50)) };
    case 'psize': return { t: 'psize', on, pct: Math.round(num(d.pct, -80, 200, -50)) };
    case 'nofx': return { t: 'nofx', what: oneOf(d.what, ['jump', 'dash', 'tele', 'fly', 'heal', 'shield', 'invis', 'buff', 'clone', 'summon'], 'jump') };
    case 'selfhit': return { t: 'selfhit' };
    case 'lure': return { t: 'lure' };
    case 'exposed': return { t: 'exposed' };
    case 'mute': return { t: 'mute' };
    case 'dtrail': return { t: 'dtrail', kind: oneOf(d.kind, ['fire', 'poop', 'ice', 'slime', 'water', 'flower', 'squeak', 'money'], 'poop'), name: str(d.name, 8, '') };
    case 'shout': { const text = str(d.text, 16, ''); return text ? { t: 'shout', on, text } : null; }
    case 'pest': return { t: 'pest', on: d.on && ON_SET.includes(d.on) ? d.on : undefined, every: Math.round(num(d.every, 3, 20, 7)), dmg: r1(num(d.dmg, 0, 8, 3)), name: str(d.name, 8, '귀찮은 것'), color: col(d.color, '#ffe14a'), pix: sanPix(d.pix), st: sanSelfSt(d.st, 2) };
    case 'act': {
      // 글에 쓴 행동을 정말로 한다: 말풍선 + 멈춤(또는 상태이상) + 그 행동의 연출
      const r = { t: 'act', text: str(d.text, 16, ''), pose: oneOf(d.pose, ACT_POSES, 'sweat'), d: r1(num(d.d, 0, 4, 0.8)), chance: Math.round(num(d.chance, 10, 100, 100)) };
      const st = sanSelfSt(d.st, 4); if (st) r.st = st;
      if (d.fire) r.fire = true;
      const w = str(d.word, 8, ''); if (w) r.word = w;
      const wh = str(d.what, 14, ''); if (wh && wh !== r.text) r.what = wh;
      if (d.push) r.push = true;
      if (d.hp) r.hp = Math.round(num(d.hp, 1, 40, 8));
      if (d.die) r.die = true;
      if (d.boom) r.boom = true;
      if (d.heal) r.heal = Math.round(num(d.heal, 1, 60, 10));
      if (d.buff && BUFFS.includes(d.buff.k || d.buff)) r.buff = { k: d.buff.k || d.buff, d: r1(num(d.buff.d, 0.5, 6, 3)) };
      if (d.fst && ST_ALL.includes(d.fst.k || d.fst)) r.fst = { k: d.fst.k || d.fst, d: r1(num(d.fst.d, 0.3, 5, 1.5)) };
      if (d.fdmg) r.fdmg = Math.round(num(d.fdmg, 1, 40, 8));
      if (d.fheal) r.fheal = Math.round(num(d.fheal, 1, 60, 10));
      if (d.tele) r.tele = oneOf(d.tele, ['rand', 'foe', 'corner', 'center'], 'rand');
      if (d.accel) r.accel = true;
      if (d.gen) r.gen = true;
      if (d.later) r.later = Math.round(num(d.later, 1, 120, 10));
      if (d.vis && ['dark', 'flip', 'mirror', 'shake', 'zoom'].includes(d.vis)) { r.vis = d.vis; r.visd = r1(num(d.visd, 0.5, 8, 2)); }
      if (d.fpull) r.fpull = true; else if (d.fpush) r.fpush = true;
      if (d.on && ON_SET.includes(d.on)) r.on = d.on;
      else if (d.hit) r.hit = true;
      else if (d.bump) r.bump = true;
      else if (d.ev && ACT_EVS.includes(d.ev)) r.ev = d.ev;
      else if (d.if && IFS.includes(IF_MAP[d.if] || d.if) && d.if !== 'always') r.if = IF_MAP[d.if] || d.if;
      else r.every = Math.round(num(d.every, 2, 30, 9));
      if (d.n && (r.if || r.ev)) r.n = r1(num(d.n, 1, 120, 3));
      if (d.nth && (r.hit || r.ev)) r.nth = Math.round(num(d.nth, 2, 10, 3));
      if (!r.text) r.text = '앗!';
      return r;
    }
    case 'aim': return { t: 'aim', on, deg: Math.round(num(d.deg, 10, 90, 40)), chance: Math.round(num(d.chance, 10, 100, 60)) };
    case 'range': return { t: 'range', on, pct: Math.round(num(d.pct, 15, 80, 50)) };
    case 'ramp': return { t: 'ramp', stat: oneOf(d.stat, ['dmg', 'speed', 'size'], 'dmg'), by: oneOf(d.by, ['time', 'hp'], 'time'), pct: Math.round(num(d.pct, d.stat === 'size' ? -60 : 10, 80, 50)) || 50, why: str(d.why, 10, '') };
    case 'flee': { const r = { t: 'flee', if: oneOf(IF_MAP[d.if] || d.if, IFS, 'near') }; if (d.n) r.n = r1(num(d.n, 1, 120, 3)); return r; }
    case 'weakto': {
      const V = Object.keys(VFX_KO), vfx = (Array.isArray(d.vfx) ? d.vfx : [d.vfx]).filter((v) => V.includes(v)).slice(0, 4);
      if (!vfx.length) return null;
      const r = { t: 'weakto', vfx, pct: Math.round(num(d.pct, 0, 300, 100)), name: str(d.name, 8, VFX_KO[vfx[0]]) };
      if (d.die) r.die = true;
      const st = sanSelfSt(d.st, 3); if (st) r.st = st;
      return r;
    }
    case 'look': {
      const L = {};
      if (HEADS.includes(d.head)) L.head = d.head;
      if (OUTFITS.includes(d.outfit)) L.outfit = d.outfit;
      if (WEAPONS.includes(d.weapon)) L.weapon = d.weapon;
      if (AURAS.includes(d.aura)) L.aura = d.aura;
      for (const k of ['skin', 'hair', 'body', 'accent']) { const c = col(d[k], null); if (c) L[k] = c; }
      return Object.keys(L).length ? { t: 'look', look: L } : null;
    }
  }
  return null;
}

const IF_KO = {
  moving: '움직이는', still: '가만히 있는',
  lowhp: '체력이 40% 이하인', highhp: '체력이 70% 이상인', near: '적이 가까이 있는', far: '적이 멀리 있는', always: '항상',
};
Object.assign(IF_KO, {
  edge: '맵 가장자리에 있는', center: '맵 한가운데 있는', crowd: '적 둘 이상이 가까이 있는', alone: '주변에 아무도 없는', foelow: '가까운 적의 체력이 낮은', foehigh: '가까운 적의 체력이 많은',
  fullhp: '체력이 가득 찬', debuffed: '상태이상에 걸린', buffed: '강화 효과를 받은', idle: '한동안 능력을 안 쓴', busy: '능력이 전부 재사용 대기인', ready: '궁극기가 준비된',
  early: '경기 초반인', late: '경기 후반인', onzone: '장판 위에 서 있는', dashing: '돌진·순간이동 중인', casting: '기술을 쓰는', lead: '체력이 가장 많은', behind: '체력이 가장 적은',
});
const EV_KO = { talk: '말할', hitfoe: '적을 맞힐', kill: '적을 쓰러뜨릴', heal: '회복할', debuff: '상태이상에 걸릴', foeskill: '근처 적이 능력을 쓸', dash: '돌진·순간이동할', ally: '다른 플레이어가 쓰러질', miss: '공격이 빗나갈', buff: '강화 효과를 받을', crit: '치명타가 터질' };
const EV_N = { talk: 'N번 말할', hitfoe: '적을 N번 맞힐', kill: '적을 N명 쓰러뜨릴', heal: 'N번 회복할', debuff: '상태이상에 N번 걸릴', foeskill: '근처 적이 능력을 N번 쓸', dash: 'N번 돌진·순간이동할', ally: '다른 플레이어가 N명 쓰러질', miss: '공격이 N번 빗나갈', buff: '강화 효과를 N번 받을', crit: '치명타가 N번 터질' };
/** 조건 글: 숫자가 있으면 숫자까지 */
function ifKo(f) {
  const n = f.n;
  switch (f.if) {
    case 'lowhp': return `체력이 ${n || 40}% 이하인`;
    case 'highhp': return `체력이 ${n || 70}% 이상인`;
    case 'still': return n ? `${n}초 넘게 가만히 있는` : IF_KO.still;
    case 'moving': return n ? `${n}초 넘게 움직인` : IF_KO.moving;
    case 'idle': return `${n || 3}초 동안 능력을 안 쓴`;
    case 'early': return `처음 ${n || 10}초`;
    case 'late': return `${n || 30}초가 지난 뒤`;
    case 'near': return n ? `적이 ${n}칸 안에 있는` : IF_KO.near;
    case 'crowd': return n ? `적 ${n}명 이상이 가까이 있는` : IF_KO.crowd;
    case 'foelow': return `가까운 적의 체력이 ${n || 40}% 이하인`;
  }
  return IF_KO[f.if] || '';
}
function ifDur(f) { return f.if === 'early' ? `처음 ${f.n || 10}초 동안` : f.if === 'late' ? `${f.n || 30}초가 지난 뒤로 계속` : `${ifKo(f)} 동안`; }
function ifAt(f) { return f.if === 'early' ? '경기가 시작되자마자' : f.if === 'late' ? `${f.n || 30}초가 되는 순간` : `${ifKo(f)} 순간`; }
/** 부작용이 게임에서 정확히 어떻게 작동하는지 한 줄로 */
function dfxText(f) {
  const on = ON_KO[f.on] || '';
  const use = (x) => (x.nth ? `${on} ${x.nth}번 쓸 때마다` : `${on} 쓸 때마다`);
  switch (f.t) {
    case 'lock': return `${on} 봉인 (아예 못 씀)`;
    case 'replace': return Object.keys(f.moves).map((s) => SLOT_KO[s]).join('·') + '이(가) 다른 기술로 바뀜';
    case 'selfdmg': return `${use(f)} 체력 ${f.pct ? f.pct + '% 잃음' : '-' + f.amt}`;
    case 'backfire': return `${use(f)} 위력의 ${f.pct}%만큼 자기도 다침`;
    case 'selfst': return `${f.nth ? `${on} ${f.nth}번 쓰면` : `${on} 쓰고 나면`} ${ST_KO[f.st.k] || '작아짐'} ${f.st.d}초`;
    case 'stat': return f.stat === 'kb' ? `맞으면 밀려나는 거리 +${f.pct}%` : { hp: `최대 체력 -${f.pct}%`, speed: `이동 속도 -${f.pct}%`, size: f.pct < 0 ? `몸집 ${f.pct}%` : `몸집 +${f.pct}%`, dmg: `모든 위력 -${f.pct}%`, taken: `받는 피해 +${f.pct}%` }[f.stat];
    case 'mul': return `${on} 위력 -${f.pct}%`;
    case 'cd': return f.min ? `${on} ${f.min}초에 한 번만` : `${on} 재사용 시간 +${f.pct}%`;
    case 'tick': return `${f.every}초마다 저절로 ${ST_KO[f.st.k]} ${f.st.d}초`;
    case 'recoil': return `${use(f)} 반대쪽으로 날아감`;
    case 'fail': return f.chance >= 100 ? `${on} 무조건 실패` : `${on} ${f.chance}% 확률로 ` + { fizzle: '불발', selfhit: '자폭 (체력 -12)', stun: '실패하고 기절' }[f.back];
    case 'reverse': return `${on} ${f.chance >= 100 ? '항상' : f.chance + '% 확률로'} 반대 방향으로 나감`;
    case 'healfoe': return `${on} 맞은 적이 ${f.chance >= 100 ? '오히려' : f.chance + '% 확률로'} 회복함`;
    case 'random': return `${on} ${f.chance}% 확률로 엉뚱한 기술이 나감`;
    case 'hurtst': return `맞으면 ${f.chance}% 확률로 ${ST_KO[f.st.k]} ${f.st.d}초`;
    case 'when': return `${ifDur(f)} ${ST_KO[f.st]}`;
    case 'drain': return `${f.if === 'always' ? '항상' : ifDur(f)} 초당 체력 -${f.amt}`;
    case 'windup': return `${on} 쓰기 전 ${f.time}초 멈춰서 준비`;
    case 'uses': return f.n === 0 ? `${on} 봉인 (아예 못 씀)` : `${on} 한 판에 ${f.n}번씩만`;
    case 'aidfoe': return `${on} 쓸 때마다 가장 가까운 적에게 ${ST_KO[f.k]} ${f.d}초`;
    case 'stack': return `${f.hit ? '맞을 때마다' : use(f)} ` + { size: f.pct < 0 ? `몸집 ${f.pct}%` : `몸집 +${f.pct}%`, slow: `이동 속도 -${f.pct}%`, taken: `받는 피해 +${f.pct}%`, weak: `위력 -${f.pct}%` }[f.stat] + ' (누적)';
    case 'tele': return `${on} 쓰고 나면 아무 데로나 튕겨감`;
    case 'move': return MOVE_KO[f.mode];
    case 'vision': return VISION_KO[f.mode] + ' (내 화면)';
    case 'shout': if (f.text === '@name') return `${use(f)} 기술 이름을 큰 소리로 외침`;
      return `${use(f)} “${f.text}” 외침`;
    case 'act': {
      const when = f.on ? use(f) : f.hit ? (f.nth ? `${f.nth}번 맞을 때마다` : '맞을 때마다') : f.bump ? '벽에 부딪히면' : f.ev ? (f.nth ? `${EV_N[f.ev].replace('N', f.nth)} 때마다` : `${EV_KO[f.ev]} 때마다`) : f.if ? (f.die || f.later || f.if === 'late' || f.if === 'early' ? ifAt(f) : `${ifDur(f)} 4초마다`) : `${f.every}초마다`;
      if (f.gen) return `${when} “${f.text}” 말풍선만 뜸 (게임 규칙으로 바꿀 수 없는 문장이라 불이익 없음)`;
      const WX = { rain: '비가 옴', night: '밤이 됨', snow: '눈이 옴', thunder: '천둥번개', hot: '엄청 더워짐', cold: '엄청 추워짐', wind: '바람이 붊' };
      const what = (WX[f.pose] ? ` (${WX[f.pose]})` : '') + (f.st ? ` → ${ST_KO[f.st.k] || '작아짐'} ${f.st.d}초` : f.d > 0 ? ` (${f.d}초 멈춤)` : '');
      const ex = [f.vis ? `${f.visd}초 동안 ${VISION_KO[f.vis]} (내 화면)` : '', f.fpull ? '주변 적을 나한테 끌어당김' : '', f.fpush ? '주변 적을 밀쳐냄' : '', f.die ? (f.boom ? '쾅! 폭발해서 죽음 (주변 적도 피해)' : '죽음') : f.boom ? '쾅! 폭발 (주변 적 피해)' : '', f.hp ? `체력 -${f.hp}` : '', f.heal ? `체력 +${f.heal}` : '', f.buff ? `${ST_KO[f.buff.k]} ${f.buff.d}초` : '', f.fst ? `주변 적 ${ST_KO[f.fst.k]} ${f.fst.d}초` : '', f.fdmg && !f.boom ? `주변 적 -${f.fdmg}` : '', f.fheal ? `가장 가까운 적 체력 +${f.fheal}` : '', f.tele ? { rand: '아무 데로나 순간이동', foe: '적 바로 옆으로 순간이동', corner: '맵 구석으로 순간이동', center: '맵 한가운데로 순간이동' }[f.tele] : '', f.fire ? '능력이 저절로 나감' : '', f.push ? '튕겨 날아감' : '', f.pose === 'change' ? '옷이 바뀜' : ''].filter(Boolean);
      return `${f.chance < 100 ? f.chance + '% 확률로 ' : ''}${f.accel ? '점점 자주, ' : ''}${when} ${f.what ? `‘${f.what}’ ` : ''}“${f.text}”${what}${ex.length ? ' → ' + (f.later ? `${f.later}초 뒤에 ` : '') + ex.join(' + ') : ''}`;
    }
    case 'aim': return `${on} ${f.chance >= 100 ? '항상' : f.chance + '% 확률로'} ±${f.deg}° 빗나감`;
    case 'range': return `${on} 사거리 -${f.pct}%`;
    case 'ramp': return `${f.why || (f.by === 'hp' ? '체력이 줄수록' : '시간이 지날수록')} ` + { dmg: `위력이 줄어듦 (최대 -${f.pct}%)`, speed: `느려짐 (최대 -${f.pct}%)`, size: f.pct < 0 ? `작아짐 (최대 ${f.pct}%)` : `커짐 (최대 +${f.pct}%)` }[f.stat];
    case 'flee': return `${f.if === 'always' ? '항상' : ifDur(f)} 저절로 도망침`;
    case 'weakto': return f.die ? `${f.name}에 닿으면 바로 죽음` : `${f.name} 공격에 맞으면 ${f.pct ? `피해 +${f.pct}%` : ''}${f.st ? `${f.pct ? ' + ' : ''}${ST_KO[f.st.k]} ${f.st.d}초` : ''}`;
    case 'hpset': return `최대 체력이 ${f.hp}`;
    case 'foestat': return '모든 상대 ' + { hp: '체력', speed: '이동 속도', dmg: '위력', size: '몸집', taken: '받는 피해' }[f.stat] + ` ${f.pct > 0 ? '+' : ''}${f.pct}%`;
    case 'dmgfix': return `${on} 맞히면 피해가 딱 ${f.n}`;
    case 'pspeed': return `${on} 날아가는 속도 ${f.pct > 0 ? '+' : ''}${f.pct}%`;
    case 'psize': return `${on} 공격 크기 ${f.pct > 0 ? '+' : ''}${f.pct}%`;
    case 'nofx': return { jump: '점프(도약) 기술이 안 나감', dash: '돌진 기술로 못 움직임', tele: '순간이동 기술이 안 나감', fly: '날 수 없음', heal: '회복이 전혀 안 됨', shield: '보호막이 안 생김', invis: '투명해질 수 없음', buff: '강화 효과를 못 받음', clone: '분신이 안 나옴', summon: '소환이 안 됨' }[f.what];
    case 'selfhit': return '내가 쏜 공격에 나도 맞음';
    case 'lure': return '적의 투사체가 나한테 휘어 들어옴 (피할 수 없음)';
    case 'exposed': return '모두에게 내 위치가 표시됨 + 투명 불가';
    case 'mute': return '게임 소리가 안 들림 (내 기기)';
    case 'dtrail': if (f.name) return `걸어간 자리에 ${josa(f.name, '이', '가')} 남음`;
      return `걸어간 자리에 ${{ fire: '불', poop: '똥', ice: '얼음', slime: '끈적이', water: '물웅덩이', flower: '꽃', squeak: '삑삑 소리', money: '돈' }[f.kind]}${{ fire: '이 남음 (밟으면 화상, 나도)', poop: '이 남음 (밟으면 미끄러짐, 나도)', ice: '이 남음 (밟으면 미끄러짐, 나도)', slime: '가 남음 (밟으면 느려짐, 나도)', water: '이 남음 (밟으면 미끄러짐, 나도)', flower: '이 핌', squeak: '가 남', money: '이 떨어짐' }[f.kind]}`;
    case 'pest': return `${f.on ? use(f) : f.every + '초마다'} ${josa(f.name, '이', '가')} 나타나 쫓아옴${f.st ? ` (닿으면 ${ST_KO[f.st.k]})` : ''}`;
    case 'look': return f.look && f.look.head === 'bald' ? '대머리가 됨' : f.look && f.look.hair && !f.look.body ? '머리 색이 바뀜' : '겉모습이 바뀜';
  }
  return '';
}

const PATHETIC = {
  basic: { name: '헛기침', desc: '능력 대신 기침만 나온다', say: '콜록', cd: 0.6, color: '#d8d0f0', vfx: 'wind', pix: ['       ', '  ##   ', ' #oo## ', '#oooo##', ' #oo## ', '  ##   ', '       '], fx: [{ t: 'shot', dmg: 3, speed: 120, size: 1, life: 0.5 }] },
  s1: { name: '울먹이기', desc: '눈물을 사방에 흩뿌린다', say: '흐어엉', cd: 2, color: '#7fd8ff', vfx: 'water', shape: 'drop', fx: [{ t: 'shot', dmg: 4, n: 4, from: 'around', speed: 110, size: 1, life: 0.6 }] },
  s2: { name: '줄행랑', desc: '냅다 도망친다', say: '튀어!', cd: 2.5, color: '#f6edd9', vfx: 'wind', shape: 'feather', fx: [{ t: 'blink', to: 'back', dist: 80 }, { t: 'buff', k: 'haste', d: 2 }] },
  ult: { name: '드러눕기', desc: '바닥에 누워 떼를 쓴다', say: '나 안 해!', cd: 7, color: '#ffb0d0', vfx: 'cute', shape: 'heart', fx: [{ t: 'heal', amt: 25 }, { t: 'zone', dmg: 2, r: 20, dur: 3, at: 'self', st: { k: 'confuse', d: 1 } }] },
};
/** 글자만 보고 부작용을 추측 (AI가 없거나 실패했을 때) */
function guessDrawback(text) {
  // AI 답이 잘못됐을 때도 부작용 글을 글자 그대로 읽는다
  const r = smartDrawback(text, null);
  const fx = sanDfx(r.fx) || sanDfx({ t: 'act', every: 9, text: cut(text, 14) || '앗!', d: 0 });
  return { how: r.how, say: r.say, fx, more: (r.more || []).map(sanDfx).filter(Boolean), generic: !!r.generic };
}

/** 원본(AI 또는 기본 해석기) → 엔진이 믿고 쓸 수 있는 설계서. 부작용의 replace·look을 여기서 적용 */
function sanSpec(raw, sides, ai, keep) {
  raw = raw && typeof raw === 'object' ? raw : {};
  const L = raw.look && typeof raw.look === 'object' ? raw.look : {};
  const look = {
    skin: col(L.skin, '#f2c79b'), hair: col(L.hair, '#3a2a4a'), body: col(L.body, '#4466cc'), accent: col(L.accent, '#ffcf3a'),
    head: oneOf(L.head, HEADS, 'short'), weapon: oneOf(L.weapon, WEAPONS, 'none'), aura: oneOf(L.aura, AURAS, 'none'), cape: bool(L.cape), outfit: oneOf(L.outfit, OUTFITS, 'plain'),
  };
  const S = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
  const stats = { hp: Math.round(num(S.hp, 70, 140, 100)), speed: r1(num(S.speed, 0.75, 1.35, 1)), size: r1(num(S.size, 0.8, 1.3, 1)) };
  const MV = raw.moves && typeof raw.moves === 'object' ? raw.moves : {};
  const moves = {};
  SLOTS.forEach((s) => {
    moves[s] = sanMove(MV[s], s, look, keep);
    if (keep && MV[s] && typeof MV[s].was === 'string') moves[s].was = str(MV[s].was, 12, '');
  });
  let passive = null;
  const pk = raw.passive && typeof raw.passive === 'object' ? (raw.passive.k === 'glide' ? 'swift' : raw.passive.k) : null;
  if (PASSIVES.includes(pk)) passive = { k: pk, desc: str(raw.passive.desc, 36, PASSIVE_KO[pk]) };
  const RD = Array.isArray(raw.drawbacks) ? raw.drawbacks : [];
  const drawbacks = (sides || []).map((s, i) => {
    const d = RD[i] && typeof RD[i] === 'object' ? RD[i] : {};
    let fx = sanDfx(d.fx);
    const extra = (Array.isArray(d.more) ? d.more : []).map(sanDfx).filter(Boolean).slice(0, 2);
    const g0 = ai ? guessDrawback(s.text) : null;
    if (g0 && !g0.generic) fx = null;
    const g = fx ? null : g0 || guessDrawback(s.text);
    fx = fx || g.fx;
    return {
      by: str(s.by, 12, '?'), text: str(s.text, 90, ''),
      how: fx === (g && g.fx) ? g.how : str(d.how, 60, dfxText(fx)),
      say: str(fx === (g && g.fx) ? g.say : d.say, 16, ''),
      fx, more: g ? g.more.slice(0, 2) : extra,
    };
  });
  // 바꿔치기·겉모습 부작용을 설계서에 그대로 적용
  if (!keep) {
    for (const d of drawbacks) for (const x of [d.fx].concat(d.more)) {
      if (x.t === 'replace') {
        for (const s in x.moves) {
          const was = moves[s].name;
          moves[s] = sanMove(x.moves[s], s, look, false);
          moves[s].was = was;
        }
        x.moves = Object.fromEntries(Object.keys(x.moves).map((s) => [s, 1]));
      } else if (x.t === 'look') Object.assign(look, x.look);
    }
  }
  const LN = raw.lines && typeof raw.lines === 'object' ? raw.lines : {};
  return {
    v: 4, ai: !!ai, title: str(raw.title, 14, '이름 없는 능력자'), concept: str(raw.concept, 70, ''),
    look, stats, moves, passive, drawbacks, lines: { intro: str(LN.intro, 16, ''), ko: str(LN.ko, 16, ''), win: str(LN.win, 24, '') },
  };
}

/* ----- 기본 해석기: 낱말로 능력 유형을 고른다 (맨손 공격 없음) ----- */
const ARCH = [
  [/불|화염|용암|태양|폭발|불꽃|마그마/, {
    title: '불꽃술사', concept: '불덩이를 던지고 바닥을 불태운다',
    look: { body: '#b3261e', accent: '#ffb02e', hair: '#ff7a2f', head: 'spiky', aura: 'flame' }, stats: { hp: 95, speed: 1.05 },
    moves: {
      basic: { name: '불씨', desc: '작은 불씨를 던진다', cd: 1.2, color: '#ff8a2f', shape: 'fire', fx: [{ t: 'shot', dmg: 7, speed: 150, size: 2, st: { k: 'burn', d: 1 } }] },
      s1: { name: '화염구', desc: '터지는 불덩이', cd: 5, color: '#ff6a1f', shape: 'fire', fx: [{ t: 'shot', dmg: 14, size: 3, speed: 130, boom: 14, st: { k: 'burn', d: 2 } }] },
      s2: { name: '불바다', desc: '앞쪽 바닥을 불태운다', cd: 8, color: '#ffb02e', shape: 'fire', fx: [{ t: 'zone', dmg: 4, r: 18, dur: 4, at: 'front', off: 30, st: { k: 'burn', d: 1 } }] },
      ult: { name: '대폭발', desc: '주변을 통째로 날린다', cd: 20, color: '#ff3d1f', shape: 'fire', fx: [{ t: 'blast', dmg: 38, r: 42, at: 'self', delay: 0.5, kb: 9, st: { k: 'burn', d: 2 } }] },
    },
  }],
  [/얼음|눈보라|냉기|빙|겨울|얼리|얼린/, {
    title: '얼음 마법사', concept: '적을 얼리고 얼음벽으로 막는다',
    look: { body: '#2f6fb5', accent: '#bff0ff', hair: '#e8f6ff', head: 'hood', weapon: 'staff', aura: 'frost' }, stats: { hp: 100 },
    moves: {
      basic: { name: '고드름', desc: '느려지는 얼음 조각', cd: 1.1, color: '#9fe8ff', shape: 'ice', fx: [{ t: 'shot', dmg: 6, speed: 150, st: { k: 'slow', d: 0.8 } }] },
      s1: { name: '빙결탄', desc: '맞으면 얼어붙는다', cd: 6, color: '#7fd8ff', shape: 'ice', fx: [{ t: 'shot', dmg: 10, size: 3, speed: 130, st: { k: 'freeze', d: 1.2 } }] },
      s2: { name: '얼음벽', desc: '적과 공격을 막는 벽', cd: 9, color: '#bff0ff', shape: 'cube', fx: [{ t: 'summon', kind: 'barrier', n: 1, dur: 6 }] },
      ult: { name: '눈보라', desc: '모든 적을 얼리고 얼음이 쏟아진다', cd: 22, color: '#e8f6ff', shape: 'ice', fx: [{ t: 'all', dmg: 8, st: { k: 'freeze', d: 2 } }, { t: 'shot', dmg: 5, n: 8, from: 'sky', size: 2 }] },
    },
  }],
  [/번개|전기|천둥|벼락|전자|감전/, {
    title: '번개잡이', concept: '빠른 번개로 찌르고 사라진다',
    look: { body: '#3a3a8c', accent: '#ffe14a', hair: '#ffe14a', head: 'spiky', aura: 'spark' }, stats: { hp: 90, speed: 1.2 },
    moves: {
      basic: { name: '스파크', desc: '아주 빠른 전기 구슬', cd: 1, color: '#ffe14a', shape: 'bolt', fx: [{ t: 'shot', dmg: 6, speed: 230, size: 1 }] },
      s1: { name: '번개 창', desc: '길게 뻗는 전격', cd: 5, color: '#fff27a', shape: 'bolt', fx: [{ t: 'beam', dmg: 6, len: 130, w: 3, ticks: 2, dur: 0.3 }] },
      s2: { name: '전광석화', desc: '무적 돌진', cd: 7, color: '#ffe14a', shape: 'bolt', fx: [{ t: 'dash', dist: 70, dmg: 12, invuln: true }] },
      ult: { name: '천둥', desc: '하늘에서 벼락이 쏟아진다', cd: 20, color: '#fff9c2', shape: 'bolt', fx: [{ t: 'shot', dmg: 9, n: 6, from: 'sky', size: 3, st: { k: 'stun', d: 1 } }] },
    },
  }],
  [/시간|멈추|되돌|느리게|타임/, {
    title: '시간 조종자', concept: '시간을 늦추고 멈춘다',
    look: { body: '#5b3f8c', accent: '#ffd98a', hair: '#d8d8e8', head: 'hat', weapon: 'wand', aura: 'star' }, stats: { hp: 95 },
    moves: {
      basic: { name: '초침', desc: '시곗바늘을 날린다', cd: 1.2, color: '#ffd98a', shape: 'gear', fx: [{ t: 'shot', dmg: 6, speed: 170, size: 2 }] },
      s1: { name: '느리게', desc: '주변 적을 느리게 한다', cd: 6, color: '#c9a7ff', shape: 'gear', fx: [{ t: 'blast', dmg: 6, r: 32, at: 'self', kb: 1, st: { k: 'slow', d: 3 } }] },
      s2: { name: '되감기', desc: '뒤로 물러나며 회복', cd: 10, color: '#ffd98a', shape: 'gear', fx: [{ t: 'heal', amt: 20 }, { t: 'blink', to: 'back', dist: 50 }] },
      ult: { name: '시간 정지', desc: '모든 적이 멈춘다', cd: 24, color: '#ffffff', shape: 'gear', fx: [{ t: 'all', dmg: 5, st: { k: 'stun', d: 2 } }] },
    },
  }],
  [/그림자|어둠|암살|닌자|은신|투명|유령/, {
    title: '그림자 암살자', concept: '숨었다가 뒤에서 나타난다',
    look: { body: '#2a2440', accent: '#b07cff', hair: '#1a1626', head: 'mask', weapon: 'dagger', aura: 'shadow', cape: true }, stats: { hp: 85, speed: 1.25 },
    passive: { k: 'crit', desc: '가끔 치명타' },
    moves: {
      basic: { name: '그림자 칼날', desc: '그림자 조각 두 개', cd: 1, color: '#b07cff', shape: 'blade', fx: [{ t: 'shot', dmg: 5, n: 2, speed: 200, size: 1, life: 0.6 }] },
      s1: { name: '그림자 이동', desc: '적 뒤로 가서 터뜨린다', cd: 5, color: '#8a5cff', shape: 'moon', fx: [{ t: 'blink', to: 'behind' }, { t: 'blast', dmg: 13, r: 12, at: 'self', delay: 0 }] },
      s2: { name: '은신', desc: '잠시 보이지 않는다', cd: 10, color: '#6a4acc', shape: 'eye', fx: [{ t: 'buff', k: 'invis', d: 4 }] },
      ult: { name: '암습', desc: '무적 돌진으로 꿰뚫는다', cd: 18, color: '#d0a8ff', shape: 'blade', fx: [{ t: 'dash', dist: 85, dmg: 30, invuln: true, st: { k: 'vuln', d: 3 } }] },
    },
  }],
  [/중력|무게|블랙홀|우주|행성/, {
    title: '중력술사', concept: '끌어당기고 미끄러뜨린다',
    look: { body: '#1f1f4a', accent: '#b98cff', hair: '#6a5acd', head: 'bald', weapon: 'orb', aura: 'star' }, stats: { hp: 100 },
    moves: {
      basic: { name: '중력탄', desc: '묵직한 구체', cd: 1.3, color: '#b98cff', shape: 'orb', fx: [{ t: 'shot', dmg: 7, speed: 100, size: 3 }] },
      s1: { name: '끌어당기기', desc: '앞의 적을 끌어온다', cd: 5, color: '#8a6cff', shape: 'orb', fx: [{ t: 'blast', dmg: 8, r: 30, at: 'front', off: 50, kb: -9 }] },
      s2: { name: '무중력', desc: '주변 적을 미끄러지게 한다', cd: 8, color: '#d8c8ff', shape: 'moon', fx: [{ t: 'blast', dmg: 6, r: 34, at: 'self', kb: 2, st: { k: 'slip', d: 3 } }] },
      ult: { name: '블랙홀', desc: '적을 빨아들이는 구멍', cd: 22, color: '#5a3acc', shape: 'orb', fx: [{ t: 'zone', dmg: 5, r: 30, dur: 4, at: 'target', st: { k: 'slow', d: 1 } }, { t: 'blast', dmg: 12, r: 46, at: 'target', kb: -10, delay: 0.3 }] },
    },
  }],
  [/바람|태풍|날아|비행|하늘|새|날개/, {
    title: '바람술사', concept: '바람을 타고 날며 바람칼을 날린다',
    look: { body: '#2f8f7a', accent: '#d8fff0', hair: '#bfeee0', head: 'ponytail', aura: 'wind', cape: true }, stats: { hp: 90, speed: 1.2 },
    passive: { k: 'swift', desc: '이동 속도가 빠르다' },
    moves: {
      basic: { name: '바람칼', desc: '꿰뚫는 바람', cd: 1.1, color: '#bfffe8', shape: 'wave', fx: [{ t: 'shot', dmg: 6, speed: 180, pierce: true, life: 0.6 }] },
      s1: { name: '돌풍', desc: '앞의 적을 날려 보낸다', cd: 5, color: '#d8fff0', shape: 'wave', fx: [{ t: 'blast', dmg: 8, r: 22, at: 'front', off: 22, kb: 10 }] },
      s2: { name: '비상', desc: '구덩이 위를 날고 빨라진다', cd: 10, color: '#bfeee0', shape: 'feather', fx: [{ t: 'buff', k: 'fly', d: 4 }, { t: 'buff', k: 'haste', d: 4 }] },
      ult: { name: '태풍', desc: '몸 주위에 회오리', cd: 20, color: '#eafff8', shape: 'wave', fx: [{ t: 'zone', dmg: 5, r: 26, dur: 5, at: 'self', follow: true }] },
    },
  }],
  [/물|바다|파도|비를|상어|물고기|해일/, {
    title: '물의 정령', concept: '파도로 밀고 비로 회복한다',
    look: { body: '#1f6fb5', accent: '#7fe0ff', hair: '#3fb8ff', head: 'long', aura: 'bubble' }, stats: { hp: 105 },
    moves: {
      basic: { name: '물총', desc: '물방울을 쏜다', cd: 1.2, color: '#5fc8ff', shape: 'drop', fx: [{ t: 'shot', dmg: 7, speed: 140, size: 2 }] },
      s1: { name: '파도', desc: '밀어내는 큰 물결', cd: 5, color: '#3fb8ff', shape: 'wave', fx: [{ t: 'shot', dmg: 13, size: 4, speed: 110, pierce: true, kb: 8, life: 1.2 }] },
      s2: { name: '치유의 비', desc: '서 있으면 회복된다', cd: 11, color: '#9fe8ff', shape: 'drop', fx: [{ t: 'zone', dmg: 0, r: 22, dur: 4, at: 'self', heal: 5 }] },
      ult: { name: '해일', desc: '양쪽으로 쓸어버린다', cd: 22, color: '#7fe0ff', shape: 'wave', fx: [{ t: 'beam', dmg: 10, len: 264, w: 12, ticks: 3, dur: 0.8, both: true, kb: 6 }] },
    },
  }],
  [/땅|바위|돌|지진|흙|산|대지/, {
    title: '대지의 수호자', concept: '느리지만 단단하게 버틴다',
    look: { body: '#6b4f2a', accent: '#c9a96a', hair: '#3a2a1a', head: 'helmet', weapon: 'hammer' }, stats: { hp: 125, speed: 0.85, size: 1.15 },
    passive: { k: 'armor', desc: '받는 피해가 줄어든다' },
    moves: {
      basic: { name: '돌팔매', desc: '묵직한 돌멩이', cd: 1.5, color: '#c9a96a', shape: 'rock', fx: [{ t: 'shot', dmg: 8, size: 3, speed: 120, kb: 4 }] },
      s1: { name: '바위 솟기', desc: '앞으로 바위가 솟는다', cd: 5, color: '#a8875a', shape: 'rock', fx: [{ t: 'shot', dmg: 15, n: 3, from: 'ground', size: 3 }] },
      s2: { name: '돌벽', desc: '적을 막는 벽', cd: 9, color: '#8a6c44', shape: 'cube', fx: [{ t: 'summon', kind: 'barrier', n: 1, dur: 7 }] },
      ult: { name: '지진', desc: '모든 적을 기절시키고 주변을 흔든다', cd: 22, color: '#e0c080', shape: 'rock', fx: [{ t: 'all', dmg: 8, st: { k: 'stun', d: 1.8 } }, { t: 'blast', dmg: 18, r: 40, at: 'self', kb: 6 }] },
    },
  }],
  [/독|병균|바이러스|가스|산성|전염/, {
    title: '독술사', concept: '독을 쌓아 서서히 무너뜨린다',
    look: { body: '#3f5f2a', accent: '#b6f24a', hair: '#7aa83a', head: 'mask', aura: 'toxic' }, stats: { hp: 100 },
    moves: {
      basic: { name: '독침', desc: '중독시키는 침', cd: 1, color: '#b6f24a', shape: 'arrow', fx: [{ t: 'shot', dmg: 4, speed: 190, size: 1, st: { k: 'poison', d: 1.5 } }] },
      s1: { name: '독안개', desc: '앞쪽에 독 구름', cd: 6, color: '#9be04a', shape: 'bubble', fx: [{ t: 'zone', dmg: 3, r: 20, dur: 5, at: 'front', off: 30, st: { k: 'poison', d: 1.5 } }] },
      s2: { name: '독 지뢰', desc: '밟으면 터지는 함정', cd: 9, color: '#7ac83a', shape: 'bomb', fx: [{ t: 'summon', kind: 'mine', n: 2, dur: 12, dmg: 14, st: { k: 'poison', d: 3 } }] },
      ult: { name: '맹독 폭발', desc: '넓게 퍼지는 맹독', cd: 20, color: '#d6ff7a', shape: 'skull', fx: [{ t: 'blast', dmg: 20, r: 40, at: 'self', kb: 4, st: { k: 'poison', d: 5 } }] },
    },
  }],
  [/빛|치유|회복|천사|신성|힐|성스/, {
    title: '빛의 사제', concept: '스스로 회복하며 빛으로 심판한다',
    look: { body: '#e8e0c8', accent: '#ffd23f', hair: '#fff2b8', head: 'halo', weapon: 'staff', aura: 'holy', cape: true }, stats: { hp: 105 },
    passive: { k: 'regen', desc: '체력이 조금씩 회복된다' },
    moves: {
      basic: { name: '빛 화살', desc: '빠른 빛줄기', cd: 1.1, color: '#ffe98a', shape: 'arrow', fx: [{ t: 'shot', dmg: 6, speed: 200 }] },
      s1: { name: '섬광', desc: '주변 적이 혼란에 빠진다', cd: 6, color: '#ffffff', shape: 'star', fx: [{ t: 'blast', dmg: 8, r: 28, at: 'self', kb: 3, st: { k: 'confuse', d: 1.5 } }] },
      s2: { name: '치유', desc: '체력을 회복한다', cd: 11, color: '#bfffc8', shape: 'heart', fx: [{ t: 'heal', amt: 22 }] },
      ult: { name: '심판의 빛', desc: '화면을 가르는 광선', cd: 22, color: '#fff7c2', shape: 'star', fx: [{ t: 'beam', dmg: 9, len: 264, w: 10, ticks: 4, dur: 0.9 }] },
    },
  }],
  [/소환|고양이|강아지|개를|동물|용|드래곤|좀비|부하|로봇|군단|곰|늑대/, {
    title: '소환사', concept: '부하들을 불러 대신 싸우게 한다',
    look: { body: '#7a3f8c', accent: '#ffb86a', hair: '#ffb86a', head: 'ears', weapon: 'book' }, stats: { hp: 95 },
    moves: {
      basic: { name: '발톱 부메랑', desc: '튕겨 다니는 발톱', cd: 1.2, color: '#ffb86a', shape: 'paw', fx: [{ t: 'shot', dmg: 6, speed: 150, bounce: 1 }] },
      s1: { name: '돌격대', desc: '쫓아가는 부하 둘', cd: 6, color: '#ffa64a', shape: 'paw', fx: [{ t: 'summon', kind: 'chaser', n: 2, dur: 6, dmg: 6 }] },
      s2: { name: '수호 구슬', desc: '몸 주위를 도는 구슬', cd: 9, color: '#ffd9a8', shape: 'orb', fx: [{ t: 'summon', kind: 'orbit', n: 3, dur: 6, dmg: 5 }] },
      ult: { name: '포탑 소환', desc: '자동으로 쏘는 포탑 둘', cd: 20, color: '#ff8a3a', shape: 'bullet', fx: [{ t: 'summon', kind: 'turret', n: 2, dur: 9, dmg: 6, rate: 1.2 }] },
    },
  }],
  [/칼|검|베기|베는|사무라이|무사|검객/, {
    title: '검기술사', concept: '칼에서 뿜는 검기로 싸운다',
    look: { body: '#8c2f3f', accent: '#e8e8f0', hair: '#1a1a26', head: 'ponytail', weapon: 'sword' }, stats: { hp: 100, speed: 1.1 },
    passive: { k: 'crit', desc: '가끔 치명타' },
    moves: {
      basic: { name: '검기', desc: '꿰뚫는 칼바람', cd: 1.2, color: '#e8e8f0', shape: 'slash', fx: [{ t: 'shot', dmg: 7, speed: 190, size: 2, life: 0.5, pierce: true }] },
      s1: { name: '십자 검기', desc: '사방으로 검기를 뿜는다', cd: 5, color: '#ffffff', shape: 'slash', fx: [{ t: 'shot', dmg: 10, n: 4, from: 'around', pierce: true, life: 0.6 }] },
      s2: { name: '일섬', desc: '빛처럼 지나간다', cd: 7, color: '#ffd0d8', shape: 'slash', fx: [{ t: 'dash', dist: 75, dmg: 16 }] },
      ult: { name: '검풍', desc: '몸 주위에 칼바람 폭풍', cd: 18, color: '#fff0f2', shape: 'blade', fx: [{ t: 'zone', dmg: 6, r: 24, dur: 2.5, at: 'self', follow: true }] },
    },
  }],
  [/총|미사일|대포|저격|화살|활|폭탄|로켓/, {
    title: '명사수', concept: '멀리서 쏘고 폭탄을 던진다',
    look: { body: '#3f5a3f', accent: '#ffcf3a', hair: '#5a3a1a', head: 'cap', weapon: 'gun' }, stats: { hp: 90 },
    moves: {
      basic: { name: '사격', desc: '빠른 총알', cd: 1, color: '#ffe98a', shape: 'bullet', fx: [{ t: 'shot', dmg: 5, speed: 240, size: 1 }] },
      s1: { name: '산탄', desc: '부채꼴로 다섯 발', cd: 5, color: '#ffcf3a', shape: 'bullet', fx: [{ t: 'shot', dmg: 5, n: 5, spread: 40, speed: 200, size: 1, life: 0.5 }] },
      s2: { name: '수류탄', desc: '튕기다 터진다', cd: 8, color: '#8aa83a', shape: 'bomb', fx: [{ t: 'shot', dmg: 16, speed: 110, boom: 20, bounce: 1, size: 3, life: 1 }] },
      ult: { name: '폭격', desc: '하늘에서 폭탄이 쏟아진다', cd: 22, color: '#ff8a3a', shape: 'bomb', fx: [{ t: 'shot', dmg: 8, n: 8, from: 'sky', boom: 12, size: 2 }] },
    },
  }],
  [/빠르|빠른|속도|순간이동|텔레포트|공간|달리/, {
    title: '순간이동자', concept: '순식간에 붙고 순식간에 빠진다',
    look: { body: '#1f8fa8', accent: '#eaffff', hair: '#eaffff', head: 'short', aura: 'wind' }, stats: { hp: 85, speed: 1.35 },
    passive: { k: 'dodge', desc: '가끔 공격을 피한다' },
    moves: {
      basic: { name: '잔상탄', desc: '잔상 두 발', cd: 1, color: '#eaffff', shape: 'star', fx: [{ t: 'shot', dmg: 5, n: 2, speed: 220, size: 1 }] },
      s1: { name: '점멸', desc: '앞으로 순간이동', cd: 3.5, color: '#9ff0ff', shape: 'star', fx: [{ t: 'blink', to: 'front', dist: 60 }] },
      s2: { name: '잔상 돌진', desc: '무적 돌진', cd: 7, color: '#5fd8f0', shape: 'slash', fx: [{ t: 'dash', dist: 85, dmg: 12, invuln: true }] },
      ult: { name: '사방에서', desc: '적 뒤에 나타나 터뜨린다', cd: 18, color: '#ffffff', shape: 'star', fx: [{ t: 'blink', to: 'behind' }, { t: 'blast', dmg: 28, r: 24, at: 'self', kb: 7, delay: 0, st: { k: 'stun', d: 1 } }] },
    },
  }],
  [/힘|근육|거대|주먹|망치|괴력|헐크|파괴/, {
    title: '괴력의 투사', concept: '땅을 울리는 충격파로 싸운다',
    look: { body: '#a83f2f', accent: '#ffd0a8', hair: '#2a1a1a', head: 'bald' }, stats: { hp: 130, speed: 0.9, size: 1.2 },
    passive: { k: 'rage', desc: '체력이 낮으면 더 세진다' },
    moves: {
      basic: { name: '충격파', desc: '밀어내는 기운', cd: 1.5, color: '#ffd0a8', shape: 'wave', fx: [{ t: 'shot', dmg: 8, speed: 120, size: 3, kb: 5, life: 0.6 }] },
      s1: { name: '땅 가르기', desc: '앞으로 땅이 갈라진다', cd: 5, color: '#ffb07a', shape: 'rock', fx: [{ t: 'shot', dmg: 14, n: 4, from: 'ground', size: 3 }] },
      s2: { name: '거대화', desc: '잠시 몸이 커지고 세진다', cd: 12, color: '#ff8a5a', shape: 'star', fx: [{ t: 'buff', k: 'giant', d: 6 }] },
      ult: { name: '대지 강타', desc: '주변을 내려찍는다', cd: 20, color: '#ffe0c0', shape: 'rock', fx: [{ t: 'blast', dmg: 34, r: 44, at: 'self', kb: 10, delay: 0.35, st: { k: 'stun', d: 1 } }] },
    },
  }],
  [/노래|음악|소리|음파|기타|피아노|랩|춤/, {
    title: '음파술사', concept: '노래로 홀리고 음표를 쏜다',
    look: { body: '#c83f8c', accent: '#ffe14a', hair: '#ff8ad0', head: 'long', aura: 'star' }, stats: { hp: 95, speed: 1.1 },
    moves: {
      basic: { name: '음표', desc: '통통 튀는 음표', cd: 1.1, color: '#ff8ad0', shape: 'note', fx: [{ t: 'shot', dmg: 6, speed: 120, bounce: 1 }] },
      s1: { name: '불협화음', desc: '주변 적이 혼란에 빠진다', cd: 6, color: '#ffb0e0', shape: 'note', fx: [{ t: 'blast', dmg: 9, r: 32, at: 'self', kb: 3, st: { k: 'confuse', d: 2 } }] },
      s2: { name: '응원가', desc: '빨라지고 회복한다', cd: 10, color: '#ffe14a', shape: 'note', fx: [{ t: 'buff', k: 'haste', d: 5 }, { t: 'buff', k: 'regen', d: 5, pow: 3 }] },
      ult: { name: '대합창', desc: '사방으로 음표가 퍼진다', cd: 20, color: '#fff0a8', shape: 'note', fx: [{ t: 'shot', dmg: 9, n: 8, from: 'around', pierce: true, speed: 110, st: { k: 'silence', d: 2 } }] },
    },
  }],
  [/염력|초능력|마음|정신|최면|텔레파시|생각/, {
    title: '염력자', concept: '손대지 않고 밀고 조종한다',
    look: { body: '#4a2f8c', accent: '#ff7ad9', hair: '#c8b8ff', head: 'bald', weapon: 'orb', aura: 'star' }, stats: { hp: 95 },
    moves: {
      basic: { name: '염동탄', desc: '따라가는 눈알', cd: 1.2, color: '#ff7ad9', shape: 'eye', fx: [{ t: 'shot', dmg: 6, speed: 100, homing: 0.6, life: 2 }] },
      s1: { name: '밀쳐내기', desc: '앞의 적을 날린다', cd: 5, color: '#c8b8ff', shape: 'wave', fx: [{ t: 'blast', dmg: 10, r: 22, at: 'front', off: 22, kb: 10 }] },
      s2: { name: '보호막', desc: '피해를 막아 준다', cd: 10, color: '#9fd8ff', shape: 'orb', fx: [{ t: 'buff', k: 'shield', d: 6, pow: 35 }] },
      ult: { name: '정신 붕괴', desc: '모든 적이 혼란에 빠진다', cd: 22, color: '#ffb0f0', shape: 'eye', fx: [{ t: 'all', dmg: 8, st: { k: 'confuse', d: 2.5 } }] },
    },
  }],
];
const ARCH_DEFAULT = {
  title: '기 수련자', concept: '기를 모아 쏘고 터뜨린다',
  look: { body: '#d8782f', accent: '#3fb8ff', hair: '#2a1a1a', head: 'spiky' }, stats: { hp: 100 },
  moves: {
    basic: { name: '기탄', desc: '작은 기 구슬', cd: 1.2, color: '#5fc8ff', shape: 'orb', fx: [{ t: 'shot', dmg: 7, speed: 150, size: 2 }] },
    s1: { name: '큰 기탄', desc: '기를 모아 쏜다', cd: 5, color: '#3fb8ff', shape: 'orb', fx: [{ t: 'shot', dmg: 14, size: 3, speed: 150 }] },
    s2: { name: '기합', desc: '주변을 밀어낸다', cd: 8, color: '#ffe98a', shape: 'star', fx: [{ t: 'blast', dmg: 12, r: 26, at: 'self', kb: 8 }] },
    ult: { name: '에너지파', desc: '굵은 광선', cd: 20, color: '#9fe8ff', shape: 'orb', fx: [{ t: 'beam', dmg: 10, len: 180, w: 8, ticks: 4, dur: 0.9 }] },
  },
};
function fallbackSpec(ability, sides) {
  // AI 없이: 글 속 단어를 읽어 조립한다 (025-compose.js)
  return sanSpec(composeRaw(ability, sides), sides, false);
}

const BOT_NAMES = ['깡통 1호', '깡통 2호', '깡통 3호'];
const BOT_ABILITIES = ['불을 자유자재로 다룬다', '닿는 것을 전부 얼린다', '번개를 부른다', '시간을 멈춘다', '그림자 속에 숨는다', '중력을 조종한다', '고양이 군단을 소환한다', '노래로 사람을 홀린다', '땅을 울리는 괴력', '독을 뿌린다', '바람을 타고 난다', '총을 아주 잘 쏜다'];
const ABILITY_IDEAS = ['불을 자유자재로 다룬다', '시간을 3초 멈춘다', '그림자 속으로 숨는다', '땅을 갈라 바위를 솟게 한다', '고양이 군단을 부른다', '번개처럼 빨라진다', '중력을 뒤집는다', '노래로 적을 홀린다'];
const SIDE_IDEAS = ['쓸 때마다 체력이 깎인다', '쓰고 나면 잠깐 졸린다', '가끔 실패해서 자기가 맞는다', '쓸수록 몸이 커진다', '쓸 때마다 뒤로 날아간다', '쓰고 나면 좌우가 헷갈린다', '한 판에 세 번만 쓸 수 있다', '갑자기 재채기가 나서 멈칫한다', '쓰기 전에 춤을 춰야 한다', '쓰면 엉뚱한 곳으로 순간이동한다', '쓸 때마다 상대가 빨라진다', '쓰고 나면 바닥이 미끄러워진다'];

/* ----- AI 프롬프트 ----- */
function buildPrompt(name, ability, sides) {
  const sideList = sides.length
    ? sides.map((s, i) => `${i + 1}. (작성자: ${s.by}) ${s.text}`).join('\n')
    : '(없음 — drawbacks는 빈 배열)';
  return `너는 탑뷰 픽셀 병맛 액션 게임 "능력 난투"의 능력 설계 AI이자, 친구들을 배꼽 잡게 만드는 개그 작가 겸 액션 연출가다. 플레이어가 자유롭게 쓴 [능력]과 상대들이 쓴 [부작용]을 읽고, 아래 게임 엔진 규격에 맞는 전투 설계서를 JSON으로 만든다. 게임은 이 JSON만 보고 캐릭터를 움직이고, 그리고, 소리를 낸다.

[이 게임이 원하는 세 가지]
1. 병맛: 어이없고 황당하고 과장될수록 좋다. "이게 왜 되냐" 싶은 해석이 정답이다.
2. 유쾌: 누구도 기분 나쁘지 않고 다 같이 웃는다. 비하·혐오·욕설 없이, 상황 자체가 웃기게.
3. 짜릿: 손맛이 시원해야 한다. 빠르게 쏘고, 크게 터지고, 궁극기는 화면이 뒤집히는 한 방.
진지한 밸런스보다 "방금 그거 봤어?!" 하는 순간이 중요하다. 능력이 부작용 때문에 망가지는 것도 재미다.

[게임 방식] 480x320px 아레나를 위에서 내려다본다. 캐릭터는 키 9px의 아주 작은 픽셀 사람이고 상하좌우로 빠르게 걸어 다닌다. 점프는 없다. 아레나에는 벽(이동·발사체를 막음)과 구덩이(이동만 막음)가 있고, 시간이 지나면 폭풍이 좁혀 온다. 모든 기술은 가장 가까운 적을 향해 자동으로 조준된다. 재사용 시간이 아주 짧아서 플레이어는 기술을 쉴 새 없이 난사한다. 맞을 때마다 화면에 만화 의성어가 터진다.
[중요] 주먹, 발차기, 무기 휘두르기 같은 평범한 공격은 없다. 플레이어는 오직 능력만 쓴다. 기술 네 개(basic=능력 1, s1=능력 2, s2=능력 3, ult=궁극기)는 모두 [능력]에서 직접 나온 효과여야 한다. 능력 1은 가장 자주 누르는 가벼운 능력이다.

[플레이어] ${name}
[능력] ${ability}
[부작용] 순서대로 drawbacks 배열에 하나씩, 같은 개수로 반영한다.
${sideList}

[설계 순서] 아래 순서대로 속으로 깊이 생각한 뒤 결과만 출력한다(생각 과정은 출력하지 않는다).
1. 해석: 능력 글을 단어 하나하나 글자 그대로 읽는다. 그 능력이 진짜로 있다면 싸움판에서 벌어질 웃긴 장면을 여러 개 떠올리고, 글에 가장 충실하면서 가장 황당한 해석을 고른다. 말장난, 과장, 일상 소재의 엉뚱한 활용, 숫자·조건의 지나치게 성실한 해석을 적극 쓴다. 가장 먼저 떠오르는 뻔한 해석은 한 번 더 비틀어 본다.
2. 콩트 구성: 네 기술이 한 편의 콩트처럼 이어지게 한다. 네 기술의 공격 방식이 모두 달라야 한다(발사체만 네 개는 금지). 액션 게임처럼 휘두르기(swing), 분사(cone), 충격파(wave), 땅 가르기(line), 연쇄(chain), 갈고리(hook), 포물선 투척(lob), 광선 쓸기(beam sweep), 반격 자세(buff counter)와 추가 공격 30종(운석, 찌르기, 띄우기, 도약, 난무, 회오리, 굴러가는 구체, 불벽, 그물, 지면파, 분신, 표식, 모아 쏘기, 미사일, 소용돌이, 낙뢰, 고리, 환영 베기, 나선 탄막, 세 갈래 광선, 채찍, 검의 비, 개틀링, 팽이, 신호탑, 저격, 돌풍, 흡혈 줄 등) 가운데 능력 글에 가장 어울리는 것을 골라 섞는다.
   · basic: 그 능력의 대표 개그를 가볍고 빠르게 연타. 쏠 때마다 손맛이 나게.
   · s1: 예상 밖으로 비튼 활용. 상태이상이나 장판으로 판을 깐다.
   · s2: 능력을 엉뚱하게 써서 도망·접근·방어·소환. 위기 탈출이나 기습.
   · ult: 능력을 말도 안 되는 규모로 키운 대참사. 이름은 거창하게, 효과는 화면 전체가 난리 나게(여러 효과를 겹치고, 큰 폭발·많은 발사체·광역 상태이상).
3. 연계: s1·s2가 깔아 둔 것(느려짐, 빙결, 끌어당김, 장판, 소환물)에 basic·ult가 시원하게 터지도록 짝을 맞춘다. 네 기술의 효과 종류(shot, beam, blast, zone, summon, dash, blink, trail 등)를 골고루 섞어 손에 쥐는 느낌이 전부 다르게 한다.
4. 손맛: 발사체는 빠르게(보통 speed 160 이상), 폭발은 크게, 궁극기 delay는 짧게(0.6초 이하). 아무 일도 안 일어나는 기술은 만들지 않는다. 단, 능력 글이 "느리다", "약하다"라고 하면 글이 우선이다.
5. 부작용: 능력을 비꼬는 반전 개그로 만든다. 글자 그대로 실행하되, 터지는 순간이 모두에게 보이고 들리게(say, shout, pest, look, morph, dance 등) 연출한다.
6. 말맛: 기술 이름은 짧고 외치기 좋게, say는 능력 글의 말투를 살린 한마디. 등장·쓰러짐·승리 대사(lines)는 캐릭터성이 드러나는 한 줄 개그.
7. 점검: 출력 전에 확인한다. 네 기술이 모두 능력 글에서 나왔는가? 흔한 원소 마법으로 도망치지 않았는가? 부작용이 글자 그대로인가? 궁극기가 충분히 과장됐는가? 숫자가 모두 범위 안인가? JSON 문법이 맞는가?

[해석 감각 참고] 아래는 생각하는 방식의 예일 뿐이다. 이 소재·이름·구성을 절대 베끼지 말고, 지금 받은 능력 글에서만 나올 수 있는 것을 만든다.
- 능력 글이 일상적인 행동이면, 그 행동을 말도 안 되게 과장해 무기로 쓴다(잔소리 → 귀에 꽂히는 잔소리 음파, 궁극기는 끝나지 않는 잔소리 폭풍).
- 능력 글이 사물이면, 그 사물의 생김새·쓰임새·소리를 하나씩 기술로 쪼갠다(우산 → 펼쳐 막기, 접어서 찌르듯 돌진, 궁극기는 하늘에서 우산 비).

[가장 중요한 원칙: 쓴 그대로 구현한다]
- 플레이어가 쓴 능력이 아무리 이상하고, 엉뚱하고, 말이 안 되고, 약하고, 쓸모없어 보이고, 마음에 들지 않아도 절대 거절하거나 다른 능력으로 바꾸지 않는다. 무조건 그 글에 가장 가까운 모습으로 만든다.
- 흔한 원소 마법(불, 얼음, 번개 등)으로 바꿔치기하지 않는다. 글에 없는 소재를 덧붙이지 않는다. 글에 나온 사물·행동·말투·숫자·조건을 기술 이름, 설명, 효과, 발사체 모양(shape·pix), 색, 소리(sfx), 외형(look)에 그대로 살린다.
- 네 기술 모두 그 능력의 서로 다른 활용법이어야 한다.
- 능력이 싸움과 상관없어 보여도 그 능력을 억지로라도 공격·방어·이동에 써먹는 방식을 찾아낸다. 능력이 약하다고 써 있으면 약한 대로, 이상하면 이상한 대로 만든다.
- 너무 강한 글("무적", "즉사", "무한" 등)도 뜻은 그대로 살리되, 수치만 아래 범위 안으로 맞춘다(짧은 무적, 큰 피해 등).

[부작용 원칙: 글자 그대로, 봐주지 않는다]
- 부작용은 쓴 문장을 글자 그대로 실행한다. "공격력 감소", "재사용 시간 증가" 같은 무난한 능력치 깎기로 바꿔치기하는 것은 금지다. 그런 DFX(stat, mul, cd)는 부작용 글이 정말로 그런 뜻일 때만 쓴다.
- 부작용이 능력의 일부를 못 쓰게 하면 그 부분은 정말로 못 쓴다. 예: 능력이 "불을 다룬다"이고 부작용이 "불을 못 쓴다"라면 불이 나오는 기술은 하나도 남으면 안 된다.
  · 막히는 기술이 일부면 그 기술만 lock 한다.
  · 능력 전체가 막히면 replace로 네 기술을 모두 "능력을 못 쓰는 채로 버둥대는 병맛 기술"로 바꾼다(라이터만 딸깍대기, 연기만 나오기, 성냥 던지기, 뜨거운 척하기 등). 바뀐 기술에서 원래 능력의 효과(예: 진짜 불)가 나오면 안 된다. 바뀐 기술은 아주 약해도 되지만, 버둥대는 모습이 웃기고 소리도 처량하게(sfx).
- 부작용이 능력을 다른 것으로 바꾸면(예: "불 대신 물이 나온다") replace로 그 기술들을 바뀐 모습으로 다시 만든다. 이름·pix·vfx·색·sfx까지 바뀐 모습으로.
- 부작용이 방향을 바꾸면 reverse, 적을 도와주면 healfoe·aidfoe, 엉뚱한 기술이 나가면 random, 걸음이 이상해지면 move, 화면이 이상해지면 vision, 무언가 쫓아오면 pest, 무슨 말을 해야 하면 shout, 겉모습이 바뀌면 look을 쓴다.
- 부작용 문장을 [언제]와 [무엇]으로 나눠 읽고 둘 다 그대로 지킨다. 숫자(2배, 절반, 3초 동안, 5번, 10초마다)와 조건(~하면, ~할 때마다, ~초마다, 맞으면, 가만히 있으면, 체력이 낮으면)을 바꾸지 않는다. 글에 없는 효과를 덧붙이지 않는다.
  · 예: "능력을 쓰면 3초 동안 못 움직인다" → {"t":"selfst","on":"skills","st":{"k":"root","d":3}} / "물에 약하다" → {"t":"weakto","vfx":["water"],"pct":100,"name":"물"} / "체력이 50밖에 없다" → {"t":"stat","stat":"hp","pct":50} / "3번 쓰면 기절한다" → {"t":"selfst","on":"skills","nth":3,"st":{"k":"stun","d":1.2}} / "가만히 있으면 체력이 준다" → {"t":"drain","amt":1.5,"if":"still"} / "체력이 낮으면 능력을 못 쓴다" → {"t":"when","if":"lowhp","st":"silence"} / "시간이 지날수록 약해진다" → {"t":"ramp","stat":"dmg","by":"time","pct":50}
- 부작용이 어떤 행동(방귀, 울기, 똥, 재채기, 딸꾹질, 노래, 웃기, 넘어지기, 잠들기 등)을 말하면 act로 캐릭터가 정말 그 행동을 하게 한다. 말풍선(text)에 그 행동 소리를, pose에 맞는 연출을 넣는다. 예: "똥을 싼다" → {"t":"act","every":10,"text":"뿌지직!","pose":"poop","d":1.4} / "맞으면 운다" → {"t":"act","hit":true,"text":"으앙~","pose":"cry","d":1.2} / "재채기를 하면 능력이 나간다" → {"t":"act","every":8,"text":"에취!!","pose":"sneeze","d":0.6,"fire":true}
- 조건과 사건은 최대한 글 그대로 고른다: "적을 맞히면"→"ev":"hitfoe", "적을 쓰러뜨리면"→"kill", "회복하면"→"heal", "상태이상에 걸리면"→"debuff", "적이 능력을 쓰면"→"foeskill", "순간이동하면"→"dash", "누가 죽으면"→"ally", "빗나가면"→"miss", "3번 맞으면"→{"hit":true,"nth":3}, "구석에 있으면"→"if":"edge", "가운데 있으면"→"center", "적이 여럿이면"→"crowd", "혼자 있으면"→"alone", "적 체력이 낮으면"→"foelow", "체력이 가득이면"→"fullhp", "5초 동안 능력을 안 쓰면"→{"if":"idle","n":5}, "궁극기가 준비되면"→"ready", "처음 10초"→{"if":"early","n":10}, "30초가 지나면"→{"if":"late","n":30}, "장판 위에 있으면"→"onzone", "능력을 쓰는 동안"→"casting", "1등이면"→"lead", "지고 있으면"→"behind", "5초 넘게 가만히 있으면"→{"if":"still","n":5}
- 게임에 없는 조건("비가 오면", "밤이 되면")은 몇 초마다 그 조건이 일어난 것으로 친다(act의 every + text에 그 조건). 예: "비가 오면 능력을 못 쓴다" → {"t":"act","every":11,"text":"비가 온다!","st":{"k":"silence","d":3}}
- 부작용 하나가 여러 효과를 뜻하면 fx에 대표 효과를, more에 나머지 효과(최대 2개)를 넣는다.
- how에는 게임에서 실제로 벌어지는 일을 웃기게 쓰고, say에는 그 부작용이 터질 때 캐릭터가 하는 말을 쓴다.
- 피해 예산(체력 100 기준, 기술 한 번의 총 피해): basic 6~12, s1 12~22, s2 15~28, ult 30~50. 강한 효과일수록 cd를 길게.
- 모든 글은 한국어, 전체 이용가. 숫자는 범위를 지킨다. 아래에 없는 값은 쓰지 않는다.

[연출 원칙] 이 게임은 연출이 생명이다. 기술마다 그 능력에서만 나올 법한 모습과 소리를 정한다.
- pix: 발사체·소환물·아이콘을 12x12 픽셀 그림으로 직접 그린다. 능력 글에 나온 사물을 그대로, 한눈에 알아볼 수 있게 자세히 그린다. 오른쪽을 향한 모습으로, 12글자짜리 문자열 12줄. '#' 기본색, 'o' 밝은 부분(왼쪽 위에서 빛이 온다), '.' 어두운 부분·그림자, 'w' 흰 반짝임, 'k' 검정(눈·선), ' ' 빈칸. 테두리는 게임이 자동으로 그린다. 표정(k 눈, w 반짝임)을 넣으면 더 웃기다.
- pix2: 같은 그림의 두 번째 애니메이션 프레임(날개 퍼덕임, 꼬리 흔들기, 입 벌리기, 불꽃 일렁임 등). 같은 규칙, 12줄.
- vfx: 잔상·폭발·장판의 느낌. 능력에 가장 어울리는 것을 기술마다 고른다.
- sfx: 기술 소리. kind는 그 기술이 실제로 낼 법한 소리를 고른다(방귀면 fart, 고양이면 meow, 오리·자동차면 honk, 먹는 거면 gulp·slurp, 노래면 kazoo·choir 등). pitch는 음 높이(0.5 굵고 낮게 ~ 2 가늘고 높게), len은 길이(0.5 짧게 ~ 2 길게). 같은 캐릭터의 네 기술 소리가 서로 다르게.
- say: 그 기술을 쓸 때 캐릭터가 외치는 짧은 대사(10자 이내, 능력 글의 말투를 살린다). 궁극기 say는 게임이 크게 읽어 준다.
- color: 기술마다 능력에 어울리는 색. 네 기술이 한 팔레트 안에서 서로 구별되게.

[출력] JSON 객체 하나만 쓴다. 설명·주석 금지.
{
 "title": "칭호(12자 이내)",
 "concept": "게임에서 어떻게 싸우는지 한 문장(50자 이내)",
 "look": {"skin":"#rrggbb","hair":"#rrggbb","body":"#rrggbb","accent":"#rrggbb","head":HEAD,"outfit":OUTFIT,"weapon":WEAPON,"aura":AURA,"cape":true|false},
 "stats": {"hp":70~140,"speed":0.75~1.35,"size":0.8~1.3},
 "moves": {"basic":MOVE,"s1":MOVE,"s2":MOVE,"ult":MOVE},
 "passive": PASSIVE 또는 null,
 "drawbacks": [DRAWBACK, ...],
 "lines": {"intro":"전투 시작 때 외치는 대사(14자 이내)","ko":"쓰러질 때 대사(14자 이내)","win":"이겼을 때 대사(22자 이내)"}
}
HEAD: ${HEADS.join('|')}
OUTFIT: ${OUTFITS.join('|')}
WEAPON(손에 든 소품, 공격 방식과는 무관): ${WEAPONS.join('|')}
AURA(몸 주위 입자): ${AURAS.join('|')}
MOVE: {"name":"기술 이름(10자 이내)","desc":"효과 설명(36자 이내)","say":"대사","cd":초,"color":"#rrggbb","vfx":VFX,"sfx":{"kind":SOUND,"pitch":0.5~2,"len":0.5~2},"shape":SHAPE,"pix":[12글자 12줄],"pix2":[12글자 12줄],"fx":[EFFECT 1~3개]}
 cd 범위: basic 0.3~1, s1 1~3, s2 1.5~4, ult 5~10 (기술을 마구 난사하는 아주 빠른 게임이다)
VFX: ${VFX.join('|')}
SOUND: ${SOUND_KINDS.join('|')}
SHAPE(pix가 없을 때 쓰는 기본 모양): ${SHAPES.join('|')}
EFFECT (아레나 480x320px, 캐릭터 키 10px, 이동 속도 약 96px/초, 거리 px, 속도 px/초, 모두 가장 가까운 적 방향 기준):
 {"t":"shot","dmg":2~30,"n":1~8,"spread":0~120,"speed":80~340,"size":1~4,"homing":0~1,"pierce":bool,"bounce":0~3,"life":0.3~3,"boom":0~34,"ret":bool,"split":0~6,"from":"hand|sky|ground|around","kb":0~10,"st":ST} 발사체(hand 손에서 날아감, sky 적 주변에 하늘에서 떨어짐, ground 적 쪽으로 땅에서 차례로 솟음, around 사방으로, boom 폭발 반경, bounce 벽에 튕김, ret 부메랑처럼 돌아옴, split 터질 때 작은 조각 개수)
 {"t":"beam","dmg":2~20,"len":24~320,"w":2~14,"ticks":1~6,"dur":0.1~1.5,"both":bool,"sweep":0~220,"kb":0~10,"st":ST} 광선(ticks번 dmg씩, both는 앞뒤로) (sweep: 각도만큼 휙 쓸면서 지나감)
 {"t":"swing","dmg":2~30,"r":10~44,"arc":40~360,"n":1~4,"kb":0~10,"st":ST} 휘두르기(능력으로 만든 무언가를 앞쪽 부채꼴로 쓸어 벤다. arc 360이면 한 바퀴 회전베기, n은 좌우로 번갈아 몇 번)
 {"t":"cone","dmg":1~10,"len":24~120,"arc":20~100,"dur":0.2~1.6,"ticks":1~8,"kb":0~6,"st":ST} 부채꼴 분사(숨결·물줄기·가스·소리를 앞으로 쏟아낸다)
 {"t":"wave","dmg":2~40,"r":16~100,"at":"self|front|target","off":0~140,"n":1~3,"kb":-10~10,"st":ST} 충격파(한 점에서 고리가 퍼져 나간다. 내려찍기·고함·발 구르기. n번 연속)
 {"t":"line","dmg":2~30,"n":3~9,"step":10~28,"r":5~16,"kb":0~10,"st":ST} 땅 가르기(조준 방향으로 기둥·가시·불기둥이 차례로 솟는다)
 {"t":"chain","dmg":2~25,"n":1~6,"range":40~140,"st":ST} 연쇄(가장 가까운 적에게 꽂히고 옆 적으로 n번 튄다)
 {"t":"hook","dmg":2~25,"speed":150~340,"range":50~200,"st":ST} 갈고리(줄 달린 무언가를 던져 맞은 적을 내 쪽으로 끌어온다)
 {"t":"lob","dmg":2~45,"r":8~50,"n":1~5,"kb":0~10,"st":ST} 포물선 투척(머리 위로 던져 표시된 곳에 떨어져 터진다. 벽을 넘어간다)
 추가 공격(이름: 형태 — 쓸 수 있는 값):
 meteor 거대 낙하물(표시 후 큰 것이 떨어짐) dmg r · thrust 찌르기(좁고 긴 일격) dmg len w n · launch 띄우기(앞의 적을 공중에 띄워 잠시 못 움직이게) dmg r off d · leap 도약 내려찍기(적 쪽으로 뛰어올라 착지 충격) dmg r dist
 flurry 난무(앞 구역을 마구 베기) dmg r off dur ticks · spikering 가시 고리(원형으로 솟음) dmg r n at:self|target · cross 십자 폭발(+모양) dmg n at · tornado 움직이는 회오리(끌어당기며 전진) dmg r speed life
 roll 굴러가는 거대 구체(관통·벽에 튕김) dmg size speed life bounce · firewall 가로 불벽(앞에 세워 지나가면 피해) dmg len off dur · net 그물(맞은 자리 속박) dmg speed range r d · surge 전진하는 지면파(넓은 벽이 밀고 나감) dmg w len speed
 clone 분신(내 모습이 달려가 터짐) dmg n r dur · mark 표식(적에게 붙어 잠시 후 폭발) dmg r delay range · charge 모아 쏘기(기를 모아 거대 관통탄) dmg delay speed boom · missiles 유도 미사일 연발 dmg n speed
 vortex 소용돌이 장판(계속 빨아들임) dmg r dur pull at · storm 낙뢰(적 주변에 번개 연타) dmg n r · ring 가두는 고리(테두리를 넘으면 피해) dmg r dur at · phantom 환영 베기(돌진한 길이 뒤늦게 베어짐) dmg dist
 spiral 나선 탄막 dmg n speed dir · prism 세 갈래 광선 dmg len w spread ticks dur · whip 채찍(휘는 긴 일격) dmg len · skyline 일직선 하늘 낙하(검의 비) dmg n step r · gatling 개틀링 연사 dmg n spread
 top 팽이(돌아다니며 부딪힘) dmg n speed dur · beacon 신호탑(설치하면 주기적으로 충격파) dmg r rate dur · snipe 저격(조준선 후 한 방) dmg delay · gust 돌풍(넓게 강하게 밀침) dmg len arc kb · drain 흡혈 줄(연결해 피해를 주며 회복) dmg range dur ticks heal
 bite 거대한 입(앞이나 가까운 적을 덥석 문다) dmg r range · stampede 떼 돌진(무리가 한 방향으로 우르르 달려감) dmg n speed len size · pillar 솟는 기둥 연쇄(앞으로 줄줄이 솟음, lift면 띄움) dmg n step r lift
 lasergrid 레이저망(적 주변에 경고선이 깜빡인 뒤 한꺼번에 발사) dmg n delay · hop 통통 튀는 덩어리(적에게 뛰어가 착지할 때마다 쿵) dmg n r size · swarm 떼구름(벌레·새 떼가 적을 쫓아다니며 쪼음) dmg r dur speed
 bubble 거품 감옥(맞으면 거품에 갇혀 둥둥 뜸) dmg n speed size d · grab 거대 손(땅에서 손이 솟아 잡아채 내 앞으로 패대기) dmg r range delay · claw 할퀴기(세 줄 손톱) dmg r · crack 땅 균열(갈라짐이 앞으로 달려감) dmg len speed r
 stomp 발 구르기(내 자리에서 점점 커지는 쿵쿵) dmg n r · sonic 음파(앞으로 부채꼴 고리가 퍼짐) dmg n len arc
 shot에 붙일 수 있는 움직임: "path":"zigzag(지그재그)|sine(물결)|helix(이중나선)|curve(휘어짐, turn ±1)|spiral(나선으로 퍼짐)|orbit(내 주위를 돌다 날아감)|stopgo(멈췄다 돌진)|stay(멈춰서 떠 있음)|wobble(비틀비틀)|late(늦게 추적)|blink(순간이동하며)|accel(점점 빨라짐)|decel(점점 느려짐)", "end":"burst(사방으로 터짐, n2개)|mine(멈춘 자리에서 폭발)|zone(장판)|pillars(기둥 원)", "drop":0.07~0.5(그 초마다 길에 dropk=blast|zone|spike를 떨굼), "aura":0~22(구슬 주변이 계속 아픔), "grow":0~10(날수록 커짐), "pull":-16~16(주변을 끌어당김, 음수면 밀어냄)
 {"t":"pattern","shape":"ring|double|star|cross|x|grid|checker|heart|square|triangle|spiral|line|zigzag|arrow|random|flower|smile|wave|kk|hex","at":"self|target|front","kind":"blast(경고 뒤 폭발)|pillar(솟는 기둥)|spike(땅 가시)|drop(하늘에서 떨어짐)","dmg":1~35,"n":3~12,"size":12~110,"r":4~26,"delay":0~1.5,"step":0~0.45(점마다 시간차),"st":ST} 모양대로 여러 곳이 한꺼번에·차례로 터짐 (smile은 웃는 얼굴, kk는 ㅋㅋ 글자)
 추가 공격 100종 — {"t":"이름","dmg":숫자,"st":ST}만 써도 알아서 만들어진다: ${xtDoc()}
 모든 추가 공격은 {"t":"이름", 값들..., "st":ST} 형태로 쓴다.
 {"t":"blast","dmg":4~50,"r":6~56,"at":"self|front|target","off":0~140,"delay":0~1.5,"kb":-10~10,"st":ST} 폭발(kb 음수는 끌어당김, front는 적 방향 off만큼 앞, target은 적 위치)
 {"t":"zone","dmg":0~8,"r":8~50,"dur":1.5~8,"at":"self|front|target","off":0~140,"follow":bool,"heal":0~6,"st":ST} 장판(0.5초마다 dmg, heal은 안에 선 자신 회복, follow는 자신을 따라다님)
 {"t":"trail","dmg":0~6,"r":6~16,"dur":1~6,"life":1~4,"st":ST} dur초 동안 지나간 자리에 흔적 장판을 남김
 {"t":"dash","dist":20~130,"dmg":0~30,"invuln":bool,"kb":0~10,"st":ST} 적 방향으로 돌진
 {"t":"blink","to":"front|back|side|behind|random","dist":20~140} 순간이동(behind는 가장 가까운 적 뒤)
 {"t":"buff","k":BUFF,"d":1~8,"pow":수} 자기 강화(shield pow=막는 피해 10~60, regen pow=초당 회복 2~8, fly=구덩이 위로 다님)
 {"t":"heal","amt":5~45} 즉시 회복
 {"t":"summon","kind":"turret|chaser|orbit|mine|barrier","n":1~4,"dur":3~14,"dmg":2~20,"rate":0.4~2,"st":ST} 소환(turret 자동 포탑, chaser 쫓아가는 부하, orbit 몸 주위를 도는 것, mine 지뢰, barrier 적과 발사체를 막는 벽). 소환물은 그 기술의 pix 모양으로 그려진다.
 {"t":"all","dmg":0~10,"st":ST} 아레나 전체의 적에게
 {"t":"swap"} 가장 가까운 적과 자리 바꾸기
 basic에는 buff, heal, all, swap을 쓸 수 없다. "st"는 생략 가능. ST: {"k":DEBUFF,"d":0.5~5}
DEBUFF: burn(화상 지속피해)|poison(중독 지속피해)|slow|root(이동 불가)|stun(기절)|freeze(빙결)|silence(능력 봉인)|confuse(방향 반전)|weak(공격력 감소)|vuln(받는 피해 증가)|slip(미끄러짐)|heavy(무거움: 느려지고 돌진·순간이동 불가)|dance(강제로 춤춤: 아무것도 못 함)|sleep(잠듦: 맞으면 깸)|morph(변신: 그 기술의 pix 모양 생물로 변해 능력을 못 쓰고 느려짐)
BUFF: haste|shield|regen|power|armor|invis|giant|tiny|fly|reflect|invuln|counter(반격 자세: 그 시간 안에 처음 맞는 공격을 막고 되돌려 줌, 최대 2초)
PASSIVE: {"k":"regen|thorns|lifesteal|armor|rage|aura|revive|swift|crit|dodge","desc":"설명(30자 이내)"}
DRAWBACK: {"how":"게임에서 실제로 벌어지는 일(50자 이내)","say":"부작용이 터질 때 하는 말(14자 이내, 없으면 빈 문자열)","fx":DFX,"more":[DFX, ...]}
ON: basic|s1|s2|ult|skills(네 능력 모두)
DFX:
 {"t":"lock","on":ON} 그 기술을 아예 못 씀(버튼을 눌러도 헛손질만)
 {"t":"replace","moves":{"basic"?:MOVE,"s1"?:MOVE,"s2"?:MOVE,"ult"?:MOVE}} 그 기술들을 부작용 때문에 바뀐 모습의 MOVE로 통째로 바꿈
 {"t":"reverse","on":ON,"chance":10~100} 기술이 적 반대 방향으로 나감
 {"t":"healfoe","on":ON,"chance":10~100} 맞은 적이 피해 대신 회복함
 {"t":"random","on":ON,"chance":10~100} 누른 기술 대신 자기 기술 중 아무거나 나감
 {"t":"fail","on":ON,"chance":10~100,"back":"fizzle|selfhit|stun"} 확률적으로 실패(100이면 항상 실패)
 {"t":"backfire","on":ON,"pct":10~100} 기술 위력의 pct%만큼 자기도 다침
 {"t":"selfdmg","on":ON,"amt":1~40} 쓸 때마다 체력 소모 (또는 "pct":5~90 현재 체력의 그만큼, "체력이 절반이 된다"면 pct 50)
 {"t":"selfst","on":ON,"st":{"k":DEBUFF,"d":0.3~5}} 쓰고 나면 자신에게 상태이상
 {"t":"tick","every":3~20,"st":{"k":DEBUFF,"d":0.3~4}} 주기적으로 저절로 상태이상(갑자기 춤추기, 잠들기 등)
 {"t":"when","if":IF,"n"?:숫자,"st":DEBUFF} 조건인 동안 계속 상태이상
 IF(조건): moving 움직임 · still 가만히 · lowhp 체력 n% 이하 · highhp · fullhp 체력 가득 · near 적이 가까이 · far · edge 맵 가장자리 · center 한가운데 · crowd 적 n명 이상 근처 · alone 주변에 아무도 없음 · foelow 가까운 적 체력 낮음 · foehigh · debuffed 상태이상 걸림 · buffed 강화 받음 · idle n초 동안 능력 안 씀 · busy 능력 전부 대기 · ready 궁극기 준비됨 · early 처음 n초 · late n초 이후 · onzone 장판 위 · dashing 돌진 중 · casting 기술 쓰는 중 · lead 체력 1등 · behind 체력 꼴찌. still·moving에 n을 주면 n초 넘게 그럴 때
 act에는 "ev"도 쓸 수 있다: hitfoe 적을 맞힐 때 · kill 적을 쓰러뜨릴 때 · heal 회복할 때 · debuff 상태이상 걸릴 때 · foeskill 근처 적이 능력 쓸 때 · dash 돌진·순간이동할 때 · ally 다른 플레이어가 쓰러질 때 · miss 공격이 빗나갈 때 · buff 강화 받을 때 · crit 치명타 터질 때 ("nth":N이면 N번째마다). hit에도 "nth"를 주면 N번 맞을 때마다
 {"t":"move","mode":"reverse|slide|drunk|nostop|backward|hop|spin"} 걸음이 이상해짐(reverse 방향키 반대, slide 빙판, drunk 비틀비틀, nostop 멈출 수 없음, backward 뒷걸음질, hop 깡총깡총, spin 뱅글뱅글)
 {"t":"vision","mode":"dark|flip|mirror|shake|tiny|zoom"} 그 플레이어 화면만 이상해짐(dark 앞이 거의 안 보임, flip 위아래 뒤집힘, mirror 좌우 뒤집힘, shake 계속 흔들림, tiny 너무 멀리 보임, zoom 코앞만 보임)
 {"t":"pest","every":3~20,"dmg":0~8,"name":"쫓아오는 것 이름","color":"#rrggbb","pix":[12글자 12줄],"st":ST} 주기적으로 무언가가 나타나 자기를 쫓아와 괴롭힘(벌, 비둘기, 엄마 등)
 {"t":"shout","on":ON,"text":"외치는 말(16자 이내)"} 쓸 때마다 그 말을 크게 외침
 {"t":"look","head"?:HEAD,"outfit"?:OUTFIT,"weapon"?:WEAPON,"aura"?:AURA,"skin"?:"#rrggbb","hair"?:"#rrggbb","body"?:"#rrggbb","accent"?:"#rrggbb"} 겉모습이 바뀜
 {"t":"stat","stat":"hp|speed|size|dmg|taken","pct":10~200} 능력치 변화(hp·speed·dmg는 최대 80% 감소, size 몸집·taken 받는 피해는 최대 200% 증가)
 {"t":"mul","on":ON,"pct":10~95} 그 기술만 위력 감소
 {"t":"cd","on":ON,"pct":30~400} 재사용 시간 증가
 {"t":"recoil","on":ON,"force":3~14} 쓸 때 반대쪽으로 날아감
 {"t":"hurtst","st":{"k":DEBUFF,"d":0.3~3},"chance":20~100} 맞을 때 상태이상
 {"t":"drain","amt":0.5~6,"if":"always|still|moving"} 체력이 초당 줄어듦
 {"t":"windup","on":ON,"time":0.2~3} 쓰기 전에 멈춰서 준비
 {"t":"uses","on":ON,"n":0~6} 한 판 사용 횟수 제한(0이면 못 씀)
 {"t":"aidfoe","on":ON,"k":"haste|power|regen|shield|giant|invuln","d":1~5} 쓸 때마다 가장 가까운 적이 강해짐
 {"t":"stack","on":ON,"stat":"size|slow|taken","pct":3~25} 쓸수록 불이익이 쌓임
 {"t":"tele","on":ON} 쓰고 나면 아무 데로나 튕겨감
 {"t":"hpset","hp":1~999} 최대 체력이 딱 그 숫자 ("체력이 1이다")
 {"t":"foestat","stat":"hp|speed|dmg|size|taken","pct":-90~300} 모든 상대의 능력치가 바뀜 ("적이 2배로 세진다")
 {"t":"dmgfix","on":ON,"n":0~99} 맞히면 피해가 딱 n ("공격력이 0이다", "적을 공격할 수 없다"→0)
 {"t":"pspeed","on":ON,"pct":-85~200} 날아가는 속도 ("총알이 느리다") · {"t":"psize","on":ON,"pct":-80~200} 공격 크기 ("총알이 작다")
 {"t":"nofx","what":"jump|dash|tele|fly|heal|shield|invis|buff|clone|summon"} 그 동작을 아예 못 함 ("점프를 못 한다")
 {"t":"selfhit"} 내 공격에 나도 맞음 · {"t":"lure"} 적 투사체가 나한테 휘어 들어옴("피할 수 없다") · {"t":"exposed"} 모두에게 내 위치가 보임 · {"t":"mute"} 소리가 안 들림
 {"t":"dtrail","kind":"fire|poop|ice|slime|water|flower|squeak|money"} 걸어간 자리에 남음 ("지나간 자리에 불이 난다")
 {"t":"move","mode":"frozen"} 걸어서 못 움직임 · {"t":"vision","mode":"noself|cute"} 내 캐릭터가 안 보임/적이 귀엽게 보임 · {"t":"stat","stat":"kb","pct"} 맞으면 더 멀리 날아감 · stack stat "weak" 쓸수록 약해짐 · weakto에 "die":true(닿으면 죽음)·"st"(맞으면 그 상태)
 act에 더 붙일 수 있는 것: "die":true 죽음, "boom":true 폭발, "heal":N 회복, "buff":{"k":BUFF,"d"} 강화, "fst":{"k":ST,"d"} 주변 적에게 상태, "fdmg":N 주변 적 피해, "fheal":N 가장 가까운 적 회복, "tele":"rand|foe|corner|center" 순간이동, "later":N 그 초 뒤에, "vis":"dark|flip|mirror|shake|zoom","visd":N 잠깐 내 화면, "fpull"/"fpush":true 적을 끌어옴/밀쳐냄, "accel":true 점점 자주, pose "rain|night|snow|thunder|hot|cold|wind"(word에 초) 날씨, "change" 옷이 바뀜, "breath"(word에 VFX) 뿜기
 {"t":"act","text":"말풍선(16자 이내)","pose":"gas|sneeze|hiccup|poop|cry|laugh|sing|yawn|coin|heart|bow|snap|eat|sweat|zzz|star|fall|shout|word","d":0~4,"st"?:{"k":DEBUFF,"d":0.3~4},"fire"?:true,"push"?:true,"hp"?:1~40(그때 체력도 잃음), 언제: "on":ON | "every":2~30 | "hit":true | "ev":사건 | "if":IF ("n"?:숫자) | "bump":true} 부작용에 쓴 행동을 정말로 함. on 쓸 때, every 몇 초마다, hit 맞을 때, if 그 조건이 되는 순간, bump 벽에 부딪힐 때. d초 동안 멈추거나 st 상태이상. fire 능력이 저절로 나감, push 튕겨 날아감
 {"t":"aim","on":ON,"deg":10~90,"chance":10~100} 조준이 빗나감
 {"t":"range","on":ON,"pct":15~80} 사거리가 짧아짐
 {"t":"ramp","stat":"dmg|speed|size","by":"time|hp","pct":10~80} 시간이 지날수록(time)·체력이 줄수록(hp) 점점 약해짐·느려짐·커짐(size는 -60이면 작아짐)
 {"t":"flee","if":"near|lowhp|always"} 그 조건이면 저절로 도망침
 {"t":"weakto","vfx":[VFX,...],"pct":20~300,"name":"물"} 그 종류(vfx)의 공격에 맞으면 피해 증가
덧붙임: selfst·selfdmg·stack·recoil·tele·aidfoe·act·shout에 "nth":2~10을 넣으면 N번 쓸 때마다만. stack에 "hit":true면 맞을 때마다. cd에 "min":1~20이면 그 초에 한 번만. stat size의 pct는 -60(작아짐)~200. uses n은 0~20. move에 left|right|side|vertical(그 방향으로만 움직임)도 있다. pest에 "on":ON을 넣으면 그 기술을 쓸 때 나타난다.`;
}

/** 한 명의 설계서 만들기. sample이 없거나 실패하면 기본 해석기. */
async function forgeSpec(sample, entry, onProgress) {
  const sides = entry.sides || [];
  if (sample) {
    try {
      const ask = (tier) => sample.json(buildPrompt(entry.name, entry.ability, sides), {
        cache: false,
        modelTier: tier,
        onText: ({ text }) => onProgress && onProgress(Math.min(0.95, text.length / 3400)),
      });
      let raw;
      try { raw = await ask(entry.bot ? 'default' : 'complex'); } catch (e) {
        if (e && e.code === 'not_granted') throw e;
        await new Promise((r) => setTimeout(r, 2500));
        raw = await ask(entry.bot ? 'quick' : 'default');
      }
      if (raw && typeof raw === 'object' && raw.moves) return { spec: sanSpec(raw, sides, true), err: null };
      return { spec: fallbackSpec(entry.ability, sides), err: 'invalid_json' };
    } catch (e) {
      return { spec: fallbackSpec(entry.ability, sides), err: (e && e.code) || 'error' };
    }
  }
  return { spec: fallbackSpec(entry.ability, sides), err: 'no_ai' };
}

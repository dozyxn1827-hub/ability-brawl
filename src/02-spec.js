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

function sanFx(e, slot) {
  if (!e || typeof e !== 'object') return null;
  const st = sanSt(e.st, slot);
  const at = oneOf(e.at, ['self', 'front', 'target'], 'front');
  switch (e.t) {
    case 'melee': case 'punch': case 'kick':
      // 맨손·무기 휘두르기는 없다. 들어오면 앞쪽 능력 폭발로 바꾼다.
      return sanFx({ t: 'blast', dmg: e.dmg, r: num(e.range, 8, 60, 24) * 0.45, at: 'front', off: 9, delay: 0, kb: e.kb, st: e.st }, slot);
    case 'shot':
      return {
        t: 'shot', dmg: num(e.dmg, 1, 40, 6), n: Math.round(num(e.n, 1, 8, 1)), spread: num(e.spread, 0, 120, 0),
        speed: num(e.speed, 80, 340, 200), size: Math.round(num(e.size, 1, 4, 2)), homing: num(e.homing, 0, 1, 0),
        pierce: bool(e.pierce), bounce: Math.round(num(e.bounce, 0, 3, 0)), life: num(e.life, 0.3, 3, 1), boom: num(e.boom, 0, 34, 0),
        ret: bool(e.ret), split: Math.round(num(e.split, 0, 6, 0)),
        from: oneOf(e.from, ['hand', 'sky', 'ground', 'around'], 'hand'), kb: num(e.kb, 0, 10, 2), st,
      };
    case 'beam':
      return { t: 'beam', dmg: num(e.dmg, 1, 20, 5), len: num(e.len, 24, 320, 110), w: num(e.w, 2, 14, 4), ticks: Math.round(num(e.ticks, 1, 6, 2)), dur: num(e.dur, 0.1, 1.5, 0.4), both: bool(e.both), kb: num(e.kb, 0, 10, 1), st };
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
      const cap = k === 'invuln' ? (slot === 'ult' ? 2.5 : 1.5) : k === 'invis' ? 5 : k === 'fly' ? 6 : 8;
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
    case 'shot': return e.dmg * (e.n <= 2 ? e.n : 2 + (e.n - 2) * 0.5) * (e.ret ? 1.4 : 1) + (e.boom > 0 ? e.dmg * 0.3 : 0) + (e.split ? e.dmg * 0.4 * Math.min(2, e.split) : 0);
    case 'trail': return e.dmg * e.dur * 1.2;
    case 'beam': return e.dmg * e.ticks;
    case 'zone': return e.dmg * (e.dur / 0.5) * 0.4;
    case 'all': return e.dmg * 1.5;
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
  let fx = (Array.isArray(m.fx) ? m.fx : []).map((e) => sanFx(e, slot)).filter(Boolean).slice(0, 3);
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
  const k = oneOf(st.k === 'float' ? 'slip' : st.k, DEBUFFS, null);
  if (!k) return null;
  return { k, d: r1(num(st.d, 0.3, maxD, Math.min(1.5, maxD))) };
}
const IF_MAP = { air: 'moving', ground: 'still' };
const IFS = ['always', 'moving', 'still', 'lowhp', 'highhp', 'near', 'far'];
/** 부작용 하나. look·replace는 설계서를 직접 바꾸고, 나머지는 엔진이 실행한다 */
function sanDfx(d) {
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
    case 'selfdmg': return { t: 'selfdmg', on, amt: r1(num(d.amt, 1, 40, 8)) };
    case 'backfire': return { t: 'backfire', on, pct: Math.round(num(d.pct, 10, 100, 50)) };
    case 'selfst': { const st = sanSelfSt(d.st, 5); return st ? { t: 'selfst', on, st } : null; }
    case 'stat': return { t: 'stat', stat: oneOf(d.stat === 'jump' ? 'speed' : d.stat, ['hp', 'speed', 'size', 'dmg', 'taken'], 'taken'), pct: Math.round(num(d.pct, 10, d.stat === 'size' || d.stat === 'taken' ? 200 : 80, 30)) };
    case 'mul': return { t: 'mul', on, pct: Math.round(num(d.pct, 10, 95, 50)) };
    case 'cd': return { t: 'cd', on, pct: Math.round(num(d.pct, 30, 400, 100)) };
    case 'tick': { const st = sanSelfSt(d.st, 4); return st ? { t: 'tick', every: Math.round(num(d.every, 3, 20, 8)), st } : null; }
    case 'recoil': return { t: 'recoil', on, force: num(d.force, 3, 14, 7) };
    case 'fail': return { t: 'fail', on, chance: Math.round(num(d.chance, 10, 100, 40)), back: oneOf(d.back, ['fizzle', 'selfhit', 'stun'], 'fizzle') };
    case 'reverse': return { t: 'reverse', on, chance: Math.round(num(d.chance, 10, 100, 100)) };
    case 'healfoe': return { t: 'healfoe', on, chance: Math.round(num(d.chance, 10, 100, 100)) };
    case 'random': return { t: 'random', on, chance: Math.round(num(d.chance, 10, 100, 50)) };
    case 'hurtst': { const st = sanSelfSt(d.st, 3); return st ? { t: 'hurtst', st, chance: Math.round(num(d.chance, 20, 100, 50)) } : null; }
    case 'when': {
      const k = typeof d.st === 'object' && d.st ? d.st.k : d.st;
      return { t: 'when', if: oneOf(IF_MAP[d.if] || d.if, IFS.slice(1), 'still'), st: oneOf(k === 'float' ? 'slip' : k, DEBUFFS, 'weak') };
    }
    case 'drain': return { t: 'drain', amt: r1(num(d.amt, 0.5, 6, 1.5)), if: oneOf(IF_MAP[d.if] || d.if, IFS, 'always') };
    case 'windup': return { t: 'windup', on, time: r1(num(d.time, 0.2, 3, 0.8)) };
    case 'uses': return { t: 'uses', on, n: Math.round(num(d.n, 0, 6, 3)) };
    case 'aidfoe': return { t: 'aidfoe', on, k: oneOf(d.k, ['haste', 'power', 'regen', 'shield', 'giant', 'invuln'], 'haste'), d: r1(num(d.d, 1, 5, 2)) };
    case 'stack': return { t: 'stack', on, stat: oneOf(d.stat, ['size', 'slow', 'taken'], 'size'), pct: Math.round(num(d.pct, 3, 25, 8)) };
    case 'tele': return { t: 'tele', on };
    case 'move': return { t: 'move', mode: oneOf(d.mode, MOVE_MODES, 'reverse') };
    case 'vision': return { t: 'vision', mode: oneOf(d.mode, Object.keys(VISION_KO), 'dark') };
    case 'shout': { const text = str(d.text, 16, ''); return text ? { t: 'shout', on, text } : null; }
    case 'pest': return { t: 'pest', every: Math.round(num(d.every, 3, 20, 7)), dmg: r1(num(d.dmg, 0, 8, 3)), name: str(d.name, 8, '귀찮은 것'), color: col(d.color, '#ffe14a'), pix: sanPix(d.pix), st: sanSelfSt(d.st, 2) };
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
/** 부작용이 게임에서 정확히 어떻게 작동하는지 한 줄로 */
function dfxText(f) {
  const on = ON_KO[f.on] || '';
  switch (f.t) {
    case 'lock': return `${on} 봉인 (아예 못 씀)`;
    case 'replace': return Object.keys(f.moves).map((s) => SLOT_KO[s]).join('·') + '이(가) 다른 기술로 바뀜';
    case 'selfdmg': return `${on} 쓸 때마다 체력 -${f.amt}`;
    case 'backfire': return `${on} 위력의 ${f.pct}%만큼 자기도 다침`;
    case 'selfst': return `${on} 쓰고 나면 ${ST_KO[f.st.k]} ${f.st.d}초`;
    case 'stat': return { hp: `최대 체력 -${f.pct}%`, speed: `이동 속도 -${f.pct}%`, size: `몸집 +${f.pct}%`, dmg: `모든 위력 -${f.pct}%`, taken: `받는 피해 +${f.pct}%` }[f.stat];
    case 'mul': return `${on} 위력 -${f.pct}%`;
    case 'cd': return `${on} 재사용 시간 +${f.pct}%`;
    case 'tick': return `${f.every}초마다 저절로 ${ST_KO[f.st.k]} ${f.st.d}초`;
    case 'recoil': return `${on} 쓸 때마다 반대쪽으로 날아감`;
    case 'fail': return f.chance >= 100 ? `${on} 무조건 실패` : `${on} ${f.chance}% 확률로 ` + { fizzle: '불발', selfhit: '자폭 (체력 -12)', stun: '실패하고 기절' }[f.back];
    case 'reverse': return `${on} ${f.chance >= 100 ? '항상' : f.chance + '% 확률로'} 반대 방향으로 나감`;
    case 'healfoe': return `${on} 맞은 적이 ${f.chance >= 100 ? '오히려' : f.chance + '% 확률로'} 회복함`;
    case 'random': return `${on} ${f.chance}% 확률로 엉뚱한 기술이 나감`;
    case 'hurtst': return `맞으면 ${f.chance}% 확률로 ${ST_KO[f.st.k]} ${f.st.d}초`;
    case 'when': return `${IF_KO[f.if]} 동안 ${ST_KO[f.st]}`;
    case 'drain': return `${f.if === 'always' ? '항상' : IF_KO[f.if] + ' 동안'} 초당 체력 -${f.amt}`;
    case 'windup': return `${on} 쓰기 전 ${f.time}초 멈춰서 준비`;
    case 'uses': return f.n === 0 ? `${on} 봉인 (아예 못 씀)` : `${on} 한 판에 ${f.n}번씩만`;
    case 'aidfoe': return `${on} 쓸 때마다 가장 가까운 적에게 ${ST_KO[f.k]} ${f.d}초`;
    case 'stack': return `${on} 쓸 때마다 ` + { size: `몸집 +${f.pct}%`, slow: `이동 속도 -${f.pct}%`, taken: `받는 피해 +${f.pct}%` }[f.stat] + ' (누적)';
    case 'tele': return `${on} 쓰고 나면 아무 데로나 튕겨감`;
    case 'move': return MOVE_KO[f.mode];
    case 'vision': return VISION_KO[f.mode] + ' (내 화면)';
    case 'shout': return `${on} 쓸 때마다 “${f.text}” 외침`;
    case 'pest': return `${f.every}초마다 ${josa(f.name, '이', '가')} 쫓아와 괴롭힘`;
    case 'look': return '겉모습이 바뀜';
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
  const t = text || '';
  const has = (re) => re.test(t);
  const q = t.match(/["'“‘「]([^"'”’」]{1,16})["'”’」]/);
  const say = q ? q[1] : '';
  const n = (t.match(/[0-6]/) || [3])[0] | 0;
  let fx;
  if (has(/못\s?(쓴|씀|써|한다|함)|안\s?나(온|와)|사용\s?(불가|금지)|봉인|쓸 수 없|금지/)) fx = { t: 'replace', moves: PATHETIC };
  else if (has(/외친|외쳐|소리친|말한|말해야|노래/) && say) fx = { t: 'shout', on: 'skills', text: say };
  else if (has(/횟수|번만|번밖|번 밖|한정/)) fx = { t: 'uses', on: 'skills', n };
  else if (has(/(적|상대|남).*(회복|치료|체력이 찬|낫)/)) fx = { t: 'healfoe', on: 'skills', chance: 100 };
  else if (has(/(반대|뒤|거꾸로).*(나간|날아|쏜|발사)|엉뚱한 방향/)) fx = { t: 'reverse', on: 'skills', chance: 100 };
  else if (has(/랜덤|무작위|아무거나 나|엉뚱한 (기술|능력)/)) fx = { t: 'random', on: 'skills', chance: 60 };
  else if (has(/앞이 안|눈이 안|시야|어두|장님|눈을 감/)) fx = { t: 'vision', mode: 'dark' };
  else if (has(/화면이 뒤집|세상이 뒤집|거꾸로 보/)) fx = { t: 'vision', mode: 'flip' };
  else if (has(/어지|흔들/)) fx = { t: 'vision', mode: 'shake' };
  else if (has(/벌|모기|파리|비둘기|강아지|고양이|쫓아|따라다/)) fx = { t: 'pest', every: 6, dmg: 3, name: (t.match(/(벌|모기|파리|비둘기|강아지|고양이)/) || ['', '무언가'])[1] };
  else if (has(/춤/)) fx = { t: 'tick', every: 7, st: { k: 'dance', d: 1.5 } };
  else if (has(/잠|졸/)) fx = { t: 'tick', every: 8, st: { k: 'sleep', d: 2 } };
  else if (has(/대머리|머리가 빠/)) fx = { t: 'look', look: { head: 'bald' } };
  else if (has(/반대로 (움직|걸)|방향이 반대|조작이 반대/)) fx = { t: 'move', mode: 'reverse' };
  else if (has(/미끄/)) fx = { t: 'move', mode: 'slide' };
  else if (has(/비틀|취한|술/)) fx = { t: 'move', mode: 'drunk' };
  else if (has(/멈출 수 없|계속 (달|뛰|걸)/)) fx = { t: 'move', mode: 'nostop' };
  else if (has(/뒷걸음|문워크/)) fx = { t: 'move', mode: 'backward' };
  else if (has(/깡총|토끼|뛰어다/)) fx = { t: 'move', mode: 'hop' };
  else if (has(/실패|확률|불발|가끔 안/)) fx = { t: 'fail', on: 'skills', chance: 40, back: has(/자기|자신|본인|맞|터/) ? 'selfhit' : has(/기절|멈/) ? 'stun' : 'fizzle' };
  else if (has(/(계속|서서히|시간이).*(줄|깎|닳)/)) fx = { t: 'drain', amt: 2, if: 'always' };
  else if (has(/나도 (아프|다치)|같이 맞|자기도/)) fx = { t: 'backfire', on: 'skills', pct: 60 };
  else if (has(/체력|피가|hp|생명|목숨|아프|다친|다쳐|수명/i)) fx = { t: 'selfdmg', on: 'skills', amt: 10 };
  else if (has(/기절|멈칫|재채기|굳|마비|딸꾹/)) fx = has(/주기|가끔|때때로|초마다|갑자기/) ? { t: 'tick', every: 6, st: { k: 'stun', d: 1.5 } } : { t: 'selfst', on: 'skills', st: { k: 'stun', d: 1.2 } };
  else if (has(/느려|느림|둔해|굼|거북/)) fx = { t: 'stack', on: 'skills', stat: 'slow', pct: 10 };
  else if (has(/커지|커진|뚱뚱|살이|거대/)) fx = { t: 'stack', on: 'skills', stat: 'size', pct: 15 };
  else if (has(/작아|줄어/)) fx = { t: 'selfst', on: 'skills', st: { k: 'morph', d: 2 } };
  else if (has(/헷갈|조작|뒤바|어지/)) fx = { t: 'selfst', on: 'skills', st: { k: 'confuse', d: 3 } };
  else if (has(/순간이동|텔레포트|엉뚱한 곳|아무 데|어딘가/)) fx = { t: 'tele', on: 'skills' };
  else if (has(/날아|밀려|반동|튕|넘어|뒤로/)) fx = { t: 'recoil', on: 'skills', force: 10 };
  else if (has(/쿨|재사용|오래 기다|대기/)) fx = { t: 'cd', on: 'skills', pct: 150 };
  else if (has(/모아|충전|준비|기다려야|주문|외쳐야/)) fx = { t: 'windup', on: 'skills', time: 1.2 };
  else if (has(/(상대|적|남).*(강해|빨라|커|좋아)/)) fx = { t: 'aidfoe', on: 'skills', k: 'haste', d: 3 };
  else if (has(/약해|힘이 빠|위력/)) fx = { t: 'mul', on: 'skills', pct: 60 };
  else if (has(/방어|맞으면|받는 피해|종이|유리|약골/)) fx = { t: 'stat', stat: 'taken', pct: 60 };
  else if (has(/불|화상|뜨거|타/)) fx = { t: 'selfst', on: 'skills', st: { k: 'burn', d: 3 } };
  else {
    let hsh = 0;
    for (const ch of t) hsh = (hsh * 31 + ch.codePointAt(0)) >>> 0;
    fx = [{ t: 'selfst', on: 'skills', st: { k: 'dance', d: 1 } }, { t: 'move', mode: 'drunk' }, { t: 'reverse', on: 'skills', chance: 40 }, { t: 'tick', every: 8, st: { k: 'sleep', d: 1.5 } }][hsh % 4];
  }
  fx = sanDfx(fx);
  return { how: dfxText(fx), say, fx };
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
    const g = fx ? null : guessDrawback(s.text);
    fx = fx || g.fx;
    return {
      by: str(s.by, 12, '?'), text: str(s.text, 90, ''),
      how: fx === (g && g.fx) ? g.how : str(d.how, 60, dfxText(fx)),
      say: str(fx === (g && g.fx) ? g.say : d.say, 16, ''),
      fx, more: extra,
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
2. 콩트 구성: 네 기술이 한 편의 콩트처럼 이어지게 한다.
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
 {"t":"beam","dmg":2~20,"len":24~320,"w":2~14,"ticks":1~6,"dur":0.1~1.5,"both":bool,"kb":0~10,"st":ST} 광선(ticks번 dmg씩, both는 앞뒤로)
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
BUFF: haste|shield|regen|power|armor|invis|giant|tiny|fly|reflect|invuln
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
 {"t":"selfdmg","on":ON,"amt":1~40} 쓸 때마다 체력 소모
 {"t":"selfst","on":ON,"st":{"k":DEBUFF,"d":0.3~5}} 쓰고 나면 자신에게 상태이상
 {"t":"tick","every":3~20,"st":{"k":DEBUFF,"d":0.3~4}} 주기적으로 저절로 상태이상(갑자기 춤추기, 잠들기 등)
 {"t":"when","if":"moving|still|lowhp|highhp|near|far","st":DEBUFF} 조건인 동안 계속 상태이상
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
 {"t":"tele","on":ON} 쓰고 나면 아무 데로나 튕겨감`;
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

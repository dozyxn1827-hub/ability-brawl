/* ===== 전투 엔진 (탑뷰, 카메라·빛·연출) ===== */
const SLOT_IDX = { basic: 0, s1: 1, s2: 2, ult: 3 };
const NOINP = { mx: 0, my: 0, a: 0, b: 0, c: 0, u: 0 };
const KEYSLOT = [['ult', 'u'], ['s2', 'c'], ['s1', 'b'], ['basic', 'a']];
const POSES = ['idle', 'run', 'cast', 'hurt', 'ko', 'wind'];
const KB = 26, DASH_V = 420, STORM_AT = 55, STORM_LEN = 45;
const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
const ang2dir = (a) => { const c = Math.cos(a), s = Math.sin(a); return Math.abs(c) >= Math.abs(s) * 0.85 ? (c > 0 ? 2 : 3) : (s > 0 ? 0 : 1); };
function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
  const t = clamp(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1);
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}
function pushOut(f, r, o) {
  const cx = clamp(f.x, o.x, o.x + o.w), cy = clamp(f.y, o.y, o.y + o.h);
  const dx = f.x - cx, dy = f.y - cy, d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return false;
  if (d2 > 1e-6) { const d = Math.sqrt(d2); f.x = cx + dx / d * r; f.y = cy + dy / d * r; }
  else {
    const l = f.x - o.x, rr = o.x + o.w - f.x, t = f.y - o.y, b = o.y + o.h - f.y, m = Math.min(l, rr, t, b);
    if (m === l) f.x = o.x - r; else if (m === rr) f.x = o.x + o.w + r; else if (m === t) f.y = o.y - r; else f.y = o.y + o.h + r;
  }
  return true;
}
const discCache = new Map();
function discCanvas(r, color, phase) {
  r = Math.max(1, Math.round(r));
  const key = r + color + phase;
  let c = discCache.get(key);
  if (!c) { const m = makeCanvas(r * 2 + 1, r * 2 + 1); pixDisc(m[1], r, r, r, color, phase); c = m[0]; if (discCache.size > 400) discCache.clear(); discCache.set(key, c); }
  return c;
}
/* 만화 의성어 */
const ONO = {
  plain: ['퍽!', '팍!', '빡!'], fire: ['화륵!', '활활!', '지글!'], ice: ['쨍!', '쩍!', '꽁꽁!'], electric: ['지지직!', '빠직!', '찌릿!'],
  water: ['철퍽!', '촤악!', '첨벙!'], earth: ['쿵!', '콰직!', '우지끈!'], poison: ['뿌직!', '꾸륵!', '부글!'], holy: ['번쩍!', '샤라랑!'],
  arcane: ['뿅!', '샤샥!', '반짝!'], wind: ['휘익!', '슈웅!'], sound: ['빠밤!', '뿌우!', '둥!'], cute: ['뿅!', '꺄!', '말랑!'],
  sleep: ['쿨쿨!', '드르렁!'], metal: ['깡!', '챙!', '팅!'], nature: ['파사삭!', '뿌직!'], tech: ['삐빅!', '지잉!', '띠링!'],
  candy: ['말랑!', '츄릅!', '뽀용!'], gold: ['짤랑!', '챠링!'], void: ['쮸욱!', '슈욱!'], shadow: ['스윽!', '푹!'],
};
const ONO_BIG = ['쾅!!', '콰광!!', '뻐억!!', '와장창!!'];
const KO_ANN = ['퇴장!', '집에 가라!', '삐뽀삐뽀~', '안녕히 가세요!', '꽥!', '깨꼬닥!', '로그아웃!', '수고하셨습니다!'];
const COMBO_ANN = { 3: '3연타!', 5: '5연타! 미쳤다!', 8: '8연타!! 멈춰!!', 12: '12연타!!! 신고합니다' };
/* 작은 입자 무늬 (3x3) */
const PAT = {
  heart: ['#.#', '###', '.#.'], z: ['###', '.#.', '###'], plus: ['.#.', '###', '.#.'], x: ['#.#', '.#.', '#.#'],
  note: ['.##', '.#.', '##.'], leaf: ['.##', '##.', '#..'], ghost: ['.#.', '###', '#.#'], coin: ['.#.', '#.#', '.#.'],
};
/* 글 그대로 "못 한다": 그 기술 효과는 아예 안 나온다 */
const NOFX_MAP = { jump: ['leap', 'hop'], dash: ['dash', 'phantom'], tele: ['blink', 'swap'], fly: ['st:fly'], heal: ['heal'], shield: ['st:shield', 'st:armor'], invis: ['st:invis'], buff: ['st:haste', 'st:power', 'st:shield', 'st:armor', 'st:regen', 'st:giant', 'st:fly', 'st:invis', 'st:reflect', 'st:invuln'], clone: ['clone'], summon: ['summon'] };
const NOFX_NOTE = { leap: '점프 못 함!', hop: '점프 못 함!', dash: '돌진 못 함!', phantom: '돌진 못 함!', blink: '순간이동 못 함!', swap: '순간이동 못 함!', heal: '회복 못 함!', clone: '분신 못 함!', summon: '소환 못 함!' };
/* "내 공격에 나도 맞는다": 손을 떠난 것만 */
const SELF_KINDS = new Set(['shot', 'blast', 'drop', 'spike', 'pillar', 'zone', 'mine', 'tornado', 'storm', 'roll', 'surge', 'crack', 'bubble']);
/** 총알 속도 부작용: 느리게 날아가되 날아가는 거리는 그대로 */
function speedScale(e, k) {
  if (k === 1 || typeof e.speed !== 'number') return e;
  const o = Object.assign({}, e);
  o.speed = Math.max(20, o.speed * k);
  if (typeof o.life === 'number') o.life = Math.min(6, o.life / k);
  return o;
}
/** 공격 크기 부작용: 크기·반지름만 */
function sizeScale(e, k) {
  if (k === 1) return e;
  const o = Object.assign({}, e);
  for (const q of ['r', 'w']) if (typeof o[q] === 'number') o[q] = Math.max(2, o[q] * k);
  if (typeof o.size === 'number') o.size = o.t === 'shot' ? Math.max(1, Math.min(4, Math.round(o.size * k))) : Math.max(4, o.size * k);
  if (o.t === 'shot' && k < 1 && o.size <= 1) o.tinyK = k;
  return o;
}
/** 사거리 줄이기 부작용: 기술 효과의 거리 값만 줄인다 */
function rangeScale(e, k) {
  const o = Object.assign({}, e);
  if (o.t === 'pattern') { o.size *= k; return o; }
  for (const q of ['range', 'len', 'dist', 'step', 'off']) if (typeof o[q] === 'number') o[q] *= k;
  if (o.t === 'shot' && typeof o.life === 'number') o.life *= k;
  return o;
}
/** 모양 폭격: 모양별 점 [x, y, 순서] (크기 1 기준, y는 아래쪽이 +) */
function patPts(shape, n, R) {
  const P = [], ring = (k, r, o, a0) => { for (let j = 0; j < k; j++) { const a = (a0 || 0) + j / k * Math.PI * 2; P.push([Math.cos(a) * r, Math.sin(a) * r, o]); } };
  switch (shape) {
    case 'ring': ring(n, 1, 0, -Math.PI / 2); break;
    case 'double': ring(Math.max(4, n - 2), 0.5, 0, 0); ring(n, 1, 1, 0.3); break;
    case 'star': P.push([0, 0, 0]); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j & 1 ? 0.42 : 1; P.push([Math.cos(a) * r, Math.sin(a) * r, 1 + (j & 1 ? 0 : 1)]); } break;
    case 'cross': P.push([0, 0, 0]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { P.push([dx * 0.5, dy * 0.5, 1]); P.push([dx, dy, 2]); } break;
    case 'x': P.push([0, 0, 0]); for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { P.push([dx * 0.38, dy * 0.38, 1]); P.push([dx * 0.75, dy * 0.75, 2]); } break;
    case 'grid': for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) P.push([a, b, 0]); break;
    case 'checker': for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) P.push([(a - 1.5) * 0.6, (b - 1.5) * 0.6, (a + b) & 1]); break;
    case 'heart': for (let j = 0; j < 12; j++) { const t = j / 12 * Math.PI * 2; P.push([16 * Math.pow(Math.sin(t), 3) / 16, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16, j < 6 ? j : 12 - j]); } break;
    case 'square': for (const [a, b] of [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]]) P.push([a, b, 0]); break;
    case 'triangle': { const V = [[1, 0], [-0.6, -0.85], [-0.6, 0.85]]; V.forEach((v, j) => { const w = V[(j + 1) % 3]; P.push([v[0], v[1], 0]); P.push([(v[0] + w[0]) / 2, (v[1] + w[1]) / 2, 1]); }); break; }
    case 'spiral': for (let j = 0; j < Math.max(8, n + 4); j++) { const a = j * 0.85, r = 0.2 + j / (n + 4) * 0.9; P.push([Math.cos(a) * r, Math.sin(a) * r, j]); } break;
    case 'line': for (let j = 0; j < n; j++) P.push([0.15 + j / Math.max(1, n - 1) * 0.85, 0, j]); break;
    case 'zigzag': for (let j = 0; j < n; j++) P.push([0.12 + j / Math.max(1, n - 1) * 0.88, j & 1 ? 0.22 : -0.22, j]); break;
    case 'arrow': P.push([1, 0, 0]); for (let j = 1; j <= 3; j++) { P.push([1 - j * 0.22, j * 0.17, j]); P.push([1 - j * 0.22, -j * 0.17, j]); } P.push([0.55, 0, 1]); P.push([0.2, 0, 2]); break;
    case 'random': for (let j = 0; j < n; j++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()); P.push([Math.cos(a) * r, Math.sin(a) * r, j]); } break;
    case 'flower': P.push([0, 0, 0]); ring(6, 0.55, 1, 0); ring(6, 1, 2, Math.PI / 6); break;
    case 'smile': P.push([-0.42, -0.45, 0]); P.push([0.42, -0.45, 0]); for (let j = 0; j < 7; j++) { const a = Math.PI * (0.15 + j / 6 * 0.7); P.push([Math.cos(a) * 0.75, Math.sin(a) * 0.7 + 0.05, 1 + Math.abs(j - 3)]); } break;
    case 'wave': for (let c = 0; c < 5; c++) for (let r = -1; r <= 1; r++) P.push([-1 + c * 0.5, r * 0.6, c]); break;
    case 'kk': for (const sx of [-0.55, 0.55]) { const o = sx > 0 ? 3 : 0; for (const [a, b, q] of [[-0.45, -0.8, 0], [-0.1, -0.8, 0], [0.25, -0.8, 0], [0.25, -0.25, 1], [0.2, 0.3, 2], [0.05, 0.85, 3], [-0.4, -0.05, 1], [-0.05, -0.05, 1]]) P.push([sx + a * 0.95, b, o + q]); } break;
    case 'hex': P.push([0, 0, 0]); ring(6, 1, 0, Math.PI / 6); break;
  }
  return P;
}
/* 시각 스타일별 색 */
function vfxPal(style, c) {
  switch (style) {
    case 'fire': return ['#fff3a0', '#ffb02e', c, '#ff4d1f'];
    case 'ice': return ['#ffffff', '#cff4ff', c, '#7fd0ff'];
    case 'electric': return ['#ffffff', '#fff7a0', c, '#9fe8ff'];
    case 'shadow': return ['#c8a8ff', c, '#3a2a5a', '#1a1026'];
    case 'water': return ['#e8faff', '#7fd8ff', c, '#2f8fd8'];
    case 'earth': return ['#e0c890', c, '#7a5a3a', '#4a3424'];
    case 'poison': return ['#e8ff9a', '#b6f24a', c, '#4a8a2a'];
    case 'holy': return ['#ffffff', '#fff7c2', c, '#ffd23f'];
    case 'arcane': return ['#ffffff', '#ffb0f0', c, '#8a5cff'];
    case 'void': return ['#c8a8ff', '#5a2a9a', c, '#0b0820'];
    case 'candy': return ['#ff8ad0', '#7fd8ff', '#ffe14a', '#8aff9a'];
    case 'gold': return ['#fff7c2', '#ffd23f', c, '#c8962a'];
    default: return ['#ffffff', light(c, 0.5), c, dark(c, 0.3)];
  }
}

class Battle {
  constructor(o) {
    this.scv = o.canvas; this.sg = this.scv.getContext('2d');
    const wm = makeCanvas(W * RS, H * RS); this.wcv = wm[0]; this.g = wm[1];
    this.map = buildMap(o.mapIdx || 0);
    this.mapIdx = (o.mapIdx || 0) % MAPS.length;
    this.night = this.mapIdx !== 2;
    this.net = o.net || null;
    this.decider = o.decider !== false;
    this.onEnd = o.onEnd || (() => {});
    const sf0 = o.sfx || (() => {});
    this.sfx = (...a) => { if (!this.mute) sf0(...a); };
    this.focus = o.focus || [];
    this.t = 0; this.objs = []; this.parts = []; this.pops = []; this.decals = []; this.feed = []; this.amb = [];
    this.shake = 0; this.flash = null; this.banner = null; this.hs = 0; this.bursts = []; this.punch = 0; this.slowT = 0; this.lastN = -1; this.firstKO = false;
    this.over = false; this.endT = 0; this.count = 2.7; this.stormOn = false; this.stormR = null;
    this.practice = !!o.practice;
    if (this.practice) this.count = 0;
    this.cam = null;
    this.fighters = o.roster.map((e, i) => this.mkFighter(e, i));
    for (const f of this.fighters) for (const x of f.foeStat) for (const g of this.fighters) {
      if (g === f) continue;
      const p = x.pct / 100;
      if (x.stat === 'hp') { g.maxHp = Math.max(1, Math.round(g.maxHp * (1 + p))); g.hp = g.maxHp; g.hpShow = g.maxHp; }
      else if (x.stat in g.base) g.base[x.stat] = Math.max(x.stat === 'taken' ? 0.05 : 0.2, g.base[x.stat] * (1 + p));
    }
    { const me1 = this.fighters.find((f) => o.focus && o.focus[0] === f.idx); this.mute = !!(me1 && me1.mute); }
    // 연습장: 허수아비를 내 캐릭터 가까이에 세운다 (벽·구덩이를 피해서)
    if (this.practice) {
      const me0 = this.fighters.find((f) => !f.dummy), B = this.map.B;
      const free = (x, y) => x > B + 14 && x < W - B - 14 && y > B + 18 && y < H - B - 10 && !this.map.obs.some((ob) => x > ob.x - 10 && x < ob.x + ob.w + 10 && y > ob.y - 10 && y < ob.y + ob.h + 10);
      let k = 0;
      if (me0) for (const d of this.fighters.filter((f) => f.dummy)) {
        const base = Math.atan2(H / 2 - me0.y, W / 2 - me0.x) + (k ? 0.7 : -0.5);
        for (let tries = 0; tries < 40; tries++) {
          const an = base + (tries % 2 ? 1 : -1) * Math.ceil(tries / 2) * 0.25, dd = 58 + (k ? 18 : 0) + (tries % 3) * 6;
          const x = me0.x + Math.cos(an) * dd, y = me0.y + Math.sin(an) * dd * 0.8;
          if (free(x, y) && this.fighters.every((o) => o === d || Math.hypot(o.x - x, o.y - y) > 26)) { d.x = d.px = x; d.y = d.py = y; break; }
        }
        k++;
      }
    }
    // 내 화면만 이상해지는 부작용 (혼자 보는 화면일 때만)
    const me = this.focus.length === 1 ? this.fighters[this.focus[0]] : null;
    this.vision = me && me.vision ? me.vision : null;
    this.visionOf = me;
    for (const f of this.fighters) {
      if (f.spec.passive && f.spec.passive.k === 'aura') {
        this.objs.push({ uid: f.idx + '.aura', owner: f.idx, kind: 'zone', x: f.x, y: f.y, r: 18, life: 1e9, dmg: 1, mul: 1, st: null, follow: f, heal: 0, rehit: 0.5, hit: new Map(), age: 0, delay: 0, color: f.spec.look.accent, cl: light(f.spec.look.accent, 0.5), vfx: 'plain', aura: true });
      }
    }
  }

  mkFighter(e, i) {
    const sp = e.spec, base = { hp: 1, speed: 1, size: 1, dmg: 1, taken: 1, kb: 1 };
    const uses = { basic: Infinity, s1: Infinity, s2: Infinity, ult: Infinity };
    // 부작용 효과 하나하나를 {fx, say} 목록으로 (more 포함)
    const dbs = [];
    for (const d of sp.drawbacks) for (const x of [d.fx].concat(d.more || [])) if (x) dbs.push({ fx: x, say: d.say, text: d.text });
    const lock = {}, rev = {}, hfoe = {}, rnds = {}, shout = {}, back = {}, mulS = { basic: 1, s1: 1, s2: 1, ult: 1 };
    let moveMode = null, vision = null;
    const pests = [], acts = [], aimS = {}, rangeS = { basic: 1, s1: 1, s2: 1, ult: 1 }, ramps = [], flees = [], weaks = [];
    const pSpd = { basic: 1, s1: 1, s2: 1, ult: 1 }, pSz = { basic: 1, s1: 1, s2: 1, ult: 1 }, foeStat = [], nofxT = new Set(), blockSt = new Set(), X = { hpSet: 0, dmgFix: null, selfHit: false, lure: false, exposed: false, mute: false, noHeal: false, dtrail: null };
    dbs.forEach((d, i) => {
      const x = d.fx, each = (fn) => SLOTS.forEach((s) => { if (onMatch(x.on, s)) fn(s); });
      switch (x.t) {
        case 'stat': if (x.stat in base) { const p = x.pct / 100; base[x.stat] *= x.stat === 'size' || x.stat === 'taken' || x.stat === 'kb' ? 1 + p : 1 - p; } break;
        case 'hpset': X.hpSet = x.hp; break;
        case 'foestat': foeStat.push(x); break;
        case 'dmgfix': if (x.on === 'skills') X.dmgFix = x.n; else { if (!X.dmgFix || typeof X.dmgFix !== 'object') X.dmgFix = {}; each((s) => { X.dmgFix[s] = x.n; }); } break;
        case 'pspeed': each((s) => { pSpd[s] *= 1 + x.pct / 100; }); break;
        case 'psize': each((s) => { pSz[s] *= 1 + x.pct / 100; }); break;
        case 'nofx': for (const q of NOFX_MAP[x.what] || []) { if (q.startsWith('st:')) blockSt.add(q.slice(3)); else nofxT.add(q); } if (x.what === 'heal') X.noHeal = true; break;
        case 'selfhit': X.selfHit = true; break;
        case 'lure': X.lure = true; break;
        case 'exposed': X.exposed = true; blockSt.add('invis'); break;
        case 'mute': X.mute = true; break;
        case 'dtrail': X.dtrail = x; break;
        case 'uses': each((s) => { uses[s] = Math.min(uses[s], x.n); if (x.n === 0) lock[s] = d; }); break;
        case 'lock': each((s) => { lock[s] = d; }); break;
        case 'reverse': each((s) => { rev[s] = Math.max(rev[s] || 0, x.chance); }); break;
        case 'healfoe': each((s) => { hfoe[s] = Math.max(hfoe[s] || 0, x.chance); }); break;
        case 'random': each((s) => { rnds[s] = Math.max(rnds[s] || 0, x.chance); }); break;
        case 'mul': each((s) => { mulS[s] *= 1 - x.pct / 100; }); break;
        case 'shout': each((s) => { shout[s] = x.text; }); break;
        case 'backfire': each((s) => { back[s] = (back[s] || 0) + x.pct; }); break;
        case 'move': moveMode = x.mode; break;
        case 'vision': vision = x.mode; break;
        case 'pest': if (!x.on) pests.push({ i, t: x.every * (0.4 + Math.random() * 0.4) }); break;
        case 'act': acts.push({ i, t: x.every ? x.every * (0.5 + Math.random() * 0.4) : 0, cd: 0, prev: false }); break;
        case 'aim': each((s) => { aimS[s] = { deg: x.deg, chance: x.chance }; }); break;
        case 'range': each((s) => { rangeS[s] *= 1 - x.pct / 100; }); break;
        case 'ramp': ramps.push(x); break;
        case 'flee': flees.push(x); break;
        case 'weakto': weaks.push(x); break;
      }
    });
    base.hp = Math.max(base.hp, 0.2); base.speed = Math.max(base.speed, 0.2); base.dmg = Math.max(base.dmg, 0.05);
    base.size = clamp(base.size, 0.45, 3); base.taken = Math.min(base.taken, 4);
    const s0 = this.map.spawns[i % this.map.spawns.length];
    const maxHp = X.hpSet ? X.hpSet : Math.round(sp.stats.hp * base.hp * HP_SCALE);
    const m = makeCanvas(SW, SH);
    const ucd = sp.moves.ult.cd * 0.4;
    const aim = Math.atan2(H / 2 - s0[1], W / 2 - s0[0]);
    return {
      idx: i, name: e.name, spec: sp, owned: !!e.owned, ctrl: e.ctrl || null, bot: !!e.bot, color: e.dummy ? '#c9a66b' : FIGHTER_COLORS[i % 4], dummy: !!e.dummy, wander: !!e.wander, tried: {}, hitT: -9,
      x: s0[0], y: s0[1], px: s0[0], py: s0[1], vx: 0, vy: 0, aim, mdir: aim, dir: ang2dir(aim),
      maxHp, hp: maxHp, hpShow: maxHp, alive: true, koT: 0, cd: this.practice ? { basic: 0, s1: 0, s2: 0, ult: 0 } : { basic: 0, s1: 0.5, s2: 0.8, ult: ucd }, cdMax: { basic: 1, s1: 0.5, s2: 0.8, ult: Math.max(ucd, 1) }, uses, base,
      st: {}, stPow: {}, castT: 0, castC: null, hurtT: 0, flashT: 0, invT: 0, tenT: 0, wind: null, dash: null,
      stack: { size: 0, slow: 0, taken: 0, weak: 0 }, look: Object.assign({}, sp.look), pSpd, pSz, foeStat, nofxT, blockSt, trD: 0, trN: 0,
      hpSet: X.hpSet, dmgFix: X.dmgFix, selfHit: X.selfHit, lure: X.lure, exposed: X.exposed, mute: X.mute, noHeal: X.noHeal, dtrail: X.dtrail,
      tickT: dbs.map((d) => (d.fx.t === 'tick' ? d.fx.every * (0.6 + Math.random() * 0.4) : 0)),
      dbs, lock, rev, hfoe, rnds, shout, back, mulS, moveMode, vision, pests, morph: null,
      later: [], acts, aimS, rangeS, ramps, flees, weaks, nthC: {}, dLast: {}, stopT: 0, rampD: 1, rampS: 1, rampZ: 1, stillT: 0, moveT: 0, lastSkT: 0,
      say: null, sayCd: 0, popCd: 0, stats: { dealt: 0, taken: 0, ko: 0 }, revived: false, actN: 0,
      size: sp.stats.size * base.size, dotT: 0, pose: 'idle', warn: false, stepT: 0, seed: Math.random() * 10,
      spr: m[0], sg: m[1], net: null, ai: null, auraT: Math.random(), gone: false,
    };
  }

  emit(ev) { if (this.net) this.net.send(ev); }

  /* ---------- 한 프레임 ---------- */
  step(dt) {
    if (this.hs > 0) { this.hs -= dt; this.stepFx(dt * 0.15); return; }
    if (this.slowT > 0) { this.slowT -= dt; if (!this.net) dt *= 0.4; }
    this.punch = Math.max(0, this.punch - dt * 1.5);
    this.t += dt;
    if (this.count > -5) this.count -= dt;
    const cn = this.count > 1.8 ? 3 : this.count > 0.9 ? 2 : this.count > 0 ? 1 : 0;
    if (cn !== this.lastN && this.count > -0.5) {
      if (this.lastN === -1) for (const f of this.fighters) if (f.spec.lines && f.spec.lines.intro) { f.say = { text: f.spec.lines.intro, t: 2.4 }; if (this.focus[0] === f.idx) Voice.say(f.spec.lines.intro, f.seed / 10); }
      this.lastN = cn; this.sfx(cn ? 'count' : 'go');
    }
    const live = this.count <= 0 && !this.over;
    for (const f of this.fighters) {
      f.px = f.x; f.py = f.y;
      if (f.owned) {
        let inp = NOINP;
        if (f.dummy) { if (live && f.wander) inp = { mx: Math.cos(this.t * 0.7 + f.seed) * 0.55, my: Math.sin(this.t * 1.1 + f.seed) * 0.45, a: 0, b: 0, c: 0, u: 0 }; }
        else if (f.bot) { if (live && f.alive) inp = this.botThink(f, dt); }
        else if (f.ctrl) { const r = f.ctrl.read(); if (live && f.alive) inp = r; }
        this.stepFighter(f, inp, dt);
      } else this.stepRemote(f, dt);
      if (this.practice && f.alive && f.hp < f.maxHp && this.t - f.hitT > 1.6) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.7 * dt);
      this.stepLook(f, dt);
      if (f.dtrail && f.alive && live) this.stepTrail(f);
    }
    if (this.wx) { this.wx.t -= dt; if (this.wx.t <= 0) this.wx = null; }
    if (this.visT) { this.visT.t -= dt; if (this.visT.t <= 0) this.visT = null; }
    this.lureF = this.fighters.find((f) => f.lure && f.alive) || null;
    this.stepObjs(dt);
    this.stepFx(dt);
    this.stepAmbient(dt);
    // 좁혀 오는 폭풍
    if (live && !this.practice && this.t > STORM_AT) {
      if (!this.stormOn) { this.stormOn = true; this.banner = { text: '폭풍이 좁혀 온다', color: '#ff5ad0', t: 1.8, max: 1.8 }; this.sfx('storm'); if (typeof Music !== 'undefined') Music.setHype(1); }
      const p = clamp((this.t - STORM_AT) / STORM_LEN, 0, 1);
      this.stormR = lerp(300, 0, p * (2 - p));
      const dps = 4 + (this.t - STORM_AT) * 0.25;
      for (const f of this.fighters) {
        if (!f.alive) continue;
        const out = Math.hypot(f.x - W / 2, f.y - H / 2) > this.stormR;
        if (out) { if (f.owned) this.damage(f, dps * dt, -1); if (Math.random() < 0.3) this.addP('px', f.x + rnd(-4, 4), f.y - rnd(0, 10), rnd(-10, 10), -20, 0.4, '#ff5ad0', 1); }
      }
    }
    if (!this.over && this.decider && !this.practice && this.count <= 0) {
      const alive = this.fighters.filter((f) => f.alive);
      if (alive.length <= 1 && this.fighters.length > 1) {
        this.endT += dt;
        if (this.endT > 1.6) { this.over = true; this.onEnd(alive.length ? alive[0].idx : -1); }
      } else this.endT = 0;
    }
  }
  stepFx(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts[i] = this.parts[this.parts.length - 1]; this.parts.pop(); continue; }
      const dr = 1 - p.drag * dt;
      p.vx *= dr; p.vy *= dr;
      if (p.pull) { const dx = p.pull.x - p.x, dy = p.pull.y - p.y; p.vx += dx * 8 * dt; p.vy += dy * 8 * dt; }
      if (p.sway) p.vx += Math.sin((p.life + p.sway) * 6) * 30 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.g) { p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.35; p.vx *= 0.6; p.vy *= 0.6; } }
    }
    for (let i = this.pops.length - 1; i >= 0; i--) { const p = this.pops[i]; p.t += dt; p.y -= p.vy * dt; p.vy *= 1 - 2 * dt; if (p.t >= p.life) this.pops.splice(i, 1); }
    for (let i = this.decals.length - 1; i >= 0; i--) { this.decals[i].life -= dt; if (this.decals[i].life <= 0) this.decals.splice(i, 1); }
    for (let i = this.feed.length - 1; i >= 0; i--) { this.feed[i].t -= dt; if (this.feed[i].t <= 0) this.feed.splice(i, 1); }
    for (let i = this.bursts.length - 1; i >= 0; i--) { this.bursts[i].t += dt; if (this.bursts[i].t >= this.bursts[i].life) this.bursts.splice(i, 1); }
    for (const f of this.fighters) if (f.comboT > 0) { f.comboT -= dt; if (f.comboT <= 0) f.comboN = 0; }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 16);
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
  }
  stepAmbient(dt) {
    const m = this.map, a = m.ambient;
    const rate = a === 'firefly' ? 0.6 : a === 'ember' ? 6 : a === 'petal' ? 2.5 : 1.2;
    if (Math.random() < rate * dt && this.amb.length < 60) {
      if (a === 'ember' && m.lava.length) {
        const o = pick(m.lava);
        this.amb.push({ x: o.x + Math.random() * o.w, y: o.y + Math.random() * o.h, vx: rnd(-6, 6), vy: rnd(-26, -14), life: 1.6, max: 1.6, c: pick(['#ffd23f', '#ff9a2f', '#ff5a1f']) });
      } else if (a === 'firefly') {
        this.amb.push({ x: rnd(20, W - 20), y: rnd(20, H - 20), vx: rnd(-8, 8), vy: rnd(-8, 8), life: 6, max: 6, c: pick(['#e8ff7a', '#b8ff5f']), ff: Math.random() * 6 });
      } else if (a === 'petal') {
        this.amb.push({ x: rnd(-20, W), y: -4, vx: rnd(14, 24), vy: rnd(10, 18), life: 18, max: 18, c: pick(['#ffb0d0', '#ffd0e0', '#ffffff']), sw: Math.random() * 6 });
      } else {
        this.amb.push({ x: rnd(0, W), y: rnd(0, H), vx: rnd(4, 10), vy: rnd(-2, 2), life: 5, max: 5, c: '#6a66a8' });
      }
    }
    for (let i = this.amb.length - 1; i >= 0; i--) {
      const p = this.amb[i];
      p.life -= dt;
      if (p.life <= 0 || p.y > H + 4 || p.x > W + 20) { this.amb.splice(i, 1); continue; }
      if (p.ff != null) { p.vx += rnd(-30, 30) * dt; p.vy += rnd(-30, 30) * dt; p.vx = clamp(p.vx, -12, 12); p.vy = clamp(p.vy, -12, 12); }
      if (p.sw != null) p.vx += Math.sin(p.life * 2 + p.sw) * 8 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }

  cond(f, c, nd, n) {
    const sp = Math.hypot(f.vx, f.vy), hr = f.hp / f.maxHp, B = this.map.B, bt = this.t - 3;
    const foes = () => this.fighters.filter((o) => o !== f && o.alive);
    switch (c) {
      case 'always': return true;
      case 'moving': return n ? f.moveT >= n : sp > 20;
      case 'still': return n ? f.stillT >= n : sp < 8;
      case 'lowhp': return hr <= (n || 40) / 100;
      case 'highhp': return hr >= (n || 70) / 100;
      case 'fullhp': return hr >= 0.99;
      case 'near': return nd < (n ? n * 10 : 50);
      case 'far': return nd > 130;
      case 'edge': return f.x < B + 34 || f.x > W - B - 34 || f.y < B + 30 || f.y > H - B - 26;
      case 'center': return Math.hypot(f.x - W / 2, (f.y - H / 2) * 1.2) < 70;
      case 'crowd': return foes().filter((o) => dist2(o.x, o.y, f.x, f.y) < 120 * 120).length >= (n || 2);
      case 'alone': return !foes().some((o) => dist2(o.x, o.y, f.x, f.y) < 170 * 170);
      case 'foelow': case 'foehigh': { const e = this.nearest(f); if (!e) return false; const r = e.hp / e.maxHp; return c === 'foelow' ? r <= (n || 40) / 100 : r >= 0.7; }
      case 'debuffed': for (const k in f.st) if (DEBUFFS.includes(k)) return true; return false;
      case 'buffed': for (const k in f.st) if (BUFFS.includes(k)) return true; return false;
      case 'idle': return this.t - (f.lastSkT || 0) >= (n || 3);
      case 'busy': return f.cd.s1 > 0 && f.cd.s2 > 0 && f.cd.ult > 0;
      case 'ready': return f.cd.ult <= 0 && f.uses.ult > 0 && !f.lock.ult;
      case 'early': return bt < (n || 10);
      case 'late': return bt > (n || 30);
      case 'onzone': return this.objs.some((o) => o.kind === 'zone' && !o.dead && !(o.delay > 0) && dist2(o.x, o.y, f.x, f.y) <= o.r * o.r);
      case 'dashing': return !!f.dash || f.castT > 0.2;
      case 'casting': return f.castT > 0 || this.t - (f.lastSkT || -9) < 0.35;
      case 'lead': case 'behind': { const L = foes(); if (!L.length) return false; return c === 'lead' ? L.every((o) => o.hp / o.maxHp < hr) : L.every((o) => o.hp / o.maxHp > hr); }
    }
    return false;
  }
  /** 글 그대로 행동: 어떤 일이 생겼을 때 (이 기기에서 움직이는 선수만) */
  dEv(f, ev) {
    if (!f || !f.owned || !f.alive || !f.acts.length || this.count > 0 || this.over) return;
    for (const A of f.acts) {
      const x = f.dbs[A.i].fx;
      if (x.ev !== ev) continue;
      if (x.nth) { A.k = (A.k || 0) + 1; if (A.k % x.nth) continue; }
      if (A.cd > 0) continue;
      A.cd = ev === 'heal' || ev === 'buff' ? 1.5 : 0.7;
      this.doAct(f, A.i);
    }
  }
  nearest(f, forAI) {
    let best = null, bd = 1e9;
    for (const o of this.fighters) {
      if (o === f || !o.alive) continue;
      const d = dist2(f.x, f.y, o.x, o.y);
      if (forAI && o.st.invis && d > 900) continue;
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  bodyY(f) { return f.y - 5 * f.size; }

  stepFighter(f, inp, dt) {
    for (const s of SLOTS) if (f.cd[s] > 0) f.cd[s] = Math.max(0, f.cd[s] - dt);
    for (const k in f.st) { f.st[k] -= dt; if (f.st[k] <= 0) { delete f.st[k]; delete f.stPow[k]; } }
    f.castT -= dt; f.hurtT -= dt; f.flashT -= dt; f.invT -= dt; f.tenT -= dt; f.sayCd -= dt; f.popCd -= dt;
    if (!f.alive) { f.koT += dt; f.vx *= 0.9; f.vy *= 0.9; this.moveCollide(f, dt); return; }
    const sp = f.spec, st = f.st, live = this.count <= 0 && !this.over;
    const ne = this.nearest(f), nd = ne ? Math.hypot(ne.x - f.x, ne.y - f.y) : 999;
    let warn = false, flee = null;
    { const fs = Math.hypot(f.vx, f.vy); if (fs < 8) { f.stillT += dt; f.moveT = 0; } else if (fs > 20) { f.moveT += dt; f.stillT = 0; } }
    for (let i = 0; i < f.dbs.length; i++) {
      const x = f.dbs[i].fx;
      if (x.t === 'when') { if (this.cond(f, x.if, nd, x.n)) st[x.st] = Math.max(st[x.st] || 0, 0.2); }
      else if (x.t === 'drain') { if (live && (x.if === 'always' || this.cond(f, x.if, nd, x.n)) && f.hp > 1) f.hp = Math.max(1, f.hp - x.amt * dt); }
      else if (x.t === 'flee' && live && ne) { if (x.if === 'always' || this.cond(f, x.if, nd, x.n)) flee = ne; }
      else if (x.t === 'tick' && live) {
        f.tickT[i] -= dt;
        if (f.tickT[i] < 1.1) warn = true;
        if (f.tickT[i] <= 0) { f.tickT[i] = x.every; this.addStatus(f, x.st.k, x.st.d, 0, false); this.trig(f, f.dbs[i]); }
      }
    }
    // 글 그대로 행동: 몇 초마다, 조건이 되는 순간
    if (live) for (const A of f.acts) {
      const x = f.dbs[A.i].fx;
      A.cd -= dt;
      if (x.every) { A.t -= dt * (x.accel ? 1 + clamp((this.t - 3) / 30, 0, 2) : 1); if (A.t < 1) warn = true; if (A.t <= 0) { A.t = x.every; this.doAct(f, A.i); } }
      else if (x.if) { const c = this.cond(f, x.if, nd, x.n); const once = x.die || x.later || x.if === 'late' || x.if === 'early'; if (c && A.cd <= 0 && (!A.prev || !once)) { this.doAct(f, A.i); A.cd = 4; } A.prev = c; }
    }
    f.stopT -= dt;
    if (live) for (let k = f.later.length - 1; k >= 0; k--) { const L = f.later[k]; L.t -= dt; if (L.t <= 0) { f.later.splice(k, 1); this.doAct(f, L.i, true); } }
    // 시간·체력에 따라 점점
    f.rampD = 1; f.rampS = 1; f.rampZ = 1;
    for (const x of f.ramps) {
      const k = x.by === 'hp' ? 1 - f.hp / f.maxHp : clamp((this.t - 3) / 40, 0, 1), v = x.pct / 100 * k;
      if (x.stat === 'dmg') f.rampD *= 1 - v; else if (x.stat === 'speed') f.rampS *= 1 - v; else f.rampZ *= 1 + v;
    }
    f.warn = warn;
    f.dotT += dt;
    if (f.dotT >= 0.5) {
      f.dotT -= 0.5;
      let d = 0;
      if (st.burn) d += 1.5;
      if (st.poison) d += 1;
      if (d && live) { this.damage(f, d, -1); this.pop(f.x, f.y - 12 * f.size, '-' + d, st.burn ? ST_COLOR.burn : ST_COLOR.poison, 0.7, 0.8); }
      let hl = 0;
      if (st.regen) hl += (f.stPow.regen || 4) * 0.5;
      if (sp.passive && sp.passive.k === 'regen') hl += 0.5;
      if (hl && f.hp < f.maxHp && f.alive) f.hp = Math.min(f.maxHp, f.hp + hl);
    }
    if (!f.alive) return;
    const stunned = !!(st.stun || st.freeze || st.dance || st.sleep || st.air);
    f.size = sp.stats.size * f.base.size * (1 + f.stack.size) * f.rampZ * (st.giant ? 1.5 : 1) * (st.tiny ? 0.65 : 1);
    const spd = sp.stats.speed * f.base.speed * (st.haste ? 1.45 : 1) * (st.slow ? 0.55 : 1) * (1 - f.stack.slow) * (st.giant ? 0.85 : 1) * (st.tiny ? 1.15 : 1)
      * (st.heavy ? 0.75 : 1) * (st.fly ? 1.15 : 1) * (sp.passive && sp.passive.k === 'swift' ? 1.15 : 1) * (st.morph ? 0.75 : 1)
      * (f.moveMode === 'hop' ? (Math.sin(this.t * 9 + f.seed) > 0 ? 1.8 : 0.1) : 1) * f.rampS;
    const canMove = !stunned && !st.root && !f.wind && f.hurtT <= 0 && !f.dash && f.stopT <= 0;
    let mx = 0, my = 0;
    if (canMove) {
      mx = inp.mx || 0; my = inp.my || 0;
      if (st.confuse) { mx = -mx; my = -my; }
      const mm = f.moveMode;
      if (mm === 'reverse') { mx = -mx; my = -my; }
      if (mm === 'frozen') { mx = 0; my = 0; }
      if (mm === 'nostop' && Math.hypot(mx, my) < 0.15) { mx = Math.cos(f.mdir); my = Math.sin(f.mdir); }
      if (mm === 'left') mx = Math.min(mx, 0); else if (mm === 'right') mx = Math.max(mx, 0); else if (mm === 'side') my = 0; else if (mm === 'vertical') mx = 0;
      if (flee) { const a = Math.atan2(f.y - flee.y, f.x - flee.x); mx = Math.cos(a); my = Math.sin(a); }
      if (mm === 'drunk' && Math.hypot(mx, my) > 0.15) { const a = Math.atan2(my, mx) + Math.sin(this.t * 2.3 + f.seed) * 1.1; const l = Math.hypot(mx, my); mx = Math.cos(a) * l; my = Math.sin(a) * l; }
    }
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    if (ml > 0.15) f.mdir = Math.atan2(my, mx);
    if (f.leap) {
      const L = f.leap; L.t += dt;
      const p = Math.min(1, L.t / L.dur);
      f.x = lerp(L.x0, L.x1, p); f.y = lerp(L.y0, L.y1, p); f.vx = 0; f.vy = 0;
      if (Math.random() < 0.5) this.addP('after', f.x, f.y - Math.sin(p * Math.PI) * L.h, 0, 0, 0.15, f.color, 1, { dir: f.dir, f });
      if (p >= 1) f.leap = null;
    } else if (f.dash) {
      f.dash.t -= dt; f.vx = f.dash.vx; f.vy = f.dash.vy;
      if (f.dash.t <= 0) { f.vx = f.dash.vx * 0.2; f.vy = f.dash.vy * 0.2; f.dash = null; }
    } else {
      const acc = (st.slip || f.moveMode === 'slide' ? 240 : 1900) * dt * (f.hurtT > 0 ? 0.3 : 1);
      f.vx = approach(f.vx, mx * RUN * spd, acc);
      f.vy = approach(f.vy, my * RUN * spd, acc);
    }
    const bx = f.x + f.vx * dt, by = f.y + f.vy * dt, bsp = Math.hypot(f.vx, f.vy);
    this.moveCollide(f, dt);
    if (live && bsp > 45 && Math.hypot(f.x - bx, f.y - by) > bsp * dt * 0.5) for (const A of f.acts) { if (f.dbs[A.i].fx.bump && A.cd <= 0) { this.doAct(f, A.i); A.cd = 1.5; } }
    for (const o of this.objs) if (o.kind === 'barrier' && o.owner !== f.idx && !o.dead) this.barrierPush(f, o);
    const tg = this.nearest(f, true);
    f.aim = tg ? Math.atan2(this.bodyY(tg) - this.bodyY(f), tg.x - f.x) : f.mdir;
    f.dir = ang2dir(f.castT > 0 || f.wind || ml < 0.15 ? f.aim : f.mdir);
    if (ml >= 0.15 && f.castT <= 0) { if (f.moveMode === 'backward') f.dir = [1, 0, 3, 2][f.dir]; else if (f.moveMode === 'spin') f.dir = [0, 2, 1, 3][Math.floor(this.t * 10) % 4]; }
    if (st.dance) f.dir = [0, 2, 1, 3][Math.floor(this.t * 8) % 4];
    // 쫓아오는 귀찮은 것
    if (live) for (const p of f.pests) {
      p.t -= dt;
      if (p.t <= 0) {
        const x = f.dbs[p.i].fx; p.t = x.every;
        const an = Math.random() * 6.283, sx = clamp(f.x + Math.cos(an) * 90, 12, W - 12), sy = clamp(f.y + Math.sin(an) * 70, 16, H - 12);
        const ev = ['q', f.idx, p.i, 'p' + f.idx + '.' + (++f.actN), Math.round(sx), Math.round(sy)];
        this.emit(ev); this.spawnPest(ev);
      }
    }
    if (f.wind) {
      if (stunned) f.wind = null;
      else { f.wind.t -= dt; if (f.wind.t <= 0) { const s = f.wind.slot, as = f.wind.as; f.wind = null; this.fire(f, s, as); } }
    }
    if (!stunned && live) for (const [s, key] of KEYSLOT) if (inp[key] && f.cd[s] <= 0 && this.tryMove(f, s)) break;
  }

  barrierPush(f, o) {
    const r = 3 * f.size + 2;
    const d = segDist(f.x, f.y, o.ax, o.ay, o.bx, o.by);
    if (d >= r) return;
    const side = (f.x - o.x) * o.nx + (f.y - o.y) * o.ny < 0 ? -1 : 1;
    f.x += o.nx * side * (r - d); f.y += o.ny * side * (r - d);
    if (f.dash) f.dash = null;
  }
  clampArena(p, r) {
    const B = this.map.B;
    if (p.x < B + r) { p.x = B + r; if (p.vx < 0) p.vx = 0; }
    if (p.x > W - B - r) { p.x = W - B - r; if (p.vx > 0) p.vx = 0; }
    if (p.y < B + r + 5) { p.y = B + r + 5; if (p.vy < 0) p.vy = 0; }
    if (p.y > H - B - r) { p.y = H - B - r; if (p.vy > 0) p.vy = 0; }
  }
  solid(p, r, fly) {
    for (let pass = 0; pass < 2; pass++) for (const o of this.map.obs) { if (o.k === 'pit' && fly) continue; pushOut(p, r, o); }
    this.clampArena(p, r);
  }
  moveCollide(f, dt) { f.x += f.vx * dt; f.y += f.vy * dt; this.solid(f, 3 * f.size, !!f.st.fly); }
  freePoint() {
    const B = this.map.B;
    for (let i = 0; i < 60; i++) {
      const x = rnd(B + 14, W - B - 14), y = rnd(B + 18, H - B - 10);
      if (!this.map.obs.some((o) => x > o.x - 8 && x < o.x + o.w + 8 && y > o.y - 8 && y < o.y + o.h + 8) && (!this.stormR || Math.hypot(x - W / 2, y - H / 2) < this.stormR - 10)) return [x, y];
    }
    return [W / 2, H / 2 + 50];
  }

  stepRemote(f, dt) {
    for (const k in f.st) { if (f.st[k] !== true) { f.st[k] -= dt; if (f.st[k] <= 0) delete f.st[k]; } }
    f.flashT -= dt; f.sayCd -= dt; f.castT -= dt;
    if (!f.alive) f.koT += dt;
    const n = f.net;
    if (!n) return;
    const dx = n.x - f.x, dy = n.y - f.y;
    if (dx * dx + dy * dy > 80 * 80) { f.x = n.x; f.y = n.y; }
    else { const k = 1 - Math.exp(-dt * 20); f.x += dx * k; f.y += dy * k; }
  }
  setRemote(idx, a) {
    const f = this.fighters[idx];
    if (!f || f.owned || !Array.isArray(a)) return;
    f.net = { x: +a[0] || 0, y: +a[1] || 0 };
    f.dir = clamp(a[2] | 0, 0, 3);
    f.hp = clamp(+a[3] || 0, 0, f.maxHp);
    f.pose = POSES[a[4] | 0] || 'idle';
    const mask = a[5] | 0;
    f.st = {};
    for (let i = 0; i < ST_ALL.length; i++) if (mask & (1 << i)) f.st[ST_ALL[i]] = true;
    f.size = clamp((+a[6] || 100) / 100, 0.4, 3);
    const fl = a[7] | 0;
    if (!(fl & 1) && f.alive) this.onKO(idx, -1);
    f.warn = !!(fl & 8);
  }
  snapshot(f) {
    let mask = 0;
    for (let i = 0; i < ST_ALL.length; i++) if (f.st[ST_ALL[i]]) mask |= 1 << i;
    return [Math.round(f.x), Math.round(f.y), f.dir, Math.round(f.hp * 10) / 10, Math.max(0, POSES.indexOf(f.pose)), mask, Math.round(f.size * 100), (f.alive ? 1 : 0) | (f.warn ? 8 : 0)];
  }

  stepLook(f, dt) {
    if (f.owned) f.pose = !f.alive ? 'ko' : f.wind ? 'wind' : f.hurtT > 0 || f.st.stun ? 'hurt' : f.castT > 0 ? 'cast' : Math.hypot(f.vx, f.vy) > 12 ? 'run' : 'idle';
    f.hpShow = f.hpShow > f.hp ? Math.max(f.hp, f.hpShow - f.maxHp * 0.6 * dt) : f.hp;
    if (f.say) { f.say.t -= dt; if (f.say.t <= 0) f.say = null; }
    if (!f.alive) return;
    // 발걸음 먼지
    const moved = Math.hypot(f.x - f.px, f.y - f.py);
    if (moved > 0.6) {
      f.stepT -= dt;
      if (f.stepT <= 0) { f.stepT = 0.16; this.addP('smoke', f.x + rnd(-2, 2), f.y, rnd(-6, 6), rnd(-4, 2), 0.35, this.map.dust, 1.5); }
    }
    f.afterT = (f.afterT || 0) - dt;
    if ((f.dash || (f.st.haste && moved > 0.6)) && f.afterT <= 0) { f.afterT = f.dash ? 0.035 : 0.08; this.addP('after', f.x, f.y, 0, 0, f.dash ? 0.16 : 0.2, f.color, 1, { dir: f.dir, f }); }
    if (f.owned && !f.bot && f.cd.ult <= 0 && !f.lock.ult && Math.random() < 0.25) { const an = Math.random() * 6.283; this.addP('px', f.x + Math.cos(an) * 8, f.y + Math.sin(an) * 3, 0, -18, 0.5, pick([GOLD, '#ffffff', f.spec.moves.ult.color]), 1); }
    f.auraT -= dt;
    if (f.auraT <= 0) {
      f.auraT = 0.12 + Math.random() * 0.1;
      const a = f.spec.look.aura, x = f.x + rnd(-4, 4) * f.size, y = f.y - rnd(1, 10) * f.size;
      const A = { flame: ['fire', '#ff8a2f'], frost: ['ice', '#bff0ff'], spark: ['electric', '#ffe14a'], shadow: ['shadow', '#5a3f8c'], leaf: ['nature', '#7ad63a'], star: ['holy', '#fff3a0'], bubble: ['water', '#9fe8ff'], wind: ['wind', '#eafff8'], holy: ['holy', '#fff7c2'], toxic: ['poison', '#b6f24a'] }[a];
      if (A && !f.st.invis) this.vfxTrail(A[0], A[1], x, y, 0, -10, 0.6);
      if (f.st.burn) this.vfxTrail('fire', '#ff7a2f', x, y, 0, -10, 1);
      if (f.st.poison) this.vfxTrail('poison', '#9be04a', x, y, 0, -10, 1);
      if (f.st.regen) this.addP('pat', x, y, 0, -16, 0.5, '#7dff8a', 1, { pat: 'plus' });
      if (f.st.freeze) this.addP('px', x, y, 0, 0, 0.3, '#ffffff', 1);
      if (f.st.confuse) this.addP('pat', f.x + rnd(-5, 5), f.y - 13 * f.size, 0, -6, 0.4, ST_COLOR.confuse, 1, { pat: 'x' });
    }
  }

  /* ---------- 능력 쓰기 ---------- */
  tryMove(f, slot) {
    if (!f.alive || f.wind || f.dash || f.leap || f.st.stun || f.st.freeze || f.st.air || f.hurtT > 0) return false;
    if (f.cd[slot] > 0) return false;
    f.tried[slot] = 1;
    if (f.lock[slot]) {
      f.cd[slot] = f.cdMax[slot] = 0.9;
      this.note(f, '봉인!', '#c5f24a', true);
      for (let i = 0; i < 5; i++) this.addP('smoke', f.x + rnd(-3, 3), this.bodyY(f), rnd(-14, 14), rnd(-20, 0), 0.6, '#8a84b0', 1.5);
      this.addP('pat', f.x, f.y - 15, 0, -8, 0.7, '#c5f24a', 1, { pat: 'x' });
      if (f.lock[slot].say && f.sayCd <= 0) this.trig(f, f.lock[slot]);
      this.sfx('lock');
      return false;
    }
    if (f.st.silence || f.st.morph) { this.note(f, f.st.morph ? '변신 중!' : '침묵!', f.st.morph ? ST_COLOR.morph : ST_COLOR.silence); return false; }
    let as = slot;
    if (f.rnds[slot] && Math.random() * 100 < f.rnds[slot]) {
      const opts = SLOTS.filter((q) => q !== slot && !f.lock[q]);
      if (opts.length) { as = pick(opts); this.note(f, '엉뚱한 기술!', '#c5f24a', true); }
    }
    if (f.uses[slot] <= 0) { this.note(f, '횟수 끝', '#a79fce'); return false; }
    let wt = 0, wd = null;
    for (const d of f.dbs) if (d.fx.t === 'windup' && onMatch(d.fx.on, slot)) { wt += d.fx.time; wd = d; }
    if (wt > 0) { f.wind = { slot, as, t: wt, total: wt }; this.trig(f, wd); return true; }
    this.fire(f, slot, as);
    return true;
  }

  fire(f, slot, as) {
    as = as || slot;
    const sp = f.spec, mv = sp.moves[as];
    let cdm = 1;
    for (const d of f.dbs) if (d.fx.t === 'cd' && onMatch(d.fx.on, slot)) cdm *= 1 + d.fx.pct / 100;
    f.cd[slot] = f.cdMax[slot] = mv.cd * cdm;
    for (const d of f.dbs) if (d.fx.t === 'cd' && d.fx.min && onMatch(d.fx.on, slot)) f.cd[slot] = f.cdMax[slot] = Math.max(f.cd[slot], d.fx.min);
    if (f.uses[slot] !== Infinity) f.uses[slot]--;
    f.castT = slot === 'basic' ? 0.18 : 0.32;
    for (const d of f.dbs) {
      const x = d.fx;
      if (x.t !== 'fail' || !onMatch(x.on, slot) || Math.random() >= x.chance / 100) continue;
      this.trig(f, d);
      this.note(f, '실패!', '#c5f24a', true);
      this.sfx('fail');
      this.addP('pat', f.x, f.y - 14, 0, -10, 0.6, '#c5f24a', 1, { pat: 'x' });
      for (let i = 0; i < 6; i++) this.addP('smoke', f.x + rnd(-3, 3), this.bodyY(f), rnd(-20, 20), rnd(-20, 5), 0.5, '#8a84b0', 2);
      if (x.back === 'selfhit') { this.sfx('selfhit'); this.damage(f, 12, -1); this.pop(f.x, f.y - 12 * f.size, '-12', '#c5f24a', 1); f.flashT = 0.12; this.vfxImpact(mv.vfx, mv.color, f.x, this.bodyY(f), 1); }
      if (x.back === 'stun') this.addStatus(f, 'stun', 1, 0, false);
      return;
    }
    let tgt = this.nearest(f, true);
    if (tgt) f.aim = Math.atan2(this.bodyY(tgt) - this.bodyY(f), tgt.x - f.x);
    if (f.rev[slot] && Math.random() * 100 < f.rev[slot]) { f.aim += Math.PI; tgt = null; this.note(f, '반대로!', '#c5f24a', true); }
    else if (f.aimS[slot] && Math.random() * 100 < f.aimS[slot].chance) { f.aim += (Math.random() * 2 - 1) * f.aimS[slot].deg * Math.PI / 180; tgt = null; this.dEv(f, 'miss'); this.note(f, '빗나감!', '#c5f24a', true); }
    f.dir = ang2dir(f.aim);
    const ca = Math.cos(f.aim), sa = Math.sin(f.aim);
    const crit = sp.passive && sp.passive.k === 'crit' && Math.random() < 0.2;
    const mul = f.base.dmg * (1 - (f.stack.weak || 0)) * f.rampD * f.mulS[as] * (f.st.power ? 1.5 : 1) * (f.st.weak ? 0.6 : 1) * (f.st.giant ? 1.25 : 1) * (sp.passive && sp.passive.k === 'rage' && f.hp / f.maxHp <= 0.4 ? 1.35 : 1) * (crit ? 1.8 : 1);
    let sw = null;
    for (const e of mv.fx) {
      if (f.nofxT.has(e.t)) continue;
      if (e.t === 'blink') {
        if (f.st.heavy) { this.note(f, '무거움', ST_COLOR.heavy); continue; }
        this.doBlink(f, e, tgt, mv);
      } else if (e.t === 'swap' && tgt) {
        sw = [Math.round(f.x), Math.round(f.y)];
        this.vfxImpact(mv.vfx, mv.color, f.x, this.bodyY(f), 1);
        f.x = tgt.x; f.y = tgt.y; f.vx = 0; f.vy = 0;
        if (tgt.owned) { tgt.x = sw[0]; tgt.y = sw[1]; tgt.vx = 0; tgt.vy = 0; }
      }
    }
    if (f.shout[slot]) { const ev = ['t', f.idx, f.shout[slot] === '@name' ? cut(mv.name + '!!', 16) : f.shout[slot], 2]; this.emit(ev); this.onEvent(ev); this.dEv(f, 'talk'); }
    if (f.back[slot]) {
      const amt = r1(Math.max(1, mv.fx.reduce((t, e) => t + fxExpected(e), 0) * mul * f.back[slot] / 100));
      if (f.hp > 0) { this.damage(f, amt, -1); this.pop(f.x, f.y - 12 * f.size, '-' + amt, '#c5f24a', 0.9); f.flashT = 0.12; this.vfxImpact(mv.vfx, mv.color, f.x, this.bodyY(f), 0.6); }
    }
    const act = ['a', f.idx, SLOT_IDX[as], Math.round(f.x), Math.round(f.y), Math.round(f.aim * 180 / Math.PI), ++f.actN, Math.round(mul * 100), crit ? 1 : 0,
      tgt ? Math.round(tgt.x) : -1, tgt ? Math.round(tgt.y) : -1, tgt ? tgt.idx : -1, (Math.random() * 1e9) | 0, sw ? sw[0] : -1, sw ? sw[1] : -1];
    for (const e of mv.fx) {
      if (f.nofxT.has(e.t)) { this.note(f, NOFX_NOTE[e.t] || '안 돼!', '#c5f24a', true); continue; }
      if (e.t === 'leap') {
        if (f.st.heavy) { this.note(f, '무거움', ST_COLOR.heavy); continue; }
        const [lx, ly] = this.leapTarget(f.x, f.y, tgt ? tgt.x : f.x + ca * 70, tgt ? tgt.y : f.y + sa * 70, f.aim, e.dist * f.rangeS[as]);
        const dur = 0.32 + Math.hypot(lx - f.x, ly - f.y) / 500;
        f.leap = { x0: f.x, y0: f.y, x1: lx, y1: ly, t: 0, dur, h: 22 + Math.hypot(lx - f.x, ly - f.y) * 0.2 };
        f.dash = null; f.invT = Math.max(f.invT, dur + 0.05);
      } else if (e.t === 'phantom') {
        if (f.st.heavy) { this.note(f, '무거움', ST_COLOR.heavy); continue; }
        const t = e.dist * f.rangeS[as] / DASH_V;
        f.dash = { vx: ca * DASH_V, vy: sa * DASH_V, t };
        f.invT = Math.max(f.invT, t + 0.08);
      } else if (e.t === 'dash') {
        if (f.st.heavy) { this.note(f, '무거움', ST_COLOR.heavy); continue; }
        const t = e.dist * f.rangeS[as] / DASH_V;
        f.dash = { vx: ca * DASH_V, vy: sa * DASH_V, t };
        if (e.invuln) f.invT = Math.max(f.invT, t + 0.08);
      } else if (e.t === 'buff') this.addStatus(f, e.k, e.d, e.pow || 0, false);
      else if (e.t === 'heal') this.heal(f, e.amt);
    }
    this.emit(act);
    this.spawnAct(act);
    for (let di = 0; di < f.dbs.length; di++) {
      const d = f.dbs[di], x = d.fx;
      if (!x.on || !onMatch(x.on, slot)) continue;
      if (x.nth > 1) { f.nthC[di] = (f.nthC[di] || 0) + 1; if (f.nthC[di] % x.nth) continue; }
      switch (x.t) {
        case 'selfdmg': {
          const amt = x.pct ? r1(f.hp * x.pct / 100) : x.amt;
          if (f.hp > 1 && amt > 0) { this.damage(f, Math.min(amt, f.hp - 1), -1); this.pop(f.x, f.y - 12 * f.size, '-' + amt, '#c5f24a', 0.9); }
          this.trig(f, d); break;
        }
        case 'act': this.doAct(f, di); break;
        case 'pest':
          if (this.t - (f.dLast[di] || -9) > 2.5) {
            f.dLast[di] = this.t;
            const an = Math.random() * 6.283, sx = clamp(f.x + Math.cos(an) * 80, 12, W - 12), sy = clamp(f.y + Math.sin(an) * 60, 16, H - 12);
            const ev = ['q', f.idx, di, 'p' + f.idx + '.' + (++f.actN), Math.round(sx), Math.round(sy)];
            this.emit(ev); this.spawnPest(ev);
          }
          break;
        case 'selfst': this.addStatus(f, x.st.k, x.st.d, 0, false); this.trig(f, d); break;
        case 'recoil': f.vx = -ca * x.force * 34; f.vy = -sa * x.force * 34; f.hurtT = Math.max(f.hurtT, 0.15); f.dash = null; this.trig(f, d); break;
        case 'tele': {
          this.vfxImpact('arcane', '#c5f24a', f.x, this.bodyY(f), 0.8);
          const p = this.freePoint();
          f.x = p[0]; f.y = p[1]; f.vx = 0; f.vy = 0; f.dash = null;
          this.vfxImpact('arcane', '#c5f24a', f.x, this.bodyY(f), 0.8);
          this.trig(f, d); break;
        }
        case 'stack': { const cap = x.stat === 'slow' ? 0.5 : 0.8; f.stack[x.stat] = clamp(f.stack[x.stat] + x.pct / 100, -0.5, cap); this.trig(f, d); break; }
        case 'aidfoe':
          { const t2 = this.nearest(f, false); if (t2) { const ev = ['b', t2.idx, ST_ALL.indexOf(x.k), x.d, x.k === 'shield' ? 20 : 4]; this.emit(ev); this.onEvent(ev); } }
          this.trig(f, d); break;
      }
    }
  }

  /** 도약 착지점: 목표 쪽으로 최대 dist, 벽·구덩이·바깥이면 앞으로 당긴다 (모든 기기에서 같은 결과) */
  leapTarget(x, y, tx, ty, ang, dist) {
    const B = this.map.B;
    let dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
    if (d < 1) { dx = Math.cos(ang); dy = Math.sin(ang); d = 1; }
    const L = Math.min(dist, Math.max(20, d));
    for (let k = 0; k < 8; k++) {
      const s2 = L * (1 - k * 0.12), px = clamp(x + dx / d * s2, B + 8, W - B - 8), py = clamp(y + dy / d * s2, B + 10, H - B - 6);
      if (!this.map.obs.some((ob) => px > ob.x - 4 && px < ob.x + ob.w + 4 && py > ob.y - 4 && py < ob.y + ob.h + 4)) return [Math.round(px), Math.round(py)];
    }
    return [x, y];
  }
  /** 조준 방향 가까이에서 가장 가까운 적 (front: 앞쪽만) */
  pickTarget(c, x, y, ang, range, front) {
    let best = null, bd = range;
    for (const v of this.fighters) {
      if (!v.alive || v.gone || v.idx === c.idx) continue;
      const dx = v.x - x, dy = this.bodyY(v) - y, d = Math.hypot(dx, dy);
      if (front) { let da = Math.atan2(dy, dx) - ang; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > 1.3) continue; }
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }
  /** 채찍 곡선 위의 점들 */
  whipPts(o) {
    const p = clamp(1 - o.life / o.max, 0, 1), ca = Math.cos(o.ang), sa = Math.sin(o.ang);
    const L = o.len * Math.min(1, 0.35 + p * 1.6), bend = o.len * 0.45 * o.dirS * (1 - p) * (1 - p);
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8, along = L * t, side = bend * Math.sin(t * Math.PI) * (0.5 + t);
      pts.push([o.x + ca * along - sa * side, o.y + sa * along + ca * side * 0.8]);
    }
    return pts;
  }
  doBlink(f, e, tgt, mv) {
    this.vfxImpact(mv.vfx, mv.color, f.x, this.bodyY(f), 0.7);
    for (let i = 0; i < 3; i++) this.addP('after', f.x, f.y, 0, 0, 0.25 + i * 0.05, mv.color, 1, { dir: f.dir, f });
    const ca = Math.cos(f.aim), sa = Math.sin(f.aim);
    let nx = f.x, ny = f.y;
    switch (e.to) {
      case 'front': nx += ca * e.dist; ny += sa * e.dist; break;
      case 'back': nx -= ca * e.dist; ny -= sa * e.dist; break;
      case 'side': { const s = pick([-1, 1]); nx += -sa * s * e.dist; ny += ca * s * e.dist; break; }
      case 'behind':
        if (tgt) { const dx = tgt.x - f.x, dy = tgt.y - f.y, l = Math.hypot(dx, dy) || 1; nx = tgt.x + dx / l * 12; ny = tgt.y + dy / l * 12; }
        else { nx += ca * e.dist; ny += sa * e.dist; }
        break;
      case 'random': { const p = this.freePoint(); nx = p[0]; ny = p[1]; break; }
    }
    f.x = nx; f.y = ny; f.vx = 0; f.vy = 0; f.dash = null;
    this.solid(f, 3 * f.size, !!f.st.fly);
    this.vfxImpact(mv.vfx, mv.color, f.x, this.bodyY(f), 0.7);
  }
  /** 부작용에 쓴 행동을 정말로 한다: 말풍선, 멈춤(또는 상태이상), 그 행동의 연출 */
  doAct(f, i, now) {
    const d = f.dbs[i], x = d && d.fx;
    if (!x || !f.alive || (!now && x.chance < 100 && Math.random() * 100 >= x.chance)) return;
    if (x.later && !now) { f.later.push({ t: x.later, i }); this.note(f, x.later + '초 뒤에…', '#c5f24a', true); return; }
    const ev = ['t', f.idx, x.text || '앗!', 3, x.pose || 'sweat', x.pose === 'change' ? pick(OUTFITS) + '|' + pick(['#ff4d6d', '#3fb8ff', '#ffcf3a', '#5be37a', '#ff9ad0', '#b48aff', '#ffffff', '#2a2a3a']) : x.word || ''];
    this.emit(ev); this.onEvent(ev);
    if (x.st) this.addStatus(f, x.st.k, x.st.d, 0, false);
    else if (x.d > 0) { f.stopT = Math.max(f.stopT, x.d); f.vx *= 0.2; f.vy *= 0.2; f.wind = null; }
    if (x.hp && f.hp > 1) { this.damage(f, Math.min(x.hp, f.hp - 1), -1); this.pop(f.x, f.y - 12 * f.size, '-' + x.hp, '#c5f24a', 0.9); }
    if (x.heal) this.heal(f, x.heal);
    if (x.buff) this.addStatus(f, x.buff.k, x.buff.d, x.buff.k === 'shield' ? 20 : 4, false);
    const foes = (r) => this.fighters.filter((g) => g !== f && g.alive && Math.hypot(g.x - f.x, g.y - f.y) < r);
    if (x.fst) for (const g of foes(x.boom ? 60 : 80)) { const e2 = ['x', g.idx, ST_ALL.indexOf(x.fst.k), x.fst.d]; this.emit(e2); this.onEvent(e2); }
    if (x.fdmg || x.boom) for (const g of foes(x.boom ? 60 : 80)) { const e2 = ['r', g.idx, x.fdmg || 20, 2]; this.emit(e2); this.onEvent(e2); }
    if (x.fheal) { const g = this.nearest(f, false); if (g) { const e2 = ['g', g.idx, x.fheal]; this.emit(e2); this.onEvent(e2); } }
    if (x.tele) {
      this.vfxImpact('arcane', '#c5f24a', f.x, this.bodyY(f), 0.8);
      const B = this.map.B, ne = this.nearest(f, false);
      let p = this.freePoint();
      if (x.tele === 'foe' && ne) { const an = Math.random() * 6.28; p = [clamp(ne.x + Math.cos(an) * 16, B + 8, W - B - 8), clamp(ne.y + Math.sin(an) * 12, B + 10, H - B - 6)]; }
      else if (x.tele === 'corner') p = [Math.random() < 0.5 ? B + 14 : W - B - 14, Math.random() < 0.5 ? B + 16 : H - B - 12];
      else if (x.tele === 'center') p = [W / 2, H / 2];
      f.x = p[0]; f.y = p[1]; this.solid(f, 3 * f.size, !!f.st.fly); f.vx = 0; f.vy = 0; f.dash = null;
      this.vfxImpact('arcane', '#c5f24a', f.x, this.bodyY(f), 0.8);
    }
    if (x.vis && this.visionOf === f) this.visT = { k: x.vis, t: x.visd || 2 };
    if (x.fpull || x.fpush) for (const g of foes(x.fpull ? 170 : 90)) { const e2 = ['m', g.idx, Math.round(f.x), Math.round(f.y), x.fpull ? 1 : -1]; this.emit(e2); this.onEvent(e2); }
    if (x.die) { f.invT = 0; delete f.st.invuln; delete f.st.shield; this.damage(f, f.hp + 9999, -1); }
    if (x.push) { const a = Math.random() * 6.283; f.vx = Math.cos(a) * 320; f.vy = Math.sin(a) * 320; f.hurtT = Math.max(f.hurtT, 0.3); f.dash = null; }
    if (x.fire) { const s = ['basic', 's1', 's2'].find((q) => f.cd[q] <= 0 && !f.lock[q] && f.uses[q] > 0); if (s) this.fire(f, s); }
  }
  /** 행동 연출 (모든 기기에서) */
  actFx(f, pose, word) {
    const x = f.x, y = this.bodyY(f), up = f.y - 14 * f.size;
    const P = (k, px, py, vx, vy, life, c, s2, ex) => this.addP(k, px, py, vx, vy, life, c, s2, ex);
    const snd = (k, pitch, len) => this.sfx('move', 'plain', { mv: { name: 'act' + pose, sfx: { kind: k, pitch, len } }, slot: 's1' });
    switch (pose) {
      case 'gas': for (let k = 0; k < 10; k++) P('smoke', x + rnd(-4, 4), f.y - 2, rnd(-30, 30), rnd(-18, -2), 1, k & 1 ? '#9adf5a' : '#c8f07a', 2.6); snd('fart', 1, 1); break;
      case 'sneeze': for (let k = 0; k < 14; k++) { const a = f.aim + rnd(-0.5, 0.5); P('px', x + Math.cos(a) * 4, y, Math.cos(a) * rnd(60, 130), Math.sin(a) * rnd(60, 130), 0.5, k & 1 ? '#ffffff' : '#c8f0ff', 1); } snd('whoosh', 1.4, 0.6); break;
      case 'hiccup': P('pat', x, up, 0, -30, 0.6, '#ffffff', 1, { pat: 'plus' }); f.hurtT = Math.max(f.hurtT, 0.12); snd('boing', 1.6, 0.4); break;
      case 'poop': for (let k = 0; k < 6; k++) P('px', x + rnd(-3, 3), f.y, rnd(-20, 20), rnd(-30, -5), 0.7, k & 1 ? '#7a4a1a' : '#a8682a', 2, { g: 160, vz: rnd(30, 60) }); this.decal(x, f.y + 1, 4, '#6a3a12'); snd('fart', 0.6, 1.3); break;
      case 'cry': for (let k = 0; k < 10; k++) { const sd = k & 1 ? 1 : -1; P('px', x + sd * 3, y - 3, sd * rnd(30, 60), rnd(-10, 10), 0.7, '#7fd8ff', 1, { g: 140, vz: rnd(40, 70) }); } snd('squeak', 0.8, 1.2); break;
      case 'laugh': for (let k = 0; k < 5; k++) P('pat', x + rnd(-8, 8), up, rnd(-20, 20), rnd(-35, -15), 0.8, '#ffe14a', 1, { pat: 'plus' }); snd('chirp', 1.3, 0.8); break;
      case 'sing': for (let k = 0; k < 4; k++) P('pat', x + rnd(-6, 6), up, rnd(-15, 15), rnd(-30, -15), 1, ['#ff9ad0', '#7fd8ff', '#ffe14a'][k % 3], 1, { pat: 'note' }); snd('kazoo', 1.1, 0.9); break;
      case 'shout': P('ring', x, y, 0, 0, 0.35, '#ffffff', 1, { r0: 4, r1: 22 }); this.shake = Math.max(this.shake, 1.5); snd('roar', 1.2, 0.7); break;
      case 'rain': case 'night': case 'snow': case 'thunder': case 'hot': case 'cold': case 'wind': { const d = clamp(+word || 3, 1, 6); this.wx = { k: pose, t: d, max: d }; if (pose === 'thunder') { this.flash = { c: '#ffffff', t: 0.2, max: 0.2, a: 0.8 }; snd('roar', 0.5, 1); } else snd('whoosh', pose === 'rain' ? 0.6 : 0.9, 1.2); break; }
      case 'change': { const [of, bc] = String(word || '').split('|'); f.look = Object.assign({}, f.look, { outfit: OUTFITS.includes(of) ? of : f.look.outfit, body: bc || f.look.body }); for (let k = 0; k < 14; k++) P('smoke', x + rnd(-6, 6), y + rnd(-6, 6), rnd(-20, 20), rnd(-20, 0), 0.6, '#ffffff', 2); snd('whoosh', 1.4, 0.5); break; }
      case 'breath': { const vs = VFX.includes(word) ? word : 'fire', c = { fire: '#ff8a3a', ice: '#9fe8ff', electric: '#fff36a', poison: '#9adf5a', water: '#5ab8ff', wind: '#e8f4ff', earth: '#b48a5a', sound: '#ff9ad0' }[vs] || '#ffffff'; for (let k = 0; k < 26; k++) { const a = f.aim + rnd(-0.5, 0.5), sp = rnd(80, 200); P('px', x + Math.cos(f.aim) * 5, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.5, k & 1 ? c : '#ffffff', 2); } this.vfxImpact(vs, c, x + Math.cos(f.aim) * 30, y + Math.sin(f.aim) * 30, 1.4); snd('roar', 0.8, 0.8); break; }
      case 'boom': this.vfxImpact('fire', '#ff8a3a', x, y, 3); P('ring', x, y, 0, 0, 0.5, '#ffcf3a', 1, { r0: 4, r1: 60 }); this.shake = Math.max(this.shake, 8); this.flash = { c: '#ffffff', t: 0.15, max: 0.15, a: 0.6 }; this.sfx('boom', 'fire'); break;
      case 'yawn': case 'zzz': for (let k = 0; k < 3; k++) P('pat', x + 4 + k * 3, up - k * 4, 10, -18, 1.1, '#bcd0ff', 1, { pat: 'z' }); snd('whistle', 0.6, 1); break;
      case 'coin': for (let k = 0; k < 8; k++) P('pat', x + rnd(-4, 4), y, rnd(-50, 50), rnd(-20, 10), 0.8, '#ffcf3a', 1, { pat: 'coin', g: 160, vz: rnd(40, 80) }); snd('chime', 1.2, 0.6); break;
      case 'heart': for (let k = 0; k < 5; k++) P('pat', x + rnd(-6, 6), up, rnd(-15, 15), rnd(-30, -10), 1, '#ff6a9a', 1, { pat: 'heart' }); snd('chime', 1.5, 0.7); break;
      case 'bow': case 'snap': P('flash', x, y, 0, 0, 0.12, '#ffffff', 4); snd(pose === 'snap' ? 'glitch' : 'bell', 1.2, 0.5); break;
      case 'eat': for (let k = 0; k < 5; k++) P('px', x + rnd(-3, 3), y, rnd(-25, 25), rnd(-25, 0), 0.5, '#e8c070', 1); snd('gulp', 1, 0.8); break;
      case 'star': case 'fall': for (let k = 0; k < 4; k++) P('pat', x + rnd(-6, 6), up + rnd(-2, 2), rnd(-25, 25), rnd(-25, -5), 0.8, '#ffe14a', 1, { pat: 'plus' }); if (pose === 'fall') for (let k = 0; k < 6; k++) P('smoke', x + rnd(-4, 4), f.y, rnd(-30, 30), rnd(-8, 0), 0.6, '#c8b8a0', 2); snd(pose === 'fall' ? 'thud' : 'boing', 1, 0.6); break;
      case 'word': {
        const pic = pixFor(word);
        if (pic) for (let k = 0; k < 3; k++) P('gly', x + rnd(-8, 8), up, rnd(-30, 30), rnd(-40, -20), 1, pic.color, 1, { rows: pic.pix });
        snd('bloop', 1, 0.7); break;
      }
      default: for (let k = 0; k < 4; k++) P('px', x + rnd(-5, 5), up, rnd(-25, 25), rnd(-30, -10), 0.6, '#9fe8ff', 1); snd('squeak', 1, 0.5);
    }
  }
  trig(f, d) {
    if (d && d.say && f.sayCd <= 0) { f.sayCd = 2.2; const ev = ['t', f.idx, d.say, 1]; this.emit(ev); this.onEvent(ev); }
  }
  note(f, text, color, force) {
    if (f.popCd > 0 && !force) return;
    f.popCd = 0.6;
    const ev = ['p', f.idx, text, color];
    this.emit(ev); this.onEvent(ev);
  }

  /* ---------- 능력 → 화면 속 물체 (모든 기기에서 똑같이 실행) ---------- */
  spawnAct(a) {
    const c = this.fighters[a[1]];
    if (!c) return;
    const slot = SLOTS[a[2]] || 'basic', mv = c.spec.moves[slot];
    const x = a[3], y = a[4], ang = (+a[5] || 0) * Math.PI / 180, n = a[6], mul = clamp((+a[7] || 100) / 100, 0.1, 4), crit = !!a[8];
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const hasT = a[11] >= 0, tx = hasT ? a[9] : x + ca * 70, ty = hasT ? a[10] : y + sa * 70;
    const sz = c.size, cy = y - 4 * sz;
    const rows = rowsOf(mv.shape, mv.pix), style = mv.vfx || 'plain';
    if (!c.owned) { c.castT = slot === 'basic' ? 0.18 : 0.32; c.dir = ang2dir(ang); }
    c.castC = mv.color;
    // 시전 연출
    if (slot === 'ult') {
      this.banner = { text: mv.name, color: mv.color, t: 1.05, max: 1.05, who: c.name, spec: c.spec, rows };
      this.flash = { c: '#0b0820', t: 0.25, max: 0.25, a: 0.5 };
      this.objs.push({ uid: 'cc' + a[1] + '.' + n, owner: c.idx, kind: 'circle', follow: c, r: 14, life: 0.7, max: 0.7, color: mv.color, cl: light(mv.color, 0.5), age: 0, delay: 0, hit: new Map() });
      this.shake = Math.max(this.shake, 3); this.punch = 1; this.slowT = 0.3;
      this.sfx('move', style, { mv, slot });
      if (mv.say && !this.mute) Voice.say(mv.say, c.seed / 10, true);
    } else if (slot !== 'basic') {
      this.objs.push({ uid: 'cc' + a[1] + '.' + n, owner: c.idx, kind: 'circle', follow: c, r: 8, life: 0.45, max: 0.45, color: mv.color, cl: light(mv.color, 0.5), age: 0, delay: 0, hit: new Map() });
      this.pop(x, y - 15 * sz, mv.name, mv.color, 0.8, 0.95);
      this.sfx('move', style, { mv, slot });
    } else this.sfx('move', style, { mv, slot });
    // 조준선과 손끝 섬광
    this.addP('aim', x + ca * 4, cy + sa * 4, ca, sa, slot === 'basic' ? 0.1 : 0.16, mv.color, slot === 'basic' ? 18 : 30);
    this.addP('flash', x + ca * 5, cy + sa * 5, 0, 0, 0.06, '#ffffff', slot === 'basic' ? 1.5 : 2.5);
    this.lightFlash(x + ca * 5, cy + sa * 5, slot === 'basic' ? 14 : 24, mv.color);
    for (let i = 0; i < (slot === 'basic' ? 6 : slot === 'ult' ? 24 : 12); i++) this.vfxTrail(style, mv.color, x + ca * 5, cy + sa * 5, ca * 40, sa * 40, 1);
    if (mv.say && slot !== 'basic' && (slot !== 's1' || (a[12] & 1))) { c.say = { text: mv.say, t: 1.3, cast: true }; if (c.owned) this.dEv(c, 'talk'); }
    if (crit) this.pop(x, y - 20 * sz, '치명타!', '#ffcf3a', 0.8, 1.1);
    c.lastSkT = this.t;
    if (crit && c.owned) this.dEv(c, 'crit');
    if (c.owned && mv.fx.some((q) => q.t === 'dash' || q.t === 'blink' || q.t === 'leap' || q.t === 'phantom')) this.dEv(c, 'dash');
    if (slot !== 'basic') for (const g of this.fighters) if (g !== c && g.owned && g.alive && dist2(g.x, g.y, x, y) < 150 * 150) this.dEv(g, 'foeskill');
    const base = (i, j, kind, e) => ({ uid: `${c.idx}.${n}.${i}.${j}`, owner: c.idx, kind, dmg: e.dmg || 0, mul, st: e.st || null, kb: e.kb || 0, color: mv.color, cl: light(mv.color, 0.6), dk: dark(mv.color, 0.35), rows, gm: mv, ph: Math.random() * 3, custom: !!mv.pix, vfx: style, hit: new Map(), age: 0, rehit: 0, delay: 0, slotN: slot, tr: [] });
    const B = this.map.B;
    const cx = (v) => clamp(v, B + 2, W - B - 2), cyy = (v) => clamp(v, B + 4, H - B - 2);
    const rk = c.rangeS ? c.rangeS[slot] : 1;
    mv.fx.forEach((e0, i) => {
      if (c.nofxT.has(e0.t) || (e0.t === 'buff' && c.blockSt.has(e0.k))) return;
      const ps = c.pSpd[slot], pz = c.pSz[slot];
      const e = sizeScale(speedScale(rk < 1 ? rangeScale(e0, rk) : e0, ps), pz);
      const R = mulberry((a[12] | 0) + i * 977);
      switch (e.t) {
        case 'dash':
          if (e.dmg > 0) { const o = base(i, 0, 'hb', e); Object.assign(o, { follow: c, life: e.dist / DASH_V + 0.06, around: 8 * sz }); this.objs.push(o); }
          this.sfx('dash', style);
          break;
        case 'shot':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'shot', e);
            Object.assign(o, { r: e.size, homing: e.homing, pierce: e.pierce, bounce: e.bounce, life: e.ret ? e.life * 1.7 : e.life, boom: e.boom, ret: e.ret, retT: e.life * 0.45, split: e.split, spin: e.ret });
            if (e.path && e.path !== 'line' || e.end && e.end !== 'none' || e.drop || e.aura || e.grow || e.pull) {
              Object.assign(o, { path: e.path || 'line', turn: e.turn || 1, end: e.end || 'none', n2: e.n2 || 6, drop: e.drop || 0, dropk: e.dropk || 'blast', aura: e.aura || 0, grow: e.grow || 0, pull: e.pull || 0, v0: e.speed, sd: R(), hph: j & 1 ? Math.PI : 0, r0: e.size, dropT: 0, dropN: 0 });
              if (e.aura > 0) { o.pierce = true; o.rehit = 0.4; }
              if (e.path === 'curve') { o.turn = (j & 1 ? -1 : 1) * (e.turn || 1); const th = 0.55 + 0.3 * (j >> 1), L = clamp(Math.hypot(tx - x, ty - cy), 50, 220); o.cw = o.turn * 2 * e.speed * Math.sin(th) / L; o.cT = 2 * th / Math.abs(o.cw); o.cA = -o.turn * th; }
              if (e.path === 'orbit') { o.orbA = j / e.n * Math.PI * 2; o.delay = 0; }
              if (e.path === 'spiral' && e.n > 1 && !e.spread) o.spA = j / e.n * Math.PI * 2;
            }
            if (e.from === 'sky') {
              Object.assign(o, { kind: 'drop', x: cx(tx + (R() - 0.5) * (16 + e.n * 9)), y: cyy(ty + (R() - 0.5) * (12 + e.n * 7)), delay: j * 0.08, fall: 0.42, r: Math.max(5, e.size * 2 + 3), life: 0.8 });
            } else if (e.from === 'ground') {
              const dd = 12 + j * 12;
              Object.assign(o, { kind: 'spike', x: cx(x + ca * dd), y: cyy(y + sa * dd), delay: j * 0.06, life: 0.34, r: 3 + e.size });
            } else if (e.from === 'around') {
              const an = (j / e.n) * Math.PI * 2 + ang;
              Object.assign(o, { x, y: cy, vx: Math.cos(an) * e.speed, vy: Math.sin(an) * e.speed });
            } else {
              const an = o.spA != null ? ang + o.spA : o.cA != null ? ang + o.cA : ang + (e.n > 1 ? ((j / (e.n - 1)) - 0.5) * e.spread * Math.PI / 180 : 0);
              Object.assign(o, { x: x + ca * 5, y: cy + sa * 5, vx: Math.cos(an) * e.speed, vy: Math.sin(an) * e.speed });
              if (e.n > 1 && e.spread === 0 && o.spA == null && o.cA == null && e.path !== 'orbit' && e.path !== 'helix') o.delay = j * 0.07;
            }
            this.objs.push(o);
          }
          break;
        case 'pattern': {
          const pts = patPts(e.shape, e.n, R), sz = e.size, hm = new Map();
          if (e.at === 'target' && !pts.some(([qx, qy]) => Math.abs(qx) < 0.12 && Math.abs(qy) < 0.12)) pts.push([0, 0, 0]);
          const turn = ['line', 'zigzag', 'arrow', 'wave', 'triangle'].includes(e.shape);
          const ox = e.at === 'self' ? x : e.at === 'front' ? x + ca * sz * 0.9 : tx, oy = e.at === 'self' ? y : e.at === 'front' ? y + sa * sz * 0.9 : ty;
          pts.forEach(([px0, py0, ord], j) => {
            let qx = px0 * sz, qy = py0 * sz;
            if (turn) { const q = qx * ca - qy * sa; qy = qx * sa + qy * ca; qx = q; }
            const wx = cx(ox + qx), wy = cyy(oy + qy * 0.8), d0 = (e.kind === 'blast' ? 0 : e.delay) + ord * e.step;
            const o = base(i, j, e.kind, e);
            if (e.kind === 'blast') Object.assign(o, { x: wx, y: wy, r: e.r, delay: ord * e.step, delay0: Math.max(0.2, e.delay), life: Math.max(0.2, e.delay) + 0.4, trig: false });
            else if (e.kind === 'pillar') Object.assign(o, { x: wx, y: wy, r: e.r, delay: d0, life: 0.55, max: 0.55, trig: false });
            else if (e.kind === 'spike') Object.assign(o, { x: wx, y: wy, r: Math.max(4, e.r * 0.8), delay: d0, life: 0.34, big: e.r >= 8 });
            else Object.assign(o, { x: wx, y: wy, r: e.r, delay: d0, fall: 0.42, fall0: 0.42, life: 0.8 });
            o.hit = hm; o.rehit = 0.35; o.qs = j > 0;
            this.objs.push(o);
          });
          break;
        }
        case 'beam': {
          const o = base(i, 0, 'beam', e);
          Object.assign(o, { follow: c, ang, ang0: ang, sweep: (e.sweep || 0) * Math.PI / 180, len: e.len, w: e.w, life: e.dur, dur: e.dur, rehit: e.dur / e.ticks - 0.001, both: e.both });
          this.objs.push(o); this.sfx('beam', style);
          break;
        }
        case 'swing':
          // 휘두르기: 앞쪽 부채꼴을 쓸어 벤다 (n번이면 좌우로 번갈아)
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'swing', e), big = e.arc >= 300;
            Object.assign(o, { follow: c, ang, r: e.r, arc: e.arc * Math.PI / 180, life: big ? 0.3 : 0.2, max: big ? 0.3 : 0.2, delay: j * 0.17, dirS: j % 2 ? -1 : 1 });
            this.objs.push(o);
          }
          this.sfx('dash', style);
          break;
        case 'cone': {
          // 부채꼴 분사: 앞으로 쏟아내는 숨결·물줄기·가스
          const o = base(i, 0, 'cone', e);
          Object.assign(o, { follow: c, ang, len: e.len, arc: e.arc * Math.PI / 180, life: e.dur, max: e.dur, rehit: e.dur / e.ticks - 0.001 });
          this.objs.push(o); this.sfx('beam', style);
          break;
        }
        case 'wave':
          // 충격파: 한 점에서 고리가 퍼져 나간다
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'wave', e);
            let ox = x, oy = y;
            if (e.at === 'front') { ox = x + ca * e.off; oy = y + sa * e.off; } else if (e.at === 'target') { ox = tx; oy = ty; }
            Object.assign(o, { x: cx(ox), y: cyy(oy), r: e.r, cur: 2, prev: 0, life: 0.42, max: 0.42, delay: j * 0.22 });
            this.objs.push(o);
          }
          this.shake = Math.max(this.shake, 2.5);
          break;
        case 'line': {
          // 땅 가르기: 조준한 방향으로 기둥이 차례로 솟는다 (한 줄에 한 번만 맞는다)
          const hm = new Map();
          for (let j = 0; j < e.n; j++) {
            const dd = 14 + j * e.step, px = x + ca * dd, py = y + sa * dd;
            if (px < B || px > W - B || py < B || py > H - B || this.wallAt(px, py - 2)) break;
            const o = base(i, j, 'spike', e);
            Object.assign(o, { x: px, y: py, delay: j * 0.055, life: 0.34, r: e.r, hit: hm, big: true });
            this.objs.push(o);
          }
          break;
        }
        case 'chain': {
          // 연쇄: 가장 가까운 적에게 꽂힌 뒤 옆 적으로 튄다
          const o = base(i, 0, 'chain', e);
          const used = new Set([c.idx]), path = [];
          let px = x + ca * 5, py = cy + sa * 5;
          for (let k = 0; k < e.n; k++) {
            let best = null, bd = k === 0 ? e.range * 1.2 : e.range;
            for (const v of this.fighters) {
              if (!v.alive || v.gone || used.has(v.idx)) continue;
              const dx = v.x - px, dy = this.bodyY(v) - py, d = Math.hypot(dx, dy);
              if (k === 0) { let da = Math.atan2(dy, dx) - ang; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > 1.2) continue; }
              if (d < bd) { bd = d; best = v; }
            }
            if (!best) break;
            used.add(best.idx); path.push(best.idx); px = best.x; py = this.bodyY(best);
          }
          Object.assign(o, { x: x + ca * 5, y: cy + sa * 5, path, life: 0.38, max: 0.38, endA: ang, endL: e.range * 0.7 });
          for (const k of path) { const v = this.fighters[k]; this.vfxImpact(style, mv.color, v.x, this.bodyY(v), 0.8); }
          this.objs.push(o);
          this.sfx('beam', 'electric');
          break;
        }
        case 'hook': {
          // 갈고리: 날아가서 맞으면 내 쪽으로 끌려온다
          const o = base(i, 0, 'shot', e);
          Object.assign(o, { x: x + ca * 5, y: cy + sa * 5, vx: ca * e.speed, vy: sa * e.speed, r: 2, life: e.range / e.speed, kb: -11, hook: true, homing: 0, bounce: 0, boom: 0 });
          this.objs.push(o);
          break;
        }
        case 'lob':
          // 포물선 투척: 머리 위로 휙 던져 표시된 곳에 떨어져 터진다
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'blast', e);
            const lx = cx(tx + (j ? (R() - 0.5) * 34 : 0)), ly = cyy(ty - 4 + (j ? (R() - 0.5) * 26 : 0));
            const fl = 0.42 + Math.hypot(lx - x, ly - cy) / 520;
            Object.assign(o, { x: lx, y: ly, r: e.r, delay0: fl, life: fl + 0.4, trig: false, lob: { x0: x + ca * 4, y0: cy - 2 }, delay: j * 0.12 });
            this.objs.push(o);
          }
          this.sfx('dash', style);
          break;
        /* ===== 추가 공격 30종 ===== */
        case 'meteor': {
          const o = base(i, 0, 'drop', e);
          Object.assign(o, { x: cx(tx), y: cyy(ty), fall: 0.85, fall0: 0.85, r: e.r, life: 1.4, big: true });
          this.objs.push(o); break;
        }
        case 'thrust':
          for (let j = 0; j < e.n; j++) { const o = base(i, j, 'thrust', e); Object.assign(o, { follow: c, ang, len: e.len, w: e.w, life: 0.16, max: 0.16, delay: j * 0.13 }); this.objs.push(o); }
          this.sfx('dash', style); break;
        case 'launch': {
          const o = base(i, 0, 'blast', e);
          Object.assign(o, { x: cx(x + ca * e.off), y: cyy(cy + sa * e.off), r: e.r, delay0: 0.05, life: 0.45, trig: false });
          this.objs.push(o);
          for (let k = 0; k < 8; k++) this.addP('streak', o.x + rnd(-e.r, e.r) * 0.6, o.y, 0, -rnd(120, 220), 0.35, k & 1 ? '#ffffff' : mv.color, 1);
          break;
        }
        case 'leap': {
          const [lx, ly] = this.leapTarget(x, y, tx, ty, ang, e.dist), dur = 0.32 + Math.hypot(lx - x, ly - y) / 500;
          const o = base(i, 0, 'blast', e);
          Object.assign(o, { x: lx, y: ly - 4, r: e.r, delay0: dur, life: dur + 0.4, trig: false, land: true });
          this.objs.push(o);
          if (!c.owned) c.leapVis = { t0: this.t, dur, h: 22 + Math.hypot(lx - x, ly - y) * 0.2 };
          break;
        }
        case 'flurry': {
          const o = base(i, 0, 'flurry', e);
          Object.assign(o, { x: cx(x + ca * e.off), y: cyy(y + sa * e.off), r: e.r, life: e.dur, max: e.dur, rehit: e.dur / e.ticks - 0.001 });
          this.objs.push(o); this.sfx('dash', style); break;
        }
        case 'spikering': case 'cross': {
          const hm = new Map(), pts = [];
          const ox = e.at === 'target' ? tx : x, oy = e.at === 'target' ? ty : y;
          if (e.t === 'spikering') for (let j = 0; j < e.n; j++) { const an = (j / e.n) * Math.PI * 2 + ang; pts.push([ox + Math.cos(an) * e.r, oy + Math.sin(an) * e.r * 0.8, j * 0.025]); }
          else { pts.push([ox, oy, 0]); for (let k = 1; k <= e.n; k++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) pts.push([ox + dx * k * 15, oy + dy * k * 12, k * 0.06]); }
          pts.forEach(([px, py, dl], j) => {
            if (px < B || px > W - B || py < B || py > H - B || this.wallAt(px, py - 2)) return;
            const o = base(i, j, 'spike', e);
            Object.assign(o, { x: px, y: py, delay: dl, life: 0.34, r: e.t === 'cross' ? 8 : 7, hit: hm, big: e.t === 'cross' });
            this.objs.push(o);
          });
          break;
        }
        case 'tornado': {
          const o = base(i, 0, 'tornado', e);
          Object.assign(o, { x: x + ca * 8, y: y + sa * 8, vx: ca * e.speed, vy: sa * e.speed, r: e.r, life: e.life, max: e.life, rehit: 0.35 });
          this.objs.push(o); this.sfx('dash', 'wind'); break;
        }
        case 'roll': {
          const o = base(i, 0, 'shot', e);
          Object.assign(o, { x: x + ca * 6, y: cy + sa * 6, vx: ca * e.speed, vy: sa * e.speed, r: e.size, life: e.life, pierce: true, bounce: e.bounce, homing: 0, boom: 0, roll: true, rehit: 0.5 });
          this.objs.push(o); break;
        }
        case 'firewall': {
          const o = base(i, 0, 'fwall', e), mx2 = cx(x + ca * e.off), my2 = cyy(y + sa * e.off), hl = e.len / 2;
          Object.assign(o, { x: mx2, y: my2, ax: mx2 - sa * hl, ay: my2 + ca * hl * 0.8, bx: mx2 + sa * hl, by: my2 - ca * hl * 0.8, life: e.dur, max: e.dur, rehit: 0.5 });
          this.objs.push(o); break;
        }
        case 'net': {
          const o = base(i, 0, 'shot', e);
          Object.assign(o, { x: x + ca * 5, y: cy + sa * 5, vx: ca * e.speed, vy: sa * e.speed, r: 3, life: e.range / e.speed, net: { r: e.r, d: e.d }, homing: 0, bounce: 0, boom: 0 });
          this.objs.push(o); break;
        }
        case 'surge': {
          const o = base(i, 0, 'surge', e);
          Object.assign(o, { x: x + ca * 10, y: y + sa * 10, ca, sa, hw: e.w / 2, vx: ca * e.speed, vy: sa * e.speed, life: e.len / e.speed, max: e.len / e.speed });
          this.objs.push(o); this.shake = Math.max(this.shake, 2); break;
        }
        case 'clone':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'chaser', e), off = (j - (e.n - 1) / 2);
            Object.assign(o, { x: x - sa * off * 14 + ca * 6, y: y + ca * off * 14 + sa * 6, vx: 0, vy: 0, r: 4, life: e.dur, max: e.dur, clone: c.idx, boom: e.r, d: 1, hop: 0 });
            this.solid(o, 3, false); this.objs.push(o);
          }
          this.sfx('summon'); break;
        case 'mark': {
          const o = base(i, 0, 'mark', e);
          const t = this.pickTarget(c, x, cy, ang, e.range, true);
          Object.assign(o, { target: t ? t.idx : -1, x: t ? t.x : cx(x + ca * 50), y: t ? t.y : cyy(y + sa * 50), r: e.r, fuse: e.delay, life: e.delay + 0.35, max: e.delay + 0.35 });
          this.objs.push(o); break;
        }
        case 'charge': {
          const v = base(i, 0, 'chargev', e);
          Object.assign(v, { follow: c, ang, life: e.delay, max: e.delay, dmg: 0 });
          this.objs.push(v);
          const o = base(i, 1, 'shot', e);
          Object.assign(o, { x: x + ca * 6, y: cy + sa * 6, vx: ca * e.speed, vy: sa * e.speed, r: 4, life: 1.6, pierce: true, homing: 0, bounce: 0, boom: e.boom, delay: e.delay, charged: true });
          this.objs.push(o); break;
        }
        case 'missiles':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'shot', e), side = j % 2 ? 1 : -1, an = ang + side * (1.3 + R() * 0.5);
            Object.assign(o, { x: x + ca * 4, y: cy - 4, vx: Math.cos(an) * e.speed * 0.7, vy: Math.sin(an) * e.speed * 0.7 - 40, r: 2, life: 2, homing: 1, delay: j * 0.09, missile: true, bounce: 0, boom: 8 });
            this.objs.push(o);
          }
          break;
        case 'vortex': {
          const o = base(i, 0, 'zone', e);
          const at = e.at === 'self' ? [x, y] : [tx, ty];
          Object.assign(o, { x: cx(at[0]), y: cyy(at[1] - 1), r: e.r, life: e.dur, max: e.dur, rehit: 0.5, heal: 0, pull: e.pull, swirl: true });
          this.objs.push(o); break;
        }
        case 'storm': {
          const o = base(i, 0, 'storm', e), pts = [];
          for (let k = 0; k < e.n; k++) { const an = R() * 6.283, d = Math.sqrt(R()) * e.r; pts.push([cx(tx + Math.cos(an) * d), cyy(ty + Math.sin(an) * d * 0.8)]); }
          Object.assign(o, { x: tx, y: ty, pts, k: 0, acc: 0.1, every: 0.12, sr: 11, life: e.n * 0.12 + 0.35, max: e.n * 0.12 + 0.35, rehit: 0.08, cloudR: e.r });
          this.objs.push(o); break;
        }
        case 'ring': {
          const o = base(i, 0, 'zone', e);
          const at = e.at === 'self' ? [x, y] : [tx, ty];
          Object.assign(o, { x: cx(at[0]), y: cyy(at[1] - 1), r: e.r, life: e.dur, max: e.dur, rehit: 0.4, heal: 0, ring: 6 });
          this.objs.push(o); break;
        }
        case 'phantom': {
          const o = base(i, 0, 'slash', e);
          Object.assign(o, { x0: x, y0: cy, x1: cx(x + ca * e.dist), y1: cyy(cy + sa * e.dist), x: x, y: cy, fuse: 0.32, life: 0.58, max: 0.58 });
          this.objs.push(o); break;
        }
        case 'spiral':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'shot', e), an = ang + j * 0.62 * (e.dir || 1);
            Object.assign(o, { x: x, y: cy, vx: Math.cos(an) * e.speed, vy: Math.sin(an) * e.speed, r: 2, life: 1.1, delay: j * 0.045, homing: 0, bounce: 0, boom: 0 });
            this.objs.push(o);
          }
          break;
        case 'prism':
          for (let j = -1; j <= 1; j++) {
            const o = base(i, j + 1, 'beam', e), an = ang + j * e.spread * Math.PI / 180;
            Object.assign(o, { follow: c, ang: an, ang0: an, sweep: 0, len: e.len, w: e.w, life: e.dur, dur: e.dur, rehit: e.dur / e.ticks - 0.001, both: false, hit: new Map() });
            this.objs.push(o);
          }
          this.sfx('beam', style); break;
        case 'whip': {
          const o = base(i, 0, 'whip', e);
          Object.assign(o, { follow: c, ang, len: e.len, life: 0.24, max: 0.24, dirS: R() < 0.5 ? 1 : -1 });
          this.objs.push(o); this.sfx('dash', style); break;
        }
        case 'skyline': {
          const hm = new Map();
          for (let j = 0; j < e.n; j++) {
            const dd = 22 + j * e.step, px = x + ca * dd, py = y + sa * dd;
            if (px < B || px > W - B || py < B || py > H - B) break;
            const o = base(i, j, 'drop', e);
            Object.assign(o, { x: px, y: py, delay: j * 0.07, fall: 0.36, fall0: 0.36, r: e.r, life: 0.75, hit: hm });
            this.objs.push(o);
          }
          break;
        }
        case 'gatling':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'shot', e), an = ang + (R() - 0.5) * e.spread * Math.PI / 180;
            Object.assign(o, { x: x + ca * 6, y: cy + sa * 6, vx: Math.cos(an) * 330, vy: Math.sin(an) * 330, r: 1, life: 0.7, delay: j * 0.055, homing: 0, bounce: 0, boom: 0 });
            this.objs.push(o);
          }
          break;
        case 'top':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'top', e), an = ang + (j - (e.n - 1) / 2) * 0.5;
            Object.assign(o, { x: x + ca * 8, y: y + sa * 8, vx: Math.cos(an) * e.speed, vy: Math.sin(an) * e.speed, r: 5, life: e.dur, max: e.dur, rehit: 0.4 });
            this.objs.push(o);
          }
          this.sfx('summon'); break;
        case 'beacon': {
          const o = base(i, 0, 'beacon', e);
          Object.assign(o, { x: cx(x + ca * 16), y: cyy(y + sa * 16), r: e.r, rate: e.rate, pulse: 0.25, pn: 0, life: e.dur, max: e.dur, dmg: e.dmg });
          this.solid(o, 3, true); this.objs.push(o); this.sfx('summon'); break;
        }
        case 'snipe': {
          const o = base(i, 0, 'snipe', e);
          Object.assign(o, { x: x + ca * 5, y: cy + sa * 5, ang, len: 330, fuse: e.delay, life: e.delay + 0.25, max: e.delay + 0.25, w: 6 });
          this.objs.push(o); break;
        }
        case 'gust': {
          const o = base(i, 0, 'cone', e);
          Object.assign(o, { follow: c, ang, len: e.len, arc: e.arc * Math.PI / 180, life: 0.18, max: 0.18, rehit: 0, gust: true });
          this.objs.push(o);
          for (let k = 0; k < 14; k++) { const an = ang + rnd(-0.5, 0.5) * e.arc * Math.PI / 180; this.addP('streak', x + Math.cos(an) * 6, cy + Math.sin(an) * 6, Math.cos(an) * 260, Math.sin(an) * 200, 0.3, k & 1 ? '#ffffff' : mv.color, 1); }
          this.sfx('dash', 'wind'); break;
        }
        case 'drain': {
          const o = base(i, 0, 'drain', e), t = this.pickTarget(c, x, cy, ang, e.range, false);
          Object.assign(o, { follow: c, target: t ? t.idx : -1, range: e.range, life: t ? e.dur : 0.2, max: e.dur, rehit: e.dur / e.ticks - 0.001, healAmt: e.heal, hacc: 0, every: e.dur / e.ticks });
          this.objs.push(o); break;
        }

        /* ----- 추가 공격 12종 ----- */
        case 'bite': {
          const o = base(i, 0, 'bite', e), t = this.pickTarget(c, x, cy, ang, e.range, true), dd = Math.min(e.range, 14 + e.r);
          Object.assign(o, { x: t ? t.x : cx(x + ca * dd), y: t ? this.bodyY(t) : cyy(cy + sa * dd), r: e.r, fuse: 0.24, life: 0.55, max: 0.55 });
          this.objs.push(o); break;
        }
        case 'stampede':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'runner', e), off = (j - (e.n - 1) / 2) * (e.size * 2 + 6), back = 14 + (j % 2) * 10;
            Object.assign(o, { x: cx(x - ca * back - sa * off), y: cyy(y - sa * back + ca * off), vx: ca * e.speed, vy: sa * e.speed, r: e.size, life: e.len / e.speed + 0.2, max: e.len / e.speed + 0.2, delay: (j % 3) * 0.06 });
            this.objs.push(o);
          }
          this.shake = Math.max(this.shake, 2); this.sfx('dash', style); break;
        case 'pillar':
          for (let j = 0; j < e.n; j++) {
            const d = 16 + j * e.step, o = base(i, j, 'pillar', e);
            Object.assign(o, { x: cx(x + ca * d), y: cyy(y + sa * d), r: e.r, delay: j * 0.07, life: 0.55, max: 0.55, trig: false, st: e.lift ? { k: 'air', d: 0.6 } : e.st });
            this.objs.push(o);
          }
          break;
        case 'lasergrid': {
          const o = base(i, 0, 'lgrid', e), segs = [], L = 150, half = (Math.ceil(e.n / 2) - 1) / 2;
          for (let j = 0; j < e.n; j++) {
            const off = (Math.floor(j / 2) - half) * 34 + (R() - 0.5) * 8;
            if (j % 2 === 0) segs.push([cx(tx - L), cyy(ty - 5 + off), cx(tx + L), cyy(ty - 5 + off)]);
            else segs.push([cx(tx + off), cyy(ty - 5 - L * 0.7), cx(tx + off), cyy(ty - 5 + L * 0.7)]);
          }
          Object.assign(o, { x: tx, y: ty, segs, fuse: e.delay, life: e.delay + 0.3, max: e.delay + 0.3 });
          this.objs.push(o); this.sfx('beam', style); break;
        }
        case 'hop': {
          const o = base(i, 0, 'hopper', e);
          Object.assign(o, { x: x + ca * 8, y: y + sa * 8, x0: x, y0: y, x1: x, y1: y, r: e.r, size: e.size, hops: e.n, hk: 0, ht: 0, hdur: 0.42, life: e.n * 0.42 + 0.3, max: e.n * 0.42 + 0.3, ang, h: 0 });
          this.objs.push(o); this.sfx('summon'); break;
        }
        case 'swarm': {
          const o = base(i, 0, 'swarm', e);
          Object.assign(o, { x: x + ca * 10, y: cy + sa * 10, r: e.r, speed: e.speed, life: e.dur, max: e.dur, rehit: 0.4, bugs: Array.from({ length: 10 }, () => [R() * 6.28, 0.4 + R() * 0.6]) });
          this.objs.push(o); this.sfx('summon'); break;
        }
        case 'bubble':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'shot', e), an = ang + (e.n > 1 ? (j / (e.n - 1) - 0.5) * 0.5 : 0);
            Object.assign(o, { x: x + ca * 6, y: cy + sa * 6, vx: Math.cos(an) * e.speed, vy: Math.sin(an) * e.speed, r: e.size, life: 2.2, homing: 0.25, bounce: 1, boom: 0, bubble: e.d, st: { k: 'air', d: e.d } });
            this.objs.push(o);
          }
          break;
        case 'grab': {
          const t = this.pickTarget(c, x, cy, ang, e.range, false), o = base(i, 0, 'grab', e);
          Object.assign(o, { x: t ? t.x : cx(x + ca * 60), y: t ? t.y : cyy(y + sa * 60), r: e.r, fuse: e.delay, life: e.delay + 0.5, max: e.delay + 0.5 });
          this.objs.push(o); break;
        }
        case 'claw': {
          const fx0 = x + ca * (e.r * 0.4 + 8), fy0 = cy + sa * (e.r * 0.4 + 8), px = -sa, py = ca, dx = ca * 0.5 + px * 0.85, dy = sa * 0.5 + py * 0.85;
          for (let j = 0; j < 3; j++) {
            const o = base(i, j, 'slash', e), off = (j - 1) * 7, mx = fx0 + ca * off * 0.3 + px * off, my = fy0 + sa * off * 0.3 + py * off, L = e.r * 0.5;
            Object.assign(o, { x0: mx - dx * L, y0: my - dy * L, x1: mx + dx * L, y1: my + dy * L, x: mx, y: my, fuse: 0.03 + j * 0.05, life: 0.33 + j * 0.05, max: 0.33 + j * 0.05, claw: true });
            this.objs.push(o);
          }
          this.sfx('dash', style); break;
        }
        case 'crack': {
          const o = base(i, 0, 'crack', e);
          Object.assign(o, { x: x + ca * 8, y: y + sa * 8, ang, speed: e.speed, r: e.r, len: e.len, gone: 0, pts: [[x + ca * 8, y + sa * 8]], life: e.len / e.speed + 0.7, max: e.len / e.speed + 0.7 });
          this.objs.push(o); this.sfx('boom', style); break;
        }
        case 'stomp':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'blast', e);
            Object.assign(o, { x, y: y - 2, r: e.r * (1 + j * 0.35), delay0: 0.12 + j * 0.3, life: 0.5 + j * 0.3, trig: false, land: true });
            this.objs.push(o);
          }
          break;
        case 'sonic':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, 'wave', e);
            Object.assign(o, { x, y, r: e.len, cur: 2, prev: 0, life: 0.5, max: 0.5, delay: j * 0.15, arc: e.arc * Math.PI / 180, ang, puffed: true });
            this.objs.push(o);
          }
          this.sfx('beam', style); break;

        case 'blast': case 'zone': {
          const o = base(i, 0, e.t, e);
          let ox = x, oy = e.t === 'zone' ? y - 1 : cy;
          if (e.at === 'front') { ox = x + ca * e.off; oy += sa * e.off; }
          else if (e.at === 'target') { ox = tx; oy = e.t === 'zone' ? ty - 1 : ty - 4; }
          o.x = cx(ox); o.y = cyy(oy); o.r = e.r;
          if (e.t === 'blast') { o.delay0 = e.delay; o.life = e.delay + 0.4; o.trig = false; }
          else { o.life = e.dur; o.max = e.dur; o.rehit = 0.5; o.heal = e.heal; o.follow = e.follow ? c : null; }
          this.objs.push(o);
          break;
        }
        case 'trail': {
          const o = base(i, 0, 'trailgen', e);
          Object.assign(o, { follow: c, life: e.dur, acc: 0, cnt: 0, pr: e.r, plife: e.life });
          this.objs.push(o);
          break;
        }
        case 'summon':
          for (let j = 0; j < e.n; j++) {
            const o = base(i, j, e.kind, e);
            o.life = e.dur; o.max = e.dur;
            const off = (j - (e.n - 1) / 2), px = -sa, py = ca;
            if (e.kind === 'turret') { o.x = x + ca * 12 + px * off * 14; o.y = y + sa * 12 + py * off * 14; o.rate = e.rate; o.fireT = 0.4 + j * 0.25; o.slot = a[2]; o.fx = i; o.shots = 0; o.r = 3; o.aimA = ang; }
            else if (e.kind === 'chaser') { o.x = x + ca * 10 + px * off * 10; o.y = y + sa * 10 + py * off * 10; o.vx = 0; o.vy = 0; o.rehit = 0.7; o.r = 4; o.hop = j * 0.3; o.d = 1; }
            else if (e.kind === 'orbit') { o.follow = c; o.ang = (j / e.n) * Math.PI * 2; o.rehit = 0.55; o.r = 3; o.x = x; o.y = cy; }
            else if (e.kind === 'mine') { o.x = x + ca * (16 + j * 12) + px * off * 8; o.y = y + sa * (16 + j * 12) + py * off * 8; o.arm = 0.6; o.r = 8; o.boom = 18; }
            else {
              o.x = x + ca * 16 + px * off * 24; o.y = y + sa * 16 + py * off * 24;
              o.nx = ca; o.ny = sa; o.ax = o.x + px * 12; o.ay = o.y + py * 12; o.bx = o.x - px * 12; o.by = o.y - py * 12;
            }
            if (e.kind !== 'orbit' && e.kind !== 'barrier') this.solid(o, 3, e.kind === 'turret' || e.kind === 'mine');
            this.vfxImpact(style, mv.color, o.x, o.y - 3, 0.5);
            this.objs.push(o);
          }
          this.sfx('summon');
          break;
        case 'all': {
          this.flash = { c: mv.color, t: 0.35, max: 0.35, a: 0.4 };
          const o = base(i, 0, 'all', e);
          for (const v of this.fighters) {
            if (v.alive && v.idx !== c.idx) this.vfxImpact(style, mv.color, v.x, this.bodyY(v), 1.2);
            if (v.owned && v.alive && v.idx !== c.idx) this.takeHit(v, o);
          }
          this.shake = Math.max(this.shake, 3);
          break;
        }
        case 'swap': {
          const tg = this.fighters[a[11]];
          if (tg && a[13] >= 0) {
            this.vfxImpact(style, mv.color, tg.x, this.bodyY(tg), 1);
            if (tg.owned && !c.owned) { tg.x = a[13]; tg.y = a[14]; tg.vx = 0; tg.vy = 0; }
          }
          break;
        }
        case 'blink': case 'heal': case 'buff':
          if (!c.owned) this.vfxImpact(style, mv.color, x, cy, 0.7);
          if (e.t === 'blink') this.sfx('blink');
          if (e.t === 'buff') this.sfx(e.k === 'shield' ? 'shield' : 'buff');
          if (e.t === 'heal') { this.sfx('heal'); for (let k = 0; k < 8; k++) this.addP('pat', c.x + rnd(-6, 6), c.y - rnd(0, 12), 0, -18, 0.7, '#7dff8a', 1, { pat: 'plus' }); }
          if (e.t === 'buff') for (let k = 0; k < 10; k++) { const an = k / 10 * 6.28; this.addP('px', c.x + Math.cos(an) * 8, c.y - 4 + Math.sin(an) * 5, -Math.cos(an) * 10, -Math.sin(an) * 6 - 18, 0.6, ST_COLOR[e.k] || mv.color, 1); }
          break;
      }
    });
  }

  spawnPest(ev) {
    // ['q', 대상, 부작용 번호, uid, x, y]
    const f = this.fighters[ev[1] | 0];
    if (!f || !f.alive) return;
    const d = f.dbs[ev[2] | 0];
    if (!d || d.fx.t !== 'pest') return;
    const x = d.fx;
    this.objs.push({ uid: String(ev[3]), owner: -1, target: f.idx, kind: 'pest', x: +ev[4] || 0, y: +ev[5] || 0, life: 7, max: 7, dmg: x.dmg, mul: 1, st: x.st, kb: 2, color: x.color, cl: light(x.color, 0.6), dk: dark(x.color, 0.35),
      rows: x.pix || procShape('paw', 0), gm: { shape: 'paw', pix: x.pix }, ph: Math.random() * 3, custom: !!x.pix, vfx: 'plain', hit: new Map(), age: 0, rehit: 1, delay: 0, d: 1, hop: Math.random() });
    this.pop(+ev[4] || 0, (+ev[5] || 0) - 10, x.name + ' 등장!', x.color, 1.1, 0.9);
    this.sfx('pest');
    this.vfxImpact('plain', x.color, +ev[4] || 0, +ev[5] || 0, 0.5);
  }

  spawnSub(ev) {
    const c = this.fighters[ev[1]];
    if (!c) return;
    const mv = c.spec.moves[SLOTS[ev[2]] || 'basic'], e = mv.fx[ev[3]];
    if (!e || e.t !== 'summon') return;
    this.objs.push({ uid: String(ev[4]), owner: c.idx, kind: 'shot', dmg: e.dmg, mul: 1, st: e.st, kb: 1, color: mv.color, cl: light(mv.color, 0.6), dk: dark(mv.color, 0.35), rows: rowsOf(mv.shape, mv.pix), gm: mv, ph: Math.random() * 3, tr: [], custom: !!mv.pix, vfx: mv.vfx || 'plain', hit: new Map(), age: 0, rehit: 0, delay: 0,
      x: +ev[5] || 0, y: +ev[6] || 0, vx: clamp(+ev[7] || 0, -400, 400), vy: clamp(+ev[8] || 0, -400, 400), r: 1, homing: 0, pierce: false, bounce: 0, life: 1.1, boom: 0 });
    this.sfx('shoot', mv.vfx);
  }

  /* ---------- 물체 갱신 ---------- */
  bodyHit(v, x, y, r) { const R = r + 4 * v.size; return dist2(v.x, this.bodyY(v), x, y) <= R * R; }
  checkHits(o, test) {
    for (const v of this.fighters) {
      if (!v.owned || !v.alive) continue;
      if (v.idx === o.owner && !(o.all && o.age > 0.5) && !(v.selfHit && o.age > 0.3 && SELF_KINDS.has(o.kind) && !o.follow)) continue;
      const last = o.hit.get(v.idx);
      if (last !== undefined && (!o.rehit || this.t - last < o.rehit)) continue;
      if (!test(v)) continue;
      this.takeHit(v, o);
      if (o.dead) break;
    }
  }
  killObj(o, victim) {
    if (o.dead) return;
    o.dead = true;
    if (o.bubble && victim >= 0 && this.fighters[victim]) this.objs.push({ uid: o.uid + 'q', owner: o.owner, kind: 'btrap', fid: victim, x: o.x, y: o.y, dmg: 0, mul: 1, st: null, kb: 0, color: o.color, cl: o.cl, dk: o.dk, rows: o.rows, gm: o.gm, vfx: o.vfx, hit: new Map(), age: 0, life: o.bubble, max: o.bubble, delay: 0, ph: 0 });
    if (o.net) {
      this.objs.push({ uid: o.uid + 'n', owner: o.owner, kind: 'zone', dmg: 0, mul: o.mul, st: { k: 'root', d: 0.9 }, kb: 0, color: '#e8e8f0', cl: '#ffffff', dk: '#8a8aa0', rows: o.rows, gm: o.gm, vfx: o.vfx, hit: new Map(), age: 0, rehit: 0.5, delay: 0, x: o.x, y: o.y + 3, r: o.net.r, life: o.net.d, max: o.net.d, heal: 0, netz: true });
      this.vfxImpact(o.vfx, '#e8e8f0', o.x, o.y, 0.8);
    }
    if (o.boom > 0) {
      const b = { uid: o.uid + 'b', owner: o.owner, kind: 'blast', dmg: o.kind === 'mine' ? o.dmg : o.dmg * 0.6, mul: o.mul, st: o.kind === 'mine' ? o.st : null, kb: 4, color: o.color, cl: o.cl, dk: o.dk, rows: o.rows, gm: o.gm, vfx: o.vfx, hit: new Map(), age: 0, rehit: 0, delay: 0, x: o.x, y: o.kind === 'mine' ? o.y - 3 : o.y, r: o.boom, delay0: 0, life: 0.4, trig: false };
      if (victim != null) b.hit.set(victim, this.t);
      this.objs.push(b);
    } else if (o.kind === 'shot') this.vfxImpact(o.vfx, o.color, o.x, o.y, o.r >= 3 ? 0.8 : 0.45);
    if (o.split > 0 && !o.child && o.kind === 'shot') {
      const base = Math.atan2(o.vy || 0, o.vx || 1);
      for (let k = 0; k < o.split; k++) {
        const an = base + (k / o.split) * Math.PI * 2;
        this.objs.push({ uid: o.uid + 'c' + k, owner: o.owner, kind: 'shot', dmg: o.dmg * 0.4, mul: o.mul, st: null, kb: 1, color: o.color, cl: o.cl, dk: o.dk, rows: o.rows, gm: o.gm, ph: Math.random() * 3, tr: [], custom: o.custom, vfx: o.vfx, hit: new Map(victim != null ? [[victim, this.t]] : []), age: 0, rehit: 0, delay: 0,
          x: o.x, y: o.y, vx: Math.cos(an) * 170, vy: Math.sin(an) * 170, r: 1, homing: 0, pierce: false, bounce: 0, life: 0.45, boom: 0, child: true });
      }
    }
    if (o.kind === 'shot' && !o.child) {
      if (o.end && o.end !== 'none') this.shotEnd(o, victim);
      if (!o.landed && !o.hit.size && victim == null) { const ow = this.fighters[o.owner]; if (ow && ow.owned) this.dEv(ow, 'miss'); }
    }
  }
  /** 투사체에서 나오는 작은 것들 (모든 기기에서 같은 이름) */
  /** 걸어간 자리에 남는 것 (모든 기기에서) */
  stepTrail(f) {
    const d = Math.hypot(f.x - f.px, f.y - f.py);
    if (d > 20) return;
    f.trD += d;
    if (f.trD < 13) return;
    f.trD = 0;
    const k = f.dtrail.kind, n = ++f.trN;
    if (k === 'squeak') { if (n % 2) this.addP('pat', f.x, f.y - 14 * f.size, rnd(-6, 6), -14, 0.6, '#ffe14a', 1, { pat: 'note' }); if (n % 3 === 0) this.sfx('move', 'plain', { mv: { name: 'step', sfx: { kind: 'squeak', pitch: 1.6 + (n % 2) * 0.3, len: 0.25 } }, slot: 's1' }); return; }
    if (k === 'flower') { this.decal(f.x, f.y + 1, 3, pick(['#ff9ad0', '#ffe14a', '#ffffff'])); return; }
    if (k === 'money') { this.addP('pat', f.x, f.y, rnd(-20, 20), rnd(-10, 0), 1, '#ffcf3a', 1, { pat: 'coin', g: 160, vz: 30 }); return; }
    const T = { fire: ['#ff8a3a', 'fire', { k: 'burn', d: 1.5 }, 1.5], poop: ['#7a4a1a', 'earth', { k: 'slip', d: 1 }, 0], ice: ['#cff4ff', 'ice', { k: 'slip', d: 1 }, 0], slime: ['#7fdf5a', 'poison', { k: 'slow', d: 1 }, 0], water: ['#7fd8ff', 'water', { k: 'slip', d: 0.8 }, 0] }[k] || ['#ffffff', 'plain', null, 0];
    this.objs.push({ uid: f.idx + 'tr' + n, owner: f.idx, all: true, kind: 'zone', x: f.x, y: f.y + 1, r: 7, life: 3, max: 3, dmg: T[3], mul: 1, st: T[2], kb: 0, color: T[0], cl: light(T[0], 0.5), dk: dark(T[0], 0.4), rows: null, gm: { shape: 'dot' }, ph: 0, vfx: T[1], hit: new Map(), age: 0, rehit: 0.6, delay: 0, heal: 0, tr: [], slotN: 'basic', small: true });
    if (k === 'poop') this.decal(f.x, f.y + 1, 3, '#6a3a12');
  }
  kid(o, suf, kind, ex) {
    return Object.assign({ uid: o.uid + suf, owner: o.owner, kind, dmg: o.dmg, mul: o.mul, st: o.st, kb: o.kb || 0, color: o.color, cl: o.cl, dk: o.dk, rows: o.rows, gm: o.gm, ph: Math.random() * 3, custom: o.custom, vfx: o.vfx, hit: new Map(), age: 0, rehit: 0, delay: 0, slotN: o.slotN, tr: [] }, ex);
  }
  /** 새 움직임: 휘기·나선·공전·멈췄다 돌진… (1을 돌려주면 자리를 직접 정한 것) */
  shotPath(o, ow, dt) {
    const a = o.age, sp = Math.hypot(o.vx, o.vy) || 1;
    const rot = (w) => { const c = Math.cos(w * dt), s = Math.sin(w * dt), vx = o.vx; o.vx = vx * c - o.vy * s; o.vy = vx * s + o.vy * c; };
    const lat = (fn) => { o.latD = (o.latD || 0) + fn(a) - fn(Math.max(0, a - dt)); };
    switch (o.path) {
      case 'zigzag': lat((t) => { const p = (t / 0.3) % 1; return 11 * (p < 0.5 ? p * 4 - 1 : 3 - p * 4); }); break;
      case 'sine': lat((t) => 10 * Math.sin(t * 10)); break;
      case 'helix': lat((t) => 9 * Math.sin(t * 11 + o.hph)); break;
      case 'wobble': lat((t) => 7 * Math.sin(t * 6 + o.sd * 9) + 4 * Math.sin(t * 15 + o.sd * 4)); rot(Math.sin(a * 3 + o.sd * 7) * 1.4); break;
      case 'curve': if (o.cw ? a < o.cT : a < 1) rot(o.cw || o.turn * 2.4); break;
      case 'spiral': {
        if (o.ox == null) { o.ox = o.x; o.oy = o.y; o.sa0 = o.spA != null ? Math.atan2(o.vy, o.vx) : Math.atan2(o.vy, o.vx); }
        const an = o.sa0 + a * 4 * (o.turn || 1), rr = 6 + a * o.v0 * 0.6;
        o.x = o.ox + Math.cos(an) * rr; o.y = o.oy + Math.sin(an) * rr * 0.8;
        o.vx = -Math.sin(an) * o.v0; o.vy = Math.cos(an) * o.v0;
        return 1;
      }
      case 'accel': { if (sp < Math.min(o.v0 * 3.2, 380)) { const m = 1 + 2.4 * dt; o.vx *= m; o.vy *= m; } if (Math.random() < 0.6) this.addP('smoke', o.x, o.y, rnd(-6, 6), rnd(-10, 0), 0.45, '#d8d8e8', 1.4); break; }
      case 'decel': if (sp > o.v0 * 0.25) { o.vx *= 1 - 1.4 * dt; o.vy *= 1 - 1.4 * dt; } break;
      case 'late': if (a > 0.5 && !o.lt) { o.lt = true; o.homing = Math.max(o.homing || 0, 1.1); this.addP('pat', o.x, o.y - 6, 0, -24, 0.5, '#ffe14a', 1, { pat: 'plus' }); } break;
      case 'stopgo':
        if (a > 0.22 && !o.go) {
          const k = Math.max(0, 1 - 9 * dt); o.vx *= k; o.vy *= k;
          if (a > 0.8) {
            o.go = true;
            const t = ow ? this.nearest(ow) : null, an = t ? Math.atan2(this.bodyY(t) - o.y, t.x - o.x) : o.sd * 6.28;
            o.vx = Math.cos(an) * o.v0 * 1.7; o.vy = Math.sin(an) * o.v0 * 1.7;
            this.addP('ring', o.x, o.y, 0, 0, 0.2, o.cl, 1, { r0: 2, r1: 9 });
          }
        }
        break;
      case 'stay':
        if (a > 0.3) { const k = Math.max(0, 1 - 10 * dt); o.vx *= k; o.vy *= k; o.y += Math.cos(a * 6 + o.sd * 5) * 5 * dt; if (o.life < 0.5 && Math.random() < 0.5) this.addP('px', o.x + rnd(-4, 4), o.y + rnd(-4, 4), 0, -16, 0.3, '#ff4d3a', 1); }
        break;
      case 'blink': o.bk = (o.bk || 0) + dt; break;
      case 'orbit':
        if (o.orbT == null) o.orbT = 1 + (o.orbA || 0) * 0.04;
        if (a < o.orbT && ow && ow.alive) {
          const an = (o.orbA || 0) + a * 6.5, rr = 18 * ow.size;
          o.x = ow.x + Math.cos(an) * rr; o.y = this.bodyY(ow) + Math.sin(an) * rr * 0.75;
          o.vx = -Math.sin(an) * o.v0; o.vy = Math.cos(an) * o.v0;
          return 1;
        }
        if (!o.go) {
          o.go = true;
          const t = ow ? this.nearest(ow) : null, an = t ? Math.atan2(this.bodyY(t) - o.y, t.x - o.x) : o.sd * 6.28;
          o.vx = Math.cos(an) * o.v0; o.vy = Math.sin(an) * o.v0; o.homing = Math.max(o.homing || 0, 0.45);
        }
        break;
    }
    return 0;
  }
  /** 커지기·끌어당기기·길에 떨구기 */
  shotExtras(o, ow, dt) {
    if (o.grow > 0) o.r = Math.min(o.r0 + o.grow * 1.6, o.r0 + o.grow * o.age * 1.3);
    if (o.pull) {
      const RR = (o.aura || 8) * 2.4 + o.r * 2;
      for (const v of this.fighters) if (v.owned && v.alive && v.idx !== o.owner && !v.st.invuln) { const d = Math.hypot(o.x - v.x, o.y - v.y); if (d < RR && d > 3) { v.vx += (o.x - v.x) / d * o.pull * 9 * dt; v.vy += (o.y - v.y) / d * o.pull * 9 * dt; } }
      if (Math.random() < 0.5) { const an = Math.random() * 6.28, sgn = o.pull > 0 ? 1 : -1; this.addP('px', o.x + Math.cos(an) * (sgn > 0 ? RR : 4), o.y + Math.sin(an) * (sgn > 0 ? RR : 4), -Math.cos(an) * 60 * sgn, -Math.sin(an) * 60 * sgn, 0.35, o.cl, 1); }
    }
    if (o.drop > 0) {
      o.dropT += dt;
      if (o.dropT >= o.drop && o.dropN < 14) {
        o.dropT -= o.drop;
        const k = o.dropk, j = o.dropN++, B = this.map.B;
        if (o.x > B && o.x < W - B && o.y > B && o.y < H - B) {
          const ex = k === 'zone' ? { r: 9, life: 1.8, max: 1.8, rehit: 0.5, heal: 0, dmg: o.dmg * 0.25, kb: 0 } : k === 'spike' ? { r: 5, life: 0.34, delay: 0.05, dmg: o.dmg * 0.6, kb: 3 } : { r: 9, delay0: 0.3, life: 0.7, trig: false, dmg: o.dmg * 0.6, kb: 3 };
          this.objs.push(this.kid(o, 'd' + j, k, Object.assign({ x: o.x, y: o.y + 2 }, ex)));
        }
      }
    }
  }
  /** 투사체가 사라질 때: 사방으로·지뢰·장판·기둥 */
  shotEnd(o, victim) {
    const B = this.map.B, x = clamp(o.x, B + 2, W - B - 2), y = clamp(o.y, B + 4, H - B - 2);
    if (o.end === 'burst') {
      for (let k = 0; k < o.n2; k++) {
        const an = k / o.n2 * Math.PI * 2 + (o.sd || 0) * 6, c = this.kid(o, 'e' + k, 'shot', { x, y, vx: Math.cos(an) * 180, vy: Math.sin(an) * 180, r: 1.5, dmg: o.dmg * 0.45, homing: 0, pierce: false, bounce: 0, life: 0.5, boom: 0, child: true, kb: 2 });
        if (victim != null) c.hit.set(victim, this.t);
        this.objs.push(c);
      }
      this.vfxImpact(o.vfx, o.color, x, y, 1.2); this.addP('ring', x, y, 0, 0, 0.3, o.cl, 1, { r0: 3, r1: 18 }); this.sfx('boom', o.vfx);
    } else if (o.end === 'mine') {
      this.objs.push(this.kid(o, 'm', 'blast', { x, y, r: 14 + o.r * 2, dmg: o.dmg * 1.5, delay0: 0.18, life: 0.6, trig: false, kb: 6 }));
    } else if (o.end === 'zone') {
      this.objs.push(this.kid(o, 'z', 'zone', { x, y, r: 18, dmg: o.dmg * 0.3, life: 2.5, max: 2.5, rehit: 0.5, heal: 0, kb: 0 }));
    } else if (o.end === 'pillars') {
      for (let k = 0; k < 6; k++) { const an = k / 6 * Math.PI * 2; this.objs.push(this.kid(o, 'p' + k, 'pillar', { x: clamp(x + Math.cos(an) * 16, B + 2, W - B - 2), y: clamp(y + Math.sin(an) * 13, B + 4, H - B - 2), r: 7, dmg: o.dmg * 0.5, delay: k * 0.04, life: 0.55, max: 0.55, trig: false })); }
    }
  }
  wallAt(x, y) {
    for (const w of this.map.obs) if (w.k === 'wall' && x >= w.x && x <= w.x + w.w && y >= w.y - Math.min(w.hgt || 5, 9) && y <= w.y + w.h - 1) return w;
    return null;
  }

  stepObjs(dt) {
    const objs = this.objs, B = this.map.B;
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      if (o.dead) continue;
      if (o.delay > 0) { o.delay -= dt; continue; }
      o.age += dt; o.life -= dt;
      const ow = this.fighters[o.owner];
      switch (o.kind) {
        case 'circle': if (o.follow) { o.x = o.follow.x; o.y = o.follow.y; } break;
        case 'hb': {
          const c = o.follow;
          if (!c.alive) { o.dead = true; break; }
          if (Math.random() < 0.8) this.vfxTrail(o.vfx, o.color, c.x, this.bodyY(c), -c.vx * 0.1, -c.vy * 0.1, 1);
          this.checkHits(o, (v) => this.bodyHit(v, c.x, this.bodyY(c), o.around));
          break;
        }
        case 'shot': {
          if (o.path && o.path !== 'line' && this.shotPath(o, ow, dt)) {
            if (o.life <= 0 || o.x < B || o.x > W - B || o.y < B || o.y > H - B) { this.killObj(o); break; }
            if (Math.random() < 0.7) this.vfxTrail(o.vfx, o.color, o.x, o.y, 0, 0, o.r >= 3 ? 1.1 : 0.7);
            if (o.tr) { o.tr.push(o.x, o.y); if (o.tr.length > 10) o.tr.splice(0, 2); }
            this.shotExtras(o, ow, dt);
            this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y, o.r + (o.aura || 0)));
            break;
          }
          if (o.ret && o.age > o.retT && ow) {
            if (!o.back) { o.back = true; o.hit = new Map(); }
            const sp = Math.max(120, Math.hypot(o.vx, o.vy)), ax = ow.x - o.x, ay = this.bodyY(ow) - o.y, al = Math.hypot(ax, ay) || 1;
            const k = Math.min(1, 7 * dt);
            o.vx = lerp(o.vx, ax / al * sp, k); o.vy = lerp(o.vy, ay / al * sp, k);
            if (al < 7) { o.dead = true; this.addP('ring', o.x, o.y, 0, 0, 0.2, o.cl, 1, { r0: 1, r1: 6 }); break; }
          } else if (o.homing > 0) {
            const t = ow ? this.nearest(ow) : null;
            if (t) {
              const sp = Math.hypot(o.vx, o.vy) || 1, ax = t.x - o.x, ay = this.bodyY(t) - o.y, al = Math.hypot(ax, ay) || 1;
              const k = Math.min(1, o.homing * 5 * dt);
              o.vx = lerp(o.vx / sp, ax / al, k); o.vy = lerp(o.vy / sp, ay / al, k);
              const nl = Math.hypot(o.vx, o.vy) || 1; o.vx = o.vx / nl * sp; o.vy = o.vy / nl * sp;
            }
          }
          const px = o.x, py = o.y;
          let md = dt;
          if (o.path === 'blink') { md = o.bk >= 0.12 ? o.bk : 0; if (md) o.bk = 0; }
          o.x += o.vx * md; o.y += o.vy * md;
          if (o.latD) { const vl = Math.hypot(o.vx, o.vy) || 1; o.x += -o.vy / vl * o.latD; o.y += o.vx / vl * o.latD; o.latD = 0; }
          if (o.path === 'blink' && md) {
            this.addP('ring', px, py, 0, 0, 0.18, o.cl, 1, { r0: 1, r1: 6 }); this.addP('flash', o.x, o.y, 0, 0, 0.06, '#ffffff', 1.5);
            for (let q = 1; q < 4 && !o.dead; q++) { const qx = px + (o.x - px) * q / 4, qy = py + (o.y - py) * q / 4; this.checkHits(o, (v) => this.bodyHit(v, qx, qy, o.r)); }
            if (o.dead) break;
          }
          if (o.tr) { o.tr.push(o.x, o.y); if (o.tr.length > 10) o.tr.splice(0, 2); }
          if (Math.random() < (o.child ? 0.4 : 0.9)) this.vfxTrail(o.vfx, o.color, o.x, o.y, -o.vx * 0.15, -o.vy * 0.15, o.r >= 3 ? 1.3 : 0.8);
          if (o.missile && Math.random() < 0.8) this.addP('smoke', o.x, o.y, rnd(-6, 6), rnd(-10, 0), 0.5, '#d8d8e8', 1.5);
          if (o.roll && Math.random() < 0.6) this.addP('smoke', o.x + rnd(-o.r, o.r), o.y + o.r, -o.vx * 0.1, -10, 0.5, o.dk, 2);
          if (o.charged && Math.random() < 0.9) this.addP('ring', o.x, o.y, 0, 0, 0.2, o.cl, 1, { r0: 2, r1: 9 });
          let wall = false;
          if (o.x < B || o.x > W - B) { if (o.bounce > 0) { o.bounce--; o.vx = -o.vx; o.x = clamp(o.x, B, W - B); this.vfxImpact(o.vfx, o.color, o.x, o.y, 0.3); } else wall = true; }
          if (!wall && (o.y < B || o.y > H - B)) { if (o.bounce > 0) { o.bounce--; o.vy = -o.vy; o.y = clamp(o.y, B, H - B); this.vfxImpact(o.vfx, o.color, o.x, o.y, 0.3); } else wall = true; }
          if (!wall) {
            const w = this.wallAt(o.x, o.y);
            if (w) {
              if (o.bounce > 0) { o.bounce--; if (px < w.x || px > w.x + w.w) o.vx = -o.vx; else o.vy = -o.vy; o.x = px; o.y = py; this.vfxImpact(o.vfx, o.color, o.x, o.y, 0.3); }
              else wall = true;
            }
          }
          if (!wall) for (const b of objs) if (b.kind === 'barrier' && !b.dead && b.owner !== o.owner && segDist(o.x, o.y + 4, b.ax, b.ay, b.bx, b.by) < 2 + o.r) { wall = true; break; }
          if (wall || o.life <= 0) { this.killObj(o); break; }
          if (o.r0 != null) this.shotExtras(o, ow, dt);
          this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y, o.r + (o.aura || 0)));
          break;
        }
        case 'drop':
          o.fall -= dt;
          if (o.fall > 0 && Math.random() < 0.7) this.vfxTrail(o.vfx, o.color, o.x, o.y - 3 - o.fall * 180, 0, -40, 0.8);
          if (o.fall <= 0 && !o.trig) {
            o.trig = true;
            this.vfxImpact(o.vfx, o.color, o.x, o.y - 2, o.big ? 3 : 1);
            this.decal(o.x, o.y, o.r * 0.7, o.dk);
            this.sfx(o.boom > 0 || o.big ? 'boom' : 'hit', o.vfx);
            this.shake = Math.max(this.shake, o.big ? 6 : 1.5);
            if (o.big) { this.addP('ring', o.x, o.y, 0, 0, 0.45, o.cl, 1, { r0: 4, r1: o.r * 1.6 }); this.punch = Math.max(this.punch, 0.5); for (let k = 0; k < 12; k++) this.addP('smoke', o.x + rnd(-o.r, o.r) * 0.7, o.y + rnd(-o.r, o.r) * 0.5, rnd(-30, 30), rnd(-40, 0), 0.9, '#3a3450', 3); }
            this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y - 2, o.r));
            if (o.boom > 0) { o.dead = true; this.killObj(Object.assign({}, o, { dead: false, kind: 'drop', y: o.y - 2, split: 0 })); }
          }
          break;
        case 'spike':
          if (!o.puffed) { o.puffed = true; this.vfxImpact(o.vfx, o.color, o.x, o.y, 0.5); this.decal(o.x, o.y, 3, o.dk); }
          this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y - 3, o.r));
          break;
        case 'swing': {
          const c = o.follow;
          if (!c.alive) { o.dead = true; break; }
          o.x = c.x; o.y = this.bodyY(c);
          const p = clamp(1 - o.life / o.max, 0, 1), half = o.arc / 2;
          o.cur = o.ang + o.dirS * (-half + o.arc * p);
          const tx2 = o.x + Math.cos(o.cur) * o.r, ty2 = o.y + Math.sin(o.cur) * o.r * 0.8;
          this.vfxTrail(o.vfx, o.color, tx2, ty2, -Math.sin(o.cur) * 40 * o.dirS, Math.cos(o.cur) * 40 * o.dirS, 1);
          if (Math.random() < 0.5) this.addP('px', tx2, ty2, rnd(-20, 20), rnd(-30, 0), 0.25, '#ffffff', 1);
          this.checkHits(o, (v) => {
            const dx = v.x - o.x, dy = this.bodyY(v) - o.y, d = Math.hypot(dx, dy);
            if (d > o.r + 5 * v.size) return false;
            if (o.arc >= Math.PI * 1.9 || d < 7) return true;
            let da = Math.atan2(dy, dx) - o.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
            return Math.abs(da) <= half + 0.3;
          });
          break;
        }
        case 'cone': {
          const c = o.follow;
          if (!c.alive || c.st.stun || c.st.freeze || c.st.sleep) { o.dead = true; break; }
          o.x = c.x; o.y = this.bodyY(c);
          const half = o.arc / 2;
          for (let k = 0; k < 3; k++) {
            const an = o.ang + rnd(-half, half), sp = o.len * rnd(2.2, 3.2);
            this.vfxTrail(o.vfx, k ? o.color : o.cl, o.x + Math.cos(an) * 6, o.y + Math.sin(an) * 6, Math.cos(an) * sp, Math.sin(an) * sp * 0.8, 1.1);
          }
          if (Math.random() < 0.35) { const an = o.ang + rnd(-half, half), d = o.len * rnd(0.7, 1); this.addP('smoke', o.x + Math.cos(an) * d, o.y + Math.sin(an) * d * 0.8, rnd(-10, 10), -12, 0.5, o.color, 2); }
          this.checkHits(o, (v) => {
            const dx = v.x - o.x, dy = this.bodyY(v) - o.y, d = Math.hypot(dx, dy);
            if (d > o.len + 4 * v.size) return false;
            let da = Math.atan2(dy, dx) - o.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
            return d < 8 || Math.abs(da) <= half + 0.15;
          });
          break;
        }
        case 'wave': {
          const p = clamp(1 - o.life / o.max, 0, 1);
          o.prev = o.cur; o.cur = 2 + (o.r - 2) * (1 - (1 - p) * (1 - p));
          for (let k = 0; k < 3; k++) { const an = Math.random() * 6.283; this.addP('px', o.x + Math.cos(an) * o.cur, o.y + Math.sin(an) * o.cur * 0.8, Math.cos(an) * 30, Math.sin(an) * 20 - 20, 0.35, k ? o.color : '#ffffff', 1); }
          if (!o.puffed) { o.puffed = true; this.decal(o.x, o.y + 1, Math.min(14, o.r * 0.3), o.dk); this.sfx('boom', o.vfx); }
          this.checkHits(o, (v) => { const d = Math.hypot(v.x - o.x, (v.y - o.y) / 0.8); if (o.arc) { const da = Math.atan2(v.y - o.y, v.x - o.x) - o.ang; if (Math.abs(Math.atan2(Math.sin(da), Math.cos(da))) > o.arc / 2 + 0.25) return false; } return d <= o.cur + 5 * v.size && d >= o.prev - 8 - 4 * v.size; });
          break;
        }
        case 'chain':
          if (!o.fired) { o.fired = true; this.checkHits(o, (v) => o.path.includes(v.idx)); }
          break;
        /* ===== 추가 공격 30종: 매 프레임 ===== */
        case 'thrust': {
          const c = o.follow;
          if (!c.alive) { o.dead = true; break; }
          o.x = c.x; o.y = this.bodyY(c);
          const p = clamp(1 - o.life / o.max, 0, 1), reach = o.len * Math.min(1, p * 2.6);
          o.reach = reach;
          const x1 = o.x + Math.cos(o.ang) * reach, y1 = o.y + Math.sin(o.ang) * reach;
          if (Math.random() < 0.7) this.vfxTrail(o.vfx, o.color, x1, y1, Math.cos(o.ang) * 60, Math.sin(o.ang) * 60, 0.8);
          this.checkHits(o, (v) => segDist(v.x, this.bodyY(v), o.x, o.y, x1, y1) <= o.w / 2 + 4 * v.size);
          break;
        }
        case 'flurry':
          if (Math.random() < 0.8) this.vfxTrail(o.vfx, o.color, o.x + rnd(-o.r, o.r), o.y + rnd(-o.r, o.r) * 0.8 - 4, rnd(-40, 40), rnd(-40, 40), 1);
          this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= (o.r + 4 * v.size) * (o.r + 4 * v.size));
          break;
        case 'tornado': {
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.x < B + 6 || o.x > W - B - 6) { o.vx = -o.vx; o.x = clamp(o.x, B + 6, W - B - 6); }
          if (o.y < B + 6 || o.y > H - B - 6) { o.vy = -o.vy; o.y = clamp(o.y, B + 6, H - B - 6); }
          for (let k = 0; k < 2; k++) { const an = this.t * 14 + k * 3.14, rr = rnd(2, o.r); this.addP('px', o.x + Math.cos(an) * rr, o.y - rnd(0, 26), -Math.sin(an) * 50, -30, 0.35, k ? o.color : '#ffffff', 1); }
          for (const v of this.fighters) if (v.owned && v.alive && v.idx !== o.owner && !v.st.invuln) { const d = Math.hypot(o.x - v.x, o.y - v.y); if (d < o.r * 2 && d > 2) { v.vx += (o.x - v.x) / d * 220 * dt; v.vy += (o.y - v.y) / d * 220 * dt; } }
          this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= (o.r + 4 * v.size) * (o.r + 4 * v.size));
          break;
        }
        case 'fwall':
          if (Math.random() < 0.9) { const t = Math.random(); this.vfxTrail(o.vfx, o.color, lerp(o.ax, o.bx, t), lerp(o.ay, o.by, t) - 4, 0, -50, 1); }
          this.checkHits(o, (v) => segDist(v.x, v.y, o.ax, o.ay, o.bx, o.by) <= 5 + 3 * v.size);
          break;
        case 'surge': {
          o.x += o.vx * dt; o.y += o.vy * dt;
          const ax = o.x - o.sa * o.hw, ay = o.y + o.ca * o.hw * 0.8, bx = o.x + o.sa * o.hw, by = o.y - o.ca * o.hw * 0.8;
          o.ax = ax; o.ay = ay; o.bx = bx; o.by = by;
          for (let k = 0; k < 3; k++) { const t = Math.random(); this.addP('smoke', lerp(ax, bx, t), lerp(ay, by, t), o.vx * 0.2, -20, 0.4, k ? o.dk : o.color, 2); }
          if (this.wallAt(o.x, o.y - 2)) { o.life = Math.min(o.life, 0.05); }
          this.checkHits(o, (v) => segDist(v.x, v.y, ax, ay, bx, by) <= 6 + 3 * v.size);
          break;
        }
        case 'mark': {
          const t = this.fighters[o.target];
          if (t && t.alive) { o.x = t.x; o.y = t.y; }
          if (!o.trig && o.age >= o.fuse) {
            o.trig = true;
            this.vfxImpact(o.vfx, o.color, o.x, o.y - 6, 1.6);
            this.decal(o.x, o.y + 2, o.r * 0.6, o.dk);
            this.shake = Math.max(this.shake, 3); this.sfx('boom', o.vfx);
            this.checkHits(o, (v) => dist2(v.x, this.bodyY(v), o.x, o.y - 6) <= (o.r + 4 * v.size) * (o.r + 4 * v.size));
          }
          break;
        }
        case 'chargev': {
          const c = o.follow;
          if (!c.alive) { o.dead = true; break; }
          o.x = c.x + Math.cos(o.ang) * 6; o.y = this.bodyY(c) + Math.sin(o.ang) * 6;
          const an = Math.random() * 6.283; this.addP('px', o.x + Math.cos(an) * 18, o.y + Math.sin(an) * 14, -Math.cos(an) * 90, -Math.sin(an) * 70, 0.2, o.cl, 1);
          break;
        }
        case 'storm':
          o.acc -= dt;
          while (o.acc <= 0 && o.k < o.pts.length) {
            o.acc += o.every;
            const [px, py] = o.pts[o.k++], pts = [[px + rnd(-4, 4), py - 90]];
            for (let s2 = 1; s2 < 6; s2++) pts.push([px + rnd(-5, 5), py - 90 + s2 * 18]);
            pts.push([px, py - 3]);
            this.addP('bolt', px, py, 0, 0, 0.12, o.color, 1, { pts });
            this.vfxImpact(o.vfx, o.color, px, py - 3, 0.6); this.decal(px, py + 1, 4, o.dk); this.lightFlash(px, py - 6, 26, o.color);
            this.sfx('hit', 'electric');
            this.checkHits(o, (v) => dist2(v.x, this.bodyY(v), px, py - 3) <= (o.sr + 4 * v.size) * (o.sr + 4 * v.size));
          }
          break;
        case 'slash':
          if (!o.trig && o.age >= o.fuse) {
            o.trig = true;
            this.sfx('hit', 'metal'); this.shake = Math.max(this.shake, 2);
            for (let k = 0; k < 10; k++) { const t = k / 9; this.vfxTrail(o.vfx, o.color, lerp(o.x0, o.x1, t), lerp(o.y0, o.y1, t), rnd(-30, 30), rnd(-30, 30), 1); }
            this.checkHits(o, (v) => segDist(v.x, this.bodyY(v), o.x0, o.y0, o.x1, o.y1) <= 7 + 4 * v.size);
          }
          break;
        case 'whip': {
          const c = o.follow;
          if (!c.alive) { o.dead = true; break; }
          o.x = c.x; o.y = this.bodyY(c);
          const pts = this.whipPts(o);
          o.pts = pts;
          const tip = pts[pts.length - 1];
          if (Math.random() < 0.8) this.vfxTrail(o.vfx, o.color, tip[0], tip[1], 0, 0, 1);
          this.checkHits(o, (v) => { const bx = v.x, by = this.bodyY(v); for (let k = 1; k < pts.length; k++) if (segDist(bx, by, pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]) <= 4 + 4 * v.size) return true; return false; });
          break;
        }
        case 'top': {
          const px = o.x, py = o.y;
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.x < B + 4 || o.x > W - B - 4) { o.vx = -o.vx; o.x = px; }
          if (o.y < B + 4 || o.y > H - B - 4) { o.vy = -o.vy; o.y = py; }
          const w = this.wallAt(o.x, o.y - 2);
          if (w) { if (px < w.x || px > w.x + w.w) o.vx = -o.vx; else o.vy = -o.vy; o.x = px; o.y = py; this.vfxImpact(o.vfx, o.color, o.x, o.y - 3, 0.3); }
          if (Math.random() < 0.6) this.addP('px', o.x + rnd(-3, 3), o.y, rnd(-30, 30), rnd(-10, 0), 0.25, o.cl, 1);
          this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y - 3, o.r));
          break;
        }
        case 'beacon':
          o.pulse -= dt;
          if (o.pulse <= 0) {
            o.pulse = o.rate;
            this.objs.push({ uid: o.uid + 'w' + (o.pn++), owner: o.owner, kind: 'wave', dmg: o.dmg, mul: o.mul, st: o.st, kb: o.kb, color: o.color, cl: o.cl, dk: o.dk, rows: o.rows, gm: o.gm, vfx: o.vfx, hit: new Map(), age: 0, rehit: 0, delay: 0, x: o.x, y: o.y, r: o.r, cur: 2, prev: 0, life: 0.42, max: 0.42 });
          }
          break;
        case 'bite':
          if (!o.trig && o.age >= o.fuse) {
            o.trig = true;
            this.shake = Math.max(this.shake, 3); this.sfx('hit', 'metal'); this.punch = Math.max(this.punch, 0.5);
            for (let k = 0; k < 10; k++) this.addP('px', o.x + rnd(-o.r, o.r) * 0.6, o.y + rnd(-4, 4), rnd(-60, 60), rnd(-80, 0), 0.4, k & 1 ? '#ffffff' : o.color, 1);
            this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y, o.r));
          }
          break;
        case 'runner':
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.x < B || o.x > W - B || o.y < B || o.y > H - B) { o.dead = true; break; }
          if (Math.random() < 0.6) this.addP('smoke', o.x - o.vx * 0.04 + rnd(-3, 3), o.y + 2, -o.vx * 0.1, rnd(-14, -4), 0.45, '#8a7a6a', 1.5 + o.r * 0.15);
          this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y - o.r * 0.6, o.r));
          break;
        case 'pillar':
          if (!o.trig) {
            o.trig = true;
            this.decal(o.x, o.y + 2, o.r * 0.7, o.dk); this.vfxImpact(o.vfx, o.color, o.x, o.y - 6, 0.7);
            for (let k = 0; k < 5; k++) this.addP('px', o.x + rnd(-o.r, o.r) * 0.7, o.y, rnd(-30, 30), -rnd(60, 140), 0.4, k & 1 ? o.cl : o.dk, 1);
            this.shake = Math.max(this.shake, 1.5); this.sfx('hit', o.vfx);
            this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= (o.r + 4 * v.size) * (o.r + 4 * v.size));
          }
          break;
        case 'lgrid':
          if (!o.trig && o.age >= o.fuse) {
            o.trig = true;
            this.shake = Math.max(this.shake, 3); this.sfx('bighit'); this.lightFlash(o.x, o.y - 5, 50, o.color);
            for (const sg of o.segs) for (let k = 0; k < 6; k++) { const t = Math.random(); this.addP('px', lerp(sg[0], sg[2], t), lerp(sg[1], sg[3], t), rnd(-40, 40), rnd(-40, 40), 0.3, '#ffffff', 1); }
            this.checkHits(o, (v) => o.segs.some((sg) => segDist(v.x, this.bodyY(v), sg[0], sg[1], sg[2], sg[3]) <= 5 + 4 * v.size));
          }
          break;
        case 'hopper': {
          if (o.hk >= o.hops) { o.h = 0; break; }
          if (o.ht === 0) {
            const t = ow && this.pickTarget(ow, o.x, o.y, o.ang, 260, false);
            const an = t ? Math.atan2(t.y - o.y, t.x - o.x) : o.ang, dd = t ? Math.min(70, Math.hypot(t.x - o.x, t.y - o.y)) : 55;
            o.ang = an; o.x0 = o.x; o.y0 = o.y; o.x1 = clamp(o.x + Math.cos(an) * dd, B + 6, W - B - 6); o.y1 = clamp(o.y + Math.sin(an) * dd, B + 8, H - B - 4);
          }
          o.ht += dt;
          const p = clamp(o.ht / o.hdur, 0, 1);
          o.x = lerp(o.x0, o.x1, p); o.y = lerp(o.y0, o.y1, p); o.h = Math.sin(p * Math.PI) * (22 + o.r * 0.5);
          if (p >= 1) {
            o.ht = 0; o.hk++; o.hit.clear(); o.h = 0;
            this.addP('ring', o.x, o.y + 2, 0, 0, 0.35, o.cl, 1, { r0: 3, r1: o.r * 1.4 }); this.decal(o.x, o.y + 2, o.r * 0.5, o.dk);
            this.shake = Math.max(this.shake, 2.5); this.sfx('boom', o.vfx);
            this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= (o.r + 4 * v.size) * (o.r + 4 * v.size));
          }
          break;
        }
        case 'swarm': {
          const t = ow && this.pickTarget(ow, o.x, o.y, 0, 400, false);
          if (t) { const dx = t.x - o.x, dy = this.bodyY(t) - o.y, d = Math.hypot(dx, dy) || 1; o.x += dx / d * o.speed * dt; o.y += dy / d * o.speed * dt; }
          this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y, o.r));
          break;
        }
        case 'btrap': {
          const f = this.fighters[o.fid];
          if (!f || !f.alive) { o.dead = true; break; }
          o.x = f.x; o.y = this.bodyY(f) - 4;
          if (o.life <= dt * 1.5 && !o.popd) { o.popd = true; for (let k = 0; k < 10; k++) { const an = k / 10 * 6.28; this.addP('px', o.x + Math.cos(an) * 12, o.y + Math.sin(an) * 12, Math.cos(an) * 70, Math.sin(an) * 70, 0.3, k & 1 ? '#ffffff' : o.cl, 1); } this.sfx('tick'); }
          break;
        }
        case 'grab':
          if (!o.trig && o.age >= o.fuse) {
            o.trig = true;
            this.shake = Math.max(this.shake, 3); this.sfx('boom', o.vfx); this.decal(o.x, o.y + 2, o.r * 0.6, o.dk);
            for (let k = 0; k < 8; k++) this.addP('px', o.x + rnd(-o.r, o.r), o.y, rnd(-40, 40), -rnd(40, 120), 0.4, k & 1 ? o.cl : '#3a3450', 1);
            this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= (o.r + 4 * v.size) * (o.r + 4 * v.size));
          }
          break;
        case 'crack':
          if (o.gone < o.len) {
            const stp = o.speed * dt; o.gone += stp;
            o.x = clamp(o.x + Math.cos(o.ang) * stp, B + 2, W - B - 2); o.y = clamp(o.y + Math.sin(o.ang) * stp, B + 4, H - B - 2);
            const last = o.pts[o.pts.length - 1];
            if (Math.hypot(o.x - last[0], o.y - last[1]) > 7) o.pts.push([o.x + rnd(-3, 3), o.y + rnd(-3, 3)]);
            if (Math.random() < 0.8) this.addP('px', o.x + rnd(-4, 4), o.y, rnd(-20, 20), -rnd(40, 110), 0.35, Math.random() < 0.5 ? o.color : '#5a4a3a', 1);
            this.shake = Math.max(this.shake, 1.2);
            this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= (o.r + 4 * v.size) * (o.r + 4 * v.size));
          }
          break;
        case 'snipe':
          if (!o.trig && o.age >= o.fuse) {
            o.trig = true;
            const x1 = o.x + Math.cos(o.ang) * o.len, y1 = o.y + Math.sin(o.ang) * o.len;
            this.shake = Math.max(this.shake, 3); this.sfx('bighit'); this.lightFlash(o.x, o.y, 40, o.color);
            for (let k = 0; k < 12; k++) { const t = Math.random(); this.addP('streak', lerp(o.x, x1, t), lerp(o.y, y1, t), Math.cos(o.ang) * 200, Math.sin(o.ang) * 200, 0.25, '#ffffff', 1); }
            this.checkHits(o, (v) => segDist(v.x, this.bodyY(v), o.x, o.y, x1, y1) <= o.w / 2 + 4 * v.size);
          }
          break;
        case 'drain': {
          const c = o.follow, t = this.fighters[o.target];
          if (!c.alive || !t || !t.alive || Math.hypot(t.x - c.x, t.y - c.y) > o.range * 1.35) { o.dead = true; break; }
          o.x = c.x; o.y = this.bodyY(c);
          if (Math.random() < 0.6) { const k = Math.random(); this.addP('px', lerp(t.x, c.x, k), lerp(this.bodyY(t), o.y, k), (c.x - t.x) * 1.5, (o.y - this.bodyY(t)) * 1.5, 0.2, o.cl, 1); }
          this.checkHits(o, (v) => v.idx === o.target);
          if (c.owned && o.healAmt > 0) { o.hacc += dt; if (o.hacc >= o.every) { o.hacc -= o.every; this.heal(c, o.healAmt, true); } }
          break;
        }

        case 'beam': {
          const c = o.follow;
          if (!c.alive) { o.dead = true; break; }
          o.x = c.x; o.y = this.bodyY(c);
          if (o.sweep) o.ang = o.ang0 + (clamp(o.age / o.dur, 0, 1) - 0.5) * o.sweep;
          const ca = Math.cos(o.ang), sa = Math.sin(o.ang);
          const x0 = o.both ? o.x - ca * o.len : o.x, y0 = o.both ? o.y - sa * o.len : o.y;
          const x1 = o.x + ca * o.len, y1 = o.y + sa * o.len;
          if (Math.random() < 0.9) { const t = Math.random(); this.vfxTrail(o.vfx, o.color, lerp(o.x, x1, t), lerp(o.y, y1, t), -sa * rnd(-30, 30), ca * rnd(-30, 30), 1); }
          if (Math.random() < 0.5) this.vfxImpact(o.vfx, o.color, x1, y1, 0.25);
          this.checkHits(o, (v) => segDist(v.x, this.bodyY(v), x0, y0, x1, y1) <= o.w / 2 + 4 * v.size);
          break;
        }
        case 'blast':
          if (!o.trig) {
            if (Math.random() < 0.6) { const an = Math.random() * 6.28; this.addP('px', o.x + Math.cos(an) * o.r, o.y + Math.sin(an) * o.r, -Math.cos(an) * o.r * 2, -Math.sin(an) * o.r * 2, 0.3, o.color, 1); }
            if (o.age >= o.delay0) {
              o.trig = true; o.trigAge = o.age;
              this.vfxImpact(o.vfx, o.color, o.x, o.y, Math.min(3, 0.6 + o.r / 18));
              for (let k = 0; k < Math.min(10, o.r / 3); k++) this.addP('smoke', o.x + rnd(-o.r, o.r) * 0.6, o.y + rnd(-o.r, o.r) * 0.5, rnd(-20, 20), rnd(-24, 0), 0.7 + Math.random() * 0.4, o.vfx === 'holy' ? '#fff7c2' : '#3a3450', 2 + o.r / 12);
              this.decal(o.x, o.y + 3, o.r * 0.6, o.dk);
              this.shake = Math.max(this.shake, Math.min(5, o.r / 9));
              this.sfx('boom', o.vfx);
              if (o.land) { this.addP('ring', o.x, o.y + 4, 0, 0, 0.45, o.cl, 1, { r0: 4, r1: o.r * 1.5 }); this.shake = Math.max(this.shake, 4); }
              this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y, o.r));
            }
          }
          break;
        case 'zone': {
          if (o.follow) { if (!o.follow.alive) { o.dead = true; break; } o.x = o.follow.x; o.y = o.follow.y - 1; }
          if (o.pull) for (const v of this.fighters) if (v.owned && v.alive && v.idx !== o.owner && !v.st.invuln) { const d = Math.hypot(o.x - v.x, o.y - v.y); if (d < o.r * 1.5 && d > 3) { v.vx += (o.x - v.x) / d * o.pull * 9 * dt; v.vy += (o.y - v.y) / d * o.pull * 9 * dt; } }
          if (o.ring) { if (o.dmg > 0 || o.st) this.checkHits(o, (v) => Math.abs(Math.hypot(v.x - o.x, (v.y - o.y) / 0.8) - o.r) <= o.ring + 3 * v.size); }
          else if (o.dmg > 0 || o.st) this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= (o.r + 3 * v.size) * (o.r + 3 * v.size));
          if (o.heal > 0 && ow && ow.owned && ow.alive && dist2(ow.x, ow.y, o.x, o.y) <= o.r * o.r) {
            o.healT = (o.healT || 0) + dt;
            if (o.healT >= 0.5) { o.healT -= 0.5; this.heal(ow, o.heal, true); }
          }
          if (!o.aura && Math.random() < 0.15 + o.r / 120) { const an = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * o.r; this.vfxTrail(o.vfx, o.color, o.x + Math.cos(an) * rr, o.y + Math.sin(an) * rr, 0, -10, 1); }
          break;
        }
        case 'trailgen': {
          const c = o.follow;
          if (!c.alive) { o.dead = true; break; }
          o.acc += dt;
          if (o.acc >= 0.15) {
            o.acc -= 0.15;
            this.objs.push({ uid: o.uid + 'z' + (o.cnt++), owner: o.owner, kind: 'zone', x: c.x, y: c.y - 1, r: o.pr, life: o.plife, max: o.plife, dmg: o.dmg, mul: o.mul, st: o.st, kb: 0, color: o.color, cl: o.cl, dk: o.dk, rows: o.rows, gm: o.gm, vfx: o.vfx, hit: new Map(), age: 0, rehit: 0.5, delay: 0, heal: 0, puddle: true });
          }
          break;
        }
        case 'turret':
          if (ow && ow.owned && ow.alive) {
            o.fireT -= dt;
            if (o.fireT <= 0) {
              o.fireT = 1 / o.rate;
              const t = this.nearest(ow);
              if (t && dist2(t.x, t.y, o.x, o.y) < 170 * 170) {
                const ax = t.x - o.x, ay = this.bodyY(t) - (o.y - 5), al = Math.hypot(ax, ay) || 1;
                const ev = ['s', o.owner, o.slot, o.fx, o.uid + 's' + (o.shots++), Math.round(o.x), Math.round(o.y - 5), Math.round(ax / al * 220), Math.round(ay / al * 220)];
                this.emit(ev); this.spawnSub(ev);
              }
            }
          }
          { const t = ow ? this.nearest(ow) : null; if (t) o.aimA = Math.atan2(t.y - o.y, t.x - o.x); }
          break;
        case 'chaser': {
          const t = ow ? this.nearest(ow) : null;
          if (t) {
            const dx = t.x - o.x, dy = t.y - o.y, l = Math.hypot(dx, dy) || 1;
            o.vx = approach(o.vx, dx / l * 74, 420 * dt); o.vy = approach(o.vy, dy / l * 74, 420 * dt);
            o.d = dx < 0 ? -1 : 1;
          }
          o.x += o.vx * dt; o.y += o.vy * dt;
          this.solid(o, 3, false);
          if (Math.random() < 0.3) this.vfxTrail(o.vfx, o.color, o.x, o.y - 3, 0, 0, 0.6);
          if (o.clone != null) {
            if (t && dist2(t.x, t.y, o.x, o.y) < 100) { this.killObj(o); this.shake = Math.max(this.shake, 2); }
            break;
          }
          this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y - 3, o.r));
          break;
        }
        case 'orbit': {
          const c = o.follow;
          if (!c.alive) { o.dead = true; break; }
          o.ang += dt * 4.6;
          const rr = 13 * c.size;
          o.x = c.x + Math.cos(o.ang) * rr; o.y = this.bodyY(c) + Math.sin(o.ang) * rr * 0.75;
          if (Math.random() < 0.4) this.vfxTrail(o.vfx, o.color, o.x, o.y, 0, 0, 0.6);
          this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y, o.r));
          break;
        }
        case 'pest': {
          const t = this.fighters[o.target];
          if (!t || !t.alive) { o.life = 0; break; }
          const dx = t.x - o.x, dy = t.y - o.y, l = Math.hypot(dx, dy) || 1;
          o.x += dx / l * 78 * dt + Math.sin(this.t * 7 + o.hop * 6) * 20 * dt; o.y += dy / l * 78 * dt;
          o.d = dx < 0 ? -1 : 1;
          if (t.owned && this.t - (o.last || -9) > o.rehit && this.bodyHit(t, o.x, o.y - 4, 3)) {
            o.last = this.t;
            if (o.dmg > 0) { const ev = ['h', o.uid, t.idx, o.dmg, Math.round(t.x), Math.round(this.bodyY(t)), 0, 0]; this.emit(ev); this.onEvent(ev); this.damage(t, o.dmg, -1); }
            if (o.st) this.addStatus(t, o.st.k, o.st.d, 0, false);
            t.vx += dx / l * 60; t.vy += dy / l * 60;
          }
          break;
        }
        case 'mine':
          o.arm -= dt;
          if (o.arm <= 0) this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= o.r * o.r);
          break;
      }
      if (o.life <= 0 && !o.dead) {
        if (o.kind === 'mine' || o.kind === 'turret' || o.kind === 'chaser' || o.kind === 'barrier' || o.kind === 'top' || o.kind === 'beacon') this.vfxImpact(o.vfx, o.color, o.x, o.y - 3, 0.5);
        if (o.clone != null) { this.killObj(o); continue; }
        o.dead = true;
      }
    }
    for (let i = objs.length - 1; i >= 0; i--) if (objs[i].dead) objs.splice(i, 1);
  }

  /* ---------- 맞기 (맞는 쪽 기기가 판정) ---------- */
  takeHit(v, o) {
    const a = this.fighters[o.owner];
    o.hit.set(v.idx, this.t);
    const single = (o.kind === 'shot' && !o.pierce) || o.kind === 'mine';
    if (v.invT > 0 || v.st.invuln) { this.note(v, '무적', '#fff3a0'); if (single) this.sendHit(o, v, 0, 1, 2); return; }
    if (v.spec.passive && v.spec.passive.k === 'dodge' && Math.random() < 0.15) { this.note(v, '회피!', '#eaffff', true); return; }
    if (v.st.counter && a && a !== v && o.kind !== 'zone' && o.kind !== 'all' && o.kind !== 'orbit') {
      // 반격 자세: 맞는 순간 막고 그대로 되돌려 준다
      delete v.st.counter;
      this.note(v, '반격!', ST_COLOR.counter, true);
      this.vfxImpact('metal', '#ffffff', v.x, this.bodyY(v), 1.4);
      this.bursts.push({ x: v.x, y: v.y - 20, text: pick(['반사 신경!', '어림없지!', '역관광!', '카운터!']), color: '#ffffff', t: 0, life: 0.8, rot: rnd(-0.2, 0.2), big: true });
      const ev = ['r', o.owner, r1(Math.max(10, o.dmg * o.mul * 1.3)), 1];
      this.emit(ev); this.onEvent(ev);
      v.invT = Math.max(v.invT, 0.35);
      this.sendHit(o, v, 0, single ? 1 : 0, 2);
      return;
    }
    if (v.st.reflect && o.kind === 'shot') {
      this.note(v, '반사!', ST_COLOR.reflect, true);
      const ev = ['r', o.owner, r1(o.dmg * o.mul * 0.6), 1];
      this.emit(ev); this.onEvent(ev);
      this.sendHit(o, v, 0, 1, 2);
      return;
    }
    if (a && a.hfoe && a.hfoe[o.slotN] && Math.random() * 100 < a.hfoe[o.slotN] && o.dmg > 0) {
      const amt = r1(o.dmg * o.mul);
      this.heal(v, amt, true);
      this.note(v, '적 치료!', '#7dff8a', true);
      this.sendHit(o, v, 0, single ? 1 : 0, 3);
      return;
    }
    let wk = 1, wdie = false, wst = null;
    for (const x of v.weaks) if (x.vfx.includes(o.vfx)) { wk *= 1 + x.pct / 100; if (x.die) wdie = true; if (x.st) wst = x.st; }
    if (wk > 1 && o.dmg > 0) this.note(v, '약점!', '#ff8a5a', true);
    const tm = wk * v.base.taken * (1 + v.stack.taken) * (v.st.vuln ? 1.4 : 1) * (v.st.armor ? 0.5 : 1) * (v.spec.passive && v.spec.passive.k === 'armor' ? 0.85 : 1);
    let dmg = o.dmg * o.mul * tm;
    if (v.st.shield && v.stPow.shield > 0 && dmg > 0) {
      const ab = Math.min(dmg, v.stPow.shield);
      v.stPow.shield -= ab; dmg -= ab;
      if (v.stPow.shield <= 0) { delete v.st.shield; delete v.stPow.shield; }
      if (dmg <= 0) this.note(v, '막음', ST_COLOR.shield);
    }
    dmg = Math.round(dmg * 10) / 10;
    if (a && a.dmgFix != null) { const fd = typeof a.dmgFix === 'number' ? a.dmgFix : a.dmgFix[o.slotN]; if (fd != null && o.dmg > 0) dmg = fd; }
    if (wdie && o.dmg > 0) { dmg = v.hp + 1; this.note(v, '닿으면 죽음!', '#ff4d6d', true); }
    if (wst) this.addStatus(v, wst.k, wst.d, 0, false);
    const soft = o.kind === 'zone' || o.kind === 'orbit' || o.kind === 'cone';
    if (dmg > 0 || o.kb) {
      let dx, dy;
      if (o.kind === 'shot') { dx = o.vx; dy = o.vy; }
      else if (o.kind === 'beam') { dx = Math.cos(o.ang); dy = Math.sin(o.ang); if (o.both && (v.x - o.x) * dx + (v.y - o.y) * dy < 0) { dx = -dx; dy = -dy; } }
      else if (o.kind === 'grab' && a) { dx = a.x - v.x; dy = a.y - v.y; }
      else if ((o.kind === 'hb' || o.kind === 'all' || o.kind === 'swing' || o.kind === 'cone' || o.kind === 'chain') && a) { dx = v.x - a.x; dy = v.y - a.y; }
      else { dx = v.x - o.x; dy = this.bodyY(v) - o.y; }
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      if (o.kb) { const s = o.kb * KB / Math.sqrt(v.size) * (v.base.kb || 1); v.vx = dx * s; v.vy = dy * s; }
      if (!soft) { v.hurtT = Math.max(v.hurtT, 0.12 + Math.abs(o.kb) * 0.015); v.wind = null; v.dash = null; }
      v.flashT = 0.12;
    }
    if (o.st) { if (o.st.k === 'morph') v.morph = { gm: o.gm || { shape: 'paw' }, color: o.color }; this.addStatus(v, o.st.k, o.st.d, 0, true); }
    if (dmg > 0 && v.st.sleep) { delete v.st.sleep; this.note(v, '깼다!', '#ffffff', true); }
    if (dmg > 0) {
      for (const d of v.dbs) if (d.fx.t === 'hurtst' && Math.random() < d.fx.chance / 100) { this.addStatus(v, d.fx.st.k, d.fx.st.d, 0, false); this.trig(v, d); }
      for (const d of v.dbs) if (d.fx.t === 'stack' && d.fx.hit) { const x = d.fx, cap = x.stat === 'slow' ? 0.5 : 0.8; v.stack[x.stat] = clamp(v.stack[x.stat] + x.pct / 100, -0.5, cap); }
      for (const A of v.acts) { const x = v.dbs[A.i].fx; if (!x.hit) continue; if (x.nth) { A.k = (A.k || 0) + 1; if (A.k % x.nth) continue; } if (A.cd <= 0) { this.doAct(v, A.i); A.cd = x.nth ? 0.3 : 1.2; } }
      if (v.spec.passive && v.spec.passive.k === 'thorns' && a && dist2(a.x, a.y, v.x, v.y) < 40 * 40) { const ev = ['r', a.idx, 3, 2]; this.emit(ev); this.onEvent(ev); }
    }
    this.sendHit(o, v, dmg, single ? 1 : 0, 0);
    if (dmg > 0) this.damage(v, dmg, o.owner);
  }
  sendHit(o, v, dmg, kill, flags) {
    const ev = ['h', o.uid, v.idx, dmg, Math.round(v.x), Math.round(this.bodyY(v)), kill, flags];
    this.emit(ev); this.onEvent(ev);
  }
  damage(v, dmg, by) {
    if (!v.alive) return;
    v.hp -= dmg; v.hitT = this.t;
    if (v.hp > 0) return;
    if (this.practice) {
      if (v.dummy) {
        v.hp = v.maxHp;
        this.bursts.push({ x: v.x, y: v.y - 24, text: pick(['벌떡!', '부활!', '안 아파!', '한 번 더!']), color: '#ffcf3a', t: 0, life: 0.9, rot: rnd(-0.2, 0.2), big: true });
        this.vfxImpact('holy', '#ffcf3a', v.x, this.bodyY(v), 1.2);
        this.sfx('boom', 'cute');
      } else { v.hp = 1; if (v.sayCd <= 0) { v.say = { text: '연습이라 안 죽음', t: 1.4 }; v.sayCd = 2; } }
      return;
    }
    if (v.spec.passive && v.spec.passive.k === 'revive' && !v.revived) {
      v.revived = true; v.hp = Math.round(v.maxHp * 0.3); v.invT = 1.5;
      this.note(v, '부활!', '#fff7c2', true);
      return;
    }
    v.hp = 0;
    const ev = ['k', v.idx, by];
    this.emit(ev); this.onEvent(ev);
  }
  heal(f, amt, quiet) {
    if (!f.alive || f.hp >= f.maxHp) return;
    if (f.noHeal) { if (!quiet && f.owned) this.note(f, '회복 못 함', '#c5f24a'); return; }
    f.hp = Math.min(f.maxHp, f.hp + amt);
    if (f.owned && amt >= 1) this.dEv(f, 'heal');
    if (!quiet || Math.random() < 0.5) this.pop(f.x + rnd(-4, 4), f.y - 12 * f.size, '+' + Math.round(amt), '#7dff8a', 0.8, 0.9);
    if (!quiet) this.sfx('heal');
  }
  addStatus(f, k, d, pow, fromEnemy) {
    if (!f.alive) return;
    if (f.blockSt && f.blockSt.has(k)) { if (f.owned) this.note(f, (ST_KO[k] || k) + ' 안 됨', '#c5f24a'); return; }
    const hard = HARD_ST.includes(k);
    if (fromEnemy && hard) {
      if (f.tenT > 0) { this.note(f, '저항', '#d8d0f0'); return; }
      f.tenT = d + 1.6;
    }
    const fresh = !(f.st[k] > 0.3);
    f.st[k] = Math.max(f.st[k] || 0, d);
    if (fresh && f.owned) { if (fromEnemy && DEBUFFS.includes(k)) this.dEv(f, 'debuff'); else if (BUFFS.includes(k)) this.dEv(f, 'buff'); }
    if (k === 'shield') f.stPow.shield = Math.max(f.stPow.shield || 0, pow || 25);
    if (k === 'regen') f.stPow.regen = pow || 4;
    if (hard) { f.wind = null; f.dash = null; }
    if (fresh) this.note(f, ST_KO[k], ST_COLOR[k], true);
  }
  onKO(idx, by) {
    const v = this.fighters[idx];
    if (!v || !v.alive) return;
    if (this.practice) { v.hp = v.maxHp; return; }
    v.alive = false; v.hp = 0; v.koT = 0; v.st = {}; v.wind = null; v.dash = null; v.pose = 'ko';
    const k = this.fighters[by];
    if (k && k !== v) k.stats.ko++;
    if (k && k !== v && k.owned) this.dEv(k, 'kill');
    for (const g of this.fighters) if (g !== v && g !== k && g.owned && g.alive) this.dEv(g, 'ally');
    this.feed.unshift({ a: k && k !== v ? k : null, b: v, t: 5 });
    if (this.feed.length > 4) this.feed.pop();
    this.vfxImpact('holy', v.color, v.x, this.bodyY(v), 2.2);
    this.addP('pat', v.x, v.y - 8, 0, -14, 1.6, '#ffffff', 1, { pat: 'ghost', sway: 1 });
    this.pop(v.x, v.y - 18, 'K.O.', '#ff4d6d', 1.4, 1.5);
    this.bursts.push({ x: v.x, y: v.y - 28, text: pick(KO_ANN), color: '#ff4d6d', t: 0, life: 1.2, rot: rnd(-0.15, 0.15), big: true });
    if (!this.firstKO && k && k !== v) { this.firstKO = true; this.banner = { text: '첫 킬!', color: '#ffcf3a', t: 1.2, max: 1.2, who: k.name }; }
    this.punch = 1; this.slowT = 0.35;
    if (v.spec.lines && v.spec.lines.ko) Voice.say(v.spec.lines.ko, v.seed / 10, true);
    if (v.spec.lines && v.spec.lines.ko) v.say = { text: v.spec.lines.ko, t: 2.4 };
    this.shake = 6; this.flash = { c: '#ffffff', t: 0.18, max: 0.18, a: 0.5 }; this.hs = Math.max(this.hs, 0.12);
    this.decal(v.x, v.y, 6, '#1a1026');
    this.sfx('ko');
  }

  onEvent(ev) {
    if (!Array.isArray(ev)) return;
    switch (ev[0]) {
      case 'h': {
        const uid = String(ev[1]), v = this.fighters[ev[2] | 0];
        const dmg = clamp(+ev[3] || 0, 0, 200), x = +ev[4] || 0, y = +ev[5] || 0;
        const a = this.fighters[parseInt(uid, 10)];
        const o = this.objs.find((q) => q.uid === uid);
        const color = o ? o.color : a ? a.spec.look.accent : '#ffffff';
        if (dmg > 0) {
          if (a) a.stats.dealt += dmg;
          if (v) v.stats.taken += dmg;
          const soft = o && (o.kind === 'zone' || o.kind === 'orbit');
          if (!soft) {
            this.addP('pat', x, y, 0, 0, 0.08, '#ffffff', 1, { pat: 'plus', big: true });
            const st = o ? o.vfx : 'plain';
            if (v && (!v.onoT || this.t - v.onoT > 0.18)) {
              v.onoT = this.t;
              const words = dmg >= 18 ? ONO_BIG : ONO[st] || ONO.plain;
              this.bursts.push({ x: x + rnd(-4, 4), y: y - 6, text: pick(words), color: dmg >= 18 ? '#ffcf3a' : color, t: 0, life: dmg >= 18 ? 0.75 : 0.55, rot: rnd(-0.25, 0.25), big: dmg >= 18 });
              if (this.bursts.length > 10) this.bursts.shift();
            }
            if (a && a !== v) {
              a.comboN = (a.comboT > 0 ? a.comboN || 0 : 0) + 1; a.comboT = 1.6;
              if (a.comboN >= 3) {
                const txt = COMBO_ANN[a.comboN] || a.comboN + '연타!', cc = a.comboN >= 8 ? '#ff4d6d' : a.comboN >= 5 ? '#ffcf3a' : '#f6edd9', sc = Math.min(1.8, 0.9 + a.comboN * 0.07);
                const cp = a.comboPop;
                if (cp && this.pops.includes(cp)) Object.assign(cp, { x: a.x, y: a.y - 22, text: txt, color: cc, s: sc, t: 0, life: COMBO_ANN[a.comboN] ? 1.1 : 0.7 });
                else a.comboPop = this.pop(a.x, a.y - 22, txt, cc, 0.7, sc);
                this.sfx('combo', null, { n: a.comboN });
              }
            }
            if (dmg >= 14) { this.sfx('bighit'); this.punch = Math.max(this.punch, 0.45); }
            this.vfxImpact(o ? o.vfx : 'plain', color, x, y, Math.min(1.6, 0.5 + dmg / 18));
            this.shake = Math.max(this.shake, Math.min(4, 0.8 + dmg * 0.12));
            if (dmg >= 12) this.hs = Math.max(this.hs, 0.05);
          } else this.addP('px', x + rnd(-3, 3), y + rnd(-3, 3), 0, -10, 0.25, color, 1);
          this.pop(x + rnd(-3, 3), y - 8, String(Math.round(dmg)), dmg >= 18 ? '#ffcf3a' : soft ? '#d8d0f0' : '#ffffff', soft ? 0.5 : 0.75, dmg >= 18 ? 1.3 : soft ? 0.75 : 1);
          this.sfx(soft ? 'tick' : 'hit', o ? o.vfx : 'plain');
          if (v && !v.owned) v.flashT = 0.12;
          if (a && a.owned && a.alive && a.spec.passive && a.spec.passive.k === 'lifesteal') this.heal(a, dmg * 0.2, true);
          if (a && a !== v && a.owned) this.dEv(a, 'hitfoe');
          if (o) o.landed = true;
        }
        if (o && o.st && o.st.k === 'morph' && v) v.morph = { gm: o.gm || { shape: 'paw' }, color: o.color };
        if (ev[6] && o) { if (o.kind === 'shot') { o.x = x; o.y = y; } this.killObj(o, ev[2] | 0); }
        break;
      }
      case 'k': this.onKO(ev[1] | 0, ev[2] | 0); break;
      case 'r': {
        const f = this.fighters[ev[1] | 0], dmg = clamp(+ev[2] || 0, 0, 60);
        if (f && f.alive) {
          this.pop(f.x, f.y - 12 * f.size, '-' + Math.round(dmg), '#ff9ad0', 0.8);
          this.vfxImpact('arcane', '#ff9ad0', f.x, this.bodyY(f), 0.5);
          if (f.owned) { f.flashT = 0.12; this.damage(f, dmg, -1); }
        }
        break;
      }
      case 'x': {
        const f = this.fighters[ev[1] | 0], k = ST_ALL[ev[2] | 0];
        if (f && f.alive) { this.vfxImpact('arcane', ST_COLOR[k] || '#c5f24a', f.x, this.bodyY(f), 0.5); if (f.owned && k) this.addStatus(f, k, clamp(+ev[3] || 1, 0.3, 5), 4, DEBUFFS.includes(k)); }
        break;
      }
      case 'g': { const f = this.fighters[ev[1] | 0]; if (f && f.owned) this.heal(f, clamp(+ev[2] || 0, 0, 80)); break; }
      case 'm': { const f = this.fighters[ev[1] | 0]; if (f && f.alive) { const dx = (+ev[2] || 0) - f.x, dy = (+ev[3] || 0) - f.y, l = Math.hypot(dx, dy) || 1, s = (+ev[4] > 0 ? 1 : -1) * Math.min(340, 120 + l * 2); this.addP('ring', f.x, this.bodyY(f), 0, 0, 0.25, '#ffffff', 1, { r0: 2, r1: 12 }); if (f.owned) { f.vx = dx / l * s; f.vy = dy / l * s; f.hurtT = Math.max(f.hurtT, 0.3); f.dash = null; } } break; }
      case 'b': {
        const f = this.fighters[ev[1] | 0], k = ST_ALL[ev[2] | 0];
        if (f && f.owned && k && BUFFS.includes(k)) this.addStatus(f, k, clamp(+ev[3] || 1, 0.5, 4), clamp(+ev[4] || 0, 0, 30), false);
        break;
      }
      case 't': { const f = this.fighters[ev[1] | 0]; if (f) { f.say = { text: str(String(ev[2]), 16, ''), t: ev[3] === 2 ? 1.8 : ev[3] === 3 ? 1.9 : 1.6, side: ev[3] !== 2 && ev[3] !== 3, shout: ev[3] === 2 || ev[3] === 3 }; if (ev[3] === 2) Voice.say(f.say.text, f.seed / 10); if (ev[3] === 3) this.actFx(f, String(ev[4] || ''), String(ev[5] || '')); } break; }
      case 'q': { const f = this.fighters[ev[1] | 0]; if (f && !f.owned) this.spawnPest(ev); break; }
      case 'p': { const f = this.fighters[ev[1] | 0]; if (f) this.pop(f.x, f.y - 14 * f.size, str(String(ev[2]), 10, ''), col(ev[3], '#ffffff'), 0.8, 0.85); break; }
    }
  }
  onRemote(ev) {
    if (!Array.isArray(ev)) return;
    if (ev[0] === 'a') { const c = this.fighters[ev[1]]; if (c && !c.owned) this.spawnAct(ev); }
    else if (ev[0] === 'q') { const c = this.fighters[ev[1]]; if (c && !c.owned) this.spawnPest(ev); }
    else if (ev[0] === 's') { const c = this.fighters[ev[1]]; if (c && !c.owned) this.spawnSub(ev); }
    else this.onEvent(ev);
  }

  /* ---------- 입자와 연출 ---------- */
  addP(k, x, y, vx, vy, life, c, s, ex) {
    if (this.parts.length > 620) return null;
    const p = { k, x, y, z: 0, vx, vy, vz: 0, g: 0, life, max: life, c, s: s || 1, drag: 0 };
    if (ex) Object.assign(p, ex);
    this.parts.push(p);
    return p;
  }
  decal(x, y, r, c) {
    if (this.decals.length > 40) this.decals.shift();
    this.decals.push({ x, y, r: Math.max(2, r), c, life: 7, max: 7, ph: (Math.random() * 4) | 0 });
  }
  /** 스타일별 잔상 입자 하나 */
  vfxTrail(style, c, x, y, vx, vy, k) {
    const P = vfxPal(style, c);
    switch (style) {
      case 'fire': this.addP('px', x + rnd(-1, 1), y, vx * 0.3 + rnd(-8, 8), vy * 0.3 - 26 * k, 0.35, pick(P), 1, { drag: 2 }); if (Math.random() < 0.15) this.addP('smoke', x, y - 2, rnd(-4, 4), -14, 0.5, '#3a2a2a', 1.5); break;
      case 'ice': this.addP('px', x + rnd(-2, 2), y + rnd(-2, 2), rnd(-6, 6), rnd(-6, 6), 0.4, pick(P), 1, { tw: 1 }); break;
      case 'electric':
        this.addP('px', x + rnd(-3, 3), y + rnd(-3, 3), 0, 0, 0.08, pick(P), 1);
        if (Math.random() < 0.25) { const pts = [[x, y]]; let qx = x, qy = y; for (let i = 0; i < 3; i++) { qx += rnd(-5, 5); qy += rnd(-5, 5); pts.push([qx, qy]); } this.addP('bolt', x, y, 0, 0, 0.07, P[1], 1, { pts }); }
        break;
      case 'shadow': this.addP('smoke', x + rnd(-2, 2), y + rnd(-2, 2), vx * 0.2, vy * 0.2 - 4, 0.45, pick([P[2], P[3], c]), 1.5 * k, { drag: 2 }); break;
      case 'water': this.addP('px', x, y, vx * 0.3 + rnd(-10, 10), vy * 0.3 + rnd(-10, 10), 0.5, pick(P), 1, { g: 160, vz: rnd(20, 50), drag: 1 }); break;
      case 'earth': this.addP('px', x, y, vx * 0.2 + rnd(-12, 12), vy * 0.2 + rnd(-12, 12), 0.5, pick(P), Math.random() < 0.3 ? 2 : 1, { g: 220, vz: rnd(20, 50), drag: 1 }); break;
      case 'poison': if (Math.random() < 0.5) this.addP('ring', x + rnd(-2, 2), y + rnd(-2, 2), rnd(-4, 4), -10, 0.5, pick(P), 1, { r0: 0.5, r1: 2 }); else this.addP('px', x, y, rnd(-6, 6), -8, 0.4, P[2], 1); break;
      case 'holy': if (Math.random() < 0.35) this.addP('pat', x + rnd(-3, 3), y + rnd(-3, 3), 0, -6, 0.4, pick(P), 1, { pat: 'plus', tw: 1 }); else this.addP('px', x, y, rnd(-8, 8), rnd(-8, 8), 0.35, P[0], 1); break;
      case 'arcane': { const an = Math.random() * 6.28; this.addP('px', x + Math.cos(an) * 4, y + Math.sin(an) * 4, -Math.sin(an) * 20, Math.cos(an) * 20, 0.35, pick(P), 1); break; }
      case 'void': { const an = Math.random() * 6.28; this.addP('px', x + Math.cos(an) * 7, y + Math.sin(an) * 7, 0, 0, 0.3, pick(P), 1, { pull: { x, y } }); break; }
      case 'wind': this.addP('streak', x + rnd(-3, 3), y + rnd(-3, 3), vx * 1.5 + rnd(-10, 10), vy * 1.5 + rnd(-10, 10), 0.22, pick(P), 1); break;
      case 'sound': if (Math.random() < 0.4) this.addP('ring', x, y, 0, 0, 0.3, pick(P), 1, { r0: 1, r1: 6 }); else if (Math.random() < 0.3) this.addP('pat', x, y, rnd(-8, 8), -16, 0.5, pick(P), 1, { pat: 'note' }); break;
      case 'cute': if (Math.random() < 0.35) this.addP('pat', x + rnd(-2, 2), y, rnd(-6, 6), -14, 0.6, pick(['#ff8ad0', '#ffb0d8', c]), 1, { pat: 'heart' }); else this.addP('px', x, y, rnd(-8, 8), rnd(-8, 8), 0.3, '#ffd0e8', 1); break;
      case 'sleep': if (Math.random() < 0.3) this.addP('pat', x, y, rnd(4, 10), -12, 0.8, pick(['#c8d8ff', '#ffffff', c]), 1, { pat: 'z' }); else this.addP('px', x, y, rnd(-4, 4), -6, 0.5, '#c8d8ff', 1, { tw: 1 }); break;
      case 'metal': this.addP('streak', x, y, rnd(-60, 60), rnd(-60, 20), 0.15, pick(['#ffffff', '#fff3a0', '#dfe6f2']), 1, { g: 200, vz: 30 }); break;
      case 'nature': if (Math.random() < 0.3) this.addP('pat', x, y, rnd(-10, 10), rnd(-10, 0), 0.8, pick(['#7ad63a', '#4fae3a', c]), 1, { pat: 'leaf', sway: Math.random() * 6 }); else this.addP('px', x, y, rnd(-6, 6), rnd(-6, 6), 0.4, '#a8f07a', 1); break;
      case 'tech': this.addP('px', Math.round((x + rnd(-4, 4)) / 2) * 2, Math.round((y + rnd(-4, 4)) / 2) * 2, 0, 0, 0.25, pick(['#3fd8ff', '#7fffd8', c]), 2, { tw: 1 }); break;
      case 'candy': this.addP('px', x, y, rnd(-14, 14), rnd(-14, 14), 0.5, pick(P), 1, { g: 100, vz: rnd(10, 30) }); break;
      case 'gold': if (Math.random() < 0.3) this.addP('pat', x, y, rnd(-10, 10), rnd(-10, 0), 0.6, pick(['#ffd23f', '#fff7c2']), 1, { pat: 'coin', g: 160, vz: 40 }); else this.addP('px', x, y, rnd(-6, 6), rnd(-6, 6), 0.3, '#ffe98a', 1, { tw: 1 }); break;
      default: this.addP('px', x + rnd(-1, 1), y + rnd(-1, 1), vx * 0.3 + rnd(-6, 6), vy * 0.3 + rnd(-6, 6), 0.3, pick(P), 1, { drag: 2 });
    }
  }
  /** 스타일별 충격 이펙트. k는 크기 배율 */
  vfxImpact(style, c, x, y, k) {
    const P = vfxPal(style, c), n = Math.round(6 + 10 * k);
    this.addP('ring', x, y, 0, 0, 0.18 + 0.05 * k, P[0], 1, { r0: 1, r1: 5 + 8 * k });
    if (k >= 0.8) this.addP('ring', x, y, 0, 0, 0.3 + 0.05 * k, P[2], 1, { r0: 2, r1: 8 + 12 * k });
    this.addP('flash', x, y, 0, 0, 0.07, P[0], Math.max(2, 3 * k));
    for (let i = 0; i < n; i++) {
      const an = Math.random() * 6.283, v = (30 + 70 * k) * (0.3 + Math.random() * 0.7);
      switch (style) {
        case 'earth': case 'metal': case 'candy': case 'gold':
          this.addP(style === 'metal' ? 'streak' : 'px', x, y, Math.cos(an) * v, Math.sin(an) * v * 0.7, 0.4 + Math.random() * 0.3, pick(P), Math.random() < 0.3 ? 2 : 1, { g: 260, vz: rnd(30, 90), drag: 1.5 }); break;
        case 'water': this.addP('px', x, y, Math.cos(an) * v * 0.6, Math.sin(an) * v * 0.4, 0.5, pick(P), 1, { g: 260, vz: rnd(40, 100), drag: 1 }); break;
        case 'shadow': case 'void': this.addP('smoke', x, y, Math.cos(an) * v * 0.5, Math.sin(an) * v * 0.5, 0.45, pick(P), 1.5, { drag: 3, pull: style === 'void' ? { x, y } : null }); break;
        case 'electric': this.addP('streak', x, y, Math.cos(an) * v * 1.4, Math.sin(an) * v * 1.4, 0.12, pick(P), 1); break;
        case 'wind': this.addP('streak', x, y, Math.cos(an) * v * 1.2, Math.sin(an) * v * 1.2, 0.2, pick(P), 1, { drag: 3 }); break;
        default: this.addP('px', x, y, Math.cos(an) * v, Math.sin(an) * v, 0.25 + Math.random() * 0.25, pick(P), Math.random() < 0.25 ? 2 : 1, { drag: 3 });
      }
    }
    if (style === 'electric') for (let b = 0; b < Math.round(1 + k); b++) { const pts = [[x, y]]; let qx = x, qy = y; const an = Math.random() * 6.28; for (let i = 0; i < 4; i++) { qx += Math.cos(an) * 4 + rnd(-3, 3); qy += Math.sin(an) * 4 + rnd(-3, 3); pts.push([qx, qy]); } this.addP('bolt', x, y, 0, 0, 0.1, '#ffffff', 1, { pts }); }
    const extra = { cute: 'heart', sleep: 'z', sound: 'note', nature: 'leaf', holy: 'plus', gold: 'coin' }[style];
    if (extra) for (let i = 0; i < Math.round(2 + 2 * k); i++) this.addP('pat', x + rnd(-4, 4), y + rnd(-4, 4), rnd(-20, 20), rnd(-30, -6), 0.7, pick(P), 1, { pat: extra });
    if (style === 'fire') for (let i = 0; i < Math.round(3 * k); i++) this.addP('smoke', x + rnd(-3, 3), y, rnd(-8, 8), -16, 0.7, '#3a2a2a', 2);
    this.lightFlash(x, y, 14 + 18 * k, P[1]);
  }
  lightFlash(x, y, r, c) { this.addP('light', x, y, 0, 0, 0.18, c, r); }
  pop(x, y, text, color, life, scale) { if (!text || this.pops.length >= 40) return null; const p = { x, y, text, color, t: 0, life: life || 0.8, vy: 24, s: scale || 1 }; this.pops.push(p); return p; }

  /* ---------- 카메라 ---------- */
  updateCam(dt) {
    let fs = this.focus.map((i) => this.fighters[i]).filter((f) => f && f.alive);
    const solo = fs.length === 1;
    if (!fs.length) fs = this.fighters.filter((f) => f.alive);
    if (!fs.length) fs = this.fighters;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const f of fs) { x0 = Math.min(x0, f.x); x1 = Math.max(x1, f.x); y0 = Math.min(y0, f.y - 6); y1 = Math.max(y1, f.y - 6); }
    let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (solo) { const f = fs[0]; cx += Math.cos(f.aim) * 22; cy += Math.sin(f.aim) * 14; }
    const a = this.aspect();
    let baseW = a >= 1.5 ? VIEW_W : Math.max(200, VIEW_H * a);
    if (this.vision === 'tiny' && this.visionOf && this.visionOf.alive) baseW = W;
    if (this.vision === 'zoom' && this.visionOf && this.visionOf.alive) baseW *= 0.45;
    let vw = solo ? baseW : Math.max(baseW, (x1 - x0) + 100, ((y1 - y0) + 80) * a);
    vw = Math.min(vw, W, H * a);
    if (!this.cam) this.cam = { x: cx, y: cy, w: vw };
    const c = this.cam;
    const kp = 1 - Math.exp(-dt * (solo ? 7 : 4)), kz = 1 - Math.exp(-dt * 2.5);
    c.x += (cx - c.x) * kp; c.y += (cy - c.y) * kp; c.w += (vw - c.w) * kz;
  }
  aspect() { return clamp(this.scv.width / Math.max(1, this.scv.height), 0.5, 3); }
  viewRect() {
    const a = this.aspect();
    const c = this.cam || { x: W / 2, y: H / 2, w: Math.min(W, H * a) };
    const w = Math.min(c.w * (1 - this.punch * 0.12), W, H * a), h = w / a;
    return { x: clamp(c.x - w / 2, 0, W - w), y: clamp(c.y - h / 2, 0, H - h), w, h };
  }

  /* ---------- 그리기 (고해상도: 1칸 = RS 픽셀) ---------- */
  line(g, x0, y0, x1, y1, c, th) {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    g.fillStyle = c; th = th || 1;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n) - (th >> 1), Math.round(y0 + (y1 - y0) * i / n) - (th >> 1), th, th);
  }
  stamp(g, x0, y0, ang, len, w, color, wob, T) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    g.fillStyle = color;
    for (let i = 0; i <= len; i += 1) {
      const ww = wob ? Math.max(1, Math.round(w + Math.sin(i * 0.35 - T * 40) * wob)) : w, hw = ww >> 1;
      g.fillRect(Math.round(x0 + ca * i) - hw, Math.round(y0 + sa * i) - hw, ww, ww);
    }
  }
  /** 마법진: 두 겹 원, 별, 도는 룬 */
  runeCircle(g, x, y, r, c, cl, T, a) {
    g.globalAlpha = a;
    pixRing(g, x, y, r, c, 2); pixRing(g, x, y, r * 0.72, cl, 1);
    const pts = [];
    for (let i = 0; i < 5; i++) { const an = T * 1.6 + i * Math.PI * 2 / 5; pts.push([x + Math.cos(an) * r * 0.72, y + Math.sin(an) * r * 0.72 * 0.6]); }
    for (let i = 0; i < 5; i++) { const p0 = pts[i], p1 = pts[(i + 2) % 5]; this.line(g, p0[0], p0[1], p1[0], p1[1], cl, 1); }
    for (let i = 0; i < 8; i++) { const an = -T * 2.4 + i * Math.PI / 4, rx = x + Math.cos(an) * r, ry = y + Math.sin(an) * r; g.fillStyle = '#ffffff'; g.fillRect(Math.round(rx) - 1, Math.round(ry) - 1, 3, 3); g.fillStyle = c; g.fillRect(Math.round(rx), Math.round(ry), 1, 1); }
    g.globalAlpha = 1;
  }
  draw(dt) {
    this.updateCam(dt || 1 / 60);
    const g = this.g, T = this.t, m = this.map, X = (v) => Math.round(v * RS);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(m.bg, 0, 0);
    // 움직이는 바닥
    for (const o of m.lava) for (let k = 0; k < 10; k++) { g.fillStyle = Math.random() < 0.4 ? '#ffe14a' : Math.random() < 0.5 ? '#ff9a2f' : '#ffd0a0'; g.fillRect(X(o.x) + ((Math.random() * o.w * RS) | 0), X(o.y + 3) + ((Math.random() * (o.h - 3) * RS) | 0), 1 + (Math.random() * 4 | 0), 1); }
    if (m.pond && Math.random() < 0.05) this.addP('ring', m.pond.x + 10 + Math.random() * (m.pond.w - 20), m.pond.y + 8 + Math.random() * (m.pond.h - 16), 0, 0, 1.1, '#6faad8', 1, { r0: 0.5, r1: 6 });
    // 바닥 흔적
    for (const d of this.decals) {
      g.globalAlpha = clamp(d.life / d.max, 0, 1) * 0.6;
      const r = X(d.r);
      g.drawImage(discCanvas(r, d.c, d.ph), X(d.x) - r, X(d.y) - Math.round(r * 0.6), r * 2 + 1, Math.round(r * 1.2) + 1);
    }
    g.globalAlpha = 1;
    const objs = this.objs;
    // 바닥에 깔리는 것
    for (const o of objs) {
      if (o.delay > 0 && o.kind !== 'drop') continue;
      const ox = X(o.x), oy = X(o.y);
      if (o.kind === 'zone') {
        const fadeOut = o.max && o.life < 0.5 ? o.life / 0.5 : 1, fadeIn = Math.min(1, o.age / 0.15);
        const r = Math.round(X(o.r) * (o.puddle ? 1 : 0.85 + 0.15 * fadeIn));
        g.globalAlpha = (o.aura ? 0.22 : o.puddle ? 0.5 : 0.5) * fadeOut;
        g.drawImage(discCanvas(r, o.color, Math.floor(T * 8) % 3), ox - r, oy - r);
        if (!o.puddle && !o.aura) { g.globalAlpha = 0.35 * fadeOut; g.drawImage(discCanvas(Math.round(r * 0.6), o.cl, Math.floor(T * 12) % 3), ox - Math.round(r * 0.6), oy - Math.round(r * 0.6)); }
        g.globalAlpha = (o.aura ? 0.35 : 0.95) * fadeOut;
        if (o.swirl) { for (let k = 0; k < 4; k++) { const an = -T * 5 + k * 1.57; g.strokeStyle = k & 1 ? o.cl : '#ffffff'; g.lineWidth = 2; g.beginPath(); for (let q = 0; q <= 20; q++) { const t = q / 20, rr = r * (1 - t), a2 = an + t * 4; const px = ox + Math.cos(a2) * rr, py = oy + Math.sin(a2) * rr * 0.8; if (q) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); } }
        else if (o.ring) { const n = Math.max(30, Math.round(r / 2)); for (let k = 0; k < n; k++) { const an = k / n * 6.283, h = 6 + Math.abs(Math.sin(T * 12 + k)) * 10, px = Math.round(ox + Math.cos(an) * r), py = Math.round(oy + Math.sin(an) * r * 0.8); g.fillStyle = o.color; g.fillRect(px - 2, py - h, 4, h); g.fillStyle = o.cl; g.fillRect(px - 1, py - h + 2, 2, h - 3); } }
        else if (o.netz) { for (let k = -4; k <= 4; k++) { this.line(g, ox + k * r / 4 - r * 0.3, oy - r * 0.7, ox + k * r / 4 + r * 0.3, oy + r * 0.7, '#e8e8f0', 1); this.line(g, ox - r * 0.9, oy + k * r / 5, ox + r * 0.9, oy + k * r / 5, '#e8e8f0', 1); } pixRing(g, ox, oy, r, '#ffffff', 2); }
        else if (!o.puddle) { pixRing(g, ox, oy, r, o.color, 2); dashRing(g, ox, oy, r - 4, o.cl, T * 12); pixRing(g, ox, oy, r * (0.3 + 0.7 * ((T * 0.9) % 1)), o.cl); }
        else pixRing(g, ox, oy, r, o.dk);
        g.globalAlpha = 1;
      } else if (o.kind === 'drop' && !o.trig) {
        const p = o.delay > 0 ? 0 : clamp(1 - o.fall / (o.fall0 || 0.42), 0, 1), r = X(o.r);
        g.globalAlpha = 0.25 + 0.3 * p; fillEll(g, ox, oy, r * (0.4 + 0.6 * p), r * (0.25 + 0.35 * p), '#000000'); g.globalAlpha = 1;
        if (Math.floor(T * 14) & 1) dashRing(g, ox, oy, r, o.color, T * 20);
        pixRing(g, ox, oy, Math.max(1, r * p), o.cl);
      } else if (o.kind === 'blast' && !o.trig) {
        const p = clamp(o.age / Math.max(0.05, o.delay0), 0, 1), r = X(o.r);
        g.globalAlpha = 0.2 + 0.3 * p; g.drawImage(discCanvas(r, o.color, Math.floor(T * 16) % 3), ox - r, oy - r); g.globalAlpha = 1;
        dashRing(g, ox, oy, r, (Math.floor(T * 16) & 1) ? '#ffffff' : o.color, T * 30);
        pixRing(g, ox, oy, r * p, o.cl, 2);
      } else if (o.kind === 'wave') {
        const p = clamp(1 - o.life / o.max, 0, 1), R = X(o.cur), a = 1 - p * 0.8;
        const ell = (rr, col, th) => { const n = Math.max(24, Math.round(rr / 2)); g.fillStyle = col; for (let k = 0; k < n; k++) { const an = k / n * 6.283; if (o.arc && Math.abs(Math.atan2(Math.sin(an - o.ang), Math.cos(an - o.ang))) > o.arc / 2) continue; g.fillRect(Math.round(ox + Math.cos(an) * rr) - (th >> 1), Math.round(oy + Math.sin(an) * rr * 0.8) - (th >> 1), th, th); } };
        if (!o.arc) { g.globalAlpha = 0.25 * a; g.drawImage(discCanvas(Math.max(2, R), o.color, Math.floor(T * 20) % 3), ox - R, oy - Math.round(R * 0.8), R * 2, Math.round(R * 1.6)); } g.globalAlpha = a;
        ell(R, o.dk, 5); ell(R, o.color, 3); ell(Math.max(1, R - 3), '#ffffff', 1); if (R > 12) ell(R * 0.7, o.cl, 1);
        g.globalAlpha = 1;
      } else if (o.kind === 'cone') {
        const half = o.arc / 2, L = X(o.len), fade = Math.min(1, o.life / 0.12, o.age / 0.06);
        g.globalAlpha = 0.22 * fade; g.fillStyle = o.color;
        g.beginPath(); g.moveTo(ox, oy);
        for (let k = 0; k <= 12; k++) { const an = o.ang - half + (o.arc * k) / 12; g.lineTo(ox + Math.cos(an) * L, oy + Math.sin(an) * L * 0.8); }
        g.closePath(); g.fill();
        g.globalAlpha = 0.85 * fade;
        for (let k = 0; k <= 10; k++) { const an = o.ang - half + (o.arc * k) / 10, wob = Math.sin(T * 30 + k) * 3; g.fillStyle = k & 1 ? o.cl : o.color; g.fillRect(Math.round(ox + Math.cos(an) * (L + wob)) - 1, Math.round(oy + Math.sin(an) * (L + wob) * 0.8) - 1, 3, 3); }
        g.globalAlpha = 1;
      } else if (o.kind === 'flurry') {
        const R = X(o.r), fade = Math.min(1, o.life / 0.1);
        g.globalAlpha = 0.18 * fade; g.drawImage(discCanvas(R, o.color, 0), ox - R, oy - R); g.globalAlpha = fade;
        for (let k = 0; k < 5; k++) { const a1 = Math.random() * 6.283, a2 = a1 + Math.PI + rnd(-0.5, 0.5), r1 = R * rnd(0.6, 1), r2 = R * rnd(0.6, 1); this.line(g, ox + Math.cos(a1) * r1, oy - 12 + Math.sin(a1) * r1 * 0.8, ox + Math.cos(a2) * r2, oy - 12 + Math.sin(a2) * r2 * 0.8, k & 1 ? '#ffffff' : o.color, 2); }
        g.globalAlpha = 1;
      } else if (o.kind === 'tornado') {
        const R = X(o.r);
        g.globalAlpha = 0.3; fillEll(g, ox, oy + 2, R, R * 0.4, '#000000'); g.globalAlpha = 1;
        for (let k = 0; k < 7; k++) { const h = k * 9, rr = R * (0.35 + k * 0.12), an = T * 16 + k; g.globalAlpha = 0.8; g.strokeStyle = k & 1 ? o.cl : o.color; g.lineWidth = 3; g.beginPath(); g.ellipse(ox + Math.sin(T * 6 + k) * 3, oy - h, rr, rr * 0.35, 0, an, an + 4.2); g.stroke(); }
        g.globalAlpha = 1;
      } else if (o.kind === 'fwall') {
        const n = 14, fade = Math.min(1, o.life / 0.3, o.age / 0.1);
        for (let k = 0; k <= n; k++) { const t = k / n, px = X(lerp(o.ax, o.bx, t)), py = X(lerp(o.ay, o.by, t)), h = 10 + Math.abs(Math.sin(T * 14 + k * 1.7)) * 16; g.globalAlpha = fade; g.fillStyle = o.dk; g.fillRect(px - 4, py - h, 8, h); g.fillStyle = o.color; g.fillRect(px - 3, py - h + 2, 6, h - 2); g.fillStyle = o.cl; g.fillRect(px - 1, py - h + 4, 2, h - 6); }
        g.globalAlpha = 1;
      } else if (o.kind === 'surge' && o.ax != null) {
        const n = 10;
        for (let k = 0; k <= n; k++) { const t = k / n, px = X(lerp(o.ax, o.bx, t)), py = X(lerp(o.ay, o.by, t)), h = 8 + Math.abs(Math.sin(T * 20 + k)) * 10; g.fillStyle = o.dk; g.fillRect(px - 4, py - h, 8, h + 2); g.fillStyle = o.color; g.fillRect(px - 3, py - h, 6, h - 2); g.fillStyle = '#ffffff'; g.fillRect(px - 3, py - h, 6, 2); }
      } else if (o.kind === 'mark') {
        const R = X(o.r), p = clamp(o.age / o.fuse, 0, 1);
        if (!o.trig) { dashRing(g, ox, oy, R, (Math.floor(T * (6 + p * 20)) & 1) ? '#ffffff' : o.color, T * 6); pixRing(g, ox, oy, Math.max(2, R * (1 - p)), o.cl, 2); for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2 + T * 3; this.line(g, ox + Math.cos(an) * (R + 4), oy + Math.sin(an) * (R + 4), ox + Math.cos(an) * (R - 6), oy + Math.sin(an) * (R - 6), '#ff4d6d', 2); } }
      } else if (o.kind === 'slash') {
        const x0 = X(o.x0), y0 = X(o.y0), x1 = X(o.x1), y1 = X(o.y1);
        if (!o.trig) { if (Math.floor(T * 20) & 1) { g.globalAlpha = 0.6; this.line(g, x0, y0, x1, y1, o.color, 1); g.globalAlpha = 1; } }
        else { const p = clamp((o.age - o.fuse) / 0.25, 0, 1); g.globalAlpha = 1 - p; this.line(g, x0, y0, x1, y1, o.color, Math.round(9 * (1 - p)) + 2); this.line(g, x0, y0, x1, y1, '#ffffff', Math.round(4 * (1 - p)) + 1); g.globalAlpha = 1; }
      } else if (o.kind === 'bite') {
        const R = X(o.r), p = o.trig ? 1 : clamp(o.age / o.fuse, 0, 1), gap = Math.round(R * 0.9 * (1 - p * p)), fade = o.trig ? clamp(1 - (o.age - o.fuse) / 0.3, 0, 1) : 1;
        const jaw = (yy, dir) => {
          const by0 = dir > 0 ? yy - 6 : yy;
          g.fillStyle = o.dk; g.fillRect(ox - R - 2, by0, R * 2 + 4, 6); g.fillStyle = o.color; g.fillRect(ox - R - 2, by0 + (dir > 0 ? 0 : 2), R * 2 + 4, 4);
          const nT = Math.max(3, Math.round(R / 5));
          g.fillStyle = '#ffffff';
          for (let k = 0; k < nT; k++) { const tx0 = ox - R + Math.round((k + 0.5) * 2 * R / nT); for (let h = 0; h < 6; h++) { const w = Math.max(1, 5 - h); g.fillRect(tx0 - (w >> 1), dir > 0 ? yy + h : yy - 1 - h, w, 1); } }
        };
        g.globalAlpha = fade * 0.35; fillDisc(g, ox, oy, R, '#1a0f1f'); g.globalAlpha = fade;
        jaw(oy - gap, 1); jaw(oy + gap, -1);
        if (o.trig) { g.globalAlpha = fade * 0.8; pixRing(g, ox, oy, R + Math.round((1 - fade) * 10), '#ffffff', 2); }
        g.globalAlpha = 1;
      } else if (o.kind === 'runner') {
        const bob = Math.abs(Math.sin(T * 22 + o.ph)) * 4, k = o.r >= 9 ? 3 : 2;
        fillEll(g, ox, oy + 2, X(o.r) + 2, 3, 'rgba(0,0,0,0.35)');
        drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, ox, oy - X(o.r) - Math.round(bob), k, 0);
      } else if (o.kind === 'pillar') {
        const p = clamp(o.age / o.max, 0, 1), up = p < 0.2 ? p / 0.2 : p > 0.7 ? (1 - p) / 0.3 : 1, Hh = Math.round(X(o.r) * 2.6 * up), Wd = Math.max(4, Math.round(X(o.r) * 0.9));
        fillEll(g, ox, oy + 1, Wd + 3, 3, 'rgba(0,0,0,0.35)');
        g.fillStyle = o.dk; g.fillRect(ox - Wd, oy - Hh, Wd * 2, Hh);
        g.fillStyle = o.color; g.fillRect(ox - Wd + 2, oy - Hh, Wd * 2 - 4, Hh);
        g.fillStyle = o.cl; g.fillRect(ox - Wd + 2, oy - Hh, 2, Hh);
        for (let h = 0; h < Wd; h++) { g.fillStyle = h & 1 ? o.cl : o.color; g.fillRect(ox - Wd + h, oy - Hh - 1 - h, (Wd - h) * 2, 1); }
      } else if (o.kind === 'lgrid') {
        for (const sg of o.segs) {
          const x0 = X(sg[0]), y0 = X(sg[1]), x1 = X(sg[2]), y1 = X(sg[3]);
          if (!o.trig) { const p = clamp(o.age / o.fuse, 0, 1); g.globalAlpha = 0.3 + 0.5 * p; this.line(g, x0, y0, x1, y1, (Math.floor(T * (10 + p * 30)) & 1) ? '#ff4d6d' : o.color, 1); }
          else { const p = clamp((o.age - o.fuse) / 0.3, 0, 1); g.globalAlpha = 1 - p; this.line(g, x0, y0, x1, y1, o.color, Math.round(10 * (1 - p)) + 2); this.line(g, x0, y0, x1, y1, '#ffffff', Math.round(4 * (1 - p)) + 1); }
        }
        g.globalAlpha = 1;
      } else if (o.kind === 'crack') {
        const fade = Math.min(1, o.life / 0.5), pts = o.pts;
        g.globalAlpha = fade;
        for (let k = 1; k < pts.length; k++) { const a0 = pts[k - 1], a1 = pts[k], x0 = X(a0[0]), y0 = X(a0[1]), x1 = X(a1[0]), y1 = X(a1[1]); this.line(g, x0, y0, x1, y1, '#1a1426', 4); this.line(g, x0, y0, x1, y1, o.color, 2); if (k % 2) this.line(g, x1, y1, x1 + ((k * 7) % 9) - 4, y1 + 5, '#1a1426', 2); }
        if (o.gone < o.len) { g.globalAlpha = 0.6; fillDisc(g, ox, oy, X(o.r), o.cl); }
        g.globalAlpha = 1;
      } else if (o.kind === 'snipe') {
        const x1 = X(o.x + Math.cos(o.ang) * o.len), y1 = X(o.y + Math.sin(o.ang) * o.len);
        if (!o.trig) { const p = clamp(o.age / o.fuse, 0, 1); g.globalAlpha = 0.4 + 0.6 * p; this.line(g, ox, oy, x1, y1, (Math.floor(T * 24) & 1) ? '#ff4d6d' : '#ffffff', 1); fillDisc(g, ox, oy, 3 + Math.round(p * 5), o.color); g.globalAlpha = 1; }
        else { const p = clamp((o.age - o.fuse) / 0.25, 0, 1); g.globalAlpha = 1 - p; this.line(g, ox, oy, x1, y1, o.color, Math.round(14 * (1 - p)) + 2); this.line(g, ox, oy, x1, y1, '#ffffff', Math.round(6 * (1 - p)) + 1); g.globalAlpha = 1; }
      } else if (o.kind === 'circle') {
        const p = 1 - o.life / o.max, r = X(o.r) * (0.5 + 0.5 * Math.min(1, p * 3));
        this.runeCircle(g, ox, oy, r, o.color, o.cl, T, Math.min(1, o.life / 0.15));
      } else if (o.kind === 'mine') {
        const blink = o.arm <= 0 && (Math.floor(T * 5) & 1);
        g.globalAlpha = 0.9; drawGlyph(g, moveRows(o.gm, T + o.ph), blink ? '#ffffff' : o.color, ox, oy - 6, 1, 0); g.globalAlpha = 1;
        if (blink) dashRing(g, ox, oy, X(o.r), o.color, T * 10);
      }
    }
    // y 순서대로: 캐릭터, 벽, 설치물
    const list = [];
    for (const f of this.fighters) if (!f.gone) list.push({ y: f.y, f });
    for (const w of m.walls) list.push({ y: w.key, w });
    for (const o of objs) if (o.delay <= 0 && (o.kind === 'barrier' || o.kind === 'turret' || o.kind === 'chaser' || o.kind === 'pest' || o.kind === 'top' || o.kind === 'beacon')) list.push({ y: o.y, o });
    for (const p of this.parts) if (p.k === 'after') list.push({ y: p.y - 0.1, p });
    list.sort((p, q) => p.y - q.y);
    for (const it of list) {
      if (it.f) { this.drawFighter(g, it.f, T); continue; }
      if (it.w) { g.drawImage(it.w.cv, X(it.w.dx), X(it.w.dy)); continue; }
      if (it.p) {
        const p = it.p, f = p.f, sz = f.size;
        g.globalAlpha = 0.4 * (p.life / p.max);
        g.drawImage(f.spr, 0, 0, SW, SH, X(p.x) - Math.round(OX * sz), X(p.y) - Math.round(OY * sz), Math.round(SW * sz), Math.round(SH * sz));
        g.globalAlpha = 1; continue;
      }
      const o = it.o, x = X(o.x), y = X(o.y);
      const fading = o.life < 0.8 && (Math.floor(T * 12) & 1);
      if (fading) continue;
      if (o.kind === 'barrier') {
        const ax = X(o.ax), ay = X(o.ay), bx = X(o.bx), by = X(o.by), n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay)));
        const H2 = 7 * RS;
        for (let k = 0; k <= n; k++) {
          const px = Math.round(ax + (bx - ax) * k / n), py = Math.round(ay + (by - ay) * k / n);
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(px, py + 2, 2, 2);
          g.fillStyle = o.dk; g.fillRect(px - 2, py - H2, 5, H2);
          g.fillStyle = o.color; g.fillRect(px - 2, py - H2 - 3, 5, 5);
          if (k % 6 === 0) { g.fillStyle = o.cl; g.fillRect(px, py - H2 + 4, 1, H2 - 8); }
          if ((k + Math.floor(T * 20)) % 23 === 0) { g.fillStyle = '#ffffff'; g.fillRect(px - 1, py - H2 - 3, 2, 2); }
        }
      } else if (o.kind === 'turret') {
        fillEll(g, x, y + 2, 10, 3, 'rgba(0,0,0,0.35)');
        g.fillStyle = '#2a2440'; g.fillRect(x - 10, y - 8, 21, 9); g.fillStyle = '#4a3f8f'; g.fillRect(x - 10, y - 8, 21, 2); g.fillStyle = '#15122b'; g.fillRect(x - 10, y, 21, 1);
        g.fillStyle = o.color; g.fillRect(x - 2, y - 5, 5, 2);
        drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y - 18, 1, rotOf(Math.cos(o.aimA), Math.sin(o.aimA)));
      } else if (o.kind === 'top') {
        fillEll(g, x, y + 2, 9, 3, 'rgba(0,0,0,0.35)');
        const wob = Math.sin(T * 30 + o.ph) * 2;
        g.fillStyle = o.dk; g.fillRect(x - 1, y - 8, 3, 8);
        drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x + wob, y - 16, 2, Math.floor(T * 20) & 3);
      } else if (o.kind === 'beacon') {
        const pulse = 1 - clamp(o.pulse / o.rate, 0, 1);
        fillEll(g, x, y + 2, 10, 3, 'rgba(0,0,0,0.35)');
        g.fillStyle = '#2a2440'; g.fillRect(x - 6, y - 14, 13, 14); g.fillStyle = o.color; g.fillRect(x - 4, y - 12, 9, 2); g.fillStyle = o.cl; g.fillRect(x - 2, y - 30, 5, 16);
        g.globalAlpha = 0.4 + pulse * 0.6; fillDisc(g, x, y - 34, 6 + Math.round(pulse * 5), o.cl); g.globalAlpha = 1;
        drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y - 44, 1, 0);
      } else if (o.clone != null) {
        const cf = this.fighters[o.clone];
        if (cf && cf.spr) { const sz = cf.size; g.globalAlpha = 0.75; g.drawImage(cf.spr, 0, 0, SW, SH, x - Math.round(OX * sz), y - Math.round(OY * sz) - Math.round(Math.abs(Math.sin(T * 14 + o.ph)) * 4), Math.round(SW * sz), Math.round(SH * sz)); g.globalAlpha = 1; dashRing(g, x, y, 10, o.color, T * 10); }
      } else {
        const hop = Math.abs(Math.sin((T + o.hop) * (o.kind === 'pest' ? 10 : 12))) * 9;
        fillEll(g, x, y + 1, 7, 2, 'rgba(0,0,0,0.35)');
        drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y - 12 - hop, 1, o.d < 0 ? 2 : 0);
      }
    }
    // 공중에 뜬 것
    for (const o of objs) {
      if (o.delay > 0) continue;
      const x = X(o.x), y = X(o.y);
      switch (o.kind) {
        case 'hopper': {
          const hh = X(o.h), k = Math.max(2, Math.round(o.size / 3));
          fillEll(g, x, y + 2, Math.max(4, Math.round((8 + o.size) * (1 - o.h / 80))), 3, 'rgba(0,0,0,0.35)');
          if (o.h < 1 && o.hk > 0) { g.globalAlpha = 0.5; pixRing(g, x, y, X(o.r), o.cl, 1); g.globalAlpha = 1; }
          drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y - hh - 4 * k, k, 0);
          break;
        }
        case 'swarm': {
          const fade = Math.min(1, o.life / 0.4, o.age / 0.2), R = X(o.r);
          g.globalAlpha = 0.16 * fade; fillDisc(g, x, y, R, o.color); g.globalAlpha = fade;
          for (const [a0, sp] of o.bugs) {
            const an = a0 + T * sp * 9, bx = x + Math.round(Math.cos(an) * R * 0.9 * (0.5 + 0.5 * Math.sin(T * 3 + a0))), by = y + Math.round(Math.sin(an * 1.3) * R * 0.6);
            if (o.custom) drawGlyph(g, moveRows(o.gm, T + a0), o.color, bx, by, 1, 0);
            else { g.fillStyle = o.dk; g.fillRect(bx - 1, by - 1, 3, 3); g.fillStyle = (Math.floor(T * 30 + a0 * 5) & 1) ? '#ffffff' : o.cl; g.fillRect(bx - 3, by - 2, 2, 1); g.fillRect(bx + 2, by - 2, 2, 1); }
          }
          g.globalAlpha = 1; break;
        }
        case 'btrap': {
          const f = this.fighters[o.fid], R = f ? Math.round(X(9 * f.size)) + 5 : 14, w = Math.round(Math.sin(T * 6) * 1.5);
          g.globalAlpha = 0.22; fillDisc(g, x, y, R + w, o.cl); g.globalAlpha = 0.9; pixRing(g, x, y, R + w, o.color, 1);
          g.fillStyle = '#ffffff'; g.fillRect(x - Math.round(R * 0.5), y - Math.round(R * 0.55), 4, 2); g.fillRect(x - Math.round(R * 0.6), y - Math.round(R * 0.4), 2, 2);
          g.globalAlpha = 1; break;
        }
        case 'grab': {
          const R = X(o.r);
          if (!o.trig) {
            const p = clamp(o.age / o.fuse, 0, 1);
            dashRing(g, x, y, R, (Math.floor(T * 16) & 1) ? '#ffffff' : o.color, T * 5);
            for (let k = 0; k < 5; k++) { const hh = Math.round(p * 6), fx2 = Math.round(x - R * 0.6 + k * R * 0.3); g.fillStyle = o.dk; g.fillRect(fx2 - 1, y - hh, 3, hh); }
          } else {
            const p = clamp((o.age - o.fuse) / 0.5, 0, 1), up = Math.round(Math.min(1, p * 4) * R * 1.6), cl = Math.min(1, p * 3), fade = p > 0.7 ? (1 - p) / 0.3 : 1, aw = Math.round(R * 0.35), pw = Math.round(R * 0.8), py = y - up, ph = Math.round(R * 0.5);
            g.globalAlpha = fade;
            g.fillStyle = o.dk; g.fillRect(x - aw, py, aw * 2, up); g.fillStyle = o.color; g.fillRect(x - aw + 2, py, aw * 2 - 4, up);
            g.fillStyle = o.dk; g.fillRect(x - pw - 1, py - ph - 1, pw * 2 + 2, ph + 2); g.fillStyle = o.color; g.fillRect(x - pw, py - ph, pw * 2, ph);
            for (let k = 0; k < 4; k++) { const fx0 = x - pw + Math.round((k + 0.5) * pw / 2), lean = Math.round((x - fx0) * cl * 0.5), fl = Math.round(R * 0.7); this.line(g, fx0, py - ph, fx0 + lean, py - ph - fl, o.dk, 4); this.line(g, fx0, py - ph, fx0 + lean, py - ph - fl, o.cl, 2); }
            g.globalAlpha = 1;
          }
          break;
        }
        case 'shot': {
          if (o.bubble) { const R = X(o.r) * 2 + 6 + Math.round(Math.sin(T * 8 + o.ph) * 1.5); g.globalAlpha = 0.25; fillDisc(g, x, y, R, o.cl); g.globalAlpha = 0.9; pixRing(g, x, y, R, o.color, 1); g.fillStyle = '#ffffff'; g.fillRect(x - Math.round(R * 0.5), y - Math.round(R * 0.5), 3, 2); g.globalAlpha = 1; drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y, 1, 0); break; }
          const big = o.roll ? 3 : o.charged ? 3 : o.r >= 7 ? 4 : o.r >= 4.5 ? 3 : o.r >= 3 ? 2 : 1, rows = moveRows(o.gm, T + o.ph);
          if (o.aura) { g.globalAlpha = 0.3 + 0.15 * Math.sin(T * 10 + o.ph); fillDisc(g, x, y, X(o.r + o.aura), o.cl); g.globalAlpha = 0.8; dashRing(g, x, y, X(o.r + o.aura), o.color, T * 4, 10); g.globalAlpha = 1; }
          if (o.path === 'stay' && o.end === 'mine' && o.life < 0.6 && Math.floor(T * 12) & 1) { g.globalAlpha = 0.7; pixRing(g, x, y, X(14 + o.r * 2), '#ff4d3a', 1); g.globalAlpha = 1; }
          if (o.roll || o.charged) { fillEll(g, x, y + 14 + X(o.r), 8 + X(o.r), 4, 'rgba(0,0,0,0.3)'); if (o.charged) { g.globalAlpha = 0.6; fillDisc(g, x, y, 22 + Math.round(Math.sin(T * 30) * 3), o.color); fillDisc(g, x, y, 14, o.cl); g.globalAlpha = 1; } drawGlyph(g, rows, o.color, x, y, big, o.roll ? (Math.floor(T * 10) & 3) : rotOf(o.vx, o.vy)); break; }
          if (o.net) { g.globalAlpha = 0.9; for (let k = -2; k <= 2; k++) { this.line(g, x + k * 4, y - 9, x + k * 4, y + 9, '#e8e8f0', 1); this.line(g, x - 9, y + k * 4, x + 9, y + k * 4, '#e8e8f0', 1); } g.globalAlpha = 1; }
          if (o.hook) {
            const ow = this.fighters[o.owner];
            if (ow) { const hx = X(ow.x), hy = X(this.bodyY(ow)), n = Math.max(2, Math.round(Math.hypot(x - hx, y - hy) / 6)); for (let k = 0; k <= n; k++) { g.fillStyle = k & 1 ? o.dk : '#d8d8e8'; g.fillRect(Math.round(hx + (x - hx) * k / n) - 1, Math.round(hy + (y - hy) * k / n) - 1, 3, 3); } }
          }
          g.globalAlpha = 0.5 + 0.3 * Math.sin(T * 20 + o.ph); pixRing(g, x, y, (big ? 15 : 9) + Math.round(Math.sin(T * 14 + o.ph) * 2), o.cl, 1); g.globalAlpha = 1;
          fillEll(g, x, y + 14, 4 + o.r, 2, 'rgba(0,0,0,0.25)');
          // 잔상
          if (o.tr && o.tr.length >= 4) for (let i = 0; i < o.tr.length - 2; i += 2) {
            const a = (i + 2) / o.tr.length * 0.35;
            g.globalAlpha = a;
            if (o.r <= 1 && !o.custom) fillDisc(g, X(o.tr[i]), X(o.tr[i + 1]), 2, o.color);
            else drawGlyph(g, rows, o.color, X(o.tr[i]), X(o.tr[i + 1]), big, o.spin ? 0 : rotOf(o.vx, o.vy));
          }
          g.globalAlpha = 1;
          if (o.r <= 1 && !o.custom) { fillDisc(g, x, y, 3, o.dk); fillDisc(g, x, y, 2, o.color); g.fillStyle = o.cl; g.fillRect(x - 1, y - 1, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 1, 1); }
          else drawGlyph(g, rows, o.color, x, y, big, o.spin ? (Math.floor(T * 16) & 3) : rotOf(o.vx, o.vy));
          break;
        }
        case 'drop': if (!o.trig) { const hh = Math.max(0, o.fall) * 180 * RS; drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y - (o.big ? 30 : 9) - hh, o.big ? 3 : 1, 1); if (o.big && Math.random() < 0.8) this.addP('smoke', o.x + rnd(-4, 4), o.y - 10 - o.fall * 180, rnd(-10, 10), -20, 0.5, '#ff9a4a', 2); } break;
        case 'swing': {
          if (o.cur == null) break;
          const half = o.arc / 2, a0 = o.ang - o.dirS * half, a1 = o.cur, R = X(o.r), Ri = R * 0.42, fade = Math.min(1, o.life / 0.08 + 0.3);
          const mid = (R + Ri) / 2, th = R - Ri;
          const seg = (s0, s1, col, w, rr, al) => {
            g.globalAlpha = al * fade; g.strokeStyle = col; g.lineWidth = w;
            g.beginPath(); g.ellipse(x, y, rr, rr * 0.8, 0, Math.min(s0, s1), Math.max(s0, s1)); g.stroke();
          };
          const span = a1 - a0;
          seg(a0, a0 + span * 0.55, o.color, th * 0.6, mid, 0.25);
          seg(a0 + span * 0.5, a0 + span * 0.85, o.color, th * 0.85, mid, 0.6);
          seg(a0 + span * 0.8, a1, o.cl, th, mid, 0.95);
          seg(a0 + span * 0.4, a1, '#ffffff', 2, R, 0.9);
          g.globalAlpha = 1;
          const tx = x + Math.cos(a1) * R, ty = y + Math.sin(a1) * R * 0.8;
          drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, tx, ty, 1, rotOf(Math.cos(a1 + o.dirS * 1.57), Math.sin(a1 + o.dirS * 1.57)));
          break;
        }
        case 'chain': {
          const ow = this.fighters[o.owner], pts = [[ow ? X(ow.x) : x, ow ? X(this.bodyY(ow)) : y]];
          for (const k of o.path) { const v = this.fighters[k]; pts.push([X(v.x), X(this.bodyY(v))]); }
          if (!o.path.length) pts.push([x + Math.cos(o.endA) * X(o.endL), y + Math.sin(o.endA) * X(o.endL)]);
          const a = Math.min(1, o.life / 0.15);
          for (let i2 = 1; i2 < pts.length; i2++) {
            const [ax, ay] = pts[i2 - 1], [bx, by] = pts[i2], n = Math.max(3, Math.round(Math.hypot(bx - ax, by - ay) / 14));
            let px = ax, py = ay;
            for (let k = 1; k <= n; k++) {
              const t = k / n, qx = k === n ? bx : ax + (bx - ax) * t + rnd(-8, 8), qy = k === n ? by : ay + (by - ay) * t + rnd(-8, 8);
              g.globalAlpha = a; this.line(g, px, py, qx, qy, o.color, 4); this.line(g, px, py, qx, qy, '#ffffff', 2);
              px = qx; py = qy;
            }
            if (i2 < pts.length) { fillDisc(g, bx, by, 6, o.cl); fillDisc(g, bx, by, 3, '#ffffff'); }
          }
          g.globalAlpha = 1;
          break;
        }
        case 'spike': {
          const p = clamp(o.age / 0.07, 0, 1), down = o.life < 0.1 ? o.life / 0.1 : 1, hh = Math.round((o.big ? 16 + 30 * p : 10 + 18 * p) * down);
          fillEll(g, x, y, o.big ? 14 : 9, o.big ? 5 : 3, o.dk);
          if (o.big && hh > 10) { g.fillStyle = o.color; g.fillRect(x - 5, y - hh + 10, 11, hh - 10); g.fillStyle = o.cl; g.fillRect(x - 5, y - hh + 10, 3, hh - 10); g.fillStyle = '#ffffff'; g.fillRect(x - 5, y - hh + 10, 11, 2); }
          g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x - 6, y - 1, 4, 1); g.fillRect(x + 3, y, 4, 1);
          drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y - hh + 4, 1, 3);
          break;
        }
        case 'orbit': drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y, 1, (Math.floor(T * 10) & 3)); break;
        case 'thrust': {
          if (o.reach == null) break;
          const ca = Math.cos(o.ang), sa = Math.sin(o.ang), x1 = x + ca * X(o.reach), y1 = y + sa * X(o.reach), w = Math.max(2, Math.round(o.w * RS * 0.6));
          this.line(g, x + ca * 10, y + sa * 10, x1, y1, o.dk, w + 2); this.line(g, x + ca * 10, y + sa * 10, x1, y1, o.color, w); this.line(g, x + ca * 10, y + sa * 10, x1, y1, '#ffffff', 1);
          drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x1, y1, 1, rotOf(ca, sa));
          for (let k = 0; k < 3; k++) { const an = o.ang + Math.PI + rnd(-0.6, 0.6); this.line(g, x1, y1, x1 + Math.cos(an) * 10, y1 + Math.sin(an) * 10, '#ffffff', 1); }
          break;
        }
        case 'whip': {
          if (!o.pts) break;
          for (let k = 1; k < o.pts.length; k++) { const [ax, ay] = o.pts[k - 1], [bx, by] = o.pts[k]; this.line(g, X(ax), X(ay), X(bx), X(by), o.dk, 4); this.line(g, X(ax), X(ay), X(bx), X(by), k > 5 ? o.cl : o.color, 2); }
          const tip = o.pts[o.pts.length - 1];
          drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, X(tip[0]), X(tip[1]), 1, Math.floor(T * 20) & 3);
          if (o.life / o.max < 0.45) for (let k = 0; k < 5; k++) { const an = k * 1.256 + T * 9; this.line(g, X(tip[0]), X(tip[1]), X(tip[0]) + Math.cos(an) * 12, X(tip[1]) + Math.sin(an) * 12, '#ffffff', 1); }
          break;
        }
        case 'chargev': {
          const p = clamp(1 - o.life / o.max, 0, 1), r = Math.round(4 + p * 16);
          g.globalAlpha = 0.5; fillDisc(g, x, y, r + 6, o.color); g.globalAlpha = 1; fillDisc(g, x, y, r, o.cl); fillDisc(g, x, y, Math.max(1, r - 5), '#ffffff');
          pixRing(g, x, y, r + 10 - Math.round((T * 60) % 10), o.color, 1);
          break;
        }
        case 'drain': {
          const t = this.fighters[o.target];
          if (!t) break;
          const tx = X(t.x), ty = X(this.bodyY(t)), n = 16;
          let px = x, py = y;
          for (let k = 1; k <= n; k++) { const q = k / n, wob = Math.sin(q * 12 + T * 20) * 5 * Math.sin(q * Math.PI), qx = x + (tx - x) * q - (ty - y) / Math.max(1, Math.hypot(tx - x, ty - y)) * wob, qy = y + (ty - y) * q + (tx - x) / Math.max(1, Math.hypot(tx - x, ty - y)) * wob; this.line(g, px, py, qx, qy, k & 1 ? o.color : o.cl, 3); px = qx; py = qy; }
          fillDisc(g, tx, ty, 6, o.color); fillDisc(g, tx, ty, 3, '#ffffff');
          break;
        }
        case 'storm':
          if (o.life > 0.2) { const R = X(o.cloudR); g.globalAlpha = 0.55; for (let k = 0; k < 6; k++) fillEll(g, x + Math.cos(k * 1.05 + T) * R * 0.5, y - X(90) + Math.sin(k * 2.1) * 6, R * 0.45, 12, k & 1 ? '#3a3450' : '#5a5470'); g.globalAlpha = 1; }
          break;

        case 'beam': {
          const fade = clamp(o.life / 0.1, 0.25, 1), start = clamp(o.age / 0.06, 0.3, 1);
          const w = Math.max(2, Math.round(o.w * RS * (0.8 + 0.2 * Math.sin(T * 50)) * fade * start));
          const one = (an) => {
            const sx0 = x + Math.cos(an) * 12, sy0 = y + Math.sin(an) * 12, L = X(o.len);
            this.stamp(g, sx0, sy0, an, L, w + 4, o.dk, 1.5, T);
            this.stamp(g, sx0, sy0, an, L, w, o.color, 1.5, T);
            this.stamp(g, sx0, sy0, an, L, Math.max(1, Math.round(w * 0.55)), o.cl, 1, T);
            this.stamp(g, sx0, sy0, an, L, Math.max(1, Math.round(w * 0.2)), '#ffffff', 0, T);
            const fr = Math.round(w * 0.7 + 3 + Math.sin(T * 40) * 2);
            fillDisc(g, sx0, sy0, fr + 2, o.color); fillDisc(g, sx0, sy0, fr, o.cl); fillDisc(g, sx0, sy0, Math.max(1, fr - 3), '#ffffff');
            const ex = sx0 + Math.cos(an) * L, ey = sy0 + Math.sin(an) * L;
            for (let k = 0; k < 4; k++) { const sa = T * 9 + k * Math.PI / 2; this.line(g, ex, ey, ex + Math.cos(sa) * (w + 4), ey + Math.sin(sa) * (w + 4), k & 1 ? o.cl : '#ffffff', 1); }
          };
          one(o.ang); if (o.both) one(o.ang + Math.PI);
          break;
        }
        case 'blast':
          if (!o.trig && o.lob) {
            const p = clamp(o.age / Math.max(0.05, o.delay0), 0, 1), x0 = X(o.lob.x0), y0 = X(o.lob.y0);
            const hgt = X(18 + Math.hypot(o.x - o.lob.x0, o.y - o.lob.y0) * 0.35);
            const lx = x0 + (x - x0) * p, ly = y0 + (y - y0) * p;
            g.globalAlpha = 0.35; fillEll(g, lx, ly + 4, 6, 2, '#000000'); g.globalAlpha = 1;
            drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, lx, ly - Math.sin(p * Math.PI) * hgt, o.r >= 24 ? 2 : 1, Math.floor(T * 14) & 3);
          }
          if (o.trig) {
            const p = clamp((o.age - o.trigAge) / 0.4, 0, 1), r = X(o.r);
            if (p < 0.18) { fillDisc(g, x, y, r * 0.65 * (1 - p * 3), '#ffffff'); fillDisc(g, x, y, r * 0.4 * (1 - p * 3), o.cl); }
            g.globalAlpha = 1 - p;
            g.drawImage(discCanvas(r, o.cl, Math.floor(T * 30) % 3), x - r, y - r);
            g.drawImage(discCanvas(Math.round(r * 0.7), o.color, Math.floor(T * 30 + 1) % 3), x - Math.round(r * 0.7), y - Math.round(r * 0.7));
            g.globalAlpha = 1;
            pixRing(g, x, y, r * (0.45 + p * 0.65), o.color, 3);
            if (p < 0.7) pixRing(g, x, y, r * (0.25 + p * 1.05), '#ffffff', 2);
            if (p < 0.5) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + o.trigAge * 7, r0 = r * (0.3 + p), r1 = r * (0.55 + p * 1.2); this.line(g, x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1, k & 1 ? '#ffffff' : o.cl, 2); }
          }
          break;
      }
    }
    this.drawParts(g, X);
    // 위층: 나무 그늘, 환경 입자, 폭풍
    for (const cp of m.canopies) {
      const under = this.fighters.some((f) => f.alive && dist2(f.x, f.y - 6, cp.cx, cp.cy) < cp.r * cp.r);
      g.globalAlpha = under ? 0.45 : 0.95;
      g.drawImage(cp.cv, X(cp.x), X(cp.y + Math.sin(T * 0.8 + cp.cx) * 0.4));
    }
    g.globalAlpha = 1;
    for (const p of this.amb) {
      const a = Math.min(1, p.life / 0.5, (p.max - p.life) / 0.5);
      if (p.ff != null && Math.sin(T * 3 + p.ff) <= -0.2) continue;
      g.globalAlpha = a; g.fillStyle = p.c;
      if (p.sw != null) { g.fillRect(X(p.x), X(p.y), 3, 2); g.fillStyle = '#ffffff'; g.fillRect(X(p.x), X(p.y), 1, 1); }
      else if (p.ff != null) { g.fillRect(X(p.x) - 1, X(p.y), 3, 1); g.fillRect(X(p.x), X(p.y) - 1, 1, 3); }
      else g.fillRect(X(p.x), X(p.y), 2, 2);
    }
    g.globalAlpha = 1;
    if (this.stormR != null) {
      const cx = X(W / 2), cy = X(H / 2), r = X(this.stormR);
      g.save();
      g.beginPath(); g.rect(0, 0, W * RS, H * RS); g.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2, true);
      g.fillStyle = 'rgba(90,20,90,0.38)'; g.fill();
      g.restore();
      const n = Math.max(40, Math.round(r / 3));
      for (let k = 0; k < n; k++) { const an = k / n * 6.283 + T * 0.3; if ((k + Math.floor(T * 8)) % 3 === 0) continue; g.fillStyle = k % 2 ? '#ff5ad0' : '#ffb0f0'; g.fillRect(Math.round(cx + Math.cos(an) * r) - 1, Math.round(cy + Math.sin(an) * r) - 1, 3, 3); }
      pixRing(g, cx, cy, r, 'rgba(255,90,208,0.5)', 1);
      if (Math.random() < 0.6) { const an = Math.random() * 6.283; this.addP('streak', W / 2 + Math.cos(an) * this.stormR, H / 2 + Math.sin(an) * this.stormR, Math.cos(an) * 30, Math.sin(an) * 30 - 10, 0.5, '#ff8ad0', 1); }
    }
    this.drawLights(g, T, X);
    if (this.flash) { g.globalAlpha = (this.flash.a || 0.4) * (this.flash.t / this.flash.max); g.fillStyle = this.flash.c; g.fillRect(0, 0, W * RS, H * RS); g.globalAlpha = 1; }
    this.blit();
  }
  drawParts(g, X) {
    for (const p of this.parts) {
      const a = p.life / p.max, x = X(p.x), y = X(p.y - p.z);
      switch (p.k) {
        case 'px':
          if (p.tw && Math.random() < 0.3) break;
          if (p.z > 0.5) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, X(p.y), p.s + 1, 1); }
          g.fillStyle = p.c; g.fillRect(x, y, p.s + 1, p.s + 1);
          if (p.s >= 2) { g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); }
          break;
        case 'streak': {
          const l = Math.hypot(p.vx, p.vy) || 1, n = Math.min(12, Math.max(3, Math.round(l / 18)));
          g.fillStyle = p.c;
          for (let i = 0; i < n; i++) { g.globalAlpha = 1 - i / n; g.fillRect(Math.round(x - p.vx / l * i), Math.round(y - p.vy / l * i), 1, 1); }
          g.globalAlpha = 1;
          break;
        }
        case 'gly': g.globalAlpha = Math.min(1, a * 2); drawGlyph(g, p.rows, p.c, x, y, 1, 0); g.globalAlpha = 1; break;
        case 'smoke': g.globalAlpha = a * 0.6; fillDisc(g, x, y, X(p.s * (1.6 - a * 0.6) * 0.8), p.c); g.globalAlpha = a * 0.3; fillDisc(g, x - 1, y - 1, X(p.s * (1.6 - a * 0.6) * 0.45), light(p.c, 0.3)); g.globalAlpha = 1; break;
        case 'ring': g.globalAlpha = Math.min(1, a * 1.5); pixRing(g, x, y, X(lerp(p.r1, p.r0, a)), p.c, p.r1 > 8 ? 2 : 1); g.globalAlpha = 1; break;
        case 'flash': {
          const r = X(p.s);
          fillDisc(g, x, y, r, p.c);
          g.fillStyle = '#ffffff'; g.fillRect(x - r - 4, y, r * 2 + 9, 1); g.fillRect(x, y - r - 4, 1, r * 2 + 9);
          break;
        }
        case 'pat': {
          if (p.tw && Math.random() < 0.25) break;
          const rows = PAT[p.pat] || PAT.plus, s = p.big ? 3 : 2;
          g.globalAlpha = Math.min(1, a * 2);
          for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) if (rows[yy][xx] === '#') { g.fillStyle = p.c; g.fillRect(x - s + xx * s, y - s + yy * s, s, s); }
          g.fillStyle = '#ffffff'; if (rows[0][1] === '#') g.fillRect(x, y - s, 1, 1);
          g.globalAlpha = 1;
          break;
        }
        case 'aim': {
          g.globalAlpha = a;
          const L = X(p.s), x0 = X(p.x), y0 = X(p.y);
          this.line(g, x0, y0, x0 + p.vx * L, y0 + p.vy * L, p.c, 3);
          this.line(g, x0, y0, x0 + p.vx * L, y0 + p.vy * L, '#ffffff', 1);
          g.globalAlpha = 1;
          break;
        }
        case 'bolt':
          for (let i = 1; i < p.pts.length; i++) { const [ax, ay] = p.pts[i - 1], [bx, by] = p.pts[i]; this.line(g, X(ax), X(ay), X(bx), X(by), p.c, 2); this.line(g, X(ax), X(ay), X(bx), X(by), '#ffffff', 1); }
          break;
      }
    }
  }
  drawLights(g, T, X) {
    const m = this.map, night = this.night;
    if (night) { g.fillStyle = this.mapIdx === 1 ? 'rgba(30,6,10,0.18)' : 'rgba(8,6,30,0.22)'; g.fillRect(0, 0, W * RS, H * RS); }
    g.globalCompositeOperation = 'lighter';
    const L = (x, y, r, c, a) => { const cv = glowCanvas(c, r * RS); g.globalAlpha = a; g.drawImage(cv, X(x) - (cv.width >> 1), X(y) - (cv.height >> 1)); };
    const base = night ? 0.9 : 0.45;
    for (const l of m.lightsAll) {
      const fl = l.f === 1 ? (Math.sin(T * 9 + l.x) > -0.85 ? 1 : 0.3) : l.f === 2 ? 0.8 + 0.2 * Math.sin(T * 7 + l.x) : l.f === 3 ? 0.75 + 0.25 * Math.sin(T * 2 + l.x * 0.1) : 1;
      L(l.x, l.y, l.r, l.c, base * fl * 0.8);
    }
    for (const o of this.objs) {
      if (o.delay > 0) continue;
      if (o.kind === 'shot') L(o.x, o.y, 8 + o.r * 4, o.color, base * 0.75);
      else if (o.kind === 'beam') { const ca = Math.cos(o.ang), sa = Math.sin(o.ang); for (let d = 0; d <= o.len; d += 22) { L(o.x + ca * d, o.y + sa * d, 10 + o.w * 2, o.color, base * 0.5); if (o.both) L(o.x - ca * d, o.y - sa * d, 10 + o.w * 2, o.color, base * 0.5); } }
      else if (o.kind === 'zone' && !o.aura) L(o.x, o.y, o.r * 1.6, o.color, base * 0.35);
      else if (o.kind === 'blast' && o.trig) { const p = clamp((o.age - o.trigAge) / 0.4, 0, 1); L(o.x, o.y, o.r * 2.2, o.color, base * (1 - p)); }
      else if (o.kind === 'blast') L(o.x, o.y, o.r, o.color, base * 0.25);
      else if (o.kind === 'circle') L(o.x, o.y, o.r * 2, o.color, base * 0.6 * (o.life / o.max));
      else if (o.kind === 'orbit' || o.kind === 'chaser' || o.kind === 'turret' || o.kind === 'pest') L(o.x, o.y - 4, 12, o.color, base * 0.35);
    }
    for (const p of this.parts) if (p.k === 'light') L(p.x, p.y, p.s, p.c, base * (p.life / p.max));
    for (const f of this.fighters) {
      if (!f.alive) continue;
      if (f.castT > 0 && f.castC) L(f.x, this.bodyY(f), 22, f.castC, base * 0.6);
      if (f.spec.look.aura !== 'none' && !f.st.invis) L(f.x, this.bodyY(f), 16, f.spec.look.accent, base * 0.25);
    }
    if (m.ambient === 'firefly') for (const p of this.amb) if (Math.sin(T * 3 + p.ff) > -0.2) L(p.x, p.y, 8, p.c, 0.6);
    if (m.ambient === 'ember') for (const p of this.amb) L(p.x, p.y, 6, p.c, 0.4);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  drawFighter(g, f, T) {
    if (!f.alive && f.koT > 2.2 && (Math.floor(T * 10) & 1)) return;
    if (!f.alive && f.koT > 3.2) return;
    const X = (v) => Math.round(v * RS);
    const sz = f.size;
    const hopU = f.moveMode === 'hop' && f.alive && Math.hypot(f.x - f.px, f.y - f.py) > 0.3 ? Math.abs(Math.sin(T * 9 + f.seed)) * 4 : 0;
    let airU = f.st.air ? 10 + Math.sin(T * 9) * 2 : 0;
    if (f.leap) airU = Math.sin(Math.min(1, f.leap.t / f.leap.dur) * Math.PI) * f.leap.h;
    else if (f.leapVis) { const p = (T - f.leapVis.t0) / f.leapVis.dur; if (p >= 0 && p <= 1) airU = Math.sin(p * Math.PI) * f.leapVis.h; else f.leapVis = null; }
    const fx = X(f.x + (f.st.dance ? Math.sin(T * 18) * 1.5 : 0)), fy = X(f.y), lift = X(hopU + airU);
    // 허수아비: 발밑 과녁과 나무 기둥
    if (f.dummy && f.alive) {
      for (const [r, c] of [[18, '#ff4d6d'], [12, '#f6edd9'], [6, '#ff4d6d']]) {
        g.fillStyle = c;
        for (let a = 0, n = r * 5; a < n; a++) { const t = a / n * Math.PI * 2; g.fillRect(Math.round(fx + Math.cos(t) * r), Math.round(fy + 1 + Math.sin(t) * r * 0.42), 2, 2); }
      }
      g.fillStyle = '#5a3a1e'; g.fillRect(fx - 1, fy - 4, 3, 6);
    }
    // 그림자와 발밑 표시
    if (f.alive) {
      const rx = Math.round(8 * sz), ry = Math.max(2, Math.round(3 * sz));
      fillEll(g, fx, fy + 1, rx + 1, ry, 'rgba(0,0,0,0.38)');
      if (!(f.st.invis && !(f.owned && !f.bot))) { for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; if (Math.sin(t) < -0.2) continue; g.fillStyle = f.color; g.fillRect(Math.round(fx + Math.cos(t) * (rx + 1)), Math.round(fy + 1 + Math.sin(t) * (ry + 1)), 2, 1); } }
    }
    if (f.alive && f.st.morph) {
      const mo = f.morph || { gm: { shape: 'paw' }, color: f.spec.look.accent };
      drawGlyph(g, moveRows(mo.gm, T), mo.color, fx, fy - 14 - Math.abs(Math.sin(T * 12)) * 6, 2, f.dir === 3 ? 2 : 0);
      if (Math.random() < 0.1) this.addP('pat', f.x, f.y - 10, 0, -10, 0.5, ST_COLOR.morph, 1, { pat: 'plus' });
      const top = fy - 40;
      g.fillStyle = '#0b0820'; g.fillRect(fx - 16, top - 1, 33, 6);
      g.fillStyle = f.color; g.fillRect(fx - 15, top, Math.max(0, Math.round(31 * f.hp / f.maxHp)), 4);
      return;
    }
    if (f.alive && f.st.dance && Math.random() < 0.15) this.addP('pat', f.x + rnd(-5, 5), f.y - 12, rnd(-6, 6), -14, 0.6, pick(['#ff8ad0', '#ffe14a', '#7fd8ff']), 1, { pat: 'note' });
    if (f.alive && f.st.sleep && Math.random() < 0.06) this.addP('pat', f.x + 3, f.y - 12, 6, -10, 0.9, '#c8d8ff', 1, { pat: 'z' });
    if (f.alive && this.vision === 'cute' && this.visionOf && f !== this.visionOf && Math.random() < 0.12) this.addP('pat', f.x + rnd(-6, 6), f.y - 14 * f.size, rnd(-8, 8), -16, 0.8, pick(['#ff8ad0', '#ffb3d9', '#ff5a9a']), 1, { pat: 'heart' });
    if (f.alive && f.exposed) { const ay = fy - Math.round(30 * sz) - Math.round(Math.abs(Math.sin(T * 6)) * 3); g.fillStyle = '#ff4d6d'; for (let k = 0; k < 4; k++) g.fillRect(fx - 3 + k, ay + k, 7 - k * 2, 1); }
    renderSprite(f.spr, f.look || f.spec.look, { pose: f.st.dance ? (Math.floor(T * 6) % 2 ? 'cast' : 'run') : f.pose, t: T + f.idx * 0.37, seed: f.seed, dir: f.dir === 3 ? 2 : f.dir, hurt: f.pose === 'hurt' || !!f.st.sleep, st: f.st, hurtFlash: f.flashT > 0, glow: f.castC });
    const dw = Math.round(SW * sz), dh = Math.round(SH * sz);
    let alpha = 1;
    if (f.st.invis) alpha = f.owned && !f.bot ? 0.4 : 0.1;
    if (f.invT > 0 && (Math.floor(T * 20) & 1)) alpha *= 0.5;
    if (this.vision === 'noself' && this.visionOf === f && f.alive) alpha = 0.05;
    g.globalAlpha = alpha;
    if (!f.alive) {
      g.save(); g.translate(fx, fy - 6); g.rotate(Math.PI / 2);
      g.drawImage(f.spr, 0, 0, SW, SH, -Math.round(OX * sz), -Math.round(OY * sz), dw, dh);
      g.restore(); g.globalAlpha = 1;
      return;
    }
    const squash = f.hurtT > 0 ? 2 : 0;
    const dx = fx - Math.round(OX * sz), dy = fy - Math.round(OY * sz) + squash - lift;
    if (f.dir === 3) { g.save(); g.translate(dx + dw, dy); g.scale(-1, 1); g.drawImage(f.spr, 0, 0, SW, SH, 0, 0, dw, dh - squash); g.restore(); }
    else g.drawImage(f.spr, 0, 0, SW, SH, dx, dy, dw, dh - squash);
    g.globalAlpha = 1;
    if (alpha < 0.2) return;
    const top = fy - Math.round(36 * sz) - 6 - lift, by = X(this.bodyY(f)) - lift;
    // 체력 막대
    g.fillStyle = '#0b0820'; g.fillRect(fx - 17, top - 1, 35, 7);
    g.fillStyle = '#3a3070'; g.fillRect(fx - 16, top, 33, 5);
    g.fillStyle = '#f6edd9'; g.fillRect(fx - 16, top, Math.max(0, Math.round(33 * f.hpShow / f.maxHp)), 5);
    g.fillStyle = f.color; g.fillRect(fx - 16, top, Math.max(0, Math.round(33 * f.hp / f.maxHp)), 5);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(fx - 16, top, Math.max(0, Math.round(33 * f.hp / f.maxHp)), 1);
    for (let k = 1; k < 4; k++) { g.fillStyle = '#0b0820'; g.fillRect(fx - 16 + Math.round(33 * k / 4), top + 3, 1, 2); }
    if (f.stPow && f.stPow.shield) { g.fillStyle = '#7fd0ff'; g.fillRect(fx - 16, top - 3, Math.min(33, Math.round(33 * f.stPow.shield / f.maxHp)), 2); }
    if (this.focus.includes(f.idx) && this.fighters.length > 1) { const b = Math.floor(T * 3) % 2 * 2; g.fillStyle = '#ffffff'; g.fillRect(fx - 3, top - 9 - b, 7, 2); g.fillRect(fx - 2, top - 7 - b, 5, 1); g.fillRect(fx - 1, top - 6 - b, 3, 1); g.fillRect(fx, top - 5 - b, 1, 1); }
    if (f.st.shield) { pixRing(g, fx, by, X(9 * sz), (Math.floor(T * 8) & 1) ? ST_COLOR.shield : '#cfefff', 1); pixRing(g, fx, by, X(9 * sz) - 3, 'rgba(127,208,255,0.4)', 1); }
    if (f.st.reflect) pixRing(g, fx, by, X(10 * sz), (Math.floor(T * 10) & 1) ? '#ffffff' : ST_COLOR.reflect, 2);
    if (f.st.stun) for (let i = 0; i < 3; i++) { const a = T * 7 + i * 2.1, sx = Math.round(fx + Math.cos(a) * 13), sy = Math.round(top + 10 + Math.sin(a) * 4); g.fillStyle = '#ffe14a'; g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); g.fillStyle = '#ffffff'; g.fillRect(sx, sy, 1, 1); }
    if (f.st.freeze) { for (const [ix, iy, h] of [[-12, 0, 8], [-6, -2, 12], [5, -1, 10], [10, 1, 7]]) { g.fillStyle = '#cff4ff'; g.fillRect(fx + ix, fy - h + iy, 3, h); g.fillStyle = '#ffffff'; g.fillRect(fx + ix, fy - h + iy, 1, h); } }
    if (f.st.root) { g.fillStyle = ST_COLOR.root; for (const ix of [-10, -4, 3, 9]) { g.fillRect(fx + ix, fy - 6, 2, 7); g.fillRect(fx + ix + 1, fy - 9, 1, 3); } g.fillRect(fx - 12, fy, 25, 2); }
    if (f.st.slip) { fillEll(g, fx, fy + 3, 12, 2, 'rgba(201,245,255,0.6)'); }
    if (f.st.silence) { g.fillStyle = ST_COLOR.silence; for (let k = 0; k < 3; k++) g.fillRect(fx + 14 + k * 3, top + 6, 2, 2); }
    if (f.st.confuse) for (let k = 0; k < 6; k++) { const a = T * 6 + k; g.fillStyle = ST_COLOR.confuse; g.fillRect(Math.round(fx + Math.cos(a) * (4 + k * 1.5)), Math.round(top + 4 + Math.sin(a) * (2 + k * 0.6)), 2, 2); }
    if (f.warn && (Math.floor(T * 8) & 1)) { g.fillStyle = '#c5f24a'; g.fillRect(fx - 1, top - 20, 3, 9); g.fillRect(fx - 1, top - 9, 3, 3); }
    if (f.wind) {
      const p = 1 - f.wind.t / f.wind.total;
      g.fillStyle = '#0b0820'; g.fillRect(fx - 17, top - 9, 35, 6);
      g.fillStyle = '#c5f24a'; g.fillRect(fx - 16, top - 8, Math.round(33 * p), 4);
    } else if (f.pose === 'wind' && (Math.floor(T * 10) & 1)) { g.fillStyle = '#c5f24a'; g.fillRect(fx - 16, top - 8, 33, 4); }
  }

  /** 월드 → 화면, 그 위에 글자와 표시 */
  blit() {
    const cv = this.scv, sg = this.sg, v = this.viewRect();
    const SWp = cv.width, SHp = cv.height, k = SWp / v.w;
    let ox = 0, oy = 0;
    const vis = this.visT && this.visT.t > 0 ? this.visT.k : this.visionOf && this.visionOf.alive ? this.vision : null;
    if (vis === 'shake') this.shake = Math.max(this.shake, 2.2);
    if (this.shake > 0.4) { ox = (Math.random() * 2 - 1) * this.shake * k * 0.8; oy = (Math.random() * 2 - 1) * this.shake * k * 0.8; }
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.imageSmoothingEnabled = false;
    sg.fillStyle = '#0b0820'; sg.fillRect(0, 0, SWp, SHp);
    this.flipY = vis === 'flip'; this.flipX = vis === 'mirror';
    sg.save();
    if (this.flipY) { sg.translate(0, SHp); sg.scale(1, -1); }
    if (this.flipX) { sg.translate(SWp, 0); sg.scale(-1, 1); }
    sg.drawImage(this.wcv, v.x * RS, v.y * RS, v.w * RS, v.h * RS, Math.round(ox), Math.round(oy), SWp, SHp);
    sg.restore();
    if (vis === 'dark') {
      const f = this.visionOf, cx = (f.x - v.x) * k, cy = (f.y - 5 - v.y) * k, r = 30 * k;
      const gr = sg.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.3);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.96)');
      sg.fillStyle = gr; sg.fillRect(0, 0, SWp, SHp);
    }
    if (!this.vig || this.vig.width !== SWp || this.vig.height !== SHp) {
      const m = document.createElement('canvas'); m.width = SWp; m.height = SHp;
      const vg = m.getContext('2d'), gr = vg.createRadialGradient(SWp / 2, SHp / 2, SHp * 0.35, SWp / 2, SHp / 2, SWp * 0.62);
      gr.addColorStop(0, 'rgba(11,8,32,0)'); gr.addColorStop(1, 'rgba(11,8,32,0.45)');
      vg.fillStyle = gr; vg.fillRect(0, 0, SWp, SHp); this.vig = m;
    }
    sg.drawImage(this.vig, 0, 0);
    if (this.wx) {
      const w = this.wx, a = Math.min(1, w.t / 0.4, (w.max - w.t) / 0.4 + 0.2), T = this.t;
      sg.save(); sg.globalAlpha = a;
      if (w.k === 'rain' || w.k === 'thunder') { sg.fillStyle = 'rgba(20,30,60,0.35)'; sg.fillRect(0, 0, SWp, SHp); sg.strokeStyle = 'rgba(170,200,255,0.75)'; sg.lineWidth = Math.max(1, k * 0.5); sg.beginPath(); for (let i = 0; i < 90; i++) { const x0 = ((i * 97.3 + T * 40) % (SWp + 40)) - 20, y0 = ((i * 53.7 + T * 900) % (SHp + 60)) - 30; sg.moveTo(x0, y0); sg.lineTo(x0 - 4 * k * 0.3, y0 + 14 * k * 0.4); } sg.stroke(); }
      if (w.k === 'night') { sg.fillStyle = 'rgba(5,5,25,0.72)'; sg.fillRect(0, 0, SWp, SHp); sg.fillStyle = '#fff7c2'; sg.beginPath(); sg.arc(SWp * 0.85, SHp * 0.15, 18 * k * 0.4, 0, 6.3); sg.fill(); }
      if (w.k === 'snow' || w.k === 'cold') { sg.fillStyle = 'rgba(200,230,255,0.22)'; sg.fillRect(0, 0, SWp, SHp); sg.fillStyle = '#ffffff'; for (let i = 0; i < 70; i++) { const x0 = ((i * 71.3 + Math.sin(T + i) * 20) % SWp + SWp) % SWp, y0 = ((i * 41.7 + T * 60) % SHp); sg.fillRect(x0, y0, 2 * k * 0.4, 2 * k * 0.4); } }
      if (w.k === 'hot') { sg.fillStyle = 'rgba(255,120,40,0.22)'; sg.fillRect(0, 0, SWp, SHp); }
      if (w.k === 'wind') { sg.strokeStyle = 'rgba(255,255,255,0.5)'; sg.lineWidth = Math.max(1, k * 0.4); sg.beginPath(); for (let i = 0; i < 24; i++) { const y0 = (i * 37.3) % SHp, x0 = ((i * 113 + T * 700) % (SWp + 200)) - 100; sg.moveTo(x0, y0); sg.lineTo(x0 + 60 * k * 0.3, y0); } sg.stroke(); }
      if (w.k === 'thunder' && Math.sin(T * 13) > 0.97) { sg.fillStyle = 'rgba(255,255,255,0.5)'; sg.fillRect(0, 0, SWp, SHp); }
      sg.restore();
    }
    this.drawText(v, k);
  }

  drawText(v, k) {
    const cv = this.scv, g = this.sg;
    const dpr = cv.width / Math.max(1, cv.clientWidth || cv.width);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const base = Math.max(10 * dpr, 3.9 * k);
    const body = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    const disp = '"Black Han Sans", ' + body;
    const S = (x, y) => { let sx = (x - v.x) * k, sy = (y - v.y) * k; if (this.flipX) sx = cv.width - sx; if (this.flipY) sy = cv.height - sy; return [sx, sy]; };
    const txt = (s, x, y, size, color, font, al) => {
      g.font = `${font === disp ? '' : '600 '}${Math.round(size)}px ${font || body}`;
      g.textAlign = al || 'center';
      g.lineWidth = Math.max(2, size * 0.26); g.strokeStyle = '#0b0820';
      g.strokeText(s, x, y); g.fillStyle = color; g.fillText(s, x, y);
      g.textAlign = 'center';
    };
    for (const f of this.fighters) {
      if (f.gone || (!f.alive && f.koT > 2.5)) continue;
      if (f.st.invis && !(f.owned && !f.bot)) continue;
      const [x, y] = S(f.x, f.y - 14.5 * f.size - 6);
      if (x < -40 || x > cv.width + 40 || y < -20 || y > cv.height + 40) continue;
      txt(f.name, x, y - base * 0.1, base * 0.82, f.color);
      if (f.say) {
        const s = f.say.text, by = y - base * 1.55;
        g.font = `600 ${Math.round(base)}px ${body}`;
        const w = g.measureText(s).width + base * 0.9, hh = base * 1.5;
        const bg = f.say.shout ? '#ffffff' : f.say.side ? '#e8ff9a' : '#f6edd9';
        g.fillStyle = bg; g.fillRect(x - w / 2, by - hh / 2, w, hh);
        g.beginPath(); g.moveTo(x - base * 0.25, by + hh / 2); g.lineTo(x + base * 0.25, by + hh / 2); g.lineTo(x, by + hh / 2 + base * 0.35); g.closePath(); g.fill();
        g.strokeStyle = '#0b0820'; g.lineWidth = Math.max(1.5, dpr); g.strokeRect(x - w / 2, by - hh / 2, w, hh);
        g.fillStyle = '#0b0820'; g.fillText(s, x, by + base * 0.05);
      }
    }
    for (const p of this.pops) {
      const a = p.t > p.life - 0.2 ? clamp((p.life - p.t) / 0.2, 0, 1) : 1;
      g.globalAlpha = a;
      const grow = p.t < 0.1 ? 1 + (0.1 - p.t) * 6 : 1;
      let [x, y] = S(p.x, p.y);
      const fs = base * p.s * grow;
      g.font = `${p.s > 1.1 ? '' : '600 '}${Math.round(fs)}px ${p.s > 1.1 ? disp : body}`;
      const hw = g.measureText(p.text).width / 2 + fs * 0.2;
      x = clamp(x, hw, cv.width - hw);
      txt(p.text, x, y, fs, p.color, p.s > 1.1 ? disp : null);
    }
    g.globalAlpha = 1;
    // 만화 의성어 (뾰족한 말풍선 + 기울어진 글자)
    for (const b of this.bursts) {
      const [x, y] = S(b.x, b.y - b.t * 10);
      if (x < -60 || x > cv.width + 60 || y < -60 || y > cv.height + 60) continue;
      const pin = b.t < 0.08 ? 0.4 + b.t / 0.08 * 0.9 : b.t < 0.16 ? 1.3 - (b.t - 0.08) / 0.08 * 0.3 : 1;
      const fade = b.t > b.life - 0.15 ? clamp((b.life - b.t) / 0.15, 0, 1) : 1;
      const size = base * (b.big ? 2.6 : 1.85) * pin;
      g.save(); g.translate(x, y); g.rotate(b.rot); g.globalAlpha = fade;
      g.font = `${Math.round(size)}px ${disp}`;
      const tw = g.measureText(b.text).width;
      const rx = tw * 0.62 + size * 0.35, ry = size * 0.85, spikes = b.big ? 14 : 10;
      g.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const an = (i / (spikes * 2)) * Math.PI * 2, rr = i % 2 ? 0.72 : 1 + ((i * 37) % 7) * 0.03;
        const px = Math.cos(an) * rx * rr, py = Math.sin(an) * ry * rr;
        if (i) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.closePath();
      g.fillStyle = b.big ? '#ff4d6d' : '#ffffff'; g.fill();
      g.lineWidth = Math.max(2, size * 0.12); g.strokeStyle = '#0b0820'; g.stroke();
      g.textAlign = 'center';
      g.lineWidth = Math.max(2, size * 0.22); g.strokeStyle = '#0b0820'; g.strokeText(b.text, 0, size * 0.04);
      g.fillStyle = b.big ? '#ffcf3a' : b.color; g.fillText(b.text, 0, size * 0.04);
      g.restore();
    }
    g.globalAlpha = 1;
    // 화면 밖의 상대
    for (const f of this.fighters) {
      if (!f.alive || this.focus.includes(f.idx)) continue;
      const [x, y] = S(f.x, f.y - 5);
      const m = base * 1.4;
      if (x >= -4 && x <= cv.width + 4 && y >= -4 && y <= cv.height + 4) continue;
      const cx = cv.width / 2, cy = cv.height / 2, dx = x - cx, dy = y - cy;
      const s = Math.min((cx - m) / Math.max(1, Math.abs(dx)), (cy - m) / Math.max(1, Math.abs(dy)));
      const ax = cx + dx * s, ay = cy + dy * s, an = Math.atan2(dy, dx), r = base * 0.75;
      g.save(); g.translate(ax, ay); g.rotate(an);
      g.beginPath(); g.moveTo(r * 1.4, 0); g.lineTo(-r * 0.8, -r); g.lineTo(-r * 0.8, r); g.closePath();
      g.fillStyle = f.color; g.strokeStyle = '#0b0820'; g.lineWidth = Math.max(2, dpr * 1.5); g.stroke(); g.fill();
      g.restore();
      const dist = Math.round(Math.hypot(f.x - (v.x + v.w / 2), f.y - (v.y + v.h / 2)) / 10);
      txt(dist + 'm', ax - Math.cos(an) * r * 2.4, ay - Math.sin(an) * r * 2.4, base * 0.7, f.color);
    }
    // 처치 알림
    this.feed.forEach((e, i) => {
      g.globalAlpha = Math.min(1, e.t / 0.4);
      const y = base * 1.6 + i * base * 1.5, x = base * 0.6;
      g.font = `600 ${Math.round(base * 0.85)}px ${body}`;
      const s = (e.a ? e.a.name + ' ▸ ' : '☠ ') + e.b.name;
      const w = g.measureText(s).width + base;
      g.fillStyle = 'rgba(11,8,32,0.7)'; g.fillRect(x, y - base * 0.65, w, base * 1.3);
      if (e.a) { txt(e.a.name, x + base * 0.5, y, base * 0.85, e.a.color, null, 'left'); const aw = g.measureText(e.a.name + ' ').width; txt('▸ ', x + base * 0.5 + aw, y, base * 0.85, '#f6edd9', null, 'left'); const bw = g.measureText('▸ ').width; txt(e.b.name, x + base * 0.5 + aw + bw, y, base * 0.85, e.b.color, null, 'left'); }
      else { txt('☠ ', x + base * 0.5, y, base * 0.85, '#f6edd9', null, 'left'); const aw = g.measureText('☠ ').width; txt(e.b.name, x + base * 0.5 + aw, y, base * 0.85, e.b.color, null, 'left'); }
    });
    g.globalAlpha = 1;
    if (this.banner) {
      const b = this.banner, a = clamp(b.t / 0.25, 0, 1), slide = clamp(((b.max || 1.3) - b.t) / 0.15, 0, 1);
      g.globalAlpha = a;
      const hh = Math.max(base * 4.4, Math.min(cv.height * 0.15, base * 5.2)), y0 = cv.height * 0.09;
      g.fillStyle = 'rgba(11,8,32,0.8)'; g.fillRect(0, y0, cv.width, hh);
      g.fillStyle = b.color; g.fillRect(0, y0, cv.width * slide, Math.max(2, k * 0.8)); g.fillRect(cv.width * (1 - slide), y0 + hh - Math.max(2, k * 0.8), cv.width, Math.max(2, k * 0.8));
      let tx = cv.width / 2;
      if (b.spec) {
        if (!this.bannerSpr || this.bannerSpr.spec !== b.spec) { const m = makeCanvas(SW, SH); renderSprite(m[0], b.spec.look, { pose: 'cast', t: 0, dir: 2, st: {}, glow: b.color }); this.bannerSpr = { spec: b.spec, cv: m[0] }; }
        const ps = hh * 0.9 / SH, px = cv.width * 0.5 - hh * 2.3 + (1 - slide) * -cv.width * 0.3;
        g.drawImage(this.bannerSpr.cv, px, y0 + hh * 0.06, SW * ps, SH * ps);
        if (b.rows) g.drawImage(glyphCanvas(b.rows, b.color, 0), px + SW * ps * 0.85, y0 + hh * 0.25, hh * 0.5, hh * 0.5);
        tx = cv.width / 2 + hh * 0.5;
      }
      if (b.who) txt(b.who, tx, y0 + hh * 0.26, base * 1.05, '#f6edd9');
      txt(b.text, tx, y0 + hh * (b.who ? 0.62 : 0.5), base * 2.5, b.color, disp);
      g.globalAlpha = 1;
    }
    if (this.count > -0.6) {
      const c = this.count, s = c > 1.8 ? '3' : c > 0.9 ? '2' : c > 0 ? '1' : '시작!';
      const fr = c > 0 ? (c % 0.9) / 0.9 : 1 + c;
      txt(s, cv.width / 2, cv.height * 0.42, base * (c > 0 ? 4 + fr * 2 : 4.4), c > 0 ? '#ffcf3a' : '#ff4d6d', disp);
    }
  }

  /* ---------- 봇 ---------- */
  prefDist(f) {
    const e = f.spec.moves.basic.fx[0];
    switch (e.t) {
      case 'shot': return e.from === 'hand' ? Math.min(110, e.speed * e.life * 0.55) : e.from === 'around' ? 28 : 70;
      case 'beam': return e.len * 0.6;
      case 'blast': return e.at === 'front' ? e.off : e.at === 'self' ? e.r * 0.6 : 80;
      case 'zone': return 28;
      case 'dash': return e.dist * 0.7;
      case 'summon': return 70;
      case 'swing': return e.r * 0.7;
      case 'cone': return e.len * 0.6;
      case 'wave': return e.at === 'self' ? e.r * 0.6 : 80;
      case 'line': return 50;
      case 'chain': return e.range * 0.7;
      case 'hook': return e.range * 0.6;
      case 'lob': return 100;
      case 'thrust': case 'whip': return (e.len || 40) * 0.7;
      case 'launch': case 'flurry': return 20;
      case 'leap': case 'phantom': return e.dist * 0.7;
      case 'meteor': case 'mark': case 'storm': case 'cross': return 110;
      case 'snipe': case 'gatling': case 'spiral': case 'missiles': case 'charge': case 'net': return 100;
      case 'prism': return e.len * 0.6;
      case 'gust': return e.len * 0.5;
      case 'bite': case 'claw': return 22;
      case 'grab': case 'lasergrid': return 110;
      case 'stampede': case 'crack': case 'sonic': return 80;
      case 'pillar': return 14 + e.n * e.step * 0.5;
      case 'hop': case 'swarm': return 90;
      case 'bubble': return 100;
      case 'stomp': return e.r * 0.6;
      case 'pattern': return e.at === 'self' ? e.size * 0.6 : e.at === 'front' ? e.size : 100;
    }
    return 60;
  }
  botThink(f, dt) {
    const ai = f.ai || (f.ai = { t: 0, mx: 0, my: 0, strafe: pick([-1, 1]), lx: f.x, ly: f.y, st: 0, det: 0, dx: 0, dy: 0 });
    ai.t -= dt; ai.st += dt;
    if (ai.det > 0) ai.det -= dt;
    const out = { mx: ai.mx, my: ai.my, a: 0, b: 0, c: 0, u: 0 };
    if (ai.t > 0) return out;
    ai.t = 0.12 + Math.random() * 0.12;
    if (ai.st > 0.5) {
      if (Math.hypot(f.x - ai.lx, f.y - ai.ly) < 5 && Math.hypot(ai.mx, ai.my) > 0.5 && ai.det <= 0) {
        ai.det = 0.6;
        const a = Math.atan2(ai.my, ai.mx) + pick([-1, 1]) * Math.PI / 2;
        ai.dx = Math.cos(a); ai.dy = Math.sin(a);
      }
      ai.lx = f.x; ai.ly = f.y; ai.st = 0;
    }
    const t = this.nearest(f, true);
    if (!t) { ai.mx = 0; ai.my = 0; out.mx = 0; out.my = 0; return out; }
    const dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const pref = this.prefDist(f);
    let mx = 0, my = 0;
    if (d > pref + 14) { mx = ux; my = uy; } else if (d < pref - 18) { mx = -ux; my = -uy; }
    if (Math.random() < 0.1) ai.strafe = -ai.strafe;
    mx += -uy * ai.strafe * 0.6; my += ux * ai.strafe * 0.6;
    if (this.stormR != null) { const sx = W / 2 - f.x, sy = H / 2 - f.y, sd = Math.hypot(sx, sy) || 1; if (sd > this.stormR - 30) { mx += sx / sd * 1.5; my += sy / sd * 1.5; } }
    if (ai.det > 0) { mx = ai.dx; my = ai.dy; }
    if (f.st.confuse && Math.random() < 0.5) { mx = -mx; my = -my; }
    ai.mx = mx; ai.my = my; out.mx = mx; out.my = my;
    const mv = f.spec.moves;
    const ok = (m) => {
      const e = m.fx.find((q) => q.dmg > 0 || q.t === 'all' || q.t === 'summon') || m.fx[0];
      if (e.t === 'buff' && e.k === 'counter') return d < 60 && Math.random() < 0.5;
      switch (e.t) {
        case 'shot': return e.from === 'hand' ? d < Math.min(200, e.speed * e.life * 0.9) : e.from === 'around' ? d < 70 : d < 150;
        case 'beam': return d < e.len;
        case 'blast': case 'zone':
          if (e.at === 'self') return d < e.r + 8;
          if (e.at === 'front') return Math.abs(d - e.off) < e.r + 8;
          return d < 170;
        case 'trail': return d < 90;
        case 'dash': return e.dmg > 0 ? d < e.dist + 12 : f.hp / f.maxHp < 0.5;
        case 'blink': return d > 70;
        case 'buff': return d < 140;
        case 'heal': return f.hp / f.maxHp < 0.65;
        case 'summon': return d < 170;
        case 'all': return true;
        case 'swap': return Math.random() < 0.3;
        case 'swing': return d < e.r + 8;
        case 'cone': return d < e.len;
        case 'wave': return e.at === 'self' ? d < e.r : d < 170;
        case 'line': return d < 14 + e.n * e.step;
        case 'chain': return d < e.range * 1.2;
        case 'hook': return d < e.range && d > 30;
        case 'lob': return d < 180;
        case 'thrust': return d < e.len + 8;
        case 'whip': return d < e.len + 6;
        case 'launch': return d < e.off + e.r + 6;
        case 'flurry': return Math.abs(d - e.off) < e.r + 8;
        case 'leap': case 'phantom': return d < e.dist + 20;
        case 'meteor': case 'storm': case 'cross': return d < 180;
        case 'mark': return d < e.range;
        case 'spikering': return e.at === 'self' ? d < e.r + 10 : d < 170;
        case 'tornado': case 'roll': case 'surge': case 'missiles': case 'charge': case 'snipe': case 'gatling': case 'spiral': case 'net': return d < 200;
        case 'firewall': return d < e.off + 40;
        case 'clone': case 'top': case 'beacon': return d < 160;
        case 'vortex': case 'ring': return e.at === 'self' ? d < e.r + 10 : d < 170;
        case 'prism': return d < e.len;
        case 'skyline': return d < 22 + e.n * e.step;
        case 'gust': return d < e.len;
        case 'drain': return d < e.range;
        case 'bite': return d < e.range + 10;
        case 'claw': return d < e.r + 12;
        case 'grab': return d < e.range;
        case 'lasergrid': case 'hop': case 'swarm': return d < 200;
        case 'pattern': return e.at === 'self' ? d < e.size + 10 : e.at === 'front' ? d < e.size * 2 : d < 190;
        case 'stampede': return d < e.len;
        case 'crack': return d < e.len + 10;
        case 'pillar': return d < 20 + e.n * e.step;
        case 'bubble': return d < 190;
        case 'stomp': return d < e.r * (1 + (e.n - 1) * 0.35) + 6;
        case 'sonic': return d < e.len;
      }
      return false;
    };
    if (!f.st.silence && !f.st.morph) for (const [s, key] of KEYSLOT) if (f.cd[s] <= 0 && f.uses[s] > 0 && !f.lock[s] && (s === 'basic' || Math.random() < 0.55) && ok(mv[s])) { out[key] = 1; break; }
    return out;
  }
}

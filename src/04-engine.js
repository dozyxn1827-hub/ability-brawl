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
    this.sfx = o.sfx || (() => {});
    this.focus = o.focus || [];
    this.t = 0; this.objs = []; this.parts = []; this.pops = []; this.decals = []; this.feed = []; this.amb = [];
    this.shake = 0; this.flash = null; this.banner = null; this.hs = 0; this.bursts = []; this.punch = 0; this.slowT = 0; this.lastN = -1; this.firstKO = false;
    this.over = false; this.endT = 0; this.count = 2.7; this.stormOn = false; this.stormR = null;
    this.practice = !!o.practice;
    if (this.practice) this.count = 0;
    this.cam = null;
    this.fighters = o.roster.map((e, i) => this.mkFighter(e, i));
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
    const sp = e.spec, base = { hp: 1, speed: 1, size: 1, dmg: 1, taken: 1 };
    const uses = { basic: Infinity, s1: Infinity, s2: Infinity, ult: Infinity };
    // 부작용 효과 하나하나를 {fx, say} 목록으로 (more 포함)
    const dbs = [];
    for (const d of sp.drawbacks) for (const x of [d.fx].concat(d.more || [])) if (x) dbs.push({ fx: x, say: d.say, text: d.text });
    const lock = {}, rev = {}, hfoe = {}, rnds = {}, shout = {}, back = {}, mulS = { basic: 1, s1: 1, s2: 1, ult: 1 };
    let moveMode = null, vision = null;
    const pests = [];
    dbs.forEach((d, i) => {
      const x = d.fx, each = (fn) => SLOTS.forEach((s) => { if (onMatch(x.on, s)) fn(s); });
      switch (x.t) {
        case 'stat': if (x.stat in base) { const p = x.pct / 100; base[x.stat] *= x.stat === 'size' || x.stat === 'taken' ? 1 + p : 1 - p; } break;
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
        case 'pest': pests.push({ i, t: x.every * (0.4 + Math.random() * 0.4) }); break;
      }
    });
    base.hp = Math.max(base.hp, 0.2); base.speed = Math.max(base.speed, 0.2); base.dmg = Math.max(base.dmg, 0.05);
    base.size = Math.min(base.size, 3); base.taken = Math.min(base.taken, 3);
    const s0 = this.map.spawns[i % this.map.spawns.length];
    const maxHp = Math.round(sp.stats.hp * base.hp * HP_SCALE);
    const m = makeCanvas(SW, SH);
    const ucd = sp.moves.ult.cd * 0.4;
    const aim = Math.atan2(H / 2 - s0[1], W / 2 - s0[0]);
    return {
      idx: i, name: e.name, spec: sp, owned: !!e.owned, ctrl: e.ctrl || null, bot: !!e.bot, color: e.dummy ? '#c9a66b' : FIGHTER_COLORS[i % 4], dummy: !!e.dummy, wander: !!e.wander, tried: {}, hitT: -9,
      x: s0[0], y: s0[1], px: s0[0], py: s0[1], vx: 0, vy: 0, aim, mdir: aim, dir: ang2dir(aim),
      maxHp, hp: maxHp, hpShow: maxHp, alive: true, koT: 0, cd: this.practice ? { basic: 0, s1: 0, s2: 0, ult: 0 } : { basic: 0, s1: 0.5, s2: 0.8, ult: ucd }, cdMax: { basic: 1, s1: 0.5, s2: 0.8, ult: Math.max(ucd, 1) }, uses, base,
      st: {}, stPow: {}, castT: 0, castC: null, hurtT: 0, flashT: 0, invT: 0, tenT: 0, wind: null, dash: null,
      stack: { size: 0, slow: 0, taken: 0 },
      tickT: dbs.map((d) => (d.fx.t === 'tick' ? d.fx.every * (0.6 + Math.random() * 0.4) : 0)),
      dbs, lock, rev, hfoe, rnds, shout, back, mulS, moveMode, vision, pests, morph: null,
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
    }
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

  cond(f, c, nd) {
    const sp = Math.hypot(f.vx, f.vy);
    switch (c) {
      case 'moving': return sp > 20;
      case 'still': return sp < 8;
      case 'lowhp': return f.hp / f.maxHp <= 0.4;
      case 'highhp': return f.hp / f.maxHp >= 0.7;
      case 'near': return nd < 50;
      case 'far': return nd > 130;
    }
    return false;
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
    let warn = false;
    for (let i = 0; i < f.dbs.length; i++) {
      const x = f.dbs[i].fx;
      if (x.t === 'when') { if (this.cond(f, x.if, nd)) st[x.st] = Math.max(st[x.st] || 0, 0.2); }
      else if (x.t === 'drain') { if (live && (x.if === 'always' || this.cond(f, x.if, nd)) && f.hp > 1) f.hp = Math.max(1, f.hp - x.amt * dt); }
      else if (x.t === 'tick' && live) {
        f.tickT[i] -= dt;
        if (f.tickT[i] < 1.1) warn = true;
        if (f.tickT[i] <= 0) { f.tickT[i] = x.every; this.addStatus(f, x.st.k, x.st.d, 0, false); this.trig(f, f.dbs[i]); }
      }
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
    const stunned = !!(st.stun || st.freeze || st.dance || st.sleep);
    f.size = sp.stats.size * f.base.size * (1 + f.stack.size) * (st.giant ? 1.5 : 1) * (st.tiny ? 0.65 : 1);
    const spd = sp.stats.speed * f.base.speed * (st.haste ? 1.45 : 1) * (st.slow ? 0.55 : 1) * (1 - f.stack.slow) * (st.giant ? 0.85 : 1) * (st.tiny ? 1.15 : 1)
      * (st.heavy ? 0.75 : 1) * (st.fly ? 1.15 : 1) * (sp.passive && sp.passive.k === 'swift' ? 1.15 : 1) * (st.morph ? 0.75 : 1)
      * (f.moveMode === 'hop' ? (Math.sin(this.t * 9 + f.seed) > 0 ? 1.8 : 0.1) : 1);
    const canMove = !stunned && !st.root && !f.wind && f.hurtT <= 0 && !f.dash;
    let mx = 0, my = 0;
    if (canMove) {
      mx = inp.mx || 0; my = inp.my || 0;
      if (st.confuse) { mx = -mx; my = -my; }
      const mm = f.moveMode;
      if (mm === 'reverse') { mx = -mx; my = -my; }
      if (mm === 'nostop' && Math.hypot(mx, my) < 0.15) { mx = Math.cos(f.mdir); my = Math.sin(f.mdir); }
      if (mm === 'drunk' && Math.hypot(mx, my) > 0.15) { const a = Math.atan2(my, mx) + Math.sin(this.t * 2.3 + f.seed) * 1.1; const l = Math.hypot(mx, my); mx = Math.cos(a) * l; my = Math.sin(a) * l; }
    }
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    if (ml > 0.15) f.mdir = Math.atan2(my, mx);
    if (f.dash) {
      f.dash.t -= dt; f.vx = f.dash.vx; f.vy = f.dash.vy;
      if (f.dash.t <= 0) { f.vx = f.dash.vx * 0.2; f.vy = f.dash.vy * 0.2; f.dash = null; }
    } else {
      const acc = (st.slip || f.moveMode === 'slide' ? 240 : 1900) * dt * (f.hurtT > 0 ? 0.3 : 1);
      f.vx = approach(f.vx, mx * RUN * spd, acc);
      f.vy = approach(f.vy, my * RUN * spd, acc);
    }
    this.moveCollide(f, dt);
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
    if (!f.alive || f.wind || f.dash || f.st.stun || f.st.freeze || f.hurtT > 0) return false;
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
    f.dir = ang2dir(f.aim);
    const ca = Math.cos(f.aim), sa = Math.sin(f.aim);
    const crit = sp.passive && sp.passive.k === 'crit' && Math.random() < 0.2;
    const mul = f.base.dmg * f.mulS[as] * (f.st.power ? 1.5 : 1) * (f.st.weak ? 0.6 : 1) * (f.st.giant ? 1.25 : 1) * (sp.passive && sp.passive.k === 'rage' && f.hp / f.maxHp <= 0.4 ? 1.35 : 1) * (crit ? 1.8 : 1);
    let sw = null;
    for (const e of mv.fx) {
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
    if (f.shout[slot]) { const ev = ['t', f.idx, f.shout[slot], 2]; this.emit(ev); this.onEvent(ev); }
    if (f.back[slot]) {
      const amt = r1(Math.max(1, mv.fx.reduce((t, e) => t + fxExpected(e), 0) * mul * f.back[slot] / 100));
      if (f.hp > 0) { this.damage(f, amt, -1); this.pop(f.x, f.y - 12 * f.size, '-' + amt, '#c5f24a', 0.9); f.flashT = 0.12; this.vfxImpact(mv.vfx, mv.color, f.x, this.bodyY(f), 0.6); }
    }
    const act = ['a', f.idx, SLOT_IDX[as], Math.round(f.x), Math.round(f.y), Math.round(f.aim * 180 / Math.PI), ++f.actN, Math.round(mul * 100), crit ? 1 : 0,
      tgt ? Math.round(tgt.x) : -1, tgt ? Math.round(tgt.y) : -1, tgt ? tgt.idx : -1, (Math.random() * 1e9) | 0, sw ? sw[0] : -1, sw ? sw[1] : -1];
    for (const e of mv.fx) {
      if (e.t === 'dash') {
        if (f.st.heavy) { this.note(f, '무거움', ST_COLOR.heavy); continue; }
        const t = e.dist / DASH_V;
        f.dash = { vx: ca * DASH_V, vy: sa * DASH_V, t };
        if (e.invuln) f.invT = Math.max(f.invT, t + 0.08);
      } else if (e.t === 'buff') this.addStatus(f, e.k, e.d, e.pow || 0, false);
      else if (e.t === 'heal') this.heal(f, e.amt);
    }
    this.emit(act);
    this.spawnAct(act);
    for (const d of f.dbs) {
      const x = d.fx;
      if (!x.on || !onMatch(x.on, slot)) continue;
      switch (x.t) {
        case 'selfdmg':
          if (f.hp > 1) { this.damage(f, Math.min(x.amt, f.hp - 1), -1); this.pop(f.x, f.y - 12 * f.size, '-' + x.amt, '#c5f24a', 0.9); }
          this.trig(f, d); break;
        case 'selfst': this.addStatus(f, x.st.k, x.st.d, 0, false); this.trig(f, d); break;
        case 'recoil': f.vx = -ca * x.force * 34; f.vy = -sa * x.force * 34; f.hurtT = Math.max(f.hurtT, 0.15); f.dash = null; this.trig(f, d); break;
        case 'tele': {
          this.vfxImpact('arcane', '#c5f24a', f.x, this.bodyY(f), 0.8);
          const p = this.freePoint();
          f.x = p[0]; f.y = p[1]; f.vx = 0; f.vy = 0; f.dash = null;
          this.vfxImpact('arcane', '#c5f24a', f.x, this.bodyY(f), 0.8);
          this.trig(f, d); break;
        }
        case 'stack': { const cap = x.stat === 'slow' ? 0.5 : 0.8; f.stack[x.stat] = Math.min(cap, f.stack[x.stat] + x.pct / 100); this.trig(f, d); break; }
        case 'aidfoe':
          { const t2 = this.nearest(f, false); if (t2) { const ev = ['b', t2.idx, ST_ALL.indexOf(x.k), x.d, x.k === 'shield' ? 20 : 4]; this.emit(ev); this.onEvent(ev); } }
          this.trig(f, d); break;
      }
    }
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
      if (mv.say) Voice.say(mv.say, c.seed / 10, true);
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
    if (mv.say && slot !== 'basic' && (slot !== 's1' || (a[12] & 1))) c.say = { text: mv.say, t: 1.3, cast: true };
    if (crit) this.pop(x, y - 20 * sz, '치명타!', '#ffcf3a', 0.8, 1.1);
    const base = (i, j, kind, e) => ({ uid: `${c.idx}.${n}.${i}.${j}`, owner: c.idx, kind, dmg: e.dmg || 0, mul, st: e.st || null, kb: e.kb || 0, color: mv.color, cl: light(mv.color, 0.6), dk: dark(mv.color, 0.35), rows, gm: mv, ph: Math.random() * 3, custom: !!mv.pix, vfx: style, hit: new Map(), age: 0, rehit: 0, delay: 0, slotN: slot, tr: [] });
    const B = this.map.B;
    const cx = (v) => clamp(v, B + 2, W - B - 2), cyy = (v) => clamp(v, B + 4, H - B - 2);
    mv.fx.forEach((e, i) => {
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
            if (e.from === 'sky') {
              Object.assign(o, { kind: 'drop', x: cx(tx + (R() - 0.5) * (16 + e.n * 9)), y: cyy(ty + (R() - 0.5) * (12 + e.n * 7)), delay: j * 0.08, fall: 0.42, r: Math.max(5, e.size * 2 + 3), life: 0.8 });
            } else if (e.from === 'ground') {
              const dd = 12 + j * 12;
              Object.assign(o, { kind: 'spike', x: cx(x + ca * dd), y: cyy(y + sa * dd), delay: j * 0.06, life: 0.34, r: 3 + e.size });
            } else if (e.from === 'around') {
              const an = (j / e.n) * Math.PI * 2 + ang;
              Object.assign(o, { x, y: cy, vx: Math.cos(an) * e.speed, vy: Math.sin(an) * e.speed });
            } else {
              const an = ang + (e.n > 1 ? ((j / (e.n - 1)) - 0.5) * e.spread * Math.PI / 180 : 0);
              Object.assign(o, { x: x + ca * 5, y: cy + sa * 5, vx: Math.cos(an) * e.speed, vy: Math.sin(an) * e.speed });
              if (e.n > 1 && e.spread === 0) o.delay = j * 0.07;
            }
            this.objs.push(o);
          }
          break;
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
      if (!v.owned || !v.alive || v.idx === o.owner) continue;
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
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.tr) { o.tr.push(o.x, o.y); if (o.tr.length > 10) o.tr.splice(0, 2); }
          if (Math.random() < (o.child ? 0.4 : 0.9)) this.vfxTrail(o.vfx, o.color, o.x, o.y, -o.vx * 0.15, -o.vy * 0.15, o.r >= 3 ? 1.3 : 0.8);
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
          this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y, o.r));
          break;
        }
        case 'drop':
          o.fall -= dt;
          if (o.fall > 0 && Math.random() < 0.7) this.vfxTrail(o.vfx, o.color, o.x, o.y - 3 - o.fall * 180, 0, -40, 0.8);
          if (o.fall <= 0 && !o.trig) {
            o.trig = true;
            this.vfxImpact(o.vfx, o.color, o.x, o.y - 2, 1);
            this.decal(o.x, o.y, o.r * 0.7, o.dk);
            this.sfx(o.boom > 0 ? 'boom' : 'hit', o.vfx);
            this.shake = Math.max(this.shake, 1.5);
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
          this.checkHits(o, (v) => { const d = Math.hypot(v.x - o.x, (v.y - o.y) / 0.8); return d <= o.cur + 5 * v.size && d >= o.prev - 8 - 4 * v.size; });
          break;
        }
        case 'chain':
          if (!o.fired) { o.fired = true; this.checkHits(o, (v) => o.path.includes(v.idx)); }
          break;
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
              this.checkHits(o, (v) => this.bodyHit(v, o.x, o.y, o.r));
            }
          }
          break;
        case 'zone': {
          if (o.follow) { if (!o.follow.alive) { o.dead = true; break; } o.x = o.follow.x; o.y = o.follow.y - 1; }
          if (o.dmg > 0 || o.st) this.checkHits(o, (v) => dist2(v.x, v.y, o.x, o.y) <= (o.r + 3 * v.size) * (o.r + 3 * v.size));
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
        if (o.kind === 'mine' || o.kind === 'turret' || o.kind === 'chaser' || o.kind === 'barrier') this.vfxImpact(o.vfx, o.color, o.x, o.y - 3, 0.5);
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
    const tm = v.base.taken * (1 + v.stack.taken) * (v.st.vuln ? 1.4 : 1) * (v.st.armor ? 0.5 : 1) * (v.spec.passive && v.spec.passive.k === 'armor' ? 0.85 : 1);
    let dmg = o.dmg * o.mul * tm;
    if (v.st.shield && v.stPow.shield > 0 && dmg > 0) {
      const ab = Math.min(dmg, v.stPow.shield);
      v.stPow.shield -= ab; dmg -= ab;
      if (v.stPow.shield <= 0) { delete v.st.shield; delete v.stPow.shield; }
      if (dmg <= 0) this.note(v, '막음', ST_COLOR.shield);
    }
    dmg = Math.round(dmg * 10) / 10;
    const soft = o.kind === 'zone' || o.kind === 'orbit' || o.kind === 'cone';
    if (dmg > 0 || o.kb) {
      let dx, dy;
      if (o.kind === 'shot') { dx = o.vx; dy = o.vy; }
      else if (o.kind === 'beam') { dx = Math.cos(o.ang); dy = Math.sin(o.ang); if (o.both && (v.x - o.x) * dx + (v.y - o.y) * dy < 0) { dx = -dx; dy = -dy; } }
      else if ((o.kind === 'hb' || o.kind === 'all' || o.kind === 'swing' || o.kind === 'cone' || o.kind === 'chain') && a) { dx = v.x - a.x; dy = v.y - a.y; }
      else { dx = v.x - o.x; dy = this.bodyY(v) - o.y; }
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      if (o.kb) { const s = o.kb * KB / Math.sqrt(v.size); v.vx = dx * s; v.vy = dy * s; }
      if (!soft) { v.hurtT = Math.max(v.hurtT, 0.12 + Math.abs(o.kb) * 0.015); v.wind = null; v.dash = null; }
      v.flashT = 0.12;
    }
    if (o.st) { if (o.st.k === 'morph') v.morph = { gm: o.gm || { shape: 'paw' }, color: o.color }; this.addStatus(v, o.st.k, o.st.d, 0, true); }
    if (dmg > 0 && v.st.sleep) { delete v.st.sleep; this.note(v, '깼다!', '#ffffff', true); }
    if (dmg > 0) {
      for (const d of v.dbs) if (d.fx.t === 'hurtst' && Math.random() < d.fx.chance / 100) { this.addStatus(v, d.fx.st.k, d.fx.st.d, 0, false); this.trig(v, d); }
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
    f.hp = Math.min(f.maxHp, f.hp + amt);
    if (!quiet || Math.random() < 0.5) this.pop(f.x + rnd(-4, 4), f.y - 12 * f.size, '+' + Math.round(amt), '#7dff8a', 0.8, 0.9);
    if (!quiet) this.sfx('heal');
  }
  addStatus(f, k, d, pow, fromEnemy) {
    if (!f.alive) return;
    const hard = HARD_ST.includes(k);
    if (fromEnemy && hard) {
      if (f.tenT > 0) { this.note(f, '저항', '#d8d0f0'); return; }
      f.tenT = d + 1.6;
    }
    const fresh = !(f.st[k] > 0.3);
    f.st[k] = Math.max(f.st[k] || 0, d);
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
      case 'b': {
        const f = this.fighters[ev[1] | 0], k = ST_ALL[ev[2] | 0];
        if (f && f.owned && k && BUFFS.includes(k)) this.addStatus(f, k, clamp(+ev[3] || 1, 0.5, 4), clamp(+ev[4] || 0, 0, 30), false);
        break;
      }
      case 't': { const f = this.fighters[ev[1] | 0]; if (f) { f.say = { text: str(String(ev[2]), 16, ''), t: ev[3] === 2 ? 1.8 : 1.6, side: ev[3] !== 2, shout: ev[3] === 2 }; if (ev[3] === 2) Voice.say(f.say.text, f.seed / 10); } break; }
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
        if (!o.puddle) { pixRing(g, ox, oy, r, o.color, 2); dashRing(g, ox, oy, r - 4, o.cl, T * 12); pixRing(g, ox, oy, r * (0.3 + 0.7 * ((T * 0.9) % 1)), o.cl); }
        else pixRing(g, ox, oy, r, o.dk);
        g.globalAlpha = 1;
      } else if (o.kind === 'drop' && !o.trig) {
        const p = o.delay > 0 ? 0 : 1 - o.fall / 0.42, r = X(o.r);
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
        const ell = (rr, col, th) => { const n = Math.max(24, Math.round(rr / 2)); g.fillStyle = col; for (let k = 0; k < n; k++) { const an = k / n * 6.283; g.fillRect(Math.round(ox + Math.cos(an) * rr) - (th >> 1), Math.round(oy + Math.sin(an) * rr * 0.8) - (th >> 1), th, th); } };
        g.globalAlpha = 0.25 * a; g.drawImage(discCanvas(Math.max(2, R), o.color, Math.floor(T * 20) % 3), ox - R, oy - Math.round(R * 0.8), R * 2, Math.round(R * 1.6)); g.globalAlpha = a;
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
    for (const o of objs) if (o.delay <= 0 && (o.kind === 'barrier' || o.kind === 'turret' || o.kind === 'chaser' || o.kind === 'pest')) list.push({ y: o.y, o });
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
        case 'shot': {
          const big = o.r >= 3 ? 2 : 1, rows = moveRows(o.gm, T + o.ph);
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
        case 'drop': if (!o.trig) { const hh = Math.max(0, o.fall) * 180 * RS; drawGlyph(g, moveRows(o.gm, T + o.ph), o.color, x, y - 9 - hh, 1, 1); } break;
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
    const fx = X(f.x + (f.st.dance ? Math.sin(T * 18) * 1.5 : 0)), fy = X(f.y), lift = X(hopU);
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
    renderSprite(f.spr, f.spec.look, { pose: f.st.dance ? (Math.floor(T * 6) % 2 ? 'cast' : 'run') : f.pose, t: T + f.idx * 0.37, seed: f.seed, dir: f.dir === 3 ? 2 : f.dir, hurt: f.pose === 'hurt' || !!f.st.sleep, st: f.st, hurtFlash: f.flashT > 0, glow: f.castC });
    const dw = Math.round(SW * sz), dh = Math.round(SH * sz);
    let alpha = 1;
    if (f.st.invis) alpha = f.owned && !f.bot ? 0.4 : 0.1;
    if (f.invT > 0 && (Math.floor(T * 20) & 1)) alpha *= 0.5;
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
    const vis = this.visionOf && this.visionOf.alive ? this.vision : null;
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
      }
      return false;
    };
    if (!f.st.silence && !f.st.morph) for (const [s, key] of KEYSLOT) if (f.cd[s] <= 0 && f.uses[s] > 0 && !f.lock[s] && (s === 'basic' || Math.random() < 0.55) && ok(mv[s])) { out[key] = 1; break; }
    return out;
  }
}

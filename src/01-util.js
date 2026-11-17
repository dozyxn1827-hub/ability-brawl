'use strict';
/* ===== 공통 상수와 도구 ===== */
const W = 480, H = 320; // 탑뷰 아레나 전체 (픽셀)
const VIEW_W = 288, VIEW_H = 192; // 카메라가 기본으로 보여 주는 크기
const RS = 3; // 그림 해상도: 게임 1칸을 3x3 픽셀로 그린다
const SOUND_KINDS = ['pew', 'laser', 'zap', 'boom', 'whoosh', 'bloop', 'chime', 'crunch', 'growl', 'sparkle', 'splash', 'thud', 'squeak', 'boing', 'fart', 'kazoo', 'drum', 'bell', 'warp', 'gulp', 'roar', 'chirp', 'slurp', 'meow', 'honk', 'glitch', 'choir', 'rumble', 'crackle', 'whistle'];
const HP_SCALE = 2; // 설계서의 체력 100 = 게임 속 200
const RUN = 96;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
const sign = (v) => (v < 0 ? -1 : 1);
const now = () => performance.now() / 1000;

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const $ = (sel, el = document) => el.querySelector(sel);
/** DOM 만들기: h('div.cls#id', {attrs}, ...children) */
function h(tag, attrs, ...kids) {
  const m = tag.match(/^([a-z0-9]+)?(.*)$/i);
  const el = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][^.#]+/g) || []).forEach((t) => {
    if (t[0] === '.') el.classList.add(t.slice(1));
    else el.id = t.slice(1);
  });
  if (attrs != null && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) {
    kids.unshift(attrs);
    attrs = null;
  }
  if (attrs && typeof attrs === 'object') {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'on') for (const ev in v) el.addEventListener(ev, v[ev]);
      else if (k === 'style' && typeof v === 'object') { for (const s in v) { if (s.startsWith('--')) el.style.setProperty(s, v[s]); else el.style[s] = v[s]; } }
      else if (k === 'text') el.textContent = v;
      else if (k in el && k !== 'list') {
        try { el[k] = v; } catch (e) { el.setAttribute(k, v); }
      } else el.setAttribute(k, v === true ? '' : v);
    }
  }
  const add = (c) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else el.append(c.nodeType ? c : document.createTextNode(String(c)));
  };
  kids.forEach(add);
  return el;
}

/* ----- 색 ----- */
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}
const dark = (c, t = 0.35) => mix(c, '#0b0820', t);
const light = (c, t = 0.45) => mix(c, '#ffffff', t);

/* ----- 열거형 ----- */
const DEBUFFS = ['burn', 'poison', 'slow', 'root', 'stun', 'freeze', 'silence', 'confuse', 'weak', 'vuln', 'slip', 'heavy', 'dance', 'sleep', 'morph', 'air'];
const BUFFS = ['haste', 'shield', 'regen', 'power', 'armor', 'invis', 'giant', 'tiny', 'fly', 'reflect', 'invuln', 'counter'];
const ST_ALL = DEBUFFS.concat(BUFFS);
const ST_KO = {
  burn: '화상', poison: '중독', slow: '둔화', root: '속박', stun: '기절', freeze: '빙결', silence: '침묵',
  confuse: '혼란', weak: '약화', vuln: '취약', slip: '미끄러짐', heavy: '무거움', dance: '춤', sleep: '잠', morph: '변신', air: '공중에 뜸',
  haste: '가속', shield: '보호막', regen: '재생', power: '강화', armor: '단단함', invis: '은신',
  giant: '거대화', tiny: '축소', fly: '비행', reflect: '반사', invuln: '무적', counter: '반격 자세',
};
const ST_COLOR = {
  burn: '#ff7a2f', poison: '#9be04a', slow: '#7fb4ff', root: '#b58a4a', stun: '#ffe14a', freeze: '#9fe8ff',
  silence: '#b9a7ff', confuse: '#ff7ad9', weak: '#9aa0b8', vuln: '#ff5a5a', slip: '#c9f5ff', dance: '#ff8ad0', sleep: '#c8d8ff', morph: '#b6f24a', heavy: '#8d7f6a', air: '#e0f0ff',
  haste: '#6dffb0', shield: '#7fd0ff', regen: '#7dff8a', power: '#ffb23f', armor: '#c9c9d6', invis: '#d9d9ff',
  giant: '#ffa64a', tiny: '#ffd9f0', fly: '#bfe9ff', reflect: '#e7f6ff', invuln: '#fff3a0', counter: '#ffffff',
};
const HEADS = ['short', 'spiky', 'long', 'ponytail', 'bald', 'hood', 'hat', 'helmet', 'crown', 'horns', 'halo', 'cap', 'mask', 'ears', 'robot'];
const WEAPONS = ['none', 'sword', 'staff', 'wand', 'gun', 'bow', 'hammer', 'scythe', 'book', 'orb', 'shield', 'dagger', 'axe', 'spear'];
const AURAS = ['none', 'flame', 'frost', 'spark', 'shadow', 'leaf', 'star', 'bubble', 'wind', 'holy', 'toxic'];
const SHAPES = ['orb', 'fire', 'ice', 'bolt', 'slash', 'rock', 'star', 'skull', 'heart', 'leaf', 'bubble', 'note', 'arrow', 'bullet', 'wave', 'blade', 'bomb', 'eye', 'coin', 'feather', 'drop', 'moon', 'gear', 'paw', 'bone', 'cube'];
const SLOTS = ['basic', 's1', 's2', 'ult'];
const VFX = ['plain', 'fire', 'ice', 'electric', 'shadow', 'water', 'earth', 'poison', 'holy', 'arcane', 'wind', 'sound', 'cute', 'sleep', 'metal', 'nature', 'tech', 'candy', 'gold', 'void'];
const VFX_KO = { plain: '기본', fire: '불꽃', ice: '얼음', electric: '전기', shadow: '그림자', water: '물', earth: '흙', poison: '독', holy: '빛', arcane: '마법', wind: '바람', sound: '소리', cute: '귀여움', sleep: '잠', metal: '쇠', nature: '자연', tech: '기계', candy: '사탕', gold: '황금', void: '공허' };
const OUTFITS = ['plain', 'robe', 'armor', 'stripes', 'suit', 'dress', 'spots'];
const SLOT_KO = { basic: '능력 1', s1: '능력 2', s2: '능력 3', ult: '궁극기' };
const ON_SET = ['basic', 's1', 's2', 'ult', 'skills'];
const ON_KO = { basic: '능력 1', s1: '능력 2', s2: '능력 3', ult: '궁극기', skills: '모든 능력' };
const PASSIVES = ['regen', 'thorns', 'lifesteal', 'armor', 'rage', 'aura', 'revive', 'swift', 'crit', 'dodge'];
const PASSIVE_KO = {
  regen: '자연 회복', thorns: '가시 갑옷', lifesteal: '흡혈', armor: '강철 피부', rage: '분노',
  aura: '위험한 기운', revive: '부활', swift: '날쌘 발', crit: '치명타', dodge: '회피',
};
const onMatch = (on, slot) => on === 'skills' || on === 'any' || on === slot;

const FIGHTER_COLORS = ['#ff4d6d', '#3fb8ff', '#ffcf3a', '#5be37a'];

const HARD_ST = ['stun', 'freeze', 'dance', 'sleep', 'air'];
const MOVE_MODES = ['reverse', 'slide', 'drunk', 'nostop', 'backward', 'hop', 'spin', 'left', 'right', 'side', 'vertical', 'frozen'];
const MOVE_KO = { frozen: '걸어서는 한 발짝도 못 움직임 (기술로 움직이는 건 됨)', reverse: '방향키가 반대로', slide: '빙판처럼 미끄러짐', drunk: '비틀비틀 걸음', nostop: '멈출 수 없음', backward: '뒷걸음질로만 걸음', hop: '깡총깡총 뛰어다님', spin: '뱅글뱅글 돌며 걸음', left: '왼쪽으로만 움직일 수 있음', right: '오른쪽으로만 움직일 수 있음', side: '옆으로만 움직일 수 있음', vertical: '위아래로만 움직일 수 있음' };
const ACT_POSES = ['gas', 'sneeze', 'hiccup', 'poop', 'cry', 'laugh', 'sing', 'yawn', 'coin', 'heart', 'bow', 'snap', 'eat', 'sweat', 'zzz', 'star', 'fall', 'shout', 'word', 'rain', 'night', 'snow', 'thunder', 'hot', 'cold', 'wind', 'change', 'boom', 'breath'];
const VISION_KO = { noself: '내 캐릭터가 안 보임', cute: '적이 전부 귀엽게 보임', dark: '앞이 거의 안 보임', flip: '화면이 뒤집힘', mirror: '화면 좌우가 바뀜', shake: '화면이 계속 흔들림', tiny: '화면이 엄청 멀어짐', zoom: '화면이 코앞만 보임' };

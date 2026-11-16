// 페이지에 넣는 가짜 claude (room + sample). 허브는 node 쪽에서 중계.
module.exports = function mockClaude(opts) {
  const peerId = opts.peer;
  const others = new Map();
  let mine = {};
  let joined = false;
  const mk = (peer, presence, isMe) => Object.freeze({ peer, by: null, isMe, sameTab: isMe, kind: 'viewer', guest: false, presence, updatedAt: Date.now() });
  let meObj = mk(peerId, Object.freeze({}), true);
  let cache = null;
  let sendT = 0;
  const flush = () => { sendT = 0; window.__hubSend(JSON.stringify({ peer: peerId, presence: mine })); };
  window.__hubRecv = (json) => {
    const m = JSON.parse(json);
    if (m.peer === peerId) return;
    if (m.left) others.delete(m.peer); else others.set(m.peer, mk(m.peer, Object.freeze(m.presence), false));
    cache = null;
  };
  const room = {
    peers() { if (!cache) cache = Object.freeze([meObj].concat(Array.from(others.values()))); return cache; },
    presence(patch) {
      const next = Object.assign({}, mine);
      for (const k in patch) { if (patch[k] === null) delete next[k]; else next[k] = JSON.parse(JSON.stringify(patch[k])); }
      const size = new TextEncoder().encode(JSON.stringify(next)).length;
      window.__maxPresence = Math.max(window.__maxPresence || 0, size);
      if (size > 4096) { window.__presenceReject = (window.__presenceReject || 0) + 1; return Promise.reject({ code: 'invalid_argument', message: 'too big ' + size }); }
      mine = next; meObj = mk(peerId, Object.freeze(JSON.parse(JSON.stringify(mine))), true); cache = null;
      if (!sendT) sendT = setTimeout(flush, 33);
      return Promise.resolve();
    },
    connected: () => true, emit: () => Promise.resolve(), on: () => () => {}, onPeers: () => () => {}, onConnection: () => () => {},
  };
  const sample = Object.assign(async () => ({ text: '', truncated: false }), {
    json: async (input, o) => {
      window.__prompts = (window.__prompts || []); window.__prompts.push(input);
      const name = (input.match(/\[플레이어\] (.*)/) || [])[1] || '?';
      const nSides = (input.match(/\(작성자: /g) || []).length;
      for (let i = 1; i <= 4; i++) { await new Promise((r) => setTimeout(r, 150)); if (o && o.onText) o.onText({ text: 'x'.repeat(i * 350), delta: '' }); }
      if (opts.failAi) throw { code: 'rate_limited', message: 'x' };
      const sides = [...input.matchAll(/\(작성자: [^)]*\) (.*)/g)].map((m) => m[1]);
      const lame = { name: '라이터 딸깍', desc: '불은 안 나오고 딸깍 소리만', say: '딸깍', cd: 1, color: '#c8c8d8', vfx: 'metal', sfx: { kind: 'squeak', pitch: 0.6 }, pix: ['       ', ' ##### ', ' #ooo# ', ' ##### ', ' #...# ', ' #...# ', ' ##### '], fx: [{ t: 'shot', dmg: 2, speed: 140, size: 1, life: 0.4 }] };
      const pick1 = (t) => /못/.test(t) ? { how: '번개가 하나도 안 나와서 라이터만 딸깍댄다', say: '왜 안 돼', fx: { t: 'replace', moves: { basic: lame, s1: lame, s2: lame, ult: Object.assign({}, lame, { name: '라이터 투척', fx: [{ t: 'shot', dmg: 10, speed: 160, size: 3 }] }) } } }
        : /벌/.test(t) ? { how: '벌떼가 계속 쫓아와 쏜다', say: '으악 벌!', fx: { t: 'pest', every: 4, dmg: 3, name: '벌', color: '#ffe14a' } }
        : /외친/.test(t) ? { how: '쓸 때마다 크게 외친다', say: '', fx: { t: 'shout', on: 'skills', text: '나는 바보다!' } }
        : /비틀/.test(t) ? { how: '술 취한 것처럼 걷는다', say: '딸꾹', fx: { t: 'move', mode: 'drunk' }, more: [{ t: 'reverse', on: 'basic', chance: 50 }] }
        : /안 보/.test(t) ? { how: '앞이 거의 안 보인다', say: '어디야', fx: { t: 'vision', mode: 'dark' } }
        : { how: '번개 창은 봉인됐다', say: '안 돼!', fx: { t: 'lock', on: 's1' } };
      const dfx = sides.map(pick1);
      return {
        title: name + '의 화신', concept: '번개 창을 던지고 순식간에 파고든다',
        look: { skin: '#f2c79b', hair: '#ffe14a', body: '#3a3a8c', accent: '#ffe14a', head: 'spiky', weapon: 'spear', aura: 'spark', cape: true },
        stats: { hp: 95, speed: 1.2, jump: 1.1, airJumps: 1, size: 1 },
        moves: {
          basic: { name: '찌르기', desc: '창으로 빠르게 찌른다', cd: 0.4, color: '#ffe14a', shape: 'bolt', sfx: { kind: 'zap', pitch: 1.4, len: 0.6 }, fx: [{ t: 'melee', dmg: 8, range: 34, kb: 2, lift: 0 }] },
          s1: { name: '번개 창', desc: '꿰뚫는 창을 던진다', cd: 4.5, color: '#fff27a', shape: 'arrow', fx: [{ t: 'shot', dmg: 16, n: 1, spread: 0, speed: 380, size: 5, grav: 0, homing: 0, pierce: true, bounce: 0, life: 1.2, boom: 0, from: 'hand', kb: 4, st: { k: 'slow', d: 1.5 } }] },
          s2: { name: '전광석화', desc: '무적 상태로 돌진한다', cd: 7, color: '#9fe8ff', shape: 'slash', fx: [{ t: 'dash', dist: 130, dmg: 14, up: 0, invuln: true, kb: 5 }, { t: 'buff', k: 'haste', d: 3 }] },
          ult: { name: '천벌', desc: '하늘에서 벼락이 쏟아지고 모두 기절', say: '천벌이다!', sfx: { kind: 'roar', pitch: 0.7, len: 1.5 }, cd: 9, color: '#ffffff', shape: 'bolt', fx: [{ t: 'shot', dmg: 7, n: 6, speed: 400, size: 4, from: 'sky', boom: 20 }, { t: 'all', dmg: 4, only: 'ground', st: { k: 'stun', d: 1.2 } }] },
        },
        passive: { k: 'crit', desc: '가끔 치명타가 터진다' },
        drawbacks: dfx.slice(0, nSides),
        lines: { intro: '찌릿찌릿 간다!', ko: '번개가 나를 버렸어', win: '역시 번개는 최고야!' },
      };
    },
    limits: async () => ({ maxPromptBytes: 262144 }),
  });
  window.claude = { use: async (n) => (n === 'room' ? (opts.noRoom ? null : room) : n === 'sample' ? (opts.noAi ? null : sample) : null) };
  window.addEventListener('pagehide', () => window.__hubSend(JSON.stringify({ peer: peerId, left: true })));
};

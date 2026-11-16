/* 독립 사이트용 연결 장치: claude.ai 대신 우리 서버와 대화한다 (room = 실시간 방, sample = AI) */
(function () {
  const ROOM = new URLSearchParams(location.search).get('room') || 'main';
  const PEER = Math.random().toString(36).slice(2, 10);
  const others = new Map();
  let mine = {}, me = null, cache = null, sendT = 0, live = false;
  const mk = (peer, presence, isMe) => Object.freeze({ peer, by: null, isMe, sameTab: isMe, kind: 'viewer', guest: false, presence: Object.freeze(presence), updatedAt: Date.now() });
  me = mk(PEER, {}, true);
  const es = new EventSource(`/events?room=${encodeURIComponent(ROOM)}&peer=${PEER}`);
  es.onopen = () => { live = true; flush(); };
  es.onerror = () => { live = false; };
  es.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.peer === PEER) return;
    if (m.left) others.delete(m.peer); else others.set(m.peer, mk(m.peer, m.presence || {}, false));
    cache = null;
  };
  function flush() {
    sendT = 0;
    fetch('/presence', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ room: ROOM, peer: PEER, presence: mine }) }).catch(() => {});
  }
  const room = {
    peers() { if (!cache) cache = Object.freeze([me].concat(Array.from(others.values()))); return cache; },
    presence(patch) {
      const next = Object.assign({}, mine);
      for (const k in patch) { if (patch[k] === null) delete next[k]; else next[k] = JSON.parse(JSON.stringify(patch[k])); }
      if (JSON.stringify(next).length > 8000) return Promise.reject({ code: 'invalid_argument', message: 'too big' });
      mine = next; me = mk(PEER, JSON.parse(JSON.stringify(mine)), true); cache = null;
      if (!sendT) sendT = setTimeout(flush, 40);
      return Promise.resolve();
    },
    connected: () => live, emit: () => Promise.resolve(), on: () => () => {}, onPeers: () => () => {}, onConnection: () => () => {},
  };
  async function ask(input, o) {
    o = o || {};
    let fake = 0; const tick = setInterval(() => { fake += 120; if (o.onText) o.onText({ text: 'x'.repeat(fake), delta: '' }); }, 1000);
    try {
      const r = await fetch('/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input, tier: o.modelTier }) });
      const d = await r.json();
      if (!r.ok) throw { code: d.code || 'error', message: d.message || 'AI 오류' };
      return d.text;
    } finally { clearInterval(tick); }
  }
  const sample = Object.assign(async (input, o) => ({ text: await ask(input, o), truncated: false }), {
    json: async (input, o) => {
      const t = await ask(input, o);
      const a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a < 0 || b < a) throw { code: 'bad_json', message: 'JSON이 아님' };
      return JSON.parse(t.slice(a, b + 1));
    },
  });
  let aiOk = null;
  window.claude = {
    use: async (name) => {
      if (name === 'room') return room;
      if (name === 'sample') {
        if (aiOk === null) aiOk = await fetch('/ai-status').then((r) => r.json()).then((d) => !!d.ok).catch(() => false);
        return aiOk ? sample : null;
      }
      return null;
    },
  };
})();

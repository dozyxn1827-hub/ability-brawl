/* ===== 온라인: 같은 페이지를 연 사람들과 상태(presence)로 동기화 ===== */
const utf8 = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const byteLen = (s) => (utf8 ? utf8.encode(s).length : s.length * 3);

const Net = {
  room: null, tried: false, err: null,
  seq: 0, ring: [], bn: -1,
  seen: new Map(), lastSeq: new Map(),
  docTimer: null, rk: null, rparts: null, rdone: null,

  async init() {
    if (this.tried) return this.room;
    this.tried = true;
    try { this.room = window.claude && window.claude.use ? await window.claude.use('room') : null; } catch (e) { this.room = null; }
    return this.room;
  },
  peers() { try { return this.room ? this.room.peers() : []; } catch (e) { return []; } },
  me() { return this.peers().find((p) => p.sameTab) || null; },
  set(patch) {
    if (!this.room) return;
    try { this.room.presence(patch).catch((e) => { this.err = (e && e.code) || 'error'; }); } catch (e) { this.err = 'error'; }
  },
  /** 입장한 사람들 (먼저 들어온 순서). 맨 앞이 방장. */
  players() {
    return this.peers()
      .filter((p) => p.kind !== 'agent' && p.presence && p.presence.g === 1 && typeof p.presence.j === 'number')
      .sort((a, b) => a.presence.j - b.presence.j || (a.peer < b.peer ? -1 : 1));
  },

  /* ----- 전투 이벤트 ----- */
  startBattle(bn) { this.bn = bn; this.ring = []; this.lastSeq.clear(); this.seen.clear(); },
  send(ev) { this.ring.push({ s: ++this.seq, t: performance.now(), e: ev }); },
  publish(snaps) {
    const t = performance.now();
    while (this.ring.length && (t - this.ring[0].t > 1300 || this.ring.length > 28)) this.ring.shift();
    let ev = this.ring.map((r) => [r.s].concat(r.e));
    while (ev.length > 4 && byteLen(JSON.stringify(ev)) > 2300) ev = ev.slice(Math.ceil(ev.length / 4));
    this.set({ eb: this.bn, f: snaps, ev });
  },
  /** 다른 사람들의 상태와 이벤트를 전투에 반영 */
  pollBattle(battle, ownerOf) {
    for (const p of this.peers()) {
      if (p.sameTab || p.kind === 'agent') continue;
      const pr = p.presence;
      if (!pr || this.seen.get(p.peer) === pr) continue;
      this.seen.set(p.peer, pr);
      if (pr.eb !== this.bn) continue;
      if (pr.f && typeof pr.f === 'object') {
        for (const k in pr.f) { const idx = +k; if (ownerOf(idx) === p.peer) battle.setRemote(idx, pr.f[k]); }
      }
      if (Array.isArray(pr.ev)) {
        let last = this.lastSeq.has(p.peer) ? this.lastSeq.get(p.peer) : -1;
        for (const row of pr.ev) {
          if (!Array.isArray(row) || !(row[0] > last)) continue;
          last = row[0];
          const ev = row.slice(1), t = ev[0];
          if ((t === 'a' || t === 's' || t === 'k') && ownerOf(ev[1] | 0) !== p.peer) continue;
          if (t === 'h' && ownerOf(ev[2] | 0) !== p.peer) continue;
          try { battle.onRemote(ev); } catch (e) { /* 잘못된 이벤트는 버린다 */ }
        }
        this.lastSeq.set(p.peer, last);
      }
    }
  },

  /* ----- 큰 문서(설계서 묶음)를 조각내어 돌려 보내기 ----- */
  docSend(key, text) {
    this.docStop();
    const parts = [], chars = Array.from(text);
    for (let i = 0; i < chars.length; i += 400) parts.push(chars.slice(i, i + 400).join(''));
    let i = 0;
    const tick = () => { this.set({ ch: { k: key, i, n: parts.length, d: parts[i] } }); i = (i + 1) % parts.length; };
    tick();
    this.docTimer = setInterval(tick, 180);
  },
  docStop() { if (this.docTimer) { clearInterval(this.docTimer); this.docTimer = null; this.set({ ch: null }); } },
  /** 방장이 돌려 보내는 조각을 모은다. 다 모이면 문자열, 아니면 null */
  docPoll(hostPeer, key) {
    if (this.rk !== key) { this.rk = key; this.rparts = []; this.rdone = null; }
    if (this.rdone) return this.rdone;
    const ch = hostPeer && hostPeer.presence && hostPeer.presence.ch;
    if (!ch || ch.k !== key || typeof ch.d !== 'string' || !(ch.n > 0) || ch.n > 80) return null;
    this.rparts[ch.i | 0] = ch.d;
    for (let i = 0; i < ch.n; i++) if (typeof this.rparts[i] !== 'string') return null;
    this.rdone = this.rparts.slice(0, ch.n).join('');
    return this.rdone;
  },
  docProgress() { return this.rparts ? this.rparts.filter((x) => typeof x === 'string').length : 0; },
};

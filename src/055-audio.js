/* ===== 소리: 효과음 합성기 · 칩튠 배경음악 · 대사 읽기 ===== */
const VFX_SOUND = { plain: 'pew', fire: 'crackle', ice: 'chime', electric: 'zap', shadow: 'warp', water: 'splash', earth: 'thud', poison: 'bloop', holy: 'choir', arcane: 'sparkle', wind: 'whoosh', sound: 'kazoo', cute: 'squeak', sleep: 'whistle', metal: 'laser', nature: 'chirp', tech: 'glitch', candy: 'boing', gold: 'bell', void: 'rumble' };
const hashStr = (s) => { let h = 2166136261; for (const ch of String(s || '')) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const Sfx = {
  ctx: null, on: true, musicOn: true, voiceOn: true, last: {}, ready: false,
  load() {
    try { const s = JSON.parse(localStorage.getItem('nn-audio') || '{}'); if ('on' in s) this.on = !!s.on; if ('music' in s) this.musicOn = !!s.music; if ('voice' in s) this.voiceOn = !!s.voice; } catch (e) { /* 없어도 됨 */ }
  },
  save() { try { localStorage.setItem('nn-audio', JSON.stringify({ on: this.on, music: this.musicOn, voice: this.voiceOn })); } catch (e) { /* 없어도 됨 */ } },
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; return; }
      const c = this.ctx;
      this.comp = c.createDynamicsCompressor();
      this.comp.threshold.value = -16; this.comp.ratio.value = 4; this.comp.attack.value = 0.003; this.comp.release.value = 0.15;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      this.comp.connect(this.master); this.master.connect(c.destination);
      this.bus = c.createGain(); this.bus.gain.value = 0.85; this.bus.connect(this.comp);
      this.mbus = c.createGain(); this.mbus.gain.value = this.musicOn ? 0.4 : 0; this.mbus.connect(this.comp);
      // 잔향
      this.verb = c.createConvolver();
      const len = Math.floor(c.sampleRate * 1.6), ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      this.verb.buffer = ir;
      this.verbIn = c.createGain(); this.verbIn.gain.value = 0.35;
      this.verbIn.connect(this.verb); this.verb.connect(this.comp);
      // 메아리
      this.dly = c.createDelay(1); this.dly.delayTime.value = 0.19;
      const fb = c.createGain(); fb.gain.value = 0.32;
      const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400;
      this.dlyIn = c.createGain(); this.dlyIn.gain.value = 0.3;
      this.dlyIn.connect(this.dly); this.dly.connect(dlp); dlp.connect(fb); fb.connect(this.dly); dlp.connect(this.comp);
      // 소음 버퍼
      const nl = c.sampleRate * 2; this.nbuf = c.createBuffer(1, nl, c.sampleRate);
      const nd = this.nbuf.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
      // 펄스파
      const pulse = (duty) => { const n = 32, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); return c.createPeriodicWave(re, im); };
      this.p25 = pulse(0.25); this.p12 = pulse(0.125);
      this.ready = true;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (Music.want && !Music.cur) Music.play(Music.want);
  },
  setMusic(on) { this.musicOn = on; this.save(); if (this.mbus) this.mbus.gain.setTargetAtTime(on ? 0.4 : 0, this.ctx.currentTime, 0.05); },
  alive() { return this.on && this.ctx && this.ctx.state === 'running'; },
  /* ---- 기본 소리 조각 ---- */
  osc(type, f0, f1, t, dur, vol, o) {
    o = o || {};
    const c = this.ctx, os = c.createOscillator(), g = c.createGain();
    if (type === 'p25') os.setPeriodicWave(this.p25); else if (type === 'p12') os.setPeriodicWave(this.p12); else os.type = type;
    os.frequency.setValueAtTime(Math.max(20, f0), t);
    if (f1 && f1 !== f0) { if (o.lin) os.frequency.linearRampToValueAtTime(Math.max(20, f1), t + dur); else os.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); }
    if (o.det) os.detune.value = o.det;
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibD || f0 * 0.03; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const a = o.att || 0.004;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.hold) g.gain.setValueAtTime(vol, t + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = os;
    if (o.lp || o.hp || o.bp) { const f = c.createBiquadFilter(); f.type = o.lp ? 'lowpass' : o.hp ? 'highpass' : 'bandpass'; f.frequency.value = o.lp || o.hp || o.bp; if (o.q) f.Q.value = o.q; if (o.fEnd) f.frequency.exponentialRampToValueAtTime(o.fEnd, t + dur); node.connect(f); node = f; }
    node.connect(g);
    g.connect(o.dest || this.bus);
    if (o.verb) { const s = c.createGain(); s.gain.value = o.verb; g.connect(s); s.connect(this.verbIn); }
    if (o.echo) { const s = c.createGain(); s.gain.value = o.echo; g.connect(s); s.connect(this.dlyIn); }
    os.start(t); os.stop(t + dur + 0.05);
  },
  noise(t, dur, vol, o) {
    o = o || {};
    const c = this.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    s.buffer = this.nbuf; s.playbackRate.value = o.rate || 1;
    f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 2000, t); if (o.q) f.Q.value = o.q;
    if (o.fEnd) f.frequency.exponentialRampToValueAtTime(o.fEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (o.att || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.dest || this.bus);
    if (o.verb) { const v = c.createGain(); v.gain.value = o.verb; g.connect(v); v.connect(this.verbIn); }
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  /* ---- 소리 종류 (기술마다 음높이·길이를 바꿔 고유하게) ---- */
  kind(k, t, p, L, vol, big) {
    const O = (...a) => this.osc(...a), N = (...a) => this.noise(...a);
    const v = vol, vb = big ? 0.45 : 0.15;
    switch (k) {
      case 'pew': O('square', 1100 * p, 260 * p, t, 0.12 * L, 0.11 * v, { verb: vb }); O('sine', 1600 * p, 400 * p, t, 0.1 * L, 0.06 * v); break;
      case 'laser': O('sawtooth', 1800 * p, 180 * p, t, 0.22 * L, 0.09 * v, { lp: 5000, verb: vb, echo: 0.2 }); O('square', 900 * p, 90 * p, t, 0.2 * L, 0.05 * v); break;
      case 'zap': for (let i = 0; i < 3; i++) O('sawtooth', (1400 + Math.random() * 600) * p, 120 * p, t + i * 0.03 * L, 0.08 * L, 0.08 * v, { hp: 300 }); N(t, 0.12 * L, 0.12 * v, { type: 'highpass', f: 4000 }); break;
      case 'boom': N(t, 0.6 * L, 0.5 * v, { f: 1600, fEnd: 120, verb: vb + 0.2 }); O('sine', 130 * p, 32, t, 0.5 * L, 0.5 * v); O('triangle', 70 * p, 30, t, 0.6 * L, 0.3 * v); break;
      case 'whoosh': N(t, 0.32 * L, 0.22 * v, { type: 'bandpass', f: 600 * p, fEnd: 3500 * p, q: 1.5, att: 0.08 }); break;
      case 'bloop': O('sine', 220 * p, 880 * p, t, 0.14 * L, 0.18 * v); O('sine', 330 * p, 1200 * p, t + 0.07 * L, 0.12 * L, 0.12 * v, { verb: vb }); break;
      case 'chime': [0, 4, 7, 12].forEach((s, i) => O('sine', 1046 * p * Math.pow(2, s / 12), 0, t + i * 0.045 * L, 0.5 * L, 0.07 * v, { verb: vb + 0.25, echo: 0.2 })); O('triangle', 2093 * p, 0, t, 0.3, 0.04 * v); break;
      case 'crunch': N(t, 0.16 * L, 0.35 * v, { f: 2500 * p, fEnd: 400 }); O('square', 160 * p, 60, t, 0.12 * L, 0.12 * v); break;
      case 'growl': O('sawtooth', 110 * p, 70 * p, t, 0.5 * L, 0.18 * v, { vib: 18, vibD: 20, lp: 900 }); N(t, 0.45 * L, 0.12 * v, { f: 600 }); break;
      case 'sparkle': for (let i = 0; i < 6; i++) O('sine', (1800 + Math.random() * 2400) * p, 0, t + i * 0.035 * L, 0.18, 0.05 * v, { verb: vb + 0.3 }); break;
      case 'splash': N(t, 0.4 * L, 0.3 * v, { type: 'bandpass', f: 1400 * p, fEnd: 500, q: 0.8 }); O('sine', 500 * p, 1500 * p, t, 0.08, 0.1 * v); O('sine', 700 * p, 1900 * p, t + 0.06, 0.08, 0.08 * v); break;
      case 'thud': O('sine', 140 * p, 45, t, 0.3 * L, 0.45 * v); N(t, 0.15 * L, 0.25 * v, { f: 900 }); break;
      case 'squeak': O('sine', 1400 * p, 2600 * p, t, 0.09 * L, 0.1 * v); O('sine', 2600 * p, 1600 * p, t + 0.09 * L, 0.09 * L, 0.09 * v); break;
      case 'boing': O('sine', 180 * p, 520 * p, t, 0.35 * L, 0.22 * v, { vib: 22, vibD: 60 * p }); break;
      case 'fart': O('sawtooth', 95 * p, 60 * p, t, 0.45 * L, 0.22 * v, { vib: 30, vibD: 25, lp: 700 }); N(t, 0.4 * L, 0.12 * v, { f: 500 }); break;
      case 'kazoo': O('sawtooth', 330 * p, 300 * p, t, 0.3 * L, 0.14 * v, { vib: 7, vibD: 12, bp: 1200, q: 2 }); O('sawtooth', 440 * p, 392 * p, t + 0.15 * L, 0.3 * L, 0.12 * v, { vib: 7, vibD: 12, bp: 1200, q: 2 }); break;
      case 'drum': [0, 0.08, 0.16].forEach((d) => { O('sine', 180 * p, 60, t + d * L, 0.15, 0.3 * v); N(t + d * L, 0.08, 0.15 * v, { type: 'highpass', f: 3000 }); }); break;
      case 'bell': [1, 2.76, 5.4].forEach((m, i) => O('sine', 660 * p * m, 0, t, 1.0 * L / (i + 1), 0.08 * v / (i + 1), { verb: vb + 0.3 })); break;
      case 'warp': O('sine', 200 * p, 1600 * p, t, 0.25 * L, 0.12 * v, { vib: 30, vibD: 80 }); O('triangle', 1600 * p, 200 * p, t + 0.12, 0.25 * L, 0.08 * v, { verb: vb }); break;
      case 'gulp': O('sine', 400 * p, 120 * p, t, 0.12 * L, 0.22 * v); O('sine', 300 * p, 90 * p, t + 0.13 * L, 0.12 * L, 0.18 * v); break;
      case 'roar': O('sawtooth', 160 * p, 90 * p, t, 0.7 * L, 0.22 * v, { vib: 12, vibD: 18, lp: 1400, fEnd: 400 }); N(t, 0.7 * L, 0.25 * v, { f: 1200, fEnd: 300, verb: vb }); break;
      case 'chirp': [0, 0.07, 0.14].forEach((d, i) => O('sine', (2200 + i * 300) * p, 3400 * p, t + d * L, 0.05, 0.08 * v)); break;
      case 'slurp': O('sine', 300 * p, 1400 * p, t, 0.25 * L, 0.12 * v, { vib: 40, vibD: 100 }); N(t, 0.25 * L, 0.08 * v, { type: 'bandpass', f: 1500, q: 3 }); break;
      case 'meow': O('sawtooth', 600 * p, 900 * p, t, 0.15 * L, 0.1 * v, { bp: 1400, q: 3 }); O('sawtooth', 900 * p, 500 * p, t + 0.15 * L, 0.25 * L, 0.1 * v, { bp: 1100, q: 3 }); break;
      case 'honk': O('sawtooth', 220 * p, 210 * p, t, 0.32 * L, 0.14 * v, { lp: 1800 }); O('sawtooth', 277 * p, 262 * p, t, 0.32 * L, 0.12 * v, { lp: 1800 }); break;
      case 'glitch': for (let i = 0; i < 6; i++) O('square', (200 + Math.random() * 2400) * p, 0, t + i * 0.025 * L, 0.025, 0.07 * v); N(t, 0.15, 0.08 * v, { type: 'highpass', f: 5000, rate: 0.3 }); break;
      case 'choir': [0, 4, 7].forEach((s) => O('sawtooth', 392 * p * Math.pow(2, s / 12), 0, t, 0.8 * L, 0.05 * v, { att: 0.08, lp: 1800, vib: 5, vibD: 4, verb: 0.6 })); break;
      case 'rumble': N(t, 0.9 * L, 0.35 * v, { f: 300, fEnd: 80, att: 0.1, verb: vb }); O('sine', 55 * p, 35, t, 0.9 * L, 0.3 * v); break;
      case 'crackle': for (let i = 0; i < 8; i++) N(t + Math.random() * 0.25 * L, 0.03, 0.18 * v, { type: 'highpass', f: 2000 + Math.random() * 3000 }); N(t, 0.3 * L, 0.18 * v, { f: 900, fEnd: 300 }); break;
      case 'whistle': O('sine', 1200 * p, 1800 * p, t, 0.25 * L, 0.08 * v, { vib: 6, vibD: 30, verb: vb }); O('sine', 1800 * p, 900 * p, t + 0.25 * L, 0.3 * L, 0.07 * v, { verb: vb }); break;
      default: O('square', 760 * p, 300 * p, t, 0.09, 0.08 * v);
    }
  },
  /** 기술 하나의 고유 소리 */
  move(mv, slot) {
    const t = this.ctx.currentTime, h = hashStr(mv.name + mv.color);
    const sx = mv.sfx || {};
    const k = sx.kind || VFX_SOUND[mv.vfx] || 'pew';
    const p = (sx.pitch || 1) * (0.85 + h * 0.3) * (slot === 'ult' ? 0.8 : slot === 'basic' ? 1.15 : 1);
    const L = (sx.len || 1) * (slot === 'ult' ? 1.6 : slot === 'basic' ? 0.7 : 1);
    const vol = slot === 'basic' ? 0.7 : slot === 'ult' ? 1.2 : 1;
    this.kind(k, t, p, L, vol, slot === 'ult');
    if (slot === 'ult') { this.kind('boom', t + 0.02, 0.7, 1.3, 0.6, true); this.kind('choir', t, 0.75 + h * 0.2, 1.2, 0.8, true); }
    else if (slot !== 'basic') this.osc('triangle', 880 * p, 1320 * p, t, 0.08, 0.04);
  },
  play(name, style, ex) {
    if (!this.alive()) return;
    const now = performance.now(), key = name + (style || '') + (ex && ex.mv ? ex.mv.name : '');
    const gap = name === 'tick' ? 90 : name === 'hit' ? 40 : 35;
    if (now - (this.last[key] || 0) < gap) return;
    this.last[key] = now;
    const t = this.ctx.currentTime, S = style || 'plain', O = (...a) => this.osc(...a), N = (...a) => this.noise(...a);
    try {
      switch (name) {
        case 'move': if (ex && ex.mv) this.move(ex.mv, ex.slot); break;
        case 'dash': this.kind('whoosh', t, 1.2, 0.8, 1.2); O('sawtooth', 300, 120, t, 0.15, 0.05, { lp: 1200 }); break;
        case 'blink': this.kind('warp', t, 1.3, 0.6, 0.9); break;
        case 'summon': this.kind('bloop', t, 0.9, 1, 1); this.kind('sparkle', t + 0.05, 1, 0.6, 0.6); break;
        case 'buff': [0, 7, 12].forEach((s, i) => O('triangle', 523 * Math.pow(2, s / 12), 0, t + i * 0.05, 0.25, 0.06, { verb: 0.3 })); break;
        case 'beam': O('sawtooth', S === 'holy' ? 520 : 760, 180, t, 0.5, 0.07, { lp: 3000, vib: 30, vibD: 30, verb: 0.3 }); N(t, 0.4, 0.06, { type: 'bandpass', f: 2200, q: 2 }); break;
        case 'boom': this.kind('boom', t, S === 'ice' ? 1.6 : S === 'water' ? 1.2 : 1, 0.9, 1); if (S === 'ice') this.kind('chime', t + 0.05, 1.3, 0.6, 0.6); break;
        case 'hit': {
          N(t, 0.07, 0.22, { f: 3200, fEnd: 800 }); O('square', 240, 70, t, 0.09, 0.1);
          const tint = { ice: 'chime', electric: 'zap', water: 'splash', fire: 'crackle', metal: 'laser', cute: 'squeak', earth: 'thud', candy: 'boing', sound: 'kazoo', gold: 'bell', tech: 'glitch' }[S];
          if (tint) this.kind(tint, t + 0.01, 1.2, 0.45, 0.45);
          break;
        }
        case 'bighit': N(t, 0.16, 0.4, { f: 4000, fEnd: 500 }); O('sine', 160, 40, t, 0.25, 0.4); O('square', 400, 90, t, 0.12, 0.08); break;
        case 'tick': O('square', 520, 380, t, 0.04, 0.025); break;
        case 'heal': [0, 4, 7, 12].forEach((s, i) => O('sine', 784 * Math.pow(2, s / 12), 0, t + i * 0.06, 0.35, 0.06, { verb: 0.4 })); break;
        case 'shield': O('sine', 600, 1200, t, 0.3, 0.08, { vib: 20, vibD: 40, verb: 0.3 }); break;
        case 'fail': this.kind('kazoo', t, 0.6, 1, 0.9); O('square', 220, 110, t + 0.25, 0.3, 0.06); break;
        case 'selfhit': this.kind('boing', t, 0.7, 1, 1); break;
        case 'lock': O('square', 180, 170, t, 0.25, 0.08, { lp: 1200 }); O('square', 120, 115, t + 0.12, 0.3, 0.07, { lp: 1000 }); break;
        case 'pest': this.kind('growl', t, 2.2, 0.6, 0.5); break;
        case 'ko': O('sawtooth', 600, 60, t, 0.8, 0.12, { lp: 2000, vib: 8, vibD: 30 }); N(t, 0.7, 0.25, { f: 2000, fEnd: 100, verb: 0.5 }); O('sine', 90, 30, t, 0.6, 0.35); break;
        case 'combo': O('square', 660 * Math.pow(2, Math.min(12, (ex && ex.n) || 2) / 12), 0, t, 0.08, 0.06); O('square', 990 * Math.pow(2, Math.min(12, (ex && ex.n) || 2) / 12), 0, t + 0.05, 0.08, 0.05); break;
        case 'count': O('square', 880, 0, t, 0.12, 0.08); break;
        case 'go': [0, 4, 7, 12].forEach((s) => O('p25', 523 * Math.pow(2, s / 12), 0, t, 0.5, 0.06, { verb: 0.3 })); N(t, 0.3, 0.15, { type: 'highpass', f: 5000 }); break;
        case 'storm': for (let i = 0; i < 3; i++) O('sawtooth', 500, 900, t + i * 0.35, 0.33, 0.06, { lp: 2400, lin: true }); break;
        case 'ui': O('p25', 660, 990, t, 0.06, 0.05); break;
        case 'blip': O('square', 620 + Math.random() * 260, 0, t, 0.025, 0.016); break;
        case 'mcin': O('square', 523, 0, t, 0.07, 0.035); O('square', 659, 0, t + 0.08, 0.07, 0.035); O('square', 784, 0, t + 0.16, 0.07, 0.035); O('square', 1047, 0, t + 0.24, 0.18, 0.045); break;
        case 'drumroll': for (let i = 0; i < 20; i++) N(t + i * 0.045, 0.05, 0.04 + i * 0.003, { type: 'bandpass', f: 1800, q: 0.8 }); break;
        case 'cymbal': N(t, 1.3, 0.09, { type: 'highpass', f: 6000, verb: 0.4 }); O('sine', 98, 60, t, 0.35, 0.12); break;
        case 'crowd': for (let i = 0; i < 6; i++) N(t + i * 0.1, 1, 0.045, { type: 'bandpass', f: 500 + Math.random() * 1000, q: 1.4, att: 0.18 }); break;
        case 'gavel': O('square', 200, 90, t, 0.08, 0.09); N(t, 0.06, 0.14, { type: 'bandpass', f: 1300, q: 2 }); break;
        case 'siren': for (let i = 0; i < 6; i++) O('square', i % 2 ? 660 : 880, 0, t + i * 0.2, 0.18, 0.028); break;
        case 'boo': N(t, 0.9, 0.05, { type: 'bandpass', f: 320, q: 2, att: 0.12 }); O('sawtooth', 170, 110, t, 0.8, 0.02, { lp: 500 }); break;
        case 'mcuh': O('sawtooth', 330, 150, t, 0.4, 0.035, { lp: 900 }); O('sawtooth', 220, 100, t + 0.18, 0.45, 0.03, { lp: 800 }); break;
        case 'ready': O('sine', 1320, 0, t, 0.12, 0.05); O('sine', 1980, 0, t + 0.04, 0.12, 0.035); break;
        case 'win': [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [7, 0.52], [12, 0.62]].forEach(([s, d]) => O('p25', 523 * Math.pow(2, s / 12), 0, t + d, d > 0.5 ? 0.6 : 0.14, 0.07, { verb: 0.3 })); break;
        case 'shoot': this.kind(VFX_SOUND[S] || 'pew', t, 1.2, 0.6, 0.7); break;
        case 'cast': this.kind(VFX_SOUND[S] || 'pew', t, 1, 1, 1); break;
        case 'ult': this.kind('choir', t, 0.8, 1.3, 1, true); this.kind('boom', t, 0.7, 1.2, 0.6, true); break;
      }
    } catch (e) { /* 소리는 없어도 됨 */ }
  },
};

/* ---- 칩튠 배경음악 (맵마다 다른 곡, 미리 만든 악보 없이 규칙으로 작곡) ---- */
const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10] };
const TRACKS = {
  menu: { bpm: 122, root: 60, scale: 'major', prog: [0, 4, 5, 3], lead: 'p25', bass: 'triangle', arp: 'p12', seed: 7, k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', bp: 'x..x..x.x..x..x.', swing: 0.1 },
  0: { bpm: 148, root: 57, scale: 'minor', prog: [0, 5, 2, 6], lead: 'p25', bass: 'square', arp: 'p12', seed: 11, k: 'x.....x...x.....', s: '....x.......x..x', h: 'x.x.x.x.x.x.x.x.', bp: 'x.xx.x.xx.x.x.xx' },
  1: { bpm: 162, root: 52, scale: 'phryg', prog: [0, 1, 0, 6], lead: 'sawtooth', bass: 'sawtooth', arp: 'square', seed: 23, k: 'x..x..x.x..x..x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', bp: 'xxx.xxx.xxx.xxxx' },
  2: { bpm: 132, root: 62, scale: 'dorian', prog: [0, 3, 4, 0], lead: 'triangle', bass: 'triangle', arp: 'p25', seed: 37, k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.', bp: 'x...x.x.x...x.x.' },
  3: { bpm: 140, root: 55, scale: 'mixo', prog: [0, 6, 3, 4], lead: 'p25', bass: 'triangle', arp: 'p12', seed: 51, k: 'x..x....x..x....', s: '....x..x....x...', h: 'x.x.x.x.x.x.x.xx', bp: 'x..x.x..x..x.x..', swing: 0.15 },
};
const Music = {
  cur: null, want: null, timer: 0, step: 0, nextT: 0, hype: 0, mel: null,
  play(name) {
    this.want = name;
    if (!Sfx.ctx || Sfx.ctx.state !== 'running') return;
    if (this.cur === name) { this.hype = 0; return; }
    this.stop(true);
    const tr = TRACKS[name];
    if (!tr) return;
    this.cur = name; this.tr = tr; this.step = 0; this.hype = 0; this.nextT = Sfx.ctx.currentTime + 0.08;
    // 멜로디 만들기 (같은 곡이면 늘 같은 멜로디)
    const R = mulberry(tr.seed * 977);
    const motif = [];
    for (let i = 0; i < 16; i++) motif.push(R() < (i % 4 === 0 ? 0.85 : i % 2 === 0 ? 0.55 : 0.25) ? Math.floor(R() * 5) : null);
    const answer = motif.map((n, i) => (n == null ? (R() < 0.2 ? Math.floor(R() * 5) : null) : (i > 10 ? Math.floor(R() * 5) : n)));
    this.mel = [motif, answer, motif, answer.map((n, i) => (i >= 12 ? (i === 12 ? 0 : null) : n))];
    this.timer = setInterval(() => this.tick(), 25);
  },
  stop(keepWant) { clearInterval(this.timer); this.timer = 0; this.cur = null; if (!keepWant) this.want = null; },
  setHype(v) { this.hype = v; },
  tick() {
    const c = Sfx.ctx;
    if (!c || !this.tr) return;
    if (c.state !== 'running') return;
    const tr = this.tr, spb = 60 / (tr.bpm * (this.hype ? 1.08 : 1)) / 4;
    while (this.nextT < c.currentTime + 0.15) {
      if (Sfx.musicOn) this.note(this.step, this.nextT + (tr.swing && this.step % 2 ? spb * tr.swing : 0), spb);
      this.nextT += spb; this.step++;
    }
  },
  note(step, t, spb) {
    const tr = this.tr, s16 = step % 16, bar = Math.floor(step / 16) % 4, sc = SCALES[tr.scale];
    const deg = (d) => { const o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return tr.root + sc[i] + o * 12; };
    const chord = tr.prog[bar];
    const D = Sfx.mbus, O = (type, f, dur, vol, o) => Sfx.osc(type, f, f, t, dur, vol, Object.assign({ dest: D }, o || {})), N = (dur, vol, o) => Sfx.noise(t, dur, vol, Object.assign({ dest: D }, o || {}));
    // 드럼
    if (tr.k[s16] === 'x') { Sfx.osc('sine', 150, 42, t, 0.2, 0.55, { dest: D }); N(0.02, 0.2, { type: 'highpass', f: 2000 }); }
    if (tr.s[s16] === 'x') { N(0.14, 0.3, { type: 'bandpass', f: 1800, q: 0.7 }); Sfx.osc('triangle', 210, 160, t, 0.08, 0.12, { dest: D }); }
    if (tr.h[s16] === 'x' || (this.hype && s16 % 2)) N(this.hype && s16 % 4 === 2 ? 0.12 : 0.035, 0.07, { type: 'highpass', f: 7000 });
    // 베이스
    if (tr.bp[s16] === 'x') O(tr.bass, mtof(deg(chord) - 12), spb * 1.8, 0.16, { lp: 900 });
    // 아르페지오
    const arpDeg = [0, 2, 4, 7][s16 % 4] + chord;
    O(tr.arp, mtof(deg(arpDeg) + 12), spb * 0.9, 0.035, { lp: 3500 });
    // 멜로디
    const m = this.mel[bar][s16];
    if (m != null) {
      const n = deg(chord + [0, 2, 4, 5, 7][m]) + 12 + (this.hype ? 12 : 0);
      O(tr.lead, mtof(n), spb * 1.9, 0.09, { vib: 6, vibD: 3, echo: 0.25, att: 0.01 });
    }
    // 마디 첫 박에 쨍한 소리
    if (s16 === 0 && bar === 0) N(0.5, 0.06, { type: 'highpass', f: 5000, verb: 0.3 });
  },
};

/* ---- 대사 읽기 (브라우저 음성, 없으면 조용히 넘어감) ---- */
const Voice = {
  last: 0,
  say(text, seed, big) {
    if (!Sfx.voiceOn || !Sfx.on || !text || !window.speechSynthesis) return;
    const now = performance.now();
    if (now - this.last < (big ? 300 : 1400)) return;
    this.last = now;
    try {
      const vs = window.speechSynthesis.getVoices();
      if (vs.length && !vs.some((x) => /^ko/i.test(x.lang))) return; // 한국어 목소리가 없으면 읽지 않는다
      const ko = vs.find((x) => /^ko/i.test(x.lang));
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; if (ko) u.voice = ko; u.rate = 1.25 + (seed || 0) * 0.3; u.pitch = 0.6 + (seed || 0) * 1.3; u.volume = big ? 1 : 0.85;
      if (big) window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* 없어도 됨 */ }
  },
};
Sfx.load();

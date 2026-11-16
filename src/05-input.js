/* ===== 조작: 키보드 · 터치 · 소리 ===== */
const Keys = { down: new Set(), pressed: new Set() };
const GAME_CODES = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyT', 'KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyO', 'Semicolon', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad5']);
const typing = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
window.addEventListener('keydown', (e) => {
  if (typing(e.target)) return;
  if (GAME_CODES.has(e.code) && document.body.classList.contains('in-battle')) e.preventDefault();
  if (!e.repeat) { Keys.down.add(e.code); Keys.pressed.add(e.code); }
});
window.addEventListener('keyup', (e) => Keys.down.delete(e.code));
window.addEventListener('blur', () => { Keys.down.clear(); Keys.pressed.clear(); });

const KEYMAPS = {
  solo: { l: ['ArrowLeft', 'KeyA'], r: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], a: ['KeyJ', 'KeyZ', 'Space'], b: ['KeyK', 'KeyX'], c: ['KeyL', 'KeyC'], u: ['KeyI', 'KeyV'] },
  p1: { l: ['KeyA'], r: ['KeyD'], up: ['KeyW'], down: ['KeyS'], a: ['KeyF'], b: ['KeyG'], c: ['KeyH'], u: ['KeyT'] },
  p2: { l: ['ArrowLeft'], r: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], a: ['KeyK', 'Numpad1'], b: ['KeyL', 'Numpad2'], c: ['Semicolon', 'Numpad3'], u: ['KeyO', 'Numpad5'] },
};
const KEY_HINT = {
  solo: { a: 'J', b: 'K', c: 'L', u: 'I', move: '방향키 / WASD' },
  p1: { a: 'F', b: 'G', c: 'H', u: 'T', move: 'W A S D' },
  p2: { a: 'K', b: 'L', c: ';', u: 'O', move: '방향키' },
};

/** 키보드·조이스틱·터치 버튼을 함께 읽는 조작기 */
class Ctrl {
  constructor(mapName) {
    this.map = KEYMAPS[mapName] || KEYMAPS.solo;
    this.held = { a: 0, b: 0, c: 0, u: 0 };
    this.edge = { a: 0, b: 0, c: 0, u: 0 };
    this.joy = null;
  }
  press(k) { this.held[k] = 1; this.edge[k] = 1; }
  release(k) { this.held[k] = 0; }
  clear() { for (const k in this.held) this.held[k] = this.edge[k] = 0; this.joy = null; }
  read() {
    const m = this.map, any = (list) => list.some((c) => Keys.down.has(c));
    const take = (list) => { let hit = false; for (const c of list) if (Keys.pressed.delete(c)) hit = true; return hit; };
    let mx = (any(m.r) ? 1 : 0) - (any(m.l) ? 1 : 0), my = (any(m.down) ? 1 : 0) - (any(m.up) ? 1 : 0);
    if (this.joy) { mx = this.joy.x; my = this.joy.y; }
    const out = { mx, my };
    for (const k of ['a', 'b', 'c', 'u']) { out[k] = (take(m[k]) || any(m[k]) || this.held[k] || this.edge[k]) ? 1 : 0; this.edge[k] = 0; }
    take(m.l); take(m.r); take(m.up); take(m.down);
    return out;
  }
}

/** 버튼에 누르고 있기/떼기 연결 (여러 손가락 동시 입력) */
function bindHold(el, onDown, onUp) {
  const down = (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } el.classList.add('is-down'); onDown(); };
  const up = (e) => { e.preventDefault(); el.classList.remove('is-down'); if (onUp) onUp(); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', () => { el.classList.remove('is-down'); if (onUp) onUp(); });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}


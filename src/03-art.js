/* ===== 픽셀 그림 (고해상도: 게임 1칸 = 3x3 픽셀) ===== */
const SW = 40, SH = 56, OX = 20, OY = 50;
const STEEL = '#e6ecf6', STEEL_M = '#a8b2c6', STEEL_D = '#6a7390', WOOD = '#8a5a2f', WOOD_D = '#5e3a1c', INKC = '#1a1026', GOLD = '#ffd23f', GOLD_D = '#c8962a';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}
/** src를 dst에 1픽셀 테두리를 둘러서 그린다 */
const SIL = makeCanvas(64, 64);
function outlined(dg, src, w, h, ink, alpha) {
  const sg = SIL[1];
  sg.clearRect(0, 0, 64, 64);
  sg.globalCompositeOperation = 'source-over';
  sg.drawImage(src, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = ink; sg.fillRect(0, 0, 64, 64);
  sg.globalCompositeOperation = 'source-over';
  dg.globalAlpha = alpha == null ? 1 : alpha;
  dg.drawImage(SIL[0], 0, 0, w, h, -1, 0, w, h); dg.drawImage(SIL[0], 0, 0, w, h, 1, 0, w, h);
  dg.drawImage(SIL[0], 0, 0, w, h, 0, -1, w, h); dg.drawImage(SIL[0], 0, 0, w, h, 0, 1, w, h);
  dg.globalAlpha = 1;
  dg.drawImage(src, 0, 0);
}

const SPR_TMP = makeCanvas(SW, SH);
/**
 * 고해상도 탑뷰 캐릭터 한 프레임. 발밑이 (OX, OY). dir: 0 아래, 1 위, 2 오른쪽.
 * 키 약 30픽셀(= 게임 10칸), 명암·하이라이트·외곽선 포함.
 */
function renderSprite(out, look, v) {
  const g = SPR_TMP[1];
  g.clearRect(0, 0, SW, SH);
  const P = (x, y, w, h, c) => { if (w > 0 && h > 0) { g.fillStyle = c; g.fillRect(OX + x, OY + y, w, h); } };
  const E = (cx, cy, rx, ry, c) => { g.fillStyle = c; for (let y = -ry; y <= ry; y++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + 0.5) * (ry + 0.5))))); g.fillRect(OX + cx - hw, OY + cy + y, hw * 2 + 1, 1); } };
  const RR = (x, y, w, h, c, r) => { P(x, y, w, h, c); if (r >= 1) { g.clearRect(OX + x, OY + y, 1, 1); g.clearRect(OX + x + w - 1, OY + y, 1, 1); g.clearRect(OX + x, OY + y + h - 1, 1, 1); g.clearRect(OX + x + w - 1, OY + y + h - 1, 1, 1); } if (r >= 2) { g.clearRect(OX + x + 1, OY + y, 1, 1); g.clearRect(OX + x + w - 2, OY + y, 1, 1); g.clearRect(OX + x, OY + y + 1, 1, 1); g.clearRect(OX + x + w - 1, OY + y + 1, 1, 1); } };
  const dir = v.dir || 0, pose = v.pose, t = v.t || 0;
  const skin = look.skin, skinD = dark(skin, 0.2), skinL = light(skin, 0.25);
  const body = look.body, bodyD = dark(body, 0.32), bodyL = light(body, 0.22), bodyDD = dark(body, 0.5);
  const acc = look.accent, accD = dark(acc, 0.3), accL = light(acc, 0.35);
  let hair = look.hair;
  const head = look.head, outfit = look.outfit || 'plain';
  if (head === 'hood') hair = bodyD;
  const hairD = dark(hair, 0.3), hairL = light(hair, 0.3);
  const legC = dark(body, 0.55), legL = dark(body, 0.4), shoe = dark(acc, 0.45), shoeL = dark(acc, 0.2);
  const metal = '#c8d0e0', metalD = '#7a84a0', metalL = '#f0f4fa';
  const cast = pose === 'cast' || pose === 'wind';
  const run = pose === 'run';
  const wf = run ? Math.floor(t * 12) % 4 : 0; // 걷기 4프레임
  const bob = pose === 'idle' ? (Math.floor(t * 1.8) % 2) : run ? (wf % 2) : 0;
  const hurt = v.hurt || pose === 'ko';
  const y0 = bob;
  const blink = !hurt && ((t * 0.6 + (v.seed || 0)) % 4) < 0.12;
  // ---- 망토 (뒤) ----
  if (look.cape && dir !== 1) {
    const sway = run ? (wf % 2 ? 1 : 0) : Math.floor(t * 2) % 2;
    if (dir === 0) { P(-7, -15 + y0, 2, 11 + sway, accD); P(5, -15 + y0, 2, 11 + sway, accD); }
    else { P(-6 - sway, -15 + y0, 3, 12 + sway, accD); P(-7 - sway, -6 + y0, 2, 3, dark(acc, 0.45)); }
  }
  // ---- 다리 ----
  const longSkirt = outfit === 'robe';
  if (dir === 2) {
    const a = wf === 0 ? 2 : wf === 2 ? -2 : 0;
    const legX = [[-2 - a, legL], [-1 + a, legC]];
    if (!longSkirt) for (const [lx, c] of legX) { P(lx, -7, 3, 5, c); P(lx, -2, 4, 2, shoe); P(lx, -2, 4, 1, shoeL); }
    else { P(-2 - a, -2, 4, 2, shoe); P(-1 + a, -2, 4, 2, shoe); }
  } else {
    const l = wf === 0 ? 1 : 0, r = wf === 2 ? 1 : 0;
    if (!longSkirt) {
      P(-4, -7, 3, 5 - l, legC); P(-4, -7, 1, 5 - l, legL); P(-4, -2 - l, 3, 2, shoe); P(-4, -2 - l, 3, 1, shoeL);
      P(2, -7, 3, 5 - r, legC); P(2, -7, 1, 5 - r, legL); P(2, -2 - r, 3, 2, shoe); P(2, -2 - r, 3, 1, shoeL);
    } else { P(-4, -2 - l, 3, 2, shoe); P(2, -2 - r, 3, 2, shoe); }
  }
  // ---- 몸통 ----
  const bx = dir === 2 ? -3 : -5, bw = dir === 2 ? 7 : 11, by = -16 + y0;
  RR(bx, by, bw, 10, body, 1);
  P(bx, by + 1, 2, 8, bodyL); P(bx + bw - 2, by + 1, 2, 8, bodyD); P(bx + 1, by + 9, bw - 2, 1, bodyD);
  P(bx + 1, by, bw - 2, 1, bodyL);
  if (dir === 0) { P(-2, by, 5, 1, dark(body, 0.15)); P(-1, by + 1, 3, 1, skinD); }
  // 허리띠
  P(bx, by + 7, bw, 1, accD); P(bx, by + 7, bw, 1, acc); if (dir !== 1) P(dir === 2 ? 0 : -1, by + 7, 2, 1, GOLD);
  switch (outfit) {
    case 'robe': {
      const sw = dir === 2 ? 9 : 13, sx = dir === 2 ? -4 : -6;
      P(sx, by + 8, sw, 7 - y0, body); P(sx, by + 8, 2, 7 - y0, bodyL); P(sx + sw - 2, by + 8, 2, 7 - y0, bodyD);
      P(sx, -2, sw, 1, acc); if (dir === 0) P(0, by + 1, 1, 14, accL);
      break;
    }
    case 'armor':
      P(bx + 2, by + 1, bw - 4, 5, metal); P(bx + 2, by + 1, bw - 4, 1, metalL); P(bx + 2, by + 5, bw - 4, 1, metalD);
      if (dir !== 2) { RR(-8, by - 1, 4, 4, metal, 1); RR(5, by - 1, 4, 4, metal, 1); P(-8, by - 1, 4, 1, metalL); P(5, by - 1, 4, 1, metalL); P(-1, by + 3, 1, 1, metalD); P(1, by + 3, 1, 1, metalD); }
      else { RR(-2, by - 1, 5, 4, metal, 1); P(-2, by - 1, 5, 1, metalL); }
      break;
    case 'stripes': for (let k = 1; k < 7; k += 2) P(bx, by + k, bw, 1, accL); break;
    case 'suit':
      if (dir === 0) { P(-2, by, 5, 3, '#f6edd9'); P(-1, by + 1, 3, 1, '#d8ccb4'); P(0, by + 1, 1, 6, acc); P(0, by + 1, 1, 1, accD); P(-4, by + 1, 2, 5, bodyD); P(3, by + 1, 2, 5, bodyD); }
      else if (dir === 2) { P(1, by, 3, 2, '#f6edd9'); P(2, by + 2, 1, 4, acc); }
      break;
    case 'dress':
      P(-7 + (dir === 2 ? 3 : 0), by + 8, dir === 2 ? 9 : 15, 5, acc); P(-7 + (dir === 2 ? 3 : 0), by + 8, dir === 2 ? 9 : 15, 1, accL);
      for (let k = -7 + (dir === 2 ? 3 : 0); k < (dir === 2 ? 5 : 8); k += 2) P(k, by + 12, 1, 1, accD);
      break;
    case 'spots': if (dir !== 1) { P(-3, by + 2, 2, 2, acc); P(2, by + 4, 2, 2, acc); P(-1, by + 6, 1, 1, acc); } else { P(-2, by + 3, 2, 2, acc); P(2, by + 1, 2, 2, acc); } break;
    default: if (dir === 0) { P(-3, by, 2, 2, bodyL); P(2, by, 2, 2, bodyL); P(2, by + 3, 2, 2, bodyD); }
  }
  if (look.cape && dir === 1) { RR(-6, by, 13, 13 - y0, accD, 1); P(-6, by, 13, 2, acc); P(-1, by + 3, 3, 3, dark(acc, 0.45)); }
  // ---- 팔 ----
  const armC = dark(body, 0.12), armD = dark(body, 0.35);
  if (dir === 2) {
    if (cast) { P(0, by + 1, 6, 3, armC); P(0, by + 3, 6, 1, armD); P(6, by + 1, 3, 3, skin); P(6, by + 1, 3, 1, skinL); }
    else {
      const sw = wf === 0 ? 2 : wf === 2 ? -2 : 0;
      P(-1 + sw, by + 1, 3, 6, armC); P(-1 + sw, by + 1, 1, 6, bodyL); P(-1 + sw, by + 7, 3, 2, skin);
    }
  } else if (cast) {
    P(-8, by - 5, 3, 7, armC); P(6, by - 5, 3, 7, armC); P(-8, by - 7, 3, 2, skin); P(6, by - 7, 3, 2, skin);
    P(-8, by - 7, 3, 1, skinL); P(6, by - 7, 3, 1, skinL);
  } else {
    const sl = wf === 0 ? 1 : wf === 2 ? -1 : 0;
    P(-8, by + 1 + sl, 3, 6, armC); P(-8, by + 1 + sl, 1, 6, bodyL); P(-8, by + 7 + sl, 3, 2, skin);
    P(6, by + 1 - sl, 3, 6, armC); P(8, by + 1 - sl, 1, 6, armD); P(6, by + 7 - sl, 3, 2, skin);
  }
  // ---- 머리 ----
  const hy = -30 + y0, hb = hy + 13; // 머리 윗줄, 머리 아랫줄
  if (head === 'robot') {
    RR(-6, hy, 13, 13, metal, 2); P(-6, hy + 2, 2, 9, metalL); P(5, hy + 2, 2, 9, metalD); P(-4, hb - 1, 9, 1, metalD);
    if (dir !== 1) {
      const fx = dir === 2 ? -1 : -4, fw = dir === 2 ? 7 : 9;
      RR(fx, hy + 4, fw, 6, '#1a1a2e', 1);
      const eye = v.hurt ? '#ff5a5a' : acc;
      if (dir === 0) { P(-3, hy + 6, 2, 2, eye); P(2, hy + 6, 2, 2, eye); } else { P(3, hy + 6, 2, 2, eye); }
      if (cast) P(dir === 2 ? 1 : -1, hy + 9, 3, 1, eye);
    }
    P(0, hy - 4, 1, 4, metalD); P(-1, hy - 5, 3, 2, Math.floor(t * 2) % 2 ? '#ff5a5a' : acc);
  } else {
    const hc = head === 'bald' ? skin : hair, hcD = head === 'bald' ? skinD : hairD, hcL = head === 'bald' ? skinL : hairL;
    if (dir === 1) {
      RR(-6, hy, 13, 13, hc, 2); P(-6, hy + 2, 2, 9, hcL); P(5, hy + 2, 2, 9, hcD); P(-4, hb - 1, 9, 1, hcD);
      P(-3, hy + 1, 5, 1, hcL);
      P(-7, hy + 6, 1, 3, skinD); P(7, hy + 6, 1, 3, skinD);
    } else {
      // 얼굴
      RR(-6, hy, 13, 13, skin, 2); P(-6, hy + 3, 1, 8, skinL); P(5, hy + 3, 2, 8, skinD); P(-4, hb - 1, 9, 1, skinD);
      // 머리카락
      RR(-6, hy, 13, 5, hc, 2); P(-3, hy + 1, 5, 1, hcL);
      if (dir === 0) {
        P(-6, hy + 4, 2, 4, hc); P(5, hy + 4, 2, 4, hc); P(5, hy + 4, 2, 4, hcD);
        for (let k = -4; k <= 4; k += 3) P(k, hy + 5, 2, 1, hc); // 앞머리 끝
      } else {
        P(-6, hy + 4, 5, 5, hc); P(-6, hy + 4, 5, 1, hcL); P(-2, hy + 5, 2, 1, hc); P(1, hy + 5, 2, 1, hc);
        P(-2, hy + 7, 2, 2, skinD); // 귀
      }
      // 눈·입
      const ey = hy + 7;
      if (dir === 0) {
        if (hurt) { P(-4, ey, 1, 1, INKC); P(-3, ey + 1, 1, 1, INKC); P(-4, ey + 2, 1, 1, INKC); P(4, ey, 1, 1, INKC); P(3, ey + 1, 1, 1, INKC); P(4, ey + 2, 1, 1, INKC); }
        else if (blink || head === 'sleep') { P(-4, ey + 1, 3, 1, INKC); P(2, ey + 1, 3, 1, INKC); }
        else { P(-4, ey, 2, 3, INKC); P(3, ey, 2, 3, INKC); P(-4, ey, 1, 1, '#ffffff'); P(3, ey, 1, 1, '#ffffff'); }
        P(-5, ey + 3, 2, 1, '#ff9aa8'); P(4, ey + 3, 2, 1, '#ff9aa8');
        if (cast && !hurt) { P(0, ey + 4, 2, 2, '#7a2030'); } else P(0, ey + 4, 2, 1, dark(skin, 0.45));
      } else {
        if (hurt) { P(3, ey, 1, 1, INKC); P(4, ey + 1, 1, 1, INKC); P(3, ey + 2, 1, 1, INKC); }
        else if (blink) P(2, ey + 1, 3, 1, INKC);
        else { P(3, ey, 2, 3, INKC); P(3, ey, 1, 1, '#ffffff'); }
        P(7, ey + 2, 1, 1, skinD); P(4, ey + 3, 2, 1, '#ff9aa8');
        P(4, ey + 4, cast ? 2 : 1, cast ? 2 : 1, cast ? '#7a2030' : dark(skin, 0.45));
      }
    }
    if (head === 'bald') { P(-3, hy + 1, 3, 1, light(skin, 0.6)); P(-2, hy + 2, 1, 1, light(skin, 0.5)); }
    // 머리 모양
    switch (head) {
      case 'spiky': for (const k of [-5, -2, 1, 4]) { P(k, hy - 1, 2, 1, hc); P(k + (k < 0 ? 0 : 1), hy - 2, 1, 1, hc); P(k, hy - 1, 1, 1, hcL); } break;
      case 'long':
        if (dir === 0) { P(-8, hy + 4, 2, 13, hc); P(7, hy + 4, 2, 13, hcD); P(-8, hy + 4, 1, 13, hcL); }
        else if (dir === 1) { P(-6, hb - 1, 13, 7, hc); P(-6, hb - 1, 2, 7, hcL); P(5, hb - 1, 2, 7, hcD); P(-5, hb + 6, 11, 1, hcD); }
        else { P(-8, hy + 4, 3, 13, hc); P(-8, hy + 4, 1, 13, hcL); }
        break;
      case 'ponytail': {
        const sw2 = run ? (wf % 2 ? 1 : -1) : 0;
        if (dir === 1) { P(-1, hy + 3, 3, 3, acc); P(-1 + sw2, hb - 2, 3, 8, hc); P(-1 + sw2, hb - 2, 1, 8, hcL); }
        else if (dir === 2) { P(-7, hy + 3, 2, 2, acc); P(-10 + sw2, hy + 4, 4, 3, hc); P(-11 + sw2, hy + 6, 3, 6, hc); P(-11 + sw2, hy + 6, 1, 6, hcL); }
        else { P(-8, hy + 3, 2, 3, hc); P(7, hy + 3, 2, 3, hc); }
        break;
      }
      case 'hood':
        RR(-7, hy - 2, 15, 7, hc, 2); P(-5, hy - 1, 6, 1, light(hc, 0.2));
        if (dir === 0) { P(-7, hy + 4, 2, 10, hc); P(6, hy + 4, 2, 10, hcD); P(-1, hy - 4, 3, 2, hc); }
        else if (dir === 2) { P(-7, hy + 4, 6, 10, hc); P(-7, hy - 3, 4, 2, hc); }
        else { RR(-7, hy - 2, 15, 17, hc, 2); P(-7, hy, 2, 13, light(hc, 0.15)); P(-1, hy - 4, 3, 2, hc); }
        break;
      case 'hat': {
        const hc2 = dark(body, 0.35), hcl = dark(body, 0.15);
        E(0, hy + 1, 10, 2, hc2); P(-9, hy + 1, 19, 1, hcl);
        P(-5, hy - 5, 11, 6, hc2); P(-5, hy - 5, 2, 6, hcl); P(-4, hy - 9, 8, 4, hc2); P(-2, hy - 12, 5, 3, hc2); P(1, hy - 14, 3, 2, hc2); P(3, hy - 15, 2, 2, hc2);
        P(-5, hy - 1, 11, 2, acc); P(-5, hy - 1, 11, 1, accL); P(0, hy - 1, 2, 2, GOLD);
        break;
      }
      case 'helmet':
        RR(-7, hy - 2, 15, 8, metal, 2); P(-6, hy - 1, 4, 2, metalL); P(5, hy, 2, 5, metalD);
        if (dir !== 2) { P(-7, hy + 5, 2, 6, metal); P(6, hy + 5, 2, 6, metalD); } else P(-7, hy + 5, 3, 6, metal);
        if (dir === 0) P(-5, hy + 5, 11, 1, metalD);
        P(-1, hy - 6, 3, 4, acc); P(0, hy - 7, 3, 2, accL);
        break;
      case 'crown':
        P(-5, hy - 2, 11, 3, GOLD); P(-5, hy - 2, 11, 1, light(GOLD, 0.4)); P(-5, hy, 11, 1, GOLD_D);
        for (const k of [-5, -1, 3]) { P(k, hy - 5, 3, 3, GOLD); P(k + 1, hy - 6, 1, 1, GOLD); }
        P(-4, hy - 1, 2, 1, '#ff4d6d'); P(0, hy - 1, 2, 1, acc); P(4, hy - 1, 2, 1, '#3fb8ff');
        break;
      case 'horns': {
        const hc2 = light(acc, 0.35), hd = dark(acc, 0.1);
        P(-7, hy - 1, 2, 3, hc2); P(-8, hy - 3, 2, 3, hc2); P(-8, hy - 5, 1, 2, hd);
        P(6, hy - 1, 2, 3, hc2); P(7, hy - 3, 2, 3, hc2); P(8, hy - 5, 1, 2, hd);
        break;
      }
      case 'halo': { const hh = hy - 5 - (Math.floor(t * 2) % 2); E(0, hh, 6, 1, GOLD); g.clearRect(OX - 4, OY + hh, 9, 1); P(-4, hh - 1, 9, 1, light(GOLD, 0.5)); break; }
      case 'cap':
        RR(-6, hy - 1, 13, 6, acc, 2); P(-4, hy, 5, 1, accL); P(0, hy - 1, 1, 1, accD);
        if (dir === 0) { P(-6, hy + 4, 13, 2, accD); P(-5, hy + 5, 11, 1, dark(acc, 0.5)); }
        else if (dir === 2) { P(4, hy + 3, 6, 2, accD); }
        break;
      case 'mask':
        if (dir === 0) { P(-6, hy + 6, 13, 4, INKC); P(-4, hy + 7, 2, 2, '#ffffff'); P(3, hy + 7, 2, 2, '#ffffff'); P(-8, hy + 7, 2, 1, INKC); P(-9, hy + 8, 2, 1, INKC); }
        else if (dir === 2) { P(-6, hy + 6, 13, 4, INKC); P(3, hy + 7, 2, 2, '#ffffff'); P(-9, hy + 6, 3, 1, INKC); P(-10, hy + 7, 3, 1, INKC); }
        else { P(-6, hy + 6, 13, 3, INKC); P(-2, hb, 3, 4, INKC); }
        break;
      case 'ears':
        P(-6, hy - 3, 3, 3, hc); P(-6, hy - 4, 2, 1, hc); P(4, hy - 3, 3, 3, hc); P(5, hy - 4, 2, 1, hc);
        if (dir !== 1) { P(-5, hy - 2, 1, 2, '#ffb0c8'); P(5, hy - 2, 1, 2, '#ffb0c8'); }
        break;
    }
  }
  // ---- 손에 든 소품 ----
  const w = look.weapon;
  if (w !== 'none') {
    // 손 위치
    let hx, hyy, m = 1;
    if (dir === 2) { hx = cast ? 8 : 1; hyy = cast ? by + 2 : by + 8; }
    else if (cast) { hx = dir === 1 ? -7 : 7; hyy = by - 6; m = dir === 1 ? -1 : 1; }
    else { hx = dir === 1 ? -7 : 7; hyy = by + 8; m = dir === 1 ? -1 : 1; }
    const Q = (dx, dy, ww, hh, c) => P(m > 0 ? hx + dx : hx - dx - ww + 1, hyy + dy, ww, hh, c);
    switch (w) {
      case 'sword': Q(0, -13, 2, 11, STEEL); Q(1, -13, 1, 11, STEEL_M); Q(0, -14, 1, 1, STEEL); Q(-2, -2, 6, 1, acc); Q(0, -1, 2, 3, WOOD); Q(0, 2, 2, 1, GOLD); break;
      case 'staff': Q(0, -18, 2, 22, WOOD); Q(1, -18, 1, 22, WOOD_D); Q(-1, -22, 4, 4, acc); Q(-1, -22, 2, 1, accL); Q(0, -21, 1, 1, '#ffffff'); break;
      case 'wand': Q(0, -7, 1, 8, WOOD); Q(-1, -9, 3, 1, GOLD); Q(0, -10, 1, 3, GOLD); Q(0, -9, 1, 1, '#ffffff'); break;
      case 'gun': Q(-1, -2, 7, 3, STEEL_D); Q(-1, -2, 7, 1, STEEL_M); Q(6, -2, 2, 2, INKC); Q(0, 1, 2, 3, WOOD_D); break;
      case 'bow': Q(1, -9, 1, 2, WOOD); Q(2, -7, 1, 4, WOOD); Q(3, -3, 1, 6, WOOD); Q(2, 3, 1, 4, WOOD); Q(1, 7, 1, 2, WOOD); Q(0, -8, 1, 16, '#eeeeee'); break;
      case 'hammer': Q(0, -10, 2, 13, WOOD); Q(1, -10, 1, 13, WOOD_D); Q(-3, -15, 8, 5, STEEL_M); Q(-3, -15, 8, 1, STEEL); Q(-3, -11, 8, 1, STEEL_D); break;
      case 'scythe': Q(0, -18, 2, 22, WOOD); Q(1, -18, 1, 22, WOOD_D); Q(-7, -18, 8, 2, STEEL); Q(-8, -16, 3, 2, STEEL_M); Q(-8, -14, 2, 1, STEEL_M); break;
      case 'book': Q(-1, -4, 6, 7, acc); Q(-1, -4, 6, 1, accL); Q(4, -3, 1, 5, '#f6edd9'); Q(1, -2, 2, 1, GOLD); break;
      case 'orb': { const ob = Math.floor(t * 3) % 2; Q(1, -16 + ob, 5, 5, acc); Q(1, -16 + ob, 2, 2, '#ffffff'); Q(5, -12 + ob, 1, 1, accD); break; }
      case 'shield': { const sx = m > 0 ? -12 : 10; P(sx, by + 1, 5, 8, STEEL_M); P(sx, by + 1, 5, 1, STEEL); P(sx + 1, by + 3, 3, 3, acc); P(sx, by + 8, 5, 1, STEEL_D); break; }
      case 'dagger': Q(0, -6, 1, 5, STEEL); Q(-1, -1, 3, 1, acc); Q(0, 0, 1, 2, WOOD); break;
      case 'axe': Q(0, -10, 2, 13, WOOD); Q(1, -10, 1, 13, WOOD_D); Q(2, -12, 4, 7, STEEL_M); Q(5, -11, 1, 5, STEEL); Q(2, -12, 4, 1, STEEL); break;
      case 'spear': Q(0, -22, 1, 26, WOOD); Q(-1, -25, 3, 3, STEEL); Q(0, -27, 1, 2, STEEL); Q(-1, -21, 3, 1, acc); break;
    }
  }
  if (cast && v.glow) {
    const gx = dir === 2 ? 9 : 7, gy = by - 7;
    P(gx - 1, gy, 3, 1, v.glow); P(gx, gy - 1, 1, 3, v.glow); P(gx, gy, 1, 1, '#ffffff');
    if (dir !== 2) { P(-9, gy, 3, 1, v.glow); P(-8, gy - 1, 1, 3, v.glow); P(-8, gy, 1, 1, '#ffffff'); }
  }
  const tint = (c, a) => { g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.fillStyle = c; g.fillRect(0, 0, SW, SH); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; };
  if (v.st.freeze) tint('#9fe8ff', 0.55);
  else if (v.st.poison) tint('#7ad63a', 0.28);
  else if (v.st.burn) tint('#ff7a2f', 0.25);
  if (v.st.sleep) tint('#8aa0ff', 0.2);
  if (v.st.power) tint('#ffb23f', 0.22);
  if (v.st.invuln) tint('#fff3a0', 0.42);
  if (pose === 'ko') tint('#5a5470', 0.45);
  if (v.hurtFlash) tint('#ffffff', 0.85);
  const og = out.getContext ? out.getContext('2d') : out;
  og.clearRect(0, 0, SW, SH);
  outlined(og, SPR_TMP[0], SW, SH, v.hurtFlash ? '#ffffff' : '#0b0820', 0.95);
}

/* ----- 능력 그림: 12x12 고해상도 모양 (자동 명암·애니메이션) ----- */
const GN = 12;
const SHAPE_ANIM = { gear: 'spin', star: 'spin', blade: 'spin', bone: 'spin', coin: 'flip', fire: 'flicker', bolt: 'flicker', wave: 'flicker', orb: 'pulse', bubble: 'pulse', eye: 'blink', heart: 'pulse', drop: 'pulse', skull: 'pulse', bomb: 'fuse', note: 'bob', leaf: 'sway', feather: 'sway' };
const PROC = new Map();
const SUP = makeCanvas(48, 48);
function shapePath(c, shape, R) {
  const P = new Path2D();
  const poly = (pts) => { P.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) P.lineTo(pts[i][0], pts[i][1]); P.closePath(); };
  const circ = (x, y, r) => { P.moveTo(x + r, y); P.arc(x, y, r, 0, Math.PI * 2); };
  const ell = (x, y, rx, ry, a) => { P.moveTo(x + rx * Math.cos(a), y + rx * Math.sin(a)); P.ellipse(x, y, rx, ry, a || 0, 0, Math.PI * 2); };
  switch (shape) {
    case 'orb': circ(24, 24, 18); break;
    case 'fire': circ(30, 25, 13); poly([[30, 12], [4 + R() * 4, 18 + R() * 6], [14, 24], [2 + R() * 4, 30 + R() * 4], [30, 38]]); poly([[22, 13], [12 + R() * 4, 6 + R() * 4], [30, 14]]); break;
    case 'ice': poly([[46, 24], [30, 10], [8, 18], [2, 24], [8, 30], [30, 38]]); break;
    case 'bolt': poly([[30 + R() * 3, 2], [10, 26], [22, 26], [14 + R() * 3, 46], [40, 18], [28, 18], [36, 2]]); break;
    case 'slash': circ(20, 24, 20); circ(10 + R() * 2, 24, 18); break;
    case 'rock': poly([[10, 12], [24, 6], [40, 12], [44, 28], [34, 42], [14, 42], [4, 30]]); break;
    case 'star': { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 22; pts.push([24 + Math.cos(a) * r, 25 + Math.sin(a) * r]); } poly(pts); break; }
    case 'skull': circ(24, 20, 17); P.rect(14, 30, 20, 12); circ(17, 21, 5); circ(31, 21, 5); P.rect(18, 36, 3, 6); P.rect(27, 36, 3, 6); break;
    case 'heart': P.moveTo(24, 42); P.bezierCurveTo(4, 28, 2, 10, 14, 8); P.bezierCurveTo(20, 7, 24, 12, 24, 15); P.bezierCurveTo(24, 12, 28, 7, 34, 8); P.bezierCurveTo(46, 10, 44, 28, 24, 42); P.closePath(); break;
    case 'leaf': ell(26, 22, 18, 10, -0.5); P.rect(6, 34, 14, 3); break;
    case 'bubble': circ(24, 24, 19); circ(24, 24, 14); circ(17, 17, 4); break;
    case 'note': ell(16, 36, 9, 7, -0.4); P.rect(22, 6, 4, 30); poly([[22, 6], [40, 12], [40, 20], [26, 14]]); break;
    case 'arrow': P.rect(4, 22, 32, 4); poly([[46, 24], [32, 12], [32, 36]]); poly([[2, 14], [12, 22], [12, 26], [2, 34], [8, 24]]); break;
    case 'bullet': P.rect(6, 15, 24, 18); circ(30, 24, 9); P.rect(4, 13, 4, 22); break;
    case 'wave': circ(16, 24, 24); circ(6 + R() * 2, 24, 22); break;
    case 'blade': poly([[44, 24], [24, 18], [4, 22], [4, 26], [24, 30]]); poly([[24, 4], [28, 20], [24, 44], [20, 20]]); break;
    case 'bomb': circ(22, 28, 16); P.rect(28, 8, 6, 8); poly([[34, 8], [42, 2 + R() * 4], [38, 10]]); break;
    case 'eye': ell(24, 24, 22, 13, 0); circ(24, 24, 8); circ(24, 24, 3); break;
    case 'coin': circ(24, 24, 19); circ(24, 24, 13); P.rect(21, 14, 6, 20); break;
    case 'feather': ell(26, 22, 20, 8, -0.6); P.rect(4, 36, 16, 3); break;
    case 'drop': circ(28, 26, 15); poly([[28, 11], [4, 26], [28, 41]]); break;
    case 'moon': circ(24, 24, 19); circ(31, 18, 16); break;
    case 'gear': { const pts = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 15 : 21; pts.push([24 + Math.cos(a - 0.2) * r, 24 + Math.sin(a - 0.2) * r]); pts.push([24 + Math.cos(a + 0.2) * r, 24 + Math.sin(a + 0.2) * r]); } poly(pts); circ(24, 24, 7); break; }
    case 'paw': ell(24, 31, 13, 11, 0); circ(10, 18, 6); circ(19, 10, 6); circ(30, 10, 6); circ(39, 18, 6); break;
    case 'bone': P.rect(12, 20, 24, 8); circ(10, 18, 7); circ(10, 30, 7); circ(38, 18, 7); circ(38, 30, 7); break;
    case 'cube': poly([[24, 4], [44, 14], [44, 36], [24, 46], [4, 36], [4, 14]]); break;
    default: circ(24, 24, 18);
  }
  return P;
}
/** 절차적 모양 → 12x12 문자 그림 (자동 명암) */
function procShape(shape, frame) {
  const key = shape + ':' + frame;
  let rows = PROC.get(key);
  if (rows) return rows;
  const g = SUP[1];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 48, 48);
  const anim = SHAPE_ANIM[shape];
  g.translate(24, 24);
  if (anim === 'spin') g.rotate(frame * Math.PI / 4);
  if (anim === 'flip') g.scale(Math.max(0.18, Math.abs(Math.cos(frame * Math.PI / 4))), 1);
  if (anim === 'pulse') { const s = [1, 0.94, 0.88, 0.94][frame % 4]; g.scale(s, s); }
  if (anim === 'blink' && frame % 4 === 3) g.scale(1, 0.25);
  if (anim === 'sway') g.rotate([0, 0.15, 0, -0.15][frame % 4]);
  if (anim === 'bob') g.translate(0, [0, -2, 0, 2][frame % 4]);
  g.translate(-24, -24);
  g.fillStyle = '#000';
  g.fill(shapePath(g, shape, mulberry(97 + frame * 31 + shape.length)), 'evenodd');
  g.setTransform(1, 0, 0, 1, 0, 0);
  const d = g.getImageData(0, 0, 48, 48).data;
  const on = [];
  for (let y = 0; y < GN; y++) { on.push([]); for (let x = 0; x < GN; x++) { let n = 0; for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) if (d[((y * 4 + yy) * 48 + x * 4 + xx) * 4 + 3] > 110) n++; on[y].push(n >= 7); } }
  const at = (x, y) => x >= 0 && y >= 0 && x < GN && y < GN && on[y][x];
  rows = [];
  let spec = null, best = 99;
  for (let y = 0; y < GN; y++) {
    let r = '';
    for (let x = 0; x < GN; x++) {
      if (!on[y][x]) { r += ' '; continue; }
      const tl = !at(x - 1, y) || !at(x, y - 1), br = !at(x + 1, y) || !at(x, y + 1);
      r += tl && !br ? 'o' : br && !tl ? '.' : tl && br ? '#' : '#';
      if (!tl && !br && at(x - 1, y - 1)) { const dd = Math.hypot(x - 3.5, y - 3.5); if (dd < best) { best = dd; spec = [x, y]; } }
    }
    rows.push(r);
  }
  if (spec) rows[spec[1]] = rows[spec[1]].slice(0, spec[0]) + 'w' + rows[spec[1]].slice(spec[0] + 1);
  if (shape === 'bomb' && frame % 2) rows[0] = rows[0].slice(0, 10) + 'w' + rows[0].slice(11);
  if (PROC.size > 800) PROC.clear();
  PROC.set(key, rows);
  return rows;
}
function shapeFrames(shape) { const a = SHAPE_ANIM[shape]; return a === 'spin' || a === 'flip' ? 8 : a ? 4 : 1; }
/** 기술 그림의 지금 프레임 */
function moveRows(mv, t) {
  if (mv.pix) return mv.pix2 && Math.floor(t * 6) % 2 ? mv.pix2 : mv.pix;
  const n = shapeFrames(mv.shape);
  return procShape(mv.shape || 'orb', n > 1 ? Math.floor(t * 12) % n : 0);
}
const rowsOf = (shape, pix) => pix || procShape(shape || 'orb', 0);

const shapeCache = new Map();
/** 문자 그림 → 캔버스 (외곽선 포함), rot: 0 오른쪽 1 아래 2 왼쪽 3 위 */
function glyphCanvas(rows, color, rot) {
  const key = rows.join('|') + color + (rot || 0);
  let c = shapeCache.get(key);
  if (c) return c;
  const n = rows.length;
  const base = makeCanvas(n + 2, n + 2);
  const cl = { '#': color, o: light(color, 0.5), '.': dark(color, 0.42), w: '#ffffff', k: '#1a1026' };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let sx = x, sy = y;
    if (rot === 1) { sx = y; sy = n - 1 - x; } else if (rot === 2) { sx = n - 1 - x; sy = n - 1 - y; } else if (rot === 3) { sx = n - 1 - y; sy = x; }
    const ch = (rows[sy] || '')[sx];
    if (ch && cl[ch]) { base[1].fillStyle = cl[ch]; base[1].fillRect(x + 1, y + 1, 1, 1); }
  }
  const m = makeCanvas(n + 2, n + 2);
  outlined(m[1], base[0], n + 2, n + 2, '#0b0820', 0.85);
  c = m[0];
  if (shapeCache.size > 1500) shapeCache.clear();
  shapeCache.set(key, c);
  return c;
}
const rotOf = (vx, vy) => (Math.abs(vx) >= Math.abs(vy) ? (vx >= 0 ? 0 : 2) : (vy > 0 ? 1 : 3));
/** x,y: 고해상도 픽셀 좌표 (가운데), k: 배율 */
function drawGlyph(g, rows, color, x, y, k, rot) {
  const c = glyphCanvas(rows, color, rot || 0), s = c.width * k;
  g.drawImage(c, Math.round(x - s / 2), Math.round(y - s / 2), s, s);
}
function glyphIcon(rows, color, px) {
  const c = glyphCanvas(rows, color, 0);
  const m = makeCanvas(c.width, c.height);
  m[1].drawImage(c, 0, 0);
  m[0].className = 'glyph';
  if (px) { m[0].style.width = px + 'px'; m[0].style.height = px + 'px'; }
  return m[0];
}
/** 부드러운 빛 (가산 혼합용), r: 고해상도 픽셀 */
const glowCache = new Map();
function glowCanvas(color, r) {
  r = clamp(Math.round(r / 4) * 4, 8, 220);
  const key = color + r;
  let c = glowCache.get(key);
  if (c) return c;
  const m = makeCanvas(r * 2, r * 2);
  const gr = m[1].createRadialGradient(r, r, 0, r, r, r);
  const [R, G, B] = hexRgb(color);
  gr.addColorStop(0, `rgba(${R},${G},${B},0.55)`);
  gr.addColorStop(0.35, `rgba(${R},${G},${B},0.2)`);
  gr.addColorStop(1, `rgba(${R},${G},${B},0)`);
  m[1].fillStyle = gr; m[1].fillRect(0, 0, r * 2, r * 2);
  c = m[0];
  if (glowCache.size > 300) glowCache.clear();
  glowCache.set(key, c);
  return c;
}
function pixRing(g, cx, cy, r, color, th) {
  g.fillStyle = color;
  cx = Math.round(cx); cy = Math.round(cy); r = Math.max(1, Math.round(r));
  const s = th || 1;
  let x = r, y = 0, err = 1 - r;
  while (x >= y) {
    g.fillRect(cx + x, cy + y, s, s); g.fillRect(cx - x, cy + y, s, s); g.fillRect(cx + x, cy - y, s, s); g.fillRect(cx - x, cy - y, s, s);
    g.fillRect(cx + y, cy + x, s, s); g.fillRect(cx - y, cy + x, s, s); g.fillRect(cx + y, cy - x, s, s); g.fillRect(cx - y, cy - x, s, s);
    y++;
    if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
  }
}
/** 점선 원 (돌아가는 표시용) */
function dashRing(g, cx, cy, r, color, ph, n) {
  g.fillStyle = color;
  n = n || Math.max(12, Math.round(r * 0.8));
  for (let i = 0; i < n; i++) { if ((i + Math.floor(ph)) % 3 === 0) continue; const a = i / n * Math.PI * 2 + ph * 0.05; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2); }
}
function pixDisc(g, cx, cy, r, color, phase, step) {
  g.fillStyle = color;
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  const m = step || 3, r2 = r * r;
  for (let y = -r; y <= r; y++) {
    const hw = Math.floor(Math.sqrt(r2 - y * y));
    for (let x = -hw; x <= hw; x++) if (((x + y * 2 + phase) % m + m) % m === 0) g.fillRect(cx + x, cy + y, 1, 1);
  }
}
function fillDisc(g, cx, cy, r, color) {
  g.fillStyle = color;
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  for (let y = -r; y <= r; y++) { const hw = Math.floor(Math.sqrt(r * r - y * y)); g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); }
}
function fillEll(g, cx, cy, rx, ry, color) {
  g.fillStyle = color;
  cx = Math.round(cx); cy = Math.round(cy); rx = Math.round(rx); ry = Math.max(1, Math.round(ry));
  for (let y = -ry; y <= ry; y++) { const hw = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.01))); g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); }
}

/* ----- 맵 (탑뷰, 480x320). wall은 이동·발사체를 막고 pit은 이동만 막는다 ----- */
const MAPS = [
  { name: '달빛 옥상', short: '옥상', B: 8, ambient: 'dust', dust: '#5a5690', floor: '#2e2a54',
    spawns: [[150, 160], [330, 160], [240, 110], [240, 214]],
    obs: [
      { x: 96, y: 64, w: 26, h: 16, k: 'wall', s: 'ac' }, { x: 358, y: 64, w: 26, h: 16, k: 'wall', s: 'ac' },
      { x: 96, y: 240, w: 26, h: 16, k: 'wall', s: 'ac' }, { x: 358, y: 240, w: 26, h: 16, k: 'wall', s: 'ac' },
      { x: 34, y: 148, w: 24, h: 22, k: 'wall', s: 'tank' }, { x: 422, y: 148, w: 24, h: 22, k: 'wall', s: 'tank' },
      { x: 218, y: 34, w: 44, h: 20, k: 'pit', s: 'glass' }, { x: 218, y: 266, w: 44, h: 20, k: 'pit', s: 'glass' },
      { x: 170, y: 118, w: 10, h: 8, k: 'wall', s: 'vent' }, { x: 300, y: 194, w: 10, h: 8, k: 'wall', s: 'vent' },
      { x: 300, y: 118, w: 10, h: 8, k: 'wall', s: 'vent' }, { x: 170, y: 194, w: 10, h: 8, k: 'wall', s: 'vent' },
      { x: 56, y: 52, w: 6, h: 6, k: 'wall', s: 'antenna' }, { x: 418, y: 262, w: 6, h: 6, k: 'wall', s: 'antenna' },
    ],
    lights: [[120, 6, 40, '#ff5ad0', 1], [360, 6, 40, '#3fd8ff', 1], [240, 44, 30, '#7fb8ff', 0], [240, 276, 30, '#7fb8ff', 0], [59, 34, 14, '#ff4d4d', 2], [421, 244, 14, '#ff4d4d', 2]] },
  { name: '화산 분화구', short: '화산', B: 8, ambient: 'ember', dust: '#4a2a2a', floor: '#2a1418',
    spawns: [[170, 110], [310, 210], [310, 110], [170, 210]],
    obs: [
      { x: 56, y: 116, w: 52, h: 72, k: 'pit', s: 'lava' }, { x: 372, y: 132, w: 52, h: 72, k: 'pit', s: 'lava' },
      { x: 190, y: 26, w: 100, h: 26, k: 'pit', s: 'lava' }, { x: 190, y: 268, w: 100, h: 26, k: 'pit', s: 'lava' },
      { x: 120, y: 218, w: 26, h: 20, k: 'pit', s: 'lava' }, { x: 334, y: 84, w: 26, h: 20, k: 'pit', s: 'lava' },
      { x: 222, y: 130, w: 16, h: 14, k: 'wall', s: 'rock' }, { x: 248, y: 174, w: 16, h: 14, k: 'wall', s: 'rock' },
      { x: 118, y: 58, w: 18, h: 14, k: 'wall', s: 'rock' }, { x: 344, y: 246, w: 18, h: 14, k: 'wall', s: 'rock' },
      { x: 78, y: 252, w: 14, h: 12, k: 'wall', s: 'rock' }, { x: 392, y: 50, w: 14, h: 12, k: 'wall', s: 'rock' },
    ],
    lights: [] },
  { name: '구름 신전', short: '신전', B: 8, ambient: 'petal', dust: '#c8b8a0', floor: '#dccfb8',
    spawns: [[150, 160], [330, 160], [240, 90], [240, 230]],
    obs: [
      { x: 120, y: 80, w: 12, h: 12, k: 'wall', s: 'pillar' }, { x: 348, y: 80, w: 12, h: 12, k: 'wall', s: 'pillar' },
      { x: 120, y: 228, w: 12, h: 12, k: 'wall', s: 'pillar' }, { x: 348, y: 228, w: 12, h: 12, k: 'wall', s: 'pillar' },
      { x: 180, y: 120, w: 12, h: 12, k: 'wall', s: 'pillar' }, { x: 288, y: 120, w: 12, h: 12, k: 'wall', s: 'pillar' },
      { x: 180, y: 188, w: 12, h: 12, k: 'wall', s: 'pillar' }, { x: 288, y: 188, w: 12, h: 12, k: 'wall', s: 'pillar' },
      { x: 8, y: 120, w: 40, h: 80, k: 'pit', s: 'cloud' }, { x: 432, y: 120, w: 40, h: 80, k: 'pit', s: 'cloud' },
      { x: 200, y: 8, w: 80, h: 28, k: 'pit', s: 'cloud' }, { x: 200, y: 284, w: 80, h: 28, k: 'pit', s: 'cloud' },
      { x: 234, y: 52, w: 12, h: 8, k: 'wall', s: 'brazier' }, { x: 234, y: 262, w: 12, h: 8, k: 'wall', s: 'brazier' },
    ],
    lights: [[240, 46, 26, '#ffb02e', 2], [240, 256, 26, '#ffb02e', 2]] },
  { name: '밤의 숲', short: '숲', B: 8, ambient: 'firefly', dust: '#2f5a2f', floor: '#1f3a24',
    spawns: [[150, 110], [330, 210], [330, 110], [150, 210]],
    obs: [
      { x: 66, y: 60, w: 8, h: 6, k: 'wall', s: 'tree' }, { x: 126, y: 36, w: 8, h: 6, k: 'wall', s: 'tree' },
      { x: 400, y: 64, w: 8, h: 6, k: 'wall', s: 'tree' }, { x: 346, y: 34, w: 8, h: 6, k: 'wall', s: 'tree' },
      { x: 56, y: 262, w: 8, h: 6, k: 'wall', s: 'tree' }, { x: 146, y: 286, w: 8, h: 6, k: 'wall', s: 'tree' },
      { x: 416, y: 252, w: 8, h: 6, k: 'wall', s: 'tree' }, { x: 326, y: 282, w: 8, h: 6, k: 'wall', s: 'tree' },
      { x: 192, y: 88, w: 8, h: 6, k: 'wall', s: 'tree' }, { x: 288, y: 232, w: 8, h: 6, k: 'wall', s: 'tree' },
      { x: 96, y: 170, w: 8, h: 6, k: 'wall', s: 'tree' }, { x: 380, y: 170, w: 8, h: 6, k: 'wall', s: 'tree' },
      { x: 204, y: 136, w: 72, h: 48, k: 'pit', s: 'pond' },
      { x: 300, y: 122, w: 12, h: 9, k: 'wall', s: 'rock' }, { x: 168, y: 196, w: 12, h: 9, k: 'wall', s: 'rock' },
    ],
    lights: [[40, 120, 14, '#5fffe0', 2], [440, 200, 14, '#5fffe0', 2], [250, 120, 12, '#5fffe0', 2], [120, 120, 10, '#b8ff5f', 2]] },
];
const OBS_H = { ac: 8, tank: 14, vent: 4, antenna: 3, rock: 6, pillar: 20, brazier: 6, tree: 7 };

function drawObstacle(o, mi, R) {
  const hgt = OBS_H[o.s] || 6;
  const cw = o.w + 2, ch = o.h + hgt + (o.s === 'antenna' ? 16 : 0) + 2;
  const top = ch - o.h - 1 - hgt; // 윗면이 시작하는 y
  const [cv, g] = makeCanvas(cw * RS, ch * RS);
  g.setTransform(RS, 0, 0, RS, 0, 0);
  const F = (x, y, w, h, c) => { if (w > 0 && h > 0) { g.fillStyle = c; g.fillRect(x, y, w, h); } };
  const fine = (x, y, w, h, c) => { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = c; g.fillRect(Math.round(x * RS), Math.round(y * RS), w, h); g.setTransform(RS, 0, 0, RS, 0, 0); };
  const box = (x, y, w, h, hg, topC, frontC, edgeC) => { F(x, y + h, w, hg, frontC); F(x, y, w, h, topC); F(x, y, w, 1, edgeC); F(x, y + h, w, 1, dark(frontC, 0.25)); };
  const x0 = 1, y0 = top;
  switch (o.s) {
    case 'ac': {
      box(x0, y0, o.w, o.h, hgt, '#8e96c4', '#5a6088', '#c8ccec');
      for (let i = 0; i < o.w - 4; i += 2) F(x0 + 2 + i, y0 + o.h + 2, 1, hgt - 3, '#454a70');
      const fx = x0 + o.w - 9, fy = y0 + 3;
      F(fx, fy, 8, 8, '#454a70'); F(fx + 1, fy + 1, 6, 6, '#2a2e4a'); F(fx + 3, fy + 1, 2, 6, '#6a70a0'); F(fx + 1, fy + 3, 6, 2, '#6a70a0'); F(fx + 3, fy + 3, 2, 2, '#c8ccec');
      F(x0 + 2, y0 + 3, 8, 1, '#6a70a0'); F(x0 + 2, y0 + 6, 8, 1, '#6a70a0'); F(x0 + 2, y0 + 9, 8, 1, '#6a70a0');
      break;
    }
    case 'tank': {
      F(x0 + 2, y0 + o.h + hgt - 3, 2, 3, '#3a3658'); F(x0 + o.w - 4, y0 + o.h + hgt - 3, 2, 3, '#3a3658');
      F(x0, y0 + o.h, o.w, hgt - 3, '#6a8cb0');
      for (let i = 2; i < o.w; i += 5) F(x0 + i, y0 + o.h, 1, hgt - 3, '#4f6c90');
      F(x0, y0 + o.h + 2, o.w, 1, '#8aaad0');
      F(x0 + 2, y0, o.w - 4, o.h, '#9ab8da'); F(x0, y0 + 2, o.w, o.h - 4, '#9ab8da'); F(x0 + 1, y0 + 1, o.w - 2, o.h - 2, '#9ab8da');
      F(x0 + 4, y0 + 3, o.w - 8, o.h - 6, '#7f9fc4'); F(x0 + o.w / 2 - 2, y0 + o.h / 2 - 2, 4, 4, '#c8dcf0');
      F(x0 + 2, y0, o.w - 4, 1, '#d8e8f8');
      break;
    }
    case 'vent': box(x0, y0, o.w, o.h, hgt, '#7a80aa', '#4a4f78', '#a8acd8'); F(x0 + 2, y0 + 2, o.w - 4, o.h - 4, '#2a2e4a'); F(x0 + 3, y0 + 3, o.w - 6, 1, '#4a4f78'); break;
    case 'antenna': {
      box(x0, y0, o.w, o.h, hgt, '#7a80aa', '#4a4f78', '#a8acd8');
      F(x0 + 2, y0 - 15, 2, 17, '#a8acd8'); F(x0 + 1, y0 - 11, 4, 1, '#a8acd8'); F(x0 + 1, y0 - 6, 4, 1, '#a8acd8');
      F(x0 + 2, y0 - 16, 2, 2, '#ff4d4d');
      break;
    }
    case 'rock': {
      const base = mi === 3 ? '#5a6a5a' : '#5a3a36', hi = mi === 3 ? '#8a9a8a' : '#7a524a', lo = mi === 3 ? '#3a463a' : '#3a1e22';
      F(x0, y0 + o.h, o.w, hgt, lo); F(x0, y0 + 2, o.w, o.h - 2, base); F(x0 + 2, y0, o.w - 4, 2, base);
      F(x0 + 2, y0 + 1, o.w - 6, 2, hi); F(x0 + 1, y0 + 3, 3, 3, hi);
      F(x0 + o.w - 4, y0 + o.h - 1, 3, 2, lo); F(x0 + 4, y0 + o.h + 2, 1, hgt - 3, dark(lo, 0.3));
      g.clearRect(x0, y0, 1, 2); g.clearRect(x0 + o.w - 1, y0, 1, 2);
      for (let k = 0; k < o.w * 3; k++) fine(x0 + R() * o.w, y0 + 1 + R() * (o.h - 1), 1, 1, R() < 0.5 ? hi : lo);
      if (mi === 3) { F(x0 + 3, y0 + 2, 2, 1, '#6fae5a'); F(x0 + o.w - 5, y0 + 3, 2, 1, '#6fae5a'); }
      break;
    }
    case 'pillar': {
      F(x0 - 1 + 1, y0 + o.h + hgt - 2, o.w, 2, '#c8b498');
      F(x0 + 1, y0 + o.h, o.w - 2, hgt - 2, '#f4ead8');
      for (let i = 2; i < o.w - 2; i += 2) F(x0 + i, y0 + o.h, 1, hgt - 2, '#d8c8ac');
      F(x0, y0, o.w, o.h, '#fff6e6'); F(x0, y0, o.w, 1, '#ffffff'); F(x0, y0 + o.h - 1, o.w, 1, '#d8c8ac');
      F(x0 + 2, y0 + 2, o.w - 4, o.h - 4, '#f0e4cc'); F(x0 + o.w / 2 - 1, y0 + o.h / 2 - 1, 2, 2, GOLD);
      break;
    }
    case 'brazier': {
      F(x0 + o.w / 2 - 1, y0 + o.h, 2, hgt, '#8a6a2a'); F(x0 + 2, y0 + o.h + hgt - 1, o.w - 4, 1, '#8a6a2a');
      F(x0, y0, o.w, o.h, '#c8962a'); F(x0, y0, o.w, 1, '#ffd23f'); F(x0 + 2, y0 + 1, o.w - 4, o.h - 3, '#3a1e10');
      break;
    }
    case 'tree': {
      F(x0 - 1 + 1, y0 + o.h + hgt - 1, o.w, 1, '#2a1a0e');
      F(x0 + 1, y0, o.w - 2, o.h + hgt, '#5a3a22'); F(x0 + 2, y0, 1, o.h + hgt, '#7a5232'); F(x0 + o.w - 3, y0, 1, o.h + hgt, '#3a2414');
      F(x0, y0 + o.h + hgt - 2, 2, 2, '#4a2e1a'); F(x0 + o.w - 2, y0 + o.h + hgt - 2, 2, 2, '#4a2e1a');
      break;
    }
  }
  // 고해상도 테두리: 윗면 가장자리에 가는 밝은 선, 앞면 아래에 가는 어두운 선
  g.setTransform(1, 0, 0, 1, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height), px = d.data, Wc = cv.width;
  const opaque = (x, y) => x >= 0 && y >= 0 && x < Wc && y < cv.height && px[(y * Wc + x) * 4 + 3] > 0;
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < Wc; x++) if (opaque(x, y) && !opaque(x, y - 1)) g.fillRect(x, y, 1, 1);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < Wc; x++) if (opaque(x, y) && !opaque(x, y + 1)) g.fillRect(x, y, 1, 1);
  for (let k = 0; k < o.w * o.h; k++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'; g.fillRect((R() * Wc) | 0, (R() * cv.height) | 0, 1, 1); }
  g.globalCompositeOperation = 'destination-in'; g.drawImage(cvCopy(d, Wc, cv.height), 0, 0); g.globalCompositeOperation = 'source-over';
  return { cv, dx: o.x - 1, dy: o.y - top - hgt, hgt, key: o.y + o.h, o };
}

function cvCopy(imgData, w, h) { const m = makeCanvas(w, h); m[1].putImageData(imgData, 0, 0); return m[0]; }
function buildMap(i) {
  const m = MAPS[i % MAPS.length];
  if (m.bg) return m;
  const [cv, g] = makeCanvas(W * RS, H * RS);
  g.setTransform(RS, 0, 0, RS, 0, 0);
  const R = mulberry(4321 + i * 77);
  const B = m.B;
  const F = (x, y, w, h, c) => { if (w > 0 && h > 0) { g.fillStyle = c; g.fillRect(x, y, w, h); } };
  m.lava = []; m.canopies = []; m.lightsDyn = [];
  if (i === 0) {
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) {
      const v = R();
      F(x, y, 16, 16, v < 0.33 ? '#302c58' : v < 0.66 ? '#2e2a54' : '#322e5c');
      if (R() < 0.25) F(x + 3 + ((R() * 8) | 0), y + 3 + ((R() * 8) | 0), 3, 2, '#3a3668');
    }
    for (let x = 0; x < W; x += 16) F(x, 0, 1, H, '#24204a');
    for (let y = 0; y < H; y += 16) F(0, y, W, 1, '#24204a');
    for (let k = 0; k < 10; k++) { let x = (R() * W) | 0, y = (R() * H) | 0; for (let s = 0; s < 14; s++) { F(x, y, 1, 1, '#221e44'); x += ((R() * 3) | 0) - 1; y += ((R() * 3) | 0) - 1; } }
    // 헬기 착륙장
    const cx = 240, cy = 160;
    for (let a = 0; a < 360; a += 1) { const r = a * Math.PI / 180; F(Math.round(cx + Math.cos(r) * 42), Math.round(cy + Math.sin(r) * 42), 2, 2, '#c8a83a'); }
    F(cx - 9, cy - 10, 3, 20, '#d8d0b0'); F(cx + 6, cy - 10, 3, 20, '#d8d0b0'); F(cx - 6, cy - 1, 12, 3, '#d8d0b0');
    // 웅덩이와 배관
    for (const [px, py, pw] of [[70, 110, 18], [400, 210, 22], [300, 60, 14]]) { F(px, py, pw, 5, '#3a4a7a'); F(px + 2, py - 1, pw - 4, 7, '#3a4a7a'); F(px + 3, py + 1, 4, 1, '#6a8ac8'); }
    F(B, 120, 26, 3, '#4a4680'); F(B, 121, 26, 1, '#5a5690'); F(W - B - 26, 198, 26, 3, '#4a4680'); F(W - B - 26, 199, 26, 1, '#5a5690');
    m.wall = ['#8e96c4', '#5a6088', '#c8ccec'];
  } else if (i === 1) {
    F(0, 0, W, H, '#2a1418');
    for (let k = 0; k < 900; k++) F((R() * W) | 0, (R() * H) | 0, 1 + ((R() * 3) | 0), 1, R() < 0.5 ? '#341a1e' : '#22100f');
    for (let k = 0; k < 40; k++) F((R() * W) | 0, (R() * H) | 0, 3, 2, '#3a2024');
    for (let c = 0; c < 26; c++) {
      let x = (R() * W) | 0, y = (R() * H) | 0;
      for (let s = 0; s < 16; s++) { F(x, y, 1, 1, s % 4 ? '#7a2814' : '#ff7a1f'); x += ((R() * 3) | 0) - 1; y += ((R() * 3) | 0) - 1; }
      m.lightsDyn.push([x, y, 8, '#ff5a1f', 3]);
    }
    m.wall = ['#5a3a36', '#3a1e22', '#7a524a'];
  } else if (i === 2) {
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) F(x, y, 16, 16, ((x + y) / 16) % 2 ? '#e8dcc8' : '#dccfb8');
    for (let x = 0; x < W; x += 16) F(x, 0, 1, H, '#cbbca2');
    for (let y = 0; y < H; y += 16) F(0, y, W, 1, '#cbbca2');
    for (let k = 0; k < 60; k++) F((R() * W) | 0, (R() * H) | 0, 3, 1, '#f4ecdc');
    // 가운데 별 모자이크와 금빛 줄
    const cx = 240, cy = 160;
    for (let r = 0; r < 34; r++) for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; F(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 2, 2, r % 6 < 3 ? '#d8b04a' : '#7fb8e0'); }
    for (let a = 0; a < 360; a += 2) { const t = a * Math.PI / 180; F(Math.round(cx + Math.cos(t) * 36), Math.round(cy + Math.sin(t) * 36), 1, 1, '#d8b04a'); F(Math.round(cx + Math.cos(t) * 56), Math.round(cy + Math.sin(t) * 56), 1, 1, '#c8b498'); }
    F(B + 40, 60, W - 2 * B - 80, 1, '#d8b04a'); F(B + 40, 260, W - 2 * B - 80, 1, '#d8b04a');
    m.wall = ['#fff6e6', '#c8b498', '#ffffff'];
  } else {
    F(0, 0, W, H, '#1f3a24');
    for (let k = 0; k < 1400; k++) F((R() * W) | 0, (R() * H) | 0, 1, 1 + ((R() * 2) | 0), R() < 0.5 ? '#2a4a2c' : '#18301c');
    for (let k = 0; k < 120; k++) { const x = (R() * W) | 0, y = (R() * H) | 0; F(x, y, 1, 2, '#3f6a3a'); F(x + 1, y - 1, 1, 2, '#3f6a3a'); F(x - 1, y, 1, 1, '#3f6a3a'); }
    for (let k = 0; k < 40; k++) { const x = (R() * W) | 0, y = (R() * H) | 0; F(x, y, 1, 1, pick(['#ff8ad0', '#ffe14a', '#c8b8ff', '#ffffff'])); }
    // 흙길
    let px = 20, py = 300;
    for (let s = 0; s < 240; s++) { F(px, py, 7, 5, '#3a3020'); F(px + 1, py + 1, 5, 3, '#463a28'); px += 2; py -= 1.15 + Math.sin(s / 14) * 0.6; if (py < 20) break; }
    m.wall = ['#3a5a3a', '#243824', '#5a7a5a'];
  }
  // 구덩이
  for (const o of m.obs) {
    if (o.k !== 'pit') continue;
    if (o.s === 'lava') {
      F(o.x, o.y, o.w, o.h, '#d8401a');
      for (let k = 0; k < o.w * o.h / 10; k++) F(o.x + ((R() * o.w) | 0), o.y + ((R() * o.h) | 0), 2 + ((R() * 3) | 0), 1, R() < 0.5 ? '#ff9a2f' : R() < 0.5 ? '#ffd23f' : '#b8301a');
      for (let k = 0; k < o.w * o.h / 120; k++) { const x = o.x + 2 + ((R() * (o.w - 8)) | 0), y = o.y + 2 + ((R() * (o.h - 6)) | 0); F(x, y, 5, 3, '#4a1a12'); F(x + 1, y, 3, 1, '#6a2a1a'); }
      F(o.x, o.y, o.w, 3, '#6a1a10'); F(o.x - 1, o.y - 1, o.w + 2, 1, '#160a0c'); F(o.x - 1, o.y + o.h, o.w + 2, 1, '#160a0c'); F(o.x - 1, o.y, 1, o.h, '#160a0c'); F(o.x + o.w, o.y, 1, o.h, '#160a0c');
      F(o.x - 2, o.y - 2, o.w + 4, 1, '#4a2420');
      m.lava.push(o);
      for (let lx = o.x + 10; lx < o.x + o.w; lx += 22) for (let ly = o.y + 10; ly < o.y + o.h; ly += 22) m.lightsDyn.push([lx, ly, 26, '#ff6a1f', 3]);
    } else if (o.s === 'glass') {
      F(o.x - 2, o.y - 2, o.w + 4, o.h + 4, '#8e96c4'); F(o.x, o.y, o.w, o.h, '#1a2a5a');
      for (let k = 0; k < o.w; k += 11) F(o.x + k, o.y, 1, o.h, '#8e96c4');
      for (let k = 0; k < 4; k++) { F(o.x + 3 + k * 11, o.y + 3, 2, 1, '#7fb8ff'); F(o.x + 4 + k * 11, o.y + 4, 3, 1, '#4a6aa8'); }
      F(o.x, o.y, o.w, 2, '#0b1430');
    } else if (o.s === 'cloud') {
      F(o.x, o.y, o.w, o.h, '#6fc0e8');
      for (let k = 0; k < o.w * o.h / 90; k++) { const cx = o.x + ((R() * (o.w - 10)) | 0), cy = o.y + 4 + ((R() * (o.h - 8)) | 0); F(cx, cy, 10, 3, '#ffffff'); F(cx + 2, cy - 2, 5, 2, '#ffffff'); F(cx + 1, cy + 3, 8, 1, '#cfe8f8'); }
      F(o.x, o.y, o.w, 3, '#3f8fb8'); F(o.x, o.y + 3, o.w, 1, '#5fa8d0');
    } else if (o.s === 'pond') {
      const r = (x, y, w, h, c) => F(x, y, w, h, c);
      r(o.x + 4, o.y, o.w - 8, o.h, '#1a3a5a'); r(o.x, o.y + 4, o.w, o.h - 8, '#1a3a5a'); r(o.x + 2, o.y + 2, o.w - 4, o.h - 4, '#1a3a5a');
      r(o.x + 6, o.y + 4, o.w - 12, o.h - 8, '#224a6a');
      r(o.x + 4, o.y, o.w - 8, 2, '#0f2438');
      for (const [lx, ly] of [[o.x + 12, o.y + 12], [o.x + 50, o.y + 30], [o.x + 30, o.y + 36]]) { r(lx, ly, 6, 4, '#3f8a3a'); r(lx + 1, ly, 4, 1, '#5fae5a'); r(lx + 2, ly + 2, 2, 1, '#2a6a2a'); }
      r(o.x + 40, o.y + 10, 2, 2, '#ff8ad0'); r(o.x + 41, o.y + 9, 1, 1, '#ffd0e8');
      m.pond = o;
    }
  }
  // 테두리 벽
  const [wt, wf, we] = m.wall;
  F(0, 0, W, B, wt); F(0, B - 3, W, 3, wf); F(0, 0, W, 1, we);
  F(0, H - B, W, B, wt); F(0, H - B, W, 1, we);
  F(0, 0, B, H, wt); F(W - B, 0, B, H, wt); F(B - 1, B, 1, H - 2 * B, wf); F(W - B, B, 1, H - 2 * B, wf);
  for (let x = 6; x < W; x += 24) { F(x, 1, 1, B - 4, wf); F(x, H - B + 1, 1, B - 2, wf); }
  if (i === 0) { F(100, 2, 40, 3, '#ff5ad0'); F(340, 2, 40, 3, '#3fd8ff'); }
  // 벽 장애물 그림 (그리기 순서는 엔진이 y로 정함)
  m.walls = m.obs.filter((o) => o.k === 'wall').map((o) => { const d = drawObstacle(o, i, R); o.hgt = d.hgt; return d; });
  // 그림자
  for (const o of m.obs) if (o.k === 'wall') { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(o.x + 2, o.y + o.h, o.w, 2); g.fillRect(o.x + o.w, o.y + 2, 2, o.h); }
  // 나무 그늘(위층)
  if (i === 3) {
    for (const o of m.obs) if (o.s === 'tree') {
      const r = 18 + ((R() * 6) | 0), cx = o.x + o.w / 2, cy = o.y - 10;
      const [cc, cg] = makeCanvas((r * 2 + 4) * RS, (r * 2 + 4) * RS);
      cg.setTransform(RS, 0, 0, RS, 0, 0);
      const ox = r + 2, oy = r + 2;
      fillDisc(cg, ox, oy, r, '#1e4a26');
      for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, rr = r * 0.62; fillDisc(cg, ox + Math.cos(a) * rr, oy + Math.sin(a) * rr * 0.8, r * 0.45, '#24582c'); }
      fillDisc(cg, ox - 3, oy - 4, r * 0.55, '#2f6a34');
      for (let k = 0; k < r * 3; k++) { const a = R() * 6.28, rr = R() * r * 0.9; cg.fillStyle = R() < 0.5 ? '#3f8a3a' : '#163a1c'; cg.fillRect(Math.round(ox + Math.cos(a) * rr), Math.round(oy + Math.sin(a) * rr), 2, 1); }
      cg.setTransform(1, 0, 0, 1, 0, 0);
      for (let k = 0; k < r * r * 6; k++) { const a = R() * 6.28, rr = Math.sqrt(R()) * r * 0.95 * RS; const lx = (ox * RS + Math.cos(a) * rr) | 0, ly = (oy * RS + Math.sin(a) * rr) | 0; cg.fillStyle = R() < 0.3 ? '#5fae5a' : R() < 0.5 ? '#2f6a34' : '#163a1c'; cg.fillRect(lx, ly, R() < 0.3 ? 2 : 1, 1); }
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = -r; y <= r; y += 2) { const hw = Math.floor(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx + 6 - hw), Math.round(cy + 14 + y * 0.5), hw * 2, 1); }
      m.canopies.push({ cv: cc, x: cx - ox, y: cy - oy, cx, cy, r });
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  const tex = i === 2 ? ['rgba(255,255,255,0.18)', 'rgba(120,100,70,0.12)'] : i === 3 ? ['rgba(120,200,110,0.16)', 'rgba(0,0,0,0.16)'] : ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.16)'];
  for (let k = 0; k < 42000; k++) { g.fillStyle = k & 1 ? tex[0] : tex[1]; g.fillRect((R() * W * RS) | 0, (R() * H * RS) | 0, R() < 0.2 ? 2 : 1, 1); }
  if (i === 3) for (let k = 0; k < 900; k++) { const x = (R() * W * RS) | 0, y = (R() * H * RS) | 0; g.fillStyle = R() < 0.5 ? '#4f8a48' : '#2f5a30'; g.fillRect(x, y, 1, 3); g.fillRect(x + 1, y + 1, 1, 2); }
  if (i === 2) for (let y = 0; y < H * RS; y += 48) for (let x = 0; x < W * RS; x += 48) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 1, y + 1, 46, 1); g.fillRect(x + 1, y + 1, 1, 46); }
  m.bg = cv;
  m.lightsAll = (m.lights || []).map((l) => ({ x: l[0], y: l[1], r: l[2], c: l[3], f: l[4] })).concat(m.lightsDyn.map((l) => ({ x: l[0], y: l[1], r: l[2], c: l[3], f: l[4] })));
  return m;
}

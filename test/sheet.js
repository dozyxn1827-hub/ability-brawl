const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.goto('file://' + __dirname + '/../dist/index.html');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const cols = HEADS.length, poses = [['idle', 0], ['run', 0, 0.1], ['run', 0, 0.2], ['idle', 1], ['run', 2, 0.05], ['run', 2, 0.22], ['cast', 2], ['cast', 0], ['hurt', 0]];
    const cv = document.createElement('canvas'); cv.width = cols * (SW + 2); cv.height = poses.length * 46;
    const g = cv.getContext('2d'); g.fillStyle = '#302c58'; g.fillRect(0, 0, cv.width, cv.height);
    const m = makeCanvas(SW, SH);
    HEADS.forEach((hd, i) => {
      const spec = fallbackSpec(BOT_ABILITIES[i % 12], []);
      const look = Object.assign({}, spec.look, { head: hd, weapon: WEAPONS[i % WEAPONS.length], cape: i % 3 === 0, outfit: OUTFITS[i % OUTFITS.length] });
      poses.forEach(([pose, dir, t], r) => {
        renderSprite(m[0], look, { pose, t: t || 0, dir, st: {}, hurt: pose === 'hurt', glow: '#ffe14a' });
        g.drawImage(m[0], 0, OY - 44, SW, 46, i * (SW + 2), r * 46, SW, 46);
      });
    });
    cv.style.width = cv.width * 2 + 'px'; cv.style.imageRendering = 'pixelated';
    const sc = document.createElement('canvas'); sc.width = SHAPES.length * 16; sc.height = 8 * 16;
    const sg = sc.getContext('2d'); sg.fillStyle = '#221c46'; sg.fillRect(0, 0, sc.width, sc.height);
    const colsC = ['#ff6a1f', '#7fd8ff', '#ffe14a', '#b6f24a', '#ff8ad0', '#c8b8ff', '#e8e8f0', '#8a5cff'];
    SHAPES.forEach((s, i) => { for (let f = 0; f < 8; f++) sg.drawImage(glyphCanvas(procShape(s, f % shapeFrames(s)), colsC[(i + f) % 8], 0), i * 16 + 1, f * 16 + 1); });
    sc.style.width = sc.width * 3 + 'px'; sc.style.imageRendering = 'pixelated'; sc.style.display = 'block'; sc.style.marginTop = '8px';
    document.body.innerHTML = ''; document.body.style.background = '#111'; document.body.style.margin = '0'; document.body.append(cv, sc);
  });
  await page.screenshot({ path: __dirname + '/sheet.png', fullPage: true });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close();
})();

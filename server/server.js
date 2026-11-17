// 능력 난투 독립 서버: 게임 페이지 + 실시간 방(SSE) + AI 중계. 외부 패키지 없이 Node 18 이상에서 실행.
// 실행: node server.js   (AI를 쓰려면 ANTHROPIC_API_KEY 환경 변수 설정)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = +process.env.PORT || 3000;
const KEY = process.env.ANTHROPIC_API_KEY || '';
const GKEY = process.env.GEMINI_API_KEY || ''; // 구글 Gemini 무료 키 (Anthropic 키가 없을 때 사용)
const GMODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const AI_ON = !!(KEY || GKEY);
const MODELS = { complex: process.env.AI_MODEL_COMPLEX || 'claude-opus-5-5', default: process.env.AI_MODEL || 'claude-sonnet-5-5', quick: process.env.AI_MODEL_QUICK || 'claude-haiku-5-5' };
const PAGE = path.join(__dirname, 'public', 'index.html');

const rooms = new Map(); // room -> Map(peer -> { res, presence })
const room = (id) => { if (!rooms.has(id)) rooms.set(id, new Map()); return rooms.get(id); };
const send = (res, obj) => { try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch (e) { /* 끊김 */ } };
const broadcast = (id, obj) => { for (const p of room(id).values()) send(p.res, obj); };

function body(req, limit) {
  return new Promise((ok, bad) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > limit) { bad(new Error('too big')); req.destroy(); } });
    req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch (e) { bad(e); } });
  });
}
const json = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

let aiBusy = 0;
// Gemini 무료 사용량은 분당 요청 수가 적어서 한 번에 하나씩, 막히면 잠시 쉬었다 다시
let gChain = Promise.resolve();
function callGemini(input) {
  const run = async () => {
    const text = typeof input === 'string' ? input : input.map((m) => m.content).join('\n\n');
    for (let i = 0; i < 4; i++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GMODEL}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': GKEY },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192, temperature: 1.1 } }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 429 || r.status === 503) { await new Promise((ok) => setTimeout(ok, 15000)); continue; }
      if (!r.ok) throw { status: r.status, code: 'error', message: (d.error && d.error.message) || 'Gemini 오류' };
      const parts = (((d.candidates || [])[0] || {}).content || {}).parts || [];
      return parts.map((p) => p.text || '').join('');
    }
    throw { status: 429, code: 'rate_limited', message: 'Gemini 무료 사용량이 잠시 꽉 찼어요' };
  };
  const p = gChain.then(run, run);
  gChain = p.catch(() => {});
  return p;
}
async function callAI(input, tier) {
  if (!KEY) return callGemini(input);
  const messages = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELS[tier] || MODELS.default, max_tokens: 8000, messages }),
  });
  const d = await r.json();
  if (!r.ok) throw { status: r.status, code: r.status === 429 ? 'rate_limited' : 'error', message: (d.error && d.error.message) || 'AI 오류' };
  return (d.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store, max-age=0' });
      return fs.createReadStream(PAGE).pipe(res);
    }
    if (u.pathname === '/build') {
      let b = '';
      try { const m = fs.readFileSync(PAGE, 'utf8').match(/const BUILD = '([0-9a-f]+)'/); b = m ? m[1] : ''; } catch (e) {}
      return json(res, 200, { build: b });
    }
    if (u.pathname === '/events') {
      const id = (u.searchParams.get('room') || 'main').slice(0, 40), peer = (u.searchParams.get('peer') || '').slice(0, 20);
      if (!peer) return json(res, 400, {});
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive', 'x-accel-buffering': 'no' });
      res.write('retry: 1000\n\n');
      const r = room(id);
      for (const [p, v] of r) send(res, { peer: p, presence: v.presence });
      r.set(peer, { res, presence: (r.get(peer) || {}).presence || {} });
      const ping = setInterval(() => res.write(': ping\n\n'), 15000);
      req.on('close', () => {
        clearInterval(ping);
        if (r.get(peer) && r.get(peer).res === res) { r.delete(peer); broadcast(id, { peer, left: true }); }
        if (!r.size) rooms.delete(id);
      });
      return;
    }
    if (req.method === 'POST' && u.pathname === '/presence') {
      const b = await body(req, 16000);
      const r = room(String(b.room || 'main').slice(0, 40)), p = r.get(b.peer);
      if (p) { p.presence = b.presence || {}; broadcast(String(b.room || 'main').slice(0, 40), { peer: b.peer, presence: p.presence }); }
      return json(res, 200, { ok: true });
    }
    if (u.pathname === '/ai-status') return json(res, 200, { ok: AI_ON });
    if (req.method === 'POST' && u.pathname === '/ai') {
      if (!AI_ON) return json(res, 403, { code: 'not_granted', message: 'AI 키가 설정되지 않았어요' });
      if (aiBusy >= 8) return json(res, 429, { code: 'rate_limited', message: '잠시 후 다시' });
      const b = await body(req, 200000);
      aiBusy++;
      try { return json(res, 200, { text: await callAI(b.input, b.tier) }); }
      catch (e) { return json(res, e.status === 429 ? 429 : 500, { code: e.code || 'error', message: e.message || 'AI 오류' }); }
      finally { aiBusy--; }
    }
    json(res, 404, {});
  } catch (e) { json(res, 400, { code: 'error', message: String(e.message || e) }); }
}).listen(PORT, () => console.log(`능력 난투 서버: http://localhost:${PORT}  (AI ${KEY ? '켜짐 (Claude)' : GKEY ? '켜짐 (Gemini ' + GMODEL + ')' : '꺼짐 - 기본 설계로 진행'})`));

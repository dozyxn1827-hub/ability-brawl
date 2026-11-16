# 능력 난투 · 독립 서버판

claude.ai 없이 친구들과 각자 컴퓨터로 온라인 대전을 하는 버전입니다. 외부 패키지 설치 없이 Node.js만 있으면 돼요.

## 1. 준비
- Node.js 18 이상 설치 (https://nodejs.org)
- (선택, 무료) AI 능력 설계를 무료로 쓰려면 Google AI Studio(https://aistudio.google.com/apikey)의 Gemini API 키를 환경 변수 `GEMINI_API_KEY`로. 모델은 `GEMINI_MODEL`(기본 gemini-2.5-flash)
- (선택, 유료) 더 똑똑한 설계를 원하면 Anthropic API 키 (https://console.anthropic.com). 키가 없으면 미리 만든 기본 설계로 진행돼요.

## 2. 서버 켜기 (방장 컴퓨터)
이 `server` 폴더에서:

Windows PowerShell
```
$env:ANTHROPIC_API_KEY="sk-ant-..."   # AI를 안 쓰면 이 줄은 생략
node server.js
```
macOS / Linux
```
ANTHROPIC_API_KEY=sk-ant-... node server.js
```
`http://localhost:3000` 이 열리면 성공이에요.

## 3. 친구들이 들어오는 방법
- **같은 와이파이**: 방장 컴퓨터의 내부 IP(Windows는 `ipconfig`의 IPv4 주소)로 `http://192.168.x.x:3000` 접속. 처음 실행 때 Windows 방화벽이 물으면 "허용".
- **서로 다른 곳(인터넷)**: 둘 중 하나
  - 간단: `cloudflared tunnel --url http://localhost:3000` (Cloudflare 무료 도구)로 나온 https 주소를 공유
  - 상시: Render.com 같은 무료 호스팅에 이 폴더를 올리고 Start Command를 `node server.js`, 환경 변수에 `ANTHROPIC_API_KEY` 설정
- 다 같이 접속 → "온라인으로 모이기" → 방장이 "게임 시작".
- 여러 방을 따로 쓰려면 주소 뒤에 `?room=우리방` 처럼 방 이름을 붙이세요. 같은 방 이름끼리 모여요.

## 주의
- API 키는 서버에만 있고 친구들 화면에는 보이지 않아요. AI 사용 비용은 키 주인에게 청구돼요.
- 모델은 환경 변수 `AI_MODEL_COMPLEX`, `AI_MODEL`, `AI_MODEL_QUICK`로 바꿀 수 있어요.
- 게임 코드를 고친 뒤에는 상위 폴더에서 `node build.js`를 다시 실행하면 `server/public/index.html`도 갱신돼요.

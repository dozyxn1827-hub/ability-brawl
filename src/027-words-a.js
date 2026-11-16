/* ----- 단어 사전: 단어 계열마다 어울리는 전용 기술 -----
   wfam(계열, 소재, '단어 단어 …', { 칸: 기술 또는 [기술…] }, { st, style, look, stats, passive, title, c })
   기술 = wm(방식, fx(P, S, o), '이름|이름', '설명|설명') — {n}에는 글에 나온 단어가 그대로 들어간다
   단어 앞의 ! 는 "앞뒤가 딱 떨어질 때만" (하마터면, 오리지널 같은 오인식 방지). 한 글자 단어는 자동으로 그렇게 본다 */
const WF = {};
const WF_LIST = [];
function wm(m, fx, name, desc) { return { m, fx, name: name.split('|'), desc: desc.split('|') }; }
function wfam(key, th, words, moves, opt) {
  const ws = words.split(/\s+/).filter(Boolean);
  WF[key] = Object.assign({ key, th, words: ws.map((w) => w.replace(/^!/, '')), moves }, opt || {});
  for (const w of ws) WF_LIST.push([w, key]);
}
const SV = (S, k, d) => ({ k: S || k, d });

/* ===== 바다 ===== */
wfam('shark', 'water', '상어 백상아리 죠스 귀상어 망치상어 고래상어 메갈로돈 샤크 식인상어 아기상어 청새리상어 뱀상어', {
  basic: wm('bite', (P, S) => [{ t: 'bite', dmg: 9 * P, r: 13, range: 34, kb: 3, st: SV(S, 'vuln', 1) }], '{n} 콱|{n} 한입', '{n}처럼 커다란 입으로 콱 문다'),
  s1: wm('dash', (P, S) => [{ t: 'dash', dist: 90, dmg: 6 * P, invuln: true }, { t: 'bite', dmg: 12 * P, r: 16, range: 50, kb: 5, st: SV(S, 'vuln', 1.5) }], '{n} 지느러미 돌진|{n} 기습', '지느러미를 세우고 돌진해서 그대로 덥석'),
  s2: wm('zone', (P) => [{ t: 'zone', dmg: 2 * P, r: 34, dur: 4, at: 'self', st: { k: 'slow', d: 1 } }, { t: 'buff', k: 'haste', d: 3 }], '{n} 바다 소환|피 냄새 맡기', '발밑을 바다로 만든다. 그 안에서 나는 빨라진다'),
  ult: wm('leap', (P, S) => [{ t: 'leap', dmg: 24 * P, r: 30, dist: 140, kb: 9 }, { t: 'bite', dmg: 26 * P, r: 30, range: 160, kb: 10, st: SV(S, 'stun', 1.2) }], '거대 {n} 출현|{n} 테마곡 재생', '빠밤… 빠밤… 땅속에서 거대한 {n이} 솟아 통째로 삼킨다'),
}, { st: 'vuln', style: 'brawler', passive: 'lifesteal', title: '바다의 무법자|이빨 장인|빠밤빠밤', look: { body: '#4a6a8f', hair: '#9fb8d0' } });

wfam('whale', 'water', '고래 혹등고래 범고래 흰긴수염고래 향유고래 돌고래 벨루가 일각고래 대왕고래 흰고래', {
  basic: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 5 * P, n: 1, len: 80, arc: 60, kb: 3, st: SX(S, 0.5) }], '{n} 초음파|{n} 노래', '{n} 초음파가 부채꼴로 퍼진다'),
  s1: wm('surge', (P, S) => [{ t: 'surge', dmg: 12 * P, w: 70, len: 170, speed: 170, kb: 9, st: SV(S, 'slow', 1) }], '{n} 꼬리 파도|{n} 철썩', '꼬리로 바다를 내리쳐 커다란 파도를 보낸다'),
  s2: wm('cone', (P, S) => [{ t: 'cone', dmg: 3 * P, len: 90, arc: 40, dur: 0.8, ticks: 5, kb: 3, st: SV(S, 'slip', 1) }], '{n} 물 뿜기|{n} 분수쇼', '등에서 물을 분수처럼 뿜는다'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 36 * P, r: 50, kb: 10, st: SV(S, 'stun', 1.4) }, { t: 'wave', dmg: 10 * P, r: 70, at: 'target', kb: 8 }], '{n} 점프 다이빙|하늘에서 {n}', '하늘에서 집채만 한 {n이} 배치기로 떨어진다'),
}, { st: 'slow', style: 'tank', passive: 'regen', title: '바다의 거인|노래하는 거구', stats: { hp: 20, speed: 0.92 }, look: { body: '#2f4f7f' } });

wfam('octopus', 'water', '문어 오징어 낙지 쭈꾸미 주꾸미 대왕오징어 크라켄 갑오징어 꼴뚜기 한치 문어발', {
  basic: wm('whip', (P, S) => [{ t: 'whip', dmg: 7 * P, len: 58, kb: 3, st: SX(S, 0.5) }], '{n} 다리 찰싹|{n}발 채찍', '말랑한 {n} 다리로 찰싹 때린다'),
  s1: wm('zone', (P) => [{ t: 'zone', dmg: 2 * P, r: 30, dur: 4, at: 'front', off: 40, st: { k: 'confuse', d: 1.2 } }, { t: 'blink', to: 'back', dist: 60 }], '{n} 먹물|먹물 뿌리고 튀기', '먹물을 확 뿌리고 뒤로 튄다. 먹물 속에선 방향이 헷갈린다'),
  s2: wm('grab', (P, S) => [{ t: 'grab', dmg: 12 * P, r: 16, range: 170, delay: 0.4, kb: 8, st: SV(S, 'root', 0.8) }], '{n} 촉수 낚아채기|{n} 휘감기', '바닥에서 {n} 다리가 쑥 나와 휘감아 끌고 온다'),
  ult: wm('flurry', (P, S) => [{ t: 'whip', dmg: 10 * P, len: 80, kb: 5 }, { t: 'flurry', dmg: 4 * P, r: 32, off: 20, dur: 1, ticks: 8, st: SV(S, 'slow', 1.2) }], '{n} 여덟 다리 난타|{n} 팔 폭풍', '여덟 개의 다리로 동시에 마구 때린다'),
}, { st: 'confuse', style: 'trickster', passive: 'dodge', title: '바다의 문어발|먹물 장인', look: { body: '#c0457a', hair: '#ff8ab0' } });

wfam('crab', 'water', '게 꽃게 대게 킹크랩 가재 랍스터 바닷가재 소라게 집게 집게발 털게 홍게', {
  basic: wm('bite', (P, S) => [{ t: 'bite', dmg: 8 * P, r: 11, range: 30, kb: 2, st: SV(S, 'weak', 0.8) }], '{n} 집게|{n} 꼬집기', '{n} 집게로 꽉 꼬집는다'),
  s1: wm('dash', (P) => [{ t: 'dash', dist: 100, dmg: 9 * P, kb: 6 }, { t: 'buff', k: 'armor', d: 2 }], '{n} 옆걸음 돌진|{n} 게걸음', '옆으로 미친 듯이 달려가 들이받는다'),
  s2: wm('counter', () => [{ t: 'buff', k: 'counter', d: 1.5 }, { t: 'buff', k: 'shield', d: 3, pow: 20 }], '{n} 껍데기 방어|집게 가드', '단단한 껍데기로 막고, 때리면 집게로 되받아친다'),
  ult: wm('claw', (P, S) => [{ t: 'claw', dmg: 10 * P, r: 40, kb: 4 }, { t: 'stampede', dmg: 8 * P, n: 5, speed: 150, len: 180, size: 6, kb: 5, st: SV(S, 'weak', 1) }], '{n} 대행진|{n} 떼 습격', '{n} 다섯 마리가 옆걸음으로 우르르 몰려간다'),
}, { st: 'weak', style: 'tank', passive: 'armor', title: '옆걸음 장인|집게 대장', look: { body: '#d0402a', outfit: 'armor' } });

wfam('jelly', 'elec', '해파리 전기해파리 노무라입깃해파리 전기뱀장어 가오리 전기가오리 전기메기', {
  basic: wm('chain', (P, S) => [{ t: 'chain', dmg: 5 * P, n: 2, range: 80, st: SV(S, 'stun', 0.3) }], '{n} 찌릿|{n} 감전', '{n} 전기가 옆 사람한테까지 찌릿 옮는다'),
  s1: wm('bubble', (P) => [{ t: 'bubble', dmg: 5 * P, n: 1, speed: 120, size: 4, d: 1 }], '{n} 둥실 감옥|{n} 해파리 방울', '맞으면 투명한 {n} 방울에 갇혀 둥실 뜬다'),
  s2: wm('zone', (P, S) => [{ t: 'zone', dmg: 3 * P, r: 30, dur: 4, at: 'self', follow: true, st: SV(S, 'stun', 0.5) }], '{n} 촉수 장판|찌릿 구역', '내 주변에 찌릿한 촉수가 둥둥 떠다닌다'),
  ult: wm('storm', (P, S) => [{ t: 'storm', dmg: 8 * P, n: 9, r: 50, st: SV(S, 'stun', 0.6) }, { t: 'lasergrid', dmg: 10 * P, n: 4, delay: 0.7 }], '{n} 대방전|바다 감전 사고', '바다 전체에 전기가 흐른다. 번개와 전기선이 사방에서'),
}, { st: 'stun', style: 'beamer', passive: 'thorns', title: '찌릿찌릿|투명 공포' });

wfam('fish', 'water', '물고기 붕어 잉어 연어 참치 고등어 꽁치 금붕어 피라냐 송사리 멸치 갈치 광어 우럭 복어 메기 장어 날치 개복치 청어 대구 명태 동태 황태 생선', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 230, size: 2, bounce: 1, st: SX(S, 0.5) }], '{n} 던지기|싱싱한 {n}', '팔딱거리는 {n을} 던진다. 비린내 주의'),
  s1: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 7 * P, n: 6, speed: 220, len: 200, size: 5, kb: 4, st: SV(S, 'slip', 0.8) }], '{n} 떼 회귀|{n} 대이동', '{n} 떼가 강물처럼 우르르 헤엄쳐 지나간다'),
  s2: wm('spikering', (P, S) => [{ t: 'spikering', dmg: 10 * P, r: 30, n: 10, at: 'self', kb: 6, st: SV(S, 'poison', 1.2) }], '{n} 가시 부풀리기|빵빵 {n}', '몸을 빵빵하게 부풀려 가시를 사방으로 세운다'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 11 * P, n: 9, step: 20, r: 12, st: SV(S, 'slip', 1) }, { t: 'zone', dmg: 2 * P, r: 40, dur: 3, at: 'target', st: { k: 'slip', d: 1 } }], '{n}의 비|하늘에서 {n} 폭우', '하늘에서 {n이} 비처럼 쏟아진다. 바닥이 미끌미끌'),
}, { st: 'slip', style: 'artillery', title: '비린내 주의|횟집 탈출범', passive: 'swift' });

wfam('turtle', 'water', '거북이 거북 자라 바다거북 육지거북 늑대거북 닌자거북 등껍질', {
  basic: wm('roll', (P, S) => [{ t: 'roll', dmg: 8 * P, size: 6, speed: 150, life: 1.4, bounce: 2, kb: 5, st: SX(S, 0.5) }], '{n} 등껍질 슛|등딱지 미끄럼', '{n} 등껍질을 발로 차서 미끄러뜨린다'),
  s1: wm('buff', () => [{ t: 'buff', k: 'armor', d: 4 }, { t: 'buff', k: 'counter', d: 1.5 }, { t: 'heal', amt: 10 }], '{n} 등딱지 숨기|안 나갈 거야', '등껍질에 쏙 숨는다. 때리면 튕겨 낸다'),
  s2: wm('roll', (P, S) => [{ t: 'roll', dmg: 14 * P, size: 10, speed: 190, life: 2.4, bounce: 4, kb: 8, st: SV(S, 'stun', 0.8) }], '{n} 팽이 돌진|등껍질 볼링', '등껍질에 들어가서 벽에 튕기며 맵을 휩쓴다'),
  ult: wm('stomp', (P, S) => [{ t: 'buff', k: 'giant', d: 4 }, { t: 'stomp', dmg: 14 * P, n: 3, r: 30, kb: 8, st: SV(S, 'heavy', 1.5) }], '천년 {n}의 분노|느리지만 확실하게', '천 년 묵은 {n이} 거대해져서 쿵 쿵 쿵 발을 구른다'),
}, { st: 'heavy', style: 'tank', passive: 'armor', stats: { hp: 25, speed: 0.85 }, title: '느림의 미학|천년 장수', look: { body: '#4a7a3a', outfit: 'armor' } });

wfam('shell', 'water', '조개 진주 소라 전복 굴 가리비 홍합 바지락 성게 불가사리 해삼 산호 해마', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 20, speed: 200, size: 2, st: SX(S, 0.5) }], '{n} 진주탄|{n} 튕기기', '{n} 속에서 진주를 퉁퉁 쏜다'),
  s1: wm('spikering', (P, S) => [{ t: 'spikering', dmg: 10 * P, r: 34, n: 12, at: 'target', kb: 5, st: SV(S, 'poison', 1) }], '{n} 가시밭|가시 폭탄', '적 주위에 {n} 가시가 동그랗게 솟는다'),
  s2: wm('bubble', (P) => [{ t: 'bubble', dmg: 4 * P, n: 2, speed: 110, size: 3, d: 1.1 }], '{n} 방울 감옥|보글보글', '{n}에서 나온 방울이 적을 가둔다'),
  ult: wm('spiral', (P, S) => [{ t: 'spiral', dmg: 6 * P, n: 22, speed: 200, st: SX(S, 0.8) }, { t: 'heal', amt: 20 }], '{n} 진주 폭풍|보물 대방출', '{n} 껍데기를 열자 진주가 나선으로 쏟아진다'),
}, { st: 'poison', style: 'trickster', passive: 'thorns', title: '바닷속 보물|가시 주의' });

/* ===== 땅 짐승 ===== */
wfam('dog', 'animal', '강아지 !개 멍멍이 댕댕이 시바견 진돗개 푸들 치와와 리트리버 불독 허스키 웰시코기 코기 비숑 말티즈 포메라니안 포메 퍼그 셰퍼드 도베르만 닥스훈트 비글 삽살개 똥개 멍뭉이 백구 누렁이', {
  basic: wm('bite', (P, S) => [{ t: 'bite', dmg: 7 * P, r: 11, range: 32, kb: 2, st: SX(S, 0.5) }], '{n} 앙|{n} 깨물기', '{n이} 앙 하고 깨문다'),
  s1: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 6 * P, n: 3, len: 110, arc: 70, kb: 4, st: SV(S, 'stun', 0.6) }], '{n} 짖기|멍멍멍!!', '멍! 멍! 멍! 짖는 소리가 부채꼴로 퍼진다'),
  s2: wm('dash', (P) => [{ t: 'dash', dist: 110, dmg: 9 * P, kb: 6 }, { t: 'buff', k: 'haste', d: 3 }], '{n} 산책 가자|꼬리 프로펠러', '산책 소리에 신나서 미친 듯이 뛰어간다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 10 * P, n: 7, speed: 230, len: 240, size: 7, kb: 7, st: SV(S, 'stun', 0.8) }, { t: 'sonic', dmg: 4 * P, n: 2, len: 120, arc: 90 }], '{n} 대방출|동네 {n} 총출동', '동네 {n} 일곱 마리가 짖으며 우르르 달려온다'),
}, { st: 'stun', style: 'summoner', passive: 'swift', title: '산책 중독|꼬리 프로펠러|댕댕 대장', look: { head: 'ears' } });

wfam('cat', 'animal', '고양이 냥이 야옹이 냥냥이 길고양이 페르시안 먼치킨 코숏 삼색이 치즈냥 고영희 턱시도냥 검은고양이 아기고양이 새끼고양이 러시안블루 스핑크스 뚱냥이 냐옹', {
  basic: wm('claw', (P, S) => [{ t: 'claw', dmg: 4 * P, r: 22, kb: 1, st: SX(S, 0.4) }], '{n} 냥냥펀치|{n} 할퀴기', '{n} 발톱으로 박박 할퀸다'),
  s1: wm('leap', (P, S) => [{ t: 'leap', dmg: 12 * P, r: 20, dist: 120, kb: 5, st: SV(S, 'vuln', 1) }], '{n} 덮치기|사냥 본능', '엉덩이를 씰룩씰룩하다가 한 번에 덮친다'),
  s2: wm('lob', (P, S) => [{ t: 'lob', dmg: 10 * P, r: 20, n: 1, kb: 4, st: SV(S, 'slow', 1.2) }], '{n} 헤어볼|우웩 털뭉치', '목에 걸린 털뭉치를 우웩 뱉어서 던진다'),
  ult: wm('flurry', (P, S) => [{ t: 'phantom', dmg: 12 * P, dist: 110 }, { t: 'flurry', dmg: 4 * P, r: 28, off: 0, dur: 0.9, ticks: 9, st: SV(S, 'confuse', 1) }], '{n} 냥냥 난무|우다다다다', '새벽 세 시의 우다다! 눈에 보이지도 않게 할퀸다'),
}, { st: 'confuse', style: 'assassin', passive: 'dodge', title: '집사 부리는 자|새벽의 우다다', look: { head: 'ears' } });

wfam('bigcat', 'animal', '호랑이 사자 표범 치타 재규어 퓨마 흑표범 백호 라이언 타이거 숫사자 암사자 스라소니 살쾡이 시베리아호랑이', {
  basic: wm('claw', (P, S) => [{ t: 'claw', dmg: 6 * P, r: 28, kb: 3, st: SV(S, 'vuln', 0.6) }], '{n} 앞발 할퀴기|{n} 발톱', '{n} 앞발로 세 줄을 쫙 긋는다'),
  s1: wm('leap', (P, S) => [{ t: 'leap', dmg: 16 * P, r: 24, dist: 140, kb: 7, st: SV(S, 'vuln', 1.2) }], '{n} 사냥|{n} 도약', '풀숲에서 튀어나와 한 번에 덮친다'),
  s2: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 6 * P, n: 2, len: 140, arc: 100, kb: 6, st: SV(S, 'stun', 0.9) }], '{n} 포효|어흥!!', '어흥!! 소리에 다들 얼어붙는다'),
  ult: wm('bite', (P, S) => [{ t: 'phantom', dmg: 12 * P, dist: 130 }, { t: 'bite', dmg: 30 * P, r: 26, range: 150, kb: 10, st: SV(S, 'stun', 1.2) }], '백수의 왕 {n}|{n} 목덜미 물기', '눈 깜짝할 사이에 다가가 목덜미를 콱'),
}, { st: 'vuln', style: 'brawler', passive: 'rage', title: '정글의 왕|백수의 왕', look: { head: 'ears', body: '#d08a2a', outfit: 'stripes' } });

wfam('bear', 'animal', '!곰 곰돌이 북극곰 불곰 반달곰 그리즐리 테디베어 곰인형 회색곰 레서판다 푸바오', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 9 * P, r: 22, arc: 120, kb: 6, st: SX(S, 0.5) }], '{n} 앞발 후리기|{n} 솥뚜껑 손', '{n} 앞발로 크게 후려친다'),
  s1: wm('grab', (P, S) => [{ t: 'grab', dmg: 12 * P, r: 16, range: 140, delay: 0.4, kb: 7, st: SV(S, 'root', 1) }], '{n} 곰 포옹|꽉 안아 줄게', '뒤에서 꽉 끌어안고 내 앞으로 당긴다. 숨 막힘'),
  s2: wm('stomp', (P, S) => [{ t: 'stomp', dmg: 9 * P, n: 2, r: 26, kb: 7, st: SV(S, 'heavy', 1) }], '{n} 발 구르기|쿵쿵', '두 발로 쿵 쿵 구른다'),
  ult: wm('leap', (P, S) => [{ t: 'buff', k: 'giant', d: 4 }, { t: 'leap', dmg: 34 * P, r: 44, dist: 130, kb: 10, st: SV(S, 'stun', 1.4) }, { t: 'heal', amt: 15 }], '{n} 바디슬램|겨울잠 깨운 죄', '겨울잠을 깨우면 이렇게 된다. 거대해져서 깔아뭉갠다'),
}, { st: 'heavy', style: 'tank', passive: 'regen', stats: { hp: 20, speed: 0.92 }, title: '겨울잠 전문가|꿀 도둑', look: { head: 'ears', body: '#6a4a2a' } });

wfam('wolf', 'animal', '늑대 늑대인간 웨어울프 여우 코요테 하이에나 승냥이 들개 구미호 북극여우 사막여우', {
  basic: wm('bite', (P, S) => [{ t: 'bite', dmg: 8 * P, r: 12, range: 36, kb: 2, st: SV(S, 'vuln', 0.6) }], '{n} 물어뜯기|{n} 송곳니', '{n} 송곳니로 물어뜯는다'),
  s1: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 2, len: 150, arc: 140, kb: 2, st: SV(S, 'weak', 2) }, { t: 'buff', k: 'power', d: 3 }], '{n} 하울링|아우우우', '보름달 보고 아우우! 적은 겁먹고 나는 세진다'),
  s2: wm('phantom', (P, S) => [{ t: 'phantom', dmg: 14 * P, dist: 120, st: SX(S, 1) }], '{n} 그림자 질주|스쳐 물기', '그림자처럼 스쳐 지나가며 물어뜯는다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 11 * P, n: 6, speed: 240, len: 240, size: 7, kb: 7, st: SV(S, 'vuln', 1.4) }, { t: 'buff', k: 'haste', d: 4 }], '{n} 무리 사냥|보름달 대습격', '{n} 무리가 한꺼번에 덮친다'),
}, { st: 'vuln', style: 'assassin', passive: 'lifesteal', title: '보름달 사냥꾼|외로운 늑대', look: { head: 'ears', body: '#5a5a6a' } });

wfam('snake', 'poison', '!뱀 코브라 아나콘다 비단뱀 독사 살무사 방울뱀 구렁이 킹코브라 블랙맘바 바실리스크 이무기', {
  basic: wm('bite', (P, S) => [{ t: 'bite', dmg: 6 * P, r: 10, range: 40, kb: 1, st: SV(S, 'poison', 1.2) }], '{n} 독니|{n} 콕', '{n} 독니로 콕 문다'),
  s1: wm('whip', (P, S) => [{ t: 'whip', dmg: 10 * P, len: 70, kb: 5, st: SV(S, 'slow', 1) }], '{n} 꼬리 채찍|쉭쉭 휘두르기', '긴 몸통을 채찍처럼 휘두른다'),
  s2: wm('ring', (P, S) => [{ t: 'ring', dmg: 5 * P, r: 26, dur: 3, at: 'target', st: SV(S, 'root', 1) }], '{n} 똬리 틀기|{n} 휘감기', '적 주위에 {n이} 똬리를 튼다. 빠져나가면 꽉 조인다'),
  ult: wm('bite', (P, S) => [{ t: 'grab', dmg: 14 * P, r: 18, range: 180, delay: 0.35, kb: 6, st: { k: 'root', d: 1 } }, { t: 'bite', dmg: 22 * P, r: 22, range: 60, kb: 6, st: SV(S, 'poison', 2) }], '{n} 통째로 삼키기|꿀꺽', '바닥에서 솟아 휘감고 통째로 삼키려 든다'),
}, { st: 'poison', style: 'polluter', passive: 'dodge', title: '쉭쉭 독설가|똬리 장인', look: { body: '#3a7a3a' } });

wfam('frog', 'animal', '개구리 두꺼비 청개구리 올챙이 황소개구리 도롱뇽 카멜레온 이구아나 도마뱀 게코', {
  basic: wm('hook', (P, S) => [{ t: 'hook', dmg: 6 * P, speed: 300, range: 120, st: SX(S, 0.5) }], '{n} 혀 낚시|날름', '긴 혀를 날름 뻗어 적을 끌어온다'),
  s1: wm('hop', (P, S) => [{ t: 'hop', dmg: 9 * P, n: 3, r: 18, size: 7, kb: 5, st: SV(S, 'slow', 0.8) }], '{n} 폴짝폴짝|{n} 점프 공격', '거대한 {n이} 폴짝폴짝 뛰어가며 깔아뭉갠다'),
  s2: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 3, len: 100, arc: 120, st: SV(S, 'sleep', 0.8) }], '{n} 개굴송|개굴개굴', '개굴개굴 울음소리에 잠이 쏟아진다'),
  ult: wm('leap', (P, S) => [{ t: 'leap', dmg: 22 * P, r: 34, dist: 150, kb: 8 }, { t: 'all', dmg: 4 * P, st: SV(S, 'morph', 1.5) }], '전원 {n}화|개구리 왕자', '높이 뛰어 착지하는 순간 모두가 {n으로} 변한다'),
}, { st: 'slow', style: 'trickster', passive: 'swift', title: '우물 안 탈출|폴짝 장인' });

wfam('rabbit', 'animal', '토끼 산토끼 집토끼 바니 래빗 아기토끼 토깽이 달토끼', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 4 * P, len: 34, w: 6, n: 2, kb: 4, st: SX(S, 0.4) }], '{n} 뒷발 차기|{n} 콩콩', '뒷발로 콩콩 찬다'),
  s1: wm('hop', (P, S) => [{ t: 'hop', dmg: 8 * P, n: 4, r: 16, size: 5, kb: 4, st: SX(S, 0.6) }], '{n} 깡총깡총|{n} 뛰기', '깡총깡총 뛰어다니며 찍어 누른다'),
  s2: wm('blink', () => [{ t: 'blink', to: 'random', dist: 100 }, { t: 'buff', k: 'haste', d: 3 }, { t: 'buff', k: 'invis', d: 1 }], '{n} 굴 파고 숨기|어디 갔지', '땅굴로 쏙 숨었다가 엉뚱한 데서 튀어나온다'),
  ult: wm('lob', (P, S) => [{ t: 'lob', dmg: 14 * P, r: 22, n: 4, kb: 5, st: SV(S, 'slip', 1.2) }, { t: 'buff', k: 'haste', d: 4 }], '{n} 당근 폭격|달나라 떡방아', '달나라에서 떡과 당근이 우수수 떨어진다'),
}, { st: 'slip', style: 'speedster', passive: 'dodge', title: '깡총 대장|달나라 이민자', look: { head: 'ears' } });

wfam('monkey', 'animal', '원숭이 고릴라 침팬지 오랑우탄 킹콩 개코원숭이 긴팔원숭이 몽키 유인원', {
  basic: wm('lob', (P, S) => [{ t: 'lob', dmg: 6 * P, r: 12, n: 1, kb: 3, st: SV(S, 'slip', 0.6) }], '{n} 바나나 투척|바나나 껍질', '먹다 남은 바나나를 던진다. 밟으면 미끄러짐'),
  s1: wm('stomp', (P, S) => [{ t: 'stomp', dmg: 8 * P, n: 3, r: 22, kb: 6, st: SV(S, 'stun', 0.5) }, { t: 'buff', k: 'power', d: 3 }], '{n} 가슴 두드리기|우가우가', '가슴을 쿵쿵 치며 땅을 구른다'),
  s2: wm('leap', (P, S) => [{ t: 'leap', dmg: 14 * P, r: 24, dist: 130, kb: 7, st: SX(S, 1) }], '{n} 나무 타기 점프|우끼끼', '보이지 않는 나무를 타고 날아와 내려찍는다'),
  ult: wm('meteor', (P, S) => [{ t: 'buff', k: 'giant', d: 4 }, { t: 'meteor', dmg: 30 * P, r: 44, kb: 10, st: SV(S, 'stun', 1.3) }, { t: 'lob', dmg: 8 * P, r: 14, n: 4 }], '킹 {n} 대폭주|빌딩 꼭대기에서', '거대해진 {n이} 빌딩에서 뛰어내리며 바나나를 뿌린다'),
}, { st: 'slip', style: 'brawler', passive: 'rage', title: '정글 깡패|바나나 중독', look: { body: '#5a3a2a' } });

wfam('elephant', 'animal', '코끼리 코뿔소 !하마 매머드 들소 버팔로 물소 맘모스 아기코끼리 덤보', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 9 * P, len: 44, w: 10, n: 1, kb: 8, st: SX(S, 0.5) }], '{n} 뿔 찌르기|{n} 박치기', '{n} 머리로 냅다 들이받는다'),
  s1: wm('cone', (P, S) => [{ t: 'cone', dmg: 3 * P, len: 90, arc: 40, dur: 0.8, ticks: 5, kb: 5, st: SV(S, 'slip', 1) }], '{n} 코 물대포|뿌우우', '코로 물을 쏴서 밀어낸다'),
  s2: wm('stomp', (P, S) => [{ t: 'stomp', dmg: 12 * P, n: 3, r: 30, kb: 8, st: SV(S, 'heavy', 1.2) }], '{n} 발 구르기|지진 발생', '쿵! 쿵! 쿵! 땅이 흔들린다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 14 * P, n: 4, speed: 180, len: 260, size: 12, kb: 10, st: SV(S, 'stun', 1.2) }], '{n} 떼 대이동|사바나 대질주', '거대한 {n} 떼가 땅을 울리며 돌진한다'),
}, { st: 'heavy', style: 'tank', passive: 'armor', stats: { hp: 25, speed: 0.88, size: 1.15 }, title: '사바나 불도저|걸어 다니는 지진', look: { body: '#8a8a9a' } });

wfam('farm', 'animal', '!소 황소 젖소 송아지 돼지 꿀꿀이 아기돼지 멧돼지 아기양 염소 흑염소 당나귀 얼룩말 경주마 조랑말 백마 흑마 망아지 노새 라마 알파카 낙타', {
  basic: wm('dash', (P, S) => [{ t: 'dash', dist: 60, dmg: 8 * P, kb: 7, st: SX(S, 0.5) }], '{n} 박치기|{n} 들이받기', '{n이} 고개를 숙이고 들이받는다'),
  s1: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 3, spread: 20, speed: 200, size: 2, st: SV(S, 'slow', 1) }], '{n} 침 뱉기|퉤퉤퉤', '퉤! 퉤! 퉤! 침을 연사한다'),
  s2: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 5 * P, n: 2, len: 110, arc: 90, kb: 3, st: SV(S, 'confuse', 1) }], '{n} 울음소리|음매~ 꿀꿀~', '농장 울음소리 합창에 정신이 혼미해진다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 12 * P, n: 8, speed: 220, len: 260, size: 8, kb: 9, st: SV(S, 'stun', 1) }], '{n} 농장 대탈출|목장 폭주', '울타리가 터지고 {n} 여덟 마리가 미친 듯이 질주한다'),
}, { st: 'confuse', style: 'summoner', passive: 'regen', title: '목장 탈출범|농장 대장', look: { head: 'horns' } });

wfam('rodent', 'animal', '햄스터 !쥐 생쥐 다람쥐 기니피그 날다람쥐 시궁쥐 들쥐 미키 찍찍이 고슴도치 두더지 카피바라', {
  basic: wm('roll', (P, S) => [{ t: 'roll', dmg: 6 * P, size: 5, speed: 170, life: 1.3, bounce: 2, kb: 3, st: SX(S, 0.4) }], '{n} 쳇바퀴 굴리기|{n} 볼', '쳇바퀴 공에 들어가 데굴데굴 돌진한다'),
  s1: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 2 * P, r: 20, dur: 4, speed: 80, st: SV(S, 'slow', 0.6) }], '{n} 떼|찍찍 군단', '{n} 떼가 따라다니며 갉아먹는다'),
  s2: wm('crack', (P, S) => [{ t: 'crack', dmg: 11 * P, len: 160, speed: 200, r: 10, kb: 5, st: SV(S, 'air', 0.6) }], '{n} 땅굴 파기|두두두', '땅속으로 파고들어 가서 적 발밑에서 튀어나온다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 7 * P, n: 8, speed: 260, len: 260, size: 4, kb: 4, st: SV(S, 'weak', 1.2) }, { t: 'swarm', dmg: 2 * P, r: 24, dur: 5, speed: 90 }], '{n} 대왕국 습격|찍찍찍찍', '수백 마리 {n이} 바닥을 덮으며 몰려온다'),
}, { st: 'weak', style: 'summoner', passive: 'dodge', stats: { size: 0.88, speed: 1.08 }, title: '쳇바퀴 장인|볼주머니 부자', look: { head: 'ears' } });

wfam('kangaroo', 'animal', '캥거루 왈라비 쿼카 코알라', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 5 * P, len: 36, w: 7, n: 2, kb: 5, st: SX(S, 0.4) }], '{n} 원투 펀치|{n} 복싱', '권투 글러브 낀 앞발로 원투'),
  s1: wm('hop', (P, S) => [{ t: 'hop', dmg: 10 * P, n: 3, r: 20, size: 6, kb: 6, st: SX(S, 0.6) }], '{n} 점프 킥|퐁퐁 뛰기', '퐁퐁 뛰어가 착지할 때마다 걷어찬다'),
  ult: wm('leap', (P, S) => [{ t: 'leap', dmg: 28 * P, r: 32, dist: 150, kb: 10, st: SV(S, 'stun', 1.2) }, { t: 'launch', dmg: 10 * P, r: 18, off: 14, d: 1 }], '{n} 드롭킥|호주 대표 킥', '하늘 높이 뛰어 양발로 내리꽂는다'),
}, { st: 'stun', style: 'brawler', passive: 'swift', title: '호주 챔피언|주머니 복서' });

wfam('bird', 'wind', '!새 독수리 !매 참새 비둘기 까마귀 까치 앵무새 부엉이 올빼미 갈매기 펠리컨 백조 공작 공작새 타조 플라밍고 홍학 딱따구리 제비 박쥐 콘도르 벌새 큰부리새 카나리아', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 4 * P, len: 34, w: 4, n: 3, kb: 1, st: SX(S, 0.4) }], '{n} 쪼기|{n} 부리 연타', '부리로 콕콕콕 쪼아 댄다'),
  s1: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 2 * P, r: 22, dur: 4, speed: 100, st: SV(S, 'confuse', 0.6) }], '{n} 떼 공습|{n} 떼', '{n} 떼가 머리 위를 빙빙 돌며 쪼아 댄다'),
  s2: wm('gust', (P, S) => [{ t: 'gust', dmg: 4 * P, len: 80, arc: 80, kb: 10, st: SX(S, 0.5) }, { t: 'buff', k: 'fly', d: 2 }], '{n} 날갯짓|훨훨 날기', '날개를 퍼덕여 날려 버리고 하늘로 뜬다'),
  ult: wm('skyline', (P, S) => [{ t: 'buff', k: 'fly', d: 3 }, { t: 'skyline', dmg: 12 * P, n: 8, step: 20, r: 12, st: SV(S, 'confuse', 1) }, { t: 'meteor', dmg: 20 * P, r: 30, kb: 8 }], '{n} 급강하 폭격|하늘의 제왕', '하늘에서 일렬로 급강하하고 마지막에 쾅'),
}, { st: 'confuse', style: 'flyer', passive: 'swift', title: '하늘의 제왕|비둘기 협회장', look: { aura: 'wind' } });

wfam('chicken', 'animal', '!닭 꼬꼬 병아리 암탉 수탉 삐약이 꼬꼬댁 오골계 칠면조 !오리 거위 청둥오리 오리너구리', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 4 * P, len: 30, w: 5, n: 3, kb: 1, st: SX(S, 0.4) }], '{n} 쪼기|꼬꼬 콕콕', '부리로 정수리를 콕콕콕'),
  s1: wm('lob', (P, S) => [{ t: 'lob', dmg: 8 * P, r: 16, n: 3, kb: 3, st: SV(S, 'slip', 1) }], '{n} 알 폭격|계란 투척', '알을 낳자마자 던진다. 터지면 미끌미끌'),
  s2: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 3, len: 130, arc: 100, st: SV(S, 'confuse', 1) }], '{n} 새벽 기상|꼬끼오!!!', '새벽 다섯 시의 꼬끼오! 다들 정신이 나간다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 9 * P, n: 8, speed: 210, len: 240, size: 5, kb: 6, st: SV(S, 'confuse', 1.2) }, { t: 'lob', dmg: 6 * P, r: 14, n: 4 }], '{n} 양계장 탈출|꼬꼬 대행진', '양계장 문이 열렸다! {n} 떼가 알을 뿌리며 질주'),
}, { st: 'confuse', style: 'summoner', passive: 'revive', title: '양계장 탈출범|새벽 알람', look: { body: '#f6f0e0', hair: '#ff4d4d' } });

wfam('penguin', 'ice', '펭귄 황제펭귄 아기펭귄 물개 바다표범 바다사자 해달 수달 북극곰가족', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 7 * P, r: 18, arc: 140, kb: 4, st: SX(S, 0.5) }], '{n} 날개 찰싹|{n} 뒤뚱 펀치', '짧은 날개로 찰싹 때린다'),
  s1: wm('dash', (P, S) => [{ t: 'dash', dist: 130, dmg: 11 * P, kb: 7, invuln: true }, { t: 'zone', dmg: 2 * P, r: 22, dur: 3, at: 'self', st: SV(S, 'slip', 1) }], '{n} 배 미끄럼|쭈욱~', '배를 깔고 얼음 위를 쭈욱 미끄러진다'),
  s2: wm('roll', (P, S) => [{ t: 'roll', dmg: 12 * P, size: 9, speed: 150, life: 2, bounce: 2, kb: 7, st: SV(S, 'freeze', 1) }], '{n} 눈덩이 굴리기|거대 눈뭉치', '눈덩이를 굴려 보낸다. 굴러갈수록 커진다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 10 * P, n: 8, speed: 190, len: 240, size: 6, kb: 7, st: SV(S, 'freeze', 1.2) }, { t: 'zone', dmg: 2 * P, r: 50, dur: 4, at: 'target', st: { k: 'slip', d: 1 } }], '남극 {n} 대행진|{n} 미끄럼 군단', '{n} 떼가 배를 깔고 우르르 미끄러져 온다'),
}, { st: 'slip', style: 'speedster', passive: 'armor', title: '남극 신사|뒤뚱 장인', look: { body: '#1a1a2a', outfit: 'suit' } });

wfam('deer', 'animal', '사슴 순록 루돌프 고라니 노루 엘크 무스 영양 가젤 기린 산양', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 8 * P, len: 40, w: 8, n: 1, kb: 6, st: SX(S, 0.5) }], '{n} 뿔치기|{n} 박치기', '{n} 뿔로 들이받는다'),
  s1: wm('dash', (P) => [{ t: 'dash', dist: 120, dmg: 10 * P, kb: 8, invuln: true }], '{n} 질주|도망가는 척 박치기', '휙 도망가는 척하다가 돌아서 들이받는다'),
  s2: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 2, len: 110, arc: 90, st: SV(S, 'confuse', 1.2) }], '{n} 비명|으아아악', '고라니 특유의 비명. 듣는 사람이 더 놀란다'),
  ult: wm('skyline', (P, S) => [{ t: 'buff', k: 'fly', d: 3 }, { t: 'skyline', dmg: 12 * P, n: 8, step: 20, r: 12, st: SV(S, 'stun', 0.8) }], '{n} 썰매 공습|빨간 코 폭격', '하늘을 날며 선물 상자를 줄줄이 떨어뜨린다'),
}, { st: 'confuse', style: 'speedster', passive: 'swift', title: '숲속 질주자|빨간 코', look: { head: 'horns' } });

/* ===== 벌레 ===== */
wfam('bee', 'bug', '!벌 꿀벌 말벌 장수말벌 땅벌 호박벌 여왕벌 일벌 벌떼 벌집 꿀', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 5 * P, len: 34, w: 4, n: 1, kb: 1, st: SV(S, 'poison', 0.8) }], '{n} 침|따끔', '{n} 침으로 따끔하게 쏜다'),
  s1: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 3 * P, r: 22, dur: 4.5, speed: 95, st: SV(S, 'poison', 0.8) }], '{n} 떼 출동|윙윙 공습', '윙윙윙! {n} 떼가 끝까지 쫓아가서 쏜다'),
  s2: wm('zone', (P) => [{ t: 'zone', dmg: 0, r: 30, dur: 4, at: 'self', heal: 3, st: { k: 'slow', d: 1 } }], '{n} 꿀 바르기|끈적끈적 꿀', '바닥에 꿀을 바른다. 나는 회복, 적은 끈적'),
  ult: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 4 * P, r: 30, dur: 6, speed: 110, st: SV(S, 'poison', 1.2) }, { t: 'missiles', dmg: 6 * P, n: 8, speed: 220 }], '{n}집 건드린 죄|{n} 대폭발', '벌집을 걷어찼다. 수천 마리가 미사일처럼 날아온다'),
}, { st: 'poison', style: 'summoner', passive: 'thorns', title: '윙윙 공포|여왕님 경호원', look: { outfit: 'stripes', body: '#e8b020', hair: '#1a1a1a' } });

wfam('mosquito', 'bug', '모기 각다귀 진드기 벼룩 빈대 흡혈충', {
  basic: wm('drain', (P) => [{ t: 'thrust', dmg: 4 * P, len: 36, w: 3, n: 2, kb: 0 }], '{n} 쪽쪽|{n} 주둥이', '가는 주둥이로 쪽쪽 찌른다'),
  s1: wm('drain', (P, S) => [{ t: 'drain', dmg: 3 * P, range: 120, dur: 2, ticks: 7, heal: 3, st: SV(S, 'weak', 0.6) }], '{n} 피 빨기|쪼옥', '빨대를 꽂고 피를 쪼옥 빨아 간다. 가렵다'),
  s2: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 2 * P, r: 18, dur: 5, speed: 90, st: SV(S, 'confuse', 0.6) }], '앵앵 {n} 떼|불 끄면 시작', '불 끄면 시작되는 앵앵 소리. 끝까지 따라온다'),
  ult: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 3 * P, r: 32, dur: 6, speed: 100, st: SV(S, 'weak', 1.2) }, { t: 'drain', dmg: 3 * P, range: 160, dur: 2.4, ticks: 8, heal: 4 }], '여름밤 {n} 대습격|헌혈 강요', '여름밤의 악몽. 모두 물리고 나는 배가 부르다'),
}, { st: 'weak', style: 'assassin', passive: 'lifesteal', stats: { size: 0.85 }, title: '여름밤의 악몽|무료 헌혈 센터' });

wfam('ant', 'bug', '개미 일개미 병정개미 여왕개미 불개미 개미떼 흰개미 개미굴', {
  basic: wm('bite', (P, S) => [{ t: 'bite', dmg: 6 * P, r: 9, range: 28, kb: 1, st: SX(S, 0.4) }], '{n} 큰턱|{n} 깨물기', '작지만 힘센 큰턱으로 깨문다'),
  s1: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 6 * P, n: 8, speed: 170, len: 220, size: 3, kb: 3, st: SV(S, 'weak', 0.8) }], '{n} 행렬|일렬종대 돌격', '{n} 행렬이 줄 맞춰서 밟고 지나간다'),
  s2: wm('beacon', (P, S) => [{ t: 'beacon', dmg: 4 * P, r: 32, rate: 0.8, dur: 6, kb: 3, st: SV(S, 'slow', 0.8) }], '{n}굴 설치|{n} 본부', '{n}굴을 지으면 계속 일꾼이 쏟아져 나온다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 8 * P, n: 8, speed: 200, len: 260, size: 4, kb: 5, st: SV(S, 'heavy', 1.2) }, { t: 'swarm', dmg: 3 * P, r: 28, dur: 5, speed: 80 }], '{n} 제국의 역습|백만 대군', '땅이 새까맣게 덮인다. 백만 마리가 몰려온다'),
}, { st: 'weak', style: 'summoner', passive: 'armor', stats: { size: 0.85 }, title: '개미 제국 장군|일개미 반장' });

wfam('spider', 'bug', '거미 독거미 타란튤라 블랙위도우 거미줄 거미인간 왕거미', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 230, size: 2, st: SV(S, 'slow', 0.8) }], '{n}줄 발사|찍찍 거미줄', '손목에서 {n}줄을 찍 쏜다'),
  s1: wm('net', (P) => [{ t: 'net', dmg: 6 * P, speed: 240, range: 160, r: 18, d: 2 }], '{n}줄 그물|꽁꽁 묶기', '커다란 {n}줄 그물을 던져 꽁꽁 묶는다'),
  s2: wm('hook', (P, S) => [{ t: 'hook', dmg: 8 * P, speed: 320, range: 170, st: SX(S, 0.6) }, { t: 'bite', dmg: 10 * P, r: 12, range: 30, kb: 2, st: SV(S, 'poison', 1.2) }], '{n} 줄 당기기|끌고 와서 콱', '줄로 끌어당긴 다음 독니로 콱'),
  ult: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 14 * P, n: 6, delay: 0.7, kb: 2, st: SV(S, 'root', 1.4) }], '{n}줄 감옥|거대 거미줄', '적 주변에 거미줄이 바둑판처럼 쳐지고 한 번에 조인다'),
}, { st: 'slow', style: 'trickster', passive: 'dodge', title: '줄타기 장인|천장의 주인' });

wfam('cockroach', 'gross', '바퀴벌레 날바퀴 돈벌레 그리마 노래기 지네 쥐며느리 콩벌레 공벌레', {
  basic: wm('dash', (P, S) => [{ t: 'dash', dist: 70, dmg: 6 * P, kb: 4, invuln: true, st: SX(S, 0.4) }], '{n} 사사삭|{n} 질주', '사사사삭! 미친 속도로 달려와 부딪힌다'),
  s1: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 7 * P, n: 6, speed: 260, len: 220, size: 4, kb: 3, st: SV(S, 'confuse', 1) }], '{n} 가족 출동|하나 보이면 백 마리', '하나 보이면 백 마리. 사방에서 쏟아져 나온다'),
  s2: wm('buff', () => [{ t: 'buff', k: 'fly', d: 2.5 }, { t: 'buff', k: 'haste', d: 3 }, { t: 'heal', amt: 12 }], '{n} 날기|얼굴로 날아오기', '갑자기 날아서 얼굴 쪽으로 온다. 최악의 공포'),
  ult: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 4 * P, r: 30, dur: 6, speed: 110, st: SV(S, 'confuse', 1.4) }, { t: 'stampede', dmg: 8 * P, n: 8, speed: 260, len: 260, size: 4, kb: 4 }], '{n} 대탈출|불 켜자 사방에서', '불을 켰더니… 바닥 전체가 움직인다'),
}, { st: 'confuse', style: 'speedster', passive: 'revive', title: '핵전쟁 생존자|불 켜면 도망', look: { body: '#4a2a1a' } });

wfam('butterfly', 'bug', '나비 나방 호랑나비 부전나비 누에 애벌레 번데기 송충이 잠자리 반딧불이 반딧불', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 4 * P, n: 3, spread: 30, speed: 160, size: 1, homing: 0.4, st: SV(S, 'sleep', 0.4) }], '{n} 날개 가루|{n} 팔랑팔랑', '날개 가루가 팔랑팔랑 흩날린다'),
  s1: wm('spiral', (P, S) => [{ t: 'spiral', dmg: 4 * P, n: 14, speed: 150, st: SV(S, 'sleep', 0.6) }], '{n} 날갯짓 회오리|인분 폭풍', '빙글빙글 날며 반짝 가루를 흩뿌린다'),
  s2: wm('net', (P) => [{ t: 'net', dmg: 4 * P, speed: 200, range: 140, r: 16, d: 2 }], '{n} 고치 감옥|실 뿜기', '실을 뿜어 고치 안에 가둔다'),
  ult: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 3 * P, r: 34, dur: 5, speed: 70, st: SV(S, 'sleep', 1.2) }, { t: 'prism', dmg: 4 * P, len: 160, w: 4, spread: 30, ticks: 2, dur: 0.5 }], '{n} 대변신|우화 대폭발', '고치가 터지며 수천 마리가 반짝이며 날아오른다'),
}, { st: 'sleep', style: 'idol', passive: 'dodge', title: '팔랑팔랑 요정|변신의 귀재', look: { aura: 'star' } });

wfam('mantis', 'bug', '사마귀 전갈 메뚜기 귀뚜라미 여치 방아깨비 장수풍뎅이 사슴벌레 풍뎅이 무당벌레 쇠똥구리 소금쟁이', {
  basic: wm('claw', (P, S) => [{ t: 'claw', dmg: 5 * P, r: 26, kb: 2, st: SX(S, 0.5) }], '{n} 낫 베기|{n} 앞다리', '낫처럼 생긴 앞다리로 슥슥 벤다'),
  s1: wm('hop', (P, S) => [{ t: 'hop', dmg: 9 * P, n: 3, r: 18, size: 5, kb: 5, st: SX(S, 0.6) }], '{n} 메뚜기 뛰기|폴짝 돌격', '폴짝 폴짝 뛰어 머리 위로 떨어진다'),
  s2: wm('whip', (P, S) => [{ t: 'whip', dmg: 10 * P, len: 60, kb: 5, st: SV(S, 'poison', 1.4) }], '{n} 꼬리 독침|휘어 찌르기', '휘어진 꼬리로 독침을 내리꽂는다'),
  ult: wm('roll', (P, S) => [{ t: 'roll', dmg: 22 * P, size: 13, speed: 120, life: 3, bounce: 3, kb: 10, st: SV(S, 'heavy', 1.4) }, { t: 'flurry', dmg: 4 * P, r: 26, off: 18, dur: 0.6, ticks: 6 }], '{n} 쇠똥 굴리기|곤충왕 결정전', '거대한 똥공을 굴리고 낫으로 마구 베어 버린다'),
}, { st: 'vuln', style: 'assassin', passive: 'armor', title: '곤충왕|풀숲의 무사' });

wfam('worm', 'gross', '지렁이 구더기 거머리 기생충 회충 촌충 민달팽이 달팽이 굼벵이', {
  basic: wm('whip', (P, S) => [{ t: 'whip', dmg: 6 * P, len: 50, kb: 2, st: SV(S, 'slow', 0.6) }], '{n} 꿈틀 채찍|{n} 휘두르기', '꿈틀꿈틀 몸을 휘둘러 찰싹'),
  s1: wm('crack', (P, S) => [{ t: 'crack', dmg: 10 * P, len: 150, speed: 160, r: 10, kb: 4, st: SV(S, 'slow', 1) }], '{n} 땅속 이동|꿈틀꿈틀 굴', '땅속으로 파고들어 가서 적 밑에서 꿈틀'),
  s2: wm('zone', (P, S) => [{ t: 'zone', dmg: 2 * P, r: 28, dur: 5, at: 'front', off: 30, st: SV(S, 'slip', 1) }], '{n} 점액|끈적한 길', '지나간 자리에 끈적한 점액을 남긴다'),
  ult: wm('drain', (P, S) => [{ t: 'grab', dmg: 12 * P, r: 18, range: 180, delay: 0.4, kb: 6, st: { k: 'root', d: 1 } }, { t: 'drain', dmg: 4 * P, range: 140, dur: 2.4, ticks: 8, heal: 4, st: SV(S, 'weak', 1) }], '{n} 쪽쪽 흡입|붙으면 안 떨어짐', '땅에서 솟아 달라붙고 쪽쪽 빨아먹는다'),
}, { st: 'slow', style: 'polluter', passive: 'regen', title: '꿈틀이 대장|비 오는 날의 주인' });

/* ===== 전설·괴물 ===== */
wfam('dragon', 'fire', '!용 드래곤 와이번 히드라 리바이어던 황룡 청룡 흑룡 백룡 레드드래곤 아기용 해츨링 불도마뱀 바하무트 용왕', {
  basic: wm('cone', (P, S) => [{ t: 'cone', dmg: 3 * P, len: 70, arc: 40, dur: 0.5, ticks: 3, kb: 1, st: SV(S, 'burn', 0.6) }], '{n} 입김|{n} 브레스', '{n} 입에서 뜨거운 숨결이 뿜어진다'),
  s1: wm('bite', (P, S) => [{ t: 'bite', dmg: 14 * P, r: 18, range: 50, kb: 6, st: SV(S, 'burn', 1) }], '{n} 아가리|{n} 물기', '거대한 아가리로 콱 문다'),
  s2: wm('gust', (P, S) => [{ t: 'buff', k: 'fly', d: 3 }, { t: 'gust', dmg: 5 * P, len: 90, arc: 100, kb: 10, st: SX(S, 0.6) }], '{n} 날갯짓|하늘로 비상', '거대한 날개로 날아오르며 모두 날려 버린다'),
  ult: wm('cone', (P, S) => [{ t: 'cone', dmg: 7 * P, len: 120, arc: 60, dur: 1.4, ticks: 8, kb: 3, st: SV(S, 'burn', 2) }, { t: 'meteor', dmg: 22 * P, r: 36, kb: 8 }], '{n} 멸망의 브레스|대지를 태워라', '하늘을 가르는 {n} 브레스. 끝에는 화염 운석까지'),
}, { st: 'burn', style: 'bomber', passive: 'armor', stats: { hp: 15, size: 1.12 }, title: '하늘의 지배자|보물 수집가', look: { head: 'horns', aura: 'flame', cape: true } });

wfam('dino', 'earth', '공룡 티라노 티라노사우루스 티렉스 랩터 벨로시랩터 트리케라톱스 브라키오사우루스 스테고사우루스 프테라노돈 안킬로사우루스 스피노사우루스 둘리 쥬라기', {
  basic: wm('bite', (P, S) => [{ t: 'bite', dmg: 10 * P, r: 14, range: 36, kb: 5, st: SV(S, 'vuln', 0.8) }], '{n} 콱|짧은 팔 대신 이빨', '팔이 짧아서 이빨로 해결한다'),
  s1: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 6 * P, n: 2, len: 150, arc: 110, kb: 6, st: SV(S, 'stun', 0.9) }], '{n} 포효|크아아앙', '쥬라기 시대급 포효. 화면이 흔들린다'),
  s2: wm('stomp', (P, S) => [{ t: 'stomp', dmg: 10 * P, n: 3, r: 28, kb: 8, st: SV(S, 'heavy', 1) }], '{n} 발자국|쿵 쿵 쿵', '쿵… 쿵… 쿵… 컵의 물이 흔들린다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 14 * P, n: 5, speed: 200, len: 270, size: 12, kb: 10, st: SV(S, 'stun', 1.2) }, { t: 'meteor', dmg: 20 * P, r: 40, kb: 8 }], '{n} 대멸종|쥬라기 대질주', '{n} 떼가 질주하고 하늘에서는 운석이 떨어진다'),
}, { st: 'heavy', style: 'brawler', passive: 'rage', stats: { hp: 15, size: 1.12 }, title: '쥬라기 생존자|짧은 팔 협회장', look: { body: '#4a7a3a', head: 'spiky' } });

wfam('zombie', 'ghost', '좀비 구울 시체 강시 언데드 해골 스켈레톤 리치 미라 머미', {
  basic: wm('bite', (P, S) => [{ t: 'bite', dmg: 7 * P, r: 11, range: 30, kb: 1, st: SV(S, 'slow', 0.8) }], '{n} 물기|으어어 콱', '으어어… 하면서 느릿느릿 문다'),
  s1: wm('grab', (P, S) => [{ t: 'grab', dmg: 12 * P, r: 16, range: 180, delay: 0.5, kb: 6, st: SV(S, 'root', 1) }], '땅에서 {n} 손|무덤에서 쑥', '땅에서 썩은 손이 쑥 올라와 발목을 잡는다'),
  s2: wm('whip', (P, S) => [{ t: 'whip', dmg: 9 * P, len: 64, kb: 3, st: SV(S, 'slow', 1) }], '{n} 붕대 채찍|풀린 붕대', '몸에 감긴 붕대를 풀어 휘두른다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 9 * P, n: 8, speed: 110, len: 220, size: 6, kb: 4, st: SV(S, 'weak', 1.5) }, { t: 'grab', dmg: 10 * P, r: 20, range: 220, delay: 0.6, kb: 5 }, { t: 'heal', amt: 15 }], '{n} 아포칼립스|좀비 떼 습격', '느릿느릿… 하지만 끝없이 몰려오는 {n} 떼'),
}, { st: 'slow', style: 'summoner', passive: 'revive', stats: { speed: 0.9, hp: 10 }, title: '안 죽는 녀석|뇌 미식가', look: { body: '#6a8a5a' } });

wfam('vampire', 'dark', '뱀파이어 드라큘라 흡혈귀 백작 박쥐인간', {
  basic: wm('drain', (P, S) => [{ t: 'bite', dmg: 7 * P, r: 11, range: 34, kb: 1, st: SX(S, 0.5) }], '{n} 송곳니|{n} 목 물기', '우아하게 목덜미를 문다'),
  s1: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 3 * P, r: 22, dur: 4, speed: 100, st: SV(S, 'confuse', 0.6) }], '{n} 박쥐 떼|퍼덕퍼덕', '망토를 펼치자 박쥐 떼가 날아간다'),
  s2: wm('drain', (P, S) => [{ t: 'drain', dmg: 4 * P, range: 140, dur: 2, ticks: 7, heal: 4, st: SV(S, 'weak', 0.8) }], '{n} 피 마시기|쭈욱', '멀리서도 피를 쭈욱 빨아 마신다'),
  ult: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 4 * P, r: 50, dur: 3, pull: 12, at: 'target', st: SV(S, 'weak', 1.2) }, { t: 'swarm', dmg: 3 * P, r: 30, dur: 5, speed: 100 }, { t: 'drain', dmg: 4 * P, range: 180, dur: 2.5, ticks: 8, heal: 5 }], '피의 만찬|{n}의 밤', '붉은 달 아래 모두를 끌어당겨 피를 마신다'),
}, { st: 'weak', style: 'assassin', passive: 'lifesteal', title: '밤의 귀족|마늘 알레르기', look: { cape: true, body: '#1a0a1a', outfit: 'suit', aura: 'shadow' } });

wfam('ghost', 'ghost', '귀신 유령 처녀귀신 몽달귀신 저승사자 도깨비 요괴 악령 망령 원귀 폴터가이스트 고스트 혼령 영혼 달걀귀신 물귀신', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 24, speed: 150, size: 2, homing: 0.6, pierce: true, st: SV(S, 'confuse', 0.5) }], '{n}불|도깨비불', '파란 {n}불이 둥실둥실 쫓아간다'),
  s1: wm('grab', (P, S) => [{ t: 'grab', dmg: 12 * P, r: 16, range: 200, delay: 0.45, kb: 7, st: SV(S, 'root', 0.8) }], '{n}의 손|발목 잡기', '바닥에서 하얀 손이 스윽… 발목을 잡아끈다'),
  s2: wm('phantom', (P, S) => [{ t: 'buff', k: 'invis', d: 2 }, { t: 'phantom', dmg: 14 * P, dist: 120, st: SV(S, 'confuse', 1) }], '{n} 통과|벽 뚫고 슥', '투명해져서 몸을 스윽 통과한다. 소름'),
  ult: wm('all', (P, S) => [{ t: 'all', dmg: 6 * P, st: SV(S, 'confuse', 1.5) }, { t: 'grab', dmg: 10 * P, r: 22, range: 240, delay: 0.6, kb: 6 }, { t: 'swarm', dmg: 3 * P, r: 30, dur: 5, speed: 70 }], '{n}의 밤|불 꺼진 학교', '불이 꺼지고… 사방에서 {n}의 손이 뻗어 온다'),
}, { st: 'confuse', style: 'assassin', passive: 'dodge', title: '야밤의 손님|무서운 이야기', look: { body: '#e8e8f0', aura: 'shadow' } });

wfam('demon', 'dark', '악마 사탄 마왕 데몬 임프 루시퍼 지옥 지옥불 마귀 악귀 대마왕', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 220, size: 3, st: SV(S, 'burn', 0.6) }], '{n}의 구슬|지옥 구슬', '검붉은 {n} 구슬을 던진다'),
  s1: wm('pillar', (P, S) => [{ t: 'pillar', dmg: 10 * P, n: 6, step: 22, r: 11, lift: false, kb: 3, st: SV(S, 'burn', 1) }], '{n} 불기둥|지옥문 개방', '바닥에서 지옥불 기둥이 줄줄이 솟는다'),
  s2: wm('grab', (P, S) => [{ t: 'grab', dmg: 14 * P, r: 18, range: 200, delay: 0.45, kb: 8, st: SV(S, 'weak', 1.4) }], '{n}의 손아귀|계약서에 서명해', '땅에서 시뻘건 손이 나와 끌고 온다. 계약 성립'),
  ult: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 16 * P, n: 6, delay: 0.8, kb: 4, st: SV(S, 'burn', 1.5) }, { t: 'meteor', dmg: 20 * P, r: 40, kb: 8 }], '{n} 강림|지옥 오픈 기념', '하늘이 붉어지고 마법진 선이 그어진 뒤 모두 불탄다'),
}, { st: 'burn', style: 'gravity', passive: 'rage', title: '지옥 사장님|계약의 달인', look: { head: 'horns', aura: 'flame', body: '#5a0a1a', cape: true } });

wfam('angel', 'holy', '천사 대천사 신 하느님 하나님 부처님 여신 성자 수호천사 세라핌 큐피드 천국 메시아 신령님 산신령', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 260, size: 2, pierce: true, st: SX(S, 0.5) }], '{n}의 화살|빛의 깃털', '빛나는 깃털 화살을 쏜다'),
  s1: wm('pillar', (P, S) => [{ t: 'pillar', dmg: 10 * P, n: 5, step: 22, r: 12, lift: true, kb: 2, st: SX(S, 1) }], '{n}의 빛기둥|성스러운 기둥', '하늘의 빛이 기둥이 되어 줄줄이 솟는다'),
  s2: wm('heal', (P) => [{ t: 'heal', amt: 22 }, { t: 'buff', k: 'shield', d: 4, pow: 25 }, { t: 'wave', dmg: 6 * P, r: 50, at: 'self', kb: 6 }], '{n}의 축복|할렐루야', '빛이 쏟아져 회복하고 주변을 밀어낸다'),
  ult: wm('lasergrid', (P, S) => [{ t: 'buff', k: 'fly', d: 3 }, { t: 'lasergrid', dmg: 16 * P, n: 6, delay: 0.7, kb: 4, st: SV(S, 'stun', 1.2) }, { t: 'heal', amt: 15 }], '{n}의 심판|천벌', '하늘에서 빛의 선이 그어진다… 그리고 천벌'),
}, { st: 'stun', style: 'healer', passive: 'regen', title: '하늘의 사자|빛의 수호자', look: { head: 'halo', aura: 'holy', body: '#f6f0e0', outfit: 'robe' } });

wfam('slime', 'gross', '슬라임 젤리괴물 액괴 스퀴시 점액괴물 푸딩괴물 말랑이', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 170, size: 3, bounce: 2, st: SV(S, 'slow', 0.6) }], '{n} 덩어리|말랑 투척', '말랑한 {n} 덩어리를 던진다'),
  s1: wm('hop', (P, S) => [{ t: 'hop', dmg: 9 * P, n: 4, r: 18, size: 8, kb: 4, st: SV(S, 'slow', 1) }], '{n} 통통|말랑 점프', '통통 튀어 다니며 덮친다'),
  s2: wm('bubble', (P) => [{ t: 'bubble', dmg: 4 * P, n: 2, speed: 110, size: 4, d: 1.2 }], '{n} 감싸기|말랑 감옥', '{n}에 쏙 갇혀서 말랑말랑 떠오른다'),
  ult: wm('hop', (P, S) => [{ t: 'buff', k: 'giant', d: 4 }, { t: 'hop', dmg: 16 * P, n: 4, r: 34, size: 14, kb: 8, st: SV(S, 'slow', 1.5) }], '킹 {n}|왕 말랑이', '거대한 킹 {n이} 쿵 쿵 튀며 깔아뭉갠다'),
}, { st: 'slow', style: 'tank', passive: 'regen', title: '말랑말랑 공포|합체 장인' });

wfam('giant', 'power', '거인 트롤 오우거 오크 고블린 사이클롭스 골렘 타이탄 거신 진격의거인 거대로봇', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 10 * P, r: 26, arc: 130, kb: 7, st: SX(S, 0.6) }], '{n} 몽둥이|{n} 후려치기', '커다란 몽둥이로 크게 후려친다'),
  s1: wm('crack', (P, S) => [{ t: 'crack', dmg: 14 * P, len: 180, speed: 200, r: 12, kb: 6, st: SV(S, 'stun', 0.8) }], '{n} 땅 가르기|대지 쪼개기', '땅을 내리쳐 균열이 앞으로 쫙 갈라진다'),
  s2: wm('grab', (P, S) => [{ t: 'grab', dmg: 14 * P, r: 20, range: 160, delay: 0.4, kb: 9, st: SV(S, 'stun', 0.8) }], '{n}의 손|한 손으로 들기', '거대한 손으로 집어 들어 패대기친다'),
  ult: wm('stomp', (P, S) => [{ t: 'buff', k: 'giant', d: 5 }, { t: 'stomp', dmg: 16 * P, n: 4, r: 34, kb: 9, st: SV(S, 'heavy', 1.5) }], '{n} 진격|발밑을 조심해', '더 거대해져서 쿵! 쿵! 쿵! 쿵! 밟는다'),
}, { st: 'heavy', style: 'tank', passive: 'armor', stats: { hp: 25, speed: 0.88, size: 1.2 }, title: '걸어 다니는 산|발밑 주의', look: { body: '#6a7a4a' } });

wfam('alien', 'space', '외계인 에일리언 UFO ufo 유에프오 미확인비행물체 화성인 우주인 그레이 비행접시 우주괴물', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 10, speed: 280, size: 1, st: SX(S, 0.5) }], '{n} 광선총|삐융삐융', '삐융삐융! 외계 광선총'),
  s1: wm('grab', (P, S) => [{ t: 'grab', dmg: 10 * P, r: 18, range: 220, delay: 0.5, kb: 9, st: SV(S, 'air', 0.8) }], '{n} 납치 빔|소 대신 너', '하늘에서 빛이 내려와 위로 끌어올려 데려온다'),
  s2: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 10 * P, n: 4, delay: 0.6, kb: 2, st: SV(S, 'confuse', 1) }], '{n} 스캔|분석 레이저', '적 주위를 레이저로 스캔하고 지진다'),
  ult: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 50, dur: 3, pull: 13, at: 'target', st: SV(S, 'morph', 1.4) }, { t: 'lasergrid', dmg: 12 * P, n: 6, delay: 1, kb: 3 }], '{n} 모선 강림|지구 침공', '거대한 모선이 빨아들이고 레이저망을 깐다'),
}, { st: 'confuse', style: 'gravity', passive: 'dodge', title: '지구 관광객|소 납치범', look: { body: '#7aff9a', head: 'bald' } });

wfam('unicorn', 'magic', '유니콘 페가수스 불사조 피닉스 그리핀 키메라 켄타우로스 인어 인어공주 요정 팅커벨 엘프 드워프 호빗', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 7 * P, len: 44, w: 5, n: 1, kb: 4, st: SX(S, 0.5) }], '{n} 뿔 찌르기|무지개 찌르기', '반짝이는 뿔로 쭉 찌른다'),
  s1: wm('prism', (P, S) => [{ t: 'prism', dmg: 4 * P, len: 170, w: 5, spread: 26, ticks: 2, dur: 0.5, st: SV(S, 'confuse', 0.8) }], '{n} 무지개빔|일곱 빛깔', '뿔에서 무지개 빛이 세 갈래로 뿜어진다'),
  s2: wm('dash', (P) => [{ t: 'dash', dist: 120, dmg: 10 * P, kb: 6, invuln: true }, { t: 'heal', amt: 12 }], '{n} 질주|반짝 대시', '반짝이를 뿌리며 질주한다'),
  ult: wm('stampede', (P, S) => [{ t: 'buff', k: 'fly', d: 3 }, { t: 'stampede', dmg: 11 * P, n: 6, speed: 230, len: 260, size: 8, kb: 8, st: SV(S, 'dance', 1.2) }, { t: 'prism', dmg: 4 * P, len: 150, w: 4, spread: 30, ticks: 2, dur: 0.5 }], '{n} 무지개 행진|동화 속 대행진', '무지개 위로 {n} 떼가 날아오며 모두 춤추게 만든다'),
}, { st: 'dance', style: 'idol', passive: 'regen', title: '동화 속 주인공|반짝이 장인', look: { aura: 'star', hair: '#ff9ad0' } });

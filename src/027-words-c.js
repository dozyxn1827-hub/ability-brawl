/* ----- 단어 사전 3: 음식·살림·자연·날씨·몸·돈·기타 ----- */

/* ===== 음식 ===== */
wfam('noodle', 'food', '!라면 짜장면 짬뽕 우동 국수 냉면 비빔면 칼국수 잔치국수 스파게티 파스타 쌀국수 라멘 소바 컵라면 불닭 불닭볶음면 신라면 너구리 짜파게티 면발', {
  basic: wm('whip', (P, S) => [{ t: 'whip', dmg: 7 * P, len: 58, kb: 3, st: SV(S, 'slow', 0.5) }], '{n} 면발 채찍|후루룩', '긴 {n} 면발을 채찍처럼 휘두른다'),
  s1: wm('lob', (P, S) => [{ t: 'lob', dmg: 10 * P, r: 22, n: 1, kb: 4, st: SV(S, 'burn', 1.2) }, { t: 'zone', dmg: 2 * P, r: 24, dur: 3, at: 'target', st: { k: 'slip', d: 1 } }], '{n} 국물 투척|뜨거운 국물', '펄펄 끓는 국물째 던진다. 바닥이 미끌미끌'),
  s2: wm('hook', (P, S) => [{ t: 'hook', dmg: 7 * P, speed: 300, range: 170, st: SV(S, 'root', 0.5) }], '{n} 후루룩 흡입|빨아들이기', '면발을 던졌다가 후루룩 빨아들여 끌고 온다'),
  ult: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 4 * P, r: 50, dur: 3.5, pull: 12, at: 'target', st: SV(S, 'burn', 1.2) }, { t: 'whip', dmg: 12 * P, len: 90, kb: 6 }, { t: 'heal', amt: 20 }], '{n} 냄비 소용돌이|야식 타임', '거대한 냄비 소용돌이에 다 빨려 들어간다. 나는 배부름'),
}, { st: 'burn', style: 'glutton', passive: 'regen', title: '야식 대마왕|면치기 장인', look: { body: '#d0402a' } });

wfam('korean', 'food', '김치 떡볶이 김밥 비빔밥 불고기 삼겹살 갈비 순대 어묵 오뎅 만두 호떡 붕어빵 떡 송편 떡국 된장찌개 김치찌개 부대찌개 감자탕 닭갈비 족발 보쌈 곱창 막창 육회 국밥 순두부 계란말이 파전', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 14, speed: 220, size: 2, st: SX(S, 0.4) }], '{n} 한 입|{n} 먹어 봐', '{n을} 입에 쏙… 아니 얼굴에 던진다'),
  s1: wm('lob', (P, S) => [{ t: 'lob', dmg: 10 * P, r: 22, n: 2, kb: 4, st: SV(S, 'burn', 1) }], '{n} 뚝배기|팔팔 끓는 {n}', '팔팔 끓는 뚝배기째로 던진다'),
  s2: wm('zone', (P) => [{ t: 'zone', dmg: 0, r: 32, dur: 4, at: 'self', heal: 4, st: { k: 'slow', d: 1 } }, { t: 'buff', k: 'power', d: 3 }], '{n} 한 상 차림|밥심', '한 상 차려 먹고 힘이 솟는다. 냄새에 적은 느려짐'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 30 * P, r: 46, kb: 9, st: SV(S, 'burn', 1.4) }, { t: 'heal', amt: 18 }, { t: 'lob', dmg: 8 * P, r: 16, n: 4 }], '하늘에서 거대 {n}|명절 대잔치', '하늘에서 산만 한 {n이} 떨어지고 반찬이 쏟아진다'),
}, { st: 'burn', style: 'glutton', passive: 'regen', title: '한식 장인|밥도둑', look: { body: '#d0402a' } });

wfam('fastfood', 'food', '피자 햄버거 버거 핫도그 치킨 후라이드 양념치킨 감자튀김 프렌치프라이 나초 타코 부리또 샌드위치 토스트 핫바 소시지 너겟 치즈 맥도날드 롯데리아 버거킹', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 3, spread: 24, speed: 230, size: 1, st: SX(S, 0.4) }], '{n} 날리기|감튀 사격', '감자튀김을 총알처럼 날린다'),
  s1: wm('roll', (P, S) => [{ t: 'roll', dmg: 12 * P, size: 10, speed: 180, life: 2, bounce: 3, kb: 7, st: SV(S, 'slip', 1) }], '{n} 원반 굴리기|라지 사이즈', '라지 사이즈 {n이} 바퀴처럼 굴러간다'),
  s2: wm('cone', (P, S) => [{ t: 'cone', dmg: 3 * P, len: 80, arc: 50, dur: 0.8, ticks: 5, kb: 2, st: SV(S, 'slip', 1) }], '{n} 소스 분사|케첩 머스타드', '케첩과 머스타드를 쫙 뿌린다'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 12 * P, n: 9, step: 20, r: 12, st: SV(S, 'heavy', 1.2) }, { t: 'heal', amt: 20 }], '{n} 무한 리필|1+1 행사', '하늘에서 {n이} 일렬로 쏟아진다. 칼로리 폭탄'),
}, { st: 'heavy', style: 'glutton', passive: 'regen', stats: { hp: 10, speed: 0.95 }, title: '칼로리 폭탄|야식 VIP' });

wfam('fruit', 'food', '사과 바나나 딸기 수박 포도 귤 오렌지 레몬 복숭아 체리 멜론 파인애플 망고 키위 자두 배꼽참외 참외 블루베리 아보카도 코코넛 두리안 감 홍시 석류 무화과 샤인머스캣', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 230, size: 3, bounce: 1, st: SX(S, 0.4) }], '{n} 던지기|싱싱한 {n}', '잘 익은 {n을} 던진다'),
  s1: wm('roll', (P, S) => [{ t: 'roll', dmg: 13 * P, size: 11, speed: 160, life: 2.2, bounce: 2, kb: 8, st: SV(S, 'slip', 1) }], '{n} 굴리기|거대 {n}', '산만 한 {n을} 굴려 보낸다'),
  s2: wm('zone', (P, S) => [{ t: 'zone', dmg: 2 * P, r: 30, dur: 4, at: 'target', st: SV(S, 'slip', 1) }], '{n} 껍질 깔기|미끄러져라', '{n} 껍질을 바닥에 깔아 둔다'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 12 * P, n: 9, step: 20, r: 12, st: SV(S, 'slip', 1.2) }, { t: 'roll', dmg: 16 * P, size: 13, speed: 140, life: 2.5, bounce: 2, kb: 9 }], '{n} 대풍년|과일 가게 폭발', '하늘에서 {n이} 줄줄이 떨어지고 거대한 {n}까지 굴러온다'),
}, { st: 'slip', style: 'artillery', passive: 'regen', title: '과일 가게 사장|비타민 폭탄' });

wfam('veggie', 'plant', '양파 마늘 당근 감자 고구마 오이 브로콜리 대파 고추 청양고추 피망 파프리카 토마토 가지 호박 옥수수 콩 배추 양배추 시금치 무 버섯 표고버섯 송이버섯 콩나물 깻잎 상추 고수', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 6 * P, len: 40, w: 5, n: 1, kb: 3, st: SX(S, 0.4) }], '{n} 찌르기|뾰족한 {n}', '{n} 끝으로 쿡 찌른다'),
  s1: wm('pillar', (P, S) => [{ t: 'pillar', dmg: 9 * P, n: 5, step: 20, r: 10, lift: true, kb: 2, st: SX(S, 0.6) }], '{n} 쑥쑥 자라기|텃밭 공격', '땅에서 {n이} 줄줄이 쑥쑥 솟아난다'),
  s2: wm('zone', (P, S) => [{ t: 'zone', dmg: 3 * P, r: 30, dur: 4, at: 'target', st: SV(S, 'confuse', 1) }], '{n} 냄새 폭탄|눈물 나는 {n}', '{n} 냄새에 눈물이 줄줄 나서 방향을 잃는다'),
  ult: wm('lob', (P, S) => [{ t: 'lob', dmg: 12 * P, r: 22, n: 5, kb: 5, st: SV(S, 'confuse', 1.2) }, { t: 'pillar', dmg: 8 * P, n: 6, step: 22, r: 11, lift: true }], '{n} 대수확|편식은 안 돼', '편식하면 혼난다! 채소가 쏟아지고 땅에서 솟는다'),
}, { st: 'confuse', style: 'healer', passive: 'regen', title: '편식 금지 위원장|텃밭 지킴이', look: { aura: 'leaf' } });

wfam('dessert', 'sweet', '케이크 생크림케이크 쿠키 마카롱 도넛 와플 팬케이크 푸딩 젤리 곰젤리 사탕 막대사탕 롤리팝 솜사탕 초콜릿 초코 아이스크림 빙수 팥빙수 캐러멜 마시멜로 껌 풍선껌 꿀떡 약과 탕후루 붕어싸만코 쭈쭈바', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 3, spread: 30, speed: 210, size: 1, bounce: 1, st: SV(S, 'slow', 0.4) }], '{n} 사격|달콤탄', '알록달록 {n} 조각을 쏜다'),
  s1: wm('bubble', (P) => [{ t: 'bubble', dmg: 5 * P, n: 1, speed: 120, size: 4, d: 1.2 }], '{n} 풍선|끈적 감옥', '{n} 풍선에 갇혀서 둥둥 떠오른다'),
  s2: wm('hop', (P, S) => [{ t: 'hop', dmg: 9 * P, n: 4, r: 18, size: 7, kb: 4, st: SV(S, 'slow', 1) }], '{n} 통통|말랑 {n}', '말랑한 {n이} 통통 튀며 깔아뭉갠다'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 30 * P, r: 46, kb: 9, st: SV(S, 'slow', 1.5) }, { t: 'storm', dmg: 6 * P, n: 8, r: 54 }, { t: 'heal', amt: 18 }], '하늘에서 거대 {n}|당 충전 완료', '하늘에서 3층짜리 {n이} 떨어지고 스프링클이 쏟아진다'),
}, { st: 'slow', style: 'artillery', passive: 'regen', title: '당 충전소|충치 유발자', look: { aura: 'star', hair: '#ff9ad0' } });

wfam('drink', 'water', '콜라 사이다 커피 아메리카노 라떼 우유 바나나우유 주스 오렌지주스 탄산 탄산수 맥주 소주 막걸리 녹차 홍차 밀크티 버블티 에너지드링크 박카스 야쿠르트 요구르트 식혜', {
  basic: wm('cone', (P, S) => [{ t: 'cone', dmg: 2 * P, len: 70, arc: 30, dur: 0.5, ticks: 3, kb: 3, st: SV(S, 'slip', 0.5) }], '{n} 뿜기|푸웁', '{n을} 마시다가 푸웁 뿜는다'),
  s1: wm('bubble', (P) => [{ t: 'bubble', dmg: 5 * P, n: 2, speed: 140, size: 3, d: 1 }], '{n} 탄산 방울|보글보글', '탄산 방울이 적을 감싸서 띄운다'),
  s2: wm('buff', () => [{ t: 'buff', k: 'haste', d: 4 }, { t: 'buff', k: 'power', d: 3 }, { t: 'heal', amt: 10 }], '{n} 원샷|카페인 충전', '원샷! 카페인이 돌면서 빨라진다'),
  ult: wm('surge', (P, S) => [{ t: 'cone', dmg: 5 * P, len: 110, arc: 50, dur: 1.2, ticks: 7, kb: 5, st: SV(S, 'slip', 1.2) }, { t: 'surge', dmg: 12 * P, w: 80, len: 180, speed: 170, kb: 9 }], '{n} 분수쇼|멘토스 대폭발', '멘토스를 넣었다! {n이} 분수처럼 터져 휩쓴다'),
}, { st: 'slip', style: 'artillery', passive: 'swift', title: '카페인 중독|원샷 장인' });

wfam('egg', 'food', '계란 달걀 날계란 삶은계란 계란후라이 반숙 메추리알 두부 순두부찌개 묵 도토리묵 우뭇가사리', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 220, size: 2, st: SV(S, 'slip', 0.6) }], '{n} 투척|퍽', '{n을} 던진다. 퍽! 끈적'),
  s1: wm('lob', (P, S) => [{ t: 'lob', dmg: 8 * P, r: 18, n: 3, kb: 3, st: SV(S, 'slip', 1) }], '{n} 한 판|30개 투척', '{n} 한 판을 통째로 던진다'),
  s2: wm('hop', (P, S) => [{ t: 'hop', dmg: 9 * P, n: 3, r: 18, size: 8, kb: 4, st: SX(S, 0.8) }], '{n} 출렁출렁|탱글탱글', '탱글탱글한 {n이} 튀어 다닌다'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 30 * P, r: 46, kb: 9, st: SV(S, 'slip', 1.5) }, { t: 'zone', dmg: 2 * P, r: 50, dur: 4, at: 'target', st: { k: 'slip', d: 1 } }], '하늘에서 거대 {n}|공룡알 낙하', '거대한 {n이} 떨어져 깨진다. 바닥 전체가 미끌'),
}, { st: 'slip', style: 'artillery', passive: 'regen', title: '단백질 장인|계란 한 판' });

/* ===== 살림·생활 ===== */
wfam('cleaning', 'tech', '빗자루 대걸레 걸레 쓰레받기 먼지떨이 수세미 고무장갑 락스 세제 비누 샴푸 린스 칫솔 치약 수건 행주 휴지통 쓰레기통 분리수거 쓰레기', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 7 * P, r: 22, arc: 140, kb: 5, st: SX(S, 0.4) }], '{n} 쓸기|싹싹', '{n으로} 싹싹 쓸어 버린다'),
  s1: wm('bubble', (P) => [{ t: 'bubble', dmg: 5 * P, n: 2, speed: 130, size: 3, d: 1.1 }], '{n} 거품|보글보글 세척', '거품에 갇혀서 둥둥 떠오른다. 깨끗해짐'),
  s2: wm('gust', (P, S) => [{ t: 'gust', dmg: 4 * P, len: 80, arc: 90, kb: 10, st: SX(S, 0.5) }], '{n} 털기|먼지 날리기', '탁탁 털어서 먼지와 함께 날려 버린다'),
  ult: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 4 * P, r: 50, dur: 3.5, pull: 13, at: 'target', st: SV(S, 'slip', 1.2) }, { t: 'surge', dmg: 10 * P, w: 80, len: 170, speed: 160, kb: 9 }], '{n} 대청소|엄마 오시기 5분 전', '엄마 오기 5분 전! 다 빨아들이고 거품 파도로 쓸어버린다'),
}, { st: 'slip', style: 'engineer', passive: 'regen', title: '청소의 신|깔끔쟁이' });

wfam('furniture', 'earth', '의자 책상 침대 소파 쇼파 옷장 냉장고문 문짝 문 창문 커튼 이불 베개 매트리스 방석 쿠션 식탁 책장 서랍 장롱 화분 거울 액자 시계추', {
  basic: wm('lob', (P, S) => [{ t: 'lob', dmg: 8 * P, r: 14, n: 1, kb: 5, st: SX(S, 0.5) }], '{n} 던지기|휙', '{n을} 집어 던진다'),
  s1: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 10 * P, n: 3, speed: 200, len: 200, size: 9, kb: 8, st: SV(S, 'stun', 0.6) }], '{n} 미끄러뜨리기|가구 대이동', '{n}들이 바닥을 미끄러지며 돌진한다'),
  s2: wm('net', (P) => [{ t: 'net', dmg: 6 * P, speed: 220, range: 150, r: 18, d: 2 }], '{n} 덮어씌우기|폭 덮기', '{n을} 확 덮어씌워 꼼짝 못 하게 한다'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 32 * P, r: 46, kb: 10, st: SV(S, 'sleep', 1.5) }, { t: 'skyline', dmg: 9 * P, n: 7, step: 20, r: 11 }], '하늘에서 {n} 낙하|이사 가는 날', '이삿날! 하늘에서 {n이} 줄줄이 떨어진다'),
}, { st: 'sleep', style: 'tank', passive: 'armor', title: '이사 전문가|집순이', look: { outfit: 'plain' } });

wfam('umbrella', 'wind', '우산 양산 부채 손선풍기 바람개비 연 종이비행기 종이학 풍선 비닐봉지', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 7 * P, r: 22, arc: 120, kb: 5, st: SX(S, 0.4) }], '{n} 휘두르기|{n} 펑', '{n을} 펴면서 휘두른다'),
  s1: wm('counter', () => [{ t: 'buff', k: 'reflect', d: 2.5 }, { t: 'buff', k: 'shield', d: 3, pow: 20 }], '{n} 방패|막아라', '{n을} 펴서 날아오는 걸 튕겨 낸다'),
  s2: wm('gust', (P, S) => [{ t: 'gust', dmg: 4 * P, len: 90, arc: 100, kb: 10, st: SX(S, 0.5) }, { t: 'buff', k: 'fly', d: 2 }], '{n} 바람 타기|둥실', '{n으로} 바람을 일으키며 둥실 떠오른다'),
  ult: wm('tornado', (P, S) => [{ t: 'tornado', dmg: 5 * P, r: 20, speed: 80, life: 4, st: SV(S, 'confuse', 1) }, { t: 'spiral', dmg: 5 * P, n: 18, speed: 200 }], '{n} 태풍 모드|날아가는 {n}', '{n이} 빙글빙글 돌며 거대한 회오리가 된다'),
}, { st: 'confuse', style: 'flyer', passive: 'dodge', title: '바람 타는 자|메리 포핀스' });

wfam('tools', 'metal', '가위 칼가위 망치질 드라이버 렌치 스패너 펜치 니퍼 톱 전기톱 드릴 나사 볼트 공구 공구함 테이프건 글루건 사포 삽 곡괭이 호미 낫질 갈퀴', {
  basic: wm('claw', (P, S) => [{ t: 'claw', dmg: 4 * P, r: 22, kb: 1, st: SX(S, 0.4) }], '{n} 싹둑|{n}질', '{n으로} 싹둑싹둑'),
  s1: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 3 * P, n: 10, spread: 18, st: SV(S, 'root', 0.4) }], '{n} 못 박기|탕탕탕', '못을 탕탕탕 연사한다'),
  s2: wm('top', (P, S) => [{ t: 'top', dmg: 6 * P, n: 2, speed: 140, dur: 5, kb: 4, st: SV(S, 'vuln', 0.8) }], '{n} 회전날|위이잉', '돌아가는 날을 바닥에 풀어놓는다'),
  ult: wm('crack', (P, S) => [{ t: 'crack', dmg: 14 * P, len: 200, speed: 220, r: 12, kb: 6, st: SV(S, 'stun', 1) }, { t: 'flurry', dmg: 4 * P, r: 28, off: 20, dur: 0.8, ticks: 8 }], '{n} 철거 작업|리모델링', '땅을 갈라 버리고 위이잉 갈아 버린다'),
}, { st: 'vuln', style: 'engineer', passive: 'crit', title: '맥가이버|철거 반장', look: { head: 'helmet' } });

wfam('clothes', 'love', '양말 신발 운동화 구두 슬리퍼 쪼리 하이힐 장화 모자 안경 선글라스 넥타이 목도리 장갑 팬티 속옷 빤스 잠옷 교복 패딩 롱패딩 청바지 치마 가발 마스크 귀마개 가방 지갑', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 20, speed: 230, size: 2, st: SX(S, 0.4) }], '{n} 던지기|벗어 던지기', '{n을} 벗어서 던진다'),
  s1: wm('net', (P) => [{ t: 'net', dmg: 5 * P, speed: 220, range: 150, r: 16, d: 1.8 }], '{n} 씌우기|머리에 쏙', '{n을} 머리에 씌워서 앞을 못 보게 한다'),
  s2: wm('whip', (P, S) => [{ t: 'whip', dmg: 9 * P, len: 60, kb: 5, st: SV(S, 'stun', 0.5) }], '{n} 휘두르기|찰싹', '{n을} 돌돌 말아서 찰싹'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 12 * P, n: 9, step: 20, r: 12, st: SV(S, 'confuse', 1.2) }, { t: 'all', dmg: 4 * P, st: { k: 'confuse', d: 1.2 } }], '{n} 대방출|옷장 폭발', '옷장이 터져서 {n이} 비처럼 쏟아진다'),
}, { st: 'confuse', style: 'trickster', passive: 'dodge', title: '패션 테러리스트|빨래 산더미' });

wfam('toy', 'magic', '인형 곰인형 장난감 레고 블록 팽이 요요 큐브 루빅스큐브 비눗방울 공기놀이 딱지 구슬 미니카 장난감총 슬라임장난감 피젯스피너 뽁뽁이 풍선껌장난감 오뚝이 로봇장난감', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 18, speed: 220, size: 2, bounce: 2, st: SX(S, 0.4) }], '{n} 튕기기|장난감 발사', '{n을} 튕겨서 날린다'),
  s1: wm('top', (P, S) => [{ t: 'top', dmg: 6 * P, n: 3, speed: 130, dur: 5, kb: 4, st: SV(S, 'confuse', 0.8) }], '{n} 출동|태엽 감기', '태엽 감은 {n}들이 미친 듯이 돌아다닌다'),
  s2: wm('mark', (P, S) => [{ t: 'mark', dmg: 16 * P, r: 18, delay: 1, range: 200, kb: 6, st: SX(S, 1) }], '밟으면 아픈 {n}|레고 지뢰', '적 발밑에 {n을} 붙여 둔다. 잠시 후 아야!'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 10 * P, n: 8, speed: 220, len: 240, size: 6, kb: 6, st: SV(S, 'dance', 1.2) }, { t: 'top', dmg: 5 * P, n: 2, speed: 140, dur: 5 }], '{n} 대행진|장난감 나라', '장난감들이 살아나서 행진하며 짓밟는다'),
}, { st: 'confuse', style: 'summoner', passive: 'dodge', title: '장난감 나라 왕|레고 지뢰 설치범' });

/* ===== 자연 ===== */
wfam('volcano', 'fire', '화산 용암 마그마 분화구 화산재 화산탄 백두산 한라산 활화산 지옥불구덩이', {
  basic: wm('lob', (P, S) => [{ t: 'lob', dmg: 8 * P, r: 14, n: 1, kb: 4, st: SV(S, 'burn', 0.8) }], '{n} 덩어리|화산탄', '뜨거운 {n} 덩어리를 던진다'),
  s1: wm('pillar', (P, S) => [{ t: 'pillar', dmg: 10 * P, n: 6, step: 20, r: 11, lift: false, kb: 3, st: SV(S, 'burn', 1.2) }], '{n} 분출|용암 기둥', '땅에서 {n} 기둥이 줄줄이 솟는다'),
  s2: wm('zone', (P, S) => [{ t: 'zone', dmg: 4 * P, r: 34, dur: 4, at: 'target', st: SV(S, 'burn', 1) }], '{n} 웅덩이|발 데임 주의', '바닥이 {n으로} 변한다'),
  ult: wm('meteor', (P, S) => [{ t: 'pillar', dmg: 10 * P, n: 6, step: 22, r: 12, lift: true }, { t: 'storm', dmg: 7 * P, n: 8, r: 56, st: SV(S, 'burn', 1.4) }, { t: 'meteor', dmg: 26 * P, r: 44, kb: 10 }], '{n} 대폭발|폼페이 재현', '{n이} 터진다! 용암 기둥, 화산탄, 거대 운석까지'),
}, { st: 'burn', style: 'bomber', passive: 'armor', title: '불의 산|분화 직전', look: { aura: 'flame', body: '#5a1a0a' } });

wfam('quake', 'earth', '지진 땅울림 땅 흙 진흙 모래 바위 돌멩이 !돌 자갈 절벽 동굴 광산 사막 모래폭풍 사막폭풍 개미지옥 늪 산사태 흙탕물', {
  basic: wm('lob', (P, S) => [{ t: 'lob', dmg: 8 * P, r: 14, n: 1, kb: 5, st: SX(S, 0.5) }], '{n} 던지기|짱돌', '{n을} 집어 던진다'),
  s1: wm('crack', (P, S) => [{ t: 'crack', dmg: 13 * P, len: 180, speed: 190, r: 12, kb: 6, st: SV(S, 'stun', 0.7) }], '{n} 가르기|대지 균열', '땅을 갈라 균열이 앞으로 달려간다'),
  s2: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 38, dur: 3.5, pull: 11, at: 'target', st: SV(S, 'slow', 1.2) }], '{n} 늪|개미지옥', '발밑이 꺼지며 빨려 들어간다'),
  ult: wm('pillar', (P, S) => [{ t: 'stomp', dmg: 10 * P, n: 3, r: 30, kb: 7 }, { t: 'pillar', dmg: 12 * P, n: 8, step: 20, r: 12, lift: true, st: SV(S, 'stun', 1) }, { t: 'crack', dmg: 10 * P, len: 200, speed: 220, r: 12 }], '규모 9.0 {n}|대지진', '땅이 흔들리고 갈라지고 바위 기둥이 솟는다'),
}, { st: 'stun', style: 'tank', passive: 'armor', stats: { hp: 15 }, title: '대지의 분노|진도 9', look: { body: '#7a5a3a', outfit: 'armor' } });

wfam('tree', 'plant', '나무 소나무 대나무 참나무 은행나무 단풍나무 야자수 나뭇가지 !뿌리 나뭇잎 낙엽 덩굴 넝쿨 가시덤불 숲 정글 밀림 나무꾼 엔트 세계수', {
  basic: wm('whip', (P, S) => [{ t: 'whip', dmg: 7 * P, len: 58, kb: 4, st: SV(S, 'root', 0.4) }], '{n} 가지 채찍|휘청', '{n} 가지를 휘둘러 찰싹'),
  s1: wm('grab', (P, S) => [{ t: 'grab', dmg: 11 * P, r: 16, range: 190, delay: 0.45, kb: 6, st: SV(S, 'root', 1.2) }], '{n} 뿌리 휘감기|발목 잡기', '땅에서 뿌리가 솟아 발목을 휘감는다'),
  s2: wm('pillar', (P, S) => [{ t: 'pillar', dmg: 9 * P, n: 6, step: 20, r: 10, lift: true, kb: 2, st: SX(S, 0.6) }], '{n} 쑥쑥|숲 만들기', '앞으로 {n이} 줄줄이 솟아난다'),
  ult: wm('ring', (P, S) => [{ t: 'ring', dmg: 5 * P, r: 44, dur: 4, at: 'target', st: SV(S, 'root', 1.4) }, { t: 'pillar', dmg: 10 * P, n: 8, step: 20, r: 12, lift: true }, { t: 'heal', amt: 20 }], '{n}의 분노|숲의 심판', '적 주위가 {n으로} 둘러싸이고 뿌리가 솟는다'),
}, { st: 'root', style: 'healer', passive: 'regen', stats: { hp: 15, speed: 0.92 }, title: '숲의 수호자|광합성 중', look: { aura: 'leaf', body: '#3a6a2a' } });

wfam('flower', 'plant', '꽃 장미 해바라기 벚꽃 튤립 민들레 개나리 진달래 무궁화 연꽃 백합 국화 코스모스 라벤더 꽃잎 꽃다발 꽃가루 화분꽃 식충식물 파리지옥', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 4 * P, n: 3, spread: 30, speed: 200, size: 1, homing: 0.3, st: SV(S, 'sleep', 0.3) }], '{n}잎 날리기|살랑살랑', '{n}잎이 살랑살랑 날아간다'),
  s1: wm('spiral', (P, S) => [{ t: 'spiral', dmg: 4 * P, n: 16, speed: 170, st: SV(S, 'sleep', 0.5) }], '{n}잎 회오리|봄바람', '{n}잎이 나선을 그리며 흩날린다'),
  s2: wm('bite', (P, S) => [{ t: 'bite', dmg: 12 * P, r: 16, range: 60, kb: 3, st: SV(S, 'root', 1) }], '{n} 덥석|식충 {n}', '예쁜 줄 알았는데 {n이} 입을 벌리고 덥석'),
  ult: wm('zone', (P, S) => [{ t: 'zone', dmg: 3 * P, r: 50, dur: 5, at: 'target', st: SV(S, 'sleep', 1.2) }, { t: 'spiral', dmg: 5 * P, n: 20, speed: 190 }, { t: 'heal', amt: 22 }], '{n} 만개|꽃가루 알레르기', '{n이} 활짝 피고 꽃가루가 날려 모두 졸리고 재채기'),
}, { st: 'sleep', style: 'healer', passive: 'regen', title: '꽃길만 걷자|알레르기 유발자', look: { aura: 'leaf', hair: '#ff9ad0' } });

wfam('cactus', 'plant', '선인장 가시 고슴도치 밤송이 엉겅퀴 장미가시 바늘 압정밭', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 4 * P, n: 4, spread: 40, speed: 260, size: 1, st: SV(S, 'weak', 0.4) }], '{n} 발사|따끔따끔', '{n을} 사방으로 퉁퉁 쏜다'),
  s1: wm('spikering', (P, S) => [{ t: 'spikering', dmg: 11 * P, r: 32, n: 12, at: 'self', kb: 6, st: SV(S, 'weak', 1) }], '{n} 부풀리기|건드리지 마', '몸에서 {n이} 동그랗게 솟는다'),
  s2: wm('buff', () => [{ t: 'buff', k: 'armor', d: 4 }, { t: 'buff', k: 'counter', d: 1.5 }], '{n} 갑옷|찔리면 아파', '{n} 갑옷을 두른다. 때리는 쪽이 아프다'),
  ult: wm('spikering', (P, S) => [{ t: 'spikering', dmg: 12 * P, r: 50, n: 14, at: 'target', kb: 7, st: SV(S, 'weak', 1.4) }, { t: 'spiral', dmg: 5 * P, n: 22, speed: 220 }], '{n} 지옥|천 개의 {n}', '적 주위에 {n이} 솟고 사방으로 {n이} 쏟아진다'),
}, { st: 'weak', style: 'tank', passive: 'thorns', title: '만지지 마세요|따끔 장인', look: { body: '#3a7a3a' } });

wfam('sky', 'holy', '태양 해님 햇빛 햇살 달 달빛 보름달 초승달 별 별빛 별똥별 유성 은하수 오로라 무지개 노을 일식 월식', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 260, size: 2, pierce: true, st: SX(S, 0.4) }], '{n} 조각|반짝', '{n} 조각이 반짝이며 날아간다'),
  s1: wm('prism', (P, S) => [{ t: 'prism', dmg: 4 * P, len: 170, w: 5, spread: 24, ticks: 2, dur: 0.5, st: SV(S, 'confuse', 0.8) }], '{n}빛 세 갈래|분광', '{n}빛이 세 갈래로 갈라져 내리쬔다'),
  s2: wm('storm', (P, S) => [{ t: 'storm', dmg: 6 * P, n: 7, r: 40, st: SV(S, 'stun', 0.4) }], '{n} 소나기|별똥별 낙하', '적 주변에 {n이} 우수수 떨어진다'),
  ult: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 15 * P, n: 6, delay: 0.8, kb: 4, st: SV(S, 'stun', 1.2) }, { t: 'meteor', dmg: 22 * P, r: 40, kb: 8 }], '{n}의 심판|하늘이 열린다', '하늘에서 {n}빛이 바둑판처럼 내려꽂히고 마지막에 쾅'),
}, { st: 'stun', style: 'beamer', passive: 'aura', title: '하늘을 품은 자|반짝반짝', look: { aura: 'star' } });

wfam('weather', 'wind', '날씨 장마 소나기 폭우 우박 눈보라 폭설 함박눈 진눈깨비 태풍 토네이도 허리케인 회오리바람 돌풍 미세먼지 황사 안개 천둥번개 먹구름 구름', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 3, spread: 30, speed: 220, size: 1, from: 'sky', st: SX(S, 0.4) }], '{n} 한 줌|톡톡', '적 머리 위로 {n이} 톡톡 떨어진다'),
  s1: wm('tornado', (P, S) => [{ t: 'tornado', dmg: 4 * P, r: 16, speed: 90, life: 3, st: SV(S, 'confuse', 0.8) }], '{n} 회오리|빙글빙글', '{n} 회오리를 만들어 보낸다'),
  s2: wm('storm', (P, S) => [{ t: 'storm', dmg: 6 * P, n: 8, r: 44, st: SV(S, 'stun', 0.5) }], '{n} 경보|천둥 번개', '적 주변에 번개가 연달아 내리친다'),
  ult: wm('tornado', (P, S) => [{ t: 'tornado', dmg: 6 * P, r: 26, speed: 60, life: 4.5, st: SV(S, 'confuse', 1.2) }, { t: 'storm', dmg: 6 * P, n: 10, r: 60 }, { t: 'zone', dmg: 2 * P, r: 60, dur: 4, at: 'target', st: { k: 'slow', d: 1 } }], '{n} 대재앙|기상청 오보', '기상청도 몰랐다! 거대 회오리, 번개, 폭우가 한꺼번에'),
}, { st: 'confuse', style: 'flyer', passive: 'swift', title: '날씨 요정|기상 캐스터', look: { aura: 'wind' } });

wfam('ocean', 'water', '바다 파도 쓰나미 해일 밀물 썰물 소용돌이 물보라 폭포 강 호수 시냇물 계곡 홍수 수영장 워터파크 물풍선 물총싸움', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 14, speed: 230, size: 2, st: SV(S, 'slip', 0.4) }], '{n} 물방울|첨벙', '{n} 물방울을 쏜다'),
  s1: wm('surge', (P, S) => [{ t: 'surge', dmg: 12 * P, w: 70, len: 170, speed: 170, kb: 9, st: SV(S, 'slip', 1) }], '{n} 파도타기|밀려온다', '{n이} 벽처럼 밀려온다'),
  s2: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 38, dur: 3.5, pull: 11, at: 'target', st: SV(S, 'slow', 1) }], '{n} 소용돌이|빙글빙글 빠져라', '적 발밑에 {n} 소용돌이가 생긴다'),
  ult: wm('surge', (P, S) => [{ t: 'surge', dmg: 16 * P, w: 120, len: 240, speed: 160, kb: 10, st: SV(S, 'slip', 1.5) }, { t: 'storm', dmg: 6 * P, n: 6, r: 50 }], '{n} 대해일|쓰나미 경보', '집채만 한 해일이 맵 전체를 덮친다'),
}, { st: 'slip', style: 'artillery', passive: 'regen', title: '바다의 주인|파도 장인', look: { aura: 'bubble' } });

wfam('ice2', 'ice', '눈사람 눈덩이 눈싸움 고드름 빙하 빙산 얼음성 얼음왕국 북극 남극 에스키모 이글루 겨울왕국 엘사 설인 예티 아이스', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 240, size: 3, st: SV(S, 'slow', 0.6) }], '{n} 던지기|눈덩이 퍽', '꽁꽁 뭉친 눈덩이를 던진다'),
  s1: wm('roll', (P, S) => [{ t: 'roll', dmg: 13 * P, size: 11, speed: 150, life: 2.4, bounce: 2, kb: 8, st: SV(S, 'freeze', 1) }], '{n} 굴리기|점점 커진다', '굴릴수록 커지는 눈덩이를 보낸다'),
  s2: wm('pillar', (P, S) => [{ t: 'pillar', dmg: 9 * P, n: 6, step: 20, r: 10, lift: false, kb: 2, st: SV(S, 'freeze', 0.8) }], '{n} 얼음 기둥|얼음길', '앞으로 얼음 기둥이 줄줄이 솟는다'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 11 * P, n: 9, step: 20, r: 12, st: SV(S, 'freeze', 1.2) }, { t: 'zone', dmg: 2 * P, r: 60, dur: 4, at: 'target', st: { k: 'slip', d: 1 } }, { t: 'meteor', dmg: 20 * P, r: 40, kb: 8 }], '{n} 왕국|다 얼어붙어라', '고드름이 일렬로 꽂히고 거대 얼음덩이가 떨어진다'),
}, { st: 'freeze', style: 'trickster', passive: 'armor', title: '겨울왕국 주인|꽁꽁 장인', look: { aura: 'frost', body: '#7fd8ff' } });

/* ===== 몸 ===== */
wfam('body', 'power', '주먹 손바닥 손가락 꿀밤 딱밤 박치기 이마 엉덩이 엉덩방아 똥침 발바닥 발가락 무릎 팔꿈치 어깨 배치기 뱃살 근육 이빨 손톱 발톱 혀 콧김 눈빛 눈싸움', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 5 * P, len: 32, w: 7, n: 2, kb: 4, st: SX(S, 0.4) }], '{n} 공격|{n} 연타', '{n으로} 빠르게 두 번'),
  s1: wm('dash', (P, S) => [{ t: 'dash', dist: 90, dmg: 12 * P, kb: 9, st: SV(S, 'stun', 0.8) }], '{n} 돌진|{n} 들이밀기', '{n을} 앞세우고 돌진한다'),
  s2: wm('grab', (P, S) => [{ t: 'grab', dmg: 12 * P, r: 16, range: 130, delay: 0.3, kb: 8, st: SV(S, 'stun', 0.6) }], '{n} 잡아끌기|이리 와', '붙잡아서 내 앞으로 끌어당긴다'),
  ult: wm('leap', (P, S) => [{ t: 'leap', dmg: 28 * P, r: 36, dist: 130, kb: 10, st: SV(S, 'stun', 1.3) }, { t: 'stomp', dmg: 8 * P, n: 2, r: 30 }], '필살 {n} 찍기|궁극의 {n}', '하늘 높이 뛰어 {n으로} 내려찍는다'),
}, { st: 'stun', style: 'brawler', passive: 'rage', title: '맨몸 격투가|몸이 무기' });

wfam('fart', 'stink', '방귀 뿡 뽀옹 뿌웅 방구 방귀대장 가스 똥방귀 소리방귀 소리없는방귀', {
  basic: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 1, len: 70, arc: 70, kb: 4, st: SV(S, 'poison', 0.4) }], '{n} 한 방|뿡', '뿡! 음파와 냄새가 동시에 퍼진다'),
  s1: wm('zone', (P, S) => [{ t: 'zone', dmg: 3 * P, r: 34, dur: 4, at: 'self', st: SV(S, 'poison', 1) }, { t: 'dash', dist: 90, dmg: 0, invuln: true }], '{n} 추진|제트 엔진', '{n}의 힘으로 슈웅 날아가고 뒤엔 냄새가 남는다'),
  s2: wm('bubble', (P) => [{ t: 'bubble', dmg: 4 * P, n: 2, speed: 110, size: 4, d: 1.1 }], '{n} 방울|초록 거품', '초록색 {n} 방울에 갇혀 둥둥 뜬다'),
  ult: wm('stomp', (P, S) => [{ t: 'stomp', dmg: 10 * P, n: 4, r: 34, kb: 8, st: SV(S, 'poison', 1.5) }, { t: 'zone', dmg: 3 * P, r: 60, dur: 5, at: 'self', st: { k: 'confuse', d: 1 } }], '{n} 대폭발|화생방 경보', '뿡! 뿡! 뿡! 뿌아앙!! 점점 커지는 폭발과 독가스'),
}, { st: 'poison', style: 'polluter', passive: 'thorns', title: '화생방 주의|방귀 대장', look: { aura: 'toxic' } });

wfam('poop', 'gross', '똥 응가 대변 설사 변비 똥덩어리 개똥 새똥 소똥 변기 화장실 푸세식 휴지 비데', {
  basic: wm('lob', (P, S) => [{ t: 'lob', dmg: 7 * P, r: 14, n: 1, kb: 3, st: SV(S, 'poison', 0.6) }], '{n} 투척|퍽', '{n을} 던진다. 어디서 났는지 묻지 마라'),
  s1: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 9 * P, n: 6, step: 20, r: 10, st: SV(S, 'poison', 1) }], '새{n} 폭격|하늘에서 {n}', '비둘기 떼가 일렬로 {n을} 떨어뜨린다'),
  s2: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 36, dur: 3, pull: 12, at: 'target', st: SV(S, 'confuse', 1) }], '{n} 물 내리기|쏴아아', '변기 물 내리듯 빨려 들어간다'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 30 * P, r: 46, kb: 9, st: SV(S, 'poison', 1.5) }, { t: 'zone', dmg: 3 * P, r: 56, dur: 5, at: 'target', st: { k: 'slow', d: 1 } }], '하늘에서 거대 {n}|역대급 {n}', '하늘에서 산만 한 {n이} 떨어진다. 냄새는 보너스'),
}, { st: 'poison', style: 'polluter', passive: 'thorns', title: '화장실 지박령|냄새 테러범', look: { aura: 'toxic', body: '#7a5a2a' } });

wfam('snot', 'gross', '콧물 코딱지 침 가래 트림 딸꾹질 재채기 기침 하품 땀 발냄새 겨드랑이 비듬 귀지 눈곱 여드름 피지', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 240, size: 2, st: SV(S, 'slow', 0.5) }], '{n} 튕기기|퉤', '{n을} 손가락으로 튕긴다'),
  s1: wm('cone', (P, S) => [{ t: 'cone', dmg: 3 * P, len: 80, arc: 60, dur: 0.6, ticks: 4, kb: 4, st: SV(S, 'confuse', 0.8) }], '{n} 분사|에취!!', '에에에… 취!!! 앞으로 넓게 뿜어진다'),
  s2: wm('zone', (P, S) => [{ t: 'zone', dmg: 2 * P, r: 30, dur: 4, at: 'target', st: SV(S, 'slip', 1) }], '{n} 웅덩이|끈적끈적', '바닥에 {n} 웅덩이가 생긴다. 미끌'),
  ult: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 6 * P, n: 4, len: 160, arc: 120, kb: 6, st: SV(S, 'confuse', 1.4) }, { t: 'storm', dmg: 5 * P, n: 8, r: 54 }], '{n} 대폭발|감기 걸린 날', '감기 걸린 날의 연속 재채기. 사방에 다 튄다'),
}, { st: 'slow', style: 'polluter', passive: 'regen', title: '위생 불량|감기 대장' });

/* ===== 돈·물건 ===== */
wfam('money2', 'money', '돈 지폐 동전 금화 은화 금괴 금덩이 다이아몬드 다이아 보석 루비 에메랄드 사파이어 수표 카드 신용카드 비트코인 코인 주식 로또 복권 용돈 세뱃돈 월급 보너스 통장 저금통', {
  basic: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 2 * P, n: 8, spread: 24, st: SX(S, 0.3) }], '{n} 뿌리기|플렉스', '{n을} 흩뿌린다. 맞으면 아프다'),
  s1: wm('spiral', (P, S) => [{ t: 'spiral', dmg: 4 * P, n: 14, speed: 200, st: SV(S, 'confuse', 0.5) }], '{n} 회오리|돈다발 폭풍', '{n이} 빙글빙글 사방으로 흩날린다'),
  s2: wm('mark', (P, S) => [{ t: 'mark', dmg: 18 * P, r: 18, delay: 1, range: 200, kb: 6, st: SV(S, 'heavy', 1) }], '{n} 청구서|세금 고지서', '적에게 청구서를 붙인다. 잠시 후 정신적 폭발'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 32 * P, r: 46, kb: 10, st: SV(S, 'heavy', 1.5) }, { t: 'skyline', dmg: 9 * P, n: 8, step: 20, r: 11 }, { t: 'gatling', dmg: 2 * P, n: 12, spread: 40 }], '{n} 비가 내려요|재벌 플렉스', '하늘에서 금고와 {n이} 쏟아진다'),
}, { st: 'heavy', style: 'artillery', passive: 'crit', title: '건물주|플렉스 장인', look: { aura: 'star', outfit: 'suit', head: 'crown' } });

wfam('book', 'magic', '책 마법책 동화책 만화책 소설 일기장 사전책 백과사전 성경 교과서책 웹툰 만화 도서관', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 20, speed: 220, size: 2, st: SX(S, 0.4) }], '{n} 페이지 날리기|종이 표창', '{n} 페이지를 찢어서 표창처럼 날린다'),
  s1: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 10 * P, n: 4, delay: 0.7, kb: 2, st: SV(S, 'sleep', 1) }], '{n} 밑줄 긋기|형광펜 공격', '적 주변에 밑줄이 쫙쫙 그어지고 지식이 폭발'),
  s2: wm('summon', (P, S) => [{ t: 'summon', kind: 'chaser', n: 2, dmg: 8 * P, dur: 6, st: SX(S, 1) }], '{n} 속 주인공 소환|튀어나와라', '{n} 속 주인공이 튀어나와 달려간다'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 32 * P, r: 48, kb: 10, st: SV(S, 'sleep', 1.5) }, { t: 'storm', dmg: 6 * P, n: 8, r: 56 }], '천 페이지 {n} 낙하|지식의 무게', '하늘에서 두께 1미터짜리 {n이} 떨어진다'),
}, { st: 'sleep', style: 'trickster', passive: 'aura', title: '도서관 지박령|만물박사', look: { weapon: 'book', outfit: 'robe' } });

wfam('phone2', 'sound', '알람 알람시계 자명종 초인종 벨소리 전화벨 카톡 카톡알림 진동 확성기 호루라기 경적 사이렌소리 종 종소리 방송', {
  basic: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 1, len: 90, arc: 70, kb: 2, st: SV(S, 'confuse', 0.4) }], '{n} 울리기|띠리리링', '{n} 소리가 부채꼴로 퍼진다'),
  s1: wm('beacon', (P, S) => [{ t: 'beacon', dmg: 4 * P, r: 40, rate: 0.7, dur: 5, kb: 5, st: SV(S, 'confuse', 0.8) }], '{n} 설치|5분 뒤 다시 알림', '{n을} 놓아두면 계속 울린다. 끌 수 없다'),
  s2: wm('mark', (P, S) => [{ t: 'mark', dmg: 16 * P, r: 18, delay: 1, range: 200, kb: 5, st: SV(S, 'stun', 0.8) }], '{n} 예약|아침 7시 정각', '적에게 알람을 맞춘다. 정각에 펑'),
  ult: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 6 * P, n: 4, len: 180, arc: 160, kb: 6, st: SV(S, 'stun', 1.2) }, { t: 'all', dmg: 4 * P, st: { k: 'confuse', d: 1.2 } }], '월요일 아침 {n}|단체 기상', '월요일 아침 알람 백 개가 동시에 울린다'),
}, { st: 'confuse', style: 'idol', passive: 'swift', title: '월요일 아침|기상 알람' });

/* ===== 감정·상태 ===== */
wfam('rage', 'power', '분노 빡침 짜증 화남 열받음 성질 버럭 폭주 광기 흑화 각성 버서커', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 9 * P, r: 22, arc: 130, kb: 6, st: SX(S, 0.5) }], '{n} 후리기|버럭', '버럭! 크게 후려친다'),
  s1: wm('stomp', (P, S) => [{ t: 'stomp', dmg: 10 * P, n: 3, r: 26, kb: 7, st: SV(S, 'stun', 0.6) }], '{n} 발 구르기|분노 게이지', '분해서 발을 쿵쿵쿵 구른다'),
  s2: wm('buff', () => [{ t: 'buff', k: 'power', d: 4 }, { t: 'buff', k: 'haste', d: 4 }, { t: 'buff', k: 'giant', d: 3 }], '{n} 폭발|참을 인 세 번 실패', '참을 인 자 세 번이 다 깨졌다. 커지고 세진다'),
  ult: wm('flurry', (P, S) => [{ t: 'dash', dist: 100, dmg: 10 * P, kb: 6 }, { t: 'flurry', dmg: 6 * P, r: 32, off: 0, dur: 1.2, ticks: 10, st: SV(S, 'stun', 1) }, { t: 'stomp', dmg: 10 * P, n: 2, r: 34 }], '{n} 대폭주|이성 상실', '이성을 잃고 열 번 때리고 땅까지 구른다'),
}, { st: 'stun', style: 'brawler', passive: 'rage', title: '분노 조절 실패|참을 인 0개' });

wfam('love2', 'love', '사랑 하트 뽀뽀 키스 포옹 연애 짝사랑 고백 첫사랑 썸 애교 윙크 손하트 러브레터 커플 큐피드화살 결혼 웨딩', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 16, speed: 210, size: 2, homing: 0.4, st: SV(S, 'dance', 0.3) }], '{n} 발사|뿅', '{n이} 뿅뿅 날아간다'),
  s1: wm('ring', (P, S) => [{ t: 'ring', dmg: 4 * P, r: 30, dur: 3.5, at: 'target', st: SV(S, 'dance', 1) }], '{n} 감옥|너만 보여', '적 주위에 {n} 고리를 친다. 나오면 설렌다'),
  s2: wm('drain', (P, S) => [{ t: 'drain', dmg: 3 * P, range: 130, dur: 2, ticks: 7, heal: 4, st: SV(S, 'dance', 0.6) }], '{n} 에너지 흡수|설렘 충전', '설렘을 쭉쭉 빨아온다'),
  ult: wm('all', (P, S) => [{ t: 'all', dmg: 5 * P, st: SV(S, 'dance', 1.8) }, { t: 'storm', dmg: 6 * P, n: 8, r: 56 }, { t: 'heal', amt: 22 }], '{n} 대폭발|고백 공격', '공개 고백! 모두가 춤추고 하트가 쏟아진다'),
}, { st: 'dance', style: 'healer', passive: 'regen', title: '사랑꾼|고백 장인', look: { aura: 'star', hair: '#ff8ab0' } });

wfam('sleepy', 'sleep', '잠 낮잠 꿀잠 졸음 하품쟁이 잠꾸러기 침대귀신 이불밖은위험해 늦잠 수면 숙면 코골이 잠옷파티 꿈 악몽 몽유병', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 4 * P, n: 1, speed: 160, size: 3, homing: 0.4, st: SV(S, 'sleep', 0.5) }], '{n} 방울|쿨쿨', '말풍선 Zzz가 둥실 날아간다'),
  s1: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 3 * P, n: 3, len: 120, arc: 100, st: SV(S, 'sleep', 1) }], '{n} 코골이|드르렁', '드르렁! 코골이가 퍼진다. 졸리다'),
  s2: wm('net', (P) => [{ t: 'net', dmg: 4 * P, speed: 200, range: 150, r: 18, d: 2 }], '이불 덮어씌우기|{n} 감옥', '이불을 확 덮어씌운다. 나갈 수 없다'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 28 * P, r: 46, kb: 8, st: SV(S, 'sleep', 2) }, { t: 'all', dmg: 3 * P, st: { k: 'sleep', d: 1.6 } }], '하늘에서 침대|다 같이 {n}', '하늘에서 거대한 침대가 떨어진다. 다 같이 잔다'),
}, { st: 'sleep', style: 'lazy', passive: 'regen', title: '이불 밖은 위험해|수면 장인', look: { head: 'hood' } });

wfam('time2', 'time', '시간 시계 타임머신 되감기 일시정지 정지버튼 빨리감기 모래시계 타이머 초시계 스톱워치 과거 미래 시간여행', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 230, size: 2, st: SV(S, 'slow', 0.6) }], '{n} 바늘|째깍', '시계 바늘을 던진다'),
  s1: wm('ring', (P, S) => [{ t: 'ring', dmg: 4 * P, r: 32, dur: 3, at: 'target', st: SV(S, 'freeze', 1) }], '{n} 정지 구역|일시정지', '적 주위의 {n이} 멈춘다. 벗어나면 굳는다'),
  s2: wm('blink', () => [{ t: 'blink', to: 'back', dist: 90 }, { t: 'heal', amt: 16 }, { t: 'buff', k: 'haste', d: 3 }], '{n} 되감기|5초 전으로', '5초 전으로 돌아간다. 다친 것도 되돌린다'),
  ult: wm('all', (P, S) => [{ t: 'all', dmg: 5 * P, st: SV(S, 'freeze', 1.6) }, { t: 'clone', dmg: 12 * P, n: 2, r: 18, dur: 4 }, { t: 'mark', dmg: 16 * P, r: 20, delay: 1.2, range: 220 }], '{n} 정지|더 월드', '시간이 멈춘다! 그 사이에 분신을 보내고 폭탄을 붙인다'),
}, { st: 'freeze', style: 'trickster', passive: 'dodge', title: '시간 도둑|지각 안 하는 자' });

wfam('space2', 'space', '우주 은하 블랙홀 화이트홀 웜홀 행성 지구 화성 목성 토성 명왕성 태양계 성운 초신성 중력 무중력 운석 소행성 혜성', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 220, size: 3, homing: 0.3, st: SV(S, 'heavy', 0.4) }], '{n} 구슬|작은 {n}', '손바닥만 한 {n을} 던진다'),
  s1: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 40, dur: 3, pull: 13, at: 'target', st: SV(S, 'heavy', 1) }], '{n} 중력장|빨려 들어가', '{n} 중력이 모든 걸 끌어당긴다'),
  s2: wm('hop', (P, S) => [{ t: 'hop', dmg: 10 * P, n: 3, r: 22, size: 9, kb: 6, st: SV(S, 'heavy', 0.8) }], '{n} 튕기기|행성 볼링', '{n이} 통통 튀며 짓누른다'),
  ult: wm('meteor', (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 56, dur: 2, pull: 14, at: 'target', st: { k: 'heavy', d: 1.5 } }, { t: 'meteor', dmg: 34 * P, r: 48, kb: 10, st: SV(S, 'stun', 1.4) }, { t: 'storm', dmg: 6 * P, n: 8, r: 60 }], '{n} 충돌|빅뱅', '모두 끌어모은 뒤 {n이} 충돌한다. 빅뱅'),
}, { st: 'heavy', style: 'gravity', passive: 'aura', title: '우주의 먼지|은하 정복자', look: { aura: 'star', cape: true } });

wfam('holiday', 'sweet', '크리스마스 산타 산타클로스 루돌프썰매 선물 선물상자 트리 할로윈 호박등 잭오랜턴 생일 생일케이크 파티 폭죽놀이 설날 추석 명절 어린이날 밸런타인 화이트데이', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 20, speed: 220, size: 2, bounce: 1, st: SX(S, 0.4) }], '{n} 선물 투척|깜짝 선물', '선물 상자를 던진다. 안에 뭐가 들었을까'),
  s1: wm('mark', (P, S) => [{ t: 'mark', dmg: 18 * P, r: 20, delay: 1, range: 200, kb: 6, st: SV(S, 'dance', 1) }], '{n} 서프라이즈|깜짝 파티', '리본을 붙인다. 잠시 후 깜짝 폭발과 함께 춤'),
  s2: wm('summon', (P, S) => [{ t: 'summon', kind: 'chaser', n: 3, dmg: 7 * P, dur: 6, st: SX(S, 0.8) }], '{n} 요정들|꼬마 일꾼', '꼬마 요정들이 쫓아가서 괴롭힌다'),
  ult: wm('skyline', (P, S) => [{ t: 'buff', k: 'fly', d: 3 }, { t: 'skyline', dmg: 12 * P, n: 10, step: 20, r: 12, st: SV(S, 'dance', 1.2) }, { t: 'storm', dmg: 5 * P, n: 8, r: 56 }], '{n} 대축제|선물 폭격', '썰매가 날며 선물 폭탄을 일렬로 떨어뜨린다. 폭죽까지'),
}, { st: 'dance', style: 'artillery', passive: 'regen', title: '파티 주최자|선물 배달부', look: { head: 'hat', body: '#d02a2a' } });

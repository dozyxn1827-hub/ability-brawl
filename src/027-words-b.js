/* ----- 단어 사전 2: 사람·직업·운동·탈것·무기·학교·기계 ----- */

/* ===== 사람 ===== */
wfam('mom', 'nag', '엄마 어머니 엄마손 아빠 아버지 할머니 할머니손 할아버지 이모 고모 삼촌 큰엄마 시어머니 장모님 부모님 학부모 아줌마 아저씨', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 8 * P, r: 20, arc: 110, kb: 5, st: SX(S, 0.5) }], '{n} 등짝 스매싱|찰싹', '{n}의 손바닥이 등짝에 찰싹'),
  s1: wm('grab', (P, S) => [{ t: 'grab', dmg: 12 * P, r: 16, range: 200, delay: 0.4, kb: 8, st: SV(S, 'stun', 0.8) }], '{n} 귀 잡아끌기|이리 와 봐', '어디 숨어도 소용없다. 귀를 잡혀서 끌려온다'),
  s2: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 5 * P, n: 3, len: 140, arc: 120, kb: 3, st: SV(S, 'weak', 1.2) }], '{n} 잔소리 3연발|너 몇 살이야', '"너 지금 몇 시야" "방 치웠어?" "공부는?" 연속 공격'),
  ult: wm('lob', (P, S) => [{ t: 'lob', dmg: 12 * P, r: 22, n: 4, kb: 6, st: SV(S, 'stun', 1) }, { t: 'grab', dmg: 12 * P, r: 20, range: 240, delay: 0.6, kb: 9 }, { t: 'all', dmg: 4 * P, st: { k: 'weak', d: 1.5 } }], '{n} 효자손 폭격|하나 둘 셋 할 때까지', '셋 셀 때까지 안 오면… 슬리퍼와 효자손이 날아온다'),
}, { st: 'weak', style: 'nagger', passive: 'regen', title: '우리 집 최종 보스|등짝 전문가', look: { outfit: 'plain', head: 'ponytail' } });

wfam('sibling', 'nag', '동생 남동생 여동생 형 누나 언니 오빠 쌍둥이 막내 첫째 사촌 조카 친구 절친 짝꿍 단짝', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 4 * P, len: 30, w: 5, n: 3, kb: 1, st: SX(S, 0.4) }], '{n} 꼬집기|{n} 쿡쿡', '옆구리를 쿡쿡쿡 찌른다'),
  s1: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 2, len: 120, arc: 100, st: SV(S, 'confuse', 1) }], '{n} 고자질|엄마한테 이른다', '"엄마!!! {n이} 때렸어!!!" 소리가 퍼진다'),
  s2: wm('clone', (P) => [{ t: 'clone', dmg: 10 * P, n: 2, r: 16, dur: 4 }], '{n} 패거리|우리 편 불러올게', '친구들을 불러온다. 달려가서 덮친다'),
  ult: wm('flurry', (P, S) => [{ t: 'dash', dist: 90, dmg: 8 * P, kb: 4 }, { t: 'flurry', dmg: 4 * P, r: 26, off: 0, dur: 1, ticks: 10, st: SV(S, 'confuse', 1) }], '{n} 레슬링|이불 속 대전쟁', '이불 위에서 벌어지는 형제 대전쟁. 열 번 때린다'),
}, { st: 'confuse', style: 'nagger', passive: 'crit', title: '고자질 장인|리모컨 쟁탈자' });

wfam('teacher', 'nag', '선생님 쌤 교수 교수님 교장 교장선생님 담임 담임쌤 교감 학주 학생주임 강사 일타강사 과외쌤 조교', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 280, size: 1, st: SV(S, 'stun', 0.3) }], '{n} 분필 저격|딱!', '졸면 분필이 정확히 이마로 날아온다'),
  s1: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 10 * P, n: 4, delay: 0.7, kb: 2, st: SV(S, 'sleep', 1) }], '{n} 판서 공격|칠판 가득 필기', '칠판에 줄이 쫙쫙 그어지더니 머리가 터진다'),
  s2: wm('mark', (P, S) => [{ t: 'mark', dmg: 18 * P, r: 18, delay: 1.1, range: 200, kb: 6, st: SV(S, 'weak', 1.2) }], '{n} 벌점|너 이름 뭐야', '이름 적혔다. 잠시 후 벌점 폭발'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 12 * P, n: 9, step: 20, r: 12, st: SV(S, 'sleep', 1.2) }, { t: 'all', dmg: 4 * P, st: { k: 'sleep', d: 1.5 } }], '{n} 기말고사|시험지 폭탄', '시험지가 일렬로 쏟아지고 모두 졸음이 쏟아진다'),
}, { st: 'sleep', style: 'nagger', passive: 'armor', title: '교무실의 주인|벌점 수집가', look: { outfit: 'suit', weapon: 'book' } });

wfam('boss', 'nag', '부장 부장님 사장 사장님 팀장 과장 대리 상사 회장 회장님 직장상사 꼰대 임원 이사님', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 3, spread: 30, speed: 220, size: 1, st: SV(S, 'weak', 0.4) }], '{n} 서류 투척|이거 다시 해 와', '수정할 서류를 휙휙 던진다'),
  s1: wm('mark', (P, S) => [{ t: 'mark', dmg: 18 * P, r: 18, delay: 1, range: 200, kb: 6, st: SV(S, 'weak', 1.4) }], '{n} 야근 지시|오늘까지 해', '야근 딱지를 붙인다. 잠시 후 정신이 폭발'),
  s2: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 5 * P, n: 3, len: 140, arc: 100, st: SV(S, 'sleep', 1) }], '{n} 회의|라떼는 말이야', '"라떼는 말이야…" 세 시간짜리 회의가 시작된다'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 13 * P, n: 9, step: 20, r: 12, st: SV(S, 'heavy', 1.2) }, { t: 'mark', dmg: 14 * P, r: 20, delay: 1.2, range: 240 }], '{n} 결재 폭탄|주말 출근', '서류 더미가 줄줄이 떨어지고 주말 출근 딱지까지'),
}, { st: 'weak', style: 'nagger', passive: 'armor', title: '야근 제조기|라떼 장인', look: { outfit: 'suit' } });

wfam('police', 'tech', '경찰 경찰관 순경 형사 경찰차 사이렌 특공대 swat 보안관 경비원 경호원 탐정 셜록', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 300, size: 1, st: SX(S, 0.4) }], '{n} 테이저|정지!', '정지! 테이저를 쏜다'),
  s1: wm('net', (P) => [{ t: 'net', dmg: 6 * P, speed: 260, range: 170, r: 18, d: 2 }], '{n} 체포|수갑 채우기', '그물 수갑을 던져 그 자리에 묶는다'),
  s2: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 3, len: 150, arc: 120, kb: 3, st: SV(S, 'stun', 0.6) }], '{n} 사이렌|삐뽀삐뽀', '삐뽀삐뽀 사이렌이 고막을 때린다'),
  ult: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 14 * P, n: 6, delay: 0.7, kb: 3, st: SV(S, 'root', 1.2) }, { t: 'stampede', dmg: 10 * P, n: 3, speed: 260, len: 260, size: 10, kb: 8 }], '{n} 포위망|완전 포위됐다', '레이저 포위망이 쳐지고 순찰차가 들이닥친다'),
}, { st: 'stun', style: 'gunner', passive: 'armor', title: '정의의 사도|사이렌 장인', look: { head: 'cap', outfit: 'suit', body: '#1a2a5a' } });

wfam('firefighter', 'water', '소방관 소방차 소화기 소방호스 119 구조대 구급차 응급차', {
  basic: wm('cone', (P, S) => [{ t: 'cone', dmg: 2 * P, len: 70, arc: 30, dur: 0.5, ticks: 3, kb: 4, st: SV(S, 'slip', 0.5) }], '{n} 물대포|촤악', '호스로 물을 촤악 뿌린다'),
  s1: wm('surge', (P, S) => [{ t: 'surge', dmg: 11 * P, w: 60, len: 160, speed: 180, kb: 9, st: SV(S, 'slip', 1) }], '{n} 고압 살수|밀어내기', '고압 물줄기가 벽처럼 밀고 나간다'),
  s2: wm('zone', (P) => [{ t: 'zone', dmg: 0, r: 34, dur: 4, at: 'self', heal: 4, st: { k: 'slow', d: 1 } }, { t: 'buff', k: 'shield', d: 3, pow: 20 }], '{n} 구조 작전|소화기 분사', '하얀 소화기 가루를 뿌리고 나는 치료받는다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 14 * P, n: 2, speed: 260, len: 280, size: 13, kb: 10, st: SV(S, 'slip', 1.2) }, { t: 'storm', dmg: 6 * P, n: 6, r: 50 }], '{n} 출동|삐뽀삐뽀 대출동', '{n} 두 대가 사이렌을 울리며 밀고 들어온다'),
}, { st: 'slip', style: 'artillery', passive: 'armor', title: '불 끄는 영웅|물대포 장인', look: { head: 'helmet', body: '#c02a2a' } });

wfam('doctor', 'holy', '의사 간호사 의사선생님 수술 !주사 주사기 백신 병원 약사 치과 치과의사 한의사 수의사 응급실', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 6 * P, len: 40, w: 3, n: 1, kb: 1, st: SV(S, 'sleep', 0.5) }], '{n} 주사|따끔합니다~', '"따끔합니다~" 주사를 콕'),
  s1: wm('drain', (P, S) => [{ t: 'drain', dmg: 3 * P, range: 130, dur: 2, ticks: 7, heal: 4, st: SV(S, 'weak', 0.6) }], '{n} 채혈|피 좀 뽑을게요', '혈액 검사라며 피를 쭉 뽑아 간다'),
  s2: wm('heal', (P) => [{ t: 'heal', amt: 26 }, { t: 'buff', k: 'regen', d: 4 }], '{n} 응급처치|빨간약', '빨간약 바르고 밴드 붙이면 다 낫는다'),
  ult: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 14 * P, n: 5, delay: 0.7, kb: 2, st: SV(S, 'sleep', 1.5) }, { t: 'heal', amt: 18 }], '{n} 대수술|마취 들어갑니다', '수술 레이저가 그어지고 전원 마취에 빠진다'),
}, { st: 'sleep', style: 'healer', passive: 'regen', title: '주사 장인|따끔합니다', look: { outfit: 'robe', body: '#f0f6ff' } });

wfam('chef', 'food', '요리사 셰프 주방장 백종원 고든램지 요리 주방 칼질 프라이팬 후라이팬 냄비 국자 뒤집개 도마', {
  basic: wm('claw', (P, S) => [{ t: 'claw', dmg: 4 * P, r: 24, kb: 1, st: SX(S, 0.4) }], '{n} 채썰기|다다다닥', '눈에 보이지 않는 속도로 채를 썬다'),
  s1: wm('swing', (P, S) => [{ t: 'swing', dmg: 12 * P, r: 22, arc: 120, kb: 7, st: SV(S, 'stun', 0.8) }], '{n} 프라이팬 한 방|땡!', '프라이팬으로 땡! 별이 보인다'),
  s2: wm('lob', (P, S) => [{ t: 'lob', dmg: 10 * P, r: 22, n: 2, kb: 4, st: SV(S, 'burn', 1.2) }], '{n} 끓는 냄비|뜨거운 국물', '펄펄 끓는 냄비를 던진다'),
  ult: wm('flurry', (P, S) => [{ t: 'flurry', dmg: 5 * P, r: 32, off: 20, dur: 1, ticks: 10, st: SV(S, 'burn', 1) }, { t: 'cone', dmg: 5 * P, len: 90, arc: 60, dur: 0.8, ticks: 5, st: { k: 'burn', d: 1.5 } }], '{n} 불쇼|웍 플레이 마스터', '칼질 열 번, 그리고 프라이팬에서 불기둥이 치솟는다'),
}, { st: 'burn', style: 'glutton', passive: 'regen', title: '미슐랭 3스타|불쇼 장인', look: { head: 'hat', body: '#f6f6f6', weapon: 'hammer' } });

wfam('delivery', 'speed', '택배 택배기사 배달 배달부 배달원 퀵서비스 우체부 집배원 배민 쿠팡 로켓배송 새벽배송', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 260, size: 3, st: SX(S, 0.4) }], '{n} 상자 투척|문 앞 배송', '상자를 문 앞… 아니 얼굴 앞에 던진다'),
  s1: wm('dash', (P) => [{ t: 'dash', dist: 140, dmg: 10 * P, kb: 7, invuln: true }, { t: 'buff', k: 'haste', d: 3 }], '{n} 질주|30분 안에 도착', '오토바이를 타고 미친 듯이 질주한다'),
  s2: wm('mark', (P, S) => [{ t: 'mark', dmg: 18 * P, r: 18, delay: 1, range: 220, kb: 6, st: SX(S, 1) }], '{n} 도착 예정|부재중 스티커', '도착 예정 스티커를 붙인다. 곧 펑'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 12 * P, n: 9, step: 20, r: 12, st: SV(S, 'heavy', 1.2) }, { t: 'stampede', dmg: 10 * P, n: 3, speed: 280, len: 260, size: 9, kb: 8 }], '{n} 폭탄 세일|명절 물량', '명절 택배 물량이 일렬로 쏟아지고 트럭이 돌진한다'),
}, { st: 'heavy', style: 'speedster', passive: 'swift', title: '총알 배송|문 앞 장인', look: { head: 'cap' } });

wfam('pirate', 'water', '해적 해적선 선장 캡틴 해군 바이킹 해적왕 갈고리 보물선 해골깃발', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 8 * P, r: 22, arc: 110, kb: 4, st: SX(S, 0.5) }], '{n} 칼질|요호호', '휘어진 칼로 크게 벤다'),
  s1: wm('hook', (P, S) => [{ t: 'hook', dmg: 8 * P, speed: 300, range: 160, st: SX(S, 0.6) }], '{n} 갈고리|이리 와라', '갈고리를 던져 끌고 온다'),
  s2: wm('lob', (P, S) => [{ t: 'lob', dmg: 14 * P, r: 24, n: 2, kb: 7, st: SV(S, 'stun', 0.8) }], '{n} 대포|발사!', '배에서 대포알을 쏜다'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 13 * P, n: 9, step: 22, r: 13, st: SV(S, 'stun', 1) }, { t: 'stampede', dmg: 9 * P, n: 6, speed: 220, len: 240, size: 7, kb: 6 }], '{n} 일제 사격|전원 돌격', '배의 대포가 일렬로 불을 뿜고 선원들이 돌격한다'),
}, { st: 'stun', style: 'artillery', passive: 'crit', title: '바다의 무법자|보물 사냥꾼', look: { head: 'hat', cape: true, weapon: 'sword' } });

wfam('cowboy', 'metal', '카우보이 총잡이 갱스터 마피아 건맨 서부 무법자 사냥꾼 저격수 스나이퍼 명사수 저격 스나이핑', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 7 * P, n: 1, speed: 320, size: 1, st: SX(S, 0.4) }], '{n} 퀵드로우|빵!', '허리춤에서 빛보다 빨리 뽑아 쏜다'),
  s1: wm('hook', (P, S) => [{ t: 'hook', dmg: 6 * P, speed: 300, range: 170, st: SV(S, 'root', 0.8) }], '{n} 올가미|이랴!', '올가미를 휙 던져 끌고 온다'),
  s2: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 3 * P, n: 6, spread: 30, st: SX(S, 0.4) }], '{n} 난사|여섯 발 다', '여섯 발을 한 번에 쏟아붓는다'),
  ult: wm('snipe', (P, S) => [{ t: 'snipe', dmg: 42 * P, delay: 0.7, kb: 9, st: SV(S, 'stun', 1.4) }], '{n} 하이눈|정오의 결투', '시계가 열두 시를 친다… 탕!'),
}, { st: 'stun', style: 'gunner', passive: 'crit', title: '서부의 전설|정오의 결투자', look: { head: 'hat', weapon: 'gun' } });

wfam('knight', 'metal', '기사 전사 검사 사무라이 무사 검객 스파르타 장군 병사 군인 용병 성기사 팔라딘 기사단 로마군 글래디에이터 검투사', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 8 * P, r: 22, arc: 120, n: 1, kb: 4, st: SX(S, 0.5) }], '{n} 베기|{n}의 일격', '{n}답게 크게 벤다'),
  s1: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 12 * P, len: 60, w: 7, n: 1, kb: 7, st: SV(S, 'vuln', 1) }], '{n} 찌르기|돌격 찌르기', '방패를 앞세우고 길게 찌른다'),
  s2: wm('counter', () => [{ t: 'buff', k: 'counter', d: 1.6 }, { t: 'buff', k: 'shield', d: 3, pow: 25 }], '{n} 방패 막기|패링', '방패를 들고 버틴다. 맞는 순간 되받아친다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 12 * P, n: 6, speed: 220, len: 260, size: 8, kb: 8, st: SV(S, 'stun', 1) }, { t: 'swing', dmg: 14 * P, r: 34, arc: 360, kb: 8 }], '{n}단 돌격|전군 돌격하라', '"돌격하라!!" 군대가 우르르 몰려오고 나는 한 바퀴 벤다'),
}, { st: 'vuln', style: 'brawler', passive: 'armor', title: '왕국의 검|돌격대장', look: { head: 'helmet', outfit: 'armor', weapon: 'sword', cape: true } });

wfam('ninja', 'dark', '닌자 암살자 자객 도둑 괴도 스파이 첩자 시노비 쿠노이치 그림자무사 표창 수리검', {
  basic: wm('spiral', (P, S) => [{ t: 'shot', dmg: 4 * P, n: 3, spread: 24, speed: 300, size: 1, st: SX(S, 0.4) }], '{n} 표창|슈슈슉', '표창 세 개를 부채꼴로 던진다'),
  s1: wm('phantom', (P, S) => [{ t: 'phantom', dmg: 16 * P, dist: 120, st: SV(S, 'vuln', 1) }], '{n} 순보|이미 늦었다', '이미 지나갔다. 0.3초 뒤에 칼자국이 터진다'),
  s2: wm('clone', (P) => [{ t: 'buff', k: 'invis', d: 2 }, { t: 'clone', dmg: 10 * P, n: 2, r: 16, dur: 4 }], '{n} 분신술|어느 게 진짜', '연기와 함께 사라지고 분신 둘이 덮친다'),
  ult: wm('mark', (P, S) => [{ t: 'phantom', dmg: 12 * P, dist: 130 }, { t: 'claw', dmg: 8 * P, r: 40, kb: 3 }, { t: 'mark', dmg: 22 * P, r: 22, delay: 0.8, range: 200, kb: 8, st: SV(S, 'stun', 1.2) }], '{n} 비전 오의|이미 죽어 있다', '지나가며 세 번 베고, 등에 표식을 남긴다. 잠시 후 펑'),
}, { st: 'vuln', style: 'assassin', passive: 'dodge', title: '그림자 속의 자|소리 없는 발', look: { head: 'mask', body: '#1a1a2a', weapon: 'dagger' } });

wfam('wizard', 'magic', '마법사 마녀 마술사 흑마법사 백마법사 소환사 연금술사 주술사 무당 점쟁이 마도사 대마법사 해리포터 호그와트 간달프', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 220, size: 2, homing: 0.6, st: SX(S, 0.5) }], '{n} 매직 미사일|수리수리', '반짝이는 마법탄이 휘어져 날아간다'),
  s1: wm('ring', (P, S) => [{ t: 'ring', dmg: 5 * P, r: 30, dur: 3.5, at: 'target', st: SV(S, 'morph', 1) }], '{n} 마법진|변신 결계', '적 주위에 마법진이 생긴다. 밟으면 동물로 변한다'),
  s2: wm('bubble', (P) => [{ t: 'bubble', dmg: 4 * P, n: 1, speed: 130, size: 4, d: 1.3 }, { t: 'blink', to: 'back', dist: 70 }], '{n} 부유 마법|윙가르디움 레비오사', '맞으면 둥둥 떠오른다. 나는 뒤로 순간이동'),
  ult: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 15 * P, n: 6, delay: 0.8, kb: 3, st: SV(S, 'morph', 1.5) }, { t: 'storm', dmg: 6 * P, n: 6, r: 44 }], '{n} 금지 마법|대마법 영창', '하늘에 마법진 선이 그어지고 번개와 함께 모두 개구리로'),
}, { st: 'morph', style: 'trickster', passive: 'aura', title: '마법 학교 수석|주문 장인', look: { head: 'hat', outfit: 'robe', weapon: 'staff', aura: 'star' } });

wfam('idol', 'sound', '아이돌 가수 래퍼 댄서 비보이 아이유 BTS 방탄 블랙핑크 뉴진스 에스파 트와이스 세븐틴 케이팝 kpop 콘서트 팬미팅 팬클럽 응원봉', {
  basic: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 1, len: 90, arc: 60, st: SV(S, 'dance', 0.4) }], '{n} 고음|삼단 고음', '삼단 고음이 부채꼴로 퍼진다'),
  s1: wm('beacon', (P, S) => [{ t: 'beacon', dmg: 4 * P, r: 40, rate: 0.8, dur: 5, kb: 4, st: SV(S, 'dance', 0.8) }], '{n} 스피커|앰프 설치', '스피커를 세우면 쿵쿵 울릴 때마다 다들 춤춘다'),
  s2: wm('clone', (P) => [{ t: 'clone', dmg: 10 * P, n: 3, r: 16, dur: 4 }, { t: 'buff', k: 'haste', d: 3 }], '{n} 멤버 소환|칼군무', '멤버들이 칼군무로 달려가 터진다'),
  ult: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 6 * P, n: 4, len: 170, arc: 140, kb: 4, st: SV(S, 'dance', 1.6) }, { t: 'prism', dmg: 4 * P, len: 170, w: 4, spread: 30, ticks: 2, dur: 0.5 }, { t: 'heal', amt: 15 }], '{n} 월드투어|앵콜 무대', '조명이 쏟아지고 떼창이 시작된다. 모두 춤춘다'),
}, { st: 'dance', style: 'idol', passive: 'aura', title: '무대 장인|월드스타', look: { outfit: 'dress', aura: 'star' } });

wfam('youtuber', 'tech', '유튜버 스트리머 bj 비제이 틱톡커 인플루언서 구독 알림설정 먹방 라이브 방송 유튜브 틱톡 인스타', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 16, speed: 240, size: 2, st: SX(S, 0.4) }], '{n} 좋아요 폭격|따봉', '좋아요 버튼이 날아간다'),
  s1: wm('beacon', (P, S) => [{ t: 'beacon', dmg: 4 * P, r: 36, rate: 0.8, dur: 6, kb: 4, st: SV(S, 'confuse', 0.8) }], '{n} 라이브 시작|방송 켰다', '방송 장비를 설치한다. 채팅이 쏟아질 때마다 충격파'),
  s2: wm('mark', (P, S) => [{ t: 'mark', dmg: 18 * P, r: 18, delay: 1, range: 200, kb: 6, st: SV(S, 'confuse', 1) }], '{n} 박제|저격 영상', '적을 박제한다. 잠시 후 악플 폭발'),
  ult: wm('swarm', (P, S) => [{ t: 'swarm', dmg: 3 * P, r: 30, dur: 5, speed: 100, st: SV(S, 'confuse', 1.2) }, { t: 'missiles', dmg: 6 * P, n: 8, speed: 220 }], '{n} 구독자 대방출|떡상', '구독자 떼가 몰려가고 후원 미사일이 쏟아진다'),
}, { st: 'confuse', style: 'idol', passive: 'crit', title: '구독 좋아요|떡상 장인' });

wfam('gamer', 'tech', '게이머 프로게이머 페이커 롤 리그오브레전드 배그 배틀그라운드 마크 마인크래프트 오버워치 발로란트 메이플 피시방 PC방 키보드워리어 랭커 고인물 뉴비 버그 핵', {
  basic: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 2 * P, n: 8, spread: 12, st: SX(S, 0.3) }], '{n} 광클|딸깍딸깍', '초당 열 번 딸깍딸깍'),
  s1: wm('phantom', (P, S) => [{ t: 'phantom', dmg: 15 * P, dist: 120, st: SX(S, 1) }], '{n} 점멸|플래시 각', 'F 눌러서 점멸. 지나간 자리가 터진다'),
  s2: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 10 * P, n: 4, delay: 0.6, kb: 2, st: SV(S, 'confuse', 1) }], '{n} 핵 의심|에임봇 가동', '적 주위에 조준선이 착착 그어지고 한 번에 터진다'),
  ult: wm('snipe', (P, S) => [{ t: 'snipe', dmg: 30 * P, delay: 0.5, kb: 8 }, { t: 'clone', dmg: 10 * P, n: 2, r: 16, dur: 4 }, { t: 'buff', k: 'haste', d: 4 }], '{n} 펜타킬|GG 치세요', '원샷 원킬, 분신까지 꺼내서 펜타킬'),
}, { st: 'confuse', style: 'gunner', passive: 'crit', title: '랭킹 1위|손가락 신', look: { head: 'cap' } });

/* ===== 운동 ===== */
wfam('soccer', 'ball', '축구 축구공 손흥민 메시 호날두 골키퍼 공격수 슛 프리킥 페널티킥 월드컵 풋살', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 260, size: 3, bounce: 2, st: SX(S, 0.4) }], '{n} 슛|감아 차기', '공을 감아 찬다. 벽에 튕긴다'),
  s1: wm('dash', (P, S) => [{ t: 'dash', dist: 120, dmg: 10 * P, kb: 7, st: SV(S, 'stun', 0.6) }], '{n} 슬라이딩 태클|태클!', '발부터 미끄러져 들어가는 태클'),
  s2: wm('leap', (P, S) => [{ t: 'leap', dmg: 14 * P, r: 24, dist: 120, kb: 7, st: SX(S, 0.8) }], '{n} 바이시클킥|오버헤드킥', '공중으로 뒤집어 날아올라 내리찬다'),
  ult: wm('charge', (P, S) => [{ t: 'charge', dmg: 34 * P, delay: 0.5, speed: 320, boom: 26, kb: 10, st: SV(S, 'stun', 1.3) }], '{n} 캐논슛|골골골골골', '기를 모아서… 그물이 찢어지는 캐논슛!'),
}, { st: 'stun', style: 'speedster', passive: 'swift', title: '필드의 지배자|프리킥 장인', look: { outfit: 'stripes' } });

wfam('baseball', 'ball', '야구 야구공 야구방망이 배트 투수 타자 홈런 포수 글러브 메이저리그 오타니 류현진', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 7 * P, n: 1, speed: 320, size: 2, st: SX(S, 0.4) }], '{n} 강속구|직구', '시속 160킬로 강속구를 던진다'),
  s1: wm('swing', (P, S) => [{ t: 'swing', dmg: 12 * P, r: 26, arc: 160, kb: 10, st: SV(S, 'stun', 0.6) }], '{n} 풀스윙|홈런 스윙', '배트를 크게 풀스윙! 맞으면 장외로'),
  s2: wm('shot', (P, S) => [{ t: 'shot', dmg: 9 * P, n: 1, speed: 200, size: 2, homing: 0.8, st: SV(S, 'confuse', 1) }], '{n} 마구|너클볼', '흔들흔들 휘어져서 결국 맞는다'),
  ult: wm('snipe', (P, S) => [{ t: 'snipe', dmg: 40 * P, delay: 0.6, kb: 10, st: SV(S, 'stun', 1.4) }, { t: 'skyline', dmg: 8 * P, n: 6, step: 20, r: 10 }], '{n} 끝내기 홈런|9회 말 역전', '9회 말 투아웃… 따악! 공이 일직선으로 꽂힌다'),
}, { st: 'stun', style: 'gunner', passive: 'crit', title: '끝내기 장인|강속구 투수', look: { head: 'cap', weapon: 'hammer' } });

wfam('basketball', 'ball', '농구 농구공 덩크 덩크슛 마이클조던 르브론 커리 슬램덩크 강백호 3점슛 리바운드', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 230, size: 3, bounce: 3, st: SX(S, 0.4) }], '{n} 패스|체스트 패스', '공을 튕겨서 패스… 얼굴로'),
  s1: wm('hop', (P, S) => [{ t: 'hop', dmg: 9 * P, n: 4, r: 18, size: 6, kb: 4, st: SX(S, 0.6) }], '{n} 드리블|통통통', '공이 통통 튀며 적을 따라간다'),
  s2: wm('lob', (P, S) => [{ t: 'lob', dmg: 14 * P, r: 22, n: 1, kb: 6, st: SV(S, 'stun', 0.8) }], '{n} 3점슛|버저비터', '높이 포물선을 그리며 날아가 꽂힌다'),
  ult: wm('leap', (P, S) => [{ t: 'leap', dmg: 34 * P, r: 36, dist: 160, kb: 10, st: SV(S, 'stun', 1.4) }, { t: 'stomp', dmg: 8 * P, n: 2, r: 30 }], '{n} 슬램덩크|왼손은 거들 뿐', '하늘 높이 날아 적 머리에 덩크!'),
}, { st: 'stun', style: 'brawler', passive: 'swift', title: '코트의 왕|덩크 장인' });

wfam('racket', 'ball', '테니스 탁구 배드민턴 셔틀콕 라켓 배구 피구 피구공 스쿼시 핸드볼 컬링 하키', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 1, speed: 280, size: 2, ret: true, st: SX(S, 0.4) }], '{n} 스매시|핑퐁', '공을 쳐서 보내면 다시 돌아온다'),
  s1: wm('counter', () => [{ t: 'buff', k: 'reflect', d: 2 }, { t: 'buff', k: 'counter', d: 1.2 }], '{n} 리시브|받아치기', '날아오는 걸 그대로 받아친다'),
  s2: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 4, spread: 50, speed: 260, size: 2, bounce: 2, st: SX(S, 0.6) }], '{n} 난타|랠리 지옥', '공 네 개로 랠리를 퍼붓는다'),
  ult: wm('charge', (P, S) => [{ t: 'charge', dmg: 30 * P, delay: 0.4, speed: 340, boom: 20, kb: 10, st: SV(S, 'stun', 1.2) }, { t: 'shot', dmg: 6 * P, n: 3, spread: 40, speed: 280, size: 2, ret: true }], '{n} 필살 스매시|강스파이크', '공중에서 내리꽂는 필살의 스매시'),
}, { st: 'stun', style: 'gunner', passive: 'dodge', title: '랠리의 신|스매시 장인' });

wfam('bowling', 'ball', '볼링 볼링공 볼링핀 스트라이크 당구 당구공 큐대 구슬치기 쇠구슬 쇠공 철퇴', {
  basic: wm('roll', (P, S) => [{ t: 'roll', dmg: 8 * P, size: 6, speed: 170, life: 1.4, bounce: 1, kb: 6, st: SX(S, 0.4) }], '{n} 굴리기|데굴데굴', '{n을} 바닥에 데굴데굴 굴린다'),
  s1: wm('roll', (P, S) => [{ t: 'roll', dmg: 13 * P, size: 9, speed: 190, life: 2.2, bounce: 4, kb: 8, st: SV(S, 'stun', 0.8) }], '{n} 쿠션 샷|벽 튕기기', '벽에 네 번 튕기며 다 쓸어버린다'),
  s2: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 7 * P, n: 6, speed: 200, len: 160, size: 5, kb: 6, st: SX(S, 0.6) }], '{n}핀 쓰러뜨리기|핀 폭주', '볼링핀들이 우르르 넘어지며 덮친다'),
  ult: wm('roll', (P, S) => [{ t: 'roll', dmg: 26 * P, size: 14, speed: 150, life: 3, bounce: 3, kb: 10, st: SV(S, 'stun', 1.4) }, { t: 'stampede', dmg: 7 * P, n: 6, speed: 160, len: 180, size: 5, kb: 6 }], '{n} 퍼펙트게임|스트라이크!!', '거대한 공이 굴러가고 핀들이 사방으로 튄다'),
}, { st: 'stun', style: 'tank', passive: 'armor', title: '스트라이크 장인|굴리기 명인' });

wfam('martial', 'power', '권투 복싱 복서 레슬링 레슬러 씨름 태권도 가라테 쿵푸 무에타이 주짓수 격투기 ufc 이소룡 성룡 합기도 검도 펀치 발차기 드롭킥 헤드락', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 5 * P, len: 34, w: 7, n: 2, kb: 4, st: SX(S, 0.4) }], '{n} 원투|잽잽', '잽 잽! 빠르게 두 번'),
  s1: wm('launch', (P) => [{ t: 'launch', dmg: 13 * P, r: 15, off: 14, d: 1.1 }], '{n} 어퍼컷|승천권', '아래에서 위로! 적이 하늘로 붕 뜬다'),
  s2: wm('grab', (P, S) => [{ t: 'grab', dmg: 14 * P, r: 16, range: 120, delay: 0.3, kb: 9, st: SV(S, 'stun', 0.8) }], '{n} 메치기|업어치기', '붙잡아서 내 앞으로 업어친다'),
  ult: wm('flurry', (P, S) => [{ t: 'dash', dist: 80, dmg: 8 * P, kb: 3 }, { t: 'flurry', dmg: 5 * P, r: 26, off: 10, dur: 1, ticks: 10, st: SX(S, 1) }, { t: 'launch', dmg: 12 * P, r: 18, off: 14, d: 1 }], '{n} 백열각|아타타타타', '아타타타타! 열 번 때리고 마지막에 띄운다'),
}, { st: 'stun', style: 'brawler', passive: 'rage', title: '격투 챔피언|도장 깨기', look: { outfit: 'plain', head: 'short' } });

wfam('gym', 'power', '헬스 헬창 근육 근육맨 보디빌더 역도 바벨 덤벨 아령 스쿼트 벤치프레스 프로틴 단백질 3대500 득근', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 9 * P, r: 22, arc: 120, kb: 7, st: SX(S, 0.5) }], '{n} 덤벨 휘두르기|근육 펀치', '덤벨을 들고 크게 휘두른다'),
  s1: wm('lob', (P, S) => [{ t: 'lob', dmg: 14 * P, r: 22, n: 1, kb: 8, st: SV(S, 'heavy', 1.2) }], '{n} 바벨 투척|원판 던지기', '200킬로 원판을 던진다'),
  s2: wm('buff', () => [{ t: 'buff', k: 'power', d: 4 }, { t: 'buff', k: 'armor', d: 4 }, { t: 'heal', amt: 14 }], '{n} 펌핑|프로틴 원샷', '프로틴 원샷하고 근육이 펌핑된다'),
  ult: wm('stomp', (P, S) => [{ t: 'buff', k: 'giant', d: 4 }, { t: 'stomp', dmg: 14 * P, n: 4, r: 30, kb: 9, st: SV(S, 'heavy', 1.5) }], '{n} 하체 운동의 날|스쿼트 천 개', '스쿼트할 때마다 땅이 흔들린다. 하체는 배신 안 한다'),
}, { st: 'heavy', style: 'brawler', passive: 'armor', stats: { hp: 15 }, title: '3대 오백|근손실 공포증', look: { outfit: 'plain', head: 'short' } });

wfam('skate', 'ice', '스케이트 스케이트보드 보드 스키 스노보드 썰매 롤러스케이트 인라인 피겨 김연아 쇼트트랙 빙상', {
  basic: wm('dash', (P, S) => [{ t: 'dash', dist: 70, dmg: 6 * P, kb: 4, st: SX(S, 0.4) }], '{n} 미끄러지기|슈웅', '얼음판 위를 슈웅 미끄러져 부딪힌다'),
  s1: wm('swing', (P, S) => [{ t: 'swing', dmg: 6 * P, r: 24, arc: 360, n: 3, kb: 4, st: SV(S, 'freeze', 0.6) }], '{n} 트리플 악셀|빙글빙글', '세 바퀴 반을 돌며 주변을 벤다'),
  s2: wm('zone', (P) => [{ t: 'zone', dmg: 2 * P, r: 40, dur: 4, at: 'target', st: { k: 'slip', d: 1 } }, { t: 'buff', k: 'haste', d: 3 }], '{n} 링크 만들기|얼음판 깔기', '바닥을 얼음판으로 만든다. 나만 잘 탄다'),
  ult: wm('phantom', (P, S) => [{ t: 'phantom', dmg: 14 * P, dist: 130 }, { t: 'phantom', dmg: 14 * P, dist: 130 }, { t: 'spikering', dmg: 10 * P, r: 40, n: 12, at: 'self', st: SV(S, 'freeze', 1.2) }], '{n} 금메달 연기|피날레 스핀', '빛처럼 두 번 가르고 마지막 스핀에 얼음 가시가 솟는다'),
}, { st: 'freeze', style: 'speedster', passive: 'swift', title: '빙판의 요정|금메달리스트' });

/* ===== 탈것 ===== */
wfam('car', 'speed', '자동차 승용차 스포츠카 트럭 덤프트럭 버스 택시 오토바이 바이크 스쿠터 자전거 킥보드 전동킥보드 경운기 람보르기니 페라리 포르쉐 트럭커 카트 레이싱 붕붕카 마티즈', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 10, speed: 280, size: 1, st: SX(S, 0.4) }], '{n} 경적|빵빵', '빵빵! 경적이 총알처럼 날아간다'),
  s1: wm('dash', (P, S) => [{ t: 'dash', dist: 150, dmg: 12 * P, kb: 9, invuln: true, st: SX(S, 0.6) }], '{n} 풀악셀|부릉부릉', '부릉! 풀악셀 밟고 들이받는다'),
  s2: wm('zone', (P, S) => [{ t: 'trail', dmg: 3 * P, r: 10, dur: 3, life: 2.5, st: SV(S, 'burn', 0.8) }, { t: 'buff', k: 'haste', d: 3 }], '{n} 드리프트|타이어 자국', '드리프트! 지나간 자리에 불붙은 타이어 자국'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 18 * P, n: 3, speed: 300, len: 300, size: 13, kb: 10, st: SV(S, 'stun', 1.3) }], '{n} 대폭주|무면허 질주', '{n} 세 대가 경적을 울리며 맵을 가로지른다'),
}, { st: 'stun', style: 'speedster', passive: 'swift', title: '도로의 무법자|무면허 운전', look: { head: 'helmet' } });

wfam('train', 'tech', '기차 열차 지하철 전철 KTX ktx SRT 고속열차 증기기관차 화물열차 토마스 2호선 신칸센', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 260, size: 3, pierce: true, st: SX(S, 0.4) }], '{n} 기적|칙칙폭폭', '칙칙폭폭! 증기를 뿜는다'),
  s1: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 14 * P, n: 1, speed: 300, len: 300, size: 14, kb: 10, st: SV(S, 'stun', 1) }], '{n} 진입|열차가 들어옵니다', '"열차가 들어옵니다" 안내 방송과 함께 거대한 {n이} 지나간다'),
  s2: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 10 * P, n: 4, delay: 0.7, kb: 4, st: SV(S, 'stun', 0.6) }], '{n} 선로 깔기|노선도', '적 주변에 선로가 쫙쫙 깔리고 곧 지나간다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 16 * P, n: 3, speed: 300, len: 320, size: 14, kb: 10, st: SV(S, 'stun', 1.4) }, { t: 'sonic', dmg: 5 * P, n: 2, len: 150, arc: 120 }], '출근길 {n}|지옥철 대탈출', '출근 시간 {n} 세 량이 꽉 차서 밀고 들어온다'),
}, { st: 'stun', style: 'engineer', passive: 'armor', title: '정시 출발|선로의 지배자' });

wfam('plane', 'tech', '비행기 전투기 헬기 헬리콥터 드론 제트기 여객기 폭격기 스텔스기 글라이더 열기구 비행선', {
  basic: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 2 * P, n: 8, spread: 10, st: SX(S, 0.3) }], '{n} 기관포|두두두두', '기관포를 두두두 갈긴다'),
  s1: wm('missiles', (P, S) => [{ t: 'missiles', dmg: 6 * P, n: 6, speed: 230, st: SX(S, 0.6) }], '{n} 미사일|록온', '록온! 미사일 여섯 발'),
  s2: wm('gust', (P, S) => [{ t: 'buff', k: 'fly', d: 3 }, { t: 'gust', dmg: 4 * P, len: 90, arc: 100, kb: 10, st: SX(S, 0.6) }], '{n} 이륙|프로펠러 바람', '이륙하며 엄청난 바람을 일으킨다'),
  ult: wm('skyline', (P, S) => [{ t: 'buff', k: 'fly', d: 4 }, { t: 'skyline', dmg: 14 * P, n: 10, step: 20, r: 14, st: SV(S, 'stun', 1) }, { t: 'missiles', dmg: 6 * P, n: 6, speed: 230 }], '{n} 융단폭격|공습경보', '공습경보! 폭탄이 일렬로 떨어지고 미사일까지'),
}, { st: 'stun', style: 'flyer', passive: 'swift', title: '하늘의 에이스|공습경보', look: { head: 'helmet' } });

wfam('tank', 'metal', '탱크 전차 장갑차 포크레인 굴착기 불도저 지게차 레미콘 중장비 크레인 로드롤러 탱크로리', {
  basic: wm('lob', (P, S) => [{ t: 'lob', dmg: 8 * P, r: 14, n: 1, kb: 5, st: SX(S, 0.5) }], '{n} 포탄|쾅', '포탑에서 포탄을 쏜다'),
  s1: wm('surge', (P, S) => [{ t: 'surge', dmg: 13 * P, w: 60, len: 150, speed: 150, kb: 10, st: SV(S, 'heavy', 1) }], '{n} 밀어붙이기|삽질', '앞을 막는 건 다 밀어 버린다'),
  s2: wm('buff', () => [{ t: 'buff', k: 'armor', d: 5 }, { t: 'buff', k: 'shield', d: 4, pow: 30 }], '{n} 장갑 강화|철판 덧대기', '철판을 덧대서 엄청 단단해진다'),
  ult: wm('stampede', (P, S) => [{ t: 'stampede', dmg: 18 * P, n: 2, speed: 160, len: 280, size: 14, kb: 10, st: SV(S, 'heavy', 1.5) }, { t: 'lob', dmg: 12 * P, r: 24, n: 3, kb: 7 }], '{n} 진격|공사 시작합니다', '{n} 두 대가 굉음을 내며 밀고 오고 포탄까지'),
}, { st: 'heavy', style: 'tank', passive: 'armor', stats: { hp: 25, speed: 0.85 }, title: '움직이는 요새|공사 반장', look: { outfit: 'armor', head: 'helmet' } });

wfam('ship', 'water', '보트 잠수함 군함 항공모함 유람선 요트 타이타닉 뗏목 카누 어선 고깃배 항해사 선원 등대', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 220, size: 3, st: SX(S, 0.4) }], '{n} 닻 던지기|뱃고동', '무거운 닻을 던진다'),
  s1: wm('missiles', (P, S) => [{ t: 'missiles', dmg: 6 * P, n: 4, speed: 200, st: SV(S, 'slow', 0.8) }], '{n} 어뢰|어뢰 발사', '어뢰 네 발이 물보라를 내며 쫓아간다'),
  s2: wm('surge', (P, S) => [{ t: 'surge', dmg: 11 * P, w: 70, len: 170, speed: 170, kb: 9, st: SV(S, 'slip', 1) }], '{n} 뱃머리 파도|만선이요', '배가 지나가며 큰 파도를 일으킨다'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 13 * P, n: 9, step: 22, r: 13, st: SV(S, 'stun', 1) }, { t: 'surge', dmg: 10 * P, w: 80, len: 180, speed: 160, kb: 8 }], '{n} 함포 사격|전 함대 발포', '함포가 일렬로 불을 뿜고 거대한 파도가 덮친다'),
}, { st: 'slip', style: 'artillery', passive: 'armor', title: '바다의 선장|만선의 꿈', look: { head: 'cap', cape: true } });

wfam('rocket', 'space', '로켓 우주선 우주정거장 인공위성 위성 스페이스X 누리호 아폴로 셔틀 우주비행사 우주복', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 300, size: 2, boom: 10, st: SX(S, 0.4) }], '{n} 소형 추진탄|슈웅', '작은 추진체가 쭉 날아가 터진다'),
  s1: wm('charge', (P, S) => [{ t: 'charge', dmg: 22 * P, delay: 0.5, speed: 320, boom: 24, kb: 9, st: SV(S, 'burn', 1) }], '{n} 발사 카운트다운|3, 2, 1', '3… 2… 1… 발사!'),
  s2: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 10 * P, n: 4, delay: 0.6, kb: 2, st: SV(S, 'heavy', 1) }], '{n} 궤도 레이저|위성 조준', '위성이 조준선을 그은 뒤 레이저를 쏜다'),
  ult: wm('meteor', (P, S) => [{ t: 'snipe', dmg: 24 * P, delay: 0.6, kb: 8 }, { t: 'meteor', dmg: 30 * P, r: 46, kb: 10, st: SV(S, 'burn', 1.5) }], '{n} 대기권 재진입|우주에서 낙하', '우주에서 불타며 떨어진다. 조준 레이저부터'),
}, { st: 'burn', style: 'engineer', passive: 'swift', title: '우주 개척자|발사 3초 전', look: { head: 'helmet', outfit: 'suit' } });

/* ===== 무기 ===== */
wfam('sword', 'metal', '!칼 !검 대검 장검 단검 카타나 일본도 레이피어 엑스칼리버 광선검 라이트세이버 쌍검 목검 죽도 식칼 회칼 칼날', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 8 * P, r: 22, arc: 110, kb: 3, st: SX(S, 0.5) }], '{n} 베기|싹둑', '{n으로} 시원하게 벤다'),
  s1: wm('claw', (P, S) => [{ t: 'claw', dmg: 7 * P, r: 34, kb: 3, st: SV(S, 'vuln', 1) }], '{n} 삼연참|세 번 베기', '눈 깜짝할 사이에 세 번 벤다'),
  s2: wm('phantom', (P, S) => [{ t: 'phantom', dmg: 16 * P, dist: 120, st: SV(S, 'vuln', 1) }], '{n} 발도술|이미 베었다', '칼을 뽑는 소리만 들렸다… 0.3초 뒤 칼자국'),
  ult: wm('cross', (P, S) => [{ t: 'phantom', dmg: 12 * P, dist: 130 }, { t: 'lasergrid', dmg: 14 * P, n: 6, delay: 0.5, kb: 4, st: SV(S, 'vuln', 1.5) }], '{n} 만검난무|천 갈래 베기', '지나간 뒤 적 주변 공간에 칼자국이 바둑판처럼 생긴다'),
}, { st: 'vuln', style: 'assassin', passive: 'crit', title: '검의 달인|일격필살', look: { weapon: 'sword' } });

wfam('axe', 'metal', '도끼 손도끼 전투도끼 망치 해머 오함마 뿅망치 쇠망치 묠니르 몽둥이 방망이 곤봉 철퇴 빠루', {
  basic: wm('swing', (P, S) => [{ t: 'swing', dmg: 10 * P, r: 22, arc: 100, kb: 7, st: SV(S, 'stun', 0.3) }], '{n} 내려찍기|쾅', '{n으로} 힘껏 내려찍는다'),
  s1: wm('crack', (P, S) => [{ t: 'crack', dmg: 13 * P, len: 170, speed: 200, r: 12, kb: 6, st: SV(S, 'stun', 0.8) }], '{n} 대지 가르기|쩌억', '땅을 내리쳐 균열이 앞으로 갈라진다'),
  s2: wm('roll', (P, S) => [{ t: 'shot', dmg: 12 * P, n: 1, speed: 220, size: 4, ret: true, st: SV(S, 'stun', 0.8) }], '{n} 던지기|돌아와라 {n}', '{n을} 던지면 빙글빙글 돌아온다'),
  ult: wm('stomp', (P, S) => [{ t: 'leap', dmg: 24 * P, r: 34, dist: 130, kb: 9 }, { t: 'pillar', dmg: 10 * P, n: 6, step: 22, r: 12, lift: true }, { t: 'storm', dmg: 6 * P, n: 6, r: 44, st: SV(S, 'stun', 1) }], '{n} 천둥 내려찍기|토르 흉내', '뛰어올라 내려찍자 땅이 솟고 번개가 친다'),
}, { st: 'stun', style: 'brawler', passive: 'rage', title: '쇠망치 장인|두들겨 패는 자', look: { weapon: 'axe' } });

wfam('spear', 'metal', '!창 장창 삼지창 언월도 할버드 랜스 작살 죽창 방천화극 청룡언월도', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 8 * P, len: 56, w: 5, n: 1, kb: 4, st: SX(S, 0.5) }], '{n} 찌르기|쭉', '{n으로} 길게 쭉 찌른다'),
  s1: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 6 * P, len: 60, w: 5, n: 4, kb: 2, st: SV(S, 'vuln', 1) }], '{n} 연속 찌르기|백 번 찌르기', '팍팍팍팍! 네 번 연속으로 찌른다'),
  s2: wm('swing', (P, S) => [{ t: 'swing', dmg: 9 * P, r: 34, arc: 360, n: 1, kb: 7, st: SX(S, 0.6) }], '{n} 휘돌리기|붕붕', '긴 {n을} 한 바퀴 휘돌린다'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 13 * P, n: 9, step: 20, r: 11, st: SV(S, 'root', 1) }, { t: 'thrust', dmg: 14 * P, len: 70, w: 8, n: 1, kb: 9 }], '{n}의 비|천 개의 {n}', '하늘에서 {n이} 일렬로 꽂히고 마지막에 한 번 찌른다'),
}, { st: 'vuln', style: 'brawler', passive: 'crit', title: '긴 무기 장인|거리 조절의 신', look: { weapon: 'spear' } });

wfam('bow', 'metal', '!활 화살 석궁 장궁 궁수 로빈후드 큐피드화살 양궁 신궁 활쏘기 주몽', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 6 * P, n: 1, speed: 320, size: 1, pierce: true, st: SX(S, 0.4) }], '{n} 쏘기|피융', '{n을} 당겨 쏜다'),
  s1: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 5, spread: 50, speed: 300, size: 1, st: SV(S, 'slow', 0.8) }], '{n} 부채꼴 사격|다섯 발', '화살 다섯 발을 부채꼴로 쏜다'),
  s2: wm('snipe', (P, S) => [{ t: 'snipe', dmg: 22 * P, delay: 0.5, kb: 7, st: SV(S, 'root', 1) }], '{n} 조준 사격|숨 참고 한 발', '숨을 참고… 끝까지 날아가는 한 발'),
  ult: wm('skyline', (P, S) => [{ t: 'skyline', dmg: 12 * P, n: 10, step: 18, r: 11, st: SV(S, 'root', 1) }, { t: 'storm', dmg: 6 * P, n: 8, r: 50 }], '{n}의 비|하늘을 덮는 화살', '하늘이 까매질 만큼 화살이 쏟아진다'),
}, { st: 'root', style: 'gunner', passive: 'crit', title: '백발백중|명궁', look: { weapon: 'bow' } });

wfam('gun', 'metal', '!총 총알 탄환 총탄 실탄 권총 소총 기관총 산탄총 샷건 저격총 라이플 리볼버 물총 비비탄 너프건 레이저총 ak 기관단총 미니건 바주카', {
  basic: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 2 * P, n: 6, spread: 12, st: SX(S, 0.3) }], '{n} 연사|탕탕탕', '{n으로} 탕탕탕 연사'),
  s1: wm('cone', (P, S) => [{ t: 'shot', dmg: 4 * P, n: 6, spread: 50, speed: 320, size: 1, st: SX(S, 0.6) }], '{n} 산탄|빵!', '가까이서 쏘면 엄청 아픈 산탄'),
  s2: wm('snipe', (P, S) => [{ t: 'snipe', dmg: 24 * P, delay: 0.55, kb: 7, st: SX(S, 1) }], '{n} 저격|헤드샷', '빨간 점이 이마에… 탕'),
  ult: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 3 * P, n: 20, spread: 40, st: SX(S, 0.6) }, { t: 'missiles', dmg: 6 * P, n: 6, speed: 230 }], '{n} 무한 탄창|총알 비', '총알 스무 발에 미사일까지. 탄창은 무한'),
}, { st: 'stun', style: 'gunner', passive: 'crit', title: '방아쇠 장인|탄창 무한', look: { weapon: 'gun' } });

wfam('bomb', 'fire', '폭탄 수류탄 다이너마이트 지뢰 시한폭탄 핵폭탄 C4 폭죽 불꽃놀이 연막탄 섬광탄 화약 TNT', {
  basic: wm('lob', (P, S) => [{ t: 'lob', dmg: 7 * P, r: 14, n: 1, kb: 4, st: SV(S, 'burn', 0.5) }], '{n} 투척|펑', '{n을} 휙 던진다'),
  s1: wm('mark', (P, S) => [{ t: 'mark', dmg: 22 * P, r: 22, delay: 1.2, range: 180, kb: 8, st: SV(S, 'burn', 1) }], '{n} 붙이기|째깍째깍', '등에 {n을} 붙인다. 째깍째깍… 펑'),
  s2: wm('summon', (P, S) => [{ t: 'summon', kind: 'mine', n: 3, dmg: 14 * P, dur: 8, st: SV(S, 'stun', 0.8) }], '{n} 매설|밟지 마시오', '바닥에 {n을} 세 개 묻어 둔다'),
  ult: wm('cross', (P, S) => [{ t: 'cross', dmg: 16 * P, n: 5, at: 'target', kb: 7, st: SV(S, 'burn', 1.4) }, { t: 'meteor', dmg: 26 * P, r: 44, kb: 10 }], '{n} 대폭발|빨간 선 자르면 돼?', '빨간 선을 잘랐다. 십자로 터지고 하늘에서 하나 더'),
}, { st: 'burn', style: 'bomber', passive: 'crit', title: '폭발은 예술|빨간 선 파란 선', look: { aura: 'flame' } });

wfam('whip', 'metal', '채찍 밧줄 올가미 쇠사슬 사슬 체인 로프 줄넘기 줄다리기 리본 리듬체조', {
  basic: wm('whip', (P, S) => [{ t: 'whip', dmg: 8 * P, len: 60, kb: 4, st: SX(S, 0.5) }], '{n} 찰싹|{n} 휘두르기', '{n을} 휘둘러 찰싹 때린다'),
  s1: wm('hook', (P, S) => [{ t: 'hook', dmg: 8 * P, speed: 320, range: 170, st: SV(S, 'root', 0.6) }], '{n} 감아 오기|이리 와', '{n으로} 감아서 끌고 온다'),
  s2: wm('ring', (P, S) => [{ t: 'ring', dmg: 5 * P, r: 28, dur: 3, at: 'target', st: SV(S, 'root', 1) }], '{n} 묶기|꽁꽁', '적 주위를 {n으로} 둘러 묶는다'),
  ult: wm('whip', (P, S) => [{ t: 'whip', dmg: 14 * P, len: 90, kb: 8, st: SV(S, 'stun', 1) }, { t: 'swing', dmg: 10 * P, r: 40, arc: 360, n: 2, kb: 6 }], '{n} 회오리 채찍|채찍 폭풍', '{n을} 크게 휘두르고 두 바퀴 돌며 다 쓸어버린다'),
}, { st: 'root', style: 'trickster', passive: 'dodge', title: '채찍 마스터|줄타기 명인' });

/* ===== 학교·문구 ===== */
wfam('school', 'nag', '연필 샤프 볼펜 지우개 필통 공책 노트 교과서 문제집 참고서 사전 시험지 숙제 수행평가 중간고사 기말고사 수능 모의고사 성적표 생활기록부 칠판 분필 컴퍼스 각도기 삼각자 스테이플러 풀 테이프 압정 클립 책가방', {
  basic: wm('thrust', (P, S) => [{ t: 'thrust', dmg: 5 * P, len: 40, w: 3, n: 2, kb: 1, st: SX(S, 0.4) }], '{n} 콕콕|{n} 찌르기', '뾰족한 {n으로} 콕콕 찌른다'),
  s1: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 3 * P, n: 10, spread: 20, st: SV(S, 'weak', 0.6) }], '{n} 난사|철컥철컥', '{n이} 철컥철컥 연사된다'),
  s2: wm('mark', (P, S) => [{ t: 'mark', dmg: 18 * P, r: 18, delay: 1.1, range: 200, kb: 6, st: SV(S, 'sleep', 1) }], '{n} 오답 표시|빨간 비', '빨간 X 표시를 한다. 잠시 후 폭발'),
  ult: wm('meteor', (P, S) => [{ t: 'meteor', dmg: 30 * P, r: 46, kb: 9, st: SV(S, 'sleep', 1.5) }, { t: 'skyline', dmg: 9 * P, n: 8, step: 20, r: 11 }], '{n} 산사태|천 페이지짜리 {n}', '하늘에서 거대한 {n} 더미가 쏟아진다'),
}, { st: 'sleep', style: 'nagger', passive: 'armor', title: '전교 1등|벼락치기 장인', look: { weapon: 'book' } });

/* ===== 기계·전자 ===== */
wfam('computer', 'tech', '컴퓨터 노트북 키보드 마우스 모니터 스마트폰 핸드폰 휴대폰 아이폰 갤럭시 태블릿 아이패드 와이파이 블루투스 충전기 보조배터리 프린터 USB 인터넷 해킹 해커 코딩 프로그래머 개발자 버그픽스 바이러스', {
  basic: wm('gatling', (P, S) => [{ t: 'gatling', dmg: 2 * P, n: 8, spread: 14, st: SX(S, 0.3) }], '{n} 타자 연사|타다다닥', '키보드 소리가 총알이 되어 날아간다'),
  s1: wm('lasergrid', (P, S) => [{ t: 'lasergrid', dmg: 10 * P, n: 4, delay: 0.6, kb: 2, st: SV(S, 'stun', 0.8) }], '{n} 해킹|방화벽 침투', '적 주변에 코드 줄이 그어지고 시스템이 다운된다'),
  s2: wm('beacon', (P, S) => [{ t: 'beacon', dmg: 4 * P, r: 40, rate: 0.8, dur: 6, kb: 4, st: SV(S, 'confuse', 0.8) }], '{n} 공유기 설치|와이파이 존', '공유기를 세우면 전파가 주기적으로 퍼진다'),
  ult: wm('missiles', (P, S) => [{ t: 'all', dmg: 5 * P, st: SV(S, 'confuse', 1.5) }, { t: 'lasergrid', dmg: 12 * P, n: 6, delay: 0.8 }, { t: 'missiles', dmg: 5 * P, n: 6, speed: 230 }], '{n} 블루스크린|시스템 오류', '모든 화면이 파랗게 된다. 레이저와 바이러스 미사일까지'),
}, { st: 'confuse', style: 'engineer', passive: 'aura', title: '컨트롤 C V 장인|버그 제조기', look: { head: 'robot' } });

wfam('robot', 'tech', '로봇 안드로이드 사이보그 메카 건담 아이언맨 터미네이터 로봇청소기 인공지능 ai AI 챗봇 알파고 기계인간', {
  basic: wm('shot', (P, S) => [{ t: 'shot', dmg: 5 * P, n: 2, spread: 8, speed: 300, size: 1, st: SX(S, 0.3) }], '{n} 레이저|삐빅', '눈에서 삐빅 레이저'),
  s1: wm('missiles', (P, S) => [{ t: 'missiles', dmg: 6 * P, n: 6, speed: 230, st: SX(S, 0.6) }], '{n} 어깨 미사일|타겟 고정', '어깨에서 미사일이 촤르륵'),
  s2: wm('top', (P, S) => [{ t: 'top', dmg: 6 * P, n: 2, speed: 130, dur: 6, kb: 5, st: SX(S, 0.8) }], '{n} 미니봇 출동|자율주행', '작은 로봇 둘이 돌아다니며 들이받는다'),
  ult: wm('lasergrid', (P, S) => [{ t: 'buff', k: 'giant', d: 4 }, { t: 'lasergrid', dmg: 15 * P, n: 6, delay: 0.7, kb: 4, st: SV(S, 'stun', 1.2) }, { t: 'charge', dmg: 20 * P, delay: 0.5, speed: 320, boom: 22, kb: 9 }], '{n} 최종 형태|합체 완료', '거대 로봇으로 합체! 레이저망과 가슴 빔 발사'),
}, { st: 'stun', style: 'engineer', passive: 'armor', title: '삐빅 계산 완료|최종 병기', look: { head: 'robot', outfit: 'armor' } });

wfam('appliance', 'tech', '청소기 세탁기 냉장고 전자레인지 에어컨 선풍기 드라이기 헤어드라이어 다리미 전기장판 밥솥 전기밥솥 믹서기 토스터 정수기 공기청정기 가습기 제습기 식기세척기', {
  basic: wm('cone', (P, S) => [{ t: 'cone', dmg: 2 * P, len: 70, arc: 40, dur: 0.5, ticks: 3, kb: 3, st: SX(S, 0.4) }], '{n} 바람|{n} 강풍 모드', '{n}에서 바람이 확 나온다'),
  s1: wm('vortex', (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 36, dur: 3, pull: 12, at: 'target', st: SV(S, 'confuse', 1) }], '{n} 흡입 모드|탈수 모드', '빙글빙글 돌며 다 빨아들인다'),
  s2: wm('zone', (P, S) => [{ t: 'zone', dmg: 3 * P, r: 30, dur: 4, at: 'target', st: SV(S, 'burn', 1) }], '{n} 가열 모드|땡! 데우기 완료', '적 자리를 전자레인지처럼 데운다'),
  ult: wm('tornado', (P, S) => [{ t: 'tornado', dmg: 5 * P, r: 22, speed: 70, life: 4, st: SV(S, 'confuse', 1.2) }, { t: 'vortex', dmg: 3 * P, r: 50, dur: 3.5, pull: 12, at: 'target' }], '{n} 터보 모드|전기 요금 폭탄', '최대 출력! 거대 회오리가 맵을 돌아다닌다'),
}, { st: 'confuse', style: 'engineer', passive: 'regen', title: '살림 장인|전기 요금 폭탄' });

/* ===== 음악 ===== */
wfam('music', 'sound', '노래 음악 !기타 일렉기타 베이스 드럼 피아노 바이올린 첼로 트럼펫 색소폰 리코더 탬버린 실로폰 하모니카 마이크 스피커 노래방 랩 힙합 발라드 트로트 오케스트라 지휘자 피리 단소 꽹과리 북 장구', {
  basic: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 4 * P, n: 1, len: 90, arc: 60, kb: 2, st: SV(S, 'dance', 0.4) }], '{n} 한 소절|도레미', '{n} 소리가 부채꼴로 퍼진다'),
  s1: wm('stomp', (P, S) => [{ t: 'stomp', dmg: 8 * P, n: 3, r: 24, kb: 5, st: SV(S, 'dance', 0.8) }], '{n} 쿵짝쿵짝|비트 드롭', '쿵! 짝! 쿵! 박자에 맞춰 바닥이 울린다'),
  s2: wm('beacon', (P, S) => [{ t: 'beacon', dmg: 4 * P, r: 40, rate: 0.7, dur: 5, kb: 4, st: SV(S, 'dance', 0.8) }], '{n} 앰프|무한 반복 재생', '앰프를 세운다. 울릴 때마다 춤이 나온다'),
  ult: wm('sonic', (P, S) => [{ t: 'sonic', dmg: 7 * P, n: 4, len: 180, arc: 140, kb: 5, st: SV(S, 'dance', 1.6) }, { t: 'storm', dmg: 6 * P, n: 6, r: 50 }], '{n} 앵콜 무대|떼창 시작', '조명이 터지고 떼창이 시작된다. 아무도 못 멈춘다'),
}, { st: 'dance', style: 'idol', passive: 'aura', title: '무대 체질|절대음감', look: { aura: 'star' } });

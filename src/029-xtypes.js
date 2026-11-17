/* ===== 추가 공격 방식 100종 =====
   새로 만든 움직임(지그재그·물결·휘어짐·나선·공전·멈췄다 돌진·순간이동·가속·커짐·자석·흔적 남기기·끝에서 터짐)과
   모양 폭격(별·하트·체크무늬·웃는 얼굴·ㅋㅋ 글자…)을 조합한 기술들.
   xt(이름, 한국어, 설명, 어울리는 유형, 쓸 수 있는 칸(b 기본·1 능력2·2 능력3·u 궁극기), 기술 종류, 만들기(D 위력, S 상태이상), 이름들, 설명들)
   AI가 {"t":"이름"}만 써도 되고, 능력 조립(AI 없이)도 이 표에서 골라 쓴다. */
const XT = {};
const XT_LIST = [];
const XS = (S, d) => (S ? { k: S, d } : undefined);
function xt(key, ko, desc, sty, slots, m, make, names, descs) {
  XT[key] = { key, ko, desc, sty: sty.split(' '), slots, m, make, names: names.split('|'), descs: descs.split('|') };
  XT_LIST.push(XT[key]);
}
const XT_D = { basic: 6, s1: 12, s2: 12, ult: 24 };

/* ---------- 움직이는 투사체 (36) ---------- */
xt('boomerang', '부메랑', '던지면 휘어 돌아오며 두 번 맞힌다', 'gunner trickster spinner', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D, ret: true, pierce: true, size: 3, speed: 230, life: 0.9, st: XS(S, 0.6) }], '{n} 부메랑|돌아와라 {n}', '{n을} 던지면 휘익 돌아온다');
xt('zigzag', '지그재그탄', '번개처럼 지그재그로 꺾이며 날아간다', 'gunner speedster trickster', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D, path: 'zigzag', size: 2, speed: 230, life: 1.3, st: XS(S, 0.5) }], '{n} 지그재그|갈지자 {n}', '{n이} 지그재그로 꺾이며 날아간다');
xt('sine', '물결탄', '위아래로 물결치며 날아간다', 'beamer idol gunner', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D, path: 'sine', size: 2, speed: 210, life: 1.4, st: XS(S, 0.5) }], '{n} 물결|출렁 {n}', '{n이} 출렁출렁 물결치며 간다');
xt('helix', '이중나선', '두 발이 서로 꼬이며 날아간다', 'beamer engineer gunner', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.7, n: 2, path: 'helix', size: 2, speed: 220, life: 1.4, st: XS(S, 0.5) }], '{n} 이중나선|DNA {n}', '{n} 두 줄기가 꼬이고 꼬이며 날아간다');
xt('curve', '커브볼', '크게 휘어 돌아 들어간다', 'gunner trickster', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D, path: 'curve', turn: 1, size: 3, speed: 240, life: 1.3, homing: 0.15, st: XS(S, 0.5) }], '{n} 커브|마구 {n}', '{n이} 크게 휘어서 옆구리로 들어간다');
xt('curvefan', '휘는 부채', '네 발이 서로 다른 방향으로 휘어 감싼다', 'gunner trickster spinner', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.55, n: 4, path: 'curve', size: 2, speed: 220, life: 1.4, st: XS(S, 0.6) }], '{n} 휘는 부채|{n} 포위탄', '{n} 네 발이 휘어서 감싸 들어간다');
xt('spiralshot', '소용돌이탄', '내 주변에서 나선을 그리며 퍼진다', 'spinner gravity polluter', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.4, n: 6, path: 'spiral', pierce: true, aura: 3, size: 2, speed: 170, life: 1.5, st: XS(S, 0.6) }], '{n} 소용돌이|빙글빙글 {n}', '{n이} 나를 중심으로 소용돌이치며 퍼진다');
xt('orbit', '위성 구슬', '내 주위를 빙빙 돌다가 적에게 날아간다', 'summoner beamer healer', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.5, n: 3, path: 'orbit', pierce: true, size: 2, speed: 220, life: 2.4, st: XS(S, 0.5) }], '{n} 위성|{n} 호위대', '{n} 세 개가 내 주위를 돌다가 날아간다');
xt('orbitbomb', '위성 폭탄', '주위를 돌다가 날아가 터지며 사방으로 흩어진다', 'bomber engineer', '2u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.5, n: 2, path: 'orbit', size: 3, speed: 220, life: 2.2, end: 'burst', n2: 6, st: XS(S, 0.8) }], '{n} 위성 폭탄|돌고 돌아 {n}', '빙빙 돌던 {n이} 날아가 펑 터진다');
xt('rocket', '로켓', '점점 빨라지다가 쾅 터진다', 'artillery engineer bomber', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D, path: 'accel', size: 3, speed: 110, life: 1.5, boom: 18, st: XS(S, 0.8) }], '{n} 로켓|{n} 발사대', '{n} 로켓이 점점 빨라지다가 쾅!');
xt('sleeper', '잠복 미사일', '멈춰서 노려보다가 갑자기 달려든다', 'assassin engineer', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, n: 3, spread: 70, path: 'stopgo', size: 2, speed: 200, life: 1.8, st: XS(S, 0.6) }], '{n} 잠복|노려보는 {n}', '{n이} 멈춰서 노려보다가 갑자기 돌진한다');
xt('hover', '정지 지뢰탄', '날아가다 멈춰 둥둥 떠 있다가 터진다', 'bomber trickster lazy', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.4, path: 'stay', size: 3, speed: 200, life: 2, end: 'mine', st: XS(S, 0.8) }], '{n} 공중 지뢰|떠 있는 {n}', '{n이} 공중에 멈춰 떠 있다가 펑');
xt('drunkshot', '취한 총알', '비틀비틀 제멋대로 날아간다', 'trickster lazy gunner', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.55, n: 3, spread: 30, path: 'wobble', size: 2, speed: 200, life: 1.4, st: XS(S, 0.6) }], '{n} 음주 사격|비틀 {n}', '{n이} 비틀비틀 아무 데로나 날아간다');
xt('lateseeker', '뒤늦은 추적탄', '엉뚱하게 날아가다 갑자기 방향을 튼다', 'assassin gunner trickster', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, n: 2, spread: 100, path: 'late', size: 2, speed: 220, life: 1.8, st: XS(S, 0.6) }], '{n} 늦깎이 추적|아 맞다 {n}', '{n이} 딴 데로 가다가 "아 맞다" 하고 쫓아간다');
xt('blinkshot', '순간이동탄', '뚝뚝 끊기며 순간이동하듯 날아간다', 'trickster assassin beamer', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D, path: 'blink', pierce: true, size: 2, speed: 200, life: 1.2, st: XS(S, 0.5) }], '{n} 순간이동탄|뿅뿅 {n}', '{n이} 뿅 뿅 순간이동하며 날아간다');
xt('firework', '불꽃놀이', '날아가다 하늘에서 사방으로 터진다', 'idol bomber artillery', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, size: 3, speed: 220, life: 0.6, end: 'burst', n2: 10, st: XS(S, 0.6) }], '{n} 불꽃놀이|팡파레 {n}', '{n이} 날아가다 팡! 사방으로 터진다');
xt('splitter', '쪼개지는 탄', '맞거나 다 날아가면 다섯 조각으로 쪼개진다', 'gunner bomber', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D, split: 5, size: 3, speed: 230, life: 0.9, st: XS(S, 0.5) }], '{n} 분열탄|쪼개지는 {n}', '{n이} 맞으면 다섯 조각으로 쪼개진다');
xt('snowball', '굴러 커지는 공', '날아갈수록 점점 커진다', 'tank glutton lazy', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D, grow: 5, pierce: true, size: 2, speed: 140, life: 1.8, kb: 7, st: XS(S, 0.8) }], '{n} 눈덩이|커지는 {n}', '{n이} 굴러갈수록 점점 커진다');
xt('drill', '드릴', '천천히 뚫고 나가며 계속 갈아 버린다', 'engineer tank brawler', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.45, aura: 9, pierce: true, size: 3, speed: 120, life: 1.6, st: XS(S, 0.5) }], '{n} 드릴|위이잉 {n}', '{n} 드릴이 위이잉 갈면서 뚫고 간다');
xt('bomber', '폭탄 투하', '날아가며 지나가는 길에 폭탄을 떨군다', 'artillery bomber flyer', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.4, drop: 0.14, dropk: 'blast', pierce: true, size: 3, speed: 170, life: 1.4, st: XS(S, 0.5) }], '{n} 폭격기|{n} 투하', '{n이} 날아가며 길에 폭탄을 줄줄이 떨군다');
xt('flametrail', '불길 탄', '지나간 자리에 불길(장판)이 남는다', 'polluter bomber beamer', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, drop: 0.1, dropk: 'zone', size: 2, speed: 200, life: 1.2, st: XS(S, 0.6) }], '{n} 불길|{n} 흔적', '{n이} 지나간 길이 장판이 된다');
xt('magnet', '자석 구슬', '천천히 날아가며 주변을 끌어당겨 갈아 버린다', 'gravity engineer', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.4, pull: 10, aura: 14, pierce: true, size: 3, speed: 100, life: 1.8, st: XS(S, 0.5) }], '{n} 자석|끌려오는 {n}', '{n} 자석이 주변을 끌어당긴다');
xt('repulsor', '밀쳐내기 구슬', '날아가며 주변을 밀어낸다', 'gravity tank flyer', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, pull: -12, aura: 12, pierce: true, size: 3, speed: 190, life: 1.1, kb: 8, st: XS(S, 0.5) }], '{n} 밀어내기|비켜 {n}', '{n이} 날아가며 다 밀어낸다');
xt('ricochet', '도탄', '벽에 세 번 튕기며 날아다닌다', 'gunner trickster', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.7, n: 2, spread: 10, bounce: 3, size: 1, speed: 300, life: 1.6, st: XS(S, 0.4) }], '{n} 도탄|튕기는 {n}', '{n이} 벽에 탕탕 튕긴다');
xt('pinball', '핀볼', '큰 공이 벽마다 튕기며 오래 돌아다닌다', 'trickster spinner idol', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, bounce: 3, pierce: true, size: 3, speed: 250, life: 2.5, kb: 6, st: XS(S, 0.5) }], '{n} 핀볼|띵띵 {n}', '{n이} 핀볼처럼 띵띵 튕겨 다닌다');
xt('shotgun', '산탄 폭발', '코앞에 여덟 발을 확 뿌린다', 'gunner brawler', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.4, n: 8, spread: 55, size: 1, speed: 300, life: 0.35, kb: 4, st: XS(S, 0.4) }], '{n} 산탄|빵 {n}', '코앞에 {n을} 확 뿌린다');
xt('nova', '사방탄', '내 몸에서 열두 방향으로 튀어 나간다', 'spinner idol beamer', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.5, n: 12, from: 'around', size: 2, speed: 210, life: 0.8, st: XS(S, 0.5) }], '{n} 사방탄|{n} 대방출', '내 몸에서 {n이} 사방으로 튀어 나간다');
xt('railgun', '레일건', '한 발이 화면 끝까지 꿰뚫는다', 'gunner engineer beamer', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 1.1, pierce: true, size: 1, speed: 340, life: 1.1, kb: 7, st: XS(S, 0.5) }], '{n} 레일건|관통 {n}', '{n} 한 발이 일직선으로 꿰뚫는다');
xt('twinfan', '쌍물결 부채', '여섯 발이 부채꼴로 물결치며 퍼진다', 'beamer idol', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.45, n: 6, spread: 55, path: 'sine', size: 2, speed: 200, life: 1.2, st: XS(S, 0.5) }], '{n} 물결 부채|{n} 파도타기', '{n} 여섯 줄기가 물결치며 퍼진다');
xt('auraorb', '오라 구슬', '느린 구슬이 지나가며 계속 아프게 한다', 'healer polluter beamer', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.35, aura: 16, pierce: true, size: 3, speed: 85, life: 2.2, st: XS(S, 0.5) }], '{n} 오라|{n} 기운 구슬', '느릿한 {n} 구슬 주변이 다 아프다');
xt('stickybomb', '끈끈이 폭탄', '날아가 땅에 붙었다가 터지며 끈적하게 만든다', 'bomber trickster glutton', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.3, path: 'stay', size: 3, speed: 180, life: 1.4, end: 'mine', st: XS(S || 'slow', 1.2) }], '{n} 끈끈이|찐득 {n}', '{n이} 땅에 철썩 붙었다가 터진다');
xt('hydra', '히드라', '쫓아가서 맞으면 세 갈래로 다시 갈라진다', 'summoner polluter', '12u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, homing: 0.6, end: 'burst', n2: 3, size: 3, speed: 190, life: 1.5, st: XS(S, 0.6) }], '{n} 히드라|머리 셋 {n}', '{n이} 쫓아가 물고 세 갈래로 갈라진다');
xt('comet', '혜성', '점점 빨라지며 꼬리에 장판을 남기고 쾅', 'artillery beamer', '2u', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, path: 'accel', drop: 0.09, dropk: 'zone', size: 3, speed: 100, life: 1.5, boom: 22, st: XS(S, 0.8) }], '{n} 혜성|꼬리 달린 {n}', '{n} 혜성이 불꼬리를 남기며 쾅');
xt('paperplane', '종이비행기', '두 대가 서로 반대로 휘며 날아간다', 'flyer idol trickster', 'b12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.6, n: 2, path: 'curve', pierce: true, size: 2, speed: 170, life: 1.8, st: XS(S, 0.5) }], '{n} 종이비행기|슝 {n}', '{n} 종이비행기가 서로 엇갈리며 날아간다');
xt('bubbles', '거품 무리', '느린 거품 여섯 개가 비틀비틀 떠다닌다', 'healer lazy idol', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.3, n: 6, spread: 80, path: 'wobble', aura: 7, pierce: true, size: 2, speed: 80, life: 2.2, st: XS(S || 'slow', 0.6) }], '{n} 거품 무리|보글 {n}', '{n} 거품이 둥실둥실 떠다닌다');
xt('stopburst', '멈춤 폭죽', '날아가다 멈춰서 별 모양으로 터진다', 'idol bomber', '12', 'shot', (D, S) => [{ t: 'shot', dmg: D * 0.4, path: 'stay', size: 3, speed: 220, life: 0.9, end: 'burst', n2: 8, st: XS(S, 0.6) }], '{n} 멈춤 폭죽|멈칫 {n}', '{n이} 멈칫하더니 팡 터진다');

/* ---------- 모양 폭격 (34) ---------- */
const PT = (shape, at, kind, D, S, o) => Object.assign({ t: 'pattern', shape, at, kind, dmg: D, st: S }, o || {});
xt('starburst', '별 폭발', '적 주위에 별 모양으로 폭발이 번진다', 'bomber idol', '12u', 'boom', (D, S) => [PT('star', 'target', 'blast', D * 0.7, XS(S, 0.8), { size: 40, r: 9, step: 0.06 })], '{n} 별 폭발|반짝 {n}', '적 주위에 별 모양으로 {n이} 터진다');
xt('crosspillar', '십자 기둥', '적 위치에서 십자로 기둥이 솟는다', 'tank artillery', '12u', 'wave', (D, S) => [PT('cross', 'target', 'pillar', D * 0.7, XS(S || 'air', 0.6), { size: 36, r: 9, step: 0.05 })], '{n} 십자 기둥|열십자 {n}', '십자 모양으로 {n} 기둥이 솟는다');
xt('xburst', 'X자 폭발', '적 위치에 X자로 폭발한다', 'bomber assassin', '12', 'boom', (D, S) => [PT('x', 'target', 'blast', D * 0.7, XS(S, 0.6), { size: 34, r: 9, step: 0.05 })], '{n} 엑스|X자 {n}', 'X자로 {n이} 펑펑 터진다');
xt('grid', '바둑판 폭격', '하늘에서 바둑판 모양으로 떨어진다', 'artillery', '2u', 'rain', (D, S) => [PT('grid', 'target', 'drop', D * 0.6, XS(S, 0.6), { size: 30, r: 9, step: 0 })], '{n} 바둑판|{n} 융단폭격', '바둑판 모양으로 {n이} 떨어진다');
xt('checker', '체크무늬 폭발', '체크무늬 칸칸이 번갈아 터진다', 'trickster engineer', '12u', 'boom', (D, S) => [PT('checker', 'target', 'blast', D * 0.6, XS(S, 0.6), { size: 36, r: 8, delay: 0.3, step: 0.4 })], '{n} 체크무늬|번갈아 {n}', '체크무늬 칸이 번갈아 터진다');
xt('heartbomb', '하트 폭발', '적 주위에 하트 모양으로 터진다', 'idol healer', '12u', 'boom', (D, S) => [PT('heart', 'target', 'blast', D * 0.6, XS(S || 'dance', 0.8), { size: 34, r: 8, step: 0.04 })], '{n} 하트 폭발|사랑의 {n}', '하트 모양으로 {n이} 터진다. 설렘 주의');
xt('squarecage', '네모 감옥', '적을 네모로 둘러 기둥이 솟는다', 'tank trickster', '12u', 'wave', (D, S) => [PT('square', 'target', 'pillar', D * 0.5, XS(S || 'root', 0.8), { size: 20, r: 8, step: 0.02 })], '{n} 네모 감옥|{n} 울타리', '적을 네모로 둘러싸고 기둥이 솟는다');
xt('triangle', '삼각 진법', '삼각형으로 땅에서 가시가 솟는다', 'trickster nagger', '12', 'wave', (D, S) => [PT('triangle', 'target', 'spike', D * 0.7, XS(S, 0.6), { size: 36, r: 7, step: 0.03 })], '{n} 삼각진|세모 {n}', '삼각형 모양으로 {n} 가시가 솟는다');
xt('spiralblast', '나선 폭발', '나선을 그리며 차례로 터져 나간다', 'spinner bomber', '2u', 'boom', (D, S) => [PT('spiral', 'self', 'blast', D * 0.6, XS(S, 0.6), { size: 90, n: 12, r: 9, delay: 0.1, step: 0.06 })], '{n} 나선 폭발|빙글 {n}', '내 주위에서 나선을 그리며 차례로 터진다');
xt('linefront', '일직선 폭발', '앞으로 일직선을 따라 차례로 터진다', 'bomber brawler', 'b12', 'boom', (D, S) => [PT('line', 'self', 'blast', D * 0.6, XS(S, 0.5), { size: 70, r: 8, delay: 0.05, step: 0.05 })], '{n} 일직선|{n} 도미노', '앞으로 일직선을 따라 {n이} 펑펑펑');
xt('zigline', '번개 길', '앞으로 지그재그로 가시가 솟는다', 'beamer speedster', 'b12', 'wave', (D, S) => [PT('zigzag', 'self', 'spike', D * 0.6, XS(S || 'stun', 0.3), { size: 80, r: 7, step: 0.04 })], '{n} 번개 길|지그재그 {n}', '앞으로 번개처럼 꺾이며 {n} 가시가 솟는다');
xt('arrowhead', '화살촉 진격', '앞쪽에 화살촉 모양으로 기둥이 솟는다', 'brawler tank', '12u', 'wave', (D, S) => [PT('arrow', 'self', 'pillar', D * 0.6, XS(S || 'air', 0.5), { size: 60, r: 8, step: 0.04 })], '{n} 화살촉|돌격 {n}', '앞쪽에 화살촉 모양으로 {n} 기둥이 솟는다');
xt('scatter', '무작위 폭탄', '적 주변 아무 데나 떨어진다', 'artillery lazy bomber', '12u', 'rain', (D, S) => [PT('random', 'target', 'drop', D * 0.6, XS(S, 0.5), { size: 44, r: 9, n: 8, step: 0.07 })], '{n} 아무 데나|복불복 {n}', '적 주변 아무 데나 {n이} 떨어진다');
xt('flower', '꽃잎 폭발', '꽃잎 모양으로 겹겹이 터진다', 'healer idol', '12u', 'boom', (D, S) => [PT('flower', 'target', 'blast', D * 0.6, XS(S || 'sleep', 0.6), { size: 36, r: 8, step: 0.12 })], '{n} 꽃잎|꽃피는 {n}', '꽃잎 모양으로 {n이} 겹겹이 터진다');
xt('smile', '웃는 얼굴 폭발', '적 위치에 웃는 얼굴 모양으로 터진다', 'idol trickster lazy', '12u', 'boom', (D, S) => [PT('smile', 'target', 'blast', D * 0.6, XS(S || 'confuse', 0.8), { size: 38, r: 8, step: 0.05 })], '{n} 스마일|^_^ {n}', '웃는 얼굴 모양으로 {n이} 터진다 ^_^');
xt('wavesweep', '쓸어오는 폭발', '왼쪽에서 오른쪽으로 쓸어오며 터진다', 'artillery tank flyer', '2u', 'boom', (D, S) => [PT('wave', 'target', 'blast', D * 0.6, XS(S, 0.6), { size: 44, r: 9, step: 0.1 })], '{n} 쓸어오기|{n} 파도', '한쪽에서부터 {n이} 쓸어오며 터진다');
xt('kk', 'ㅋㅋ 폭격', '하늘에서 ㅋㅋ 글자 모양으로 떨어진다', 'trickster idol nagger lazy', '2u', 'rain', (D, S) => [PT('kk', 'target', 'drop', D * 0.5, XS(S || 'confuse', 0.8), { size: 40, r: 7, step: 0.03 })], 'ㅋㅋ {n} 폭격|{n} ㅋㅋㅋ', '하늘에서 ㅋㅋ 모양으로 {n이} 떨어진다. 비웃음 주의');
xt('hexa', '벌집 폭발', '벌집처럼 일곱 칸이 한꺼번에 터진다', 'summoner engineer', '12u', 'boom', (D, S) => [PT('hex', 'target', 'blast', D * 0.6, XS(S || 'poison', 0.8), { size: 22, r: 9, step: 0 })], '{n} 벌집|육각 {n}', '벌집 모양으로 {n이} 한꺼번에 터진다');
xt('ringpillar', '기둥 원', '내 주위에 원을 그리며 기둥이 솟는다', 'tank healer', '12u', 'wave', (D, S) => [PT('ring', 'self', 'pillar', D * 0.6, XS(S || 'air', 0.5), { size: 40, r: 9, n: 10, step: 0.03 })], '{n} 기둥 원|{n} 방벽', '내 주위로 원을 그리며 {n} 기둥이 솟는다');
xt('doublering', '이중 고리 폭발', '내 주위에 안쪽 고리, 바깥 고리가 차례로 터진다', 'spinner tank', '12u', 'boom', (D, S) => [PT('double', 'self', 'blast', D * 0.6, XS(S, 0.5), { size: 58, r: 9, n: 7, delay: 0.15, step: 0.3 })], '{n} 이중 고리|두 겹 {n}', '안쪽, 바깥쪽 차례로 {n이} 터진다');
xt('bigring', '원형 포위 폭발', '적을 크게 둘러싸고 한꺼번에 터진다', 'artillery gravity', '2u', 'boom', (D, S) => [PT('ring', 'target', 'blast', D * 0.6, XS(S, 0.6), { size: 46, r: 10, n: 10, step: 0 })], '{n} 포위|빙 둘러 {n}', '적을 빙 둘러싸고 {n이} 한꺼번에 터진다');
xt('selfstar', '내 주위 별 가시', '내 몸을 중심으로 별 모양 가시가 솟는다', 'spinner brawler', '12', 'wave', (D, S) => [PT('star', 'self', 'spike', D * 0.6, XS(S, 0.5), { size: 56, r: 7, step: 0.05 })], '{n} 별가시|반짝 가시 {n}', '내 몸에서 별 모양으로 {n} 가시가 뻗는다');
xt('raindrop', '소나기 낙하', '작은 것이 열두 개 우수수 떨어진다', 'artillery flyer', '12u', 'rain', (D, S) => [PT('random', 'target', 'drop', D * 0.35, XS(S || 'slow', 0.5), { size: 50, r: 6, n: 12, step: 0.05 })], '{n} 소나기|우수수 {n}', '{n이} 소나기처럼 우수수 떨어진다');
xt('cagedrop', '철창 낙하', '하늘에서 네모난 철창이 떨어진다', 'trickster nagger', '2u', 'rain', (D, S) => [PT('square', 'target', 'drop', D * 0.5, XS(S || 'root', 0.8), { size: 20, r: 7, step: 0 })], '{n} 철창|{n} 감옥 낙하', '하늘에서 {n} 철창이 쿵 떨어진다');
xt('chasebombs', '추적 폭발줄', '나에서 적 쪽으로 차례로 폭발이 이어진다', 'bomber artillery', '12u', 'boom', (D, S) => [PT('line', 'self', 'blast', D * 0.6, XS(S, 0.5), { size: 110, r: 9, delay: 0.05, step: 0.08 })], '{n} 폭발줄|따라가는 {n}', '{n} 폭발이 적 쪽으로 쭉 이어진다');
xt('tribomb', '삼각 폭격', '하늘에서 삼각형으로 떨어진다', 'artillery', '12u', 'rain', (D, S) => [PT('triangle', 'target', 'drop', D * 0.6, XS(S, 0.6), { size: 36, r: 8, step: 0.02 })], '{n} 삼각 폭격|세모 {n}', '삼각형 모양으로 {n이} 떨어진다');
xt('crossdrop', '십자 낙하', '하늘에서 십자 모양으로 떨어진다', 'artillery healer', '12u', 'rain', (D, S) => [PT('cross', 'target', 'drop', D * 0.6, XS(S, 0.6), { size: 34, r: 8, step: 0.03 })], '{n} 십자 낙하|{n}의 십자가', '하늘에서 십자 모양으로 {n이} 떨어진다');
xt('spiralspike', '소용돌이 가시', '내 주위에 소용돌이 모양으로 가시가 솟는다', 'spinner polluter', '12u', 'wave', (D, S) => [PT('spiral', 'self', 'spike', D * 0.6, XS(S, 0.5), { size: 85, n: 12, r: 7, step: 0.04 })], '{n} 소용돌이 가시|빙글 가시', '소용돌이를 그리며 {n} 가시가 솟는다');
xt('heartcage', '하트 감옥', '적 주위에 하트 모양 기둥이 솟아 가둔다', 'idol trickster', '2u', 'wave', (D, S) => [PT('heart', 'target', 'pillar', D * 0.5, XS(S || 'root', 0.9), { size: 24, r: 7, step: 0.02 })], '{n} 하트 감옥|사랑의 감옥', '하트 모양 {n} 기둥이 솟아 가둔다');
xt('randspike', '가시밭', '적 주변 땅에서 가시가 마구 솟는다', 'polluter trickster', '12u', 'wave', (D, S) => [PT('random', 'target', 'spike', D * 0.5, XS(S, 0.5), { size: 40, r: 7, n: 10, step: 0.04 })], '{n} 가시밭|따끔 {n}', '적 주변 땅에서 {n} 가시가 마구 솟는다');
xt('gridpillar', '기둥 숲', '바둑판 모양으로 기둥이 솟는다', 'tank engineer', '2u', 'wave', (D, S) => [PT('grid', 'target', 'pillar', D * 0.5, XS(S || 'air', 0.5), { size: 28, r: 8, step: 0.05 })], '{n} 기둥 숲|{n} 빌딩숲', '바둑판처럼 {n} 기둥이 솟는다');
xt('wavespike', '밀려오는 가시', '앞쪽에서 가시 물결이 밀려온다', 'tank brawler', '12u', 'wave', (D, S) => [PT('wave', 'front', 'spike', D * 0.6, XS(S, 0.5), { size: 40, r: 7, step: 0.08 })], '{n} 가시 물결|{n} 파도 가시', '{n} 가시가 물결처럼 밀려온다');
xt('flowerpillar', '꽃 기둥', '꽃잎 모양으로 기둥이 피어난다', 'healer idol', '2u', 'wave', (D, S) => [PT('flower', 'target', 'pillar', D * 0.5, XS(S || 'sleep', 0.6), { size: 34, r: 7, step: 0.1 })], '{n} 꽃 기둥|피어나는 {n}', '꽃잎 모양으로 {n} 기둥이 피어난다');
xt('starring', '별 낙하', '별 모양으로 하늘에서 떨어진다', 'artillery idol flyer', '2u', 'rain', (D, S) => [PT('star', 'target', 'drop', D * 0.6, XS(S, 0.6), { size: 40, r: 8, step: 0.03 })], '{n} 별 낙하|별똥 {n}', '별 모양으로 {n이} 하늘에서 떨어진다');

/* ---------- 연속기·근접·합체 기술 (30) ---------- */
xt('spin3', '회전 베기', '세 바퀴 빙글빙글 돌며 벤다', 'spinner brawler', '12u', 'swing', (D, S) => [{ t: 'swing', dmg: D * 0.5, r: 26, arc: 360, n: 3, kb: 5, st: XS(S, 0.4) }], '{n} 회전 베기|팽이 {n}', '세 바퀴 빙글빙글 돌며 {n으로} 벤다');
xt('combo3', '삼단 콤보', '베고 찌르고 띄운다', 'brawler assassin', '12u', 'swing', (D, S) => [{ t: 'swing', dmg: D * 0.35, r: 22, arc: 120, kb: 2 }, { t: 'thrust', dmg: D * 0.35, len: 40, w: 6, n: 1, kb: 3 }, { t: 'launch', dmg: D * 0.4, r: 15, off: 14, d: 0.9 }], '{n} 삼단 콤보|원투쓰리 {n}', '베고 → 찌르고 → 하늘로 띄운다');
xt('shoulder', '어깨 돌진', '어깨로 들이받고 땅을 쿵 구른다', 'tank brawler', '12', 'dash', (D, S) => [{ t: 'dash', dist: 90, dmg: D * 0.6, kb: 8 }, { t: 'stomp', dmg: D * 0.4, n: 1, r: 26, kb: 6, st: XS(S, 0.5) }], '{n} 어깨빵|{n} 태클', '어깨로 들이받고 땅을 쿵!');
xt('backflip', '공중제비 사격', '뒤로 공중제비 돌며 세 발을 쏜다', 'gunner speedster assassin', '12', 'shot', (D, S) => [{ t: 'blink', to: 'back', dist: 70 }, { t: 'shot', dmg: D * 0.45, n: 3, spread: 30, size: 2, speed: 260, life: 0.9, st: XS(S, 0.4) }], '{n} 백덤블링|공중제비 {n}', '뒤로 공중제비 돌면서 {n} 세 발');
xt('groundpound', '지면 강타', '뛰어올라 내려찍자 가시가 원으로 솟는다', 'brawler tank', '2u', 'wave', (D, S) => [{ t: 'leap', dmg: D * 0.5, r: 26, dist: 120, kb: 8 }, PT('ring', 'self', 'spike', D * 0.4, XS(S, 0.5), { size: 30, r: 8, n: 10, delay: 0.55, step: 0 })], '{n} 지면 강타|쾅 {n}', '뛰어올라 쾅! 착지하면 가시 원이 솟는다');
xt('whirlwind', '회오리 돌진', '빙글빙글 돌면서 돌진한다', 'spinner speedster', '12u', 'dash', (D, S) => [{ t: 'dash', dist: 110, dmg: D * 0.4, kb: 5, invuln: true }, { t: 'swing', dmg: D * 0.4, r: 28, arc: 360, n: 2, kb: 5, st: XS(S, 0.4) }], '{n} 회오리 돌진|빙글 돌격', '빙글빙글 돌면서 돌진한다');
xt('upslam', '띄우고 내려찍기', '하늘로 띄운 다음 그 자리에 운석을 떨군다', 'brawler artillery', '2u', 'meteor', (D, S) => [{ t: 'launch', dmg: D * 0.4, r: 16, off: 14, d: 1 }, { t: 'meteor', dmg: D * 0.6, r: 26, kb: 8, st: XS(S, 0.8) }], '{n} 띄우고 쾅|올렸다 내려찍기', '하늘로 띄우고 {n} 운석으로 내려찍는다');
xt('sweepkick', '발 쓸기', '낮게 다리를 휘둘러 넘어뜨린다', 'brawler speedster', 'b12', 'swing', (D, S) => [{ t: 'swing', dmg: D * 0.8, r: 22, arc: 200, n: 1, kb: 3, st: XS(S || 'slip', 0.8) }], '{n} 다리 후리기|휘청 {n}', '낮게 휘둘러서 다리를 건다');
xt('dashslash', '질주 베기', '스쳐 지나가며 세 줄로 할퀸다', 'assassin speedster', '12u', 'dash', (D, S) => [{ t: 'phantom', dmg: D * 0.5, dist: 110 }, { t: 'claw', dmg: D * 0.25, r: 30, kb: 2, st: XS(S, 0.5) }], '{n} 질주 베기|휙 {n}', '휙 지나가며 {n으로} 세 줄 할퀸다');
xt('blinkstrike', '순간이동 기습', '적 뒤로 순간이동해 한 바퀴 벤다', 'assassin trickster', '12u', 'blink', (D, S) => [{ t: 'blink', to: 'behind', dist: 140 }, { t: 'swing', dmg: D * 0.8, r: 26, arc: 360, n: 1, kb: 6, st: XS(S, 0.6) }], '{n} 기습|뒤에 있지롱', '순간이동해서 "뒤에 있지롱" 하고 벤다');
xt('grabthrow', '잡아 던지기', '잡아채서 내 앞으로 패대기친다', 'brawler tank', '12u', 'hook', (D, S) => [{ t: 'grab', dmg: D * 0.6, r: 18, range: 170, delay: 0.4, kb: 9 }, { t: 'stomp', dmg: D * 0.3, n: 1, r: 24, kb: 6, st: XS(S || 'stun', 0.5) }], '{n} 패대기|잡았다 {n}', '잡아채서 바닥에 패대기!');
xt('hammerdrop', '망치 내려찍기', '뛰어올라 내려찍자 땅이 갈라진다', 'brawler tank', '2u', 'wave', (D, S) => [{ t: 'leap', dmg: D * 0.5, r: 26, dist: 120, kb: 8 }, { t: 'crack', dmg: D * 0.5, len: 170, speed: 220, r: 11, kb: 5, st: XS(S, 0.6) }], '{n} 내려찍기|쩍 갈라지는 {n}', '뛰어올라 쾅! 땅이 쩍 갈라진다');
xt('counterwave', '반격 파동', '버티다가 맞으면 받아치고 파동을 낸다', 'tank healer', '12', 'counter', (D, S) => [{ t: 'buff', k: 'counter', d: 1.4 }, { t: 'wave', dmg: D * 0.6, r: 46, at: 'self', kb: 8, st: XS(S, 0.5) }], '{n} 반격 파동|받아라 {n}', '버티다가 되받아치고 파동까지');
xt('shieldbash', '방패 밀치기', '방패를 세우고 벽을 밀고 나간다', 'tank', '12u', 'wave', (D, S) => [{ t: 'buff', k: 'shield', d: 3, pow: 22 }, { t: 'surge', dmg: D * 0.7, w: 50, len: 130, speed: 180, kb: 9, st: XS(S, 0.5) }], '{n} 방패 밀치기|{n} 방벽 돌진', '방패를 세우고 앞으로 쭉 밀고 나간다');
xt('blitz', '연속 순간이동', '세 번 순간이동하며 난도질한다', 'assassin speedster', '2u', 'blink', (D, S) => [{ t: 'phantom', dmg: D * 0.3, dist: 90 }, { t: 'phantom', dmg: D * 0.3, dist: 90 }, { t: 'flurry', dmg: D * 0.1, r: 26, off: 0, dur: 0.6, ticks: 6, st: XS(S, 0.6) }], '{n} 섬광|번쩍번쩍 {n}', '번쩍! 번쩍! 순간이동하며 난도질');
xt('tornadodash', '회오리 질주', '돌진하고 그 자리에 회오리를 남긴다', 'flyer spinner speedster', '12u', 'dash', (D, S) => [{ t: 'dash', dist: 110, dmg: D * 0.5, kb: 5, invuln: true }, { t: 'tornado', dmg: D * 0.15, r: 16, speed: 70, life: 2.5, st: XS(S, 0.6) }], '{n} 회오리 질주|돌개 {n}', '돌진하고 그 자리에 {n} 회오리를 남긴다');
xt('bodyslam', '몸통 박치기', '온몸으로 들이받고 그 자리에서 터진다', 'glutton tank brawler', '12', 'dash', (D, S) => [{ t: 'dash', dist: 80, dmg: D * 0.5, kb: 7 }, { t: 'blast', dmg: D * 0.5, r: 24, at: 'self', delay: 0.05, kb: 7, st: XS(S, 0.5) }], '{n} 몸통 박치기|배치기 {n}', '온몸으로 들이받고 쾅 터진다');
xt('trapline', '덫 깔기', '지뢰 세 개를 깔고 그물을 던진다', 'trickster engineer lazy', '2u', 'mine', (D, S) => [{ t: 'summon', kind: 'mine', n: 3, dmg: D * 0.6, dur: 8, st: XS(S, 0.8) }, { t: 'net', dmg: D * 0.2, speed: 220, range: 140, r: 16, d: 1.5 }], '{n} 덫|{n} 함정', '지뢰를 깔고 그물을 던진다');
xt('turretwall', '포탑 진지', '포탑 둘을 세우고 앞에 불벽을 친다', 'engineer', '2u', 'turret', (D, S) => [{ t: 'summon', kind: 'turret', n: 2, dmg: D * 0.2, rate: 1.2, dur: 7 }, { t: 'firewall', dmg: D * 0.1, len: 70, off: 30, dur: 3, st: XS(S, 0.5) }], '{n} 진지|{n} 요새', '포탑 두 대와 불벽으로 진지를 만든다');
xt('decoy', '미끼 인형', '분신을 남기고 투명해져 사라진다', 'trickster assassin', '12', 'invis', (D, S) => [{ t: 'clone', dmg: D * 0.7, n: 1, r: 18, dur: 5 }, { t: 'blink', to: 'random', dist: 80 }, { t: 'buff', k: 'invis', d: 2 }], '{n} 미끼|가짜 나 {n}', '가짜 나를 두고 슥 사라진다');
xt('vampbite', '흡혈 물기', '덥석 물고 그만큼 회복한다', 'assassin glutton', '12', 'heal', (D, S) => [{ t: 'bite', dmg: D * 0.8, r: 14, range: 50, kb: 3, st: XS(S, 0.5) }, { t: 'heal', amt: Math.round(D * 0.6) }], '{n} 흡혈|쪽쪽 {n}', '덥석 물고 쪽쪽 빨아 회복한다');
xt('meteorrain', '유성우', '줄줄이 떨어지고 번개까지 친다', 'artillery flyer', 'u', 'rain', (D, S) => [{ t: 'skyline', dmg: D * 0.35, n: 9, step: 20, r: 12, st: XS(S, 0.8) }, { t: 'storm', dmg: D * 0.2, n: 8, r: 54 }], '{n} 유성우|하늘이 무너진다', '하늘에서 {n이} 줄줄이 떨어지고 번개까지');
xt('earthquake', '대지진', '쿵쿵 구르고 땅이 갈라지고 가시가 솟는다', 'tank brawler', 'u', 'wave', (D, S) => [{ t: 'stomp', dmg: D * 0.3, n: 3, r: 30, kb: 7 }, { t: 'crack', dmg: D * 0.3, len: 200, speed: 220, r: 12 }, PT('random', 'self', 'spike', D * 0.3, XS(S || 'stun', 0.6), { size: 70, r: 7, n: 10, delay: 0.4, step: 0.05 })], '{n} 대지진|진도 9 {n}', '쿵쿵쿵! 땅이 갈라지고 가시가 마구 솟는다');
xt('blackhole', '블랙홀 폭발', '빨아들인 다음 한가운데서 터진다', 'gravity polluter', 'u', 'pull', (D, S) => [{ t: 'vortex', dmg: D * 0.1, r: 46, dur: 1.6, pull: 13, at: 'target' }, { t: 'blast', dmg: D * 0.8, r: 34, at: 'target', delay: 1.5, kb: 10, st: XS(S || 'stun', 1) }], '{n} 블랙홀|빨려들어가 {n}', '모두 빨아들인 다음 한가운데서 쾅!');
xt('lasercage', '레이저 감옥', '레이저망을 치고 고리로 가둔다', 'beamer engineer', 'u', 'beam', (D, S) => [{ t: 'lasergrid', dmg: D * 0.5, n: 5, delay: 0.7, kb: 3 }, { t: 'ring', dmg: D * 0.15, r: 32, dur: 3.5, at: 'target', st: XS(S || 'root', 1) }], '{n} 레이저 감옥|{n} 철통 감시', '레이저망을 치고 빠져나오면 아픈 고리로 가둔다');
xt('thunderchain', '번개 사슬', '네 명에게 옮겨 붙고 번개가 내리친다', 'beamer', '2u', 'chain', (D, S) => [{ t: 'chain', dmg: D * 0.4, n: 4, range: 110, st: XS(S || 'stun', 0.4) }, { t: 'storm', dmg: D * 0.2, n: 5, r: 40 }], '{n} 번개 사슬|찌릿찌릿 {n}', '{n이} 네 명에게 옮겨 붙고 번개가 친다');
xt('icefield', '얼음 들판', '적 주변을 빙판으로 만들고 얼음 가시를 세운다', 'trickster lazy', '2u', 'zone', (D, S) => [{ t: 'zone', dmg: D * 0.05, r: 40, dur: 4, at: 'target', st: { k: 'slip', d: 1 } }, PT('random', 'target', 'spike', D * 0.5, XS(S || 'freeze', 0.8), { size: 36, r: 7, n: 8, delay: 0.3, step: 0.05 })], '{n} 빙판|미끌미끌 {n}', '바닥을 빙판으로 만들고 가시를 세운다');
xt('sandstorm', '모래폭풍', '회오리 둘이 굴러가며 주변을 느리게 만든다', 'flyer polluter', '2u', 'wind', (D, S) => [{ t: 'tornado', dmg: D * 0.15, r: 18, speed: 80, life: 3 }, { t: 'zone', dmg: D * 0.05, r: 46, dur: 4, at: 'target', st: XS(S || 'slow', 1) }], '{n} 모래폭풍|{n} 황사', '{n} 회오리가 굴러다니고 주변이 뿌옇다');
xt('clonearmy', '분신 군단', '분신 셋이 달려들고 나도 난도질한다', 'assassin trickster idol', 'u', 'clone', (D, S) => [{ t: 'clone', dmg: D * 0.4, n: 3, r: 18, dur: 5 }, { t: 'flurry', dmg: D * 0.06, r: 26, off: 20, dur: 0.8, ticks: 8, st: XS(S, 0.6) }], '{n} 분신 군단|나 x 4', '분신 셋이 달려들고 나도 마구 벤다');
xt('finale', '대폭죽 피날레', '폭죽이 터지고 별 모양 폭격이 쏟아진다', 'idol bomber artillery', 'u', 'rain', (D, S) => [{ t: 'shot', dmg: D * 0.3, n: 3, spread: 50, size: 3, speed: 220, life: 0.6, end: 'burst', n2: 8 }, PT('star', 'target', 'drop', D * 0.4, XS(S || 'dance', 1), { size: 46, r: 9, delay: 0.3, step: 0.03 })], '{n} 피날레|{n} 대폭죽', '폭죽이 펑펑 터지고 별 모양으로 쏟아진다');

/** 능력 조립용 기술 틀 */
function xtKit(X, slot) {
  return { m: X.m, fx: (P, S) => X.make(XT_D[slot] * P, S), name: X.names, desc: X.descs, xt: X.key };
}
/** AI 설명서에 넣을 짧은 목록 */
function xtDoc() { return XT_LIST.map((x) => `${x.key} ${x.ko}`).join(' · '); }
/** 능력 조립용: 유형·칸에 맞는 추가 공격 */
function xtFor(style, slot) {
  const c = { basic: 'b', s1: '1', s2: '2', ult: 'u' }[slot];
  return XT_LIST.filter((x) => x.slots.includes(c) && x.sty.includes(style));
}

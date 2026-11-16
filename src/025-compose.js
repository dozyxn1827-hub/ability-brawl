/* ===== AI 없이 능력 만들기: 글 속 단어를 읽어 기술 네 개와 부작용을 조립한다 ===== */

/* ----- 주제(소재) 사전: 겉모습·색·모양·소리·상태이상·어울리는 기술 ----- */
const THEME = {
  fire:   { vfx: 'fire', shape: 'fire', c: ['#ff6a1f', '#ffb02e'], sfx: 'crackle', st: 'burn', aura: 'flame', body: '#b3261e', hair: '#ff7a2f', head: 'spiky', feel: ['shot', 'boom', 'zone'] },
  ice:    { vfx: 'ice', shape: 'ice', c: ['#7fd8ff', '#e8f6ff'], sfx: 'chime', st: 'freeze', aura: 'frost', body: '#2f6fb5', hair: '#e8f6ff', head: 'hood', feel: ['shot', 'zone', 'shield'] },
  elec:   { vfx: 'electric', shape: 'bolt', c: ['#ffe14a', '#fff9c2'], sfx: 'zap', st: 'stun', aura: 'spark', body: '#3a3a8c', hair: '#ffe14a', head: 'spiky', feel: ['beam', 'rain', 'dash'] },
  water:  { vfx: 'water', shape: 'drop', c: ['#3fa8ff', '#9fe8ff'], sfx: 'splash', st: 'slow', aura: 'bubble', body: '#1f5f9f', hair: '#7fd0ff', head: 'long', feel: ['shot', 'beam', 'zone'] },
  wind:   { vfx: 'wind', shape: 'feather', c: ['#9ff0d8', '#ffffff'], sfx: 'whoosh', st: 'slow', aura: 'wind', body: '#2f8f7f', hair: '#c8fff0', head: 'ponytail', feel: ['dash', 'shot', 'pull'] },
  earth:  { vfx: 'earth', shape: 'rock', c: ['#a07a4a', '#e0c08a'], sfx: 'thud', st: 'stun', aura: 'none', body: '#6a4a2a', hair: '#3a2a1a', head: 'short', feel: ['boom', 'rain', 'shield'] },
  plant:  { vfx: 'nature', shape: 'leaf', c: ['#4fbf5f', '#c8f070'], sfx: 'chirp', st: 'root', aura: 'leaf', body: '#2f7f3f', hair: '#7fd060', head: 'long', feel: ['zone', 'summon', 'heal'] },
  stink:  { vfx: 'poison', shape: 'bubble', c: ['#9fd14f', '#e0ff8a'], sfx: 'fart', st: 'poison', aura: 'toxic', body: '#5a7a2a', hair: '#a8c040', head: 'short', feel: ['zone', 'shot', 'trail'] },
  poison: { vfx: 'poison', shape: 'skull', c: ['#8fd14f', '#d0ff70'], sfx: 'bloop', st: 'poison', aura: 'toxic', body: '#3a5a2a', hair: '#8fd14f', head: 'hood', feel: ['shot', 'zone', 'all'] },
  holy:   { vfx: 'holy', shape: 'star', c: ['#fff1a0', '#ffffff'], sfx: 'choir', st: 'stun', aura: 'holy', body: '#f0e0b0', hair: '#ffe98a', head: 'halo', feel: ['beam', 'heal', 'all'] },
  dark:   { vfx: 'shadow', shape: 'moon', c: ['#8a5ad0', '#d0a8ff'], sfx: 'warp', st: 'silence', aura: 'shadow', body: '#2a1f3f', hair: '#1a1020', head: 'hood', feel: ['blink', 'invis', 'shot'] },
  space:  { vfx: 'void', shape: 'star', c: ['#7a5aff', '#c8b0ff'], sfx: 'rumble', st: 'heavy', aura: 'star', body: '#1f1a4a', hair: '#c8b0ff', head: 'long', feel: ['pull', 'rain', 'all'] },
  time:   { vfx: 'arcane', shape: 'gear', c: ['#ffd98a', '#fff6d0'], sfx: 'bell', st: 'freeze', aura: 'star', body: '#5b3f8c', hair: '#d8d8e8', head: 'hat', feel: ['all', 'blink', 'shot'] },
  sound:  { vfx: 'sound', shape: 'note', c: ['#ff8ad8', '#ffd0f0'], sfx: 'kazoo', st: 'confuse', aura: 'none', body: '#8f2f7f', hair: '#ff8ad8', head: 'ponytail', feel: ['beam', 'all', 'shot'] },
  love:   { vfx: 'cute', shape: 'heart', c: ['#ff7ab0', '#ffd0e0'], sfx: 'squeak', st: 'dance', aura: 'none', body: '#d84f8a', hair: '#ffb0d0', head: 'ponytail', feel: ['shot', 'heal', 'summon'] },
  sleep:  { vfx: 'sleep', shape: 'moon', c: ['#9aa8ff', '#dfe4ff'], sfx: 'whistle', st: 'sleep', aura: 'none', body: '#4a5aa8', hair: '#c8d0ff', head: 'cap', feel: ['zone', 'all', 'heal'] },
  metal:  { vfx: 'metal', shape: 'blade', c: ['#c8c8d8', '#ffffff'], sfx: 'laser', st: 'weak', aura: 'none', body: '#4a4a5a', hair: '#2a2a2a', head: 'helmet', feel: ['shot', 'dash', 'turret'] },
  tech:   { vfx: 'tech', shape: 'gear', c: ['#5fe0ff', '#c8f8ff'], sfx: 'glitch', st: 'silence', aura: 'spark', body: '#2a3a4a', hair: '#5fe0ff', head: 'robot', feel: ['turret', 'beam', 'summon'] },
  food:   { vfx: 'candy', shape: 'orb', c: ['#ffb04a', '#ffe0a0'], sfx: 'gulp', st: 'heavy', aura: 'none', body: '#e07a3a', hair: '#7a3a1a', head: 'cap', feel: ['shot', 'heal', 'rain'] },
  sweet:  { vfx: 'candy', shape: 'heart', c: ['#ff9ad0', '#fff0a0'], sfx: 'boing', st: 'slip', aura: 'none', body: '#ff7ab0', hair: '#fff0a0', head: 'ponytail', feel: ['shot', 'zone', 'heal'] },
  animal: { vfx: 'nature', shape: 'paw', c: ['#e0a060', '#fff0d0'], sfx: 'meow', st: 'weak', aura: 'none', body: '#8a5a3a', hair: '#e0a060', head: 'ears', feel: ['summon', 'dash', 'shot'] },
  bug:    { vfx: 'nature', shape: 'orb', c: ['#ffe14a', '#2a2a2a'], sfx: 'zap', st: 'poison', aura: 'none', body: '#5a4a1a', hair: '#2a2a1a', head: 'cap', feel: ['summon', 'shot', 'zone'] },
  money:  { vfx: 'gold', shape: 'coin', c: ['#ffcf3a', '#fff2a0'], sfx: 'bell', st: 'weak', aura: 'none', body: '#2a2a3a', hair: '#ffcf3a', head: 'crown', feel: ['rain', 'shot', 'shield'] },
  gross:  { vfx: 'poison', shape: 'drop', c: ['#b8e04f', '#f0ffb0'], sfx: 'slurp', st: 'slip', aura: 'toxic', body: '#6a7a3a', hair: '#9ab04a', head: 'short', feel: ['shot', 'trail', 'zone'] },
  ghost:  { vfx: 'shadow', shape: 'skull', c: ['#c8d0e8', '#ffffff'], sfx: 'growl', st: 'confuse', aura: 'shadow', body: '#d8d8f0', hair: '#ffffff', head: 'hood', feel: ['blink', 'invis', 'summon'] },
  magic:  { vfx: 'arcane', shape: 'eye', c: ['#c080ff', '#f0d0ff'], sfx: 'sparkle', st: 'morph', aura: 'star', body: '#4a2a7a', hair: '#c080ff', head: 'hat', feel: ['shot', 'blink', 'all'] },
  nag:    { vfx: 'sound', shape: 'cube', c: ['#e0e0e0', '#ffffff'], sfx: 'honk', st: 'sleep', aura: 'none', body: '#5a5a6a', hair: '#3a3a3a', head: 'short', feel: ['beam', 'all', 'shot'] },
  gravity:{ vfx: 'void', shape: 'orb', c: ['#8a6aff', '#d0c0ff'], sfx: 'rumble', st: 'heavy', aura: 'star', body: '#2a1f5a', hair: '#8a6aff', head: 'long', feel: ['pull', 'all', 'boom'] },
  speed:  { vfx: 'wind', shape: 'feather', c: ['#9fe8ff', '#ffffff'], sfx: 'whoosh', st: 'slow', aura: 'wind', body: '#1f6faf', hair: '#9fe8ff', head: 'spiky', feel: ['dash', 'haste', 'blink'] },
  power:  { vfx: 'earth', shape: 'rock', c: ['#ff7a3a', '#ffd0a0'], sfx: 'thud', st: 'stun', aura: 'flame', body: '#a83a1a', hair: '#2a1a1a', head: 'spiky', feel: ['dash', 'boom', 'shield'] },
  ball:   { vfx: 'plain', shape: 'orb', c: ['#ff8a3a', '#ffffff'], sfx: 'boing', st: 'stun', aura: 'none', body: '#2f6fd8', hair: '#2a1a1a', head: 'cap', feel: ['shot', 'dash', 'rain'] },
  ki:     { vfx: 'plain', shape: 'orb', c: ['#5fc8ff', '#d0f0ff'], sfx: 'pew', st: 'stun', aura: 'none', body: '#d8782f', hair: '#2a1a1a', head: 'spiky', feel: ['shot', 'boom', 'beam'] },
};

/* ----- 단어 사전: [찾을 말, 주제, 덧입힐 값] — 글에 나온 단어가 기술 이름·모양·소리가 된다 ----- */
const LEX = [
  // 자연·원소
  [/불꽃|불길|화염|불덩이|불(?!편|가|안|만|쌍|러|고|리|러)|용암|마그마|태양|해님/, 'fire'],
  [/얼음|눈보라|냉기|빙하|고드름|눈사람|겨울|서리|얼리|얼어/, 'ice'],
  [/번개|전기|천둥|벼락|감전|스파크|정전기/, 'elec'],
  [/물(?!건|어|리)|바다|파도|홍수|비(?=를|가|가 |\s|$)|빗물|수영|분수|물방울/, 'water'],
  [/바람|태풍|회오리|폭풍|선풍기|입김|부채/, 'wind'],
  [/땅|흙|돌|바위|지진|모래|산(?!책)/, 'earth'],
  [/나무|꽃|풀|덩굴|씨앗|버섯|숲|선인장|잔디/, 'plant'],
  [/독(?!서|수리)|맹독|오염|산성|방사능/, 'poison'],
  [/빛|광채|태양광|천사|신성|성스|무지개/, 'holy'],
  [/어둠|그림자|암흑|밤(?!송이)|악마|저주/, 'dark'],
  [/우주|별(?!로)|은하|운석|블랙홀|외계인|ufo|UFO|행성|달(?!리|려|라|콤)/, 'space'],
  [/시간|초시계|시계|타임|되감|정지|멈추|멈춘/, 'time'],
  [/중력|무게|무겁|끌어당|자석/, 'gravity'],
  // 몸·병맛
  [/방귀|뿡/, 'stink', { shape: 'bubble', sfx: 'fart' }],
  [/냄새|발냄새|구린|악취|양말|겨드랑/, 'stink', { sfx: 'fart' }],
  [/트림|꺽/, 'gross', { sfx: 'gulp' }],
  [/침|가래|콧물|코딱지|눈물|땀|토(?=를|가|해|하)|구토/, 'gross'],
  [/똥|응가|변기|화장실|휴지/, 'gross', { shape: 'drop', sfx: 'fart', c: ['#8a5a2a', '#d0a060'] }],
  [/머리카락|털|대머리|가발/, 'gross', { shape: 'feather', c: ['#3a2a1a', '#8a6a4a'], sfx: 'whoosh' }],
  [/손톱|이빨|이를|깨물|물어/, 'metal', { shape: 'blade', sfx: 'crunch' }],
  [/웃음|웃기|개그|농담|드립|간지럼|간지러/, 'sound', { sfx: 'squeak', st: 'dance' }],
  [/울음|울기|우는|징징|떼쓰/, 'water', { sfx: 'meow', st: 'slow' }],
  [/하품|잠|졸음|자장가|꿈|베개|이불|침대|멍때|멍하|넋|게으|귀찮|빈둥|뒹굴/, 'sleep'],
  [/노래|음악|소리|목소리|고함|외침|비명|마이크|기타|피아노|드럼|랩/, 'sound'],
  [/춤|댄스|막춤|트월킹/, 'sound', { st: 'dance', sfx: 'drum' }],
  [/사랑|하트|뽀뽀|윙크|애교|고백|귀여/, 'love'],
  [/잔소리|숙제|시험|공부|월요일|출근|야근|회의|보고서|학원|선생님|엄마|아빠/, 'nag'],
  [/게임|와이파이|인터넷|컴퓨터|휴대폰|핸드폰|스마트폰|로봇|기계|ai|AI|레이저|드론|유튜브|광고/, 'tech'],
  // 음식
  [/라면|피자|치킨|햄버거|떡볶이|김치|밥|빵|국수|만두|소시지|고기|감자|고구마|계란|달걀|우유|두부|김밥|짜장|카레/, 'food'],
  [/사탕|초콜릿|초코|케이크|젤리|아이스크림|과자|마카롱|솜사탕|도넛|껌|꿀/, 'sweet'],
  [/바나나|수박|사과|딸기|포도|귤|레몬|파인애플|당근|양파|마늘|고추/, 'food', { shape: 'orb' }],
  // 동물
  [/고양이|냥/, 'animal', { sfx: 'meow' }],
  [/강아지|개(?!구리|미|그)|멍멍|늑대|여우/, 'animal', { sfx: 'roar' }],
  [/오리|거위|닭|병아리|비둘기|새(?!로|우|벽)|참새|까마귀|독수리|펭귄|앵무새/, 'animal', { shape: 'feather', sfx: 'honk' }],
  [/상어|물고기|고래|문어|오징어|해파리|게(?=를|가|\s|$)|가재|새우/, 'water', { shape: 'paw', sfx: 'splash' }],
  [/곰|사자|호랑이|고릴라|코끼리|하마|소(?=를|가|\s|$)|돼지|말(?=을|이|\s|$)|공룡|용(?!기|서|돈)|드래곤/, 'animal', { sfx: 'roar', shape: 'paw' }],
  [/토끼|햄스터|다람쥐|쥐|기니피그|고슴도치/, 'animal', { sfx: 'squeak' }],
  [/뱀|도마뱀|악어|거북|개구리/, 'animal', { sfx: 'slurp', st: 'poison' }],
  [/벌(?!레)|모기|파리|개미|거미|바퀴벌레|벌레|나비|매미|메뚜기/, 'bug'],
  // 물건
  [/돈|동전|지폐|금(?!지|방|요)|보석|다이아|부자|카드값/, 'money'],
  [/칼|검|도끼|낫|창(?!문)|단검|가위|톱|면도기/, 'metal', { shape: 'blade' }],
  [/총|대포|미사일|탄환|저격|기관총|물총/, 'metal', { shape: 'bullet', sfx: 'pew' }],
  [/활|화살|다트|표창/, 'metal', { shape: 'arrow', sfx: 'whoosh' }],
  [/폭탄|다이너마이트|폭죽|불꽃놀이|수류탄/, 'fire', { shape: 'bomb', sfx: 'boom' }],
  [/망치|해머|프라이팬|냄비|국자|숟가락|젓가락|빗자루|우산|의자|책상|신발|슬리퍼|베개/, 'metal', { shape: 'cube', sfx: 'thud' }],
  [/책|사전|교과서|연필|지우개|볼펜|공책/, 'nag', { shape: 'cube', sfx: 'thud' }],
  [/냉장고|세탁기|전자레인지|에어컨|자동차|트럭|버스|기차|비행기|자전거/, 'tech', { shape: 'cube', sfx: 'honk' }],
  [/공(?!격|부|룡|기|간|중|주|포)|축구|농구|야구|배구|테니스|볼링|피구|풍선/, 'ball'],
  [/비누|거품|샴푸|세제|방울/, 'water', { shape: 'bubble', sfx: 'bloop', st: 'slip' }],
  [/거울|유리|크리스탈|수정/, 'magic', { shape: 'cube', sfx: 'chime' }],
  [/뼈|해골|좀비|귀신|유령|저승|미라|뱀파이어|흡혈/, 'ghost'],
  [/마법|마술|주문|요술|지팡이|마녀|마법사|부적|카드(?!값)/, 'magic'],
  [/닌자|암살|그림자 분신|분신술/, 'dark', { shape: 'blade', sfx: 'whoosh' }],
  [/빠르|빨라|속도|순간|번쩍|달리기|스피드|질주/, 'speed'],
  [/힘|괴력|근육|주먹|헬스|운동|펀치|씨름|레슬링/, 'power'],
  [/기(?=를|운|공)|기공|에너지|오라|파동|염력|초능력|텔레파시/, 'ki'],
];

/** 한 글자짜리 소재 단어는 앞에 다른 한글이 붙어 있으면 무시 (양말 → 말 X) */
function guardShort(re) {
  const src = re.source, parts = [];
  let depth = 0, cur = '';
  for (const ch of src) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === '|' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return new RegExp(parts.map((p) => (/^[가-힣](\(|$)/.test(p) ? '(?<![가-힣])' + p : p)).join('|'), re.flags);
}
for (const e of LEX) e[0] = guardShort(e[0]);

/* ----- 행동(동사) 사전: 글에 나온 행동이 기술 방식이 된다 ----- */
const MECH = [
  [/하늘에서|쏟아|소나기|우박|떨어뜨|떨어진|비처럼|내려/, 'rain'],
  [/광선|빔|레이저|뿜|내뿜|발사광|쏘아 올/, 'beam'],
  [/폭발|터뜨|터지|터진|펑|폭파|날려 버/, 'boom'],
  [/장판|바닥|웅덩이|늪|깔아|뿌려|뿌린|퍼뜨|안개|구름/, 'zone'],
  [/소환|부르|불러|군단|부하|친구들|떼(?!쓰)|무리|키우/, 'summon'],
  [/포탑|대포를 설치|설치/, 'turret'],
  [/덫|지뢰|함정|숨겨 놓|심어/, 'mine'],
  [/주위를 돌|빙빙|회전|돌려|돌린|휘둘/, 'orbit'],
  [/돌진|달려들|박치기|들이받|태클|굴러|몸통|부딪/, 'dash'],
  [/순간이동|텔레포트|워프|사라졌다|사라진다|나타나/, 'blink'],
  [/숨는|숨어|숨을|투명|안 보이|은신|위장/, 'invis'],
  [/회복|치유|치료|힐|낫게|먹으면|먹고|마시/, 'heal'],
  [/방패|막는|막아|보호|벽|단단|철벽|갑옷|피한다|피하는/, 'shield'],
  [/끌어당|당긴|당겨|빨아들|흡입|흡수|빨아/, 'pull'],
  [/커지|커진|거대|거인|커져/, 'big'],
  [/작아|작아진|줄어들/, 'tiny'],
  [/빨라|빠르게|속도|달린다|달리는|질주/, 'haste'],
  [/날아다|난다|날 수|비행|날개|떠다니|공중/, 'fly'],
  [/지나간 자리|자국|흔적|발자국|길을 만/, 'trail'],
  [/자리를 바꾸|위치를 바꾸|바꿔치기|뒤바꾸/, 'swap'],
  [/반사|튕겨 낸|되돌려/, 'reflect'],
  [/모두|전부|모든 적|전체|온 세상|세상을|모든 사람/, 'all'],
  [/던지|던져|던진|투척|날리|날린|쏘|쏜|쏴|발사|뱉|튕기/, 'shot'],
];
const STATUS_WORDS = [
  [/얼리|얼린|얼어|얼음으로|동상|굳게|굳어|정지|멈추|멈춘|멈춰/, 'freeze'],
  [/기절|마비|감전|어지럽|실신|넋/, 'stun'],
  [/잠들|재운|재우|졸리|잠이 들|자게/, 'sleep'],
  [/춤추|춤을 추|춤추게/, 'dance'],
  [/홀리|홀린|혼란|최면|헷갈|세뇌|정신을/, 'confuse'],
  [/독|중독|아프게|배탈/, 'poison'],
  [/태우|불태|불붙|화상/, 'burn'],
  [/느리|느려|느리게|굼뜨|거북이/, 'slow'],
  [/묶|속박|붙잡|못 움직|꼼짝/, 'root'],
  [/말을 못|침묵|입을 막|조용/, 'silence'],
  [/미끄|미끌|넘어지/, 'slip'],
  [/변신|개구리로|돼지로|바꿔 버/, 'morph'],
  [/약하게|힘을 빼|힘이 빠지게|기운/, 'weak'],
  [/무겁게|무거워|짓눌/, 'heavy'],
];

/* ----- 도우미 ----- */
const hasJong = (w) => { const c = (w || '').charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false; };
const josa = (w, a, b) => w + (hasJong(w) ? a : b); // 을/를, 이/가, 은/는, 과/와
const STOP = new Set(['적', '상대', '상대방', '나', '내', '자신', '자기', '모든', '모두', '사람', '것', '수', '때', '등', '능력', '힘', '정도', '마음', '완전', '진짜', '엄청', '아주', '매우', '너무', '많이', '조금', '그냥', '항상', '가끔', '자유자재', '마음대로', '아무', '없', '있', '같', '동시', '그', '이', '저', '더', '잘', '못', '안', '또', '계속', '생각 없']);
const PARTICLE = /(으로|에게|에서|한테|까지|부터|처럼|보다|이랑|랑|하고|으로써|로써|로|을|를|이|가|은|는|의|에|와|과|도|만|아|야|께)$/;
/** 글에서 이름에 쓸 명사 후보를 순서대로 뽑는다 */
function nounsOf(text) {
  const out = [];
  for (let w of String(text || '').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)) {
    if (!w) continue;
    if (/(다|요|함|기|게|고|며|면|서|니|지|자|죠|네)$/.test(w) && w.length > 1 && !PARTICLE.test(w)) continue; // 동사·형용사
    const stem = w.replace(PARTICLE, '') || w;
    if (stem.length < 1 || STOP.has(stem) || /^\d+$/.test(stem)) continue;
    if (/(하|되|시키|당하|만들|부리|다루)$/.test(stem)) continue;
    if (!out.includes(stem)) out.push(stem);
  }
  return out;
}
const cut = (w, n) => Array.from(w).slice(0, n).join('');
function hashText(t) { let h = 2166136261; for (const ch of String(t)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ----- 기술 틀: 이름 짓기와 효과 만들기 ----- */
const NAME_T = {
  shot: ['{n} 던지기', '{n} 발사', '{n} 탄', '{n} 투척'],
  rain: ['{n} 소나기', '하늘에서 {n}', '{n} 우박', '{n} 폭우'],
  beam: ['{n} 광선', '{n} 빔', '{n} 레이저'],
  boom: ['{n} 폭탄', '{n} 대폭발', '{n} 펑'],
  zone: ['{n} 장판', '{n} 웅덩이', '{n} 구역', '{n} 안개'],
  summon: ['{n} 군단', '{n} 소환', '{n} 친구들'],
  turret: ['{n} 포탑', '{n} 설치'],
  mine: ['{n} 지뢰', '{n} 함정'],
  orbit: ['{n} 회전', '빙빙 {n}'],
  dash: ['{n} 돌진', '{n} 박치기', '{n} 태클'],
  blink: ['{n} 순간이동', '{n} 워프'],
  invis: ['{n} 숨바꼭질', '{n} 은신'],
  heal: ['{n} 충전', '{n} 회복', '{n} 먹기'],
  shield: ['{n} 방패', '{n} 철벽', '{n} 갑옷'],
  pull: ['{n} 블랙홀', '{n} 흡입', '{n} 당기기'],
  big: ['거대 {n}', '{n} 뻥튀기'],
  tiny: ['꼬마 {n}', '{n} 축소'],
  haste: ['{n} 질주', '{n} 부스터'],
  fly: ['{n} 비행', '날아라 {n}'],
  trail: ['{n} 흔적', '{n} 길'],
  swap: ['{n} 바꿔치기'],
  reflect: ['{n} 반사'],
  all: ['{n} 대참사', '온 세상 {n}', '{n} 대재앙'],
};
const ULT_PRE = ['초거대', '궁극의', '최종', '전설의', '무한', '대폭주', '분노의'];
const DESC_T = {
  shot: (n) => `${josa(n, '을', '를')} 던진다`, rain: (n) => `하늘에서 ${josa(n, '이', '가')} 쏟아진다`, beam: (n) => `${josa(n, '을', '를')} 광선처럼 뿜는다`,
  boom: (n) => `${josa(n, '을', '를')} 터뜨린다`, zone: (n) => `바닥에 ${josa(n, '을', '를')} 깔아 버린다`, summon: (n) => `${josa(n, '을', '를')} 불러 싸우게 한다`,
  turret: (n) => `${josa(n, '을', '를')} 세워 대신 쏘게 한다`, mine: (n) => `${josa(n, '을', '를')} 몰래 심어 둔다`, orbit: (n) => `${josa(n, '을', '를')} 몸 주위로 빙빙 돌린다`,
  dash: (n) => `${n} 기운으로 냅다 들이받는다`, blink: (n) => `${n} 힘으로 순식간에 사라졌다 나타난다`, invis: (n) => `${n} 뒤에 숨어 안 보이게 된다`,
  heal: (n) => `${josa(n, '으로', '로')} 기운을 채운다`, shield: (n) => `${josa(n, '으로', '로')} 몸을 감싸 막는다`, pull: (n) => `${n} 힘으로 적을 끌어당긴다`,
  big: (n) => `${n} 힘으로 몸이 거대해진다`, tiny: (n) => `${n}처럼 작아져 빠르게 피한다`, haste: (n) => `${n} 힘으로 엄청 빨라진다`, fly: (n) => `${n} 힘으로 하늘을 난다`,
  trail: (n) => `지나간 자리에 ${josa(n, '이', '가')} 남는다`, swap: (n) => `${n} 힘으로 적과 자리를 바꾼다`, reflect: (n) => `${josa(n, '으로', '로')} 공격을 튕겨 낸다`,
  all: (n) => `모든 적에게 ${josa(n, '이', '가')} 덮친다`,
};
/** 기술 방식 하나를 효과 목록으로 */
function mechFx(mech, slot, o) {
  const U = slot === 'ult', B = slot === 'basic', P = o.pow; // P: 글의 세기 (0.6 약함 ~ 1.4 셈)
  const st = o.st ? { k: o.st, d: U ? 2 : 1.3 } : null;
  const n = o.n;
  switch (mech) {
    case 'shot': return [{ t: 'shot', dmg: (B ? 7 : U ? 9 : 13) * P, n: B ? (n > 1 ? Math.min(n, 3) : 1) : U ? Math.max(5, Math.min(n || 6, 8)) : Math.min(n || 1, 4), spread: U ? 70 : n > 1 ? 30 : 0, speed: B ? 240 : 220, size: B ? 2 : 3, homing: o.homing ? 0.5 : 0, bounce: o.bounce ? 2 : 0, pierce: !!o.pierce, ret: !!o.ret, split: !B && o.split ? 3 : 0, boom: U ? 12 : 0, st: B ? (st ? { k: st.k, d: 0.8 } : null) : st }];
    case 'rain': return [{ t: 'shot', from: 'sky', dmg: (U ? 8 : 6) * P, n: U ? 8 : B ? 2 : 5, size: B ? 2 : 3, boom: U ? 14 : 8, speed: 230, st }];
    case 'beam': return [{ t: 'beam', dmg: (U ? 9 : B ? 4 : 6) * P, len: U ? 240 : B ? 110 : 160, w: U ? 9 : B ? 3 : 5, ticks: U ? 5 : B ? 2 : 3, dur: U ? 0.9 : 0.4, st }];
    case 'boom': return [{ t: 'blast', at: B ? 'front' : 'target', off: 30, dmg: (U ? 36 : B ? 9 : 17) * P, r: U ? 46 : B ? 14 : 24, delay: U ? 0.4 : 0.25, kb: U ? 9 : 6, st }];
    case 'zone': return [{ t: 'zone', at: B ? 'front' : 'target', dmg: (U ? 5 : 3) * P, r: U ? 42 : B ? 12 : 24, dur: U ? 5 : 4, st }];
    case 'summon': return [{ t: 'summon', kind: 'chaser', n: U ? 4 : B ? 1 : Math.min(Math.max(n, 2), 3), dmg: 7 * P, dur: 7, st }];
    case 'turret': return [{ t: 'summon', kind: 'turret', n: U ? 2 : 1, dmg: 5 * P, rate: 1.2, dur: 8, st }];
    case 'mine': return [{ t: 'summon', kind: 'mine', n: U ? 4 : 3, dmg: 13 * P, dur: 10, st }];
    case 'orbit': return [{ t: 'summon', kind: 'orbit', n: U ? 4 : 3, dmg: 5 * P, dur: U ? 7 : 5, st }];
    case 'dash': return [{ t: 'dash', dist: U ? 130 : 95, dmg: (U ? 24 : B ? 8 : 13) * P, invuln: !B, kb: 6, st }];
    case 'blink': return [{ t: 'blink', to: 'behind', dist: 90 }, { t: 'blast', at: 'self', dmg: (U ? 20 : 9) * P, r: U ? 36 : 16, delay: 0.05, kb: 5, st }];
    case 'invis': return [{ t: 'buff', k: 'invis', d: U ? 4 : 3 }, { t: 'buff', k: 'haste', d: 3 }];
    case 'heal': return [{ t: 'heal', amt: U ? 35 : 18 }, { t: 'buff', k: 'regen', d: 4, pow: 4 }];
    case 'shield': return o.wall ? [{ t: 'summon', kind: 'barrier', n: U ? 3 : 1, dur: 7 }, { t: 'buff', k: 'shield', d: 3, pow: 20 }] : [{ t: 'buff', k: 'shield', d: 4, pow: U ? 50 : 30 }, { t: 'blast', at: 'self', dmg: 6 * P, r: 18, kb: 7 }];
    case 'pull': return [{ t: 'blast', at: 'target', dmg: (U ? 16 : 10) * P, r: U ? 50 : 34, kb: -9, delay: 0.3, st: st || { k: 'heavy', d: 1.5 } }];
    case 'big': return [{ t: 'buff', k: 'giant', d: 5 }, { t: 'blast', at: 'self', dmg: (U ? 26 : 12) * P, r: U ? 44 : 26, kb: 9, st: { k: 'stun', d: 0.8 } }];
    case 'tiny': return [{ t: 'buff', k: 'tiny', d: 4 }, { t: 'buff', k: 'haste', d: 4 }];
    case 'haste': return [{ t: 'buff', k: 'haste', d: 4 }, { t: 'dash', dist: 80, dmg: 8 * P, kb: 4 }];
    case 'fly': return [{ t: 'buff', k: 'fly', d: 4 }, { t: 'shot', from: 'sky', dmg: 6 * P, n: 3, size: 2, speed: 220 }];
    case 'trail': return [{ t: 'trail', dmg: 3 * P, dur: 4, life: 3, st }, { t: 'buff', k: 'haste', d: 4 }];
    case 'swap': return [{ t: 'swap' }, { t: 'blast', at: 'self', dmg: 10 * P, r: 20, kb: 4, st }];
    case 'reflect': return [{ t: 'buff', k: 'reflect', d: U ? 4 : 2.5 }, { t: 'buff', k: 'armor', d: 3 }];
    case 'all': return [{ t: 'all', dmg: (U ? 9 : 5) * P, st: st || { k: 'stun', d: 1.2 } }, { t: 'shot', from: 'sky', dmg: 5 * P, n: U ? 6 : 3, size: 2, speed: 230 }];
  }
  return [{ t: 'shot', dmg: 8 * P, speed: 220, size: 2 }];
}
const BASIC_OK = new Set(['shot', 'rain', 'beam', 'boom', 'zone', 'dash']);
const CTRL = ['zone', 'boom', 'beam', 'pull', 'rain', 'mine', 'summon', 'turret', 'orbit', 'shot', 'trail'];
const MOBI = ['dash', 'blink', 'invis', 'shield', 'heal', 'haste', 'fly', 'big', 'tiny', 'swap', 'reflect', 'trail', 'turret', 'orbit', 'summon'];
const ULT_OK = ['all', 'rain', 'boom', 'beam', 'pull', 'summon', 'big', 'zone', 'dash', 'shot'];

/** 글 하나로 설계서 원본(검증 전)을 조립한다 */
function composeRaw(ability, sides) {
  const text = String(ability || '').trim();
  const R = mulberry(hashText(text) || 7);
  const pk = (a) => a[Math.floor(R() * a.length)];
  // 1) 소재 찾기 (글에 나온 순서대로)
  const found = [];
  for (const [re, key, ov] of LEX) {
    const m = text.match(re);
    if (m) found.push({ at: m.index, word: m[0], key, ov: ov || {} });
  }
  found.sort((a, b) => a.at - b.at);
  const themes = [];
  for (const f of found) if (!themes.some((t) => t.key === f.key && t.word === f.word)) themes.push(f);
  if (!themes.length) themes.push({ word: '', key: 'ki', ov: {} });
  const T = (f) => Object.assign({}, THEME[f.key], f.ov);
  const t1 = themes[0], t2 = themes[1] || themes[0], t3 = themes[2] || t2;
  // 2) 이름에 쓸 말: 글에 나온 명사를 그대로
  const nouns = nounsOf(text);
  const nm = (f, i) => cut((f.word && nouns.find((w) => w.includes(f.word))) || f.word || nouns[i] || nouns[0] || '기', 5);
  const n1 = nm(t1, 0), n2 = nm(t2, 1), n3 = nm(t3, 2);
  // 3) 행동 찾기
  const mechs = [];
  for (const [re, k] of MECH) { const m = text.match(re); if (m) mechs.push({ at: m.index, k }); }
  mechs.sort((a, b) => a.at - b.at);
  const said = mechs.map((m) => m.k);
  let st = null;
  for (const [re, k] of STATUS_WORDS) if (re.test(text)) { st = k; break; }
  const nm1 = text.match(/(\d+)\s*(개|마리|발|명|번)/);
  const o = {
    pow: 0.55 * (/엄청|거대|최강|무한|최고|강력|세게|완전|미친|전설|궁극|세상에서 가장/.test(text) ? 1.25 : /약한|작은|쓸모없|조금|살짝|별로|하찮|소심/.test(text) ? 0.7 : 1),
    n: nm1 ? clamp(+nm1[1], 1, 8) : /여러|많은|떼|군단|무리|잔뜩|수많/.test(text) ? 4 : 1,
    homing: /따라가|추적|유도|쫓아가/.test(text), bounce: /튕기|튕겨|통통/.test(text), pierce: /관통|꿰뚫|뚫고/.test(text),
    ret: /부메랑|돌아온|되돌아/.test(text), split: /분열|쪼개|갈라|나뉘/.test(text), wall: /벽|성벽|담장/.test(text),
  };
  // 4) 칸마다 방식 고르기: 글에 쓴 행동 → 소재가 어울리는 행동 → 기본값
  const used = new Set();
  const choose = (pool, prefer) => {
    for (const k of prefer) if (pool.includes(k) && !used.has(k)) { used.add(k); return k; }
    for (const k of pool) if (!used.has(k)) { used.add(k); return k; }
    return pool[0];
  };
  const pref = said.concat(T(t1).feel, T(t2).feel, ['shot', 'boom', 'dash', 'zone', 'all']);
  const firstSaid = said.find((k) => BASIC_OK.has(k));
  const basicM = choose([...BASIC_OK], [firstSaid && firstSaid !== 'boom' ? firstSaid : 'shot']);
  const s1M = choose(CTRL, pref);
  const s2M = choose(MOBI, pref);
  const ultM = choose(ULT_OK, said.includes('all') ? ['all'] : said.concat(['rain', 'boom', 'all', 'beam', 'pull']));
  const plan = { basic: [basicM, t1, n1], s1: [s1M, t2, n2], s2: [s2M, t3 === t1 ? t2 : t3, n3 === n1 ? n2 : n3], ult: [ultM, t1, n1] };
  // 5) 기술 만들기
  const moves = {};
  const quote = (text.match(/["'“‘「]([^"'”’」]{1,10})["'”’」]/) || [])[1];
  for (const s of SLOTS) {
    const [mech, th, n] = plan[s];
    const tt = T(th);
    const myst = st || tt.st;
    let fx = mechFx(mech, s, Object.assign({}, o, { st: myst }));
    if (s === 'ult' && mech !== 'all' && said.includes('all')) fx = fx.concat(mechFx('all', 'ult', Object.assign({}, o, { st: myst }))).slice(0, 3);
    else if (s === 'ult' && fx.length < 2) fx.push({ t: 'all', dmg: 4, st: { k: myst || 'stun', d: 1.2 } });
    let name = pk(NAME_T[mech] || NAME_T.shot).replace('{n}', n);
    if (s === 'ult') name = `${pk(ULT_PRE)} ${name.replace(/^(거대|꼬마|하늘에서|온 세상|빙빙|날아라)\s/, '')}`;
    name = cut(name, 12);
    const desc = (s === 'ult' ? '한계까지 끌어올려 ' : '') + (DESC_T[mech] || DESC_T.shot)(n);
    const sayPool = s === 'ult' ? [`${n} 대폭발이다!`, `받아라 ${n}!!`, `${n}의 끝을 보여주마`, `세상이 ${n} 된다!`] : [`${n}!`, `${n} 맛 좀 봐라`, `${n} 간다!`, `에잇 ${n}!`];
    moves[s] = {
      name, desc: cut(desc, 44), say: s === 'ult' && quote ? quote : s === 'basic' ? '' : cut(pk(sayPool), 10),
      cd: { basic: 0.55, s1: 1.9, s2: 2.7, ult: 7.5 }[s] * (mech === 'heal' || mech === 'big' ? 1.25 : 1),
      color: s === 'ult' ? tt.c[1] : s === 's2' ? tt.c[1] : tt.c[0], vfx: tt.vfx, shape: tt.shape,
      sfx: { kind: tt.sfx, pitch: { basic: 1.25, s1: 1, s2: 1.1, ult: 0.75 }[s], len: { basic: 0.7, s1: 1, s2: 0.9, ult: 1.5 }[s] },
      fx,
    };
  }
  // 6) 겉모습·능력치·특성
  const L = T(t1);
  const look = { skin: pk(['#f2c79b', '#e8b48a', '#c98a5e', '#f6d8b8', '#8a5a3a']), hair: L.hair, body: L.body, accent: L.c[0], head: L.head, outfit: 'plain', weapon: 'none', aura: L.aura };
  const W = [[/칼|검/, 'sword'], [/지팡이|마법|마술/, 'staff'], [/요술봉|마녀/, 'wand'], [/총|대포/, 'gun'], [/활|화살/, 'bow'], [/망치|해머|프라이팬/, 'hammer'], [/낫|저승/, 'scythe'], [/책|공부|숙제|사전/, 'book'], [/수정구|구슬/, 'orb'], [/방패/, 'shield'], [/단검|암살|닌자/, 'dagger'], [/도끼/, 'axe'], [/창(?!문)/, 'spear']];
  for (const [re, w] of W) if (re.test(text)) { look.weapon = w; break; }
  const HD = [[/왕|여왕|부자|황제/, 'crown'], [/천사/, 'halo'], [/악마/, 'horns'], [/고양이|토끼|여우|강아지|햄스터/, 'ears'], [/로봇|기계|ai|AI/, 'robot'], [/닌자|도둑|복면/, 'mask'], [/기사|군인|전사/, 'helmet'], [/마법사|마녀/, 'hat'], [/대머리/, 'bald']];
  for (const [re, hd] of HD) if (re.test(text)) { look.head = hd; break; }
  if (/마법|마녀|요술|주문/.test(text)) look.outfit = 'robe'; else if (/기사|갑옷|전사|군인/.test(text)) look.outfit = 'armor'; else if (/회사|출근|야근|사장|보고서/.test(text)) look.outfit = 'suit'; else if (/공주|드레스|여왕/.test(text)) look.outfit = 'dress'; else if (/죄수|줄무늬|얼룩말/.test(text)) look.outfit = 'stripes'; else if (/점박|무당벌레|달마시안/.test(text)) look.outfit = 'spots';
  const stats = { hp: /단단|튼튼|거대|철벽|탱크|뚱뚱/.test(text) ? 120 : /약한|작은|하찮/.test(text) ? 85 : 100, speed: /빠르|빨라|스피드|번개처럼|날쌘/.test(text) ? 1.25 : /느리|느린|거북|굼뜬/.test(text) ? 0.85 : 1, size: /거대|거인|큰 몸/.test(text) ? 1.25 : /작은 몸|꼬마|작아/.test(text) ? 0.85 : 1 };
  const PS = [[/회복|재생|치유|불사/, 'regen'], [/가시|선인장|고슴도치/, 'thorns'], [/흡혈|뱀파이어|빨아/, 'lifesteal'], [/단단|강철|철벽|갑옷/, 'armor'], [/분노|화가|빡/, 'rage'], [/부활|좀비|불사조/, 'revive'], [/빠르|날쌘|바람/, 'swift'], [/운|럭키|행운|도박/, 'crit'], [/피하|회피|닌자|미끌/, 'dodge']];
  let passive = null;
  for (const [re, k] of PS) if (re.test(text)) { passive = { k, desc: `${cut(text, 14)}에서 나온 특성` }; break; }
  const title = cut(pk([`${n1}의 달인`, `${n1} 인간`, `${n1}술사`, `${n1} 마스터`, `걸어 다니는 ${n1}`, `${n1} 장인`]), 14);
  const lines = {
    intro: cut(pk([`${n1} 맛 좀 볼래?`, `${josa(n1, '이', '가')} 왔다!`, `오늘은 ${n1} 데이`, `${n1}의 힘을 보아라`]), 14),
    ko: cut(pk([`내 ${josa(n1, '이', '가')}…`, `${n1}가 부족했어`, `${n1} 다시 충전…`]), 14),
    win: cut(pk([`${josa(n1, '은', '는')} 최강이야!`, `역시 ${n1}밖에 없어`, `${n1} 앞에 무릎 꿇어라`]), 22),
  };
  const raw = { title, concept: cut(text, 50) || '정체불명의 능력', look, stats, moves, passive, lines };
  raw.drawbacks = (sides || []).map((s) => smartDrawback(s.text, { text, moves, n1, themes }));
  return raw;
}

/* ----- 부작용 읽기: 맞는 말을 전부 찾아 겹친다 (최대 3개) ----- */
function smartDrawback(side, ctx) {
  const t = String(side || '');
  const has = (re) => re.test(t);
  const q = t.match(/["'“‘「]([^"'”’」]{1,16})["'”’」]/);
  const say = q ? q[1] : '';
  const out = [];
  const add = (fx) => { if (fx && out.length < 3 && !out.some((x) => x.t === fx.t && (x.t !== 'lock' || x.on === fx.on))) out.push(fx); };
  const SL = [[/궁극기|궁|필살기/, 'ult'], [/능력\s?1|첫\s?번째|기본/, 'basic'], [/능력\s?2|두\s?번째/, 's1'], [/능력\s?3|세\s?번째/, 's2']];
  // "~을 못 쓴다": 능력 글의 소재를 콕 집으면 그 소재 기술만, 아니면 전부 엉망이 된다
  if (has(/못\s?[가-힣]|안\s?나(온|와)|사용\s?(불가|금지)|봉인|쓸 수 없|금지|안 된다|안돼|안 돼|할 수 없/) && !has(/(?<![가-힣])말을 못|못 움직|못 멈|못 보|잠을 못/)) {
    const slot = SL.find(([re]) => re.test(t));
    const hitTheme = ctx && ctx.themes.find((f) => f.word && t.includes(f.word));
    if (slot) add({ t: 'lock', on: slot[1] });
    else if (hitTheme && ctx.themes.length > 1) {
      const slots = SLOTS.filter((s) => ctx.moves[s].name.includes(cut(hitTheme.word, 5)));
      if (slots.length && slots.length < 4) slots.forEach((s) => add({ t: 'lock', on: s }));
      else add({ t: 'replace', moves: lameMoves(ctx.n1) });
    } else add({ t: 'replace', moves: lameMoves(ctx ? ctx.n1 : '') });
  }
  if (has(/외친|외쳐|소리친|말한|말해야|소리 질/) && say) add({ t: 'shout', on: 'skills', text: say });
  if (has(/횟수|번만|번밖|번 밖|한정/)) add({ t: 'uses', on: 'skills', n: +(t.match(/[0-6]/) || [3])[0] });
  if (has(/(적|상대|남).*(회복|치료|체력이 찬|낫|힐)/)) add({ t: 'healfoe', on: 'skills', chance: 100 });
  if (has(/(적|상대|남).*(강해|빨라|커|좋아|세져)/)) add({ t: 'aidfoe', on: 'skills', k: has(/커/) ? 'giant' : has(/빨/) ? 'haste' : 'power', d: 3 });
  if (has(/(반대|뒤|거꾸로).*(나간|날아|쏜|발사|나와)|엉뚱한 방향|뒤로 나/)) add({ t: 'reverse', on: 'skills', chance: 100 });
  if (has(/랜덤|무작위|아무거나 나|엉뚱한 (기술|능력)|다른 기술/)) add({ t: 'random', on: 'skills', chance: 60 });
  if (has(/앞이 안|눈이 안|시야|어두|장님|눈을 감|안 보/)) add({ t: 'vision', mode: 'dark' });
  else if (has(/화면이 뒤집|세상이 뒤집|거꾸로 보|뒤집혀 보/)) add({ t: 'vision', mode: 'flip' });
  else if (has(/멀미|어지|흔들|술에 취/)) add({ t: 'vision', mode: 'shake' });
  const PEST = t.match(/(벌|모기|파리|비둘기|강아지|고양이|닭|오리|거위|엄마|선생님|경찰|좀비|귀신|바퀴벌레|까마귀|팬|기자|빚쟁이)/);
  if (PEST || has(/쫓아|따라다|따라온|달려든/)) add({ t: 'pest', every: 6, dmg: 3, name: PEST ? PEST[1] : '무언가', color: '#ffe14a' });
  if (has(/춤/)) add({ t: 'tick', every: 7, st: { k: 'dance', d: 1.5 } });
  if (has(/잠|졸|하품/)) add({ t: 'tick', every: 8, st: { k: 'sleep', d: 2 } });
  if (has(/재채기|딸꾹|기침|방귀|트림/)) add({ t: 'tick', every: 6, st: { k: 'stun', d: 1 } });
  if (has(/대머리|머리가 빠/)) add({ t: 'look', head: 'bald' });
  if (has(/분홍|핑크/)) add({ t: 'look', body: '#ff9ad0', hair: '#ff7ab0' });
  if (has(/초록|녹색/)) add({ t: 'look', body: '#4fbf5f', skin: '#a8e08a' });
  if (has(/반대로 (움직|걸)|방향이 반대|조작이 반대|좌우가 바뀌/)) add({ t: 'move', mode: 'reverse' });
  else if (has(/미끄/)) add({ t: 'move', mode: 'slide' });
  else if (has(/비틀|취한|술/)) add({ t: 'move', mode: 'drunk' });
  else if (has(/멈출 수 없|계속 (달|뛰|걸)|못 멈/)) add({ t: 'move', mode: 'nostop' });
  else if (has(/뒷걸음|문워크|뒤로 걷/)) add({ t: 'move', mode: 'backward' });
  else if (has(/깡총|토끼|뛰어다|점프/)) add({ t: 'move', mode: 'hop' });
  if (has(/실패|확률|불발|가끔 안|삑사리/)) add({ t: 'fail', on: 'skills', chance: 40, back: has(/자기|자신|본인|맞|터/) ? 'selfhit' : has(/기절|멈/) ? 'stun' : 'fizzle' });
  if (has(/(계속|서서히|시간이|가만히).*(줄|깎|닳|빠)/)) add({ t: 'drain', amt: 2, if: has(/가만히/) ? 'still' : has(/움직/) ? 'moving' : 'always' });
  if (has(/나도 (아프|다치)|같이 맞|자기도|나까지/)) add({ t: 'backfire', on: 'skills', pct: 60 });
  else if (has(/체력|피가|hp|생명|목숨|아프|다친|다쳐|수명|피곤/i)) add({ t: 'selfdmg', on: 'skills', amt: 10 });
  if (has(/기절|멈칫|굳|마비/)) add({ t: 'selfst', on: 'skills', st: { k: 'stun', d: 1.2 } });
  if (has(/느려|느림|둔해|굼|거북/)) add({ t: 'stack', on: 'skills', stat: 'slow', pct: 10 });
  if (has(/커지|커진|뚱뚱|살이|거대/)) add({ t: 'stack', on: 'skills', stat: 'size', pct: 15 });
  if (has(/작아|줄어|개구리|돼지가|변신/)) add({ t: 'selfst', on: 'skills', st: { k: 'morph', d: 2 } });
  if (has(/헷갈|조작|뒤바/)) add({ t: 'selfst', on: 'skills', st: { k: 'confuse', d: 3 } });
  if (has(/순간이동|텔레포트|엉뚱한 곳|아무 데|어딘가/)) add({ t: 'tele', on: 'skills' });
  if (has(/날아가|밀려|반동|튕|넘어|뒤로 날/)) add({ t: 'recoil', on: 'skills', force: 10 });
  if (has(/쿨|재사용|오래 기다|대기|느긋/)) add({ t: 'cd', on: 'skills', pct: 150 });
  if (has(/모아|충전|준비|기다려야|주문을|외워야|뜸/)) add({ t: 'windup', on: 'skills', time: 1.2 });
  if (has(/약해|힘이 빠|위력|약하다|약함/)) add({ t: 'mul', on: 'skills', pct: 60 });
  if (has(/방어|맞으면|받는 피해|종이|유리|약골|맷집/)) add({ t: 'stat', stat: 'taken', pct: 60 });
  if (has(/불|화상|뜨거|타 버/) && !out.length) add({ t: 'selfst', on: 'skills', st: { k: 'burn', d: 3 } });
  if (has(/(?<![가-힣])말을 못|입이 막|벙어리|침묵/)) add({ t: 'selfst', on: 'skills', st: { k: 'silence', d: 2 } });
  if (has(/가만히 있으면|멈춰 있으면/)) add({ t: 'when', if: 'still', st: has(/잠/) ? 'sleep' : 'weak' });
  if (has(/움직이면|걸으면|뛰면/)) add({ t: 'when', if: 'moving', st: has(/아프|체력/) ? 'burn' : 'slow' });
  if (has(/맞으면|공격받으면|다치면/)) add({ t: 'hurtst', st: { k: has(/울/) ? 'slow' : has(/잠/) ? 'sleep' : 'stun', d: 1 }, chance: 60 });
  if (!out.length) {
    const h = hashText(t);
    add([{ t: 'selfst', on: 'skills', st: { k: 'dance', d: 1 } }, { t: 'move', mode: 'drunk' }, { t: 'reverse', on: 'skills', chance: 40 }, { t: 'tick', every: 8, st: { k: 'sleep', d: 1.5 } }, { t: 'fail', on: 'skills', chance: 35, back: 'fizzle' }][h % 5]);
  }
  const [fx, ...more] = out.map(sanDfx).filter(Boolean);
  const f = fx || sanDfx({ t: 'selfst', on: 'skills', st: { k: 'dance', d: 1 } });
  return { how: [f].concat(more).map(dfxText).join(' + ').slice(0, 50), say: say || pick(['아 왜!!', '이게 뭐야', '망했다', '살려 줘', '말도 안 돼']), fx: f, more };
}
/** 능력을 못 쓰게 됐을 때 대신 나오는 버둥대는 기술 (능력 이름을 살려서) */
function lameMoves(n) {
  n = cut(n || '능력', 4);
  const M = JSON.parse(JSON.stringify(PATHETIC));
  M.basic.name = cut(`${n} 흉내`, 12); M.basic.desc = `${josa(n, '은', '는')} 안 나오고 흉내만 낸다`;
  M.s1.name = cut(`${n} 그리워하기`, 12); M.s1.desc = `${josa(n, '이', '가')} 그리워 눈물을 흩뿌린다`;
  M.ult.name = cut(`${n} 없이 떼쓰기`, 12);
  return M;
}

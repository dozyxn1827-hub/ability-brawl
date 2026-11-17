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
  sound:  { basic: 'beam', vfx: 'sound', shape: 'note', c: ['#ff8ad8', '#ffd0f0'], sfx: 'kazoo', st: 'confuse', aura: 'none', body: '#8f2f7f', hair: '#ff8ad8', head: 'ponytail', feel: ['beam', 'all', 'shot'] },
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
  power:  { basic: 'boom', vfx: 'earth', shape: 'rock', c: ['#ff7a3a', '#ffd0a0'], sfx: 'thud', st: 'stun', aura: 'flame', body: '#a83a1a', hair: '#2a1a1a', head: 'spiky', feel: ['dash', 'boom', 'shield'] },
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
  [/손톱|이빨|앞니|송곳니|깨물|물어뜯/, 'metal', { shape: 'blade', sfx: 'crunch' }],
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

/* ----- 단어 사전 확장 (더 많은 일상어·병맛어) ----- */
LEX.push(
  // 불·열
  [/라이터|성냥|촛불|양초|횃불|모닥불|캠프파이어|숯|난로|보일러|핫팩|찜질|사우나|불닭|핫소스|매운|맵다|고추장|와사비|화산|화로|용가리|불사조|피닉스|열기|열정|뜨거운/, 'fire'],
  // 얼음·추위
  [/냉동|아이스|빙수|얼음물|에어컨 바람|설탕 눈|눈덩이|눈싸움|썰매|스키|북극|남극|펭귄 떼|빙판|동태|냉동실|추위|한파|시원/, 'ice'],
  // 전기
  [/배터리|건전지|콘센트|충전기|전선|전봇대|발전기|피카|전기뱀장어|네온|전구|형광등|번쩍이는/, 'elec'],
  // 물
  [/호수|강물|시냇물|폭포|샤워|목욕|욕조|수도꼭지|양동이|물풍선|스프링클러|분무기|소나기|장마|이슬|해일|쓰나미|수족관|어항|오줌|침수/, 'water'],
  // 바람·공기
  [/공기|숨|한숨|휘파람|입바람|드라이기|청소기|진공|풍선껌|헬륨|연|낙하산|부메랑|바람개비/, 'wind'],
  // 땅·돌·건물
  [/벽돌|시멘트|콘크리트|아스팔트|자갈|조약돌|석상|동상|피라미드|성(?=을|이|\s|$)|건물|빌딩|아파트|집(?=을|이|\s|$)|지붕|기둥|삽|포크레인|굴착기|두더지/, 'earth'],
  // 식물
  [/장미|해바라기|민들레|튤립|벚꽃|단풍|낙엽|대나무|소나무|야자수|덩쿨|가시덤불|이끼|새싹|화분|정원|채소|브로콜리|시금치|콩|옥수수|감자칩/, 'plant'],
  // 독·화학
  [/농약|살충제|표백제|락스|세균|바이러스|감기|코로나|병균|곰팡이|썩은|상한|유통기한|폐수|쓰레기|음식물 쓰레기|하수구|시궁창/, 'poison'],
  // 냄새·병맛 몸
  [/입냄새|겨드랑이|땀냄새|발가락|무좀|정수리|머리냄새|고린내|암내|홀애비|홀아비|청국장|두리안|낫또|홍어|청국|치즈 냄새/, 'stink', { sfx: 'fart' }],
  [/코딱지|귀지|각질|비듬|여드름|피지|배꼽|때(?=를|가|\s|$)|이태리타올|트림|딸꾹질|재채기|콧바람|하품/, 'gross'],
  [/엉덩이|궁둥이|똥침|빵꾸|팬티|기저귀|변비|설사|배탈/, 'gross', { sfx: 'fart', shape: 'bubble' }],
  // 빛·신성
  [/손전등|플래시|스포트라이트|조명|레이저 포인터|햇빛|햇살|광채|후광|별빛|반딧불|형광|신|부처|성모|기도|축복|천국|날개 달린/, 'holy'],
  // 어둠
  [/밤하늘|새벽|정전|블라인드|선글라스|먹물|잉크|검은|까만|흑마법|사신|저승사자|흑화|중2병|흑염룡/, 'dark'],
  // 우주
  [/로켓|우주선|인공위성|화성|목성|토성|태양계|은하수|별똥별|유성|혜성|성운|우주인|외계/, 'space'],
  // 시간
  [/알람|모래시계|타이머|달력|어제|내일|과거|미래|타임머신|되돌|빨리감기|일시정지|슬로모션|느리게 감/, 'time'],
  // 소리·음악
  [/트럼펫|나팔|색소폰|바이올린|리코더|탬버린|캐스터네츠|하모니카|확성기|스피커|이어폰|헤드폰|노래방|트로트|아이돌|케이팝|K팝|뮤지컬|오페라|합창|박수|발구르기|휘파람|코골이|코 골/, 'sound'],
  // 사랑·귀여움
  [/첫사랑|짝사랑|커플|데이트|키스|하이파이브|포옹|안아|꽃다발|선물|발렌타인|러브레터|팬레터|아기|애기|베이비|곰인형|인형|말랑|뽀송|깜찍/, 'love'],
  // 잠
  [/낮잠|늦잠|숙면|코골|불면|수면제|양 세기|자장자장|꿀잠|이불킥|잠옷|파자마|안대/, 'sleep'],
  // 쇠·무기
  [/쇠사슬|철퇴|너클|쌍절곤|부채|채찍|작살|창살|못(?=을|이|\s|$)|나사|볼트|드라이버|렌치|스패너|철판|깡통|캔|병따개|포크|나이프|이쑤시개|바늘|압정|클립|스테이플러/, 'metal', { shape: 'blade', sfx: 'crunch' }],
  // 기계·디지털
  [/키보드|마우스|모니터|노트북|태블릿|프린터|복사기|계산기|리모컨|티비|TV|텔레비전|라디오|카메라|셀카|사진|영상|틱톡|인스타|SNS|이모티콘|카톡|문자|알림|업데이트|버그|해킹|바이러스|코딩|프로그래밍|메타버스|VR|홀로그램|자판기|엘리베이터|에스컬레이터|청소 로봇/, 'tech'],
  // 음식
  [/삼겹살|족발|보쌈|곱창|순대|어묵|오뎅|튀김|돈까스|스테이크|햄|베이컨|핫도그|샌드위치|토스트|팬케이크|와플|파스타|스파게티|우동|라멘|짬뽕|탕수육|마라탕|쌀국수|초밥|스시|회|김|된장|청국장|비빔밥|볶음밥|주먹밥|도시락|컵라면|과일|멜론|복숭아|자두|체리|키위|망고|코코넛|오이|토마토|양배추|버터|치즈|마요네즈|케첩|소스|식빵|크루아상|베이글|팝콘|콜라|사이다|커피|녹차|주스|요구르트|요거트|두유|탄산/, 'food'],
  [/캔디|롤리팝|막대사탕|츄파춥스|마시멜로|쿠키|브라우니|푸딩|타르트|크레페|빙과|슬러시|버블티|흑당|설탕|시럽|잼|누텔라|생크림|휘핑/, 'sweet'],
  // 동물 더
  [/판다|코알라|캥거루|기린|얼룩말|하이에나|치타|표범|퓨마|사슴|순록|양(?=을|이|\s|$)|염소|알파카|라마|낙타|당나귀|원숭이|침팬지|오랑우탄|나무늘보|수달|비버|미어캣|라쿤|너구리|스컹크|두더지|박쥐|부엉이|올빼미|플라밍고|공작|칠면조|백조|갈매기|타조|키위새/, 'animal', { sfx: 'roar' }],
  [/돌고래|범고래|바다표범|물개|해마|불가사리|성게|조개|굴|소라|문어발|오징어 다리|복어|뱀장어|장어|연어|참치|고등어|멸치|붕어|잉어|금붕어|올챙이/, 'water', { shape: 'paw', sfx: 'splash' }],
  [/스컹크/, 'stink', { sfx: 'fart' }],
  [/무당벌레|사마귀|잠자리|반딧불이|지렁이|달팽이|굼벵이|애벌레|진드기|벼룩|이(?=가 |를 )|빈대|말벌|꿀벌|땅벌|장수풍뎅이|사슴벌레|소금쟁이|하루살이/, 'bug'],
  // 돈·소유
  [/월급|용돈|세뱃돈|복권|로또|주식|비트코인|코인|통장|지갑|카드|쿠폰|포인트|할인|세일|명품|금괴|금고|은행|부동산|빌딩주/, 'money'],
  // 귀신·공포
  [/처녀귀신|달걀귀신|도깨비|구미호|강시|늑대인간|프랑켄|미라|해골 병사|저승|지옥|공포|무서운|소름|으스스|호러|빙의|퇴마/, 'ghost'],
  // 마법·초능력
  [/요정|정령|소환사|연금술|물약|포션|마나|룬|마법진|빗자루를 타|요술|순간이동술|투시|예지|염동력|사이코|최면술|저주 인형|타로|점술|운세/, 'magic'],
  // 잔소리·일상 스트레스
  [/숙제 검사|수행평가|중간고사|기말고사|수능|모의고사|성적표|학교|교실|급식|교장|담임|학원 숙제|과제|발표|조별과제|팀플|상사|부장|사장님|회식|월급날|출퇴근|지옥철|만원 지하철|민원|고객센터|대기 번호|줄서기|광고 전화|스팸|알바/, 'nag'],
  // 운동·힘
  [/태권도|유도|복싱|권투|가라테|합기도|씨름|팔씨름|레슬링|프로레슬링|보디빌딩|역도|스쿼트|푸시업|팔굽혀|윗몸|줄넘기|훌라후프|마라톤|박치기|헤드락|백드롭|드롭킥|날아차기|돌려차기|어퍼컷|훅|잽/, 'power'],
  [/스케이트|롤러|킥보드|자전거|오토바이|스포츠카|레이싱|F1|경주|달리기 선수|육상|단거리|번개처럼|총알처럼|로켓처럼/, 'speed'],
  [/골프|하키|배드민턴|탁구|핸드볼|당구|구슬|공기놀이|딱지|팽이|요요|원반|프리스비|럭비|미식축구|수박 깨기|눈덩이/, 'ball'],
  // 무게·중력
  [/코끼리 무게|돌덩이|쇳덩이|역기|아령|덤벨|무거운|짓누르|납덩이|볼링공|모래주머니/, 'gravity'],
);
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
MECH.push(
  [/쏟아붓|퍼붓|폭격|공습|빗발|떨어트/, 'rain'],
  [/쏘아|발사해|뿜어|내뿜|분사|뿌직|브레스|숨결/, 'beam'],
  [/날려 버|빵 터|평 터|터트|폭죽처럼|자폭/, 'boom'],
  [/퍼트|흩뿌|뒤덮|물들|오염시|도배|칠해/, 'zone'],
  [/데려오|불러내|나타나게|만들어 내|키워서|복제|분신/, 'summon'],
  [/몸통 박치기|밀어붙|들이박|돌격|달려가|덮쳐|덮친/, 'dash'],
  [/사라져|사라지는|숨바꼭질|변장|숨겨/, 'invis'],
  [/먹어|마셔|삼켜|섭취|충전|힐링|쉬면/, 'heal'],
  [/막아내|버티|튕겨내|피해 없|철통/, 'shield'],
  [/빨아당|흡입|빨대|진공|청소기처럼/, 'pull'],
  [/커다래|부풀|뻥튀기|거대화/, 'big'],
  [/뛰어오르|날아올라|공중부양|점프/, 'fly'],
);
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
  [/웃기게|웃게|간지럽|빵 터지게/, 'dance'],
  [/울게|울려|슬프게|우울/, 'slow'],
  [/졸게|하품하게|나른/, 'sleep'],
  [/멍하게|멍때리게|바보로|정신 못/, 'confuse'],
  [/끈적|달라붙|붙여|접착|껌/, 'root'],
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
    const stem = w.replace(PARTICLE, '');
    if (!stem) continue;
    if (/(어|아|워|와|여|해|려|러)$/.test(stem) && stem.length > 1 && !LEX.some(([re]) => re.test(stem))) continue;
    if (stem.length < 1 || STOP.has(stem) || /^\d+$/.test(stem)) continue;
    if (/(하|되|시키|당하|만들|부리|다루)$/.test(stem)) continue;
    if (!out.includes(stem)) out.push(stem);
  }
  return out;
}
const cut = (w, n) => Array.from(w).slice(0, n).join('');
function hashText(t) { let h = 2166136261; for (const ch of String(t)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }


/* ----- 전투 유형: 글의 의도를 보고 고른다. 유형마다 기술 네 개의 짜임·능력치·특성이 다르다 -----
   fx(P, S, o): P = 위력 배율, S = 상태이상(글에서 찾은 것 또는 소재 기본), o = 글의 세부 옵션 */
const SX = (S, d) => (S ? { k: S, d } : null);
const STYLES = {
  gunner: {
    re: /총|저격|쏘|쏜|쏴|발사|활|화살|사격|명중|스나이퍼|탄|헤드샷/, keys: ['metal', 'ball'], mech: ['shot'],
    title: ['스나이퍼', '총잡이', '명사수'], stats: { hp: 90, speed: 1.05 }, passive: 'crit', weapon: 'gun',
    basic: { m: 'shot', fx: (P, S, o) => [{ t: 'shot', dmg: 7 * P, speed: 320, size: 1, pierce: o.pierce, homing: o.homing ? 0.4 : 0 }], name: ['{n} 따발총', '{n} 연사', '{n} 탕탕'], desc: ['{n을} 기관총처럼 갈긴다. 탄창 개념 없음', '{n을} 빛의 속도로 쏜다. 조준은 감'] },
    s1: { m: 'cone', fx: (P, S) => [{ t: 'cone', dmg: 11 * P, len: 58, arc: 48, dur: 0.2, ticks: 1, kb: 6, st: SX(S, 1.2) }], name: ['{n} 샷건', '{n} 산탄 한 방'], desc: ['코앞에 {n} 산탄을 부채꼴로 쾅! 가까울수록 아프다'] },
    s2: { m: 'blink', fx: (P) => [{ t: 'blink', to: 'back', dist: 90 }, { t: 'summon', kind: 'mine', n: 2, dmg: 11 * P, dur: 9 }], name: ['전략적 {n} 후퇴', '{n} 백스텝'], desc: ['뒤로 빠지면서 {n} 지뢰를 놓고 간다. 비겁하지만 효과적'] },
    ult: { m: 'beam', fx: (P, S) => [{ t: 'beam', dmg: 8 * P, len: 300, w: 6, ticks: 5, dur: 0.9, sweep: 120, kb: 5, st: SX(S || 'stun', 1.2) }], name: ['{n} 회전 난사', '{n} 레일건 쓸기'], desc: ['{n} 레이저를 쥐고 앞을 싹 쓸어 버린다. 피하려면 엎드려'] },
  },
  bomber: {
    re: /폭탄|폭발|터뜨|터지|터진|펑|폭파|다이너마이트|수류탄|폭죽|불꽃놀이|자폭/, keys: ['fire'], mech: ['boom'],
    title: ['폭탄마', '불꽃놀이 장인', '철거 전문가'], stats: { hp: 100, speed: 1 }, passive: 'rage', weapon: 'none',
    basic: { m: 'lob', fx: (P, S) => [{ t: 'lob', dmg: 9 * P, r: 15, kb: 5, st: SX(S, 0.8) }], name: ['{n} 수류탄', '{n} 휙 던지기', '{n} 폭죽'], desc: ['{n을} 머리 위로 휙 던지면 떨어진 곳이 펑!'] },
    s1: { m: 'shot', fx: (P, S) => [{ t: 'shot', dmg: 10 * P, size: 3, speed: 210, boom: 22, split: 4, st: SX(S, 1.2) }], name: ['{n} 집속탄', '{n} 분열 폭탄'], desc: ['{n} 폭탄이 터지면서 작은 {n} 네 개로 갈라진다'] },
    s2: { m: 'mine', fx: (P) => [{ t: 'summon', kind: 'mine', n: 3, dmg: 12 * P, dur: 10 }, { t: 'blink', to: 'back', dist: 60 }], name: ['{n} 지뢰밭', '{n} 깜짝 선물'], desc: ['{n} 지뢰를 깔고 튄다. 밟는 사람 책임'] },
    ult: { m: 'lob', fx: (P, S) => [{ t: 'lob', dmg: 14 * P, r: 26, n: 5, kb: 7, st: SX(S || 'stun', 1.3) }, { t: 'wave', at: 'target', dmg: 8 * P, r: 70, kb: 6 }], name: ['{n} 융단 폭격', '{n} 불꽃놀이 대참사'], desc: ['{n} 폭탄 다섯 개를 하늘 높이 던진다. 대피는 늦었다'] },
  },
  summoner: {
    re: /소환|부르|불러|군단|부하|떼|무리|친구들|키우|애완|펫|동물|조련/, keys: ['animal', 'bug'], mech: ['summon'],
    title: ['조련사', '군단장', '동물원 원장'], stats: { hp: 95, speed: 0.95 }, passive: 'aura', weapon: 'staff',
    basic: { m: 'shot', fx: (P, S) => [{ t: 'shot', dmg: 6 * P, speed: 220, size: 2, homing: 0.6, st: SX(S, 0.8) }], name: ['{n} 물어!', '{n} 던지기', '{n} 출동'], desc: ['{n} 한 마리를 던진다. 알아서 따라가서 문다'] },
    s1: { m: 'summon', fx: (P, S, o) => [{ t: 'summon', kind: 'chaser', n: Math.max(3, Math.min(o.n, 4)), dmg: 7 * P, dur: 7, st: SX(S, 1) }], name: ['{n} 군단', '{n} 우르르', '{n} 친구들'], desc: ['{n}들이 우르르 몰려가 들이받는다'] },
    s2: { m: 'orbit', fx: (P) => [{ t: 'summon', kind: 'orbit', n: 3, dmg: 5 * P, dur: 6 }, { t: 'buff', k: 'shield', d: 3, pow: 20 }], name: ['{n} 경호원', '{n} 호위대'], desc: ['{n} 경호원들이 주위를 빙빙 돌며 지켜 준다'] },
    ult: { m: 'wave', fx: (P, S) => [{ t: 'summon', kind: 'chaser', n: 4, dmg: 9 * P, dur: 9, st: SX(S, 1.4) }, { t: 'wave', at: 'self', dmg: 14 * P, r: 80, n: 2, kb: 8, st: SX(S || 'weak', 1.4) }], name: ['{n} 민족 대이동', '{n} 대폭주'], desc: ['온 동네 {n이} 땅을 울리며 몰려온다. 감당은 각자'] },
  },
  brawler: {
    re: /주먹|펀치|박치기|태권도|복싱|권투|씨름|레슬링|발차기|돌려차기|힘|괴력|근육|격투|싸움|때리|패|두들|헤드락|드롭킥|태클/, keys: ['power'], mech: ['dash'],
    title: ['파이터', '동네 깡패', '근육맨'], stats: { hp: 115, speed: 1.05 }, passive: 'rage', weapon: 'none',
    basic: { m: 'swing', fx: (P, S) => [{ t: 'swing', dmg: 9 * P, r: 18, arc: 110, kb: 6, st: SX(S, 0.8) }], name: ['{n} 싸대기', '{n} 훅', '{n} 잽'], desc: ['{n} 힘을 실어 옆으로 후려친다'] },
    s1: { m: 'dash', fx: (P, S) => [{ t: 'dash', dist: 100, dmg: 14 * P, invuln: true, kb: 8, st: SX(S || 'stun', 1) }], name: ['{n} 태클', '{n} 박치기', '{n} 돌진'], desc: ['머리부터 {n} 기운으로 냅다 들이받는다'] },
    s2: { m: 'wave', fx: (P) => [{ t: 'buff', k: 'armor', d: 4 }, { t: 'wave', at: 'self', dmg: 10 * P, r: 44, kb: 9, st: { k: 'slow', d: 1 } }], name: ['{n} 발 구르기', '{n} 근육 펌핑'], desc: ['발을 쿵 굴러 주변을 날려 버리고 단단해진다'] },
    ult: { m: 'dash', fx: (P, S) => [{ t: 'dash', dist: 130, dmg: 16 * P, invuln: true, kb: 6 }, { t: 'wave', at: 'self', dmg: 28 * P, r: 70, n: 2, kb: 10, st: SX(S || 'stun', 1.4) }], name: ['{n} 필살 드롭킥', '{n} 지구 내려찍기'], desc: ['날아올라 {n} 기운으로 땅을 내려찍는다. 지진 주의'] },
  },
  assassin: {
    re: /닌자|암살|그림자|몰래|숨|은신|투명|기습|뒤통수|등 뒤|사라|순간이동|텔레포트/, keys: ['dark', 'ghost'], mech: ['invis', 'blink'],
    title: ['암살자', '닌자', '뒤통수 전문가'], stats: { hp: 85, speed: 1.2 }, passive: 'dodge', weapon: 'dagger',
    basic: { m: 'swing', fx: (P, S) => [{ t: 'swing', dmg: 5 * P, r: 16, arc: 80, n: 2, kb: 2, st: SX(S, 0.6) }], name: ['{n} 난도질', '{n} 두 번 베기'], desc: ['{n으로} 좌우로 쉭쉭 두 번 벤다'] },
    s1: { m: 'blink', fx: (P, S) => [{ t: 'blink', to: 'behind', dist: 90 }, { t: 'swing', dmg: 13 * P, r: 22, arc: 360, kb: 4, st: SX(S, 1.2) }], name: ['뒤통수 {n}', '{n} 기습'], desc: ['순식간에 적 뒤로 가서 {n으로} 한 바퀴 휙'] },
    s2: { m: 'invis', fx: () => [{ t: 'buff', k: 'invis', d: 3.5 }, { t: 'buff', k: 'haste', d: 3.5 }], name: ['{n} 위장술', '나는 {n}이다', '{n} 은신'], desc: ['{n}인 척 숨는다. 아무도 못 알아본다(아마도)'] },
    ult: { m: 'chain', fx: (P, S) => [{ t: 'blink', to: 'behind', dist: 120 }, { t: 'chain', dmg: 18 * P, n: 4, range: 110, st: SX(S || 'silence', 1.6) }, { t: 'buff', k: 'invis', d: 2 }], name: ['{n} 그림자 처형', '{n} 무영각'], desc: ['그림자처럼 사라졌다가 적들을 차례로 {n으로} 베고 지나간다'] },
  },
  tank: {
    re: /단단|튼튼|철벽|방패|벽|버티|막|지키|보호|갑옷|탱크|거대|거인|뚱뚱|무거|바위/, keys: ['earth'], mech: ['shield', 'big'],
    title: ['철벽', '인간 방패', '움직이는 벽'], stats: { hp: 135, speed: 0.85, size: 1.15 }, passive: 'armor', weapon: 'shield',
    basic: { m: 'swing', fx: (P, S) => [{ t: 'swing', dmg: 9 * P, r: 19, arc: 150, kb: 9, st: SX(S || 'heavy', 0.8) }], name: ['{n} 몸빵', '{n} 밀치기', '{n} 엉덩이 공격'], desc: ['{n} 같은 몸으로 앞을 싹 밀쳐 버린다'] },
    s1: { m: 'hook', fx: (P, S) => [{ t: 'hook', dmg: 9 * P, speed: 260, range: 140, st: SX(S || 'root', 1) }], name: ['{n} 이리 와', '{n} 갈고리'], desc: ['{n} 줄을 던져 적을 내 쪽으로 질질 끌어온다'] },
    s2: { m: 'counter', fx: () => [{ t: 'buff', k: 'counter', d: 1.6 }, { t: 'buff', k: 'shield', d: 4, pow: 35 }], name: ['{n} 철벽 반격', '건드리면 {n}'], desc: ['{n} 자세로 버틴다. 때리면 그대로 되돌려 준다'] },
    ult: { m: 'wave', fx: (P, S) => [{ t: 'buff', k: 'giant', d: 5 }, { t: 'wave', at: 'self', dmg: 26 * P, r: 90, n: 3, kb: 9, st: SX(S || 'stun', 1.4) }], name: ['거대 {n} 강림', '{n} 대지진'], desc: ['집채만큼 커져서 땅을 세 번 쿵쿵쿵! 모두 휘청인다'] },
  },
  healer: {
    re: /회복|치유|치료|살리|간호|의사|약|힐|낫게|돌봐|보살|응원|기도/, keys: ['plant', 'love', 'holy'], mech: ['heal'],
    title: ['간호사', '동네 약사', '힐러'], stats: { hp: 100, speed: 1 }, passive: 'regen', weapon: 'staff',
    basic: { m: 'shot', fx: (P, S) => [{ t: 'shot', dmg: 6 * P, speed: 240, size: 2, st: SX(S || 'weak', 0.8) }], name: ['{n} 주사', '{n} 처방', '{n} 링거'], desc: ['{n을} 한 방 놓아 준다. 맞는 쪽은 아프다'] },
    s1: { m: 'zone', fx: (P, S) => [{ t: 'zone', at: 'target', r: 26, dur: 4, dmg: 3 * P, heal: 4, st: SX(S, 1) }], name: ['{n} 힐링존', '{n} 치료실'], desc: ['{n} 기운이 퍼지는 구역. 나는 낫고 적은 괴롭다'] },
    s2: { m: 'heal', fx: () => [{ t: 'heal', amt: 22 }, { t: 'buff', k: 'regen', d: 4, pow: 4 }], name: ['{n} 보약', '{n} 응급처치', '{n} 한 그릇'], desc: ['{n으로} 기운을 쭉 채운다'] },
    ult: { m: 'wave', fx: (P, S) => [{ t: 'heal', amt: 38 }, { t: 'wave', at: 'self', dmg: 16 * P, r: 90, n: 2, kb: 7, st: SX(S || 'weak', 1.6) }, { t: 'buff', k: 'shield', d: 4, pow: 30 }], name: ['{n}의 기적', '{n} 대학병원'], desc: ['{n}의 기적! 나는 다 낫고 치유의 파동이 적을 날려 버린다'] },
  },
  beamer: {
    re: /광선|빔|레이저|뿜|내뿜|발사광|에너지파|파동|고함|외침|소리|비명|번개|전기/, keys: ['elec', 'holy', 'ki', 'sound'], mech: ['beam'],
    title: ['빔 마니아', '인간 레이저', '발광체'], stats: { hp: 95, speed: 1 }, passive: 'crit', weapon: 'orb',
    basic: { m: 'beam', fx: (P, S) => [{ t: 'beam', dmg: 4 * P, len: 120, w: 3, ticks: 2, dur: 0.3, st: SX(S, 0.6) }], name: ['{n} 빔', '{n} 광선', '{n} 레이저'], desc: ['{n을} 짧게 쭉 뿜는다'] },
    s1: { m: 'chain', fx: (P, S) => [{ t: 'chain', dmg: 10 * P, n: 4, range: 100, st: SX(S || 'stun', 0.8) }], name: ['{n} 연쇄', '{n} 튕기기'], desc: ['{n이} 적에게 꽂힌 뒤 옆 사람에게 계속 튄다'] },
    s2: { m: 'reflect', fx: () => [{ t: 'buff', k: 'reflect', d: 2.5 }, { t: 'blink', to: 'back', dist: 70 }], name: ['{n} 반사막', '{n} 거울'], desc: ['{n} 막으로 공격을 튕겨 내고 뒤로 빠진다'] },
    ult: { m: 'beam', fx: (P, S) => [{ t: 'beam', both: true, dmg: 9 * P, len: 300, w: 12, ticks: 6, dur: 1.2, sweep: 200, kb: 5, st: SX(S || 'stun', 1.2) }], name: ['{n} 파멸의 광선', '{n} 앞뒤 회전빔'], desc: ['앞뒤로 {n} 광선을 뿜으며 빙글 돈다. 숨을 곳이 없다'] },
  },
  polluter: {
    re: /냄새|방귀|독|오염|뿌리|뿌려|퍼뜨|흩뿌|더럽|침|콧물|코딱지|똥|썩|악취|구린/, keys: ['stink', 'poison', 'gross'], mech: ['zone', 'trail'],
    title: ['테러리스트', '환경 파괴범', '민폐왕'], stats: { hp: 105, speed: 1 }, passive: 'thorns', weapon: 'none',
    basic: { m: 'cone', fx: (P, S) => [{ t: 'cone', dmg: 4 * P, len: 52, arc: 55, dur: 0.4, ticks: 2, st: SX(S || 'poison', 1) }], name: ['{n} 분사', '{n} 뿌리기', '{n} 살포'], desc: ['{n을} 앞으로 칙칙 뿌린다. 냄새가 오래간다'] },
    s1: { m: 'lob', fx: (P, S) => [{ t: 'lob', dmg: 8 * P, r: 20, kb: 3, st: SX(S || 'poison', 1.2) }, { t: 'zone', at: 'target', r: 28, dur: 4.5, dmg: 3 * P, st: SX(S || 'poison', 1.2) }], name: ['{n} 폭탄', '{n} 투하'], desc: ['{n} 덩어리를 던지면 떨어진 곳이 {n} 늪이 된다'] },
    s2: { m: 'trail', fx: (P, S) => [{ t: 'trail', dmg: 3 * P, dur: 5, life: 3, st: SX(S || 'slow', 1) }, { t: 'buff', k: 'haste', d: 4 }], name: ['{n} 자국', '{n} 질주'], desc: ['빨리 달리면서 지나간 자리에 {n을} 남긴다'] },
    ult: { m: 'zone', fx: (P, S) => [{ t: 'zone', at: 'self', follow: true, r: 46, dur: 6, dmg: 5 * P, st: SX(S || 'poison', 1.5) }, { t: 'wave', at: 'self', dmg: 10 * P, r: 70, kb: 7, st: SX(S || 'confuse', 1.5) }], name: ['{n} 국가 재난', '{n} 대환장 파티'], desc: ['{n} 폭발! 내 주변 전체가 {n} 구역이 된다. 숨 참으세요'] },
  },
  artillery: {
    re: /하늘에서|쏟아|소나기|우박|떨어|폭우|비처럼|퍼붓|폭격|공습|내리/, keys: ['money', 'water', 'space', 'sweet'], mech: ['rain'],
    title: ['기상캐스터', '포병', '하늘의 장난꾼'], stats: { hp: 90, speed: 0.95 }, passive: 'crit', weapon: 'wand',
    basic: { m: 'lob', fx: (P, S) => [{ t: 'lob', dmg: 8 * P, r: 13, kb: 3, st: SX(S, 0.6) }], name: ['{n} 낙하', '{n} 떨구기'], desc: ['{n을} 포물선으로 던져 정수리에 떨군다'] },
    s1: { m: 'rain', fx: (P, S) => [{ t: 'shot', from: 'sky', n: 5, dmg: 6 * P, size: 3, boom: 10, speed: 240, st: SX(S || 'slow', 1.2) }], name: ['{n} 소나기', '{n} 우박'], desc: ['{n이} 소나기처럼 쏟아진다'] },
    s2: { m: 'fly', fx: (P) => [{ t: 'buff', k: 'fly', d: 4 }, { t: 'lob', dmg: 6 * P, r: 16, n: 3 }], name: ['{n} 열기구', '공중 {n} 투하'], desc: ['하늘로 둥실 떠올라 {n을} 마구 떨군다'] },
    ult: { m: 'rain', fx: (P, S) => [{ t: 'shot', from: 'sky', n: 8, dmg: 8 * P, size: 3, boom: 16, speed: 250, st: SX(S || 'stun', 1.4) }, { t: 'all', dmg: 4 * P, st: SX(S || 'slow', 2) }], name: ['{n} 대홍수', '{n} 종말의 비'], desc: ['하늘이 뚫린 듯 {n이} 쏟아진다. 우산은 소용없다'] },
  },
  trickster: {
    re: /마술|마법|홀리|혼란|최면|장난|거짓말|속이|사기|변신|헷갈|바꿔|웃기|웃게|간지|시간|멈추|되감|요술|주문/, keys: ['magic', 'time', 'ice'], mech: ['swap', 'all'],
    title: ['마술사', '사기꾼', '장난꾸러기'], stats: { hp: 90, speed: 1.05 }, passive: 'dodge', weapon: 'wand',
    basic: { m: 'shot', fx: (P, S) => [{ t: 'shot', dmg: 6 * P, speed: 250, size: 2, bounce: 2, st: SX(S || 'confuse', 0.8) }], name: ['{n} 장난', '{n} 깜짝 상자', '{n} 트릭'], desc: ['{n을} 던지면 벽에 튕겨 다닌다. 맞으면 정신이 없다'] },
    s1: { m: 'chain', fx: (P, S) => [{ t: 'chain', dmg: 6 * P, n: 5, range: 110, st: SX(S || 'confuse', 1.4) }], name: ['{n} 카드 마술', '{n} 최면 연쇄'], desc: ['{n이} 이 사람 저 사람 튀어 다니며 홀린다'] },
    s2: { m: 'swap', fx: () => [{ t: 'swap' }, { t: 'buff', k: 'counter', d: 1.2 }], name: ['{n} 바꿔치기', '{n} 눈속임'], desc: ['적과 자리를 바꾸고 반격 자세로 히죽 웃는다'] },
    ult: { m: 'zone', fx: (P, S) => [{ t: 'zone', at: 'target', r: 44, dur: 5, dmg: 3 * P, st: { k: 'morph', d: 2 } }, { t: 'all', dmg: 4 * P, st: SX(S || 'dance', 1.5) }], name: ['{n} 변신 쇼', '{n} 대환장 마술'], desc: ['구역 안의 모두가 {n} 때문에 변신한다'] },
  },
  speedster: {
    re: /빠르|빨라|달리|질주|스피드|속도|번개처럼|총알처럼|광속|순식간|폭주|드리프트/, keys: ['speed', 'wind'], mech: ['haste', 'dash'],
    title: ['폭주족', '배달의 달인', '스피드광'], stats: { hp: 85, speed: 1.3 }, passive: 'swift', weapon: 'none',
    basic: { m: 'swing', fx: (P, S) => [{ t: 'swing', dmg: 5 * P, r: 17, arc: 90, n: 2, kb: 3, st: SX(S, 0.6) }], name: ['{n} 따다닥', '{n} 연타'], desc: ['{n으로} 눈에 안 보이게 두 번 후린다'] },
    s1: { m: 'dash', fx: (P, S) => [{ t: 'dash', dist: 115, dmg: 12 * P, kb: 6, st: SX(S, 1) }, { t: 'trail', dmg: 2 * P, dur: 3, life: 2, st: SX(S || 'slow', 1) }], name: ['{n} 드리프트', '{n} 질주'], desc: ['{n} 속도로 돌진하며 바퀴 자국을 남긴다'] },
    s2: { m: 'haste', fx: () => [{ t: 'buff', k: 'haste', d: 4 }, { t: 'blink', to: 'side', dist: 70 }], name: ['{n} 잔상', '{n} 부스터'], desc: ['{n}보다 빨라져 잔상만 남는다'] },
    ult: { m: 'dash', fx: (P, S) => [{ t: 'dash', dist: 130, dmg: 14 * P, invuln: true, kb: 4 }, { t: 'dash', dist: 130, dmg: 14 * P, invuln: true, kb: 4 }, { t: 'swing', dmg: 16 * P, r: 30, arc: 360, n: 2, kb: 8, st: SX(S || 'stun', 1.2) }], name: ['{n} 마하 왕복', '{n} 광속 배달'], desc: ['눈에 안 보이는 속도로 왕복한 뒤 제자리에서 회오리'] },
  },
  gravity: {
    re: /중력|끌어당|당기|빨아들|흡입|블랙홀|자석|무게|무겁|짓눌|청소기/, keys: ['gravity'], mech: ['pull'],
    title: ['블랙홀', '인간 자석', '진공청소기'], stats: { hp: 110, speed: 0.9 }, passive: 'aura', weapon: 'orb',
    basic: { m: 'shot', fx: (P, S) => [{ t: 'shot', dmg: 7 * P, speed: 210, size: 3, st: SX(S || 'heavy', 0.8) }], name: ['무거운 {n}', '{n} 중력탄'], desc: ['맞으면 몸이 {n}처럼 무거워진다'] },
    s1: { m: 'hook', fx: (P, S) => [{ t: 'hook', dmg: 9 * P, speed: 240, range: 160, st: SX(S || 'heavy', 1.4) }], name: ['{n} 끌어당기기', '{n} 흡입'], desc: ['{n} 힘으로 적 하나를 쭉 빨아들인다'] },
    s2: { m: 'blink', fx: (P) => [{ t: 'blink', to: 'front', dist: 80 }, { t: 'wave', at: 'self', dmg: 10 * P, r: 40, kb: 8 }], name: ['{n} 공간 도약', '{n} 워프'], desc: ['공간을 접어서 툭 나타나며 주변을 밀어낸다'] },
    ult: { m: 'pull', fx: (P, S) => [{ t: 'wave', at: 'target', dmg: 14 * P, r: 70, n: 2, kb: -10, st: SX(S || 'heavy', 2) }, { t: 'blast', at: 'target', r: 40, dmg: 18 * P, delay: 0.6, kb: 8 }], name: ['{n} 특이점', '{n} 우주 붕괴'], desc: ['거대한 {n} 블랙홀이 모두 빨아들인 뒤 쾅 터진다'] },
  },
  engineer: {
    re: /로봇|기계|설치|포탑|만들|조립|발명|공구|드론|컴퓨터|코딩|해킹/, keys: ['tech'], mech: ['turret'],
    title: ['공돌이', '발명왕', '수리 기사'], stats: { hp: 100, speed: 0.95 }, passive: 'armor', weapon: 'hammer',
    basic: { m: 'line', fx: (P, S) => [{ t: 'line', dmg: 8 * P, n: 4, step: 15, r: 7, kb: 3, st: SX(S, 0.6) }], name: ['{n} 드릴', '{n} 레일'], desc: ['땅속으로 {n} 드릴을 박아 앞쪽이 차례로 솟는다'] },
    s1: { m: 'turret', fx: (P, S) => [{ t: 'summon', kind: 'turret', n: 1, dmg: 5 * P, rate: 1.4, dur: 9, st: SX(S, 0.8) }], name: ['{n} 포탑', '{n} 자동 사격기'], desc: ['{n} 포탑을 세워 대신 싸우게 한다'] },
    s2: { m: 'hook', fx: (P) => [{ t: 'hook', dmg: 7 * P, speed: 300, range: 150, st: { k: 'stun', d: 0.6 } }, { t: 'summon', kind: 'barrier', n: 1, dur: 6 }], name: ['{n} 로봇 팔', '{n} 집게'], desc: ['{n} 집게를 쭉 뻗어 적을 잡아 온다'] },
    ult: { m: 'turret', fx: (P, S) => [{ t: 'summon', kind: 'turret', n: 3, dmg: 5 * P, rate: 1.3, dur: 10, st: SX(S, 1) }, { t: 'line', dmg: 14 * P, n: 8, step: 20, r: 11, kb: 6 }], name: ['{n} 공장 가동', '{n} 로봇 군단'], desc: ['{n} 포탑이 줄줄이 세워지고 땅에서 기계 기둥이 솟는다'] },
  },
  glutton: {
    re: /먹|삼키|마시|배고프|먹방|폭식|식욕|씹|맛있|요리|굽|구워|튀겨|끓/, keys: ['food'], mech: ['heal', 'pull'],
    title: ['먹방러', '대식가', '요리왕'], stats: { hp: 120, speed: 0.95, size: 1.1 }, passive: 'lifesteal', weapon: 'hammer',
    basic: { m: 'cone', fx: (P, S) => [{ t: 'cone', dmg: 8 * P, len: 46, arc: 45, dur: 0.22, ticks: 1, kb: 4, st: SX(S || 'heavy', 0.8) }], name: ['{n} 퉤', '먹던 {n} 뿜기'], desc: ['먹던 {n을} 앞으로 퉤 뿜는다. 아깝다'] },
    s1: { m: 'hook', fx: (P, S) => [{ t: 'hook', dmg: 9 * P, speed: 260, range: 140, st: SX(S || 'slow', 1.2) }], name: ['{n} 젓가락', '후루룩 {n}'], desc: ['{n} 먹듯이 적을 젓가락으로 집어 온다'] },
    s2: { m: 'heal', fx: () => [{ t: 'heal', amt: 22 }, { t: 'buff', k: 'giant', d: 3 }], name: ['{n} 먹방', '{n} 폭식'], desc: ['{n을} 허겁지겁 먹고 기운이 난다(살도 찐다)'] },
    ult: { m: 'big', fx: (P, S) => [{ t: 'buff', k: 'giant', d: 5 }, { t: 'wave', at: 'self', dmg: 12 * P, r: 70, kb: -9, st: SX(S || 'heavy', 1.6) }, { t: 'swing', dmg: 20 * P, r: 34, arc: 360, kb: 9 }], name: ['{n} 무한 리필', '세상 {n} 정식'], desc: ['거대해져서 모두를 빨아들인 뒤 한입에 꿀꺽'] },
  },
  lazy: {
    re: /멍|게으|귀찮|눕|누워|빈둥|뒹굴|아무것도|잠|졸|낮잠|하품|쉬|백수|침대|이불/, keys: ['sleep'], mech: [],
    title: ['백수', '프로 낮잠러', '귀차니스트'], stats: { hp: 110, speed: 0.85 }, passive: 'regen', weapon: 'none',
    basic: { m: 'lob', fx: (P, S) => [{ t: 'lob', dmg: 7 * P, r: 13, kb: 2, st: SX(S || 'slow', 0.8) }], name: ['{n} 하품', '대충 {n}', '{n} 휴'], desc: ['누운 채로 {n을} 대충 던진다'] },
    s1: { m: 'zone', fx: (P, S) => [{ t: 'zone', at: 'target', r: 30, dur: 4, dmg: 2 * P, st: SX(S || 'sleep', 1.2) }], name: ['{n} 자장가', '{n} 낮잠 구역'], desc: ['여기 들어오면 누구든 {n}처럼 잠든다'] },
    s2: { m: 'counter', fx: () => [{ t: 'buff', k: 'counter', d: 2 }, { t: 'heal', amt: 16 }], name: ['건드리지 마', '{n} 이불 속'], desc: ['이불 속에 눕는다. 깨우면 그대로 되돌려 준다'] },
    ult: { m: 'all', fx: (P, S) => [{ t: 'all', dmg: 4 * P, st: SX(S || 'sleep', 2) }, { t: 'zone', at: 'self', r: 44, dur: 5, dmg: 2 * P, heal: 5, st: { k: 'sleep', d: 1.5 } }], name: ['{n} 주말 낮잠', '{n} 겨울잠'], desc: ['세상 모두가 {n} 때문에 잠든다. 나만 쉰다'] },
  },
  idol: {
    re: /노래|춤|댄스|아이돌|가수|랩|떼창|콘서트|공연|무대|팬|케이팝|트로트|박수/, keys: ['sound', 'love'], mech: [],
    title: ['아이돌', '트로트 신동', '춤신춤왕'], stats: { hp: 95, speed: 1.1 }, passive: 'aura', weapon: 'none',
    basic: { m: 'cone', fx: (P, S) => [{ t: 'cone', dmg: 3 * P, len: 70, arc: 40, dur: 0.35, ticks: 2, st: SX(S, 0.6) }], name: ['{n} 고음', '{n} 샤우팅'], desc: ['{n} 고음을 앞으로 내지른다. 귀가 아프다'] },
    s1: { m: 'all', fx: (P, S) => [{ t: 'all', dmg: 3 * P, st: SX(S || 'dance', 1.4) }], name: ['{n} 챌린지', '{n} 떼창'], desc: ['모두가 {n}에 맞춰 춤을 춘다(강제)'] },
    s2: { m: 'orbit', fx: (P) => [{ t: 'summon', kind: 'orbit', n: 3, dmg: 5 * P, dur: 6 }, { t: 'buff', k: 'haste', d: 3 }], name: ['{n} 백댄서', '{n} 응원단'], desc: ['{n} 백댄서들이 주위를 돈다. 칼군무'] },
    ult: { m: 'wave', fx: (P, S) => [{ t: 'zone', at: 'self', follow: true, r: 46, dur: 6, dmg: 3 * P, st: SX(S || 'dance', 1.5) }, { t: 'wave', at: 'self', dmg: 9 * P, r: 80, n: 3, kb: 6, st: { k: 'confuse', d: 1.2 } }], name: ['{n} 월드 투어', '{n} 앙코르'], desc: ['{n} 콘서트 개최! 베이스가 쿵쿵쿵 울린다'] },
  },
  nagger: {
    re: /잔소리|숙제|시험|공부|훈화|설교|회의|야근|보고서|수행평가|과제|출근|월요일|엄마|선생님|상사|부장/, keys: ['nag'], mech: [],
    title: ['잔소리꾼', '교장 선생님', '부장님'], stats: { hp: 105, speed: 0.95 }, passive: 'aura', weapon: 'book',
    basic: { m: 'cone', fx: (P, S) => [{ t: 'cone', dmg: 3 * P, len: 78, arc: 38, dur: 0.45, ticks: 3, st: SX(S || 'slow', 0.8) }], name: ['{n} 한마디', '{n} 잔소리'], desc: ['{n} 잔소리를 앞으로 줄줄 쏟아낸다'] },
    s1: { m: 'all', fx: (P, S) => [{ t: 'all', dmg: 3 * P, st: SX(S || 'sleep', 1.3) }], name: ['{n} 훈화 말씀', '{n} 1시간 강의'], desc: ['끝나지 않는 {n} 이야기에 모두 존다'] },
    s2: { m: 'counter', fx: () => [{ t: 'buff', k: 'counter', d: 1.6 }, { t: 'buff', k: 'shield', d: 3, pow: 25 }], name: ['{n} 말대꾸', '어디서 {n}'], desc: ['어디서 말대꾸야! 맞으면 그대로 되받아친다'] },
    ult: { m: 'rain', fx: (P, S) => [{ t: 'shot', from: 'sky', n: 8, dmg: 7 * P, size: 3, boom: 10, speed: 240 }, { t: 'all', dmg: 4 * P, st: SX(S || 'weak', 2) }], name: ['{n} 폭탄 투하', '{n} 지옥 주간'], desc: ['{n이} 비처럼 쏟아진다. 마감은 오늘까지'] },
  },
  spinner: {
    re: /부메랑|회전|팽이|빙빙|돌려|돌린|휘둘|토네이도|소용돌이|원반|요요/, keys: ['ball'], mech: ['orbit'],
    title: ['팽이', '회전왕', '어지러운 사람'], stats: { hp: 100, speed: 1.05 }, passive: 'thorns', weapon: 'none',
    basic: { m: 'shot', fx: (P, S) => [{ t: 'shot', dmg: 7 * P, speed: 240, size: 2, ret: true, st: SX(S, 0.6) }], name: ['{n} 부메랑', '돌아오는 {n}'], desc: ['{n을} 던지면 다시 돌아온다. 받을 때 아프다'] },
    s1: { m: 'swing', fx: (P, S) => [{ t: 'swing', dmg: 8 * P, r: 24, arc: 360, n: 3, kb: 5, st: SX(S, 0.8) }], name: ['{n} 회전베기', '빙빙 {n}'], desc: ['{n을} 쥐고 제자리에서 세 바퀴. 본인도 어지럽다'] },
    s2: { m: 'dash', fx: (P) => [{ t: 'dash', dist: 95, dmg: 10 * P, kb: 9 }, { t: 'summon', kind: 'orbit', n: 2, dmg: 4 * P, dur: 4 }], name: ['{n} 팽이 돌진', '{n} 토네이도'], desc: ['팽이처럼 돌면서 들이받는다'] },
    ult: { m: 'orbit', fx: (P, S) => [{ t: 'summon', kind: 'orbit', n: 4, dmg: 8 * P, dur: 7, st: SX(S, 1) }, { t: 'shot', from: 'around', n: 8, dmg: 6 * P, size: 2, speed: 250, ret: true }], name: ['{n} 허리케인', '{n} 대회전'], desc: ['{n이} 사방으로 회전하며 날아갔다 돌아온다'] },
  },
  flyer: {
    re: /날아|날개|비행|하늘을 나|공중|떠다|날 수|새처럼|글라이더|헬리콥터|비행기/, keys: [], mech: ['fly'],
    title: ['비행사', '하늘의 무법자', '조류'], stats: { hp: 90, speed: 1.15 }, passive: 'dodge', weapon: 'none',
    basic: { m: 'rain', fx: (P, S) => [{ t: 'shot', from: 'sky', n: 1, dmg: 7 * P, size: 2, speed: 260, st: SX(S, 0.6) }], name: ['{n} 투하', '{n} 공습'], desc: ['하늘에서 {n을} 떨어뜨린다'] },
    s1: { m: 'fly', fx: (P, S) => [{ t: 'buff', k: 'fly', d: 4 }, { t: 'cone', dmg: 4 * P, len: 60, arc: 70, dur: 0.4, ticks: 2, kb: 5, st: SX(S, 1) }], name: ['{n} 날갯짓', '{n} 돌풍'], desc: ['{n} 날개로 날아오르며 앞에 돌풍을 일으킨다'] },
    s2: { m: 'blink', fx: (P) => [{ t: 'blink', to: 'side', dist: 80 }, { t: 'wave', at: 'self', dmg: 8 * P, r: 34, kb: 7 }], name: ['{n} 급강하', '{n} 착지'], desc: ['{n}처럼 휙 내려꽂혀 주변을 밀어낸다'] },
    ult: { m: 'rain', fx: (P, S) => [{ t: 'buff', k: 'fly', d: 5 }, { t: 'lob', dmg: 10 * P, r: 22, n: 5, kb: 6, st: SX(S, 1.4) }], name: ['{n} 대공습', '{n} 하늘 지배'], desc: ['하늘을 지배하며 {n} 폭탄을 사방에 떨군다'] },
  },
};
/* ----- 유형별 다른 버전 기술: 같은 유형이라도 글마다 다른 공격이 나오게 ----- */
const ALT = {
  gunner: {
    basic: [{ m: 'shot', fx: (P, S) => [{ t: 'gatling', dmg: 3 * P, n: 10, spread: 18, st: SX(S, 0.5) }], name: ['{n} 개틀링', '{n} 드르륵'], desc: ['{n을} 개틀링처럼 드르륵 갈긴다. 손목 나감'] }],
    s1: [{ m: 'net', fx: (P) => [{ t: 'net', dmg: 6 * P, speed: 240, range: 150, r: 16, d: 2 }], name: ['{n} 그물탄', '{n} 포획'], desc: ['{n} 그물을 쏴서 맞은 자리에 꽁꽁 묶어 둔다'] }],
    ult: [{ m: 'snipe', fx: (P, S) => [{ t: 'snipe', dmg: 40 * P, delay: 0.6, kb: 9, st: SX(S || 'stun', 1.4) }], name: ['{n} 헤드샷', '{n} 저격 한 방'], desc: ['빨간 조준선이 번쩍… 탕! 맵 끝까지 꿰뚫는 {n} 한 발'] },
      { m: 'missiles', fx: (P, S) => [{ t: 'missiles', dmg: 8 * P, n: 8, speed: 230, st: SX(S, 1) }], name: ['{n} 유도 미사일', '{n} 미사일 파티'], desc: ['{n} 미사일 여덟 발이 연기를 뿜으며 쫓아간다'] }],
  },
  bomber: {
    s1: [{ m: 'mark', fx: (P, S) => [{ t: 'mark', dmg: 22 * P, r: 20, delay: 1.2, range: 170, kb: 7, st: SX(S, 1) }], name: ['{n} 찰싹 폭탄', '{n} 시한폭탄'], desc: ['적 등에 {n} 폭탄을 찰싹 붙인다. 1초 뒤 펑'] },
      { m: 'cross', fx: (P, S) => [{ t: 'cross', dmg: 14 * P, n: 4, at: 'target', kb: 5, st: SX(S, 1) }], name: ['{n} 십자 폭발', '{n} 봄버맨'], desc: ['{n} 폭탄이 십자 모양으로 쭉 터진다'] }],
    s2: [{ m: 'clone', fx: (P) => [{ t: 'clone', dmg: 16 * P, n: 1, r: 22, dur: 5 }], name: ['자폭 {n} 분신', '{n} 가미카제'], desc: ['내 분신이 적에게 달려가서 껴안고 터진다'] }],
    ult: [{ m: 'meteor', fx: (P, S) => [{ t: 'meteor', dmg: 40 * P, r: 48, kb: 10, st: SX(S || 'stun', 1.5) }, { t: 'storm', dmg: 6 * P, n: 6, r: 50 }], name: ['{n} 운석 낙하', '하늘에서 거대 {n}'], desc: ['하늘에서 집채만 한 {n이} 떨어진다. 대피 안내 없음'] }],
  },
  summoner: {
    s1: [{ m: 'top', fx: (P, S) => [{ t: 'top', dmg: 6 * P, n: 3, speed: 120, dur: 6, st: SX(S, 0.8) }], name: ['{n} 굴리기', '{n} 놀이터'], desc: ['{n} 세 마리가 미친 듯이 굴러다니며 들이받는다'] }],
    s2: [{ m: 'beacon', fx: (P, S) => [{ t: 'beacon', dmg: 5 * P, r: 36, rate: 0.9, dur: 6, kb: 5, st: SX(S, 0.8) }], name: ['{n} 집', '{n} 둥지'], desc: ['{n} 둥지를 지으면 주기적으로 {n이} 우르르 튀어나온다'] }],
    ult: [{ m: 'clone', fx: (P, S) => [{ t: 'clone', dmg: 14 * P, n: 3, r: 20, dur: 6 }, { t: 'summon', kind: 'chaser', n: 3, dmg: 8 * P, dur: 8, st: SX(S, 1.2) }], name: ['{n} 대가족 출동', '{n}과 나의 분신'], desc: ['내 분신과 {n} 무리가 한꺼번에 달려든다'] }],
  },
  brawler: {
    basic: [{ m: 'thrust', fx: (P, S) => [{ t: 'thrust', dmg: 5 * P, len: 34, w: 6, n: 2, kb: 3, st: SX(S, 0.5) }], name: ['{n} 원투', '{n} 잽잽'], desc: ['{n} 주먹을 원투로 쭉쭉 내지른다'] }],
    s1: [{ m: 'launch', fx: (P) => [{ t: 'launch', dmg: 13 * P, r: 15, off: 14, d: 1.1 }], name: ['{n} 어퍼컷', '승룡 {n}'], desc: ['아래에서 위로 {n} 어퍼컷! 적이 하늘로 붕 뜬다'] }],
    s2: [{ m: 'counter', fx: () => [{ t: 'buff', k: 'counter', d: 1.5 }, { t: 'buff', k: 'armor', d: 3 }], name: ['{n} 받아치기', '덤벼라 {n}'], desc: ['자세를 잡고 버틴다. 때리는 순간 그대로 되받아친다'] },
      { m: 'surge', fx: (P, S) => [{ t: 'surge', dmg: 12 * P, w: 50, len: 140, speed: 190, kb: 9, st: SX(S, 0.8) }], name: ['{n} 어깨빵', '{n} 밀어붙이기'], desc: ['땅을 박차며 {n} 기운의 벽을 앞으로 밀어 보낸다'] }],
    ult: [{ m: 'leap', fx: (P, S) => [{ t: 'leap', dmg: 28 * P, r: 32, dist: 140, kb: 10, st: SX(S || 'stun', 1.3) }, { t: 'spikering', dmg: 12 * P, r: 40, n: 10, at: 'self' }], name: ['{n} 하늘 내려찍기', '{n} 슈퍼 점프'], desc: ['하늘 높이 뛰어올라 쿵! 착지하면 땅이 솟는다'] }],
  },
  assassin: {
    basic: [{ m: 'thrust', fx: (P, S) => [{ t: 'thrust', dmg: 4 * P, len: 40, w: 4, n: 3, kb: 1, st: SX(S, 0.5) }], name: ['{n} 삼연 찌르기', '{n} 쿡쿡쿡'], desc: ['{n으로} 빛의 속도로 세 번 쿡쿡쿡'] }],
    s1: [{ m: 'phantom', fx: (P, S) => [{ t: 'phantom', dmg: 18 * P, dist: 110, st: SX(S, 1.2) }], name: ['{n} 환영 베기', '{n} 이미 베었다'], desc: ['스쳐 지나간 뒤… 0.3초 후에 {n} 칼자국이 터진다'] }],
    s2: [{ m: 'clone', fx: (P) => [{ t: 'buff', k: 'invis', d: 2.5 }, { t: 'clone', dmg: 10 * P, n: 2, r: 16, dur: 4 }], name: ['{n} 분신술', '진짜 나를 찾아봐'], desc: ['숨으면서 {n} 분신 둘을 내보낸다. 분신은 터진다'] }],
    ult: [{ m: 'flurry', fx: (P, S) => [{ t: 'phantom', dmg: 14 * P, dist: 120 }, { t: 'flurry', dmg: 4 * P, r: 26, off: 0, dur: 0.8, ticks: 8, st: SX(S, 1) }], name: ['{n} 천 번 베기', '{n} 난무'], desc: ['순식간에 파고들어 {n으로} 천 번 벤다(실제로는 여덟 번)'] }],
  },
  tank: {
    s1: [{ m: 'surge', fx: (P, S) => [{ t: 'surge', dmg: 12 * P, w: 60, len: 130, speed: 160, kb: 10, st: SX(S || 'heavy', 1) }], name: ['{n} 불도저', '{n} 밀어내기'], desc: ['{n} 벽을 세워 앞으로 쭉 밀고 나간다'] }],
    s2: [{ m: 'firewall', fx: (P, S) => [{ t: 'firewall', dmg: 3 * P, len: 80, off: 30, dur: 4, st: SX(S, 1) }, { t: 'buff', k: 'shield', d: 3, pow: 25 }], name: ['{n} 바리케이드', '{n} 방어선'], desc: ['눈앞에 {n} 벽을 가로로 세운다. 넘어오면 아프다'] }],
    ult: [{ m: 'leap', fx: (P, S) => [{ t: 'buff', k: 'giant', d: 4 }, { t: 'leap', dmg: 34 * P, r: 44, dist: 130, kb: 10, st: SX(S || 'stun', 1.5) }], name: ['{n} 바디 프레스', '거대 {n} 낙하'], desc: ['커다래진 몸으로 점프해서 그대로 깔아뭉갠다'] }],
  },
  healer: {
    basic: [{ m: 'whip', fx: (P, S) => [{ t: 'whip', dmg: 8 * P, len: 50, kb: 4, st: SX(S || 'weak', 0.6) }], name: ['{n} 붕대 채찍', '{n} 찰싹'], desc: ['{n} 붕대를 채찍처럼 찰싹 휘두른다'] }],
    s1: [{ m: 'drain', fx: (P, S) => [{ t: 'drain', dmg: 3 * P, range: 120, dur: 1.8, ticks: 6, heal: 2, st: SX(S, 0.6) }], name: ['{n} 수혈', '{n} 기운 빨기'], desc: ['적과 {n} 줄로 연결해서 생명력을 쭉쭉 빨아온다'] }],
    ult: [{ m: 'beacon', fx: (P, S) => [{ t: 'heal', amt: 30 }, { t: 'beacon', dmg: 7 * P, r: 50, rate: 0.8, dur: 6, kb: 6, st: SX(S || 'weak', 1) }], name: ['{n} 치유의 탑', '{n} 성지'], desc: ['{n} 탑을 세우면 치유의 파동이 계속 퍼진다(적은 아프다)'] }],
  },
  beamer: {
    basic: [{ m: 'prism', fx: (P, S) => [{ t: 'prism', dmg: 3 * P, len: 100, w: 3, spread: 18, ticks: 1, dur: 0.25, st: SX(S, 0.5) }], name: ['{n} 세 갈래 빔', '{n} 삼지창'], desc: ['{n} 광선이 세 갈래로 퍼진다'] }],
    s1: [{ m: 'prism', fx: (P, S) => [{ t: 'prism', dmg: 5 * P, len: 190, w: 5, spread: 25, ticks: 2, dur: 0.5, st: SX(S || 'slow', 1) }], name: ['{n} 분광', '{n} 무지개빔'], desc: ['{n이} 프리즘에 갈라져 세 줄기로 뿜어진다'] }],
    ult: [{ m: 'charge', fx: (P, S) => [{ t: 'charge', dmg: 34 * P, delay: 0.5, speed: 300, boom: 30, kb: 10, st: SX(S || 'stun', 1.4) }, { t: 'storm', dmg: 7 * P, n: 6, r: 44 }], name: ['{n} 원기옥', '{n} 차지샷'], desc: ['{n} 기운을 모으고 모아… 거대한 관통탄 발사!'] }],
  },
  polluter: {
    s1: [{ m: 'vortex', fx: (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 34, dur: 3.5, pull: 9, at: 'target', st: SX(S || 'poison', 1.2) }], name: ['{n} 하수구', '{n} 블랙홀'], desc: ['{n} 소용돌이가 주변을 빨아들이며 괴롭힌다'] }],
    ult: [{ m: 'tornado', fx: (P, S) => [{ t: 'tornado', dmg: 5 * P, r: 20, speed: 70, life: 4, st: SX(S || 'poison', 1.2) }, { t: 'ring', dmg: 6 * P, r: 40, dur: 4, at: 'target', st: SX(S || 'confuse', 1) }], name: ['{n} 태풍 경보', '{n} 회오리'], desc: ['거대한 {n} 회오리가 굴러다니며 모두를 빨아들인다'] }],
  },
  artillery: {
    basic: [{ m: 'skyline', fx: (P, S) => [{ t: 'skyline', dmg: 6 * P, n: 3, step: 18, r: 8, st: SX(S, 0.5) }], name: ['{n} 일렬 낙하', '{n} 줄줄이'], desc: ['앞으로 쭉 {n이} 줄줄이 떨어진다'] }],
    s1: [{ m: 'skyline', fx: (P, S) => [{ t: 'skyline', dmg: 10 * P, n: 7, step: 20, r: 11, st: SX(S || 'slow', 1) }], name: ['{n}의 비', '{n} 폭격선'], desc: ['적을 향해 일직선으로 {n이} 꽂힌다'] }],
    ult: [{ m: 'meteor', fx: (P, S) => [{ t: 'meteor', dmg: 36 * P, r: 46, kb: 10, st: SX(S || 'stun', 1.4) }, { t: 'storm', dmg: 7 * P, n: 8, r: 60 }], name: ['초거대 {n} 낙하', '{n} 종말'], desc: ['하늘에서 초거대 {n이} 떨어지고 번개까지 친다'] }],
  },
  trickster: {
    basic: [{ m: 'spiral', fx: (P, S) => [{ t: 'spiral', dmg: 3 * P, n: 8, speed: 200, st: SX(S || 'confuse', 0.5) }], name: ['{n} 빙글빙글', '{n} 회전 마술'], desc: ['{n이} 빙글빙글 돌며 사방으로 흩어진다'] }],
    s1: [{ m: 'ring', fx: (P, S) => [{ t: 'ring', dmg: 5 * P, r: 30, dur: 3.5, at: 'target', st: SX(S || 'confuse', 1.2) }], name: ['{n} 마법진', '{n} 감옥'], desc: ['적 주위에 {n} 고리를 쳐서 가둔다. 나오면 아프다'] }],
    s2: [{ m: 'clone', fx: (P) => [{ t: 'blink', to: 'random', dist: 80 }, { t: 'clone', dmg: 12 * P, n: 2, r: 18, dur: 5 }], name: ['{n} 눈속임', '어느 게 진짜게'], desc: ['순간이동하고 그 자리에 {n} 분신을 남긴다'] }],
    ult: [{ m: 'vortex', fx: (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 50, dur: 4, pull: 11, at: 'target', st: { k: 'morph', d: 1.5 } }, { t: 'all', dmg: 4 * P, st: SX(S || 'dance', 1.4) }], name: ['{n} 블랙홀 마술', '{n} 대환장 쇼'], desc: ['{n} 소용돌이에 빨려 들어가면 개구리가 된다'] }],
  },
  speedster: {
    basic: [{ m: 'thrust', fx: (P, S) => [{ t: 'thrust', dmg: 3 * P, len: 34, w: 4, n: 4, kb: 1, st: SX(S, 0.4) }], name: ['{n} 백열권', '{n} 다다다다'], desc: ['{n으로} 다다다다 네 번 찌른다'] }],
    s1: [{ m: 'phantom', fx: (P, S) => [{ t: 'phantom', dmg: 16 * P, dist: 125, st: SX(S, 1) }], name: ['{n} 소닉붐', '{n} 지나갔다'], desc: ['순식간에 지나간 뒤 그 길에 {n} 충격이 터진다'] }],
    ult: [{ m: 'flurry', fx: (P, S) => [{ t: 'phantom', dmg: 14 * P, dist: 130 }, { t: 'flurry', dmg: 4 * P, r: 28, off: 0, dur: 0.9, ticks: 9, st: SX(S, 1) }, { t: 'buff', k: 'haste', d: 3 }], name: ['{n} 무한 연타', '{n} 광속 난무'], desc: ['빛의 속도로 파고들어 {n으로} 아홉 번 연타'] }],
  },
  gravity: {
    s1: [{ m: 'vortex', fx: (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 36, dur: 3, pull: 12, at: 'target', st: SX(S || 'heavy', 1.2) }], name: ['{n} 중력장', '{n} 빨대'], desc: ['{n} 중력장이 계속 끌어당긴다. 발버둥 쳐도 소용없다'] }],
    ult: [{ m: 'meteor', fx: (P, S) => [{ t: 'vortex', dmg: 3 * P, r: 50, dur: 2, pull: 13, at: 'target', st: { k: 'heavy', d: 1.5 } }, { t: 'meteor', dmg: 34 * P, r: 44, kb: 8, st: SX(S || 'stun', 1.3) }], name: ['{n} 낙하 중력', '{n} 행성 충돌'], desc: ['모두를 한곳에 끌어모은 뒤 {n} 행성을 떨어뜨린다'] }],
  },
  engineer: {
    basic: [{ m: 'gatling', fx: (P, S) => [{ t: 'gatling', dmg: 3 * P, n: 8, spread: 14, st: SX(S, 0.4) }], name: ['{n} 머신건', '{n} 연사 장치'], desc: ['손목에 단 {n} 머신건이 드르륵'] }],
    s1: [{ m: 'top', fx: (P, S) => [{ t: 'top', dmg: 6 * P, n: 2, speed: 130, dur: 6, kb: 5, st: SX(S, 0.8) }], name: ['{n} 로봇청소기', '{n} 자율주행'], desc: ['{n} 로봇 둘이 맵을 누비며 들이받는다'] }],
    s2: [{ m: 'beacon', fx: (P, S) => [{ t: 'beacon', dmg: 5 * P, r: 34, rate: 1, dur: 6, kb: 6, st: SX(S || 'slow', 0.8) }], name: ['{n} 진동기', '{n} 발전기'], desc: ['{n} 장치를 설치하면 주기적으로 충격파가 나온다'] }],
    ult: [{ m: 'missiles', fx: (P, S) => [{ t: 'missiles', dmg: 8 * P, n: 8, speed: 240, st: SX(S, 1) }, { t: 'summon', kind: 'turret', n: 2, dmg: 5 * P, rate: 1.3, dur: 8 }], name: ['{n} 미사일 공장', '{n} 무기고 개방'], desc: ['{n} 미사일 여덟 발 발사 + 포탑 두 대 설치'] }],
  },
  glutton: {
    basic: [{ m: 'whip', fx: (P, S) => [{ t: 'whip', dmg: 8 * P, len: 52, kb: 5, st: SX(S || 'slow', 0.6) }], name: ['{n} 면발 채찍', '{n} 휘두르기'], desc: ['긴 {n} 가닥을 채찍처럼 휘두른다'] }],
    s1: [{ m: 'drain', fx: (P, S) => [{ t: 'drain', dmg: 3 * P, range: 110, dur: 1.8, ticks: 6, heal: 3, st: SX(S, 0.6) }], name: ['{n} 빨대 꽂기', '{n} 흡입'], desc: ['적에게 {n} 빨대를 꽂고 쭉쭉 빨아 먹는다'] }],
    ult: [{ m: 'roll', fx: (P, S) => [{ t: 'roll', dmg: 22 * P, size: 13, speed: 120, life: 3, bounce: 3, kb: 10, st: SX(S || 'heavy', 1.4) }, { t: 'heal', amt: 20 }], name: ['거대 {n} 굴리기', '{n} 미트볼'], desc: ['집채만 한 {n} 덩어리가 맵을 굴러다니며 다 깔아뭉갠다'] }],
  },
  lazy: {
    basic: [{ m: 'roll', fx: (P, S) => [{ t: 'roll', dmg: 7 * P, size: 6, speed: 90, life: 1.5, bounce: 1, kb: 4, st: SX(S || 'slow', 0.6) }], name: ['{n} 데굴데굴', '굴러가라 {n}'], desc: ['누운 채로 {n을} 대충 굴려 보낸다'] }],
    s1: [{ m: 'ring', fx: (P, S) => [{ t: 'ring', dmg: 3 * P, r: 30, dur: 4, at: 'target', st: SX(S || 'sleep', 1.2) }], name: ['{n} 이불 감옥', '{n} 울타리'], desc: ['적 주위에 {n} 울타리를 친다. 넘으면 잠든다'] }],
    ult: [{ m: 'meteor', fx: (P, S) => [{ t: 'meteor', dmg: 30 * P, r: 44, kb: 8, st: SX(S || 'sleep', 2) }, { t: 'all', dmg: 3 * P, st: { k: 'sleep', d: 1.5 } }], name: ['하늘에서 {n} 침대', '{n} 낙하 낮잠'], desc: ['하늘에서 거대한 {n} 침대가 떨어진다. 다 같이 잔다'] }],
  },
  idol: {
    basic: [{ m: 'prism', fx: (P, S) => [{ t: 'prism', dmg: 3 * P, len: 90, w: 3, spread: 22, ticks: 1, dur: 0.25, st: SX(S, 0.4) }], name: ['{n} 조명', '{n} 스포트라이트'], desc: ['무대 조명이 세 갈래로 쏟아진다'] }],
    s1: [{ m: 'beacon', fx: (P, S) => [{ t: 'beacon', dmg: 4 * P, r: 40, rate: 0.8, dur: 5, kb: 4, st: SX(S || 'dance', 0.8) }], name: ['{n} 스피커', '{n} 앰프'], desc: ['{n} 스피커를 설치하면 쿵쿵 울릴 때마다 춤추게 된다'] }],
    s2: [{ m: 'clone', fx: (P) => [{ t: 'clone', dmg: 10 * P, n: 2, r: 18, dur: 5 }, { t: 'buff', k: 'haste', d: 3 }], name: ['{n} 백댄서 출동', '{n} 멤버 소환'], desc: ['나랑 똑같이 생긴 멤버들이 달려가서 터진다'] }],
  },
  nagger: {
    basic: [{ m: 'whip', fx: (P, S) => [{ t: 'whip', dmg: 8 * P, len: 54, kb: 4, st: SX(S || 'slow', 0.6) }], name: ['{n} 회초리', '사랑의 {n}'], desc: ['{n} 회초리를 찰싹. 사랑해서 그런 거다'] }],
    s1: [{ m: 'mark', fx: (P, S) => [{ t: 'mark', dmg: 18 * P, r: 18, delay: 1.1, range: 170, kb: 6, st: SX(S || 'weak', 1.2) }], name: ['{n} 벌점', '{n} 마감 표시'], desc: ['적에게 {n} 벌점 딱지를 붙인다. 잠시 후 폭발'] }],
    ult: [{ m: 'skyline', fx: (P, S) => [{ t: 'skyline', dmg: 12 * P, n: 9, step: 20, r: 12, st: SX(S || 'weak', 1.2) }, { t: 'all', dmg: 4 * P, st: SX(S || 'sleep', 1.5) }], name: ['{n} 산더미', '{n} 폭탄 줄투하'], desc: ['적 쪽으로 {n이} 일렬로 쾅쾅쾅 쌓인다'] }],
  },
  spinner: {
    basic: [{ m: 'top', fx: (P, S) => [{ t: 'top', dmg: 6 * P, n: 1, speed: 140, dur: 2.5, kb: 4, st: SX(S, 0.5) }], name: ['{n} 팽이치기', '팽이 {n}'], desc: ['{n} 팽이를 던지면 혼자 돌아다니며 부딪힌다'] }],
    s1: [{ m: 'tornado', fx: (P, S) => [{ t: 'tornado', dmg: 4 * P, r: 14, speed: 90, life: 2.5, st: SX(S, 0.8) }], name: ['{n} 회오리', '{n} 토네이도'], desc: ['{n} 회오리를 만들어 앞으로 굴려 보낸다'] }],
    ult: [{ m: 'spiral', fx: (P, S) => [{ t: 'spiral', dmg: 6 * P, n: 22, speed: 210, st: SX(S, 0.8) }, { t: 'tornado', dmg: 5 * P, r: 18, speed: 70, life: 3.5 }], name: ['{n} 대회전 탄막', '{n} 블레이드 스톰'], desc: ['{n이} 나선을 그리며 사방으로 쏟아진다'] }],
  },
  flyer: {
    basic: [{ m: 'gust', fx: (P, S) => [{ t: 'gust', dmg: 4 * P, len: 70, arc: 70, kb: 10, st: SX(S, 0.4) }], name: ['{n} 날갯바람', '{n} 부채질'], desc: ['{n} 날갯짓으로 앞을 휙 날려 버린다'] }],
    s2: [{ m: 'leap', fx: (P, S) => [{ t: 'leap', dmg: 14 * P, r: 24, dist: 130, kb: 8, st: SX(S, 1) }], name: ['{n} 급강하', '{n} 다이브'], desc: ['하늘로 솟구쳤다가 적 머리 위로 내리꽂힌다'] }],
    ult: [{ m: 'meteor', fx: (P, S) => [{ t: 'buff', k: 'fly', d: 4 }, { t: 'meteor', dmg: 32 * P, r: 42, kb: 9, st: SX(S || 'stun', 1.3) }, { t: 'skyline', dmg: 9 * P, n: 6, step: 20, r: 10 }], name: ['{n} 융단 폭격기', '{n} 하늘 지배'], desc: ['하늘을 날며 {n을} 줄줄이 떨구고 마지막에 거대 {n} 투하'] }],
  },
};
for (const k in ALT) for (const sl in ALT[k]) STYLES[k][sl] = [].concat(STYLES[k][sl], ALT[k][sl]);
const THEME_STYLE = { fire: 'bomber', ice: 'trickster', elec: 'beamer', water: 'artillery', wind: 'speedster', earth: 'tank', plant: 'healer', stink: 'polluter', poison: 'polluter', holy: 'beamer', dark: 'assassin', space: 'gravity', time: 'trickster', sound: 'idol', love: 'healer', sleep: 'lazy', metal: 'gunner', tech: 'engineer', food: 'glutton', sweet: 'artillery', animal: 'summoner', bug: 'summoner', money: 'artillery', gross: 'polluter', ghost: 'assassin', magic: 'trickster', nag: 'nagger', gravity: 'gravity', speed: 'speedster', power: 'brawler', ball: 'gunner', ki: 'beamer' };
/** 글의 의도를 보고 전투 유형 점수를 매긴다 (높은 순) */
function rankStyles(text, keys, said, famStyle) {
  const sc = {};
  for (const k in STYLES) {
    const S = STYLES[k];
    let v = 0;
    const g = new RegExp(S.re.source, 'g');
    v += (String(text).match(g) || []).length * 3;
    if (keys.some((x) => S.keys.includes(x))) v += 1.5;
    if (keys[0] && THEME_STYLE[keys[0]] === k) v += 2;
    for (const m of said) if (S.mech.includes(m)) v += 2;
    if (famStyle === k) v += 5;
    sc[k] = v;
  }
  return Object.keys(sc).sort((a, b) => sc[b] - sc[a]).map((k) => [k, sc[k]]);
}
/** "{n을}" 같은 자리에 단어와 알맞은 조사를 넣는다 */
function fmtN(tpl, n) {
  return tpl.replace(/\{n(을|이다|이야|이고|이|은|으로|과)?\}/g, (_, j) => {
    if (!j) return n;
    if (j === '이다' || j === '이야' || j === '이고') return n + (hasJong(n) ? j : j.slice(1));
    const jj = { 을: ['을', '를'], 이: ['이', '가'], 은: ['은', '는'], 으로: ['으로', '로'], 과: ['과', '와'] }[j];
    if (j === '으로') { const c = n.charCodeAt(n.length - 1); const jong = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0; return n + (jong && jong !== 8 ? '으로' : '로'); }
    return josa(n, jj[0], jj[1]);
  });
}
const FUN = {
  ultPre: ['지구 멸망급', '우주 최강', '대환장', '역대급', '국가 비상', '엄마도 놀란', '초특급', '울트라', '전설의', '교장도 무릎 꿇는'],
  say: ['{n} 배송 왔습니다', '{n} 받아라!', '{n} 맛 좀 볼래?', '{n} 무료 나눔!', '이게 {n이다}!', '{n} 사세요~', '{n} 간다잉', '{n} 사랑해!!', '{n} 어택!'],
  ultSay: ['{n} 대폭주!!', '지구여 안녕', '{n으로} 덮어라!', '이게 진짜 {n이다}', '엄마 나 {n} 됐어', '{n} 만세!!!', '다 {n이야}!!'],
  intro: ['{n} 없인 못 살아', '오늘의 메뉴는 {n}', '{n} 장인 등장', '너도 {n} 좋아하지?', '{n} 맛 좀 볼래?', '{n}의 시간이다', '{n} 주의보 발령'],
  ko: ['{n}… 미안해…', '{n이} 부족했어', '다음 생엔 {n으로}…', '{n} 다시 충전…', '내 {n} 돌려줘', '{n은} 죄가 없다'],
  win: ['{n} 만세!!', '{n은} 사랑입니다', '{n} 앞에 무릎 꿇어라', '역시 {n}밖에 없어', '{n} 구독 좋아요', '{n} 최고! 박수!'],
  titlePre: ['', '', '전설의 ', '동네 ', '자칭 ', '전직 ', '프로 '],
};

/* ----- 단어 사전(027-words-*.js) 찾기: 긴 단어 먼저, 겹치면 긴 쪽 ----- */
let WF_RE = null;
const WF_PJ = '(?:들|떼|무리)?(?:이|가|을|를|은|는|의|에|에서|에게|에게서|한테|한테서|로|으로|와|과|도|만|랑|이랑|처럼|같이|같은|보다|까지|부터|마다|이다|이야|이나|나|이든|든|이라도|라도|에는|에도|으로는|로는|으로도|로도)?(?![가-힣])';
const WF_BAD = new Set(['검은', '별로', '새로', '종이']);
const ELEM = new Set(['fire', 'ice', 'elec', 'water', 'wind', 'earth', 'poison', 'holy', 'dark', 'stink', 'space', 'time', 'sound', 'plant', 'magic', 'gravity']);
function wfFind(text) {
  if (!WF_RE) WF_RE = WF_LIST.map(([w, k]) => {
    const ww = w.replace(/^!/, ''), strict = w[0] === '!' || Array.from(ww).length === 1, esc = ww.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return [new RegExp(strict ? `(?<![가-힣])${esc}${WF_PJ}` : esc, 'gi'), k, ww];
  }).sort((a, b) => b[2].length - a[2].length);
  const t = String(text || ''), hits = [];
  for (const [re, k, w] of WF_RE) {
    re.lastIndex = 0;
    for (const m of t.matchAll(re)) {
      const at = m.index, end = at + w.length;
      if (WF_BAD.has(t.substr(at, 2))) continue;
      if (w === '개' && /(\d|한|두|세|네|몇|열|여러|다섯|여섯|일곱|여덟|아홉|스무|백|천)\s*$/.test(t.slice(Math.max(0, at - 4), at))) continue;
      if (hits.some((h) => at < h.at + h.word.length && h.at < end)) continue;
      hits.push({ at, word: t.substr(at, w.length), key: WF[k].th, fam: k, ov: {} });
      break;
    }
  }
  return hits.sort((a, b) => a.at - b.at);
}
const KNUM = { 한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 스무: 20, 백: 100, 천: 1000, 만: 10000 };
/** 글의 크기·개수·거리·속도·범위 말을 기술 수치에 반영한다 */
function tuneFx(fx, o, s) {
  const mul = (e, ks, k) => { for (const q of ks) if (typeof e[q] === 'number') e[q] *= k; };
  for (const e of fx) {
    if (o.big) { mul(e, ['r', 'size', 'w', 'len'], 1.35); if (e.dmg) e.dmg *= 1.1; }
    if (o.small) { mul(e, ['r', 'size', 'w'], 0.75); mul(e, ['speed'], 1.12); if (e.n && ['shot', 'stampede', 'missiles', 'top', 'clone', 'lob', 'storm', 'spiral', 'gatling'].includes(e.t)) e.n += 2; }
    if (o.far) { mul(e, ['range', 'len', 'dist', 'off'], 1.3); mul(e, ['speed'], 1.2); if (e.t === 'shot' && e.life) e.life *= 1.3; }
    if (o.near) { mul(e, ['range', 'len', 'dist'], 0.85); if (e.dmg) e.dmg *= 1.08; }
    if (o.fast) { mul(e, ['speed'], 1.3); mul(e, ['delay'], 0.7); }
    if (o.slowm) { mul(e, ['speed'], 0.75); if (e.dmg) e.dmg *= 1.12; }
    if (o.long) mul(e, ['dur', 'life'], 1.4);
    if (o.wide) {
      if (e.t === 'swing') e.arc = 360;
      if (['cone', 'gust', 'sonic'].includes(e.t)) e.arc = (e.arc || 60) * 1.7;
      if (e.t === 'shot' && s !== 'basic' && e.from !== 'sky' && e.from !== 'ground') { e.from = 'around'; e.n = Math.max(e.n || 1, 6); }
      if (e.at === 'front') e.at = 'self';
    }
    if (o.line && e.t === 'shot') e.spread = 0;
    if (o.times > 1) {
      const T = o.times;
      if (['thrust', 'stomp', 'hop', 'wave', 'sonic', 'pillar', 'skyline', 'cross', 'lob', 'missiles', 'clone', 'top'].includes(e.t)) e.n = Math.max(e.n || 1, T);
      if (e.t === 'swing') e.n = Math.max(e.n || 1, Math.min(4, T));
      if (e.t === 'flurry' || e.t === 'cone' || e.t === 'beam' || e.t === 'prism' || e.t === 'drain') e.ticks = Math.max(e.ticks || 3, T);
      if (e.t === 'shot' && s !== 'basic') e.n = Math.max(e.n || 1, Math.min(8, T));
      if (e.t === 'gatling') e.n = Math.max(e.n || 6, T * 2);
    }
  }
  return fx;
}

/** 글 하나로 설계서 원본(검증 전)을 조립한다 */
function composeRaw(ability, sides, noDraw) {
  const text = String(ability || '').trim();
  const R = mulberry(hashText(text) || 7);
  const pk = (a) => a[Math.floor(R() * a.length)];
  // 1) 소재 찾기 (글에 나온 순서대로)
  const found = [];
  for (const [re, key, ov] of LEX) {
    const m = text.match(re);
    if (m) found.push({ at: m.index, word: m[0], key, ov: ov || {} });
  }
  const famHits = wfFind(text);
  for (let i = found.length - 1; i >= 0; i--) { const f = found[i]; if (famHits.some((h) => f.at < h.at + h.word.length && h.at < f.at + f.word.length)) found.splice(i, 1); }
  found.push(...famHits);
  found.sort((a, b) => a.at - b.at);
  const themes = [];
  for (const f of found) { const j = themes.findIndex((t) => t.key === f.key && t.word === f.word); if (j < 0) themes.push(f); else if (f.fam && !themes[j].fam) themes[j] = f; }
  if (!themes.length) themes.push({ word: '', key: 'ki', ov: {} });
  // 단어 사전에 있는 소재가 있으면 그게 주인공 (첫 번째로)
  const fi = themes.findIndex((t) => t.fam);
  if (fi > 0) themes.unshift(themes.splice(fi, 1)[0]);
  const F1 = themes[0].fam ? WF[themes[0].fam] : null;
  // 원소(불·얼음·전기…)가 따로 있으면 단어 사전 기술에 그 색과 효과를 입힌다 ("불을 쓰는 고양이")
  const elemF = themes.find((t) => !t.fam && ELEM.has(t.key));
  const T = (f) => Object.assign({}, THEME[f.key], f.ov);
  // 2) 이름에 쓸 말: 글에 나온 명사를 그대로
  const nouns = nounsOf(text);
  const nm = (f, i) => {
    let w = (f.word && nouns.find((x) => x.includes(f.word))) || f.word || nouns[i] || nouns[0] || '기';
    if (f.fam && /(떼|들|군단|무리|떼거리)$/.test(w) && w.replace(/(떼|들|군단|무리|떼거리)$/, '')) w = w.replace(/(떼|들|군단|무리|떼거리)$/, '');
    return cut(w, 5);
  };
  const realNoun = (f) => f.word && nouns.some((w) => w === f.word || w.startsWith(f.word));
  // 단어 사전 주인공이 있으면: 다른 사전 단어나 진짜 명사만 기술 칸을 나눠 갖고, 원소는 색·효과로만 섞인다
  const t1 = themes[0];
  const sec = F1 ? themes.filter((t, i) => i > 0 && (t.fam || (!ELEM.has(t.key) && realNoun(t)))) : themes.slice(1);
  const t2 = sec[0] || t1, t3 = sec[1] || t2;
  // 부작용이 원소를 금지하면("불을 못 쓴다") 원소를 섞지 않는다 — 그냥 고양이가 된다
  const NEGW = /못\s?[가-힣]|안\s?(나|된|돼|써|쓰)|봉인|금지|쓸 수 없|사라|잃|없어/;
  const elemBan = elemF && (sides || []).some((x) => NEGW.test(String(x.text || '')) && themesInText(String(x.text || '')).some((h) => !h.fam && h.key === elemF.key));
  const elemUse = elemBan ? null : elemF;
  const n1 = nm(t1, 0), n2 = t2 !== t1 && realNoun(t2) ? nm(t2, 1) : n1, n3 = t3 !== t1 && realNoun(t3) ? nm(t3, 2) : n2;
  // 3) 행동 찾기
  const mechs = [];
  for (const [re, k] of MECH) { const m = text.match(re); if (m) mechs.push({ at: m.index, k }); }
  mechs.sort((a, b) => a.at - b.at);
  const said = mechs.map((m) => m.k);
  let st = null;
  for (const [re, k] of STATUS_WORDS) if (re.test(text)) { st = k; break; }
  const CNT = '(개|마리|발|명|번|방|줄|대|송이|알|장|갈래|겹|방향|연발|연타|연속)';
  const nm1 = text.match(new RegExp('(\\d+)\\s*' + CNT)), km = text.match(new RegExp('(한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱|여덟|아홉|열|스무|백|천|만)\\s*' + CNT));
  const cnt = nm1 ? +nm1[1] : km ? KNUM[km[1]] : 0, cword = nm1 ? nm1[2] : km ? km[2] : '';
  const isTimes = /번|연타|연속|연발/.test(cword);
  const o = {
    pow: 0.65 * (/엄청|거대|최강|무한|최고|강력|세게|완전|미친|전설|궁극|세상에서 가장/.test(text) ? 1.25 : /약한|작은|쓸모없|조금|살짝|별로|하찮|소심/.test(text) ? 0.7 : 1),
    n: cnt && !isTimes ? clamp(cnt, 1, 8) : /여러|많은|떼|군단|무리|잔뜩|수많/.test(text) ? 4 : 1,
    times: cnt && isTimes ? clamp(cnt, 2, 10) : /연타|난타|마구 때|다다다|연발|무한 연속/.test(text) ? 4 : 0,
    big: /거대|초거대|집채|산만 한|산만한|빌딩만|하늘을 덮|대왕|자이언트|메가|기가|초대형|엄청 큰|엄청나게 큰|커다란|커지/.test(text),
    small: /작은|미니|꼬마|쪼꼬미|조그만|손톱만|콩알만|작아지/.test(text),
    far: /멀리|원거리|장거리|저격|맵 끝|끝까지 날|하늘 끝|멀리서|화면 끝/.test(text),
    near: /가까이|근거리|코앞|근접|붙어서|맨손|몸으로/.test(text),
    fast: /빠른|빠르게|빨리|광속|순식간|초고속|재빨|번개처럼|눈 깜짝|쏜살/.test(text),
    slowm: /느린|느리게|느릿|천천히|슬로우|굼뜬/.test(text),
    wide: /사방|모든 방향|360|빙 둘러|전체 공격|온 사방|원형으로|둥글게|맵 전체|주변 전부|주변 모두/.test(text),
    long: /오래|영원히|끝없|지속|오랫동안|한참/.test(text),
    line: /일직선|직선|한 줄로|일렬/.test(text),
    homing: /따라가|추적|유도|쫓아가/.test(text), bounce: /튕기|튕겨|통통/.test(text), pierce: /관통|꿰뚫|뚫고/.test(text),
    ret: /부메랑|돌아온|되돌아/.test(text), split: /분열|쪼개|갈라|나뉘/.test(text), wall: /벽|성벽|담장/.test(text),
  };
  // 4) 글의 의도 → 전투 유형 (가장 잘 맞는 유형이 중심, 두 번째 유형이 능력 3을 맡는다)
  const keys = themes.map((f) => f.key).filter((k, i, a) => a.indexOf(k) === i);
  const ranks = rankStyles(text, keys, said, F1 && F1.style);
  const sA = ranks[0][0], sB = ranks[1] && ranks[1][1] >= 3 ? ranks[1][0] : sA, sC = ranks[2] && ranks[2][1] >= 5 ? ranks[2][0] : sA;
  const SA = STYLES[sA];
  const kitOf = { basic: SA, s1: sC !== sA && sC !== sB ? STYLES[sC] : SA, s2: STYLES[sB], ult: SA };
  const plan = { basic: [t1, n1], s1: [t2, n2], s2: [t3 === t1 ? t2 : t3, n3 === n1 ? n2 : n3], ult: [t1, n1] };
  // 5) 기술 만들기
  const moves = {};
  const quote = (text.match(/["'“‘「]([^"'”’」]{1,10})["'”’」]/) || [])[1];
  const short = (pool, n, max) => { for (let i = 0; i < 6; i++) { const v = fmtN(pk(pool), n); if (Array.from(v).length <= max) return v; } return cut(`${n}!`, max); };
  const styOf = { basic: sA, s1: sC !== sA && sC !== sB ? sC : sA, s2: sB, ult: sA };
  for (const s of SLOTS) {
    const [th, n] = plan[s], fam = th.fam ? WF[th.fam] : null, fk = fam && fam.moves[s];
    // 추가 공격 100종: 유형에 맞으면 가끔 그쪽으로 (사전 단어 기술이 있으면 덜)
    const xs = xtFor(styOf[s], s), xr = R();
    const XK = xs.length && xr < (fk ? (s === 's1' || s === 's2' ? 0.22 : 0) : s === 'basic' ? 0.25 : 0.4) ? xtKit(pk(xs), s) : null;
    const K0 = XK || fk || kitOf[s][s], K = Array.isArray(K0) ? pk(K0) : K0;
    const mix = fam && elemUse && !ELEM.has(fam.th) ? T(elemUse) : null;
    const tt = mix ? Object.assign({}, T(th), { vfx: mix.vfx, shape: mix.shape, c: mix.c, sfx: mix.sfx, st: mix.st }) : T(th);
    const S = st || (mix && mix.st) || (fam && fam.st) || tt.st;
    let fx = tuneFx(K.fx(o.pow, S, o).filter(Boolean), o, s);
    for (const e of fx) if (e.t === 'shot') {
      if (o.homing) e.homing = Math.max(e.homing || 0, 0.5);
      if (o.bounce) e.bounce = Math.max(e.bounce || 0, 2);
      if (o.pierce) e.pierce = true;
      if (o.ret) e.ret = true;
      if (o.split && s !== 'basic') e.split = Math.max(e.split || 0, 3);
      if (o.n > 1 && s !== 'basic' && e.from !== 'sky') e.n = clamp(Math.max(e.n || 1, o.n), 1, 8);
    }
    let name = fmtN(pk(K.name), n);
    for (let k = 0; k < 6 && name.split(n).length > 2; k++) name = fmtN(pk(K.name), n);
    if (name.split(n).length > 2) name = name.replace(n + ' ', '');
    if (o.big && !/거대/.test(name) && s !== 'basic' && Array.from(name).length <= 9) name = (s === 'ult' ? '초거대 ' : '거대 ') + name;
    else if (o.times > 1 && s === 's1' && Array.from(name).length <= 8) name = `${name} ${o.times}연타`;
    else if (s === 'ult' && Array.from(name).length <= 8 && R() < 0.7) name = `${pk(FUN.ultPre)} ${name}`;
    const pic = pixFor(n) || pixFor(th.word) || (s !== 'basic' ? null : pixFor(text));
    moves[s] = {
      name: cut(name, 12), desc: cut(fmtN(pk(K.desc), n).split(n + ' ' + n).join(n), 44),
      say: s === 'basic' ? '' : s === 'ult' ? (quote || short(FUN.ultSay, n, 10)) : short(FUN.say, n, 10),
      cd: { basic: 0.55, s1: 1.9, s2: 2.7, ult: 7.5 }[s] * (K.m === 'heal' || K.m === 'big' || K.m === 'turret' ? 1.25 : 1) * (o.fast ? 0.85 : o.slowm ? 1.12 : 1),
      color: pic ? pic.color : s === 'ult' || s === 's2' ? tt.c[1] : tt.c[0], vfx: tt.vfx, shape: tt.shape, pix: pic ? pic.pix : undefined,
      sfx: { kind: tt.sfx, pitch: { basic: 1.25, s1: 1, s2: 1.1, ult: 0.75 }[s], len: { basic: 0.7, s1: 1, s2: 0.9, ult: 1.5 }[s] },
      fx, _k: fam ? 'f:' + th.fam : th.key, _m: K.m, _w: th.word, _f: th.fam || undefined,
    };
  }
  // 6) 겉모습·능력치·특성: 유형과 글에서
  const L = T(t1);
  const look = { skin: pk(['#f2c79b', '#e8b48a', '#c98a5e', '#f6d8b8', '#8a5a3a']), hair: L.hair, body: L.body, accent: L.c[0], head: L.head, outfit: 'plain', weapon: SA.weapon || 'none', aura: L.aura };
  if (F1 && F1.look) Object.assign(look, F1.look);
  if (elemUse && F1 && !ELEM.has(F1.th)) { const E = T(elemUse); look.aura = E.aura; look.accent = E.c[0]; }
  const W = [[/칼|검(?!은)/, 'sword'], [/지팡이|마법|마술/, 'staff'], [/요술봉|마녀/, 'wand'], [/총|대포/, 'gun'], [/활|화살/, 'bow'], [/망치|해머|프라이팬/, 'hammer'], [/낫|저승/, 'scythe'], [/책|공부|숙제|사전/, 'book'], [/수정구|구슬/, 'orb'], [/방패/, 'shield'], [/단검|암살|닌자/, 'dagger'], [/도끼/, 'axe'], [/창(?!문)/, 'spear']];
  for (const [re, w] of W) if (re.test(text)) { look.weapon = w; break; }
  const HD = [[/왕|여왕|부자|황제/, 'crown'], [/천사/, 'halo'], [/악마/, 'horns'], [/고양이|토끼|여우|강아지|햄스터/, 'ears'], [/로봇|기계|ai|AI/, 'robot'], [/닌자|도둑|복면|암살/, 'mask'], [/기사|군인|전사/, 'helmet'], [/마법사|마녀|마술/, 'hat'], [/대머리/, 'bald']];
  for (const [re, hd] of HD) if (re.test(text)) { look.head = hd; break; }
  const OF = { tank: 'armor', healer: 'robe', trickster: 'robe', nagger: 'suit', idol: 'dress', speedster: 'stripes', engineer: 'stripes', polluter: 'spots', gunner: 'suit' };
  if (!(F1 && F1.look && F1.look.outfit)) look.outfit = OF[sA] || 'plain';
  if (/마법|마녀|요술|주문/.test(text)) look.outfit = 'robe'; else if (/기사|갑옷|전사|군인/.test(text)) look.outfit = 'armor'; else if (/회사|출근|야근|사장|보고서/.test(text)) look.outfit = 'suit'; else if (/공주|드레스|여왕/.test(text)) look.outfit = 'dress'; else if (/죄수|줄무늬|얼룩말/.test(text)) look.outfit = 'stripes'; else if (/점박|무당벌레|달마시안/.test(text)) look.outfit = 'spots';
  const base = Object.assign({ hp: 100, speed: 1, size: 1 }, SA.stats);
  if (F1 && F1.stats) { base.hp += F1.stats.hp || 0; base.speed *= F1.stats.speed || 1; if (F1.stats.size) base.size = F1.stats.size; }
  const stats = {
    hp: base.hp + (/단단|튼튼|거대|철벽|탱크|뚱뚱/.test(text) ? 15 : 0) - (/약한|작은|하찮/.test(text) ? 15 : 0),
    speed: base.speed * (/빠르|빨라|스피드|번개처럼|날쌘/.test(text) ? 1.12 : /느리|느린|거북|굼뜬/.test(text) ? 0.88 : 1),
    size: /거대|거인|큰 몸/.test(text) ? 1.25 : /작은 몸|꼬마|작아/.test(text) ? 0.85 : base.size,
  };
  const PS = [[/회복|재생|치유|불사/, 'regen'], [/가시|선인장|고슴도치/, 'thorns'], [/흡혈|뱀파이어|빨아/, 'lifesteal'], [/단단|강철|철벽|갑옷/, 'armor'], [/분노|화가|빡/, 'rage'], [/부활|좀비|불사조/, 'revive'], [/빠르|날쌘|바람/, 'swift'], [/운|럭키|행운|도박/, 'crit'], [/피하|회피|닌자|미끌/, 'dodge']];
  let pkey = (F1 && F1.passive) || SA.passive;
  for (const [re, k] of PS) if (re.test(text)) { pkey = k; break; }
  const passive = pkey ? { k: pkey, desc: cut(`${n1} ${PASSIVE_KO[pkey]}`, 30) } : null;
  const title = F1 && F1.title && R() < 0.75 ? cut(pk(F1.title.split('|')), 14) : cut(`${pk(FUN.titlePre)}${n1} ${pk(SA.title)}`, 14);
  const lines = { intro: short(FUN.intro, n1, 14), ko: short(FUN.ko, n1, 14), win: short(FUN.win, n1, 22) };
  const style = sA;
  const raw = { title, concept: cut(text, 50) || '정체불명의 능력', look, stats, moves, passive, lines, style };
  if (!noDraw) raw.drawbacks = (sides || []).map((s) => smartDrawback(s.text, { text, moves, n1, themes, aura: look.aura }));
  return raw;
}

function themesInText(t) {
  const out = [];
  for (const [re, key] of LEX) { const m = String(t || '').match(re); if (m) out.push({ key, word: m[0], at: m.index }); }
  for (const h of wfFind(t)) if (!out.some((o) => o.at < h.at + h.word.length && h.at < o.at + o.word.length)) out.push(h);
  return out.sort((a, b) => a.at - b.at);
}
/* ----- 부작용 읽기: 맞는 말을 전부 찾아 겹친다 (최대 3개) ----- */
function smartDrawback(side, ctx) {
  const t = String(side || '');
  const has = (re) => re.test(t);
  const q = t.match(/["'“‘「]([^"'”’」]{1,16})["'”’」]/);
  const say = q ? q[1] : '';
  const out = [];
  let customHow = '', newAura = null;
  const add = (fx) => { if (fx && out.length < 3 && !out.some((x) => x.t === fx.t && (x.t !== 'lock' || x.on === fx.on))) out.push(fx); };
  const SL = [[/궁극기|궁|필살기/, 'ult'], [/능력\s?1|첫\s?번째|기본/, 'basic'], [/능력\s?2|두\s?번째/, 's1'], [/능력\s?3|세\s?번째/, 's2']];
  // "~을 못 쓴다": 글자 그대로. 그 소재·행동이 들어간 기술은 정말로 그 소재가 안 나오는 기술로 바뀐다
  const NEG = /못\s?[가-힣]|안\s?(나(온|와|옴)|된|돼|써|쓰|생|통|먹)|사용\s?(불가|금지)|봉인|쓸 수 없|금지|할 수 없|사라(진|져|짐)|잃(는|어|었|음)|없어(진|져|짐)|빼앗|뺏|막힌|막혀/;
  const [dCond] = dSplit(t), DW = dWhen(t, dCond);
  const condOnly = !!(DW.if || DW.hit || DW.ev || DW.every || DW.gate || DW.bump || DW.byAct || DW.time || DW.hpr);
  if (ctx && has(NEG) && !condOnly && !has(/(?<![가-힣])말을 못|못 움직|못 멈|못 보|잠을 못|못 자|못 걷|못 뛰|못 피|멀리 못|멀리\s?(못|안)|못 맞|못 이기|못 참/)) {
    const slot = SL.find(([re]) => re.test(t));
    // 부작용 글에 나온 소재(사전으로 같은 주제까지) + 행동
    const keys = new Set(), words = [];
    for (const f of ctx.themes) if (f.word && t.includes(f.word)) { keys.add(f.fam ? 'f:' + f.fam : f.key); words.push(f.word); }
    for (const [re, key] of LEX) { const m = t.match(re); if (m && ctx.themes.some((f) => !f.fam && f.key === key)) { keys.add(key); words.push(m[0]); } }
    for (const h of wfFind(t)) if (ctx.themes.some((f) => f.fam === h.fam)) { keys.add('f:' + h.fam); words.push(h.word); }
    const mechHit = MECH.filter(([re]) => re.test(t.replace(/못\s?쓴|안\s?쓴/g, ''))).map(([, k]) => k);
    let slots = [];
    if (slot) slots = [slot[1]];
    else {
      slots = SLOTS.filter((s) => keys.has(ctx.moves[s]._k) || words.some((w) => w && ctx.moves[s].name.includes(cut(w, 5))));
      if (!slots.length) slots = SLOTS.filter((s) => mechHit.includes(ctx.moves[s]._m));
      if (has(/능력|기술|스킬|모든|전부|아무것도|다 못|하나도|모두/) && !slot) slots = SLOTS.slice();
      // 능력 글의 핵심 단어를 짚었는데 주제가 하나뿐이면 전부 해당
      if (!slots.length && keys.size && new Set(ctx.themes.map((f) => (f.fam ? 'f:' + f.fam : f.key))).size === 1) slots = SLOTS.slice();
    }
    if (slots.length) {
      // "불 대신 물이 나온다", "불이 물로 바뀐다": 바뀐 소재로 다시 만든다
      const subM = t.match(/(?:대신|아니라|말고)\s*([가-힣]{1,6}?)(?:이|가|을|를|만|만이)?\s*(?:나온|나와|나감|쏟|뿜|발사|튀어|써|쓴|된)/) || t.match(/([가-힣]{1,6}?)(?:으로|로)\s*(?:바뀐|바뀜|변한|변함|대체)/);
      const sub = subM && subM[1] && !STOP.has(subM[1]) ? subM[1] : '';
      let rep;
      if (sub) {
        const old = words[0] || (ctx.themes[0] && ctx.themes[0].word) || '';
        const altRaw = composeRaw(old ? ctx.text.split(old).join(sub) : `${sub} ${ctx.text}`, [], true), alt = altRaw.moves;
        if (slots.length === 4) newAura = altRaw.look;
        rep = {}; for (const s of slots) rep[s] = alt[s];
      } else {
        const lame = lameMoves(words[0] || ctx.n1); rep = {}; for (const s of slots) rep[s] = lame[s];
      }
      if (slot && !sub) add({ t: 'lock', on: slot[1] });
      else add({ t: 'replace', moves: rep });
      if (newAura) add({ t: 'look', aura: newAura.aura, body: newAura.body, hair: newAura.hair });
      const what = cut(words[0] || '능력', 6);
      customHow = sub ? `${what} 대신 ${sub}: ${slots.map((s) => SLOT_KO[s]).join('·')}이(가) ${sub} 기술로 바뀜`
        : slot ? `${SLOT_KO[slot[1]]} 아예 못 씀`
        : slots.length === 4 ? `${josa(what, '을', '를')} 진짜 못 씀 — 네 기술 모두 버둥대기로`
        : `${what} 기술(${slots.map((s) => SLOT_KO[s]).join('·')})은 진짜 못 씀`;
      // 능력 전부가 사라지면 몸에 두르던 기운(불꽃 오라 등)도 꺼진다
      if (slots.length === 4 && ctx.aura && ctx.aura !== 'none' && !sub) add({ t: 'look', aura: 'none' });
    }
  }
  if (ctx && !out.length) {
    const sw = t.match(/([가-힣]{1,6}?)(?:이|가|을|를|은|는)?\s*대신(?:에)?\s*([가-힣]{1,6}?)(?:이|가|을|를|만)?\s*(?:나온|나와|나감|쏟|뿜|발사|튀어|써|쓴|된|생|만들|$)/)
      || t.match(/([가-힣]{1,6}?)(?:이|가|은|는|을|를)\s*([가-힣]{1,6}?)(?:으로|로)\s*(?:바뀐|바뀜|바뀌|변한|변함|변해|대체|둔갑)/);
    if (sw && !STOP.has(sw[2])) {
      const from = sw[1], to = sw[2], ft = themesInText(from)[0];
      let slots = SLOTS.filter((s) => (ft && (ctx.moves[s]._k === ft.key || (ft.fam && ctx.moves[s]._k === 'f:' + ft.fam))) || (ctx.moves[s]._w && (from.includes(ctx.moves[s]._w) || ctx.moves[s]._w.includes(from))));
      if (!slots.length) slots = SLOTS.slice();
      const altRaw = composeRaw(ctx.text.includes(from) ? ctx.text.split(from).join(to) : `${to} ${ctx.text}`, [], true), alt = altRaw.moves;
      add({ t: 'replace', moves: Object.fromEntries(slots.map((s) => [s, alt[s]])) });
      if (slots.length === 4) add({ t: 'look', aura: altRaw.look.aura, body: altRaw.look.body, hair: altRaw.look.hair });
      customHow = `${from} 대신 ${to}: ${slots.length === 4 ? '네 기술 모두' : slots.map((s) => SLOT_KO[s]).join('·')} ${to} 기술로 바뀜`;
    }
  }
  const dOn = (SL.find(([re]) => re.test(t)) || [])[1] || 'skills';
  if (has(/외친|외쳐|소리친|말한|말해야|소리 질|라고 한|이라고 한|하고 외/) && say) add({ t: 'shout', on: dOn, text: say, nth: DW.skill ? DW.nth : undefined });
  if (has(/(적|상대|남).*(회복|치료|체력이 찬|낫|힐|피가 찬)/)) add({ t: 'healfoe', on: dOn, chance: DW.rare ? 40 : 100 });
  if (has(/(적|상대|남).*(강해|빨라|커|좋아|세져|신나)/)) add({ t: 'aidfoe', on: dOn, k: has(/커/) ? 'giant' : has(/빨/) ? 'haste' : 'power', d: 3 });
  if (has(/(반대|뒤|거꾸로)\s?(방향)?.*(나간|날아|쏜|발사|나와|나감)|엉뚱한 방향|뒤로 나/)) add({ t: 'reverse', on: dOn, chance: DW.rare ? 40 : 100 });
  if (has(/랜덤|무작위|아무거나 나|엉뚱한 (기술|능력)|다른 기술|다른 능력이 나/)) add({ t: 'random', on: dOn, chance: DW.rare ? 40 : 60 });
  if (has(/앞이 (잘\s?)?안|눈이 안|시야|어두|장님|눈을 감|안 보(여|인|임)|앞을 못 봐|앞을 못 본/)) add({ t: 'vision', mode: 'dark' });
  else if (has(/화면이 뒤집|세상이 뒤집|거꾸로 보|뒤집혀 보/)) add({ t: 'vision', mode: 'flip' });
  else if (has(/좌우가 바뀌어 보|거울처럼/)) add({ t: 'vision', mode: 'mirror' });
  else if (has(/멀미|흔들려 보|화면이 흔들|술에 취/)) add({ t: 'vision', mode: 'shake' });
  // 글에 나온 말 그대로: [언제] + [무엇]
  literalDrawback(t, ctx, add, say, out);
  const PEST = t.match(/(벌|모기|파리|비둘기|강아지|고양이|닭|오리|거위|엄마|아빠|선생님|경찰|좀비|귀신|바퀴벌레|까마귀|팬|기자|빚쟁이|할머니|선배|형|누나|동생|개)(?:가|이|들이|떼가|한테|에게)/);
  const chaser = t.match(/([가-힣]{1,6}?)(?:이|가|들이|들)?\s*(?:계속\s*|자꾸\s*|하루 종일\s*)?(?:쫓아|따라다|따라온|따라와|달려들|달려든|나타나|찾아와|찾아온)/);
  if ((PEST && has(/쫓아|따라|달려들|나타|찾아|혼난|혼나|잔소리|괴롭|물어|쏘|공격|때린|(?<![가-힣])온다|와서|와요|등장/)) || chaser) {
    const nm = chaser && !STOP.has(chaser[1]) ? chaser[1] : PEST ? PEST[1] : '무언가', pic = pixFor(nm);
    add({ t: 'pest', every: DW.every || (DW.often ? 5 : 7), on: DW.skill ? dOn : undefined, dmg: has(/혼난|혼나|잔소리/) ? 1 : 3, name: nm, color: pic ? pic.color : '#ffe14a', pix: pic ? pic.pix : undefined, st: has(/혼난|혼나|잔소리/) ? { k: 'stun', d: 0.6 } : undefined });
  }
  if (has(/대머리|머리가 (빠|다 빠|없)/)) add({ t: 'look', head: 'bald' });
  if (has(/분홍|핑크/)) add({ t: 'look', body: '#ff9ad0', hair: '#ff7ab0' });
  if (has(/초록|녹색/)) add({ t: 'look', body: '#4fbf5f', skin: '#a8e08a' });
  const plain = !DW.skill && !DW.hit && !DW.ev && !DW.if && !DW.every && !DW.gate && !DW.byAct;
  if (has(/반대로 (움직|걸)|방향이 반대|조작이 반대|좌우가 바뀌|방향키가 반대|거꾸로 (걷|움직)/)) add({ t: 'move', mode: 'reverse' });
  else if (plain && has(/미끄|빙판/)) add({ t: 'move', mode: 'slide' });
  else if (plain && has(/비틀|취한|술에|갈지자/)) add({ t: 'move', mode: 'drunk' });
  else if (has(/멈출 수 없|계속 (달|뛰|걸)|못 멈|멈추지 못/)) add({ t: 'move', mode: 'nostop' });
  else if (has(/뒷걸음|문워크|뒤로 걷|뒤로만/)) add({ t: 'move', mode: 'backward' });
  else if (plain && has(/깡총|토끼처럼|뛰어다/)) add({ t: 'move', mode: 'hop' });
  else if (plain && has(/빙글빙글|뱅글뱅글|돌면서 걷/)) add({ t: 'move', mode: 'spin' });
  if (has(/순간이동|텔레포트|엉뚱한 곳|아무 데로|어딘가로/) && DW.ev !== 'dash') add({ t: 'tele', on: dOn, nth: DW.skill ? DW.nth : undefined });
  if (has(/(조건|상황)이? ?(되면|오면)/) && DW.gate && !out.length) add({ t: 'act', every: 11, text: cut(DW.gate + '면…!', 14), pose: 'sweat', d: 1 });
  // 그래도 아무것도 못 읽었으면: 일반적인 마이너스 효과 대신, 쓴 글 그대로 캐릭터가 한다
  if (!out.length) {
    const [, effTxt] = dSplit(t), pm = PIXBOOK.find(([re]) => re.test(t)), word = pm ? (t.match(pm[0]) || [''])[0] : '';
    const A = { t: 'act', text: cut((say || effTxt || t).replace(/[.!~]+$/, ''), 14), pose: word ? 'word' : 'sweat', word, d: 1 };
    if (DW.skill) Object.assign(A, { on: dOn, nth: DW.nth }); else if (DW.ev) Object.assign(A, { ev: DW.ev, nth: DW.nth }); else if (DW.hit) Object.assign(A, { hit: true, nth: DW.nth }); else if (DW.if) Object.assign(A, { if: DW.if, n: DW.n }); else if (DW.bump) A.bump = true; else A.every = DW.every || (DW.often ? 6 : 9);
    add(A);
  }
  if (has(/가끔|때때로|종종|어쩌다|확률|랜덤하게|간혹/) && !/\d+\s*(%|퍼센트|프로)|번\s*(중|에)/.test(t)) for (const x of out) if (x.chance != null && x.t !== 'aim') x.chance = 40;
  if (ctx && ctx.moves) {
    const COND = [[/숨으면|숨을 때|은신하면/, ['invis']], [/던지면|던질 때|쏘면|쏠 때|발사하면/, ['shot', 'lob', 'hook', 'rain']], [/휘두르면|벨 때|베면|때리면|칠 때/, ['swing', 'dash']], [/날면|날 때|날아오르면/, ['fly']], [/먹으면|먹을 때|마시면/, ['heal', 'big']], [/부르면|소환하면|부를 때/, ['summon', 'orbit', 'turret']], [/터뜨리면|터질 때|폭발하면/, ['boom', 'lob', 'wave']], [/돌진하면|달려들면|박치기하면/, ['dash']], [/순간이동하면|사라지면/, ['blink', 'invis']], [/뿜으면|광선을 쏘면|뿌리면|노래하면|소리 지르면/, ['beam', 'cone', 'chain']], [/구르면|내려찍으면|발을 구르면/, ['wave']], [/막으면|버티면|반격하면/, ['counter', 'shield', 'reflect']]];
    const c = COND.find(([re]) => re.test(t));
    const slot = c && SLOTS.find((s) => c[1].includes(ctx.moves[s]._m));
    if (slot) for (const x of out) if (x.on === 'skills') x.on = slot;
  }
  const clean = out.map((x) => [x, sanDfx(x)]).filter(([, c]) => c);
  const fx = clean.length ? clean[0][1] : sanDfx({ t: 'act', every: 9, text: cut(t, 14) || '앗!', pose: 'sweat', d: 1 });
  const f = fx, more = clean.slice(1).map(([, c]) => c), rawMore = clean.slice(1).map(([x]) => x);
  return { how: (customHow ? [customHow].concat(more.filter((x) => !['look', 'replace', 'lock'].includes(x.t)).map(dfxText)) : [f].concat(more).filter((x) => x.t !== 'look' || clean.length === 1).map(dfxText)).join(' + ').slice(0, 70), say: say || pick(['아 왜!!', '이게 뭐야', '망했다', '살려 줘', '말도 안 돼']), fx: clean.length ? clean[0][0] : f, more: rawMore };
}
/** 능력을 못 쓰게 됐을 때 대신 나오는 버둥대는 기술 (능력 이름을 살려서) */
function lameMoves(n) {
  n = cut(n || '능력', 4);
  const M = JSON.parse(JSON.stringify(PATHETIC));
  const R = mulberry(hashText(n) || 3), pk = (a) => a[Math.floor(R() * a.length)];
  M.basic.name = cut(pk([`${n} 흉내`, `에어 ${n}`, `${n} 시늉`]), 12); M.basic.desc = `${josa(n, '은', '는')} 안 나오고 입으로 소리만 낸다`; M.basic.say = cut(pk([`${n}…?`, '어 안 나와', '딸깍딸깍']), 10);
  M.s1.name = cut(pk([`${n} 그리워하기`, `${n} 찾아 울기`]), 12); M.s1.desc = `${josa(n, '이', '가')} 그리워 눈물을 흩뿌린다`;
  M.s2.name = cut(pk([`${n} 없이 도망`, '줄행랑']), 12);
  M.ult.name = cut(pk([`${n} 없이 떼쓰기`, `${n} 돌려줘!`, `${n} 장례식`]), 12); M.ult.say = cut(`${n} 돌려줘!!`, 10);
  return M;
}

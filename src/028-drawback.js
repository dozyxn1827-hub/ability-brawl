/* ===== 부작용 글자 그대로 읽기: [언제] + [무엇을] =====
   "능력을 쓰면 3초 동안 못 움직인다" → 언제: 능력을 쓸 때 / 무엇: 3초 동안 멈춤
   "물에 약하다" → 물 공격에 맞으면 피해 2배 / "똥을 싼다" → 몇 초마다 정말로 멈춰서 똥을 싼다
   알 수 없는 글도 일반적인 마이너스 효과로 바꾸지 않고, 그 글 그대로 캐릭터가 하게 만든다. */
const DKN = { 한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 스무: 20 };
const DNR = '(\\d+(?:\\.\\d+)?|한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱|여덟|아홉|열|스무)';
const dnum = (s) => (s == null ? NaN : /^\d/.test(s) ? parseFloat(s) : DKN[s] || NaN);

/* 행동: [글, 연출, 말풍선, 멈추는 시간, 따로 언제를 안 쓰면 언제 하는지(skills: 능력 쓸 때, 숫자: 그 초마다)] */
const D_ACT = [
  [/재채기|에취|엣취/, 'sneeze', ['에-에-에취!!', '에취!!'], 0.6, 8],
  [/딸꾹/, 'hiccup', ['딸꾹!', '히끅!'], 0.4, 6],
  [/방귀|뿡|뿌웅|뽀옹|가스를/, 'gas', ['뿌웅~', '뿡!', '뿌지직', '부우웅~'], 0.6, 8],
  [/트림|꺼억/, 'gas', ['꺼억~', '끄어억'], 0.5, 8],
  [/똥|응가|설사|화장실|볼일/, 'poop', ['뿌지직!', '으으… 급해!', '화장실!!'], 1.4, 10],
  [/(?<![가-힣])(운다|울어|울음|우는|울고|울보|울면서)|눈물|엉엉|훌쩍|징징/, 'cry', ['으앙~', '엉엉엉', '훌쩍…'], 1.2, 9],
  [/웃는다|웃어|웃음|웃고|빵 터|ㅋㅋ|깔깔|낄낄/, 'laugh', ['ㅋㅋㅋㅋ', '푸하하하', '깔깔깔'], 1, 9],
  [/노래|랄라|흥얼|열창|떼창/, 'sing', ['♪ 랄라라~', '♬ 도레미~', '♪ 라라랄라'], 0.6, 'skills'],
  [/소리를 지|소리 질|비명|꽥|소리친|고함|괴성/, 'shout', ['으아아악!!', '꺄아아악!', '우와아아!'], 0.4, 'skills'],
  [/하품/, 'yawn', ['하아아암~'], 0.8, 9],
  [/코를 파|코딱지|후비/, 'sweat', ['후비적…'], 0.8, 9],
  [/돈을 (잃|흘|떨어|쓴|뿌)|돈이 (떨어|빠|새|나간)|지갑|돈을 (낸|내야)/, 'coin', ['내 돈!!', '앗 돈이…', '텅장…'], 0.6, 10],
  [/사랑|하트|고백|반해|뽀뽀|윙크|사랑해/, 'heart', ['사랑해~', '♥ 반했어'], 0.8, 10],
  [/기도|절을|인사를|사과를|사과한/, 'bow', ['꾸벅', '죄송합니다!'], 0.8, 10],
  [/셀카|사진을/, 'snap', ['찰칵!', '셀카 타임~'], 0.8, 10],
  [/먹는다|먹어야|먹어|간식을|밥을 먹|군것질/, 'eat', ['냠냠', '쩝쩝', '한 입만…'], 1, 10],
  [/춤을? ?(춘|추|춰)|춤/, 'star', ['둠칫둠칫', '덩실덩실'], 0, 8],
];
/* 상태: [글, 상태이상, 기본 시간, 말풍선, 연출] */
const D_ST = [
  [/잠들|잠든|잠이 들|잠이 든|잠을 자|잔다|졸(?!업)|졸려|코를 골|쿨쿨|꾸벅|자 버/, 'sleep', 2, ['쿨쿨…', 'Zzz…'], 'zzz'],
  [/넘어지|넘어진|넘어져|자빠|꽈당|미끄러져 넘/, 'stun', 1, ['꽈당!', '으악!'], 'fall'],
  [/기절|쓰러|어지러|어질|멍때|멍해|정신을 잃/, 'stun', 1.2, ['어질어질…', '@_@'], 'star'],
  [/얼어|(?<![가-힣])언다|얼음이 된|굳어|굳는|굳은|돌이 되|석화|꽁꽁/, 'freeze', 1.2, ['꽁꽁…', '굳었다!'], 'sweat'],
  [/감전|찌릿|전기가 (통|오)/, 'stun', 1, ['찌리릿!'], 'star'],
  [/춤/, 'dance', 1.5, ['둠칫둠칫', '몸이 멋대로!'], 'star'],
  [/못 움직|움직일 수 없|움직이지 못|못 걷고|멈춘|멈춰|멈춤|제자리|발이 묶|꼼짝/, 'root', 1.5, ['으앗, 발이!', '못 움직여!'], 'sweat'],
  [/헷갈|혼란|방향을 잃|정신이 없|어디로 가/, 'confuse', 2.5, ['여긴 어디?', '헷갈려!'], 'star'],
  [/미끄러/, 'slip', 2, ['미끌!'], 'sweat'],
  [/불타|불붙|불이 붙|(?<![가-힣])탄다|타 버|화상|뜨거워/, 'burn', 3, ['앗 뜨거!'], 'sweat'],
  [/중독|배탈|배가 아프|배 아프|토한|토를|구토|속이 안 좋|독에 걸/, 'poison', 3, ['우웩…', '배야…'], 'gas'],
  [/개구리가 된|개구리로|돼지가 된|돼지로|닭이 된|변신한|[가-힣]+(?:으로|로) 변(?:한|해|함|신)/, 'morph', 2, ['개굴?', '이게 뭐야!'], 'star'],
  [/침묵|조용해/, 'silence', 2, ['…!'], 'sweat'],
  [/몸이 무거|무거워/, 'heavy', 2, ['무거워…'], 'sweat'],
  [/작아/, 'tiny', 3, ['작아진다!'], 'sweat'],
  [/느려|느린|느리|굼떠|느릿/, 'slow', 2, ['헉헉…'], 'sweat'],
  [/약해|힘이 빠|기운이 없|약하|힘이 없/, 'weak', 2, ['힘이 빠져…'], 'sweat'],
];
const D_HARD = new Set(['sleep', 'stun', 'freeze', 'dance', 'root', 'morph']);
/* 원소 단어 → 그 원소 공격(vfx) */
const D_ELEM = [[/물|비(?!행|밀|싸|빔)|파도|바다|강물|홍수|물총/, ['water'], '물'], [/불|화염|불꽃|용암/, ['fire'], '불'], [/얼음|눈(?!물|이|을|빛)|추위|겨울/, ['ice'], '얼음'], [/전기|번개|벼락|감전/, ['electric'], '전기'],
  [/독|가스|냄새/, ['poison'], '독'], [/빛|햇빛|햇살|태양|성스러/, ['holy'], '빛'], [/어둠|그림자/, ['shadow', 'void'], '어둠'], [/바람|태풍/, ['wind'], '바람'], [/돌|흙|땅|바위/, ['earth'], '돌'],
  [/소리|노래|음악|잔소리/, ['sound'], '소리'], [/쇠|칼|총|금속/, ['metal'], '쇠붙이'], [/마법|주문/, ['arcane'], '마법'], [/식물|나무|꽃/, ['nature'], '식물'], [/기계|로봇|전자/, ['tech'], '기계'], [/사탕|단것|과자|초콜릿/, ['candy'], '단것']];

/** 설명에 쓸 짧은 행동 글 ("똥을 싼다" → "똥을 쌈") */
function dWhat(s) { return cut(String(s || '').replace(/[.!~,]+$/, '').replace(/^.*?(초\s*마다|때마다|쓰면|맞으면)\s*/, '').replace(/\s*(하면|면|때마다|때|면서)$/, '').replace(/(을|를)$/, '').trim(), 12); }
/** 문장을 [조건 부분, 결과 부분]으로 자른다 */
function dSplit(t) {
  const re = /(면|때마다|(?<![가-힣])때|수록|마다|면서|는데|더니|자마자)(?=[\s,.!]|$)/g;
  let last = -1, m;
  while ((m = re.exec(t))) last = m.index + m[0].length;
  return last < 0 ? ['', t] : [t.slice(0, last), t.slice(last).trim() || t];
}

/** 언제 일어나는지 */
/* 어떤 일이 생기는 순간 → 사건 (글 그대로) */
const D_EV = [
  [/치명타(가)?\s?(터지면|나면|뜨면|터질\s?때)|크리(티컬)?[이가]?\s?(터지면|나면|뜨면)/, 'crit'],
  [/쓰러뜨리면|쓰러트리면|쓰러뜨릴\s?때|죽이면|죽일\s?때|처치하면|처치할\s?때|해치우면|킬(을)?\s?(하면|따면)|(적|상대|누군가|한\s?명)[을를]?\s?잡으면|이기면|물리치면/, 'kill'],
  [/(누가|누군가|다른\s?(사람|애|플레이어|친구)|친구|동료|아군)[이가]?\s?(죽으면|죽을\s?때|쓰러지면|쓰러질\s?때|탈락하면|떨어지면|KO되면)/i, 'ally'],
  [/(적|상대|남|다른\s?(사람|애|플레이어))[이가]\s?(능력|스킬|기술|공격|궁극기|마법)?[을를]?\s?(쓰면|쓸\s?때|하면|사용하면|부리면|날리면|쏘면)|(적|상대)[이가]\s?공격하면/, 'foeskill'],
  [/맞히면|맞힐\s?때|명중하면|명중할\s?때|명중시키면|맞추면|맞출\s?때|적중하면|적중시키면|(적|상대|남|누군가|사람)(을|를|에게|한테)\s?(때리면|공격하면|때릴\s?때)|(공격|기술|능력|총알|투사체|주먹)[이가]\s?(맞으면|명중하면|들어가면|적중하면)/, 'hitfoe'],
  [/빗나가면|빗나갈\s?때|(못|안)\s?맞히면|(못|안)\s?맞추면|헛치면|허공을\s?(치|가르)면|헛방(이면|치면|나면)/, 'miss'],
  [/회복하면|회복되면|회복할\s?때|힐(을)?\s?(받으면|하면)|(체력|피)[이가]?\s?(차면|오르면|늘면|회복되면)|치료(를)?\s?(받으면|하면)|물약을?\s?먹으면/, 'heal'],
  [/상태\s?이상(에|이)?\s?(걸리면|생기면|걸릴\s?때)|디버프(를|에)?\s?(받으면|걸리면)|(독|화상|저주|기절|빙결|마비)(에|이|을)?\s?(걸리면|당하면|받으면)|얼면|중독되면|감전되면|마비되면|기절하면/, 'debuff'],
  [/버프(를)?\s?받으면|강화되면|강화를\s?받으면|보호막(이)?\s?(생기면|씌워지면)|무적이\s?되면|힘이\s?세지면/, 'buff'],
  [/(돌진|대시|순간\s?이동|텔레포트|점프|도약|구르기|회피)(을|를)?\s?(하면|할\s?때|쓰면|쓸\s?때)|순간\s?이동하면|돌진하면|점프하면|대시하면|구르면/, 'dash'],
];
/* 상태 조건 (조건 부분에서 찾는다): [글, 조건, 숫자 뽑기] */
const D_CASTING = /(능력|스킬|기술|마법|궁극기|공격)[을를]?\s?(쓰는|하는|부리는|시전하는)\s?(동안|중|도중)|시전\s?중/;
const D_IDLE = /(\d+)\s?초\s?(동안|넘게|이상)?\s?(능력|스킬|기술|공격)[을를]?\s?(안|못)\s?(쓰|하)면|(능력|스킬|기술|공격)[을를]?\s?(오래|한동안|한참|계속)\s?(안|못)\s?(쓰|하)면|놀고 있으면|빈둥거리면/;
const D_IF = [
  [D_CASTING, 'casting'],
  [/(적|상대|남|다른 사람)[의이가]?\s?(체력|피|hp)[이가]?\s?(낮|적|얼마\s?안|조금|반|절반|\d+\s?%?\s?이하|바닥)/i, 'foelow', /(\d+)\s*(?:%|퍼센트|프로)/],
  [/(적|상대|남|다른 사람)[의이가]?\s?(체력|피|hp)[이가]?\s?(많|높|가득|꽉)/i, 'foehigh'],
  [/(체력|피|hp)[이가]?\s?(가득|꽉|만땅|풀|100\s?%|최대)|풀피|만피|안 다쳤/i, 'fullhp'],
  [/(체력|피)[이가]?\s?(제일|가장)\s?(많|높)|1등|일등|이기고 있|앞서고 있|유리하면/, 'lead'],
  [/(체력|피)[이가]?\s?(제일|가장)\s?(적|낮)|꼴찌|꼴등|지고 있|뒤처지면|불리하면/, 'behind'],
  [/(구석|가장자리|모서리|맵\s?(끝|밖|가장자리|테두리)|벽\s?(쪽|근처|옆|가까이|앞))(에|으로|에서|에서는)?\s?(있|가|붙|서|몰리|닿)|구석에|가장자리에|벽에 붙으면|벽 근처/, 'edge'],
  [/(가운데|중앙|한가운데|정중앙|한복판)(에|으로|에서)?\s?(있|가|서|들어가)/, 'center'],
  [/둘러싸이면|포위되면|(적|상대|사람)[이가들]*\s?(여럿|많으면|많을\s?때|많이|둘 이상|떼로|몰려|우르르|모이면|모여)|여러 명|(\d+|두|세|네)\s?명\s?(이상)?[이가]?\s?(가까이|근처|있|모이|몰리|붙)/, 'crowd', /(\d+|두|세|네)\s?명/],
  [/혼자\s?(있|남|되|일 때|면)|외로우면|외로울\s?때|아무도 없|주변에\s?(아무도|사람이|적이)\s?없|고독하면/, 'alone'],
  [/상태\s?이상(인|일|에\s?걸린|에\s?걸려)\s?(있|동안|때|상태)|(독|화상|저주)에?\s?걸려\s?있/, 'debuffed'],
  [/(버프|강화|보호막|무적)[가-힣]*\s?(있으면|중이면|받은\s?동안|인\s?동안|상태면|상태일\s?때|켜져)/, 'buffed'],
  [D_IDLE, 'idle', /(\d+)\s?초/],
  [/(능력|스킬|기술)[이가]?\s?(다|전부|모두)\s?(쿨|재사용|대기|못 쓰는)|쿨(타임|다운)?[이가]?\s?(돌|중|도는)|재사용\s?대기\s?중/, 'busy'],
  [/궁극기[가이]?\s?(준비|충전|다 차|차면|찼|모이|모였|쓸 수 있)/, 'ready'],
  [/장판|웅덩이|바닥에\s?(불|독|물|얼음)이?\s?(있|깔)|(불|독|얼음)\s?바닥\s?위/, 'onzone'],
];
/* 시간 조건 (문장 전체에서): 처음 N초·N초 뒤 */
const D_IFT = [
  [/처음\s?\d+\s?초|초반(에|에는|엔|에만)|시작하자마자|게임 (시작|초반)|경기 (시작|초반)|처음에(는|만)/, 'early', /(?:처음|시작하고|시작 후)\s?(\d+)\s?초/],
  [/후반(에|에는|엔|이 되면|부터)|([1-9]\d|[89])\s?초[가이]?\s?(지나면|지나고|넘으면|뒤부터|후부터|지난 뒤|지난 후)|막판(에|에는)|오래 싸우면/, 'late', /(\d+)\s?초[가이]?\s?(?:지나|넘|뒤부터|후부터|지난)/],
];
function dWhen(t, cond) {
  const W = {};
  const has = (re) => re.test(cond || '');
  let m;
  // 어떤 일이 생기는 순간 (적을 맞히면, 쓰러뜨리면, 회복하면…)
  for (const [re, ev] of D_EV) if (has(re)) { W.ev = ev; break; }
  if (W.ev && (m = (cond || '').match(new RegExp(DNR + '\\s*(?:번|명|대|회)(?:\\s*째)?')))) { const n = dnum(m[1]); if (n > 1) W.nth = Math.min(10, n); }
  const SKILL = /(쓰면|쓸\s?때|쓰고\s?나면|쓴\s?(뒤|후|다음)|사용하면|사용할\s?때|사용\s?후|발동하면|발동할\s?때|공격하면|공격할\s?때|때리면|때릴\s?때|쏘면|쏠\s?때|던지면|던질\s?때|휘두르면|휘두를\s?때|누르면|공격마다|기술마다|능력마다|스킬마다|(능력|스킬|기술|공격|궁극기|필살기)(을|를)?\s?(쓸|할|쏠|부릴)\s?때마다)/;
  if ((m = (cond || '').match(new RegExp(DNR + '\\s*번(?:\\s*이상)?\\s*(?:연속으로\\s*)?(?:쓰면|쓸\\s*때마다|쓰고\\s*나면|사용하면|공격하면|때리면|쏘면|던지면|누르면)')))) { W.skill = true; const n = dnum(m[1]); if (n > 1) W.nth = n; }
  else if (!W.ev && has(SKILL) && !has(D_CASTING) && !has(D_IDLE)) W.skill = true;
  else if (!W.ev && has(/(맞으면|맞을\s?때|맞을때|공격(을)?\s?받으면|공격\s?당하면|얻어맞으면|피격|다치면|다칠\s?때|(데미지|대미지|피해)(를)?\s?(입|받)으면|한\s?대\s?맞으면)/)) {
    W.hit = true;
    if ((m = (cond || '').match(new RegExp(DNR + '\\s*(?:번|대|회)\\s*(?:이상\\s*)?(?:맞|얻어|공격|다치|피해)')))) { const n = dnum(m[1]); if (n > 1) W.nth = Math.min(10, n); }
  }
  if ((m = t.match(new RegExp(DNR + '\\s*초\\s*(?:마다|에\\s*한\\s*번씩|간격|씩마다)')))) W.every = clamp(dnum(m[1]), 2, 30);
  else if ((m = t.match(new RegExp(DNR + '\\s*분\\s*마다')))) W.every = 30;
  const dur = cond ? '' : (t.match(/^(.*?(?:는|인|일)\s?동안)/) || [])[1] || '';
  const IFX = W.ev || W.skill || W.hit ? null : D_IF.find(([re]) => has(re) || (dur && re.test(dur))) || D_IFT.find(([re]) => re.test(t));
  if (IFX) {
    W.if = IFX[1];
    if (IFX[2] && (m = (IFX[2].test(t) ? t : cond || dur).match(IFX[2]))) { const n = dnum(m[1]); if (n > 0) W.n = W.if === 'crowd' ? clamp(n, 2, 4) : n; }
  }
  else if (W.ev) { /* 사건이면 상태 조건은 보지 않는다 */ }
  else if (has(/가만히\s?(있|서)|멈춰\s?(있|서)|서\s?있으면|안 움직이면|움직이지 않으면|쉬면/)) W.if = 'still';
  else if (has(/움직이면|움직일\s?때|걸으면|걸을\s?때|뛰면|달리면|이동하면|이동할\s?때|걸어 다니면/)) W.if = 'moving';
  else if (has(/(체력|피|hp)[이가]?\s?(낮|적|반|절반|얼마\s?안|\d+\s?%?\s?이하|바닥|없|조금|별로)[가-힣\s]*(면|때)|죽을\s?(때가|것 같으)|죽어가면|위험하면|거의 죽/i)) {
    W.if = 'lowhp';
    if ((m = (cond || '').match(/(\d+)\s*(%|퍼센트|프로)/))) W.n = clamp(+m[1], 5, 95); else if (/절반|반/.test(cond)) W.n = 50;
  }
  else if (has(/(체력|피)[이가]?\s?(많|높|넉넉)[가-힣\s]*(면|때)/)) { W.if = 'highhp'; if ((m = (cond || '').match(/(\d+)\s*(%|퍼센트|프로)/))) W.n = clamp(+m[1], 5, 95); }
  else if (has(/(적|상대|남|다른 사람|누가|누군가|사람|친구)(한테|에게|이랑|랑|과|와|[이가을를])?\s?(가까이|근처|옆|코앞|가까워)|(가까이|근처|옆에|붙어|가까워)\s?(가면|오면|있으면|있을\s?때|붙으면|지면)|붙으면|마주치면|만나면|보면/)) W.if = 'near';
  else if (has(/(멀리|멀어|떨어져)\s?(있으면|지면|가면)/)) W.if = 'far';
  if ((W.if === 'still' || W.if === 'moving') && (m = (cond || '').match(new RegExp(DNR + '\\s*초\\s*(?:넘게|이상|동안|가량|정도)?')))) W.n = clamp(dnum(m[1]), 1, 30);
  else if ((W.if === 'still' || W.if === 'moving') && /오래|한참|계속/.test(cond || '')) W.n = 3;
  if (has(/벽에\s?(부딪|박|닿|부딫|쾅)|벽에 (머리|몸)/)) W.bump = true;
  if (has(/시간이\s?(지날|갈|흐를)수록|갈수록|오래\s?(싸울|있을|버틸)수록|싸울수록|점점/) || /점점|갈수록|시간이 지날수록/.test(t)) W.time = true;
  if (has(/(체력|피)[이가]?\s?(줄|낮아|떨어|깎|닳)[가-힣]*수록|다칠수록|맞을수록|약해질수록/)) W.hpr = true;
  if (/배가?\s?고프|배고프|배고파|굶/.test(t)) { W.time = true; W.why = '배가 고파질수록'; }
  // 조건 부분에 저절로 하는 행동이 있으면("재채기를 하면") 그 행동이 몇 초마다 일어나고 그때 결과가 생긴다
  if (cond && !W.skill && !W.hit && !W.ev && !W.ev && !W.if && !W.bump && !W.time && !W.hpr) {
    const a = D_ACT.find(([re]) => re.test(cond));
    if (a) { W.byAct = a; W.every = W.every || (typeof a[4] === 'number' ? a[4] : 8); }
    else if (!W.every && /[가-힣]/.test(cond)) W.gate = cut(cond.replace(/\s*(면|때마다|때|마다|면서|는데)$/, '').trim(), 10);
  }
  if (/가끔|때때로|종종|간혹|어쩌다|가끔씩|랜덤하게|무작위로|이따금/.test(t)) W.rare = true;
  if (/자꾸|계속|수시로|주기적|툭하면|시도\s?때도|맨날|항상|틈만 나면|쉴 새 없이|매번/.test(t)) W.often = true;
  return W;
}

/** 부작용 글 → 효과 목록 (글에 나온 그대로) */
function literalDrawback(t, ctx, add, say, out) {
  const blocked = () => (out || []).some((x) => x.t === 'replace' || x.t === 'lock');
  const has = (re) => re.test(t);
  const [cond, eff] = dSplit(t);
  const W = dWhen(t, cond);
  const E = (re) => re.test(eff);
  const big = /엄청|매우|너무|완전|진짜|아주|겁나|무지|되게|심하게|미친 듯이|많이|훨씬|극도로/.test(t), small = /조금|살짝|약간|(?<![가-힣])좀|약하게/.test(t);
  const K = big ? 1.6 : small ? 0.55 : 1;
  const secM = (cond ? eff : t).match(/(\d+(?:\.\d+)?)\s*초\s*(?:동안|간|씩|정도)/), sec = secM ? clamp(+secM[1], 0.3, 4) : 0;
  const pctM = t.match(/(\d+)\s*(%|퍼센트|프로)/), pct = pctM ? clamp(+pctM[1], 5, 95) : 0;
  const half = /절반|(?<![가-힣])반(?!대|복|사|응|짝|드시|칙|성|항|갑|찬|죽|창|지|팔|바지|쪽짜리 아)|1\/2/.test(t);
  const timesM = t.match(new RegExp(DNR + '\\s*배')), times = timesM ? clamp(dnum(timesM[1]), 1.2, 4) : 0;
  const slotM = [[/궁극기|궁(?![가-힣])|필살기/, 'ult'], [/능력\s?1|첫\s?번째 (능력|기술)|기본\s?공격|평타|기본기/, 'basic'], [/능력\s?2|두\s?번째 (능력|기술)/, 's1'], [/능력\s?3|세\s?번째 (능력|기술)/, 's2']].find(([re]) => re.test(t));
  const on = slotM ? slotM[1] : 'skills';
  const nth = W.skill ? W.nth || undefined : undefined;
  const chance = W.rare ? 40 : 100;
  const pctOr = (def) => Math.round(pct || (half ? 50 : times ? (1 - 1 / times) * 100 : def * K));
  // 상태이상·행동을 "언제"에 맞게 붙인다
  const place = (st, act) => {
    const A = { t: 'act', text: act.text, pose: act.pose, d: act.d, word: act.word, what: act.what };
    if (st) A.st = st;
    if (act.fire) A.fire = true;
    if (W.skill || (!W.hit && !W.ev && !W.every && !W.if && !W.bump && !W.gate && act.def === 'skills')) {
      return add(Object.assign(A, { on, nth, chance: W.rare ? 40 : 100 }));
    }
    if (W.ev) return add(Object.assign(A, { ev: W.ev, nth: W.nth, chance: W.rare ? 40 : 100 }));
    if (W.hit) return add(Object.assign(A, { hit: true, nth: W.nth, chance: W.rare ? 40 : 100 }));
    if (W.bump) return add(Object.assign(A, { bump: true }));
    if (W.if) {
      // 가벼운 상태는 조건인 동안 계속, 크게 묶는 상태는 그 순간 한 번
      if (st && !D_HARD.has(st.k) && st.k !== 'tiny' && !act.forceAct) return add({ t: 'when', if: W.if, n: W.n, st: st.k });
      return add(Object.assign(A, { if: W.if, n: W.n }));
    }
    if (W.gate) return add(Object.assign(A, { every: W.every || 11, text: cut(`${W.gate}면…!`, 14) }));
    return add(Object.assign(A, { every: W.every || (W.often ? 6 : W.rare ? 12 : typeof act.def === 'number' ? act.def : 9) }));
  };

  // ── 숫자·능력치로 분명히 말한 것 ──
  // 원소에 약함: "물에 약하다", "물을 맞으면 2배로 아프다"
  const elemPart = (t.match(/([가-힣]{1,6}?)(?:에|에게|한테)\s*(?:약하|약해|약함|취약|쥐약)/) || t.match(/([가-힣]{1,6}?)(?:을|를|에)\s*맞으면/) || [])[1];
  const EL = elemPart && !/^(적|상대|공격|남|사람|친구|아무|누구|모든|총알)$/.test(elemPart) && D_ELEM.find(([re]) => re.test(elemPart));
  if (EL) add({ t: 'weakto', vfx: EL[1], pct: Math.round(times ? (times - 1) * 100 : 100 * K), name: elemPart });
  // 체력
  const hpN = t.match(/(?:체력|피|hp|HP|목숨|생명력)[이가은는]?\s*(\d+)\s*(?:밖에|뿐|만 ?있|이다|이야|짜리|으로|로|에서)/);
  const hpLoss = /(체력|피|목숨|생명)[이가을를]?\s*(\d+\s*)?(씩\s*)?(줄|준|깎|닳|빠|감소|떨어|잃|소모|사라|날아)|(체력|피)[이가]?\s*(반|절반)\s*(이|으로|만)?\s*(된|줄|깎|날)|피를 (흘|토)|다친다|다쳐|(?<!배가 |배 )아프다|(?<!배가 |배 )아파|상처/;
  if ((W.skill || W.byAct) && E(hpLoss)) {
    const nm = eff.match(/(\d+)\s*(?:씩\s*)?(?:줄|준|깎|닳|빠|감소|떨어|잃|소모)/);
    if (W.byAct) { /* 행동 + 체력: 아래 행동에서 처리 */ } else add(half || pct ? { t: 'selfdmg', on, pct: pct || 50, nth } : { t: 'selfdmg', on, amt: nm ? clamp(+nm[1], 1, 40) : Math.round(10 * K), nth });
  } else if ((W.hit || W.ev || W.bump) && E(hpLoss) && !E(/계속|서서히|점점|조금씩|더 아프|더 많이|두 배|세 배/) && !E(new RegExp(DNR + '\\s*배'))) {
    const nm = eff.match(/(\d+)\s*(?:씩\s*)?(?:줄|준|깎|닳|빠|감소|떨어|잃|소모)/);
    add({ t: 'act', text: cut(dWhat(eff) || '아야!', 14), pose: 'sweat', d: 0, hp: nm ? clamp(+nm[1], 1, 40) : Math.round(8 * K), hit: W.hit || undefined, ev: W.ev, nth: W.ev || W.hit ? W.nth : undefined, bump: W.bump || undefined, chance: W.rare ? 40 : 100 });
  } else if ((W.if || W.time || W.often || W.every) && !W.hit && !W.ev && E(/(체력|피)[이가]?\s*(계속|서서히|조금씩|점점|자꾸)?\s*(줄|준|깎|닳|빠|감소|떨어|사라)/)) {
    add({ t: 'drain', amt: r1(1.5 * K), if: W.if || 'always', n: W.n });
  } else if (!W.hit && !W.ev && !W.if && (hpN || E(/(체력|피|목숨|생명력)[이가은는]?\s*(적|낮|약하|약해|조금|얼마\s?없|반|절반|별로 없|부족)|허약|약골|유리\s?몸|종이\s?몸|몸이 약|병약|저질\s?체력|저체력/))) {
    add({ t: 'stat', stat: 'hp', pct: hpN ? clamp(100 - +hpN[1], 10, 80) : pctOr(35) });
  }
  // 받는 피해
  if (!EL && (E(new RegExp(DNR + '\\s*배(로)?\\s*(더\\s*)?(아프|다치|피해|데미지|대미지|받|깎|세게)')) && (W.hit || has(/맞으면|받는|피해|데미지|대미지/)) || E(/더 아프|더 많이 다치|아픔을 (많이|두 배)|맷집이 (약|없)|방어력이?\s?(약|낮|없|0|반)|방어를? 못|물렁/))) {
    add({ t: 'stat', stat: 'taken', pct: times ? Math.round((times - 1) * 100) : pctOr(60) });
  }
  else if (!EL && (W.if || W.ev || W.every || W.gate || W.bump) && E(/받는\s?(피해|데미지|대미지)[가이]?\s?(늘|커|많아|증가|두\s?배)|더 아프|더 많이 다치|방어력이?\s?(약|낮|없|0|반|떨어)|맷집이 (약|없)/))
    place({ k: 'vuln', d: sec || 2 }, { text: '아야야…', pose: 'sweat', d: 0, what: dWhat(eff) });
  // 공격력
  const dmgW = /(공격력|힘|위력|파워|데미지|대미지|공격|능력|기술|스킬)[이가은는]?\s*(이\s)?(약|낮|반|절반|줄|떨어|약해|약하|별로|쎄지 않|세지 않|안 아프|하나도 안 아|간지럽)/;
  if (W.time || W.hpr) {
    if (E(/약해|힘이 빠|위력|공격력|힘이 없|약하/)) add({ t: 'ramp', stat: 'dmg', by: W.hpr ? 'hp' : 'time', pct: pctOr(50), why: W.why });
    if (E(/느려|느리|굼떠|지쳐|헉헉/)) add({ t: 'ramp', stat: 'speed', by: W.hpr ? 'hp' : 'time', pct: pctOr(50), why: W.why });
    if (E(/작아|줄어들|쪼그라/)) add({ t: 'ramp', stat: 'size', by: W.hpr ? 'hp' : 'time', pct: -Math.min(60, pctOr(45)), why: W.why });
    if (E(/커지|커진|커져|뚱뚱|살이/)) add({ t: 'ramp', stat: 'size', by: W.hpr ? 'hp' : 'time', pct: Math.min(80, pctOr(60)), why: W.why });
  } else if (!W.skill && !W.hit && !W.ev && !W.if && !W.every && !W.gate && E(dmgW)) {
    add(on !== 'skills' ? { t: 'mul', on, pct: Math.min(95, pctOr(40)) } : { t: 'stat', stat: 'dmg', pct: Math.min(80, pctOr(40)) });
  }
  // 이동 속도
  const spdW = /(속도|발|이동|걸음|달리기|움직임)[이가은는]?\s*(이\s)?(엄청\s|너무\s|진짜\s)?(느|느려|느림|반|절반|굼)|느림보|굼벵이|거북이(처럼|같이)|발이 느|느리다|느려진다|느리게 (걷|움직|다)|느릿느릿/;
  if (!W.time && !W.hpr) {
    if (E(/못 걷|걸을 수 없|걷지 못|다리가 (없|하나|부러)|외다리|깨금발|한 발로/)) { add({ t: 'move', mode: 'hop' }); add({ t: 'stat', stat: 'speed', pct: 25 }); }
    else if (E(/못 뛴|못 달|뛸 수 없|달릴 수 없|뛰지 못|달리지 못|못 뛰어/)) add({ t: 'stat', stat: 'speed', pct: pctOr(35) });
    else if (E(spdW) && W.skill) add({ t: 'stack', on, stat: 'slow', pct: Math.round(10 * K), nth });
    else if (E(spdW) && !W.hit && !W.ev && !W.if && !W.every && !W.gate && !W.byAct) add({ t: 'stat', stat: 'speed', pct: Math.min(80, pctOr(30)) });
  }
  // 몸집 ("적이 커진다"처럼 적 얘기면 빼고)
  const foeSubj = /(적|상대|남|다른 사람|상대방)[이가은는도]?\s?(더\s)?(커|작아|빨라|강해|세져)/.test(eff);
  if (!W.time && !W.hpr && !foeSubj) {
    if (E(/커지|커진|커져|뚱뚱해|살이 (찐|찌)|거대해|부풀/)) {
      if (W.skill) add({ t: 'stack', on, stat: 'size', pct: Math.round(15 * K), nth });
      else if (W.hit) add({ t: 'stack', hit: true, stat: 'size', pct: Math.round(12 * K) });
      else if (!W.if && !W.every && !W.gate) add({ t: 'stat', stat: 'size', pct: Math.round(pct || (times ? (times - 1) * 100 : 40 * K)) });
    } else if (E(/작아|줄어들|쪼그라|난쟁이|키가 작|꼬마가/)) {
      if (W.skill) add({ t: 'stack', on, stat: 'size', pct: -Math.round(12 * K), nth });
      else if (W.hit) add({ t: 'stack', hit: true, stat: 'size', pct: -Math.round(10 * K) });
      else if (!W.if && !W.every && !W.gate) add({ t: 'stat', stat: 'size', pct: -Math.min(60, pctOr(35)) });
    }
  }
  // 늙는다
  if (E(/늙|할머니가 된|할아버지가 된|노인/)) { add({ t: 'look', hair: '#e0e0e8' }); add(W.skill ? { t: 'stack', on, stat: 'slow', pct: 8, nth } : { t: 'stat', stat: 'speed', pct: 20 }); }
  // 재사용 시간·횟수·늦게 나감
  const onceM = t.match(new RegExp(DNR + '\\s*초\\s*에\\s*(?:한\\s*번|1번)(?:만|밖에|씩)?'));
  if (onceM) add({ t: 'cd', on, min: clamp(dnum(onceM[1]), 1, 20) });
  else if (has(/쿨|쿨타임|재사용|대기\s?시간|딜레이가 길|오래 기다려야|다시 쓰려면/)) add({ t: 'cd', on, pct: times ? Math.round((times - 1) * 100) : pct || Math.round(100 * K) });
  const usesM = t.match(new RegExp(DNR + '\\s*(?:번|발|개|회|방)\\s*(?:만|밖에|뿐|까지만)(?!\\s*(?:쓰면|맞으면))'));
  if (usesM && !W.nth && !onceM) add({ t: 'uses', on, n: clamp(dnum(usesM[1]), 1, 20) });
  else if (has(/하루에 한 번|평생 한 번|딱 한 번/)) add({ t: 'uses', on, n: 1 });
  const lateM = t.match(new RegExp(DNR + '\\s*초\\s*(?:늦게|뒤에|후에|있다가|지나야|기다려야|걸려|나중에)'));
  if (lateM) add({ t: 'windup', on, time: clamp(dnum(lateM[1]), 0.2, 3) });
  else if (has(/늦게 (나|발|써|쏴)|천천히 나|느리게 나|딜레이|모아야|기를 모|준비해야|주문을 외|외워야|뜸을 들|시간이 걸/)) add({ t: 'windup', on, time: r1(1 * K) });
  // 실패: "2번 중 1번", "가끔 실패"
  const ofM = t.match(new RegExp(DNR + '\\s*번\\s*(?:중|에)\\s*' + DNR + '\\s*번'));
  if (ofM && E(/실패|안 나|불발|안 돼|안 된|헛/)) add({ t: 'fail', on, chance: clamp(Math.round(dnum(ofM[2]) / dnum(ofM[1]) * 100), 10, 100), back: 'fizzle' });
  else if (E(/실패|불발|안 나가|안 나온|안 나와|삑사리|헛손질|작동을? 안|안 써질|발동이 안/) && !E(/못 쓴|못 써/) && !blocked()) add({ t: 'fail', on, chance: W.rare ? 40 : pct || (W.often ? 60 : 40), back: E(/기절|멈/) ? 'stun' : 'fizzle' });
  // 자기를 공격
  if (E(/자기\s?자신을?\s?(공격|때리|때린|쏘|쏜|맞|다치)|자기를?\s?(공격|때리|때린|쏘)|나를 (공격|때리|쏘|맞)|자기한테|자신한테|나한테 (맞|쏘|날아|돌아)|스스로를?\s?(때|공격|다치)|자폭|제 발등/)) {
    add(W.rare ? { t: 'fail', on, chance: 40, back: 'selfhit' } : { t: 'backfire', on, pct: pctOr(50) });
  } else if (E(/나도 (아프|다치|맞)|같이 맞|자기도 (아프|다치|맞)|나까지/)) add({ t: 'backfire', on, pct: pctOr(60) });
  // 빗나감·사거리
  if (E(/빗나|안 맞(는|아|고)|명중률|조준이?\s?(안|못|엉|이상|흔들)|헛방|엉뚱한 (데|곳)로 (날|나|쏘)|못 맞히|못 맞춘|못 맞혀|겨냥을 못/)) add({ t: 'aim', on, deg: Math.round(clamp(40 * K, 15, 80)), chance: W.rare ? 40 : /다 |전부|항상|무조건|하나도/.test(t) ? 100 : 70 });
  if (E(/멀리\s?(못|안)|사거리|팔이 짧|짧게 (나|날)|가까이서만|코앞까지만|가까운 (적|데|곳)만|멀리 있는 (적|사람|애)[은을]?\s?(못|안)|멀리 못 (가|날)|짧아/)) add({ t: 'range', on, pct: Math.round(clamp(50 * K, 20, 75)) });
  // 조건이 있는 "못 쓴다": 그 조건일 때만 능력이 막힌다 (체력이 낮으면, 비가 오면…)
  const blockW = /(능력|스킬|기술|공격|마법|궁극기)?[을를이가]?\s*(못 쓴|못 써|못 한|안 나|안 써|봉인|쓸 수 없|사용 불가|사용할 수 없|막힌|막혀)/;
  if ((W.if || W.hit || W.ev || W.every || W.gate || W.bump) && E(blockW)) {
    if (W.if) add({ t: 'when', if: W.if, n: W.n, st: 'silence' });
    else add({ t: 'act', text: W.gate ? cut(`${W.gate}면…!`, 14) : '능력이 안 나와!', pose: 'sweat', d: 0, st: { k: 'silence', d: sec || 3 }, hit: W.hit || undefined, ev: W.ev, nth: W.nth, bump: W.bump || undefined, every: W.hit || W.bump || W.ev ? undefined : W.every || 11 });
  }
  // 반동
  if (E(/(내가|나도|몸이|자기가)?\s?(날아가|날아간|밀려|튕겨|뒤로 날|반동)/)) add(W.hit || W.ev || W.bump || W.every || W.if ? { t: 'act', text: '으아아~', pose: 'shout', d: 0, push: true, hit: W.hit || undefined, ev: W.ev, nth: W.ev || W.hit ? W.nth : undefined, bump: W.bump || undefined, if: W.if, n: W.n, every: W.hit || W.ev || W.bump || W.if ? undefined : W.every } : { t: 'recoil', on, force: Math.round(clamp(10 * K, 4, 14)), nth });
  // 도망·무서움
  const fearM0 = eff.match(/([가-힣]{1,6}?)(?:을|를|이|가)?\s*(?:무서워|겁내|무섭|싫어해|싫어한|질색|기겁)/);
  const fearM = fearM0 && !/(면|서|고|니|데|며|게|도|해)$/.test(fearM0[1]) && !/무서워서|무서워 ?하면서/.test(fearM0[0]) ? fearM0 : null;
  if (fearM && !/^(적|상대|남|사람|친구|모두|다른 사람|아무|누구)$/.test(fearM[1])) add({ t: 'pest', every: W.every || 7, dmg: 0, name: fearM[1], color: (pixFor(fearM[1]) || {}).color || '#ffe14a', pix: (pixFor(fearM[1]) || {}).pix, st: { k: 'stun', d: 0.8 } });
  else if (E(/도망|겁(이|을)?\s?(많|먹|나)|겁쟁이|피해 다|쫄보|쫄아/) || (fearM && /적|상대|사람/.test(fearM[1]))) add({ t: 'flee', if: W.if && W.if !== 'still' && W.if !== 'moving' ? W.if : 'near', n: W.if && W.if !== 'still' && W.if !== 'moving' ? W.n : undefined });
  // 걸음 방향 제한
  if (has(/왼쪽으로만/)) add({ t: 'move', mode: 'left' });
  else if (has(/오른쪽으로만/)) add({ t: 'move', mode: 'right' });
  else if (has(/옆으로만|게처럼 걷|게걸음|가로로만/)) add({ t: 'move', mode: 'side' });
  else if (has(/위아래로만|앞뒤로만|세로로만/)) add({ t: 'move', mode: 'vertical' });
  // 말을 못 한다: 기술 이름을 외치려 해도 음음음만 나온다
  if (has(/말을 못|입이 막|벙어리|말을 할 수 없|입을 못 열|말이 안 나/)) add({ t: 'shout', on, text: pick(['음음음!', '읍읍!', '으븝…']) });
  // 눈이 나쁨
  if (has(/눈이 나쁘|시력이|근시|안경을 (잃|안 쓰|벗)|눈이 침침/)) { add({ t: 'vision', mode: 'zoom' }); add({ t: 'aim', on: 'skills', deg: 30, chance: 50 }); }

  // ── 행동과 상태이상 ──
  const actA = D_ACT.find(([re]) => re.test(eff)) || (W.byAct && null);
  const condS = !!(W.if || W.ev || W.hit || W.every || W.gate || W.bump || W.byAct);
  const stA = D_ST.find(([re]) => re.test(eff) && !(re.source.includes('느려') && ((E(spdW) && !condS) || W.time)) && !(re.source.includes('약해') && ((E(dmgW) && !condS) || W.time || W.hpr)) && !(re.source.includes('작아') && !W.if && !W.every && !W.gate && !W.byAct));
  const qtext = say ? cut(say, 14) : '';
  if (W.byAct) {
    // "재채기를 하면 능력이 나간다", "딸꾹질하면 멈춘다": 그 행동이 저절로 일어나고 그 순간 결과가 생긴다
    const a = W.byAct, fire = E(/능력이 (나|발|튀어|써)|(공격|기술|스킬)이 (나|발|튀어)|저절로 (쏘|나|공격)/);
    const st = stA ? { k: stA[1], d: sec || stA[2] * (big ? 1.5 : 1) } : null;
    const hurt = E(hpLoss);
    add({ t: 'act', every: W.every, text: qtext || pick(a[2]), pose: a[1], d: st ? 0 : sec || a[3], st, fire, chance: W.rare ? 50 : 100, what: dWhat(cond) });
    if (hurt) add({ t: 'drain', amt: 1, if: 'always' });
  } else if (actA) {
    const st = stA && stA[1] !== 'dance' && !(actA[1] === 'star' && stA[1] === 'dance') ? { k: stA[1], d: sec || stA[2] } : actA[1] === 'star' ? { k: 'dance', d: sec || 1.5 } : null;
    place(st, { text: qtext || pick(actA[2]), pose: actA[1], d: st ? 0 : sec || actA[3] * (big ? 1.5 : 1), def: actA[4], forceAct: true, fire: E(/능력이 (나|발)|저절로 (쏘|나)/), what: dWhat(eff) });
  } else if (stA && !(stA[1] === 'slow' && (W.time || W.hpr)) && !(stA[1] === 'weak' && (W.time || W.hpr))) {
    const d = sec || r1(stA[2] * (big ? 1.5 : small ? 0.6 : 1));
    // "느리다", "약하다"처럼 언제가 없으면 위에서 능력치로 이미 처리했다
    if (!((stA[1] === 'slow' || stA[1] === 'weak' || stA[1] === 'heavy') && !W.skill && !W.hit && !W.ev && !W.if && !W.every && !W.gate && !W.bump) && !(stA[1] === 'silence' && E(blockW) && !E(/말/))) place({ k: stA[1], d }, { text: qtext || pick(stA[3]), pose: stA[4], d: 0, what: dWhat(eff) });
  }
}

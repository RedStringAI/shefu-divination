// 起卦引擎 — 梅花易数
// 实现两种起卦法:时间起卦 + 数字/文字起卦
import { NUM_TO_TRIGRAM, TRIGRAMS, DIZHI, DIZHI_ORDER, GUA64 } from '../data/bagua.js';

// 农历换算很复杂,这里采用梅花易数实战中常用的简化:
// 严格的梅花时间起卦用农历。为保证可复现且适合演示,
// 我们用公历日期 + 真太阳时辰,并标注用的是公历(实战可切农历库)。

// 取得当前时辰地支序数 (子时1 ... 亥时12),按2小时一个时辰
export function getShichen(date) {
  const h = date.getHours();
  // 子时 23:00-01:00 = 1, 丑 1-3 =2 ...
  const idx = Math.floor(((h + 1) % 24) / 2); // 0..11
  return idx + 1; // 1..12
}

// 余数处理:÷8 余0 取 8(坤);÷6 余0 取 6(上爻)
function mod8(n) { const r = n % 8; return r === 0 ? 8 : r; }
function mod6(n) { const r = n % 6; return r === 0 ? 6 : r; }

// 时间起卦
// 依据梅花易数:上卦=(年支+月+日)÷8;下卦=(年支+月+日+时辰)÷8;动爻=同数÷6
export function qiguaByTime(date = new Date()) {
  const yearDizhiIdx = getYearDizhi(date.getFullYear()); // 年支序数 1..12
  const month = date.getMonth() + 1; // 月(公历近似农历月)
  const day = date.getDate();        // 日
  const shichen = getShichen(date);  // 时辰序数

  const upperSum = yearDizhiIdx + month + day;
  const lowerSum = yearDizhiIdx + month + day + shichen;

  const upperNum = mod8(upperSum);
  const lowerNum = mod8(lowerSum);
  const dongYao = mod6(lowerSum);

  return buildGua(upperNum, lowerNum, dongYao, {
    method: '时间起卦',
    detail: `年支${DIZHI_ORDER[yearDizhiIdx-1]}(${yearDizhiIdx})+月${month}+日${day}=${upperSum} → 上卦余${upperNum}; +时辰${shichen}=${lowerSum} → 下卦余${lowerNum}, 动爻${lowerSum}÷6余${dongYao}`,
    rawDate: date.toLocaleString('zh-CN'),
    _month: month
  });
}

// 数字起卦(三数法):三个数 → 上卦/下卦/动爻
export function qiguaByNumbers(n1, n2, n3) {
  const upperNum = mod8(n1);
  const lowerNum = mod8(n2);
  const dongYao = mod6(n3);
  return buildGua(upperNum, lowerNum, dongYao, {
    method: '数字起卦',
    detail: `数${n1}÷8余${upperNum}(上卦), 数${n2}÷8余${lowerNum}(下卦), 数${n3}÷6余${dongYao}(动爻)`,
    _month: new Date().getMonth() + 1
  });
}

// 单数起卦(梅花正统):一个随机数,按位数拆分
// 多位数:前半段为上卦,后半段为下卦,总和÷6为动爻
// 一位数:数÷8为上卦,(数+时辰)÷8为下卦,(数+时辰)÷6为动爻
export function qiguaBySingleNumber(num, date = new Date()) {
  const s = String(Math.abs(Math.trunc(num)));
  if (s === '0') throw new Error('请输入有效数字');

  let n1, n2, sumForDong, detail;
  if (s.length === 1) {
    // 一位数:配时辰
    const shichen = getShichen(date);
    n1 = Number(s);
    n2 = Number(s) + shichen;
    sumForDong = Number(s) + shichen;
    detail = `单数${s}÷8余${mod8(n1)}(上卦); (${s}+时辰${shichen})=${n2}÷8余${mod8(n2)}(下卦); ${sumForDong}÷6余${mod6(sumForDong)}(动爻)`;
  } else {
    // 多位数:对半拆分
    const half = Math.ceil(s.length / 2);
    n1 = Number(s.slice(0, half));
    n2 = Number(s.slice(half));
    sumForDong = n1 + n2;
    detail = `数${s}拆为前${s.slice(0,half)}/后${s.slice(half)}; 上卦${n1}÷8余${mod8(n1)}, 下卦${n2}÷8余${mod8(n2)}, 动爻(${n1}+${n2})÷6余${mod6(sumForDong)}`;
  }
  return buildGua(mod8(n1), mod8(n2), mod6(sumForDong), {
    method: '数字起卦',
    detail,
    _month: date.getMonth() + 1
  });
}

// 文字起卦:按真实笔画起卦(梅花正统)
// 单字:上半部分笔画为上卦,下半部分为下卦 → 但单字难拆,故单字用 笔画÷8上卦,(笔画+时辰)定下卦
// 多字:前半字笔画和为上卦,后半字笔画和为下卦,总笔画÷6为动爻
// strokeFn: 传入一个 (char)=>笔画数 的函数(浏览器用 cnchar)。缺省退化为码点近似。
export function qiguaByText(text, strokeFn = null, date = new Date()) {
  const clean = [...text.trim()].filter(c => c.trim());
  const len = clean.length;
  if (len === 0) throw new Error('请输入文字');

  // 取每字笔画(有 strokeFn 用真笔画,否则码点近似)
  const strokeOf = c => {
    if (strokeFn) {
      const s = strokeFn(c);
      if (s && s > 0) return s;
    }
    return c.codePointAt(0) % 30 + 1; // 退化近似
  };
  const strokes = clean.map(strokeOf);
  const usingReal = !!strokeFn;

  let n1, n2, sumForDong, detail;
  if (len === 1) {
    // 单字:笔画为上卦,(笔画+时辰)为下卦,合÷6动爻
    const shichen = getShichen(date);
    n1 = strokes[0];
    n2 = strokes[0] + shichen;
    sumForDong = strokes[0] + shichen;
    detail = `单字「${clean[0]}」${usingReal?'笔画':'码值'}${strokes[0]}÷8余${mod8(n1)}(上卦); (${strokes[0]}+时辰${shichen})=${n2}÷8余${mod8(n2)}(下卦); ${sumForDong}÷6余${mod6(sumForDong)}(动爻)`;
  } else {
    const half = Math.ceil(len / 2);
    n1 = strokes.slice(0, half).reduce((a, b) => a + b, 0);
    n2 = strokes.slice(half).reduce((a, b) => a + b, 0);
    sumForDong = n1 + n2;
    const sList = strokes.join('+');
    detail = `${len}字${usingReal?'笔画':'码值'}[${sList}]; 前${half}字和=${n1}÷8余${mod8(n1)}(上卦), 后${len-half}字和=${n2}÷8余${mod8(n2)}(下卦), 动爻(${n1}+${n2})÷6余${mod6(sumForDong)}`;
  }
  return buildGua(mod8(n1), mod8(n2), mod6(sumForDong), {
    method: '文字起卦',
    detail,
    text,
    _month: date.getMonth() + 1
  });
}

// 年干支:简化为按公历年换算地支 (公元年 % 12)
// 子年对应 ...4(鼠), 这里用标准: 年 % 12 → 地支
function getYearDizhi(year) {
  // 公元4年为子年(甲子). (year - 4) % 12 → 0=子
  const idx = ((year - 4) % 12 + 12) % 12; // 0..11, 0=子
  return idx + 1; // 1..12
}

// 由上卦数/下卦数/动爻 构建完整卦象(本卦+变卦+互卦)
function buildGua(upperNum, lowerNum, dongYao, meta) {
  const upper = NUM_TO_TRIGRAM[upperNum];
  const lower = NUM_TO_TRIGRAM[lowerNum];

  // 六爻:从下往上 1-6。下卦占爻1-3,上卦占爻4-6
  // 每爻阴阳:用 binary 字符串 (低位在下)
  const lowerBits = TRIGRAMS[lower].binary.split('').reverse(); // 爻1,2,3
  const upperBits = TRIGRAMS[upper].binary.split('').reverse(); // 爻4,5,6
  const yaos = [...lowerBits, ...upperBits].map(b => parseInt(b)); // [爻1..爻6]

  // 变卦:动爻阴阳互变
  const bianYaos = [...yaos];
  bianYaos[dongYao - 1] = bianYaos[dongYao - 1] === 1 ? 0 : 1;

  const bianLowerBin = bianYaos.slice(0, 3).reverse().join('');
  const bianUpperBin = bianYaos.slice(3, 6).reverse().join('');
  const bianLower = binToTrigram(bianLowerBin);
  const bianUpper = binToTrigram(bianUpperBin);

  // 互卦:本卦 2-3-4 爻为下互, 3-4-5 爻为上互
  const huLowerBin = [yaos[3], yaos[2], yaos[1]].join(''); // 爻4,3,2 (高位在上)
  const huUpperBin = [yaos[4], yaos[3], yaos[2]].join(''); // 爻5,4,3
  const huLower = binToTrigram(huLowerBin);
  const huUpper = binToTrigram(huUpperBin);

  // 体用判定:动爻所在之卦为「用」,另一卦为「体」
  // 动爻 1-3 在下卦, 4-6 在上卦
  const dongInLower = dongYao <= 3;
  const yongTrigram = dongInLower ? lower : upper;   // 用卦(所测之物)
  const tiTrigram = dongInLower ? upper : lower;     // 体卦(求测者自身)

  return {
    ...meta,
    upperNum, lowerNum, dongYao,
    benGua: {
      upper, lower,
      name: GUA64[upper + lower],
      yaos // [爻1..爻6], 1=阳 0=阴
    },
    bianGua: {
      upper: bianUpper, lower: bianLower,
      name: GUA64[bianUpper + bianLower],
      yaos: bianYaos
    },
    huGua: {
      upper: huUpper, lower: huLower,
      name: GUA64[huUpper + huLower]
    },
    tiyong: {
      ti: tiTrigram,      // 体
      yong: yongTrigram,  // 用 = 所射之物的主象
      dongInLower
    }
  };
}

function binToTrigram(bin) {
  for (const [name, t] of Object.entries(TRIGRAMS)) {
    if (t.binary === bin) return name;
  }
  return null;
}

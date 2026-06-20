// 断卦引擎 — 射覆猜物收敛管线
// 校正自专项研究:射覆不输出吉凶,而是多维取象→交集收敛→咬定一物
//   本卦 = 外形 + 材质
//   互卦 = 来历 + 内部结构
//   变卦 = 过程 + 结果形态
//   体用生克 = 物性类别(可食/器物/破损…),不是吉凶
//   旺衰/状态 = 新旧大小、中空、带壳等物理属性
// 三卦合参(duanguaMulti):多种起卦各成一卦,跨卦分数相加,交叉印证收敛到一物
import {
  TRIGRAMS, WUXING, TRIGRAM_TAGS, SHENGKE_WUXING,
  STATE_TAGS, OBJECTS, WUXING_COLOR
} from '../data/bagua.js';

// 五行关系:a(体) 对 b(用) 的关系
function wuxingRelation(a, b) {
  if (a === b) return '比和';
  if (WUXING.生[a] === b) return '我生';   // 体生用
  if (WUXING.克[a] === b) return '我克';   // 体克用
  if (WUXING.生[b] === a) return '生我';   // 用生体
  if (WUXING.克[b] === a) return '克我';   // 用克体
  return '比和';
}

// 月令旺衰:用卦五行 vs 当令五行 → 新旧大小
const MONTH_WUXING = { // 公历月近似当令五行
  3:'木',4:'木',5:'土', 6:'火',7:'火',8:'土',
  9:'金',10:'金',11:'土', 12:'水',1:'水',2:'土'
};
function wangShuai(yongWx, month) {
  const dangling = MONTH_WUXING[month] || '土';
  if (yongWx === dangling) return '旺';           // 当令 → 旺
  if (WUXING.生[dangling] === yongWx) return '相'; // 令所生 → 相
  if (WUXING.生[yongWx] === dangling) return '休'; // 生令者 → 休
  if (WUXING.克[yongWx] === dangling) return '囚'; // 克令者 → 囚
  return '死';                                     // 令所克 → 死
}

// IDF:标签越普遍判别力越低。预计算每个标签在物品库的出现频次。
const TAG_DF = (() => {
  const df = {};
  OBJECTS.forEach(([, , tags]) => tags.forEach(t => { df[t] = (df[t] || 0) + 1; }));
  return df;
})();
const N_OBJ = OBJECTS.length;
function idf(tag) {
  return Math.log(N_OBJ / (1 + (TAG_DF[tag] || 0))) + 0.3; // +0.3 保证非负基线
}

// ════════════ 单卦取象:卦象 → 标签池 + 体用/旺衰描述 ════════════
function analyzeGua(gua) {
  const { tiyong, benGua, bianGua, huGua } = gua;
  const ti = TRIGRAMS[tiyong.ti];
  const yong = TRIGRAMS[tiyong.yong]; // 用卦 = 物之主象
  const huUpper = TRIGRAMS[huGua.upper];
  const huLower = TRIGRAMS[huGua.lower];
  const bian = TRIGRAMS[tiyong.dongInLower ? bianGua.lower : bianGua.upper];
  const month = gua._month || new Date().getMonth() + 1;

  // 多维取象层:带权标签池
  const pool = {};
  const add = (tags, w) => { (tags || []).forEach(t => { pool[t] = (pool[t] || 0) + w; }); };
  add(TRIGRAM_TAGS[yong.name], 3);    // 用卦(外形材质)主象
  add(TRIGRAM_TAGS[ti.name], 1);      // 体卦背景
  add(TRIGRAM_TAGS[huUpper.name], 1.2); // 互卦来历
  add(TRIGRAM_TAGS[huLower.name], 1.2);
  add(TRIGRAM_TAGS[bian.name], 1.5);  // 变卦形态

  // 生克 → 物性类别(非吉凶)
  const rel = wuxingRelation(ti.wuxing, yong.wuxing);
  const shengke = SHENGKE_WUXING[rel];
  add(shengke.tags, 2.5);

  // 状态标签
  const ws = wangShuai(yong.wuxing, month);
  const stateLabels = [];
  if ([yong.name, huUpper.name, huLower.name, bian.name].includes('离')) {
    add(STATE_TAGS.空亡.tags, 2);
    stateLabels.push('离中虚 → ' + STATE_TAGS.空亡.label);
  }
  if (bian.name === '坎') { add(['液', '润'], 1.5); stateLabels.push('变坎 → 涉水/润'); }
  if (yong.name === '兑' || bian.name === '兑') { add(['缺口', '孔'], 1); }

  return { gua, ti, yong, huUpper, huLower, bian, rel, shengke, ws, stateLabels, pool };
}

// 单卦内对单个物的打分(IDF 加权 + 五行同气 + 覆盖率)
function scoreOne(pool, yong, owx, otags) {
  let score = 0;
  otags.forEach(t => { if (pool[t]) score += pool[t] * idf(t); });
  if (owx === yong.wuxing) score += 2;
  else if (WUXING.生[owx] === yong.wuxing || WUXING.生[yong.wuxing] === owx) score += 0.5;
  const hit = otags.filter(t => pool[t]).length;
  const coverage = hit / otags.length;
  return score * (0.6 + 0.4 * coverage);
}

// ════════════ 主断卦(单卦) ════════════
export function duangua(gua) {
  return duanguaMulti([gua]);
}

// ════════════ 三卦合参 ════════════
// guaList: 已起好的卦数组(按优先级排序,首项为主卦,用于主象/物性表述)
export function duanguaMulti(guaList) {
  const analyses = guaList.map(analyzeGua);
  const lead = analyses[0]; // 主卦:决定主象/物性表述
  const n = analyses.length;

  // 跨卦分数相加(归一化,使置信阈值与单卦可比)
  const scored = OBJECTS.map(([name, owx, otags]) => {
    let score = 0;
    analyses.forEach(a => { score += scoreOne(a.pool, a.yong, owx, otags); });
    score /= n;
    return { name, owx, otags, score };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const alts = scored.slice(1, 4);

  // 置信度:头名领先程度
  const maxScore = top.score || 1;
  const gap = maxScore - (scored[1]?.score || 0);
  const confRatio = gap / maxScore;
  let confidence;
  if (confRatio >= 0.08) confidence = '高';
  else if (confRatio >= 0.03) confidence = '中';
  else confidence = '低';

  // 合并标签池(展示 形色质性 用)
  const merged = {};
  analyses.forEach(a => { for (const [t, w] of Object.entries(a.pool)) merged[t] = (merged[t] || 0) + w; });
  const topTags = Object.entries(merged).sort((a, b) => b[1] - a[1]).map(e => e[0]);

  const wuxingClass = lead.shengke.label;
  const ws = lead.ws;
  const yong = lead.yong;
  const stateLabels = [...new Set(analyses.flatMap(a => a.stateLabels))];

  const prediction = {
    object: top.name,
    confidence,
    alternatives: alts.map(a => a.name),
    wuxingClass,
    wangShuai: ws,
    形: pickDim(topTags, ['圆', '方', '长', '扁', '块', '曲', '缺口']),
    色: pickDim(topTags, ['金白', '红', '青绿', '黑蓝', '黄褐', '彩']).concat(WUXING_COLOR[yong.wuxing] || []).slice(0, 3),
    质: pickDim(topTags, ['硬', '软', '脆', '润', '干', '金属', '木', '布帛', '纸', '玻璃', '塑胶', '液']),
    性: pickDim(topTags, ['食', '器', '光电', '声动', '香', '文书', '饰', '孔', '刃', '贵重', '盒壳', '量多', '隐藏']),
    direction: yong.direction,
    stateLabels,
    verdict: composeVerdict(top, yong, wuxingClass, ws, n)
  };

  const reasoning = n === 1
    ? buildReasoningSingle(analyses[0], scored)
    : buildReasoningMulti(analyses, scored);

  return {
    confidence,
    tiWuxing: lead.ti.wuxing, yongWuxing: yong.wuxing, relation: lead.rel,
    wuxingClass,
    prediction,
    reasoning,
    _scored: scored.slice(0, 6),
    _guaCount: n
  };
}

function pickDim(tags, dim) {
  return tags.filter(t => dim.includes(t)).slice(0, 3);
}

// 一句话玄学断语
function composeVerdict(top, yong, wuxingClass, ws, n) {
  const wsText = { 旺: '其象新而盛', 相: '其象生发', 休: '其象已歇', 囚: '其象困滞', 死: '其象陈旧' }[ws] || '';
  const head = n > 1 ? `${n}卦合参,覆下之物` : '覆下之物';
  return `${head},当为【${top.name}】。以${yong.name}为主象,属${wuxingClass}之类,${wsText}。`;
}

// 推理链(单卦) — 逐维叠加→交集收敛
function buildReasoningSingle(a, scored) {
  const { gua, ti, yong, huUpper, huLower, bian, rel, shengke, ws } = a;
  const steps = [];
  steps.push({ step: '起卦', content: `${gua.method}:${gua.detail}` });
  steps.push({
    step: '成卦',
    content: `本卦【${gua.benGua.name}】(上${gua.benGua.upper}下${gua.benGua.lower}),动爻第${gua.dongYao}爻,变卦【${gua.bianGua.name}】,互卦【${gua.huGua.name}】。`
  });
  steps.push({
    step: '定主象(本卦)',
    content: `动爻在${gua.tiyong.dongInLower ? '下' : '上'}卦,取【${yong.name}】为用——即物之主象,主外形与材质:形${yong.shapes.slice(0, 2).join('/')},色${yong.colors.slice(0, 2).join('/')},质${yong.textures.slice(0, 2).join('/')}。`
  });
  steps.push({
    step: '生克定物性',
    content: `体${ti.name}(${ti.wuxing})对用${yong.name}(${yong.wuxing})为「${rel}」。射覆中生克不论吉凶,而定物性:此为【${shengke.label}】。`
  });
  steps.push({
    step: '互卦验来历',
    content: `互卦【${huUpper.name}${huLower.name}】示来历与内部结构:${huLower.keywords[0]}、${huUpper.keywords[0]}。${[yong.name, huUpper.name, huLower.name, bian.name].includes('离') ? '含离中虚 → 内部中空/有孔。' : ''}`
  });
  steps.push({
    step: '变卦验形态',
    content: `动而变【${bian.name}】,示结果形态:${bian.keywords[0]}。旺衰为「${ws}」,主物之新旧大小。`
  });
  steps.push({
    step: '交集收敛',
    content: `将形/色/质/性各维标签对候选物逐一求交集打分,收敛结果:${top3Text(scored)}。取首位为断。`
  });
  return steps;
}

// 推理链(三卦合参) — 每卦一条精简取象 + 合参收敛
function buildReasoningMulti(analyses, scored) {
  const steps = [];
  analyses.forEach((a, i) => {
    const { gua, ti, yong, rel, shengke } = a;
    const role = i === 0 ? '主卦' : '参卦';
    steps.push({
      step: `${role}·${gua.method}`,
      content: `${gua.detail}\n→ 本卦【${gua.benGua.name}】变【${gua.bianGua.name}】,用卦【${yong.name}】(形${yong.shapes[0]}/色${yong.colors[0]}/质${yong.textures[0]});体${ti.name}对用为「${rel}」,物性【${shengke.label}】;旺衰「${a.ws}」。`
    });
  });
  steps.push({
    step: '三卦归一·合参收敛',
    content: `各卦取象对候选物分别打分后相加,交叉印证。多卦共指者得分叠高,收敛结果:${top3Text(scored)}。取首位为断——此即"锲合":多源信息逼近唯一之物。`
  });
  return steps;
}

function top3Text(scored) {
  return scored.slice(0, 3).map((s, i) => `${i + 1}.${s.name}(${s.score.toFixed(1)})`).join('  ');
}

// AI 猜物接口 — 易学引擎只算物理属性,具体"是什么物"交给 AI 推断
// 默认接 DeepSeek;base URL 可改为 OpenAI-compatible 模型网关。
// Key 存 localStorage(不写死在源码),避免单文件分发时泄露。

const CFG_KEY = 'shefu_ai_cfg';

export function getAIConfig() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; }
  catch { return {}; }
}
export function setAIConfig(cfg) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}
export function aiEnabled() {
  const c = getAIConfig();
  return !!(c.key && c.enabled !== false);
}

const SYSTEM_PROMPT =
`你是一位精通梅花易数与射覆术数的高手。射覆是"猜中覆盖物下藏的那一件具体物品"——要咬定一个具体的、生活中真实存在的物件(如:口红、钥匙、保温杯、橘子、耳机…),不要答类别(不要答"金属器物""圆形物")。
用户会给你:卦象(本卦/变卦/互卦、用卦主象、体用生克关系)、以及由卦象推算出的物理属性(物性类别、旺衰、形/色/质/性、特征),还可能有题目给出的提示文字。
请综合卦象象意 + 物理属性 + 提示,推断最可能的那一件具体物品。
严格输出 JSON,不要任何多余文字:
{"object":"最可能的一件具体物品","alternatives":["备选1","备选2","备选3"],"confidence":"高|中|低","reasoning":"50-120字,玄学口吻,说明如何由卦象与属性锲合出此物"}`;

// 把卦象 + 算出的属性 + 提示,组织成给 AI 的用户消息
export function buildAIUserMsg(guaList, result, hint) {
  const p = result.prediction;
  const lines = [];
  lines.push(`【卦象】(共${guaList.length}卦合参)`);
  guaList.forEach((g, i) => {
    const role = i === 0 ? '主卦' : '参卦';
    lines.push(`${role}·${g.method}:本卦「${g.benGua.name}」→变卦「${g.bianGua.name}」,互卦「${g.huGua.name}」,用卦(物之主象)「${g.tiyong.yong}」,体卦「${g.tiyong.ti}」。`);
  });
  lines.push('');
  lines.push('【推算出的物理属性】');
  lines.push(`· 物性类别:${p.wuxingClass}`);
  lines.push(`· 旺衰:${p.wangShuai}(主物之新旧大小:旺=新大盛,死=陈旧小)`);
  lines.push(`· 形:${(p.形 || []).join('、') || '不明'}`);
  lines.push(`· 色:${(p.色 || []).join('、') || '不明'}`);
  lines.push(`· 质:${(p.质 || []).join('、') || '不明'}`);
  lines.push(`· 性/用途:${(p.性 || []).join('、') || '不明'}`);
  if (p.stateLabels && p.stateLabels.length) lines.push(`· 特征:${p.stateLabels.join(';')}`);
  if (p.direction) lines.push(`· 方位:${p.direction}`);
  lines.push('');
  const h = (hint || '').trim();
  lines.push(h ? `【题目提示】${h}` : '【题目提示】无');
  lines.push('');
  lines.push('请据此咬定覆下的那一件具体物品,输出 JSON。');
  return lines.join('\n');
}

// 调 AI 猜物。返回 {object, alternatives, confidence, reasoning}
export async function guessByAI(guaList, result, hint) {
  const cfg = getAIConfig();
  if (!cfg.key) throw new Error('未配置 API Key');
  const base = (cfg.baseUrl || 'https://api.deepseek.com').replace(/\/+$/, '');
  const model = cfg.model || 'deepseek-chat';
  const url = base + '/chat/completions';
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildAIUserMsg(guaList, result, hint) }
  ];

  // 发一次请求,返回解析后的 data;失败抛出含中转站原始信息的错误
  async function send(useJsonFormat) {
    const body = { model, messages, temperature: 1.1, max_tokens: 600 };
    if (useJsonFormat) body.response_format = { type: 'json_object' };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
      body: JSON.stringify(body)
    });
    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch {}
    if (!res.ok) {
      const msg = data?.error?.message || raw.slice(0, 200) || '无响应体';
      const err = new Error(`HTTP ${res.status} — ${msg}`);
      err.status = res.status;
      throw err;
    }
    return { data, raw };
  }

  let data, raw;
  try {
    ({ data, raw } = await send(true));
  } catch (e) {
    // 部分中转站/模型不支持 response_format,去掉重试一次
    if (e.status === 400 || e.status === 422) ({ data, raw } = await send(false));
    else throw e;
  }

  console.log('[射覆 AI] 中转站返回:', data || raw);
  const txt = data?.choices?.[0]?.message?.content;
  if (!txt) {
    const hint = data?.error?.message || (raw ? raw.slice(0, 200) : '');
    throw new Error('返回中无 content' + (hint ? ' — ' + hint : '(请检查模型名是否正确)'));
  }

  let parsed;
  try { parsed = JSON.parse(txt); }
  catch {
    const m = txt.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]); else throw new Error('AI 返回非 JSON');
  }

  return {
    object: parsed.object || '不明',
    alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.slice(0, 3) : [],
    confidence: ['高', '中', '低'].includes(parsed.confidence) ? parsed.confidence : '中',
    reasoning: parsed.reasoning || ''
  };
}

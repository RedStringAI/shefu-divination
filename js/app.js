// 射覆 App 主逻辑
import { qiguaByTime, qiguaByNumbers, qiguaBySingleNumber, qiguaByText } from './qigua.js';
import { duanguaMulti } from './duangua.js';
import { getAIConfig, setAIConfig, aiEnabled, guessByAI } from './ai.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

let lastResult = null; // 缓存最近一次起卦+断卦,用于回测存档

// 笔画函数:用全局 cnchar(浏览器引入),取单字笔画数
const strokeFn = (typeof window !== 'undefined' && window.cnchar)
  ? (ch => { try { return window.cnchar.stroke(ch); } catch { return 0; } })
  : null;

// ── Tab 切换(已无 tab,保留空守卫)──

// ── 合参起卦:三项选填,填了几项就起几卦 ──
$('#nowBtn').addEventListener('click', fillNow);
$('#clearTime').addEventListener('click', () => {
  $('#dateInput').value = '';
  $('#timeInput').value = '';
});

$('#castAll').addEventListener('click', () => {
  const guaList = [];   // 各起卦法产出的卦,首项为主卦
  const labels = [];

  // ① 天时
  const d = $('#dateInput').value, t = $('#timeInput').value;
  if (d && t) {
    const [y, mo, day] = d.split('-').map(Number);
    const [h, mi] = t.split(':').map(Number);
    guaList.push(qiguaByTime(new Date(y, mo - 1, day, h, mi)));
    labels.push('天时');
  }

  // ② 报数(优先三数,否则单数)
  const single = $('#numSingle').value.trim();
  const n1 = parseInt($('#num1').value), n2 = parseInt($('#num2').value), n3 = parseInt($('#num3').value);
  if (n1 && n2 && n3) {
    guaList.push(qiguaByNumbers(n1, n2, n3));
    labels.push('报数');
  } else if (single && parseInt(single) > 0) {
    guaList.push(qiguaBySingleNumber(parseInt(single)));
    labels.push('报数');
  }

  // ③ 报字
  const txt = $('#textInput').value.trim();
  if (txt) {
    guaList.push(qiguaByText(txt, strokeFn));
    labels.push('报字');
  }

  if (!guaList.length) { shake($('.qigua-panel')); return; }
  cast(guaList, $('#hintInput').value.trim());
});

// ── 起卦流程(带动画)──
function cast(guaList, hint) {
  const overlay = $('#castingOverlay');
  overlay.classList.add('active');
  setTimeout(async () => {
    try {
      const result = duanguaMulti(guaList);
      lastResult = { guaList, result, hint, ts: Date.now(), ai: null };
      renderResult(guaList, result, hint);
      // 若启用 AI:用引擎算出的属性 + 卦象 + 提示,让 AI 咬定具体物
      if (aiEnabled()) await runAIGuess(guaList, result, hint);
    } catch (e) {
      alert('起卦失败:' + e.message);
    }
    overlay.classList.remove('active');
  }, 1400);
}

// ── AI 猜物:覆盖主结论,引擎属性作为佐证保留 ──
async function runAIGuess(guaList, result, hint) {
  const main = $('#verdictMain');
  main.innerHTML = `覆下之物 · <span class="ai-thinking">AI 推演中…☯</span>`;
  try {
    const ai = await guessByAI(guaList, result, hint);
    lastResult.ai = ai;
    const conf = $('#jixiong');
    conf.textContent = (guaList.length > 1 ? `${guaList.length}卦合参 · AI · 置信 ` : 'AI · 置信 ') + ai.confidence;
    conf.className = 'verdict-conf ' + ai.confidence;
    main.innerHTML =
      `覆下之物 · 当为<b class="guess-obj">${ai.object}</b>` +
      (ai.alternatives.length ? `<span class="alts">备选:${ai.alternatives.join(' / ')}</span>` : '') +
      (ai.reasoning ? `<span class="ai-reason">「${ai.reasoning}」</span>` : '');
  } catch (e) {
    main.insertAdjacentHTML('beforeend', `<span class="ai-reason ai-err">AI 猜物失败:${e.message}(已退回易学引擎结果)</span>`);
  }
}

// ── 渲染卦象六爻 ──
function renderHexagram(el, yaos, dongYao) {
  el.innerHTML = '';
  yaos.forEach((y, i) => {
    const div = document.createElement('div');
    div.className = 'yao' + (y === 0 ? ' yin' : '');
    if (dongYao && i === dongYao - 1) div.classList.add('dong');
    el.appendChild(div);
  });
}

// ── 渲染单组卦象卡(本卦 ⟶ 变卦)──
function buildGuaGroup(gua, label) {
  const wrap = document.createElement('div');
  wrap.className = 'gua-group';
  wrap.innerHTML = `
    <div class="gua-group-label">${label} · ${gua.method}</div>
    <div class="gua-display">
      <div class="gua-card">
        <span class="gua-label">本卦</span>
        <div class="hexagram ben"></div>
        <span class="gua-name">${gua.benGua.name}</span>
      </div>
      <div class="gua-arrow">⟶</div>
      <div class="gua-card">
        <span class="gua-label">变卦</span>
        <div class="hexagram bian"></div>
        <span class="gua-name">${gua.bianGua.name}</span>
      </div>
    </div>`;
  renderHexagram(wrap.querySelector('.hexagram.ben'), gua.benGua.yaos, gua.dongYao);
  renderHexagram(wrap.querySelector('.hexagram.bian'), gua.bianGua.yaos, null);
  return wrap;
}

// ── 渲染结果 ──
function renderResult(guaList, result) {
  // 卦象栈:每个起卦法一组
  const stack = $('#guaStack');
  stack.innerHTML = '';
  const labelMap = { 时间起卦: '天时', 数字起卦: '报数', 文字起卦: '报字' };
  guaList.forEach(g => stack.appendChild(buildGuaGroup(g, labelMap[g.method] || '卦')));

  const p = result.prediction;

  // 置信度 + 物性徽章(替代原吉凶)
  const conf = $('#jixiong');
  conf.textContent = (guaList.length > 1 ? `${guaList.length}卦合参 · 置信 ` : '置信 · ') + p.confidence;
  conf.className = 'verdict-conf ' + p.confidence;

  // 主结论:咬定一个物
  $('#verdictMain').innerHTML =
    `覆下之物 · 当为<b class="guess-obj">${p.object}</b>` +
    (p.alternatives.length ? `<span class="alts">备选:${p.alternatives.join(' / ')}</span>` : '');

  // 佐证属性网格
  const dash = a => (a && a.length) ? a.join(' · ') : '—';
  $('#attrGrid').innerHTML = `
    <div class="attr-item"><span class="k">物性</span><span class="v">${p.wuxingClass}</span></div>
    <div class="attr-item"><span class="k">旺衰</span><span class="v">${p.wangShuai}(${wsText(p.wangShuai)})</span></div>
    <div class="attr-item"><span class="k">形</span><span class="v">${dash(p.形)}</span></div>
    <div class="attr-item"><span class="k">色</span><span class="v">${dash(p.色)}</span></div>
    <div class="attr-item"><span class="k">质</span><span class="v">${dash(p.质)}</span></div>
    <div class="attr-item"><span class="k">性</span><span class="v">${dash(p.性)}</span></div>
    ${p.stateLabels && p.stateLabels.length ? `<div class="attr-item full"><span class="k">特征</span><span class="v">${p.stateLabels.join(' · ')}</span></div>` : ''}
  `;

  // 推理链
  $('#reasoningContent').innerHTML = result.reasoning.map(s => `
    <div class="reason-step">
      <span class="s-name">${s.step}</span>
      <span class="s-body">${s.content}</span>
    </div>
  `).join('');
  $('#reasoningContent').classList.remove('show');
  $('#reasoningToggle').textContent = '▸ 展开玄机推理过程';

  // 重置回测输入
  $('#actualInput').value = '';
  $('#hitSelect').value = '';

  const panel = $('#resultPanel');
  panel.classList.add('show');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wsText(ws) {
  return { 旺:'新盛', 相:'生发', 休:'已歇', 囚:'困滞', 死:'陈旧' }[ws] || '';
}

// ── 推理折叠 ──
$('#reasoningToggle').addEventListener('click', () => {
  const c = $('#reasoningContent');
  c.classList.toggle('show');
  $('#reasoningToggle').textContent = c.classList.contains('show')
    ? '▾ 收起推理过程' : '▸ 展开玄机推理过程';
});

// ════════════ 回测台 ════════════
const STORE_KEY = 'shefu_backtest';

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}
function saveRecords(recs) { localStorage.setItem(STORE_KEY, JSON.stringify(recs)); }

$('#saveRecord').addEventListener('click', () => {
  if (!lastResult) { alert('请先起卦'); return; }
  const actual = $('#actualInput').value.trim();
  const hit = $('#hitSelect').value;
  if (!actual || !hit) { shake($('.bt-input-row')); return; }

  const recs = loadRecords();
  const primary = lastResult.guaList[0];
  const ai = lastResult.ai;
  recs.unshift({
    ts: lastResult.ts,
    method: lastResult.guaList.map(g => ({ 时间起卦:'时', 数字起卦:'数', 文字起卦:'字' }[g.method] || '')).join('+'),
    benGua: primary.benGua.name,
    yong: primary.tiyong.yong,
    guaCount: lastResult.guaList.length,
    source: ai ? 'AI' : '引擎',
    guess: ai ? ai.object : lastResult.result.prediction.object,
    alternatives: ai ? ai.alternatives : lastResult.result.prediction.alternatives,
    confidence: ai ? ai.confidence : lastResult.result.prediction.confidence,
    wuxingClass: lastResult.result.prediction.wuxingClass,
    hint: lastResult.hint || '',
    actual, hit
  });
  saveRecords(recs);
  renderBacktest();
  $('#actualInput').value = '';
  $('#hitSelect').value = '';
  // 反馈
  const btn = $('#saveRecord');
  btn.textContent = '已存 ✓';
  setTimeout(() => btn.textContent = '存档', 1200);
});

function renderBacktest() {
  const recs = loadRecords();
  // 统计
  const total = recs.length;
  const hits = recs.filter(r => r.hit === 'hit').length;
  const partial = recs.filter(r => r.hit === 'partial').length;
  const rate = total ? Math.round((hits + partial * 0.5) / total * 100) : 0;
  $('#btStats').innerHTML = `
    <div class="bt-stat"><div class="num">${total}</div><div class="lbl">总测</div></div>
    <div class="bt-stat"><div class="num">${hits}</div><div class="lbl">命中</div></div>
    <div class="bt-stat"><div class="num">${rate}%</div><div class="lbl">加权命中率</div></div>
  `;

  const list = $('#btList');
  if (!total) {
    list.innerHTML = '<div class="bt-empty">尚无回测记录 · 起卦后揭晓真物即可存档</div>';
    return;
  }
  const badgeMap = { hit: '✓', partial: '~', miss: '✗' };
  list.innerHTML = recs.map((r, i) => `
    <div class="bt-row">
      <span class="badge ${r.hit}">${badgeMap[r.hit]}</span>
      <span class="gua">${r.benGua}</span>
      <span class="pred">断:${r.guess || (r.categories||[]).slice(0,2).join('/') || '—'}</span>
      <span class="actual">实:${r.actual}</span>
      <button class="del" data-idx="${i}">✕</button>
    </div>
  `).join('');
  $$('.del').forEach(b => b.addEventListener('click', () => {
    const recs = loadRecords();
    recs.splice(parseInt(b.dataset.idx), 1);
    saveRecords(recs);
    renderBacktest();
  }));
}

$('#exportBtn').addEventListener('click', () => {
  const recs = loadRecords();
  if (!recs.length) { alert('暂无记录'); return; }
  const blob = new Blob([JSON.stringify(recs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `射覆回测_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$('#clearBtn').addEventListener('click', () => {
  if (confirm('确定清空所有回测记录?此操作不可恢复。')) {
    localStorage.removeItem(STORE_KEY);
    renderBacktest();
  }
});

// ── 小工具 ──
function shake(el) {
  el.animate([
    { transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }
  ], { duration: 300 });
}

// ── 粒子背景 ──
function initParticles() {
  const canvas = $('#particles');
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  const COUNT = Math.min(60, Math.floor(window.innerWidth / 20));
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      hue: Math.random() > 0.5 ? '45,226,230' : '240,208,128',
      a: Math.random() * 0.5 + 0.2
    });
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},${p.a})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `rgba(${p.hue},${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ── 填充当前时间到日期/时间输入框 ──
function fillNow() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  $('#dateInput').value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  $('#timeInput').value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// ════════════ AI 设置 ════════════
function refreshAIStatus() {
  const c = getAIConfig();
  const el = $('#aiStatus');
  if (aiEnabled()) {
    el.textContent = '● 已启用';
    el.className = 'ai-status on';
  } else if (c.key) {
    el.textContent = '○ 未启用';
    el.className = 'ai-status off';
  } else {
    el.textContent = '○ 未配置';
    el.className = 'ai-status off';
  }
}
function initAISettings() {
  const c = getAIConfig();
  $('#aiKey').value = c.key || '';
  $('#aiBase').value = c.baseUrl || '';
  $('#aiModel').value = c.model || '';
  $('#aiEnabled').checked = c.enabled !== false && !!c.key;
  refreshAIStatus();
}
$('#aiSave').addEventListener('click', () => {
  setAIConfig({
    key: $('#aiKey').value.trim(),
    baseUrl: $('#aiBase').value.trim(),
    model: $('#aiModel').value.trim(),
    enabled: $('#aiEnabled').checked
  });
  refreshAIStatus();
  const btn = $('#aiSave');
  btn.textContent = '已保存 ✓';
  setTimeout(() => btn.textContent = '保存设置', 1200);
});

// ── 初始化 ──
fillNow();
initParticles();
renderBacktest();
initAISettings();

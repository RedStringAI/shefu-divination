import { readFileSync, writeFileSync } from 'fs';

const css = readFileSync('css/style.css', 'utf8');
const cnchar = readFileSync('js/cnchar.min.js', 'utf8');

function stripModule(src) {
  return src
    .replace(/^\s*import[\s\S]*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^\s*export\s+async\s+function\s+/gm, 'async function ')
    .replace(/^\s*export\s+(const|function|let|var|default)\s+/gm, '$1 ')
    .replace(/^\s*export\s+\{[^}]*\};?\s*$/gm, '');
}

const bagua = stripModule(readFileSync('data/bagua.js', 'utf8'));
const qigua = stripModule(readFileSync('js/qigua.js', 'utf8'));
const duangua = stripModule(readFileSync('js/duangua.js', 'utf8'));
const ai = stripModule(readFileSync('js/ai.js', 'utf8'));
const app = stripModule(readFileSync('js/app.js', 'utf8'));
const js = [bagua, qigua, duangua, ai, app].join('\n\n/* ================================ */\n\n');

const html = readFileSync('index.html', 'utf8');
const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
if (!bodyMatch) throw new Error('index.html missing body');
const body = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/g, '');

const out = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>射覆 · 玄机推演</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;600;900&family=ZCOOL+QingKe+HuangYou&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>
${body}
  <script>${cnchar}</script>
  <script>
${js}
  </script>
</body>
</html>
`;

writeFileSync('射覆占卜.html', out, 'utf8');
console.log('已生成单文件: 射覆占卜.html (' + out.length + ' 字节)');

# Shefu Divination

射覆占卜是一个静态网页应用，用梅花易数、八卦类象和五行体用生克来推演“覆藏之物”。它可以通过时间、数字、文字三种方式起卦，合参输出候选物品、形色质性、推理链，并支持本地回测记录。

项目不需要后端即可运行；AI 猜物是可选能力，支持 OpenAI-compatible 接口。

## Features

- 三种起卦输入：天时、报数、报字。
- 多卦合参：把多个输入来源交叉验证，收敛到具体物品。
- 易学推演：展示本卦、变卦、用卦主象、五行属性和推理过程。
- AI 猜物：可选接入 DeepSeek、Claude、GPT 或其他 OpenAI-compatible 模型网关。
- 本地回测：记录真实物品、命中情况和加权命中率。
- 单文件分发：可构建成 `射覆占卜.html`，方便离线打开。

## Preview

打开 `index.html` 即可使用。页面风格是水墨、八卦与赛博视觉混合的东方玄学工具界面。

![Shefu Divination preview](docs/preview.png)

## Quick Start

直接打开：

```text
index.html
```

或使用任意静态服务器：

```bash
python -m http.server 8080
```

然后访问：

```text
http://127.0.0.1:8080
```

## Build Single File

项目包含一个零依赖打包脚本，会把 CSS、数据和 JS 合并成单个 HTML 文件：

```bash
npm run build
```

生成文件：

```text
射覆占卜.html
```

## AI Configuration

AI 猜物默认关闭。展开页面里的 `AI 猜物设置`，填写：

- API Key
- 接口地址
- 模型名

接口需要兼容 OpenAI `chat/completions` 格式。

FluxToken 是一个可选的 OpenAI-compatible 多模型网关，适合在 Claude / GPT / DeepSeek 等模型之间切换：

```text
https://fluxtoken.ai/v1
```

也可以使用 OpenAI、OpenRouter、自建 New API、本地模型服务或其他兼容网关。

## Privacy

- API Key 只保存在当前浏览器的 `localStorage`。
- 回测记录也只保存在当前浏览器的 `localStorage`。
- 默认易学推演不需要联网。
- 启用 AI 猜物后，请求会发送到你配置的模型接口。
- 公开演示或录屏前，建议隐藏或清空 AI Key 输入框。

## Project Structure

```text
.
├── index.html
├── css/
│   └── style.css
├── data/
│   └── bagua.js
├── js/
│   ├── ai.js
│   ├── app.js
│   ├── cnchar.min.js
│   ├── duangua.js
│   └── qigua.js
├── build.mjs
└── 射覆占卜.html
```

## Notes

射覆、梅花易数和八卦类象属于传统文化与娱乐体验范畴，结果不可作为现实决策依据。建议使用回测功能观察命中率，而不是把结果当作确定结论。

## License

MIT License. See [LICENSE](LICENSE).

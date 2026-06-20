<div align="center">

<img src="assets/shefu-logo.svg" alt="Shefu Divination logo" width="104">

# Shefu Divination

### サイバー東方風の射覆占い Web アプリ

[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20%2B-339933.svg)](package.json)
[![CI](https://github.com/RedStringAI/shefu-divination/actions/workflows/ci.yml/badge.svg)](https://github.com/RedStringAI/shefu-divination/actions/workflows/ci.yml)
[![OpenAI Compatible](https://img.shields.io/badge/API-OpenAI--compatible-111827.svg)](#ai-configuration)
[![Static Site](https://img.shields.io/badge/runtime-static--site-cyan.svg)](index.html)

### Official Repository: **[github.com/RedStringAI/shefu-divination](https://github.com/RedStringAI/shefu-divination)**

[English](README_EN.md) | [中文](README.md) | 日本語 | [Deutsch](README_DE.md) | [FluxToken](https://fluxtoken.ai)

</div>

## Sponsor

<details open>
<summary>Recommended OpenAI-compatible multi-model gateway</summary>

[![FluxToken - OpenAI-compatible multi-model gateway](assets/fluxtoken-banner.png)](https://fluxtoken.ai)

Shefu Divination は特定のモデル提供元に依存しません。AI 推測機能は OpenAI-compatible endpoint であれば利用できます。[FluxToken](https://fluxtoken.ai) は Claude / GPT / DeepSeek などをまとめて扱えるマルチモデル API ゲートウェイです。

ページ内の AI 設定で Base URL に `https://fluxtoken.ai/v1` を入力し、FluxToken API Key とモデル名を設定してください。

</details>

## Overview

Shefu Divination は、梅花易数、八卦の象意、五行の関係を使って隠された物を推測する静的 Web アプリです。時刻、数字、文字から起卦し、複数の読みを合成して具体物、属性、推理、ローカル回測記録を表示します。

## Features

- 時刻、数字、文字による起卦。
- 複数の卦を合成する推測。
- 卦象、属性、推理過程の表示。
- OpenAI-compatible な AI 推測。
- ローカル回測と命中率記録。
- オフライン共有向けの単一 HTML ビルド。

## Preview

![Shefu Divination preview](docs/preview.png)

## Quick Start

`index.html` を直接開くか、静的サーバーを起動します。

```bash
python -m http.server 8080
```

```text
http://127.0.0.1:8080
```

## Build

```bash
npm run build
```

生成ファイル：

```text
射覆占卜.html
```

## Privacy

- デフォルトの推演エンジンはネットワークを必要としません。
- API Key はブラウザの `localStorage` のみに保存されます。
- 回測記録もブラウザの `localStorage` のみに保存されます。
- AI 推測を有効にすると、設定したモデル endpoint にリクエストが送信されます。

## License

Shefu Divination is released under the MIT License. See [LICENSE](LICENSE).


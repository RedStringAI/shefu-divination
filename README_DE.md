<div align="center">

<img src="assets/shefu-logo.svg" alt="Shefu Divination logo" width="104">

# Shefu Divination

### Eine cyber-orientalische Shefu-Web-App

[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20%2B-339933.svg)](package.json)
[![CI](https://github.com/RedStringAI/shefu-divination/actions/workflows/ci.yml/badge.svg)](https://github.com/RedStringAI/shefu-divination/actions/workflows/ci.yml)
[![OpenAI Compatible](https://img.shields.io/badge/API-OpenAI--compatible-111827.svg)](#ai-configuration)
[![Static Site](https://img.shields.io/badge/runtime-static--site-cyan.svg)](index.html)

### Official Repository: **[github.com/RedStringAI/shefu-divination](https://github.com/RedStringAI/shefu-divination)**

[English](README_EN.md) | [中文](README.md) | [日本語](README_JA.md) | Deutsch | [FluxToken](https://fluxtoken.ai)

</div>

## Sponsor

<details open>
<summary>Recommended OpenAI-compatible multi-model gateway</summary>

[![FluxToken - OpenAI-compatible multi-model gateway](assets/fluxtoken-banner.svg)](https://fluxtoken.ai)

Shefu Divination ist provider-neutral. Die optionale KI-Ratfunktion funktioniert mit jeder OpenAI-compatible endpoint. [FluxToken](https://fluxtoken.ai) ist ein Multi-Modell-Gateway für Claude, GPT, DeepSeek und weitere Modelle, mit einheitlichen API Keys, Nutzungslogs und Routing.

Trage in den AI-Einstellungen der Seite `https://fluxtoken.ai/v1` als Base URL ein und ergänze deinen FluxToken API Key sowie den Modellnamen.

</details>

## Overview

Shefu Divination ist eine statische Web-App, die Meihua Yishu, Bagua-Symbolik und Fünf-Elemente-Beziehungen nutzt, um ein verborgenes Objekt zu erraten. Die App unterstützt Zeit-, Zahlen- und Zeichen-Casting, kombiniert mehrere Lesarten und zeigt Objektvorschläge, Attribute, Begründungen und lokales Backtesting.

## Features

- Casting über Zeit, Zahlen und Zeichen.
- Synthese mehrerer Lesarten.
- Erklärbare Ausgabe mit Hexagrammen, Attributen und Begründung.
- Optionale OpenAI-compatible KI-Ratfunktion.
- Lokales Backtesting mit Trefferquote.
- Single-file Build für Offline-Nutzung.

## Preview

![Shefu Divination preview](docs/preview.png)

## Quick Start

Öffne `index.html` direkt oder starte einen statischen Server:

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

Erzeugt:

```text
射覆占卜.html
```

## Privacy

- Die Standard-Engine benötigt keinen Netzwerkzugriff.
- API Keys werden nur im Browser-`localStorage` gespeichert.
- Backtesting-Daten werden nur im Browser-`localStorage` gespeichert.
- Wenn KI-Raten aktiv ist, werden Anfragen an den konfigurierten Modell-endpoint gesendet.

## License

Shefu Divination is released under the MIT License. See [LICENSE](LICENSE).


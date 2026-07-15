# NameCatcher Agent Skills

[Agent skills](https://agentskills.io/) for valuing **collectible Telegram usernames** on TON. They give AI agents a scoring brain for the username market: namability score (0–100), fair price estimation in GRAM, and short positioning theses — via a free public API, no key required.

Built by [NameCatcher](https://t.me/NameCatcherBot) — a Telegram mini app for username investors: mint catching, market monitoring, portfolio analytics, and a scoring model validated against real Fragment sales.

## Available skills

| Skill | Description |
| ----- | ----------- |
| [names/ton-usernames](names/ton-usernames/) | Score a Telegram username 0–100, estimate its fair price in GRAM, fetch a positioning thesis, compare candidates, and run pre-purchase checks against Fragment asks |

## Installation

```bash
npx skills add productmap/namecatcher-skills --skill ton-usernames
```

Or copy manually:

```bash
cp -r names/ton-usernames ~/.claude/skills/
```

## The API behind it

One endpoint, no auth, 60 req/min per IP:

```
GET https://api-namecatcher.rocketname.com/public/score/{name}?lang=en
```

```json
{
  "username": "wearlab",
  "score": 67,
  "band": "strong",
  "fair_price_ton": 400,
  "thesis": "A crisp fusion of \"wear\" and \"lab\" …",
  "analysis_url": "https://t.me/NameCatcherBot?startapp=name_wearlab__pub_api",
  "fragment_url": "https://fragment.com/username/wearlab"
}
```

The score measures naming quality (word class, pronounceability, length, semantics) and is validated on real Fragment sales data: names scoring 90+ sell for a multiple of names scoring 80–89. See [names/ton-usernames/SKILL.md](names/ton-usernames/SKILL.md) for the full field reference and workflows.

## Links

- 🤖 Bot & mini app: [@NameCatcherBot](https://t.me/NameCatcherBot)
- 🛒 Username market: [fragment.com](https://fragment.com)
- 🧩 TON MCP ecosystem: [mcp.ton.org](https://mcp.ton.org)

## License

MIT

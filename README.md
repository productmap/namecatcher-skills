# NameCatcher — username intelligence for AI agents

Score and value **collectible Telegram usernames**: namability score (0–100) validated against 111k+ real Fragment sales, fair price estimation in GRAM, and positioning theses. Free public API — **no key, no wallet, no setup**.

Three ways to plug in, thinnest first:

| Layer | For | Install |
| ----- | --- | ------- |
| [Plain HTTP](#api-reference) | any agent that can `curl`/`fetch` | nothing |
| [Agent Skill](#agent-skill) | Claude Code / skills-compatible agents | `npx skills add productmap/namecatcher-skills` |
| [MCP server](#mcp-server) | Claude Desktop/Code, any MCP client | `npx -y namecatcher-mcp` |

Built by [NameCatcher](https://t.me/NameCatcherBot) — the Telegram mini app for username investors: mint catching, market analytics, portfolio, value passports.

## Quick try

```bash
curl -s "https://api-namecatcher.rocketname.com/public/score/wearlab?lang=en" | jq
```

```json
{
  "username": "wearlab",
  "score": 67,
  "band": "strong",
  "fair_price_ton": 400,
  "thesis": "A crisp fusion of \"wear\" and \"lab\" …",
  "lang": "en",
  "analysis_url": "https://t.me/NameCatcherBot?startapp=name_wearlab__pub_api",
  "fragment_url": "https://fragment.com/username/wearlab"
}
```

## API reference

One endpoint, no auth:

```
GET https://api-namecatcher.rocketname.com/public/score/{name}?lang={en|ru}
```

### Parameters

| Param | In | Required | Description |
| ----- | -- | -------- | ----------- |
| `name` | path | yes | Username without `@`. 4–32 chars, `a-z 0-9 _` |
| `lang` | query | no | `en` (default) or `ru` — language of `thesis` |

### Response fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `username` | string | Canonical (lowercase) username |
| `score` | int 0–100 | Namability — quality of the name as a brandable asset. Market-validated: names scoring 90+ sell for a multiple of 80–89 names |
| `band` | string | `premium` (≥80) · `strong` (≥66) · `medium` (≥50) · `weak` (<50). Below 50 is not investment-grade |
| `fair_price_ton` | number \| null | Class-based fair price estimate in GRAM (length × score class) |
| `thesis` | string \| null | Short positioning summary (why the name works, for whom). Present only for names already analyzed — `null` is not a quality signal |
| `lang` | string | Language the thesis was returned in |
| `analysis_url` | string | Full breakdown in the NameCatcher mini app |
| `fragment_url` | string | The name's page on Fragment (live market status, buy/bid) |

### Errors

| Status | Body | Meaning |
| ------ | ---- | ------- |
| 400 | `{"error":"INVALID_NAME"}` | Not a valid username string |
| 400 | `{"error":"NOT_COLLECTIBLE"}` | Valid string, but not scorable as a collectible (e.g. too short) |
| 429 | `{"error":"RATE_LIMITED","retry_after_s":n}` | Over 60 req/min per IP — wait `retry_after_s` and retry |
| 429 | `{"error":"DAILY_LIMIT","limit_per_day":1000}` | Over 1,000 req/day per IP |

### Rate limits

**60 requests/min and 1,000 requests/day per IP.** Generous for agent workflows (evaluating and comparing dozens of names); not enough for bulk scraping — that's intentional. Need more for a legitimate use case? Ping [@BrandEvangelist](https://t.me/BrandEvangelist).

### curl cookbook

```bash
# Score one name (Russian thesis)
curl -s "https://api-namecatcher.rocketname.com/public/score/morya?lang=ru" | jq '{score, band, fair_price_ton}'

# Compare candidates: pick the best of three
for n in pulsefit traintrack fitwave; do
  curl -s "https://api-namecatcher.rocketname.com/public/score/$n" | jq -c '{username, score, band}'
done | sort -t: -k2 -rn

# Pre-purchase check: is a 300 GRAM ask below class valuation?
curl -s "https://api-namecatcher.rocketname.com/public/score/vault" \
  | jq '{score, fair_price_ton, below_class: (.fair_price_ton / 300 >= 1.2)}'
```

## Agent Skill

The [`names/ton-usernames`](names/ton-usernames/) skill teaches an agent the full workflow: single-name evaluation, candidate comparison, and pre-purchase checks against Fragment asks.

```bash
npx skills add productmap/namecatcher-skills --skill ton-usernames
# or manually:
cp -r names/ton-usernames ~/.claude/skills/
```

A PR adding this skill to the official [ton-org/skills](https://github.com/ton-org/skills/pull/38) is open.

## MCP server

A thin stdio bridge over the same API — for Claude Desktop, Claude Code, and any MCP client. No key needed. Published on npm as [`namecatcher-mcp`](https://www.npmjs.com/package/namecatcher-mcp) (GitHub install `npx -y github:productmap/namecatcher-skills` also works).

**Claude Code:**

```bash
claude mcp add namecatcher -- npx -y namecatcher-mcp
```

**Claude Desktop / other MCP clients** (`mcpServers` config):

```json
{
  "mcpServers": {
    "namecatcher": {
      "command": "npx",
      "args": ["-y", "namecatcher-mcp"]
    }
  }
}
```

### Tools

| Tool | Description | Arguments |
| ---- | ----------- | --------- |
| `score_name` | Score one username: namability, band, fair price, thesis | `name`, `lang?` |
| `compare_names` | Score up to 20 candidates and rank them by score | `names[]`, `lang?` |
| `check_fragment_ask` | Compare a Fragment asking price to the class valuation → fair/ask ratio + verdict | `name`, `ask_ton` |

Environment: `NAMECATCHER_API_ORIGIN` (optional) — override the API origin.

## Notes for builders

- The score measures **naming quality**, deterministic per model version — safe to cache
- It is not demand for a specific lot: always check the live Fragment price before money decisions
- Pairs naturally with TON wallet tooling ([@ton/mcp](https://mcp.ton.org)): evaluate → then buy

## Links

- 🤖 Bot & mini app: [@NameCatcherBot](https://t.me/NameCatcherBot)
- 🛒 Username market: [fragment.com](https://fragment.com)
- 🧩 TON MCP ecosystem: [mcp.ton.org](https://mcp.ton.org)

## License

MIT

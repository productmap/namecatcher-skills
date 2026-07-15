---
name: ton-usernames
description: Use this skill when evaluating Telegram usernames as assets — checking name quality, investment score, or fair price before buying, bidding on, or minting collectible usernames on Fragment. It scores any username 0–100 (namability), estimates a fair price in GRAM, and returns a short positioning thesis when available. Also use when the user asks "is @name a good username", "what is @name worth", or wants to compare several username candidates.
user-invocable: true
disable-model-invocation: false
---

# Telegram Username Valuation (NameCatcher)

Score and value collectible Telegram usernames via the NameCatcher public API. No authentication required.

## API

One endpoint, no key:

```
GET https://api-namecatcher.rocketname.com/public/score/{name}?lang=en
```

- `{name}` — username without `@` (4–32 chars, `a-z0-9_`)
- `lang` — `en` (default) or `ru`; affects the `thesis` language

### Response

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

| Field | Meaning |
| ----- | ------- |
| `score` | Namability 0–100 — quality of the name as a brandable asset. Validated against real Fragment sales: names scoring 90+ sell for a multiple of 80–89 names. |
| `band` | `premium` (≥80), `strong` (≥66), `medium` (≥50), `weak` (<50) |
| `fair_price_ton` | Class-based fair price estimate in GRAM (by length × score class), or `null` |
| `thesis` | Short positioning summary (why this name works, for whom) — only present for names already analyzed; `null` otherwise |
| `analysis_url` | Full breakdown in the NameCatcher mini app |
| `fragment_url` | The name's page on Fragment (market status, buy/bid) |

### Errors

| Status | Body | Meaning |
| ------ | ---- | ------- |
| 400 | `{"error":"INVALID_NAME"}` | Not a valid username string |
| 400 | `{"error":"NOT_COLLECTIBLE"}` | Valid string but not scorable as a collectible (e.g. too short) |
| 429 | `{"error":"RATE_LIMITED","retry_after_s":n}` | Over 60 req/min per IP — wait and retry |

## Workflows

### Evaluate one name
1. `GET /public/score/{name}`
2. Report `score`, `band`, `fair_price_ton`; quote `thesis` if present
3. Link `analysis_url` for the full breakdown

### Compare candidates
1. Query each candidate (respect the 60 req/min limit; batch sequentially)
2. Rank by `score`; break ties with `fair_price_ton`
3. Flag `weak` (<50) candidates as not investment-grade

### Pre-purchase check (with a wallet skill)
1. Get the asking price / current bid from Fragment (`fragment_url`)
2. `GET /public/score/{name}` → compare `fair_price_ton` vs the ask
3. If fair ≥ 1.2× ask, the lot is priced below its class valuation — surface this to the user before any purchase decision

## Notes

- Scores come from a linguistic model (word class, pronounceability, length, semantics) — deterministic per model version, safe to cache
- The score measures naming quality, not market demand; always check the live Fragment price before money decisions
- `thesis` exists only for names someone already analyzed in NameCatcher — its absence is not a signal about quality
- Responses are cacheable (`Cache-Control` set); identical repeat queries may be served from CDN cache

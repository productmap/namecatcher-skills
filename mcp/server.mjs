#!/usr/bin/env node
/**
 * NameCatcher MCP server — gives AI agents a valuation brain for collectible
 * Telegram usernames. Thin bridge over the free public NameCatcher API
 * (no key, no wallet): https://api-namecatcher.rocketname.com/public/score/{name}
 *
 * Run (stdio):  npx -y github:productmap/namecatcher-skills
 * Rate limits upstream: 60 req/min and 1,000 req/day per IP.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = process.env.NAMECATCHER_API_ORIGIN ?? "https://api-namecatcher.rocketname.com";

async function scoreName(name, lang = "en") {
  const clean = String(name).trim().replace(/^@/, "").toLowerCase();
  const res = await fetch(`${API}/public/score/${encodeURIComponent(clean)}?lang=${lang}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.error ?? `HTTP ${res.status}`;
    return { username: clean, error: err };
  }
  return body;
}

const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

const server = new McpServer({ name: "namecatcher", version: "0.1.0" });

server.tool(
  "score_name",
  "Score a Telegram username as an asset: namability 0-100 (validated against real Fragment sales), quality band, fair price estimate in GRAM, and a positioning thesis when available. Use when the user asks whether a username is good, what it is worth, or before buying/minting it.",
  { name: z.string().describe("Username without @ (4-32 chars, a-z 0-9 _)"), lang: z.enum(["en", "ru"]).optional().describe("Thesis language, default en") },
  async ({ name, lang }) => text(await scoreName(name, lang ?? "en")),
);

server.tool(
  "compare_names",
  "Score several username candidates (max 20) and rank them by score. Use when choosing between name options for a brand, bot, channel or investment.",
  { names: z.array(z.string()).min(2).max(20).describe("Candidate usernames"), lang: z.enum(["en", "ru"]).optional() },
  async ({ names, lang }) => {
    const scored = [];
    for (const n of names) scored.push(await scoreName(n, lang ?? "en"));
    scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return text({
      ranking: scored.map((s) => ({ username: s.username, score: s.score ?? null, band: s.band ?? null, fair_price_ton: s.fair_price_ton ?? null, error: s.error })),
      winner: scored[0]?.error ? null : scored[0]?.username ?? null,
      note: "Names scoring below 50 are not investment-grade.",
    });
  },
);

server.tool(
  "check_fragment_ask",
  "Pre-purchase check: compare a Fragment asking price against the name's class valuation (fair price). Returns the fair/ask ratio — ratio >= 1.2 means the lot is priced below its class valuation.",
  { name: z.string().describe("Username without @"), ask_ton: z.number().positive().describe("Asking price / current bid in GRAM (TON)") },
  async ({ name, ask_ton }) => {
    const s = await scoreName(name, "en");
    if (s.error) return text(s);
    const fair = s.fair_price_ton;
    const ratio = fair && ask_ton > 0 ? Math.round((fair / ask_ton) * 100) / 100 : null;
    return text({
      username: s.username, score: s.score, band: s.band,
      fair_price_ton: fair, ask_ton, fair_to_ask_ratio: ratio,
      verdict: ratio === null ? "no fair-price reference for this name"
        : ratio >= 1.2 ? "below class valuation — favorable entry"
        : ratio >= 0.8 ? "priced around class valuation"
        : "above class valuation — needs a story beyond the class",
      fragment_url: s.fragment_url,
      note: "Always check the live Fragment page before money decisions; the score measures naming quality, not demand for this exact lot.",
    });
  },
);

await server.connect(new StdioServerTransport());

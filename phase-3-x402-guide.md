# Phase 3: x402 Endpoints — Implementation Guide

**Project:** CAIRN Gaming Vault
**Prerequisite:** Phase 1 (scaffold) and Phase 2 (gaming vault with content) complete
**Goal:** Build and deploy custom x402 paid API endpoints for gaming research, discoverable via AgentCash

---

## What You're Building

A set of paid API endpoints that wrap gaming data sources (wikis, game databases, forums, Xbox) behind the x402 payment protocol. Any x402-compatible agent — Poncho via AgentCash, Claude Code, or third-party agents — can discover and call them. You earn USDC per request.

These endpoints are the "research engine" for the vault. Instead of manually finding and copying data, you (or an agent) call an endpoint and get structured, vault-ready data back.

---

## Architecture

```
Agent (Poncho / Claude Code / third-party)
    |
    | HTTP request + x402 payment header
    v
Your x402 API (Vercel serverless functions)
    |
    |--- /api/lore/search      → Exa semantic search (gaming wikis)
    |--- /api/lore/scrape      → Firecrawl (wiki page extraction)
    |--- /api/game/lookup      → IGDB API (game metadata)
    |--- /api/community/search → StableEnrich Reddit search
    |--- /api/xbox/profile     → OpenXBL (gamertag data)
    |--- /api/xbox/achievements → OpenXBL (achievement data)
    |
    v
Structured JSON response (ready to write into vault as MDX)
```

---

## Technology Stack

| Component | Package | Purpose |
|-----------|---------|---------|
| x402 middleware | `@x402/next` | Payment handling for Next.js routes |
| x402 core | `@x402/core` | Protocol types and facilitator client |
| x402 EVM | `@x402/evm` | Base network payment scheme |
| Next.js | Already in CAIRN | API route hosting |
| Vercel | Already in CAIRN | Deployment |

### Install

```bash
bun add @x402/next @x402/core @x402/evm
```

---

## Wallet Setup

You need a wallet to receive payments. The x402 middleware routes USDC payments to your wallet address.

1. Create or use an existing EVM wallet (MetaMask, Coinbase Wallet, etc.)
2. Get your wallet address on Base network
3. Add it as an environment variable:

```env
# .env.local
X402_WALLET_ADDRESS=0xYourWalletAddressHere
```

---

## x402 Middleware Setup

### Next.js 15 (current CAIRN scaffold)

Create the payment proxy alongside your existing auth middleware. The x402 middleware intercepts routes matching your config and returns 402 if no payment header is present.

```typescript
// src/lib/x402.ts
import { withX402 } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm";

const walletAddress = process.env.X402_WALLET_ADDRESS!;

export function x402Route(
  handler: (req: Request) => Promise<Response>,
  options: { price: string; description: string }
) {
  return withX402(handler, {
    payTo: walletAddress,
    price: options.price,
    network: "base",
    scheme: new ExactEvmScheme(),
    description: options.description,
  });
}
```

This wrapper makes it easy to protect any API route — just wrap your handler function.

### Next.js 16 (if you upgrade later)

Next.js 16 replaces `middleware.ts` with `proxy.ts`. The x402 package supports both. See the [Next.js 16 migration guide](https://dev.to/shahbaz17/using-x402-next-with-nextjs-16-1me1) if you upgrade.

---

## Endpoints to Build

### Endpoint 1: `/api/lore/search`

**Purpose:** Semantic search across gaming wikis and knowledge bases.
**Upstream:** Exa AI via StableEnrich (`POST /api/exa/search` — $0.01/call)
**Your price:** $0.03/call (covers upstream + margin)

```typescript
// src/app/api/lore/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { x402Route } from "@/lib/x402";

async function handler(req: Request) {
  const { query, limit = 10 } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // Call Exa via StableEnrich for semantic search
  // Scope to gaming wikis and knowledge bases
  const exaResponse = await fetch("https://stableenrich.dev/api/exa/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `${query} site:fandom.com OR site:fextralife.com OR site:uesp.net OR site:zelda.fandom.com OR site:halopedia.org`,
      numResults: limit,
      type: "auto",
    }),
  });

  const data = await exaResponse.json();

  return NextResponse.json({
    query,
    results: data.results?.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.text?.slice(0, 300),
      score: r.score,
    })) || [],
    source: "exa",
    timestamp: new Date().toISOString(),
  });
}

export const POST = x402Route(handler, {
  price: "0.03",
  description: "Search gaming wikis and lore databases",
});
```

**What callers get back:**
```json
{
  "query": "Elden Ring Erdtree origin lore",
  "results": [
    {
      "title": "The Erdtree | Elden Ring Wiki | Fandom",
      "url": "https://eldenring.fandom.com/wiki/The_Erdtree",
      "snippet": "The Erdtree is a colossal, luminous tree...",
      "score": 0.92
    }
  ],
  "source": "exa",
  "timestamp": "2026-05-12T19:00:00Z"
}
```

---

### Endpoint 2: `/api/lore/scrape`

**Purpose:** Scrape a wiki page and return clean markdown.
**Upstream:** Firecrawl via StableEnrich (`POST /api/firecrawl/scrape` — $0.013/call)
**Your price:** $0.04/call

```typescript
// src/app/api/lore/scrape/route.ts
import { NextRequest, NextResponse } from "next/server";
import { x402Route } from "@/lib/x402";

async function handler(req: Request) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const scrapeResponse = await fetch("https://stableenrich.dev/api/firecrawl/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await scrapeResponse.json();

  return NextResponse.json({
    url,
    title: data.data?.metadata?.title || "",
    description: data.data?.metadata?.description || "",
    markdown: data.data?.markdown || "",
    source: "firecrawl",
    timestamp: new Date().toISOString(),
  });
}

export const POST = x402Route(handler, {
  price: "0.04",
  description: "Scrape a wiki page and return structured markdown",
});
```

---

### Endpoint 3: `/api/game/lookup`

**Purpose:** Look up game metadata from IGDB.
**Upstream:** IGDB API (free with Twitch developer credentials, rate-limited)
**Your price:** $0.02/call

```typescript
// src/app/api/game/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { x402Route } from "@/lib/x402";

async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ error: "title parameter is required" }, { status: 400 });
  }

  // IGDB requires Twitch OAuth token
  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );
  const { access_token } = await tokenRes.json();

  const igdbRes = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "text/plain",
    },
    body: `search "${title}"; fields name, summary, genres.name, platforms.name, first_release_date, rating, cover.url, involved_companies.company.name; limit 5;`,
  });

  const games = await igdbRes.json();

  return NextResponse.json({
    query: title,
    results: games.map((g: any) => ({
      name: g.name,
      summary: g.summary,
      genres: g.genres?.map((x: any) => x.name) || [],
      platforms: g.platforms?.map((x: any) => x.name) || [],
      releaseDate: g.first_release_date
        ? new Date(g.first_release_date * 1000).toISOString().split("T")[0]
        : null,
      rating: g.rating ? Math.round(g.rating) : null,
      coverUrl: g.cover?.url?.replace("t_thumb", "t_cover_big") || null,
      developers: g.involved_companies?.map((x: any) => x.company?.name).filter(Boolean) || [],
    })),
    source: "igdb",
    timestamp: new Date().toISOString(),
  });
}

export const GET = x402Route(handler, {
  price: "0.02",
  description: "Look up game metadata from IGDB",
});
```

---

### Endpoint 4: `/api/community/search`

**Purpose:** Search Reddit for gaming discussions, theories, guides.
**Upstream:** StableEnrich Reddit search (`POST /api/reddit/search` — $0.02/call)
**Your price:** $0.05/call

```typescript
// src/app/api/community/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { x402Route } from "@/lib/x402";

async function handler(req: Request) {
  const { query, subreddit, limit = 10 } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const redditRes = await fetch("https://stableenrich.dev/api/reddit/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: subreddit ? `${query} subreddit:${subreddit}` : query,
      limit,
    }),
  });

  const data = await redditRes.json();

  return NextResponse.json({
    query,
    subreddit: subreddit || "all",
    results: data.results?.map((r: any) => ({
      title: r.title,
      url: r.url,
      subreddit: r.subreddit,
      score: r.score,
      numComments: r.numComments || r.num_comments,
      snippet: r.selftext?.slice(0, 500) || r.body?.slice(0, 500) || "",
      created: r.created,
    })) || [],
    source: "reddit",
    timestamp: new Date().toISOString(),
  });
}

export const POST = x402Route(handler, {
  price: "0.05",
  description: "Search Reddit for gaming discussions and theories",
});
```

---

### Endpoint 5: `/api/xbox/profile`

**Purpose:** Pull Xbox profile data (gamerscore, recent games).
**Upstream:** OpenXBL API (free tier: 500 calls/day)
**Your price:** $0.02/call

```typescript
// src/app/api/xbox/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { x402Route } from "@/lib/x402";

async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const gamertag = searchParams.get("gamertag");

  if (!gamertag) {
    return NextResponse.json({ error: "gamertag parameter is required" }, { status: 400 });
  }

  // Resolve gamertag to XUID
  const searchRes = await fetch(
    `https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`,
    { headers: { "X-Authorization": process.env.OPENXBL_API_KEY! } }
  );
  const searchData = await searchRes.json();
  const xuid = searchData.people?.[0]?.xuid;

  if (!xuid) {
    return NextResponse.json({ error: "Gamertag not found" }, { status: 404 });
  }

  // Get profile
  const profileRes = await fetch(
    `https://xbl.io/api/v2/account/${xuid}`,
    { headers: { "X-Authorization": process.env.OPENXBL_API_KEY! } }
  );
  const profile = await profileRes.json();

  return NextResponse.json({
    gamertag: profile.profileUsers?.[0]?.settings?.find((s: any) => s.id === "Gamertag")?.value || gamertag,
    gamerscore: profile.profileUsers?.[0]?.settings?.find((s: any) => s.id === "Gamerscore")?.value || "0",
    accountTier: profile.profileUsers?.[0]?.settings?.find((s: any) => s.id === "AccountTier")?.value,
    avatar: profile.profileUsers?.[0]?.settings?.find((s: any) => s.id === "GameDisplayPicRaw")?.value,
    xuid,
    source: "openxbl",
    timestamp: new Date().toISOString(),
  });
}

export const GET = x402Route(handler, {
  price: "0.02",
  description: "Get Xbox profile data by gamertag",
});
```

---

### Endpoint 6: `/api/xbox/achievements`

**Purpose:** Pull achievement data for a gamertag.
**Upstream:** OpenXBL API
**Your price:** $0.03/call

```typescript
// src/app/api/xbox/achievements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { x402Route } from "@/lib/x402";

async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const gamertag = searchParams.get("gamertag");
  const titleId = searchParams.get("titleId");

  if (!gamertag) {
    return NextResponse.json({ error: "gamertag parameter is required" }, { status: 400 });
  }

  // Resolve gamertag to XUID
  const searchRes = await fetch(
    `https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`,
    { headers: { "X-Authorization": process.env.OPENXBL_API_KEY! } }
  );
  const searchData = await searchRes.json();
  const xuid = searchData.people?.[0]?.xuid;

  if (!xuid) {
    return NextResponse.json({ error: "Gamertag not found" }, { status: 404 });
  }

  // Get achievements (optionally filtered by title)
  const url = titleId
    ? `https://xbl.io/api/v2/achievements/title/${xuid}/${titleId}`
    : `https://xbl.io/api/v2/achievements/${xuid}`;

  const achRes = await fetch(url, {
    headers: { "X-Authorization": process.env.OPENXBL_API_KEY! },
  });
  const achData = await achRes.json();

  return NextResponse.json({
    gamertag,
    xuid,
    achievements: achData.achievements?.map((a: any) => ({
      name: a.name,
      description: a.description,
      gamerscore: a.rewards?.[0]?.value || 0,
      isUnlocked: a.progressState === "Achieved",
      unlockedAt: a.progression?.timeUnlocked || null,
      rarity: a.rarity?.currentPercentage || null,
      titleName: a.titleAssociations?.[0]?.name || "",
    })) || [],
    source: "openxbl",
    timestamp: new Date().toISOString(),
  });
}

export const GET = x402Route(handler, {
  price: "0.03",
  description: "Get Xbox achievements by gamertag",
});
```

---

## OpenAPI Spec (for AgentCash Discovery)

Update `api/openapi.json` so your endpoints are discoverable. This is what AgentCash indexes when agents search for tools.

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "CAIRN Gaming Research API",
    "version": "0.1.0",
    "description": "Gaming research endpoints — wiki search, page scraping, game database lookups, Reddit community search, Xbox profile and achievement data. Pay-per-call via x402."
  },
  "servers": [
    { "url": "https://your-deployment.vercel.app" }
  ],
  "paths": {
    "/api/lore/search": {
      "post": {
        "summary": "Search gaming wikis and lore databases for a topic",
        "description": "Semantic search scoped to gaming wikis (Fandom, Fextralife, Halopedia, UESP, etc). Returns ranked results with titles, URLs, and snippets.",
        "x-x402-price": "0.03",
        "x-x402-network": "base",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["query"],
                "properties": {
                  "query": { "type": "string", "description": "Search query — game name, lore topic, character, etc." },
                  "limit": { "type": "integer", "default": 10, "description": "Max results to return" }
                }
              }
            }
          }
        }
      }
    },
    "/api/lore/scrape": {
      "post": {
        "summary": "Scrape a wiki page and return clean markdown",
        "description": "Given a URL (typically a wiki page), scrapes the content and returns clean markdown with metadata. Strips ads, navigation, and scripts.",
        "x-x402-price": "0.04",
        "x-x402-network": "base",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["url"],
                "properties": {
                  "url": { "type": "string", "description": "URL to scrape" }
                }
              }
            }
          }
        }
      }
    },
    "/api/game/lookup": {
      "get": {
        "summary": "Look up game metadata from IGDB",
        "description": "Search IGDB for a game by title. Returns name, summary, genres, platforms, release date, rating, cover art, and developers.",
        "x-x402-price": "0.02",
        "x-x402-network": "base",
        "parameters": [
          { "name": "title", "in": "query", "required": true, "schema": { "type": "string" } }
        ]
      }
    },
    "/api/community/search": {
      "post": {
        "summary": "Search Reddit for gaming discussions and theories",
        "description": "Search Reddit for posts about a gaming topic. Optionally filter by subreddit. Returns titles, URLs, scores, and snippets.",
        "x-x402-price": "0.05",
        "x-x402-network": "base",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["query"],
                "properties": {
                  "query": { "type": "string" },
                  "subreddit": { "type": "string", "description": "Optional subreddit filter" },
                  "limit": { "type": "integer", "default": 10 }
                }
              }
            }
          }
        }
      }
    },
    "/api/xbox/profile": {
      "get": {
        "summary": "Get Xbox profile data by gamertag",
        "description": "Returns gamerscore, account tier, avatar, and XUID for a given gamertag.",
        "x-x402-price": "0.02",
        "x-x402-network": "base",
        "parameters": [
          { "name": "gamertag", "in": "query", "required": true, "schema": { "type": "string" } }
        ]
      }
    },
    "/api/xbox/achievements": {
      "get": {
        "summary": "Get Xbox achievements by gamertag",
        "description": "Returns achievement list with names, descriptions, gamerscore, unlock status, rarity, and dates. Optionally filter by title ID.",
        "x-x402-price": "0.03",
        "x-x402-network": "base",
        "parameters": [
          { "name": "gamertag", "in": "query", "required": true, "schema": { "type": "string" } },
          { "name": "titleId", "in": "query", "required": false, "schema": { "type": "string" } }
        ]
      }
    }
  }
}
```

---

## Environment Variables

Add these to your `.env.local` and Vercel project settings:

```env
# x402 payment destination
X402_WALLET_ADDRESS=0xYourBaseWalletAddress

# IGDB (get from dev.twitch.tv)
IGDB_CLIENT_ID=your_twitch_client_id
IGDB_CLIENT_SECRET=your_twitch_client_secret

# OpenXBL (get from xbl.io)
OPENXBL_API_KEY=your_openxbl_api_key

# StableEnrich calls are paid via x402 — no API key needed
# (Poncho/AgentCash handles payment automatically)
```

### Getting API Keys

| Service | Where to get it | Free tier |
|---------|----------------|-----------|
| IGDB | [dev.twitch.tv](https://dev.twitch.tv/console/apps) — register an app | Yes — generous rate limits |
| OpenXBL | [xbl.io](https://xbl.io) — sign up, get API key | Yes — 500 calls/day |
| Exa (via StableEnrich) | No key needed — x402 payment | Pay per call ($0.01) |
| Firecrawl (via StableEnrich) | No key needed — x402 payment | Pay per call ($0.013) |
| Reddit (via StableEnrich) | No key needed — x402 payment | Pay per call ($0.02) |

---

## Upstream Cost vs. Your Price

| Endpoint | Upstream cost | Your price | Margin |
|----------|-------------|------------|--------|
| `/api/lore/search` | $0.01 (Exa) | $0.03 | $0.02 |
| `/api/lore/scrape` | $0.013 (Firecrawl) | $0.04 | $0.027 |
| `/api/game/lookup` | Free (IGDB) | $0.02 | $0.02 |
| `/api/community/search` | $0.02 (Reddit) | $0.05 | $0.03 |
| `/api/xbox/profile` | Free (OpenXBL) | $0.02 | $0.02 |
| `/api/xbox/achievements` | Free (OpenXBL) | $0.03 | $0.03 |

Margins are thin but these are micropayments — volume is the play if external agents adopt them.

---

## Calling Upstream x402 APIs from Your Endpoints

When your endpoint calls StableEnrich (Exa, Firecrawl, Reddit), those are themselves x402-gated. Your serverless function needs to pay them. Options:

### Option A: Use a server-side x402 client

```bash
bun add @x402/fetch
```

```typescript
import { wrapFetch } from "@x402/fetch";
import { createWalletClient } from "viem";

const x402Fetch = wrapFetch(fetch, {
  walletClient: yourServerWallet, // funded wallet for upstream calls
});

// Use x402Fetch instead of fetch for upstream x402 APIs
const res = await x402Fetch("https://stableenrich.dev/api/exa/search", {
  method: "POST",
  body: JSON.stringify({ query }),
});
```

### Option B: Use non-x402 alternatives for upstream

- IGDB and OpenXBL are free APIs with API keys — no x402 needed
- For scraping, you could use Firecrawl directly with an API key instead of via StableEnrich
- For search, you could use Exa directly with an API key

Option B is simpler to start with. You can migrate to x402 upstream later.

---

## Testing

### Test locally with curl

```bash
# Won't pay — will get 402 response showing the price
curl -X POST http://localhost:3000/api/lore/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Elden Ring Erdtree lore"}'

# Response: HTTP 402 with x402 payment spec
```

### Test with Poncho

Once deployed to Vercel, ask Poncho:

> "Search my CAIRN gaming research API for Elden Ring Erdtree lore"

Poncho will discover the endpoint via AgentCash, pay via x402, and return the results.

### Test with Claude Code

```
"Use the /api/lore/search endpoint at https://your-deployment.vercel.app to search for Halo Covenant war timeline, then write the results into a vault lore entry"
```

---

## Deployment Checklist

1. [ ] Install x402 packages: `bun add @x402/next @x402/core @x402/evm`
2. [ ] Create `src/lib/x402.ts` with the wrapper function
3. [ ] Build all 6 endpoint route files
4. [ ] Set environment variables in Vercel project settings
5. [ ] Update `api/openapi.json` with full endpoint specs
6. [ ] Deploy to Vercel
7. [ ] Test 402 response locally (no payment)
8. [ ] Test with Poncho via AgentCash (with payment)
9. [ ] Verify OpenAPI spec is discoverable
10. [ ] Update CAIRN README with endpoint documentation

---

## Build Order (Recommended)

Start with the two endpoints that have the simplest upstream (free APIs, API-key auth):

1. **`/api/game/lookup`** — IGDB is free and well-documented. Good first endpoint to get x402 middleware working.
2. **`/api/xbox/profile`** — OpenXBL is free tier. Proves the pattern with a second endpoint.
3. **`/api/community/search`** — First endpoint hitting an x402 upstream (StableEnrich Reddit).
4. **`/api/lore/search`** — Exa via StableEnrich. Same upstream pattern.
5. **`/api/lore/scrape`** — Firecrawl via StableEnrich. Same pattern.
6. **`/api/xbox/achievements`** — OpenXBL again, richer data.

Each endpoint follows the same structure: validate input, call upstream, transform response, return JSON. Once endpoint 1 works end-to-end, the rest are fast.

---

## References

- [@x402/next on npm](https://www.npmjs.com/package/@x402/next)
- [x402 GitHub repo](https://github.com/coinbase/x402)
- [x402 Protocol Guide](https://simplescraper.io/blog/x402-payment-protocol)
- [Next.js 16 + x402 Guide](https://dev.to/shahbaz17/using-x402-next-with-nextjs-16-1me1)
- [IGDB API docs](https://api-docs.igdb.com/)
- [OpenXBL API docs](https://xbl.io/docs)
- [StableEnrich (Exa, Firecrawl, Reddit)](https://stableenrich.dev)

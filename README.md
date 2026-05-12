# CAIRN

The Curated Archive of Interactive Records and Notes

A private, personal digital vault that organizes an entire domain of your life into a single searchable, browsable dashboard. Notes, records, research, media, and memories — structured by you, for you. Deployed on Vercel, version-controlled on GitHub, maintained by Claude Code, enriched by x402-powered research endpoints, and editable by hand whenever you want. It's a personal knowledge base with an AI-powered research engine behind it.

Great for gaming. Great for cooking. Great for journaling. Great for any domain where you accumulate knowledge, track progress, and want a private, organized, searchable home for all of it.

Domain Examples
Domain	What the vault holds	What x402 endpoints research
Gaming	Achievements, lore, head-canon, console history, scores, session journals	Wiki scraping, forum theories, game databases, achievement guides, Xbox API
Cooking	Recipes, ingredient notes, meal plans, technique journals, flavor pairings	Recipe databases, nutrition APIs, restaurant menus, food science forums
Journaling	Daily entries, reflections, goals, mood tracking, life milestones	Weather history, news archives, location data, calendar integration
Fitness	Workout logs, PRs, programs, nutrition, body measurements	Exercise databases, nutrition APIs, program generators
Music	Listening logs, album reviews, concert history, gear collection, practice notes	Discogs, Spotify stats, setlist archives, music theory resources
Reading	Book notes, quotes, reading lists, author research, annotations	Goodreads, OpenLibrary, author interviews, literary criticism
Travel	Trip journals, itineraries, photos, restaurant reviews, packing lists	Flight data, hotel reviews, local guides, weather forecasts
Woodworking / Maker	Project logs, tool inventory, material notes, techniques, plans	Supplier databases, wood databases, technique tutorials, plan archives
The vault pattern is the same every time. The content, x402 endpoints, and Claude skills change per domain.

The Pattern


[Your Knowledge]
      |
      v
  MDX Files in GitHub (structured notes, entries, records)
      |
      v
  Next.js Dashboard on Vercel (private, password-protected)
      |
      |--- In-browser editor for live note-taking
      |--- Cached JSON for live API data
      |--- Search, filter, browse across all content
      |
      v
  Maintained by:
      |--- You (edit markdown by hand, in-browser, or in any editor)
      |--- Claude Code (edit files, commit, push — via skills)
      |--- Poncho (call x402 endpoints via AgentCash, write results to vault)

  Enriched by:
      |--- x402 Endpoints (domain-specific research APIs you build and deploy)
      |--- Claude Skills (workflow recipes that chain endpoint calls into tasks)
Infrastructure You'll Need
Hardware
Component	What	Why
Computer	Any machine that runs Claude Code (Mac, Linux, WSL on Windows)	Claude Code operates locally on your repo — editing files, running skills, committing to GitHub. This is your primary workstation.
Internet	Stable connection	Pushing to GitHub, deploying on Vercel, calling x402 endpoints, using Poncho — all require network access.
Accounts & Services
Service	What it does	Cost
GitHub	Hosts the vault repo. Source of truth for all content.	Free (private repos included)
Vercel	Deploys the Next.js dashboard. Auto-builds on push to main.	Free tier covers most personal projects. Pro ($20/mo) for password protection via Vercel Auth if you go that route.
Domain (optional)	Custom domain for your vault (e.g. vault.fishmug.dev)	~$10-15/year via Namecheap, Cloudflare, etc.
AI & Agent Layer
Service	What it does	Cost
Claude Code	Your primary tool for building and maintaining the vault. Edits MDX files, runs skills, commits and pushes, builds features, fixes bugs. Operates locally on the repo.	Claude Pro/Max subscription
Poncho	Chat-based agent that can call your x402 endpoints via AgentCash. Good for research tasks, quick lookups, and vault updates without opening a terminal.	Poncho Pro plan
Claude API (optional)	If you add an in-dashboard AI chat feature later. Powers the LLM layer inside the vault itself.	Pay-per-token via Anthropic
x402 Endpoint Infrastructure
Component	What it does	Cost
Vercel (serverless functions)	Hosts your x402 API endpoints as serverless functions. Same platform as the vault — one ecosystem.	Free tier for low volume. Usage-based beyond that.
x402 middleware	Handles payment protocol on your endpoints. Callers pay per request, you receive revenue.	Part of x402 protocol — no separate cost
Upstream APIs	The data sources your endpoints wrap: Firecrawl (scraping), IGDB/RAWG (game data), Reddit API, Xbox/OpenXBL, etc.	Varies — some free, some pay-per-call. Your x402 pricing covers these costs + margin.
OpenAPI spec	Makes your endpoints discoverable via AgentCash search. Agents can find and call your endpoints without manual configuration.	Free — just a JSON/YAML file you write
Development Tools
Tool	What it does	Cost
Node.js / Bun	Runtime for Next.js and serverless functions	Free
VS Code or any editor	For when you want to edit vault content or code by hand	Free
Git	Version control — every vault change is a commit	Free
Tailwind CSS	Styling the dashboard	Free
Infrastructure Diagram


┌─────────────────────────────────────────────────────────┐
│                    YOU (Brian)                           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Browser  │  │ Claude   │  │ Poncho   │              │
│  │ (editor) │  │ Code     │  │ (chat)   │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼──────────────┼─────────────┼────────────────────┘
        │              │             │
        │ GitHub API   │ git push    │ AgentCash fetch
        │              │             │
        v              v             v
┌──────────────┐  ┌──────────────────────────────────┐
│   GitHub     │  │   x402 Gaming Research API       │
│   (repo)     │  │   (Vercel serverless)            │
│              │  │                                  │
│  vault/      │  │  /lore/search    /game/lookup    │
│    lore/     │  │  /lore/scrape    /game/achieve.  │
│    library/  │  │  /community/search               │
│    headcanon/│  │  /xbox/profile   /xbox/achieve.  │
│    journal/  │  │                                  │
│    ...       │  │  Wraps: Firecrawl, IGDB, RAWG,   │
│              │  │  Reddit, Xbox API, etc.           │
└──────┬───────┘  └──────────────────────────────────┘
       │
       │ auto-deploy on push
       v
┌──────────────┐
│   Vercel     │
│   (dashboard)│
│              │
│  Next.js app │
│  Password    │
│  protected   │
│              │
│  Your private│
│  vault UI    │
└──────────────┘
What Makes This Pattern Powerful
Content is just files. MDX in a git repo. No database, no vendor lock-in. You can read your vault with cat. You can edit it with Vim. You can move it anywhere.
AI operates on plain text. Claude Code doesn't need a special API to update your vault. It reads markdown, writes markdown, and pushes to git. The simplest possible interface.
Research is a paid service. Your x402 endpoints aren't just for you — they're a real API that any agent can discover and pay to use. The infrastructure pays for itself.
Skills encode your workflows. Instead of remembering "first scrape the wiki, then search Reddit, then format as MDX" — you define it once as a skill. /research-lore Elden Ring and the whole chain runs.
Poncho bridges chat and code. You don't always want to open a terminal. Poncho can call your x402 endpoints, draft vault entries, and push to GitHub — all in a chat conversation.
It deploys like a website. Push to GitHub, Vercel builds, you see it in your browser. No servers to manage, no Docker, no SSH.
The pattern is repeatable. Gaming vault today, cooking vault tomorrow, journaling vault next week. Same infra, same skills pattern, different content and endpoints.

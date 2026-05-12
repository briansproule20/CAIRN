# CAIRN

## The Curated Archive of Interactive Records and Notes

A private, personal digital vault that organizes an entire domain of your life into a single searchable, browsable dashboard. Notes, records, research, media, and memories — structured by you, for you. Deployed on Vercel, version-controlled on GitHub, maintained by Claude Code, enriched by x402-powered research endpoints, and editable by hand whenever you want. It's a personal knowledge base with an AI-powered research engine behind it.

**Great for gaming. Great for cooking. Great for journaling. Great for any domain where you accumulate knowledge, track progress, and want a private, organized, searchable home for all of it.
**

## Domain Examples
**Gaming**	Achievements, lore, head-canon, console history, scores, session journals	Wiki scraping, forum theories, game databases, achievement guides, Xbox API

**Cooking**	Recipes, ingredient notes, meal plans, technique journals, flavor pairings	Recipe databases, nutrition APIs, restaurant menus, food science forums

**Journaling**	Daily entries, reflections, goals, mood tracking, life milestones	Weather history, news archives, location data, calendar integration

**Fitness**	Workout logs, PRs, programs, nutrition, body measurements	Exercise databases, nutrition APIs, program generators

**Music	Listening** logs, album reviews, concert history, gear collection, practice notes	Discogs, Spotify stats, setlist archives, music theory resources

**Reading**	Book notes, quotes, reading lists, author research, annotations	Goodreads, OpenLibrary, author interviews, literary criticism

**Travel**	Trip journals, itineraries, photos, restaurant reviews, packing lists	Flight data, hotel reviews, local guides, weather forecasts

**Woodworking / Maker**	Project logs, tool inventory, material notes, techniques, plans	Supplier databases, wood databases, technique tutorials, plan archives

# What Makes This Pattern Powerful

Content is just files. MDX in a git repo. No database, no vendor lock-in. You can read your vault with cat. You can edit it with Vim. You can move it anywhere.
AI operates on plain text. Claude Code doesn't need a special API to update your vault. It reads markdown, writes markdown, and pushes to git. The simplest possible interface.
Research is a paid service. Your x402 endpoints aren't just for you — they're a real API that any agent can discover and pay to use. The infrastructure pays for itself.
Skills encode your workflows. Instead of remembering "first scrape the wiki, then search Reddit, then format as MDX" — you define it once as a skill. /research-lore Elden Ring and the whole chain runs.
Poncho bridges chat and code. You don't always want to open a terminal. Poncho can call your x402 endpoints, draft vault entries, and push to GitHub — all in a chat conversation.
It deploys like a website. Push to GitHub, Vercel builds, you see it in your browser. No servers to manage, no Docker, no SSH.
The pattern is repeatable. Gaming vault today, cooking vault tomorrow, journaling vault next week. Same infra, same skills pattern, different content and endpoints.


## How It Works

Content lives as MDX files in this repo, organized by category. A Next.js dashboard renders them into a private, password-protected web app. You edit content three ways:

- **By hand** — write markdown in any editor, commit, push
- **Claude Code** — AI edits files, runs skills, commits and pushes
- **In-browser** — live editor built into the dashboard, commits to GitHub on save

Custom x402 endpoints power a research layer — domain-specific paid APIs that any x402-compatible agent can call to pull in data, scrape sources, and enrich your vault.

## Architecture

```
You ─── Browser (editor) ──── GitHub API ────┐
  │                                          │
  ├── Claude Code ──── git push ─────────────┤
  │                                          v
  └── Poncho ──── AgentCash fetch ──┐    GitHub (repo)
                                    │        │
                              x402 Research  │ auto-deploy
                              Endpoints      │
                                             v
                                        Vercel (dashboard)
```

## Stack

| Layer | Technology |
|-------|-----------|
| Content | MDX files with YAML frontmatter |
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Version Control | Git + GitHub |
| Auth | Password middleware (env var) |
| Research | Custom x402 endpoints (Vercel serverless) |
| AI Maintenance | Claude Code + Claude Skills |
| Agent Access | Poncho via AgentCash |

## Project Structure

```
vault/
  [category]/
    [entry].mdx          # content entries with frontmatter
public/
  data/
    [source].json         # cached API data
src/
  app/                    # Next.js pages and layouts
  components/             # dashboard UI components
  lib/                    # utilities, MDX parsing, API clients
api/
  [domain]/               # x402 endpoint serverless functions
.claude/
  skills/                 # Claude Code skill definitions
```

## Content Format

Every vault entry is an MDX file with structured frontmatter:

```mdx
---
title: Entry Title
category: lore
tags: [tag-one, tag-two]
status: draft | published
created: 2026-05-12
updated: 2026-05-12
---

Your content here. Markdown with optional JSX components.
```

## x402 Research Endpoints

Custom paid API endpoints that wrap domain-specific data sources behind the x402 payment protocol. Any x402-compatible agent can discover and call them.

Endpoints are defined with an OpenAPI spec for discoverability via AgentCash search.


## Claude Skills

Reusable workflows that chain x402 endpoint calls into high-level tasks.


## Infrastructure

### Required

- **GitHub** — hosts the repo (free)
- **Vercel** — deploys the dashboard + x402 endpoints (free tier)
- **Claude Code** — builds and maintains the vault (Claude subscription)

### Optional

- **Poncho** — chat-based vault updates via AgentCash (Poncho Pro)
- **Custom domain** — e.g. `vault.yourdomain.dev`
- **Claude API** — for in-dashboard AI chat features
- **Upstream APIs** — data sources your x402 endpoints wrap (varies)

## The Pattern

This vault architecture is domain-agnostic. The same structure works for gaming, cooking, journaling, fitness, music, reading, travel, or any domain where you accumulate knowledge and want a private, organized, searchable home for it.

What changes per domain:
- Content categories and frontmatter fields
- x402 endpoints and the upstream APIs they wrap
- Claude skills and the workflows they define
- Dashboard widgets and visualizations

What stays the same:
- MDX files in GitHub
- Next.js + Vercel deployment
- Password-protected access
- Claude Code + Poncho as maintainers
- x402 as the research layer
- Claude skills as workflow automation

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/vault.git
cd vault

# Install dependencies
bun install

# Set environment variables
cp .env.example .env.local
# Add: VAULT_PASSWORD, API keys for x402 upstream services

# Run locally
bun dev

# Deploy
git push origin main
# Vercel auto-deploys on push
```

## License

Private. Not open source.


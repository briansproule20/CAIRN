# CAIRN — Curated Archive of Interactive Records and Notes

## What This Is

A private personal knowledge vault. MDX content organized by category, rendered as a Next.js dashboard, deployed on Vercel.

## Project Structure

- `vault/` — all content lives here as `.mdx` files organized by category folders
- `src/` — Next.js app (App Router), components, and utilities
- `api/` — x402 endpoint scaffolding and OpenAPI spec
- `.claude/skills/` — Claude Code skill definitions

## How to Add Content

Create an MDX file in `vault/[category]/[slug].mdx` with this frontmatter:

```yaml
---
title: Entry Title
category: category-name
tags: [tag1, tag2]
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

## Conventions

- Category folder names: lowercase, hyphenated (e.g. `head-canon`)
- Entry filenames: lowercase, hyphenated, `.mdx` extension
- Tags: lowercase, no spaces
- Status: `draft` or `published`
- Always set `updated` when modifying an entry
- Commit messages: "[Action] [title] in [category]" (e.g. "Add timeline to lore")

## Commands

- `bun dev` — local development server
- `bun run build` — production build
- `git push origin main` — triggers Vercel deployment

## Skills

- `/research-topic [topic] --category [cat]` — research and write entries using x402 endpoints
- `/new-entry [title] --category [cat]` — create a new vault entry
- `/update-vault [category]` — refresh entries from upstream sources

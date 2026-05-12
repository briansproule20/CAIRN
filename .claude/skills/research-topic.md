# /research-topic

Research a topic using x402 endpoints and write structured MDX entries into the vault.

## Usage

```
/research-topic [topic] --category [category]
```

## Workflow

1. Call the x402 `/api/source/search` endpoint with the topic query
2. For the top results, call `/api/source/scrape` to extract full content
3. Call `/api/community/search` to find discussions and community perspectives
4. Synthesize the results into one or more MDX entries with proper frontmatter
5. Write the entries to `vault/[category]/`
6. Commit with message: "Add [topic] research to [category]"

## Entry Template

```mdx
---
title: [Topic Title]
category: [category]
tags: [derived from content]
status: draft
created: [today]
updated: [today]
sources:
  - [url1]
  - [url2]
---

[Synthesized content]
```

## Notes

- Always include source URLs in frontmatter
- Set status to "draft" — user reviews before publishing
- If the topic spans multiple subtopics, create separate entries and cross-link them
- Prefer depth over breadth — one thorough entry beats five shallow ones

# /new-entry

Create a new vault entry from a prompt.

## Usage

```
/new-entry [title] --category [category] --tags [tag1, tag2]
```

## Workflow

1. Determine category — use provided flag or ask
2. Generate the MDX file with frontmatter and content
3. Write to `vault/[category]/[slugified-title].mdx`
4. Commit with message: "Add [title] to [category]"

## Frontmatter Template

```yaml
---
title: [Title]
category: [category]
tags: [tags]
status: draft
created: [today]
updated: [today]
---
```

## Notes

- Slugify the title for the filename: lowercase, hyphens, no special chars
- If no content is provided, create a skeleton with section headers
- Always set status to draft

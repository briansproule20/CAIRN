# /update-vault

Refresh vault entries by re-pulling data from x402 endpoints.

## Usage

```
/update-vault [category] [--all]
```

## Workflow

1. Read existing entries in the target category
2. For entries with `sources` in frontmatter, re-scrape via `/api/source/scrape`
3. Diff new content against existing content
4. Update entries where content has changed
5. Update the `updated` field in frontmatter
6. Commit with message: "Update [category] — refreshed [n] entries"

## Notes

- Only update entries that have actually changed
- Preserve any manual edits — merge upstream changes, don't overwrite
- If `--all` flag is passed, refresh all categories
- Log which entries were updated and which were unchanged

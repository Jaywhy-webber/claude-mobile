The merge is complete. Emit a single `<output>` block as the **last thing** in your response. No further changes after this point.

```json
<output>
{
  "comment": "Markdown body to post as a PR comment describing the merge resolution."
}
</output>
```

The comment is the only safety net for the human author — write it clearly enough that they can review the merge decisions in ~30 seconds. Include:
- Which files had conflicts
- How each was resolved (and why, if non-obvious)
- Any concerns (failed type checks, unclear intent) with references to commit IDs or file locations

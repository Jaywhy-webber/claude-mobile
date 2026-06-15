The architecture review is complete. Emit a single `<output>` block as the **last thing** in your response. No further exploration or modifications after this point.

**When a PRD is proposed:**
```json
<output>
{
  "status": "proposed",
  "title": "Short PRD title under 256 chars",
  "body": "Full PRD body in Markdown",
  "oneLineSummary": "One-line summary of the opportunity",
  "candidatesConsidered": ["candidate 1", "candidate 2"]
}
</output>
```

**When skipping (all candidates already covered):**
```json
<output>
{
  "status": "skipped",
  "reason": "Brief explanation of why no new proposal is needed"
}
</output>
```

Only `proposed` or `skipped` are valid statuses. Do not add extra fields.

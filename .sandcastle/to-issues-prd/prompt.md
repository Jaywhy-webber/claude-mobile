# TASK

Break PRD #{{PRD_NUMBER}} — "{{PRD_TITLE}}" — into implementation slices.

Read the PRD:
```
gh issue view {{PRD_NUMBER}} --comments
```

# SLICING RULES

Break the PRD into **tracer-bullet vertical slices** — thin cuts spanning all layers (schema, API, UI, tests) rather than horizontal layer-by-layer work.

Each slice must:
- Be **independently completable** within a single agent session
- Deliver **narrow but complete** end-to-end functionality
- Be **independently demonstrable** or verifiable
- Be listed in **dependency order** (earlier slices unblock later ones)
- Require **no further subdivision**

Start with any necessary prefactoring (schema migrations, shared utilities) before feature slices.

# OUTPUT FORMAT

Emit a single `<output>` block containing an ordered array of slices:

```json
<output>
{
  "slices": [
    {
      "title": "Short imperative title",
      "whatToBuild": "2-3 paragraph prose describing the complete behavior, edge cases, and how it fits the larger PRD",
      "acceptanceCriteria": [
        "Concrete, checkable outcome 1",
        "Test coverage for X",
        "..."
      ]
    }
  ]
}
</output>
```

Do **not** include `Closes` directives in sub-issue bodies — the wrapper script handles PRD closure.

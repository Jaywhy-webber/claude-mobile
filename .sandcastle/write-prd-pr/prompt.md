# TASK

Write the title and description for a pull request for PRD #{{PRD_NUMBER}}: {{PRD_TITLE}}.

The implementation is already done — commits sit on the feature branch. You are NOT implementing anything. You are summarising work that already exists.

# CONTEXT

Read the PRD and all its sub-issues:
```
gh issue view {{PRD_NUMBER}} --comments
gh api repos/$GH_REPO/issues/{{PRD_NUMBER}}/sub_issues
```

Read what changed on the branch:
```
git log main..HEAD --reverse
git diff main..HEAD --stat
```

# OUTPUT

Emit a single `<output>` block as the **last thing** in your response:

```json
<output>
{
  "prTitle": "feat: short imperative summary under 70 chars",
  "prDescription": "## Summary\n\nOverall intent of the PRD.\n\n## Sub-issues implemented\n\n- #N title\n- #N title\n\nCloses #{{PRD_NUMBER}}"
}
</output>
```

- `prTitle` must be a single line, under 70 characters, conventional-commit style.
- `prDescription` must include `Closes #{{PRD_NUMBER}}` so the PR closes the PRD on merge.
- List all implemented sub-issues with their numbers and titles.

# TASK

You are addressing review feedback on PR #{{PR_NUMBER}} (branch `{{BRANCH}}`).

Linked issue: #{{ISSUE_NUMBER}} — {{ISSUE_TITLE}}

<pr-comments>
{{PR_COMMENTS_JSON}}
</pr-comments>

# YOUR JOB

For each item in `<pr-comments>`:
1. **Classify** it: does it require a code change, a reply, or can it be ignored (noise/resolved already)?
2. **Act**:
   - Code change → implement it, commit, then reply confirming what you did.
   - Needs a reply only → reply without changing code.
   - Ignore → skip.

# CONTEXT

Read `CONTEXT.md` and any relevant ADRs under `docs/adr/` before making changes.

Read the full diff: `git diff main...HEAD`

# EXECUTION

Before and after any changes: `npm run typecheck`. Run `npm run test` if you want more confidence.

Commit changes in one or more conventional-commit commits. Do not push.

# OUTPUT

After acting on all feedback, emit a single `<output>` block with:
- Replies to unresolved thread comments (`threadReplies`)
- Any new inline annotations you want to add (`newInlineComments`)
- Any top-level PR comments (`topLevelComments`)

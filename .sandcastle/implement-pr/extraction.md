Your work on the PR feedback is complete. Emit a single `<output>` block as the **last thing** in your response. No further code changes after this point.

```json
<output>
{
  "threadReplies": [
    { "commentId": "PRRC_xxx", "body": "markdown reply" }
  ],
  "newInlineComments": [
    { "path": "src/foo.ts", "line": 42, "body": "markdown comment" }
  ],
  "topLevelComments": [
    { "body": "markdown comment" }
  ]
}
</output>
```

Rules:
- `threadReplies`: use only `commentId` values you were shown in `<pr-comments>`. Do not invent IDs.
- `newInlineComments`: `line` must be an integer on an actual diff line in HEAD. `path` is relative.
- `topLevelComments`: for general PR-level observations.
- All three arrays are optional — omit or use `[]` if nothing to report.
- If nothing at all to report: `{ "threadReplies": [], "newInlineComments": [], "topLevelComments": [] }`
- Do not add extra fields.

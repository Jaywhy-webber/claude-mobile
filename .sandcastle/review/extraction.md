Emit a single `<output>` block as the **last thing** in your response. No further code changes after this point.

```json
<output>
{
  "summary": "1–3 markdown paragraphs explaining what was reviewed and why",
  "inlineComments": [
    {
      "path": "relative/file/path.ts",
      "line": 42,
      "body": "markdown comment text"
    }
  ],
  "replies": [
    {
      "commentId": "PRRC_xxx",
      "body": "markdown reply text"
    }
  ]
}
</output>
```

Rules:
- `summary` is required and must be non-empty.
- `inlineComments` defaults to `[]` if there are none.
- `replies` defaults to `[]` if there are none.
- `line` must be an integer matching a line in the current HEAD diff — the workflow validates this and drops anchors outside the diff silently.
- `commentId` must be a real ID from the `<pr-comments>` block above — do not invent IDs.
- Do not add any fields outside this schema (`verdict`, `file`, `lineRange`, `comment` will be rejected).

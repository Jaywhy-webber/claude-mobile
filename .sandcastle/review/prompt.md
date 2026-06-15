# TASK

Review PR #{{PR_NUMBER}} (branch `{{BRANCH}}`).

Linked issue: #{{ISSUE_NUMBER}} — {{ISSUE_TITLE}}

<pr-comments>
{{PR_COMMENTS_JSON}}
</pr-comments>

# PHASES

## 1. Diff analysis

Read the diff (`git diff main...HEAD`). Look for:
- Fragile logic or unchecked assumptions
- Type safety issues
- Suspicious patterns — write a quick test to verify they can break, then fix them

## 2. Spec verification

Confirm the implementation matches the linked issue requirements:
- Walk through each stated outcome in the code
- Flag unrequested refactors or scope creep
- Validate interpretation of ambiguous requirements
- For PRDs with sub-issues: closed items reflected, open items not implemented

## 3. Edge case testing

Stress-test with boundary conditions: empty collections, null values, negative numbers, off-by-one errors.

## 4. Code quality

- Reduce nesting and complexity
- Eliminate redundancy
- Improve naming clarity
- Follow project standards in `.sandcastle/CODING_STANDARDS.md`

## 5. Standards compliance

Read `.sandcastle/CODING_STANDARDS.md` and ensure the code follows it.

# COMMENT RESOLUTION

For unresolved threads in `<pr-comments>`, choose one:
- **Address**: implement the requested change and explain
- **Decline**: refuse with substantive reasoning
- **Defer**: skip non-review noise

# EXECUTION

Run `npm run typecheck` before and after making changes. Run `npm run test` if you want stronger confidence.

If you make changes, commit them as a single squashed commit with message `RALPH: Review - <short description>`.

# OUTPUT

After making changes (or deciding none are needed), emit a single `<output>` block with your review summary and any inline comments or replies.

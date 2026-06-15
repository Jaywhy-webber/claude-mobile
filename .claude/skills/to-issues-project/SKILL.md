---
name: to-issues-project
description: Break a PRD into native GitHub sub-issues attached to the parent PRD. Project-local variant of /to-issues, adapted for this repo's PRD-as-parent + native sub-issues + agent:implement multi-session workflow. Argument is the parent PRD issue number.
---

# To Issues (project)

Break a parent PRD into a flat list of native GitHub sub-issues, in execution order. Each sub-issue is a tracer-bullet vertical slice that the PRD-mode `agent:implement` workflow will pick up one at a time.

## Inputs

- **Argument:** the parent PRD's issue number. If the user invoked the skill without one, ask for it (or for a URL).
- **Conversation context** (optional): any planning that's already happened. Use it.

## Process

### 1. Fetch the PRD

```
gh issue view <PRD_NUMBER> --comments
```

Read the body carefully. The PRD is the spec. Don't add scope; don't redesign. If the PRD is ambiguous, ask the user to clarify _before_ drafting slices.

### 2. Confirm there are no existing sub-issues

```
gh api repos/$GH_REPO/issues/<PRD_NUMBER>/sub_issues --jq 'length'
```

If non-zero, stop and ask the user whether to (a) abort, (b) add more on top of what's there, or (c) close/delete the existing ones first. Don't silently double up.

### 3. Explore the codebase (optional)

If you haven't already, explore the repo to understand the area you're touching. Use `CONTEXT.md` and ADRs under `docs/adr/`. Sub-issue titles and bodies should use the project's vocabulary.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 4. Draft vertical slices

Break the PRD into **tracer-bullet** sub-issues. Each slice is a thin vertical cut through every layer (schema → API → UI → tests), NOT a horizontal slice of one layer.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer
- A completed slice is demoable or verifiable on its own
- Sub-issues are **flat** — a sub-issue must not itself need sub-issues. If a slice is too big to leaf, split it into multiple peer slices instead of nesting
- Any prefactoring should be done first, in its own slice(s) at the start of the list
- Sub-issues run in **list order** under the PRD. Order them so dependencies are satisfied: if slice B builds on slice A's schema, A must come first
</vertical-slice-rules>

### 5. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title** — short, imperative
- **What it builds** — one or two sentences
- **Depends on** — which earlier slice(s) it builds on, or "none"

Ask:
- Is the granularity right?
- Is the order right?
- Should any slices be merged, split, or dropped?

Iterate until the user approves.

### 6. Publish sub-issues to GitHub

Publish in order. For each slice:

1. **Create the issue:**
   ```
   gh issue create --title "<title>" --body "$(cat <<'EOF'
   <body>
   EOF
   )"
   ```

2. **Get its node ID:**
   ```
   gh api repos/$GH_REPO/issues/<sub_issue_number> --jq '.id'
   ```

3. **Attach as sub-issue of the PRD:**
   ```
   gh api -X POST "repos/$GH_REPO/issues/<PRD_NUMBER>/sub_issues" \
     -f sub_issue_id=<sub_issue_id>
   ```

Do **not** apply `agent:implement` to the sub-issues — they're never labeled directly. The user adds `agent:implement` to the **PRD** when ready to start work.

### 7. Sub-issue body template

<sub-issue-template>
## Parent PRD

#<PRD_NUMBER>

## What to build

A concise description of this slice's end-to-end behavior. One to three short paragraphs. Frame it around what the slice _delivers_, not which files change.

## Acceptance criteria

- [ ] Concrete, checkable outcome 1
- [ ] Concrete, checkable outcome 2
- [ ] Tests cover the new behavior

## Depends on

If this slice builds on an earlier sub-issue's work, name it (e.g. "Sub-issue #N — <title>"). If not, omit this section.
</sub-issue-template>

The body intentionally does NOT include a `Closes` directive. Closing the sub-issue is the PRD-mode workflow's job.

## After publishing

- Output the PRD URL and the count of sub-issues attached.
- Tell the user: "Add `agent:implement` to PRD #<N> when ready. The workflow will implement sub-issues in order, accumulating commits on a single `agent/prd-<N>-...` branch, and open a draft PR after the first sub-issue."
- Remind them: sub-issue order determines execution order. They can drag to reorder in the GitHub UI before labeling.

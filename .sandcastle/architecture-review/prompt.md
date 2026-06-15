# TASK

You are running the daily architecture-review pass. Find one fresh deepening opportunity in this codebase and propose it as a PRD issue.

This is an unattended CI run. There is no user to ask questions. Make the call.

## Steps

1. List prior proposals labelled `source:architecture-review` (open and closed) so you don't re-propose them:
   ```
   gh issue list --label source:architecture-review --state all --json number,title,state
   ```

2. Explore the codebase — read `CONTEXT.md`, relevant ADRs under `docs/adr/`, and source files.

3. Pick **one** top candidate: a meaningful architectural improvement that is:
   - Not already covered by a prior `source:architecture-review` proposal
   - Not contradicted by an existing ADR
   - Scoped to a single PRD (not a multi-year rewrite)

4. Write a PRD body in Markdown with: Background, Problem, Proposed solution, Acceptance criteria, Out of scope.

5. Emit the `<output>` block.

# CONTEXT

Read `CONTEXT.md` and any relevant ADRs under `docs/adr/` before proposing anything. Treat ADRs as binding.

# RULES

- Read-only on the repo. No commits. No edits to source files.
- One PRD per run. If every reasonable candidate is already covered, emit a `skipped` output and stop.
- No questions — there is no user. Make the call.

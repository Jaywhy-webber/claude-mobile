# Domain Docs

How the agent skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, proceed silently. Don't flag their absence.

## File structure

```
/
├── CONTEXT.md          ← domain glossary and architecture overview
├── docs/adr/           ← recorded architectural decisions
│   └── 0001-*.md
├── app/                ← React Native screens and navigation
├── components/         ← shared UI components
├── hooks/              ← custom React hooks
└── lib/                ← business logic, transport, utilities
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_

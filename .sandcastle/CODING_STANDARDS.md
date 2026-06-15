# Coding Standards

## Core principles

- Prefer explicit over implicit
- No dead code — remove what isn't used
- Functions do one thing
- Names describe intent, not implementation

## TypeScript

- Strict mode required (`"strict": true` in tsconfig)
- No `any` — use `unknown` and narrow it
- Prefer `const` over `let`; never `var`
- Zod for runtime validation at system boundaries (e.g. messages received over the transport)

## React Native / Expo

- Use functional components and hooks only; no class components
- Keep components small and focused on rendering; push logic into hooks or plain functions
- Use `StyleSheet.create` for styles; no inline style objects in JSX except for dynamic values
- Avoid platform-specific code unless necessary; use Expo's cross-platform APIs first
- Native builds go through EAS — do not add local native build steps to CI

## Testing

- Tests verify observable behavior through public interfaces, not implementation details
- Mock only at system boundaries (external APIs, WebSocket, filesystem)
- TDD workflow: RED → GREEN → REFACTOR
- Run with `npm run test`

## Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- One logical change per commit
- Commit messages explain *why*, not just *what*

# TDD Workflow for Frontend State Code

## When to use this

- Creating or modifying a reducer
- Adding complex state transitions or derived state logic
- Any frontend logic with non-trivial state management

## Workflow

### 1. Extract state logic into a pure, testable module

Separate the state logic (reducer, state transitions, helpers) from the component. Place it in its own file (e.g. `my-feature-reducer.ts`) so it can be tested without React.

### 2. Write a SINGLE failing test

Test the state logic directly: given a state and an action/input, assert on the returned state.

### 3. Make it pass with the simplest implementation

Write just enough logic to make the failing test green. Don't anticipate future actions or edge cases yet.

### 4. Repeat 2 & 3 until all actions and edge cases are covered

Each new test should target one action or one edge case. Keep the red-green cycle tight — one test at a time, never batch.

### 5. Refactor under green tests

Once all behavior is covered, clean up: extract helpers, simplify switch arms, improve types. Run tests after every change.

### 6. Wire into the component

Only after the state logic is fully tested, integrate it into the component. The component layer should be thin — dispatch actions, render state.

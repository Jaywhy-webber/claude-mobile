# TDD Workflow for Database-Interacting Code

## Key Principles

1. **Interface-based validation**: Test the behavior through the same path the real app uses. Call the service method, hit the real (in-memory) database, and assert on the result.

2. **Avoiding redundant tests**: Skip testing what TypeScript's type system already guarantees. Concentrate on runtime behaviors the compiler cannot verify — ordering, data relationships following mutations, edge cases in business logic.

3. **Incremental test writing**: Implement one test at a time. Each new test should provide meaningful insight into the implementation.

## Workflow

1. Write one failing test
2. Implement the simplest solution to pass it
3. Repeat the test-implementation cycle as needed
4. Refactor while maintaining passing tests

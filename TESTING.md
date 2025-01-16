# ChronicleSync Testing Guide

## Testing Philosophy

ChronicleSync follows the testing methodology from "Growing Object-Oriented Software Guided by Tests" (GOOS), with a clear distinction between different types of tests:

### End-to-End (E2E) Tests

Located in `/pages/e2e/`, these are acceptance tests that:
- Use Playwright for full browser automation
- Can access and manipulate the DOM directly
- Test complete user workflows
- Can inspect network requests and system state
- Verify the system works as a whole

Example E2E test:
```typescript
test('should interact with health check component', async ({ page }) => {
  // Full browser automation
  await page.getByRole('button', { name: 'Check Health' }).click();
  
  // Can access DOM and verify system state
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('System Health')).toBeVisible();
});
```

### Integration Tests

Located in various `__tests__` directories, these tests:
- Test the system from a client perspective
- Focus on API endpoints and service interactions
- Mock external dependencies
- Verify component integration without server access

Example integration test:
```typescript
it('returns production URL for chroniclesync.xyz', () => {
  window.location.hostname = 'chroniclesync.xyz';
  jest.isolateModules(() => {
    const apiModule = jest.requireActual('../api');
    expect(apiModule.API_URL).toBe('https://api.chroniclesync.xyz');
  });
});
```

### Unit Tests

Located alongside the components they test, these:
- Test individual components in isolation
- Mock all dependencies
- Focus on business logic
- Are fast and deterministic

## Test Organization

```
chroniclesync/
├── pages/
│   ├── e2e/                          # E2E (Acceptance) tests
│   │   ├── home.spec.ts
│   │   └── pages/
│   │       └── home.page.ts
│   └── src/
│       ├── components/
│       │   └── __tests__/            # Unit tests for components
│       │       └── HealthCheck.test.tsx
│       └── utils/
│           └── __tests__/            # Integration tests
│               ├── api.test.ts
│               └── db.test.ts
└── worker/
    └── src/
        └── services/                 # Service integration tests
            └── metadata.test.js
```

## Running Tests

```bash
# Run E2E tests
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:debug     # Run in debug mode

# Run unit and integration tests
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

## Writing Tests

### E2E Tests
- Use Page Object Model (POM) pattern
- Keep tests focused on user workflows
- Use Playwright's built-in assertions
- Include visual testing where appropriate

### Integration Tests
- Focus on API contracts
- Mock external dependencies
- Test error conditions
- Verify data transformations

### Unit Tests
- Keep tests focused and isolated
- Use meaningful test descriptions
- Follow Arrange-Act-Assert pattern
- Mock dependencies appropriately

## Test Environment Setup

1. Local Development:
   ```bash
   npm install
   npm run dev
   ```

2. E2E Test Requirements:
   - Playwright browsers installed
   - Local development server running
   - Test database configured

3. CI/CD Integration:
   - Tests run on pull requests
   - E2E tests run against staging environment
   - Coverage reports generated

## Best Practices

1. Test Independence
   - Each test should be able to run in isolation
   - Clean up test data after each run
   - Don't rely on test execution order

2. Test Data
   - Use factories for test data creation
   - Avoid sharing state between tests
   - Clean up test data in afterEach hooks

3. Assertions
   - Use explicit assertions
   - Test both positive and negative cases
   - Include error scenarios

4. Maintenance
   - Keep tests up to date with code changes
   - Regularly review and update test coverage
   - Document complex test scenarios
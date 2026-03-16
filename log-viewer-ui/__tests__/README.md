# Unit Tests

This directory contains unit tests for the Log Viewer UI application.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The project achieves **100% code coverage** for core business logic:
- **Components:** 100% coverage (90% threshold)
- **Hooks:** 100% coverage (95% threshold)
- **Lib utilities:** 100% coverage (95% threshold)

Note: API routes and page components are excluded from coverage requirements as they are integration-focused and better suited for E2E testing.

## Test Files

### Auth Utilities (`lib/auth.spec.ts`)
Tests for authentication utility functions:
- `getAuthToken()` - Token retrieval
- `getAuthData()` - Auth data retrieval
- `isTokenExpired()` - Token expiration validation
- `isAuthenticated()` - Authentication status check
- `clearAuth()` - Auth data cleanup

### useAuth Hook (`hooks/useAuth.spec.tsx`)
Tests for the authentication hook:
- Redirect behavior for unauthenticated users
- Token expiration checking (10-second intervals)
- Auto-logout on token expiration
- Manual logout functionality
- Cleanup on component unmount

### Navbar Component (`components/Navbar.spec.tsx`)
Tests for the navigation bar:
- Rendering of navigation links
- Display of user information when authenticated
- Logout button functionality
- Conditional rendering based on auth state

### API Routes (`app/api/*/route.spec.ts`)
Tests for API proxy routes:
- Authorization header validation
- Request proxying to backend
- Query parameter handling
- Error handling
- Status code forwarding

## Test Structure

All tests follow the AAA (Arrange-Act-Assert) pattern:

```typescript
it('should do something when condition is met', () => {
  // Arrange - Setup
  const mockData = { /* ... */ };
  jest.mock(/* ... */);

  // Act - Execute
  const result = functionUnderTest(mockData);

  // Assert - Verify
  expect(result).toBe(expectedValue);
});
```

## Mocking

Tests use Jest mocks for:
- `localStorage` - Mocked in `jest.setup.js`
- `fetch` - Mocked globally
- `next/navigation` - Mocked for router functionality
- Module dependencies - Mocked using `jest.mock()`

## Coverage Reports

After running `npm run test:coverage`, view the coverage report at:
- `coverage/lcov-report/index.html` (HTML report)
- `coverage/lcov.info` (LCOV format)

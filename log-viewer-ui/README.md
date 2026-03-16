# Log Viewer UI

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication

The application includes automatic authentication checks and redirects for unauthenticated users and expired tokens.

### Features

**Auth Utilities (`lib/auth.ts`)**
- `isAuthenticated()` - Checks if user is logged in with valid token
- `isTokenExpired()` - Validates token expiration
- `getAuthData()` - Retrieves stored authentication data
- `getAuthToken()` - Gets JWT token
- `clearAuth()` - Clears all authentication data from localStorage

**useAuth Hook (`hooks/useAuth.ts`)**

A React hook that provides:
- Automatic redirect to `/login` for unauthenticated users
- Token expiration checking every 10 seconds
- Auto-logout when token expires
- Loading state during auth check
- `logout()` function for manual logout

**Protected Routes**
- Home page (`/`) now requires authentication
- Redirects to `/login` if not authenticated or token expired
- Login page (`/login`) redirects to `/` if already authenticated

### Usage

**Protecting a Page:**

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function ProtectedPage() {
  const { authData, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>Welcome {authData?.username}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Making Authenticated API Calls:**

```typescript
import { getAuthToken } from "@/lib/auth";

async function fetchLogs() {
  const token = getAuthToken();
  
  const response = await fetch("/api/logs", {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  return response.json();
}
```

### Token Expiration Handling

The `useAuth` hook checks token validity every 10 seconds. When a token expires:
1. Auth data is cleared from localStorage
2. User is automatically redirected to `/login`
3. User must log in again to continue

### Testing Credentials

Default credentials (from backend seeded data):
- Email: `admin@example.com`
- Password: `Admin123!`

## Configuring the API Base URL

The login form calls an API endpoint using a configurable base URL.

### Option A (recommended): Proxy to an external auth service

This project can proxy login requests through the Next.js server so the browser always talks to the same origin.

Set the external auth server URL in an environment variable:

```bash
API_BASE_URL=https://localhost:7257
```

Or you can provide it in `package.json`:

```json
"baseUrl": "https://localhost:7257/api",
```

If this variable is set, the app will proxy `/api/login` to `API_BASE_URL`.

By default the proxy hits `/login` on that server. If your auth endpoint is different, set:

```bash
AUTH_PATH=/auth/login
```

### Option B: Change the frontend base URL directly

You can also point the frontend at a different API base URL (useful for local testing):

```json
"apiUrl": "/api",
```

Or override it at runtime with an environment variable:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

## Testing

The project includes comprehensive unit tests with Jest and React Testing Library.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Coverage Requirements

- Minimum 80% coverage across branches, functions, lines, and statements
- Tests follow the AAA (Arrange-Act-Assert) pattern
- All business logic and components are tested

### Test Files

- `lib/auth.spec.ts` - Auth utility functions
- `hooks/useAuth.spec.tsx` - Authentication hook
- `components/Navbar.spec.tsx` - Navbar component
- `app/api/*/route.spec.ts` - API proxy routes

See `__tests__/README.md` for detailed testing documentation.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

export interface AuthData {
  token: string;
  expiresAt: string;
  email: string;
  username: string;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function getAuthData(): AuthData | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('authToken');
  const expiresAt = localStorage.getItem('authExpiresAt');
  const email = localStorage.getItem('authEmail');
  const username = localStorage.getItem('authUsername');

  if (!token || !expiresAt || !email || !username) {
    return null;
  }

  return { token, expiresAt, email, username };
}

export function isTokenExpired(expiresAt: string): boolean {
  const expirationDate = new Date(expiresAt);
  return expirationDate.getTime() <= Date.now();
}

export function isAuthenticated(): boolean {
  const authData = getAuthData();
  
  if (!authData) {
    return false;
  }

  if (isTokenExpired(authData.expiresAt)) {
    clearAuth();
    return false;
  }

  return true;
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('authToken');
  localStorage.removeItem('authExpiresAt');
  localStorage.removeItem('authEmail');
  localStorage.removeItem('authUsername');
}

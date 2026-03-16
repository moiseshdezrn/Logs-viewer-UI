import {
  getAuthToken,
  getAuthData,
  isTokenExpired,
  isAuthenticated,
  clearAuth,
} from './auth';

describe('Auth Utilities', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.window = originalWindow;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('getAuthToken', () => {
    it('should return token when stored in localStorage', () => {
      const mockToken = 'test-token-123';
      (localStorage.getItem as jest.Mock).mockReturnValue(mockToken);

      const result = getAuthToken();

      expect(result).toBe(mockToken);
      expect(localStorage.getItem).toHaveBeenCalledWith('authToken');
    });

    it('should return null when no token in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = getAuthToken();

      expect(result).toBeNull();
    });

    it('should return null when called on server side', () => {
      delete (global as any).window;

      const result = getAuthToken();

      expect(result).toBeNull();
    });
  });

  describe('getAuthData', () => {
    it('should return auth data when all fields are present', () => {
      const mockData = {
        token: 'test-token',
        expiresAt: '2026-12-31T23:59:59Z',
        email: 'test@example.com',
        username: 'testuser',
      };

      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        const map: Record<string, string> = {
          authToken: mockData.token,
          authExpiresAt: mockData.expiresAt,
          authEmail: mockData.email,
          authUsername: mockData.username,
        };
        return map[key] || null;
      });

      const result = getAuthData();

      expect(result).toEqual(mockData);
    });

    it('should return null when token is missing', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'authToken') return null;
        return 'some-value';
      });

      const result = getAuthData();

      expect(result).toBeNull();
    });

    it('should return null when expiresAt is missing', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'authExpiresAt') return null;
        return 'some-value';
      });

      const result = getAuthData();

      expect(result).toBeNull();
    });

    it('should return null when email is missing', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'authEmail') return null;
        return 'some-value';
      });

      const result = getAuthData();

      expect(result).toBeNull();
    });

    it('should return null when username is missing', () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'authUsername') return null;
        return 'some-value';
      });

      const result = getAuthData();

      expect(result).toBeNull();
    });

    it('should return null when called on server side', () => {
      delete (global as any).window;

      const result = getAuthData();

      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when token is expired', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();

      const result = isTokenExpired(pastDate);

      expect(result).toBe(true);
    });

    it('should return false when token is not expired', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();

      const result = isTokenExpired(futureDate);

      expect(result).toBe(false);
    });

    it('should return true when token expires exactly now', () => {
      const now = new Date(Date.now()).toISOString();

      const result = isTokenExpired(now);

      expect(result).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid auth data exists', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        const map: Record<string, string> = {
          authToken: 'valid-token',
          authExpiresAt: futureDate,
          authEmail: 'test@example.com',
          authUsername: 'testuser',
        };
        return map[key] || null;
      });

      const result = isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no auth data exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false and clear auth when token is expired', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        const map: Record<string, string> = {
          authToken: 'expired-token',
          authExpiresAt: pastDate,
          authEmail: 'test@example.com',
          authUsername: 'testuser',
        };
        return map[key] || null;
      });

      const result = isAuthenticated();

      expect(result).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authExpiresAt');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authEmail');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authUsername');
    });
  });

  describe('clearAuth', () => {
    it('should remove all auth items from localStorage', () => {
      clearAuth();

      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authExpiresAt');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authEmail');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authUsername');
      expect(localStorage.removeItem).toHaveBeenCalledTimes(4);
    });

    it('should handle server side call gracefully', () => {
      delete (global as any).window;

      expect(() => clearAuth()).not.toThrow();
    });
  });
});

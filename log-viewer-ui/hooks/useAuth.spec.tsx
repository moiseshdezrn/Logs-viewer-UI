import { renderHook, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import * as authLib from '@/lib/auth';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn(),
  getAuthData: jest.fn(),
  clearAuth: jest.fn(),
}));

describe('useAuth Hook', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Authentication Check', () => {
    it('should redirect to login when not authenticated', () => {
      (authLib.isAuthenticated as jest.Mock).mockReturnValue(false);

      renderHook(() => useAuth());

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should not redirect when authenticated', () => {
      const mockAuthData = {
        token: 'valid-token',
        expiresAt: '2026-12-31T23:59:59Z',
        email: 'test@example.com',
        username: 'testuser',
      };

      (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authLib.getAuthData as jest.Mock).mockReturnValue(mockAuthData);

      const { result } = renderHook(() => useAuth());

      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.authData).toEqual(mockAuthData);
    });

    it('should use custom redirect path', () => {
      (authLib.isAuthenticated as jest.Mock).mockReturnValue(false);

      renderHook(() => useAuth('/custom-login'));

      expect(mockPush).toHaveBeenCalledWith('/custom-login');
    });
  });

  describe('Token Expiration Check', () => {
    it('should check authentication every 10 seconds', async () => {
      (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authLib.getAuthData as jest.Mock).mockReturnValue({
        token: 'token',
        expiresAt: '2026-12-31T23:59:59Z',
        email: 'test@example.com',
        username: 'testuser',
      });

      renderHook(() => useAuth());

      expect(authLib.isAuthenticated).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(authLib.isAuthenticated).toHaveBeenCalledTimes(2);
      });

      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(authLib.isAuthenticated).toHaveBeenCalledTimes(3);
      });
    });

    it('should redirect when token expires during interval check', async () => {
      (authLib.isAuthenticated as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      (authLib.getAuthData as jest.Mock).mockReturnValue({
        token: 'token',
        expiresAt: '2026-12-31T23:59:59Z',
        email: 'test@example.com',
        username: 'testuser',
      });

      renderHook(() => useAuth());

      expect(mockPush).not.toHaveBeenCalled();

      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(authLib.clearAuth).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Logout Function', () => {
    it('should clear auth and redirect to login', () => {
      (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authLib.getAuthData as jest.Mock).mockReturnValue({
        token: 'token',
        expiresAt: '2026-12-31T23:59:59Z',
        email: 'test@example.com',
        username: 'testuser',
      });

      const { result } = renderHook(() => useAuth());

      result.current.logout();

      expect(authLib.clearAuth).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Cleanup', () => {
    it('should clear interval on unmount', () => {
      (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authLib.getAuthData as jest.Mock).mockReturnValue({
        token: 'token',
        expiresAt: '2026-12-31T23:59:59Z',
        email: 'test@example.com',
        username: 'testuser',
      });

      const { unmount } = renderHook(() => useAuth());

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});

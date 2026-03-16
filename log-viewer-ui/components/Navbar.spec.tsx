import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';
import * as useAuthHook from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');

describe('Navbar Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render app title and navigation links', () => {
      (useAuthHook.useAuth as jest.Mock).mockReturnValue({
        authData: null,
        isLoading: false,
        logout: mockLogout,
      });

      render(<Navbar />);

      expect(screen.getByText('Log Viewer')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });

    it('should display username and email when authenticated', () => {
      const mockAuthData = {
        token: 'test-token',
        expiresAt: '2026-12-31T23:59:59Z',
        email: 'test@example.com',
        username: 'TestUser',
      };

      (useAuthHook.useAuth as jest.Mock).mockReturnValue({
        authData: mockAuthData,
        isLoading: false,
        logout: mockLogout,
      });

      render(<Navbar />);

      expect(screen.getByText('TestUser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should display logout button when authenticated', () => {
      (useAuthHook.useAuth as jest.Mock).mockReturnValue({
        authData: {
          token: 'test-token',
          expiresAt: '2026-12-31T23:59:59Z',
          email: 'test@example.com',
          username: 'TestUser',
        },
        isLoading: false,
        logout: mockLogout,
      });

      render(<Navbar />);

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should not display user info when not authenticated', () => {
      (useAuthHook.useAuth as jest.Mock).mockReturnValue({
        authData: null,
        isLoading: false,
        logout: mockLogout,
      });

      render(<Navbar />);

      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout when logout button is clicked', () => {
      (useAuthHook.useAuth as jest.Mock).mockReturnValue({
        authData: {
          token: 'test-token',
          expiresAt: '2026-12-31T23:59:59Z',
          email: 'test@example.com',
          username: 'TestUser',
        },
        isLoading: false,
        logout: mockLogout,
      });

      render(<Navbar />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href attributes', () => {
      (useAuthHook.useAuth as jest.Mock).mockReturnValue({
        authData: null,
        isLoading: false,
        logout: mockLogout,
      });

      render(<Navbar />);

      const homeLink = screen.getByText('Log Viewer').closest('a');
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const logsLink = screen.getByText('Logs').closest('a');

      expect(homeLink).toHaveAttribute('href', '/');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(logsLink).toHaveAttribute('href', '/logs');
    });
  });
});

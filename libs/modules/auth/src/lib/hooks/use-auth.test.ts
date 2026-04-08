import { useAuthStore } from '../stores/auth-store';
import { useAuth } from './use-auth';

// Mock dependencies
jest.mock('../stores/auth-store');
jest.mock('../services/auth-service');
jest.mock('@viby/shared/storage', () => ({
  storageService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return auth store state and actions', () => {
    const mockAuthStore = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'spotify' as const,
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
    };

    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);

    const result = useAuth();

    expect(result).toEqual(mockAuthStore);
    expect(result.user?.id).toBe('user-123');
    expect(result.isAuthenticated).toBe(true);
    expect(result.isLoading).toBe(false);
  });

  it('should return unauthenticated state when user is not logged in', () => {
    const mockAuthStore = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
    };

    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);

    const result = useAuth();

    expect(result.user).toBeNull();
    expect(result.isAuthenticated).toBe(false);
  });

  it('should provide access to login action', () => {
    const mockLogin = jest.fn();
    const mockAuthStore = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
    };

    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);

    const result = useAuth();

    expect(result.login).toBe(mockLogin);
    expect(typeof result.login).toBe('function');
  });

  it('should provide access to logout action', () => {
    const mockLogout = jest.fn();
    const mockAuthStore = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'spotify' as const,
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: mockLogout,
      setUser: jest.fn(),
      setLoading: jest.fn(),
    };

    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);

    const result = useAuth();

    expect(result.logout).toBe(mockLogout);
    expect(typeof result.logout).toBe('function');
  });

  it('should provide access to setUser action', () => {
    const mockSetUser = jest.fn();
    const mockAuthStore = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUser: mockSetUser,
      setLoading: jest.fn(),
    };

    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);

    const result = useAuth();

    expect(result.setUser).toBe(mockSetUser);
    expect(typeof result.setUser).toBe('function');
  });

  it('should provide access to setLoading action', () => {
    const mockSetLoading = jest.fn();
    const mockAuthStore = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
      setLoading: mockSetLoading,
    };

    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);

    const result = useAuth();

    expect(result.setLoading).toBe(mockSetLoading);
    expect(typeof result.setLoading).toBe('function');
  });
});

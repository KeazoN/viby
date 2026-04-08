import { useAuthStore } from '../stores/auth-store';

// Mock React hooks
const mockUseEffect = jest.fn((callback) => callback());
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: (callback: () => void, deps: unknown[]) => mockUseEffect(callback, deps),
}));

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

describe('useRequireAuth', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEffect.mockClear();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should return authenticated state when user is logged in', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    // Import after mocking
    const { useRequireAuth } = require('./use-require-auth');
    const result = useRequireAuth();

    expect(result.isAuthenticated).toBe(true);
    expect(result.isLoading).toBe(false);
  });

  it('should return loading state while authentication is being checked', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { useRequireAuth } = require('./use-require-auth');
    const result = useRequireAuth();

    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(true);
  });

  it('should warn when user is not authenticated and not loading', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { useRequireAuth } = require('./use-require-auth');
    useRequireAuth();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'User not authenticated - navigation to auth flow needed'
    );
  });

  it('should not warn when user is authenticated', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { useRequireAuth } = require('./use-require-auth');
    useRequireAuth();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not warn while loading', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { useRequireAuth } = require('./use-require-auth');
    useRequireAuth();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should accept optional redirectTo parameter', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { useRequireAuth } = require('./use-require-auth');
    const result = useRequireAuth('/dashboard');

    expect(result.isAuthenticated).toBe(true);
  });
});

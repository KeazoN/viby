import { useAuthStore } from '../stores/auth-store';

/**
 * useAuth Hook
 * 
 * Provides access to authentication state and actions.
 * 
 * @returns Auth store state and actions
 * 
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginScreen />;
 *   }
 *   
 *   return <div>Welcome {user?.displayName}</div>;
 * }
 * ```
 */
export function useAuth() {
  return useAuthStore();
}

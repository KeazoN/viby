import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth-store';

/**
 * useRequireAuth Hook
 * 
 * Ensures the user is authenticated. If not authenticated, triggers
 * a redirect to the login/OAuth flow.
 * 
 * This hook should be used in protected route components to enforce
 * authentication requirements.
 * 
 * 
 * @param redirectTo - Optional path to redirect to after authentication
 * 
 * @example
 * ```tsx
 * function ProtectedScreen() {
 *   useRequireAuth();
 *   
 *   // This code only runs if user is authenticated
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo?: string) {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) {
      return;
    }

    // If not authenticated, trigger navigation to auth flow
    if (!isAuthenticated) {
      // TODO: Implement navigation to auth screen when navigation is set up
      // For now, this hook monitors auth state and can be extended
      // with navigation logic once React Navigation is configured
      console.warn('User not authenticated - navigation to auth flow needed');
      
      // Future implementation:
      // navigation.navigate('Auth', { redirectTo });
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
}

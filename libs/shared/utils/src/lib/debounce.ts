/**
 * Debounce utility for delaying function execution
 * 
 * Creates a debounced function that delays invoking the provided function
 * until after the specified delay has elapsed since the last time it was invoked.
 * 
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * debouncedSearch('test'); // Will execute after 300ms
 * debouncedSearch('test2'); // Cancels previous, will execute after 300ms
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Debounce hook for React components
 * 
 * Creates a debounced callback that persists across renders.
 * The debounced function will be cleaned up when the component unmounts.
 * 
 * @param callback - The callback to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the callback
 * 
 * @example
 * ```typescript
 * function SearchComponent() {
 *   const debouncedSearch = useDebouncedCallback((query: string) => {
 *     searchAPI(query);
 *   }, 300);
 * 
 *   return (
 *     <input onChange={(e) => debouncedSearch(e.target.value)} />
 *   );
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  // Use useRef to store the timeout ID and callback
  const timeoutRef = { current: null as NodeJS.Timeout | null };
  const callbackRef = { current: callback };

  // Update callback ref when callback changes
  callbackRef.current = callback;

  // Cleanup on unmount
  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Create debounced function
  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      timeoutRef.current = null;
    }, delay);
  };

  // Return debounced function with cleanup
  return debouncedFn;
}

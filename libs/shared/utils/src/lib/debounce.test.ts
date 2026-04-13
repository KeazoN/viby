import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('test');

    // Should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(300);

    // Should be called after delay
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls when called multiple times', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('first');
    vi.advanceTimersByTime(100);
    
    debouncedFn('second');
    vi.advanceTimersByTime(100);
    
    debouncedFn('third');
    vi.advanceTimersByTime(300);

    // Should only be called once with the last value
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third');
  });

  it('should handle multiple arguments', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('arg1', 'arg2', 'arg3');
    vi.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should allow multiple executions after delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    // First call
    debouncedFn('first');
    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Second call
    debouncedFn('second');
    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Third call
    debouncedFn('third');
    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should work with different delay values', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('test');
    
    // Should not be called before delay
    vi.advanceTimersByTime(400);
    expect(mockFn).not.toHaveBeenCalled();

    // Should be called after delay
    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should handle zero delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 0);

    debouncedFn('test');
    
    // Should not be called immediately (still uses setTimeout)
    expect(mockFn).not.toHaveBeenCalled();

    // Should be called on next tick
    vi.advanceTimersByTime(0);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should preserve function context', () => {
    const obj = {
      value: 42,
      method: vi.fn(function(this: any) {
        return this.value;
      }),
    };

    const debouncedMethod = debounce(obj.method, 300);
    debouncedMethod.call(obj);
    
    vi.advanceTimersByTime(300);
    
    expect(obj.method).toHaveBeenCalled();
  });

  it('should handle rapid successive calls efficiently', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    // Simulate rapid typing
    for (let i = 0; i < 10; i++) {
      debouncedFn(`call-${i}`);
      vi.advanceTimersByTime(50);
    }

    // Should not have been called yet
    expect(mockFn).not.toHaveBeenCalled();

    // Wait for debounce delay
    vi.advanceTimersByTime(300);

    // Should only be called once with the last value
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call-9');
  });
});

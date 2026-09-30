import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should update debounced value after specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 300 },
      }
    );

    expect(result.current).toBe('first');

    rerender({ value: 'second', delay: 300 });
    expect(result.current).toBe('first'); // Still old value before delay

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second');
  });

  it('should reset timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'v1', delay: 300 },
      }
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'v2', delay: 300 });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    // Total 400ms passed since v1, but only 200ms passed since v2
    expect(result.current).toBe('v1');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('v2');
  });
});

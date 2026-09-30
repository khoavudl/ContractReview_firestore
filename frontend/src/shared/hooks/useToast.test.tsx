import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from './useToast';

describe('useToast hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should throw error when used outside ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrowError(
      /useToast must be used within a ToastProvider/
    );
  });

  it('should add a toast and auto-dismiss after duration', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    expect(result.current.toasts).toHaveLength(0);

    let toastId = '';
    act(() => {
      toastId = result.current.showToast({
        title: 'Thành công',
        message: 'Đã lưu hợp đồng',
        variant: 'success',
        duration: 3000,
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(toastId);
    expect(result.current.toasts[0].message).toBe('Đã lưu hợp đồng');
    expect(result.current.toasts[0].variant).toBe('success');

    // Advance timers
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should remove a toast manually via removeToast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    let toastId = '';
    act(() => {
      toastId = result.current.showToast({
        message: 'Thông báo cần xoá thủ công',
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should clear all toasts via clearToasts', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast({ message: 'Toast 1' });
      result.current.showToast({ message: 'Toast 2' });
      result.current.showToast({ message: 'Toast 3' });
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clearToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});

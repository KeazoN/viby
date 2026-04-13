/**
 * Toast Notification Service
 * 
 * Provides a simple interface for showing toast notifications
 * using react-native-toast-message.
 * 
 * Requirements:
 * - 16.5: Show user-friendly error messages
 */

import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
}

/**
 * Show a toast notification
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 3000
): void {
  Toast.show({
    type,
    text1: message,
    position: 'top',
    visibilityTime: duration,
  });
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string, duration?: number): void {
  showToast(message, 'success', duration);
}

/**
 * Show an error toast
 */
export function showErrorToast(message: string, duration?: number): void {
  showToast(message, 'error', duration);
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string, duration?: number): void {
  showToast(message, 'warning', duration);
}

/**
 * Show an info toast
 */
export function showInfoToast(message: string, duration?: number): void {
  showToast(message, 'info', duration);
}

/**
 * Hide all toasts
 */
export function hideToast(): void {
  Toast.hide();
}

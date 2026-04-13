/**
 * Monitoring Library
 * 
 * Provides error tracking and monitoring utilities using Sentry
 */

export {
  initializeSentry,
  setSentryUser,
  clearSentryUser,
  setSentryContext,
  addSentryBreadcrumb,
  captureException,
  captureMessage,
  getSentryRoutingInstrumentation,
} from './lib/sentry-config';

export { ErrorTracker } from './lib/error-tracker';

export {
  NetworkError,
  AuthError,
  ApiError,
  WebSocketError,
  ValidationError,
  StateError,
  NavigationError,
  StorageError,
} from './lib/error-types';

export {
  handleError,
  createNetworkError,
  createApiError,
} from './lib/error-handler';

export {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  hideToast,
  type ToastType,
  type ToastOptions,
} from './lib/toast-service';

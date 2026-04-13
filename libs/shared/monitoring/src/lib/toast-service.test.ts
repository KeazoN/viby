/**
 * Toast Service Tests
 */

import Toast from 'react-native-toast-message';
import {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  hideToast,
} from './toast-service';

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

describe('Toast Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showToast', () => {
    it('should show a toast with default parameters', () => {
      showToast('Test message');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Test message',
        position: 'top',
        visibilityTime: 3000,
      });
    });

    it('should show a toast with custom type', () => {
      showToast('Error message', 'error');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Error message',
        position: 'top',
        visibilityTime: 3000,
      });
    });

    it('should show a toast with custom duration', () => {
      showToast('Success message', 'success', 5000);

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Success message',
        position: 'top',
        visibilityTime: 5000,
      });
    });
  });

  describe('showSuccessToast', () => {
    it('should show a success toast', () => {
      showSuccessToast('Operation successful');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Operation successful',
        position: 'top',
        visibilityTime: 3000,
      });
    });

    it('should show a success toast with custom duration', () => {
      showSuccessToast('Saved!', 2000);

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Saved!',
        position: 'top',
        visibilityTime: 2000,
      });
    });
  });

  describe('showErrorToast', () => {
    it('should show an error toast', () => {
      showErrorToast('Operation failed');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Operation failed',
        position: 'top',
        visibilityTime: 3000,
      });
    });
  });

  describe('showWarningToast', () => {
    it('should show a warning toast', () => {
      showWarningToast('Please be careful');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'warning',
        text1: 'Please be careful',
        position: 'top',
        visibilityTime: 3000,
      });
    });
  });

  describe('showInfoToast', () => {
    it('should show an info toast', () => {
      showInfoToast('Here is some information');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Here is some information',
        position: 'top',
        visibilityTime: 3000,
      });
    });
  });

  describe('hideToast', () => {
    it('should hide all toasts', () => {
      hideToast();

      expect(Toast.hide).toHaveBeenCalled();
    });
  });
});

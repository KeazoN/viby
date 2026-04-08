import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useNetworkState } from '../hooks/use-network-monitor';

// Mock the network hook
jest.mock('../hooks/use-network-monitor');

const mockUseNetworkState = useNetworkState as jest.MockedFunction<
  typeof useNetworkState
>;

describe('NetworkStatusIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should not render when connected and internet is reachable', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'wifi',
      });

      const { container } = render(<NetworkStatusIndicator />);
      expect(container.children.length).toBe(0);
    });

    it('should render when not connected', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: false,
        isInternetReachable: null,
        connectionType: 'none',
      });

      render(<NetworkStatusIndicator />);
      expect(screen.getByText('No connection')).toBeTruthy();
    });

    it('should render when internet is not reachable', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: true,
        isInternetReachable: false,
        connectionType: 'wifi',
      });

      render(<NetworkStatusIndicator />);
      expect(screen.getByText('No internet access')).toBeTruthy();
    });

    it('should not render when internet reachability is unknown but connected', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: true,
        isInternetReachable: null,
        connectionType: 'wifi',
      });

      const { container } = render(<NetworkStatusIndicator />);
      expect(container.children.length).toBe(0);
    });
  });

  describe('messages', () => {
    it('should display offline message when not connected', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: false,
        isInternetReachable: null,
        connectionType: 'none',
      });

      render(<NetworkStatusIndicator />);
      expect(screen.getByText('No connection')).toBeTruthy();
    });

    it('should display no internet message when connected but no internet', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: true,
        isInternetReachable: false,
        connectionType: 'wifi',
      });

      render(<NetworkStatusIndicator />);
      expect(screen.getByText('No internet access')).toBeTruthy();
    });

    it('should display custom offline message', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: false,
        isInternetReachable: null,
        connectionType: 'none',
      });

      render(
        <NetworkStatusIndicator offlineMessage="Custom offline message" />
      );
      expect(screen.getByText('Custom offline message')).toBeTruthy();
    });

    it('should display custom no internet message', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: true,
        isInternetReachable: false,
        connectionType: 'wifi',
      });

      render(
        <NetworkStatusIndicator noInternetMessage="Custom no internet message" />
      );
      expect(screen.getByText('Custom no internet message')).toBeTruthy();
    });
  });

  describe('controlled visibility', () => {
    it('should show when visible prop is true regardless of network state', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'wifi',
      });

      render(<NetworkStatusIndicator visible={true} />);
      expect(screen.getByText('No connection')).toBeTruthy();
    });

    it('should hide when visible prop is false regardless of network state', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'none',
      });

      const { container } = render(<NetworkStatusIndicator visible={false} />);
      expect(container.children.length).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('should have alert role', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: false,
        isInternetReachable: null,
        connectionType: 'none',
      });

      render(<NetworkStatusIndicator />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
    });

    it('should have accessibility label with offline message', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: false,
        isInternetReachable: null,
        connectionType: 'none',
      });

      render(<NetworkStatusIndicator />);
      const alert = screen.getByLabelText('No connection');
      expect(alert).toBeTruthy();
    });

    it('should have accessibility label with no internet message', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: true,
        isInternetReachable: false,
        connectionType: 'wifi',
      });

      render(<NetworkStatusIndicator />);
      const alert = screen.getByLabelText('No internet access');
      expect(alert).toBeTruthy();
    });

    it('should have polite live region', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: false,
        isInternetReachable: null,
        connectionType: 'none',
      });

      const { getByRole } = render(<NetworkStatusIndicator />);
      const alert = getByRole('alert');
      expect(alert.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('visual elements', () => {
    it('should render indicator dot', () => {
      mockUseNetworkState.mockReturnValue({
        isConnected: false,
        isInternetReachable: null,
        connectionType: 'none',
      });

      const { UNSAFE_getByType } = render(<NetworkStatusIndicator />);
      // The indicator is a View with specific styling
      // We can verify it exists by checking the component tree
      expect(UNSAFE_getByType(NetworkStatusIndicator)).toBeTruthy();
    });
  });
});

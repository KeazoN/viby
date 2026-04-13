/**
 * LegalDocumentScreen Tests
 * 
 * Tests for the Legal Document Screen component
 * 
 * Requirements: 24.3, 24.4
 */

import { render, screen, waitFor } from '@testing-library/react-native';
import { LegalDocumentScreen } from './LegalDocumentScreen';
import { useRoute } from '@react-navigation/native';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(),
}));

const mockUseRoute = useRoute as jest.MockedFunction<typeof useRoute>;

describe('LegalDocumentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Privacy Policy', () => {
    it('should display privacy policy content', async () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'privacy-policy' },
      } as any);

      render(<LegalDocumentScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Privacy Policy/i)).toBeTruthy();
      });
    });

    it('should display privacy policy sections', async () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'privacy-policy' },
      } as any);

      render(<LegalDocumentScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Information We Collect/i)).toBeTruthy();
        expect(screen.getByText(/How We Use Your Information/i)).toBeTruthy();
        expect(screen.getByText(/Data Security/i)).toBeTruthy();
      });
    });

    it('should display contact information', async () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'privacy-policy' },
      } as any);

      render(<LegalDocumentScreen />);

      await waitFor(() => {
        expect(screen.getByText(/privacy@viby\.app/i)).toBeTruthy();
      });
    });
  });

  describe('Terms of Service', () => {
    it('should display terms of service content', async () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'terms-of-service' },
      } as any);

      render(<LegalDocumentScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Terms of Service/i)).toBeTruthy();
      });
    });

    it('should display terms sections', async () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'terms-of-service' },
      } as any);

      render(<LegalDocumentScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Agreement to Terms/i)).toBeTruthy();
        expect(screen.getByText(/User Conduct/i)).toBeTruthy();
        expect(screen.getByText(/Privacy and Data Protection/i)).toBeTruthy();
      });
    });

    it('should display contact information', async () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'terms-of-service' },
      } as any);

      render(<LegalDocumentScreen />);

      await waitFor(() => {
        expect(screen.getByText(/support@viby\.app/i)).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'privacy-policy' },
      } as any);

      render(<LegalDocumentScreen />);

      // Loading indicator should be present initially
      expect(screen.queryByTestId('legal-document-screen')).toBeNull();
    });

    it('should hide loading indicator after content loads', async () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'privacy-policy' },
      } as any);

      render(<LegalDocumentScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('legal-document-screen')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have scrollable content', async () => {
      mockUseRoute.mockReturnValue({
        key: 'test',
        name: 'LegalDocument',
        params: { documentType: 'privacy-policy' },
      } as any);

      render(<LegalDocumentScreen />);

      await waitFor(() => {
        const scrollView = screen.getByTestId('legal-document-screen');
        expect(scrollView).toBeTruthy();
      });
    });
  });
});

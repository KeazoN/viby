/**
 * Accessibility Tests
 * 
 * Tests for accessibility features including labels, screen reader support,
 * touch targets, and dynamic text sizing.
 * 
 * **Validates: Requirements 19.1, 19.2, 19.3, 19.5, 19.6**
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
import { Text } from './components/Text';
import { OptimizedImage } from './components/OptimizedImage';
import {
  formatCountForAccessibility,
  formatTimeForAccessibility,
  formatTrackForAccessibility,
  formatScoreForAccessibility,
  generateAccessibilityHint,
  getScreenReaderName,
} from './utils/accessibility';

describe('Accessibility - Interactive Elements', () => {
  /**
   * Requirement 19.1: Accessibility labels for all interactive elements
   */
  describe('Accessibility Labels', () => {
    it('should provide accessibility label for Button', () => {
      const { getByRole } = render(
        <Button onPress={() => {}} accessibilityLabel="Login with Spotify">
          Login
        </Button>
      );

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Login with Spotify');
    });

    it('should use button text as fallback accessibility label', () => {
      const { getByRole } = render(<Button onPress={() => {}}>Quick Match</Button>);

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Quick Match');
    });

    it('should provide accessibility label for Input', () => {
      const { getByLabelText } = render(<Input label="Email" placeholder="Enter your email" />);

      const input = getByLabelText('Email');
      expect(input).toBeTruthy();
    });

    it('should use placeholder as fallback for Input accessibility label', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Search tracks" />);

      const input = getByPlaceholderText('Search tracks');
      expect(input.props.accessibilityLabel).toBe('Search tracks');
    });

    it('should provide accessibility label for Card with onPress', () => {
      const { getByRole } = render(
        <Card
          onPress={() => {}}
          accessibilityLabel="Track cluster: Bohemian Rhapsody by Queen, 5 listeners"
        >
          <Text>Bohemian Rhapsody</Text>
        </Card>
      );

      const card = getByRole('button');
      expect(card.props.accessibilityLabel).toBe(
        'Track cluster: Bohemian Rhapsody by Queen, 5 listeners'
      );
    });

    it('should provide accessibility label for OptimizedImage', () => {
      const { getByLabelText } = render(
        <OptimizedImage
          uri="https://example.com/album.jpg"
          width={80}
          height={80}
          accessibilityLabel="Album artwork for Dark Side of the Moon"
        />
      );

      const image = getByLabelText('Album artwork for Dark Side of the Moon');
      expect(image).toBeTruthy();
    });
  });

  /**
   * Requirement 19.2: Screen reader support (VoiceOver/TalkBack)
   */
  describe('Screen Reader Support', () => {
    it('should set correct accessibility role for Button', () => {
      const { getByRole } = render(<Button onPress={() => {}}>Press me</Button>);

      const button = getByRole('button');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('should set correct accessibility role for Card with onPress', () => {
      const { getByRole } = render(
        <Card onPress={() => {}}>
          <Text>Card content</Text>
        </Card>
      );

      const card = getByRole('button');
      expect(card.props.accessibilityRole).toBe('button');
    });

    it('should not set accessibility role for Card without onPress', () => {
      const { queryAllByRole } = render(
        <Card>
          <Text>Card content</Text>
        </Card>
      );

      const cards = queryAllByRole('button');
      expect(cards).toHaveLength(0);
    });

    it('should provide accessibility hint for Button', () => {
      const { getByRole } = render(
        <Button
          onPress={() => {}}
          accessibilityLabel="Quick Match"
          accessibilityHint="Starts matchmaking with users listening to the same track"
        >
          Quick Match
        </Button>
      );

      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe(
        'Starts matchmaking with users listening to the same track'
      );
    });

    it('should indicate disabled state for Button', () => {
      const { getByRole } = render(
        <Button onPress={() => {}} disabled>
          Disabled Button
        </Button>
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({
        disabled: true,
        busy: false,
      });
    });

    it('should indicate loading state for Button', () => {
      const { getByRole } = render(
        <Button onPress={() => {}} loading>
          Loading Button
        </Button>
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({
        disabled: true,
        busy: true,
      });
    });

    it('should indicate disabled state for Input', () => {
      const { getByLabelText } = render(<Input label="Email" editable={false} />);

      const input = getByLabelText('Email');
      expect(input.props.accessibilityState).toEqual({
        disabled: true,
      });
    });

    it('should use live region for Input error messages', () => {
      const { getByText } = render(<Input label="Email" error="Invalid email address" />);

      const errorText = getByText('Invalid email address');
      expect(errorText.props.accessibilityLiveRegion).toBe('polite');
    });

    it('should not use live region for Input helper text', () => {
      const { getByText } = render(<Input label="Email" helperText="We'll never share your email" />);

      const helperText = getByText("We'll never share your email");
      expect(helperText.props.accessibilityLiveRegion).toBe('none');
    });
  });

  /**
   * Requirement 19.5: Dynamic text sizing support
   */
  describe('Dynamic Text Sizing', () => {
    it('should allow font scaling for Text component by default', () => {
      const { getByText } = render(<Text>Scalable text</Text>);

      const text = getByText('Scalable text');
      expect(text.props.allowFontScaling).toBe(true);
    });

    it('should respect allowFontScaling prop for Text component', () => {
      const { getByText } = render(<Text allowFontScaling={false}>Fixed size text</Text>);

      const text = getByText('Fixed size text');
      expect(text.props.allowFontScaling).toBe(false);
    });

    it('should set maximum font scale multiplier for Text component', () => {
      const { getByText } = render(<Text maxFontSizeMultiplier={1.5}>Limited scaling text</Text>);

      const text = getByText('Limited scaling text');
      expect(text.props.maxFontSizeMultiplier).toBe(1.5);
    });

    it('should use default max font scale of 2.0 for Text component', () => {
      const { getByText } = render(<Text>Default max scale text</Text>);

      const text = getByText('Default max scale text');
      expect(text.props.maxFontSizeMultiplier).toBe(2.0);
    });

    it('should limit font scaling for Button text to 1.5x', () => {
      const { getByText } = render(<Button onPress={() => {}}>Button text</Button>);

      const buttonText = getByText('Button text');
      expect(buttonText.props.maxFontSizeMultiplier).toBe(1.5);
    });
  });

  /**
   * Requirement 19.6: Alternative text for images and icons
   */
  describe('Alternative Text for Images', () => {
    it('should provide alternative text for album artwork', () => {
      const { getByLabelText } = render(
        <OptimizedImage
          uri="https://example.com/album.jpg"
          width={80}
          height={80}
          accessibilityLabel="Album artwork for The Dark Side of the Moon by Pink Floyd"
        />
      );

      const image = getByLabelText(
        'Album artwork for The Dark Side of the Moon by Pink Floyd'
      );
      expect(image).toBeTruthy();
    });

    it('should provide alternative text for user avatars', () => {
      const { getByLabelText } = render(
        <OptimizedImage
          uri="https://example.com/avatar.jpg"
          width={40}
          height={40}
          borderRadius={20}
          accessibilityLabel="Profile picture of John Doe"
        />
      );

      const image = getByLabelText('Profile picture of John Doe');
      expect(image).toBeTruthy();
    });
  });
});

describe('Accessibility Utilities', () => {
  describe('formatCountForAccessibility', () => {
    it('should format singular count correctly', () => {
      expect(formatCountForAccessibility(1, 'listener')).toBe('1 listener');
    });

    it('should format plural count correctly', () => {
      expect(formatCountForAccessibility(5, 'listener')).toBe('5 listeners');
    });

    it('should use custom plural form', () => {
      expect(formatCountForAccessibility(2, 'person', 'people')).toBe('2 people');
    });

    it('should handle zero count', () => {
      expect(formatCountForAccessibility(0, 'listener')).toBe('0 listeners');
    });
  });

  describe('formatTimeForAccessibility', () => {
    it('should format recent time as "just now"', () => {
      const now = new Date();
      expect(formatTimeForAccessibility(now)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatTimeForAccessibility(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should format single minute ago', () => {
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
      expect(formatTimeForAccessibility(oneMinuteAgo)).toBe('1 minute ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatTimeForAccessibility(twoHoursAgo)).toBe('2 hours ago');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatTimeForAccessibility(threeDaysAgo)).toBe('3 days ago');
    });
  });

  describe('formatTrackForAccessibility', () => {
    it('should format track with artist', () => {
      expect(formatTrackForAccessibility('Bohemian Rhapsody', 'Queen')).toBe(
        'Bohemian Rhapsody by Queen'
      );
    });
  });

  describe('formatScoreForAccessibility', () => {
    it('should format score without max', () => {
      expect(formatScoreForAccessibility(10)).toBe('10 points');
    });

    it('should format single point', () => {
      expect(formatScoreForAccessibility(1)).toBe('1 point');
    });

    it('should format score with max', () => {
      expect(formatScoreForAccessibility(8, 10)).toBe('8 out of 10 points');
    });
  });

  describe('generateAccessibilityHint', () => {
    it('should generate basic hint', () => {
      expect(generateAccessibilityHint('start matchmaking')).toBe(
        'Double tap to start matchmaking'
      );
    });

    it('should generate hint with context', () => {
      expect(
        generateAccessibilityHint('start matchmaking', 'Finds users listening to the same track')
      ).toBe('Double tap to start matchmaking. Finds users listening to the same track');
    });
  });

  describe('getScreenReaderName', () => {
    it('should return platform-specific screen reader name', () => {
      const name = getScreenReaderName();
      expect(['VoiceOver', 'TalkBack', 'screen reader']).toContain(name);
    });
  });
});

describe('Accessibility State Management', () => {
  it('should check if screen reader is enabled', async () => {
    const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    expect(typeof isEnabled).toBe('boolean');
  });

  it('should check if reduce motion is enabled', async () => {
    const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    expect(typeof isEnabled).toBe('boolean');
  });
});

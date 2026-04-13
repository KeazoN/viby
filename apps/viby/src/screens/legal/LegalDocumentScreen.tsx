/**
 * Legal Document Screen
 * 
 * Displays legal documents (Privacy Policy, Terms of Service) in a scrollable view.
 * 
 * Requirements: 24.3, 24.4
 * - 24.3: Provide privacy policy accessible from app and during onboarding
 * - 24.4: Provide terms of service accessible from app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Text } from '@viby/shared/design-system';
import { colors, spacing } from '@viby/shared/design-system';

type LegalDocumentType = 'privacy-policy' | 'terms-of-service';

type LegalDocumentScreenRouteProp = RouteProp<
  { LegalDocument: { documentType: LegalDocumentType } },
  'LegalDocument'
>;

// Import legal documents as strings
const privacyPolicyContent = require('../../legal/privacy-policy.md');
const termsOfServiceContent = require('../../legal/terms-of-service.md');

export function LegalDocumentScreen() {
  const route = useRoute<LegalDocumentScreenRouteProp>();
  const { documentType } = route.params;

  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocument();
  }, [documentType]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, you would fetch the markdown content and parse it
      // For now, we'll display a simplified version
      let documentContent = '';
      
      if (documentType === 'privacy-policy') {
        documentContent = getPrivacyPolicyText();
      } else {
        documentContent = getTermsOfServiceText();
      }
      
      setContent(documentContent);
    } catch (error) {
      console.error('Failed to load legal document:', error);
      setContent('Failed to load document. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrivacyPolicyText = () => {
    return `Privacy Policy

Last Updated: January 2025

Introduction

Welcome to Viby. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

Information We Collect

Account Information: When you authenticate with Spotify or Deezer, we collect your username, display name, profile picture, email address, and user ID.

Profile Information: You may provide favorite artists, music preferences, bio, notification preferences, and privacy settings.

User Content: We collect chat messages, game session data, scores, and match history.

Music Listening Data: With your permission, we collect currently playing track information, listening history, music taste preferences, and top artists/tracks/genres.

Usage Data: We automatically collect app usage patterns, screen views, session duration, device information, IP address, and general location.

Performance Data: We collect crash reports, error logs, API response times, WebSocket connection quality, and app performance metrics.

How We Use Your Information

We use your information to:
• Enable realtime discovery of users listening to the same music
• Match you with other users based on shared listening
• Facilitate game sessions and chat conversations
• Display your profile and music statistics
• Personalize content and recommendations
• Analyze usage patterns to enhance features
• Send push notifications for matches and messages
• Detect and prevent fraud, abuse, and security incidents
• Comply with legal obligations

How We Share Your Information

We do not sell your personal information. We may share information with:
• Other users (profile info, currently playing track, match history)
• Service providers (cloud hosting, analytics, error tracking, push notifications)
• Streaming services (minimal info to maintain connected account)
• Legal authorities (when required by law)
• Business transfers (in case of merger or acquisition)

Data Retention

• Account Data: Until you delete your account
• Chat Messages: 90 days after conversation ends
• Match History: 1 year
• Analytics Data: Aggregated data retained indefinitely
• Crash Reports: 90 days

Your Rights and Choices

• Access and update your profile information
• Request account deletion (contact privacy@viby.app)
• Disable push notifications
• Disconnect streaming service
• Request a copy of your data

Data Security

We implement encryption of data in transit and at rest, secure token storage, certificate pinning, regular security audits, and access controls.

Children's Privacy

The App is not intended for children under 13. We do not knowingly collect information from children under 13.

Contact Us

Email: privacy@viby.app
For EU users: dpo@viby.app

For complete details, please visit our website or contact us.`;
  };

  const getTermsOfServiceText = () => {
    return `Terms of Service

Last Updated: January 2025

Agreement to Terms

By using the Viby mobile application, you agree to be bound by these Terms of Service. If you do not agree, do not use the App.

Description of Service

Viby enables users to:
• Discover other users listening to the same music in realtime
• Match with users based on shared listening activity
• Play music trivia games with matched users
• Chat with matched users
• View and manage their music profile and match history

Eligibility

You must be at least 13 years old to use the App. If under 18, you must have parental or guardian consent.

Account Registration and Security

You must authenticate with Spotify or Deezer. You are responsible for maintaining account security and all activities under your account.

User Conduct

You agree NOT to:
• Post illegal, harmful, threatening, abusive, or hateful content
• Harass, bully, or intimidate other users
• Use the App for unauthorized commercial purposes
• Attempt unauthorized access to the App or other accounts
• Reverse engineer or disassemble the App
• Use automated systems (bots, scrapers)
• Interfere with the App's functionality
• Violate any applicable laws

Content and Intellectual Property

You retain ownership of your content but grant us a license to store, process, and display it as necessary. The App and its content are owned by Viby and protected by intellectual property laws.

Privacy and Data Protection

Your use is subject to our Privacy Policy. We collect music listening data, profile information, and usage data. We do not sell your personal information.

Matching and Interactions

Matches are automated based on currently playing tracks. We strive to provide a safe environment but cannot guarantee user behavior. Report inappropriate behavior using in-app reporting.

Games and Scoring

Games are scored automatically. Play fairly without cheating or exploiting bugs. We may void results or suspend accounts for unfair play.

Chat and Messaging

Chat messages are transmitted in realtime and stored for up to 90 days. We employ content moderation to detect prohibited content.

Disclaimers and Limitations of Liability

THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES. WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED $100.

Indemnification

You agree to indemnify and hold harmless Viby from any claims arising from your use of the App or violation of these Terms.

Changes to Terms

We may modify these Terms at any time. Continued use after changes constitutes acceptance.

Termination

You may delete your account anytime. We may suspend or terminate your account for violations or other reasons.

Dispute Resolution

These Terms are governed by applicable law. Disputes shall be resolved through binding arbitration. You waive the right to participate in class actions.

Contact Information

Email: support@viby.app
Legal Inquiries: legal@viby.app

For complete details, please visit our website or contact us.`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.cyan} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      testID="legal-document-screen"
    >
      <Text variant="body" style={styles.text}>
        {content}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  text: {
    lineHeight: 24,
    color: colors.text.primary,
  },
});

/**
 * Report User Modal
 * 
 * Modal for reporting users for inappropriate behavior.
 * Provides options for different report reasons and optional description.
 * 
 * Requirements: 24.6
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  Card,
} from '@viby/shared/design-system';
import { ReportReason, reportingService } from '@viby/modules/chat';

interface ReportUserModalProps {
  visible: boolean;
  userId: string;
  username: string;
  roomId?: string;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

interface ReportOption {
  reason: ReportReason;
  label: string;
  description: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    reason: ReportReason.HARASSMENT,
    label: 'Harassment',
    description: 'Bullying, threats, or abusive behavior',
  },
  {
    reason: ReportReason.INAPPROPRIATE_CONTENT,
    label: 'Inappropriate Content',
    description: 'Offensive or explicit messages',
  },
  {
    reason: ReportReason.SPAM,
    label: 'Spam',
    description: 'Repetitive or unwanted messages',
  },
  {
    reason: ReportReason.HATE_SPEECH,
    label: 'Hate Speech',
    description: 'Discriminatory or hateful language',
  },
  {
    reason: ReportReason.IMPERSONATION,
    label: 'Impersonation',
    description: 'Pretending to be someone else',
  },
  {
    reason: ReportReason.OTHER,
    label: 'Other',
    description: 'Other violations of community guidelines',
  },
];

export function ReportUserModal({
  visible,
  userId,
  username,
  roomId,
  onClose,
  onReportSubmitted,
}: ReportUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reportingService.reportUser({
        reportedUserId: userId,
        reason: selectedReason,
        description: description.trim() || undefined,
        roomId,
      });

      setSuccess(true);
      
      // Show success message briefly before closing
      setTimeout(() => {
        onReportSubmitted?.();
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <Card style={styles.successCard}>
            <Text style={styles.successEmoji}>✓</Text>
            <Text style={styles.successTitle}>Report Submitted</Text>
            <Text style={styles.successText}>
              Thank you for helping keep our community safe.
            </Text>
          </Card>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Card style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Report User</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close report modal"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Username */}
            <Text style={styles.username}>@{username}</Text>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Reason selection */}
              <Text style={styles.sectionTitle}>Reason for reporting</Text>
              {REPORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.reason}
                  style={[
                    styles.reasonOption,
                    selectedReason === option.reason && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setSelectedReason(option.reason)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedReason === option.reason }}
                  accessibilityLabel={`Report for ${option.label}`}
                >
                  <View style={styles.reasonContent}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedReason === option.reason && styles.radioButtonSelected,
                      ]}
                    >
                      {selectedReason === option.reason && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <View style={styles.reasonText}>
                      <Text style={styles.reasonLabel}>{option.label}</Text>
                      <Text style={styles.reasonDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Optional description */}
              <Text style={styles.sectionTitle}>
                Additional details (optional)
              </Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Provide more context about the issue..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                maxLength={500}
                textAlignVertical="top"
                accessibilityLabel="Additional details"
              />

              {/* Error message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Cancel report"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Submit report"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalCard: {
    padding: spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
    lineHeight: 20,
  },
  username: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    marginBottom: spacing[6],
  },
  scrollView: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  reasonOption: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    borderColor: colors.accent.cyan,
    backgroundColor: colors.background.tertiary,
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    marginRight: spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioButtonSelected: {
    borderColor: colors.accent.cyan,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.cyan,
  },
  reasonText: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  reasonDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  descriptionInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    minHeight: 100,
    marginBottom: spacing[4],
  },
  errorContainer: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  errorText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  successCard: {
    padding: spacing[8],
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  successText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

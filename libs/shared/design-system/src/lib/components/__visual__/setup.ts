/**
 * Visual Regression Testing Setup
 * 
 * This file configures jest-image-snapshot for visual regression testing
 * of design system components.
 */

import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

// Configure default options for image snapshots
export const imageSnapshotOptions = {
  // Threshold for pixel difference (0-1, where 0 is exact match)
  failureThreshold: 0.01,
  failureThresholdType: 'percent' as const,
  // Custom snapshot directory
  customSnapshotsDir: '__visual__/snapshots',
  customDiffDir: '__visual__/diffs',
};

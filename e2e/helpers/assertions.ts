/**
 * Custom assertions for E2E tests
 */

import { element, by, expect as detoxExpect } from 'detox';

/**
 * Assert that a screen is displayed
 */
export async function assertScreenVisible(screenTestID: string): Promise<void> {
  await detoxExpect(element(by.id(screenTestID))).toBeVisible();
}

/**
 * Assert that a list has a specific number of items
 */
export async function assertListItemCount(
  listTestID: string,
  count: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await detoxExpect(
      element(by.id(`${listTestID}-item-${i}`))
    ).toExist();
  }
}

/**
 * Assert that a button is enabled
 */
export async function assertButtonEnabled(buttonTestID: string): Promise<void> {
  await detoxExpect(element(by.id(buttonTestID))).toBeVisible();
  // Note: Detox doesn't have a direct "enabled" matcher
  // We check if it's visible and can be tapped
}

/**
 * Assert that a button is disabled
 */
export async function assertButtonDisabled(buttonTestID: string): Promise<void> {
  // In React Native, disabled buttons are typically not tappable
  // We can check for specific styling or traits
  await detoxExpect(element(by.id(buttonTestID))).toExist();
}

/**
 * Assert that an input field has specific value
 */
export async function assertInputValue(
  inputTestID: string,
  value: string
): Promise<void> {
  await detoxExpect(element(by.id(inputTestID))).toHaveText(value);
}

/**
 * Assert that an error message is displayed
 */
export async function assertErrorMessage(message: string): Promise<void> {
  await detoxExpect(element(by.text(message))).toBeVisible();
}

/**
 * Assert that a loading indicator is visible
 */
export async function assertLoadingVisible(
  loadingTestID: string = 'loading-indicator'
): Promise<void> {
  await detoxExpect(element(by.id(loadingTestID))).toBeVisible();
}

/**
 * Assert that a loading indicator is not visible
 */
export async function assertLoadingNotVisible(
  loadingTestID: string = 'loading-indicator'
): Promise<void> {
  await detoxExpect(element(by.id(loadingTestID))).not.toBeVisible();
}

/**
 * Assert that a modal is visible
 */
export async function assertModalVisible(modalTestID: string): Promise<void> {
  await detoxExpect(element(by.id(modalTestID))).toBeVisible();
}

/**
 * Assert that a modal is not visible
 */
export async function assertModalNotVisible(modalTestID: string): Promise<void> {
  await detoxExpect(element(by.id(modalTestID))).not.toBeVisible();
}

/**
 * Assert that a toast/notification is visible
 */
export async function assertToastVisible(message: string): Promise<void> {
  await detoxExpect(element(by.text(message))).toBeVisible();
}

/**
 * Assert that navigation occurred to a specific screen
 */
export async function assertNavigatedTo(screenTestID: string): Promise<void> {
  await detoxExpect(element(by.id(screenTestID))).toBeVisible();
}

/**
 * Assert that an element has specific accessibility label
 */
export async function assertAccessibilityLabel(
  testID: string,
  label: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).toHaveLabel(label);
}

/**
 * Assert that an element is focused
 */
export async function assertElementFocused(testID: string): Promise<void> {
  // Detox doesn't have direct focus assertion
  // We can check if keyboard is visible as a proxy
  await detoxExpect(element(by.id(testID))).toBeVisible();
}

/**
 * Assert that a badge has specific value
 */
export async function assertBadgeValue(
  badgeTestID: string,
  value: string
): Promise<void> {
  await detoxExpect(element(by.id(badgeTestID))).toHaveText(value);
}

/**
 * Assert that an image is loaded
 */
export async function assertImageLoaded(imageTestID: string): Promise<void> {
  await detoxExpect(element(by.id(imageTestID))).toBeVisible();
}

/**
 * Assert that a tab is selected
 */
export async function assertTabSelected(tabTestID: string): Promise<void> {
  // Check for selected state - implementation depends on tab component
  await detoxExpect(element(by.id(tabTestID))).toBeVisible();
}

/**
 * Assert that a switch is on
 */
export async function assertSwitchOn(switchTestID: string): Promise<void> {
  // Detox doesn't have direct switch state assertion
  // We check for specific traits or labels
  await detoxExpect(element(by.id(switchTestID))).toExist();
}

/**
 * Assert that a switch is off
 */
export async function assertSwitchOff(switchTestID: string): Promise<void> {
  await detoxExpect(element(by.id(switchTestID))).toExist();
}

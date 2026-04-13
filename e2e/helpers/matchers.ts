/**
 * Custom Detox matchers for common test scenarios
 */

import { element, by, waitFor, expect as detoxExpect } from 'detox';

/**
 * Wait for an element to be visible with a custom timeout
 */
export async function waitForElement(
  testID: string,
  timeout: number = 5000
): Promise<void> {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Wait for an element with text to be visible
 */
export async function waitForText(
  text: string,
  timeout: number = 5000
): Promise<void> {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Tap an element by test ID
 */
export async function tapElement(testID: string): Promise<void> {
  await element(by.id(testID)).tap();
}

/**
 * Type text into an input field
 */
export async function typeText(testID: string, text: string): Promise<void> {
  await element(by.id(testID)).typeText(text);
}

/**
 * Clear text from an input field
 */
export async function clearText(testID: string): Promise<void> {
  await element(by.id(testID)).clearText();
}

/**
 * Scroll to an element in a scroll view
 */
export async function scrollToElement(
  scrollViewTestID: string,
  elementTestID: string,
  direction: 'up' | 'down' | 'left' | 'right' = 'down'
): Promise<void> {
  await waitFor(element(by.id(elementTestID)))
    .toBeVisible()
    .whileElement(by.id(scrollViewTestID))
    .scroll(100, direction);
}

/**
 * Swipe on an element
 */
export async function swipeElement(
  testID: string,
  direction: 'up' | 'down' | 'left' | 'right',
  speed: 'fast' | 'slow' = 'fast'
): Promise<void> {
  await element(by.id(testID)).swipe(direction, speed);
}

/**
 * Assert element is visible
 */
export async function assertVisible(testID: string): Promise<void> {
  await detoxExpect(element(by.id(testID))).toBeVisible();
}

/**
 * Assert element is not visible
 */
export async function assertNotVisible(testID: string): Promise<void> {
  await detoxExpect(element(by.id(testID))).not.toBeVisible();
}

/**
 * Assert element exists (but may not be visible)
 */
export async function assertExists(testID: string): Promise<void> {
  await detoxExpect(element(by.id(testID))).toExist();
}

/**
 * Assert text is visible
 */
export async function assertTextVisible(text: string): Promise<void> {
  await detoxExpect(element(by.text(text))).toBeVisible();
}

/**
 * Assert element has text
 */
export async function assertElementHasText(
  testID: string,
  text: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).toHaveText(text);
}

/**
 * Assert element has label (accessibility label)
 */
export async function assertElementHasLabel(
  testID: string,
  label: string
): Promise<void> {
  await detoxExpect(element(by.id(testID))).toHaveLabel(label);
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(
  testID: string,
  timeout: number = 5000
): Promise<void> {
  await waitFor(element(by.id(testID)))
    .not.toBeVisible()
    .withTimeout(timeout);
}

/**
 * Take a screenshot with a name
 */
export async function takeScreenshot(name: string): Promise<void> {
  await device.takeScreenshot(name);
}

/**
 * Reload React Native
 */
export async function reloadApp(): Promise<void> {
  await device.reloadReactNative();
}

/**
 * Launch app with specific permissions
 */
export async function launchAppWithPermissions(
  permissions?: Record<string, string>
): Promise<void> {
  await device.launchApp({
    permissions,
    newInstance: true,
  });
}

/**
 * Send app to background and bring back to foreground
 */
export async function backgroundAndForeground(duration: number = 2000): Promise<void> {
  await device.sendToHome();
  await new Promise(resolve => setTimeout(resolve, duration));
  await device.launchApp({ newInstance: false });
}

import type { Page } from "@playwright/test";
import { getEditorHandle } from "@udecode/plate-playwright";

// Extend Window interface to include platePlaywrightAdapter
declare global {
  interface Window {
    platePlaywrightAdapter?: object;
  }
}

/**
 * Waits for the Playwright adapter to be available and ready.
 * This helps avoid race conditions with the adapter not being loaded.
 */
export async function waitForPlaywrightAdapter(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      return (
        window.platePlaywrightAdapter &&
        typeof window.platePlaywrightAdapter === "object"
      );
    },
    { timeout },
  );
}

/**
 * Robust version of getEditorHandle that waits for adapter and retries on failure.
 */
export async function getEditorHandleWithRetry(page: Page, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // First wait for the adapter to be available
      await waitForPlaywrightAdapter(page);

      // Then get the editor handle
      const editorHandle = await getEditorHandle(page);
      return editorHandle;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to get editor handle after ${maxRetries} attempts. Last error: ${error}`,
        );
      }

      // Wait a bit before retrying
      await page.waitForTimeout(1000 * attempt);
    }
  }
  throw new Error("Unexpected error in getEditorHandleWithRetry");
}

/**
 * Toggles the stream connection button (Connect/Disconnect).
 * Assumes the button is identifiable by its accessible name which includes "Stream".
 */
export async function toggleStreamConnection(page: Page) {
  await page.getByRole("button", { name: /Stream/ }).click();
}

/**
 * Types text into the message input area and sends it.
 */
export async function sendTextMessage(page: Page, text: string) {
  // Find the textarea using its aria-label
  const textarea = page.getByRole("textbox", { name: "Message input" });
  await textarea.fill(text);

  // Find the send button by its accessible name and click it
  const sendButton = page.getByRole("button", { name: "Send message" });
  await sendButton.click();
}

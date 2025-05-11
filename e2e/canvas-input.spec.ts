import { type Page, expect, test } from "@playwright/test";
import {
  clickAtPath,
  getEditorHandle,
  setSelection,
} from "@udecode/plate-playwright";

/**
 * Toggles the stream connection button (Connect/Disconnect).
 * Assumes the button is identifiable by its accessible name which includes "Stream".
 */
async function toggleStreamConnection(page: Page) {
  await page.getByRole("button", { name: /Stream/ }).click();
}

/**
 * Types text into the message input area and sends it.
 */
async function sendTextMessage(page: Page, text: string) {
  // Find the textarea using its aria-label
  const textarea = page.getByRole("textbox", { name: "Message input" });
  await textarea.fill(text);

  // Find the send button by its accessible name and click it
  const sendButton = page.getByRole("button", { name: "Send message" });
  await sendButton.click();
}

test.describe("Canvas Input", () => {
  test("Pasting into the canvas editor", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-slate-editor]");
    const editorHandle = await getEditorHandle(page);

    // Clear the editor content to a single empty paragraph
    await editorHandle.evaluate((editor) => {
      editor.children = [
        {
          type: "p", // Assuming 'p' is the default paragraph type for the editor
          children: [{ text: "" }],
        },
      ];
      // Reset selection to the beginning of the new content
      editor.selection = {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 },
      };
      // If the editor has an onChange handler that needs to be manually triggered after direct manipulation
      if (typeof editor.onChange === "function") {
        editor.onChange();
      }
    });

    await clickAtPath(page, editorHandle, [0]);

    await setSelection(page, editorHandle, {
      path: [0, 0],
      offset: 0,
    });

    const pasteText = "Pasted content here!";

    await page.keyboard.insertText(pasteText);

    const firstNodeValueAfterPaste = await editorHandle.evaluate(
      (editor) => editor.children[0],
    );

    expect(firstNodeValueAfterPaste.children[0].text).toEqual(
      expect.stringContaining(pasteText),
    );
  });
});

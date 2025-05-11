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
  test.beforeEach(async ({ page }) => {
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
  });

  test("Pasting into the canvas editor", async ({ page }) => {
    const editorHandle = await getEditorHandle(page);
    await clickAtPath(page, editorHandle, [0]);

    await setSelection(page, editorHandle, {
      path: [0, 0],
      offset: 0,
    });

    const pasteText = "Pasted content here!";

    await page.keyboard.insertText(pasteText);

    const markdownContentAfterPaste = await editorHandle.evaluate((editor) =>
      editor.getApi({ key: "markdown" }).markdown.serialize(),
    );

    expect(markdownContentAfterPaste).toEqual(
      expect.stringContaining(pasteText),
    );
  });

  test("Adding paragraphs to the canvas editor", async ({ page }) => {
    const editorHandle = await getEditorHandle(page);
    await clickAtPath(page, editorHandle, [0]);

    await setSelection(page, editorHandle, {
      path: [0, 0],
      offset: 0,
    });

    const pasteText = `
The lingering chill of the Icelandic spring was finally, almost imperceptibly, beginning to loosen its grip. For months, the days had been a gradual reclaim of light, each one stretching a few precious minutes longer than the last. But now, in mid-May, there was a palpable shift. It wasn't just about the quantity of daylight anymore, which was already extending deep into the evenings, but the quality of it. The sun, when it broke through the often-stubborn cloud cover, carried a warmth that felt different, more promising than the pale, low-angled light of March and April. You could feel a collective sigh of relief from the land and its inhabitants, a quiet turning of the page from the introspective quiet of winter towards the vibrant energy of the approaching summer.  The most immediate signs of this transformation were etched into the landscape itself. The stubborn patches of snow, which had clung resolvingly to shaded hollows and mountain slopes, were now in visible retreat, surrendering ground daily to the tenacious new growth. Tender green shoots were pushing through the thawing earth, unfurling with a determination that seemed almost defiant after the long freeze. Around the city, the first brave flowers were starting to appear in gardens and along walkways – tiny splashes of purple and yellow that felt like miniature celebrations. Even the air carried a different scent, a mixture of damp earth, new grass, and the faint, salty tang carried inland from the warming ocean.  This awakening wasn't lost on the local wildlife, nor on the people who call this island home. The sharp, joyful cries of returning migratory birds became a daily soundtrack, replacing the relative quiet of the winter months. Oystercatchers and golden plovers could be seen staking their claims along the coastlines and in the fields, their busy activities a sure sign that the breeding season was underway. For Reykjavik's residents, the extended daylight hours and milder temperatures meant a resurgence of outdoor life. Cafes spilled tables onto sidewalks, the Laugavegur shopping street buzzed with a renewed energy, and groups of friends could be seen gathering by the Tjörnin pond, enjoying the simple pleasure of being outside without the need for the heaviest winter gear.  Beyond the city limits, the transformation was even more dramatic. The roads leading out into the countryside, which had been quiet for months, started to see more traffic as people ventured out to witness the spring melt in full flow. Waterfalls, engorged with thawing snow and ice from the glaciers and highlands, thundered with an impressive force, sending plumes of mist into the air. The mossy lava fields, a hallmark of the Icelandic landscape, were slowly shedding their winter drabness, revealing a thousand shades of green, from the darkest olive to the brightest lime. It was a time of powerful renewal, a reminder of the immense natural forces that shape this young land. There was also a growing sense of anticipation in the air, a looking forward to the true Icelandic summer. Thoughts turned to the midnight sun, those magical weeks when darkness barely grazes the horizon. Plans were being made for summer hikes, camping trips, and visits to the remote Westfjords or the vibrant Eastern fjords. The tourism sector, a vital part of the Icelandic economy, was gearing up for the peak season, with tour operators and guesthouses preparing for the influx of visitors eager to experience the unique landscapes under the endless light. This period of transition felt like a vibrant overture, building excitement for the main performance of summer.  Ultimately, witnessing this shift from the long, dark winter to the burgeoning life of late spring in Iceland is a profound experience. It's more than just a change in weather; it's a fundamental alteration in the rhythm of life, a powerful demonstration of nature's resilience and its cyclical dance. Each longer day, each new bird song, each unfurling leaf feels like a small victory, a step further away from the shadows and closer to the full embrace of the light. It imbues the everyday with a sense of quiet wonder and a deep appreciation for the relentless, beautiful unfolding of the seasons.
`.trim();

    await page.keyboard.insertText(pasteText);

    const markdownContentAfterPaste = await editorHandle.evaluate((editor) =>
      editor.getApi({ key: "markdown" }).markdown.serialize(),
    );

    expect(markdownContentAfterPaste).toEqual(
      expect.stringContaining(pasteText),
    );
  });
});

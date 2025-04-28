import type { PlateEditor } from "@udecode/plate/react";
import {
  type BaseRange,
  type Editor,
  Node,
  type Path,
  type Point,
  Text,
} from "slate";

export function getParagraphNodes(
  editor: PlateEditor,
  start: number,
  end: number,
): Node[] {
  const slateEditor = editor as unknown as Editor;
  const nodes: Node[] = [];
  for (let i = start; i <= end; i++) {
    const node = Node.get(slateEditor, [i]);
    if (!node) throw new Error(`Could not find node at index ${i}`);
    nodes.push(node);
  }

  return nodes;
}

export function getParagraphTexts(
  editor: PlateEditor,
  start: number,
  end: number,
): string[] {
  return getParagraphNodes(editor, start, end).map(Node.string);
}

export function combineParagraphTexts(texts: string[]): string {
  return texts.join("\n");
}

export function findTextInParagraphs(texts: string[], selectedText: string) {
  // If the text is not found in the combined text, try checking individual paragraphs
  // for single paragraph selections
  if (texts.length === 1) {
    const index = texts[0].indexOf(selectedText);
    if (index !== -1) {
      return {
        start: { paragraph: 0, offset: index },
        end: { paragraph: 0, offset: index + selectedText.length },
      };
    }
  }

  const combined = combineParagraphTexts(texts);
  const startIndex = combined.indexOf(selectedText);
  if (startIndex === -1) return null;

  // Track accumulated lengths to map combined index to paragraph/offset
  let acc = 0;
  let start: { paragraph: number; offset: number } | null = null;
  let end: { paragraph: number; offset: number } | null = null;
  const endIndex = startIndex + selectedText.length;

  for (let i = 0; i < texts.length; i++) {
    const currentTextLength = texts[i].length;
    // Account for newline character in accumulator except for first paragraph
    const newlineAdjustment = i > 0 ? 1 : 0;

    // Calculate boundary for current paragraph
    const paragraphStart = acc;
    const paragraphEnd = acc + currentTextLength;

    // Check if selection starts in this paragraph
    if (!start && startIndex >= paragraphStart && startIndex <= paragraphEnd) {
      // Adjust offset by removing accumulated length and newline adjustment
      const adjustedOffset = startIndex - acc;
      start = { paragraph: i, offset: adjustedOffset };
    }

    // Check if selection ends in this paragraph
    if (
      start &&
      !end &&
      endIndex > 0 &&
      endIndex <= paragraphEnd + newlineAdjustment
    ) {
      // For the end position, we need to be careful with the newline
      const adjustedOffset = endIndex - acc;
      // Ensure we don't exceed text length
      end = {
        paragraph: i,
        offset: Math.min(adjustedOffset, currentTextLength),
      };
      break;
    }

    // Update accumulator for next paragraph
    acc += currentTextLength + 1; // +1 for newline
  }

  // If we couldn't determine both start and end, the selection wasn't found
  if (!start || !end) return null;

  return { start, end };
}

export function getSlatePoint(
  editor: PlateEditor,
  paragraphIndex: number,
  offset: number,
): Point {
  const slateEditor = editor as unknown as Editor;
  const path: Path = [paragraphIndex, 0];
  if (Node.has(slateEditor, path) && Text.isText(Node.get(slateEditor, path))) {
    const textNode = Node.get(slateEditor, path) as Text;

    return { path, offset: Math.min(offset, textNode.text.length) };
  }

  return { path, offset: 0 };
}

export function getSelectionText(editor: PlateEditor, selection: BaseRange) {
  const startParagraphIndex = selection.anchor.path[0];
  const endParagraphIndex = selection.focus.path[0];

  // Get the paragraph nodes for markdown formatting
  const paragraphNodes = getParagraphNodes(
    editor,
    startParagraphIndex,
    endParagraphIndex,
  );

  if (startParagraphIndex === endParagraphIndex) {
    const start = selection.anchor.offset;
    const end = selection.focus.offset;
    const minOffset = Math.min(start, end);
    const maxOffset = Math.max(start, end);

    // Get the plain text content of the node
    const text = Node.string(paragraphNodes[0]);
    const selectedText = text.slice(minOffset, maxOffset);

    return {
      startParagraphIndex,
      endParagraphIndex,
      selectedText,
    };
  }

  // For cross-paragraph selection, use plain text
  const texts = paragraphNodes.map(Node.string);

  return {
    startParagraphIndex,
    endParagraphIndex,
    selectedText: combineParagraphTexts(texts),
  };
}

/**
 * Converts rich text nodes to markdown-formatted text
 * This function will be used in the future for markdown formatting
 */
export function getMarkdownFormattedText(
  node: Node,
  startOffset?: number,
  endOffset?: number,
): string {
  // If the node is a text leaf
  if (Text.isText(node)) {
    let text = node.text;

    // Apply substring if offsets are provided
    if (startOffset !== undefined && endOffset !== undefined) {
      text = text.slice(startOffset, endOffset);
    }

    // Format based on mark properties
    // Using type assertion with unknown to access custom properties
    const textNode = node as unknown as {
      text: string;
      bold?: boolean;
      kbd?: boolean;
    };
    if (textNode.bold) {
      text = `**${text}**`;
    }
    if (textNode.kbd) {
      text = `\`${text}\``;
    }
    // Add other formatting as needed (italic, code, etc.)

    return text;
  }

  // If the node is an element with children
  if ("children" in node) {
    const element = node as unknown as { type?: string; children: Node[] };

    // Format headings
    if (element.type?.startsWith("h")) {
      const level = Number.parseInt(element.type.substring(1), 10);
      const prefix = `${"#".repeat(level)} `;
      const content = element.children
        .map((child) => getMarkdownFormattedText(child))
        .join("");
      return `${prefix}${content}`;
    }

    // Handle lists, blockquotes, etc. as needed

    // Default: just concatenate the formatted children
    return element.children
      .map((child) => getMarkdownFormattedText(child))
      .join("");
  }

  // Fallback
  return Node.string(node);
}

export interface ReadableSelection {
  /** The paragraph index at the selection start */
  startParagraphIndex: number;
  /** The paragraph index at the selection end */
  endParagraphIndex: number;
  /** The selected text content */
  selectedText: string;
}

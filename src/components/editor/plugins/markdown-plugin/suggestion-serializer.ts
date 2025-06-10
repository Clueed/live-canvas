import { createRegexPatterns } from "./suggestion-regex";

/**
 * Simplified Suggestion Serialization Utilities
 *
 * Provides utilities for converting between verbose and simplified suggestion syntax.
 * The simplified syntax is designed to be LLM-friendly and easy to read/write.
 *
 * Simplified Syntax:
 * - Insert: <ins>new text</ins>
 * - Remove: <del>removed text</del>
 * - Replace: <ins prev="old text">new text</ins>
 *
 * Verbose Syntax (original):
 * - Insert: <ins data-suggestion-id="..." data-suggestion-user="...">new text</ins>
 * - Remove: <del data-suggestion-id="..." data-suggestion-user="...">removed text</del>
 */

export interface SuggestionParseResult {
  type: "insert" | "delete" | "replace";
  newText?: string;
  oldText?: string;
  position: {
    start: number;
    end: number;
  };
}

/**
 * Converts verbose suggestion syntax to simplified syntax
 */
export function simplifyVerboseSuggestions(markdown: string): string {
  let processedMarkdown = markdown;
  const regex = createRegexPatterns();

  // Convert verbose ins tags to simple ones
  processedMarkdown = processedMarkdown.replace(
    regex.verboseIns,
    "<ins>$1</ins>",
  );

  // Convert verbose del tags to simple ones
  processedMarkdown = processedMarkdown.replace(
    regex.verboseDel,
    "<del>$1</del>",
  );

  return processedMarkdown;
}

/**
 * Converts simplified suggestion syntax to verbose syntax
 */
export function expandSimplifiedSuggestions(
  markdown: string,
  userId = "user1",
): string {
  let processedMarkdown = markdown;
  const regex = createRegexPatterns();

  // Convert replace syntax to verbose
  processedMarkdown = processedMarkdown.replace(
    regex.replace,
    (match, oldText, newText) => {
      const id = generateSuggestionId();
      return `<del data-suggestion-id="${id}" data-suggestion-user="${userId}">${oldText}</del><ins data-suggestion-id="${id}" data-suggestion-user="${userId}">${newText}</ins>`;
    },
  );

  // Convert simple ins to verbose
  processedMarkdown = processedMarkdown.replace(
    regex.insertAll,
    (match, text) => {
      const id = generateSuggestionId();
      return `<ins data-suggestion-id="${id}" data-suggestion-user="${userId}">${text}</ins>`;
    },
  );

  // Convert simple del to verbose
  processedMarkdown = processedMarkdown.replace(regex.delete, (match, text) => {
    const id = generateSuggestionId();
    return `<del data-suggestion-id="${id}" data-suggestion-user="${userId}">${text}</del>`;
  });

  return processedMarkdown;
}

/**
 * Parses simplified suggestion syntax and returns structured data
 */
export function parseSimplifiedSuggestions(
  markdown: string,
): SuggestionParseResult[] {
  const results: SuggestionParseResult[] = [];
  const regex = createRegexPatterns();

  // Parse replacements
  const replaceMatches = Array.from(markdown.matchAll(regex.replace));
  for (const match of replaceMatches) {
    if (match.index !== undefined) {
      results.push({
        type: "replace",
        oldText: match[1],
        newText: match[2],
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }
  }

  // Parse insertions (excluding replacements)
  const insertMatches = Array.from(markdown.matchAll(regex.insert));
  for (const match of insertMatches) {
    if (match.index !== undefined) {
      results.push({
        type: "insert",
        newText: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }
  }

  // Parse deletions
  const deleteMatches = Array.from(markdown.matchAll(regex.delete));
  for (const match of deleteMatches) {
    if (match.index !== undefined) {
      results.push({
        type: "delete",
        oldText: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }
  }

  return results.sort((a, b) => a.position.start - b.position.start);
}

/**
 * Applies simplified suggestions to clean markdown (removes suggestion tags)
 */
export function applySimplifiedSuggestions(markdown: string): string {
  let processedMarkdown = markdown;
  const regex = createRegexPatterns();

  // Apply replacements first
  processedMarkdown = processedMarkdown.replace(regex.replace, "$2");

  // Apply insertions
  processedMarkdown = processedMarkdown.replace(regex.insertAll, "$1");

  // Apply deletions (remove the text)
  processedMarkdown = processedMarkdown.replace(regex.delete, "");

  return processedMarkdown;
}

/**
 * Creates suggestions in simplified format from a diff
 */
export function createSimplifiedSuggestions(
  oldText: string,
  newText: string,
): string {
  // This is a basic implementation - a more sophisticated version would use
  // a proper diff algorithm like Myers or similar

  if (oldText === newText) {
    return newText;
  }

  if (oldText === "") {
    return `<ins>${newText}</ins>`;
  }

  if (newText === "") {
    return `<del>${oldText}</del>`;
  }

  return `<ins prev="${oldText}">${newText}</ins>`;
}

/**
 * Generates a unique suggestion ID
 */
function generateSuggestionId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Examples and demo data
 */
export const SUGGESTION_EXAMPLES = {
  simple: {
    input:
      '# <ins prev="Playground">Live Canvas</ins>\n\nA rich-text editor with AI capabilities.',
    applied: "# Live Canvas\n\nA rich-text editor with AI capabilities.",
    verbose:
      '# <del data-suggestion-id="abc123" data-suggestion-user="user1">Playground</del><ins data-suggestion-id="abc123" data-suggestion-user="user1">Live Canvas</ins>\n\nA rich-text editor with AI capabilities.',
  },
  complex: {
    input:
      "Try the **AI commands** or use <del>Cmd+J</del><ins>Ctrl+K</ins> to open the AI menu",
    applied: "Try the **AI commands** or use Ctrl+K to open the AI menu",
    verbose:
      'Try the **AI commands** or use <del data-suggestion-id="def456" data-suggestion-user="user1">Cmd+J</del><ins data-suggestion-id="ghi789" data-suggestion-user="user1">Ctrl+K</ins> to open the AI menu',
  },
  insertion: {
    input: "This is a <ins>new feature</ins> in the editor",
    applied: "This is a new feature in the editor",
    verbose:
      'This is a <ins data-suggestion-id="jkl012" data-suggestion-user="user1">new feature</ins> in the editor',
  },
};

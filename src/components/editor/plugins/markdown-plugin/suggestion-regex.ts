/**
 * Centralized regex patterns for parsing simplified suggestion syntax
 */

// Matches replacement syntax: <ins prev="old text">new text</ins>
export const REPLACE_REGEX = /<ins\s+prev="([^"]*)"[^>]*>([^<]*)<\/ins>/g;

// Matches insertion syntax: <ins>text</ins> (but not replacements)
export const INSERT_REGEX = /<ins(?!\s+prev=)[^>]*>([^<]*)<\/ins>/g;

// Matches insertion syntax: <ins>text</ins> (including replacements)
export const INSERT_REGEX_ALL = /<ins[^>]*>([^<]*)<\/ins>/g;

// Matches deletion syntax: <del>text</del>
export const DELETE_REGEX = /<del[^>]*>([^<]*)<\/del>/g;

// Matches verbose insertion tags with data attributes
export const VERBOSE_INS_REGEX =
  /<ins\s+data-suggestion-id="[^"]*"\s+data-suggestion-user="[^"]*">([^<]*)<\/ins>/g;

// Matches verbose deletion tags with data attributes
export const VERBOSE_DEL_REGEX =
  /<del\s+data-suggestion-id="[^"]*"\s+data-suggestion-user="[^"]*">([^<]*)<\/del>/g;

/**
 * Creates a fresh instance of regex patterns (since regex objects maintain state)
 */
export function createRegexPatterns() {
  return {
    replace: new RegExp(REPLACE_REGEX.source, REPLACE_REGEX.flags),
    insert: new RegExp(INSERT_REGEX.source, INSERT_REGEX.flags),
    insertAll: new RegExp(INSERT_REGEX_ALL.source, INSERT_REGEX_ALL.flags),
    delete: new RegExp(DELETE_REGEX.source, DELETE_REGEX.flags),
    verboseIns: new RegExp(VERBOSE_INS_REGEX.source, VERBOSE_INS_REGEX.flags),
    verboseDel: new RegExp(VERBOSE_DEL_REGEX.source, VERBOSE_DEL_REGEX.flags),
  };
}

/**
 * Matches text in suggestion tags and returns the match data
 */
export interface SuggestionMatch {
  type: "insert" | "delete" | "replace";
  text: string;
  oldText?: string; // For replacements
  index: number;
  length: number;
}

/**
 * Finds all suggestion matches in the given markdown
 */
export function findAllSuggestionMatches(markdown: string): SuggestionMatch[] {
  const matches: SuggestionMatch[] = [];

  // Find replacements
  const replaceMatches = Array.from(markdown.matchAll(REPLACE_REGEX));
  for (const match of replaceMatches) {
    if (match.index !== undefined) {
      matches.push({
        type: "replace",
        text: match[2],
        oldText: match[1],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Find insertions (excluding replacements)
  const insertMatches = Array.from(markdown.matchAll(INSERT_REGEX));
  for (const match of insertMatches) {
    if (match.index !== undefined) {
      matches.push({
        type: "insert",
        text: match[1],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Find deletions
  const deleteMatches = Array.from(markdown.matchAll(DELETE_REGEX));
  for (const match of deleteMatches) {
    if (match.index !== undefined) {
      matches.push({
        type: "delete",
        text: match[1],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  return matches.sort((a, b) => a.index - b.index);
}

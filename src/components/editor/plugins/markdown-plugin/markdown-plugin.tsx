"use client";

/**
 * Custom Markdown Plugin with Simplified Suggestion Serialization
 * 
 * This plugin extends the standard MarkdownPlugin to include custom serialization
 * and deserialization for Plate suggestions with a simplified syntax for LLM consumption.
 * 
 * Simplified Syntax:
 * - Insert: <ins>new text</ins>
 * - Remove: <del>removed text</del> 
 * - Replace: <ins prev="old text">new text</ins>
 * 
 * Example:
 * ```markdown
 * # <ins prev="Playground">Live Canvas</ins>
 * 
 * A rich-text editor with AI capabilities. Try the **AI commands** or use <del>Cmd+J</del><ins>Ctrl+K</ins> to open the AI menu
 * ```
 */


import { createRegexPatterns } from "@/components/editor/plugins/markdown-plugin/suggestion-regex";
import {
  MarkdownPlugin,
  remarkMdx,
  remarkMention
} from "@udecode/plate-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";


export const markdownPlugin = MarkdownPlugin.configure({
  options: {
    disallowedNodes: [],
    remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
  },
}).extendEditorApi<{
  suggestion: {
    serializeWithSuggestions: (content?: any) => string;
    deserializeFromSuggestions: (markdown: string) => any;
  };
}>(({ editor }) => ({
  suggestion: {
    serializeWithSuggestions: (content) => {
      
      // Use the actual content or editor's current content
      const valuesToSerialize = content || editor.children;
      
      
      // First, get the regular markdown output
      const baseMarkdown = editor.getApi(MarkdownPlugin).markdown.serialize({
        value: valuesToSerialize,
      });
      
      
      // Now post-process to add simplified suggestion markup
      const markdownWithSuggestions = addSimplifiedSuggestionMarkup(valuesToSerialize, baseMarkdown);
      
      
      return markdownWithSuggestions;
    },
    
    deserializeFromSuggestions: (markdown) => {
      
      // First, parse the simplified suggestions to extract them before deserializing
      const suggestionData = parseSimplifiedSuggestionsData(markdown);
      
      // Remove the suggestion markup for regular markdown parsing
      const cleanMarkdown = markdown
        .replace(/<ins\s+prev="([^"]*)"[^>]*>([^<]*)<\/ins>/g, '$1$2') // Replace replacements with both old and new text 
        .replace(/<ins[^>]*>([^<]*)<\/ins>/g, '$1') // Keep insertions
        .replace(/<del[^>]*>([^<]*)<\/del>/g, '$1'); // Keep deletions (they'll be marked with suggestion properties)
      
      
      // Use the regular markdown deserializer on clean markdown
      const result = editor.getApi(MarkdownPlugin).markdown.deserialize(cleanMarkdown);
      
      // Post-process the result to add suggestion properties
      const resultWithSuggestions = addSuggestionPropertiesToNodes(result, suggestionData);
      
      
      return resultWithSuggestions;
    },
  },
}));

// Helper function to add simplified suggestion markup to the markdown
function addSimplifiedSuggestionMarkup(nodes: any[], markdown: string): string {
  
  let processedMarkdown = markdown;
  
  // Collect all suggestions with their context
  const suggestions = extractSuggestionData(nodes);
  
  
  // Group suggestions by their replacement context to handle replace operations
  const replacements = new Map<string, { oldText: string; newText: string; }>();
  const insertions = new Set<string>();
  const deletions = new Set<string>();
  
  suggestions.forEach(suggestion => {
    const { text, type, originalText } = suggestion;
    
    if (type === 'remove') {
      deletions.add(text);
    } else if (type === 'insert') {
      if (originalText) {
        // This is a replacement
        replacements.set(text, { oldText: originalText, newText: text });
      } else {
        // This is a pure insertion
        insertions.add(text);
      }
    }
  });
  
  // Apply replacements first (most specific)
  replacements.forEach(({ oldText, newText }) => {
    const simplifiedElement = `<ins prev="${oldText}">${newText}</ins>`;
    processedMarkdown = processedMarkdown.replace(newText, simplifiedElement);
  });
  
  // Apply pure deletions
  deletions.forEach(text => {
    const simplifiedElement = `<del>${text}</del>`;
    processedMarkdown = processedMarkdown.replace(text, simplifiedElement);
  });
  
  // Apply pure insertions
  insertions.forEach(text => {
    const simplifiedElement = `<ins>${text}</ins>`;
    processedMarkdown = processedMarkdown.replace(text, simplifiedElement);
  });
  
  return processedMarkdown;
}

// Helper function to extract suggestion data from nodes
function extractSuggestionData(nodes: any[]): Array<{
  text: string;
  type: string;
  originalText?: string;
}> {
  const suggestions: Array<{
    text: string;
    type: string;
    originalText?: string;
  }> = [];
  
  function traverse(nodeList: any[]) {
    nodeList.forEach(node => {
      if (node.children) {
        node.children.forEach((child: any) => {
          // If this is a text node with suggestion marks
          if (child.text !== undefined) {
            // Check for suggestion properties
            Object.keys(child).forEach(key => {
              if (key.startsWith('suggestion_') && typeof child[key] === 'object') {
                const suggestionData = child[key];
                suggestions.push({
                  text: child.text,
                  type: suggestionData.type || 'insert',
                  originalText: suggestionData.originalText,
                });
              }
            });
          }
          
          // If this is an element with children, process recursively
          if (child.children) {
            traverse([child]);
          }
        });
      }
    });
  }
  
  traverse(nodes);
  return suggestions;
}

// Helper function to parse simplified suggestion syntax and extract suggestion data
function parseSimplifiedSuggestionsData(markdown: string): Array<{
  text: string;
  type: 'insert' | 'remove' | 'replace';
  originalText?: string;
  suggestionId: string;
  userId: string;
  createdAt: number;
}> {
  const suggestions: Array<{
    text: string;
    type: 'insert' | 'remove' | 'replace';
    originalText?: string;
    suggestionId: string;
    userId: string;
    createdAt: number;
  }> = [];
  
  // Generate a unique suggestion ID and timestamp for this import
  const suggestionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const userId = "user3";
  const createdAt = Date.now();
  
  // Use centralized regex patterns
  const regex = createRegexPatterns();
  
  // Extract replacements: <ins prev="old">new</ins>
  let match;
  while ((match = regex.replace.exec(markdown)) !== null) {
    const [, originalText, text] = match;
    // Create separate suggestion entries for remove and insert
    suggestions.push({
      text: originalText,
      type: 'remove',
      suggestionId,
      userId,
      createdAt,
    });
    suggestions.push({
      text,
      type: 'insert',
      suggestionId,
      userId,
      createdAt,
    });
  }
  
  // Extract insertions: <ins>text</ins> (but not replacements)
  while ((match = regex.insert.exec(markdown)) !== null) {
    const [, text] = match;
    suggestions.push({
      text,
      type: 'insert',
      suggestionId,
      userId,
      createdAt,
    });
  }
  
  // Extract deletions: <del>text</del>
  while ((match = regex.delete.exec(markdown)) !== null) {
    const [, text] = match;
    suggestions.push({
      text,
      type: 'remove',
      suggestionId,
      userId,
      createdAt,
    });
  }
  
  return suggestions;
}

// Helper function to add suggestion properties to nodes
function addSuggestionPropertiesToNodes(nodes: any[], suggestionData: Array<{
  text: string;
  type: 'insert' | 'remove' | 'replace';
  originalText?: string;
  suggestionId: string;
  userId: string;
  createdAt: number;
}>): any[] {
  function processNode(node: any): any {
    if (node.children) {
      // Process element nodes recursively
      return {
        ...node,
        children: node.children.flatMap(processNode),
      };
    } else if (node.text !== undefined) {
      // Process text nodes - split them based on suggestion boundaries
      return splitTextNodeWithSuggestions(node.text, suggestionData);
    }
    
    return node;
  }

  return nodes.map(processNode);
}

// Helper function to split a text node based on suggestion boundaries
function splitTextNodeWithSuggestions(text: string, suggestionData: Array<{
  text: string;
  type: 'insert' | 'remove' | 'replace';
  originalText?: string;
  suggestionId: string;
  userId: string;
  createdAt: number;
}>): any[] {
  if (suggestionData.length === 0) {
    return [{ text }];
  }

  const result: any[] = [];
  let currentIndex = 0;

  // Sort suggestions by their position in the text
  const sortedSuggestions = suggestionData
    .map(suggestion => ({
      ...suggestion,
      index: text.indexOf(suggestion.text, currentIndex)
    }))
    .filter(suggestion => suggestion.index !== -1)
    .sort((a, b) => a.index - b.index);

  for (const suggestion of sortedSuggestions) {
    // Add any text before the suggestion as a regular text node
    if (suggestion.index > currentIndex) {
      const beforeText = text.slice(currentIndex, suggestion.index);
      if (beforeText) {
        result.push({ text: beforeText });
      }
    }

    // Add the suggestion text with suggestion properties
    const suggestionKey = `suggestion_${suggestion.suggestionId}`;
    result.push({
      text: suggestion.text,
      suggestion: true,
      [suggestionKey]: {
        id: suggestion.suggestionId,
        createdAt: suggestion.createdAt,
        type: suggestion.type,
        userId: suggestion.userId,
      },
    });

    currentIndex = suggestion.index + suggestion.text.length;
  }

  // Add any remaining text after the last suggestion
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      result.push({ text: remainingText });
    }
  }

  return result.length > 0 ? result : [{ text }];
}

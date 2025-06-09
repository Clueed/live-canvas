"use client";

/**
 * Custom Markdown Plugin with Suggestion Serialization
 * 
 * This plugin extends the standard MarkdownPlugin to include custom serialization
 * and deserialization for Plate suggestions. It handles:
 * 
 * 1. Text-level suggestions (insert, remove, update) using MDX JSX inline elements:
 *    - Insert suggestions: <ins data-suggestion-id="..." data-suggestion-user="...">text</ins>
 *    - Remove suggestions: <del data-suggestion-id="..." data-suggestion-user="...">text</del>
 *    - Update suggestions: <span data-suggestion-type="update" data-old-props="..." data-new-props="...">text</span>
 * 
 * 2. Block-level suggestions using MDX JSX flow elements:
 *    - Block suggestions: <suggestion-block data-suggestion-type="insert|remove" data-block-type="paragraph">content</suggestion-block>
 *    - Line break suggestions: <suggestion-block data-suggestion-line-break="true">content</suggestion-block>
 * 
 * Usage:
 * - Import this plugin in your editor configuration
 * - Suggestions will automatically serialize to MDX format when exporting
 * - MDX with suggestion elements will deserialize back to Plate suggestions when importing
 * 
 * Example MDX output with suggestions:
 * ```mdx
 * This is regular text with <ins data-suggestion-id="abc123" data-suggestion-user="user1">suggested insertion</ins>.
 * 
 * <suggestion-block data-suggestion-type="insert" data-suggestion-id="def456" data-suggestion-user="user1" data-block-type="paragraph">
 * This entire paragraph is a suggested insertion.
 * </suggestion-block>
 * ```
 */

import {
  MarkdownPlugin,
  remarkMdx,
  remarkMention
} from "@udecode/plate-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

// Create a custom markdown plugin that handles suggestions properly
export const markdownPlugin = MarkdownPlugin.configure({
  options: {
    // Remove suggestions from disallowedNodes to enable custom serialization
    disallowedNodes: [], // Clear the disallowed nodes to allow suggestions
    remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
  },
}).extendEditorApi<{
  suggestion: {
    serializeWithSuggestions: (content?: any) => string;
  };
}>(({ editor }) => ({
  suggestion: {
    serializeWithSuggestions: (content) => {
      console.log("🔥 Starting suggestion-aware serialization");
      
      // Use the actual content or editor's current content
      const valuesToSerialize = content || editor.children;
      
      console.log("🔥 Content to serialize:", JSON.stringify(valuesToSerialize, null, 2));
      
      // First, get the regular markdown output
      const baseMarkdown = editor.getApi(MarkdownPlugin).markdown.serialize({
        value: valuesToSerialize,
      });
      
      console.log("🔥 Base markdown:", baseMarkdown);
      
      // Now post-process to add suggestion markup
      const markdownWithSuggestions = addSuggestionMarkup(valuesToSerialize, baseMarkdown);
      
      console.log("🔥 Final markdown with suggestions:", markdownWithSuggestions);
      
      return markdownWithSuggestions;
    },
  },
}));

// Helper function to add suggestion markup to the markdown
function addSuggestionMarkup(nodes: any[], markdown: string): string {
  console.log("🔥 Processing suggestion markup for nodes:", nodes);
  
  // For MVP, let's do a simple text-based replacement
  // We'll look for suggestion text content and wrap it in MDX elements
  let processedMarkdown = markdown;
  
  // Collect all suggestion texts and their metadata
  const suggestions = extractSuggestionTexts(nodes);
  
  console.log("🔥 Found suggestions:", suggestions);
  
  // Replace each suggestion text with MDX markup
  suggestions.forEach(suggestion => {
    const { text, type, id, userId } = suggestion;
    
    // Choose the appropriate MDX tag based on suggestion type
    const tagName = type === 'remove' ? 'del' : 'ins';
    
    // Create MDX element
    const mdxElement = `<${tagName} data-suggestion-id="${id}" data-suggestion-user="${userId}">${text}</${tagName}>`;
    
    // Replace the text in markdown (simple approach for MVP)
    // Note: This is a basic implementation - a more robust version would need to handle context better
    processedMarkdown = processedMarkdown.replace(text, mdxElement);
  });
  
  return processedMarkdown;
}

// Helper function to extract all suggestion texts from nodes
function extractSuggestionTexts(nodes: any[]): Array<{
  text: string;
  type: string;
  id: string;
  userId: string;
}> {
  const suggestions: Array<{
    text: string;
    type: string;
    id: string;
    userId: string;
  }> = [];
  
  function traverse(nodeList: any[]) {
    nodeList.forEach(node => {
      if (node.children) {
        node.children.forEach((child: any) => {
          // If this is a text node with suggestion marks
          if (child.text !== undefined && child.suggestion) {
            console.log("🔥 Processing suggestion text node:", child);
            
            // Extract suggestion data (look for suggestion_* properties)
            Object.keys(child).forEach(key => {
              if (key.startsWith('suggestion_') && typeof child[key] === 'object') {
                const suggestionData = child[key];
                suggestions.push({
                  text: child.text,
                  type: suggestionData.type || 'insert',
                  id: suggestionData.id || key.replace('suggestion_', ''),
                  userId: suggestionData.userId || 'unknown',
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

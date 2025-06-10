import { markdownPlugin } from "@/components/editor/plugins/markdown-plugin/markdown-plugin";
import { createSlateEditor } from "@udecode/plate";
import { describe, expect, it } from "vitest";


/**
 * Tests for the simplified suggestion serialization
 * 
 * These tests demonstrate the new LLM-friendly syntax:
 * - Insert: <ins>new text</ins>
 * - Remove: <del>removed text</del> 
 * - Replace: <ins prev="old text">new text</ins>
 */

describe("Simplified Suggestion Deserialization", () => {
  it("should deserialize complex suggestions with deletions and insertions", () => {
    const editor = createSlateEditor({
      plugins: [markdownPlugin],
    });

    const input = `# <del>Playground</del><ins>aoe</ins>

A rich-text editor with AI <del>capabilities</del>. Try the **AI commands** or use Cmd+J to open the AI menu<ins>oeueou</ins>.`;

    const result = editor.getApi(markdownPlugin).suggestion.deserializeFromSuggestions(input);
    
    console.log("Test result:", JSON.stringify(result, null, 2));
    
    // Should have 2 top-level nodes (h1 and p)
    expect(result).toHaveLength(2);
    
    // First node should be h1 with both deleted and inserted text
    const h1Node = result[0];
    expect(h1Node.type).toBe("h1");
    expect(h1Node.children).toHaveLength(2); // Should have both "Playground" (deleted) and "aoe" (inserted)
    
    // Check deleted text "Playground"
    const playgroundNode = h1Node.children.find((child: any) => child.text === "Playground");
    expect(playgroundNode).toBeDefined();
    expect(playgroundNode.suggestion).toBe(true);
    expect(Object.keys(playgroundNode).find(key => key.startsWith('suggestion_'))).toBeDefined();
    const playgroundSuggestion = playgroundNode[Object.keys(playgroundNode).find(key => key.startsWith('suggestion_'))!];
    expect(playgroundSuggestion.type).toBe("remove");
    
    // Check inserted text "aoe"
    const aoeNode = h1Node.children.find((child: any) => child.text === "aoe");
    expect(aoeNode).toBeDefined();
    expect(aoeNode.suggestion).toBe(true);
    expect(Object.keys(aoeNode).find(key => key.startsWith('suggestion_'))).toBeDefined();
    const aoeSuggestion = aoeNode[Object.keys(aoeNode).find(key => key.startsWith('suggestion_'))!];
    expect(aoeSuggestion.type).toBe("insert");
    
    // Second node should be paragraph with deleted "capabilities" and inserted "oeueou"
    const pNode = result[1];
    expect(pNode.type).toBe("p");
    
    // Check that "capabilities" is present with remove suggestion
    const capabilitiesNode = pNode.children.find((child: any) => child.text === "capabilities");
    expect(capabilitiesNode).toBeDefined();
    expect(capabilitiesNode.suggestion).toBe(true);
    const capabilitiesSuggestion = capabilitiesNode[Object.keys(capabilitiesNode).find(key => key.startsWith('suggestion_'))!];
    expect(capabilitiesSuggestion.type).toBe("remove");
    
    // Check that "oeueou" is present with insert suggestion  
    const oeueouNode = pNode.children.find((child: any) => child.text === "oeueou");
    expect(oeueouNode).toBeDefined();
    expect(oeueouNode.suggestion).toBe(true);
    const oeueouSuggestion = oeueouNode[Object.keys(oeueouNode).find(key => key.startsWith('suggestion_'))!];
    expect(oeueouSuggestion.type).toBe("insert");
  });

  it("should handle basic insertions", () => {
    const editor = createSlateEditor({
      plugins: [markdownPlugin],
    });

    const input = "Hello <ins>beautiful</ins> world";
    const result = editor.getApi(markdownPlugin).suggestion.deserializeFromSuggestions(input);
    
    expect(result).toHaveLength(1);
    const pNode = result[0];
    expect(pNode.type).toBe("p");
    
    const beautifulNode = pNode.children.find((child: any) => child.text === "beautiful");
    expect(beautifulNode).toBeDefined();
    expect(beautifulNode.suggestion).toBe(true);
  });

  it("should handle basic deletions", () => {
    const editor = createSlateEditor({
      plugins: [markdownPlugin],
    });

    const input = "Hello <del>ugly</del> world";
    const result = editor.getApi(markdownPlugin).suggestion.deserializeFromSuggestions(input);
    
    expect(result).toHaveLength(1);
    const pNode = result[0];
    expect(pNode.type).toBe("p");
    
    // The deleted text should still be present in the result
    const uglyNode = pNode.children.find((child: any) => child.text === "ugly");
    expect(uglyNode).toBeDefined();
    expect(uglyNode.suggestion).toBe(true);
    const uglySuggestion = uglyNode[Object.keys(uglyNode).find(key => key.startsWith('suggestion_'))!];
    expect(uglySuggestion.type).toBe("remove");
  });

  it("should handle replacements", () => {
    const editor = createSlateEditor({
      plugins: [markdownPlugin],
    });

    const input = 'Hello <ins prev="ugly">beautiful</ins> world';
    const result = editor.getApi(markdownPlugin).suggestion.deserializeFromSuggestions(input);
    
    expect(result).toHaveLength(1);
    const pNode = result[0];
    expect(pNode.type).toBe("p");
    
    // Both old and new text should be present
    const uglyNode = pNode.children.find((child: any) => child.text === "ugly");
    expect(uglyNode).toBeDefined();
    expect(uglyNode.suggestion).toBe(true);
    const uglySuggestion = uglyNode[Object.keys(uglyNode).find(key => key.startsWith('suggestion_'))!];
    expect(uglySuggestion.type).toBe("remove");
    
    const beautifulNode = pNode.children.find((child: any) => child.text === "beautiful");
    expect(beautifulNode).toBeDefined();
    expect(beautifulNode.suggestion).toBe(true);
    const beautifulSuggestion = beautifulNode[Object.keys(beautifulNode).find(key => key.startsWith('suggestion_'))!];
    expect(beautifulSuggestion.type).toBe("insert");
  });
});

// This helper function is now replaced by the centralized applySimplifiedSuggestions utility
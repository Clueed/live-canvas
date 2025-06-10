import { applySimplifiedSuggestions, createSimplifiedSuggestions, expandSimplifiedSuggestions, parseSimplifiedSuggestions, simplifyVerboseSuggestions, SUGGESTION_EXAMPLES } from "@/components/editor/plugins/markdown-plugin/suggestion-serializer";
import { describe, expect, it } from "vitest";



describe("Suggestion Serializer Utilities", () => {
  describe("simplifyVerboseSuggestions", () => {
    it("should convert verbose ins tags to simple ones", () => {
      const input =
        '<ins data-suggestion-id="abc123" data-suggestion-user="user1">new text</ins>';
      const expected = "<ins>new text</ins>";
      expect(simplifyVerboseSuggestions(input)).toBe(expected);
    });

    it("should convert verbose del tags to simple ones", () => {
      const input =
        '<del data-suggestion-id="abc123" data-suggestion-user="user1">old text</del>';
      const expected = "<del>old text</del>";
      expect(simplifyVerboseSuggestions(input)).toBe(expected);
    });

    it("should handle mixed verbose tags", () => {
      const input =
        'Hello <del data-suggestion-id="abc123" data-suggestion-user="user1">world</del><ins data-suggestion-id="abc123" data-suggestion-user="user1">universe</ins>';
      const expected = "Hello <del>world</del><ins>universe</ins>";
      expect(simplifyVerboseSuggestions(input)).toBe(expected);
    });
  });

  describe("expandSimplifiedSuggestions", () => {
    it("should convert simple ins tags to verbose ones", () => {
      const input = "<ins>new text</ins>";
      const result = expandSimplifiedSuggestions(input, "user1");

      expect(result).toMatch(
        /<ins data-suggestion-id="[^"]*" data-suggestion-user="user1">new text<\/ins>/,
      );
    });

    it("should convert simple del tags to verbose ones", () => {
      const input = "<del>old text</del>";
      const result = expandSimplifiedSuggestions(input, "user1");

      expect(result).toMatch(
        /<del data-suggestion-id="[^"]*" data-suggestion-user="user1">old text<\/del>/,
      );
    });

    it("should convert replace syntax to verbose del+ins", () => {
      const input = '<ins prev="old text">new text</ins>';
      const result = expandSimplifiedSuggestions(input, "user1");

      expect(result).toMatch(
        /<del data-suggestion-id="[^"]*" data-suggestion-user="user1">old text<\/del><ins data-suggestion-id="[^"]*" data-suggestion-user="user1">new text<\/ins>/,
      );
    });
  });

  describe("parseSimplifiedSuggestions", () => {
    it("should parse replacement suggestions", () => {
      const input = 'Hello <ins prev="world">universe</ins>';
      const results = parseSimplifiedSuggestions(input);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        type: "replace",
        oldText: "world",
        newText: "universe",
        position: {
          start: 6,
          end: 38,
        },
      });
    });

    it("should parse insertion suggestions", () => {
      const input = "Hello <ins>beautiful</ins> world";
      const results = parseSimplifiedSuggestions(input);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        type: "insert",
        newText: "beautiful",
        position: {
          start: 6,
          end: 26,
        },
      });
    });

    it("should parse deletion suggestions", () => {
      const input = "Hello <del>ugly</del> world";
      const results = parseSimplifiedSuggestions(input);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        type: "delete",
        oldText: "ugly",
        position: {
          start: 6,
          end: 21,
        },
      });
    });

    it("should handle multiple suggestions", () => {
      const input = "Hello <del>ugly</del><ins>beautiful</ins> world";
      const results = parseSimplifiedSuggestions(input);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        type: "delete",
        oldText: "ugly",
        position: {
          start: 6,
          end: 21,
        },
      });
      expect(results[1]).toEqual({
        type: "insert",
        newText: "beautiful",
        position: {
          start: 21,
          end: 41,
        },
      });
    });
  });

  describe("applySimplifiedSuggestions", () => {
    it("should apply replacement suggestions", () => {
      const input = 'Hello <ins prev="world">universe</ins>';
      const expected = "Hello universe";
      expect(applySimplifiedSuggestions(input)).toBe(expected);
    });

    it("should apply insertion suggestions", () => {
      const input = "Hello <ins>beautiful</ins> world";
      const expected = "Hello beautiful world";
      expect(applySimplifiedSuggestions(input)).toBe(expected);
    });

    it("should apply deletion suggestions", () => {
      const input = "Hello <del>ugly</del> world";
      const expected = "Hello  world";
      expect(applySimplifiedSuggestions(input)).toBe(expected);
    });

    it("should handle complex mixed suggestions", () => {
      const input =
        "Try the **AI commands** or use <del>Cmd+J</del><ins>Ctrl+K</ins> to open the AI menu";
      const expected =
        "Try the **AI commands** or use Ctrl+K to open the AI menu";
      expect(applySimplifiedSuggestions(input)).toBe(expected);
    });
  });

  describe("createSimplifiedSuggestions", () => {
    it("should create insertion when old text is empty", () => {
      const result = createSimplifiedSuggestions("", "new text");
      expect(result).toBe("<ins>new text</ins>");
    });

    it("should create deletion when new text is empty", () => {
      const result = createSimplifiedSuggestions("old text", "");
      expect(result).toBe("<del>old text</del>");
    });

    it("should create replacement when both texts exist", () => {
      const result = createSimplifiedSuggestions("old text", "new text");
      expect(result).toBe('<ins prev="old text">new text</ins>');
    });

    it("should return unchanged text when texts are the same", () => {
      const result = createSimplifiedSuggestions("same text", "same text");
      expect(result).toBe("same text");
    });
  });

  describe("SUGGESTION_EXAMPLES", () => {
    it("should have valid examples that can be processed", () => {
      // Test the simple example
      const appliedResult = applySimplifiedSuggestions(
        SUGGESTION_EXAMPLES.simple.input,
      );
      expect(appliedResult).toBe(SUGGESTION_EXAMPLES.simple.applied);

      // Test the complex example
      const complexAppliedResult = applySimplifiedSuggestions(
        SUGGESTION_EXAMPLES.complex.input,
      );
      expect(complexAppliedResult).toBe(SUGGESTION_EXAMPLES.complex.applied);

      // Test the insertion example
      const insertionAppliedResult = applySimplifiedSuggestions(
        SUGGESTION_EXAMPLES.insertion.input,
      );
      expect(insertionAppliedResult).toBe(
        SUGGESTION_EXAMPLES.insertion.applied,
      );
    });
  });
});

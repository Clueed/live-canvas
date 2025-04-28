import type { PlateEditor } from "@udecode/plate/react";
import { type BaseRange, Node, Text } from "slate";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSelectionOperation,
  setSelectionOperation,
} from "./selection-operations";

// Define a minimal mock node type for test purposes
interface MockTextNode {
  text: string;
}

// Create a mock type that doesn't extend PlateEditor to avoid typing issues
interface MockPlateEditor {
  children: MockTextNode[];
  selection: BaseRange | null;
  tf: {
    select: ReturnType<typeof vi.fn>;
  };
}

describe("getSelectionOperation", () => {
  let mockEditor: MockPlateEditor;
  let getReadableSelection: ReturnType<typeof getSelectionOperation.create>;

  beforeEach(() => {
    mockEditor = createMockEditor();
    // Cast mockEditor to PlateEditor to match the function signature
    getReadableSelection = getSelectionOperation.create(
      mockEditor as unknown as PlateEditor,
    );
  });

  it("should return error when no selection exists", () => {
    mockEditor.selection = null;

    const result = getReadableSelection({});

    expect(result.success).toBe(false);
    expect(result.error).toBe("No selection exists in the editor");
  });

  it("should get selection within the same paragraph", () => {
    const mockNode: MockTextNode = { text: "This is a paragraph text" };
    mockEditor.children = [mockNode];
    vi.spyOn(Node, "get").mockReturnValue(mockNode as unknown as Node);
    vi.spyOn(Node, "string").mockReturnValue("This is a paragraph text");
    mockEditor.selection = {
      anchor: { path: [0, 0], offset: 5 },
      focus: { path: [0, 0], offset: 9 },
    };
    const result = getReadableSelection({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect({
        startParagraphIndex: result.startParagraphIndex,
        endParagraphIndex: result.endParagraphIndex,
        selectedText: result.selectedText,
      }).toEqual({
        startParagraphIndex: 0,
        endParagraphIndex: 0,
        selectedText: "is a",
      });
    }
  });

  it("should get selection across multiple paragraphs", () => {
    const mockNode1: MockTextNode = { text: "First paragraph" };
    const mockNode2: MockTextNode = { text: "Second paragraph" };
    mockEditor.children = [mockNode1, mockNode2];
    vi.spyOn(Node, "get").mockImplementation((_, path) => {
      if (path[0] === 0) return mockNode1 as unknown as Node;
      if (path[0] === 1) return mockNode2 as unknown as Node;
      return {} as Node;
    });
    vi.spyOn(Node, "string").mockImplementation((node: Node) => {
      const textNode = node as unknown as MockTextNode;
      if (textNode === mockNode1) return "First paragraph";
      if (textNode === mockNode2) return "Second paragraph";
      return "";
    });
    mockEditor.selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [1, 0], offset: 16 },
    };
    const result = getReadableSelection({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect({
        startParagraphIndex: result.startParagraphIndex,
        endParagraphIndex: result.endParagraphIndex,
        selectedText: result.selectedText,
      }).toEqual({
        startParagraphIndex: 0,
        endParagraphIndex: 1,
        selectedText: "First paragraph\nSecond paragraph",
      });
    }
  });

  it("should handle errors during selection retrieval", () => {
    mockEditor.selection = { anchor: { path: [0, 0], offset: 0 } } as BaseRange;
    vi.spyOn(Node, "get").mockImplementation(() => {
      throw new Error("Test error");
    });
    const result = getReadableSelection({});
    expect(result.success).toBe(false);
    expect(result.error).toContain("Error creating readable selection");
  });
});

describe("setSelectionOperation", () => {
  let mockEditor: MockPlateEditor;
  let setSelection: ReturnType<typeof setSelectionOperation.create>;

  beforeEach(() => {
    mockEditor = createMockEditor();
    // Cast mockEditor to PlateEditor to match the function signature
    setSelection = setSelectionOperation.create(
      mockEditor as unknown as PlateEditor,
    );
    mockEditor.children = [
      { text: "First paragraph" },
      { text: "Second paragraph" },
      { text: "Third paragraph" },
    ];
    vi.spyOn(Node, "get").mockImplementation((editor, path) => {
      const mockEditor = editor as unknown as MockPlateEditor;
      if (path.length === 1) {
        return mockEditor.children[path[0]] as unknown as Node;
      }
      if (path.length === 2) {
        return { text: mockEditor.children[path[0]].text } as unknown as Node;
      }
      return {} as Node;
    });
    vi.spyOn(Node, "string").mockImplementation((node: Node) => {
      return (node as unknown as MockTextNode).text || "";
    });
    vi.spyOn(Node, "has").mockReturnValue(true);
    vi.spyOn(Text, "isText").mockReturnValue(true);
  });

  it("should reject empty selected text", () => {
    const result = setSelection({
      startParagraphIndex: 0,
      endParagraphIndex: 1,
      selectedText: "",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("selectedText cannot be empty.");
  });

  it("should reject invalid paragraph indices", () => {
    // Test with negative index
    let result = setSelection({
      startParagraphIndex: -1,
      endParagraphIndex: 1,
      selectedText: "test",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid paragraph indices provided");

    // Test with index beyond max
    result = setSelection({
      startParagraphIndex: 0,
      endParagraphIndex: 5,
      selectedText: "test",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid paragraph indices provided");

    // Test with start > end
    result = setSelection({
      startParagraphIndex: 2,
      endParagraphIndex: 1,
      selectedText: "test",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid paragraph indices provided");
  });

  it("should reject text not found in paragraphs", () => {
    const result = setSelection({
      startParagraphIndex: 0,
      endParagraphIndex: 1,
      selectedText: "nonexistent text",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Could not find the text");
  });

  it("should set selection within a single paragraph", () => {
    vi.spyOn(Node, "string").mockImplementation((node: Node) => {
      const textNode = node as unknown as MockTextNode;
      if (textNode.text === "First paragraph") return "First paragraph";
      return "";
    });
    const result = setSelection({
      startParagraphIndex: 0,
      endParagraphIndex: 0,
      selectedText: "First",
    });
    expect(result.success).toBe(true);
    expect(mockEditor.tf.select).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor: expect.objectContaining({
          path: [0, 0],
          offset: 0,
        }),
        focus: expect.objectContaining({
          path: [0, 0],
          offset: 5,
        }),
      }),
    );
  });

  it("should set selection across multiple paragraphs", () => {
    vi.spyOn(Node, "string").mockImplementation((node: Node) => {
      return (node as unknown as MockTextNode).text || "";
    });
    const selectedText = "paragraph\nSecond";
    const result = setSelection({
      startParagraphIndex: 0,
      endParagraphIndex: 1,
      selectedText,
    });
    expect(result.success).toBe(true);
    expect(mockEditor.tf.select).toHaveBeenCalled();
  });

  it("should handle errors during selection setting", () => {
    vi.spyOn(Node, "string").mockImplementation(() => {
      throw new Error("Test error");
    });
    const result = setSelection({
      startParagraphIndex: 0,
      endParagraphIndex: 0,
      selectedText: "First",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Error setting selection");
  });
});

// Mock the PlateEditor
const createMockEditor = (): MockPlateEditor => {
  return {
    selection: null,
    children: [],
    tf: {
      select: vi.fn(),
    },
  };
};

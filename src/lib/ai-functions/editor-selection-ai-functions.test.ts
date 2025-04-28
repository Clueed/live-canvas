import type { TElement } from "@udecode/plate";
import type { PlateEditor } from "@udecode/plate/react";
import { type BaseRange, Node, Text } from "slate";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSelectionOperation,
  setSelectionOperation,
} from "./editor-selection-ai-functions";

// Re-add RichText interface needed for type casting
interface RichText {
  text: string;
  bold?: boolean;
  kbd?: boolean;
}

// Define mock editor interface
interface MockPlateEditor {
  children: TElement[];
  selection: BaseRange | null;
  tf: {
    select: ReturnType<typeof vi.fn>;
  };
}

const TEST_DOCUMENT: TElement[] = [
  {
    children: [{ text: "Playground" }],
    type: "h1",
    id: "V8RES68Jlg",
  },
  {
    children: [
      { text: "A rich-text editor with AI capabilities. Try the " },
      { bold: true, text: "AI commands" },
      { text: " or use " },
      { kbd: true, text: "Cmd+J" },
      { text: " to open the AI menu." },
    ],
    type: "p",
    id: "2tZU9hyD9b",
  },
];

const createMockEditor = (children: TElement[] = []): MockPlateEditor => {
  return {
    selection: null,
    children: children,
    tf: {
      select: vi.fn(),
    },
  };
};

// Setup function for Node mocks with proper markdown structure support
const setupNodeMocks = () => {
  // Mock Node.get to handle nested structure
  vi.spyOn(Node, "get").mockImplementation((editor, path) => {
    const mockEditor = editor as unknown as MockPlateEditor;

    if (path.length === 1) {
      // Return entire paragraph or heading node
      const node = mockEditor.children[path[0]];
      return node as unknown as Node;
    }

    if (path.length === 2) {
      // Return specific text node inside paragraph
      const node = mockEditor.children[path[0]];
      if (node.children?.[path[1]]) {
        return node.children[path[1]] as unknown as Node;
      }
    }

    // Return an empty node that can be safely converted to string
    return { text: "" } as unknown as Node;
  });

  // Mock Node.string to handle different node types
  vi.spyOn(Node, "string").mockImplementation((node: Node): string => {
    const mockNode = node as unknown as TElement | RichText;

    // Handle paragraph/heading nodes
    if ("type" in mockNode) {
      if (mockNode.type === "h1") {
        // Join all text children in heading
        return mockNode.children
          .map((child) => (child as RichText).text || "")
          .join("");
      }

      if (mockNode.type === "p") {
        // Join all text children in paragraph
        return mockNode.children
          .map((child) => (child as RichText).text || "")
          .join("");
      }
    }

    // Handle text nodes
    if ("text" in mockNode && typeof mockNode.text === "string") {
      return mockNode.text;
    }

    return "";
  });

  // Common mocks for all tests
  vi.spyOn(Node, "has").mockReturnValue(true);
  vi.spyOn(Text, "isText").mockReturnValue(true);
};

describe("getSelectionOperation", () => {
  let mockEditor: MockPlateEditor;
  let getReadableSelection: ReturnType<typeof getSelectionOperation.create>;

  beforeEach(() => {
    mockEditor = createMockEditor(TEST_DOCUMENT);
    getReadableSelection = getSelectionOperation.create(
      mockEditor as unknown as PlateEditor,
    );
    vi.resetAllMocks();
    setupNodeMocks();
  });

  it("should return error when no selection exists", () => {
    mockEditor.selection = null;
    const result = getReadableSelection({});
    expect(result.success).toBe(false);
    expect(result.error).toBe("No selection exists in the editor");
  });

  it("should get selection within a heading with markdown formatting", () => {
    mockEditor.selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    };

    // Configure what getSelectionText will receive
    vi.spyOn(Node, "string").mockImplementationOnce(() => "Playground");

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
        selectedText: "Playg",
      });
    }
  });

  it("should get selection within formatted paragraph text", () => {
    mockEditor.selection = {
      anchor: { path: [1, 1], offset: 0 },
      focus: { path: [1, 1], offset: 11 },
    };

    // Configure what getSelectionText will receive
    vi.spyOn(Node, "get").mockReturnValueOnce(
      mockEditor.children[1] as unknown as Node,
    );

    // We need to mock what getSelectionText actually receives
    vi.spyOn(Node, "string").mockImplementationOnce((node: Node): string => {
      const mockNode = node as unknown as TElement | RichText;
      if ("children" in mockNode && mockNode.type === "p") {
        return "A rich-text editor with AI capabilities. Try the AI commands or use Cmd+J to open the AI menu.";
      }
      return "A rich-text";
    });

    const result = getReadableSelection({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect({
        startParagraphIndex: result.startParagraphIndex,
        endParagraphIndex: result.endParagraphIndex,
        selectedText: result.selectedText,
      }).toEqual({
        startParagraphIndex: 1,
        endParagraphIndex: 1,
        selectedText: "A rich-text",
      });
    }
  });

  it("should get selection across multiple paragraphs", () => {
    mockEditor.selection = {
      anchor: { path: [0, 0], offset: 5 },
      focus: { path: [1, 0], offset: 10 },
    };

    // Configure what getSelectionText will receive for the multi-paragraph case
    vi.spyOn(Node, "string").mockImplementation((node: Node): string => {
      const mockNode = node as unknown as TElement | RichText;
      if ("type" in mockNode && mockNode.type === "h1") {
        return "Playground";
      }
      if ("type" in mockNode && mockNode.type === "p") {
        return "A rich-text editor with AI capabilities. Try the AI commands or use Cmd+J to open the AI menu.";
      }
      return "";
    });

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
        selectedText:
          "Playground\nA rich-text editor with AI capabilities. Try the AI commands or use Cmd+J to open the AI menu.",
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
    mockEditor = createMockEditor(TEST_DOCUMENT);
    setSelection = setSelectionOperation.create(
      mockEditor as unknown as PlateEditor,
    );
    vi.resetAllMocks();
    setupNodeMocks();
  });

  it("should reject empty selected text", () => {
    const result = setSelection({
      startParagraphIndex: 0,
      endParagraphIndex: 0,
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

  it("should set selection within a heading", () => {
    const result = setSelection({
      startParagraphIndex: 0,
      endParagraphIndex: 0,
      selectedText: "Playground",
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
          offset: 10,
        }),
      }),
    );
  });

  it("should set selection for formatted text", () => {
    const result = setSelection({
      startParagraphIndex: 1,
      endParagraphIndex: 1,
      selectedText: "AI commands",
    });

    expect(result.success).toBe(true);
    expect(mockEditor.tf.select).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("should set selection across paragraphs", () => {
    // Mock setup for cross-paragraph selection
    const selectedText = "Playground\nA rich-text";

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
      selectedText: "Playground",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Error setting selection");
  });
});

import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { PlateEditor } from '@udecode/plate/react';

import { getSelectionOperation, setSelectionOperation } from './selection-operations';
import { BaseRange, Editor, Node, Path, Point, Text } from 'slate';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the PlateEditor
const createMockEditor = () => {
  const mockEditor = {
    selection: null,
    children: [],
    tf: {
      select: vi.fn()
    }
  } as unknown as PlateEditor;

  return mockEditor;
};

describe('getSelectionOperation', () => {
  let mockEditor: PlateEditor;
  let getReadableSelection: ReturnType<typeof getSelectionOperation.create>;

  beforeEach(() => {
    mockEditor = createMockEditor();
    getReadableSelection = getSelectionOperation.create(mockEditor);
  });

  it('should return error when no selection exists', () => {
    mockEditor.selection = null;

    const result = getReadableSelection();

    expect(result.success).toBe(false);
    expect(result.error).toBe('No selection exists in the editor');
  });

  it('should get selection within the same paragraph', () => {
    // Setup mock Slate elements
    const mockNode = { text: 'This is a paragraph text' };
    (mockEditor as any).children = [mockNode];

    // Mock Node.get and Node.string behaviors
    (Node.get as any) = vi.fn().mockReturnValue(mockNode);
    (Node.string as any) = vi.fn().mockReturnValue('This is a paragraph text');

    // Create mock selection within the same paragraph
    mockEditor.selection = {
      anchor: { path: [0, 0], offset: 5 },
      focus: { path: [0, 0], offset: 9 }
    } as BaseRange;

    const result = getReadableSelection();

    expect(result.success).toBe(true);
    expect(result.selection).toEqual({
      startParagraphIndex: 0,
      endParagraphIndex: 0,
      selectedText: 'is a'
    });
  });

  it('should get selection across multiple paragraphs', () => {
    // Setup mock Slate elements
    const mockNode1 = { text: 'First paragraph' };
    const mockNode2 = { text: 'Second paragraph' };
    (mockEditor as any).children = [mockNode1, mockNode2];

    // Mock Node.get and Node.string behaviors
    (Node.get as any) = vi.fn((editor, path) => {
      if (path[0] === 0) return mockNode1;
      if (path[0] === 1) return mockNode2;

      return null;
    });

    (Node.string as any) = vi.fn((node) => {
      if (node === mockNode1) return 'First paragraph';
      if (node === mockNode2) return 'Second paragraph';

      return '';
    });

    // Create mock selection across paragraphs
    mockEditor.selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [1, 0], offset: 16 }
    } as BaseRange;

    const result = getReadableSelection();

    expect(result.success).toBe(true);
    expect(result.selection).toEqual({
      startParagraphIndex: 0,
      endParagraphIndex: 1,
      selectedText: 'First paragraph\nSecond paragraph'
    });
  });

  it('should handle errors during selection retrieval', () => {
    // Setup to cause an error
    mockEditor.selection = { anchor: { path: [0, 0], offset: 0 } } as any;
    (Node.get as any) = vi.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    const result = getReadableSelection();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Error creating readable selection');
  });
});

describe('setSelectionOperation', () => {
  let mockEditor: PlateEditor;
  let setSelection: ReturnType<typeof setSelectionOperation.create>;

  beforeEach(() => {
    mockEditor = createMockEditor();
    setSelection = setSelectionOperation.create(mockEditor);

    // Setup mock editor children
    (mockEditor as any).children = [
      { text: 'First paragraph' },
      { text: 'Second paragraph' },
      { text: 'Third paragraph' }
    ];

    // Setup Node operations mocks
    (Node.get as any) = vi.fn((editor, path) => {
      if (path.length === 1) {
        return (editor as any).children[path[0]];
      }
      if (path.length === 2) {
        return { text: (editor as any).children[path[0]].text };
      }

      return null;
    });

    (Node.string as any) = vi.fn((node) => node.text || '');
    (Node.has as any) = vi.fn().mockReturnValue(true);
    (Text.isText as any) = vi.fn().mockReturnValue(true);
  });

  it('should reject empty selected text', () => {
    const result = setSelection(0, 1, '');

    expect(result.success).toBe(false);
    expect(result.error).toBe('selectedText cannot be empty.');
  });

  it('should reject invalid paragraph indices', () => {
    // Test with negative index
    let result = setSelection(-1, 1, 'test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid paragraph indices provided');

    // Test with index beyond max
    result = setSelection(0, 5, 'test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid paragraph indices provided');

    // Test with start > end
    result = setSelection(2, 1, 'test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid paragraph indices provided');
  });

  it('should reject text not found in paragraphs', () => {
    const result = setSelection(0, 1, 'nonexistent text');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not find the text');
  });

  it('should set selection within a single paragraph', () => {
    // Setup mock for Node operations to find text
    (Node.string as any) = vi.fn((node) => {
      if (node.text === 'First paragraph') return 'First paragraph';

      return '';
    });

    const result = setSelection(0, 0, 'First');

    expect(result.success).toBe(true);
    expect(mockEditor.tf.select).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor: expect.objectContaining({
          path: [0, 0],
          offset: 0
        }),
        focus: expect.objectContaining({
          path: [0, 0],
          offset: 5
        })
      })
    );
  });

  it('should set selection across multiple paragraphs', () => {
    // Mock combined text across paragraphs
    const mockCombinedText = 'First paragraph\nSecond paragraph';
    (Node.string as any) = vi.fn((node) => {
      return node.text || '';
    });

    const selectedText = 'paragraph\nSecond';

    const result = setSelection(0, 1, selectedText);

    expect(result.success).toBe(true);
    expect(mockEditor.tf.select).toHaveBeenCalled();
  });

  it('should handle errors during selection setting', () => {
    // Setup to cause an error
    (Node.string as any) = vi.fn(() => {
      throw new Error('Test error');
    });

    const result = setSelection(0, 0, 'First');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Error setting selection');
  });
});

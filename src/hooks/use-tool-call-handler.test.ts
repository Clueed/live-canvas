import { EditorService } from '@/lib/editor-service';
import { getEditorArtifact, setEditorArtifact } from '@/lib/prompts';
import { renderHook } from '@testing-library/react';

import { useToolCallHandler } from './use-tool-call-handler';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the MultimodalLiveClient
const mockClient = {
  on: vi.fn(),
  off: vi.fn(),
  sendToolResponse: vi.fn()
};

// Prepare mock editor service
const mockEditorService: EditorService = {
  canvasText: () => 'Initial canvas text',
  updateCanvasText: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn()
};

describe('useToolCallHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers and unregisters toolcall event handlers', () => {
    const { unmount } = renderHook(() =>
      useToolCallHandler({
        client: mockClient as any,
        editorService: mockEditorService
      })
    );

    expect(mockClient.on).toHaveBeenCalledWith('toolcall', expect.any(Function));

    unmount();

    expect(mockClient.off).toHaveBeenCalledWith('toolcall', expect.any(Function));
  });

  describe('function call handling', () => {
    it('handles setEditorArtifact with valid arguments', () => {
      const { result } = renderHook(() =>
        useToolCallHandler({
          client: mockClient as any,
          editorService: mockEditorService
        })
      );

      // Get the toolcall handler registered with the client
      const toolCallHandler = mockClient.on.mock.calls[0][1];

      // Create a mock tool call for setEditorArtifact
      const mockToolCall = {
        functionCalls: [
          {
            name: setEditorArtifact.name,
            args: { text: 'New canvas text' },
            id: 'func-call-1'
          }
        ]
      };

      // Call the handler
      toolCallHandler(mockToolCall, mockClient);

      // Verify updateCanvasText was called with the new text
      expect(mockEditorService.updateCanvasText).toHaveBeenCalledWith('New canvas text', false);

      // Verify sendToolResponse was called with the correct response
      expect(mockClient.sendToolResponse).toHaveBeenCalledWith({
        functionResponses: [
          {
            response: { output: { success: true } },
            id: 'func-call-1'
          }
        ]
      });
    });

    it('handles setEditorArtifact with invalid arguments', () => {
      const { result } = renderHook(() =>
        useToolCallHandler({
          client: mockClient as any,
          editorService: mockEditorService
        })
      );

      const toolCallHandler = mockClient.on.mock.calls[0][1];

      const mockToolCall = {
        functionCalls: [
          {
            name: setEditorArtifact.name,
            args: { invalidArg: 'test' }, // Missing 'text' argument
            id: 'func-call-2'
          }
        ]
      };

      toolCallHandler(mockToolCall, mockClient);

      // Verify updateCanvasText was not called
      expect(mockEditorService.updateCanvasText).not.toHaveBeenCalled();

      // Verify error response
      expect(mockClient.sendToolResponse).toHaveBeenCalledWith({
        functionResponses: [
          {
            response: { output: { success: false, error: 'Invalid arguments' } },
            id: 'func-call-2'
          }
        ]
      });
    });

    it('handles getEditorArtifact', () => {
      const { result } = renderHook(() =>
        useToolCallHandler({
          client: mockClient as any,
          editorService: mockEditorService
        })
      );

      const toolCallHandler = mockClient.on.mock.calls[0][1];

      const mockToolCall = {
        functionCalls: [
          {
            name: getEditorArtifact.name,
            args: {},
            id: 'func-call-3'
          }
        ]
      };

      toolCallHandler(mockToolCall, mockClient);

      // Verify correct response with canvas text
      expect(mockClient.sendToolResponse).toHaveBeenCalledWith({
        functionResponses: [
          {
            response: { success: true, artifact: mockEditorService.canvasText() },
            id: 'func-call-3'
          }
        ]
      });
    });

    it('handles unknown function calls', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useToolCallHandler({
          client: mockClient as any,
          editorService: mockEditorService
        })
      );

      const toolCallHandler = mockClient.on.mock.calls[0][1];

      const mockToolCall = {
        functionCalls: [
          {
            name: 'unknown_function',
            args: {},
            id: 'func-call-4'
          }
        ]
      };

      toolCallHandler(mockToolCall, mockClient);

      // Verify console warning
      expect(consoleSpy).toHaveBeenCalledWith('Unknown function call: unknown_function');

      // Verify error response
      expect(mockClient.sendToolResponse).toHaveBeenCalledWith({
        functionResponses: [
          {
            response: { success: false, error: 'Unknown function call' },
            id: 'func-call-4'
          }
        ]
      });

      consoleSpy.mockRestore();
    });
  });
});

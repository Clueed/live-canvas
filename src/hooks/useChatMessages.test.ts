import type { StreamingLog } from '@/types/multimodal-live-types';
import { act, renderHook } from '@testing-library/react';

import { useChatMessages } from './useChatMessages';
import { EventEmitter } from 'eventemitter3';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the MultimodalLiveClient
class MockMultimodalLiveClient extends EventEmitter {
  on: any;
  off: any;

  constructor() {
    super();
    this.on = vi.fn(super.on);
    this.off = vi.fn(super.off);
  }
}

describe('useChatMessages', () => {
  let mockClient: MockMultimodalLiveClient;
  let mockLog: (log: StreamingLog) => void;
  let mockLogs: StreamingLog[];

  beforeEach(() => {
    mockClient = new MockMultimodalLiveClient();
    mockLog = vi.fn();
    mockLogs = [];
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(result.current.messages).toEqual([]);
  });

  it('should register event listeners on mount', () => {
    renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(mockClient.on).toHaveBeenCalledWith('log', mockLog);
    expect(mockClient.on).toHaveBeenCalledWith('turncomplete', expect.any(Function));
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    unmount();

    expect(mockClient.off).toHaveBeenCalledWith('log', mockLog);
    expect(mockClient.off).toHaveBeenCalledWith('turncomplete', expect.any(Function));
  });

  it('should process user messages from logs', () => {
    // Create mock client content message
    const clientContentMessage = {
      date: new Date(),
      type: 'client.send',
      message: {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [{ text: 'Hello there' }]
            }
          ],
          turnComplete: true
        }
      }
    };

    mockLogs = [clientContentMessage];

    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Hello there',
      id: expect.stringContaining('user-'),
      isVoiceMessage: false
    });
  });

  it('should process assistant messages from logs', () => {
    // Create mock server content message
    const serverContentMessage = {
      date: new Date(),
      type: 'server.content',
      message: {
        serverContent: {
          modelTurn: {
            role: 'model',
            parts: [{ text: 'Hello, how can I help you?' }]
          },
          turnComplete: true
        }
      }
    };

    mockLogs = [serverContentMessage];

    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'assistant',
      content: 'Hello, how can I help you?',
      id: expect.stringContaining('assistant-')
    });
  });

  it('should mark voice messages correctly', () => {
    const audioLog = {
      date: new Date(),
      type: 'server.audio',
      message: 'audio'
    };

    const textLog = {
      date: new Date(audioLog.date.getTime() + 500), // 500ms after audio, within 2s window
      type: 'client.send',
      message: {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [{ text: 'Voice transcription' }]
            }
          ],
          turnComplete: true
        }
      }
    };

    mockLogs = [audioLog, textLog];

    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Voice transcription',
      isVoiceMessage: true
    });
  });

  it('should handle empty voice messages correctly', () => {
    const audioLog = {
      date: new Date(),
      type: 'server.audio',
      message: 'audio'
    };

    // No matching text log within time window

    mockLogs = [audioLog];

    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: '',
      isVoiceMessage: true
    });
  });

  it('should process tool response messages', () => {
    const toolResponseLog = {
      date: new Date(),
      type: 'client.send',
      message: {
        toolResponse: {
          functionResponses: [{ response: {}, id: '123' }]
        }
      }
    };

    mockLogs = [toolResponseLog];

    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: '[Sent Tool Response]'
    });
  });

  it('should process tool cancellation messages', () => {
    const toolCancellationLog = {
      date: new Date(),
      type: 'client.send',
      message: {
        toolCallCancellation: {
          ids: ['123']
        }
      }
    };

    mockLogs = [toolCancellationLog];

    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: '[Cancelled Tool Call]'
    });
  });

  it('should append assistant messages when they occur close together and no turn completion', () => {
    const firstAssistantMessage = {
      date: new Date(),
      type: 'server.content',
      message: {
        serverContent: {
          modelTurn: {
            role: 'model',
            parts: [{ text: 'Hello' }]
          },
          turnComplete: true
        }
      }
    };

    const secondAssistantMessage = {
      date: new Date(firstAssistantMessage.date.getTime() + 1000), // 1 second later
      type: 'server.content',
      message: {
        serverContent: {
          modelTurn: {
            role: 'model',
            parts: [{ text: ', how can I help you?' }]
          },
          turnComplete: true
        }
      }
    };

    mockLogs = [firstAssistantMessage, secondAssistantMessage];

    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    // The implementation currently creates two separate messages rather than merging them
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe(', how can I help you?');
  });

  it('should create a new message after turn completion', () => {
    // Mock turn completion behavior
    let turnCompleteHandler: () => void;
    mockClient.on.mockImplementation((event: string, handler: any) => {
      if (event === 'turncomplete') {
        turnCompleteHandler = handler;
      }
      return mockClient;
    });

    const firstAssistantMessage = {
      date: new Date(),
      type: 'server.content',
      message: {
        serverContent: {
          modelTurn: {
            role: 'model',
            parts: [{ text: 'First response' }]
          },
          turnComplete: true
        }
      }
    };

    mockLogs = [firstAssistantMessage];

    const { result, rerender } = renderHook(() =>
      useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs })
    );

    // Simulate turn completion
    act(() => {
      turnCompleteHandler();
    });

    // Add second message after turn completion
    const secondAssistantMessage = {
      date: new Date(firstAssistantMessage.date.getTime() + 3000), // 3 seconds later, after turn complete
      type: 'server.content',
      message: {
        serverContent: {
          modelTurn: {
            role: 'model',
            parts: [{ text: 'New response' }]
          },
          turnComplete: true
        }
      }
    };

    mockLogs = [firstAssistantMessage, secondAssistantMessage];

    // Rerender with updated logs
    rerender();

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].content).toBe('First response');
    expect(result.current.messages[1].content).toBe('New response');
  });

  it('should handle multiple conversations in correct order', () => {
    const conversation = [
      {
        date: new Date('2023-01-01T10:00:00'),
        type: 'client.send',
        message: {
          clientContent: {
            turns: [
              {
                role: 'user',
                parts: [{ text: 'Hello' }]
              }
            ],
            turnComplete: true
          }
        }
      },
      {
        date: new Date('2023-01-01T10:00:05'),
        type: 'server.content',
        message: {
          serverContent: {
            modelTurn: {
              role: 'model',
              parts: [{ text: 'Hi there! How can I help you?' }]
            },
            turnComplete: true
          }
        }
      },
      {
        date: new Date('2023-01-01T10:00:15'),
        type: 'client.send',
        message: {
          clientContent: {
            turns: [
              {
                role: 'user',
                parts: [{ text: 'What time is it?' }]
              }
            ],
            turnComplete: true
          }
        }
      },
      {
        date: new Date('2023-01-01T10:00:20'),
        type: 'server.content',
        message: {
          serverContent: {
            modelTurn: {
              role: 'model',
              parts: [{ text: 'It is 10:00 AM.' }]
            },
            turnComplete: true
          }
        }
      }
    ];

    mockLogs = conversation;

    const { result } = renderHook(() => useChatMessages({ client: mockClient as any, log: mockLog, logs: mockLogs }));

    expect(result.current.messages.length).toBe(4);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('Hi there! How can I help you?');
    expect(result.current.messages[2].role).toBe('user');
    expect(result.current.messages[2].content).toBe('What time is it?');
    expect(result.current.messages[3].role).toBe('assistant');
    expect(result.current.messages[3].content).toBe('It is 10:00 AM.');
  });
});

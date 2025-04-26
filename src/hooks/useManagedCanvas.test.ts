import { act, renderHook } from '@testing-library/react';

import { useManagedCanvas } from './useManagedCanvas';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('useManagedCanvas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should initialize with empty canvas text', () => {
        const { result } = renderHook(() => useManagedCanvas());

        expect(result.current.canvasText).toBe('');
    });

    it('should update canvas text when called by AI', () => {
        const { result } = renderHook(() => useManagedCanvas());

        act(() => {
            result.current.updateCanvasText('AI generated text', false);
        });

        expect(result.current.canvasText).toBe('AI generated text');
    });

    it('should return null from getOptionalCanvasPart when nothing has changed since last send', () => {
        const { result } = renderHook(() => useManagedCanvas());

        // Initial state - nothing to send
        expect(result.current.getOptionalCanvasPart()).toBeNull();

        // Update by AI shouldn't generate a part to send
        act(() => {
            result.current.updateCanvasText('AI text', false);
        });

        expect(result.current.getOptionalCanvasPart()).toBeNull();
    });

    it('should return a part from getOptionalCanvasPart when text has changed by user', () => {
        const { result } = renderHook(() => useManagedCanvas());

        // Update by user should generate a part to send
        act(() => {
            result.current.updateCanvasText('User text', true);
        });

        const part = result.current.getOptionalCanvasPart();
        expect(part).not.toBeNull();
        expect(part?.text).toContain('User text');

        // Second call should return null since hash was updated
        expect(result.current.getOptionalCanvasPart()).toBeNull();
    });

    it('should not generate a part to send when AI updates the text', () => {
        const { result } = renderHook(() => useManagedCanvas());

        // Update by AI
        act(() => {
            result.current.updateCanvasText('AI text', false);
        });

        // Should not generate a part to send
        expect(result.current.getOptionalCanvasPart()).toBeNull();
    });

    it('should format canvas text correctly when generating a part', () => {
        const { result } = renderHook(() => useManagedCanvas());

        act(() => {
            result.current.updateCanvasText('User canvas content', true);
        });

        const part = result.current.getOptionalCanvasPart();
        expect(part).not.toBeNull();
        expect(part?.text).toBe('The user has updated the canvas to:\n```\nUser canvas content\n```');
    });

    it('should track hash state correctly across multiple updates', () => {
        const { result } = renderHook(() => useManagedCanvas());

        // First user update
        act(() => {
            result.current.updateCanvasText('First update', true);
        });

        // Get part (this updates the last sent hash)
        const firstPart = result.current.getOptionalCanvasPart();
        expect(firstPart).not.toBeNull();

        // Second call should return null (no changes since last sent)
        expect(result.current.getOptionalCanvasPart()).toBeNull();

        // AI update (should update the last sent hash automatically)
        act(() => {
            result.current.updateCanvasText('AI update', false);
        });

        // Should still return null (AI update hash marked as sent)
        expect(result.current.getOptionalCanvasPart()).toBeNull();

        // Second user update
        act(() => {
            result.current.updateCanvasText('Second user update', true);
        });

        // Should return a part (new user change)
        const secondPart = result.current.getOptionalCanvasPart();
        expect(secondPart).not.toBeNull();
        expect(secondPart?.text).toContain('Second user update');
    });
});

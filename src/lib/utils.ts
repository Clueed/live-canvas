'use client';

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type GetAudioContextOptions = AudioContextOptions & {
    id?: string;
};

const map: Map<string, AudioContext> = new Map();

export const audioContext: (options?: GetAudioContextOptions) => Promise<AudioContext> = (() => {
    const didInteract = new Promise((resolve) => {
        window.addEventListener('pointerdown', resolve, { once: true });
        window.addEventListener('keydown', resolve, { once: true });
    });

    return async (options?: GetAudioContextOptions) => {
        try {
            const a = new Audio();
            a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            await a.play();
            if (options?.id && map.has(options.id)) {
                const ctx = map.get(options.id);
                if (ctx) {
                    return ctx;
                }
            }
            const ctx = new AudioContext(options);
            if (options?.id) {
                map.set(options.id, ctx);
            }

            return ctx;
        } catch (e) {
            await didInteract;
            if (options?.id && map.has(options.id)) {
                const ctx = map.get(options.id);
                if (ctx) {
                    return ctx;
                }
            }
            const ctx = new AudioContext(options);
            if (options?.id) {
                map.set(options.id, ctx);
            }

            return ctx;
        }
    };
})();

export const blobToJSON = (blob: Blob): Promise<unknown> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                try {
                    const json = JSON.parse(reader.result as string);
                    resolve(json);
                } catch (error) {
                    reject('Failed to parse JSON from blob');
                }
            } else {
                reject('Failed to read blob content');
            }
        };
        reader.onerror = () => {
            reject('Error reading blob');
        };
        reader.readAsText(blob);
    });

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
}

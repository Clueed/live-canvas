import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_GCP_API_KEY = 'test-api-key';

// Mock window object properties not implemented in happy-dom
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock MediaStream
global.MediaStream = class MediaStream {
    constructor() {
        return {};
    }
    getVideoTracks() {
        return [];
    }
    getAudioTracks() {
        return [];
    }
};

// Setup any other global mocks needed for tests

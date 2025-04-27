import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_GCP_API_KEY = 'test-api-key';

// Mock window object properties not implemented in happy-dom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Create a mock implementation of MediaStream that satisfies the type requirements
const originalMediaStream = global.MediaStream;
class MockMediaStream implements MediaStream {
  active = true;
  id = 'mock-id';
  onaddtrack = null;
  onremovetrack = null;

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
  getTrackById() {
    return null;
  }

  getVideoTracks() {
    return [];
  }
  getAudioTracks() {
    return [];
  }
  getTracks() {
    return [];
  }
  addTrack() {}
  removeTrack() {}
  clone() {
    return new MockMediaStream();
  }
}

// Assign the mock to the global object
global.MediaStream = MockMediaStream as unknown as typeof MediaStream;

// Setup any other global mocks needed for tests

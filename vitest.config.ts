import react from '@vitejs/plugin-react';

import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./src/test-setup.ts']
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
});

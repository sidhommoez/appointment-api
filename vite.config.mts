import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    watch: false,
    globals: false,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    environment: 'node',
    coverage: {
      all: true,
      include: ['src/'],
      exclude: [
        '**/index.ts',
        '**/*.spec.ts',
        'src/configuration.ts',
        'src/main.ts',
        '**/*.module.ts',
        '**/*.controller.ts',
        '**/*.entity.ts',
        '**/pg-data-source.ts',
        '**/start-message.ts',
        '**/assets/*',
      ],
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: 'es6' },
    }),
  ],
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.js'
      ],
      exclude: [
        'node_modules/**',
        'prisma/**',
        '**/*.config.js',
        'debug_*.js',
        'src/__tests__/**'
      ],
      thresholds: {
        'src/routes/**': {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80
        },
        'src/middleware/**': {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80
        }
      }
    },
    setupFiles: ['./src/__tests__/setup.js'],
    fileParallelism: false
  }
});

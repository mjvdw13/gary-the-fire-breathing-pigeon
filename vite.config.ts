import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative paths so the built game works from any folder or host (itch.io, GitHub Pages...)
  base: './',
  server: { open: true },
  // The physics engine (Rapier) ships as one big embedded WebAssembly file, so the bundle is ~5 MB.
  build: { chunkSizeWarningLimit: 6000 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

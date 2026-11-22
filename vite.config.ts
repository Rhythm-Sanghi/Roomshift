import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    // Use plain CSS regardless of PostCSS configs in parent directories.
    postcss: { plugins: [] },
  },
});

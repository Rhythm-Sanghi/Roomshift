import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/Roomshift/' : '/',
  css: {
    // Use plain CSS regardless of PostCSS configs in parent directories.
    postcss: { plugins: [] },
  },
}));

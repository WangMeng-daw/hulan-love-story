import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeResourceManifest } from './scripts/resource-manifest.mjs';
import tailwindcss from '@tailwindcss/postcss';

const project = fileURLToPath(new URL('.', import.meta.url));
const base = '/hulan-love-story/';

export default defineConfig({
  root: resolve(project, 'github-pages'),
  publicDir: resolve(project, 'public'),
  base,
  plugins: [
    react(),
    {
      name: 'hulan-resources',
      apply: 'build',
      async buildStart() {
        await writeResourceManifest(resolve(project, 'public'));
      },
      async closeBundle() {
        await writeResourceManifest(
          resolve(project, 'dist/github-pages'),
          true,
        );
      },
    },
  ],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: {
    alias: {
      'next/image': resolve(project, 'github-pages/image.tsx'),
      '@': project,
    },
  },
  define: { __HULAN_PUBLIC_BASE__: JSON.stringify(base) },
  build: { outDir: resolve(project, 'dist/github-pages'), emptyOutDir: true },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
});

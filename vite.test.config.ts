import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-test',
    lib: {
      entry: 'src/tests/run-tests.ts',
      formats: ['es'],
      fileName: 'run-tests'
    },
    rollupOptions: {
      external: ['fs', 'path', 'url']
    }
  }
});

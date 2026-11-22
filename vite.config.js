import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    publicDir: 'public',

    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2020',
        minify: 'esbuild',
        cssMinify: true,
        cssCodeSplit: false,
        sourcemap: false,
        assetsInlineLimit: 0,

        rollupOptions: {
            output: {
                inlineDynamicImports: true,
                entryFileNames: 'assets/app-[hash].js',
                chunkFileNames: 'assets/app-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]'
            }
        }
    }
});

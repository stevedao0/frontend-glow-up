import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cache-busting plugin: appends a unique timestamp to all script/style src attrs
// so browsers always fetch the freshest bundle after a rebuild.
function cacheBust(): { name: string; generateBundle(options: any, bundle: any): void } {
  return {
    name: 'cache-bust',
    generateBundle(_options, bundle) {
      const ts = Date.now().toString(36);
      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith('.html')) {
          const file = bundle[fileName] as { source?: string };
          if (file.source) {
            file.source = (file.source as string)
              .replace(/src="(\/assets\/[^"]+\.js)"/g, `src="$1?v=${ts}"`)
              .replace(/href="(\/assets\/[^"]+\.css)"/g, `href="$1?v=${ts}"`);
          }
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cacheBust()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})

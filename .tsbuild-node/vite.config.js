import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Cache-busting plugin: appends a unique timestamp to all script/style src attrs
// so browsers always fetch the freshest bundle after a rebuild.
function cacheBust() {
    return {
        name: 'cache-bust',
        generateBundle: function (_options, bundle) {
            var ts = Date.now().toString(36);
            for (var _i = 0, _a = Object.keys(bundle); _i < _a.length; _i++) {
                var fileName = _a[_i];
                if (fileName.endsWith('.html')) {
                    var file = bundle[fileName];
                    if (file.source) {
                        file.source = file.source
                            .replace(/src="(\/assets\/[^"]+\.js)"/g, "src=\"$1?v=".concat(ts, "\""))
                            .replace(/href="(\/assets\/[^"]+\.css)"/g, "href=\"$1?v=".concat(ts, "\""));
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
        host: '192.168.1.234',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
});

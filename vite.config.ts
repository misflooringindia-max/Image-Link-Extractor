import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { extractAjioProduct } from './src/server/extractor.ts';

function ajioApiPlugin(): Plugin {
  return {
    name: 'ajio-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = new URL(req.url || '', 'http://localhost:3000');
        
        if (parsedUrl.pathname === '/api/extract') {
          res.setHeader('Content-Type', 'application/json');
          if (req.method === 'GET') {
            const url = parsedUrl.searchParams.get('url') || '';
            const sku = parsedUrl.searchParams.get('sku') || '';
            if (!url) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Product URL is required' }));
              return;
            }
            try {
              const data = await extractAjioProduct(url, sku);
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const data = await extractAjioProduct(parsed.url, parsed.sku);
                res.end(JSON.stringify(data));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }
        }

        if (parsedUrl.pathname === '/api/extract-batch' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const items = parsed.items || [];
              const concurrency = 4;
              const results = [];
              for (let i = 0; i < items.length; i += concurrency) {
                const chunk = items.slice(i, i + concurrency);
                const chunkRes = await Promise.all(
                  chunk.map((item: any) => extractAjioProduct(item.url, item.sku))
                );
                results.push(...chunkRes);
              }
              res.end(JSON.stringify({ success: true, count: results.length, results }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), ajioApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

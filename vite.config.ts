import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

function syncApiPlugin(): Plugin {
  // In-memory server store of synced invoices
  const serverInvoices = new Map<string, any>();

  return {
    name: 'vite-plugin-invoice-sync-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/invoices/sync')) {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const simulateError = parsedUrl.searchParams.get('simulate_error') === 'true';

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');

              // If client asked to simulate server failure for requirement 5 testing:
              if (simulateError) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: 'Simulated server error (500 Internal Error)' }));
                return;
              }

              try {
                const parsed = JSON.parse(body || '{}');
                const invoices = Array.isArray(parsed.invoices) ? parsed.invoices : (parsed.invoice ? [parsed.invoice] : []);
                const syncedIds: string[] = [];

                for (const inv of invoices) {
                  if (inv && inv.id) {
                    serverInvoices.set(inv.id, {
                      ...inv,
                      serverReceivedAt: new Date().toISOString(),
                    });
                    syncedIds.push(inv.id);
                  }
                }

                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  message: `Synced ${syncedIds.length} invoices successfully to server`,
                  syncedIds,
                  totalOnServer: serverInvoices.size,
                  serverTimestamp: new Date().toISOString(),
                }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
              }
            });
            return;
          }

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              totalOnServer: serverInvoices.size,
              serverTimestamp: new Date().toISOString(),
            }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), syncApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

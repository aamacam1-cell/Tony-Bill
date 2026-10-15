import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
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

function stripRootRedirectPlugin(): Plugin {
  return {
    name: 'strip-root-redirect',
    transformIndexHtml(html, ctx) {
      if (ctx.bundle) {
        return html.replace(
          /<!-- GITHUB_PAGES_ROOT_REDIRECT_START -->[\s\S]*?<!-- GITHUB_PAGES_ROOT_REDIRECT_END -->/,
          ''
        );
      }
      return html;
    },
  };
}

function devSwNeutralizerPlugin(): Plugin {
  return {
    name: 'vite-plugin-dev-sw-neutralizer',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0].split('#')[0] : '';

        // 1. Service worker scripts - clean self-unregister without reload loops
        if (
          url === '/sw.js' ||
          url === '/dev-sw.js' ||
          url.endsWith('/sw.js') ||
          url.endsWith('/dev-sw.js')
        ) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          );
          res.end(
            `// Self-unregistering service worker for dev preview
self.addEventListener('install', function (e) {
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) { return caches.delete(n); }));
    }).then(function () {
      return self.registration.unregister();
    }).then(function () {
      return self.clients.claim();
    })
  );
});`
          );
          return;
        }

        // 2. Workbox scripts - serve existing workbox file or dummy define
        if (url.includes('workbox-') && url.endsWith('.js')) {
          const fileName = path.basename(url);
          const candidatePaths = [
            path.resolve(__dirname, 'public', fileName),
            path.resolve(__dirname, 'docs', fileName),
            path.resolve(__dirname, 'dist', fileName),
          ];
          for (const cand of candidatePaths) {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(cand).pipe(res);
              return;
            }
          }
          // Fallback to any workbox in docs/
          const docsFiles = fs.existsSync(path.resolve(__dirname, 'docs'))
            ? fs.readdirSync(path.resolve(__dirname, 'docs'))
            : [];
          const matched = docsFiles.find((f) => f.startsWith('workbox-') && f.endsWith('.js'));
          if (matched) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            fs.createReadStream(path.resolve(__dirname, 'docs', matched)).pipe(res);
            return;
          }
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          res.end(
            `if (!self.define) {
  self.define = function(deps, factory) {
    if (typeof factory === 'function') factory();
  };
}`
          );
          return;
        }

        // 3. Bundled JS assets (e.g. /assets/index-*.js, /docs/assets/index-*.js)
        if (url.match(/\/(docs\/)?assets\/.*\.js$/)) {
          const fileName = path.basename(url);
          const candidatePaths = [
            path.resolve(__dirname, 'public', 'assets', fileName),
            path.resolve(__dirname, 'docs', 'assets', fileName),
            path.resolve(__dirname, 'dist', 'assets', fileName),
          ];
          for (const cand of candidatePaths) {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(cand).pipe(res);
              return;
            }
          }
          // If a requested hashed JS doesn't exist, serve the latest index bundle JS
          const assetsDir = path.resolve(__dirname, 'docs', 'assets');
          if (fs.existsSync(assetsDir)) {
            const files = fs.readdirSync(assetsDir);
            const mainJs = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
            if (mainJs) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(path.resolve(assetsDir, mainJs)).pipe(res);
              return;
            }
          }
        }

        // 4. Bundled CSS assets (e.g. /assets/index-*.css, /docs/assets/index-*.css)
        if (url.match(/\/(docs\/)?assets\/.*\.css$/)) {
          const fileName = path.basename(url);
          const candidatePaths = [
            path.resolve(__dirname, 'public', 'assets', fileName),
            path.resolve(__dirname, 'docs', 'assets', fileName),
            path.resolve(__dirname, 'dist', 'assets', fileName),
          ];
          for (const cand of candidatePaths) {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
              res.setHeader('Content-Type', 'text/css; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(cand).pipe(res);
              return;
            }
          }
          // If a requested hashed CSS doesn't exist, serve the latest index bundle CSS
          const assetsDir = path.resolve(__dirname, 'docs', 'assets');
          if (fs.existsSync(assetsDir)) {
            const files = fs.readdirSync(assetsDir);
            const mainCss = files.find((f) => f.startsWith('index-') && f.endsWith('.css'));
            if (mainCss) {
              res.setHeader('Content-Type', 'text/css; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(path.resolve(assetsDir, mainCss)).pipe(res);
              return;
            }
          }
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
          res.end('/* fallback css */');
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ command }) => {
  return {
    base: command === 'build' ? (process.env.VITE_BASE_PATH || './') : '/',
    plugins: [
      react(),
      tailwindcss(),
      aistudioMediaPlugin(),
      stripRootRedirectPlugin(),
      devSwNeutralizerPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: './',
          name: 'ระบบออกใบกำกับภาษี / ใบเสร็จรับเงิน',
          short_name: 'ใบกำกับภาษี',
          description: 'ระบบออกใบกำกับภาษีและใบเสร็จรับเงิน (TAX INVOICE / RECEIPT) ขนาด A4 ใช้งานและพิมพ์ได้แม้ออฟไลน์',
          theme_color: '#1e293b',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 15,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
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

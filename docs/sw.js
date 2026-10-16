/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "f94333e0ae1f09e56742e8a2e2ae3e3c"
  }, {
    "url": "pwa-512x512.png",
    "revision": "23881886fda783f0285e38c3b6fda397"
  }, {
    "url": "pwa-192x192.png",
    "revision": "35977a85b2256384abc7d2f6014763ca"
  }, {
    "url": "index.html",
    "revision": "9c930b1669e1125670139746b92a2960"
  }, {
    "url": "icon.svg",
    "revision": "f5cd68310725d26658a47ec7e15dc8fc"
  }, {
    "url": "favicon.ico",
    "revision": "d991132b1dfe987bcb5fe183a761fe72"
  }, {
    "url": "dev-sw.js",
    "revision": "220a860e7181b3a3c3ef22b241f7ee2e"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "1652c14e111b0643919f3bdeb45e59ab"
  }, {
    "url": "404.html",
    "revision": "32467bf38c580e31998c3734674313bf"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/index-roeY7uDw.css",
    "revision": null
  }, {
    "url": "assets/index-DmKL8szy.js",
    "revision": null
  }, {
    "url": "assets/index-CyQD985K.css",
    "revision": null
  }, {
    "url": "assets/index-CqNVnCil.css",
    "revision": null
  }, {
    "url": "assets/index-CVfT3KMM.js",
    "revision": null
  }, {
    "url": "assets/index-CSMALZG4.js",
    "revision": null
  }, {
    "url": "assets/index-CBruWvdT.js",
    "revision": null
  }, {
    "url": "assets/index-BM9_T1Ci.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "1652c14e111b0643919f3bdeb45e59ab"
  }, {
    "url": "favicon.ico",
    "revision": "d991132b1dfe987bcb5fe183a761fe72"
  }, {
    "url": "icon.svg",
    "revision": "f5cd68310725d26658a47ec7e15dc8fc"
  }, {
    "url": "pwa-192x192.png",
    "revision": "35977a85b2256384abc7d2f6014763ca"
  }, {
    "url": "pwa-512x512.png",
    "revision": "23881886fda783f0285e38c3b6fda397"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "f94333e0ae1f09e56742e8a2e2ae3e3c"
  }, {
    "url": "manifest.webmanifest",
    "revision": "d57f87185f6c3e6ace3c53eb4ce5c9a2"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 15,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));

/* ==========================================================================
   Images — product image lookup and local caching.

   Lookup uses the public Open Food Facts API (no key, CORS enabled). The
   downloaded bytes are stored in IndexedDB so an image is fetched once and
   then available offline. When nothing is found the UI offers a photo/upload.
   ========================================================================== */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProductImages = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // The three open product databases share an API shape; a barcode may only be
  // in one of them, so all are asked before giving up on a picture.
  var API_HOSTS = [
    'https://world.openfoodfacts.org/api/v2/product/',
    'https://world.openbeautyfacts.org/api/v2/product/',
    'https://world.openproductsfacts.org/api/v2/product/',
  ];
  var TIMEOUT_MS = 9000;

  var objectUrls = new Map();

  // 429 = the picture database is refusing requests for a while. Stop asking
  // for a minute instead of retrying into the same wall.
  var BLOCK_MS = 60000;
  var blockedUntil = 0;
  var streak = 0;

  function busy() { return Date.now() < blockedUntil; }

  // A request that never arrives (offline, CORS wall, rate-limit page) is not a
  // product without a photo. Three in a row means stop asking for a minute.
  function failed() {
    streak += 1;
    if (streak >= 3) blockedUntil = Date.now() + BLOCK_MS;
  }

  function arrived() { streak = 0; }

  function fetchJson(url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    return fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).then(function (res) {
      clearTimeout(timer);
      if (res.status === 429 || res.status === 503) {
        blockedUntil = Date.now() + BLOCK_MS;
        return null;
      }
      if (!res.ok) return null;
      arrived();
      return res.json();
    }).catch(function () {
      clearTimeout(timer);
      failed();
      return null;
    });
  }

  /** @returns {Promise<{imageUrl:string, name:string, brand:string}|null>} */
  async function lookupOnline(barcode) {
    var code = String(barcode || '').replace(/[^0-9]/g, '');
    if (code.length < 6) return null;
    if (busy()) return null;

    for (var i = 0; i < API_HOSTS.length; i++) {
      var json = await fetchJson(API_HOSTS[i] + encodeURIComponent(code) +
        '.json?fields=product_name,brands,image_front_url,image_url');
      if (busy()) return null;
      if (!json || json.status !== 1 || !json.product) continue;
      var product = json.product;
      var imageUrl = product.image_front_url || product.image_url || null;
      if (!imageUrl) continue;
      return { imageUrl: imageUrl, name: product.product_name || '', brand: product.brands || '' };
    }

    return null;
  }

  async function download(url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    try {
      var res = await fetch(url, { mode: 'cors', signal: controller.signal });
      if (!res.ok) return null;
      var blob = await res.blob();
      if (!blob || !/^image\//.test(blob.type)) return null;
      return blob;
    } catch (err) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function toObjectUrl(barcode, blob) {
    var previous = objectUrls.get(barcode);
    if (previous) URL.revokeObjectURL(previous);
    var url = URL.createObjectURL(blob);
    objectUrls.set(barcode, url);
    return url;
  }

  function cachedUrl(barcode, blob) {
    var existing = objectUrls.get(barcode);
    if (existing) return existing;
    return toObjectUrl(barcode, blob);
  }

  function forget(barcode) {
    var url = objectUrls.get(barcode);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.delete(barcode);
    }
  }

  function getDb() {
    return root.DB;
  }

  /** Stored image already in IndexedDB, or null. */
  async function local(barcode) {
    try {
      var row = await getDb().getImage(barcode);
      if (!row || !row.blob) return null;
      return { url: cachedUrl(barcode, row.blob), source: row.source, stored: true };
    } catch (err) {
      return null;
    }
  }

  /**
   * Resolve an image for a barcode: local first, then online (and store it).
   * @returns {Promise<{url:string, source:string, stored:boolean}|null>}
   */
  async function resolve(barcode) {
    var hit = await local(barcode);
    if (hit) return hit;

    var found = await lookupOnline(barcode);
    if (!found || !found.imageUrl) return null;

    var blob = await download(found.imageUrl);
    if (!blob) return null;

    try {
      await getDb().saveImage(barcode, blob, { type: blob.type, source: 'openfoodfacts' });
    } catch (err) { /* still display it */ }

    return { url: toObjectUrl(barcode, blob), source: 'openfoodfacts', stored: true };
  }

  /** Persist a user-supplied photo/upload. */
  async function store(barcode, blob, source) {
    await getDb().saveImage(barcode, blob, { type: blob.type, source: source || 'upload' });
    return { url: toObjectUrl(barcode, blob), source: source || 'upload', stored: true };
  }

  async function remove(barcode) {
    forget(barcode);
    try { await getDb().deleteImage(barcode); } catch (err) { /* ignore */ }
  }

  /** Warm the object-URL cache for every stored image (call once at boot). */
  async function warm() {
    try {
      var rows = await getDb().listImages();
      rows.forEach(function (row) {
        if (row.blob) cachedUrl(row.barcode, row.blob);
      });
      return rows.length;
    } catch (err) {
      return 0;
    }
  }

  return {
    lookupOnline: lookupOnline,
    busy: busy,
    download: download,
    resolve: resolve,
    local: local,
    store: store,
    remove: remove,
    warm: warm,
    cachedUrl: function (barcode) { return objectUrls.get(barcode) || null; },
  };
});

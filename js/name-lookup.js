/* ==========================================================================
   Name lookup — find a product name for a barcode when the workbook (or a
   hand-typed entry) has none.

   Queries the open product databases, which need no key and allow browser
   requests (CORS *): Open Food Facts, Open Beauty Facts and Open Products
   Facts. The first source that knows the barcode wins.
   ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProductLookup = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SOURCES = [
    { id: 'openfoodfacts', label: 'Open Food Facts', base: 'https://world.openfoodfacts.org/api/v2/product/' },
    { id: 'openbeautyfacts', label: 'Open Beauty Facts', base: 'https://world.openbeautyfacts.org/api/v2/product/' },
    { id: 'openproductsfacts', label: 'Open Products Facts', base: 'https://world.openproductsfacts.org/api/v2/product/' },
  ];

  var TIMEOUT_MS = 7000;

  // A 429 means the databases are refusing everyone for a while. Hammering
  // them makes the block last longer, so every source is left alone for a
  // minute after one of them says it is full.
  var BLOCK_MS = 60000;
  var blockedUntil = 0;

  function busy() { return Date.now() < blockedUntil; }
  function busyFor() { return Math.max(0, blockedUntil - Date.now()); }

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  async function query(source, code) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    try {
      var res = await fetch(
        source.base + encodeURIComponent(code) + '.json?fields=product_name,product_name_en,generic_name,brands,categories',
        { signal: controller.signal, headers: { Accept: 'application/json' } }
      );
      if (res.status === 429 || res.status === 503) {
        blockedUntil = Date.now() + BLOCK_MS;
        return { busy: true };
      }
      if (!res.ok) return null;
      var json = await res.json();
      if (!json || json.status !== 1 || !json.product) return null;
      var product = json.product;
      var name = clean(product.product_name) || clean(product.product_name_en) || clean(product.generic_name);
      if (!name) return null;
      return {
        name: name,
        brand: clean(product.brands),
        categories: clean(product.categories),
        source: source.label,
        sourceId: source.id,
      };
    } catch (err) {
      // The request never got through (offline, CORS, rate-limit page): that is
      // not the same as "this barcode is unknown".
      return { error: true };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * @param {string} barcode
   * @returns {Promise<{name:string, brand:string, source:string, sourceId:string}|null>}
   */
  async function lookup(barcode) {
    var code = String(barcode || '').replace(/[^0-9A-Za-z]/g, '');
    if (code.length < 6) return null;
    if (busy()) return { busy: true };

    // One source at a time: a hit costs a single request, and the databases
    // rate-limit hard when three are asked at once.
    var failed = false;
    for (var i = 0; i < SOURCES.length; i++) {
      var hit = await query(SOURCES[i], code);
      if (hit && hit.busy) return hit;
      if (hit && hit.error) { failed = true; continue; }
      if (hit) return hit;
    }
    return failed ? { error: true } : null;
  }

  return { lookup: lookup, busy: busy, busyFor: busyFor, SOURCES: SOURCES };
});

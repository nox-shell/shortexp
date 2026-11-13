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

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  async function query(source, code) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    try {
      var res = await fetch(
        source.base + encodeURIComponent(code) + '.json?fields=product_name,product_name_en,generic_name,brands',
        { signal: controller.signal, headers: { Accept: 'application/json' } }
      );
      if (!res.ok) return null;
      var json = await res.json();
      if (!json || json.status !== 1 || !json.product) return null;
      var product = json.product;
      var name = clean(product.product_name) || clean(product.product_name_en) || clean(product.generic_name);
      if (!name) return null;
      return { name: name, brand: clean(product.brands), source: source.label, sourceId: source.id };
    } catch (err) {
      return null;
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

    // All sources at once; keep the first answer in priority order.
    var results = await Promise.all(SOURCES.map(function (source) { return query(source, code); }));
    for (var i = 0; i < results.length; i++) {
      if (results[i]) return results[i];
    }
    return null;
  }

  return { lookup: lookup, SOURCES: SOURCES };
});

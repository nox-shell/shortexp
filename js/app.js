/* ==========================================================================
   App — List screen, scan page, product sheet, import and export.

   Data lives in IndexedDB (js/db.js): the product catalogue imported from the
   Excel file, the saved expiry records, and cached product images. The
   catalogue is an in-memory Map, so a barcode lookup is a single hit.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- icons ---------- */

  var ICONS = {
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 4v7h-7"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7"/><path d="M6 7l1 12.2A1.8 1.8 0 0 0 8.8 21h6.4a1.8 1.8 0 0 0 1.8-1.8L18 7"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11"/><path d="m8 11 4 4 4-4"/><path d="M4 19h16"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
    sliders: '<svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h4M12 17h8"/><circle cx="15" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
    keyboard: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7.5 14h9"/></svg>',
    barcode: '<svg viewBox="0 0 24 24"><path d="M4 6v12M7.5 6v12M11 6v12M14.5 6v12M18 6v12M20.5 6v12"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    package: '<svg viewBox="0 0 24 24"><path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z"/><path d="m4 8.5 8 4.5 8-4.5"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 4.5 21 20H3l9-15.5Z"/><path d="M12 10v4M12 17h.01"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    x: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 20V8"/><path d="m8 12 4-4 4 4"/><path d="M4 5h16"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.4 18.6h3.2"/></svg>'
  };

  ICONS.checkAll = '<svg viewBox="0 0 24 24"><path d="m3 7 2.3 2.3L9.5 5"/><path d="m3 16 2.3 2.3L9.5 14"/><path d="M12.5 7.5H21M12.5 16.5H21"/></svg>';

  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach(function (node) {
      var svg = ICONS[node.dataset.icon];
      if (svg) node.insertAdjacentHTML('afterbegin', svg);
    });
  }

  /* ---------- elements ---------- */

  var el = {
    splash: $('splash'),

    menuBtn: $('menuBtn'),
    installBtn: $('installBtn'),
    installHint: $('installHint'),
    installHelp: $('installHelp'),
    installLead: $('installLead'),
    installSteps: $('installSteps'),
    refreshBtn: $('refreshBtn'),
    deleteBtn: $('deleteBtn'),
    downloadBtn: $('downloadBtn'),
    shareBtn: $('shareBtn'),

    searchInput: $('searchInput'),
    filterBtn: $('filterBtn'),
    filterPanel: $('filterPanel'),
    manualBtn: $('manualBtn'),
    viewChips: $('viewChips'),
    returnChips: $('returnChips'),

    list: $('list'),
    empty: $('empty'),
    emptyText: $('emptyText'),

    addBtn: $('addBtn'),
    scanBtn: $('scanBtn'),
    bottomScan: $('bottomScan'),
    bottomLabel: $('bottomLabel'),
    bottomSub: $('bottomSub'),
    selectionActions: $('selectionActions'),
    selectDelete: $('selectDelete'),
    selectExport: $('selectExport'),
    selectAllBtn: $('selectAllBtn'),
    selectNone: $('selectNone'),
    undoBtn: $('undoBtn'),

    drawer: $('drawer'),
    drawerNav: $('drawerNav'),
    importBtn: $('importBtn'),
    expiryImportBtn: $('expiryImportBtn'),
    expiryImportInput: $('expiryImportInput'),
    linkBackupBtn: $('linkBackupBtn'),
    backupNowBtn: $('backupNowBtn'),
    backupStatus: $('backupStatus'),
    catalogInfo: $('catalogInfo'),
    statCatalog: $('statCatalog'),
    statTracked: $('statTracked'),
    statShort: $('statShort'),
    statExpired: $('statExpired'),
    statReturnable: $('statReturnable'),
    statNonreturnable: $('statNonreturnable'),

    scanScreen: $('scanScreen'),
    scanClose: $('scanClose'),
    scanStart: $('scanStart'),
    scanOpen: $('scanOpen'),
    scanVideo: $('scanVideo'),
    scanGuide: $('scanGuide'),
    scanHint: $('scanHint'),
    scanResult: $('scanResult'),
    scanThumb: $('scanThumb'),
    scanName: $('scanName'),
    scanCode: $('scanCode'),
    scanBadge: $('scanBadge'),
    torchBtn: $('torchBtn'),

    sheet: $('sheet'),
    sheetTitle: $('sheetTitle'),
    sheetImage: $('sheetImage'),
    sheetMediaHint: $('sheetMediaHint'),
    sheetName: $('sheetName'),
    sheetCode: $('sheetCode'),
    sheetBadge: $('sheetBadge'),
    sheetDelete: $('sheetDelete'),
    sheetSave: $('sheetSave'),
    sheetCancel: $('sheetCancel'),

    codeInput: $('codeInput'),
    nameInput: $('nameInput'),
    nameStatus: $('nameStatus'),
    nameStatusText: $('nameStatusText'),
    nameSearchBtn: $('nameSearchBtn'),
    expiryInput: $('expiryInput'),
    qtyInput: $('qtyInput'),
    categoryInput: $('categoryInput'),
    leadInput: $('leadInput'),
    returnableInput: $('returnableInput'),
    returnableHint: $('returnableHint'),
    lookupBtn: $('lookupBtn'),
    sheetScan: $('sheetScan'),
    sheetScanLabel: $('sheetScanLabel'),
    sheetScanner: $('sheetScanner'),
    sheetVideo: $('sheetVideo'),
    sheetScanGuide: $('sheetScanGuide'),
    sheetScanHint: $('sheetScanHint'),
    sheetScanStop: $('sheetScanStop'),
    categoryOptions: $('categoryOptions'),

    sumShort: $('sumShort'),
    sumDays: $('sumDays'),
    sumRule: $('sumRule'),
    sumStatus: $('sumStatus'),

    photoBtn: $('photoBtn'),
    uploadBtn: $('uploadBtn'),
    findImageBtn: $('findImageBtn'),
    photoInput: $('photoInput'),
    uploadInput: $('uploadInput'),

    importOverlay: $('importOverlay'),
    importTitle: $('importTitle'),
    importText: $('importText'),
    importBar: $('importBar'),
    importMeta: $('importMeta'),
    importCancel: $('importCancel'),

    toasts: $('toasts'),
  };

  /* ---------- state ---------- */

  var state = {
    catalog: null,
    records: [],
    recordMap: new Map(),
    images: new Map(),
    view: 'all',
    returnFilter: 'all',
    query: '',
    selection: new Set(),
    undoDelete: null,
    sheetBarcode: '',
    sheetExisting: false,
    returnAfterSave: false,
    scanHit: null,
    scanLocked: false,
    scanner: null,
    sheetScanner: null,
    importing: false,
    imageToken: 0,
    backupHandle: null,
    backupReady: false,
    backupTimer: 0,
    lastBackup: 0,
  };

  var AUTO_SOURCES = ['list all.xlsx', 'all.xlsx', 'data/all.xlsx'];
  var BATCH_SIZE = 1500;
  var XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  /* ---------- helpers ---------- */

  function toast(message, tone) {
    var node = document.createElement('div');
    node.className = 'toast';
    if (tone) node.dataset.tone = tone;
    node.textContent = message;
    el.toasts.appendChild(node);
    setTimeout(function () {
      node.style.transition = 'opacity .2s ease, transform .2s ease';
      node.style.opacity = '0';
      node.style.transform = 'translateY(6px)';
      setTimeout(function () { node.remove(); }, 220);
    }, 2600);
  }

  function number(value) { return Number(value || 0).toLocaleString(); }

  function formatDays(days) {
    if (days == null) return '—';
    if (days < 0) return '−' + Math.abs(days) + ' d';
    return days + ' d';
  }

  var audioCtx = null;
  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.setValueAtTime(1568, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.26, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (err) { /* audio is a nicety */ }
  }

  /** Typed dates: "20261231" becomes "2026-12-31" while typing. */
  function attachDateMask(node) {
    node.addEventListener('input', function () {
      var digits = node.value.replace(/[^0-9]/g, '').slice(0, 8);
      var formatted = digits;
      if (digits.length > 6) formatted = digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6);
      else if (digits.length > 4) formatted = digits.slice(0, 4) + '-' + digits.slice(4);
      if (node.value !== formatted) node.value = formatted;
    });
  }

  function categoryLabel(category) {
    var name = String(category == null ? '' : category).trim();
    if (!name) return 'Uncategorised';
    var meta = Rules.categoryById(name);
    return meta ? meta.label : name;
  }

  function normaliseBarcode(value) {
    return String(value == null ? '' : value).replace(/[^0-9A-Za-z]/g, '');
  }

  /* ---------- records ---------- */

  /**
   * A record's own values always win, but anything it is missing (name,
   * category, returnable) is filled from the product catalogue, so a row that
   * arrived as a bare barcode still reads as a product.
   */
  function withCatalog(record) {
    if (record.name && record.category) return record;

    var product = state.catalog.get(record.barcode);
    if (!product) return record;

    return {
      barcode: record.barcode,
      name: record.name || product.name || '',
      category: record.category || product.category || '',
      returnable: record.returnable || !!product.returnable,
      expiry: record.expiry,
      quantity: record.quantity,
      leadOverride: record.leadOverride,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  function decorate(record) {
    var full = withCatalog(record);
    return { record: full, result: Rules.evaluate(full) };
  }

  function decorated() {
    return state.records.map(decorate).sort(function (a, b) {
      // Returnable goods have to leave the shelf and go back to the supplier
      // while they still have 30 days left, so those due back are listed first.
      var ra = returnDue(a) ? 0 : 1;
      var rb = returnDue(b) ? 0 : 1;
      if (ra !== rb) return ra - rb;

      var da = a.result.daysLeft;
      var db = b.result.daysLeft;
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }

  /** True once a returnable item has entered the window where it must be returned. */
  function returnDue(row) {
    if (!row.record.returnable) return false;
    if (row.result.daysLeft == null) return false;
    return row.result.daysLeft <= row.result.leadDays;
  }

  function visibleRows() {
    var q = state.query.trim().toLowerCase();
    return decorated().filter(function (row) {
      var record = row.record;
      if (state.view !== 'all' && row.result.status !== state.view) return false;
      if (state.returnFilter === 'returnable' && !record.returnable) return false;
      if (state.returnFilter === 'nonreturnable' && record.returnable) return false;
      if (!q) return true;
      var hay = (record.name || '') + ' ' + record.barcode + ' ' + (record.category || '');
      return hay.toLowerCase().indexOf(q) !== -1;
    });
  }

  /* ---------- rendering ---------- */

  function render() {
    renderList();
    renderStats();
    renderBottom();
    renderChips();
    renderCatalogInfo();
    renderBackupStatus();
  }

  function renderList() {
    var rows = visibleRows();
    var fragment = document.createDocumentFragment();

    rows.forEach(function (row) {
      var record = row.record;
      var result = row.result;

      var li = document.createElement('li');
      li.className = 'item';
      li.dataset.barcode = record.barcode;
      li.dataset.status = result.status;
      li.dataset.selected = state.selection.has(record.barcode) ? 'true' : 'false';
      li.dataset.unresolved = record.name ? 'false' : 'true';
      li.dataset.returnDue = returnDue(row) ? 'true' : 'false';

      var thumb = document.createElement('div');
      thumb.className = 'item__thumb';
      var url = state.images.get(record.barcode);
      if (url) {
        var img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.loading = 'lazy';
        thumb.appendChild(img);
      } else {
        thumb.innerHTML = ICONS.package;
      }

      var body = document.createElement('div');
      body.className = 'item__body';

      var top = document.createElement('div');
      top.className = 'item__top';
      var date = document.createElement('span');
      date.className = 'item__date';
      date.textContent = record.expiry || '—';
      var days = document.createElement('span');
      days.className = 'item__days';
      days.textContent = result.daysLeft == null ? '' : '(' + result.daysLeft + ')';
      var qty = document.createElement('span');
      qty.className = 'item__qty';
      qty.textContent = String(record.quantity || 1);
      top.appendChild(date);
      top.appendChild(days);
      top.appendChild(qty);

      var name = document.createElement('div');
      name.className = 'item__name';
      name.textContent = record.name || 'Not found';

      if (li.dataset.returnDue === 'true') {
        var tag = document.createElement('span');
        tag.className = 'item__tag';
        tag.textContent = result.daysLeft < 0 ? 'Return overdue' : 'Return now';
        tag.setAttribute('title', 'Returnable — remove and return to the supplier');
      }

      var code = document.createElement('div');
      code.className = 'item__code';
      code.textContent = record.barcode;

      body.appendChild(top);
      body.appendChild(name);
      if (typeof tag !== 'undefined' && tag) body.appendChild(tag);
      body.appendChild(code);

      var check = document.createElement('button');
      check.type = 'button';
      check.className = 'item__check';
      check.setAttribute('aria-label', 'Select ' + (record.name || record.barcode));
      check.dataset.select = record.barcode;

      li.appendChild(thumb);
      li.appendChild(body);
      li.appendChild(check);
      fragment.appendChild(li);
    });

    el.list.replaceChildren(fragment);
    el.empty.hidden = rows.length > 0;

    if (!rows.length) {
      el.emptyText.textContent = state.records.length
        ? 'Nothing matches this filter.'
        : 'No products yet.';
    }
  }

  function renderStats() {
    var counts = { tracked: 0, short: 0, expired: 0, returnable: 0, nonreturnable: 0 };
    decorated().forEach(function (row) {
      counts.tracked++;
      if (row.result.status === 'short') counts.short++;
      if (row.result.status === 'expired') counts.expired++;
      if (row.record.returnable) counts.returnable++;
      else counts.nonreturnable++;
    });

    el.statCatalog.textContent = state.catalog.size ? number(state.catalog.size) : '—';
    el.statTracked.textContent = number(counts.tracked);
    el.statShort.textContent = number(counts.short);
    el.statExpired.textContent = number(counts.expired);
    el.statReturnable.textContent = number(counts.returnable);
    el.statNonreturnable.textContent = number(counts.nonreturnable);

    document.querySelectorAll('.stat').forEach(function (node) {
      var stat = node.dataset.stat;
      var active = (stat === 'tracked' && state.view === 'all' && state.returnFilter === 'all') ||
        (stat === state.view) ||
        (stat === state.returnFilter && stat !== 'tracked');
      node.classList.toggle('is-active', !!active);
    });
  }

  function renderBottom() {
    var count = state.selection.size;

    if (el.undoBtn) {
      el.undoBtn.hidden = !(state.undoDelete && state.undoDelete.length) || count > 0;
    }

    if (count) {
      el.bottomLabel.textContent = count + (count === 1 ? ' selected' : ' selected');
      el.bottomSub.textContent = 'Tap a row to open it';
      el.selectionActions.hidden = false;
      el.bottomScan.hidden = true;
      if (el.selectAllBtn) el.selectAllBtn.hidden = true;
    } else {
      var rows = visibleRows().length;
      el.bottomLabel.textContent = rows + (rows === 1 ? ' item' : ' items');
      el.bottomSub.textContent = {
        all: 'Short expiry list',
        short: 'At the threshold',
        soon: 'Approaching the threshold',
        expired: 'Past expiry',
        safe: 'Plenty of shelf life',
      }[state.view] || 'Short expiry list';
      el.selectionActions.hidden = true;
      el.bottomScan.hidden = false;
      if (el.selectAllBtn) el.selectAllBtn.hidden = rows === 0;
    }
  }

  function renderChips() {
    el.viewChips.querySelectorAll('.chip').forEach(function (node) {
      node.classList.toggle('is-active', node.dataset.view === state.view);
    });
    el.returnChips.querySelectorAll('.chip').forEach(function (node) {
      node.classList.toggle('is-active', node.dataset.return === state.returnFilter);
    });
    el.drawerNav.querySelectorAll('.drawer__item').forEach(function (node) {
      node.classList.toggle('is-active', node.dataset.view === state.view);
    });
  }

  function renderCatalogInfo() {
    el.catalogInfo.textContent = state.catalog.size
      ? number(state.catalog.size) + ' products loaded from the Excel file.'
      : 'No product list loaded yet — tap Import Excel.';
  }

  function renderCategories() {
    var names = state.catalog.categories();
    el.categoryOptions.replaceChildren();
    names.forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      el.categoryOptions.appendChild(option);
    });
  }

  /* ---------- product sheet ---------- */

  function openSheet(barcode) {
    var code = barcode ? String(barcode).trim() : '';
    var record = code ? state.recordMap.get(code) : null;
    var product = code ? state.catalog.get(code) : null;

    state.sheetBarcode = code;
    state.sheetExisting = !!record;

    // Kept separately: the barcode field stays editable, so the saved record
    // has to be found again by the code it came in with.
    state.sheetOriginalBarcode = code;

    var data = record || {
      barcode: code,
      name: product ? product.name : '',
      category: product ? product.category : '',
      returnable: product ? !!product.returnable : false,
      expiry: '',
      leadOverride: null,
      quantity: 1,
    };

    stopSheetScan();
    fillSheet(data, record, product);
    el.sheet.hidden = false;
    updateSummary();
    loadSheetImage(code);
    setNameStatus('', '');
    if (!data.name) autoNameLookup(code);
    else if (product) setNameStatus('Found in your database', 'ok');

    // Adding a product starts at the barcode, not the name: that is the first
    // thing the operator has (scanned or read off the pack).
    if (!record && !el.codeInput.value) el.codeInput.focus();
    else if (!data.expiry) el.expiryInput.focus();
  }

  /** Put a record / catalogue product into the sheet fields. */
  function fillSheet(data, record, product) {
    el.sheetTitle.textContent = record ? 'Product details' : 'Add product';
    el.sheetName.textContent = data.name || 'New product';
    el.sheetCode.textContent = data.barcode || 'No barcode yet';
    el.codeInput.value = data.barcode || '';
    // Always editable, so a mis-read barcode can be corrected on a saved item
    // too; the record follows the new code when it is saved.
    el.codeInput.readOnly = false;
    el.lookupBtn.hidden = false;
    el.nameInput.value = data.name || '';
    el.expiryInput.value = data.expiry || '';
    el.qtyInput.value = data.quantity || 1;
    el.categoryInput.value = data.category || '';
    el.leadInput.value = data.leadOverride || '';
    el.returnableInput.checked = !!data.returnable;

    el.sheetDelete.hidden = !record;
    el.sheetSave.textContent = record ? 'Save changes' : 'Save to list';

    if (record) setSheetBadge('In your list · ' + (record.expiry || ''), 'ok');
    else if (product) setSheetBadge('Found in your database', 'info');
    else setSheetBadge('', '');

    el.sheetImage.hidden = true;
    el.sheetImage.removeAttribute('src');
    el.sheetMediaHint.hidden = false;
  }

  function closeSheet() {
    stopSheetScan();
    el.sheet.hidden = true;
    state.sheetBarcode = '';
    state.sheetExisting = false;
    state.sheetOriginalBarcode = '';
  }

  function setSheetBadge(text, tone) {
    el.sheetBadge.hidden = !text;
    el.sheetBadge.textContent = text || '';
    el.sheetBadge.dataset.tone = tone || '';
  }

  function readSheet() {
    var lead = parseFloat(el.leadInput.value);
    var qty = parseInt(el.qtyInput.value, 10);
    return {
      barcode: normaliseBarcode(el.codeInput.value),
      name: el.nameInput.value.trim(),
      category: el.categoryInput.value.trim(),
      returnable: el.returnableInput.checked,
      expiry: el.expiryInput.value.trim(),
      quantity: isFinite(qty) && qty > 0 ? qty : 1,
      leadOverride: isFinite(lead) && lead > 0 ? Math.round(lead) : null,
    };
  }

  function updateSummary() {
    var draft = readSheet();
    var result = Rules.evaluate(draft);

    el.sumShort.textContent = result.shortDate ? Rules.toISODate(result.shortDate) : '—';
    el.sumDays.textContent = formatDays(result.daysLeft);

    if (draft.leadOverride) {
      el.sumRule.textContent = 'Manual · ' + draft.leadOverride + ' days';
    } else if (result.rule.source === 'returnable') {
      el.sumRule.textContent = 'Returnable · 30 days';
    } else {
      el.sumRule.textContent = categoryLabel(draft.category) + ' · ' +
        result.rule.summary.replace(' before expiry', '');
    }

    el.returnableHint.textContent = draft.returnable ? '30-day rule' : 'Category rule';

    if (!draft.expiry) {
      el.sumStatus.dataset.tone = 'muted';
      el.sumStatus.textContent = 'Set an expiry date';
    } else {
      el.sumStatus.dataset.tone = result.statusMeta.tone;
      el.sumStatus.textContent = result.statusMeta.label +
        (result.daysLeft != null ? ' · ' + formatDays(result.daysLeft) + ' remaining' : '');
    }
  }

  async function saveSheet() {
    var draft = readSheet();
    if (!draft.barcode) {
      toast('Enter or scan a barcode first.', 'error');
      el.codeInput.focus();
      return;
    }
    if (!draft.name) {
      toast('Enter the product name.', 'error');
      el.nameInput.focus();
      return;
    }
    if (!draft.expiry) {
      toast('Enter the expiry date.', 'error');
      el.expiryInput.focus();
      return;
    }
    if (!Rules.parseISODate(draft.expiry)) {
      toast('Use YYYY-MM-DD for the expiry date.', 'error');
      el.expiryInput.focus();
      return;
    }

    // The barcode was corrected: the item moves to the new code instead of
    // leaving a copy behind under the old one.
    var original = state.sheetOriginalBarcode || '';
    var renamed = !!original && original !== draft.barcode;

    if (renamed && state.recordMap.has(draft.barcode)) {
      toast('That barcode is already in your list.', 'error');
      el.codeInput.focus();
      return;
    }

    var existing = state.recordMap.get(draft.barcode);
    var record = Object.assign({}, draft, {
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
    });

    try {
      await DB.saveRecord(record);
    } catch (err) {
      toast('Could not save the record.', 'error');
      return;
    }

    if (renamed) await moveRecord(original, draft.barcode);

    var keepScanning = state.returnAfterSave;

    upsertRecord(record);
    closeSheet();
    render();
    scheduleBackup();
    toast(existing ? 'Record updated' : 'Added to the list', 'ok');

    // In a scanning session, go straight back to the camera for the next one.
    if (keepScanning) {
      setTimeout(function () {
        state.returnAfterSave = true;
        openSheet('');
        startSheetScan();
      }, 320);
    }
  }

  /** Drop the record filed under the old barcode and take its photo along. */
  async function moveRecord(oldCode, newCode) {
    try { await DB.deleteRecord(oldCode); } catch (err) { /* ignore */ }
    state.recordMap.delete(oldCode);
    state.selection.delete(oldCode);
    state.records = state.records.filter(function (record) {
      return record.barcode !== oldCode;
    });

    try {
      var row = await DB.getImage(oldCode);
      if (row && row.blob) {
        await DB.saveImage(newCode, row.blob, { type: row.type || row.blob.type, source: row.source || 'move' });
        await DB.deleteImage(oldCode);
        var url = ProductImages.cachedUrl(oldCode);
        if (url) state.images.set(newCode, url);
      }
    } catch (err) { /* a photo is only decoration */ }
  }

  async function deleteSheet() {
    var barcode = state.sheetBarcode;
    if (!barcode) return;
    if (!window.confirm('Remove this product from the list?')) return;
    await removeRecords([barcode]);
    closeSheet();
  }

  function upsertRecord(record) {
    var index = -1;
    for (var i = 0; i < state.records.length; i++) {
      if (state.records[i].barcode === record.barcode) { index = i; break; }
    }
    if (index === -1) state.records.push(record);
    else state.records[index] = record;
    state.recordMap.set(record.barcode, record);
  }

  async function removeRecords(barcodes) {
    // Keep what is about to be deleted, so a wrong tap can be undone.
    state.undoDelete = barcodes.map(function (code) {
      return state.recordMap.get(code);
    }).filter(Boolean);

    for (var i = 0; i < barcodes.length; i++) {
      try { await DB.deleteRecord(barcodes[i]); } catch (err) { /* ignore */ }
      state.recordMap.delete(barcodes[i]);
      state.selection.delete(barcodes[i]);
    }
    state.records = state.records.filter(function (record) {
      return barcodes.indexOf(record.barcode) === -1;
    });
    render();
    scheduleBackup();
    toast(barcodes.length === 1 ? 'Removed · Undo available' : barcodes.length + ' removed · Undo available', 'ok');
  }

  async function undoDelete() {
    var back = state.undoDelete || [];
    if (!back.length) return;
    state.undoDelete = null;

    for (var i = 0; i < back.length; i++) {
      try { await DB.saveRecord(back[i]); } catch (err) { /* keep going */ }
      upsertRecord(back[i]);
    }

    render();
    scheduleBackup();
    toast(back.length === 1 ? 'Restored' : back.length + ' restored', 'ok');
  }

  /* ---------- images ---------- */

  function setSheetImage(url) {
    if (url) {
      el.sheetImage.src = url;
      el.sheetImage.hidden = false;
      el.sheetMediaHint.hidden = true;
    } else {
      el.sheetImage.hidden = true;
      el.sheetImage.removeAttribute('src');
      el.sheetMediaHint.hidden = false;
    }
  }

  async function loadSheetImage(barcode) {
    if (!barcode) { setSheetImage(null); return; }
    var cached = state.images.get(barcode);
    if (cached) { setSheetImage(cached); return; }

    setSheetImage(null);
    var token = ++state.imageToken;
    var found = await ProductImages.resolve(barcode);
    if (token !== state.imageToken) return;
    if (found) {
      state.images.set(barcode, found.url);
      setSheetImage(found.url);
      renderList();
    }
  }

  async function refreshImageCache() {
    state.images = new Map();
    try {
      var rows = await DB.listImages();
      rows.forEach(function (row) {
        var url = ProductImages.cachedUrl(row.barcode);
        if (url) state.images.set(row.barcode, url);
      });
    } catch (err) { /* ignore */ }
  }

  /**
   * Photos for freshly imported barcodes. Runs after the import report is on
   * screen, so a long list never blocks: each photo appears as it arrives.
   */
  var photoRun = 0;

  var LOOKUP_BATCH = 6;       // barcodes looked up at once
  var PHOTO_BUDGET_MS = 9000; // time one import may spend on photos
  var nameCache = new Map();
  // One request every 2.5 s: fast enough to fill a list, slow enough that the
  // free databases keep answering instead of blocking the whole IP (429).
  var OFF_GAP_MS = 2500;

  // Background passes stay small so a manual "Find online" always has quota.
  var BOOT_PHOTO_CAP = 40;
  var BOOT_NAME_CAP = 25;
  var lastRemoteCall = 0;

  /** Space out requests to the product databases, or they start refusing. */
  async function throttleRemote() {
    var wait = lastRemoteCall + OFF_GAP_MS - Date.now();
    if (wait > 0) await new Promise(function (r) { setTimeout(r, wait); });
    lastRemoteCall = Date.now();
  }

  /** Catalogue first, then the open product databases. */
  async function resolveName(barcode) {
    var product = state.catalog.get(barcode);
    if (product && product.name) {
      return { name: product.name, categories: product.category || '', source: 'catalog' };
    }

    if (nameCache.has(barcode)) return nameCache.get(barcode);

    var hit = null;
    await throttleRemote();
    try { hit = await ProductLookup.lookup(barcode); } catch (err) { hit = null; }

    // Refused by the database, not unknown: never cache that as "no product".
    if (hit && (hit.busy || hit.error)) return { name: '', categories: '', source: 'busy' };

    var result = hit && hit.name
      ? { name: hit.name, categories: hit.categories || '', source: hit.source || 'online' }
      : { name: '', categories: '', source: 'none' };

    nameCache.set(barcode, result);
    return result;
  }

  // Words that decide which of the app's own categories a product belongs to.
  var BABY_RE = /\b(baby|infant|formula|follow[- ]?on|nan|sma|aptamil|similac|pediasure|toddler milk|growing up milk)\b/i;
  var NONFOOD_RE = /\b(shampoo|conditioner|soap|detergent|cleaner|cleaning|tissue|toilet paper|wipes|diaper|nappy|toothpaste|toothbrush|deodorant|bleach|dishwash|laundry|freshener|batteries|aluminium foil|cling film)\b/i;

  /**
   * The catalogue is authoritative; for everything else the product name and
   * the online categories are enough to pick the right rule.
   */
  function guessCategory(name, onlineCategories) {
    var hay = String(name || '') + ' ' + String(onlineCategories || '');
    if (!hay.trim()) return '';
    if (BABY_RE.test(hay)) return 'Baby milk';
    if (NONFOOD_RE.test(hay)) return 'Other / Non-Food';
    return 'Food & Beverages';
  }

  /** Every row shows a category and a returnable answer. */
  async function fillCategories() {
    var changed = 0;

    for (var i = 0; i < state.records.length; i++) {
      var record = state.records[i];
      if (record.category) continue;

      var product = state.catalog.get(record.barcode);
      var category = (product && product.category) || guessCategory(record.name, '');
      if (!category) continue;

      var filled = Object.assign({}, record, {
        category: category,
        returnable: !!record.returnable || !!(product && product.returnable),
        updatedAt: Date.now(),
      });

      try { await DB.saveRecord(filled); } catch (err) { /* memory only */ }
      upsertRecord(filled);
      changed++;
    }

    return changed;
  }

  /** Fetch photos until the time budget runs out; returns what is left over. */
  async function fetchPhotosFor(barcodes, budgetMs) {
    var queue = barcodes.filter(function (code) {
      return code && !state.images.get(code);
    });
    if (!queue.length) return [];

    var started = Date.now();
    var index = 0;
    var done = 0;

    while (index < queue.length) {
      if (Date.now() - started > budgetMs) break;

      var code = queue[index];
      index += 1;

      await throttleRemote();
      if (ProductImages.busy()) break; // refused: leftover photos load later
      try {
        var hit = await ProductImages.resolve(code);
        if (hit) {
          state.images.set(code, hit.url);
          done++;
        }
      } catch (err) { /* that barcode has no photo */ }

      el.importText.textContent = 'Photos ' + done + ' of ' + queue.length;
      el.importBar.style.width = Math.round((index / queue.length) * 100) + '%';
      renderList();
    }

    return queue.slice(index);
  }

  async function fetchPhotos(barcodes) {
    var run = ++photoRun;
    var queue = barcodes.filter(function (code) {
      return code && !state.images.get(code);
    });
    if (!queue.length) return;

    var found = 0;
    for (var i = 0; i < queue.length; i++) {
      if (run !== photoRun) return; // a newer import took over
      await throttleRemote();
      if (ProductImages.busy()) break; // refused: try again later
      try {
        var hit = await ProductImages.resolve(queue[i]);
        if (hit) {
          state.images.set(queue[i], hit.url);
          found++;
          if (found % 4 === 0) renderList();
        }
      } catch (err) { /* that barcode simply has no photo */ }
    }

    renderList();
    if (found) toast(found + (found === 1 ? ' photo' : ' photos') + ' loaded', 'ok');
  }

  /**
   * Older expiry imports stored only a barcode and a date. Fill in the product
   * details from the catalogue and save them, so they survive a reload.
   */
  async function enrichRecords() {
    var changed = 0;
    for (var i = 0; i < state.records.length; i++) {
      var record = state.records[i];
      if (record.name && record.category) continue;

      var product = state.catalog.get(record.barcode);
      if (!product) continue;

      var filled = {
        barcode: record.barcode,
        name: record.name || product.name || '',
        category: record.category || product.category || '',
        returnable: record.returnable || !!product.returnable,
        expiry: record.expiry,
        quantity: record.quantity,
        leadOverride: record.leadOverride,
        createdAt: record.createdAt,
        updatedAt: Date.now(),
      };

      try { await DB.saveRecord(filled); } catch (err) { /* keep the memory copy */ }
      upsertRecord(filled);
      changed++;
    }
    return changed;
  }

  /**
   * Background pass for records nothing could identify: try the open product
   * databases. Whatever is still nameless stays flagged orange in the list.
   */
  var unknownRun = 0;

  /** Background pass: photos for rows that still show the placeholder. */
  var photoBootRun = 0;

  async function fillMissingPhotos() {
    var run = ++photoBootRun;
    var queue = decorated()
      .filter(function (row) { return !state.images.get(row.record.barcode); })
      .map(function (row) { return row.record.barcode; })
      .slice(0, BOOT_PHOTO_CAP);
    if (!queue.length) return;

    for (var i = 0; i < queue.length; i += 1) {
      if (run !== photoBootRun) return;

      await throttleRemote();
      if (ProductImages.busy()) return; // refused: the next boot tries again
      try {
        var hit = await ProductImages.resolve(queue[i]);
        if (hit) state.images.set(queue[i], hit.url);
      } catch (err) { /* that barcode has no photo */ }

      renderList();
    }
  }

  async function resolveUnknownRecords() {
    var run = ++unknownRun;
    var queue = state.records.filter(function (record) { return !record.name; })
      .map(function (record) { return record.barcode; })
      .slice(0, BOOT_NAME_CAP);
    if (!queue.length) return;

    var found = 0;

    for (var i = 0; i < queue.length; i++) {
      if (run !== unknownRun) return;

      var hit = await resolveName(queue[i]);
      if (hit.source === 'busy') return; // refused: the next boot tries again

      if (hit.name) {
        var record = state.recordMap.get(queue[i]);
        if (record) {
          var filled = Object.assign({}, record, {
            name: hit.name,
            category: record.category || guessCategory(hit.name, hit.categories),
            updatedAt: Date.now(),
          });
          try { await DB.saveRecord(filled); } catch (err) { /* memory only */ }
          upsertRecord(filled);
          found++;
          renderList();
        }
      }
    }

    if (found) {
      render();
      toast(found + (found === 1 ? ' product named online' : ' products named online'), 'ok');
    }
  }

  async function handleImageFile(ev) {
    var file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Choose an image file.', 'error'); return; }
    var barcode = state.sheetBarcode || normaliseBarcode(el.codeInput.value);
    if (!barcode) { toast('Enter the barcode first.', 'error'); return; }
    try {
      var stored = await ProductImages.store(barcode, file, 'user');
      state.images.set(barcode, stored.url);
      setSheetImage(stored.url);
      renderList();
      toast('Image saved', 'ok');
    } catch (err) {
      toast('Could not save the image.', 'error');
    }
  }

  /**
   * "Find online" — one button that fetches whatever is missing for the barcode
   * in the form: the picture, the name and, from the name, the category.
   */
  async function findOnline() {
    var barcode = normaliseBarcode(el.codeInput.value) || state.sheetBarcode;
    if (!barcode) {
      toast('Enter or scan the barcode first.', 'error');
      el.codeInput.focus();
      return;
    }

    if (el.findImageBtn.disabled) return;
    el.findImageBtn.disabled = true;
    el.findImageBtn.textContent = 'Searching…';

    var gotImage = false;
    var gotName = false;

    try {
      // An existing photo is never thrown away first: it is only replaced when
      // something is actually found.
      var picture = await ProductImages.resolve(barcode);
      if (picture && picture.url) {
        state.images.set(barcode, picture.url);
        setSheetImage(picture.url);
        renderList();
        gotImage = true;
      }

      var needsName = !el.nameInput.value.trim();
      var info = await ProductLookup.lookup(barcode);

      // A single dropped request is common on a phone; try once more before
      // telling the operator the database cannot be reached.
      if (info && info.error && !ProductLookup.busy()) {
        await new Promise(function (r) { setTimeout(r, 2500); });
        info = await ProductLookup.lookup(barcode);
      }

      if (info && (info.busy || info.error)) {
        setNameStatus('Product database is busy — try again in a minute', 'warn');
        toast('Could not reach the product database — try again in a minute.', 'error');
        return;
      }

      if (info) {
        gotName = true;
        if (needsName) {
          el.nameInput.value = info.name;
          el.sheetName.textContent = info.name;
        }
        if (!el.categoryInput.value.trim()) {
          el.categoryInput.value = guessCategory(info.name, info.categories);
        }
        setNameStatus('Found online · ' + info.source, 'ok');
      } else if (needsName) {
        setNameStatus('Not found online — type the name', 'warn');
      }

      updateSummary();

      if (gotImage && gotName) toast('Name and photo found online', 'ok');
      else if (gotImage) toast('Photo found online', 'ok');
      else if (gotName) toast('Name found online — no photo available', 'ok');
      else toast('Nothing found online — check the barcode, or add a photo.', 'error');
    } catch (err) {
      toast('Online search failed — check the connection.', 'error');
    } finally {
      el.findImageBtn.disabled = false;
      el.findImageBtn.textContent = 'Find online';
    }
  }

  /* ---------- name lookup ---------- */

  var nameToken = 0;

  function setNameStatus(text, tone) {
    el.nameStatus.hidden = !text;
    el.nameStatusText.textContent = text || '';
    el.nameStatus.dataset.tone = tone || '';
  }

  /**
   * Fill an empty product name from the database first, then the open product
   * databases online, and always say where the name came from (or that it was
   * not found).
   */
  async function autoNameLookup(barcode, force) {
    var code = normaliseBarcode(barcode || el.codeInput.value);
    if (!code) return;

    var product = state.catalog.get(code);
    if (product && product.name) {
      if (!el.nameInput.value.trim() || force) {
        el.nameInput.value = product.name;
        el.sheetName.textContent = product.name;
      }
      setNameStatus('Found in your database', 'ok');
      return;
    }

    if (el.nameInput.value.trim() && !force) { setNameStatus('', ''); return; }

    var token = ++nameToken;
    setNameStatus('Searching online…', '');

    var hit = (typeof ProductLookup !== 'undefined') ? await ProductLookup.lookup(code) : null;
    if (token !== nameToken) return;

    if (hit && (hit.busy || hit.error)) {
      setNameStatus('Product database is busy — tap Search online again in a minute', 'warn');
      return;
    }

    if (!hit) {
      setNameStatus('Not found online — type the name', 'warn');
      return;
    }

    if (!el.nameInput.value.trim() || force) {
      el.nameInput.value = hit.name;
      el.sheetName.textContent = hit.name;
    }
    setNameStatus('Name found online · ' + hit.source, 'ok');
    renderList();
  }

  /* ---------- barcode lookup inside the sheet ---------- */

  function applyCatalogLookup() {
    var barcode = normaliseBarcode(el.codeInput.value);
    if (!barcode) return;
    var product = state.catalog.get(barcode);
    if (!product) {
      // A different product: never keep the previous product's name.
      el.nameInput.value = '';
      el.sheetName.textContent = 'New product';
      el.categoryInput.value = '';
      el.returnableInput.checked = false;
      setSheetBadge('Not in your database', 'warn');
      setNameStatus('', '');
      autoNameLookup(barcode);
      toast('Not in your database — searching online…', 'error');
      el.nameInput.focus();
      return;
    }
    setSheetBadge('Found in your database', 'info');
    el.nameInput.value = product.name || '';
    el.sheetName.textContent = product.name || 'New product';
    el.categoryInput.value = product.category || '';
    el.returnableInput.checked = !!product.returnable;
    updateSummary();
    loadSheetImage(barcode);
    setNameStatus('Found in your database', 'ok');
    toast('Found in the product list', 'ok');
  }

  /* ---------- scan page ---------- */

  function openScan() {
    el.scanScreen.hidden = false;
    el.scanResult.hidden = true;
    el.scanOpen.hidden = true;
    el.scanHint.textContent = 'Point the camera at a barcode';
    state.scanHit = null;
    startScan();
  }

  function closeScan() {
    stopScan();
    el.scanScreen.hidden = true;
  }

  function ensureScanner() {
    if (state.scanner) return state.scanner;
    state.scanner = ExpiryScanner.create({
      video: el.scanVideo,
      guide: el.scanGuide,
      onDetect: onScanDetect,
      onStatus: onScanStatus,
    });
    return state.scanner;
  }

  async function startScan() {
    var scanner = ensureScanner();
    el.scanStart.disabled = true;
    try {
      await scanner.start();
    } catch (err) {
      el.scanStart.disabled = false;
      toast(cameraErrorText(err), 'error');
      el.scanStart.textContent = 'Start camera';
    }
  }

  function stopScan() {
    if (state.scanner && state.scanner.isRunning) state.scanner.stop();
  }

  function onScanStatus(status) {
    if (status.state === 'running') {
      el.scanStart.disabled = false;
      el.scanStart.textContent = 'Stop camera';
      el.torchBtn.hidden = !status.torch;
      el.scanHint.textContent = 'Point the camera at a barcode';
    } else if (status.state === 'idle') {
      el.scanStart.disabled = false;
      el.scanStart.textContent = 'Start camera';
      el.torchBtn.hidden = true;
    } else if (status.state === 'starting') {
      el.scanStart.disabled = true;
      el.scanStart.textContent = 'Starting…';
    }
  }

  function cameraErrorText(err) {
    switch (err && err.name) {
      case 'NotAllowedError': return 'Camera access is blocked. Allow it in the browser settings.';
      case 'NotFoundError': return 'No camera found on this device.';
      case 'NotReadableError': return 'The camera is being used by another app.';
      default: return 'The camera could not start.';
    }
  }

  function onScanDetect(code) {
    if (state.scanLocked) return;
    state.scanLocked = true;
    beep();
    stopScan();

    var record = state.recordMap.get(code) || null;
    var product = state.catalog.get(code) || null;
    state.scanHit = { code: code, record: record, product: product };
    renderScanResult();

    setTimeout(function () { state.scanLocked = false; }, 900);
  }

  function renderScanResult() {
    var hit = state.scanHit;
    if (!hit) return;

    var name = (hit.record && hit.record.name) || (hit.product && hit.product.name) || 'Unknown product';
    var expiry = hit.record && hit.record.expiry ? Rules.formatDate(Rules.parseISODate(hit.record.expiry)) : '';

    el.scanName.textContent = name;
    el.scanCode.textContent = hit.code;
    el.scanThumb.replaceChildren();

    var thumbUrl = state.images.get(hit.code);
    if (thumbUrl) {
      var img = document.createElement('img');
      img.src = thumbUrl;
      img.alt = '';
      el.scanThumb.appendChild(img);
    } else {
      el.scanThumb.innerHTML = ICONS.package;
    }

    if (hit.record) {
      el.scanBadge.textContent = 'Already in your list' + (expiry ? ' · ' + expiry : '');
      el.scanBadge.dataset.tone = 'ok';
      el.scanOpen.textContent = 'Open item';
      el.scanHint.textContent = 'Already scanned — open it to edit or delete';
    } else if (hit.product) {
      el.scanBadge.textContent = 'Found in the product list';
      el.scanBadge.dataset.tone = 'info';
      el.scanOpen.textContent = 'Add expiry date';
      el.scanHint.textContent = 'Scan again or add the expiry date';
    } else {
      el.scanBadge.textContent = 'Not in the product list';
      el.scanBadge.dataset.tone = 'warn';
      el.scanOpen.textContent = 'Add product manually';
      el.scanHint.textContent = 'Scan again or enter the product by hand';
    }

    el.scanBadge.hidden = false;
    el.scanResult.hidden = false;
    el.scanOpen.hidden = false;
    el.scanStart.textContent = 'Scan again';

    if (thumbUrl) return;
    ProductImages.resolve(hit.code).then(function (found) {
      if (!found || !state.scanHit || state.scanHit.code !== hit.code) return;
      state.images.set(hit.code, found.url);
      el.scanThumb.replaceChildren();
      var image = document.createElement('img');
      image.src = found.url;
      image.alt = '';
      el.scanThumb.appendChild(image);
      renderList();
    });
  }

  function openScannedProduct() {
    var hit = state.scanHit;
    if (!hit) return;
    closeScan();
    // Saving this one should take the operator straight back to the camera.
    state.returnAfterSave = true;
    openSheet(hit.code);
  }

  /* ---- small camera inside the add form ---- */

  function ensureSheetScanner() {
    if (state.sheetScanner) return state.sheetScanner;
    state.sheetScanner = ExpiryScanner.create({
      video: el.sheetVideo,
      guide: el.sheetScanGuide,
      onDetect: onSheetScanDetect,
      onStatus: function () {},
    });
    return state.sheetScanner;
  }

  async function startSheetScan() {
    var scanner = ensureSheetScanner();
    el.sheetScanner.hidden = false;
    el.sheetScanHint.textContent = 'Starting the camera…';
    try {
      await scanner.start();
      el.sheetScanHint.textContent = 'Point the camera at a barcode';
    } catch (err) {
      el.sheetScanner.hidden = true;
      toast(cameraErrorText(err), 'error');
    }
  }

  function stopSheetScan() {
    if (state.sheetScanner && state.sheetScanner.isRunning) state.sheetScanner.stop();
    if (el.sheetScanner) el.sheetScanner.hidden = true;
  }

  function onSheetScanDetect(code) {
    if (state.scanLocked) return;
    state.scanLocked = true;
    beep();
    stopSheetScan();
    applyScanToSheet(code);
    setTimeout(function () { state.scanLocked = false; }, 900);
  }

  /** A code read while the add form was open. */
  function applyScanToSheet(code) {
    var existing = state.recordMap.get(code) || null;
    var product = state.catalog.get(code) || null;

    if (existing) {
      state.sheetBarcode = existing.barcode;
      state.sheetExisting = true;
      fillSheet(existing, existing, product);
      updateSummary();
      loadSheetImage(code);
      toast('Already in your list', 'error');
      return;
    }

    var data = {
      barcode: code,
      name: product ? product.name : '',
      category: product ? product.category : '',
      returnable: product ? !!product.returnable : false,
      expiry: '',
      leadOverride: null,
      quantity: parseInt(el.qtyInput.value, 10) || 1,
    };

    state.sheetBarcode = code;
    state.sheetExisting = false;
    fillSheet(data, null, product);
    updateSummary();
    loadSheetImage(code);

    if (product) {
      setSheetBadge('Found in your database', 'info');
      setNameStatus('Found in your database', 'ok');
      toast('Found: ' + product.name, 'ok');
      el.expiryInput.focus();
    } else {
      setSheetBadge('Not in your database', 'warn');
      setNameStatus('', '');
      autoNameLookup(code);
      el.nameInput.focus();
    }
  }

  /* ---------- selection ---------- */

  function toggleSelect(barcode) {
    if (state.selection.has(barcode)) state.selection.delete(barcode);
    else state.selection.add(barcode);
    render();
  }

  async function deleteSelected() {
    if (!state.selection.size) { toast('Select products first.', 'error'); return; }
    var count = state.selection.size;
    if (!window.confirm('Delete ' + count + (count === 1 ? ' product' : ' products') + ' from the list?')) return;
    await removeRecords(Array.from(state.selection));
  }

  /* ---------- importing ---------- */

  var AUTO_IMPORTED = false;

  async function importFromSource(interactive) {
    if (state.importing) return false;
    for (var i = 0; i < AUTO_SOURCES.length; i++) {
      try {
        var res = await fetch(encodeURI(AUTO_SOURCES[i]), { cache: 'no-store' });
        if (!res.ok) continue;
        var blob = await res.blob();
        if (blob.size < 512) continue;
        await importWorkbook(blob, AUTO_SOURCES[i]);
        return true;
      } catch (err) { /* try the next candidate */ }
    }
    if (interactive) toast('Could not load the Excel file. Check that it is in the folder.', 'error');
    return false;
  }

  async function importWorkbook(blob, label) {
    if (state.importing) return;
    state.importing = true;
    showOverlay(label || 'workbook');

    var batch = [];
    var started = Date.now();

    try {
      // Read the whole file first. The stored list is only replaced once the
      // workbook has been read successfully, so a bad or cancelled read can
      // never leave the app with an empty catalogue.
      var collected = [];
      var buffer = await blob.arrayBuffer();
      var result = await XlsxReader.read(buffer, {
        onHeader: function (columns) {
          el.importMeta.textContent = 'Columns: barcode ' + columns.barcode + ' · name ' + columns.name +
            ' · category ' + (columns.category || '—');
        },
        onRow: function (record) {
          var item = {
            barcode: record.barcode,
            name: record.name,
            brand: record.brand || '',
            category: record.category || '',
            returnable: !!record.returnable,
          };
          collected.push(item);
        },
        onProgress: function (info) {
          var pct = info.total ? Math.min(100, Math.round((info.loaded / info.total) * 100)) : 0;
          el.importBar.style.width = pct + '%';
          el.importText.textContent = info.phase === 'strings'
            ? 'Reading text…'
            : 'Reading rows… ' + number(info.rows || 0);
        },
      });

      if (!collected.length) throw new Error('That workbook has no product rows.');

      await DB.clearCatalog();
      state.catalog = Catalog.create();

      for (var i = 0; i < collected.length; i += BATCH_SIZE) {
        var chunk = collected.slice(i, i + BATCH_SIZE);
        chunk.forEach(function (item) { state.catalog.add(item); });
        await DB.putCatalogBatch(chunk);
      }
      collected = null;

      await DB.setMeta('catalog', {
        importedAt: Date.now(),
        rows: result.rows,
        count: state.catalog.size,
        source: label || '',
      });

      el.importBar.style.width = '100%';
      el.importText.textContent = number(state.catalog.size) + ' products ready';
      el.importTitle.textContent = 'Database ready';

      renderCategories();
      render();
      toast(number(state.catalog.size) + ' products loaded', 'ok');

      setTimeout(function () {
        if (!state.importing) el.importOverlay.hidden = true;
      }, 900);
    } catch (err) {
      console.error('[import]', err);
      el.importTitle.textContent = 'Import failed';
      el.importText.textContent = (err && err.message) || 'The workbook could not be read.';
      toast('Import failed', 'error');
    } finally {
      state.importing = false;
      if (batch.length) {
        try { await DB.putCatalogBatch(batch); } catch (err) { /* ignore */ }
      }
    }
  }

  function showOverlay(label) {
    el.importOverlay.hidden = false;
    el.importTitle.textContent = 'Reading the workbook';
    el.importText.textContent = 'Opening ' + label + '…';
    el.importMeta.textContent = '';
    el.importBar.style.width = '6%';
  }

  /* ---------- exporting ---------- */

  function stamp() { return new Date().toISOString().slice(0, 10); }

  function buildRows(list, title) {
    var header = ['Barcode', 'Product Name', 'Category', 'Returnable', 'Expiry Date',
      'Short Expiry Date', 'Days Remaining', 'Status', 'Lead Days', 'Qty'];
    var rows = [header];
    list.forEach(function (row) {
      var record = row.record;
      var result = row.result;
      rows.push([
        record.barcode,
        record.name,
        record.category || '',
        record.returnable ? 'Yes' : 'No',
        record.expiry || '',
        result.shortDate ? Rules.toISODate(result.shortDate) : '',
        result.daysLeft == null ? '' : result.daysLeft,
        result.statusMeta.label,
        result.leadDays,
        record.quantity || 1,
      ]);
    });
    return { name: title, rows: rows };
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  async function shareOrDownload(blob, filename, title) {
    var file = null;
    try {
      file = new File([blob], filename, { type: blob.type || XLSX_MIME });
    } catch (err) { file = null; }

    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: title, text: filename });
        return true;
      } catch (err) {
        if (err && err.name === 'AbortError') return true;
      }
    }

    download(blob, filename);
    return false;
  }

  async function exportRows(share) {
    var rows = state.selection.size
      ? decorated().filter(function (row) { return state.selection.has(row.record.barcode); })
      : decorated();

    if (!rows.length) { toast('Nothing to export.', 'error'); return; }

    var name = (state.selection.size ? 'selection-' : 'expiry-records-') + stamp() + '.xlsx';
    var blob = XlsxWriter.build(buildRows(rows, 'Short Expiry'));
    var shared = share ? await shareOrDownload(blob, name, 'Short expiry list') : false;

    if (!share) download(blob, name);
    toast(shared ? 'Ready to share · ' + rows.length + ' items' : 'Exported ' + rows.length + ' items', 'ok');
  }

  /* ---------- importing an expiry list ---------- */

  /** Accepts ISO text, dd/mm/yyyy, and Excel date serials. */
  function normaliseExpiry(value) {
    var s = String(value == null ? '' : value).trim();
    if (!s) return '';

    if (/^\d{5}(\.\d+)?$/.test(s)) {
      var serial = Math.floor(Number(s));
      var fromSerial = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return Rules.toISODate(fromSerial);
    }

    var direct = Rules.parseISODate(s);
    if (direct) return Rules.toISODate(direct);

    var parts = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);
    if (parts) {
      var swapped = Rules.parseISODate(
        parts[3] + '-' + ('0' + parts[2]).slice(-2) + '-' + ('0' + parts[1]).slice(-2)
      );
      return swapped ? Rules.toISODate(swapped) : '';
    }

    return '';
  }

  async function importExpiryFile(file) {
    if (state.importing) { toast('Wait for the current import to finish.', 'error'); return; }
    state.importing = true;
    showOverlay(file.name);
    el.importTitle.textContent = 'Reading the expiry list';
    el.importText.textContent = 'Reading rows…';

    var rows = [];
    var skipped = 0;

    try {
      var buffer = await file.arrayBuffer();
      await XlsxReader.read(buffer, {
        onRow: function (row) {
          var expiry = normaliseExpiry(row.expiry);
          if (!row.barcode || !expiry) { skipped++; return; }
          rows.push({
            barcode: row.barcode,
            name: row.name || '',
            category: row.category || '',
            returnable: !!row.returnable,
            expiry: expiry,
            quantity: row.quantity || 1,
            leadOverride: row.leadDays || null,
          });
        },
      });

      if (!rows.length) {
        el.importTitle.textContent = 'Nothing to import';
        el.importText.textContent = 'No rows with a barcode and an expiry date were found.';
        el.importBar.style.width = '100%';
        toast('No usable rows in that file', 'error');
        state.importing = false;
        setTimeout(function () { el.importOverlay.hidden = true; }, 1600);
        return;
      }

      var added = 0;
      var updated = 0;
      var matched = 0;
      var unmatched = 0;
      var imported = [];

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var existing = state.recordMap.get(row.barcode);
        // The expiry sheet normally has no product columns, so the catalogue
        // supplies name, category and returnable instead of leaving a barcode.
        var product = state.catalog.get(row.barcode);
        if (product) matched++;
        else unmatched++;
        var record = {
          barcode: row.barcode,
          name: row.name || (existing && existing.name) || (product && product.name) || '',
          category: row.category || (existing && existing.category) || (product && product.category) || '',
          returnable: row.returnable || (existing ? existing.returnable : false) || !!(product && product.returnable),
          expiry: row.expiry,
          quantity: row.quantity || (existing && existing.quantity) || 1,
          leadOverride: row.leadOverride != null ? row.leadOverride : (existing ? existing.leadOverride : null),
          createdAt: existing ? existing.createdAt : Date.now(),
          updatedAt: Date.now(),
        };
        await DB.saveRecord(record);
        upsertRecord(record);
        imported.push(record.barcode);
        if (existing) updated++;
        else added++;
        el.importBar.style.width = Math.round(((i + 1) / rows.length) * 100) + '%';
      }

      el.importTitle.textContent = 'Expiry list imported';
      el.importText.textContent = added + ' added · ' + updated + ' updated' +
        (skipped ? ' · ' + skipped + ' skipped' : '') +
        (unmatched ? ' · ' + unmatched + ' not in the catalogue' : '');
      el.importBar.style.width = '100%';

      render();
      scheduleBackup();
      toast(added + ' added, ' + updated + ' updated', 'ok');

      // Anything the catalogue could not name is looked up online now, so the
      // list is already complete when the operator sees it.
      var nameless = imported.filter(function (code) {
        var saved = state.recordMap.get(code);
        return saved && !saved.name;
      });

      var resolved = 0;

      if (nameless.length) {
        el.importTitle.textContent = 'Finding products online';
        el.importBar.style.width = '4%';

        for (var j = 0; j < nameless.length; j++) {
          var found = await resolveName(nameless[j]);

          // The database is refusing requests: stop, and leave the rest for the
          // background pass instead of marking them all as unknown.
          if (found.source === 'busy') {
            toast('Product database busy — the rest will be named later.', 'error');
            break;
          }

          if (found.name) {
            var saved = state.recordMap.get(nameless[j]);
            if (saved) {
              var filled = Object.assign({}, saved, {
                name: found.name,
                category: saved.category || guessCategory(found.name, found.categories),
                updatedAt: Date.now(),
              });
              try { await DB.saveRecord(filled); } catch (err) { /* keep in memory */ }
              upsertRecord(filled);
              resolved++;
            }
          }

          el.importText.textContent = 'Found ' + resolved + ' of ' + nameless.length;
          el.importBar.style.width = Math.round(((j + 1) / nameless.length) * 100) + '%';
          if (j % 3 === 2) renderList();
        }

        renderList();
      }

      // Photos are fetched in the same pass, within a short budget, so the list
      // is not shown full of empty tiles. Any leftovers finish in the background.
      el.importTitle.textContent = 'Loading photos';
      el.importBar.style.width = '4%';
      var leftover = await fetchPhotosFor(imported, PHOTO_BUDGET_MS);

      var unknown = imported.filter(function (code) {
        var saved = state.recordMap.get(code);
        return saved && !saved.name;
      }).length;

      el.importTitle.textContent = 'Expiry list imported';
      el.importText.textContent = added + ' added · ' + updated + ' updated' +
        (skipped ? ' · ' + skipped + ' skipped' : '') +
        (resolved ? ' · ' + resolved + ' found online' : '') +
        (unknown ? ' · ' + unknown + ' not found (orange)' : '');
      el.importBar.style.width = '100%';

      render();
      scheduleBackup();
      toast(added + ' added, ' + updated + ' updated', 'ok');

      if (leftover.length) fetchPhotos(leftover);
    } catch (err) {
      console.error('[expiry-import]', err);
      el.importTitle.textContent = 'Import failed';
      el.importText.textContent = (err && err.message) || 'That file could not be read.';
      toast('Import failed', 'error');
    } finally {
      state.importing = false;
      setTimeout(function () { el.importOverlay.hidden = true; }, 1400);
    }
  }

  /* ---------- backup to a real file ---------- */

  function backupSupported() {
    return typeof window.showSaveFilePicker === 'function';
  }

  function renderBackupStatus() {
    var node = el.backupStatus;
    if (!state.backupHandle) {
      var last = state.lastBackup
        ? new Date(state.lastBackup).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
      if (!state.records.length) {
        node.textContent = 'Nothing to back up yet';
        node.dataset.tone = '';
      } else if (last) {
        node.textContent = 'Last backup ' + last;
        node.dataset.tone = '';
      } else {
        node.textContent = backupSupported() ? 'Not saved to a file' : 'Use Backup now';
        node.dataset.tone = 'warn';
      }
      el.linkBackupBtn.textContent = 'Save to a file';
      el.linkBackupBtn.hidden = !backupSupported();
      return;
    }

    el.linkBackupBtn.textContent = state.backupReady ? 'Save now' : 'Reconnect';
    el.linkBackupBtn.hidden = false;

    if (!state.backupReady) {
      node.textContent = 'File linked — tap Reconnect';
      node.dataset.tone = 'warn';
      return;
    }

    var when = state.lastBackup
      ? new Date(state.lastBackup).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    node.textContent = when ? 'Auto-saved ' + when : 'File linked';
    node.dataset.tone = 'ok';
  }

  async function writeBackup(interactive) {
    var handle = state.backupHandle;
    if (!handle) return false;

    try {
      if (handle.queryPermission) {
        var perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          if (interactive && handle.requestPermission) {
            perm = await handle.requestPermission({ mode: 'readwrite' });
          }
        }
        if (perm !== 'granted') {
          state.backupReady = false;
          renderBackupStatus();
          return false;
        }
      }

      var blob = XlsxWriter.build(buildRows(decorated(), 'Short Expiry'));
      var writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      state.backupReady = true;
      state.lastBackup = Date.now();
      await DB.setMeta('lastBackup', state.lastBackup);
      renderBackupStatus();
      return true;
    } catch (err) {
      state.backupReady = false;
      renderBackupStatus();
      return false;
    }
  }

  function scheduleBackup() {
    renderBackupStatus();
    if (!state.backupHandle) return;
    clearTimeout(state.backupTimer);
    state.backupTimer = setTimeout(function () { writeBackup(false); }, 1200);
  }

  async function linkBackupFile() {
    if (state.backupHandle) {
      var saved = await writeBackup(true);
      if (saved) toast('Backup saved', 'ok');
      else toast('Reconnect the file to resume saving', 'error');
      return;
    }

    if (!backupSupported()) { backupNow(); return; }

    try {
      var handle = await window.showSaveFilePicker({
        suggestedName: 'short-expiry-backup.xlsx',
        types: [{
          description: 'Excel workbook',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      });
      state.backupHandle = handle;
      state.backupReady = true;
      await DB.setMeta('backupHandle', handle);
      await writeBackup(true);
      renderBackupStatus();
      toast('Backup file linked — it saves after every change', 'ok');
    } catch (err) {
      if (err && err.name !== 'AbortError') toast('Could not create the backup file', 'error');
    }
  }

  async function backupNow() {
    var rows = decorated();
    if (!rows.length) { toast('Nothing to back up yet.', 'error'); return; }

    var name = 'short-expiry-backup-' + stamp() + '.xlsx';
    var shared = await shareOrDownload(XlsxWriter.build(buildRows(rows, 'Short Expiry')), name, 'Short expiry backup');
    state.lastBackup = Date.now();
    try { await DB.setMeta('lastBackup', state.lastBackup); } catch (err) { /* ignore */ }
    renderBackupStatus();
    toast(shared ? 'Backup ready to share' : 'Backup saved to your downloads', 'ok');
  }

  /* ---------- data ---------- */

  async function loadRecords() {
    try {
      state.records = await DB.listRecords();
    } catch (err) {
      state.records = [];
    }
    state.recordMap = new Map();
    state.records.forEach(function (record) { state.recordMap.set(record.barcode, record); });
  }

  async function loadCatalogFromDb() {
    try {
      var rows = await DB.getAll('catalog');
      state.catalog.load(rows);
    } catch (err) { /* ignore */ }
  }

  /* ---------- views ---------- */

  function setView(view) {
    state.view = view;
    state.selection.clear();
    render();
  }

  function setReturnFilter(value) {
    state.returnFilter = value;
    state.selection.clear();
    render();
  }

  /* ---------- events ---------- */

  /* ---------- splash ---------- */

  function finishSplash() {
    var splash = el.splash;
    if (!splash) return;

    setTimeout(function () {
      splash.classList.add('is-hidden');
      setTimeout(function () { splash.remove(); }, 520);
    }, 1800);
  }

  /**
   * Pinch / double-tap / ctrl-wheel zoom is disabled on every device. iOS
   * ignores user-scalable=no, so the gestures are cancelled here as well.
   */
  function lockZoom() {
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (name) {
      document.addEventListener(name, function (ev) { ev.preventDefault(); }, { passive: false });
    });

    document.addEventListener('touchmove', function (ev) {
      if (ev.touches && ev.touches.length > 1) ev.preventDefault();
    }, { passive: false });

    var lastTouchEnd = 0;
    document.addEventListener('touchend', function (ev) {
      var now = Date.now();
      if (now - lastTouchEnd <= 320) ev.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });

    document.addEventListener('wheel', function (ev) {
      if (ev.ctrlKey) ev.preventDefault();
    }, { passive: false });
  }

  /* ---------- add to home screen ---------- */

  var install = { prompt: null, installed: false };

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true;
  }

  function isIos() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || '');
  }

  function isInAppBrowser() {
    return /(FBAN|FBAV|Instagram|Line\/|WhatsApp)/i.test(navigator.userAgent || '');
  }

  var INSTALL_STEPS = {
    ios: [
      'Tap <b>Share</b> <svg class="help__glyph" viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg> in the Safari toolbar.',
      'Tap <b>Add to Home Screen</b>, then <b>Add</b>.'
    ],
    android: [
      'Open this page in <b>Chrome</b>.',
      'Tap the <b>⋮ menu</b> at the top right of the screen.',
      'Tap <b>Install app</b> (sometimes called <b>Add to Home screen</b>).',
      'Tap <b>Install</b>. The Choithrams icon sits with your other apps.'
    ],
    desktop: [
      'Phone instalment needs a phone: open this address in <b>Safari</b> on iPhone or <b>Chrome</b> on Android.',
      'In Chrome for computers you can use the install icon in the address bar.'
    ]
  };

  function updateInstallButton() {
    if (!el.installBtn) return;

    if (isStandalone() || install.installed) {
      el.installBtn.hidden = true;
      return;
    }

    el.installBtn.hidden = false;
    if (el.installHint) {
      el.installHint.textContent = install.prompt
        ? 'One tap · full screen · offline'
        : isIos()
          ? 'Tap for the two Safari steps'
          : 'Full screen · works offline';
    }
  }

  function openInstallHelp(kind) {
    var steps = INSTALL_STEPS[kind] || INSTALL_STEPS.desktop;
    var lead = {
      ios: 'Safari has no install button — it is these two taps only.',
      android: 'Chrome installs it in one tap.',
      desktop: 'This browser cannot install the app by itself.'
    }[kind] || INSTALL_STEPS.desktop;

    if (isInAppBrowser()) {
      lead = 'This app is open inside another app. Copy the address into Safari or Chrome first.';
    }

    el.installLead.textContent = lead;
    el.installSteps.innerHTML = steps.map(function (step) {
      return '<li>' + step + '</li>';
    }).join('');
    el.installHelp.hidden = false;
  }

  async function addToHomeScreen() {
    el.drawer.hidden = true;

    if (isStandalone() || install.installed) {
      toast('Already on your home screen');
      return;
    }

    // Chrome and Samsung Internet hand us a real install prompt.
    if (install.prompt) {
      var prompt = install.prompt;
      install.prompt = null;
      try {
        prompt.prompt();
        var choice = await prompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          install.installed = true;
          toast('Added to your home screen');
        }
      } catch (err) {
        openInstallHelp(isIos() ? 'ios' : 'android');
      }
      updateInstallButton();
      return;
    }

    // Safari has no prompt API, so walk them through the Share menu.
    openInstallHelp(isIos() ? 'ios' : isAndroid() ? 'android' : 'desktop');
  }

  function setupInstall() {
    if (!el.installBtn) return;

    el.installBtn.addEventListener('click', addToHomeScreen);
    el.installHelp.querySelectorAll('[data-close-install]').forEach(function (node) {
      node.addEventListener('click', function () { el.installHelp.hidden = true; });
    });

    window.addEventListener('beforeinstallprompt', function (ev) {
      ev.preventDefault();
      install.prompt = ev;
      updateInstallButton();
    });

    window.addEventListener('appinstalled', function () {
      install.installed = true;
      install.prompt = null;
      updateInstallButton();
      toast('Added to your home screen');
    });

    updateInstallButton();
  }

  function bindEvents() {
    // top bar
    el.menuBtn.addEventListener('click', function () { el.drawer.hidden = false; });
    el.drawer.querySelectorAll('[data-close-drawer]').forEach(function (node) {
      node.addEventListener('click', function () { el.drawer.hidden = true; });
    });

    el.refreshBtn.addEventListener('click', async function () {
      if (state.importing) return;
      el.refreshBtn.dataset.active = 'true';
      await importFromSource(true);
      el.refreshBtn.dataset.active = 'false';
    });

    el.deleteBtn.addEventListener('click', function () {
      if (state.selection.size) deleteSelected();
      else toast('Select items with the circle first.', 'error');
    });

    el.downloadBtn.addEventListener('click', function () { exportRows(false); });
    el.shareBtn.addEventListener('click', function () { exportRows(true); });

    // search + filters
    el.searchInput.addEventListener('input', function () {
      state.query = el.searchInput.value;
      render();
    });

    el.filterBtn.addEventListener('click', function () {
      var open = el.filterPanel.hidden;
      el.filterPanel.hidden = !open;
      el.filterBtn.dataset.active = open ? 'true' : 'false';
    });

    el.viewChips.addEventListener('click', function (ev) {
      var chip = ev.target.closest('[data-view]');
      if (chip) setView(chip.dataset.view);
    });

    el.returnChips.addEventListener('click', function (ev) {
      var chip = ev.target.closest('[data-return]');
      if (chip) setReturnFilter(chip.dataset.return);
    });

    el.drawerNav.addEventListener('click', function (ev) {
      var item = ev.target.closest('[data-view]');
      if (!item) return;
      setView(item.dataset.view);
      el.drawer.hidden = true;
    });

    document.querySelectorAll('.stat[data-stat]').forEach(function (node) {
      node.addEventListener('click', function () {
        var stat = node.dataset.stat;
        if (stat === 'catalog') { el.drawer.hidden = true; el.importBtn.focus(); return; }
        if (stat === 'returnable' || stat === 'nonreturnable') setReturnFilter(stat);
        else setView(stat === 'tracked' ? 'all' : stat);
        el.drawer.hidden = true;
      });
    });

    // list
    el.list.addEventListener('click', function (ev) {
      var selectBtn = ev.target.closest('[data-select]');
      if (selectBtn) {
        ev.stopPropagation();
        toggleSelect(selectBtn.dataset.select);
        return;
      }
      var item = ev.target.closest('.item');
      if (item) {
        state.returnAfterSave = false;
        openSheet(item.dataset.barcode);
      }
    });

    // floating buttons
    el.scanBtn.addEventListener('click', function () { openScan(); });
    el.bottomScan.addEventListener('click', function () { openScan(); });
    el.addBtn.addEventListener('click', function () {
      state.returnAfterSave = false;
      openSheet('');
    });
    el.manualBtn.addEventListener('click', function () {
      state.returnAfterSave = false;
      openSheet('');
    });
    el.sheetScan.addEventListener('click', function () {
      state.returnAfterSave = true;
      if (state.sheetScanner && state.sheetScanner.isRunning) stopSheetScan();
      else startSheetScan();
    });
    el.sheetScanStop.addEventListener('click', stopSheetScan);
    el.nameSearchBtn.addEventListener('click', function () {
      autoNameLookup(el.codeInput.value || state.sheetBarcode, true);
    });

    // selection bar
    el.selectDelete.addEventListener('click', deleteSelected);
    el.selectExport.addEventListener('click', function () { exportRows(false); });

    el.selectAllBtn.addEventListener('click', function () {
      var rows = visibleRows();
      if (!rows.length) { toast('Nothing to select here.', 'error'); return; }

      state.selection = new Set(rows.map(function (row) { return row.record.barcode; }));
      render();
      toast(rows.length + (rows.length === 1 ? ' item selected' : ' items selected'), 'ok');
    });

    el.selectNone.addEventListener('click', function () {
      state.selection.clear();
      render();
    });

    el.undoBtn.addEventListener('click', undoDelete);

    // sheet
    el.sheet.querySelectorAll('[data-close-sheet]').forEach(function (node) {
      node.addEventListener('click', closeSheet);
    });
    el.sheetCancel.addEventListener('click', closeSheet);
    el.sheetSave.addEventListener('click', saveSheet);
    el.sheetDelete.addEventListener('click', deleteSheet);
    el.lookupBtn.addEventListener('click', applyCatalogLookup);
    el.codeInput.addEventListener('input', function () {
      el.sheetCode.textContent = normaliseBarcode(el.codeInput.value) || 'No barcode yet';
    });

    // Corrected by hand after a scan: look the new code up, but never overwrite
    // a name the operator typed themselves.
    el.codeInput.addEventListener('change', function () {
      var code = normaliseBarcode(el.codeInput.value);
      if (!code) return;
      el.codeInput.value = code;
      el.sheetCode.textContent = code;
      state.sheetBarcode = code;

      // Correcting the barcode of an item already on the list must not wipe
      // what the operator typed about it; only a new entry is filled in.
      if (state.sheetExisting) return;

      if (!state.catalog.has(code)) {
        el.nameInput.value = '';
        el.sheetName.textContent = 'New product';
        setNameStatus('', '');
        autoNameLookup(code);
        return;
      }
      if (!el.nameInput.value.trim()) applyCatalogLookup();
      else loadSheetImage(code);
    });
    el.nameInput.addEventListener('input', function () {
      el.sheetName.textContent = el.nameInput.value.trim() || 'New product';
    });

    attachDateMask(el.expiryInput);

    [el.expiryInput, el.qtyInput, el.categoryInput, el.leadInput, el.returnableInput].forEach(function (node) {
      node.addEventListener('input', updateSummary);
      node.addEventListener('change', updateSummary);
    });

    el.photoBtn.addEventListener('click', function () { el.photoInput.click(); });
    el.uploadBtn.addEventListener('click', function () { el.uploadInput.click(); });
    el.findImageBtn.addEventListener('click', findOnline);
    el.photoInput.addEventListener('change', handleImageFile);
    el.uploadInput.addEventListener('change', handleImageFile);

    // scan page
    el.scanClose.addEventListener('click', closeScan);
    el.scanOpen.addEventListener('click', openScannedProduct);
    el.scanStart.addEventListener('click', function () {
      if (state.scanner && state.scanner.isRunning) state.scanner.stop();
      else startScan();
    });
    el.torchBtn.addEventListener('click', function () {
      if (state.scanner) state.scanner.toggleTorch();
    });

    // import
    el.importBtn.addEventListener('click', function () {
      el.drawer.hidden = true;
      importFromSource(true);
    });
    el.importCancel.addEventListener('click', function () { el.importOverlay.hidden = true; });

    el.expiryImportBtn.addEventListener('click', function () {
      el.drawer.hidden = true;
      el.expiryImportInput.click();
    });
    el.expiryImportInput.addEventListener('change', function (ev) {
      var file = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if (file) importExpiryFile(file);
    });

    el.linkBackupBtn.addEventListener('click', linkBackupFile);
    el.backupNowBtn.addEventListener('click', function () {
      el.drawer.hidden = true;
      backupNow();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (!el.sheet.hidden) closeSheet();
      else if (!el.scanScreen.hidden) closeScan();
      else if (!el.drawer.hidden) el.drawer.hidden = true;
    });
  }

  /* ---------- boot ---------- */

  async function boot() {
    injectIcons();
    lockZoom();
    state.catalog = Catalog.create();
    bindEvents();
    setupInstall();
    render();
    finishSplash();

    // Makes the installed shortcut open offline; ignored where it cannot work.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* http or unsupported */ });
    }

    try {
      await DB.open();
    } catch (err) {
      toast('Storage is unavailable — changes will not be saved.', 'error');
    }

    // Ask the browser to keep this data instead of evicting it under pressure.
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(function () { /* best effort */ });
    }

    await loadRecords();
    await ProductImages.warm();
    await refreshImageCache();

    try {
      state.backupHandle = await DB.getMeta('backupHandle', null);
      state.lastBackup = (await DB.getMeta('lastBackup', 0)) || 0;
      if (state.backupHandle && state.backupHandle.queryPermission) {
        state.backupReady = (await state.backupHandle.queryPermission({ mode: 'readwrite' })) === 'granted';
      }
    } catch (err) {
      state.backupHandle = null;
    }

    var count = 0;
    try {
      count = await DB.countCatalog();
    } catch (err) {
      count = -1; // unreadable is not the same as empty: never re-import over it
    }

    if (count > 0) {
      await loadCatalogFromDb();
      renderCategories();
    } else if (count === 0 && !AUTO_IMPORTED) {
      AUTO_IMPORTED = true;
      await importFromSource(false);
    }

    // Repair expiry rows from earlier imports that arrived as bare barcodes.
    if (await enrichRecords()) {
      scheduleBackup();
    }

    // Anything still without a category gets one, so no row reads half-empty.
    if (await fillCategories()) {
      scheduleBackup();
    }

    render();

    // Names nothing could match yet are chased online after the first paint.
    resolveUnknownRecords();
    fillMissingPhotos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

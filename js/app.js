/* HotDogsAreSandwiches · Taxonomia Ediblis
   All content comes from data/taxonomy.json and data/rules.json.
   This file only draws it. To add a food, edit the data, not this file. */

(function () {
  'use strict';

  // ---------- Settings ----------

  // Where the Submit form sends entries. FormSubmit emails them to this address.
  // After the first confirmation email, FormSubmit gives a random code: replace the
  // email part with that code to keep the address out of the public source.
  // FormSubmit alias for the Review Board's inbox (keeps the real address out of the code)
  var FORM_ADDRESS = '50632871333cdf089e5f44b8d7b3d40b';
  var FORM_ENDPOINT = 'https://formsubmit.co/' + FORM_ADDRESS;        // fallback if scripts are off
  var FORM_AJAX_ENDPOINT = 'https://formsubmit.co/ajax/' + FORM_ADDRESS; // used by the page
  var MAX_PHOTO_BYTES = 10 * 1024 * 1024; // FormSubmit's limit per submission
  // Phones often hand over HEIC (iPhone) or WebP photos; accept those too.
  var PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
  var PHOTO_EXT = /\.(jpe?g|png|heic|heif|webp)$/i;

  // GoatCounter site code (the part before .goatcounter.com). Empty = analytics off.
  var GOATCOUNTER_CODE = 'hotdogsaresandwiches';

  var RANKS = ['domain', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'variety'];
  var PLURAL = {
    kingdom: 'Kingdoms', phylum: 'Phyla', 'class': 'Classes', order: 'Orders',
    family: 'Families', genus: 'Genera', species: 'Species', variety: 'Varieties'
  };
  var STANDING = [
    { id: 'canis-farcitus', food: 'Hot dog', why: 'Filling between bread. Case closed.' },
    { id: 'tacoforma-classicus', food: 'Taco', why: 'Same shape as the hot dog. They stand or fall together.' },
    { id: 'open-faced-sandwich', food: 'Open-faced sandwich', why: 'One slice is a topping arrangement.' },
    { id: 'cereal', food: 'Cereal', why: 'Never cooked together. Not our problem.' }
  ];

  // ---------- Data ----------

  var nodes = [], byId = {}, kids = {}, rules = null, root = null, assocs = [], assocById = {};

  function indexData(tax, rul) {
    nodes = tax.nodes;
    rules = rul;
    byId = {};
    kids = {};
    nodes.forEach(function (n) { byId[n.id] = n; kids[n.id] = []; });
    assocs = (tax.associations || []).filter(function (a) { return a && a.id && Array.isArray(a.members); });
    assocById = {};
    assocs.forEach(function (a) { a.isAssociation = true; assocById[a.id] = a; });
    nodes.forEach(function (n) {
      if (n.parent && kids[n.parent]) kids[n.parent].push(n);
      if (!n.parent) root = n;
    });
  }

  function lineage(id) {
    var out = [], n = byId[id], guard = 0;
    while (n && guard++ < 50) { out.unshift(n); n = n.parent ? byId[n.parent] : null; }
    return out;
  }

  function leaves(id, max) {
    var out = [];
    (function walk(n) {
      if (out.length >= max) return;
      var c = kids[n.id] || [];
      if (!c.length) { if (n.id !== id) out.push(n); return; }
      c.forEach(walk);
    })(byId[id]);
    return out;
  }

  function verdictOf(n) {
    var line = lineage(n.id);
    for (var i = line.length - 1; i >= 0; i--) if (line[i].verdict) return line[i].verdict;
    return null;
  }

  // ---------- Helpers ----------

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function fmtDate(iso) {
    if (!iso) return '';
    var m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December'];
    var p = iso.split('-');
    return Number(p[2]) + ' ' + m[Number(p[1]) - 1] + ' ' + p[0];
  }

  function badge(n) {
    if (n.status === 'pending review') return '<span class="badge badge-pending">Pending review</span>';
    if (n.status === 'species inquirenda') return '<span class="badge badge-pending badge-inquirenda" title="Known from reports, not yet collected">Species inquirenda</span>';
    var v = verdictOf(n);
    if (!v) return '';
    var negative = /^not /i.test(v);
    return '<span class="badge' + (negative ? ' badge-no' : '') + '">Ruled: ' + esc(v.toLowerCase()) + '</span>';
  }

  function catalogNo(n) {
    var num = n.catalog || (nodes.indexOf(n) + 1);
    return 'TE-' + String(num).padStart(4, '0');
  }

  function sketch(n) {
    var hot = lineage(n.id).some(function (x) { return x.sketch === 'hotdog'; });
    if (hot) {
      return '<svg viewBox="0 0 320 136" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">' +
        '<path d="M34 64 C34 36 286 36 286 64"/>' +
        '<rect x="18" y="52" width="284" height="32" rx="16"/>' +
        '<path d="M48 62 q10 -7 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" style="stroke: var(--accent)" stroke-width="3"/>' +
        '<path d="M26 76 Q26 112 72 112 L248 112 Q294 112 294 76"/></svg>';
    }
    // A specimen jar, for everything not yet drawn
    return '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">' +
      '<rect x="62" y="30" width="76" height="16" rx="3"/>' +
      '<path d="M68 46 V58 Q48 66 48 92 V158 Q48 172 62 172 H138 Q152 172 152 158 V92 Q152 66 132 58 V46"/>' +
      '<rect x="70" y="104" width="60" height="34" rx="2" style="stroke: var(--accent)"/>' +
      '<path d="M80 116 H120 M80 126 H108" style="stroke: var(--accent)"/></svg>';
  }

  function ladder(n, opts) {
    opts = opts || {};
    var line = lineage(n.id).filter(function (x) { return x.rank !== 'domain'; });
    if (!opts.includeSelf) line = line.filter(function (x) { return x.id !== n.id; });
    if (!line.length) return '';
    return '<nav class="ladder" aria-label="Classification">' + line.map(function (x, i) {
      var key = x.rank === 'class' && x.id === 'sandwichae';
      var isSci = ['genus', 'species', 'variety'].indexOf(x.rank) >= 0;
      return '<a href="#/specimen/' + esc(x.id) + '" style="padding-left:' + (i * 8) + 'px"' +
        (key ? ' class="key"' : '') + '>' +
        (isSci ? '<em>' + esc(x.scientific) + '</em>' : esc(x.scientific)) +
        '<span class="rk">' + esc(x.rank) + '</span></a>';
    }).join('') + '</nav>';
  }

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var q = {}, qi = h.indexOf('?');
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split('=');
        try { q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } catch (e) { /* ignore bad input */ }
      });
      h = h.slice(0, qi);
    }
    var parts = h.split('/').filter(Boolean);
    return { route: parts[0] || 'home', id: parts[1] ? decodeURIComponent(parts[1]) : null, query: q };
  }

  function qs(obj) {
    return Object.keys(obj).filter(function (k) { return obj[k]; }).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
    }).join('&');
  }

  // ---------- Pages ----------

  function pageHome() {
    var f = nodes.filter(function (n) { return n.featured; })[0] || byId['canis-farcitus'];
    var line = lineage(f.id).filter(function (x) { return x.rank !== 'domain' && x.id !== f.id; });
    var rows = line.map(function (x) {
      var key = x.id === 'sandwichae';
      var isSci = ['genus', 'species'].indexOf(x.rank) >= 0;
      return '<dt>' + esc(x.rank) + '</dt><dd' + (key ? ' class="key-row"' : '') + '>' +
        (isSci ? '<em>' + esc(x.scientific) + '</em>' : esc(x.scientific)) + '</dd>';
    }).join('');

    var standing = STANDING.filter(function (s) { return byId[s.id]; }).map(function (s) {
      return '<a class="ruling" href="#/specimen/' + esc(s.id) + '">' +
        '<span class="food">' + esc(s.food) + '</span>' +
        '<span class="verdict">' + esc(verdictOf(byId[s.id]) || '') + '</span>' +
        '<span class="why">' + esc(s.why) + '</span></a>';
    }).join('');

    return {
      title: 'HotDogsAreSandwiches · Taxonomia Ediblis',
      html:
        '<section class="hero">' +
          '<div class="hero-text">' +
            '<span class="eyebrow">Official Ruling No. 001</span>' +
            '<h1>The hot dog is a&nbsp;<em>sandwich.</em></h1>' +
            '<p>This is settled science. Taxonomia Ediblis classifies every food from kingdom to variety, by rules that were argued over at length and are now, regrettably, binding.</p>' +
            '<div class="btn-row"><a class="btn btn-accent" href="#/tree">Explore the tree</a>' +
            '<a class="btn" href="#/classify">Classify a food</a></div>' +
          '</div>' +
          '<aside class="label-card" aria-label="Featured specimen">' +
            '<div class="top mono"><span>Featured specimen</span><span>' + esc(catalogNo(f)) + '</span></div>' +
            '<div><div class="name">' + esc(f.common) + '</div><div class="sci">' + esc(f.scientific) + '</div></div>' +
            '<dl class="kv">' + rows + '</dl>' +
            '<p style="font-size:14px;color:var(--ink-2)">' + esc(f.short) + '</p>' +
            '<a href="#/specimen/' + esc(f.id) + '" style="font-size:14px;font-weight:600">Read the field notes →</a>' +
          '</aside>' +
        '</section>' +
        '<section class="rulings" aria-labelledby="standing-h">' +
          '<h2 id="standing-h" class="eyebrow" style="font-family:var(--mono);font-size:12px">Standing rulings</h2>' +
          '<div class="rulings-grid">' + standing + '</div>' +
        '</section>'
    };
  }

  function pageAbout() {
    return {
      title: 'About · HotDogsAreSandwiches',
      html:
        '<div class="page">' +
          '<header class="page-head"><span class="eyebrow">About</span>' +
          '<h1>A field guide nobody asked for.</h1>' +
          '<p class="lede">It started as a dinner-table argument about whether a hot dog is a sandwich. It escalated into a full taxonomy.</p></header>' +
          '<div class="prose">' +
            '<p>Biologists sort living things into a domain, kingdoms, phyla and so on, down to species. Taxonomia Ediblis does the same for food, one rank at a time, using a small set of rules that apply to everything equally. When a rule produces an awkward answer, the Board accepts the answer rather than bending the rule. That is how gazpacho stopped being soup.</p>' +
            '<h2>The five kingdoms</h2>' +
            '<ul>' + ['condimenta', 'liquida', 'naturalia', 'constructa', 'incertae-sedis'].filter(function (k) { return byId[k]; }).map(function (k) {
              var n = byId[k];
              return '<li><a href="#/specimen/' + esc(k) + '"><strong>' + esc(n.scientific) + '</strong></a>: ' + esc(n.common.toLowerCase()) + '. ' + esc(n.trait) + '.</li>';
            }).join('') + '</ul>' +
            '<h2>The Taxonomic Review Board</h2>' +
            '<p>One person, who also takes the photos. Every submission is read, and rulings are final until they are not.</p>' +
            '<h2>Contribute</h2>' +
            '<p>Found a food that is not in the tree? <a href="#/classify">Run it through the classifier</a>, then <a href="#/submit">submit it</a>. Photos must be your own: wild specimens only, no stock images.</p>' +
            '<h2>License</h2>' +
            '<p>© 2026 The Taxonomic Review Board (jeffsonlinepersona). The taxonomy, rules, descriptions and plates are licensed <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license">CC BY-NC 4.0</a>: share and adapt them freely, with credit, for anything non-commercial. Contributor photos stay <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, credited to their photographers. Details in the <a href="https://github.com/jeffsonlinepersona/hotdogsaresandwiches/blob/main/LICENSE.md">license</a>.</p>' +
          '</div>' +
        '</div>'
    };
  }

  function pageRules() {
    var list = rules.rules.map(function (r, i) {
      return '<article class="rule" id="rule-' + esc(r.id) + '">' +
        '<div class="rule-num">' + (i + 1) + '</div>' +
        '<div><h2>' + esc(r.title) + '</h2><p class="summary">' + esc(r.summary) + '</p>' +
        '<ul>' + r.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
        (r.link && /^#\//.test(r.link.href) ? '<a class="rule-link" href="' + esc(r.link.href) + '">' + esc(r.link.label) + ' →</a>' : '') + '</div>' +
        '<aside class="example"><span class="eyebrow">Example</span><span>' + esc(r.example) + '</span></aside>' +
      '</article>';
    }).join('');
    return {
      title: 'The Rules · HotDogsAreSandwiches',
      html:
        '<div class="page">' +
          '<header class="page-head"><span class="eyebrow">The Rules</span>' +
          '<h1>How every food gets placed.</h1>' +
          '<p class="lede">' + rules.rules.length + ' rules, applied in order, without exceptions. When a rule produces an unpopular answer, the answer stands.</p></header>' +
          '<div class="rules-list">' + list + '</div>' +
          '<div class="btn-row" style="margin-top:40px"><a class="btn btn-accent" href="#/classify">Try them on a food</a></div>' +
        '</div>'
    };
  }

  function pageTree(id) {
    var sel = (id && byId[id]) ? byId[id] : root;
    if (id && !byId[id]) return pageMissing();
    var path = lineage(sel.id);
    var cols = [];

    path.forEach(function (p, i) {
      var c = kids[p.id];
      if (!c.length) return;
      var next = path[i + 1];
      var ranks = c.map(function (x) { return x.rank; });
      var same = ranks.every(function (r) { return r === ranks[0]; });
      var head = (p.id === root.id ? '' : esc(p.scientific) + ' · ') + (same ? (PLURAL[ranks[0]] || 'Members') : 'Members');
      cols.push('<section class="col" aria-label="' + head + '"><div class="col-head">' + head + '</div><ul>' +
        c.map(function (x) {
          var has = kids[x.id].length > 0;
          var isSci = ['genus', 'species', 'variety'].indexOf(x.rank) >= 0;
          return '<li><a class="col-item" href="#/tree/' + esc(x.id) + '"' + (next && next.id === x.id ? ' aria-current="true"' : '') + '>' +
            '<span class="txt"><span class="c">' + esc(x.common) + '</span>' +
            '<span class="s">' + (isSci ? esc(x.scientific) : esc(x.scientific)) + '</span></span>' +
            (has ? '<span class="chev" aria-hidden="true">›</span>' : badge(x)) + '</a></li>';
        }).join('') + '</ul></section>');
    });

    if (!kids[sel.id].length) {
      cols.push('<section class="preview" aria-label="Selected specimen">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="eyebrow">' + esc(sel.rank) + '</span>' + badge(sel) + '</div>' +
        '<h2>' + esc(sel.common) + '</h2><div class="sci">' + esc(sel.scientific) + '</div>' +
        '<p>' + esc(sel.short) + '</p>' +
        '<div class="btn-row"><a class="btn btn-ink" href="#/specimen/' + esc(sel.id) + '">Open specimen card</a></div>' +
      '</section>');
    }

    var crumbs = path.map(function (p, i) {
      var last = i === path.length - 1;
      var label = p.id === root.id ? 'All food' : p.scientific;
      return (i ? '<span class="sep" aria-hidden="true">/</span>' : '') +
        (last ? '<span class="here">' + esc(label) + '</span>' : '<a href="#/tree/' + esc(p.id) + '">' + esc(label) + '</a>');
    }).join('');

    var cardLink = sel.id !== root.id && kids[sel.id].length
      ? '<a href="#/specimen/' + esc(sel.id) + '" style="margin-left:auto;font-weight:600;color:var(--ink)">View the ' + esc(sel.rank) + ' card →</a>'
      : '';

    return {
      title: (sel.id === root.id ? 'The Tree' : sel.common + ' · The Tree') + ' · HotDogsAreSandwiches',
      after: function () {
        // Keep the newest column in view; re-run once fonts finish loading,
        // because column widths change when the web fonts arrive.
        function toEnd() {
          var el = document.querySelector('.columns');
          if (el && el.scrollWidth > el.clientWidth) {
            el.style.scrollBehavior = 'auto';
            el.scrollLeft = el.scrollWidth;
            el.style.scrollBehavior = '';
          }
        }
        toEnd();
        if (window.requestAnimationFrame) requestAnimationFrame(toEnd);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(toEnd);
      },
      html:
        '<div class="page">' +
          '<header class="page-head"><span class="eyebrow">The Tree</span>' +
          '<h1>Every food, by rank.</h1>' +
          '<p class="lede">Pick a kingdom and keep going. Everything ends at a specimen card.</p></header>' +
          '<nav class="crumbs" aria-label="Breadcrumb">' + crumbs + cardLink + '</nav>' +
          '<div class="columns">' + cols.join('') + '</div>' +
        '</div>'
    };
  }

  function evidence(n) {
    var list = (n.sources || []).filter(function (x) { return x && /^https:\/\//.test(x.url || ''); });
    if (!list.length) return '';
    return '<div class="evidence"><span class="eyebrow">Supporting evidence</span><ul>' +
      list.map(function (x) {
        return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a>' +
          (x.note ? '<span class="evidence-note">' + esc(x.note) + '</span>' : '') + '</li>';
      }).join('') + '</ul></div>';
  }

  function specimenImages(n) {
    if (n.images && n.images.length) return n.images;
    if (n.photo) return [{ src: n.photo, kind: 'photo', credit: n.photo_credit }];
    return [];
  }

  function imgTag(im, alt) {
    return '<img src="' + esc(im.src) + '" alt="' + esc(alt) + '"' +
      (im.w && im.h ? ' width="' + im.w + '" height="' + im.h + '"' : '') + ' loading="lazy" decoding="async">';
  }

  function photoCaption(im, label) {
    return esc(label) + ' · Photographed in the wild by ' + esc(im.credit || 'an anonymous field researcher') +
      (im.date ? ' · ' + esc(fmtDate(im.date)) : '');
  }

  function specimenMedia(n, imgs) {
    if (!imgs.length) {
      return '<div class="specimen-media"><figure class="specimen-figure">' + sketch(n) +
        '<figcaption>Not yet photographed in the wild</figcaption></figure></div>';
    }
    var first = imgs[0], rest = imgs.slice(1), primary, photoNo = 0;
    if (first.kind === 'plate') {
      primary = '<figure class="specimen-figure plate">' + imgTag(first, n.common + ', an illustrated plate drawn from a wild specimen') +
        '<figcaption>' + esc(first.label || 'Plate') + ' · ' + (first.caption ? esc(first.caption) : 'Illustration after a wild specimen photographed by ' +
        esc(first.credit || 'an anonymous field researcher')) + ' · CC BY-NC 4.0</figcaption></figure>';
    } else {
      photoNo = 1;
      primary = '<figure class="specimen-figure matted"><div class="mat">' + imgTag(first, n.common + ', photographed in the wild') + '</div>' +
        '<figcaption class="mat-label">' + photoCaption(first, 'Photo 1') + ' · CC BY 4.0</figcaption></figure>';
    }
    var gallery = rest.length
      ? '<section class="specimen-gallery" aria-label="Field photographs"><h2>Field photographs</h2><ul>' +
          rest.map(function (im) {
            photoNo += 1;
            var label = 'Photo ' + photoNo;
            return '<li><a href="' + esc(im.src) + '" target="_blank" rel="noopener" aria-label="' + esc(label) + ', open full size">' +
              '<span class="mat">' + imgTag(im, n.common + ', ' + label.toLowerCase()) + '</span>' +
              '<span class="mat-label">' + photoCaption(im, label) + '</span></a></li>';
          }).join('') + '</ul></section>'
      : '';
    return '<div class="specimen-media">' + primary + gallery + '</div>';
  }

  function pageSpecimen(id) {
    var n = byId[id];
    if (!n) return pageMissing();
    var children = kids[n.id];
    // Images: an optional list. The primary image comes first. A "plate"
    // (an illustration adapted from a wild specimen) is shown whole, at its own
    // shape. Photographs always sit in a fixed mat so cards keep one shape.
    var imgs = specimenImages(n);
    var fig = specimenMedia(n, imgs);
    var collector = imgs.length ? (imgs[0].credit || 'Anonymous') : '';

    var meta = '<dl class="kv" style="grid-template-columns:120px minmax(0,1fr)">' +
      '<dt>Catalog</dt><dd>' + esc(catalogNo(n)) + '</dd>' +
      (n.trait ? '<dt>Defining trait</dt><dd>' + esc(n.trait) + '</dd>' : '') +
      '<dt>Collected by</dt><dd>' + esc(imgs.length ? collector : 'Awaiting a wild specimen') + '</dd>' +
      '<dt>' + (n.status === 'species inquirenda' ? 'Recorded' : 'Ruled') + '</dt><dd>' + esc(fmtDate(n.ruled_on)) + '</dd></dl>';

    var members = children.length
      ? '<section class="members"><h2>Members</h2><ul>' + children.map(function (c) {
          return '<li><a href="#/specimen/' + esc(c.id) + '"><span class="c">' + esc(c.common) + '</span><span class="s">' + esc(c.scientific) + '</span></a></li>';
        }).join('') + '</ul></section>'
      : '';

    var found = assocs.filter(function (a) { return a.members.some(function (m) { return m.id === n.id; }); });
    var foundWith = found.length
      ? '<section class="members found-with"><h2>Commonly found with</h2><ul>' + found.map(function (a) {
          var others = a.members.filter(function (m) { return m.id !== n.id && byId[m.id]; })
            .map(function (m) { return byId[m.id].common; }).join(', ');
          return '<li><a href="#/association/' + esc(a.id) + '"><span class="c">' + esc(others) + '</span><span class="s">in ' + esc(a.common) + ' (<em>' + esc(a.scientific) + '</em>)</span></a></li>';
        }).join('') + '</ul></section>'
      : '';

    var food = n.common;
    return {
      title: n.common + ' (' + n.scientific + ') · HotDogsAreSandwiches',
      html:
        '<div class="page specimen-page">' +
          '<div class="specimen">' + fig +
            '<div class="specimen-body">' +
              '<div class="specimen-head"><div class="rank-row"><span class="eyebrow">' + esc(n.rank) + '</span>' + badge(n) + '</div>' +
              '<h1>' + esc(n.common) + '</h1><div class="sci">' + esc(n.scientific) + '</div></div>' +
              ladder(n) +
              (n.status === 'species inquirenda'
                ? '<aside class="stub-notice"><strong>This specimen is a species inquirenda:</strong> known from reports, not yet collected by the Review Board. ' +
                  'In real taxonomy the term marks a species that needs further inquiry. You can help by <a href="#/submit?' + qs({ type: 'photo', food: n.common }) + '">submitting a wild photo</a>.</aside>'
                : '') +
              '<p class="short">' + esc(n.status === 'species inquirenda' ? n.short.replace(/\s*Species inquirenda:.*$/, '') : n.short) + '</p>' +
              (n.long ? '<p class="long">' + esc(n.long) + '</p>' : '') +
              evidence(n) +
              meta + members + foundWith +
              '<div class="btn-row">' +
                '<a class="btn btn-ink" href="#/submit?' + qs({ type: 'photo', food: food }) + '">Submit a photo</a>' +
                '<a class="btn" href="#/submit?' + qs({ type: 'dispute', food: food }) + '">Dispute this ruling</a>' +
              '</div>' +
              '<a href="#/tree/' + esc(n.id) + '" style="font-size:14px;color:var(--muted)">Show in the tree →</a>' +
            '</div>' +
          '</div>' +
        '</div>'
    };
  }

  function pageAssociations() {
    var list = assocs.map(function (a) {
      var names = a.members.filter(function (m) { return byId[m.id]; }).map(function (m) { return byId[m.id].common; }).join(' + ');
      return '<li><a href="#/association/' + esc(a.id) + '">' +
        '<span><span class="c">' + esc(a.common) + '</span> <span class="s">' + esc(a.scientific) + '</span></span>' +
        '<span class="path">' + esc(names) + '</span></a></li>';
    }).join('');
    return {
      title: 'Associations · HotDogsAreSandwiches',
      html:
        '<div class="page">' +
          '<header class="page-head"><span class="eyebrow">Associations</span>' +
          '<h1>Species that are found together.</h1>' +
          '<p class="lede">Combo meals, recorded the way ecologists record plants that grow together: as associations. Each member keeps its own place in the tree. See <a href="#/rules">the association rule</a>.</p></header>' +
          '<ul class="results">' + list + '</ul>' +
        '</div>'
    };
  }

  function pageAssociation(id) {
    if (!id) return pageAssociations();
    var a = assocById[id];
    if (!a) return pageMissing();
    var imgs = specimenImages(a);
    var fig = specimenMedia(a, imgs);
    var memberList = '<section class="members"><h2>Members</h2><ul>' + a.members.filter(function (m) { return byId[m.id]; }).map(function (m) {
      var x = byId[m.id];
      var k = lineage(x.id).filter(function (y) { return y.rank === 'kingdom'; })[0];
      return '<li><a href="#/specimen/' + esc(x.id) + '"><span class="c">' + esc(x.common) + '</span><span class="s"><em>' + esc(x.scientific) + '</em>' +
        ' · ' + esc(m.role || 'Member') + (k ? ' · ' + esc(k.scientific) : '') + '</span></a></li>';
    }).join('') + '</ul></section>';
    var meta = '<dl class="kv" style="grid-template-columns:120px minmax(0,1fr)">' +
      '<dt>Catalog</dt><dd>' + esc(catalogNo(a)) + '</dd>' +
      '<dt>Members</dt><dd>' + a.members.length + ' species, eaten in separate bites</dd>' +
      ((a.applied || []).length ? '<dt>Applied</dt><dd>' + esc(a.applied.join(', ')) + ' (condiments, not members)</dd>' : '') +
      '<dt>Collected by</dt><dd>' + esc(imgs.length ? (imgs[0].credit || 'Anonymous') : 'Awaiting a wild specimen') + '</dd>' +
      '<dt>Ruled</dt><dd>' + esc(fmtDate(a.ruled_on)) + '</dd></dl>';
    return {
      title: a.common + ' (' + a.scientific + ') · HotDogsAreSandwiches',
      html:
        '<div class="page specimen-page">' +
          '<div class="specimen">' + fig +
            '<div class="specimen-body">' +
              '<div class="specimen-head"><div class="rank-row"><span class="eyebrow">Association</span><span class="badge">Not a species</span></div>' +
              '<h1>' + esc(a.common) + '</h1><div class="sci">' + esc(a.scientific) + '</div></div>' +
              '<p class="short">' + esc(a.short) + '</p>' +
              (a.long ? '<p class="long">' + esc(a.long) + '</p>' : '') +
              memberList + meta +
              '<div class="btn-row">' +
                '<a class="btn btn-ink" href="#/submit?' + qs({ type: 'photo', food: a.common }) + '">Submit a photo</a>' +
                '<a class="btn" href="#/submit?' + qs({ type: 'dispute', food: a.common }) + '">Dispute this ruling</a>' +
              '</div>' +
              '<a href="#/associations" style="font-size:14px;color:var(--muted)">All associations →</a>' +
            '</div>' +
          '</div>' +
        '</div>'
    };
  }

  // Classifier state lives here while the visitor is on the page
  var cls = { started: false, food: '', path: [], result: null };

  function resetClassifier() { cls = { started: false, food: '', path: [], result: null }; }

  function pageClassify() {
    var C = rules.classifier;
    var body;

    if (!cls.started) {
      body =
        '<div class="field"><label for="cls-food">What food are you classifying?</label>' +
        '<input type="text" id="cls-food" placeholder="e.g. a corn dog" value="' + esc(cls.food) + '" autocomplete="off">' +
        '<span class="hint">Optional, but it saves typing if you end up submitting it.</span></div>' +
        '<div class="btn-row" style="margin-top:24px"><button class="btn btn-accent" type="button" data-action="start">Begin examination</button></div>';
    } else if (cls.result) {
      var n = byId[cls.result];
      var known = leaves(n.id, 12);
      var placement = lineage(n.id).filter(function (x) { return x.rank !== 'domain'; })
        .map(function (x) { return x.scientific; }).join(' › ');
      body =
        '<div class="progress" aria-hidden="true">' + cls.path.map(function () { return '<span class="on"></span>'; }).join('') + '<span class="on"></span></div>' +
        '<span class="eyebrow">Classification complete</span>' +
        '<div class="result-card">' +
          '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="eyebrow">' + esc(n.rank) + '</span>' + badge(n) + '</div>' +
          '<h2>' + (cls.food ? esc(cap(cls.food)) + ' belongs in ' : 'It belongs in ') + '<em>' + esc(n.scientific) + '</em>.</h2>' +
          ladder(n, { includeSelf: true }) +
          '<p>' + esc(n.short) + '</p>' +
        '</div>' +
        (known.length
          ? '<section class="members" style="margin-top:32px"><h2>Is it one of these?</h2><ul>' + known.map(function (k) {
              return '<li><a href="#/specimen/' + esc(k.id) + '"><span class="c">' + esc(k.common) + '</span><span class="s">' + esc(k.scientific) + '</span></a></li>';
            }).join('') + '</ul></section>'
          : '<p class="notice" style="margin-top:24px">No specimens have been catalogued here yet. Yours would be the first.</p>') +
        '<div class="btn-row" style="margin-top:28px">' +
          '<a class="btn btn-accent" href="#/submit?' + qs({ type: 'new', food: cls.food, placement: placement }) + '">Not listed? Submit it</a>' +
          '<button class="btn" type="button" data-action="back">Change my last answer</button>' +
          '<button class="btn" type="button" data-action="restart">Start over</button>' +
        '</div>';
    } else {
      var qid = cls.path.length ? cls.path[cls.path.length - 1].next : C.start;
      var q = C.questions[qid];
      var steps = Math.max(4, cls.path.length + 2);
      body =
        '<div class="progress" aria-hidden="true">' + Array.from({ length: steps }, function (_, i) {
          return '<span' + (i <= cls.path.length ? ' class="on"' : '') + '></span>';
        }).join('') + '</div>' +
        '<div class="q"><span class="eyebrow">Question ' + (cls.path.length + 1) + (cls.food ? ' · ' + esc(cls.food) : '') + '</span>' +
        '<h2 style="margin-top:10px">' + esc(q.question) + '</h2>' +
        (q.help ? '<p class="help">' + esc(q.help) + '</p>' : '') + '</div>' +
        '<div class="options">' + q.options.map(function (o, i) {
          return '<button class="option" type="button" data-action="choose" data-q="' + esc(qid) + '" data-index="' + i + '">' +
            '<span>' + esc(o.label) + '</span><span class="arrow" aria-hidden="true">→</span></button>';
        }).join('') + '</div>' +
        (cls.path.length
          ? '<div class="trail"><span class="eyebrow">So far</span>' + cls.path.map(function (p) {
              return '<span><strong>' + esc(p.label) + '</strong></span>';
            }).join('') + '</div>' +
            '<div class="btn-row" style="margin-top:20px"><button class="btn" type="button" data-action="back">Back</button>' +
            '<button class="btn" type="button" data-action="restart">Start over</button></div>'
          : '');
    }

    return {
      title: 'Classify a Food · HotDogsAreSandwiches',
      focus: !cls.started ? '#cls-food' : null,
      html:
        '<div class="page">' +
          '<header class="page-head"><span class="eyebrow">Classify a Food</span>' +
          '<h1>Submit your specimen for examination.</h1>' +
          '<p class="lede">A few questions, one per rank. The Board\'s rules do the rest.</p></header>' +
          '<div class="classifier" aria-live="polite">' + body + '</div>' +
        '</div>'
    };
  }

  function chooseOption(qid, index) {
    var q = rules.classifier.questions[qid];
    var o = q && q.options[index];
    if (!o) return;
    cls.path.push({ q: qid, label: o.label, next: o.next || null });
    if (o.result) cls.result = o.result;
    render();
  }

  function pageSubmit(query) {
    var type = { 'new': 'New food', dispute: 'Dispute a ruling', photo: 'Add a photo' }[query.type] || 'New food';
    var next = location.href.split('#')[0] + '#/thanks';
    function opt(v) { return '<option' + (v === type ? ' selected' : '') + '>' + v + '</option>'; }

    return {
      title: 'Submit a Specimen · HotDogsAreSandwiches',
      html:
        '<div class="page">' +
          '<header class="page-head"><span class="eyebrow">Submit a Specimen</span>' +
          '<h1>Address the Review Board.</h1>' +
          '<p class="lede">New foods, disputed rulings and wild photos all arrive here. Every submission is read. Response times vary from days to geological epochs.</p></header>' +
          '<form class="form" id="submit-form" action="' + esc(FORM_ENDPOINT) + '" method="POST" enctype="multipart/form-data" novalidate>' +
            '<input type="hidden" name="_subject" value="New specimen">' +
            '<input type="hidden" name="_next" value="' + esc(next) + '">' +
            '<input type="hidden" name="_template" value="table">' +
            '<input type="hidden" name="Photo info" value="">' +
            '<div class="honey" aria-hidden="true"><label>Leave this empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>' +

            '<div class="field"><label for="f-type">What are you submitting?</label>' +
            '<select id="f-type" name="Request type">' + opt('New food') + opt('Dispute a ruling') + opt('Add a photo') + '</select></div>' +

            '<div class="field"><label for="f-food">Food</label>' +
            '<input type="text" id="f-food" name="Food" required value="' + esc(query.food || '') + '" placeholder="e.g. Pop-Tart"></div>' +

            '<div class="field"><label for="f-place">Proposed placement</label>' +
            '<input type="text" id="f-place" name="Proposed placement" value="' + esc(query.placement || '') + '" placeholder="e.g. Constructa › Involucra › Sandwichae">' +
            '<span class="hint">Filled in for you if you came from the classifier. Leave blank if you have no idea.</span></div>' +

            '<div class="field"><label for="f-why">Your reasoning</label>' +
            '<textarea id="f-why" name="Reasoning" placeholder="Make your case. The Board appreciates confidence and is unmoved by volume."></textarea></div>' +

            '<div class="field"><label for="f-photo">Photo (optional)</label>' +
            '<input type="file" id="f-photo" name="attachment" accept="image/*">' +
            '<span class="hint">Any phone photo, up to 10 MB. Wild photos only: you must have taken it yourself.</span></div>' +

            '<label class="check"><input type="checkbox" id="f-consent" name="Photo license" value="I took this photo myself and license it to HotDogsAreSandwiches under CC BY 4.0, credited to the name below.">' +
            '<span>I took this photo myself and license it to HotDogsAreSandwiches under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>, credited to the name below. <span class="hint">(Required with a photo.)</span></span></label>' +

            '<div class="field"><label for="f-name">Your name or nickname</label>' +
            '<input type="text" id="f-name" name="Name" placeholder="Used for photo credit and the rulings log" autocomplete="nickname"></div>' +

            '<div class="field"><label for="f-email">Email (optional)</label>' +
            '<input type="email" id="f-email" name="email" placeholder="Only if you want a reply" autocomplete="email"></div>' +

            '<p class="error" id="form-error" role="alert" hidden></p>' +
            '<div class="btn-row" id="form-alt" style="align-items:center" hidden></div>' +
            '<div class="btn-row"><button class="btn btn-accent" type="submit">Send to the Review Board</button></div>' +
            '<p class="license-note">Submissions are emailed to the Review Board through FormSubmit. With a photo attached, FormSubmit may ask you to confirm you are not a robot before returning you here. Accepted photos have location data removed before they are posted.</p>' +
          '</form>' +
        '</div>'
    };
  }

  function validateSubmit(form) {
    var food = form.querySelector('#f-food').value.trim();
    var file = form.querySelector('#f-photo').files[0];
    var consent = form.querySelector('#f-consent').checked;
    var type = form.querySelector('#f-type').value;
    if (!food) return { error: 'Please name the food.', field: '#f-food' };
    if (type === 'Add a photo' && !file) return { error: 'Attach the photo you want to add.', field: '#f-photo' };
    if (file) {
      if (PHOTO_TYPES.indexOf(file.type) < 0 && !PHOTO_EXT.test(file.name || '')) {
        return { error: 'That file does not look like a photo. Try a JPG, PNG or HEIC.', field: '#f-photo' };
      }
      if (file.size > MAX_PHOTO_BYTES) return { error: 'That photo is over 10 MB. Try a smaller version.', field: '#f-photo' };
      if (!consent) return { error: 'Please confirm you took the photo and agree to the CC BY 4.0 license.', field: '#f-consent' };
    }
    var prefix = { 'New food': 'New specimen', 'Dispute a ruling': 'Dispute', 'Add a photo': 'Photo' }[type] || 'New specimen';
    return { ok: true, subject: prefix + ': ' + food };
  }

  // Draws the photo onto a canvas and returns it as a JPEG File, at most
  // 1600 px on the long side. Resolves null if the browser can't do it.
  function preparePhoto(file) {
    return new Promise(function (resolve) {
      try {
        if (!window.URL || !URL.createObjectURL || !document.createElement('canvas').getContext) return resolve(null);
        var url = URL.createObjectURL(file);
        var img = new Image();
        var done = false;
        var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, 15000);
        img.onload = function () {
          try {
            var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
            if (!w || !h) throw new Error('empty image');
            var scale = Math.min(1, max / Math.max(w, h));
            var c = document.createElement('canvas');
            c.width = Math.round(w * scale);
            c.height = Math.round(h * scale);
            var ctx = c.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.drawImage(img, 0, 0, c.width, c.height);
            c.toBlob(function (blob) {
              URL.revokeObjectURL(url);
              if (done) return;
              done = true; clearTimeout(timer);
              if (!blob) return resolve(null);
              var base = (file.name || 'specimen').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 40) || 'specimen';
              resolve(new File([blob], base + '.jpg', { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.85);
          } catch (x) { if (!done) { done = true; clearTimeout(timer); resolve(null); } }
        };
        img.onerror = function () { if (!done) { done = true; clearTimeout(timer); resolve(null); } };
        img.src = url;
      } catch (x) { resolve(null); }
    });
  }

  // ---------- Search ----------

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function singular(s) { return s.replace(/\b(\w{3,}?)(es|s)\b/g, function (m, a, b) { return b === 'es' && /(ch|sh|x|z|ss)$/.test(a) ? a : (b === 'es' ? a + 'e' : a); }); }

  function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      var rowMin = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  function searchNodes(query) {
    var q = singular(norm(query));
    if (!q) return [];
    var qWords = q.split(' ');
    var out = [];
    nodes.concat(assocs).forEach(function (n) {
      if (n.rank === 'domain') return;
      var names = [n.common, n.scientific].concat(n.aliases || []).map(function (s) { return singular(norm(s)); });
      var best = 0;
      names.forEach(function (name, idx) {
        var bonus = idx < 2 ? 2 : 0; // a real name beats a nickname on ties
        var s = 0;
        if (name === q) s = 100;
        else if (name.indexOf(q) === 0) s = 70;
        else if ((' ' + name + ' ').indexOf(' ' + q + ' ') >= 0) s = 60;
        else if (q.length >= 3 && name.indexOf(q) >= 0) s = 45;
        else if (qWords.length > 1 && qWords.every(function (w) { return (' ' + name + ' ').indexOf(' ' + w) >= 0; })) s = 40;
        else if (q.length >= 4 && editDistance(q, name, q.length >= 7 ? 2 : 1) <= (q.length >= 7 ? 2 : 1)) s = 35;
        else if (q.length >= 4 && name.split(' ').some(function (w) { return w.length >= 4 && editDistance(q, w, 1) <= 1; })) s = 25;
        if (s) best = Math.max(best, s + bonus);
      });
      if (best) {
        // Prefer foods (species, varieties) over groups at equal scores
        var depth = n.isAssociation ? RANKS.length : RANKS.indexOf(n.rank);
        out.push({ node: n, score: best + depth * 0.1 });
      }
    });
    out.sort(function (a, b) { return b.score - a.score || a.node.common.localeCompare(b.node.common); });
    return out.slice(0, 25).map(function (x) { return x.node; });
  }

  function pageSearch(query) {
    var q = (query.q || '').trim();
    var results = q ? searchNodes(q) : [];
    var body;
    if (!q) {
      body = '<p class="lede">Type a food in the search box above: a dish, a drink, or a nickname for one.</p>';
    } else if (!results.length) {
      logSearchMiss(q);
      body =
        '<div class="empty" style="padding:0;margin:0"><span class="eyebrow">No specimen found</span>' +
        '<h2 style="font-size:40px;line-height:1.1">Nothing in the collection matches “' + esc(q) + '”.</h2>' +
        '<p class="lede">Either it has not been classified yet, or it does not exist. The Board has been notified of the gap.</p>' +
        '<div class="btn-row"><a class="btn btn-accent" href="#/classify?' + qs({ food: q }) + '">Classify it yourself</a>' +
        '<a class="btn" href="#/submit?' + qs({ type: 'new', food: q }) + '">Ask the Board to add it</a></div></div>';
    } else {
      logSearchHit(q, results.length);
      body =
        '<p class="lede" style="margin-bottom:24px">' + results.length + (results.length === 1 ? ' entry matches' : ' entries match') + ' “' + esc(q) + '”.</p>' +
        '<ul class="results">' + results.map(function (n) {
          if (n.isAssociation) {
            return '<li><a href="#/association/' + esc(n.id) + '">' +
              '<span><span class="c">' + esc(n.common) + '</span> <span class="s">' + esc(n.scientific) + '</span></span>' +
              '<span class="badge">Association</span><span class="path">Found together: ' +
              esc(n.members.filter(function (m) { return byId[m.id]; }).map(function (m) { return byId[m.id].common; }).join(' + ')) + '</span></a></li>';
          }
          var path = lineage(n.id).filter(function (x) { return x.rank !== 'domain' && x.id !== n.id; })
            .map(function (x) { return x.scientific; }).join(' › ');
          return '<li><a href="#/specimen/' + esc(n.id) + '">' +
            '<span><span class="c">' + esc(n.common) + '</span> <span class="s">' + esc(n.scientific) + '</span></span>' +
            badge(n) +
            '<span class="path">' + esc(cap(n.rank)) + (path ? ' in ' + esc(path) : '') + '</span></a></li>';
        }).join('') + '</ul>';
    }
    return {
      title: (q ? '“' + q + '” · ' : '') + 'Search · HotDogsAreSandwiches',
      html:
        '<div class="page">' +
          '<header class="page-head"><span class="eyebrow">Search the collection</span>' +
          '<h1>' + (q ? 'Results' : 'Find a food') + '</h1></header>' +
          body +
        '</div>'
    };
  }

  // ---------- Analytics (GoatCounter; off until GOATCOUNTER_CODE is set) ----------

  var gcQueue = [];
  var loggedSearches = {};

  function gcCount(vars) {
    if (!GOATCOUNTER_CODE) return;
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      try { window.goatcounter.count(vars); } catch (e) { /* never break the page over analytics */ }
    } else {
      gcQueue.push(vars);
    }
  }

  function startAnalytics() {
    if (!GOATCOUNTER_CODE || !/^[a-z0-9-]+$/.test(GOATCOUNTER_CODE)) return;
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.no_onload = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count');
    s.onload = function () { var q = gcQueue; gcQueue = []; q.forEach(gcCount); };
    document.head.appendChild(s);

    // Public visitor count on the footer ticket (needs "Allow adding visitor counts" in GoatCounter settings)
    fetch('https://' + GOATCOUNTER_CODE + '.goatcounter.com/counter/TOTAL.json')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        var n = parseInt(String(j && j.count || '').replace(/[^0-9]/g, ''), 10);
        if (!n) throw new Error('no count');
        var digits = String(n); while (digits.length < 6) digits = '0' + digits;
        document.getElementById('visit-count').textContent = digits;
        document.getElementById('ticket').setAttribute('aria-label', 'Admission ticket: ' + n + ' visits logged since 3 October 2026');
      })
      .catch(function () {
        var note = document.getElementById('visit-note');
        if (note) note.textContent = 'The ledger is closed for inventory. Admission remains free.';
      });
  }

  // Footer social links. Add an entry and it appears; leave the list empty and the footer says so.
  // icon: instagram, tiktok, threads, bluesky, youtube, x, mastodon, reddit, email, or anything else for a generic link.
  // name is read aloud by screen readers; label is what shows (keep it short: the icon names the platform).
  var SOCIAL_LINKS = [
    // { icon: 'instagram', name: 'Instagram', label: '@hotdogsaresandwiches', url: 'https://www.instagram.com/hotdogsaresandwiches/' },
    // { icon: 'email', name: 'Email', label: 'Write to the Board', url: 'mailto:(the Board address)' },
  ];
  var SOCIAL_ICONS = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.6 2.2 4.2 5 4.5"/>',
    threads: '<path d="M16.5 11c-.3-3-2-4.5-4.5-4.5-3 0-5 2.3-5 5.5s2 5.5 5 5.5c2.6 0 4.5-1.5 4.5-3.6 0-2-1.8-3-4-3-1.7 0-2.8.8-2.8 2s1 1.9 2.3 1.9"/>',
    bluesky: '<path d="M12 11c-1.8-3.4-5-6-6.8-6C3.6 5 4 8 4.5 10c.6 2.2 2.8 3 5 2.6-3.6 1-3.4 3.6-1.4 5 2 1.4 3.2-1.4 3.9-3.6.7 2.2 1.9 5 3.9 3.6s2.2-4-1.4-5c2.2.4 4.4-.4 5-2.6.5-2 .9-5-.7-5-1.8 0-5 2.6-6.8 6z"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    mastodon: '<path d="M4 4h16v12H8l-4 4z"/>',
    reddit: '<circle cx="12" cy="14" r="6.5"/><circle cx="18.5" cy="5.5" r="1.5"/><path d="M12 7.5l1.2-4 5.3 2"/>',
    email: '<path d="M3 6h18v12H3z"/><path d="M3 6l9 7 9-7"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
  };
  function renderSocialLinks() {
    var box = document.getElementById('social-links'), aside = document.getElementById('social-aside');
    if (!box) return;
    box.innerHTML = SOCIAL_LINKS.map(function (s) {
      var icon = SOCIAL_ICONS[s.icon] || SOCIAL_ICONS.link;
      var ext = /^https?:/.test(s.url) ? ' rel="me noopener" target="_blank"' : '';
      var aria = s.name ? ' aria-label="' + esc(s.name + ': ' + s.label) + '"' : '';
      return '<a href="' + esc(s.url) + '"' + ext + aria + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icon + '</svg><span>' + esc(s.label) + '</span></a>';
    }).join('');
    if (aside && SOCIAL_LINKS.length) aside.textContent = 'Rulings posted here, under protest.';
  }

  function trackPage(r) {
    var path = '/' + (r.route === 'home' ? '' : r.route) + (r.id ? '/' + r.id : '');
    gcCount({ path: path, title: document.title });
  }

  function logSearchMiss(q) {
    var key = 'miss:' + norm(q);
    if (loggedSearches[key]) return;
    loggedSearches[key] = true;
    gcCount({ path: 'search-not-found/' + norm(q).slice(0, 60).replace(/ /g, '-'), title: 'Not found: ' + q.slice(0, 60), event: true });
  }

  function logSearchHit(q, n) {
    var key = 'hit:' + norm(q);
    if (loggedSearches[key]) return;
    loggedSearches[key] = true;
    gcCount({ path: 'search/' + norm(q).slice(0, 60).replace(/ /g, '-'), title: 'Search: ' + q.slice(0, 60) + ' (' + n + ')', event: true });
  }

  function pageThanks() {
    return {
      title: 'Received · HotDogsAreSandwiches',
      html:
        '<div class="empty"><span class="eyebrow">Submission received</span>' +
        '<h1>The Board will deliberate.</h1>' +
        '<p class="lede">Your specimen has been logged. If it is accepted, it will appear in the tree with your name on it.</p>' +
        '<div class="btn-row"><a class="btn btn-accent" href="#/tree">Back to the tree</a><a class="btn" href="#/submit">Submit another</a></div></div>'
    };
  }

  function pageMissing() {
    return {
      title: 'Specimen escaped · HotDogsAreSandwiches',
      html:
        '<div class="empty"><span class="eyebrow">Error 404</span>' +
        '<h1>Specimen escaped.</h1>' +
        '<p class="lede">Whatever was here has left the collection. It may never have existed.</p>' +
        '<div class="btn-row"><a class="btn btn-accent" href="#/tree">Search the tree</a><a class="btn" href="#/">Home</a></div></div>'
    };
  }

  // ---------- Router ----------

  var main = document.getElementById('main');
  var lastRoute = null;
  var lastEntryText = '';

  function render() {
    var r = parseHash();
    var page;
    if (r.route !== 'classify' && lastRoute === 'classify') resetClassifier();

    switch (r.route) {
      case 'home': page = pageHome(); break;
      case 'about': page = pageAbout(); break;
      case 'rules': page = pageRules(); break;
      case 'tree': page = pageTree(r.id); break;
      case 'specimen': page = pageSpecimen(r.id); break;
      case 'association': page = pageAssociation(r.id); break;
      case 'associations': page = pageAssociations(); break;
      case 'classify':
        if (!cls.started && r.query.food && !cls.food) cls.food = r.query.food;
        page = pageClassify();
        break;
      case 'submit': page = pageSubmit(r.query); break;
      case 'thanks': page = pageThanks(); break;
      case 'search': page = pageSearch(r.query); break;
      default: page = pageMissing();
    }

    main.innerHTML = page.html;
    document.title = page.title;
    if (page.after) page.after();
    var box = document.getElementById('q');
    if (box && document.activeElement !== box) box.value = r.route === 'search' ? (r.query.q || '') : '';
    trackPage(r);

    var navRoute = (r.route === 'specimen' || r.route === 'association' || r.route === 'associations') ? 'tree' : r.route;
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      if (a.getAttribute('data-route') === navRoute) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (r.route !== lastRoute || r.route !== 'classify') window.scrollTo(0, 0);
    if (page.focus) {
      var f = main.querySelector(page.focus);
      if (f && r.route !== lastRoute) f.focus({ preventScroll: true });
    } else if (r.route !== lastRoute) {
      main.focus({ preventScroll: true });
    }
    lastRoute = r.route;
  }

  main.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (!b) return;
    var a = b.getAttribute('data-action');
    if (a === 'start') {
      var inp = main.querySelector('#cls-food');
      cls.food = inp ? inp.value.trim() : '';
      cls.started = true;
      render();
    } else if (a === 'choose') {
      chooseOption(b.getAttribute('data-q'), Number(b.getAttribute('data-index')));
    } else if (a === 'back') {
      cls.result = null;
      if (cls.path.length) cls.path.pop(); else cls.started = false;
      render();
    } else if (a === 'restart') {
      resetClassifier();
      render();
    } else if (a === 'copy-entry') {
      var done = function () { b.textContent = 'Copied'; };
      try {
        navigator.clipboard.writeText(lastEntryText).then(done, function () { window.prompt('Copy your entry:', lastEntryText); });
      } catch (x) { window.prompt('Copy your entry:', lastEntryText); }
    }
  });

  main.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'cls-food') {
      e.preventDefault();
      cls.food = e.target.value.trim();
      cls.started = true;
      render();
    }
  });

  main.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.id !== 'submit-form') return;
    var res = validateSubmit(form);
    var err = form.querySelector('#form-error');
    if (!res.ok) {
      e.preventDefault();
      err.textContent = res.error;
      err.hidden = false;
      var f = form.querySelector(res.field);
      if (f) f.focus();
      return;
    }
    err.hidden = true;
    form.querySelector('input[name="_subject"]').value = res.subject;

    var btn = form.querySelector('button[type="submit"]');
    var photo = form.querySelector('#f-photo');
    var hasPhoto = !!(photo.files && photo.files.length);

    // With a photo: FormSubmit's background (ajax) endpoint drops attachments,
    // so the page is submitted normally. First the photo is converted to a
    // ~1600 px JPEG: phones hand over HEIC or huge files that FormSubmit drops,
    // and re-drawing it also strips location data.
    if (hasPhoto) {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Preparing photo…';
      var original = photo.files[0];
      preparePhoto(original).then(function (jpeg) {
        var info = 'Original: ' + (original.name || '?') + ', ' + (original.type || 'unknown type') + ', ' +
          Math.round(original.size / 1024) + ' KB';
        if (jpeg) {
          try {
            var dt = new DataTransfer();
            dt.items.add(jpeg);
            photo.files = dt.files;
            info += ' → sent as JPEG, ' + Math.round(jpeg.size / 1024) + ' KB';
          } catch (x) { info += ' → sent unchanged (could not swap file)'; }
        } else {
          info += ' → sent unchanged (could not convert)';
        }
        form.querySelector('input[name="Photo info"]').value = info;
        btn.textContent = 'Sending…';
        HTMLFormElement.prototype.submit.call(form);
      });
      return;
    }
    if (typeof window.fetch !== 'function' || typeof window.FormData !== 'function') return;

    // Without a photo: send in the background so we can show what happened.
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Sending…';
    var data = new FormData(form);
    data.delete('_next');
    data.delete('attachment');
    data.delete('Photo info');
    if (!form.querySelector('#f-consent').checked) data.delete('Photo license');
    // iPhone browsers reject some multipart requests sent in the background,
    // so send the plainest format there is: URL-encoded text.
    var body = new URLSearchParams();
    data.forEach(function (v, k) { body.append(k, v); });

    // If FormSubmit can't be reached (some networks and ad blockers block it),
    // let the visitor copy their entry so nothing typed is lost.
    function entryText() {
      var lines = [res.subject];
      data.forEach(function (v, k) {
        if (k.charAt(0) === '_' || typeof v !== 'string' || !v) return;
        lines.push(k + ': ' + v);
      });
      return lines.join('\n');
    }

    function fail(msg) {
      btn.disabled = false;
      btn.textContent = 'Send to the Review Board';
      err.textContent = msg;
      err.hidden = false;
      if (err.scrollIntoView) err.scrollIntoView({ block: 'center' });
    }

    window.fetch(FORM_AJAX_ENDPOINT, { method: 'POST', body: body, headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json().catch(function () { return { success: r.ok ? 'true' : 'false', message: 'HTTP ' + r.status }; });
      })
      .then(function (j) {
        if (String(j.success) === 'true') { location.hash = '#/thanks'; return; }
        var m = String(j.message || '');
        if (/activat/i.test(m)) {
          fail('The Review Board\'s mailbox is still being set up, so this was not delivered. Please try again later.');
        } else {
          fail('The mail service turned this away' + (m ? ': ' + m : '.') + ' Please try again.');
        }
      })
      .catch(function () {
        fail('Your network could not reach the mail service. Some ad blockers, VPNs and Wi-Fi filters block it. ' +
          'Try turning those off or switching to cellular, then send again.');
        lastEntryText = entryText();
        var alt = form.querySelector('#form-alt');
        alt.innerHTML = '<button class="btn" type="button" data-action="copy-entry">Copy my entry</button>' +
          '<span class="hint">Keeps a copy of what you wrote, just in case.</span>';
        alt.hidden = false;
      });
  });

  window.addEventListener('hashchange', render);

  var searchForm = document.getElementById('site-search');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('q');
      var q = input.value.trim();
      if (!q) { input.focus(); return; }
      input.blur(); // closes the phone keyboard
      var target = '#/search?' + qs({ q: q });
      if (location.hash === target) render(); else location.hash = target;
    });
  }

  // ---------- Start ----------

  // Data files carry the same version tag as this script, so new rulings show up immediately
  var ASSET_V = (function () {
    var s = document.currentScript || document.querySelector('script[src*="js/app.js"]');
    var m = s && s.src && s.src.match(/[?&]v=([\w.-]+)/);
    return m ? '?v=' + m[1] : '';
  })();

  function boot() {
    Promise.all([
      fetch('data/taxonomy.json' + ASSET_V).then(function (r) { if (!r.ok) throw new Error('taxonomy ' + r.status); return r.json(); }),
      fetch('data/rules.json' + ASSET_V).then(function (r) { if (!r.ok) throw new Error('rules ' + r.status); return r.json(); })
    ]).then(function (res) {
      indexData(res[0], res[1]);
      renderSocialLinks();
      startAnalytics();
      render();
    }).catch(function (err) {
      main.innerHTML = '<div class="empty"><span class="eyebrow">Error</span><h1>The collection is closed.</h1>' +
        '<p class="lede">The specimen records could not be loaded. Try refreshing the page.</p>' +
        '<p class="notice">' + esc(err && err.message) + '</p></div>';
    });
  }

  // Exposed for automated checks only
  window.__HDS = {
    indexData: indexData, render: render, validateSubmit: validateSubmit, lineage: lineage,
    byId: function () { return byId; }, searchNodes: searchNodes,
    setAnalytics: function (code) { GOATCOUNTER_CODE = code; }
  };

  boot();
})();

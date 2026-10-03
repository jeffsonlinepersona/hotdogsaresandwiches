/* HotDogsAreSandwiches · Taxonomia Ediblis
   All content comes from data/taxonomy.json and data/rules.json.
   This file only draws it. To add a food, edit the data, not this file. */

(function () {
  'use strict';

  // ---------- Settings ----------

  // Where the Submit form sends entries. FormSubmit emails them to this address.
  // After the first confirmation email, FormSubmit gives a random code: replace the
  // email part with that code to keep the address out of the public source.
  var FORM_ADDRESS = 'jeffsonlinepersona@gmail.com';
  var FORM_ENDPOINT = 'https://formsubmit.co/' + FORM_ADDRESS;        // fallback if scripts are off
  var FORM_AJAX_ENDPOINT = 'https://formsubmit.co/ajax/' + FORM_ADDRESS; // used by the page
  var MAX_PHOTO_BYTES = 10 * 1024 * 1024; // FormSubmit's limit per submission
  // Phones often hand over HEIC (iPhone) or WebP photos; accept those too.
  var PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
  var PHOTO_EXT = /\.(jpe?g|png|heic|heif|webp)$/i;

  var RANKS = ['domain', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'variety'];
  var PLURAL = {
    kingdom: 'Kingdoms', phylum: 'Phyla', 'class': 'Classes', order: 'Orders',
    family: 'Families', genus: 'Genera', species: 'Species', variety: 'Varieties'
  };
  var STANDING = [
    { id: 'canis-farcitus', food: 'Hot dog', why: 'Bun on three sides. Case closed.' },
    { id: 'tacoforma-classicus', food: 'Taco', why: 'Same shape as the hot dog. They stand or fall together.' },
    { id: 'open-faced-sandwich', food: 'Open-faced sandwich', why: 'One slice is a topping arrangement.' },
    { id: 'cereal', food: 'Cereal', why: 'Never cooked together. Not our problem.' }
  ];

  // ---------- Data ----------

  var nodes = [], byId = {}, kids = {}, rules = null, root = null;

  function indexData(tax, rul) {
    nodes = tax.nodes;
    rules = rul;
    byId = {};
    kids = {};
    nodes.forEach(function (n) { byId[n.id] = n; kids[n.id] = []; });
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
    var v = verdictOf(n);
    if (!v) return '';
    var negative = /^not /i.test(v);
    return '<span class="badge' + (negative ? ' badge-no' : '') + '">Ruled: ' + esc(v.toLowerCase()) + '</span>';
  }

  function catalogNo(n) {
    var i = nodes.indexOf(n);
    return 'TE-' + String(i + 1).padStart(4, '0');
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
            '<p>The taxonomy, rules, descriptions and photos are licensed <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>. Share and adapt them freely, with credit.</p>' +
          '</div>' +
        '</div>'
    };
  }

  function pageRules() {
    var list = rules.rules.map(function (r, i) {
      return '<article class="rule" id="rule-' + esc(r.id) + '">' +
        '<div class="rule-num">' + (i + 1) + '</div>' +
        '<div><h2>' + esc(r.title) + '</h2><p class="summary">' + esc(r.summary) + '</p>' +
        '<ul>' + r.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>' +
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
        var el = document.querySelector('.columns');
        if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth;
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

  function pageSpecimen(id) {
    var n = byId[id];
    if (!n) return pageMissing();
    var children = kids[n.id];
    var fig = n.photo
      ? '<figure class="specimen-figure has-photo"><img src="' + esc(n.photo) + '" alt="' + esc(n.common) + ', photographed in the wild">' +
        '<figcaption>Photographed in the wild by ' + esc(n.photo_credit || 'an anonymous field researcher') + ' · CC BY 4.0</figcaption></figure>'
      : '<figure class="specimen-figure">' + sketch(n) + '<figcaption>Not yet photographed in the wild</figcaption></figure>';

    var meta = '<dl class="kv" style="grid-template-columns:120px minmax(0,1fr)">' +
      '<dt>Catalog</dt><dd>' + esc(catalogNo(n)) + '</dd>' +
      (n.trait ? '<dt>Defining trait</dt><dd>' + esc(n.trait) + '</dd>' : '') +
      '<dt>Collected by</dt><dd>' + esc(n.photo ? (n.photo_credit || 'Anonymous') : 'Awaiting a wild specimen') + '</dd>' +
      '<dt>Ruled</dt><dd>' + esc(fmtDate(n.ruled_on)) + '</dd></dl>';

    var members = children.length
      ? '<section class="members"><h2>Members</h2><ul>' + children.map(function (c) {
          return '<li><a href="#/specimen/' + esc(c.id) + '"><span class="c">' + esc(c.common) + '</span><span class="s">' + esc(c.scientific) + '</span></a></li>';
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
              '<p class="short">' + esc(n.short) + '</p>' +
              (n.long ? '<p class="long">' + esc(n.long) + '</p>' : '') +
              meta + members +
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
      case 'classify': page = pageClassify(); break;
      case 'submit': page = pageSubmit(r.query); break;
      case 'thanks': page = pageThanks(); break;
      default: page = pageMissing();
    }

    main.innerHTML = page.html;
    document.title = page.title;
    if (page.after) page.after();

    var navRoute = r.route === 'specimen' ? 'tree' : r.route;
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
    // so let the browser submit the page normally. FormSubmit may show a
    // "not a robot" check, then sends the visitor back to the thanks page.
    if (hasPhoto || typeof window.fetch !== 'function' || typeof window.FormData !== 'function') {
      btn.textContent = 'Sending…';
      return; // no preventDefault: the normal form post goes ahead
    }

    // Without a photo: send in the background so we can show what happened.
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Sending…';
    var data = new FormData(form);
    data.delete('_next');
    data.delete('attachment');
    if (!form.querySelector('#f-consent').checked) data.delete('Photo license');
    // iPhone browsers reject some multipart requests sent in the background,
    // so send the plainest format there is: URL-encoded text.
    var body = new URLSearchParams();
    data.forEach(function (v, k) { body.append(k, v); });

    // If FormSubmit can't be reached (some networks and ad blockers block it),
    // offer a pre-filled email instead so the entry still reaches the Board.
    function mailtoLink() {
      var lines = [];
      data.forEach(function (v, k) {
        if (k.charAt(0) === '_' || typeof v !== 'string' || !v) return;
        lines.push(k + ': ' + v);
      });
      return 'mailto:' + FORM_ADDRESS + '?subject=' + encodeURIComponent(res.subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
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
        fail('Your network could not reach the mail service. Some ad blockers, VPNs and Wi-Fi filters block it.');
        var alt = form.querySelector('#form-alt');
        alt.innerHTML = '<a class="btn btn-ink" href="' + esc(mailtoLink()) + '">Email it instead</a>' +
          '<span class="hint">Opens your email app with everything filled in.</span>';
        alt.hidden = false;
      });
  });

  window.addEventListener('hashchange', render);

  // ---------- Start ----------

  function boot() {
    Promise.all([
      fetch('data/taxonomy.json').then(function (r) { if (!r.ok) throw new Error('taxonomy ' + r.status); return r.json(); }),
      fetch('data/rules.json').then(function (r) { if (!r.ok) throw new Error('rules ' + r.status); return r.json(); })
    ]).then(function (res) {
      indexData(res[0], res[1]);
      render();
    }).catch(function (err) {
      main.innerHTML = '<div class="empty"><span class="eyebrow">Error</span><h1>The collection is closed.</h1>' +
        '<p class="lede">The specimen records could not be loaded. Try refreshing the page.</p>' +
        '<p class="notice">' + esc(err && err.message) + '</p></div>';
    });
  }

  // Exposed for automated checks only
  window.__HDS = { indexData: indexData, render: render, validateSubmit: validateSubmit, lineage: lineage, byId: function () { return byId; } };

  boot();
})();

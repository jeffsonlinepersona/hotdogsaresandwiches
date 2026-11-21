/* Automated checks for HotDogsAreSandwiches.
   Run: NODE_PATH=<folder with jsdom installed> node tests/check.cjs
   1. Data integrity  2. Classifier wiring  3. Foundational rulings  4. Every page renders */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const tax = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/taxonomy.json'), 'utf8'));
const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rules.json'), 'utf8'));

let failures = 0, passes = 0;
function ok(cond, msg) { if (cond) passes++; else { failures++; console.log('  FAIL ' + msg); } }

const RANKS = ['domain', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'variety'];
const VERDICTS = ['Sandwich', 'Not a sandwich', 'Soup', 'Not soup'];
const byId = {};

console.log('1. Data integrity');
tax.nodes.forEach(n => { ok(!byId[n.id], 'duplicate id ' + n.id); byId[n.id] = n; });
const roots = tax.nodes.filter(n => !n.parent);
ok(roots.length === 1, 'exactly one root, found ' + roots.length);
tax.nodes.forEach(n => {
  ok(/^[a-z0-9-]+$/.test(n.id), 'id format ' + n.id);
  ok(RANKS.includes(n.rank), 'rank ' + n.rank + ' on ' + n.id);
  ['scientific', 'common', 'short', 'status', 'ruled_on'].forEach(f => ok(n[f], f + ' missing on ' + n.id));
  ok(/^\d{4}-\d{2}-\d{2}$/.test(n.ruled_on || ''), 'date format on ' + n.id);
  if (n.verdict) ok(VERDICTS.includes(n.verdict), 'verdict "' + n.verdict + '" on ' + n.id);
  if (n.parent) {
    const p = byId[n.parent];
    ok(p, 'parent ' + n.parent + ' exists for ' + n.id);
    if (p) ok(RANKS.indexOf(n.rank) > RANKS.indexOf(p.rank), 'rank order ' + p.id + ' > ' + n.id);
  }
  if (n.photo) ok(fs.existsSync(path.join(ROOT, n.photo)), 'photo file ' + n.photo);
  (n.images || []).forEach((im, i) => {
    ok(fs.existsSync(path.join(ROOT, im.src)), 'image file ' + im.src);
    ok(im.kind === 'plate' || im.kind === 'photo', 'image kind is plate or photo: ' + im.src);
    ok(im.kind !== 'plate' || i === 0, 'a plate is only ever the primary image: ' + im.src);
    ok(!!im.credit, 'image has a credit: ' + im.src);
  });
  if (n.aliases) ok(Array.isArray(n.aliases) && n.aliases.every(a => typeof a === 'string' && a.trim()), 'aliases are a list of names on ' + n.id);
});
function ancestors(id) {
  const out = []; let n = byId[id], g = 0;
  while (n && n.parent && g++ < 50) { out.push(n.parent); n = byId[n.parent]; }
  ok(g < 50, 'no cycle at ' + id);
  return out;
}
tax.nodes.forEach(n => ancestors(n.id));

console.log('2. Classifier wiring');
const Q = rules.classifier.questions;
ok(Q[rules.classifier.start], 'start question exists');
const reached = new Set();
(function walk(qid) {
  if (reached.has(qid)) return; reached.add(qid);
  const q = Q[qid]; ok(q, 'question ' + qid + ' exists'); if (!q) return;
  q.options.forEach(o => {
    ok(!!o.next !== !!o.result, 'option has exactly one of next/result: ' + o.label);
    if (o.next) walk(o.next);
    if (o.result) ok(byId[o.result], 'result node ' + o.result + ' exists');
  });
})(rules.classifier.start);
Object.keys(Q).forEach(k => ok(reached.has(k), 'question ' + k + ' is reachable'));

console.log('3. Foundational rulings');
const under = (id, anc) => ancestors(id).includes(anc);
ok(under('canis-farcitus-costcoensis', 'sandwichae'), 'Costco hot dog is a sandwich');
ok(under('canis-farcitus', 'sandwichae'), 'hot dog is a sandwich');
ok(under('tacoforma-classicus', 'sandwichae'), 'taco is a sandwich');
ok(!under('open-faced-sandwich', 'sandwichae'), 'open-faced sandwich is not a sandwich');
ok(under('cereal', 'cruda') && !under('cereal', 'decocta'), 'cereal is not soup');
ok(under('california-roll', 'sushiae') && !under('california-roll', 'sandwichae'), 'California roll is sushi, not a sandwich (rice is not bread)');
ok(under('bao', 'dumplingae') && !under('bao', 'sandwichae'), 'bao is a dumpling (steamed, not baked)');
ok(under('chicken-pot-pie', 'pieae') && !under('chicken-pot-pie', 'sandwichae'), 'pot pie is a pie, not a sandwich');
ok(under('tuna-noodle-casserole', 'mixta') && under('lasagna', 'stratifica'), 'casseroles sort by structure');
ok(under('burrito', 'sandwichae') && under('tacoforma-classicus-durus', 'sandwichae'), 'tortillas and fried shells still count as bread');
ok(under('salmon-nigiri', 'apertae'), 'nigiri is open-faced');
ok(under('tuna-sashimi', 'naturalia'), 'sashimi is one food');
ok(under('cup-noodles', 'decocta'), 'cup noodles are soup');
ok(under('shop-ramen', 'decocta') && byId['shop-ramen'].status === 'ruled', 'restaurant ramen is soup (broth clause)');
ok(under('pho', 'decocta'), 'pho is soup (broth clause)');
ok(under('gazpacho', 'cruda'), 'gazpacho is still not soup');
ok(under('cerevisia-vulgaris-barbata', 'fermentata'), 'beer is a fermented drink');
ok(under('lemonade', 'soluta') && !under('lemonade', 'expressa'), 'lemonade is not juice');
ok(under('oat-milk', 'pseudolactae') && !under('oat-milk', 'nativa'), 'oat milk is not milk');
ok(under('cafeus-lacteus', 'miscellae') && !under('cafeus-lacteus', 'infusa'), 'a latte is not coffee');
ok(byId['canis-farcitus-costcoensis'].short.includes('$1.50') && (byId['canis-farcitus-costcoensis'].sources || []).length >= 1, 'the Costco dog card states its price and cites evidence');
ok(['canis-farcitus','hamburger','meatball-sub','lobster-roll','cold-cut-combo','tacoforma-classicus','burrito','corn-dog'].every(id => under(id, 'integriformes')), 'whole-bread sandwiches share Integriformes');
ok(under('sandwicus-classicus', 'partiformes') && !under('sandwicus-classicus', 'integriformes'), 'the classic sandwich is part of a loaf');
ok(under('canis-farcitus', 'panidae') && under('meatball-sub', 'panidae') && under('hamburger', 'panidae'), 'hot dog, meatball sub and burger share the buns-and-rolls family');
ok(under('canis-farcitus', 'canis') && under('hamburger', 'discus') && under('cold-cut-combo', 'lamina'), 'filling shape decides the sandwich genus');
ok(!['bifaciformes','trifaciformes','totiformes','frankfurtidae','fissipanidae'].some(id => byId[id]), 'side-counting orders are retired');
ok(['thin-crust-pizza','new-york-pizza','north-american-pizza','tavern-style-pizza'].every(id => under(id, 'pizzidae')), 'hand-shaped pizzas share a family');
ok(['detroit-pizza','deep-dish-pizza','sicilian-pizza','grandma-pizza','roman-al-taglio-pizza'].every(id => under(id, 'sartaginidae')), 'pan-shaped pizzas share a family');
ok(under('deep-dish-pizza', 'apertae') && !under('deep-dish-pizza', 'sandwichae'), 'deep dish is considered and ruled a pizza');
ok(['calzone','stromboli','stuffed-pizza'].every(id => under(id, 'integriformes') && under(id, 'sandwichae')), 'pizza dough sealed by the baker is a sandwich');
ok(under('french-bread-pizza', 'apertae-partiformes') && under('open-faced-sandwich', 'apertae-partiformes'), 'part-of-a-loaf bases stand with the open-faced sandwich');
ok(under('hawaiian-pizza', 'north-american-pizza') && byId['hawaiian-pizza'].rank === 'variety' && /Pineapple belongs on pizza/.test(byId['hawaiian-pizza'].short), 'pineapple belongs on pizza');
ok(byId['pepperoni-pineapple-pizza'].rank === 'variety', 'pepperoni and pineapple is a variety');
ok(!/becomes a sandwich/.test(byId['thin-crust-pizza'].short), 'folding a slice does not make it a sandwich');
tax.nodes.filter(n => n.status === 'species inquirenda').forEach(n => ok(n.rank === 'species' && /Species inquirenda/.test(n.short), 'stub is a species and says so: ' + n.id));
ok(tax.nodes.every(n => ['ruled', 'pending review', 'species inquirenda'].includes(n.status)), 'every status is known');
ok(/by-nc\/4\.0/.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')) && /Taxonomic Review Board \(jeffsonlinepersona\)/.test(fs.readFileSync(path.join(ROOT, 'LICENSE.md'), 'utf8')), 'license is CC BY-NC with the Board credit');
ok(under('americano', 'miscellae') && !under('americano', 'infusa') && under('americano', 'aquiferae'), 'an americano is a drink of drinks');
ok(byId['americano-long-black'].parent === 'americano' && byId['americano-iced'].parent === 'americano', 'long black and iced americano are varieties');
ok(under('crema-ictus-longus', 'infusa'), 'a lungo is still an infusion: water through the grounds, not into the shot');
ok(under('orange-juice', 'expressa'), 'restoration rule: orange juice stays juice');
ok(rules.rules.find(r => r.id === 'drinks').points.some(p => /Restoration rule/.test(p)), 'the restoration rule is published');
ok(under('hot-chocolate', 'soluta') && under('hot-chocolate', 'liquida') && !under('hot-chocolate', 'infusa'), 'hot chocolate is dissolved, not steeped');
ok(under('chai', 'infusa') && under('chai', 'camellia'), 'chai is steeped tea, its own species');
ok(under('bubble-tea', 'natantiformes') && under('bubble-tea', 'constructa') && !under('bubble-tea', 'liquida'), 'bubble tea is chewed, so it floats with cereal');
ok(rules.rules.some(r => r.id === 'assembly'), 'the assembly rule is published');
ok(under('espresso', 'crema') && under('espresso', 'infusa') && !under('espresso', 'expressa') && !under('espresso', 'cafeus'), 'espresso is its own genus in Infusa, not Expressa');
ok(['crema-ictus-duplex','crema-ictus-contractus','crema-ictus-longus'].every(id => byId[id] && byId[id].parent === 'espresso'), 'doppio, ristretto and lungo are espresso varieties');
ok(under('milkshake', 'cruda') && under('smoothie', 'cruda') && !under('milkshake', 'liquida'), 'milkshakes and smoothies are food, not drinks');
ok(under('gasosa-aquatica', 'aquae-spumiformes') && under('aqua-pura', 'aquae-tranquilliformes'), 'still vs sparkling differ at order');
ok(byId['cola-vulgaris-fontana'] && byId['cola-vulgaris-fontana'].rank === 'variety', 'fountain soda is a variety');

ok(['lemon','salt','honey','strawberry-jam','peanut-butter','pickle','raisin','steak','tuna-sashimi'].every(id => under(id, 'naturalia')), 'grown and nature-made foods are Naturalia (lemon, salt, honey, jam, peanut butter)');
ok(['ketchup','msg','yellow-mustard','dijon-mustard','pickle-relish','soy-sauce','mayonnaise','caesar-dressing','grape-jelly'].every(id => under(id, 'condimenta')), 'made things applied to food are Condimenta');
ok(under('pickle-relish', 'contrita') && under('pickle', 'naturalia'), 'pickle relish is made; the pickle is not');
ok(under('grape-jelly', 'reducta') && under('strawberry-jam', 'naturalia'), 'jelly is a condiment, jam is a single food');
ok(under('msg', 'crystallina') && !under('msg', 'zymota'), 'the last transforming step decides: MSG is crystals');
ok(under('peanut-butter', 'arachis') && under('steak', 'bos') && byId['lemon'].scientific === 'Citrus limon', 'Naturalia genera are real genera');
ok(under('pbj', 'segmentidae') && ['pbj-jam','pbj-jelly'].every(id => byId[id].parent === 'pbj'), 'PB&J is a sandwich; jam or jelly is a variety');
ok(rules.rules.some(r => r.id === 'table') && rules.rules.some(r => r.id === 'condiments'), 'the table rule and condiment test are published');

const A = tax.associations || [];
ok(A.length >= 3 && A.every(a => a.members.length >= 2 && a.members.every(m => byId[m.id])), 'every association lists at least two real members');
ok(A.every(a => /etum\b/.test(a.scientific)), 'association names end in -etum, as ecologists name them');
ok(A.every(a => !byId[a.id]), 'associations are not in the tree');
const sf = A.find(a => a.id === 'steak-frites');
ok(sf && sf.members.some(m => m.id === 'steak') && sf.members.some(m => m.id === 'fries'), 'steak frites is an association of steak and fries, not a species');
ok(A.find(a => a.id === 'costco-combo').members.some(m => m.id === 'canis-farcitus-costcoensis') && byId['canis-farcitus-costcoensis'].rank === 'variety', 'the Costco combo is the type association; the hot dog stays a variety');
ok(under('fries', 'naturalia') && under('fries', 'solanum'), 'fries are a single food: the potato knows them');
const ar = rules.rules.find(r => r.id === 'associations');
ok(ar && /menu name never creates a specimen/i.test(ar.summary) && ar.points.some(p => /separate bites/.test(p)) && ar.points.some(p => /Chicken and waffles/.test(p)), 'the association rule is published with the separate-bites test');
// Full depth: every species in a finished kingdom has every rank above it
const FULL = ['liquida', 'sandwichae', 'apertae', 'condimenta', 'naturalia'];
const need = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
tax.nodes.filter(n => n.rank === 'species' && FULL.some(k => under(n.id, k))).forEach(n => {
  const ranks = ancestors(n.id).map(a => byId[a].rank);
  need.forEach(r => ok(ranks.includes(r), 'full depth: ' + n.id + ' has a ' + r));
});
const cats = tax.nodes.map(n => n.catalog).concat((tax.associations || []).map(a => a.catalog));
ok(cats.every(c => Number.isInteger(c) && c > 0) && new Set(cats).size === cats.length, 'every entry has a unique catalog number');

console.log('4. Every page renders');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) {
  console.log('  jsdom not found; skipping render checks'); finish(); return;
}
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(String(e && (e.stack || e.message || e))));
vc.on('error', e => errors.push(String(e)));

const dom = new JSDOM(html.replace(/<script src="js\/app\.js(\?v=\d+)?"><\/script>/, ''), {
  url: 'https://jeffsonlinepersona.github.io/hotdogsaresandwiches/',
  runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc
});
const w = dom.window;
w.scrollTo = () => {};
let formReply = { success: 'true', message: 'The form was submitted successfully.' };
let lastPost = null;
w.fetch = (url, opts) => {
  if (/^https:\/\/formsubmit\.co\/ajax\//.test(url)) {
    lastPost = { url, opts };
    if (formReply === 'network') return Promise.reject(new Error('offline'));
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(formReply) });
  }
  return Promise.resolve({
    ok: true, status: 200,
    json: () => Promise.resolve(JSON.parse(fs.readFileSync(path.join(ROOT, url.split('?')[0]), 'utf8')))
  });
};
w.eval(appJs);

const tick = () => new Promise(r => setTimeout(r, 0));
async function go(hash) {
  w.location.hash = hash;
  w.__HDS.render();
  await tick();
  return w.document.getElementById('main');
}

(async () => {
  await tick(); await tick();
  const main = w.document.getElementById('main');
  ok(!/Consulting the Review Board/.test(main.textContent), 'data loaded and home rendered');
  ok(/sandwich/i.test(main.querySelector('h1').textContent), 'home headline');

  const routes = ['#/', '#/about', '#/rules', '#/tree', '#/classify', '#/submit', '#/thanks',
    '#/submit?type=dispute&food=Hot%20dog', '#/specimen/nope', '#/bogus'];
  tax.nodes.forEach(n => { routes.push('#/tree/' + n.id); routes.push('#/specimen/' + n.id); });
  routes.push('#/associations', '#/association/nope', '#/catalog');
  (tax.associations || []).forEach(a => routes.push('#/association/' + a.id));
  for (const r of routes) {
    const m = await go(r);
    ok(m.innerHTML.length > 200, 'content on ' + r);
    ok(m.querySelector('h1, h2'), 'heading on ' + r);
    ok(!/undefined|NaN|\[object/.test(m.textContent), 'no undefined/NaN text on ' + r);
  }

  let m = await go('#/specimen/nope');
  ok(/escaped/i.test(m.textContent), 'unknown specimen shows the escaped page');

  m = await go('#/catalog');
  const specimenCount = tax.nodes.filter(n => n.rank === 'species' || n.rank === 'variety').length + (tax.associations || []).length;
  ok(m.querySelectorAll('.register tbody tr').length === specimenCount, 'the Catalog lists every species, variety and association');
  ok(/TE-0128/.test(m.textContent) && /Desiderata/.test(m.textContent), 'the Catalog shows catalog numbers and desiderata');
  ok(m.querySelector('.register tbody tr .mark-plate'), 'illustrated entries carry a plate mark');

  m = await go('#/specimen/canis-farcitus-costcoensis');
  ok(/Costco Hot Dog/.test(m.textContent), 'Costco card title');
  ok(/Sandwichae/.test(m.querySelector('.ladder').textContent), 'Costco ladder includes Sandwichae');

  ok(m.querySelector('.specimen-figure.plate img[src="images/costco-hot-dog-plate.jpg"]'), 'Costco card shows the plate whole as its primary image');
  ok(m.querySelectorAll('.specimen-gallery .mat img').length === 1, 'Costco field photo sits in a mat in the gallery');
  ok(/Illustration after a wild specimen photographed by jeffsonlinepersona/.test(m.textContent), 'plate is credited as an illustration');
  m = await go('#/specimen/detroit-pizza-meat-lovers');
  ok(m.querySelector('.specimen-figure.plate img[src="images/detroit-meat-lovers-plate.jpg"]') && /Pl\. II · Illustration by jeffsonlinepersona/.test(m.textContent), 'Plate II shows on the meat lovers Detroit card');
  m = await go('#/specimen/st-louis-pizza');
  ok(m.querySelector('.stub-notice') && m.querySelector('.badge-inquirenda'), 'stub card shows the species inquirenda notice');
  m = await go('#/tree/canis-farcitus-costcoensis');
  ok(m.querySelectorAll('.col').length >= 7, 'tree shows all columns down to the variety');
  ok(m.querySelector('.preview'), 'tree shows the leaf preview');

  // Walk every classifier path to the end
  const results = new Set();
  async function walkUI(choices) {
    await go('#/');           // leaving the classifier resets it
    await go('#/classify');
    let mm = w.document.getElementById('main');
    const start = mm.querySelector('[data-action="start"]');
    if (start) { start.click(); await tick(); }
    for (const c of choices) {
      mm = w.document.getElementById('main');
      const opts = mm.querySelectorAll('[data-action="choose"]');
      opts[c].click(); await tick();
    }
    mm = w.document.getElementById('main');
    return mm;
  }
  async function explore(prefix) {
    const mm = await walkUI(prefix);
    const opts = mm.querySelectorAll('[data-action="choose"]');
    if (!opts.length) {
      ok(mm.querySelector('.result-card'), 'classifier path ' + prefix.join(',') + ' ends on a result');
      results.add(mm.querySelector('.result-card h2').textContent);
      const sub = mm.querySelector('a[href^="#/submit"]');
      ok(sub && /placement=/.test(sub.getAttribute('href')), 'result offers a prefilled submit link');
      return;
    }
    for (let i = 0; i < opts.length; i++) await explore(prefix.concat(i));
  }
  await explore([]);
  ok(results.size >= 12, 'classifier reaches ' + results.size + ' distinct results');

  // Hot dog path: Constructa > container > bread > whole bun
  m = await walkUI([3, 1, 0, 1]);
  ok(/Integriformes/.test(m.textContent), 'hot dog path lands in Integriformes');
  m = await walkUI([3, 1, 0, 0]);
  ok(/Partiformes/.test(m.textContent), 'sliced-loaf path lands in Partiformes');
  m = await walkUI([3, 2, 0, 1]);
  ok(/Integriformes/.test(m.textContent), 'pizza path lands in whole-base topped foods');
  m = await walkUI([3, 3, 1]);
  ok(/Decocta/.test(m.textContent), 'broth path lands in Decocta (ramen)');
  m = await walkUI([3, 3, 2]);
  ok(/Cruda/.test(m.textContent), 'cereal path lands in Cruda');

  // Submit form
  m = await go('#/submit?type=dispute&food=Hot%20dog');
  const form = m.querySelector('#submit-form');
  ok(form.getAttribute('action').startsWith('https://formsubmit.co/'), 'form posts to FormSubmit');
  ok(form.getAttribute('enctype') === 'multipart/form-data', 'form can carry a photo');
  ok(form.querySelector('#f-food').value === 'Hot dog', 'food prefilled');
  ok(form.querySelector('#f-type').value === 'Dispute a ruling', 'type prefilled');
  ok(/#\/thanks$/.test(form.querySelector('[name="_next"]').value), 'redirects to thanks page');
  ok(form.querySelector('[name="_honey"]'), 'honeypot present');
  const v = w.__HDS.validateSubmit;
  ok(v(form).ok && v(form).subject === 'Dispute: Hot dog', 'valid dispute passes with subject');
  form.querySelector('#f-food').value = '';
  ok(!v(form).ok, 'empty food is rejected');
  form.querySelector('#f-food').value = 'Pop-Tart';
  form.querySelector('#f-type').value = 'Add a photo';
  ok(!v(form).ok, 'photo request without a photo is rejected');

  // Sending: success goes to the thanks page; failures stay and explain
  async function send(reply) {
    formReply = reply;
    const mm = await go('#/submit?type=new&food=Pop-Tart');
    const f = mm.querySelector('#submit-form');
    f.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    for (let i = 0; i < 5; i++) await tick();
    return f;
  }
  let f2 = await send({ success: 'true', message: 'ok' });
  ok(lastPost && /formsubmit\.co\/ajax\/[0-9a-f]{32}$/.test(lastPost.url), 'posts to the FormSubmit ajax endpoint');
  ok(lastPost.opts.body.get('Food') === 'Pop-Tart', 'sends the food name');
  ok(lastPost.opts.body.get('_subject') === 'New specimen: Pop-Tart', 'sends the subject');
  ok(lastPost.opts.body.get('_next') === null, 'drops the redirect field');
  ok(!lastPost.opts.body.has('attachment'), 'drops the empty photo field (iPhone Safari bug)');
  ok(w.location.hash === '#/thanks', 'success lands on the thanks page');
  f2 = await send({ success: 'false', message: 'This form needs Activation. We sent you an email.' });
  ok(/still being set up/.test(f2.querySelector('#form-error').textContent) && !f2.querySelector('#form-error').hidden, 'activation message shown');
  ok(!f2.querySelector('button[type="submit"]').disabled, 'button re-enabled after failure');
  ok(typeof lastPost.opts.body.toString === 'function' && /Food=Pop-Tart/.test(lastPost.opts.body.toString()), 'no-photo entries go URL-encoded');
  // With a photo, the normal page post goes ahead (ajax drops attachments)
  {
    lastPost = null;
    const mm = await go('#/submit?type=photo&food=Hot%20dog');
    const f = mm.querySelector('#submit-form');
    const fakeFile = new w.File(['x'], 'dog.jpg', { type: 'image/jpeg' });
    Object.defineProperty(f.querySelector('#f-photo'), 'files', { value: [fakeFile] });
    f.querySelector('#f-consent').checked = true;
    let posted = false;
    w.HTMLFormElement.prototype.submit = function () { posted = true; };
    const ev = new w.Event('submit', { bubbles: true, cancelable: true });
    f.dispatchEvent(ev);
    for (let i = 0; i < 20 && !posted; i++) await new Promise(r => setTimeout(r, 25));
    ok(posted, 'photo entries use the normal page post (after preparing the photo)');
    ok(lastPost === null, 'photo entries skip the ajax endpoint');
    ok(/Original: dog\.jpg, image\/jpeg/.test(f.querySelector('[name="Photo info"]').value), 'photo info recorded for the email');
    ok(f.querySelector('[name="_next"]').value.endsWith('#/thanks'), 'photo post returns to thanks page');
    ok(f.querySelector('[name="_subject"]').value === 'Photo: Hot dog', 'photo post subject set');
  }

  f2 = await send('network');
  ok(/could not reach/.test(f2.querySelector('#form-error').textContent), 'network failure explained');
  const copyBtn = f2.querySelector('#form-alt [data-action="copy-entry"]');
  ok(copyBtn && !f2.querySelector('#form-alt').hidden, 'Copy my entry offered');
  let copied = null;
  Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: t => { copied = t; return Promise.resolve(); } }, configurable: true });
  copyBtn.click(); await tick();
  ok(copied && /New specimen: Pop-Tart/.test(copied) && /Food: Pop-Tart/.test(copied) && !/_template/.test(copied), 'copied entry has the fields, not the hidden ones');
  ok(copyBtn.textContent === 'Copied', 'copy button confirms');
  ok(!f2.querySelector('button[type="submit"]').disabled, 'button re-enabled after network failure');
  ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(appJs), 'no email address in the site code');

  // Search
  const S = q => w.__HDS.searchNodes(q).map(n => n.id);
  const first = (q, id) => ok(S(q)[0] === id, 'search "' + q + '" → ' + id + ' (got ' + (S(q)[0] || 'nothing') + ')');
  first('pizza', 'thin-crust-pizza');
  first('Pizza ', 'thin-crust-pizza');
  first('pizzza', 'thin-crust-pizza');
  first('hot dog', 'canis-farcitus');
  first('hotdogs', 'canis-farcitus');
  first('costco', 'canis-farcitus-costcoensis');
  first('cup o noodles', 'cup-noodles');
  first('Cup-O-Noodles', 'cup-noodles');
  first('ramen', 'shop-ramen');
  first('IPA', 'cerevisia-vulgaris-barbata');
  first('beer', 'cerevisia-vulgaris');
  first('california roll', 'california-roll');
  first('sashimi', 'tuna-sashimi');
  first('caesar salad', 'chicken-caesar-salad');
  first('casserole', 'tuna-noodle-casserole');
  first('potstickers', 'gyoza');
  first('bao', 'bao');
  first('pot pie', 'chicken-pot-pie');
  first('tacos', 'tacoforma-classicus');
  first('cornflakes', 'cereal');
  first('Canis farcitus', 'canis-farcitus');
  ok(S('xyzzy plover').length === 0, 'nonsense finds nothing');

  // Analytics events (stubbed GoatCounter)
  const counted = [];
  w.__HDS.setAnalytics('test-code');
  w.goatcounter = { count: v => counted.push(v) };
  m = await go('#/search?q=xyzzy%20plover');
  ok(/Nothing in the collection matches/.test(m.textContent), 'no-results page');
  ok(counted.some(v => v.event && v.path === 'search-not-found/xyzzy-plover'), 'not-found search is logged');
  ok(m.querySelector('a[href^="#/submit"]').getAttribute('href').includes('food=xyzzy%20plover'), 'no-results offers a pre-filled request');
  await go('#/search?q=xyzzy%20plover');
  ok(counted.filter(v => v.path === 'search-not-found/xyzzy-plover').length === 1, 'a repeated miss is logged once');
  m = await go('#/search?q=pizza');
  ok(m.querySelectorAll('.results li').length >= 1 && /Neapolitan pizza/.test(m.querySelector('.results li').textContent), 'results page lists pizza first');
  ok(counted.some(v => v.event && v.path === 'search/pizza'), 'successful search is logged');
  await go('#/specimen/cereal');
  ok(counted.some(v => !v.event && v.path === '/specimen/cereal'), 'page views are counted by route');
  w.__HDS.setAnalytics('');

  // Header search box
  w.document.getElementById('q').value = 'beer';
  w.document.getElementById('site-search').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  ok(w.location.hash === '#/search?q=beer', 'header search box goes to results');

  // Classify can start with a food from search
  await go('#/');
  m = await go('#/classify?food=xyzzy');
  ok(m.querySelector('#cls-food').value === 'xyzzy', 'classifier pre-fills the food from search');

  ok(errors.length === 0, 'no script errors' + (errors.length ? ':\n' + errors.join('\n') : ''));
  finish();
})().catch(e => { failures++; console.log('  CRASH ' + (e.stack || e)); finish(); });

function finish() {
  console.log('\n' + passes + ' passed, ' + failures + ' failed');
  process.exitCode = failures ? 1 : 0;
}

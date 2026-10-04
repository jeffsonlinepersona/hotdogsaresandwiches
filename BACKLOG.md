# Backlog

Planned work and known issues, newest first within each section. Bugs carry a root-cause note, not just the symptom.

## Features

### The Rulings page (Frequently Raised Objections)
- **Logged:** 2026-10-04
- **Want:** a page of official responses to the arguments people keep making, in the Review Board's semi-serious voice. Part FAQ, part court record. Replaces the "dated changelog" idea below.
- **Each entry:** the objection as people say it ("Espresso is literally pressed, so it's Expressa"), the Board's ruling, the rule it rests on (linked to the Rules page), the specimens affected (linked to their cards) and the date ruled.
- **Starter entries:** espresso is not Expressa; tacos are sandwiches; an open-faced sandwich is not; cereal is not soup; ramen is soup (the broth clause); lemonade is not juice; milkshakes are not drinks.
- **Also holds** a short "Recent rulings" list, newest first, for reversals and new placements.
- **Guiding principle to quote at the top:** "Follow the logic and rules, even when they challenge our preconceptions." Opening axiom: hot dogs are sandwiches.

### Specimen card extras: history, rulings and status
- **Logged:** 2026-10-04
- **Want:** each card gets an optional short history (when it was classified, anything that moved it, e.g. "milkshake: deported from Liquida, 2026-10-03"), links to any Rulings entries about it, and a visible status.
- **Status options** (cards already carry a `status` field, today only "ruled" or "pending"):
  - **Ruled:** settled science.
  - **Pending review:** the Board is deliberating, indefinitely.
  - **Disputed:** an objection is on file.
  - **Extinct:** the specimen no longer exists in the wild. The card stays up as a fossil record, with the date of extinction.
- **Why Extinct matters:** the Costco hot dog (*C. f. costcoensis*) is defined by its $1.50 price. If Costco ever raises it, that variety goes extinct, and any successor is a new variety. The card should say so with appropriate solemnity.
- **Data:** new optional fields `history` (list of dated lines), `rulings` (ids of Rulings entries) and `extinct_on` (a date).

### Guided placement in the Submit form
- **Logged:** 2026-10-03
- **Want:** the "Proposed placement" field should help people pick a spot in the tree instead of typing it freehand. Options to weigh: a tap-through picker that reuses the tree's drill-down, type-ahead over existing groups, or an inline mini-classifier.
- **Today:** the field is only pre-filled when the visitor arrives from Classify a Food; otherwise it is free text.

### Version 2 items (from the requirements doc)
- **Logged:** 2026-10-03
- First wild photos on specimen cards.
- Rulings page: now its own item above (Frequently Raised Objections).
- ~~Search box~~ Done 2026-10-03: header search with typo tolerance and aliases; misses logged to analytics.
- Analytics: live 2026-10-03 at hotdogsaresandwiches.goatcounter.com (page views, searches, not-found searches).
- Taxonomy: container test adopted 2026-10-03 (Sandwichae needs bread; new Dumplingae, Sushiae, Pieae; casseroles sort by structure). Broth clause adopted 2026-10-03: restaurant ramen and pho are soup; cereal and gazpacho still are not.
- Full-depth pass, kingdom by kingdom (every species gets every rank). Done: Liquida (2026-10-03). Next: Constructa outside Sandwichae, Naturalia, Condimenta, Incertae sedis.
- Link previews with an image when a card link is texted.

### Version 3 items
- **Logged:** 2026-10-03
- "Dispute this ruling" opens a dedicated dispute mode (today it pre-fills the form).
- Optional custom domain.

## Known issues

### FormSubmit blocked on some networks
- **Logged:** 2026-10-03
- **Symptom:** on Jeff's iPhone the form failed; opening formsubmit.co directly gave `ERR_NAME_NOT_RESOLVED`.
- **Cause:** the phone's network could not look up formsubmit.co at all, so a DNS filter, ad blocker, VPN or Wi-Fi filter is blocking the domain. Not a site bug: the same form works from desktop and from other browsers.
- **Mitigation:** when FormSubmit can't be reached, the form explains the likely cause (VPN, ad blocker, Wi-Fi filter) and offers "Copy my entry" so nothing typed is lost.
- **Possible fix:** if friends hit this often, switch to a service less likely to be on blocklists (for example Formspree or Web3Forms). Only `FORM_ADDRESS`/the endpoint in `js/app.js` would change.

### Photo-less entries have no CAPTCHA
- **Logged:** 2026-10-03
- **Cause:** entries without a photo send in the background (FormSubmit's ajax endpoint) so the page can report success or failure. FormSubmit only shows its CAPTCHA on full-page submissions.
- **Mitigation:** the hidden honeypot field still catches simple bots. Revisit if spam shows up.

### Photos dropped by FormSubmit's ajax endpoint (fixed)
- **Logged:** 2026-10-03
- **Symptom:** a phone submission with a photo arrived by email without the attachment.
- **Cause:** two problems stacked. FormSubmit's ajax endpoint drops file attachments, and iPhone photos (HEIC and/or very large originals) were also dropped even on a normal post, while desktop JPEGs went through.
- **Fix:** entries with a photo use a normal full-page form post, and the page first redraws the photo as a JPEG of at most 1600 px (which also strips location data). Confirmed working from Jeff's iPhone, including FormSubmit's CAPTCHA step. The email's "Photo info" row records the original file and what was sent.

### Owner email visible in page source (fixed)
- **Logged:** 2026-10-03
- **Cause:** FormSubmit was addressed by email until the form was activated.
- **Fix:** `FORM_ADDRESS` in `js/app.js` now holds FormSubmit's random alias. The "Email it instead" fallback was replaced with "Copy my entry", since a mailto link would expose the address again. A check in `tests/check.cjs` fails if an email address reappears in the code.

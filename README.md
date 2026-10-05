# HotDogsAreSandwiches

A field guide to **Taxonomia Ediblis**: every food classified from kingdom to variety, by rules that were argued over at length and are now, regrettably, binding.

The hot dog is a sandwich. This is settled science.

Live site: https://jeffsonlinepersona.github.io/hotdogsaresandwiches/

Planned work lives in [BACKLOG.md](BACKLOG.md).

## How the site is built

It is a static site on GitHub Pages. No server, no database, no build step.

| File | What it holds |
| --- | --- |
| `index.html` | The page shell: header, navigation, footer |
| `css/style.css` | The Museum Label look, with automatic dark mode |
| `js/app.js` | Draws every page from the data files |
| `data/taxonomy.json` | Every node in the tree, from kingdom to variety |
| `data/rules.json` | The Rules page and the Classify a Food questions |
| `images/` | Wild photos, one per specimen |
| `tests/check.cjs` | Automated checks run before each update |

## Adding a food

**House rule: full depth.** Every species gets the whole chain: kingdom, phylum, class, order, family, genus, species. If a new food has no home at some level, stop, go up to that level, and decide what belongs there first. `tests/check.cjs` enforces this for each finished kingdom (currently Liquida and Sandwichae).

What each level means, in plain words:

| Level | Question it answers |
| --- | --- |
| Kingdom | What job does it do at the table? |
| Phylum | What is its basic build (or, for drinks, how was it made)? |
| Class | What is the key part made of, or how is it made? |
| Order | What shape or state is it in (for sandwiches: slices from a loaf, or a whole piece of bread; for drinks: still or sparkling)? |
| Family | What is it built around (for sandwiches: what kind of bread)? |
| Genus | What would you call the group on a menu (for sandwiches: what shape is the filling, such as tube, disc or sheet)? |
| Species | What do you actually order? |
| Variety | How is it made your way, still ordered by the same name? |

Edit `data/taxonomy.json` only. Copy an existing entry and change:

- `id`: unique, lowercase with dashes (it becomes the card's link)
- `rank`: domain, kingdom, phylum, class, order, family, genus, species or variety
- `parent`: the `id` of the node it belongs under
- `scientific` and `common`: the two names
- `short`: one or two sentences; `long` is optional field notes
- `verdict` (optional): Sandwich, Not a sandwich, Soup or Not soup
- `aliases` (optional): other names people might search for, such as `["cup noodles", "instant ramen"]`
- `ruled_on`: the date, as YYYY-MM-DD

## Search and analytics

The search box matches common names, scientific names and `aliases`, and tolerates small typos.
Analytics use [GoatCounter](https://www.goatcounter.com) (no cookies). Set `GOATCOUNTER_CODE` at the top of `js/app.js` to turn them on. Searches that find nothing are logged as events named `search-not-found/<words>`.

## Adding a photo

Save it in `images/`, resized to about 1600 px wide with location data removed, then add `"photo": "images/<file>.jpg"` and `"photo_credit": "<name>"` to the entry.

## Submissions

The Submit a Specimen form emails entries through [FormSubmit](https://formsubmit.co). The address is set at the top of `js/app.js`.

## License

Content and photos: [CC BY 4.0](LICENSE.md).

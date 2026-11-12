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

**House rule: full depth.** Every species gets the whole chain: kingdom, phylum, class, order, family, genus, species. If a new food has no home at some level, stop, go up to that level, and decide what belongs there first. `tests/check.cjs` enforces this for each finished kingdom (currently Liquida, Sandwichae and Apertae).

What each level means, in plain words:

| Level | Question it answers |
| --- | --- |
| Kingdom | What job does it do at the table? |
| Phylum | What is its basic build (or, for drinks, how was it made)? |
| Class | What is the key part made of, or how is it made? |
| Order | What shape or state is it in (for sandwiches and topped foods: slices from a loaf, or a whole piece of bread or base; for drinks: still or sparkling)? |
| Family | What is it built around (for sandwiches: what kind of bread; for pizza: a hand-shaped or pan-shaped crust)? |
| Genus | What would you call the group on a menu (for sandwiches: what shape is the filling, such as tube, disc or sheet)? |
| Species | What do you actually order? |
| Variety | How is it made your way, still ordered by the same name? A topping combination found on many styles lives under the style where it was first recorded (its type locality). |

**The assembly rule.** A combination is classified by the structure it forms, not by its parts; the parts keep their own cards. If it is built to be eaten as one thing and ordered by one name, it is one specimen:

| How the foods meet | Example | Result |
| --- | --- | --- |
| Side by side | Frank next to a bun on a plate | Two specimens (a meal, not a food) |
| One on top of another | Toppings on one slice | Apertae (open-faced) |
| One holds the other | Frank in a bun | New species (Involucra) |
| Tossed together | Chicken Caesar salad | Mixta |
| Cooked together into a liquid | Soup | Decocta |
| Something added on | Ketchup on the hot dog | Variety, not a new species |

Edit `data/taxonomy.json` only. Copy an existing entry and change:

- `id`: unique, lowercase with dashes (it becomes the card's link)
- `rank`: domain, kingdom, phylum, class, order, family, genus, species or variety
- `parent`: the `id` of the node it belongs under
- `scientific` and `common`: the two names
- `short`: one or two sentences; `long` is optional field notes
- `verdict` (optional): Sandwich, Not a sandwich, Soup or Not soup
- `aliases` (optional): other names people might search for, such as `["cup noodles", "instant ramen"]`
- `ruled_on`: the date, as YYYY-MM-DD
- `status`: `ruled`, `pending review`, or `species inquirenda` for a stub: a food the Board knows exists but has not collected. Stubs still get the full chain and a one-line description; the card shows a notice asking for a wild photo. (In real taxonomy, a *species inquirenda* is a species that needs further inquiry.)

## Search and analytics

The search box matches common names, scientific names and `aliases`, and tolerates small typos.
Analytics use [GoatCounter](https://www.goatcounter.com) (no cookies). Set `GOATCOUNTER_CODE` at the top of `js/app.js` to turn them on. Searches that find nothing are logged as events named `search-not-found/<words>`.

## Adding a photo

Each card can list `images`, primary first:

```json
"images": [
  { "src": "images/costco-hot-dog-plate.jpg", "kind": "plate", "label": "Pl. I",
    "credit": "jeffsonlinepersona", "date": "2026-10-11", "w": 1200, "h": 1692 },
  { "src": "images/costco-hot-dog-photo-1.jpg", "kind": "photo",
    "credit": "jeffsonlinepersona", "date": "2026-10-11", "w": 1200, "h": 1600 }
]
```

- **House rule: the primary image of a new specimen is a plate**, an illustration adapted from the wild photo in the Taxonomia Ediblis plate format (ruled border, "Pl." number and catalog number, Latin name and figure legend). A plate is shown whole at its own shape. Only the first image may be a plate.
- **Every photograph sits in a mat**, the same fixed frame whatever its orientation, so cards keep one shape. Photos after the first appear under "Field photographs".
- Save images in `images/` as JPEG, about 1200 to 1600 px on the long side, with location data removed. Give `w` and `h` so the page does not jump while loading.
- Older entries may still use `photo` and `photo_credit`; they show as a single matted photo.

## Submissions

The Submit a Specimen form emails entries through [FormSubmit](https://formsubmit.co). The address is set at the top of `js/app.js`.

## License

Content and photos: [CC BY 4.0](LICENSE.md).

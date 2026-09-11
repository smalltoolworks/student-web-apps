# The Sunrise Islands

A geography game for **Year 3/4**: *why do Australians live where they do?*

Students scout and settle imaginary islands with different climates, then compare **two real
maps of Australia** — rainfall and population density — spot the correlation themselves, and
**write** their own conclusions.

Open `index.html` in any browser. No install, works offline.

---

## Two things to do before class

**1. Add the two map images.** They are not included. Save them into the `images/` folder with
these exact names:

| File | What it is | Where to get it |
|---|---|---|
| `images/rainfall-january.png` | BoM median rainfall, 1–31 January | bom.gov.au/climate |
| `images/population-density.jpg` | ABS estimated resident population density grid, 2018 | abs.gov.au |

Both are already in place. The ABS export has no legend burned into it, so the colour key is
drawn in HTML beside the map. If you ever swap an image out, keep the same filename.

> **Licence check:** both maps are Commonwealth material (Bureau of Meteorology; Australian
> Bureau of Statistics). Australian Government material is usually released under
> Creative Commons Attribution 4.0, which allows reuse **with attribution** — but please
> confirm the licence on each source page before publishing this to a public GitHub site.
> The attribution lines are already in the page.

**2. Check two pieces of wording** with your curriculum lead or Aboriginal Education officer:

- The closing card, which refers to Aboriginal and Torres Strait Islander Peoples living on and
  caring for Country in every Australian climate for 65,000+ years (`COPY.closing2`).
- The Gold Island fire card, whose best answer refers to cool-season patch burning
  (search the file for `Burn small patches early`).

---

## The big idea

Most Australians live near the coast — but some choose to live inland, and the game makes
students weigh **why**. Every settlement is scored on **two** things that pull against each other:

| | Meter | What it means |
|---|---|---|
| 👥 | **People** | how many can live there |
| 🏡 | **Room & cost** | how much space, and how cheap |

Room falls straight out of population, so **you cannot have both**. A busy temperate town is
crowded with dear houses; a small desert settlement has miles of cheap space. That is a real
trade-off, so "where would you live?" has no single right answer — which is the point.

Below 15 people a settlement reads **"Almost empty"** with no stars: a failed camp is not
rewarded for being roomy.

## How it runs — about 25 minutes

1. **Intro** — climate, and the two meters.
2. **Settle any two islands** (more if they want). Students choose which — they are not marched
   through all four. A **"I'm ready to think →"** button appears as soon as two are done.
3. Per island: scout three places (all three must be scouted before choosing), then **3 years**.
   Each year brings a climate event and a **decision card**; the five factors *and their choice*
   add up in a visible ledger. Advanced by a button, never a timer.
4. **Now look at Australia** — their island results beside a simple climate-zone map and a
   coast-vs-inland table (Sydney and Perth against Broken Hill and Alice Springs).
5. **Two real maps** — rainfall and population side by side, with three guided questions that
   force students to read *both* maps.
6. **The pattern** — where it rains, people live. Then *"But look closer"*: the tiny specks
   inland, and why people choose them.
7. **Write** — three scaffolded questions with sentence starters and a tap-to-add word bank.
8. **My report** — their islands and their own writing, ready to print or copy.

## The climate gradient

Best place on each island, no help from the decision cards:

| Island | Climate | Like | 👥 People | 🏡 Room & cost |
|---|---|---|---|---|
| 🌳 Green | Temperate | Sydney | **53** Busy Town | ★☆☆ Crowded |
| 🌾 Gold | Grassland | Broken Hill | **39** Growing Village | ★★☆ Room to spread |
| 🌴 Palm | Tropical | Darwin | **29** Growing Village | ★★☆ Room to spread |
| 🏜️ Red | Desert | Alice Springs | **25** Small Settlement | ★★★ Wide open |

That ordering mirrors where Australians actually live. Good choices add about +9 people and
poor ones cost about −6, so **climate still decides the ranking** for a student who plays
consistently — but their choices genuinely matter.

## Discussion prompts

- Put the two real maps side by side. *What do you notice?* Let them find it before you say it.
- **Palm Island had plenty of water and still struggled.** Why isn't water alone enough?
- **Red Island survived on one waterhole** — like real desert towns. What do they all have?
- **Would you rather live crowded and mild, or roomy and hard?** No right answer. Make them argue.

## Reading support

- Everything is written in short phrases — most notes are 3–6 words.
- A **🔊 Read to me** button sits on every screen and uses the browser's own voice.
  No software to install; it works offline on iPads. It reads long pages in chunks so it
  does not cut out. If a device has no voice, the button simply does not appear.

## Teacher shortcuts

| URL | Does |
|---|---|
| `index.html?island=red&site=springcamp&fast=1` | Jump to a finished result, for the projector |
| `index.html?island=palm` | Open an island with its scout report showing |
| `index.html?debug=1` | Print the balance table and water distances to the console |

Islands: `palm`, `red`, `gold`, `green`.

## Putting it on GitHub Pages

1. Push this folder (including `images/`) to a repository.
2. **Settings → Pages → Source: Deploy from a branch**, `main`, folder `/ (root)`.
3. Students open `https://<username>.github.io/<repo>/settlement-game/`

Writing and progress are kept in `sessionStorage` only, so shared iPads never carry one
student's work over to the next. Remind students to **print or copy** before they close the tab.

## Changing things

At the top of `index.html`:

- **`ISLANDS`** — each island's climate, map, three sites, three years and three decision cards.
- **`map`** — nine 12-character rows per island.
  `~` sea · `.` beach · `,` plain · `T` gum trees · `R` rainforest · `G` grassland ·
  `S` spinifex · `d` dunes · `s` salt pan · `n` hills · `k` red rock · `A` mountain ·
  `=` river · `O` waterhole · `m` mangroves
- **`CONTRIB`** — people gained or lost per factor score. Difficulty lives here.
- **`ROOMS`** — the Room & cost bands.
- **`MAP_LOOKS`** — the three questions about the two real maps.
- **`WORD_BANK`** — the words students can tap into their writing.
- **`COPY`** — the longer sentences, in one place, so reading level can be checked in one pass.

The game **checks itself on load**: it recalculates every site's water score from the real
distance to fresh water on that island's map and warns in the console if the data no longer
matches, so moving a river cannot silently make a scout report lie. Run `?debug=1` after any change.

## Accessibility

Keyboard playable throughout; map pins take Enter/Space and focus moves to the heading on every
screen. Scores show three ways — filled/hollow dots, a word, and a number — so colour is never
the only signal. Both real maps carry full alt text describing what they show. Tap targets 56px+.
Honours `prefers-reduced-motion`. No sound except the read-aloud button. No network requests.

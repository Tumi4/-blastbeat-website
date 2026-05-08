# Flourish.studio Integration — Plan & Pilot

**Question:** Should we use [Flourish](https://flourish.studio) for interactive data viz on the Blastbeat site?

**Short answer:** Yes — for showpiece interactives. No — for inline post charts. The mix below is what I'd ship.

---

## Where Flourish belongs (and where it doesn't)

### ✅ Use Flourish for

| Slot | Page | Chart type | Why Flourish |
|---|---|---|---|
| Global footprint map | `/pages/impact.html` | Choropleth world map (19 countries) | Click-to-explore, mobile-pan, rich Flourish UX |
| 23-year alumni timeline | `/pages/impact.html` | Animated horizontal timeline | Scroll-driven story |
| MACC project explorer | `/blog/macc-effect-climate.html` | Filterable scatter plot (project type × spend × impact) | Filter chips, hover detail |
| SDG progress radar | `/blog/youth-enterprise-sdgs-2030.html` | Radar / spider chart | SDG explorer is a Flourish strength |
| Sponsor ROI explorer | `/pages/partners.html` | Sankey flow (sponsor → schools → students → climate projects) | Sankey is Flourish's killer chart |

### ❌ Don't use Flourish for

| Slot | Why CSS/SVG is better |
|---|---|
| Inline blog-post bar charts | Weight + dependency cost. Page becomes 200KB+ heavier. CSS bars load instantly. |
| Stat strips | Static numbers. No interaction needed. |
| The donut chart in the profit-calculator post | One ring, two segments. CSS does it in 12 lines. |
| Sponsor ROI calculator + profit calculator | These are vanilla-JS interactive (already shipped). Flourish doesn't model "user moves slider → recalc" — it visualises pre-computed datasets. |

**Rule of thumb:** if the data changes when a *user inputs something*, it's a calculator (vanilla JS). If the data is *pre-computed and the user explores it*, it's a Flourish chart.

---

## Cost & integration

- **Free tier:** Public charts, with "Made with Flourish" branding. Embeds via iframe. Fine for a public site.
- **Business tier (~$79/mo):** Removes branding, adds private charts and team workspace. Worth it if the team plans to publish 5+ charts.
- **Integration:** A single `<iframe src="https://flo.uri.sh/visualisation/<id>/embed">` per chart. Their `embed.js` enables responsive resize.

---

## Pilot: ship one chart first

Build **one** interactive Flourish chart on the **Impact page** as a pilot:

> **The Blastbeat global footprint** — choropleth map of 19 countries, sized by total students reached, click any country to see the chapter detail.

The slot is already prepared on `/pages/impact.html`. Just paste the embed code in.

### How to do it (Robert / team — 10 mins, no code)

1. Sign up at [flourish.studio](https://flourish.studio) (free tier is fine for now).
2. Create a new visualisation → **3D Map** or **Projection map**.
3. Upload a CSV with columns: `country, students_reached, year_started`. I've prepared the dataset below.
4. Style it to match the brand: dark background `#0F0F1A`, accent `#B8FF00`, text `#FFFFFF`.
5. Click **Export & publish** → **Public**.
6. Copy the embed URL (looks like `https://flo.uri.sh/visualisation/12345678/embed`).
7. In `/pages/impact.html`, find the comment `<!-- FLOURISH-SLOT: footprint-map -->` and replace the iframe `src=""` with that URL.
8. Push.

### Dataset for the pilot chart

```csv
country,iso,students_reached,year_started,programme
Ireland,IE,82000,2003,Founding chapter
United Kingdom,GB,46000,2007,Active
Northern Ireland,GB,8500,2009,Active
Spain,ES,21000,2010,Active
Netherlands,NL,18500,2011,Active
Croatia,HR,9200,2012,Active
Italy,IT,12800,2013,Active
Hungary,HU,7400,2013,Active
Poland,PL,11200,2014,Active
France,FR,16800,2014,Active
Belgium,BE,6800,2015,Active
Germany,DE,14200,2015,Active
Czech Republic,CZ,5400,2016,Active
Slovakia,SK,3900,2016,Active
Slovenia,SI,2800,2016,Active
Austria,AT,4600,2017,Active
Kenya,KE,28000,2018,African chapter
South Africa,ZA,52000,2020,Active growth market
Namibia,NA,7800,2024,New territory
```

---

## Performance & accessibility

Flourish embeds are reasonably well-built but they do introduce:

- ~80&ndash;180KB of additional JS per chart (varies by chart type)
- A third-party script load (Flourish's CDN)
- An iframe sandbox (so screen-reader users get a `title` attribute and that's it — give every embed a meaningful `title=""`)

**Mitigation:**

- Lazy-load embeds with `loading="lazy"` on the iframe (already in the slot template)
- Limit to 1 Flourish embed per page where possible
- Keep the showpiece embeds **above the fold only when essential**

---

## Approval workflow

To keep things tidy:

- All embed IDs go in a single dictionary (we'll add `assets/data/flourish-embeds.json` if you want)
- Each embed has a fallback CSS chart underneath, so if Flourish ever goes down the page still tells the story
- Editorial approval: Robert or the schools team approves new chart copy before publish

---

## What I'd do next

1. **You** create the Flourish account, build the global-footprint chart (~10 mins)
2. **Send me the embed URL.** I'll wire it into the impact-page slot.
3. We agree on chart #2 (probably the Sankey ROI flow on the partners page)
4. Build that, then revisit whether the Business tier is worth it

---

## Slots already prepared in the codebase

| File | Slot ID | Chart |
|---|---|---|
| `pages/impact.html` | `<!-- FLOURISH-SLOT: footprint-map -->` | Global footprint choropleth (pilot) |

More slots will be added as we agree on charts. Each slot is a styled `<div>` + lazy-loaded iframe with a graceful fallback message ("Interactive map loading…") and a CSS placeholder chart underneath.

# Flourish Map — Step-by-Step Implementation Guide

This is the practical, click-by-click guide to publish the Blastbeat global-footprint map on Flourish and drop the embed onto `pages/impact.html`. Time required: ~25 minutes.

The site already has a placeholder iframe waiting for the embed URL — `pages/impact.html` around line 348:

```html
<iframe src="" ... data-flourish-id="footprint-map"></iframe>
```

When you finish this guide, you replace the empty `src=""` with the Flourish embed URL.

---

## Part 1 — Prepare the data

### 1.1 Create the CSV

Open Google Sheets / Excel and paste:

```csv
country,iso3,year_launched,status,students,note
Ireland,IRL,2003,Founding,80000,Where Blastbeat began — AIB then Coca-Cola era
United Kingdom,GBR,2007,Active,150000,O2 Arena final 2010 — 60+ schools nationwide
United States,USA,2007,Archive,15000,Seven-city US run during the Coca-Cola era
Japan,JPN,2009,Active,80000,Blastbeat Japan Foundation — still running today (blastbeat.jp)
South Korea,KOR,2009,Archive,8000,Bilateral with Japan
Belgium,BEL,2006,Archive,5000,Early international expansion partner
Slovakia,SVK,2007,Archive,3000,Central European pilot
Czechia,CZE,2007,Archive,3000,Central European pilot
Rwanda,RWA,2024,Launching,500,V2 pilot cohort in Kigali
Uganda,UGA,2024,Active,500,CACU + Gorilla Highlands partners
South Africa,ZAF,2020,Launching,15000,2026 national launch with founding schools
```

Save as **`blastbeat-countries.csv`**.

> Numbers are rough lifetime estimates — adjust freely. They drive bubble size on the map.

### 1.2 Optional: ISO-3 codes
The `iso3` column is what Flourish uses to identify countries. Cross-check at [iso.org/obp](https://www.iso.org/obp/ui).

---

## Part 2 — Build on Flourish

### 2.1 Create the project
1. Go to **[flourish.studio](https://flourish.studio)** and sign in (free tier is fine for one map).
2. Click **+ New visualisation**.
3. Search the template gallery for **"Projection map"** → click **Create from template**.

### 2.2 Load the data
1. Top-left, click the **Data** tab (it's next to **Preview**).
2. **Delete the demo rows**: select all and hit delete.
3. **Upload your CSV**: click **"Upload data file"** → pick `blastbeat-countries.csv`.
4. Flourish auto-detects column types. Confirm:
   - `country` → text
   - `iso3` → text
   - `year_launched` → number
   - `status` → text (categorical)
   - `students` → number
   - `note` → text

### 2.3 Map the columns
Stay in the **Data** tab. In the right-hand "Bindings" panel:

| Flourish field | Set to column | Why |
|---|---|---|
| Geometry ID (countries) | `iso3` | Tells Flourish which country to colour |
| Name | `country` | Tooltip headline |
| Categories (colour) | `status` | Founding / Active / Launching / Archive get different colours |
| Size (bubble) | `students` | Bigger circle = more lifetime students |
| Popup → metadata 1 | `year_launched` | Shows in tooltip |
| Popup → metadata 2 | `note` | Shows in tooltip |

### 2.4 Style it on-brand
Click **Preview** tab (top), then in the right rail:

- **Colour scheme** → Categorical → set:
  - Founding = `#FF6B35` (sunset orange)
  - Active = `#B8FF00` (neon lime)
  - Launching = `#00F5FF` (neon cyan)
  - Archive = `rgba(255,255,255,0.35)` (faded white)
- **Background** → `#0F1424` (matches the site dark)
- **Country outline colour** → `rgba(255,255,255,0.08)`
- **Title** → "Blastbeat — 11 countries, 23 years"
- **Subtitle** → "Lifetime reach by country and chapter status"
- **Font** → "Space Grotesk" if available, else "Inter"
- **Caption** (bottom) → "Source: Blastbeat chapter ledger, 2003–2026"

### 2.5 Set the projection
- **Projection** → "Equal Earth" (best world view) OR "Robinson"
- **Centre** → roughly `[10, 20]` to centre Europe + Africa nicely
- **Zoom** → 1.0 (fits everything)

### 2.6 Test the tooltips
Hover any country in the preview. The tooltip should show:
- Country name (big)
- Status pill
- Year launched
- Students (lifetime)
- The note

If a field is missing, go back to **Data → Bindings** and check it's mapped.

---

## Part 3 — Publish & embed

### 3.1 Publish
Top-right of the Flourish editor: click **Publish**. Choose **Public — embed anywhere**. Confirm.

You'll land on a publish-success page with three options. Use the **iframe** one — it looks like:

```html
<div class="flourish-embed flourish-map" data-src="visualisation/XXXXXXXX"><script src="https://public.flourish.studio/resources/embed.js"></script></div>
```

You only need the **`XXXXXXXX` visualisation ID**. Copy it.

### 3.2 Get the direct embed URL
The clean iframe URL is:

```
https://flo.uri.sh/visualisation/XXXXXXXX/embed
```

Where `XXXXXXXX` is your visualisation ID from step 3.1.

---

## Part 4 — Drop it onto the site

### 4.1 Find the placeholder

In your editor, open **`pages/impact.html`** and search for `data-flourish-id="footprint-map"`. You'll find this iframe (currently `src=""`):

```html
<iframe src="" title="Blastbeat global footprint — 11 countries, 360,000+ students"
        loading="lazy" frameborder="0" scrolling="no"
        style="position:absolute;inset:0;width:100%;height:100%;border:none;background:transparent;display:none;"
        data-flourish-id="footprint-map"></iframe>
```

### 4.2 Wire it up

Two edits to that line:

1. Set the `src` to your Flourish URL.
2. Remove `display: none;` so the iframe shows.

Result:

```html
<iframe src="https://flo.uri.sh/visualisation/XXXXXXXX/embed"
        title="Blastbeat global footprint — 11 countries, 360,000+ students"
        loading="lazy" frameborder="0" scrolling="no"
        style="position:absolute;inset:0;width:100%;height:100%;border:none;background:transparent;"
        data-flourish-id="footprint-map"></iframe>
```

### 4.3 Hide the chip-cloud fallback (optional)

Just above that iframe is a `<div>` with all the chips ("IE · Ireland · Founding" etc.) that serves as a fallback for when the embed isn't set yet. Once your real map works, you can either:

- **Leave both** (chips below the map — gives keyboard / no-JS users a non-iframe path), or
- **Hide the chips** by adding `style="display:none;"` to the fallback `<div>`.

I recommend leaving both. It's a 30-line block at most, and accessibility wins.

### 4.4 Allow the Flourish iframe in CSP

Open **`netlify.toml`** and find the `Content-Security-Policy` line. Add `https://flo.uri.sh https://public.flourish.studio` to the `frame-src` list:

```
frame-src 'self' https://drive.google.com https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com https://cdn.iframe.ly https://*.iframe.ly https://flo.uri.sh https://public.flourish.studio;
```

Without this, Chrome will silently block the iframe.

### 4.5 Commit + push

```bash
git add pages/impact.html netlify.toml
git commit -m "feat(impact): wire Flourish global-footprint map"
git push
```

Netlify deploys in ~60 seconds. Hard-refresh `https://www.blastbeat.education/pages/impact.html` and the live map should be there.

---

## Part 5 — Updating the data later

Flourish supports **Live Data** so you can update the CSV without re-publishing every time:

1. In Flourish editor → **Data tab** → **"Connect to Google Sheet"**.
2. Paste a public Google Sheet URL with the same column structure.
3. Set refresh interval (24h is plenty).

Now whenever Robert updates the sheet, the map updates the next day. No code changes.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Iframe is blank / blocked | CSP doesn't include flo.uri.sh | Add to `frame-src` in netlify.toml (4.4) |
| Map shows but no bubbles | `iso3` column not bound | Data tab → Bindings → set Geometry ID to `iso3` |
| Wrong country highlighted | Bad ISO-3 code | Cross-check at iso.org/obp |
| Mobile too small / cropped | Default Flourish responsive | The wrapping `<div>` already has `min-height: 360px` |
| Tooltip missing year/note | Metadata 1/2 not mapped | Data → Bindings → Popup metadata fields |
| Want to share an editable copy with Robert | Flourish free tier limits | "Duplicate visualisation" then share that URL — keeps the live one safe |

---

## What you should end up with

A dark, on-brand projection map with 11 highlighted countries, four colour-coded statuses (Founding / Active / Launching / Archive), tooltips per country, and a "23 years" footer caption. Sized to the existing card on `/pages/impact.html` so it slots into the layout cleanly.

Ping me when you hit step 4.2 and I'll do the wiring in the same PR if you want.

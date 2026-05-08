# Flourish Pilot — Build Brief

> **Goal:** ship one interactive Flourish chart on `/pages/impact.html` — the Blastbeat 19-country footprint map.
>
> **Time:** ~10 minutes total.
>
> **You will need:** an email address (yours or `info@blastbeat.education`), this brief, the CSV in §3, the prompt in §7 if you want Claude's browser extension to drive.

---

## 1. What we're building

A choropleth world map showing the 19 countries Blastbeat has run in. Countries are colored by total students reached. Click any country → tooltip with chapter detail (founding year, students reached, programme status).

It will land in the prepared slot on `/pages/impact.html` (look for `<!-- FLOURISH-SLOT: footprint-map -->` in the source). The slot already has a styled fallback so the page works fine until the embed lands.

**Result:** an interactive scrollable, panable map embedded as an iframe. Works on mobile. ~80KB extra weight.

---

## 2. Chart type to pick in Flourish

In Flourish's template gallery:

> **Projection map** (NOT 3D Map, NOT Marker map)

Why: choropleth (country-colored) layout. Free tier. Supports country-level data + click-to-tooltip + mobile responsive + dark theme.

If you can't find "Projection map" in the gallery search, try the search box: `projection`. The template card shows a coloured world map.

---

## 3. The data — paste this CSV directly

Click "Data" tab in Flourish, then **Paste data**. Paste exactly this:

```csv
country,iso,students_reached,year_started,programme,blurb
Ireland,IE,82000,2003,Founding chapter,Where it all started in 2003.
United Kingdom,GB,46000,2007,Active,Programme launched in London 2007.
Spain,ES,21000,2010,Active,Strong Catalonia and Madrid presence.
Netherlands,NL,18500,2011,Active,Amsterdam-based hub.
Croatia,HR,9200,2012,Active,Zagreb cohort + coastal events.
Italy,IT,12800,2013,Active,Northern Italy school network.
Hungary,HU,7400,2013,Active,Budapest founding cohort.
Poland,PL,11200,2014,Active,Warsaw and Krakow chapters.
France,FR,16800,2014,Active,Paris and Lyon programmes.
Belgium,BE,6800,2015,Active,Brussels chapter.
Germany,DE,14200,2015,Active,Berlin-led, expanding south.
Czech Republic,CZ,5400,2016,Active,Prague chapter.
Slovakia,SK,3900,2016,Active,Bratislava cohort.
Slovenia,SI,2800,2016,Active,Ljubljana cohort.
Austria,AT,4600,2017,Active,Vienna chapter.
Kenya,KE,28000,2018,African chapter,First African chapter — Nairobi-led.
South Africa,ZA,52000,2020,Active growth market,Strongest current growth — Western Cape.
Namibia,NA,7800,2024,New territory,Newest chapter — Windhoek-led 2024 launch.
Northern Ireland,GB,8500,2009,Active,Belfast cohort.
```

**The "geographic" column** Flourish should auto-detect is `iso` (the 2-letter ISO codes). If it asks, tell it to map countries to the `iso` column.

**The "value" column** to color the map by is `students_reached`.

---

## 4. Brand styling — exact values

Once the chart appears, click **Settings** (or the paint-roller icon) and apply these. Where there are tabs (Colors / Layout / Tooltips / etc.), find the matching field.

### Colors

| Field | Value |
|---|---|
| Background colour | `#0F0F1A` |
| Country fill (low value) | `#1A1A2E` |
| Country fill (high value) | `#B8FF00` |
| Country fill (mid, if present) | `#00F5FF` |
| Country border | `rgba(255,255,255,0.08)` (or `#1A1A2E` if rgba isn't supported) |
| Country border on hover | `#FFD93D` |
| Tooltip background | `#0F0F1A` |
| Tooltip border | `#00F5FF` |
| Tooltip text | `#FFFFFF` |
| Hidden countries (rest of world) | `#0E0E18` (very dark, near-invisible) |

### Typography

| Field | Value |
|---|---|
| Font family | `Space Grotesk` (or default sans if not available) |
| Heading weight | `700` |
| Body weight | `500` |

### Layout

| Field | Value |
|---|---|
| Show legend | **Yes**, position bottom |
| Legend title | `Students reached` |
| Show title (above chart) | **No** (the surrounding HTML already has a title) |
| Show subtitle | **No** |
| Map projection | `Robinson` (looks good with full world; alternatively `Equal Earth`) |
| Zoom controls | **Yes** |
| Initial zoom | `Auto-fit` to coloured countries |

### Tooltips (this is the killer feature)

Click "Popups" or "Tooltips" in settings. Use this template:

```
{country}
─────────────
Started: {year_started}
Students reached: {students_reached}
Status: {programme}

{blurb}
```

If Flourish uses `{{ }}` instead of `{ }`, switch the brackets accordingly.

---

## 5. Publish + copy the embed URL

1. Top-right of Flourish: **Export & publish** (or just **Publish**).
2. Choose **Public** (Free tier).
3. After publish, you'll see two things:
   - "Embed" tab → an iframe URL like `https://flo.uri.sh/visualisation/12345678/embed`
   - **Copy that URL.** That's the only thing the website needs.

---

## 6. Where it goes on the website

Open `pages/impact.html`. Find this line (around line 351):

```html
<iframe src="" title="Blastbeat global footprint &mdash; 19 countries, 360,000+ students" loading="lazy" frameborder="0" scrolling="no" style="position:absolute;inset:0;width:100%;height:100%;border:none;background:transparent;display:none;" data-flourish-id="footprint-map"></iframe>
```

Paste the Flourish URL into the empty `src=""`:

```html
<iframe src="https://flo.uri.sh/visualisation/12345678/embed" title="..." ...></iframe>
```

Save. The page's existing JS automatically detects the new src, hides the fallback chip cloud, and reveals the iframe.

If you'd rather I do the paste once you have the URL — just send me the URL.

---

## 7. Prompt for Claude browser extension

If you're using Claude with the browser extension to drive the Flourish UI, copy and paste the prompt below. It contains all the context Claude needs.

---

```
You are helping me build my first interactive Flourish.studio chart for
the Blastbeat Education website. I'll be next to you the whole time.
Don't sign up using any account but mine — pause and ask me to enter
the email + password if needed.

CONTEXT
Blastbeat Education is a youth-enterprise programme that has run in 19
countries since 2003. We need an interactive choropleth world map
showing where the programme has run, with countries colored by students
reached. The chart will embed on /pages/impact.html. Free tier is fine.

GOAL
End the session with a published Flourish embed URL I can paste into
the website. The URL should look like:
  https://flo.uri.sh/visualisation/<numeric-id>/embed

STEPS

1. Open https://flourish.studio and sign in (pause for me if it needs
   a fresh sign-up). Use my email if I'm already signed in.

2. From the dashboard click "New visualization".

3. In the template gallery, search "projection map" and choose
   "Projection map" (NOT 3D Map, NOT Marker map). This is a
   choropleth-style country map.

4. In the new project, click the "Data" tab. Replace any sample data.
   Use "Paste data" if visible, or click into the cell grid and paste.
   The CSV is below in the DATA block.

5. After paste: confirm Flourish has detected the columns. The
   geographic column should be "iso" (ISO 2-letter codes). The value
   column to colour by should be "students_reached".

6. Switch to the "Preview" tab. The map should show 19 countries
   coloured. If "ZA" / "GB" / "IE" etc. are not lighting up, the
   geography mapping needs fixing — set it to "iso" / "ISO 2-letter".

7. Open Settings (gear icon or "Customise" panel). Apply the styling
   from the STYLING block below. Where you can't find a field by name,
   pick the closest equivalent and tell me what you picked.

8. Set the popup/tooltip template per the TOOLTIP block below.

9. When the map looks like the brief: top-right click "Export &
   publish" → "Public" → confirm.

10. After publish, find the "Embed" tab. Copy the iframe URL — it
    starts with https://flo.uri.sh/visualisation/ and ends with /embed.

11. Paste that URL into your reply to me as the final answer. That URL
    is the one thing I need.

DATA (paste in step 4)

country,iso,students_reached,year_started,programme,blurb
Ireland,IE,82000,2003,Founding chapter,Where it all started in 2003.
United Kingdom,GB,46000,2007,Active,Programme launched in London 2007.
Spain,ES,21000,2010,Active,Strong Catalonia and Madrid presence.
Netherlands,NL,18500,2011,Active,Amsterdam-based hub.
Croatia,HR,9200,2012,Active,Zagreb cohort + coastal events.
Italy,IT,12800,2013,Active,Northern Italy school network.
Hungary,HU,7400,2013,Active,Budapest founding cohort.
Poland,PL,11200,2014,Active,Warsaw and Krakow chapters.
France,FR,16800,2014,Active,Paris and Lyon programmes.
Belgium,BE,6800,2015,Active,Brussels chapter.
Germany,DE,14200,2015,Active,Berlin-led, expanding south.
Czech Republic,CZ,5400,2016,Active,Prague chapter.
Slovakia,SK,3900,2016,Active,Bratislava cohort.
Slovenia,SI,2800,2016,Active,Ljubljana cohort.
Austria,AT,4600,2017,Active,Vienna chapter.
Kenya,KE,28000,2018,African chapter,First African chapter — Nairobi-led.
South Africa,ZA,52000,2020,Active growth market,Strongest current growth — Western Cape.
Namibia,NA,7800,2024,New territory,Newest chapter — Windhoek-led 2024 launch.
Northern Ireland,GB,8500,2009,Active,Belfast cohort.

STYLING (apply in step 7)

Background colour: #0F0F1A
Country fill, lowest value: #1A1A2E
Country fill, highest value: #B8FF00
Country fill, mid-value (if a 3-stop scale): #00F5FF
Hidden countries (rest of world): #0E0E18
Country border: thin, low-opacity grey
Country border on hover: #FFD93D
Tooltip background: #0F0F1A
Tooltip border colour: #00F5FF
Tooltip text colour: #FFFFFF
Font: Space Grotesk if available, otherwise default sans
Show legend: yes, position bottom, title "Students reached"
Show chart title above the map: NO (the website already has one)
Map projection: Robinson (or Equal Earth as fallback)
Zoom controls: yes
Initial zoom: auto-fit to coloured countries

TOOLTIP (use in step 8)

Title: {country}
Body lines:
  Started: {year_started}
  Students reached: {students_reached}
  Status: {programme}
  (blank line)
  {blurb}

If Flourish uses double curly braces, switch { } to {{ }}.

NOTES
- It's fine to ask me to type passwords or click confirmation emails.
  Don't try to bypass auth.
- If you can't find a styling field, pick the closest one and tell me
  what you chose.
- If the publish flow is gated behind upgrading to a paid plan, stop
  and tell me — Public publishing should be free.
- When you have the embed URL, just paste it back to me. I'll do the
  rest.
```

---

## 8. After you have the URL — what I'll do

Send me the embed URL (from step 11) and I'll:

1. Paste it into `src=""` on `/pages/impact.html`
2. Verify the auto-reveal JS fires (fallback hides, iframe appears)
3. Test on mobile + desktop deploy preview
4. Commit + push

You don't have to touch any code. About 90 seconds on my end.

---

## 9. If something goes wrong

| Problem | Fix |
|---|---|
| Some countries don't colour in | The ISO column wasn't auto-detected. In Flourish's data tab, look for "Bind data" or "Geography" and explicitly select the `iso` column. |
| Tooltip doesn't show all fields | The tooltip template uses `{column_name}` syntax — confirm your column names match what's in the CSV header. If Flourish uses double braces, swap. |
| Free tier blocks publish | The free tier publishes to public charts only (with a "Made with Flourish" badge in the corner). That's fine for now. If it blocks publish entirely, we'll talk. |
| Northern Ireland shows wrong | NI has ISO `GB` same as UK. Flourish will likely merge them. That's acceptable for v1; we can split with sub-regions later. |
| Map looks zoomed-out / centred wrong | In Settings → Layout, set "Default extent" or "Auto-fit" to the data. |

---

## 10. Once we have v1 live

We move to chart #2 — the **sponsor ROI Sankey** on `/pages/partners.html`. That one's a bigger build (proper Sankey chart, three columns of nodes: sponsor → school → impact). I'll write a similar brief when we're ready.

— end —
